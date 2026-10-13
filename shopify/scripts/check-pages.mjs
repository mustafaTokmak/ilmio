// Checks the HTML doors, the stand-in storefront and the storefront script.
// Run: node shopify/scripts/check-pages.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as pages from '../offers/src/lib/pages.js';
import { decide, publicOffer, PRIORITIES } from '../offers/src/lib/policy.js';
import { mandateFor, listProducts } from '../offers/src/lib/mandates.js';

// A promise nobody caught is a bug in the script under test, so it fails the run.
process.on('unhandledRejection', e => { throw e; });

const ORIGIN = 'https://shop.test';
const DESK = /offer|agent|negoti|price[\s-]*match/i;
const EVIL = '"\'><script>alert(1)</script><img src=x onerror=alert(2)>';
const BOARD = mandateFor('demo', 'the-complete-snowboard');
const WAX = mandateFor('demo', 'selling-plans-ski-wax');
const V = BOARD.product.variant_numeric_id;
const W = WAX.product.variant_numeric_id;

// --- a stand-in for service.js, with the reply shapes of the build spec -------

// What the verifier would say about the test links, without fetching anything.
const EVIDENCE = {
  cheaper: { ok: true, reason: 'ok', domain: 'peakboards.demo', trusted_domain: true, match_by: 'gtin', price: 629.95, shipping: 0 },
  hostile: { ok: false, reason: 'different_product', reason_text: `the page shows ${EVIL}`, domain: 'evil.example' },
};

function fakeService({ shippingInAmount = true, unknown = 'that code is not known', base = ORIGIN } = {}) {
  const open = new Map();
  const minted = new Map();
  const calls = [];
  let n = 0;
  return {
    calls,
    async options({ shop, product }) { return { status: 'ok', shop, product }; },
    async request(input) {
      calls.push(['request', input]);
      const m = mandateFor(input.shop, input.product);
      if (!m) return { status: 'unknown_product', offers: [], notes: [], reason: 'This store does not sell that product.' };
      const evidence = input.competing_offer_url ? EVIDENCE[new URL(input.competing_offer_url).searchParams.get('variant')] ?? EVIDENCE.hostile : null;
      const d = decide(m, input, evidence);
      return {
        status: d.status,
        product: { title: m.product.title, handle: m.product.handle },
        list: m.product.list,
        question: d.question,
        offers: d.offers.map(o => {
          const offer_id = `of_${++n}`;
          open.set(offer_id, { m, o });
          return { offer_id, ...publicOffer(o), expires_at: new Date(Date.now() + 30 * 60000).toISOString() };
        }),
        notes: d.notes,
        proof: evidence ? { accepted: evidence.ok, domain: evidence.domain, their_price: evidence.price ?? null, compared: 'delivered price' } : null,
        next: 'Show these offers to the user. accept_offer turns the one they choose into a code.',
      };
    },
    async accept(input) {
      calls.push(['accept', input]);
      const hit = open.get(input.offer_id);
      if (!hit) return { status: 'not_found', reason: 'That offer is not open any more.' };
      if (input.user_approved !== true) return { status: 'needs_approval', reason: 'A code is issued only when the user has seen this offer and agreed to it.' };
      hit.code ||= `OFFER-${String(open.size + minted.size).padStart(2, '0')}K2M9Q`.slice(0, 14);
      minted.set(hit.code, hit);
      const gift = hit.o.components.find(c => c.type === 'gift');
      const lines = `${hit.m.product.variant_numeric_id}:${hit.o.quantity}${gift ? `,${gift.variant_id.split('/').pop()}:1` : ''}`;
      return {
        status: 'accepted',
        codes: [hit.code],
        cart_url: `${base}/demo/cart/${lines}?discount=${hit.code}`,
        apply: { ucp: `Send ${hit.code} in discounts.codes.`, webmcp: `Pass ${hit.code} to update_checkout.`, link: 'Open the cart link.' },
        terms: publicOffer(hit.o).components.map(c => c.label),
        expires_at: new Date(Date.now() + 60 * 60000).toISOString(),
        after_purchase: hit.o.components.filter(c => ['extended_returns', 'delivery_guarantee', 'next_order_credit'].includes(c.type)).map(c => c.label),
      };
    },
    async status() { return { status: 'open' }; },
    // The dry adapter's evaluate in miniature. A shipping saving is counted
    // either in the code's amount or in the shipping total: the cart page has
    // to add up both ways.
    async evaluateCart({ codes, cart }) {
      calls.push(['evaluateCart', { codes, cart }]);
      const applied = [], rejected = [];
      let off = 0;
      let method = cart.shipping_method || 'standard';
      let rate = BOARD.shipping[method].price;
      let shipping = rate;
      for (const code of codes) {
        const hit = minted.get(code);
        const line = hit && cart.lines.find(l => l.variant_numeric_id === hit.m.product.variant_numeric_id);
        if (!hit) { rejected.push({ code, reason: unknown }); continue; }
        if (!line || line.quantity < hit.o.quantity) { rejected.push({ code, reason: `needs ${hit.o.quantity} of ${hit.m.product.title} in the cart` }); continue; }
        if (!cart.shipping_method && hit.o.components.some(c => c.type === 'express_upgrade')) method = 'express';
        rate = hit.m.shipping[method].price;
        shipping = rate;
        let amount = hit.o.components.filter(c => c.type === 'price').reduce((a, c) => a + c.amount_off, 0);
        const gift = hit.o.components.find(c => c.type === 'gift');
        const giftLine = gift && cart.lines.find(l => l.variant_id === gift.variant_id);
        if (giftLine) amount += giftLine.price;
        const express = method === 'express' && hit.o.components.some(c => c.type === 'express_upgrade') ? rate - hit.m.shipping.standard.price : 0;
        const free = hit.o.components.some(c => c.type === 'free_shipping') ? Math.min(rate - express, hit.m.shipping.standard.price) : 0;
        if (shippingInAmount) amount += express + free;
        else shipping -= express + free;
        amount = Math.round(amount * 100) / 100;
        off += amount;
        applied.push({ code, title: hit.o.headline, amount });
      }
      shipping = Math.round(shipping * 100) / 100;
      return { applied, rejected, totals: { shipping_method: method, items_total: cart.items_total, shipping_total: shipping, total: Math.round((cart.items_total + shipping - off) * 100) / 100 } };
    },
  };
}

// --- calling a page ----------------------------------------------------------

function ctxFor(path, { hooks = [], prefix = '', method = 'GET', form, cookie, service = fakeService(), shop = 'demo', ...extra } = {}) {
  const url = new URL(prefix + path, ORIGIN);
  const headers = { 'user-agent': 'check-pages', 'cf-connecting-ip': '203.0.113.9' };
  if (cookie) headers.cookie = cookie;
  if (form) headers['content-type'] = 'application/x-www-form-urlencoded';
  const request = new Request(url, { method: form ? 'POST' : method, headers, body: form ? new URLSearchParams(form).toString() : undefined });
  return { url, request, env: {}, shop, service, hooks: new Set(hooks), origin: ORIGIN, prefix, ...extra };
}

async function get(name, path, options) {
  const res = await pages[name](ctxFor(path, options));
  assert.ok(res instanceof Response, `${name} returns a Response`);
  return { res, status: res.status, body: await res.text(), headers: Object.fromEntries(res.headers.entries()) };
}

