// Exact composite offers through Shopify's ordinary draft-invoice checkout.
// API 2026-10: DraftOrderInput, DraftOrderLineItemInput, ShippingLineInput.
// https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftOrderCreate
// Creation has no atomic idempotency key. The service MUST serialize acceptance,
// persist mint_intent before calling mint, and use reconcile_only after a crash.
import { checkOffer, unitFloor } from './policy.js';
import { offerTerms, SettleError, shopifyAdapter } from './settle.js';

const DEFERRED = ['extended_returns', 'delivery_guarantee', 'next_order_credit', 'warranty'];
const CHECKOUT = ['price', 'gift', 'free_shipping', 'express_upgrade'];
const GID = /^gid:\/\/shopify\/ProductVariant\/[1-9][0-9]*$/;
const MONEY = '{ presentmentMoney { amount currencyCode } }';
const FINANCIAL = `presentmentCurrencyCode acceptAutomaticDiscounts discountCodes appliedDiscount { value }
  lineItemsSubtotalPrice ${MONEY} totalShippingPriceSet ${MONEY} totalPriceSet ${MONEY} totalTaxSet ${MONEY}
  taxesIncluded warnings { __typename } shippingLine { title custom }`;
const FIELDS = `id status ready invoiceUrl reserveInventoryUntil allowDiscountCodesInCheckout
  customAttributes { key value } order { id } ${FINANCIAL}
  lineItems(first: 10) { nodes { variant { id } custom quantity priceOverride { amount currencyCode }
    discountedTotalSet ${MONEY} components { quantity } } pageInfo { hasNextPage } }`;
const FIND = `query draftOrders($query: String!) { draftOrders(first: 3, query: $query) { nodes { ${FIELDS} } pageInfo { hasNextPage } } }`;
const GET = `query draftOrder($id: ID!) { draftOrder(id: $id) { ${FIELDS} } }`;
const ORDER_LINK = `query draftOrder($id: ID!) { draftOrder(id: $id) { id customAttributes { key value } order { id } } }`;
const CALCULATE = `mutation draftOrderCalculate($input: DraftOrderInput!) { draftOrderCalculate(input: $input) { calculatedDraftOrder { ${FINANCIAL} } userErrors { field message } } }`;
const CREATE = `mutation draftOrderCreate($input: DraftOrderInput!) { draftOrderCreate(input: $input) { draftOrder { ${FIELDS} } userErrors { field message } } }`;
const money = (cents, currencyCode) => ({ amount: (cents / 100).toFixed(2), currencyCode });
const fail = (message, reason = 'bad_offer', detail = {}) => { throw new SettleError(message, { reason, ...detail }); };
const cents = value => {
  const n = Number(value);
  if (value == null || value === '' || !Number.isFinite(n) || n < 0 || !Number.isSafeInteger(Math.round(n * 100)) || Math.abs(n * 100 - Math.round(n * 100)) > 0.00001) fail('The offer contains an invalid monetary amount.');
  return Math.round(n * 100);
};
const digest = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(b => b.toString(16).padStart(2, '0')).join('');

