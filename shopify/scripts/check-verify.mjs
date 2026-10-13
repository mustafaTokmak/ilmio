// Checks the competing-offer verifier against pages written here and served by a pretend web.
// Run: node shopify/scripts/check-verify.mjs   (add --live to also read three real shops)
import assert from 'node:assert/strict';
import { verifyCompetingOffer, REASONS } from '../offers/src/lib/verify.js';
import { mandateFor, SHOPS } from '../offers/src/lib/mandates.js';
import { decide } from '../offers/src/lib/policy.js';

const board = mandateFor('demo', 'the-complete-snowboard');
const product = board.product;
const policy = board.price_match;
const NOW = Date.UTC(2026, 9, 13, 12, 0, 0);

// Written out from the build spec, so the module cannot drift from it unnoticed.
const SPEC_REASONS = ['ok', 'bad_url', 'blocked_domain', 'own_store', 'fetch_failed', 'no_price_found', 'currency_mismatch', 'out_of_stock', 'not_new', 'different_product', 'implausible_price'];
const METHODS = ['json_ld', 'shopify_json', 'meta', 'microdata'];
const KEYS = ['ok', 'reason', 'reason_text', 'url', 'domain', 'trusted_domain', 'price', 'currency', 'shipping', 'availability', 'condition', 'title', 'brand', 'gtin', 'mpn', 'sku', 'match_by', 'match_score', 'method', 'fetched_at'];
assert.deepEqual([...REASONS].sort(), [...SPEC_REASONS].sort(), 'the reason codes are the ones in the spec');

// Nothing below may reach the real network until the live section: the global fetch is fenced off.
const realFetch = globalThis.fetch;
let strays = 0;
const fence = async () => { strays++; throw new Error('a check reached for the real network'); };
globalThis.fetch = fence;

const HTML = { 'content-type': 'text/html; charset=utf-8' };
const JS = { 'content-type': 'text/javascript; charset=utf-8' };
const to = (location, status = 302) => ({ status, headers: { location } });
const json = (data, status = 200) => ({ status, headers: JS, body: JSON.stringify(data) });

// A pretend web: routes map an address to a reply, anything else is a 404. Every request is kept.
function web(routes) {
  const calls = [];
  // A plain function, so it can tell when it is called as somebody's method (Workers' fetch refuses that).
  const fetchFn = async function (url, init) {
    assert.equal(this, undefined, 'fetchFn is called bare');
    calls.push({ url, init });
    let r = routes[url];
    if (typeof r === 'function') r = await r(url, init);
    if (r instanceof Response) return r;
    if (r == null) return new Response('not found', { status: 404, headers: HTML });
    if (typeof r === 'string') return new Response(r, { status: 200, headers: HTML });
    return new Response(r.body ?? null, { status: r.status ?? 200, headers: r.headers ?? HTML });
  };
  return { fetchFn, calls };
}

const seen = { reasons: new Set(), methods: new Set() };
let count = 0;

// What every result must look like, whatever happened.
function wellFormed(r, name) {
  assert.deepEqual(Object.keys(r), KEYS, `${name}: result keys`);
  assert.ok(SPEC_REASONS.includes(r.reason), `${name}: reason ${r.reason}`);
  assert.equal(r.ok, r.reason === 'ok', `${name}: ok goes with reason`);
  assert.equal(typeof r.trusted_domain, 'boolean', `${name}: trusted_domain`);
  // Fits after "Competing offer not accepted: " in policy.js: no capital, no full stop, one line.
  assert.match(r.reason_text, /^[a-z0-9][^\n]{5,170}[^.\s]$/, `${name}: reason_text "${r.reason_text}"`);
  assert.ok(!Number.isNaN(Date.parse(r.fetched_at)), `${name}: fetched_at`);
  if (r.ok) assert.ok(r.price > 0 && r.currency && r.match_by && METHODS.includes(r.method) && r.domain, `${name}: an accepted offer is complete`);
  if (r.shipping != null) assert.ok(typeof r.shipping === 'number' && r.shipping >= 0, `${name}: shipping`);
}

async function check(name, url, routes, want = {}, { product: p = product, policy: pol = policy, opts = {}, quiet = false } = {}) {
  const site = web(routes);
  const r = await verifyCompetingOffer(url, p, pol, { fetchFn: site.fetchFn, now: NOW, ...opts });
  wellFormed(r, name);
  for (const [k, v] of Object.entries(want)) assert.deepEqual(r[k], v, `${name}: ${k} is ${JSON.stringify(r[k])}, expected ${JSON.stringify(v)} (${r.reason}: ${r.reason_text})`);
  seen.reasons.add(r.reason);
  if (r.ok) seen.methods.add(r.method);
  count++;
  if (!quiet) console.log(`   ${r.reason.padEnd(17)} ${String(r.method ?? '-').padEnd(12)} ${String(r.match_by ?? '-').padEnd(5)} ${String(r.price ?? '-').padStart(8)}  ${name}`);
  return { r, calls: site.calls };
}
const section = title => console.log(`\n== ${title}`);
// Long tables are checked row by row and reported in one line.
const quiet = { quiet: true };
const told = (n, what) => console.log(`   ${String(n).padStart(3)} ${what}`);

// Page builders.
const ld = (...docs) => docs.map(d => `<script type="application/ld+json">${typeof d === 'string' ? d : JSON.stringify(d)}</script>`).join('\n');
const page = (head = '', body = '') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Shop</title>${head}</head><body>${body}</body></html>`;
const offer = (over = {}) => ({ '@type': 'Offer', price: '629.95', priceCurrency: 'USD', availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition', ...over });
const item = (over = {}) => ({
  '@context': 'https://schema.org/', '@type': 'Product', name: 'The Complete Snowboard', brand: { '@type': 'Brand', name: 'Snowboard Vendor' },
  gtin13: '0840123456784', mpn: 'SV-COMPLETE-154', sku: 'EVO-1001', offers: offer(), ...over,
});
const EVO = 'https://www.evo.com/snowboards/the-complete-snowboard';
// The real store among the two shops: its own pages must never count as a competing offer.
const STORE = Object.values(SHOPS).find(shop => shop.settle === 'shopify');
const anon = { ...product, gtin: null, mpn: null, sku: null }; // a product known by its title only

section('the plain case, and what policy.js does with it');
{
  const { r, calls } = await check('JSON-LD Product on a trusted shop', `${EVO}#reviews`, { [EVO]: page(ld(item())) }, {
    ok: true, reason: 'ok', method: 'json_ld', match_by: 'gtin', match_score: 1, price: 629.95, currency: 'USD', shipping: null,
    availability: 'in_stock', condition: 'new', title: 'The Complete Snowboard', brand: 'Snowboard Vendor', gtin: '0840123456784',
    mpn: 'SV-COMPLETE-154', sku: 'EVO-1001', domain: 'evo.com', trusted_domain: true, url: EVO, fetched_at: new Date(NOW).toISOString(),
  });
  assert.equal(calls.length, 1, 'one request');
  const { url, init } = calls[0];
  assert.equal(url, EVO, 'the fragment is not sent');
  assert.equal(init.redirect, 'manual', 'redirects are followed by hand');
  assert.equal(init.method, 'GET');
  assert.ok(init.signal instanceof AbortSignal, 'the request can be cancelled');
  assert.match(init.headers['user-agent'], /OfferAdVerifier/, 'the request says who is asking');
  assert.deepEqual(Object.keys(init.headers).filter(h => /cookie|authorization|referer/i.test(h)), [], 'nothing personal is sent');
  assert.equal(r.reason_text, 'evo.com lists the same product at 629.95 USD');

  // The result is the evidence decide() takes. No shipping stated: item prices are compared.
  const d = decide(board, { priority: 'lowest_price' }, r);
  assert.equal(d.status, 'price_matched');
  assert.equal(d.offers[0].unit_price, 629.95);
  assert.equal(d.match.shipping_compared, false);

  // Shipping stated as free: delivered prices are compared, as in check-policy.mjs.
  const free = await check('the same page stating free shipping', EVO, { [EVO]: page(ld(item({ offers: offer({ shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'USD' } } }) }))) }, { ok: true, shipping: 0 });
  const delivered = decide(board, { priority: 'lowest_price' }, free.r);
  assert.equal(delivered.status, 'price_matched');
  assert.equal(delivered.offers[0].total, 629.95);
  assert.equal(delivered.match.shipping_compared, true);

  // A rejected link reads well inside the note decide() writes.
  const no = await check('a page for something else', EVO, { [EVO]: page(ld(item({ name: 'Ski Poles', gtin13: '0840123450003', mpn: 'SP-1' }))) }, { ok: false, reason: 'different_product', reason_text: 'the page shows a different product' });
  assert.ok(decide(board, { priority: 'lowest_price' }, no.r).notes.includes('Competing offer not accepted: the page shows a different product.'));
}

