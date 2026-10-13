#!/usr/bin/env node
// Runs a list of buyer-agent runs with a small concurrency per runtime and appends each summary to results/<arm>.jsonl.
//   node batch.mjs --arm B-menu --arm-file arms/B-menu.json --tasks deal,neutral --models claude:haiku,codex:gpt-6.1-sol --n 1 [--connector url]
import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const arm = arg('arm'), armFile = arg('arm-file', ''), tasks = arg('tasks', 'deal').split(','), models = arg('models', 'claude:haiku').split(','), n = Number(arg('n', '1')), connector = arg('connector', ''), start = Number(arg('start', '1'));
mkdirSync(join(here, 'results'), { recursive: true });
const out = join(here, 'results', `${arm}.jsonl`);
const jobs = [];
for (const task of tasks) for (const m of models) for (let i = start; i < start + n; i++) { const [runtime, ...rest] = m.split(':'); jobs.push({ runtime, model: rest.join(':'), task, i }); }
const LIMIT = { claude: 3, codex: 2, cursor: 1, openrouter: 3 };
const running = { claude: 0, codex: 0, cursor: 0, openrouter: 0 };
let done = 0;
const next = () => {
  for (const j of jobs) {
    if (j.started || running[j.runtime] >= LIMIT[j.runtime]) continue;
    j.started = true; running[j.runtime]++;
    const a = ['run-buyer.mjs', '--runtime', j.runtime, '--model', j.model, '--arm', arm, '--task', j.task, '--i', String(j.i), '--timeout', arg('timeout', '480')];
    if (armFile) a.push('--arm-file', join(here, armFile));
    if (connector) a.push('--connector', connector);
    const c = spawn('node', a, { cwd: here, stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    c.stdout.on('data', d => { buf += d; });
    c.on('close', () => {
      running[j.runtime]--; done++;
      const line = buf.trim().split('\n').pop() || JSON.stringify({ arm, ...j, error: 'no summary' });
      appendFileSync(out, line + '\n');
      try { const s = JSON.parse(line); console.log(`${done}/${jobs.length} ${s.task} ${s.runtime}:${s.model} #${s.i} calls=${s.calls} codes=${JSON.stringify(s.codes_submitted)} applied=${JSON.stringify(s.codes_applied)} total=${s.last_total} web=${(s.web || []).length} ${s.seconds}s`); } catch { console.log(`${done}/${jobs.length} unreadable summary`); }
      next();
    });
  }
};
next();
