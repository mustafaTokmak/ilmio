#!/usr/bin/env node
// A buyer agent on the OpenRouter chat API: same persona/tools setup as the
// claude/codex/cursor runtimes, runnable anywhere OPENROUTER_API_KEY is set.
// It speaks MCP to kit/store-mcp.mjs over stdio (the store's tools, logged),
// plus the offers connector over HTTP when OFFER_CONNECTOR is set.
//
// env:
//   OPENROUTER_API_KEY  required
//   BUYER_MODEL         OpenRouter model id, e.g. anthropic/claude-haiku-4.5
//   BUYER_PERSONA       system prompt
//   BUYER_PROMPT        the user's request
//   UCP_STORE           forwarded to store-mcp.mjs
//   STORE_MCP_LOG       forwarded to store-mcp.mjs
//   ARM_FILE            forwarded to store-mcp.mjs when set
//   OFFER_CONNECTOR     optional remote MCP URL (the OfferAd offers connector)
//   BUYER_MAX_TURNS     tool-loop cap (default 40)
//   BUYER_ALLOW_COMPLETE  set to 1 to let complete_checkout reach the store;
//                       by default it is refused so the run can never place an order
//
// stdout: stream-json lines like the claude runtime emits, ending with
// {"type":"result","result":"..."} so run-buyer.mjs can parse it unchanged.

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendFileSync, mkdirSync } from 'node:fs';
import readline from 'node:readline';

const here = dirname(fileURLToPath(import.meta.url));
const MODEL = process.env.BUYER_MODEL || 'anthropic/claude-haiku-4.5';
const PERSONA = process.env.BUYER_PERSONA || '';
const PROMPT = process.env.BUYER_PROMPT || '';
const CONNECTOR = process.env.OFFER_CONNECTOR || '';
const MAX_TURNS = Number(process.env.BUYER_MAX_TURNS || 40);
const ALLOW_COMPLETE = process.env.BUYER_ALLOW_COMPLETE === '1';
const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error('OPENROUTER_API_KEY is not set'); process.exit(2); }
if (!PROMPT) { console.error('BUYER_PROMPT is not set'); process.exit(2); }

const emit = obj => process.stdout.write(JSON.stringify(obj) + '\n');

// Calls to servers other than the store (the offers connector) are logged here
// too, so a run's store-calls.jsonl covers everything the agent did.
const LOG = process.env.STORE_MCP_LOG || '';
const logCall = obj => {
  if (!LOG) return;
  try { mkdirSync(dirname(LOG), { recursive: true }); appendFileSync(LOG, JSON.stringify(obj) + '\n'); } catch { /* never fatal */ }
};

function findAll(node, key, acc = [], seen = new Set()) {
  if (!node || typeof node !== 'object' || seen.has(node)) return acc;
  seen.add(node);
  if (Array.isArray(node)) { node.forEach(v => findAll(v, key, acc, seen)); return acc; }
  for (const [k, v] of Object.entries(node)) {
    if (k === key) acc.push(v);
    else if (v && typeof v === 'object') findAll(v, key, acc, seen);
  }
  return acc;
}

function logExtract(text) {
  let data;
  try { data = JSON.parse(text); } catch { return {}; }
  const out = {};
  const discounts = findAll(data, 'discounts').find(d => d && Array.isArray(d.applied));
  if (discounts) out.discounts = { applied: discounts.applied };
  const totals = findAll(data, 'totals').find(t => Array.isArray(t));
  if (totals) out.totals = totals;
  const codes = findAll(data, 'codes').find(c => Array.isArray(c) && c.length);
  if (codes) out.codes = codes;
  return out;
}

// ---- stdio MCP client (store tools) ---------------------------------------

function stdioClient(cmd, args, env) {
  const child = spawn(cmd, args, { env, stdio: ['pipe', 'pipe', 'inherit'] });
  const rl = readline.createInterface({ input: child.stdout });
  const pending = new Map();
  let id = 0;
  rl.on('line', line => {
    if (!line.trim()) return;
    let msg; try { msg = JSON.parse(line); } catch { return; }
    if (msg.id !== undefined && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  const call = (method, params, timeoutMs = 30000) => new Promise((resolve, reject) => {
    const mid = ++id;
    const t = setTimeout(() => { pending.delete(mid); reject(new Error(`${method} timed out`)); }, timeoutMs);
    pending.set(mid, m => { clearTimeout(t); m.error ? reject(new Error(m.error.message || 'mcp error')) : resolve(m.result); });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: mid, method, params }) + '\n');
  });
  const notify = (method, params) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  return { child, call, notify };
}