section('bad_url: nothing is fetched');
{
  const bad = [
    undefined, null, 42, {}, [], '', '   ', 'not a link', 'evo.com/snowboards', '//evo.com/x', 'ftp://evo.com/x', 'file:///etc/passwd',
    'javascript:alert(1)', 'data:text/html,<p>629.95</p>', 'http://www.evo.com/x', 'https://user:[EMAIL REDACTED]/x', 'https://www.evo.com:8443/x',
    'https://127.0.0.1/x', 'https://2130706433/x', 'https://0x7f.1/x', 'https://017700000001/x', 'https://[::1]/x', 'https://[::ffff:10.0.0.1]/x',
    'https://10.0.0.5/x', 'https://192.168.1.1/x', 'https://169.254.169.254/latest/meta-data/', 'https://8.8.8.8/x', 'https://127.1/x', 'https://127.0.0.1./x', 'https://0/x',
    'https://0177.0.0.1/x', 'https://[::ffff:7f00:1]/x', 'https://\u2460\u2461\u2466.\u24ea.\u24ea.\u2460/x', 'https://1.2.3.4.5/x', 'https://www.evo.com@127.0.0.1/x', 'https://127.0.0.1#@www.evo.com/x', 'https://LOCALHOST/x',
    'https://localhost/x', 'https://localhost./x', 'https://shop.localhost/x', 'https://intranet/x', 'https://printer.local/x', 'https://build.corp/x',
    'https://metadata.google.internal/computeMetadata/v1/', 'https://router.lan/x', 'https://nas.home.arpa/x',
    `https://www.evo.com/${'x'.repeat(2100)}`,
  ];
  for (const url of bad) {
    const label = typeof url === 'string' ? (url.length > 60 ? `${url.slice(0, 40)}... (${url.length} chars)` : JSON.stringify(url)) : String(JSON.stringify(url));
    const { calls } = await check(label, url, {}, { ok: false, reason: 'bad_url', price: null, method: null }, quiet);
    assert.equal(calls.length, 0, `${label}: no request`);
  }
  told(bad.length, 'links refused as bad_url without a request: no link, no https, a login, a port, an IP address in any spelling, a private name, too long');

  // What is checked is what is fetched: the request goes to the address as the URL parser read it.
  const slashed = await check('a backslash before an @ is part of the path, not a login', 'https://www.evo.com\\@127.0.0.1/x', { 'https://www.evo.com/@127.0.0.1/x': page(ld(item())) }, { ok: true, domain: 'evo.com', url: 'https://www.evo.com/@127.0.0.1/x' });
  assert.deepEqual(slashed.calls.map(x => x.url), ['https://www.evo.com/@127.0.0.1/x']);
  await check('a name in another script is a public name', 'https://b\u00fccher.example/p', { 'https://xn--bcher-kva.example/p': page(ld(item())) }, { ok: true, domain: 'xn--bcher-kva.example' });

  // allowLocal opens http and the loopback names, and nothing else.
  const local = 'http://localhost:8787/rival/the-complete-snowboard';
  await check('localhost without allowLocal', local, { [local]: page(ld(item())) }, { reason: 'bad_url' });
  await check('localhost with allowLocal', local, { [local]: page(ld(item())) }, { ok: true, domain: 'localhost', trusted_domain: false }, { opts: { allowLocal: true } });
  const loop = 'http://127.0.0.1:8787/rival/the-complete-snowboard';
  await check('127.0.0.1 with allowLocal', loop, { [loop]: page(ld(item())) }, { ok: true, domain: '127.0.0.1' }, { opts: { allowLocal: true } });
  await check('http to a public shop with allowLocal', 'http://www.evo.com/x', { 'http://www.evo.com/x': page(ld(item())) }, { ok: true, trusted_domain: true }, { opts: { allowLocal: true } });
  for (const url of ['http://192.168.1.5/x', 'http://10.0.0.5:8787/x', 'https://printer.local/x', 'https://www.evo.com:8443/x']) await check(`${url} even with allowLocal`, url, {}, { reason: 'bad_url' }, { opts: { allowLocal: true } });
}

section('blocked_domain and own_store: nothing is fetched');
{
  for (const url of ['https://www.ebay.com/itm/1', 'https://www.ebay.co.uk/itm/1', 'https://m.facebook.com/marketplace/item/1', 'https://sfbay.craigslist.org/sga/1.html', 'https://www.aliexpress.us/item/1.html']) {
    const { calls } = await check(url, url, {}, { ok: false, reason: 'blocked_domain', trusted_domain: false });
    assert.equal(calls.length, 0);
  }
  // An empty entry in the merchant's list must not block the whole web.
  await check('a blocked list with an empty entry', EVO, { [EVO]: page(ld(item())) }, { ok: true }, { policy: { ...policy, blocked_domains: ['', '  ', null, 'ebay.'] } });

  const own = { opts: { ownHosts: [STORE.shop] } };
  for (const url of [`https://${STORE.shop}/products/the-complete-snowboard`, `https://www.${STORE.shop}/products/x`, `https://${STORE.shop.toUpperCase()}./products/x`]) {
    const { calls } = await check(url, url, {}, { ok: false, reason: 'own_store' }, own);
    assert.equal(calls.length, 0);
  }
  await check('own host given as the storefront address', `${STORE.storefront}/products/x`, {}, { reason: 'own_store' }, { opts: { ownHosts: [STORE.storefront] } });
  // A storefront that shares its host with another shop is named with its path.
  const shared = { opts: { ownHosts: ['offers.example.workers.dev/demo'] } };
  await check('own storefront under a path', 'https://offers.example.workers.dev/demo/products/the-complete-snowboard', {}, { reason: 'own_store' }, shared);
  const rival = 'https://offers.example.workers.dev/rival/the-complete-snowboard';
  await check('the shop next to it on the same host', rival, { [rival]: page(ld(item())) }, { ok: true, domain: 'offers.example.workers.dev' }, shared);
  // Our own store wins over the blocked list when both apply: the clearer thing to tell the agent.
  await check('own store that is also blocked', 'https://shop.ebay.com/x', {}, { reason: 'own_store' }, { opts: { ownHosts: ['shop.ebay.com'] } });
}

section('trusted_domain: the host itself or a name under it');
{
  for (const [host, trusted] of [['evo.com', true], ['www.evo.com', true], ['shop.evo.com', true], ['WWW.EVO.COM', true], ['notevo.com', false], ['evo.com.cheap.example', false], ['evo.co', false], ['peakboards.demo', true], ['random-shop.example', false]]) {
    const url = `https://${host}/p/the-complete-snowboard`;
    await check(`${host} is ${trusted ? '' : 'not '}trusted`, url, { [`https://${host.toLowerCase()}/p/the-complete-snowboard`]: page(ld(item())) }, { ok: true, trusted_domain: trusted, domain: host.toLowerCase().replace(/^www\./, '') });
  }
  await check('no trusted list at all', EVO, { [EVO]: page(ld(item())) }, { ok: true, trusted_domain: false }, { policy: {} });
}

section('redirects: every hop is checked before it is fetched');
{
  const a = 'https://go.example/s/abc';
  const b = 'https://evo.com/old-board';
  const c = 'https://www.evo.com/old-board';
  const d = 'https://www.evo.com/snowboards/the-complete-snowboard?size=154';
  const hops = await check('three redirects, the last one relative', a, { [a]: to(b, 301), [b]: to(c, 308), [c]: to('/snowboards/the-complete-snowboard?size=154#top', 303), [d]: page(ld(item())) }, { ok: true, url: d, domain: 'evo.com', trusted_domain: true });
  assert.deepEqual(hops.calls.map(x => x.url), [a, b, c, d]);
  assert.ok(hops.calls.every(x => x.init.redirect === 'manual'));

  const e = 'https://www.evo.com/e';
  const four = await check('four redirects', a, { [a]: to(b), [b]: to(c), [c]: to(e), [e]: to(d), [d]: page(ld(item())) }, { ok: false, reason: 'fetch_failed', reason_text: 'the link redirects too many times' });
  assert.deepEqual(four.calls.map(x => x.url), [a, b, c, e], 'the fifth address is never asked for');

  const never = [
    ['redirect to a blocked site', 'https://www.ebay.com/itm/1', 'blocked_domain'],
    ['redirect to the cloud metadata address', 'http://169.254.169.254/latest/meta-data/', 'bad_url'],
    ['redirect to a private name', 'https://admin.internal/', 'bad_url'],
    ['redirect to localhost', 'https://localhost/admin', 'bad_url'],
    ['redirect from https to http', 'http://www.evo.com/snowboards/the-complete-snowboard', 'bad_url'],
    ['redirect to another scheme', 'file:///etc/passwd', 'bad_url'],
    ['redirect to our own store', `https://${STORE.shop}/products/the-complete-snowboard`, 'own_store'],
  ];
  for (const [name, target, reason] of never) {
    const { r, calls } = await check(name, a, { [a]: to(target), [target]: page(ld(item())) }, { ok: false, reason, price: null }, { opts: { ownHosts: [STORE.shop] } });
    assert.deepEqual(calls.map(x => x.url), [a], `${name}: the target is never fetched`);
    assert.match(r.reason_text, /redirects/);
  }
  await check('redirect without a Location', a, { [a]: { status: 302 } }, { reason: 'fetch_failed' });
  await check('redirect to nonsense', a, { [a]: to('https://') }, { reason: 'fetch_failed' });
  await check('a 307', a, { [a]: to(d, 307), [d]: page(ld(item())) }, { ok: true, url: d });

  // A fetchFn that follows redirects by itself still has its landing place checked.
  const landed = where => () => { const res = new Response(page(ld(item())), { headers: HTML }); Object.defineProperty(res, 'url', { value: where }); return res; };
  await check('a fetchFn that already followed to a blocked site', a, { [a]: landed('https://www.ebay.com/itm/1') }, { reason: 'blocked_domain', price: null });
  await check('a fetchFn that already followed to a shop', a, { [a]: landed(c) }, { ok: true, url: c, domain: 'evo.com', trusted_domain: true });
}

section('fetch_failed');
{
  await check('404', EVO, {}, { ok: false, reason: 'fetch_failed', reason_text: 'the page could not be loaded (HTTP 404)', domain: 'evo.com', trusted_domain: true });
  await check('500', EVO, { [EVO]: { status: 500, body: 'oops' } }, { reason: 'fetch_failed' });
  await check('403 from a shop that turns robots away', EVO, { [EVO]: { status: 403, body: page() } }, { reason: 'fetch_failed', reason_text: 'the page could not be loaded (HTTP 403)' });
  await check('304', EVO, { [EVO]: { status: 304 } }, { reason: 'fetch_failed' });
  await check('the network fails', EVO, { [EVO]: () => { throw new TypeError('fetch failed'); } }, { reason: 'fetch_failed', reason_text: 'the page could not be loaded' });
  for (const [name, value] of [['undefined', undefined], ['a string', 'hello'], ['an empty object', {}], ['a status without a body', { status: 200 }], ['a number', 7]]) {
    const r = await verifyCompetingOffer(EVO, product, policy, { fetchFn: () => value });
    wellFormed(r, `fetchFn returns ${name}`);
    assert.equal(r.reason, 'fetch_failed', `fetchFn returns ${name}`);
  }
  // A fetchFn that is given but is no function is a wiring mistake. It fails the check; it does not fall back to the network.
  for (const value of ['fetch', 0, {}, { fetch() {} }, [], true]) {
    const r = await verifyCompetingOffer(EVO, product, policy, { fetchFn: value });
    wellFormed(r, `fetchFn is ${JSON.stringify(value)}`);
    assert.equal(r.reason, 'fetch_failed', `fetchFn is ${JSON.stringify(value)}`);
  }
  assert.equal(strays, 0, 'and the real network was not touched');
  const broken = () => new Response(new ReadableStream({ pull(ctl) { ctl.error(new Error('connection reset')); } }), { headers: HTML });
  await check('the connection drops while reading', EVO, { [EVO]: broken }, { reason: 'fetch_failed' });
}

