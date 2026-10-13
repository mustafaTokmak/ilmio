// Checks the offer service end to end: memory store, a stub verifier and a fake
// adapter, with the clock under the check's control. Also runs the store
// contract against both stores. Run: node shopify/scripts/check-service.mjs
import assert from 'node:assert/strict';
import { createService, DEFAULT_LIMITS } from '../offers/src/lib/service.js';
import { memoryStore, doStore, Offers } from '../offers/src/lib/store.js';
import { publicOffer, roomFor, r2, PACE_SHARE } from '../offers/src/lib/policy.js';
import { shopifyAdapter } from '../offers/src/lib/settle.js';
import { mandateFor, SHOPS } from '../offers/src/lib/mandates.js';

const MIN = 60000;
const clock = { t: Date.parse('2026-10-13T09:00:00Z') };
const now = () => clock.t;
const iso = ms => new Date(ms).toISOString();

// What the seller "finds" behind each link. The service trusts none of it blindly.
const proof = (domain, trusted, price, extra = {}) => ({ ok: true, reason: 'ok', domain, trusted_domain: trusted, match_by: 'gtin', price, shipping: 0, currency: 'USD', ...extra });
const PAGES = {
  'https://www.evo.com/complete': proof('evo.com', true, 629.95),
  'https://www.backcountry.com/complete-clearance': proof('backcountry.com', true, 499),
  'https://random-shop.example/complete': proof('random-shop.example', false, 629.95),
  'https://www.rei.com/another-board': { ok: false, reason: 'different_product', reason_text: 'the page shows a different product', domain: 'rei.com', trusted_domain: true },
  'https://www.tactics.com/no-price': proof('tactics.com', true, 'call us'),
};
const fetched = [];
const verify = async (url, product, policy, opts) => {
  fetched.push({ url, product, policy, opts });
  if (url.includes('broken-verifier')) throw new Error('verifier bug');
  return PAGES[url] ? { url, ...PAGES[url] } : { ok: false, reason: 'fetch_failed', reason_text: 'the page could not be fetched', url, domain: new URL(url).hostname };
};

// A minimal adapter: two codes when an offer has both a price cut and free
// shipping (as native Shopify discounts would need), one otherwise.
const LATER = ['extended_returns', 'delivery_guarantee', 'next_order_credit'];
const mints = [];
const failing = { next: false };
const adapterFor = async (shop, config) => ({
  async mint(offer, mandate, { offer_id, ttl_minutes }) {
    if (failing.next) { failing.next = false; throw new Error('admin api unavailable'); }
    mints.push({ shop, offer_id, offer });
    const has = type => offer.components.some(c => c.type === type);
    const codes = [`OFFER-CHK${mints.length}A`, ...(has('price') && has('free_shipping') ? [`OFFER-CHK${mints.length}B`] : [])];
    const gift = offer.components.find(c => c.type === 'gift');
    const lines = `${mandate.product.variant_numeric_id}:${offer.quantity}${gift ? `,${gift.variant_id.split('/').pop()}:1` : ''}`;
    return {
      codes,
      cart_url: `${config.storefront || 'https://powderlab.example/demo'}/cart/${lines}?discount=${codes.join(',')}`,
      expires_at: iso(clock.t + ttl_minutes * MIN),
      mode: config.settle === 'dry' ? 'dry' : 'native',
      deferred: offer.components.filter(c => LATER.includes(c.type)).map(c => c.type),
      warnings: [],
    };
  },
  async revoke() {},
});

// Everything the buyer side is ever told goes through here, so the privacy
// checks at the end see every reply of the whole run.
const told = [];
const watch = (service, store) => Object.fromEntries(Object.entries(service).map(([op, fn]) => [op, async input => {
  const reply = await fn(input);
  told.push({ op, input, reply, store });
  return reply;
}]));

const store = memoryStore({ now });
const service = watch(createService({ store, adapterFor, verify, now }), store);

// Each scenario gets its own shopper, so one scenario's requests never count against another's limits.
let shoppers = 0;
const shopper = () => ({ session: `check-session-${++shoppers}`, client: { ip: `198.51.100.${shoppers}`, name: 'check-service' } });
const BOARD = { shop: 'demo', product: 'the-complete-snowboard' };
const board = mandateFor('demo', BOARD.product);

const show = (title, r) => {
  console.log(`\n== ${title} -> ${r.status}`);
  for (const o of r.offers || []) console.log(`   [${o.kind}] ${o.headline} | total ${o.total} (list ${o.list_total}), you save ${o.you_save}, extras ${o.extras_value}, ships ${o.ship_days}d, open until ${o.expires_at}`);
  for (const n of r.notes || []) console.log(`   note: ${n}`);
  if (r.question) console.log(`   question: ${r.question.text}`);
  if (r.proof) console.log(`   proof: ${JSON.stringify(r.proof)}`);
  if (r.reason || r.error || r.message) console.log(`   why: ${r.reason || r.error || r.message}`);
  if (r.codes) console.log(`   codes: ${r.codes.join(', ')} until ${r.expires_at}\n   cart: ${r.cart_url}`);
  for (const [way, how] of Object.entries(r.apply || {})) console.log(`   apply.${way}: ${how}`);
  for (const a of r.after_purchase || []) console.log(`   after purchase: ${a}`);
  if (r.next) console.log(`   next: ${r.next}`);
};
// An offer as a reply carries it, without what is allowed to differ between identical requests.
const core = r => r.offers.map(({ offer_id, expires_at, ...rest }) => rest);