// ---- remote MCP client (offers connector, optional) ------------------------

function httpClient(url) {
  let session = null;
  let id = 0;
  const post = async body => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept': 'application/json', ...(session ? { 'mcp-session-id': session } : {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    const sid = res.headers.get('mcp-session-id');
    if (sid) session = sid;
    return res.json();
  };
  const call = async (method, params) => {
    const r = await post({ jsonrpc: '2.0', id: ++id, method, params });
    const one = Array.isArray(r) ? r.find(m => m.id === id) || r[0] : r;
    if (one?.error) throw new Error(one.error.message || 'mcp error');
    return one?.result;
  };
  return { call };
}

// ---- tool plumbing ----------------------------------------------------------

const tools = [];       // openrouter tool specs, prefixed names
const servers = new Map(); // prefixed name -> {client, name}

function addServer(prefix, client, list) {
  for (const t of list.tools || []) {
    const pname = `${prefix}__${t.name}`;
    tools.push({ type: 'function', function: { name: pname, description: t.description || '', parameters: t.inputSchema || { type: 'object', properties: {} } } });
    servers.set(pname, { client, name: t.name });
  }
}

async function main() {
  const storeEnv = { ...process.env, UCP_STORE: process.env.UCP_STORE || '', STORE_MCP_LOG: process.env.STORE_MCP_LOG || '', ...(process.env.ARM_FILE ? { ARM_FILE: process.env.ARM_FILE } : {}) };
  const store = stdioClient('node', [join(here, 'store-mcp.mjs')], storeEnv);
  await store.call('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'openrouter-buyer', version: '0.1.0' } });
  store.notify('notifications/initialized', {});
  try {
    addServer('store', store, await store.call('tools/list', {}));
  } catch (e) { emit({ type: 'stderr', text: `store tools unavailable: ${e.message}` }); }

  let offers = null;
  if (CONNECTOR) {
    try {
      offers = httpClient(CONNECTOR);
      await offers.call('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'openrouter-buyer', version: '0.1.0' } });
      addServer('offers', offers, await offers.call('tools/list', {}));
    } catch (e) { emit({ type: 'stderr', text: `connector ignored: ${e.message}` }); }
  }

  const messages = [
    ...(PERSONA ? [{ role: 'system', content: PERSONA }] : []),
    { role: 'user', content: PROMPT },
  ];

  let final = '';
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${KEY}` },
      body: JSON.stringify({ model: MODEL, messages, tools, tool_choice: 'auto' }),
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) throw new Error(`openrouter ${res.status}: ${(await res.text()).slice(0, 400)}`);
    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    if (!msg) throw new Error('openrouter returned no message');
    messages.push(msg);
    if (msg.content) { final = msg.content; emit({ type: 'assistant', message: { content: [{ type: 'text', text: msg.content }] } }); }
    const calls = msg.tool_calls || [];
    if (!calls.length) break;
    for (const tc of calls) {
      const { client, name } = servers.get(tc.function?.name) || {};
      let args = {};
      try { args = JSON.parse(tc.function?.arguments || '{}'); } catch { /* keep {} */ }
      let out;
      if (!client) out = `unknown tool ${tc.function?.name}`;
      else if (!ALLOW_COMPLETE && (name === 'complete_checkout' || name === 'complete_cart')) {
        out = 'This store requires the buyer to approve the order themselves. Stop here and report the order contents, delivery option, price breakdown and total to your user.';
      } else {
        try {
          const r = await client.call('tools/call', { name, arguments: args }, 60000);
          out = (r?.content || []).map(c => c.text || '').join('\n') || JSON.stringify(r);
          if (client !== store) logCall({ tool: `${tc.function.name.split('__')[0]}.${name}`, args, ...logExtract(out) });
        } catch (e) { out = `${name} failed: ${e.message}`; }
      }
      emit({ type: 'tool_call', tool: tc.function?.name, args, out: String(out).slice(0, 4000) });
      messages.push({ role: 'tool', tool_call_id: tc.id, content: String(out).slice(0, 60000) });
    }
  }
  emit({ type: 'result', result: final });
  store.child.kill('SIGTERM');
  process.exit(0);
}

main().catch(e => { emit({ type: 'result', result: `agent failed: ${e.message}` }); process.exit(1); });