section('time: one clock for the whole check');
{
  const timed = async (name, fetchFn, timeoutMs, max) => {
    const t0 = performance.now();
    const r = await verifyCompetingOffer(EVO, product, policy, { fetchFn, timeoutMs, now: NOW });
    const ms = Math.round(performance.now() - t0);
    wellFormed(r, name);
    assert.equal(r.reason, 'fetch_failed', name);
    assert.equal(r.reason_text, 'the page took too long to load', name);
    assert.ok(ms >= timeoutMs - 5 && ms < max, `${name}: took ${ms} ms`);
    seen.reasons.add(r.reason);
    count++;
    console.log(`   ${r.reason.padEnd(17)} ${'-'.padEnd(12)} ${'-'.padEnd(5)} ${'-'.padStart(8)}  ${name} (${ms} ms, limit ${timeoutMs} ms)`);
  };
  await timed('a server that never answers and a fetchFn that ignores the signal', () => new Promise(() => {}), 60, 2000);
  await timed('a fetchFn that honours the signal', (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))), 60, 2000);
  await timed('headers arrive, the body never does', () => new Response(new ReadableStream({ pull() { return new Promise(() => {}); } }), { headers: HTML }), 60, 2000);
  // A reader that is not a real stream and ignores being cancelled cannot hold the check either.
  await timed('a stand-in body that never reads and cannot be cancelled', () => ({ status: 200, headers: new Headers(HTML), body: { getReader: () => ({ read: () => new Promise(() => {}), cancel: () => new Promise(() => {}) }) } }), 60, 2000);
  // Four quick hops are fine one by one; together they are over the limit.
  let hop = 0;
  const slowHops = async () => { await new Promise(done => setTimeout(done, 40)); return new Response(null, { status: 302, headers: { location: `https://www.evo.com/hop-${++hop}` } }); };
  await timed('slow redirects add up', slowHops, 100, 2000);
  assert.ok(hop >= 2 && hop <= 3, `stopped after ${hop} hops`);
}

section('size: reading stops at maxBytes');
{
  const filler = (kb, counter) => new ReadableStream({
    pull(ctl) { counter.sent++; if (counter.sent > kb) ctl.close(); else ctl.enqueue(new Uint8Array(1024).fill(32)); },
    cancel() { counter.cancelled = true; },
  });
  const streamed = (head, kb, counter) => () => {
    const lead = new TextEncoder().encode(head);
    let first = true;
    const tail = filler(kb, counter).getReader();
    return new Response(new ReadableStream({
      async pull(ctl) {
        if (first) { first = false; ctl.enqueue(lead); return; }
        const { done, value } = await tail.read();
        if (done) ctl.close(); else ctl.enqueue(value);
      },
      cancel() { counter.cancelled = true; },
    }), { headers: HTML });
  };
  const early = { sent: 0, cancelled: false };
  await check('price in the first bytes of an endless page', EVO, { [EVO]: streamed(page(ld(item())), 50000, early) }, { ok: true, price: 629.95 }, { opts: { maxBytes: 20000 } });
  assert.ok(early.cancelled && early.sent < 40, `stopped after ${early.sent} of 50000 chunks and hung up`);

  const late = { sent: 0, cancelled: false };
  const tooBig = await check('price after the limit', EVO, { [EVO]: streamed(`<!doctype html><html><head><title>Shop</title></head><body>${' '.repeat(30000)}${ld(item())}`, 10, late) }, { ok: false, reason: 'no_price_found' }, { opts: { maxBytes: 20000 } });
  assert.match(tooBig.r.reason_text, /too large/);
  await check('the same page within the limit', EVO, { [EVO]: `<!doctype html><html><head><title>Shop</title></head><body>${' '.repeat(30000)}${ld(item())}` }, { ok: true });
  // A response that is not a stream (a stand-in from another module) is cut the same way.
  const plain = body => () => ({ status: 200, headers: new Headers(HTML), text: async () => body });
  const stub = body => verifyCompetingOffer(EVO, product, policy, { fetchFn: plain(body), maxBytes: 20000, now: NOW });
  assert.equal((await stub(page(ld(item())))).ok, true, 'a response with only text() works');
  assert.equal((await stub(' '.repeat(30000) + page(ld(item())))).reason, 'no_price_found', 'and is cut at maxBytes');

  // A page sent a byte at a time is read while it stays within reason, and cut off after that.
  const crumbs = (text, counter) => () => {
    const bytes = new TextEncoder().encode(text);
    let i = 0;
    return new Response(new ReadableStream({ pull(ctl) { counter.sent++; if (i < bytes.length) ctl.enqueue(bytes.subarray(i, ++i)); else ctl.close(); }, cancel() { counter.cancelled = true; } }), { headers: HTML });
  };
  const few = { sent: 0 };
  await check('a small page in one-byte pieces', EVO, { [EVO]: crumbs(page(ld(item())), few) }, { ok: true, price: 629.95 });
  const many = { sent: 0 };
  const dribble = await check('a page in more than 20000 pieces', EVO, { [EVO]: crumbs(`<html><body>${' '.repeat(21000)}${ld(item())}`, many) }, { ok: false, reason: 'no_price_found' });
  assert.match(dribble.r.reason_text, /too large/);
  assert.ok(many.cancelled && many.sent < 20100, `hung up after ${many.sent} pieces`);
}

section('decoding');
{
  const bytes = (text, encoding) => Uint8Array.from(Buffer.from(text, encoding));
  const french = page(ld(item({ name: 'Planche à neige Complète Édition', gtin13: undefined, mpn: undefined })));
  const latin = { product: { ...anon, title: 'Planche a neige Complete Edition' } };
  await check('a page in ISO-8859-1', EVO, { [EVO]: { headers: { 'content-type': 'text/html; charset=ISO-8859-1' }, body: bytes(french, 'latin1') } }, { ok: true, match_by: 'title', match_score: 1, title: 'Planche à neige Complète Édition' }, latin);
  await check('a page in UTF-8 with no charset stated', EVO, { [EVO]: { headers: { 'content-type': 'text/html' }, body: bytes(french, 'utf8') } }, { ok: true, title: 'Planche à neige Complète Édition' }, latin);
  await check('a charset nobody knows is read as UTF-8', EVO, { [EVO]: { headers: { 'content-type': 'text/html; charset=x-made-up' }, body: bytes(french, 'utf8') } }, { ok: true, title: 'Planche à neige Complète Édition' }, latin);
  await check('no content type at all', EVO, { [EVO]: { headers: {}, body: bytes(page(ld(item())), 'utf8') } }, { ok: true });
  const url = 'https://www.burton.com/products/the-complete-snowboard';
  const withBom = { headers: JS, body: bytes(`\ufeff${JSON.stringify({ title: 'The Complete Snowboard', vendor: 'Snowboard Vendor', variants: [{ id: 1, title: 'Default Title', price: 62995, available: true, barcode: '0840123456784' }] })}`, 'utf8') };
  await check('product JSON that starts with a byte order mark', url, { [url]: page('<meta property="og:price:currency" content="USD">'), [`${url}.js`]: withBom }, { ok: true, method: 'shopify_json', price: 629.95, match_by: 'gtin' });
}

section('no_price_found');
{
  await check('a page with no price anywhere', EVO, { [EVO]: page('<meta property="og:title" content="The Complete Snowboard">', '<h1>The Complete Snowboard</h1><p>Call us for a quote.</p>') }, { ok: false, reason: 'no_price_found', price: null, method: null });
  await check('a Product without offers', EVO, { [EVO]: page(ld(item({ offers: undefined }))) }, { reason: 'no_price_found' });
  await check('an image, not a page', EVO, { [EVO]: { headers: { 'content-type': 'image/png' }, body: 'PNG' } }, { reason: 'no_price_found', reason_text: 'that link is not a product page' });
  await check('an empty page', EVO, { [EVO]: '' }, { reason: 'no_price_found' });
  const unreadable = ['call for price', '', 0, '0.00', -5, '-5.00', null, true, {}, [], 'NaN', 'Infinity', '1.2.3', '1,2,3'];
  for (const p of unreadable) await check(`price ${JSON.stringify(p)}`, EVO, { [EVO]: page(ld(item({ offers: offer({ price: p }) }))) }, { reason: 'no_price_found' }, quiet);
  told(unreadable.length, `values that are no price: ${unreadable.map(p => JSON.stringify(p)).join(' ')}`);
}