// --- What the store can offer: kinds, never amounts.
const opts = await service.options({ ...BOARD, ...shopper() });
console.log('\n== options ->', opts.status, '\n  ', JSON.stringify(opts.can_offer.map(k => k.type)), '\n   how_to_ask:', opts.how_to_ask);
assert.equal(opts.status, 'ok');
assert.deepEqual([opts.store, opts.list_price, opts.standard_delivery], ['Powder Lab', 699.95, { days: 6, price: 19.9 }]);
assert.deepEqual([...new Set(opts.can_offer.map(k => k.type))], ['price', 'free_shipping', 'express_upgrade', 'gift', 'extended_returns', 'delivery_guarantee', 'next_order_credit']);
assert.deepEqual(opts.priorities.map(p => p.id), ['lowest_price', 'fast_delivery', 'easy_returns', 'extras', 'repeat_purchase']);
assert.ok(opts.competing_offers.accepted && opts.competing_offers.shops_that_count_in_full.includes('evo.com'));
const figures = x => (JSON.stringify(x).replace(/gid:[^"]+/g, '').match(/\d+(?:\.\d+)?/g) || []).map(Number);
for (const amount of [24.95, 40, 25, 60, 90, 5, 8, 112]) assert.ok(!figures(opts).includes(amount), `options names kinds, not amounts (${amount})`);
// Free shipping is switched on for the shop but never fits the wax, so it is not promised there.
const waxKinds = (await service.options({ shop: 'demo', product: 'selling-plans-ski-wax', ...shopper() })).can_offer.map(k => k.type);
assert.deepEqual(waxKinds, ['price', 'price', 'next_order_credit']);

// --- No priority: offers plus the question.
const open = await service.request({ ...BOARD, ...shopper() });
show('no priority', open);
assert.equal(open.status, 'offer');
assert.equal(open.question.options.length, 5, 'asks what the buyer wants');
assert.deepEqual([open.product.title, open.list, open.currency, open.proof], ['The Complete Snowboard', 699.95, 'USD', null]);
assert.ok(open.offers.length >= 1 && open.offers.length <= 3);
for (const o of open.offers) {
  assert.match(o.offer_id, /^of_[0-9a-f]{20}$/);
  assert.equal(o.expires_at, iso(clock.t + DEFAULT_LIMITS.offer_ttl_minutes * MIN));
  const kept = await store.getOffer(o.offer_id);
  assert.deepEqual(core({ offers: [o] })[0], publicOffer(kept.offer), 'a reply carries publicOffer() output and nothing more');
  assert.ok(kept.offer.seller_cost > 0, 'the stored offer keeps its seller-only fields');
}
assert.match(open.next, /question\.options/);

// --- Each priority gets an offer built for it.
for (const priority of ['lowest_price', 'fast_delivery', 'easy_returns', 'extras', 'repeat_purchase']) {
  const r = await service.request({ ...BOARD, ...shopper(), priority, ...(priority === 'fast_delivery' ? { need_by_days: 3 } : {}) });
  show(priority, r);
  assert.equal(r.status, 'offer');
  assert.equal(r.question, null);
  assert.equal(r.offers[0].kind, 'for_your_priority');
  if (priority === 'fast_delivery') assert.equal(r.offers[0].ship_days, 2);
}
const loose = await service.request({ ...BOARD, ...shopper(), priority: 'Fast Delivery', quantity: '1' });
assert.equal(loose.offers[0].kind, 'for_your_priority', 'priority and quantity are read the way a form or a model sends them');
const odd = await service.request({ ...BOARD, ...shopper(), priority: 'cheapest' });
assert.ok(odd.question && odd.notes.some(n => n.includes('not one this store knows')));

// --- Quantity 2.
const two = await service.request({ ...BOARD, ...shopper(), priority: 'lowest_price', quantity: 2 });
show('lowest_price x2', two);
assert.deepEqual([two.offers[0].quantity, two.offers[0].headline, two.offers[0].total], [2, '5% off for 2 or more + $42 off', 1307.8]);
show('more than is in stock', await service.request({ ...BOARD, ...shopper(), quantity: 99 }));
assert.equal(told.at(-1).reply.status, 'unavailable');

// --- A verified cheaper offer from a shop the store trusts: matched.
const evo = shopper();
const calls = fetched.length;
const matched = await service.request({ ...BOARD, ...evo, priority: 'lowest_price', competing_offer_url: 'https://www.evo.com/complete' });
show('trusted proof 629.95 delivered', matched);
assert.equal(matched.status, 'price_matched');
assert.equal(matched.offers[0].total, 629.95);
assert.ok(matched.offers.some(o => o.kind === 'value_instead_of_price'));
assert.deepEqual(matched.proof, { accepted: true, domain: 'evo.com', their_price: 629.95, their_shipping: 0, compared: 'delivered price (item plus shipping)', result: 'price_matched', shop_counts_in_full: true, product_matched_by: 'gtin' });
assert.deepEqual(fetched.at(-1), { url: 'https://www.evo.com/complete', product: board.product, policy: board.price_match, opts: { now: clock.t, shop: 'demo', ownHosts: [] } }, 'the verifier gets the product, the policy and the clock');
// The same request again: the same offers, and the link is not fetched a second time.
const again = await service.request({ ...BOARD, ...evo, priority: 'lowest_price', competing_offer_url: 'https://www.evo.com/complete' });
assert.deepEqual(core(again), core(matched), 'identical requests, identical offers');
assert.deepEqual([again.status, again.notes, again.proof, again.next], [matched.status, matched.notes, matched.proof, matched.next]);
assert.notEqual(again.offers[0].offer_id, matched.offers[0].offer_id);
assert.equal(fetched.length, calls + 1, 'a link checked this hour is remembered, not fetched again');

// --- A rejected proof: regular offers, and the reason.
const rejected = await service.request({ ...BOARD, ...shopper(), priority: 'lowest_price', competing_offer_url: 'https://www.rei.com/another-board' });
show('proof rejected', rejected);
assert.equal(rejected.status, 'offer');
assert.deepEqual(rejected.proof, { accepted: false, domain: 'rei.com', their_price: null, compared: null, reason: 'different_product' });
assert.ok(rejected.notes.includes('Competing offer not accepted: the page shows a different product.'));
assert.equal(rejected.offers[0].total, 607.85, 'a rejected link moves nothing');

// --- An unlisted shop moves the price only a little, and the reply says why.
const unlisted = await service.request({ ...BOARD, ...shopper(), priority: 'lowest_price', competing_offer_url: 'https://random-shop.example/complete' });
show('unlisted shop proof 629.95', unlisted);
assert.equal(unlisted.status, 'cannot_match_best_effort');
assert.ok(unlisted.offers[0].components.find(c => c.type === 'price').amount_off <= 699.95 * 0.05 + 0.01);
assert.equal(unlisted.proof.shop_counts_in_full, false);
assert.ok(unlisted.notes.some(n => n.includes('random-shop.example is not on this store\'s list')));

// --- A price the verifier reports that is not a number is no price at all.
const garbled = await service.request({ ...BOARD, ...shopper(), competing_offer_url: 'https://www.tactics.com/no-price' });
assert.deepEqual([garbled.status, garbled.proof.accepted, garbled.proof.reason], ['offer', false, 'no_price_found']);

// --- Accept without approval: nothing is issued, and the reply says why.
const unapproved = await service.accept({ offer_id: matched.offers[0].offer_id, ...evo });
show('accept without approval', unapproved);
assert.equal(unapproved.status, 'needs_approval');
assert.match(unapproved.reason, /agreed/);
assert.equal(unapproved.offer.offer_id, matched.offers[0].offer_id);
assert.equal((await service.accept({ offer_id: matched.offers[0].offer_id, user_approved: 'true', ...evo })).status, 'needs_approval', 'only true is approval');
assert.equal(mints.length, 0);

// --- Accept with approval: codes, a cart link, three ways to use them, what comes later.
const accepted = await service.accept({ offer_id: matched.offers[0].offer_id, user_approved: true, ...evo });
show('accept with approval', accepted);
assert.equal(accepted.status, 'accepted');
assert.deepEqual(accepted.codes, ['OFFER-CHK1A', 'OFFER-CHK1B']);
assert.equal(accepted.cart_url, 'https://powderlab.example/demo/cart/45900666110115:1?discount=OFFER-CHK1A,OFFER-CHK1B');
assert.equal(accepted.expires_at, iso(clock.t + DEFAULT_LIMITS.code_ttl_minutes * MIN));
assert.deepEqual(Object.keys(accepted.apply).sort(), ['link', 'ucp', 'webmcp']);
assert.deepEqual(accepted.terms, publicOffer(mints[0].offer));
assert.deepEqual(accepted.cart_lines, [{ variant_id: 'gid://shopify/ProductVariant/45900666110115', quantity: 1, title: 'The Complete Snowboard' }]);
assert.deepEqual([mints.length, mints[0].offer_id, mints[0].offer.seller_cost], [1, matched.offers[0].offer_id, 89.9], 'the adapter gets the stored offer');
const held = await store.getCode('offer-chk1a');
assert.deepEqual([held.offer_id, held.shop, held.expires_at, held.used], [accepted.offer_id, 'demo', accepted.expires_at, false], 'what is owed is kept against the code');

// --- Accept twice: the same codes, word for word, and nothing minted again.
assert.deepEqual(await service.accept({ offer_id: accepted.offer_id, user_approved: true, ...evo }), accepted);
assert.deepEqual(await service.accept({ offer_id: accepted.offer_id }), accepted);
assert.equal(mints.length, 1, 'accepting twice mints once');
const byCode = await service.status({ code: 'OFFER-CHK1B' });
assert.deepEqual(byCode, { ...accepted, code_state: 'unused' });
// Two accepts at the same moment still make one code.
const race = await Promise.all([1, 2].map(() => service.accept({ offer_id: again.offers[0].offer_id, user_approved: true, ...evo })));
assert.deepEqual(race[0], race[1]);
assert.equal(mints.length, 2, 'two accepts at once mint once');

// --- On a Shopify store the reply says how the codes travel through Shopify's own tools.
const dev = { shop: 'mustafa-test-dev.myshopify.com', product: 'https://mustafa-test-dev.myshopify.com/products/the-complete-snowboard' };
const extras = await service.request({ ...dev, ...shopper() });
assert.equal(extras.product.url, 'https://mustafa-test-dev.myshopify.com/products/the-complete-snowboard');
const bundle = await service.accept({ offer_id: extras.offers.find(o => o.kind === 'alternative').offer_id, user_approved: true });
show('accept on a Shopify store: add-on, credit, express, free shipping', bundle);
assert.match(bundle.apply.ucp, /\["OFFER-CHK3A"\] as cart\.discounts\.codes in create_cart or update_cart, and again as checkout\.discounts\.codes in create_checkout or update_checkout/);
assert.match(bundle.apply.ucp, /gid:\/\/shopify\/ProductVariant\/45900666142883, quantity 1/);
assert.match(bundle.apply.webmcp, /update_checkout with \["OFFER-CHK3A"\] as checkout\.discounts\.codes/);
assert.equal(bundle.cart_lines[1].free_with_code, true);
assert.deepEqual(bundle.after_purchase, ['$40 credit on your next order, valid 90 days. The store creates it after this order is placed with the code.']);
assert.deepEqual((await store.getCode('OFFER-CHK3A')).deferred, ['next_order_credit']);
const returns = await service.request({ ...dev, ...shopper(), priority: 'easy_returns' });
assert.equal((await service.accept({ offer_id: returns.offers[0].offer_id, user_approved: true })).after_purchase.length, 2);
await service.request({ ...dev, ...shopper(), competing_offer_url: 'https://www.evo.com/complete' });
assert.deepEqual(fetched.at(-1).opts.ownHosts, ['mustafa-test-dev.myshopify.com'], 'the store\'s own pages are no competing offer');

// --- An expired offer.
const stale = await service.request({ ...BOARD, ...shopper(), priority: 'extras' });
clock.t += 31 * MIN;
const late = await service.accept({ offer_id: stale.offers[0].offer_id, user_approved: true });
show('accept after 31 minutes', late);
assert.equal(late.status, 'expired');
assert.equal((await service.status({ offer_id: stale.offers[0].offer_id })).status, 'expired');
assert.equal((await service.status({ offer_id: accepted.offer_id })).code_state, 'unused');
clock.t += 30 * MIN;
assert.equal((await service.status({ offer_id: accepted.offer_id })).code_state, 'expired');
assert.match((await service.accept({ offer_id: accepted.offer_id })).next, /expired at/);

// --- Rate limit 1: three requests per product per session per hour.
const keen = shopper();
for (let i = 0; i < 3; i++) assert.equal((await service.request({ ...BOARD, ...keen })).status, 'offer');
const fourth = await service.request({ ...BOARD, ...keen });
show('fourth request for one product in an hour', fourth);
assert.deepEqual([fourth.status, fourth.limit], ['slow_down', { name: 'requests_per_product', max: 3, window_minutes: 60 }]);
assert.equal(fourth.offers, undefined);
assert.equal((await service.request({ ...BOARD, ...keen, product: 'the-videographer-snowboard' })).status, 'offer', 'the limit is per product');
assert.equal((await service.request({ ...BOARD, ...shopper() })).status, 'offer', 'and per session');
clock.t += 61 * MIN;
assert.equal((await service.request({ ...BOARD, ...keen })).status, 'offer', 'and per hour');

// --- Rate limit 2: one competing-offer check per product per session per hour.
const hunter = shopper();
assert.equal((await service.request({ ...BOARD, ...hunter, competing_offer_url: 'https://www.evo.com/complete' })).status, 'price_matched');
const second = await service.request({ ...BOARD, ...hunter, competing_offer_url: 'https://www.backcountry.com/complete-clearance' });
show('a second link in the same hour', second);
assert.deepEqual([second.status, second.limit.name], ['slow_down', 'link_checks_per_product']);
// The refusal used up none of the three requests: two more are answered, the next is not.
assert.equal((await service.request({ ...BOARD, ...hunter, priority: 'lowest_price', competing_offer_url: 'https://www.evo.com/complete' })).status, 'price_matched');
assert.equal((await service.request({ ...BOARD, ...hunter })).status, 'offer');
assert.equal((await service.request({ ...BOARD, ...hunter })).limit.name, 'requests_per_product');
// A link that could not be read is not a check: another may follow in the same hour.
const unlucky = shopper();
const unread = await service.request({ ...BOARD, ...unlucky, competing_offer_url: 'https://www.burton.com/timeout' });
assert.deepEqual([unread.status, unread.proof.reason], ['offer', 'fetch_failed']);
assert.ok(unread.notes.some(n => n.includes('did not count')));
const crash = console.error;
console.error = () => {};
assert.equal((await service.request({ ...BOARD, ...unlucky, competing_offer_url: 'https://www.burton.com/broken-verifier' })).proof.reason, 'fetch_failed', 'a verifier that throws is a page that could not be read');
console.error = crash;
const below = await service.request({ ...BOARD, ...unlucky, priority: 'lowest_price', competing_offer_url: 'https://www.backcountry.com/complete-clearance' });
show('trusted proof 499 delivered (below what the store can do)', below);
assert.equal(below.status, 'cannot_match_best_effort');

// --- Rate limit 3: twenty requests per address per hour, whatever the session.
const crowd = Array.from({ length: 21 }, () => ({ ...shopper(), client: { ip: '203.0.113.77', name: 'check-service' } }));
for (const one of crowd.slice(0, 20)) assert.equal((await service.request({ ...BOARD, ...one })).status, 'offer');
const flood = await service.request({ ...BOARD, ...crowd[20] });
show('twenty-first request from one address in an hour', flood);
assert.deepEqual([flood.status, flood.limit], ['slow_down', { name: 'requests_per_ip', max: 20, window_minutes: 60 }]);

// --- Unknown product, unknown shop, unknown offer.
const toaster = await service.request({ ...BOARD, ...shopper(), product: 'toaster' });
show('unknown product', toaster);
assert.deepEqual([toaster.status, toaster.asked_for], ['product_not_found', 'toaster']);
const elsewhere = await service.request({ shop: 'not-a-customer.myshopify.com', product: 'the-complete-snowboard', ...shopper() });
show('unknown shop', elsewhere);
assert.deepEqual([elsewhere.status, elsewhere.store], ['store_not_enrolled', 'not-a-customer.myshopify.com']);
assert.equal((await service.options({ shop: 'not-a-customer.myshopify.com', product: 'x' })).status, 'store_not_enrolled');
assert.equal((await service.options({ ...BOARD, product: '' })).status, 'product_not_found');
for (const offer_id of [undefined, 'of_0000000000000000dead', `proof:demo:the-complete-snowboard:${evo.session}`, { $ne: null }]) {
  assert.equal((await service.accept({ offer_id, user_approved: true })).status, 'not_found');
}
assert.equal((await service.accept({ offer_id: open.offers[0].offer_id, user_approved: true, shop: 'mustafa-test-dev.myshopify.com' })).status, 'not_found', 'an offer belongs to the store that made it');

// --- A stored offer is data: one that no longer fits the mandate never becomes a code.
const fresh = await service.request({ ...BOARD, ...shopper(), priority: 'lowest_price' });
const target = await store.getOffer(fresh.offers[0].offer_id);
const cut = target.offer.components.map(c => (c.type === 'price' ? { ...c, amount_off: 400, seller_cost: 1 } : c));
await store.updateOffer(target.id, { offer: { ...target.offer, components: cut } });
const before = mints.length;
const refused = await service.accept({ offer_id: target.id, user_approved: true });
show('accept an offer tampered with in storage', refused);
assert.equal(refused.status, 'withdrawn');
assert.ok(!/floor|budget|cost/i.test(JSON.stringify(refused)), 'why it failed stays with the seller');
assert.deepEqual((await store.getOffer(target.id)).withdrawn_for, ['unit price below floor']);
assert.equal(mints.length, before);

// --- The adapter fails: nothing is issued, and accepting again works.
failing.next = true;
console.error = () => {};
const down = await service.accept({ offer_id: fresh.offers[1].offer_id, user_approved: true });
console.error = crash;
show('accept while the store cannot mint', down);
assert.deepEqual([down.status, typeof down.error], ['failed', 'string']);
assert.equal((await service.accept({ offer_id: fresh.offers[1].offer_id, user_approved: true })).status, 'accepted');

// --- Privacy. Nothing told to the buyer side, and no log line, names a seller-only
// field or shows one of the board's private numbers: floor, unit cost, budget,
// room, the share of it given without proof.
const SELLER_KEYS = ['seller_cost', 'unit_cost', 'cost', 'floor', 'budget', 'budget_per_order', 'room', 'pace', 'source', 'evidence', 'asked', 'session', 'withdrawn_for'];
const keysIn = x => (x && typeof x === 'object' ? Object.entries(x).flatMap(([k, v]) => [...(Array.isArray(x) ? [] : [k]), ...keysIn(v)]) : []);
// Numbers a reader could see, leaving out what is not a quantity: ids, codes, links and times.
const numbersIn = x => new Set((JSON.stringify(x)
  .replace(/of_[0-9a-f]{20}|OFFER-CHK\d+[AB]|gid:\/\/[^"\s,)]+|https?:\/\/[^"\s]+|\d{4}-\d\d-\d\dT[\d:.]+Z/g, ' ')
  .match(/\d+(?:\.\d+)?/g) || []).map(Number));
const secretsOf = m => [1, 2].flatMap(qty => [m.floor, m.unit_cost, m.budget_per_order, roomFor(m, qty), r2(roomFor(m, qty) * PACE_SHARE[m.pace])]);
// One coincidence is built into the policy and is not this service's to hide:
// when the store gives all it has as money (a trusted link it cannot reach),
// the buyer's saving IS the room. That number may stand in a reply as you_save,
// the saving, and nowhere else; the run counts how often it happened.
let gaveAll = 0;
function assertPrivate(what, value, secrets) {
  for (const key of keysIn(value)) assert.ok(!SELLER_KEYS.includes(key), `${what} names the seller-only field "${key}"`);
  const rest = JSON.parse(JSON.stringify(value), (key, v) => {
    if (key !== 'you_save' || ![...secrets].includes(v)) return v;
    gaveAll++;
    return undefined;
  });
  const seen = numbersIn(rest);
  for (const n of secrets) assert.ok(!seen.has(n), `${what} shows the private number ${n}: ${JSON.stringify(value).slice(0, 300)}`);
}
const boardSecrets = secretsOf(board);
assert.deepEqual([...new Set(boardSecrets)], [545, 410, 150, 112.5]);
for (const { op, input, reply } of told) {
  const aboutBoard = /complete/.test(String(input?.product ?? '')) || reply.terms || reply.offer;
  assertPrivate(`${op} -> ${reply.status}`, reply, aboutBoard ? boardSecrets : []);
}
const lines = await store.recent(500);
assert.ok(lines.length > 60 && ['options', 'request', 'accept'].every(type => lines.some(l => l.type === type)));
for (const line of lines) {
  assertPrivate(`log line ${line.type}`, line, boardSecrets);
  assert.ok(!/check-session|198\.51\.100|203\.0\.113|OFFER-CHK|of_[0-9a-f]{20}/.test(JSON.stringify(line)), 'the log holds no session, address, code or offer id');
}

// The same again where every seller-only number is unmistakable. The demo
// shop's costs are small round numbers (3, 6, 8, 18) that also turn up as days
// and counts, so a third shop is registered for this check only, with costs
// that look like nothing else. No reply and no log line may show any of them,
// nor what any part of an offer costs the seller.
SHOPS['canary.example'] = {
  ...SHOPS.demo,
  shop: 'canary.example',
  name: 'Canary',
  storefront: 'https://canary.example',
  settle: 'shopify',
  shipping: { standard: { days: 6, price: 19.9, cost: 17.37 }, express: { days: 2, price: 39.9, cost: 33.61 } },
  concessions: {
    ...SHOPS.demo.concessions,
    gift: { ...SHOPS.demo.concessions.gift, cost: 7.83 },
    extended_returns: { ...SHOPS.demo.concessions.extended_returns, cost: 5.71 },
    delivery_guarantee: { ...SHOPS.demo.concessions.delivery_guarantee, cost: 2.59 },
    next_order_credit: { ...SHOPS.demo.concessions.next_order_credit, cost: 17.23 },
  },
};
const canaryStore = memoryStore({ now });
const canary = watch(createService({ store: canaryStore, adapterFor, verify, now }), canaryStore);
const CANARY = { shop: 'canary.example', product: 'the-complete-snowboard' };
const bird = mandateFor('canary.example', CANARY.product);
const from = told.length;
await canary.options({ ...CANARY, ...shopper() });
for (const priority of [undefined, 'lowest_price', 'fast_delivery', 'easy_returns', 'extras', 'repeat_purchase']) {
  for (const quantity of [1, 2]) await canary.request({ ...CANARY, ...shopper(), priority, quantity });
}
for (const url of Object.keys(PAGES)) await canary.request({ ...CANARY, ...shopper(), priority: 'lowest_price', competing_offer_url: url });
for (const { reply } of told.slice(from)) {
  for (const o of reply.offers || []) {
    await canary.accept({ offer_id: o.offer_id });
    await canary.accept({ offer_id: o.offer_id, user_approved: true });
    await canary.status({ offer_id: o.offer_id });
  }
}
const canarySecrets = new Set([...secretsOf(bird), 17.37, 33.61, 7.83, 5.71, 2.59, 17.23]);
let offersSeen = 0;
for (const { reply } of told.slice(from)) {
  for (const o of reply.offers || []) {
    const kept = (await canaryStore.getOffer(o.offer_id)).offer;
    offersSeen++;
    // A price cut costs the seller exactly what the buyer sees; everything else costs something else.
    for (const c of kept.components) if (c.type !== 'price') canarySecrets.add(c.seller_cost);
    if (kept.components.some(c => c.type !== 'price')) canarySecrets.add(kept.seller_cost);
  }
}
// Among them: what the express upgrade, the extras bundle and the matched offer cost the seller.
assert.ok(offersSeen > 30 && [16.24, 58.67, 87.37].every(n => canarySecrets.has(n)));
for (const { op, reply } of told.slice(from)) assertPrivate(`canary ${op} -> ${reply.status}`, reply, canarySecrets);
for (const line of await canaryStore.recent(500)) assertPrivate(`canary log line ${line.type}`, line, canarySecrets);
assert.ok(told.slice(from).filter(x => x.reply.status === 'accepted').length > 30);
delete SHOPS['canary.example'];
console.log(`\nprivacy: ${told.length} replies and ${lines.length} log lines hold no seller-only field or number (${canarySecrets.size} canary numbers checked)`);
assert.equal(gaveAll, 1, 'only the offer that gave the whole room shows it, as the saving');
console.log(`   in ${gaveAll} reply the saving equals the whole room: the policy gave everything it had (trusted proof below what the store can do)`);

// --- The store contract, for both stores. `advance` lets time pass.
async function storeContract(db, advance) {
  const expires_at = iso(Date.now() + 30 * MIN);
  assert.equal(await db.getOffer('of_missing'), null);
  await db.putOffer({ id: 'of_a', n: 1, nested: { x: 1 }, expires_at });
  const got = await db.getOffer('of_a');
  assert.deepEqual(got, { id: 'of_a', n: 1, nested: { x: 1 }, expires_at });
  got.nested.x = 99;
  assert.equal((await db.getOffer('of_a')).nested.x, 1, 'what is read is a copy');
  assert.deepEqual(await db.updateOffer('of_a', { n: 2, more: true }), { id: 'of_a', n: 2, nested: { x: 1 }, expires_at, more: true });
  assert.equal(await db.updateOffer('of_missing', { n: 2 }), null);
  await assert.rejects(() => db.putOffer({ n: 1 }), /id/);
  await db.putCode({ code: 'OFFER-AbC234', used: false });
  assert.equal((await db.getCode(' offer-abc234 ')).code, 'OFFER-AbC234', 'codes are found whatever their case');
  assert.equal((await db.updateCode('offer-ABC234', { used: true })).used, true);
  assert.equal(await db.getCode('OFFER-NOPE'), null);
  assert.equal(await db.updateCode('OFFER-NOPE', { used: true }), null);
  await assert.rejects(() => db.putCode({ code: ' ' }), /code/);
  assert.equal(await db.getOffer('OFFER-ABC234'), null, 'offers and codes do not share keys');
  assert.deepEqual([await db.bump('k', 0.2), await db.bump('k', 0.2), await db.bump('other', 0.2)], [1, 2, 1]);
  await advance(250);
  assert.equal(await db.bump('k', 0.2), 1, 'a new window opens after the old one closes');
  const burst = await Promise.all(Array.from({ length: 12 }, () => db.bump('burst', 60)));
  assert.deepEqual(burst.sort((a, b) => a - b), Array.from({ length: 12 }, (_, i) => i + 1), 'hits at the same moment never share a count');
  await db.log({ type: 'first' });
  await db.log({ type: 'second', at: 'given' });
  const [newest, older] = await db.recent(2);
  assert.deepEqual([newest, older.type, typeof older.at], [{ at: 'given', type: 'second' }, 'first', 'string']);
  assert.equal((await db.recent()).length, 2);
  await db.updateCode('OFFER-ABC234', { used: false });
  const codeClaims = await Promise.all(['order-one', 'order-two'].map(order => db.claimCode('offer-abc234', order)));
  assert.equal(codeClaims.filter(c => c.ok).length, 1, 'only one simultaneous order redeems a code');
  const owner = (await db.getCode('OFFER-ABC234')).order_id;
  assert.deepEqual(await db.claimCode('OFFER-ABC234', owner), { ok: true, first: false });
  const offerClaims = await Promise.all(['order-one', 'order-two'].map(order => db.claimOfferOrder('of_a', order)));
  assert.equal(offerClaims.filter(c => c.ok).length, 1, 'one order owns an offer');
  assert.deepEqual(await db.claimOfferOrder('of_a', (await db.getOffer('of_a')).order_id), { ok: true, first: false });
  await db.updateCode('OFFER-ABC234', { used: false, order_id: null, expires_at: '2020-01-01T00:00:00Z', revoked: true });
  assert.equal((await db.claimCode('OFFER-ABC234', 'late-order')).ok, false);
  assert.deepEqual(await db.claimCode('OFFER-ABC234', 'late-order', { observed_order: true }), { ok: true, first: true }, 'authenticated order evidence can arrive after expiry or revocation');
}

await storeContract(memoryStore({ now }), ms => { clock.t += ms; });
// Old records are swept, and the log is capped.
const attic = memoryStore({ now });
await attic.putOffer({ id: 'of_old', expires_at: iso(clock.t) });
for (let i = 0; i < 510; i++) await attic.log({ i });
clock.t += 29 * 86400000;
await attic.bump('tick', 1);
assert.ok(await attic.getOffer('of_old'), 'an expired record is kept for a while');
clock.t += 2 * 86400000;
await attic.bump('tick', 1);
assert.equal(await attic.getOffer('of_old'), null, 'and then swept');
assert.deepEqual([(await attic.recent(999)).length, (await attic.recent(1))[0].i], [500, 509]);

// The Durable Object runs the same operations over SQLite. Node has SQLite built
// in, so the class and doStore() are exercised here against a real database,
// through the slice of the Durable Object storage API the class uses.
let sqlite = null;
try { sqlite = await import('node:sqlite'); } catch { console.log('\nnode:sqlite is not available: the Durable Object store was not exercised'); }
if (sqlite) {
  const file = new sqlite.DatabaseSync(':memory:');
  const cursor = rows => ({ toArray: () => rows });
  const sql = { exec: (query, ...bindings) => (bindings.length ? cursor(file.prepare(query).all(...bindings)) : (file.exec(query), cursor([]))) };
  const object = new Offers({ storage: { sql } }, {});
  const env = { OFFERS: { idFromName: name => name, get: () => object } };
  await storeContract(doStore(env), ms => new Promise(resolve => setTimeout(resolve, ms)));
  assert.deepEqual(file.prepare('SELECT kind, COUNT(*) AS n FROM records GROUP BY kind ORDER BY kind').all().map(r => [r.kind, Number(r.n)]), [['code', 1], ['hits', 3], ['offer', 1]]);
  // The whole service over the Durable Object store.
  const desk = createService({ store: doStore(env), adapterFor, verify, now });
  const asked = await desk.request({ ...BOARD, ...shopper(), priority: 'lowest_price' });
  const done = await desk.accept({ offer_id: asked.offers[0].offer_id, user_approved: true });
  assert.deepEqual([asked.status, done.status, (await desk.status({ code: done.codes[0] })).code_state], ['offer', 'accepted', 'unused']);
  console.log('the Durable Object store passed the same contract over SQLite');
}
assert.throws(() => doStore({}), /OFFERS/);

// Real adapter preflight: no accepted reply can overpromise missing shipping.
{
  const db = memoryStore({ now });
  const calls = [], external = new Map();
  const fetchFn = async (_, init) => {
    const { query, variables } = JSON.parse(init.body);
    const operation = query.match(/^(?:mutation|query) (\w+)/)[1];
    calls.push(operation);
    if (operation === 'codeDiscountNodeByCode') {
      const held = external.get(variables.code);
      return Response.json({ data: { codeDiscountNodeByCode: held || null } });
    }
    const input = Object.values(variables)[0];
    if (external.has(input.code)) return Response.json({ data: { [operation]: { userErrors: [{ code: 'TAKEN', message: 'Already created' }] } } });
    const id = `gid://shopify/DiscountCodeNode/${external.size + 1}`;
    external.set(input.code, { id, codeDiscount: { title: input.title, endsAt: input.endsAt } });
    return Response.json({ data: { [operation]: { codeDiscountNode: { id }, codeAppDiscount: { discountId: id }, userErrors: [] } } });
  };
  const native = shopifyAdapter({ shop: dev.shop, token: 'stub-only', fetchFn, now });
  const desk = createService({ store: db, adapterFor: () => native, now });
  const request = await desk.request({ ...dev, session: 'real-adapter', priority: 'fast_delivery' });
  const blocked = await desk.accept({ offer_id: request.offers[0].offer_id, user_approved: true });
  assert.equal(blocked.status, 'not_deliverable');
  assert.equal(calls.length, 0, 'unsupported express and shipping produce no code');
  assert.ok(blocked.alternatives.length);
  const alternative = blocked.alternatives[0];
  assert.ok(!alternative.components.some(c => ['express_upgrade', 'free_shipping'].includes(c.type)));
  assert.equal(alternative.ship_days, 6);
  assert.equal((await desk.accept({ offer_id: alternative.offer_id })).status, 'needs_approval');
  assert.equal((await desk.accept({ offer_id: alternative.offer_id, user_approved: true })).status, 'accepted');
  assert.equal((await desk.accept({ offer_id: request.offers[0].offer_id, user_approved: true })).alternatives[0].offer_id, alternative.offer_id, 'retries reuse the alternative');
  assertPrivate('native alternatives', blocked, boardSecrets);

  // A durable result is saved before final acceptance. Failed result persistence
  // is reconciled through the same deterministic external code after claim expiry.
  for (const faultAt of ['mint_result', 'accepted', 'code']) {
    let fail = true;
    const base = memoryStore({ now });
    const faulty = { ...base,
      updateOffer: async (id, patch) => {
        if (fail && ((faultAt === 'mint_result' && patch.mint_result) || (faultAt === 'accepted' && patch.status === 'accepted'))) { fail = false; throw new Error('simulated write failure'); }
        return base.updateOffer(id, patch);
      },
      putCode: async rec => { if (fail && faultAt === 'code') { fail = false; throw new Error('simulated code mapping failure'); } return base.putCode(rec); },
    };
    const recovery = createService({ store: faulty, adapterFor: () => native, now });
    const r = await recovery.request({ ...dev, session: `fault-${faultAt}`, priority: 'lowest_price' });
    const prior = external.size;
    await assert.rejects(recovery.accept({ offer_id: r.offers[0].offer_id, user_approved: true }), /simulated/);
    assert.equal(external.size, prior + 1);
    clock.t += 121000;
    const done = await recovery.accept({ offer_id: r.offers[0].offer_id, user_approved: true });
    assert.equal(done.status, 'accepted');
    assert.equal(external.size, prior + 1, 'retry creates no second external discount');
    assert.equal((await base.getCode(done.codes[0])).offer_id, done.offer_id);
    await base.updateCode(done.codes[0], { revoked: true });
    assert.equal((await recovery.status({ offer_id: done.offer_id })).code_state, 'revoked');
    assert.match((await recovery.accept({ offer_id: done.offer_id })).next, /cancelled/);
  }
  console.log('native alternatives require fresh approval; mint and mapping write faults recover one external code');
}

// An invoice carries the full quote without a fictitious code or expiry.
{
  const db = memoryStore({ now });
  let issued = 0;
  const desk = createService({ store: db, now, adapterFor: () => ({
    mode: 'draft',
    mint: async offer => ({ mode: 'draft', codes: [], invoice_url: `https://${dev.shop}/invoices/test`, cart_url: `https://${dev.shop}/invoices/test`, draft_order_id: 'gid://shopify/DraftOrder/123', expires_at: null, deferred: offer.components.filter(c => LATER.includes(c.type)), warnings: [], sequence: ++issued }),
  }) });
  const asked = await desk.request({ ...dev, session: 'invoice', priority: 'extras' });
  assert.equal((await desk.accept({ offer_id: asked.offers[0].offer_id })).status, 'needs_approval');
  const accepted = await desk.accept({ offer_id: asked.offers[0].offer_id, user_approved: true });
  assert.deepEqual([accepted.status, accepted.settlement, accepted.codes, accepted.expires_at], ['accepted', 'draft', [], null]);
  assert.deepEqual(accepted.terms.components, asked.offers[0].components);
  assert.equal(accepted.cart_lines[1].free_with_invoice, true);
  assert.equal((await db.getOffer(accepted.offer_id)).draft_order_id, 'gid://shopify/DraftOrder/123');
  assert.equal((await desk.status({ offer_id: accepted.offer_id })).settlement_state, 'invoice_ready');
  clock.t += 61 * MIN;
  assert.deepEqual(await desk.accept({ offer_id: accepted.offer_id }), accepted);
  assert.equal(issued, 1);
  await db.updateOffer(accepted.offer_id, { order_id: 'gid://shopify/Order/123' });
  assert.equal((await desk.status({ offer_id: accepted.offer_id })).settlement_state, 'ordered');
  assertPrivate('invoice terms', accepted, boardSecrets);
  console.log('draft invoice retains the full quote, no discount code and no enforced timed expiry');
}

// Draft creation has no unique external creation key. After ambiguity or
// a crash before result persistence, retries must reconcile and never create.
{
  const db = memoryStore({ now });
  const options = [];
  const adapter = { mode: 'draft', mint: async (_, __, opts) => {
    options.push(opts);
    if (!opts.reconcile_only) throw Object.assign(new Error('draft create response lost'), { reason: 'uncertain_mint' });
    return { mode: 'draft', codes: [], invoice_url: `https://${dev.shop}/invoices/recovered`, draft_order_id: 'gid://shopify/DraftOrder/987', expires_at: null, deferred: [] };
  } };
  const desk = createService({ store: db, now, adapterFor: () => adapter });
  const r = await desk.request({ ...dev, session: 'ambiguous-invoice', priority: 'fast_delivery' });
  console.error = () => {};
  const uncertain = await desk.accept({ offer_id: r.offers[0].offer_id, user_approved: true });
  console.error = crash;
  assert.equal(uncertain.status, 'failed');
  assert.ok((await db.getOffer(r.offers[0].offer_id)).mint_uncertain);
  clock.t += 31 * MIN;
  const recovered = await desk.accept({ offer_id: r.offers[0].offer_id, user_approved: true });
  assert.equal(recovered.settlement, 'draft');
  assert.deepEqual(options.map(o => !!o.reconcile_only), [false, true]);
  const original = await db.getOffer(r.offers[0].offer_id);
  const interrupted = { ...original, id: 'of_abcdef1234567890abcd', status: 'open', mint_result: null, mint_uncertain: false };
  await db.putOffer(interrupted);
  assert.equal((await desk.accept({ offer_id: interrupted.id, user_approved: true })).settlement, 'draft');
  assert.equal(options.at(-1).reconcile_only, true, 'a loaded durable intent is sufficient after a process crash');
  console.log('ambiguous draft creates and interrupted result writes enter reconciliation-only recovery');
}

console.log('\nservice checks passed');