function prepare(offer, mandate) {
  if (!GID.test(mandate?.product?.variant_id || '') || !Number.isInteger(offer?.quantity) || offer.quantity < 1 || offer.quantity > 10000 || !Array.isArray(offer.components) || !offer.components.length) fail('The offer needs an exact catalog variant, quantity and components.');
  const seen = new Set();
  for (const c of offer.components) {
    if (!c || ![...CHECKOUT, ...DEFERRED].includes(c.type)) fail('A component has no supported settlement route.', 'not_deliverable');
    if (c.type !== 'price' && seen.has(c.type)) fail('The offer repeats a benefit.');
    seen.add(c.type);
    cents(c.seller_cost);
    if (c.type === 'price') cents(c.amount_off);
  }
  const problems = checkOffer(mandate, offer);
  if (problems.length) fail('The offer is outside the mandate.', 'policy', { problems });
  const terms = offerTerms(offer, mandate);
  let precision;
  try { precision = new Intl.NumberFormat('en', { style: 'currency', currency: terms.currency }).resolvedOptions().maximumFractionDigits; } catch { fail('The offer currency is invalid.'); }
  if (precision !== 2 || terms.currency !== mandate.product.currency) fail('This offer must use the mandate’s two-decimal currency.', 'not_deliverable');
  const priceOff = terms.components.filter(c => c.type === 'price').reduce((n, c) => n + cents(c.amount_off), 0);
  const items = cents(mandate.product.list) * terms.quantity - priceOff;
  const shipping = seen.has('free_shipping') ? 0 : cents(mandate.shipping?.standard?.price);
  if (items < 0 || cents(terms.items_total) !== items || cents(terms.shipping_total) !== shipping || cents(terms.total) !== items + shipping) fail('The quoted totals do not match the approved components.');
  const express = terms.components.find(c => c.type === 'express_upgrade');
  const days = express ? mandate.shipping?.express?.days : mandate.shipping?.standard?.days;
  if (!Number.isFinite(days) || days < 0 || terms.ship_days !== days || (express && express.ship_days !== days)) fail('The delivery terms do not match the approved method.');
  // Preserve total cents, not a rounded unit_price * quantity. Same catalog
  // variant can occupy two lines at adjacent prices; reject transformed results.
  const lower = Math.floor(items / terms.quantity), higherQty = items % terms.quantity;
  if (lower / 100 < unitFloor(mandate) - 1e-9) fail('The exact unit prices are outside the mandate.', 'policy');
  const lineItems = [];
  if (terms.quantity > higherQty) lineItems.push({ variantId: terms.variant_id, quantity: terms.quantity - higherQty, priceOverride: money(lower, terms.currency) });
  if (higherQty) lineItems.push({ variantId: terms.variant_id, quantity: higherQty, priceOverride: money(lower + 1, terms.currency) });
  const gift = terms.components.find(c => c.type === 'gift');
  if (gift) {
    if (!GID.test(gift.variant_id || '') || gift.variant_id !== mandate.concessions?.gift?.variant_id || gift.variant_id === terms.variant_id) fail('The gift needs its separately approved catalog variant.', 'not_deliverable');
    lineItems.push({ variantId: gift.variant_id, quantity: 1, generatePriceOverride: true, appliedDiscount: { title: gift.label, valueType: 'PERCENTAGE', value: 100 } });
  }
  const shippingTitle = `OfferAd ${express ? 'Express' : 'Standard'} (${days}-day delivery)`;
  return { terms, items, shipping, gift, lineItems, shippingTitle, deferred: terms.components.filter(c => DEFERRED.includes(c.type)).map(c => ({ ...c, currency: terms.currency })) };
}

