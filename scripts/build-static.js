'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const STATIC = path.join(ROOT, 'static');
const copies = ['app.js', 'styles.css', 'ilmio.png', 'iznik-strip.jpg', 'iznik-tile.jpg'];
const vendors = ['state', 'suggest', 'narrative'];
const scriptFiles = [
  'vendor/sha256.js',
  'vendor/state.js',
  'vendor/suggest.js',
  'vendor/narrative.js',
  'static-server.js',
  'app.js',
];

function buildFiles() {
  const files = new Map();
  for (const name of copies) {
    files.set(name, fs.readFileSync(path.join(PUBLIC, name)));
  }
  for (const name of vendors) {
    const source = fs.readFileSync(path.join(ROOT, 'src', `${name}.js`), 'utf8');
    files.set(`vendor/${name}.js`, Buffer.from(`;(function(){\n${source}})();\n`));
  }

  const scriptContents = scriptFiles.map((name) => {
    if (files.has(name)) return files.get(name);
    return fs.readFileSync(path.join(STATIC, name));
  });
  const version = crypto.createHash('sha256').update(Buffer.concat(scriptContents)).digest('hex').slice(0, 8);
  const tags = scriptFiles
    .map((name, index) => `${index === 0 ? '' : '  '}<script src="${name}?v=${version}"></script>`)
    .join('\n');
  const index = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');
  const entry = '<script src="app.js"></script>';
  if (index.split(entry).length !== 2) {
    throw new Error(`expected exactly one ${entry} in public/index.html`);
  }
  files.set('index.html', Buffer.from(index.replace(entry, tags)));
  return files;
}

const expectedFiles = buildFiles();
const check = process.argv.includes('--check');
const outOfSync = [];

for (const [name, contents] of expectedFiles) {
  const destination = path.join(STATIC, name);
  if (check) {
    if (!fs.existsSync(destination) || !fs.readFileSync(destination).equals(contents)) {
      outOfSync.push(`static/${name}`);
    }
    continue;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, contents);
}

if (check && outOfSync.length) {
  console.error(`Static build is out of sync:\n${outOfSync.map((name) => `- ${name}`).join('\n')}`);
  process.exitCode = 1;
} else if (check) {
  console.log('Static build is up to date.');
}
