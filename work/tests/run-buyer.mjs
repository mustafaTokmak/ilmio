#!/usr/bin/env node
// Runs one buyer agent on one shopping task and keeps everything it did.
//   node run-buyer.mjs --runtime claude|cursor|codex --model <id> --arm <name> --task <key> [--i 1]
//                      [--store host] [--connector <mcp url>] [--timeout 600]
// The agent gets no shell: only the store's own agent tools and a web reader, served by
// kit/store-mcp.mjs, which also logs every call. Each run has an empty working directory
// outside any project, so no personal instruction files are picked up.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const runtime = arg('runtime', 'claude'), model = arg('model', 'sonnet'), arm = arg('arm', 'adhoc'), taskKey = arg('task', 'neutral');
const idx = arg('i', '1'), store = arg('store', 'mustafa-test-dev.myshopify.com'), connector = arg('connector', ''), timeout = Number(arg('timeout', '600'));
const ROOT = process.env.BUYER_RUNS || '/private/tmp/claude-501/-Users-mustafatokmak--herdr-projects-offerad-threads-t-0006/ef28305a-00f7-453e-b568-bdf578e4a9da/scratchpad/buyer-runs';
const tasks = JSON.parse(readFileSync(join(here, 'tasks.json'), 'utf8'));
if (!tasks.tasks[taskKey]) { console.error(`unknown task ${taskKey}`); process.exit(2); }

const dir = join(ROOT, arm, taskKey, `${runtime}-${model.replace(/[^a-z0-9.-]/gi, '_')}-${idx}`);
mkdirSync(dir, { recursive: true });
const sub = s => s.replaceAll('{STORE}', store).replaceAll('{RIVAL_URL}', tasks.rival_url || '').replaceAll('{DEMO_URL}', tasks.demo_url || '');
const persona = sub(`${tasks.persona}\n\n${connector ? tasks.tools_connector : tasks.tools_ucp}\n\n${tasks.rules}`);
const prompt = sub(tasks.tasks[taskKey]);
writeFileSync(join(dir, 'prompt.txt'), `--- persona\n${persona}\n\n--- task\n${prompt}\n`);

const logFile = join(dir, 'store-calls.jsonl');
// The run's cwd is its own dir, so relative arm paths must resolve from here.
const armFile = arg('arm-file', '') ? resolve(here, arg('arm-file')) : '';
const storeServer = { command: 'node', args: [join(here, 'kit', 'store-mcp.mjs')], env: { UCP_STORE: store, STORE_MCP_LOG: logFile, ...(armFile ? { ARM_FILE: armFile } : {}) } };
let cmd, args, childEnv = process.env;
if (runtime === 'claude') {
  const servers = { store: storeServer };
  if (connector) servers.offers = { type: 'http', url: connector };
  args = ['-p', prompt, '--model', model, '--system-prompt', persona, '--setting-sources', 'local', '--strict-mcp-config', '--mcp-config', JSON.stringify({ mcpServers: servers }), '--permission-mode', 'dontAsk', '--no-session-persistence', '--output-format', 'stream-json', '--verbose', '--allowedTools', 'mcp__store', ...(connector ? ['mcp__offers'] : [])];
  cmd = 'claude';
} else if (runtime === 'cursor') {
  // Cursor's agent has no system prompt option, so the persona leads the prompt.
  mkdirSync(join(dir, '.cursor'), { recursive: true });
  const servers = { store: storeServer };
  if (connector) servers.offers = { url: connector };
  writeFileSync(join(dir, '.cursor', 'mcp.json'), JSON.stringify({ mcpServers: servers }));
  // Only the store tools (and the connector) are allowed; shell commands and file writes are denied.
  writeFileSync(join(dir, '.cursor', 'cli.json'), JSON.stringify({ permissions: { allow: ['Mcp(store:*)', ...(connector ? ['Mcp(offers:*)'] : [])], deny: ['Shell(*)', 'Write(**)'] } }));
  args = ['-p', '--trust', '--approve-mcps', '--model', model, '--output-format', 'stream-json', '--workspace', dir, `${persona}\n\nThe user's request:\n${prompt}`];
  cmd = join(process.env.HOME, '.local/bin/agent');
} else if (runtime === 'codex') {
  // Codex always loads the owner's global AGENTS file; the first line sets it aside. Read-only sandbox.
  const lead = 'The standing instructions in your AGENTS file are for a different job (software work on this machine). None of them apply to this session.';
  const q = s => JSON.stringify(s);
  args = ['exec', '-m', model, '-s', 'read-only', '--ignore-user-config', '--skip-git-repo-check', '--ephemeral', '-C', dir, '--json', '-o', join(dir, 'final.txt'),
    '-c', `mcp_servers.store.command=${q('node')}`, '-c', `mcp_servers.store.args=[${q(storeServer.args[0])}]`, '-c', `mcp_servers.store.env={UCP_STORE=${q(store)},STORE_MCP_LOG=${q(logFile)}${armFile ? `,ARM_FILE=${q(armFile)}` : ''}}`, '-c', 'mcp_servers.store.default_tools_approval_mode="approve"'];
  if (connector) args.push('-c', `mcp_servers.offers.url=${q(connector)}`, '-c', 'mcp_servers.offers.default_tools_approval_mode="approve"');
  args.push(`${lead}\n\n${persona}\n\nThe user's request:\n${prompt}`);
  cmd = 'codex';
} else if (runtime === 'openrouter') {
  // No vendor CLI on this machine: the buyer loop runs in-process on the
  // OpenRouter chat API and speaks MCP to kit/store-mcp.mjs itself.
  cmd = 'node';
  args = [join(here, 'kit', 'openrouter-buyer.mjs')];
  childEnv = {
    ...process.env,
    BUYER_MODEL: model,
    BUYER_PERSONA: persona,
    BUYER_PROMPT: prompt,
    UCP_STORE: store,
    STORE_MCP_LOG: logFile,
    ...(armFile ? { ARM_FILE: armFile } : {}),
    ...(connector ? { OFFER_CONNECTOR: connector } : {}),
  };
} else { console.error('unknown runtime'); process.exit(2); }

