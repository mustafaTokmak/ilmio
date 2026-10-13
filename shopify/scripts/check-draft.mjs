// Offline checks only: no network, dependency or test framework.
// Run: node shopify/scripts/check-draft.mjs
import assert from 'node:assert/strict';
import { draftAdapter } from '../offers/src/lib/draft.js';
import { decide, PRIORITIES, r2 } from '../offers/src/lib/policy.js';
import { listProducts, mandateFor } from '../offers/src/lib/mandates.js';
import { SettleError, offerTerms } from '../offers/src/lib/settle.js';

const SHOP = 'mustafa-test-dev.myshopify.com';
const NOW = Date.parse('2026-10-13T12:00:00Z');
const mandate = mandateFor(SHOP, 'the-complete-snowboard');
const clone = structuredClone;
const bag = (value, currencyCode = 'USD') => ({ presentmentMoney: { amount: Number(value).toFixed(2), currencyCode } });
function fullOffer(quantity = 2, free = false) {
  const components = [
    { type: 'price', source: 'sponsored_discount', label: '$40 off', amount_off: 40, seller_cost: 40, buyer_value: 40 },
    { type: 'gift', label: 'Free ski wax', variant_id: mandate.concessions.gift.variant_id, seller_cost: 8, buyer_value: 24.95 },
    { type: 'express_upgrade', label: 'Express 2-day delivery at the standard rate', ship_days: 2, seller_cost: 14.1, buyer_value: 20 },
    { type: 'extended_returns', label: '60-day returns', days: 60, seller_cost: 6, buyer_value: 0 },
    { type: 'next_order_credit', label: '$40 credit on your next order', amount: 40, valid_days: 90, seller_cost: 18, buyer_value: 40 },
  ];
  if (free) components.push({ type: 'free_shipping', label: 'Free shipping', seller_cost: 19.9, buyer_value: 19.9 });
  const items_total = r2(699.95 * quantity - 40), shipping_total = free ? 0 : 19.9;
  return { components, quantity, currency: 'USD', headline: components.map(c => c.label).join(' + '), items_total, shipping_total, total: r2(items_total + shipping_total), ship_days: 2, seller_cost: components.reduce((n, c) => n + c.seller_cost, 0) };
}
function fakeAdmin() {
  const calls = [], drafts = [], scripts = {};
  function financial(input) {
    const currency = input.presentmentCurrencyCode;
    const subtotal = input.lineItems.reduce((n, l) => n + (l.appliedDiscount?.value === 100 ? 0 : Number(l.priceOverride.amount) * l.quantity), 0);
    const shipping = Number(input.shippingLine.priceWithCurrency.amount);
    return { presentmentCurrencyCode: currency, acceptAutomaticDiscounts: input.acceptAutomaticDiscounts, discountCodes: input.discountCodes, appliedDiscount: null,
      lineItemsSubtotalPrice: bag(subtotal, currency), totalShippingPriceSet: bag(shipping, currency), totalPriceSet: bag(subtotal + shipping, currency), totalTaxSet: bag(0, currency), taxesIncluded: false, warnings: [], shippingLine: { title: input.shippingLine.title, custom: true } };
  }
  function makeDraft(input) {
    return { id: `gid://shopify/DraftOrder/${drafts.length + 1}`, status: 'OPEN', ready: true, invoiceUrl: `https://${SHOP}/invoices/verified-${drafts.length + 1}`, reserveInventoryUntil: input.reserveInventoryUntil,
      allowDiscountCodesInCheckout: input.allowDiscountCodesInCheckout, customAttributes: clone(input.customAttributes), order: null, tags: clone(input.tags), ...financial(input),
      lineItems: { nodes: input.lineItems.map(l => ({ variant: { id: l.variantId }, custom: false, quantity: l.quantity, priceOverride: l.priceOverride || { amount: '24.95', currencyCode: input.presentmentCurrencyCode }, components: [], discountedTotalSet: bag(l.appliedDiscount ? 0 : Number(l.priceOverride.amount) * l.quantity, input.presentmentCurrencyCode) })), pageInfo: { hasNextPage: false } } };
  }
  const responders = {
    draftOrders: ({ variables }) => ({ data: { draftOrders: { nodes: clone(drafts.filter(d => d.tags.includes(variables.query.slice(4)))), pageInfo: { hasNextPage: false } } } }),
    draftOrder: ({ variables }) => ({ data: { draftOrder: clone(drafts.find(d => d.id === variables.id) || null) } }),
    draftOrderCalculate: ({ variables }) => ({ data: { draftOrderCalculate: { calculatedDraftOrder: financial(variables.input), userErrors: [] } } }),
    draftOrderCreate: ({ variables }) => { const d = makeDraft(variables.input); drafts.push(d); return { data: { draftOrderCreate: { draftOrder: clone(d), userErrors: [] } } }; },
  };
  const fetchFn = async (url, init) => {
    const sent = JSON.parse(init.body), operation = sent.query.match(/^(?:query|mutation) (\w+)/)[1];
    const call = { url, init, ...sent, operation }; calls.push(call);
    assert.equal(url, `https://${SHOP}/admin/api/2026-10/graphql.json`);
    assert.equal(init.headers['X-Shopify-Access-Token'], 'offline-test-token');
    assert.equal(init.redirect, 'error');
    assert.ok(['draftOrders', 'draftOrder', 'draftOrderCalculate', 'draftOrderCreate'].includes(operation), 'no invoice sends, completion or mutation other than create');
    const reply = await (scripts[operation]?.shift() || responders[operation])(call);
    return reply instanceof Response ? reply : new Response(JSON.stringify(reply), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  return { calls, drafts, scripts, responders, makeDraft, fetchFn, adapter: (options = {}) => draftAdapter({ shop: SHOP, token: async () => 'offline-test-token', fetchFn, now: () => NOW, readyRetryMs: 0, ...options }), operations: () => calls.map(c => c.operation) };
}
function publicOnly(value) {
  const text = JSON.stringify(value);
  for (const key of ['seller_cost', 'unit_cost', 'budget_per_order', 'price_match', 'floor', 'source', 'pace']) assert.ok(!text.includes(`"${key}"`) && !text.includes(`\\"${key}\\"`), `${key} must not leave seller service`);
}

const offer = fullOffer();
const admin = fakeAdmin();
const adapter = admin.adapter();
assert.deepEqual(adapter.inspect(offer, mandate), { supported: true, alternatives: [], not_included: [] });
const out = await adapter.mint({ ...offer, seller_secret: 'do-not-send', components: offer.components.map(c => ({ ...c, private_reason: 'do-not-send' })) }, mandate, { offer_id: 'of_full', ttl_minutes: 25 });
assert.equal(out.mode, 'draft');
assert.deepEqual(out.codes, []);
assert.equal(out.invoice_url, out.cart_url);
assert.equal(out.expires_at, null);
assert.equal(out.reservation_expires_at, '2026-10-13T12:25:00.000Z');
assert.match(out.warnings.join(' '), /no automatic offer expiry/);
assert.match(out.warnings.join(' '), /merchant must fulfill/);
assert.equal(out.deferred.length, 2);
assert.deepEqual(out.terms, offerTerms(offer, mandate));
assert.deepEqual(admin.operations(), ['draftOrders', 'draftOrderCalculate', 'draftOrderCreate']);
const input = admin.calls[2].variables.input;
assert.deepEqual(input.lineItems, [
  { variantId: mandate.product.variant_id, quantity: 2, priceOverride: { amount: '679.95', currencyCode: 'USD' } },
  { variantId: mandate.concessions.gift.variant_id, quantity: 1, generatePriceOverride: true, appliedDiscount: { title: 'Free ski wax', valueType: 'PERCENTAGE', value: 100 } },
]);
assert.deepEqual(input.shippingLine, { title: 'OfferAd Express (2-day delivery)', priceWithCurrency: { amount: '19.90', currencyCode: 'USD' }, shippingRateHandle: null });
assert.equal(input.presentmentCurrencyCode, 'USD');
assert.equal(input.acceptAutomaticDiscounts, false);
assert.equal(input.allowDiscountCodesInCheckout, false);
assert.deepEqual(input.discountCodes, []);
assert.equal(input.reserveInventoryUntil, '2026-10-13T12:25:00.000Z');
assert.equal(input.customAttributes[0].key, 'offerad_offer_id');
assert.equal(input.customAttributes[0].value, 'of_full');
assert.match(input.customAttributes[1].value, /^[0-9a-f]{64}$/);
assert.match(input.tags[1], /^offerad-[0-9a-f]{64}$/);
assert.ok(input.note.includes('60-day returns') && input.note.includes('credit on your next order'));
assert.ok(!JSON.stringify(input).includes('do-not-send'));
assert.deepEqual(admin.calls[1].variables.input, input, 'calculate exact same final basket before create');
publicOnly(out); publicOnly(input);

// A new adapter (simulated process restart) recovers exactly the same invoice.
const again = await admin.adapter({ now: () => NOW + 3600000 }).mint(offer, mandate, { offer_id: 'of_full', ttl_minutes: 1, reconcile_only: true });
assert.equal(again.draft_order_id, out.draft_order_id);
assert.equal(again.reservation_expires_at, out.reservation_expires_at);
assert.equal(admin.drafts.length, 1);
assert.equal(admin.operations().at(-1), 'draftOrders');

// Non-divisible total savings preserve every cent across quantity > 1.
const odd = fakeAdmin();
await odd.adapter().mint(fullOffer(3, true), mandate, { offer_id: 'of_odd' });
const oddInput = odd.calls.find(c => c.operation === 'draftOrderCreate').variables.input;
assert.deepEqual(oddInput.lineItems.slice(0, 2), [
  { variantId: mandate.product.variant_id, quantity: 1, priceOverride: { amount: '686.61', currencyCode: 'USD' } },
  { variantId: mandate.product.variant_id, quantity: 2, priceOverride: { amount: '686.62', currencyCode: 'USD' } },
]);
assert.equal(oddInput.shippingLine.priceWithCurrency.amount, '0.00');
assert.equal(odd.drafts[0].lineItemsSubtotalPrice.presentmentMoney.amount, '2059.85');

// A lost create response is recovered, never followed by another create.
const lost = fakeAdmin();
lost.scripts.draftOrderCreate = [call => { lost.responders.draftOrderCreate(call); throw new TypeError('connection lost after commit'); }];
const recovered = await lost.adapter().mint(offer, mandate, { offer_id: 'of_lost' });
assert.ok(recovered.invoice_url);
assert.deepEqual(lost.operations(), ['draftOrders', 'draftOrderCalculate', 'draftOrderCreate', 'draftOrders']);
assert.equal(lost.drafts.length, 1);

// An unresolved write stays unresolved within this process and after restart.
const uncertain = fakeAdmin();
uncertain.scripts.draftOrderCreate = [() => { throw new TypeError('unknown commit'); }];
const uncertainAdapter = uncertain.adapter();
await assert.rejects(uncertainAdapter.mint(offer, mandate, { offer_id: 'of_uncertain' }), e => e.reason === 'uncertain_mint' && e.cause_reason === 'fetch_failed');
await assert.rejects(uncertainAdapter.mint(offer, mandate, { offer_id: 'of_uncertain' }), e => e.reason === 'uncertain_mint');
await assert.rejects(uncertain.adapter().mint(offer, mandate, { offer_id: 'of_uncertain', reconcile_only: true }), e => e.reason === 'uncertain_mint');
assert.equal(uncertain.operations().filter(op => op === 'draftOrderCreate').length, 1);

// Concurrent calls on this adapter share one create; the service supplies the
// durable cross-process lock and mint_intent fence.
const concurrent = fakeAdmin(), concurrentAdapter = concurrent.adapter();
const simultaneous = await Promise.all([1, 2, 3].map(() => concurrentAdapter.mint(offer, mandate, { offer_id: 'of_concurrent' })));
assert.equal(new Set(simultaneous.map(x => x.draft_order_id)).size, 1);
assert.equal(concurrent.operations().filter(op => op === 'draftOrderCreate').length, 1);

// A colliding identity, duplicates, paid draft and changed checkout economics
// cannot be silently reminted or returned as a valid accepted offer.
for (const [name, mutate, reason] of [
  ['fingerprint', a => { a.drafts[0].customAttributes[1].value = 'wrong'; }, 'uncertain_mint'],
  ['duplicates', a => { a.drafts.push(clone(a.drafts[0])); }, 'uncertain_mint'],
  ['completed', a => { a.drafts[0].status = 'COMPLETED'; a.drafts[0].order = { id: 'gid://shopify/Order/4' }; }, 'already_redeemed'],
  ['shipping', a => { a.drafts[0].totalShippingPriceSet = bag(29.9); }, 'terms_mismatch'],
  ['stacking', a => { a.drafts[0].allowDiscountCodesInCheckout = true; }, 'terms_mismatch'],
  ['identity', a => { a.drafts[0].lineItems.nodes[0].variant.id = 'gid://shopify/ProductVariant/999'; }, 'terms_mismatch'],
  ['quantity', a => { a.drafts[0].lineItems.nodes[0].quantity = 1; }, 'terms_mismatch'],
  ['bundle', a => { a.drafts[0].lineItems.nodes[0].components = [{ quantity: 1 }]; }, 'terms_mismatch'],
  ['custom', a => { a.drafts[0].lineItems.nodes[0].custom = true; }, 'terms_mismatch'],
  ['gift', a => { a.drafts[0].lineItems.nodes[1].discountedTotalSet = bag(1); }, 'terms_mismatch'],
  ['not-ready', a => { a.drafts[0].ready = false; }, 'uncertain_mint'],
]) {
  const a = fakeAdmin(); await a.adapter().mint(offer, mandate, { offer_id: 'of_test' }); mutate(a);
  await assert.rejects(a.adapter().mint(offer, mandate, { offer_id: 'of_test', reconcile_only: true }), e => e.reason === reason, name);
  assert.equal(a.operations().filter(op => op === 'draftOrderCreate').length, 1, name);
}

// Errors propagate with a reason; unsafe calculations never create a draft.
for (const [name, operation, handler, reason] of [
  ['user errors', 'draftOrderCreate', () => ({ data: { draftOrderCreate: { draftOrder: null, userErrors: [{ field: ['lineItems'], message: 'Variant unavailable' }] } } }), 'user_errors'],
  ['unauthorized', 'draftOrderCreate', () => new Response('{}', { status: 401 }), 'http_error'],
  ['calculation GraphQL', 'draftOrderCalculate', () => ({ errors: [{ message: 'Access denied', extensions: { code: 'ACCESS_DENIED' } }] }), 'graphql_errors'],
  ['calculation network', 'draftOrderCalculate', () => { throw new Error('offline'); }, 'fetch_failed'],
  ['malformed search', 'draftOrders', () => ({ data: {} }), 'uncertain_mint'],
]) {
  const a = fakeAdmin(); a.scripts[operation] = [handler];
  await assert.rejects(a.adapter().mint(offer, mandate, { offer_id: 'of_error' }), e => e instanceof SettleError && e.reason === reason, name);
  if (operation !== 'draftOrderCreate') assert.equal(a.operations().includes('draftOrderCreate'), false, name);
}
const tax = fakeAdmin();
tax.scripts.draftOrderCalculate = [call => { const r = tax.responders.draftOrderCalculate(call); r.data.draftOrderCalculate.calculatedDraftOrder.totalTaxSet = bag(20); r.data.draftOrderCalculate.calculatedDraftOrder.totalPriceSet = bag(offer.total + 20); return r; }];
await tax.adapter().mint(offer, mandate, { offer_id: 'of_tax' });
const wrong = fakeAdmin();
wrong.scripts.draftOrderCalculate = [call => { const r = wrong.responders.draftOrderCalculate(call); r.data.draftOrderCalculate.calculatedDraftOrder.lineItemsSubtotalPrice = bag(1); return r; }];
await assert.rejects(wrong.adapter().mint(offer, mandate, { offer_id: 'of_wrong' }), e => e.reason === 'terms_mismatch');
assert.equal(wrong.operations().includes('draftOrderCreate'), false);
for (const options of [{ shop: 'evil.example' }, { shop: `${SHOP}.evil.example` }, { token: '' }, { apiVersion: '../other' }]) {
  const a = fakeAdmin(); await assert.rejects(a.adapter(options).mint(offer, mandate, { offer_id: 'of_config' }), e => e.reason === 'config'); assert.equal(a.calls.length, 0);
}
for (const change of [o => { o.total = 1; }, o => { o.items_total = NaN; }, o => { o.quantity = 1.5; }, o => { o.components[0].amount_off = -4; }, o => { o.components[1].variant_id = 'gid://shopify/ProductVariant/999'; }, o => { o.components[2].ship_days = 1; }]) {
  const a = fakeAdmin(), invalid = clone(offer); change(invalid);
  assert.equal(a.adapter().inspect(invalid, mandate).supported, false);
  await assert.rejects(a.adapter().mint(invalid, mandate, { offer_id: 'of_invalid' }), SettleError);
  assert.equal(a.calls.length, 0);
}

// A paid webhook's copied offer attribute is not proof of purchase. Read the
// real link from Shopify, without completing or editing either record.
const proof = fakeAdmin(), proofAdapter = proof.adapter();
const proofDraft = await proofAdapter.mint(offer, mandate, { offer_id: 'of_proof' });
const reference = { offer_id: 'of_proof', draft_order_id: proofDraft.draft_order_id };
assert.deepEqual(await proofAdapter.confirmOrder('gid://shopify/Order/7', reference), { ok: false, reason: 'order_not_linked' });
proof.drafts[0].order = { id: 'gid://shopify/Order/7' };
assert.deepEqual(await proofAdapter.confirmOrder('gid://shopify/Order/7', reference), { ok: true });
assert.deepEqual(await proofAdapter.confirmOrder('gid://shopify/Order/8', reference), { ok: false, reason: 'order_mismatch' });
assert.deepEqual(await proofAdapter.confirmOrder('gid://shopify/Order/7', { ...reference, offer_id: 'of_forged' }), { ok: false, reason: 'offer_mismatch' });
assert.deepEqual(await proofAdapter.confirmOrder('gid://shopify/Order/7', { ...reference, draft_order_id: 'gid://shopify/DraftOrder/99' }), { ok: false, reason: 'draft_not_found' });
const beforeInvalid = proof.calls.length;
assert.deepEqual(await proofAdapter.confirmOrder('invalid', reference), { ok: false, reason: 'invalid_order_reference' });
assert.equal(proof.calls.length, beforeInvalid);
proof.scripts.draftOrder = [() => { throw new Error('offline'); }];
await assert.rejects(proofAdapter.confirmOrder('gid://shopify/Order/7', reference), e => e.reason === 'fetch_failed');
proof.scripts.draftOrder = [() => ({ errors: [{ message: 'Access denied' }] })];
await assert.rejects(proofAdapter.confirmOrder('gid://shopify/Order/7', reference), e => e.reason === 'graphql_errors');
assert.equal(proof.operations().filter(op => op === 'draftOrderCreate').length, 1);

// All current product/priority/quantity alternatives survive composite checkout.
let count = 0;
for (const m of listProducts(SHOP)) for (const priority of Object.keys(PRIORITIES)) for (const quantity of [1, 2, 5]) for (const candidate of decide(m, { priority, quantity }).offers) {
  const a = fakeAdmin();
  assert.equal(a.adapter().inspect(candidate, m).supported, true, `${m.product.handle} ${priority} x${quantity}`);
  const r = await a.adapter().mint(candidate, m, { offer_id: `of_matrix_${++count}` });
  assert.equal(r.terms.total, candidate.total);
  assert.equal(r.terms.components.length, candidate.components.length);
  publicOnly(r); a.calls.forEach(c => publicOnly(c.variables));
}
console.log(`draft checks passed: ${count} full policy offers, exact quantity arithmetic, schema inputs, gift/express/benefits, replay/concurrency, ambiguous writes, checkout mismatches and authenticated draft-to-order links; no network used`);
