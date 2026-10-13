// Integration checks of the actual Worker doors and offer service, with no network.
import assert from 'node:assert/strict';
import worker from '../offers/src/worker.js';
import { memoryStore } from '../offers/src/lib/store.js';

const data = memoryStore();
const pending = [];
const env = { OFFERS: { idFromName: name => name, get: () => data } };
const ctx = { waitUntil: promise => pending.push(promise) };
const origin = 'https://offers.test';
const shop = 'mustafa-test-dev.myshopify.com';
let caller = 0;
async function call(path, body, headers = {}, target = env) {
  return worker.fetch(new Request(origin + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'user-agent': 'integration-check/1.0', 'cf-connecting-ip': '203.0.113.9', ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }), target, ctx);
}
const json = async (...args) => (await call(...args)).json();
const base = { product: 'the-complete-snowboard' };

const options = await json('/api/offers/options?product=the-complete-snowboard');
assert.equal(options.status, 'ok');
const quote = await json('/api/offers/request', { ...base, priority: 'fast_delivery' });
assert.ok(quote.offers.length > 0);
assert.ok(quote.offers.some(offer => offer.components.some(part => part.type === 'express_upgrade')));
const chosen = quote.offers[0];
const noApproval = await json('/api/offers/accept', { offer_id: chosen.offer_id });
assert.equal(noApproval.status, 'needs_approval');
const accepted = await json('/api/offers/accept', { offer_id: chosen.offer_id, user_approved: true });
assert.equal(accepted.status, 'accepted');
assert.ok(accepted.codes.length);
const again = await json('/api/offers/accept', { offer_id: chosen.offer_id, user_approved: true });
assert.deepEqual(again.codes, accepted.codes);
const cart = await call(new URL(accepted.cart_url).pathname + new URL(accepted.cart_url).search);
assert.equal(cart.status, 200);
assert.match(await cart.text(), new RegExp(accepted.codes[0]));

const rpc = async (method, params = {}, headers = {}) => json('/mcp', { jsonrpc: '2.0', id: ++caller, method, params }, headers);
const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'integration', version: '1' } });
assert.ok(init.result.serverInfo);
const tools = await rpc('tools/list');
assert.deepEqual(tools.result.tools.map(tool => tool.name), ['get_offer_options', 'request_offer', 'accept_offer']);
const mcpQuote = await rpc('tools/call', { name: 'request_offer', arguments: { ...base, priority: 'easy_returns' } });
assert.ok(mcpQuote.result.structuredContent.offers.some(offer => offer.components.some(part => part.type === 'extended_returns')));

const demoProof = await json('/api/offers/request', { ...base, competing_offer_url: origin + '/rival/products/the-complete-snowboard?variant=much-cheaper' }, { 'user-agent': 'demo-proof/1.0' });
assert.equal(demoProof.proof.accepted, true);
for (const url of [origin + '/rival/products/the-complete-snowboard?variant=much-cheaper', 'https://peakboards.demo/products/the-complete-snowboard?variant=much-cheaper']) {
  const realProof = await json('/api/offers/request', { ...base, shop, competing_offer_url: url }, { 'user-agent': `real-proof-${++caller}/1.0` });
  assert.equal(realProof.proof.accepted, false, 'fixture evidence must never change a real-shop quote');
}

const proxyEnv = { ...env, SHOPIFY_API_SECRET: 'integration-only-secret' };
const params = new URLSearchParams({ shop, timestamp: String(Math.floor(Date.now() / 1000)), path_prefix: '/apps/offerad', product: base.product });
const message = [...params].map(([key, value]) => `${key}=${value}`).sort().join('');
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(proxyEnv.SHOPIFY_API_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
params.set('signature', Buffer.from(mac).toString('hex'));
const signed = await call('/apps/offerad/api/offers/options?' + params, undefined, { 'x-forwarded-host': shop }, proxyEnv);
assert.equal(signed.status, 200);
assert.equal((await signed.json()).status, 'ok');
params.set('signature', '00'.repeat(32));
assert.equal((await call('/apps/offerad/api/offers/options?' + params, undefined, {}, proxyEnv)).status, 401);
assert.equal((await call('/webhooks/orders', { id: 123, shop }, { 'x-shopify-shop-domain': shop })).status, 401);
assert.equal((await call('/webhooks/orders', { id: 123 }, { 'x-shopify-shop-domain': shop }, proxyEnv)).status, 401);

const control = await call('/demo/products/the-complete-snowboard?hooks=');
assert.doesNotMatch(await control.text(), /request_store_offer|data-webmcp="true"/);
const discovery = await call('/demo/products/the-complete-snowboard?hooks=webmcp,box');
assert.match(await discovery.text(), /embed\.js/);
assert.match((await json('/apps/offerad/.well-known/offers.json')).name || '', /offer desk/i);
await Promise.all(pending);
console.log('Worker integration passed: API, MCP, non-price offer, approval, redemption, fixture isolation, proxy HMAC, webhook authentication and discovery.');