// The attributes of the first tag in a piece of markup.
const attrsOf = tag => Object.fromEntries([...tag.slice(0, tag.indexOf('>')).matchAll(/([a-z-]+)(?:="([^"]*)")?/g)].slice(1).map(m => [m[1], m[2] ?? '']));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map(m => attrsOf(m[0]));
const unescape = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
const visible = html => html.replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<style\b[\s\S]*?<\/style>/g, '');

// What every page has to be: light only, no outside assets, one h1, labelled controls.
function wellFormed(name, html, { prefix = '' } = {}) {
  assert.ok(html.startsWith('<!doctype html>\n<html lang="en">'), `${name}: doctype and language`);
  assert.equal(tags(html, 'meta').filter(m => m.name === 'color-scheme' && m.content === 'light only').length, 1, `${name}: light only meta`);
  assert.match(html, /:root\{color-scheme:light only/, `${name}: light only in CSS`);
  assert.doesNotMatch(html, /prefers-color-scheme/, `${name}: no dark media query`);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${name}: one h1`);
  assert.equal((html.match(/<main[\s>]/g) || []).length, 1, `${name}: one main`);
  assert.match(html, /<title>[^<]+<\/title>/, `${name}: a title`);
  assert.doesNotMatch(html, /<(link|img|iframe|object|embed|video|audio|base)\b/, `${name}: no outside assets`);
  assert.doesNotMatch(html, /@import|url\(/, `${name}: no assets from CSS`);
  for (const s of tags(html, 'script')) assert.ok(s.type === 'application/ld+json' || s.src === `${prefix}/embed.js`, `${name}: only data blocks and the storefront script`);
  assert.doesNotMatch(html, /\son[a-z]+="/, `${name}: no inline handlers`);
  const labelled = new Set(tags(html, 'label').map(l => l.for).filter(Boolean));
  const wrapped = new Set([...html.matchAll(/<label\b[^>]*>\s*(<input\b[^>]*>)/g)].map(m => m[1]));
  for (const m of html.matchAll(/<(?:input|select)\b[^>]*>/g)) {
    const a = attrsOf(m[0]);
    if (a.type === 'hidden') continue;
    assert.ok(labelled.has(a.id) || wrapped.has(m[0]), `${name}: control ${a.name} has a label`);
  }
  for (const m of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) assert.ok(m[1].replace(/<[^>]+>/g, '').trim(), `${name}: a button says what it does`);
  const ids = tags(html, '[a-z0-9]+').map(t => t.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, `${name}: ids are unique`);
  // Every address the page points at stays under the proxy prefix or leaves the site on purpose.
  for (const t of [...tags(html, 'a'), ...tags(html, 'form'), ...tags(html, 'script')]) {
    const target = t.href ?? t.action ?? t.src;
    if (target === undefined) continue;
    assert.ok(/^https:\/\//.test(target) || target.startsWith(`${prefix}/`), `${name}: ${target} respects the prefix`);
  }
}

// Nothing a request sent may come back as markup.
function harmless(name, text) {
  assert.ok(!text.includes(EVIL), `${name}: the payload is not echoed as it came`);
  assert.doesNotMatch(text, /<script>alert|<img\b|"'>/, `${name}: no markup from a request`);
  assert.doesNotMatch(text, /href="javascript:/i, `${name}: no script addresses`);
}

// Runs something that is meant to log a failure, and hands back what it logged.
async function logged(run) {
  const { error, warn } = console;
  const lines = [];
  console.error = console.warn = (...args) => lines.push(args.map(String).join(' '));
  try { return { out: await run(), lines }; } finally { Object.assign(console, { error, warn }); }
}

const seen = [];
const page = async (name, path, options = {}) => {
  const out = await get(name, path, options);
  wellFormed(`${name} ${path}`, out.body, options);
  seen.push(out.body);
  return out;
};

// --- the exports -------------------------------------------------------------

const NAMES = ['offerForm', 'offerResult', 'offerAccepted', 'demoHome', 'demoProduct', 'demoCart', 'demoCheckout', 'demoPolicies', 'rivalProduct', 'adminLog', 'llmsTxt', 'offersJson', 'openapiJson'];
assert.deepEqual(Object.keys(pages).sort(), [...NAMES].sort(), 'pages.js exports one function per page and nothing else');
for (const name of NAMES) assert.equal(typeof pages[name], 'function');

// --- the control arm -----------------------------------------------------------

const HANDLES = listProducts('demo').map(m => m.product.handle);
const storefront = [
  ['demoHome', '/demo'],
  ...HANDLES.map(h => ['demoProduct', `/demo/products/${h}`]),
  ['demoProduct', '/demo/products/no-such-board'],
  ['demoCart', '/demo/cart/empty'],
  ['demoCart', '/demo/cart'],
  ['demoCart', `/demo/cart/${V}:1`],
  ['demoCart', `/demo/cart/${V}:2,${W}:3?ship=express`],
  ['demoCart', `/demo/cart/${V}:1?discount=SAVE10`],
  ['demoCart', `/demo/cart/${V}:1?discount=not%20a%20code!`],
  ['demoCart', `/demo/cart/${V}:50,toaster:1`],
  ['demoCheckout', `/demo/checkout?cart=${V}:1`],
  ['demoCheckout', `/demo/checkout?cart=${V}:1,${W}:2&ship=express&discount=SAVE10`],
  ['demoCheckout', '/demo/checkout'],
  ['demoPolicies', '/demo/policies'],
];
const control = {};
for (const [name, path] of storefront) {
  const out = await page(name, path, { cookie: `pl_cart=${encodeURIComponent(`${W}:1||`)}` });
  assert.equal(out.status, path.includes('no-such') ? 404 : 200, `${name} ${path}`);
  assert.doesNotMatch(out.body, DESK, `control arm ${path} says nothing about the desk`);
  assert.doesNotMatch(JSON.stringify(out.headers), DESK, `control arm ${path} headers`);
  control[path] = (await get(name, path)).body;
}
assert.match(control[`/demo/cart/${V}:1?discount=SAVE10`], /<code>SAVE10<\/code> is not applied[.:]\s+[tT]hat code is not known\./);
// A refusal the desk worded in its own terms does not reach the control arm; with a hook on it does.
{
  const service = fakeService({ unknown: 'unknown offer code' });
  const quiet = await get('demoCart', `/demo/cart/${V}:1?discount=SAVE10`, { service });
  assert.match(quiet.body, /<code>SAVE10<\/code> is not applied[.:]\s+[iI]t cannot be used on this cart\./);
  assert.doesNotMatch(quiet.body, DESK);
  assert.match((await get('demoCart', `/demo/cart/${V}:1?discount=SAVE10`, { service, hooks: ['box'] })).body, /is not applied[.:]\s+[uU]nknown offer code\./);
}
// An arm switched off in the URL stays off on the next click.
for (const hooks of ['', 'none']) {
  const out = await page('demoProduct', `/demo/products/${HANDLES[0]}?hooks=${hooks}`, { hooks: hooks ? [hooks] : [] });
  assert.doesNotMatch(out.body, DESK);
  for (const a of tags(out.body, 'a')) assert.ok(a.href.endsWith(`hooks=${hooks}`), `${a.href} keeps the switch`);
  assert.ok(tags(out.body, 'input').some(i => i.type === 'hidden' && i.name === 'hooks' && i.value === hooks), 'the add-to-cart form keeps the switch');
}
console.log(`control arm: ${storefront.length} storefront pages say nothing about offers`);

// --- each hook adds its own element and nothing else ------------------------------

const productPath = `/demo/products/${HANDLES[0]}`;
const ELEMENT = {
  box: /<aside class="callout" data-hook="box"[\s\S]*?<\/aside>\n/g,
  desc: /<p data-hook="desc">[\s\S]*?<\/p>\n/g,
  jsonld: /<script type="application\/ld\+json">[\s\S]*?<\/script>\n/g,
  webmcp: /<script src="[^"]*\/embed\.js"[^>]*><\/script>\n/g,
  policy: /<section data-hook="policy"[\s\S]*?<\/section>\n/g,
};
const only = async (hook, name, path) => {
  const { body } = await page(name, path, { hooks: [hook] });
  const found = body.match(ELEMENT[hook]) || [];
  assert.equal(found.length, 1, `${hook} adds one element to ${path}`);
  assert.equal(body.replace(ELEMENT[hook], ''), control[path], `${hook} adds nothing else to ${path}`);
  return found[0];
};
const box = await only('box', 'demoProduct', productPath);
assert.match(box, /Ask this store for an offer/);
assert.deepEqual(tags(box, 'a').map(a => a.href), [`/offer?product=${HANDLES[0]}`]);
const desc = await only('desc', 'demoProduct', productPath);
assert.ok(desc.includes(`${ORIGIN}/offer?product=${HANDLES[0]}`), 'the description names the offer address in full');
const [product] = jsonLd(await only('jsonld', 'demoProduct', productPath));
assert.equal(product['@type'], 'Product');
assert.equal(product.offers.price, '699.95');
assert.equal(product.offers.shippingDetails.shippingRate.value, '19.90');
assert.equal(product.gtin13, BOARD.product.gtin);
assert.deepEqual(product.potentialAction.target.map(t => [t.httpMethod, t.urlTemplate]), [['GET', `${ORIGIN}/offer?product=${HANDLES[0]}`], ['POST', `${ORIGIN}/api/offers/request`]]);
const embedTag = attrsOf(await only('webmcp', 'demoProduct', productPath));
assert.deepEqual(embedTag, { src: '/embed.js', defer: '', 'data-hook': 'webmcp', 'data-endpoint': ORIGIN, 'data-shop': 'demo', 'data-product': HANDLES[0] });
const policy = await only('policy', 'demoPolicies', '/demo/policies');
assert.ok(policy.includes(`${ORIGIN}/offer`));
// The storefront script loads on every shop page but checkout, as an app embed would.
for (const [name, path] of [['demoHome', '/demo'], ['demoCart', `/demo/cart/${V}:1`], ['demoPolicies', '/demo/policies']]) {
  assert.equal(attrsOf(await only('webmcp', name, path))['data-product'], undefined, `${path} has no product to name`);
}
// A hook changes only the page it belongs to.
for (const [name, path] of storefront) {
  const inert = name === 'demoProduct' && !path.includes('no-such') ? ['policy'] : name === 'demoPolicies' ? ['box', 'desc', 'jsonld'] : name === 'demoCheckout' ? ['box', 'desc', 'jsonld', 'policy', 'webmcp'] : ['box', 'desc', 'jsonld', 'policy'];
  assert.equal((await get(name, path, { hooks: inert })).body, control[path], `${inert} leave ${path} alone`);
}
const all = (await page('demoProduct', productPath, { hooks: ['box', 'desc', 'jsonld', 'webmcp', 'policy'] })).body;
for (const hook of ['box', 'desc', 'jsonld', 'webmcp']) assert.equal((all.match(ELEMENT[hook]) || []).length, 1, `${hook} with the others on`);
console.log('hooks: box, desc, jsonld, webmcp and policy each add one element');

// --- the offer desk: forms post where the routes expect ---------------------------

const formsOf = html => tags(html, 'form').map(f => `${f.method} ${f.action}`);
for (const prefix of ['', '/apps/offerad']) {
  const service = fakeService({ base: ORIGIN + prefix });
  const at = path => `${prefix}${path}`;

  const form = await page('offerForm', `/offer?product=${HANDLES[0]}`, { prefix, service });
  assert.deepEqual(formsOf(form.body), [`post ${at('/offer')}`]);
  const fields = tags(form.body, 'input');
  assert.deepEqual(fields.filter(i => i.type === 'hidden').map(i => [i.name, i.value]), [['shop', 'demo'], ['product', HANDLES[0]]]);
  assert.deepEqual(fields.filter(i => i.type === 'radio').map(i => i.value), ['', ...Object.keys(PRIORITIES)]);
  assert.deepEqual(fields.filter(i => !['hidden', 'radio'].includes(i.type)).map(i => [i.name, i.type]), [['quantity', 'number'], ['need_by_days', 'number'], ['competing_offer_url', 'url']]);
  assert.match(form.body, /Listed price \$699\.95\. Standard delivery in 6 days for \$19\.90\./);
  assert.match(form.body, /Asking is free, nothing is bought or reserved/);
  // With no product named the form asks for one.
  const chooser = await page('offerForm', '/offer', { prefix, service });
  assert.deepEqual(tags(chooser.body, 'option').map(o => o.value), ['', ...HANDLES]);

  const result = await page('offerResult', '/offer', { prefix, service, form: { shop: 'demo', product: HANDLES[0], priority: 'lowest_price', quantity: '1' } });
  const asked = service.calls.at(-1)[1];
  assert.deepEqual({ shop: asked.shop, product: asked.product, quantity: asked.quantity, priority: asked.priority }, { shop: 'demo', product: HANDLES[0], quantity: 1, priority: 'lowest_price' });
  assert.match(asked.session, /^page:[0-9a-f]{24}$/, 'the door supplies a stable session');
  assert.equal(asked.client.ip, '203.0.113.9');
  const offers = [...result.body.matchAll(/name="offer_id" value="([^"]+)"/g)].map(m => m[1]);
  assert.equal(offers.length, 2);
  assert.deepEqual(formsOf(result.body), [`post ${at('/offer/accept')}`, `post ${at('/offer/accept')}`, `post ${at('/offer')}`]);
  assert.equal(tags(result.body, 'input').filter(i => i.name === 'user_approved' && i.type === 'checkbox' && i.value === 'true' && 'required' in i).length, 2);
  assert.match(result.body, /<h3 id="offer-1">\$112 off<\/h3>/);
  assert.match(result.body, /<dt class="total">Total<\/dt><dd class="total">\$607\.85<\/dd>/);
  assert.match(result.body, /Accept this offer<span class="vh">: \$112 off<\/span>/);

  // Accepting needs the box ticked; ticked, it gives the code and the cart link.
  const unticked = await page('offerAccepted', '/offer/accept', { prefix, service, form: { shop: 'demo', offer_id: offers[0] } });
  assert.equal(service.calls.at(-1)[1].user_approved, false);
  assert.doesNotMatch(unticked.body, /OFFER-/);
  assert.deepEqual(formsOf(unticked.body), [`post ${at('/offer/accept')}`]);
  for (const sloppy of ['yes', 'on', '1']) {
    await get('offerAccepted', '/offer/accept', { prefix, service, form: { offer_id: offers[0], user_approved: sloppy } });
    assert.equal(service.calls.at(-1)[1].user_approved, false, `"${sloppy}" is not approval`);
  }
  const accepted = await page('offerAccepted', '/offer/accept', { prefix, service, form: { shop: 'demo', offer_id: offers[0], user_approved: 'true' } });
  const code = accepted.body.match(/<code>(OFFER-[A-Z0-9]+)<\/code>/)[1];
  const cartLink = tags(accepted.body, 'a').find(a => a.href.includes('/demo/cart/')).href;
  assert.equal(cartLink, `${ORIGIN}${at(`/demo/cart/${V}:1`)}?discount=${code}`);
  assert.match(accepted.body, /<li>\$112 off<\/li>/);
  assert.match(accepted.body, /Valid until <time datetime="[^"]+">[^<]+ UTC<\/time> \(in about 60 minutes\)/);
  const again = await get('offerAccepted', '/offer/accept', { prefix, service, form: { offer_id: offers[0], user_approved: 'true' } });
  assert.ok(again.body.includes(code), 'accepting twice shows the same code');

  // The storefront's own forms.
  const shop = await page('demoProduct', productPath, { prefix, service });
  assert.deepEqual(formsOf(shop.body), [`get ${at(`/demo/cart/${V}:1`)}`]);
  const cart = await page('demoCart', `/demo/cart/${V}:1,${W}:2`, { prefix, service });
  assert.deepEqual(formsOf(cart.body), [`get ${at(`/demo/cart/${V}:1,${W}:2`)}`, `get ${at(`/demo/cart/${V}:1,${W}:2`)}`, `get ${at('/demo/checkout')}`]);
  assert.deepEqual(tags(cart.body, 'input').filter(i => i.type !== 'hidden').map(i => i.name), [`q_${V}`, `q_${W}`, 'ship', 'ship', 'discount']);
}
console.log('offer desk: the form, the offer cards and the accept step post to /offer and /offer/accept, with and without the proxy prefix');

// --- the desk says what the service said ---------------------------------------

{
  const service = fakeService();
  const rival = `${ORIGIN}/rival/products/${HANDLES[0]}?variant=cheaper`;
  const matched = await page('offerResult', '/offer', { service, form: { product: HANDLES[0], priority: 'lowest_price', competing_offer_url: rival } });
  assert.equal(service.calls.at(-1)[1].competing_offer_url, rival);
  assert.match(matched.body, /<h1>The price is matched<\/h1>/);
  assert.match(matched.body, /<li>Checked peakboards\.demo: their delivered price is \$629\.95\. We match it\.<\/li>/);
  assert.match(matched.body, /<li>Shop checked: peakboards\.demo\.<\/li><li>Their price: \$629\.95\.<\/li>/);
  assert.match(matched.body, /<dd class="total">\$629\.95<\/dd>/);
  // No priority: the reply's question is put to the reader, above the same form.
  const open = await page('offerResult', '/offer', { service, form: { product: HANDLES[0] } });
  assert.equal(service.calls.at(-1)[1].priority, undefined);
  assert.match(open.body, /What matters most to your user for this purchase\?/);
  // A bad field never reaches the service.
  const before = service.calls.length;
  const bad = await page('offerResult', '/offer', { service, form: { product: HANDLES[0], quantity: 'two', competing_offer_url: 'javascript:alert(1)' } });
  assert.equal(bad.status, 400);
  assert.equal(service.calls.length, before);
  assert.match(bad.body, /Quantity is a whole number, 1 or more\./);
  assert.match(bad.body, /The link to the other shop starts with https:\/\/\./);
  assert.equal((await page('offerResult', '/offer', { service, form: {} })).status, 400);
  // Out of stock, an unknown product, an unknown shop, a service that throws.
  assert.match((await page('offerResult', '/offer', { service, form: { product: HANDLES[0], quantity: '99' } })).body, /<li>Only 10 in stock\.<\/li>/);
  assert.match((await page('offerResult', '/offer', { service, form: { product: 'toaster' } })).body, /This store does not sell that product\./);
  assert.equal((await page('offerForm', '/offer', { shop: 'nobody.myshopify.com' })).status, 404);
  const { out: broken, lines } = await logged(() => page('offerResult', '/offer', { service: { request: async () => { throw new Error('floor is 545'); } }, form: { product: HANDLES[0] } }));
  assert.equal(broken.status, 502);
  assert.doesNotMatch(broken.body, /545/, 'what broke stays in the log');
  assert.match(lines.join('\n'), /floor is 545/);
  assert.ok(broken.body.includes(`Reference ${lines[0].match(/offerad page (\w+)/)[1]}.`), 'the page and the log share a reference');
  assert.equal((await page('offerAccepted', '/offer/accept', { service, form: {} })).status, 400);
  assert.match((await page('offerAccepted', '/offer/accept', { service, form: { offer_id: 'of_gone', user_approved: 'true' } })).body, /That offer is not open any more\./);
  // A worker that already read the body hands it over.
  await get('offerResult', '/offer', { service, method: 'POST', body: { product: HANDLES[1], priority: 'extras' } });
  assert.deepEqual([service.calls.at(-1)[1].product, service.calls.at(-1)[1].priority], [HANDLES[1], 'extras']);
  // And one that supplies the session keeps it.
  await get('offerResult', '/offer', { service, form: { product: HANDLES[0] }, session: 'mcp:abc', client: { ip: '198.51.100.7' } });
  assert.deepEqual([service.calls.at(-1)[1].session, service.calls.at(-1)[1].client.ip], ['mcp:abc', '198.51.100.7']);
}
console.log('offer desk: notes, proof, the question, refusals and failures are shown as the service gave them');

// --- the cart really applies a code -------------------------------------------

for (const shippingInAmount of [true, false]) {
  const service = fakeService({ shippingInAmount });
  const total = html => Number(tags(html, 'dd').find(d => 'data-total' in d)['data-total']);
  const dollars = s => Number(s.replace(/[^0-9.-]/g, ''));
  // The rows of the summary, as numbers: they have to add up to the total shown.
  const rows = html => {
    const list = html.match(/<dl class="sums">([\s\S]*?)<\/dl>/)[1];
    const values = [...list.matchAll(/<dd[^>]*>([^<]*)<\/dd>/g)].map(m => (m[1] === 'Free' ? 0 : dollars(m[1])));
    return { sum: Math.round(values.slice(0, -1).reduce((a, x) => a + x, 0) * 100) / 100, total: values.at(-1) };
  };
  for (const priority of Object.keys(PRIORITIES)) {
    const reply = await service.request({ shop: 'demo', product: HANDLES[0], priority });
    for (const offer of reply.offers) {
      const { cart_url: link, codes: [code] } = await service.accept({ offer_id: offer.offer_id, user_approved: true });
      const cart = await page('demoCart', link, { service });
      assert.equal(total(cart.body), offer.total, `${priority}: the cart charges what "${offer.headline}" promised`);
      assert.deepEqual(rows(cart.body), { sum: offer.total, total: offer.total }, `${priority}: the rows add up`);
      assert.ok(cart.body.includes(`<code>${code}</code> is applied.`));
      const checkout = await page('demoCheckout', `/demo/checkout?cart=${link.split('/').pop().replace('?', '&')}`, { service });
      assert.equal(total(checkout.body), offer.total, `${priority}: checkout shows the same total`);
      assert.match(checkout.body, /The order would be placed here\./);
      // Express chosen in the cart: an upgrade in the offer brings it back to the standard rate.
      const express = await page('demoCart', `${link}&ship=express`, { service });
      const upgraded = offer.components.some(c => c.type === 'express_upgrade');
      assert.equal(total(express.body), Math.round((offer.total + (upgraded ? 0 : 20)) * 100) / 100, `${priority}: express costs ${upgraded ? 'nothing more' : 'the difference'}`);
      assert.equal(rows(express.body).sum, total(express.body));
    }
  }
  // A code for the board does nothing for a cart of wax, and the cart says why.
  const [offer] = (await service.request({ shop: 'demo', product: HANDLES[0], priority: 'lowest_price' })).offers;
  const { codes: [code] } = await service.accept({ offer_id: offer.offer_id, user_approved: true });
  const wrong = await page('demoCart', `/demo/cart/${W}:1?discount=${code}`, { service, hooks: ['box'] });
  assert.equal(total(wrong.body), 44.85);
  assert.match(wrong.body, /is not applied[.:]\s+[nN]eeds 1 of The Complete Snowboard in the cart\./);
  // Removing the code is one link away.
  const withCode = await page('demoCart', `/demo/cart/${V}:1?discount=${code}`, { service });
  assert.ok(tags(withCode.body, 'a').some(a => a.href === `/demo/cart/${V}:1`), 'a link takes the code off');
}
{
  // No evaluator wired, or one that throws: the code is refused and the cart charges list price.
  for (const service of [{}, { evaluateCart: async () => { throw new Error('down'); } }]) {
    const { out: cart, lines } = await logged(() => page('demoCart', `/demo/cart/${V}:1?discount=OFFER-7K2M9Q`, { service, hooks: ['box'] }));
    assert.match(cart.body, /<code>OFFER-7K2M9Q<\/code> is not applied[.:]\s+[iI]t could not be checked just now\./);
    assert.match(cart.body, /data-total="719\.85"/);
    assert.equal(lines.length, service.evaluateCart ? 1 : 0, 'a failing evaluator is logged');
  }
  // The two-argument form of the adapter's evaluate works as well.
  let got = null;
  const service = { evaluateCart(codes, cart) { got = { codes, cart }; return { applied: [{ code: 'OFFER-7K2M9Q', title: '$70 off', amount: 70 }], rejected: [], totals: { total: 649.85 } }; } };
  assert.match((await page('demoCart', `/demo/cart/${V}:1?discount=offer-7k2m9q`, { service })).body, /data-total="649\.85"/);
  assert.deepEqual(got.codes, ['OFFER-7K2M9Q']);
  assert.deepEqual(got.cart.lines, [{ variant_id: BOARD.product.variant_id, variant_numeric_id: V, handle: HANDLES[0], title: 'The Complete Snowboard', quantity: 1, price: 699.95 }]);
  assert.equal(got.cart.shipping_method, undefined); // No explicit selection: the evaluator may choose the offer's rate.
  assert.deepEqual([got.cart.items_total, got.cart.currency, got.cart.shop], [699.95, 'USD', 'demo']);
  // An evaluation whose total cannot be right is not believed.
  const wild = { evaluateCart: async () => ({ applied: [{ code: 'OFFER-7K2M9Q', title: 'x', amount: 70 }], totals: { total: 1 } }) };
  const { out: doubted, lines: doubts } = await logged(() => page('demoCart', `/demo/cart/${V}:1?discount=OFFER-7K2M9Q`, { service: wild }));
  assert.match(doubted.body, /data-total="649\.85"/);
  assert.match(doubts[0], /do not add up/);
  // A code the evaluation did not name is not applied.
  const silent = { evaluateCart: async () => ({ applied: [{ code: 'OTHER', amount: 500 }], rejected: [] }) };
  assert.match((await page('demoCart', `/demo/cart/${V}:1?discount=OFFER-7K2M9Q`, { service: silent })).body, /data-total="719\.85"/);
}
console.log('cart: codes are checked through the service and the totals add up, whichever way a shipping saving is counted');

// --- the cart behaves like a cart ---------------------------------------------

{
  const hop = async (path, cookie) => {
    const res = await pages.demoCart(ctxFor(path, { cookie }));
    return { status: res.status, location: res.headers.get('location'), cookie: (res.headers.get('set-cookie') || '').split(';')[0], setCookie: res.headers.get('set-cookie') };
  };
  const first = await hop(`/demo/cart/${V}:1?quantity=2`);
  assert.deepEqual([first.status, first.location], [302, `/demo/cart/${V}:2`]);
  assert.match(first.setCookie, /^pl_cart=[^;]+; Path=\/demo; SameSite=Lax; HttpOnly; Secure$/);
  // The next product joins the cart the visitor already has.
  const second = await hop(`/demo/cart/${W}:1?quantity=3`, first.cookie);
  assert.equal(second.location, `/demo/cart/${V}:2,${W}:3`);
  assert.equal((await hop(`/demo/cart/${V}:1?quantity=1`, second.cookie)).location, `/demo/cart/${W}:3,${V}:3`);
  // The header link on any page leads back to it.
  assert.ok(tags((await get('demoHome', '/demo', { cookie: second.cookie })).body, 'a').some(a => a.href === `/demo/cart/${V}:2,${W}:3`));
  assert.match((await get('demoHome', '/demo', { cookie: second.cookie })).body, /Cart \(5\)/);
  // Update and remove.
  assert.equal((await hop(`/demo/cart/${V}:2,${W}:3?q_${V}=1&q_${W}=0&ship=express&discount=SAVE10`)).location, `/demo/cart/${V}:1?discount=SAVE10&ship=express`);
  const emptied = await hop(`/demo/cart/${V}:2?q_${V}=0`);
  assert.equal(emptied.location, '/demo/cart/empty');
  assert.match(emptied.setCookie, /Max-Age=0/);
  // A cart link replaces what was there, as a Shopify cart permalink does.
  const linked = await get('demoCart', `/demo/cart/${V}:1`, { cookie: second.cookie });
  assert.match(linked.body, /Cart \(1\)/);
  assert.match(linked.headers['set-cookie'], new RegExp(`^pl_cart=${V}%3A1`));
  // More than the shop has, and things it does not sell.
  const over = await get('demoCart', `/demo/cart/${V}:50,toaster:1`);
  assert.match(over.body, /The Complete Snowboard: quantity set to 10, the most we have\./);
  assert.match(over.body, /One item in this link is not sold here and was left out\./);
  assert.match(over.body, /data-total="7,?019\.40"|data-total="7019\.40"/);
  // A handle works where a variant id does.
  assert.match((await get('demoCart', `/demo/cart/${HANDLES[0]}:2`)).body, /data-total="1419\.80"/);
  // Under the proxy prefix the cookie and the redirect stay under it.
  const proxied = await pages.demoCart(ctxFor(`/demo/cart/${V}:1?quantity=1&hooks=box`, { prefix: '/apps/offerad' }));
  assert.equal(proxied.headers.get('location'), `/apps/offerad/demo/cart/${V}:1?hooks=box`);
  assert.match(proxied.headers.get('set-cookie'), /Path=\/apps\/offerad\/demo;/);
}
console.log('cart: add, merge, update, remove, stock and cart links behave');

// --- Peak Boards ----------------------------------------------------------------

for (const m of listProducts('demo')) {
  const { handle, list, gtin, title } = m.product;
  const at = async variant => {
    const out = await page('rivalProduct', `/rival/products/${handle}${variant ? `?variant=${variant}` : ''}`);
    const [data] = jsonLd(out.body);
    assert.equal(data['@type'], 'Product');
    assert.equal(data.offers.itemCondition, 'https://schema.org/NewCondition');
    assert.equal(data.offers.priceCurrency, 'USD');
    assert.equal(data.offers.seller.name, 'Peak Boards');
    assert.ok(out.body.includes(`<p class="price">$${Number(data.offers.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>`), 'the page shows the price its data states');
    assert.match(out.body, /Peak Boards/);
    assert.match(out.body, /peakboards\.demo/);
    assert.doesNotMatch(visible(out.body), DESK, 'the other shop knows nothing of the desk');
    assert.doesNotMatch(out.body, /Powder Lab|\/demo|<form|<button/, 'and is a shop of its own with nothing to order');
    return data;
  };
  const cheaper = await at('cheaper');
  assert.deepEqual([cheaper.name, cheaper.gtin, cheaper.offers.availability, cheaper.offers.shippingDetails.shippingRate.value], [title, gtin, 'https://schema.org/InStock', '0.00']);
  assert.ok(Number(cheaper.offers.price) < list);
  const much = await at('much-cheaper');
  assert.ok(Number(much.offers.price) < Number(cheaper.offers.price) && Number(much.offers.price) >= list * 0.5, 'far below, yet above the half-price line a verifier calls implausible');
  assert.equal(much.offers.shippingDetails, undefined, 'no shipping stated: item prices are compared');
  const gone = await at('out-of-stock');
  assert.deepEqual([gone.offers.availability, gone.offers.price], ['https://schema.org/OutOfStock', cheaper.offers.price]);
  const other = await at('different-product');
  assert.ok(other.name !== title && other.gtin !== gtin && other.mpn !== m.product.mpn);
  assert.ok(Number(other.offers.price) >= list * 0.5);
  const plain = await at('');
  assert.ok(Number(plain.offers.price) > list, 'the plain page is not cheaper');
  assert.deepEqual(await at('much_cheaper'), much, 'the variant may be spelled with an underscore');
  if (handle === HANDLES[0]) {
    assert.deepEqual([cheaper.offers.price, much.offers.price], ['629.95', '459.00']);
    assert.equal(cheaper.url, `${ORIGIN}/rival/products/${handle}?variant=cheaper`);
  }
}
assert.equal((await page('rivalProduct', '/rival/products/no-such-board')).status, 404);
console.log('rival shop: cheaper, much-cheaper, out-of-stock and different-product pages state what they show');

// --- documents for programs ------------------------------------------------------

for (const prefix of ['', '/apps/offerad']) {
  const base = ORIGIN + prefix;
  const txt = await get('llmsTxt', '/llms.txt', { prefix });
  assert.equal(txt.headers['content-type'], 'text/plain; charset=utf-8');
  assert.equal(txt.headers['access-control-allow-origin'], '*');
  assert.ok(txt.body.startsWith('# Powder Lab offer desk\n\n> '));
  for (const line of [`${base}/mcp `, `GET ${base}/api/offers/options?product={product}`, `POST ${base}/api/offers/request`, `POST ${base}/api/offers/accept`, `${base}/offer?product={product}`, `${base}/openapi.json`, `${base}/.well-known/offers.json`, `[The Complete Snowboard](${base}/demo/products/${HANDLES[0]}): $699.95`]) {
    assert.ok(txt.body.includes(line), `llms.txt names ${line}`);
  }
  for (const id of Object.keys(PRIORITIES)) assert.ok(txt.body.includes(`- ${id}: `));

  const offers = JSON.parse((await get('offersJson', '/.well-known/offers.json', { prefix })).body);
  assert.equal(offers.doors.mcp.url, `${base}/mcp`);
  assert.deepEqual(Object.values(offers.doors.http).map(d => d.url ?? d), [`${base}/openapi.json`, `${base}/api/offers/options`, `${base}/api/offers/request`, `${base}/api/offers/accept`, `${base}/api/offers/status`]);
  assert.deepEqual(offers.priorities.map(p => p.id), Object.keys(PRIORITIES));
  assert.deepEqual(offers.products.map(p => p.handle), HANDLES);
  assert.deepEqual(Object.keys(offers.products[0]), ['handle', 'title', 'list', 'currency', 'url']);

  const api = JSON.parse((await get('openapiJson', '/openapi.json', { prefix })).body);
  assert.equal(api.openapi, '3.1.0');
  assert.deepEqual(api.servers, [{ url: base }]);
  assert.deepEqual(Object.entries(api.paths).map(([path, ops]) => `${Object.keys(ops)} ${path}`), ['get /api/offers/options', 'post /api/offers/request', 'post /api/offers/accept', 'get /api/offers/status']);
  assert.deepEqual(api.components.schemas.OfferRequest.properties.priority.enum, Object.keys(PRIORITIES));
  assert.deepEqual(api.components.schemas.AcceptRequest.required, ['offer_id', 'user_approved']);
  for (const op of Object.values(api.paths).flatMap(Object.values)) {
    for (const use of JSON.stringify(op).match(/#\/components\/schemas\/\w+/g) || []) assert.ok(api.components.schemas[use.split('/').pop()], `${use} is defined`);
  }
  seen.push(txt.body, JSON.stringify(offers), JSON.stringify(api));
}
// A real store's documents point at its own storefront.
const real = JSON.parse((await get('offersJson', '/.well-known/offers.json', { shop: 'mustafa-test-dev.myshopify.com', prefix: '/apps/offerad' })).body);
assert.equal(real.products[0].url, `https://mustafa-test-dev.myshopify.com/products/${HANDLES[0]}`);
assert.match((await page('offerForm', `/offer?product=${HANDLES[0]}`, { shop: 'mustafa-test-dev.myshopify.com' })).body, new RegExp(`href="https://mustafa-test-dev\\.myshopify\\.com/products/${HANDLES[0]}"`));
console.log('documents: llms.txt, offers.json and openapi.json name the same addresses, under the prefix too');

// --- the log page -----------------------------------------------------------------

{
  const events = [
    { at: '2026-10-13T09:00:00.000Z', type: 'request', shop: 'demo', product: HANDLES[0], floor: 545, offers: [{ offer_id: 'of_1', seller_cost: 112, total: 607.85 }] },
    { ts: 1791882000000, event: 'accept', note: EVIL, budget_per_order: 150 },
    'a bare line',
  ];
  for (const wiring of [{ events }, { service: { recent: async () => events } }, { store: { recent: () => events } }]) {
    const log = await page('adminLog', '/admin/log', { service: {}, ...wiring });
    assert.match(log.body, /<td class="num">2026-10-13 09:00:00<\/td><td>request<\/td>/);
    assert.match(log.body, /<td>accept<\/td>/);
    assert.doesNotMatch(log.body, /seller_cost|floor|budget|545|"112"|:112/, 'seller-only numbers stay out of the log page');
    assert.match(log.body, /607\.85/);
    harmless('adminLog', log.body);
  }
  assert.match((await page('adminLog', '/admin/log', { service: {} })).body, /The event log is not connected to this page\./);
  assert.match((await page('adminLog', '/admin/log', { events: [] })).body, /Nothing has happened yet\./);
}
console.log('log page: shows recent events without seller-only fields');

// --- nothing a request sends becomes markup ------------------------------------------

{
  const e = encodeURIComponent(EVIL);
  const hostile = {
    request: async () => ({
      status: EVIL, reason: EVIL, next: EVIL, notes: [EVIL, { text: EVIL }], question: { text: EVIL }, product: { title: EVIL }, currency: EVIL,
      proof: { accepted: false, domain: EVIL, their_price: EVIL, compared: EVIL },
      offers: [{ offer_id: EVIL, kind: EVIL, headline: EVIL, components: [{ label: EVIL }, { label: EVIL }], quantity: EVIL, unit_price: EVIL, total: EVIL, currency: EVIL, expires_at: EVIL }],
    }),
    accept: async () => ({ status: 'accepted', codes: [EVIL], cart_url: 'javascript:alert(1)', terms: { [EVIL]: EVIL }, after_purchase: [EVIL], apply: { ucp: EVIL, webmcp: EVIL, link: EVIL }, expires_at: EVIL }),
    evaluateCart: async ({ codes }) => ({ applied: [{ code: codes[0], title: EVIL, amount: EVIL }], rejected: [{ code: codes[1], reason: EVIL }], totals: { total: EVIL } }),
  };
  const refuses = { accept: async () => ({ status: 'needs_approval', reason: EVIL }) };
  const everywhere = { product: EVIL, quantity: EVIL, priority: EVIL, need_by_days: EVIL, competing_offer_url: EVIL, shop: EVIL, offer_id: EVIL, user_approved: EVIL, note: EVIL };
  const tries = [
    ['offerForm', `/offer?product=${e}&quantity=${e}&priority=${e}&need_by_days=${e}&competing_offer_url=${e}&hooks=${e}`],
    ['offerForm', `/offer?hooks=${e}`, { shop: EVIL }],
    ['offerResult', `/offer?hooks=${e}`, { form: everywhere }],
    ['offerResult', '/offer', { form: { ...everywhere, quantity: '1', need_by_days: '', competing_offer_url: `https://x.example/?q=${EVIL}` }, service: hostile }],
    ['offerResult', '/offer', { form: { product: HANDLES[0] }, service: hostile, hooks: ['box'] }],
    ['offerAccepted', `/offer/accept?hooks=${e}`, { form: everywhere, service: hostile }],
    ['offerAccepted', '/offer/accept', { form: everywhere, service: refuses }],
    ['offerAccepted', '/offer/accept', { form: everywhere, service: fakeService() }],
    ['demoHome', `/demo?hooks=${e}`, { cookie: `pl_cart=${e}` }],
    ['demoProduct', `/demo/products/${e}?hooks=${e}`],
    ['demoProduct', `${productPath}?hooks=${e}&quantity=${e}`, { hooks: ['box', 'desc', 'jsonld', 'webmcp'] }],
    ['demoCart', `/demo/cart/${e}?discount=${e}&ship=${e}&quantity=${e}&hooks=${e}`, { cookie: `pl_cart=${e}` }],
    ['demoCart', `/demo/cart/${V}:1?discount=${e}&ship=${e}&hooks=${e}`, { service: hostile, hooks: ['box'] }],
    ['demoCart', `/demo/cart/${V}:1?discount=AAA111,BBB222&hooks=${e}`, { service: hostile, hooks: ['box'] }],
    ['demoCart', `/demo/cart/${V}:1?quantity=${e}&hooks=${e}`],
    ['demoCart', `/demo/cart/${V}:1?q_${V}=${e}&discount=${e}&hooks=${e}`],
    ['demoCheckout', `/demo/checkout?cart=${e}&discount=${e}&ship=${e}&hooks=${e}`],
    ['demoCheckout', `/demo/checkout?cart=${V}:1&discount=AAA111,BBB222,${e}`, { service: hostile }],
    ['demoPolicies', `/demo/policies?hooks=${e}`, { hooks: ['policy', 'webmcp'] }],
    ['rivalProduct', `/rival/products/${e}?variant=${e}`],
    ['rivalProduct', `/rival/products/${HANDLES[0]}?variant=${e}`],
    ['llmsTxt', `/llms.txt?hooks=${e}&product=${e}`],
    ['offersJson', `/.well-known/offers.json?hooks=${e}`],
    ['openapiJson', `/openapi.json?hooks=${e}`],
  ];
  let echoed = 0;
  for (const [name, path, options] of tries) {
    const out = await get(name, path, options);
    harmless(`${name} ${path.slice(0, 40)}`, out.body);
    harmless(`${name} headers`, JSON.stringify(out.headers).replace(/\\"/g, ''));
    if (out.body.startsWith('<!doctype')) {
      // The legitimate script elements are the only ones, and nothing new opened a tag.
      for (const s of tags(out.body, 'script')) assert.ok(s.type === 'application/ld+json' || s.src === '/embed.js');
      for (const f of tags(out.body, 'form')) assert.match(f.action, /^\/(offer|demo)\b/);
      if (unescape(out.body).includes(EVIL)) echoed++;
    }
  }
  assert.ok(echoed >= 8, `the payload was echoed, escaped, on ${echoed} pages, so the check has teeth`);
  // The service's cart link is a link only when it is an address.
  const linkless = await get('offerAccepted', '/offer/accept', { form: { offer_id: 'x', user_approved: 'true' }, service: hostile });
  assert.doesNotMatch(linkless.body, /Open the cart/);
  // Redirects carry request text only as an encoded address.
  const bounced = await pages.demoCart(ctxFor(`/demo/cart/${V}:1?quantity=1&hooks=${e}`));
  assert.equal(bounced.headers.get('location'), `/demo/cart/${V}:1?hooks=${e}`);
  assert.doesNotMatch(bounced.headers.get('location'), /[<>"\s]/);
}
console.log('injection: script and markup sent through paths, queries, forms, cookies and service replies come back as text');

// --- seller-only numbers never reach a page -------------------------------------------

for (const text of seen) {
  assert.doesNotMatch(text, /seller_cost|unit_cost|budget_per_order|"floor"|"cost"|"pace"/, 'no seller-only key on any page');
}
console.log(`private fields: none on ${seen.length} pages and documents`);

// --- embed.js, run in a stand-in for a browser page ------------------------------------

const SOURCE = readFileSync(new URL('../offers/public/embed.js', import.meta.url), 'utf8');
assert.doesNotMatch(SOURCE, /provideContext|clearContext|unregisterTool|innerHTML|document\.write|\beval\(/, 'the script only ever adds tools, and builds nodes from text');

const SITE_TOOLS = ['add_to_cart', 'browse_store', 'cancel_cart', 'get_cart', 'get_product', 'get_ucp_profile', 'manage_orders', 'proceed_to_checkout', 'search_catalog', 'search_shop_policies_and_faqs', 'show_variant', 'update_cart_lines'];

// document.modelContext as the spec has it: registerTool(tool, options) returns
// a promise and rejects a name that is taken. https://webmachinelearning.github.io/webmcp/
function modelContext(taken = SITE_TOOLS) {
  const tools = new Map(taken.map(name => [name, { name, description: 'the site\'s own', execute: async () => 'site' }]));
  return {
    tools,
    calls: [],
    registerTool(tool, ...rest) {
      this.calls.push([tool, ...rest]);
      if (tools.has(tool.name)) return Promise.reject(new DOMException('Duplicate tool name', 'InvalidStateError'));
      if (!/^[A-Za-z0-9_.-]{1,128}$/.test(tool.name) || !tool.description || typeof tool.execute !== 'function') return Promise.reject(new DOMException('invalid tool', 'InvalidStateError'));
      JSON.stringify(tool.inputSchema);
      tools.set(tool.name, tool);
      return Promise.resolve(undefined);
    },
    provideContext() { throw new Error('provideContext was called'); },
    clearContext() { throw new Error('clearContext was called'); },
    unregisterTool() { throw new Error('unregisterTool was called'); },
  };
}

function browser({ attrs = {}, src = `${ORIGIN}/apps/offerad/embed.js`, path = `/products/${HANDLES[0]}`, readyState = 'complete', given, context, legacy, nodes = {}, reply = { status: 'offer', offers: [] }, noScript = false } = {}) {
  const timers = [];
  const listeners = {};
  const fetches = [];
  const clock = { now: 1000 };
  const make = tag => ({
    tagName: String(tag).toUpperCase(), children: [], attributes: {}, parentNode: null,
    get nextSibling() { const s = this.parentNode?.children; return s ? s[s.indexOf(this) + 1] ?? null : null; },
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return Object.hasOwn(this.attributes, k) ? this.attributes[k] : null; },
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    insertBefore(c, ref) { c.parentNode = this; const i = ref ? this.children.indexOf(ref) : -1; if (i < 0) this.children.push(c); else this.children.splice(i, 0, c); return c; },
  });
  const head = make('head');
  const body = make('body');
  const main = body.appendChild(make('main'));
  const script = make('script');
  script.src = src;
  for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
  for (const node of Object.values(nodes)) if (Array.isArray(node.children) && !node.parentNode) main.appendChild(node);
  const walk = function* walk(node) { yield node; for (const c of node.children) yield* walk(c); };
  const document = {
    currentScript: noScript ? null : script, readyState, head, body, title: 'The Complete Snowboard | Some Store',
    createElement: make,
    getElementById: id => [...walk(head), ...walk(body)].find(n => n.id === id) ?? null,
    querySelector: sel => nodes[sel] ?? (sel === 'main' ? main : null),
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
  };
  if (context) document.modelContext = context;
  const sandbox = {
    document,
    navigator: legacy ? { modelContext: legacy } : {},
    location: new URL(path, ORIGIN),
    URL,
    Date: { now: () => clock.now },
    fetch: async (url, init) => {
      fetches.push({ url: String(url), init });
      if (reply instanceof Error) throw reply;
      return { ok: true, status: 200, json: async () => reply };
    },
    setTimeout: fn => { timers.push(fn); return timers.length; },
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
  };
  sandbox.window = sandbox;
  if (given) sandbox.OfferAd = given;
  const before = Object.keys(sandbox);
  const run = () => vm.runInContext(SOURCE, vm.createContext(sandbox), { filename: 'embed.js' });
  run();
  return {
    sandbox, document, head, body, main, script, timers, fetches, clock, make, run,
    added: () => Object.keys(sandbox).filter(k => !before.includes(k)),
    fire: type => (listeners[type] || []).splice(0).forEach(fn => fn()),
    tick: () => timers.splice(0).forEach(fn => fn()),
    find: id => document.getElementById(id),
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
// Values made inside the stand-in page belong to another realm; this brings them over for comparison.
const here = value => JSON.parse(JSON.stringify(value));
const blockAttrs = { 'data-endpoint': `${ORIGIN}/apps/offerad`, 'data-shop': 'some-store.myshopify.com', 'data-product': HANDLES[0], 'data-webmcp': 'true' };

{
  // No WebMCP in this browser: nothing thrown, nothing added to the page, one global at most.
  const b = browser({ attrs: blockAttrs });
  assert.deepEqual(b.added(), ['OfferAd']);
  assert.equal(b.sandbox.OfferAd.loaded, true);
  assert.equal(b.timers.length, 1, 'it keeps looking for a while');
  b.clock.now += 5000;
  b.tick();
  assert.equal(b.timers.length, 0, 'and stops a little after the page has loaded');
  assert.deepEqual([b.head.children.length, b.main.children.length, b.fetches.length], [0, 0, 0]);
  // While the page is still loading it keeps looking, but not forever.
  const slow = browser({ attrs: blockAttrs, readyState: 'loading' });
  let looks = 0;
  while (slow.timers.length && looks < 1000) { slow.tick(); looks++; }
  assert.equal(looks, 239, 'a page that never finishes loading is given a minute');
}

let TOOLS;
{
  // The current API: two tools next to the site's twelve, none replaced.
  const context = modelContext();
  const b = browser({ attrs: blockAttrs, context });
  await settle();
  assert.deepEqual([...context.tools.keys()].sort(), [...SITE_TOOLS, 'accept_store_offer', 'request_store_offer'].sort());
  for (const name of SITE_TOOLS) assert.equal(context.tools.get(name).description, 'the site\'s own');
  assert.deepEqual(context.calls.map(c => [c[0].name, c.length]), [['request_store_offer', 1], ['accept_store_offer', 1]], 'registerTool(tool), once per tool');
  assert.equal(b.timers.length, 0);
  TOOLS = context.tools;

  // Chrome's budgets, and names nobody else uses.
  for (const name of ['request_store_offer', 'accept_store_offer']) {
    const tool = TOOLS.get(name);
    assert.ok(tool.name.length <= 30 && tool.description.length <= 500, `${name}: ${tool.description.length} characters of description`);
    assert.equal(tool.inputSchema.type, 'object');
    for (const [key, schema] of Object.entries(tool.inputSchema.properties)) {
      assert.ok(key.length <= 30 && schema.description.length <= 150, `${name}.${key}: ${schema.description.length} characters`);
    }
    for (const key of tool.inputSchema.required) assert.ok(tool.inputSchema.properties[key]);
    assert.equal(tool.annotations.readOnlyHint, false);
    assert.equal(typeof tool.title, 'string');
    assert.doesNotMatch(tool.description, /\b(must|always|should|ignore|important|do not|don't)\b/i, `${name} describes, it does not instruct`);
    assert.match(tool.description, /Nothing is bought|nothing is bought/);
  }
  assert.deepEqual(here(TOOLS.get('request_store_offer').inputSchema.properties.priority.enum), Object.keys(PRIORITIES));
  assert.deepEqual(here(TOOLS.get('request_store_offer').inputSchema.required), [], 'on a product page the product is known');
  assert.deepEqual(here(TOOLS.get('accept_store_offer').inputSchema.required), ['offer_id', 'user_approved']);
  assert.equal(TOOLS.get('request_store_offer').annotations.untrustedContentHint, true);
  console.log(`embed: tool descriptions are ${TOOLS.get('request_store_offer').description.length} and ${TOOLS.get('accept_store_offer').description.length} characters`);
}
{
  // The site (or another copy) already has a tool of that name: it stays, and nothing is thrown.
  const context = modelContext([...SITE_TOOLS, 'request_store_offer']);
  browser({ attrs: blockAttrs, context });
  await settle();
  assert.equal(context.tools.get('request_store_offer').description, 'the site\'s own');
  assert.ok(context.tools.has('accept_store_offer'));
  // The older home of the API, where registerTool answers at once and throws on a duplicate.
  const old = new Map([['request_store_offer', 'site']]);
  const legacy = { registerTool(tool) { if (old.has(tool.name)) throw new DOMException('Duplicate tool name', 'InvalidStateError'); old.set(tool.name, tool); } };
  browser({ attrs: blockAttrs, legacy });
  assert.deepEqual([...old.keys()], ['request_store_offer', 'accept_store_offer']);
  assert.equal(old.get('request_store_offer'), 'site');
  // An object that only looks like the API is left alone.
  assert.deepEqual(browser({ attrs: blockAttrs, legacy: { registerTool: 'no' } }).added(), ['OfferAd']);
  // The API shows up late, as it does on a Shopify storefront.
  const late = browser({ attrs: blockAttrs, readyState: 'interactive' });
  late.tick();
  late.document.modelContext = modelContext();
  late.tick();
  await settle();
  assert.ok(late.document.modelContext.tools.has('request_store_offer'));
  assert.equal(late.timers.length, 0);
  // Switched off in the theme settings: no tools, whatever else is on.
  const off = modelContext();
  browser({ attrs: { ...blockAttrs, 'data-webmcp': 'false', 'data-box': 'true' }, context: off });
  assert.equal(off.calls.length, 0);
  // A second copy of the tag does nothing.
  const twice = modelContext();
  const b = browser({ attrs: { ...blockAttrs, 'data-box': 'true', 'data-jsonld': 'true' }, context: twice });
  b.run();
  await settle();
  assert.equal(twice.calls.length, 2);
  assert.deepEqual([b.main.children.length, b.head.children.length], [1, 1]);
}
{
  // The tools call the desk's JSON door and hand back a short, plain reply.
  const service = fakeService();
  const reply = await service.request({ shop: 'demo', product: HANDLES[0], competing_offer_url: `${ORIGIN}/rival/products/${HANDLES[0]}?variant=cheaper` });
  const context = modelContext();
  const b = browser({ attrs: blockAttrs, context, reply });
  await settle();
  const signal = new AbortController().signal;
  const out = await context.tools.get('request_store_offer').execute({ priority: 'lowest_price', quantity: 2, competing_offer_url: 'https://other.example/p' }, { signal });
  assert.equal(b.fetches[0].url, `${ORIGIN}/apps/offerad/api/offers/request`);
  assert.deepEqual([b.fetches[0].init.method, b.fetches[0].init.headers['content-type'], b.fetches[0].init.signal, b.fetches[0].init.credentials], ['POST', 'application/json', signal, undefined]);
  assert.deepEqual(JSON.parse(b.fetches[0].init.body), { shop: 'some-store.myshopify.com', product: HANDLES[0], quantity: 2, priority: 'lowest_price', competing_offer_url: 'https://other.example/p' });
  assert.deepEqual(Object.keys(out), ['status', 'offers', 'question', 'notes', 'proof', 'next']);
  assert.deepEqual(here(out.offers).map(o => o.offer_id), reply.offers.map(o => o.offer_id));
  assert.deepEqual(Object.keys(out.offers[0]), ['offer_id', 'kind', 'headline', 'quantity', 'total', 'list_total', 'you_save', 'extras_value', 'ship_days', 'currency', 'expires_at']);
  assert.equal(typeof out.question, 'string');
  const size = JSON.stringify(out).length;
  assert.ok(size <= 1500, `a reply with ${out.offers.length} offers is ${size} characters`);
  assert.ok(!JSON.stringify(out).includes('seller_cost'));
  console.log(`embed: a ${out.offers.length}-offer reply reaches the model as ${size} characters (the full reply is ${JSON.stringify(reply).length})`);
  // A product named in the call wins over the page's.
  await context.tools.get('request_store_offer').execute({ product: 'selling-plans-ski-wax' });
  assert.equal(JSON.parse(b.fetches[1].init.body).product, 'selling-plans-ski-wax');

  // Accept: approval is only ever the boolean true.
  const accept = context.tools.get('accept_store_offer');
  for (const [given, sent] of [[true, true], ['true', false], [1, false], [undefined, false]]) {
    await accept.execute({ offer_id: ' of_1 ', user_approved: given });
    assert.deepEqual(JSON.parse(b.fetches.at(-1).init.body), { shop: 'some-store.myshopify.com', offer_id: 'of_1', user_approved: sent });
  }
  assert.equal(b.fetches.at(-1).url, `${ORIGIN}/apps/offerad/api/offers/accept`);
  const calls = b.fetches.length;
  assert.equal((await accept.execute({})).status, 'invalid_request');
  assert.equal((await accept.execute()).status, 'invalid_request');
  assert.equal(b.fetches.length, calls, 'a call with no offer_id is answered without asking the store');

  // The store is unreachable, or answers with something that is not JSON: a plain reply, not a throw.
  const down = modelContext();
  browser({ attrs: blockAttrs, context: down, reply: new TypeError('Failed to fetch') });
  await settle();
  const failed = await down.tools.get('request_store_offer').execute({});
  assert.deepEqual(Object.keys(failed), ['status', 'error']);
  assert.equal(failed.status, 'error');
  const odd = modelContext();
  browser({ attrs: blockAttrs, context: odd, reply: 'not an object' });
  await settle();
  assert.equal((await odd.tools.get('accept_store_offer').execute({ offer_id: 'x', user_approved: true })).status, 'error');
}
{
  // Away from a product page the product has to be named.
  const context = modelContext();
  const b = browser({ attrs: { 'data-endpoint': '/apps/offerad', 'data-shop': 'demo' }, path: '/collections/all', context });
  await settle();
  assert.deepEqual(here(context.tools.get('request_store_offer').inputSchema.required), ['product']);
  assert.equal((await context.tools.get('request_store_offer').execute({})).status, 'invalid_request');
  assert.equal(b.fetches.length, 0);
  // The product is read from a product page's address when the tag does not name it.
  const fromPath = modelContext();
  const p = browser({ attrs: { 'data-endpoint': '/apps/offerad' }, path: '/en-ca/products/the-videographer-snowboard', context: fromPath });
  await settle();
  await fromPath.tools.get('request_store_offer').execute({});
  assert.deepEqual(JSON.parse(p.fetches[0].init.body), { product: 'the-videographer-snowboard' });
  assert.equal(p.fetches[0].url, `${ORIGIN}/apps/offerad/api/offers/request`, 'a relative endpoint is resolved against the page');
  // With no endpoint on the tag the desk is where the script came from; with no tag and no settings, nothing happens.
  const bare = modelContext();
  const s = browser({ src: 'https://desk.example/apps/offerad/embed.js?v=3', context: bare });
  await settle();
  await bare.tools.get('request_store_offer').execute({});
  assert.equal(s.fetches[0].url, 'https://desk.example/apps/offerad/api/offers/request');
  const none = modelContext();
  assert.deepEqual(browser({ noScript: true, context: none }).added(), []);
  assert.equal(none.calls.length, 0);
  // window.OfferAd carries the same settings where a tag cannot.
  const viaGlobal = modelContext();
  const g = browser({ noScript: true, given: { endpoint: 'https://desk.example', product: 'p-1', shop: 's-1', box: true, jsonld: false }, context: viaGlobal });
  await settle();
  await viaGlobal.tools.get('request_store_offer').execute({});
  assert.deepEqual([g.fetches[0].url, JSON.parse(g.fetches[0].init.body)], ['https://desk.example/api/offers/request', { shop: 's-1', product: 'p-1' }]);
  assert.deepEqual([g.main.children.length, g.head.children.length], [1, 0]);
}
{
  // The visible box: under the price when the theme has one, else above the buy form, else in main.
  const PRICE = '.product__info-container .price, .product-single__price, .product__price, [data-product-price], #ProductPrice';
  const boxOf = b => b.find('offerad-box');
  const words = node => [node.textContent, ...node.children.map(c => c.textContent)].filter(Boolean);
  const plain = browser({ attrs: { ...blockAttrs, 'data-box': 'true' } });
  assert.equal(plain.main.children.at(-1), boxOf(plain));
  assert.equal(boxOf(plain).tagName, 'ASIDE');
  assert.equal(boxOf(plain).attributes['aria-label'], 'Ask this store for an offer');
  assert.equal(words(boxOf(plain))[0], 'Ask this store for an offer');
  assert.equal(boxOf(plain).children.at(-1).href, `${ORIGIN}/apps/offerad/offer?product=${HANDLES[0]}`);
  assert.equal(plain.head.children.length, 0, 'no pointer unless asked for');
  const info = plain.make('div');
  const price = info.appendChild(plain.make('div'));
  const buy = info.appendChild(plain.make('form'));
  const themed = browser({ attrs: { ...blockAttrs, 'data-box': '' }, nodes: { [PRICE]: price, 'form[action*="/cart/add"]': buy } });
  assert.deepEqual(info.children.map(c => c.id ?? c.tagName), ['DIV', 'offerad-box', 'FORM'], 'right after the price');
  assert.equal(themed.main.children.includes(boxOf(themed)), false);
  const info2 = plain.make('div');
  const buy2 = info2.appendChild(plain.make('form'));
  browser({ attrs: { ...blockAttrs, 'data-box': 'true' }, nodes: { 'form[action*="/cart/add"]': buy2 } });
  assert.deepEqual(info2.children.map(c => c.id ?? c.tagName), ['offerad-box', 'FORM'], 'above the buy form');
  const spot = plain.make('div');
  const chosen = browser({ attrs: { ...blockAttrs, 'data-box': 'true', 'data-box-target': '#here' }, nodes: { '#here': spot, [PRICE]: price } });
  assert.equal(spot.nextSibling, boxOf(chosen), 'where the merchant pointed');
  // Off when the setting says so, and absent away from a product page.
  for (const value of ['false', '0', 'off', 'no']) assert.equal(boxOf(browser({ attrs: { ...blockAttrs, 'data-box': value } })), null);
  assert.equal(boxOf(browser({ attrs: { 'data-endpoint': '/apps/offerad', 'data-box': 'true' }, path: '/' })), null);
  // A page still being parsed gets the box once it is.
  const early = browser({ attrs: { ...blockAttrs, 'data-box': 'true', 'data-jsonld': 'true' }, readyState: 'loading' });
  assert.equal(boxOf(early), null);
  early.fire('DOMContentLoaded');
  assert.ok(boxOf(early) && early.find('offerad-jsonld'));

  // The pointer: one JSON-LD node that says where an offer can be asked for.
  const canonical = { href: `${ORIGIN}/products/${HANDLES[0]}` };
  const pointed = browser({ attrs: { ...blockAttrs, 'data-jsonld': 'true' }, path: `/products/${HANDLES[0]}?variant=1`, nodes: { 'link[rel="canonical"]': canonical, 'meta[property="og:title"]': { content: 'The Complete Snowboard' } } });
  const node = pointed.find('offerad-jsonld');
  assert.deepEqual([node.tagName, node.type, node.parentNode], ['SCRIPT', 'application/ld+json', pointed.head]);
  const data = JSON.parse(node.textContent);
  assert.deepEqual([data['@type'], data.url, data.potentialAction['@type']], ['WebPage', canonical.href, 'QuoteAction']);
  assert.deepEqual(data.potentialAction.object, { '@type': 'Product', name: 'The Complete Snowboard', url: canonical.href });
  assert.deepEqual(data.potentialAction.target.map(t => [t.httpMethod, t.urlTemplate]), [['GET', `${ORIGIN}/apps/offerad/offer?product=${HANDLES[0]}`], ['POST', `${ORIGIN}/apps/offerad/api/offers/request`]]);
  assert.equal(boxOf(pointed), null);
}
{
  // The tag the storefront page writes is one the script understands.
  const context = modelContext();
  const b = browser({ attrs: embedTag, src: ORIGIN + embedTag.src, path: productPath, context });
  await settle();
  await context.tools.get('request_store_offer').execute({ priority: 'extras' });
  assert.deepEqual([b.fetches[0].url, JSON.parse(b.fetches[0].init.body)], [`${ORIGIN}/api/offers/request`, { shop: 'demo', product: HANDLES[0], priority: 'extras' }]);
  assert.deepEqual([b.find('offerad-box'), b.find('offerad-jsonld')], [null, null], 'the page draws its own box and data; the script adds neither');
}
console.log('embed: registers beside the site\'s tools, never replaces one, and stays quiet where WebMCP is missing');

console.log('\npages checks passed');