export function draftAdapter({ shop, token, apiVersion = '2026-10', fetchFn = fetch, now = () => Date.now(), timeoutMs = 15000, readyRetryMs = 100 } = {}) {
  const inFlight = new Map();
  // Only an optimization within one adapter. Durable service state is mandatory
  // for reconciliation after process loss or across independent workers.
  const uncertain = new Set();
  const known = new Map();
  async function gql(operation, query, variables) {
    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(String(shop)) || !/^20\d\d-(01|04|07|10)$/.test(apiVersion)) fail('The Shopify connection is invalid.', 'config', { operation });
    const secret = typeof token === 'function' ? await token() : token;
    if (!secret) fail('No Admin API token is available.', 'config', { operation });
    let response, body;
    try {
      response = await fetchFn(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': secret },
        body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(timeoutMs), redirect: 'error',
      });
      body = await response.json().catch(() => null);
    } catch { fail('The Shopify draft request could not be confirmed.', 'fetch_failed', { operation }); }
    if (!response.ok) fail(`Shopify answered ${response.status}.`, 'http_error', { operation, status: response.status });
    if (body?.errors?.length) fail('Shopify rejected the draft request.', 'graphql_errors', { operation, errors: body.errors.map(e => ({ message: e.message, code: e.extensions?.code ?? null })) });
    if (!body?.data) fail('Shopify returned no draft result.', 'bad_response', { operation });
    return body.data;
  }
  function payload(data, operation, field) {
    const p = data?.[operation];
    if (p?.userErrors?.length) fail('Shopify could not accept the draft terms.', 'user_errors', { operation, errors: p.userErrors.map(e => ({ field: e.field, message: e.message })) });
    if (!p?.[field]) fail('Shopify returned no draft result.', 'bad_response', { operation });
    return p[field];
  }
  function readMoney(bag, currency) {
    const value = bag?.presentmentMoney;
    if (!value || value.currencyCode !== currency) fail('Shopify returned different checkout currency.', 'terms_mismatch');
    try { return cents(value.amount); } catch { fail('Shopify returned an invalid checkout amount.', 'terms_mismatch'); }
  }
  function verifyFinancial(draft, p) {
    if (draft.presentmentCurrencyCode !== p.terms.currency || draft.acceptAutomaticDiscounts !== false || !Array.isArray(draft.discountCodes) || draft.discountCodes.length || (draft.appliedDiscount && Number(draft.appliedDiscount.value) !== 0)) fail('Shopify changed the accepted discount or currency terms.', 'terms_mismatch');
    if (draft.warnings?.length) fail('Shopify returned draft warnings that need review.', 'draft_warnings', { warnings: draft.warnings.map(w => w.__typename) });
    if (readMoney(draft.lineItemsSubtotalPrice, p.terms.currency) !== p.items || readMoney(draft.totalShippingPriceSet, p.terms.currency) !== p.shipping || draft.shippingLine?.title !== p.shippingTitle || draft.shippingLine.custom !== true) fail('Shopify changed the accepted item or shipping total.', 'terms_mismatch');
    const tax = readMoney(draft.totalTaxSet, p.terms.currency);
    if (typeof draft.taxesIncluded !== 'boolean' || readMoney(draft.totalPriceSet, p.terms.currency) !== p.items + p.shipping + (draft.taxesIncluded ? 0 : tax)) fail('Shopify returned an unexpected checkout total.', 'terms_mismatch');
  }
  async function ready(draft) {
    for (let n = 0; draft?.id && draft.ready !== true && n < 3; n++) {
      if (readyRetryMs) await new Promise(done => setTimeout(done, readyRetryMs));
      draft = (await gql('draftOrder', GET, { id: draft.id })).draftOrder;
    }
    if (!draft?.id || draft.ready !== true) fail('The draft is still being prepared; reconcile it before trying again.', 'uncertain_mint', { draft_order_id: draft?.id ?? null });
    return draft;
  }
  function result(draft, p, identity) {
    const attrs = new Map((draft.customAttributes || []).map(a => [a.key, a.value]));
    if (attrs.get('offerad_offer_id') !== identity.offer_id || attrs.get('offerad_terms_sha256') !== identity.fingerprint) fail('The existing draft does not match this accepted offer.', 'uncertain_mint', { draft_order_id: draft.id });
    if (draft.order?.id || draft.status === 'COMPLETED') fail('This offer already has a completed order.', 'already_redeemed', { draft_order_id: draft.id, order_id: draft.order?.id ?? null });
    verifyFinancial(draft, p);
    if (draft.allowDiscountCodesInCheckout !== false || draft.lineItems?.pageInfo?.hasNextPage || !Array.isArray(draft.lineItems?.nodes)) fail('The draft checkout could not be verified.', 'terms_mismatch');
    const lines = draft.lineItems.nodes;
    let paidQty = 0, paidTotal = 0, giftQty = 0;
    const paidPrices = new Set(p.lineItems.filter(l => l.priceOverride).map(l => l.priceOverride.amount));
    for (const line of lines) {
      if (line.custom !== false || line.components?.length || !Number.isInteger(line.quantity) || line.quantity < 1) fail('The draft contains unexpected product lines.', 'terms_mismatch');
      const total = readMoney(line.discountedTotalSet, p.terms.currency);
      if (line.variant?.id === p.terms.variant_id) {
        if (line.priceOverride?.currencyCode !== p.terms.currency || !paidPrices.has(Number(line.priceOverride.amount).toFixed(2)) || total !== cents(line.priceOverride.amount) * line.quantity) fail('Shopify changed the accepted variant price.', 'terms_mismatch');
        paidQty += line.quantity; paidTotal += total;
      } else if (p.gift && line.variant?.id === p.gift.variant_id && total === 0) giftQty += line.quantity;
      else fail('The draft contains an unapproved product or gift price.', 'terms_mismatch');
    }
    if (paidQty !== p.terms.quantity || paidTotal !== p.items || giftQty !== (p.gift ? 1 : 0)) fail('Shopify changed the accepted quantities.', 'terms_mismatch');
    let url;
    try { url = new URL(draft.invoiceUrl); } catch { fail('Shopify did not return an invoice checkout.', 'uncertain_mint', { draft_order_id: draft.id }); }
    if (url.protocol !== 'https:' || url.username || url.password) fail('Shopify returned an invalid invoice checkout.', 'bad_response');
    return {
      mode: 'draft', codes: [], invoice_url: url.href, cart_url: url.href, draft_order_id: draft.id,
      expires_at: null, reservation_expires_at: draft.reserveInventoryUntil ?? null,
      deferred: p.deferred, terms: p.terms, undeliverable: [],
      warnings: [
        'This invoice checkout has no automatic offer expiry. The stock-hold deadline only releases reserved inventory.',
        'The agreed shipping charge is included; the merchant must fulfill the stated delivery service and any recorded benefits.',
        'Final taxes depend on the checkout address and store tax settings. Review the final payable total before paying.',
      ],
      details: [{ kind: 'draft', id: draft.id, does: p.terms.headline }],
    };
  }
  async function find(p, identity) {
    let nodes;
    const knownId = known.get(identity.offer_id);
    if (knownId) {
      const draft = (await gql('draftOrder', GET, { id: knownId })).draftOrder;
      nodes = draft ? [draft] : [];
    } else {
      const connection = (await gql('draftOrders', FIND, { query: `tag:${identity.tag}` })).draftOrders;
      if (!connection || !Array.isArray(connection.nodes) || connection.pageInfo?.hasNextPage) fail('Existing drafts could not be reconciled.', 'uncertain_mint');
      nodes = connection.nodes;
    }
    if (nodes.length > 1) fail('Multiple drafts exist for this accepted offer; reconciliation is required.', 'uncertain_mint');
    if (!nodes.length) return null;
    known.set(identity.offer_id, nodes[0].id);
    return result(await ready(nodes[0]), p, identity);
  }
  async function issue(p, identity, options) {
    const existing = await find(p, identity);
    if (existing) return existing;
    if (options.reconcile_only || uncertain.has(identity.offer_id)) fail('The previous draft outcome is unresolved; no replacement was created.', 'uncertain_mint');
    const ttl = options.ttl_minutes == null ? 60 : Number(options.ttl_minutes);
    if (!Number.isFinite(ttl) || ttl <= 0 || ttl > 10080) fail('The inventory hold duration is invalid.');
    const input = {
      presentmentCurrencyCode: p.terms.currency, lineItems: p.lineItems,
      shippingLine: { title: p.shippingTitle, priceWithCurrency: money(p.shipping, p.terms.currency), shippingRateHandle: null },
      acceptAutomaticDiscounts: false, allowDiscountCodesInCheckout: false, discountCodes: [],
      reserveInventoryUntil: new Date(now() + ttl * 60000).toISOString(),
      tags: ['offerad', identity.tag],
      customAttributes: [{ key: 'offerad_offer_id', value: identity.offer_id }, { key: 'offerad_terms_sha256', value: identity.fingerprint }],
      note: `Accepted OfferAd offer ${identity.offer_id}\n${JSON.stringify(p.terms)}\nShipping service and recorded benefits must be fulfilled by the merchant. Taxes are determined at checkout.`,
    };
    // No mutation yet: an incompatible transform, unexpected discount or
    // shipping/tax result stops here, before creating an unusable invoice.
    verifyFinancial(payload(await gql('draftOrderCalculate', CALCULATE, { input }), 'draftOrderCalculate', 'calculatedDraftOrder'), p);
    let draft;
    try {
      draft = payload(await gql('draftOrderCreate', CREATE, { input }), 'draftOrderCreate', 'draftOrder');
    } catch (cause) {
      // Validation/auth failures are certain refusals. Everything else may be
      // a committed mutation with a lost response; never retry the mutation.
      if (cause.reason === 'user_errors' || cause.reason === 'config' || (cause.reason === 'http_error' && [400, 401, 403, 422].includes(cause.status))) throw cause;
      uncertain.add(identity.offer_id);
      let reconciled;
      try { reconciled = await find(p, identity); } catch (recovery) {
        if (recovery.reason === 'already_redeemed') throw recovery;
      }
      if (reconciled) return reconciled;
      fail('The draft creation outcome is uncertain; reconcile before retrying.', 'uncertain_mint', { cause_reason: cause.reason });
    }
    known.set(identity.offer_id, draft.id);
    uncertain.add(identity.offer_id);
    return result(await ready(draft), p, identity);
  }
  return {
    mode: 'draft',
    inspect(offer, mandate) {
      try { prepare(offer, mandate); return { supported: true, alternatives: [], not_included: [] }; }
      catch (e) { if (!(e instanceof SettleError)) throw e; return { supported: false, reason: e.message, alternatives: [], not_included: [] }; }
    },
    async mint(offer, mandate, options = {}) {
      const p = prepare(offer, mandate);
      if (mandate.shop && mandate.shop !== shop) fail('The offer belongs to another shop.', 'config');
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(options.offer_id || '')) fail('A stable offer identifier is required.');
      const fingerprint = await digest(JSON.stringify(p.terms));
      const identity = { offer_id: options.offer_id, fingerprint, tag: `offerad-${await digest(`${shop}|${options.offer_id}`)}` };
      const active = inFlight.get(identity.offer_id);
      if (active) {
        if (active.fingerprint !== fingerprint) fail('This offer identifier already has different accepted terms.', 'uncertain_mint');
        return active.promise;
      }
      const promise = issue(p, identity, options);
      inFlight.set(identity.offer_id, { fingerprint, promise });
      try { return await promise; } finally { inFlight.delete(identity.offer_id); }
    },
    // Webhook note_attributes are buyer-controllable. Only Shopify's own
    // draft -> order relation authorizes fulfillment of this accepted offer.
    async confirmOrder(orderGid, { draft_order_id, offer_id } = {}) {
      if (!/^gid:\/\/shopify\/Order\/[1-9][0-9]*$/.test(orderGid || '') || !/^gid:\/\/shopify\/DraftOrder\/[1-9][0-9]*$/.test(draft_order_id || '') || !/^[a-zA-Z0-9_-]{1,128}$/.test(offer_id || '')) return { ok: false, reason: 'invalid_order_reference' };
      const data = await gql('draftOrder', ORDER_LINK, { id: draft_order_id });
      if (!Object.hasOwn(data, 'draftOrder')) fail('Shopify returned no draft lookup result.', 'bad_response');
      const draft = data.draftOrder;
      if (!draft) return { ok: false, reason: 'draft_not_found' };
      if (draft.id !== draft_order_id || !draft.customAttributes?.some(a => a.key === 'offerad_offer_id' && a.value === offer_id)) return { ok: false, reason: 'offer_mismatch' };
      if (!draft.order?.id) return { ok: false, reason: 'order_not_linked' };
      return draft.order.id === orderGid ? { ok: true } : { ok: false, reason: 'order_mismatch' };
    },
    // The existing adapter owns post-payment credits and durable order metadata.
    annotateOrder: (id, terms) => shopifyAdapter({ shop, token, apiVersion, fetchFn, now, timeoutMs }).annotateOrder(id, terms),
  };
}