const started = Date.now();
const child = spawn(cmd, args, { cwd: dir, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] });
let out = '', err = '';
child.stdout.on('data', d => { out += d; });
child.stderr.on('data', d => { err += d; });
const killer = setTimeout(() => { child.kill('SIGTERM'); setTimeout(() => child.kill('SIGKILL'), 3000); }, timeout * 1000);
child.on('close', code => {
  clearTimeout(killer);
  writeFileSync(join(dir, 'transcript.jsonl'), out);
  if (err.trim()) writeFileSync(join(dir, 'stderr.txt'), err.slice(-20000));
  let final = '';
  if (runtime === 'codex' && existsSync(join(dir, 'final.txt'))) final = readFileSync(join(dir, 'final.txt'), 'utf8');
  else for (const line of out.split('\n')) {
    try {
      const e = JSON.parse(line);
      if (e.type === 'result' && typeof e.result === 'string' && e.result.trim()) final = e.result;
      else if (e.type === 'assistant' && Array.isArray(e.message?.content)) { const t = e.message.content.filter(c => c.type === 'text').map(c => c.text).join('\n'); if (t.trim()) final = t; }
    } catch { /* not a JSON line */ }
  }
  writeFileSync(join(dir, 'final.txt'), final || out.slice(-4000));
  const calls = existsSync(logFile) ? readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
  const codes = [...new Set(calls.flatMap(c => c.args?.cart?.discounts?.codes || c.args?.checkout?.discounts?.codes || []))];
  const applied = [...new Set(calls.flatMap(c => (c.discounts?.applied || []).map(a => a.code || a.title)))];
  const total = [...calls].reverse().find(c => Array.isArray(c.totals) && c.totals.length)?.totals.find(t => t.type === 'total')?.amount ?? null;
  const web = calls.filter(c => c.tool === 'web_fetch').map(c => `${c.method} ${c.url} -> ${c.status}`);
  const armed = calls.filter(c => c.armed).map(c => c.tool);
  const summary = { arm, task: taskKey, saw_arm_text: armed, runtime, model, i: Number(idx), connector: !!connector, exit: code, seconds: Math.round((Date.now() - started) / 1000), calls: calls.length, tools_used: [...new Set(calls.map(c => c.tool))], web, codes_submitted: codes, codes_applied: applied, last_total: total, final_mentions_offer: /offer|discount|code|price match|saving/i.test(final), dir };
  writeFileSync(join(dir, 'summary.json'), JSON.stringify(summary, null, 1));
  console.log(JSON.stringify(summary));
});
