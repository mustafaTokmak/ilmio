#!/usr/bin/env node
// The store's own agent tools, served to one buyer agent over stdio MCP, with
// every call logged to STORE_MCP_LOG (one JSON object per line).
//
// Tools = the store's UCP server tools (POST {shop}/api/ucp/mcp, 13 tools) plus
// its Knowledge Base FAQ tool (POST {shop}/api/mcp, search_shop_policies_and_faqs)
// plus web_fetch, a plain web reader so the agent can open pages and services.
//
// UCP calls get meta.ucp-agent.profile injected; Shopify negotiates capabilities
// from it (without it the store answers "Missing profile uri").
//   AGENT_PROFILE   profile URI (default: Shopify's full-capability test fixture)
//   UCP_STORE       store host, e.g. mustafa-test-dev.myshopify.com
//   STORE_MCP_LOG   append-only jsonl call log (required)
//   ARM_FILE        optional experiment arm: JSON carried to the agent through
//                   store content instead of being written on the real store:
//                     {product_id, desc_append_html} -> appended to that product's
//                       description in search_catalog / lookup_catalog / get_product
//                     {faq: [{match, question, answer}]} -> appended to
//                       search_shop_policies_and_faqs answers whose query matches
//                   Logged calls that carried arm content get "armed": true.
//
// Run: node store-mcp.mjs   (speaks newline-delimited JSON-RPC on stdio)

import { readFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const STORE = process.env.UCP_STORE || 'mustafa-test-dev.myshopify.com';
const LOG = process.env.STORE_MCP_LOG || '';
const PROFILE = process.env.AGENT_PROFILE || 'https://shopify.dev/ucp/agent-profiles/2026-08-25/valid-with-capabilities.json';
const UCP_URL = `https://${STORE}/api/ucp/mcp`;
const FAQ_URL = `https://${STORE}/api/mcp`;
const STORE_TIMEOUT = 20000;
const WEB_TIMEOUT = 30000;
const WEB_MAX_BYTES = 300_000;

const arm = process.env.ARM_FILE ? JSON.parse(readFileSync(process.env.ARM_FILE, 'utf8')) : null;
const armFaqs = (arm?.faq || []).map(f => ({ ...f, re: new RegExp(f.match, 'i') }));

const logLine = obj => {
  if (!LOG) return;
  try { mkdirSync(dirname(LOG), { recursive: true }); appendFileSync(LOG, JSON.stringify(obj) + '\n'); } catch { /* logging must never kill the server */ }
};

// ---- upstream calls -------------------------------------------------------

let rpcId = 0;
async function rpc(url, method, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
    signal: AbortSignal.timeout(STORE_TIMEOUT),
  });
  const body = await res.json();
  if (body.error) throw Object.assign(new Error(body.error.message || 'rpc error'), { code: body.error.code, data: body.error.data });
  return body.result;
}

async function ucpCall(name, args) {
  // The profile lives in arguments.meta on this store's schema.
  const a = { ...(args || {}) };
  a.meta = { ...(a.meta || {}), 'ucp-agent': { profile: PROFILE } };
  return rpc(UCP_URL, 'tools/call', { name, arguments: a });
}

async function faqCall(args) {
  return rpc(FAQ_URL, 'tools/call', { name: 'search_shop_policies_and_faqs', arguments: args || {} });
}

// ---- arm injection --------------------------------------------------------

// The arm pretends the merchant wrote the offer text into store content, so we
// can measure whether an agent finds it, without touching the real store.

function resultJson(result) {
  const text = result?.content?.[0]?.text;
  if (typeof text !== 'string') return null;
  try { return { text, data: JSON.parse(text) }; } catch { return { text, data: null }; }
}

function injectDescAppend(result) {
  if (!arm?.desc_append_html || !arm?.product_id) return false;
  const r = resultJson(result);
  if (!r?.data) return false;
  let hit = false;
  const seen = new Set();
  const visit = node => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (typeof node.id === 'string' && node.id.includes(arm.product_id) && node.description) {
      const d = node.description;
      if (typeof d === 'object' && typeof d.html === 'string') { d.html += arm.desc_append_html; hit = true; }
      else if (typeof d === 'string') { node.description += arm.desc_append_html; hit = true; }
    }
    for (const v of Object.values(node)) { if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v === 'object') visit(v); }
  };
  visit(r.data);
  if (hit) result.content[0].text = JSON.stringify(r.data);
  return hit;
}

