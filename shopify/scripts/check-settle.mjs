// Checks the settlement adapters. Run: node shopify/scripts/check-settle.mjs
// The Shopify adapter talks to a stub that records every request, so nothing
// here reaches a store. With --store the dry checks also run against store.js.
import assert from 'node:assert/strict';
import { decide, publicOffer, PRIORITIES, r2 } from '../offers/src/lib/policy.js';
import { SHOPS, mandateFor, listProducts } from '../offers/src/lib/mandates.js';
import { dryAdapter, shopifyAdapter, annotateOrder, offerTerms, SettleError } from '../offers/src/lib/settle.js';

const NOW = Date.parse('2026-10-13T12:00:00Z');
const HOUR = 3600000;
const iso = ms => new Date(ms).toISOString();
// OFFER- and six to eight characters, none of them 0, O, 1, I or L.
const CODE = /^OFFER-[2-9A-HJKMNP-Z]{6,8}$/;
const DEFERRED = ['extended_returns', 'delivery_guarantee', 'next_order_credit'];
const PRIORITY_IDS = [undefined, ...Object.keys(PRIORITIES)];
const SHOP = Object.keys(SHOPS).find(s => SHOPS[s].settle === 'shopify');
const TOKEN = 'test-token-not-a-secret';
const HANDLE = 'offer-discount';
const say = (...a) => console.log(...a);

// The store interface from the spec, in memory and async like the Durable Object one.
function memory() {
  const codes = new Map(), offers = new Map(), events = [];
  return {
    async putOffer(rec) { offers.set(rec.offer_id, structuredClone(rec)); },
    async getOffer(id) { return offers.get(id) ?? null; },
    async updateOffer(id, patch) { offers.set(id, { ...offers.get(id), ...patch }); },
    async putCode(rec) { codes.set(rec.code, structuredClone(rec)); },
    async getCode(code) { return codes.get(code) ?? null; },
    async updateCode(code, patch) { codes.set(code, { ...codes.get(code), ...patch }); },
    async claimCode(code, order_id) {
      const rec = codes.get(code);
      if (!rec || rec.used || rec.revoked || Date.parse(rec.expires_at) <= NOW) return { ok: false };
      codes.set(code, { ...rec, used: true, order_id });
      return { ok: true, first: true };
    },
    async bump() { return 1; },
    async log(event) { events.push(event); },
    async recent(limit = 50) { return events.slice(-limit); },
    events,
  };
}