section('JSON-LD: the shapes real shops write');
{
  const org = { '@context': 'https://schema.org', '@type': 'Organization', name: 'evo', url: 'https://www.evo.com' };
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Snowboards', item: 'https://www.evo.com/snowboards' }] };
  const good = { ok: true, method: 'json_ld', match_by: 'gtin', price: 629.95, currency: 'USD' };
  const on = (name, html, want = good, extra) => check(name, EVO, { [EVO]: html }, want, extra);

  await on('several scripts, the product last', page(ld(org, crumbs), ld(item())));
  await on('a top-level array', page(ld([org, crumbs, item()])));
  await on('@graph', page(ld({ '@context': 'https://schema.org', '@graph': [org, crumbs, item({ '@context': undefined })] })));
  await on('Product inside mainEntity', page(ld({ '@context': 'https://schema.org', '@type': 'WebPage', mainEntity: item() })));
  await on('@type as a list', page(ld(item({ '@type': ['Product', 'Thing'] }))));
  await on('@type as an address', page(ld(item({ '@type': 'http://schema.org/Product' }))));
  await on('script tag in capitals and single quotes', page(`<SCRIPT TYPE='application/ld+json' data-x="1">${JSON.stringify(item())}</SCRIPT>`));
  await on('a broken block before the good one', page(ld('{"@type":"Product","name":"The Complete Snowboard",,}', item())));
  await on('raw line breaks inside a string', page(ld(JSON.stringify(item({ description: 'LINE' })).replace('LINE', 'Twin tip.\n\tAll mountain.\r\nCamber.'))));
  await on('brand as a string, gtin as a number', page(ld(item({ brand: 'Snowboard Vendor', gtin13: undefined, gtin12: 840123456784 }))), { ...good, brand: 'Snowboard Vendor', gtin: '840123456784' });
  await on('brand as an Organization', page(ld(item({ brand: { '@type': 'Organization', name: 'Snowboard Vendor' } }))), { ...good, brand: 'Snowboard Vendor' });
  await on('offers as a list of one', page(ld(item({ offers: [offer()] }))));
  await on('a name with entities', page(ld(item({ name: 'The Complete Snowboard &amp; Men&#39;s Wax', gtin13: undefined, mpn: undefined }))), { ok: true, match_by: 'title', title: 'The Complete Snowboard & Men\'s Wax', match_score: 0.6 });
  await on('accessories listed as Products without offers', page(ld(item({ isAccessoryOrSparePartFor: [{ '@type': 'Product', name: 'Bindings' }, { '@type': 'Product', name: 'Boots' }] }))));
  await on('JSON-LD and OpenGraph disagree: JSON-LD is read first', page('<meta property="og:price:amount" content="599.00"><meta property="og:price:currency" content="USD">' + ld(item())));

  // A related product listed first, and cheaper, does not stand in for ours.
  await on('two Products, the other one first', page(ld(item({ name: 'Ski Wax', gtin13: '0840123456814', mpn: 'SV-WAX-50', offers: offer({ price: '24.95' }) }), item())));

  // Prices as shops write them. The list price follows, so only the reading is judged.
  const written = [['629.95', 629.95], [629.95, 629.95], [629, 629], ['$629.95', 629.95], ['USD 629.95', 629.95], ['629.95 USD', 629.95], ['629,95', 629.95], ['629,95 €', 629.95],
    ['1,299.00', 1299], ['$1,299', 1299], ['1.299,00', 1299], ['1.299,00 €', 1299], ['1 299,00', 1299], ['1\u00a0299,00 kr', 1299], ['1\u2019299.00', 1299], ['1,299,000.50', 1299000.5], ['1.299.000', 1299000], ['From $19.99', 19.99], ['12.5', 12.5]];
  for (const [text, value] of written) await on(`price ${JSON.stringify(text)}`, page(ld(item({ offers: offer({ price: text }) }))), { ok: true, price: value }, { product: { ...product, list: value }, quiet: true });
  told(written.length, `ways of writing a price read right: ${written.map(([text]) => JSON.stringify(text)).join(' ')}`);

  // priceSpecification: the active price carries no priceType and no member tier.
  const spec = (price, more = {}) => ({ '@type': 'UnitPriceSpecification', price, priceCurrency: 'USD', ...more });
  const noPrice = { price: undefined, priceCurrency: undefined };
  await on('price only in priceSpecification', page(ld(item({ offers: offer({ ...noPrice, priceSpecification: spec(629.95) }) }))));
  await on('a was-price listed before the active one', page(ld(item({ offers: offer({ ...noPrice, priceSpecification: [spec(699.95, { priceType: 'https://schema.org/StrikethroughPrice' }), spec('629.95')] }) }))));
  await on('a ListPrice listed before the active one', page(ld(item({ offers: offer({ ...noPrice, priceSpecification: [spec(699.95, { priceType: 'ListPrice' }), spec(629.95)] }) }))));
  await on('a member price is not the public price', page(ld(item({ offers: offer({ ...noPrice, priceSpecification: [spec(579.95, { validForMemberTier: { '@type': 'MemberProgramTier', '@id': 'https://www.evo.com/members#gold' } }), spec(629.95)] }) }))));
  await on('offer.price wins over priceSpecification', page(ld(item({ offers: offer({ priceSpecification: spec(699.95, { priceType: 'https://schema.org/StrikethroughPrice' }) }) }))));
  await on('only a was-price', page(ld(item({ offers: offer({ ...noPrice, priceSpecification: spec(699.95, { priceType: 'https://schema.org/StrikethroughPrice' }) }) }))), { ok: false, reason: 'no_price_found' });
  await on('currency only in priceSpecification', page(ld(item({ offers: offer({ priceCurrency: undefined, priceSpecification: spec(629.95) }) }))));

  // AggregateOffer counts with its lowPrice.
  const range = (more = {}) => ({ '@type': 'AggregateOffer', lowPrice: '599.00', highPrice: '699.00', priceCurrency: 'USD', offerCount: 3, availability: 'https://schema.org/InStock', ...more });
  await on('AggregateOffer', page(ld(item({ offers: range() }))), { ...good, price: 599 });
  await on('AggregateOffer in a list', page(ld(item({ offers: [range()] }))), { ...good, price: 599 });
  await on('an Offer that only has a lowPrice', page(ld(item({ offers: offer({ price: undefined, lowPrice: '599.00', highPrice: '699.00' }) }))), { ...good, price: 599 });
  await on('an AggregateOffer that only has a price', page(ld(item({ offers: range({ lowPrice: '', price: '629.95' }) }))), { ...good, price: 629.95 });
  // Unless one of the offers inside it is exactly our item.
  const sized = [offer({ price: '599.00', gtin13: '0840123456777', sku: 'EVO-150' }), offer({ price: '629.95', gtin13: '0840123456784', sku: 'EVO-154' }), offer({ price: '699.00', gtin13: '0840123456791', sku: 'EVO-158' })];
  await on('AggregateOffer holding our exact item', page(ld(item({ gtin13: undefined, offers: range({ offers: sized }) }))), { ...good, price: 629.95, sku: 'EVO-154' });
  await on('AggregateOffer holding other items only', page(ld(item({ gtin13: undefined, mpn: undefined, offers: range({ offers: sized.map(o => ({ ...o, gtin13: undefined })) }) }))), { ok: true, match_by: 'title', price: 599 });

  // One Offer per size on a single Product (a common Shopify theme shape).
  const perSize = n => sized.map((o, i) => ({ ...o, url: `https://www.evo.com/products/x?variant=${n + i}` }));
  await on('one Offer per size, ours by GTIN', page(ld(item({ gtin13: undefined, sku: undefined, offers: perSize(100) }))), { ...good, sku: 'EVO-154', gtin: '0840123456784' });

  // Shipping.
  const ship = (details, more = {}) => page(ld(item({ offers: offer({ shippingDetails: details, ...more }) })));
  const rate = (value, currency = 'USD', more = {}) => ({ '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value, currency }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' }, ...more });
  await on('shipping stated as a number', ship(rate(4.99)), { ...good, shipping: 4.99 });
  await on('shipping stated as text', ship(rate('12.00')), { ...good, shipping: 12 });
  await on('shipping in a list, another currency first', ship([rate(15, 'CAD'), rate(9.5)]), { ...good, shipping: 9.5 });
  await on('shipping as a maxValue only', ship({ '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', maxValue: 19, currency: 'USD' } }), { ...good, shipping: 19 });
  await on('shipping details without a rate', ship({ '@type': 'OfferShippingDetails', shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' } }), { ...good, shipping: null });
  const freeFrom = price => ({ freeShippingThreshold: { '@type': 'DeliveryChargeSpecification', price, priceCurrency: 'USD' } });
  await on('free from an amount the item reaches', ship(rate(0, 'USD', freeFrom(100))), { ...good, shipping: 0 });
  await on('free from an amount the item does not reach', ship(rate(0, 'USD', freeFrom(1000))), { ...good, shipping: null });
  await on('a charge, free from an amount the item reaches', ship(rate(12, 'USD', freeFrom(500))), { ...good, shipping: 0 });
  await on('a charge, free from an amount the item does not reach', ship(rate(12, 'USD', freeFrom(1000))), { ...good, shipping: 12 });
}

section('JSON-LD ProductGroup with hasVariant (what Shopify\'s structured_data filter writes)');
{
  const base = 'https://www.burton.com/en-us/boards/the-complete-snowboard';
  const size = (id, cm, gtin, price, availability = 'InStock') => ({
    '@id': `/en-us/boards/the-complete-snowboard?variant=${id}#variant`, '@type': 'Product', gtin, name: `The Complete Snowboard - ${cm}`, sku: `SV-${cm}`,
    offers: { '@id': `/en-us/boards/the-complete-snowboard?variant=${id}#offer`, '@type': 'Offer', availability: `http://schema.org/${availability}`, price, priceCurrency: 'USD', url: `${base}?variant=${id}` },
  });
  const group = (variants, more = {}) => ({
    '@context': 'http://schema.org/', '@id': '/en-us/boards/the-complete-snowboard#product', '@type': 'ProductGroup', brand: { '@type': 'Brand', name: 'Snowboard Vendor' },
    category: 'Snowboards', description: '', hasVariant: variants, name: 'The Complete Snowboard', productGroupID: '8778500112547', url: base, ...more,
  });
  const sizes = [size(111, '150', '840123456777', '619.95', 'OutOfStock'), size(222, '154', '840123456784', '629.95'), size(333, '158', '840123456791', '639.95')];
  const want = { ok: true, method: 'json_ld', currency: 'USD', brand: 'Snowboard Vendor', domain: 'burton.com', trusted_domain: true };

  await check('our size by GTIN', base, { [base]: page(ld(group(sizes))) }, { ...want, match_by: 'gtin', price: 629.95, gtin: '840123456784', sku: 'SV-154', title: 'The Complete Snowboard - 154', availability: 'in_stock' });
  await check('our GTIN beats the size the link names', `${base}?variant=333`, { [`${base}?variant=333`]: page(ld(group(sizes))) }, { ...want, match_by: 'gtin', price: 629.95 });
  await check('no identifier: the size the link names', `${base}?variant=333`, { [`${base}?variant=333`]: page(ld(group(sizes))) }, { ...want, match_by: 'title', match_score: 1, price: 639.95, sku: 'SV-158', title: 'The Complete Snowboard - 158' }, { product: anon });
  await check('no identifier, no size named: the first one in stock', base, { [base]: page(ld(group(sizes))) }, { ...want, match_by: 'title', price: 629.95, sku: 'SV-154' }, { product: anon });
  await check('the size the link names is sold out', `${base}?variant=111`, { [`${base}?variant=111`]: page(ld(group(sizes))) }, { ok: false, reason: 'out_of_stock', price: 619.95, availability: 'out_of_stock' }, { product: anon });
  await check('a part number on the size, the brand on the group', base, { [base]: page(ld(group(sizes.map((v, i) => ({ ...v, gtin: undefined, mpn: i === 1 ? 'sv-complete-154' : `SV-COMPLETE-${i}` }))))) }, { ...want, match_by: 'mpn', price: 629.95, mpn: 'sv-complete-154' });
  // The group may carry an offer of its own (seen on a live shop): it stands for the product when no size is singled out.
  await check('a group with its own offer', base, { [base]: page(ld(group(sizes, { offers: { '@type': 'Offer', price: 100, priceCurrency: 'USD', availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition', url: base } }))) }, { ok: false, reason: 'implausible_price', price: 100 }, { product: anon });
  await check('a variant title longer than ours still matches through the group name', base, { [base]: page(ld(group([size(444, '154cm / Dawn / Wide / 2026 Edition', '840123450000', '629.95')]))) }, { ...want, match_by: 'title', match_score: 1, price: 629.95 }, { product: anon });

  // The words a size adds to the product's name count only when they are words of ours.
  const named = { product: { ...anon, title: 'The Complete Snowboard 158' } };
  await check('our title names the size', base, { [base]: page(ld(group(sizes))) }, { ...want, match_by: 'title', match_score: 1, price: 639.95, sku: 'SV-158' }, named);
  await check('our title names a size that is sold out', base, { [base]: page(ld(group(sizes))) }, { ok: false, reason: 'out_of_stock', sku: 'SV-150' }, { product: { ...anon, title: 'The Complete Snowboard 150' } });
  // Otherwise sizes tie, however their names are written, and the first that can be bought is taken.
  const uneven = [size(1, 'Navy Stripes - Size 10', '840123450010', '100.00', 'OutOfStock'), size(2, 'Navy Stripes - Size 8.5', '840123450085', '110.00'), size(3, 'Navy Stripes - Size 9', '840123450090', '120.00')];
  await check('sizes written at different lengths tie', base, { [base]: page(ld(group(uneven))) }, { ...want, match_by: 'title', match_score: 1, price: 110, title: 'The Complete Snowboard - Navy Stripes - Size 8.5' }, { product: { ...anon, title: 'The Complete Snowboard Navy Stripes', list: 110 } });
}

section('one product on the page: the page title is another name for it');
{
  const og = (title, type = 'product') => `<meta property="og:type" content="${type}"><meta property="og:title" content="${title}">`;
  const terse = item({ name: 'COMPLETE', gtin13: undefined, mpn: undefined });
  await check('a short model name in the data, the full name in og:title', EVO, { [EVO]: page(og('Snowboard Vendor The Complete Snowboard') + ld(terse)) }, { ok: true, method: 'json_ld', match_by: 'title', match_score: 0.75, title: 'Snowboard Vendor The Complete Snowboard', price: 629.95 }, { product: anon });
  await check('the same data without a product page around it', EVO, { [EVO]: page(og('Snowboard Vendor The Complete Snowboard', 'website') + ld(terse)) }, { ok: false, reason: 'different_product', title: 'COMPLETE' }, { product: anon });
  await check('the same data without any og:type', EVO, { [EVO]: page('<meta property="og:title" content="The Complete Snowboard">' + ld(terse)) }, { ok: false, reason: 'different_product' }, { product: anon });
  await check('two products in the data: the page title names neither', EVO, { [EVO]: page(og('The Complete Snowboard') + ld(terse, item({ name: 'Ski Wax', gtin13: undefined, mpn: undefined, offers: offer({ price: '400.00' }) }))) }, { ok: false, reason: 'different_product' }, { product: anon });
  await check('a group and its sizes are one product', EVO, { [EVO]: page(og('The Complete Snowboard') + ld({ '@context': 'https://schema.org', '@type': 'ProductGroup', name: 'COMPLETE', hasVariant: [{ '@type': 'Product', name: 'COMPLETE 154', offers: offer() }, { '@type': 'Product', name: 'COMPLETE 158', offers: offer({ price: '639.95' }) }] })) }, { ok: true, match_by: 'title', match_score: 1, title: 'The Complete Snowboard', price: 629.95 }, { product: anon });
  await check('the data names the product well: the page title changes nothing', EVO, { [EVO]: page(og('Shop all boards') + ld(item())) }, { ok: true, match_by: 'gtin', title: 'The Complete Snowboard' });
}

section('Shopify product JSON (/products/<handle>.js, integer cents)');
{
  const origin = 'https://www.burton.com';
  const url = `${origin}/products/the-complete-snowboard`;
  const variant = (id, cm, barcode, cents, available = true) => ({ id, title: cm, option1: cm, sku: `SV-${cm}`, requires_shipping: true, taxable: true, available, name: `The Complete Snowboard - ${cm}`, public_title: cm, options: [cm], price: cents, weight: 0, compare_at_price: null, barcode });
  const shopProduct = (variants = [variant(111, '150', '840123456777', 61995, false), variant(222, '154', '840123456784', 62995), variant(333, '158', '840123456791', 63995)]) => ({
    id: 8778500112547, title: 'The Complete Snowboard', handle: 'the-complete-snowboard', description: '<p>Twin tip.</p>', vendor: 'Snowboard Vendor', type: 'Snowboard', tags: [],
    price: 61995, price_min: 61995, price_max: 63995, available: true, price_varies: true, compare_at_price: null, variants, images: [], options: [{ name: 'Size', position: 1 }], url: '/products/the-complete-snowboard',
  });
  const theme = (head = '') => page(`${head}<script>window.Shopify = window.Shopify || {}; Shopify.shop = "burton.myshopify.com"; Shopify.currency = {"active":"USD","rate":"1.0"};</script>`, '<h1>The Complete Snowboard</h1>');
  const want = { ok: true, method: 'shopify_json', currency: 'USD', brand: 'Snowboard Vendor', condition: null, shipping: null, domain: 'burton.com', trusted_domain: true };

  const hit = await check('our size by barcode', url, { [url]: theme(), [`${url}.js`]: json(shopProduct()) }, { ...want, match_by: 'gtin', price: 629.95, gtin: '840123456784', sku: 'SV-154', availability: 'in_stock', title: 'The Complete Snowboard - 154' });
  assert.deepEqual(hit.calls.map(x => x.url), [url, `${url}.js`]);
  await check('our barcode beats the size the link names', `${url}?variant=333`, { [`${url}?variant=333`]: theme(), [`${url}.js`]: json(shopProduct()) }, { ...want, match_by: 'gtin', price: 629.95 });
  await check('no identifier: the size the link names', `${url}?variant=333`, { [`${url}?variant=333`]: theme(), [`${url}.js`]: json(shopProduct()) }, { ...want, match_by: 'title', price: 639.95, sku: 'SV-158' }, { product: anon });
  await check('no identifier, no size named: the first available', url, { [url]: theme(), [`${url}.js`]: json(shopProduct()) }, { ...want, match_by: 'title', price: 629.95, sku: 'SV-154' }, { product: anon });
  await check('SKU and brand agree', url, { [url]: theme(), [`${url}.js`]: json(shopProduct()) }, { ...want, match_by: 'sku', price: 639.95, sku: 'SV-158' }, { product: { ...anon, sku: 'sv-158' } });
  await check('every size sold out', url, { [url]: theme(), [`${url}.js`]: json(shopProduct([variant(111, '150', '', 61995, false), variant(222, '154', '', 62995, false)])) }, { ok: false, reason: 'out_of_stock', method: 'shopify_json', price: 619.95 }, { product: anon });
  await check('a single variant called Default Title', url, { [url]: theme(), [`${url}.js`]: json(shopProduct([{ ...variant(999, 'Default Title', '0840123456784', 62995), name: undefined }])) }, { ...want, match_by: 'gtin', price: 629.95 });

  // The JSON names no currency: the page does, or the storefront's cart does.
  const ogCurrency = '<meta property="og:price:currency" content="USD">';
  await check('currency from the page\'s meta tags', url, { [url]: page(ogCurrency), [`${url}.js`]: json(shopProduct()) }, { ...want, price: 629.95 });
  const asked = await check('currency from /cart.js when the page is silent', url, { [url]: page(), [`${url}.js`]: json(shopProduct()), [`${origin}/cart.js`]: json({ token: null, currency: 'USD', item_count: 0, items: [] }) }, { ...want, price: 629.95 });
  assert.deepEqual(asked.calls.map(x => x.url), [url, `${url}.js`, `${origin}/cart.js`]);
  await check('no currency anywhere', url, { [url]: page(), [`${url}.js`]: json(shopProduct()) }, { ok: false, reason: 'currency_mismatch', reason_text: 'the page does not say which currency its price is in', price: 629.95, currency: null });

  // A market prefix stays in front, so the price is read in that market's currency.
  const ca = `${origin}/en-ca/products/the-complete-snowboard`;
  const market = await check('a Canadian market page', ca, { [ca]: page(), [`${ca}.js`]: json(shopProduct()), [`${origin}/en-ca/cart.js`]: json({ currency: 'CAD' }) }, { ok: false, reason: 'currency_mismatch', currency: 'CAD', price: 629.95, method: 'shopify_json' });
  assert.deepEqual(market.calls.map(x => x.url), [ca, `${ca}.js`, `${origin}/en-ca/cart.js`]);
  assert.equal(market.r.reason_text, 'the price on that page is in CAD, not in USD');
  const inCollection = `${origin}/collections/all-mountain/products/the-complete-snowboard`;
  const nested = await check('a product address under a collection', inCollection, { [inCollection]: theme(), [`${url}.js`]: json(shopProduct()) }, { ...want, price: 629.95 });
  assert.equal(nested.calls[1].url, `${url}.js`);
  const elsewhere = 'https://www.backcountry.com/store/products/the-complete-snowboard';
  const other = await check('/products/ under some other path', elsewhere, { [elsewhere]: theme(), 'https://www.backcountry.com/products/the-complete-snowboard.js': json(shopProduct()) }, { ...want, domain: 'backcountry.com', price: 629.95 });
  assert.equal(other.calls[1].url, 'https://www.backcountry.com/products/the-complete-snowboard.js');

  // Order: JSON-LD with a price ends the search; without one the product JSON is next, then the meta tags.
  const ldFirst = await check('JSON-LD with a price: the product JSON is never asked for', url, { [url]: page(ld(item())), [`${url}.js`]: json(shopProduct()) }, { ok: true, method: 'json_ld' });
  assert.equal(ldFirst.calls.length, 1);
  const og = '<meta property="og:price:amount" content="599.00"><meta property="og:price:currency" content="USD"><meta property="og:title" content="The Complete Snowboard">';
  await check('JSON-LD without a price, then product JSON, ahead of the meta tags', url, { [url]: page(og + ld(item({ offers: undefined }))), [`${url}.js`]: json(shopProduct()) }, { ...want, price: 629.95 });
  await check('no product JSON on this host: the meta tags are read', url, { [url]: page(og) }, { ok: true, method: 'meta', price: 599, match_by: 'title' });
  await check('a password page where the JSON should be', url, { [url]: page(og), [`${url}.js`]: page('', '<form action="/password">') }, { ok: true, method: 'meta', price: 599 });
  await check('prices that are not integer cents are not trusted', url, { [url]: page(), [`${url}.js`]: json(shopProduct([{ ...variant(1, '154', '840123456784', 0), price: '629.95' }])) }, { ok: false, reason: 'no_price_found' });
  await check('the product JSON redirects to a blocked site', url, { [url]: page(og), [`${url}.js`]: to('https://www.ebay.com/x.js') }, { ok: true, method: 'meta' });
}

section('OpenGraph and meta tags');
{
  const url = 'https://www.tactics.com/snowboard-vendor/the-complete-snowboard';
  const want = { ok: true, method: 'meta', match_by: 'title', price: 629.95, currency: 'USD', domain: 'tactics.com', trusted_domain: true, gtin: null, mpn: null, sku: null, shipping: null };
  await check('product:price:amount with og:title', url, { [url]: page('<meta property="og:title" content="The Complete Snowboard"><meta property="product:price:amount" content="629.95"><meta property="product:price:currency" content="USD">') }, { ...want, title: 'The Complete Snowboard', match_score: 1 });
  await check('og:price:amount, tags spread over lines, single quotes, an entity', url, { [url]: page(`<meta property='og:title' content='Snowboard Vendor&#39;s The Complete Snowboard'>\n<meta\n    property='og:price:amount'\n    content='629.95'\n  >\n<META PROPERTY='og:price:currency' CONTENT='usd' />`) }, { ...want, title: 'Snowboard Vendor\'s The Complete Snowboard', match_score: 0.75 });
  await check('name= instead of property=, a price with a symbol', url, { [url]: page('<meta name="og:title" content="The Complete Snowboard"><meta name="product:price:amount" content="$629.95"><meta name="product:price:currency" content="USD">') }, want);
  await check('no og:title: the page title is compared', url, { [url]: '<html><head><title>\n  The Complete Snowboard | Tactics\n</title><meta property="og:price:amount" content="629.95"><meta property="og:price:currency" content="USD"></head></html>' }, { ...want, title: 'The Complete Snowboard | Tactics', match_score: 0.75 });
  await check('availability and brand from product: tags', url, { [url]: page('<meta property="og:title" content="The Complete Snowboard"><meta property="product:price:amount" content="629.95"><meta property="product:price:currency" content="USD"><meta property="product:availability" content="in stock"><meta property="product:condition" content="new"><meta property="product:brand" content="Snowboard Vendor">') }, { ...want, availability: 'in_stock', condition: 'new', brand: 'Snowboard Vendor' });
  await check('a price without a currency', url, { [url]: page('<meta property="og:title" content="The Complete Snowboard"><meta property="og:price:amount" content="629.95">') }, { ok: false, reason: 'currency_mismatch', price: 629.95, currency: null });
  await check('a tag cut off mid-attribute does not hide the next one', url, { [url]: page('<meta property="og:description" content="unfinished><meta property="og:title" content="The Complete Snowboard"><meta property="og:price:amount" content="629.95"><meta property="og:price:currency" content="USD">') }, { ok: true, method: 'meta', price: 629.95 });
}

section('microdata');
{
  const url = 'https://www.backcountry.com/snowboard-vendor-the-complete-snowboard';
  const micro = ({ price = '<span itemprop="price" content="629.95">$629.95</span>', extra = '', availability = 'InStock' } = {}) => `<!doctype html><html><head><title>Backcountry</title></head><body>
    <header itemscope itemtype="https://schema.org/Organization"><span itemprop="name">Backcountry</span></header>
    <div itemscope itemtype="https://schema.org/Product">
      <div itemprop="brand" itemscope itemtype="https://schema.org/Brand"><meta itemprop="name" content="Snowboard Vendor"></div>
      <h1 class="title" itemprop="name">The Complete Snowboard</h1>
      <meta itemprop="gtin13" content="0840123456784"><span itemprop="sku">BC-77</span>${extra}
      <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        ${price}<meta itemprop="priceCurrency" content="USD"><link itemprop="availability" href="https://schema.org/${availability}">
      </div>
      <div itemprop="review" itemscope itemtype="https://schema.org/Review"><span itemprop="name">Great board</span></div>
    </div></body></html>`;
  const want = { ok: true, method: 'microdata', match_by: 'gtin', price: 629.95, currency: 'USD', title: 'The Complete Snowboard', brand: 'Snowboard Vendor', gtin: '0840123456784', sku: 'BC-77', availability: 'in_stock', domain: 'backcountry.com', trusted_domain: true };
  await check('itemprop price as a content attribute', url, { [url]: micro() }, want);
  await check('itemprop price as text with a symbol and a thousands mark', url, { [url]: micro({ price: '<span class="price" itemprop="price"> $1,299.00 </span>' }) }, { ...want, price: 1299 }, { product: { ...product, list: 1299 } });
  await check('an empty price element before the real one', url, { [url]: micro({ price: '<span itemprop="price"></span><meta itemprop="price" content="629.95">' }) }, want);
  await check('availability as a link', url, { [url]: micro({ availability: 'OutOfStock' }) }, { ok: false, reason: 'out_of_stock', method: 'microdata', availability: 'out_of_stock' });
  await check('condition as a link', url, { [url]: micro({ extra: '<link itemprop="itemCondition" href="https://schema.org/UsedCondition">' }) }, { ok: false, reason: 'not_new', condition: 'used' });
  await check('title-only match through microdata', url, { [url]: micro() }, { ...want, match_by: 'title', match_score: 1 }, { product: anon });
}

section('currency_mismatch, out_of_stock, not_new, implausible_price');
{
  const on = (name, over, want, extra) => check(name, EVO, { [EVO]: page(ld(item(over))) }, want, extra);
  await on('priced in CAD', { offers: offer({ priceCurrency: 'CAD' }) }, { ok: false, reason: 'currency_mismatch', reason_text: 'the price on that page is in CAD, not in USD', currency: 'CAD', price: 629.95 });
  await on('currency in small letters is the same currency', { offers: offer({ priceCurrency: 'usd' }) }, { ok: true, currency: 'USD' });
  await on('no currency stated', { offers: offer({ priceCurrency: undefined }) }, { ok: false, reason: 'currency_mismatch', currency: null });
  await on('a currency sign is not a currency', { offers: offer({ priceCurrency: '$' }) }, { ok: false, reason: 'currency_mismatch', currency: null });
  await on('our own product has no currency', {}, { ok: false, reason: 'currency_mismatch' }, { product: { ...product, currency: undefined } });

  for (const [value, availability, text] of [['https://schema.org/OutOfStock', 'out_of_stock', /out of stock/], ['http://schema.org/SoldOut', 'out_of_stock', /out of stock/], ['OutOfStock', 'out_of_stock', /out of stock/], ['schema:Discontinued', 'discontinued', /discontinued/], ['https://schema.org/PreOrder', 'preorder', /pre-orders/], ['https://schema.org/BackOrder', 'backorder', /back order/]]) {
    const { r } = await on(`availability ${value}`, { offers: offer({ availability: value }) }, { ok: false, reason: 'out_of_stock', availability, price: 629.95, match_by: 'gtin' });
    assert.match(r.reason_text, text);
  }
  for (const value of ['https://schema.org/InStock', 'InStock', 'in stock', 'https://schema.org/LimitedAvailability', 'https://schema.org/OnlineOnly', { '@id': 'https://schema.org/InStock' }]) await on(`availability ${JSON.stringify(value)}`, { offers: offer({ availability: value }) }, { ok: true, availability: 'in_stock' });
  await on('availability not stated', { offers: offer({ availability: undefined }) }, { ok: true, availability: null });
  await on('availability in words we do not know', { offers: offer({ availability: 'Ships in 3 weeks' }) }, { ok: true, availability: null });

  for (const [value, condition] of [['https://schema.org/UsedCondition', 'used'], ['RefurbishedCondition', 'refurbished'], ['http://schema.org/DamagedCondition', 'damaged'], ['Open box', 'openbox']]) await on(`condition ${value}`, { offers: offer({ itemCondition: value }) }, { ok: false, reason: 'not_new', condition, price: 629.95 });
  await on('condition stated on the Product, not the Offer', { itemCondition: 'https://schema.org/UsedCondition', offers: offer({ itemCondition: undefined }) }, { ok: false, reason: 'not_new', condition: 'used', reason_text: 'that offer is for a used item, not a new one' });
  await on('condition not stated', { offers: offer({ itemCondition: undefined }) }, { ok: true, condition: null });
  for (const value of ['NewCondition', 'new', 'Brand New']) await on(`condition ${value}`, { offers: offer({ itemCondition: value }) }, { ok: true, condition: 'new' });
  // A used and a new offer of the same item on one page: the new one is the one compared.
  await on('used listed before new', { offers: [offer({ price: '399.00', itemCondition: 'https://schema.org/UsedCondition' }), offer()] }, { ok: true, price: 629.95, condition: 'new' });
  await on('sold out listed before in stock', { offers: [offer({ price: '599.00', availability: 'https://schema.org/OutOfStock' }), offer()] }, { ok: true, price: 629.95 });

  // Half of 699.95 is 349.975.
  const cheap = await on('far below our price', { offers: offer({ price: '199.00' }) }, { ok: false, reason: 'implausible_price', price: 199, match_by: 'gtin' });
  assert.doesNotMatch(cheap.r.reason_text, /\d/, 'the limit is not told');
  await on('one cent under half', { offers: offer({ price: '349.97' }) }, { ok: false, reason: 'implausible_price' });
  await on('just over half', { offers: offer({ price: '349.98' }) }, { ok: true, price: 349.98 });
  await on('the merchant sets a stricter ratio', { offers: offer({ price: '629.95' }) }, { ok: false, reason: 'implausible_price' }, { policy: { ...policy, min_price_ratio: 0.95 } });
  await on('the merchant sets a looser ratio', { offers: offer({ price: '199.00' }) }, { ok: true, price: 199 }, { policy: { ...policy, min_price_ratio: 0.2 } });
  await on('no ratio set: half is the default', { offers: offer({ price: '199.00' }) }, { ok: false, reason: 'implausible_price' }, { policy: { trusted_domains: ['evo.com'] } });
  await on('a nonsense ratio falls back to half', { offers: offer({ price: '199.00' }) }, { ok: false, reason: 'implausible_price' }, { policy: { ...policy, min_price_ratio: 'low' } });
  await on('our own product has no list price', {}, { ok: false, reason: 'implausible_price' }, { product: { ...product, list: undefined } });
  await on('a higher price than ours is still a valid reading', { offers: offer({ price: '749.00' }) }, { ok: true, price: 749 });

  // When several things are wrong the first in this order is told: currency, stock, condition, product, price.
  await on('wrong currency and sold out', { offers: offer({ priceCurrency: 'EUR', availability: 'OutOfStock' }) }, { reason: 'currency_mismatch' });
  await on('sold out and used', { offers: offer({ availability: 'OutOfStock', itemCondition: 'UsedCondition' }) }, { reason: 'out_of_stock' });
  await on('used and another product', { name: 'Ski Poles', gtin13: undefined, mpn: undefined, offers: offer({ itemCondition: 'UsedCondition' }) }, { reason: 'not_new' });
  await on('another product and far too cheap', { name: 'Ski Poles', gtin13: undefined, mpn: undefined, offers: offer({ price: '19.00' }) }, { reason: 'different_product' });
}

section('identity: gtin, then mpn or sku with the brand, then the title');
{
  const on = (name, over, want, extra) => check(name, EVO, { [EVO]: page(ld(item(over))) }, want, extra);
  for (const gtin of ['0840123456784', '840123456784', '00840123456784', '0 840123 456784', '0840-1234-56784', 840123456784]) await on(`gtin ${JSON.stringify(gtin)}`, { gtin13: undefined, gtin, mpn: undefined, name: 'Board' }, { ok: true, match_by: 'gtin', match_score: 1 });
  for (const key of ['gtin8', 'gtin12', 'gtin13', 'gtin14']) await on(`identifier under ${key}`, { gtin13: undefined, [key]: '0840123456784', mpn: undefined, name: 'Board' }, { ok: true, match_by: 'gtin' });
  await on('a GTIN on the Offer', { gtin13: undefined, mpn: undefined, name: 'Board', offers: offer({ gtin13: '0840123456784' }) }, { ok: true, match_by: 'gtin' });
  await on('placeholder barcodes match nothing', { gtin13: '0000000000000', mpn: undefined, name: 'Board' }, { ok: false, reason: 'different_product' }, { product: { ...product, gtin: '0000000000000', mpn: null } });
  await on('a short number is not a GTIN', { gtin13: '12345', mpn: undefined, name: 'Board' }, { ok: false, reason: 'different_product' }, { product: { ...product, gtin: '12345', mpn: null } });

  await on('mpn in other letters, same brand', { gtin13: undefined, mpn: 'sv-complete-154', name: 'Board' }, { ok: true, match_by: 'mpn', match_score: 1 });
  await on('mpn, brand written longer', { gtin13: undefined, name: 'Board', brand: { '@type': 'Brand', name: 'SNOWBOARD VENDOR Inc.' } }, { ok: true, match_by: 'mpn' });
  await on('same mpn under another brand, another title', { gtin13: undefined, name: 'Board', brand: 'Other Maker' }, { ok: false, reason: 'different_product', match_by: null });
  await on('same mpn under another brand, same title', { gtin13: undefined, brand: 'Other Maker' }, { ok: true, match_by: 'title', match_score: 1 });
  await on('same mpn, no brand on the page', { gtin13: undefined, name: 'Board', brand: undefined }, { ok: false, reason: 'different_product' });
  await on('an mpn of two characters proves nothing', { gtin13: undefined, mpn: 'A1', name: 'Board' }, { ok: false, reason: 'different_product' }, { product: { ...product, gtin: null, mpn: 'A1' } });
  await on('sku with the brand', { gtin13: undefined, mpn: undefined, sku: 'cs-154', name: 'Board' }, { ok: true, match_by: 'sku', match_score: 1 }, { product: { ...product, sku: 'CS-154' } });
  await on('sku under another brand', { gtin13: undefined, mpn: undefined, sku: 'cs-154', name: 'Board', brand: 'Other Maker' }, { ok: false, reason: 'different_product' }, { product: { ...product, sku: 'CS-154' } });
  await on('gtin is preferred to mpn', {}, { ok: true, match_by: 'gtin' });
  await on('mpn is preferred to sku', { gtin13: undefined, sku: 'CS-154' }, { ok: true, match_by: 'mpn' }, { product: { ...product, sku: 'CS-154' } });

  // Jaccard over words: single letters dropped, numbers kept, 0.6 is enough.
  const titled = (name, theirs, want, ours = 'The Complete Snowboard') => on(name, { name: theirs, gtin13: undefined, mpn: undefined, sku: undefined }, want, { product: { ...anon, title: ours } });
  await titled('the same title', 'The Complete Snowboard', { ok: true, match_by: 'title', match_score: 1 });
  await titled('case, punctuation and accents do not count', 'THE COMPLETE-SNOWBOARD!', { ok: true, match_score: 1 });
  await titled('brand and year added: 3 of 5 words', 'Snowboard Vendor The Complete Snowboard 2026', { ok: true, match_by: 'title', match_score: 0.6 });
  await titled('three more words: 3 of 6', 'The Complete Snowboard Bindings Set Large', { ok: false, reason: 'different_product', match_by: null, match_score: 0.5, title: 'The Complete Snowboard Bindings Set Large' });
  await titled('another product of the brand', 'The Videographer Snowboard', { ok: false, reason: 'different_product', match_score: 0.5 });
  await titled('numbers are kept: model 2 is not model 3', 'Model 3 Board', { ok: false, reason: 'different_product', match_score: 0.5 }, 'Model 2 Board');
  await titled('single letters are dropped', 'Flying V Board', { ok: true, match_score: 1 }, 'Flying Board');
  await titled('accents are folded', 'Café Racer Édition', { ok: true, match_score: 1 }, 'Cafe Racer Edition');
  await titled('other scripts are compared too', 'Сноуборд Комплит 154', { ok: true, match_score: 1 }, 'сноуборд комплит 154');
  await titled('a page with no name', undefined, { ok: false, reason: 'different_product', match_score: 0, title: null });

  // Nothing to compare with: no request is made.
  const none = await check('our own product is empty', EVO, { [EVO]: page(ld(item())) }, { ok: false, reason: 'different_product' }, { product: {} });
  assert.equal(none.calls.length, 0);
}

section('hostile pages: every scan is one pass');
{
  const big = 1_400_000;
  const fill = (unit, size = big) => unit.repeat(Math.ceil(size / unit.length)).slice(0, size);
  const deep = n => `${'['.repeat(n)}${JSON.stringify(item())}${']'.repeat(n)}`;
  const hostile = {
    'script openers that never close': fill('<script'),
    'JSON-LD openers that never close': fill('<script type="application/ld+json">'),
    'JSON-LD blocks full of brackets': fill(`<script type="application/ld+json">${'['.repeat(400)}</script>`),
    'one JSON-LD block nested 100000 deep': `<script type="application/ld+json">${deep(100000)}</script>`,
    'a JSON-LD list of 300000 numbers': `<script type="application/ld+json">[${fill('1,', 600000)}1]</script>`,
    'a Product with 60000 offers': `<script type="application/ld+json">${JSON.stringify(item({ offers: Array.from({ length: 60000 }, (_, i) => ({ price: i + 1 })) }))}</script>`,
    'variants times offers times offers': `<script type="application/ld+json">${JSON.stringify(item({ offers: undefined, hasVariant: Array.from({ length: 150 }, () => ({ '@type': 'Product', offers: Array.from({ length: 150 }, () => ({ offers: [{}, {}] })) })) }))}</script>`,
    'meta openers that never close': fill('<meta '),
    'a meta tag that never ends': `<meta property="og:title" content="${fill('x')}`,
    'meta tags by the hundred thousand': fill('<meta property="og:title" content="x">'),
    'one tag with 200000 attributes': `<meta ${fill('a="b" ')}>`,
    'tags of 4000 characters: quotes that never pair up': fill(`<meta ${fill('a="b=\'c ', 4000)}>`),
    'tags of 4000 characters: bare words': fill(`<meta ${fill('aaaa ', 4000)}>`),
    'tags of 4000 characters: equals signs': fill(`<meta ${fill('= ', 4000)}>`),
    'tags of 4000 characters: nothing but spaces': fill(`<meta ${fill(' ', 4000)}>`),
    'tags of 4000 characters: one long word': fill(`<meta ${fill('a', 4000)}>`),
    'tags of 4000 characters stuffed with itemprops': fill(`<span ${fill('itemprop=price ', 4000)}>`),
    'itemprop without tags': fill('itemprop="price" '),
    'itemprop tags without prices': fill('<span itemprop=price>'),
    'itemprop after a megabyte of spaces': `<span ${fill(' ')}itemprop="price">`,
    'entities without end': `<meta property="og:title" content="${fill('&#x', 4000)}"><title>${fill('&amp', 300)}</title>`,
    'letters that grow when lowercased': `${fill('İ', 100000)}${ld(item())}`,
  };
  // The one page here that does parse: 60000 offers without a currency, of which the first few hundred are weighed.
  const parsed = { 'a Product with 60000 offers': 'currency_mismatch', 'letters that grow when lowercased': 'ok' };
  for (const [name, body] of Object.entries(hostile)) {
    assert.ok(body.length <= 1_500_000, `${name}: fits within maxBytes, so all of it is scanned`);
    const t0 = performance.now();
    const r = await verifyCompetingOffer(EVO, product, policy, { fetchFn: web({ [EVO]: body }).fetchFn, now: NOW });
    const ms = Math.round(performance.now() - t0);
    wellFormed(r, name);
    assert.equal(r.reason, parsed[name] ?? 'no_price_found', name);
    assert.ok(ms < 2000, `${name}: took ${ms} ms`);
    count++;
    console.log(`   ${r.reason.padEnd(17)} ${String(ms).padStart(5)} ms  ${(body.length / 1e6).toFixed(2)} MB  ${name}`);
  }
  // Indexes into the page still line up when lowercasing would change its length.
  assert.equal((await verifyCompetingOffer(EVO, product, policy, { fetchFn: web({ [EVO]: hostile['letters that grow when lowercased'] }).fetchFn })).ok, true);
  // A deeply nested Product is past the depth the walk goes to, and that is fine.
  assert.equal((await verifyCompetingOffer(EVO, product, policy, { fetchFn: web({ [EVO]: `<script type="application/ld+json">${deep(5)}</script>` }).fetchFn })).ok, true);
}

section('never throws, whatever it is handed');
{
  const good = web({ [EVO]: page(ld(item())) }).fetchFn;
  // Options that are not an object mean the default fetchFn, so a stand-in takes the place of the network here.
  let defaults = 0;
  globalThis.fetch = function (url, init) { assert.equal(this, undefined, 'the global fetch is called bare'); defaults++; return good(url, init); };
  const odd = [undefined, null, 0, 1, NaN, '', 'x', true, [], {}, () => {}, Symbol('s'), 10n, new Date(NaN), { title: {}, brand: [], gtin: {}, mpn: [], sku: () => {}, list: 'abc', currency: 7 }];
  let runs = 0;
  for (const v of odd) {
    for (const args of [[v, product, policy, { fetchFn: good }], [EVO, v, policy, { fetchFn: good }], [EVO, product, v, { fetchFn: good }], [EVO, product, policy, v], [v, v, v, v]]) {
      wellFormed(await verifyCompetingOffer(...args), `odd argument ${String(v)}`);
      runs++;
    }
    for (const key of ['fetchFn', 'now', 'ownHosts', 'allowLocal', 'timeoutMs', 'maxBytes']) {
      wellFormed(await verifyCompetingOffer(EVO, product, policy, { fetchFn: good, timeoutMs: 200, [key]: v }), `opts.${key} = ${String(v)}`);
      runs++;
    }
    for (const key of ['trusted_domains', 'blocked_domains', 'min_price_ratio']) {
      wellFormed(await verifyCompetingOffer(EVO, product, { ...policy, [key]: v }, { fetchFn: good }), `policy.${key} = ${String(v)}`);
      runs++;
    }
  }
  // Odd values inside the page as well.
  for (const v of [null, 0, '', 'x', [], {}, [[]], [null], { '@type': null }, { '@type': 'Offer', price: {} }, true]) {
    for (const key of ['name', 'brand', 'gtin13', 'mpn', 'sku', 'offers', 'hasVariant', '@type', 'itemCondition']) {
      wellFormed(await verifyCompetingOffer(EVO, product, policy, { fetchFn: web({ [EVO]: page(ld(item({ [key]: v }))) }).fetchFn }), `page ${key} = ${JSON.stringify(v)}`);
      runs++;
    }
    for (const key of ['price', 'priceCurrency', 'availability', 'itemCondition', 'priceSpecification', 'shippingDetails', 'url', 'offers']) {
      wellFormed(await verifyCompetingOffer(EVO, product, policy, { fetchFn: web({ [EVO]: page(ld(item({ offers: offer({ [key]: v }) }))) }).fetchFn }), `offer ${key} = ${JSON.stringify(v)}`);
      runs++;
    }
  }
  // now may be a number or a clock; a broken one falls back to the real time.
  assert.equal((await verifyCompetingOffer(EVO, product, policy, { fetchFn: good, now: () => NOW })).fetched_at, new Date(NOW).toISOString());
  assert.ok(Math.abs(Date.parse((await verifyCompetingOffer(EVO, product, policy, { fetchFn: good, now: () => { throw new Error('no clock'); } })).fetched_at) - Date.now()) < 5000);
  // A link may arrive as a URL object.
  assert.equal((await verifyCompetingOffer(new URL(EVO), product, policy, { fetchFn: good })).ok, true);
  // Without a fetchFn, or with null for one, the global fetch is used.
  const before = defaults;
  assert.equal((await verifyCompetingOffer(EVO, product, policy)).ok, true, 'the default fetchFn is the global fetch');
  assert.equal((await verifyCompetingOffer(EVO, product, policy, { fetchFn: null })).ok, true);
  assert.equal(defaults, before + 2);
  globalThis.fetch = fence;
  count += runs;
  console.log(`   ${runs} calls with odd arguments, options, policies and page values: every one came back as a result`);
}

assert.equal(strays, 0, 'no check reached for the real network');
assert.deepEqual([...seen.reasons].sort(), [...SPEC_REASONS].sort(), 'every reason code was produced');
assert.deepEqual([...seen.methods].sort(), [...METHODS].sort(), 'every extraction method produced an accepted offer');
console.log(`\nverify checks passed: ${count} cases, ${seen.reasons.size} reason codes, ${seen.methods.size} extraction methods`);

// Real pages, read with the defaults a deployed service would use. Shops change, so nothing
// here is asserted about prices or stock: only that each result is well formed.
if (process.argv.includes('--live')) {
  globalThis.fetch = realFetch;
  const live = [
    { note: 'a Shopify store reached through a redirect; JSON-LD ProductGroup, one variant per size', url: 'https://www.evo.com/snowboards/burton-custom-snowboard', product: { title: 'Burton Custom Snowboard', brand: 'Burton', gtin: '197183367874', mpn: null, sku: null, list: 679.95, currency: 'USD' } },
    { note: 'a Shopify store whose product page carries no product JSON-LD and is larger than maxBytes', url: 'https://www.brooklinen.com/products/essential-sheet-set', product: { title: 'Essential Sheet Set', brand: 'Brooklinen', gtin: null, mpn: null, sku: 'COR-CSS-Q1', list: 149, currency: 'USD' } },
    { note: 'not a Shopify store; JSON-LD Product near the end of a page of about a megabyte', url: 'https://www.ikea.com/us/en/p/billy-bookcase-black-oak-effect-00477337/', product: { title: 'BILLY Bookcase black oak effect', brand: 'IKEA', gtin: null, mpn: '004.773.37', sku: null, list: 59, currency: 'USD' } },
  ];
  console.log('\n== live pages (--live)');
  for (const { note, url, product: theirs } of live) {
    const requests = [];
    const fetchFn = async (input, init) => {
      const res = await fetch(input, init);
      requests.push(`${res.status} ${input}${res.headers.get('content-length') ? ` (${res.headers.get('content-length')} bytes)` : ''}`);
      return res;
    };
    const t0 = performance.now();
    const r = await verifyCompetingOffer(url, theirs, policy, { fetchFn });
    const ms = Math.round(performance.now() - t0);
    wellFormed(r, url);
    console.log(`\n   ${url}\n   ${note}`);
    console.log(`   looking for: ${theirs.title} (${[theirs.gtin && `gtin ${theirs.gtin}`, theirs.mpn && `mpn ${theirs.mpn}`, theirs.sku && `sku ${theirs.sku}`].filter(Boolean).join(', ')}), list ${theirs.list} ${theirs.currency}`);
    for (const line of requests) console.log(`   request: ${line}`);
    console.log(`   result in ${ms} ms: ${JSON.stringify(r, null, 2).replace(/\n/g, '\n   ')}`);
  }
  console.log('\nlive pages read: results above are what the shops returned at the time of the run');
}