function injectFaq(result, query) {
  if (!armFaqs.length || typeof query !== 'string') return false;
  const hits = armFaqs.filter(f => f.re.test(query));
  if (!hits.length) return false;
  const r = resultJson(result);
  // Server endpoint answers a JSON array of {question, answer}; anything else
  // gets the entries as extra content so the model still sees them.
  if (r?.data && Array.isArray(r.data)) {
    r.data.push(...hits.map(({ question, answer }) => ({ question, answer })));
    result.content[0].text = JSON.stringify(r.data);
  } else {
    result.content = [...(result.content || []), ...hits.map(({ question, answer }) => ({ type: 'text', text: `Q: ${question}\nA: ${answer}` }))];
  }
  return true;
}

// ---- logging fields the summaries read ------------------------------------

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

function extract(result) {
  const r = resultJson(result);
  const out = {};
  if (!r?.data) return out;
  const discounts = findAll(r.data, 'discounts').find(d => d && Array.isArray(d.applied));
  if (discounts) out.discounts = { applied: discounts.applied };
  const totals = findAll(r.data, 'totals').find(t => Array.isArray(t));
  if (totals) out.totals = totals;
  return out;
}

// ---- web_fetch ------------------------------------------------------------

const WEB_TOOL = {
  name: 'web_fetch',
  description: 'Fetch a web page or call a public web service and read the response body. Use it to open links the store or your user gave you, and to read documents a tool pointed at. GET requests only; returns the status code and the response text (truncated for very long pages).',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'The URL to fetch (http or https).' },
    },
    required: ['url'],
  },
};

async function webFetch(args) {
  const url = args?.url;
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return { status: 0, body: 'web_fetch needs an http(s) url.' };
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(WEB_TIMEOUT),
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; buyer-agent/1.0)', 'accept': 'text/html,application/json,text/plain,*/*' },
  });
  const reader = res.body?.getReader();
  let body = '';
  if (reader) {
    const dec = new TextDecoder();
    while (body.length < WEB_MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      body += dec.decode(value, { stream: true });
    }
    try { await reader.cancel(); } catch { /* already done */ }
  } else body = (await res.text()).slice(0, WEB_MAX_BYTES);
  return { status: res.status, body: body.slice(0, WEB_MAX_BYTES) };
}

// ---- stdio MCP server -----------------------------------------------------

const SERVER = { name: 'store-tools', version: '0.2.0' };
const send = msg => process.stdout.write(JSON.stringify(msg) + '\n');
const reply = (id, result) => send({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

let toolsCache = null;
async function listTools() {
  if (toolsCache) return toolsCache;
  const [ucp, faq] = await Promise.all([rpc(UCP_URL, 'tools/list', {}), rpc(FAQ_URL, 'tools/list', {})]);
  toolsCache = [...(ucp.tools || []), ...(faq.tools || []), WEB_TOOL];
  return toolsCache;
}

async function call(name, args) {
  const line = { tool: name, args };
  try {
    if (name === 'web_fetch') {
      const { status, body } = await webFetch(args);
      Object.assign(line, { method: 'GET', url: args?.url, status });
      logLine(line);
      return { content: [{ type: 'text', text: `HTTP ${status}\n\n${body}` }], isError: status >= 400 };
    }
    if (name === 'search_shop_policies_and_faqs') {
      const result = await faqCall(args);
      if (injectFaq(result, args?.query)) line.armed = true;
      Object.assign(line, extract(result));
      logLine(line);
      return result;
    }
    const result = await ucpCall(name, args);
    if (['search_catalog', 'lookup_catalog', 'get_product'].includes(name) && injectDescAppend(result)) line.armed = true;
    Object.assign(line, extract(result));
    logLine(line);
    return result;
  } catch (e) {
    logLine({ ...line, error: e.message });
    return { content: [{ type: 'text', text: `${name} failed: ${e.message}` }], isError: true };
  }
}

let buf = '';
let inflight = 0, ended = false;
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf('\n')) > -1) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    inflight++;
    handle(msg).catch(() => {}).finally(() => { if (--inflight === 0 && ended) process.exit(0); });
  }
});

async function handle(msg) {
  if (msg.id === undefined || msg.id === null) return; // notifications: nothing to answer
  try {
    if (msg.method === 'initialize') return reply(msg.id, { protocolVersion: msg.params?.protocolVersion || '2025-06-18', capabilities: { tools: { listChanged: false } }, serverInfo: SERVER });
    if (msg.method === 'ping') return reply(msg.id, {});
    if (msg.method === 'tools/list') return reply(msg.id, { tools: await listTools() });
    if (msg.method === 'tools/call') return reply(msg.id, await call(msg.params?.name, msg.params?.arguments || {}));
    return fail(msg.id, -32601, `method not found: ${msg.method}`);
  } catch (e) {
    return fail(msg.id, -32000, e.message);
  }
}

process.stdin.on('end', () => { ended = true; if (inflight === 0) process.exit(0); });
process.on('SIGTERM', () => process.exit(0));