// Names and numbers that belong to the seller alone. They must not show up in
// anything the adapters send, return or keep against a code.
const PRIVATE_WORDS = ['seller_cost', 'floor', 'unit_cost', 'budget', 'cost'];
const PRIVATE_KEYS = ['pace', 'room', 'source', 'max_off', 'below_cost_reason'];
function assertPublic(value, mandate, where) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  for (const word of PRIVATE_WORDS) assert.ok(!text.includes(word), `${where}: "${word}" must not appear`);
  // The boards' floor, unit cost and budget are numbers no public term equals.
  const secret = mandate.floor > 100 ? [mandate.floor, mandate.unit_cost, mandate.budget_per_order] : [];
  const walk = v => {
    if (typeof v === 'string' && /^[[{]/.test(v)) { try { walk(JSON.parse(v)); } catch { /* not JSON after all */ } return; }
    if (typeof v === 'number' || (typeof v === 'string' && /^\d+(\.\d+)?$/.test(v))) { assert.ok(!secret.includes(Number(v)), `${where}: the private number ${v} must not appear`); return; }
    if (!v || typeof v !== 'object') return;
    for (const [k, x] of Object.entries(v)) {
      assert.ok(!PRIVATE_KEYS.includes(k), `${where}: the key "${k}" must not appear`);
      walk(x);
    }
  };
  walk(typeof value === 'string' ? JSON.parse(value) : value);
}

const has = (offer, type) => offer.components.find(c => c.type === type);
const priceOf = offer => offer.components.filter(c => c.type === 'price');
const linesOf = (m, offer) => `${m.product.variant_numeric_id}:${offer.quantity}${has(offer, 'gift') ? `,${has(offer, 'gift').variant_id.split('/').pop()}:1` : ''}`;

// ---------------------------------------------------------------------------
// Dry adapter

let serial = 0;

// Mint an offer, open the cart its link points at, and compare with the promise.
async function roundTrip(dry, store, m, offer) {
  const tag = `${m.product.handle} x${offer.quantity} [${offer.headline}]`;
  const out = await dry.mint(offer, m, { offer_id: `of_${++serial}`, ttl_minutes: 60 });
  assert.equal(out.mode, 'dry');
  assert.equal(out.codes.length, 1, tag);
  assert.match(out.codes[0], CODE);
  assert.equal(out.expires_at, iso(NOW + HOUR), 'codes expire after ttl_minutes');
  assert.equal(out.cart_url, `/demo/cart/${linesOf(m, offer)}?discount=${out.codes[0]}`, tag);
  assert.deepEqual(out.deferred.map(d => d.label), offer.components.filter(c => DEFERRED.includes(c.type)).map(c => c.label), tag);
  assert.deepEqual(out.warnings, [], tag);

  const link = new URL(out.cart_url, 'https://demo.example');
  const cart = await dry.evaluate(link.searchParams.get('discount'), link.pathname.split('/cart/')[1]);
  assert.deepEqual(cart.rejected, [], tag);
  for (const k of ['items_total', 'shipping_total', 'total', 'ship_days']) assert.equal(cart.totals[k], offer[k], `${tag}: ${k}`);
  assert.equal(cart.totals.currency, offer.currency);

  // Every money component shows as a line of its own, and the lines add up.
  const sum = target => r2(cart.applied.filter(a => a.target === target).reduce((a, x) => a + x.amount, 0));
  const priceOff = r2(priceOf(offer).reduce((a, c) => a + c.amount_off, 0));
  assert.equal(sum('items'), r2(priceOff + (has(offer, 'gift')?.buyer_value ?? 0)), tag);
  assert.equal(sum('items'), cart.totals.discount_total, tag);
  assert.equal(sum('shipping'), cart.totals.shipping_discount, tag);
  const titles = cart.applied.map(a => a.title);
  if (priceOff) assert.ok(titles.includes(priceOf(offer).map(c => c.label).join(' + ')), tag);
  for (const type of ['gift', 'free_shipping', 'express_upgrade']) if (has(offer, type)) assert.ok(titles.includes(has(offer, type).label), `${tag}: ${type} applied`);
  assert.ok(cart.applied.every(a => a.code === out.codes[0] && a.amount > 0));
  assert.deepEqual(cart.deferred.map(d => d.title), out.deferred.map(d => d.label), tag);

  const record = await store.getCode(out.codes[0]);
  assert.equal(record.used, false);
  assert.equal(record.expires_at, out.expires_at);
  for (const [what, value] of [['mint reply', out], ['cart', cart], ['code record', record]]) assertPublic(value, m, `${tag}: ${what}`);
  return { out, cart };
}

async function dryEndToEnd(makeStore, label) {
  say(`\n== dry adapter (${label}): mint, open the cart link, compare with the promise`);
  const store = makeStore();
  const dry = dryAdapter(store, { now: () => NOW });
  const board = mandateFor('demo', 'the-complete-snowboard');
  const wax = mandateFor('demo', 'selling-plans-ski-wax');
  const seen = new Set();
  let count = 0;

  // Every product, every priority, three quantities.
  for (const m of listProducts('demo')) {
    for (const priority of PRIORITY_IDS) {
      for (const quantity of [1, 2, 5]) {
        for (const offer of decide(m, { priority, quantity }).offers) {
          const { out, cart } = await roundTrip(dry, store, m, offer);
          assert.ok(!seen.has(out.codes[0]), 'codes are not reused');
          seen.add(out.codes[0]);
          count++;
          if (m.product.handle === board.product.handle && quantity === 1 && priority && offer.kind === 'for_your_priority') {
            say(`   ${priority}: ${offer.headline}`);
            say(`      ${out.cart_url}`);
            say(`      cart: items ${cart.totals.items_total} + shipping ${cart.totals.shipping_total} = ${cart.totals.total}, ships in ${cart.totals.ship_days}d (promised ${offer.total}, ${offer.ship_days}d); after purchase: ${out.deferred.length ? out.deferred.map(d => d.label).join('; ') : 'nothing'}`);
          }
        }
      }
    }
  }

  // Offers made against a verified competing offer: matched, best effort, capped.
  const ev = { ok: true, domain: 'evo.com', trusted_domain: true, match_by: 'gtin', price: 629.95, shipping: 0 };
  for (const evidence of [ev, { ...ev, price: 499 }, { ...ev, domain: 'random-shop.example', trusted_domain: false }]) {
    for (const offer of decide(board, { priority: 'lowest_price' }, evidence).offers) { await roundTrip(dry, store, board, offer); count++; }
  }

  // Express upgrade without free shipping: the buyer pays the standard rate for express.
  const noFree = { ...board, concessions: { ...board.concessions, free_shipping: { on: false } } };
  const expressOnly = decide(noFree, { priority: 'fast_delivery' }).offers[0];
  assert.ok(has(expressOnly, 'express_upgrade') && !has(expressOnly, 'free_shipping'));
  const upgraded = await roundTrip(dry, store, noFree, expressOnly);
  count++;
  assert.equal(upgraded.cart.totals.shipping_method, 'express');
  assert.equal(upgraded.cart.totals.shipping_total, board.shipping.standard.price);
  const hydrogen = mandateFor('demo', 'the-collection-snowboard-hydrogen');
  const boardPrice = decide(board, { priority: 'lowest_price' }).offers[0];
  const hydrogenPrice = decide(hydrogen, { priority: 'lowest_price' }).offers[0];
  const codeA = await dry.mint(boardPrice, board, { offer_id: `of_combine_a_${++serial}` });
  const codeB = await dry.mint(hydrogenPrice, hydrogen, { offer_id: `of_combine_b_${++serial}` });
  const both = await dry.evaluate([...codeA.codes, ...codeB.codes], `${board.product.variant_numeric_id}:1,${hydrogen.product.variant_numeric_id}:1`);
  assert.equal(both.totals.discount_total, priceOf(boardPrice).reduce((n, c) => n + c.amount_off, 0));
  assert.equal(both.rejected[0].reason, 'not_combinable', 'independently budgeted offers do not stack across products');
  const raced = await Promise.all([1, 2].map(() => dry.redeem(codeA.codes)));
  assert.equal(raced.flatMap(r => r.redeemed).length, 1, 'simultaneous redemptions spend a code once');
  say(`   ${count} offers minted; every cart costs what policy.js promised`);

  // What a cart does with a code that should not apply, and with none.
  const cheap = decide(board, { priority: 'lowest_price' }).offers[0];
  const lines = linesOf(board, cheap);
  const bare = await dry.evaluate([], lines);
  assert.deepEqual([bare.applied, bare.rejected], [[], []]);
  assert.equal(bare.totals.total, cheap.list_total, 'no code, list total');

  const first = (await dry.mint(cheap, board, { offer_id: 'of_first' })).codes[0];
  const second = (await dry.mint(cheap, board, { offer_id: 'of_second' })).codes[0];
  const reason = async (codes, cart, adapter = dry) => (await adapter.evaluate(codes, cart)).rejected.map(r => r.reason).join(',');
  assert.equal(await reason('OFFER-NOSUCH', lines), 'unknown_code');
  assert.equal(await reason(first, `${wax.product.variant_numeric_id}:1`), 'not_in_cart');
  assert.equal(await reason([first, second], lines), 'not_combinable');
  assert.equal(await reason(first, lines, dryAdapter(store, { now: () => NOW + HOUR })), 'expired');
  assert.equal(await reason(first.toLowerCase(), lines), '', 'codes are case-insensitive');
  const pair = decide(board, { priority: 'lowest_price', quantity: 2 }).offers[0];
  const forTwo = (await dry.mint(pair, board, { offer_id: 'of_pair' })).codes[0];
  assert.equal(await reason(forTwo, lines), 'quantity_too_low');
  const three = await dry.evaluate(forTwo, `${board.product.variant_numeric_id}:3`);
  assert.equal(three.totals.discount_total, r2(priceOf(pair).reduce((a, c) => a + c.amount_off, 0)), 'more units than offered: the same amount off, not more');
  const rejectedFully = await dry.evaluate('OFFER-NOSUCH', lines);
  assert.equal(rejectedFully.totals.total, cheap.list_total, 'a rejected code changes nothing');
  assert.ok(rejectedFully.rejected[0].reason_text);

  // Single use, and withdrawal.
  assert.deepEqual(await dry.redeem(first), { redeemed: [first] });
  assert.equal(await reason(first, lines), 'already_used');
  assert.deepEqual(await dry.redeem(first), { redeemed: [] });
  assert.deepEqual(await dry.revoke(second), { ok: true, code: second });
  assert.equal(await reason(second, lines), 'revoked');
  assert.equal((await dry.revoke('OFFER-NOSUCH')).reason, 'not_found');

  // The add-on is only free if it is in the cart; nothing else changes.
  const extras = decide(board, { priority: 'extras' }).offers[0];
  const withGift = (await dry.mint(extras, board, { offer_id: 'of_gift' })).codes[0];
  const forgot = await dry.evaluate(withGift, `${board.product.variant_numeric_id}:1`);
  assert.equal(forgot.totals.total, extras.total);
  assert.ok(forgot.notes.some(n => n.includes('add it to the cart')));
  assert.ok(!forgot.applied.some(a => a.title === has(extras, 'gift').label));

  // Free standard shipping does not pay for express; an express offer may still ship standard.
  const free = decide(board, { priority: 'easy_returns' }).offers[0];
  const freeCode = (await dry.mint(free, board, { offer_id: 'of_free' })).codes[0];
  const viaExpress = await dry.evaluate(freeCode, { lines: linesOf(board, free), shipping_method: 'express' });
  assert.equal(viaExpress.totals.shipping_total, board.shipping.express.price);
  assert.equal(viaExpress.notes.length, 1);
  const fast = decide(board, { priority: 'fast_delivery' }).offers[0];
  const fastCode = (await dry.mint(fast, board, { offer_id: 'of_fast' })).codes[0];
  const viaStandard = await dry.evaluate(fastCode, { lines: [{ variant_id: board.product.variant_id, quantity: 1 }], shipping_method: 'standard' });
  assert.deepEqual([viaStandard.totals.shipping_total, viaStandard.totals.ship_days], [0, board.shipping.standard.days]);

  // A cart cannot price itself: the store's list price wins over a price it sends.
  const lying = await dry.evaluate([], [{ variant: board.product.variant_numeric_id, quantity: 1, price: 1 }]);
  assert.equal(lying.totals.subtotal, board.product.list);

  // If the service rewrites the code record in its own shape, the stored offer still prices the cart.
  const kept = await dry.mint(cheap, board, { offer_id: 'of_kept' });
  await store.putOffer({ offer_id: 'of_kept', shop: 'demo', product: board.product.handle, offer: cheap });
  await store.putCode({ code: kept.codes[0], offer_id: 'of_kept', shop: 'demo', deferred: kept.deferred, expires_at: kept.expires_at });
  assert.equal((await dry.evaluate(kept.codes[0], lines)).totals.total, cheap.total);

  // A stored offer that was tampered with never becomes a code, and the refusal names no number.
  const tampered = structuredClone(cheap);
  tampered.components[0].amount_off = 400;
  await assert.rejects(dry.mint(tampered, board, { offer_id: 'of_bad' }), e => e instanceof SettleError && e.reason === 'policy' && !/\d/.test(e.message));
  await assert.rejects(dry.mint({ ...cheap, components: [] }, board, {}), e => e.reason === 'bad_offer');

  // A later-order credit becomes a code when the order is in, once.
  const repeat = decide(board, { priority: 'repeat_purchase' }).offers[0];
  const bought = await dry.mint(repeat, board, { offer_id: 'of_repeat' });
  const noted = await dry.annotateOrder('demo-order-1', { code: bought.codes[0], offer_id: 'of_repeat', deferred: bought.deferred });
  assert.equal(noted.codes.length, 1);
  assert.match(noted.codes[0].code, CODE);
  assert.equal(noted.codes[0].amount, has(repeat, 'next_order_credit').amount);
  assert.equal(noted.codes[0].expires_at, iso(NOW + has(repeat, 'next_order_credit').valid_days * 24 * HOUR));
  const again = await dry.annotateOrder('demo-order-1', { code: bought.codes[0], offer_id: 'of_repeat', deferred: bought.deferred });
  assert.deepEqual([again.already, again.codes], [true, noted.codes]);
  const next = await dry.evaluate(noted.codes[0].code, lines);
  assert.equal(next.totals.total, r2(cheap.list_total - noted.codes[0].amount), 'the credit comes off the next order');
  assert.equal(await reason([noted.codes[0].code, forTwo], `${board.product.variant_numeric_id}:2`), 'not_combinable', 'a credit does not stack on a price cut');
  assertPublic(store.events, board, 'log');
  say('   refused: unknown_code, not_in_cart, not_combinable, expired, quantity_too_low, already_used, revoked');
  say(`   next-order credit: ${noted.codes[0].code} takes ${noted.codes[0].amount} off a later cart, until ${noted.codes[0].expires_at.slice(0, 10)}`);
}

// ---------------------------------------------------------------------------
// Shopify adapter against a stub Admin API

// Input shapes as the 2026-10 Admin GraphQL reference documents them. Every
// recorded request must use only these field names, nested this way, with
// scalars in their documented serialisation.
const INPUTS = {
  DiscountCodeBasicInput: { appliesOncePerCustomer: 'Boolean', code: 'String', combinesWith: 'DiscountCombinesWithInput', context: 'DiscountContextInput', customerGets: 'DiscountCustomerGetsInput', endsAt: 'DateTime', minimumRequirement: 'DiscountMinimumRequirementInput', recurringCycleLimit: 'Int', startsAt: 'DateTime', tags: '[String]', title: 'String', usageLimit: 'Int' },
  DiscountCodeFreeShippingInput: { appliesOncePerCustomer: 'Boolean', appliesOnOneTimePurchase: 'Boolean', appliesOnSubscription: 'Boolean', code: 'String', combinesWith: 'DiscountCombinesWithInput', context: 'DiscountContextInput', destination: 'DiscountShippingDestinationSelectionInput', endsAt: 'DateTime', maximumShippingPrice: 'Decimal', minimumRequirement: 'DiscountMinimumRequirementInput', recurringCycleLimit: 'Int', startsAt: 'DateTime', tags: '[String]', title: 'String', usageLimit: 'Int' },
  DiscountCodeBxgyInput: { appliesOncePerCustomer: 'Boolean', code: 'String', combinesWith: 'DiscountCombinesWithInput', context: 'DiscountContextInput', customerBuys: 'DiscountCustomerBuysInput', customerGets: 'DiscountCustomerGetsInput', endsAt: 'DateTime', startsAt: 'DateTime', tags: '[String]', title: 'String', usageLimit: 'Int', usesPerOrderLimit: 'Int' },
  // functionId and customerSelection are deprecated and deliberately absent.
  DiscountCodeAppInput: { appliesOncePerCustomer: 'Boolean', appliesOnOneTimePurchase: 'Boolean', appliesOnSubscription: 'Boolean', code: 'String', combinesWith: 'DiscountCombinesWithInput', context: 'DiscountContextInput', discountClasses: '[DiscountClass]', endsAt: 'DateTime', functionHandle: 'String', metafields: '[MetafieldInput]', recurringCycleLimit: 'Int', startsAt: 'DateTime', tags: '[String]', title: 'String', usageLimit: 'Int' },
  DiscountCombinesWithInput: { orderDiscounts: 'Boolean', productDiscounts: 'Boolean', shippingDiscounts: 'Boolean' },
  DiscountContextInput: { all: 'DiscountBuyerSelection' },
  DiscountCustomerGetsInput: { appliesOnOneTimePurchase: 'Boolean', appliesOnSubscription: 'Boolean', items: 'DiscountItemsInput', value: 'DiscountCustomerGetsValueInput' },
  DiscountCustomerGetsValueInput: { discountAmount: 'DiscountAmountInput', discountOnQuantity: 'DiscountOnQuantityInput', percentage: 'Float' },
  DiscountAmountInput: { amount: 'Decimal', appliesOnEachItem: 'Boolean' },
  DiscountOnQuantityInput: { effect: 'DiscountEffectInput', quantity: 'UnsignedInt64' },
  DiscountEffectInput: { amount: 'Decimal', percentage: 'Float' },
  DiscountItemsInput: { all: 'Boolean', products: 'DiscountProductsInput' },
  DiscountProductsInput: { productsToAdd: '[ID]', productsToRemove: '[ID]', productVariantsToAdd: '[ID]', productVariantsToRemove: '[ID]' },
  DiscountCustomerBuysInput: { isOneTimePurchase: 'Boolean', isSubscription: 'Boolean', items: 'DiscountItemsInput', value: 'DiscountCustomerBuysValueInput' },
  DiscountCustomerBuysValueInput: { amount: 'Decimal', quantity: 'UnsignedInt64' },
  DiscountMinimumRequirementInput: { quantity: 'DiscountMinimumQuantityInput' },
  DiscountMinimumQuantityInput: { greaterThanOrEqualToQuantity: 'UnsignedInt64' },
  DiscountShippingDestinationSelectionInput: { all: 'Boolean' },
  MetafieldInput: { id: 'ID', key: 'String', namespace: 'String', type: 'String', value: 'String' },
  MetafieldsSetInput: { compareDigest: 'String', key: 'String', namespace: 'String', ownerId: 'ID', type: 'String', value: 'String' },
  OrderInput: { id: 'ID', metafields: '[MetafieldInput]', note: 'String', tags: '[String]' },
};
const SCALARS = {
  Boolean: v => typeof v === 'boolean',
  String: v => typeof v === 'string',
  Int: v => Number.isInteger(v),
  Float: v => typeof v === 'number',
  ID: v => typeof v === 'string' && v.startsWith('gid://shopify/'),
  Decimal: v => typeof v === 'string' && /^\d+(\.\d+)?$/.test(v),
  UnsignedInt64: v => typeof v === 'string' && /^\d+$/.test(v),
  DateTime: v => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/.test(v),
  DiscountBuyerSelection: v => v === 'ALL',
  DiscountClass: v => ['ORDER', 'PRODUCT', 'SHIPPING'].includes(v),
};
// Operation, the argument it declares, and the fields the reference requires on create.
const OPERATIONS = {
  discountCodeBasicCreate: { kind: 'mutation', arg: 'basicCodeDiscount', type: 'DiscountCodeBasicInput', required: ['code', 'context', 'customerGets', 'startsAt', 'title'] },
  discountCodeFreeShippingCreate: { kind: 'mutation', arg: 'freeShippingCodeDiscount', type: 'DiscountCodeFreeShippingInput', required: ['code', 'context', 'startsAt', 'title'] },
  discountCodeBxgyCreate: { kind: 'mutation', arg: 'bxgyCodeDiscount', type: 'DiscountCodeBxgyInput', required: ['code', 'context', 'customerBuys', 'customerGets', 'startsAt', 'title'] },
  discountCodeAppCreate: { kind: 'mutation', arg: 'codeAppDiscount', type: 'DiscountCodeAppInput', required: ['code', 'functionHandle', 'startsAt', 'title'] },
  discountCodeDelete: { kind: 'mutation', arg: 'id', type: 'ID' },
  discountCodeDeactivate: { kind: 'mutation', arg: 'id', type: 'ID' },
  tagsAdd: { kind: 'mutation', args: { id: 'ID', tags: '[String]' } },
  codeDiscountNodeByCode: { kind: 'query', arg: 'code', type: 'String' },
  order: { kind: 'query', arg: 'id', type: 'ID' },
  orderUpdate: { kind: 'mutation', arg: 'input', type: 'OrderInput', required: ['id'] },
  metafieldsSet: { kind: 'mutation', arg: 'metafields', type: '[MetafieldsSetInput]' },
};

function conforms(value, type, path) {
  if (type.startsWith('[')) {
    assert.ok(Array.isArray(value), `${path} must be a list`);
    value.forEach((v, i) => conforms(v, type.slice(1, -1), `${path}[${i}]`));
    return;
  }
  if (SCALARS[type]) { assert.ok(SCALARS[type](value), `${path}: ${JSON.stringify(value)} is not a valid ${type}`); return; }
  assert.ok(INPUTS[type], `no reference copy of ${type}`);
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${path} must be an object`);
  for (const [k, v] of Object.entries(value)) {
    assert.ok(k in INPUTS[type], `${path}.${k} is not a field of ${type}`);
    if (k === 'compareDigest' && v === null) continue;
    conforms(v, INPUTS[type][k], `${path}.${k}`);
  }
}

// One recorded request: right place, right credentials, a document the
// reference would accept.
function checkRequest(call) {
  const op = OPERATIONS[call.operation];
  assert.ok(op, `unexpected operation ${call.operation}`);
  assert.equal(call.url, `https://${SHOP}/admin/api/2026-10/graphql.json`);
  assert.equal(call.method, 'POST');
  assert.deepEqual(call.headers, { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN });
  assert.ok(!call.body.includes(TOKEN) && !call.url.includes(TOKEN), 'the token travels in its header only');
  assert.deepEqual(Object.keys(call.sent).sort(), ['query', 'variables']);
  if (op.args) {
    assert.ok(call.query.startsWith('mutation tagsAdd($id: ID!, $tags: [String!]!) {'));
    assert.ok(call.query.includes('tagsAdd(id: $id, tags: $tags)'));
    assert.deepEqual(Object.keys(call.variables).sort(), Object.keys(op.args).sort());
    for (const [key, type] of Object.entries(op.args)) conforms(call.variables[key], type, key);
    assert.match(call.query, /userErrors \{ field message \}/);
    return;
  }
  const declared = op.type.startsWith('[') ? `[${op.type.slice(1, -1)}!]!` : `${op.type}!`;
  assert.ok(call.query.startsWith(`${op.kind} ${call.operation}($${op.arg}: ${declared}) {`), `${call.operation}: declaration`);
  assert.ok(call.query.includes(`${call.operation}(${op.arg}: $${op.arg})`), `${call.operation}: argument`);
  if (op.kind === 'mutation') assert.match(call.query, /userErrors \{ field (code )?message( code)? \}/);
  assert.deepEqual(Object.keys(call.variables), [op.arg]);
  conforms(call.variables[op.arg], op.type, op.arg);
  for (const field of op.required || []) assert.ok(call.variables[op.arg][field] != null, `${call.operation}: ${field} is required on create`);
}

const everyCall = [];

// A stand-in for the Admin API. Replies look like the reference's examples;
// script[operation] queues one-off replies ahead of the defaults.
function stubAdmin(order = null) {
  const calls = [], script = {}, byCode = new Map(), discounts = new Map();
  let digest = 0;
  let node = 1057856650;
  const created = key => call => {
    const input = call.variables[OPERATIONS[call.operation].arg];
    if (byCode.has(input.code)) return { data: { [call.operation]: { userErrors: [{ field: ['code'], code: 'TAKEN', message: 'Code is already taken' }] } } };
    const id = `gid://shopify/DiscountCodeNode/${++node}`;
    byCode.set(input.code, id);
    discounts.set(input.code, { title: input.title, endsAt: input.endsAt });
    return { data: { [call.operation]: { ...(key === 'app' ? { codeAppDiscount: { discountId: id } } : { codeDiscountNode: { id } }), userErrors: [] } } };
  };
  const replies = {
    discountCodeBasicCreate: created('node'),
    discountCodeFreeShippingCreate: created('node'),
    discountCodeBxgyCreate: created('node'),
    discountCodeAppCreate: created('app'),
    discountCodeDelete: call => { for (const [code, id] of byCode) if (id === call.variables.id) { byCode.delete(code); discounts.delete(code); } return { data: { discountCodeDelete: { deletedCodeDiscountId: call.variables.id, userErrors: [] } } }; },
    discountCodeDeactivate: call => ({ data: { discountCodeDeactivate: { codeDiscountNode: { id: call.variables.id }, userErrors: [] } } }),
    codeDiscountNodeByCode: call => ({ data: { codeDiscountNodeByCode: byCode.has(call.variables.code) ? { id: byCode.get(call.variables.code), codeDiscount: discounts.get(call.variables.code) } : null } }),
    order: call => ({ data: { order: order && order.id === call.variables.id ? { id: order.id, note: order.note, tags: order.tags, metafield: order.metafield } : null } }),
    tagsAdd: call => {
      order.tags = [...new Set([...order.tags, ...call.variables.tags])];
      return { data: { tagsAdd: { node: { id: order.id }, userErrors: [] } } };
    },
    orderUpdate: call => {
      const { note, tags } = call.variables.input;
      if (note != null) order.note = note;
      if (tags) order.tags = tags;
      return { data: { orderUpdate: { order: { id: order.id }, userErrors: [] } } };
    },
    metafieldsSet: call => {
      const [m] = call.variables.metafields;
      if (Object.hasOwn(m, 'compareDigest') && m.compareDigest !== (order.metafield?.compareDigest ?? null)) return { data: { metafieldsSet: { userErrors: [{ field: ['metafields', '0', 'compareDigest'], code: 'STALE_OBJECT', message: 'The metafield changed' }] } } };
      order.metafield = { value: m.value, compareDigest: `digest-${++digest}` };
      return { data: { metafieldsSet: { metafields: [{ id: 'gid://shopify/Metafield/1069229220', namespace: 'app--1--offerad', key: m.key }], userErrors: [] } } };
    },
  };
  const fetchFn = async (url, init) => {
    const sent = JSON.parse(init.body);
    const [, kind, operation] = sent.query.match(/^(query|mutation) (\w+)/) || [];
    const call = { url: String(url), method: init.method, headers: init.headers, body: init.body, sent, kind, operation, query: sent.query, variables: sent.variables };
    calls.push(call);
    everyCall.push(call);
    const reply = await (script[operation]?.shift() || replies[operation])(call);
    return reply instanceof Response ? reply : new Response(JSON.stringify(reply), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const adapter = (options = {}) => shopifyAdapter({ shop: SHOP, token: TOKEN, fetchFn, now: () => NOW, retryMs: 0, ...options });
  return { calls, script, byCode, discounts, fetchFn, adapter, ops: () => calls.map(c => c.operation) };
}

const refusal = (operation, error) => () => ({ data: { [operation]: { [operation === 'discountCodeAppCreate' ? 'codeAppDiscount' : 'codeDiscountNode']: null, userErrors: [error] } } });


async function mintOn(m, offer, functionHandle = null) {
  const admin = stubAdmin();
  const out = await admin.adapter({ functionHandle }).mint(offer, m, { offer_id: 'of_1', ttl_minutes: 60 });
  const tag = `${functionHandle ? 'function' : 'native'} ${m.product.handle} x${offer.quantity} [${offer.headline}]`;
  admin.calls.forEach(checkRequest);
  for (const call of admin.calls) assertPublic(call.body, m, `${tag}: ${call.operation} request`);
  assertPublic(out, m, `${tag}: mint reply`);
  out.codes.forEach(c => assert.match(c, CODE));
  assert.equal(new Set(out.codes).size, out.codes.length);
  assert.equal(out.expires_at, iso(NOW + HOUR));
  assert.equal(out.cart_url, `https://${SHOP}/cart/${linesOf(m, offer)}${out.codes.length ? `?discount=${out.codes.join(',')}` : ''}`, tag);
  assert.deepEqual(out.deferred, offer.components.filter(c => DEFERRED.includes(c.type)).map(c => ({ ...publicOffer({ components: [c] }).components[0], currency: offer.currency })), tag);
  assert.deepEqual(out.details.map(d => d.code), out.codes);
  return { out, admin, tag };
}

async function shopifyChecks() {
  const board = mandateFor(SHOP, 'the-complete-snowboard');
  const wax = mandateFor(SHOP, 'selling-plans-ski-wax');
  const cheap = decide(board, { priority: 'lowest_price' }).offers[0];
  const ev = { ok: true, domain: 'evo.com', trusted_domain: true, match_by: 'gtin', price: 629.95, shipping: 0 };
  const matched = decide(board, { priority: 'lowest_price' }, ev).offers[0];
  const composite = decide(board, { priority: 'lowest_price' }, { ...ev, trusted_domain: false }).offers[0];
  assert.ok(has(composite, 'price') && has(composite, 'gift') && has(composite, 'free_shipping'));

  say('\n== Shopify settlement: complete Function offers and explicit native alternatives');
  let native = 0, full = 0, restricted = 0;
  for (const m of listProducts(SHOP)) for (const priority of PRIORITY_IDS) for (const quantity of [1, 2, 5]) {
    for (const offer of decide(m, { priority, quantity }).offers) {
      for (const functionHandle of [null, HANDLE]) {
        const admin = stubAdmin();
        const adapter = admin.adapter({ functionHandle });
        const support = adapter.inspect(offer, m);
        if (!support.supported) {
          await assert.rejects(adapter.mint(offer, m, { offer_id: 'of_1' }), e => e instanceof SettleError && e.reason === 'not_deliverable');
          assert.equal(admin.calls.length, 0, 'an unsupported offer creates no partial code');
          for (const alternative of support.alternatives) {
            assert.ok(adapter.inspect(alternative, m).supported);
            assert.equal(alternative.total, r2(alternative.items_total + alternative.shipping_total));
            assert.equal(alternative.items_total, r2(m.product.list * alternative.quantity - priceOf(alternative).reduce((n, c) => n + c.amount_off, 0)));
            const out = await stubAdmin().adapter({ functionHandle }).mint(alternative, m, { offer_id: 'of_alternative' });
            assert.equal(out.codes.length, 1);
            assert.deepEqual(out.undeliverable, []);
          }
          restricted++;
          continue;
        }
        const { out, admin: checked } = await mintOn(m, offer, functionHandle);
        assert.equal(out.codes.length, 1, 'one offer is one redemption');
        assert.deepEqual(out.undeliverable, []);
        if (functionHandle) {
          assert.deepEqual(checked.ops(), ['discountCodeAppCreate']);
          assert.deepEqual(checked.calls[0].variables.codeAppDiscount.combinesWith, { orderDiscounts: false, productDiscounts: false, shippingDiscounts: false });
          const input = checked.calls[0].variables.codeAppDiscount;
          assert.deepEqual(input.discountClasses, [(has(offer, 'price') || has(offer, 'gift')) && 'PRODUCT', (has(offer, 'free_shipping') || has(offer, 'express_upgrade')) && 'SHIPPING'].filter(Boolean));
          const cfg = JSON.parse(input.metafields[0].value);
          assert.deepEqual(cfg, { offer_id: 'of_1', code: out.codes[0], expires_at: out.expires_at, ...offerTerms(offer, m) });
          assert.deepEqual(cfg.components, publicOffer(offer).components);
          full++;
        } else {
          const input = checked.calls[0].variables[OPERATIONS[checked.calls[0].operation].arg];
          assert.deepEqual(input.combinesWith, { orderDiscounts: false, productDiscounts: false, shippingDiscounts: false });
          if (has(offer, 'gift')) {
            assert.deepEqual(checked.ops(), ['discountCodeBxgyCreate']);
            assert.deepEqual(input.customerBuys, { items: { products: { productVariantsToAdd: [m.product.variant_id] } }, value: { quantity: String(offer.quantity) } });
            assert.deepEqual(input.customerGets, { items: { products: { productVariantsToAdd: [has(offer, 'gift').variant_id] } }, value: { discountOnQuantity: { quantity: '1', effect: { percentage: 1 } } } });
            assert.equal(input.usesPerOrderLimit, 1);
          } else {
            assert.deepEqual(checked.ops(), ['discountCodeBasicCreate']);
            assert.deepEqual(input.customerGets.items, { products: { productVariantsToAdd: [m.product.variant_id] } });
            assert.equal(input.customerGets.value.discountAmount.amount, priceOf(offer).reduce((n, c) => n + c.amount_off, 0).toFixed(2));
          }
          native++;
        }
      }
    }
  }
  say(`   ${native} product-bound native offers, ${full} full Function offers, ${restricted} restrictions with no partial mint`);

  // Price plus gift has no unconditional gift-code escape hatch. It remains
  // a complete Function offer or one of two separately approved native offers.
  const giftPrice = { ...composite, components: composite.components.filter(c => c.type !== 'free_shipping') };
  const unavailable = stubAdmin();
  await assert.rejects(unavailable.adapter().mint(giftPrice, board, { offer_id: 'of_bundle' }), e => e.reason === 'not_deliverable');
  assert.equal(unavailable.calls.length, 0);
  const choices = unavailable.adapter().inspect(giftPrice, board).alternatives;
  assert.equal(choices.length, 2);
  assert.ok(choices.every(o => !(has(o, 'price') && has(o, 'gift'))));
  for (const o of [matched, composite]) await assert.rejects(unavailable.adapter().mint(o, board, { offer_id: 'of_shipping' }), e => e.reason === 'not_deliverable');
  assert.equal(unavailable.calls.length, 0, 'native shipping cannot be spent on an unrelated cart');

  // A carrier cent changes the price and is an explicit alternative, in both modes.
  const promise = decide(wax, { priority: 'repeat_purchase' }).offers.find(o => o.components.every(c => DEFERRED.includes(c.type)));
  for (const functionHandle of [null, HANDLE]) {
    const adapter = stubAdmin().adapter({ functionHandle });
    const support = adapter.inspect(promise, wax);
    assert.equal(support.supported, false);
    assert.equal(support.alternatives.length, 1);
    assert.equal(support.alternatives[0].total, r2(promise.total - 0.01));
    assert.equal(priceOf(support.alternatives[0])[0].amount_off, 0.01);
  }

  // Same offer, same code and original expiry after a lost response. The
  // duplicate-create error reconciles by identity rather than drawing again.
  const recovery = stubAdmin();
  const first = await recovery.adapter().mint(cheap, board, { offer_id: 'of_recover' });
  const again = await recovery.adapter({ now: () => NOW + 120000 }).mint(cheap, board, { offer_id: 'of_recover' });
  assert.deepEqual(again.codes, first.codes);
  assert.equal(again.expires_at, first.expires_at);
  assert.equal(recovery.byCode.size, 1);
  assert.deepEqual(recovery.ops(), ['discountCodeBasicCreate', 'discountCodeBasicCreate', 'codeDiscountNodeByCode']);
  const lost = stubAdmin();
  let lose = true;
  const lostResponse = lost.adapter({ fetchFn: async (...args) => {
    const response = await lost.fetchFn(...args);
    if (lose) { lose = false; throw new Error('response lost after Shopify created the discount'); }
    return response;
  } });
  await assert.rejects(lostResponse.mint(cheap, board, { offer_id: 'of_response_lost' }), e => e.reason === 'fetch_failed');
  assert.equal(lost.byCode.size, 1, 'the first response was lost after the external side effect');
  const recovered = await lostResponse.mint(cheap, board, { offer_id: 'of_response_lost' });
  assert.deepEqual(recovered.codes, [...lost.byCode.keys()]);
  assert.equal(lost.byCode.size, 1, 'response loss reuses the existing discount');
  lost.calls.forEach(checkRequest);
  recovery.discounts.set(first.codes[0], { title: 'Another merchant discount', endsAt: first.expires_at });
  await assert.rejects(recovery.adapter().mint(cheap, board, { offer_id: 'of_recover' }), e => e.reason === 'uncertain_mint');
  assert.equal(recovery.byCode.size, 1, 'collision never creates a replacement code');

  const failing = async (prepare, check, offer = cheap, options) => {
    const admin = stubAdmin();
    prepare(admin);
    await assert.rejects(admin.adapter(options).mint(offer, board, { offer_id: 'of_1' }), e => { assert.ok(e instanceof SettleError); check(e, admin); return true; });
    admin.calls.forEach(checkRequest);
  };
  const invalid = { field: ['basicCodeDiscount', 'customerGets', 'items'], code: 'INVALID', message: 'Product variant does not exist' };
  await failing(a => { a.script.discountCodeBasicCreate = [refusal('discountCodeBasicCreate', invalid)]; }, e => assert.equal(e.reason, 'user_errors'));
  await failing(a => { a.script.discountCodeAppCreate = [refusal('discountCodeAppCreate', { code: 'INVALID', message: 'Function not found' })]; }, e => assert.equal(e.reason, 'user_errors'), cheap, { functionHandle: HANDLE });
  await failing(a => { a.script.discountCodeBasicCreate = [() => ({ errors: [{ message: 'Access denied', extensions: { code: 'ACCESS_DENIED' } }] })]; }, e => assert.equal(e.reason, 'graphql_errors'));
  await failing(a => { a.script.discountCodeBasicCreate = [() => new Response('{}', { status: 401 })]; }, e => assert.equal(e.reason, 'http_error'));
  await failing(a => { a.script.discountCodeBasicCreate = [() => { throw new TypeError('fetch failed'); }]; }, e => assert.equal(e.reason, 'fetch_failed'));
  await failing(a => { a.script.discountCodeBasicCreate = [() => ({})]; }, e => assert.equal(e.reason, 'bad_response'));
  const throttle = () => ({ errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }] });
  const slow = stubAdmin(); slow.script.discountCodeBasicCreate = [throttle];
  assert.equal((await slow.adapter().mint(cheap, board, { offer_id: 'of_1' })).codes.length, 1);
  assert.equal(slow.calls.length, 2);
  await failing(a => { a.script.discountCodeBasicCreate = [throttle, throttle]; }, e => assert.equal(e.reason, 'graphql_errors'));
  for (const options of [{ shop: 'evil.example' }, { shop: `${SHOP}.evil.example` }, { token: '' }]) {
    await failing(() => {}, (e, a) => assert.deepEqual([e.reason, a.calls.length], ['config', 0]), cheap, options);
  }
  await failing(() => {}, (e, a) => assert.deepEqual([e.reason, a.calls.length], ['policy', 0]), { ...cheap, components: [{ ...cheap.components[0], amount_off: 400 }] });

  const live = stubAdmin();
  const minted = await live.adapter().mint(cheap, board, { offer_id: 'of_revoke' });
  assert.equal((await live.adapter().revoke(minted.codes[0].toLowerCase())).ok, true);
  assert.equal((await live.adapter().revoke('OFFER-NOSUCH')).reason, 'not_found');

  const value = decide(board, { priority: 'lowest_price' }).offers.find(o => has(o, 'next_order_credit'));
  const promises = [...decide(board, { priority: 'easy_returns' }).offers[0].components, ...value.components].filter(c => DEFERRED.includes(c.type)).map(c => publicOffer({ components: [c] }).components[0]);
  const order = { id: 'gid://shopify/Order/148977776', note: 'Please leave it with the neighbour.', tags: ['vip'], metafield: null };
  const desk = stubAdmin(order);
  const terms = { code: 'OFFER-7K2M9Q', offer_id: 'of_9', currency: 'USD', deferred: promises };
  const done = await desk.adapter().annotateOrder(order.id, terms);
  assert.deepEqual(desk.ops(), ['order', 'discountCodeBasicCreate', 'metafieldsSet', 'tagsAdd']);
  assert.equal(done.codes.length, 1);
  assert.equal(done.codes[0].amount, 40);
  assert.equal(order.note, 'Please leave it with the neighbour.', 'annotation preserves the buyer note');
  assert.ok(order.tags.includes('vip') && order.tags.includes('offerad'));
  const before = desk.calls.length;
  assert.deepEqual((await desk.adapter().annotateOrder(order.id, terms)).codes, done.codes);
  assert.deepEqual(desk.ops().slice(before), ['order']);
  const other = await desk.adapter().annotateOrder(order.id, { code: 'OFFER-9XK2PQ', offer_id: 'of_10', deferred: promises.slice(0, 1) });
  assert.equal(other.codes.length, 0);
  assert.equal(JSON.parse(order.metafield.value).length, 2);
  const missing = await desk.adapter().annotateOrder('gid://shopify/Order/2', terms);
  assert.equal(missing.reason, 'order_not_found');
  const strict = stubAdmin({ id: 'gid://shopify/Order/3', note: null, tags: [], metafield: null });
  strict.script.metafieldsSet = [() => ({ data: { metafieldsSet: { userErrors: [{ code: 'INVALID_VALUE', message: 'Invalid JSON' }] } } })];
  await assert.rejects(strict.adapter().annotateOrder('gid://shopify/Order/3', terms), e => e.reason === 'user_errors');
  assert.deepEqual(strict.ops(), ['order', 'discountCodeBasicCreate', 'metafieldsSet']);
  assert.equal(strict.byCode.size, 1, 'a failed terms write leaves its deterministic credit recoverable');
  const fixed = await strict.adapter().annotateOrder('gid://shopify/Order/3', terms);
  assert.equal(fixed.codes.length, 1);
  assert.equal(strict.byCode.size, 1, 'terms retry reconciles one external credit');
  const loose = stubAdmin({ id: 'gid://shopify/Order/4', note: null, tags: [], metafield: null });
  assert.ok((await annotateOrder('gid://shopify/Order/4', terms, { shop: SHOP, token: TOKEN, fetchFn: loose.fetchFn, now: () => NOW })).ok);
  [recovery, slow, live, desk, strict, loose].flatMap(a => a.calls).forEach(checkRequest);
  [done, other, missing].forEach(reply => assertPublic(reply, board, 'annotateOrder reply'));
  // Two API reads take the same snapshot before either writes. A stale
  // compareDigest must re-read and merge, while tags remain additive.
  const racedOrder = { id: 'gid://shopify/Order/777', note: 'Leave this buyer note intact.', tags: ['merchant-tag'], metafield: null };
  const concurrent = stubAdmin(racedOrder);
  let reads = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  const snapshot = async () => {
    const saved = structuredClone(racedOrder);
    if (++reads === 2) release();
    await gate;
    return { data: { order: saved } };
  };
  concurrent.script.order = [snapshot, snapshot];
  const replies = await Promise.all([
    concurrent.adapter().annotateOrder(racedOrder.id, { code: 'CODE-A', offer_id: 'of_a', deferred: promises.slice(0, 1) }),
    concurrent.adapter().annotateOrder(racedOrder.id, { code: 'CODE-B', offer_id: 'of_b', deferred: promises.slice(1, 2) }),
  ]);
  assert.ok(replies.every(r => r.ok));
  assert.deepEqual(JSON.parse(racedOrder.metafield.value).map(e => e.offer_id).sort(), ['of_a', 'of_b']);
  assert.equal(racedOrder.note, 'Leave this buyer note intact.');
  assert.ok(['merchant-tag', 'offerad-extended-returns', 'offerad-delivery-guarantee'].every(tag => racedOrder.tags.includes(tag)));
  assert.equal(concurrent.calls.filter(c => c.operation === 'metafieldsSet').length, 3, 'a CAS conflict retries instead of losing a promise');
  assert.ok(concurrent.calls.filter(c => c.operation === 'metafieldsSet').every(c => Object.hasOwn(c.variables.metafields[0], 'compareDigest')));
  const malformed = stubAdmin({ id: 'gid://shopify/Order/888', note: '', tags: [], metafield: { value: 'not JSON', compareDigest: 'original-digest' } });
  await assert.rejects(malformed.adapter().annotateOrder('gid://shopify/Order/888', terms), e => e.reason === 'invalid_order_terms');
  assert.deepEqual(malformed.ops(), ['order'], 'invalid prior ledger is not overwritten or followed by a mint');
  concurrent.calls.forEach(checkRequest);
  say('   concurrent different-offer annotations preserve both promises and merchant note/tags');
  say('   deterministic recovery, collision refusal, outages, throttling, revoke and deferred-order fulfillment checked');
}

await dryEndToEnd(memory, 'in-memory store');
if (process.argv.includes('--store')) {
  const { memoryStore } = await import('../offers/src/lib/store.js');
  await dryEndToEnd(memoryStore, 'store.js memoryStore');
}
await shopifyChecks();

// Across everything sent above: only documented operations, never a seller-only word.
everyCall.forEach(checkRequest);
for (const call of everyCall) for (const word of PRIVATE_WORDS) assert.ok(!call.body.includes(word), `${call.operation}: "${word}" in a request body`);
const sent = everyCall.reduce((n, c) => ({ ...n, [c.operation]: (n[c.operation] || 0) + 1 }), {});
say(`\n${everyCall.length} Admin API requests recorded: ${Object.entries(sent).map(([op, n]) => `${op} ${n}`).join(', ')}`);
say('settle checks passed');
