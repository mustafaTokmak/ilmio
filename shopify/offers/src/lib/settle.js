// Settlement: what turns an accepted offer into something a checkout honours.
// The dry adapter keeps codes in our own store and prices the demo cart itself.
// The Shopify adapter mints real discount codes through the Admin GraphQL API:
// one Function-backed code per offer when the Discount Function is deployed,
// otherwise a product-bound native price or BxGy code, with explicit alternatives for composites. Only public terms go out
// either way. Costs, floors and budgets stay behind in the service.

import { r2, checkOffer, roomFor, unitFloor } from './policy.js';
import { listProducts, mandateFor } from './mandates.js';

// No 0/O and no 1/I/L: a code may be read aloud or typed by hand.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_PREFIX = 'OFFER-';
const CODE_LENGTH = 6;
const DEFAULT_TTL_MINUTES = 60;
const MINUTE = 60000;
const DAY = 86400000;
// The smallest amount a discount can take off, for a currency with two decimals.
const CENT = 0.01;

// Promises a checkout cannot show as money. They wait for the order.
const DEFERRED = ['extended_returns', 'delivery_guarantee', 'next_order_credit'];
const AT_CHECKOUT = ['price', 'gift', 'free_shipping', 'express_upgrade'];
// The only fields of a component that may leave the service: no seller_cost, no source.
const COMPONENT_FIELDS = ['type', 'label', 'amount_off', 'variant_id', 'ship_days', 'days', 'credit', 'amount', 'valid_days', 'buyer_value'];

// Failures carry a reason code, so the service can tell a bad offer from a
// Shopify refusal from an outage without reading messages.
export class SettleError extends Error {
  constructor(message, detail = {}) {
    super(message);
    Object.assign(this, detail);
    this.name = 'SettleError';
  }
}

// The digits an id ends in: "gid://shopify/ProductVariant/123" and "123" name the same variant.
const tail = id => (String(id ?? '').match(/(\d+)$/) || [])[1] || null;
const iso = ms => new Date(ms).toISOString();
// Shopify's Decimal travels as a string.
const dec = x => r2(Number(x)).toFixed(2);
const pick = c => Object.fromEntries(COMPONENT_FIELDS.filter(k => c?.[k] != null).map(k => [k, c[k]]));
const rateOf = s => (s ? { price: s.price, days: s.days } : null);
const minutes = ttl => (Number(ttl) > 0 ? Number(ttl) : DEFAULT_TTL_MINUTES);
// Codes are case-insensitive at a Shopify checkout; the demo store reads them the same way.
const codeList = codes => [...new Set((Array.isArray(codes) ? codes : String(codes ?? '').split(',')).map(c => String(c).trim().toUpperCase()).filter(Boolean))];

function randomCode() {
  let body = '';
  while (body.length < CODE_LENGTH) {
    // 248 is the largest multiple of 31 in a byte; bytes above it would favour the first letters.
    for (const b of crypto.getRandomValues(new Uint8Array(CODE_LENGTH * 2))) {
      if (b < 248 && body.length < CODE_LENGTH) body += ALPHABET[b % ALPHABET.length];
    }
  }
  return CODE_PREFIX + body;
}

// The public terms of an offer, built field by field so that nothing else the
// stored offer or the mandate carries can ride along. This is what a code
// record holds and what the Discount Function reads from its metafield.
export function offerTerms(offer, mandate) {
  const p = mandate.product;
  return {
    quantity: offer.quantity,
    currency: offer.currency || p.currency,
    variant_id: p.variant_id,
    product: { variant_id: p.variant_id, variant: tail(p.variant_numeric_id || p.variant_id), handle: p.handle, title: p.title, price: p.list },
    shipping: { standard: rateOf(mandate.shipping?.standard), express: rateOf(mandate.shipping?.express) },
    components: offer.components.map(pick),
    headline: offer.headline,
    items_total: offer.items_total,
    shipping_total: offer.shipping_total,
    total: offer.total,
    ship_days: offer.ship_days,
  };
}

// Minting is the last place to stop an offer the mandate does not allow. The
// service checks first; stored offers are still only data.
function vetted(offer, mandate) {
  if (!tail(mandate?.product?.variant_id)) throw new SettleError('the mandate names no product variant', { reason: 'bad_offer' });
  if (!Array.isArray(offer?.components) || !offer.components.length) throw new SettleError('the offer has no components', { reason: 'bad_offer' });
  if (!Number.isInteger(offer.quantity) || offer.quantity < 1) throw new SettleError('the offer has no quantity', { reason: 'bad_offer' });
  const problems = checkOffer(mandate, offer);
  // Which limit was hit stays in the detail: a message can end up in front of a buyer.
  if (problems.length) throw new SettleError('the offer is outside the mandate', { reason: 'policy', problems });
  return offerTerms(offer, mandate);
}

// A cent off is a concession like any other: it has to fit under the floor
// and inside the budget before a code may take it.
function centFits(offer, mandate) {
  const sum = of => offer.components.reduce((a, c) => a + (Number(of(c)) || 0), 0);
  const cost = sum(c => c.seller_cost);
  const off = sum(c => (c.type === 'price' ? c.amount_off : 0));
  return cost + CENT <= roomFor(mandate, offer.quantity) + 1e-9
    && mandate.product.list - (off + CENT) / offer.quantity >= unitFloor(mandate) - 1e-9;
}

// Said to the buyer's agent, so it names the term and nothing about why.
const cannot = c => `This store has no way to deliver "${c.label || c.type}" at checkout.`;

// What an offer asks of the checkout, and what has to wait for the order.
function split(terms) {
  const of = type => terms.components.filter(c => c.type === type);
  return {
    priceOff: r2(of('price').reduce((a, c) => a + (Number(c.amount_off) || 0), 0)),
    priceLabel: of('price').map(c => c.label).join(' + '),
    gift: of('gift')[0] || null,
    freeShipping: of('free_shipping')[0] || null,
    express: of('express_upgrade')[0] || null,
    deferred: terms.components.filter(c => DEFERRED.includes(c.type)).map(c => ({ ...c, currency: terms.currency })),
    unknown: terms.components.filter(c => !AT_CHECKOUT.includes(c.type) && !DEFERRED.includes(c.type)),
  };
}

// Native discounts cannot bind shipping to this product, or reliably combine
// BxGy with a price cut on its qualifying product. Keep the full offer for the
// Function; alternatives are separate offers that need fresh user approval.
// https://help.shopify.com/en/manual/discounts/discount-combinations
// https://shopify.dev/docs/api/admin-graphql/latest/input-objects/DiscountCodeFreeShippingInput
function checkoutSupport(offer, mandate, mode) {
  const parts = split(offerTerms(offer, mandate));
  const missing = [...parts.unknown];
  if (parts.gift && !tail(parts.gift.variant_id)) missing.push(parts.gift);
  if (mode === 'native') {
    if (parts.freeShipping) missing.push(parts.freeShipping);
    if (parts.express) missing.push(parts.express);
    if (parts.gift && parts.priceOff > 0) missing.push(parts.gift);
  }
  const monetary = parts.priceOff > 0 || !!parts.gift || (mode === 'function' && !!(parts.freeShipping || parts.express));
  if (!missing.length && monetary) return { supported: true, alternatives: [], not_included: [] };

  const finish = components => {
    const off = r2(components.filter(c => c.type === 'price').reduce((n, c) => n + c.amount_off, 0));
    const total = r2(mandate.product.list * offer.quantity - off + mandate.shipping.standard.price);
    return {
      ...offer, kind: 'checkout_alternative', components,
      headline: components.map(c => c.label).join(' + '),
      unit_price: r2(mandate.product.list - off / offer.quantity),
      items_total: r2(mandate.product.list * offer.quantity - off),
      shipping_total: mandate.shipping.standard.price, total,
      you_save: r2(offer.list_total - total),
      extras_value: r2(components.filter(c => !['price', 'free_shipping'].includes(c.type)).reduce((n, c) => n + (c.buyer_value || 0), 0)),
      ship_days: mandate.shipping.standard.days,
      seller_cost: r2(components.reduce((n, c) => n + c.seller_cost, 0)),
    };
  };
  const valid = offer.components.filter(c => DEFERRED.includes(c.type) || c.type === 'price' || (c.type === 'gift' && tail(c.variant_id)));
  const mixes = parts.priceOff > 0 && parts.gift
    ? [valid.filter(c => c.type !== 'gift'), valid.filter(c => c.type !== 'price')]
    : [valid];
  const alternatives = [];
  for (let components of mixes) {
    if (!components.some(c => c.type === 'price' || c.type === 'gift')) {
      if (!parts.deferred.length || !centFits(offer, mandate) || !mandate.concessions?.price?.on) continue;
      components = [...components, { type: 'price', source: 'sponsored_discount', label: 'One cent off to carry the order terms', amount_off: CENT, buyer_value: CENT, seller_cost: CENT }];
    }
    const alternative = finish(components);
    if (!checkOffer(mandate, alternative).length) alternatives.push(alternative);
  }
  return {
    supported: false,
    reason: monetary ? 'This checkout cannot enforce every part of this offer together. The complete offer needs the store’s composite Discount Function.' : 'These terms need an order code; a one-cent carrier changes the quoted price and needs separate approval.',
    not_included: missing.map(c => ({ type: c.type, label: c.label })),
    alternatives,
  };
}

// A cart link in Shopify's permalink form. The add-on has to be a line of its
// own: no discount, native or Function, can add an item to a cart.
// https://shopify.dev/docs/apps/build/checkout/create-cart-permalinks
function cartUrl(storefront, terms, gift, codes) {
  const lines = [`${terms.product.variant}:${terms.quantity}`];
  if (tail(gift?.variant_id)) lines.push(`${tail(gift.variant_id)}:1`);
  return `${String(storefront || '').replace(/\/+$/, '')}/cart/${lines.join(',')}${codes.length ? `?discount=${codes.join(',')}` : ''}`;
}

// What the service kept against a code: the deferred list itself, or an
// object that carries it along with the code and the offer id. A term may be
// a component, the bare name of one, or a line of text for the note.
function readTerms(terms) {
  const t = Array.isArray(terms) ? { deferred: terms } : terms || {};
  const items = t.deferred || t.terms || t.components || [];
  const named = d => (DEFERRED.includes(d) ? { type: d, label: d.replace(/_/g, ' ') } : { type: 'note', label: d });
  return {
    code: t.code || t.codes?.[0] || null,
    offer_id: t.offer_id || null,
    currency: t.currency || items.find(d => d?.currency)?.currency || null,
    deferred: items.map(d => (typeof d === 'string' ? named(d) : pick(d))).filter(d => d.type === 'note' || DEFERRED.includes(d.type)),
  };
}

// The later-order credits among deferred terms. One with no amount on record
// cannot become a code, and that is said rather than passed over.
function creditsOf(deferred, warnings) {
  const credits = deferred.filter(d => d.type === 'next_order_credit');
  if (credits.some(d => !(d.amount > 0))) warnings.push('A later-order credit has no amount on record, so no code was made for it.');
  return credits.filter(d => d.amount > 0);
}

// A cart from wherever it comes: the lines part of a cart link ("123:1,456:2"),
// an array of lines, or an object holding either. A cart is not trusted to
// price itself: where the store knows the variant, the store's price is used.
function readLines(cart, catalog) {
  const given = Array.isArray(cart) || typeof cart === 'string' ? cart : cart?.lines ?? cart?.line_items ?? cart?.items ?? [];
  const pair = s => { const [variant, quantity = 1] = s.split(':'); return { variant, quantity }; };
  const raw = (typeof given === 'string' ? given.split(',') : Array.isArray(given) ? given : []).map(l => (typeof l === 'string' ? pair(l) : l));
  const lines = [];
  for (const l of raw) {
    if (!l || typeof l !== 'object') continue;
    const variant = tail(l.variant_numeric_id ?? l.variant_id ?? l.variant ?? l.merchandise_id ?? l.item?.id ?? l.id);
    const quantity = Math.round(Number(l.quantity ?? l.qty ?? 1)) || 0;
    if (!variant || quantity < 1) continue;
    const known = catalog.get(variant)?.product;
    const same = lines.find(x => x.variant === variant);
    if (same) same.quantity += quantity;
    else lines.push({ variant, title: known?.title ?? l.title ?? `Variant ${variant}`, quantity, price: Number(known?.list ?? l.price ?? l.unit_price ?? 0) || 0, discount: 0, code: null });
  }
  return lines;
}

// Codes that live in our own store, for the stand-in storefront this worker
// serves. One code carries the whole offer, as a Function-backed code does.
export function dryAdapter(store, { storefront = '/demo', shop = 'demo', now = () => Date.now() } = {}) {
  const expired = rec => rec.expires_at != null && now() >= (typeof rec.expires_at === 'number' ? rec.expires_at : Date.parse(rec.expires_at));

  async function freshCode() {
    for (let i = 0; i < 5; i++) {
      const code = randomCode();
      if (!(await store.getCode(code))) return code;
    }
    throw new SettleError('no unused code could be drawn', { reason: 'code_taken' });
  }

  // The terms behind a code. They sit on the code's own record; if that record
  // was rewritten without them, the stored offer still has the components.
  async function termsFor(rec) {
    if (rec.offer?.product && Array.isArray(rec.offer.components)) return rec.offer;
    const stored = rec.offer_id ? await store.getOffer(rec.offer_id) : null;
    const offer = [rec.offer, stored?.offer, stored].find(o => Array.isArray(o?.components));
    const refs = [stored?.product?.variant_id, stored?.product?.handle, stored?.variant_id, stored?.handle, stored?.product, rec.product].filter(x => typeof x === 'string');
    const mandate = refs.map(ref => mandateFor(rec.shop || stored?.shop || shop, ref)).find(Boolean);
    return offer && mandate ? offerTerms(offer, mandate) : null;
  }

  return {
    mode: 'dry',

    async mint(offer, mandate, { offer_id = null, ttl_minutes, storefront: base } = {}) {
      const terms = vetted(offer, mandate);
      const parts = split(terms);
      const code = await freshCode();
      const expires_at = iso(now() + minutes(ttl_minutes) * MINUTE);
      await store.putCode({ code, offer_id, shop: mandate.shop || shop, mode: 'dry', offer: terms, deferred: parts.deferred, expires_at, used: false, created_at: iso(now()) });
      return {
        codes: [code],
        cart_url: cartUrl(base || mandate.storefront || storefront, terms, parts.gift, [code]),
        expires_at,
        mode: 'dry',
        deferred: parts.deferred,
        // The service passes warnings on to the buyer's agent, so they are worded for it.
        warnings: parts.unknown.map(cannot),
        undeliverable: parts.unknown.map(c => ({ type: c.type, label: c.label })),
        details: [{ code, kind: 'offer', does: terms.headline }],
      };
    },

    async revoke(code) {
      const [key] = codeList(code);
      if (!key || !(await store.getCode(key))) return { ok: false, code: key || null, reason: 'not_found' };
      await store.updateCode(key, { revoked: true, revoked_at: iso(now()) });
      return { ok: true, code: key };
    },

    // Prices a cart the way the checkout would: the store's list prices, then
    // each code's terms. The totals carry the names policy.js promised them
    // under, so a cart built from an offer's link can be compared field by field.
    async evaluate(codes, cart) {
      const own = cart && typeof cart === 'object' && !Array.isArray(cart) ? cart : {};
      const where = own.shop || shop;
      const catalog = new Map(listProducts(where).map(m => [m.product.variant_numeric_id, m]));
      const lines = readLines(cart, catalog);
      const applied = [], rejected = [], deferred = [], notes = [];
      const reject = (code, reason, reason_text) => rejected.push({ code, reason, reason_text });
      const apply = (code, title, amount, target = 'items') => { if (amount > 0) applied.push({ code, title, amount, target }); };
      const take = (line, amount) => {
        const off = r2(Math.max(0, Math.min(amount, line.price * line.quantity - line.discount)));
        line.discount = r2(line.discount + off);
        return off;
      };
      let ship = null, rates = null, currency = null, credited = false, negotiated = null;

      for (const code of codeList(codes)) {
        const rec = await store.getCode(code);
        // One store holds every shop's codes; a code for another shop is no code here.
        if (!rec || (rec.shop && rec.shop !== where)) { reject(code, 'unknown_code', 'This code is not known to the store.'); continue; }
        if (rec.revoked) { reject(code, 'revoked', 'This code was withdrawn.'); continue; }
        if (rec.used) { reject(code, 'already_used', 'This code has already been used.'); continue; }
        if (expired(rec)) { reject(code, 'expired', 'This code has expired.'); continue; }
        if (negotiated) { reject(code, 'not_combinable', 'Only one negotiated offer or earned credit applies per order.'); continue; }
        if (rec.credit) {
          // Credit from an earlier order comes off the items, first line first.
          // Like its Shopify twin it does not stack on a discounted line.
          if (lines.some(l => l.discount > 0)) { reject(code, 'not_combinable', 'A credit does not combine with a price cut or a free add-on.'); continue; }
          let left = rec.credit.amount;
          for (const l of lines) left = r2(left - take(l, left));
          if (left < rec.credit.amount) { negotiated = code; credited = true; apply(code, rec.credit.label, r2(rec.credit.amount - left)); }
          else reject(code, 'not_in_cart', 'There is nothing in the cart for this code to come off.');
          continue;
        }
        const terms = await termsFor(rec);
        // Refusals are shown on the cart page as they are, to any visitor.
        if (!terms) { reject(code, 'no_terms', 'Nothing is on record for this code.'); continue; }
        const parts = split(terms);
        const line = lines.find(l => l.variant === terms.product.variant);
        if (!line) { reject(code, 'not_in_cart', `This code is for ${terms.product.title}, which is not in the cart.`); continue; }
        if (line.quantity < terms.quantity) { reject(code, 'quantity_too_low', `This code needs ${terms.quantity} of ${terms.product.title} in the cart.`); continue; }
        // One offer per product: a second code must not walk the price below the floor.
        if (line.code) { reject(code, 'not_combinable', `Another code already applies to ${terms.product.title}.`); continue; }
        if (credited && (parts.priceOff > 0 || parts.gift)) { reject(code, 'not_combinable', 'A price cut or a free add-on does not combine with a credit.'); continue; }
        negotiated = code;
        line.code = code;
        apply(code, parts.priceLabel, take(line, parts.priceOff));
        if (parts.gift) {
          const g = lines.find(l => l.variant === tail(parts.gift.variant_id));
          if (g) apply(code, parts.gift.label, take(g, g.price));
          else notes.push(`${parts.gift.label}: add it to the cart to receive it.`);
        }
        // Only one shipping discount holds on an order, as at a Shopify checkout.
        if (!ship && (parts.freeShipping || parts.express)) ship = { code, ...parts };
        rates = rates || terms.shipping;
        currency = currency || terms.currency;
        for (const d of parts.deferred) deferred.push({ code, type: d.type, title: d.label });
      }

      const first = lines.map(l => catalog.get(l.variant)).find(Boolean) || catalog.values().next().value;
      rates = rates || { standard: rateOf(first?.shipping?.standard), express: rateOf(first?.shipping?.express) };
      // The delivery method a cart names, as a handle or as the rate it picked.
      const asked = own.shipping_method ?? own.shipping?.handle ?? own.shipping ?? null;
      // An offer with an express upgrade ships express unless the cart says otherwise.
      const method = (asked === 'express' || (asked !== 'standard' && ship?.express)) && rates.express ? 'express' : 'standard';
      const rate = (lines.length && rates[method]) || { price: 0, days: null };
      let left = rate.price;
      const shipOff = (label, amount) => {
        const off = r2(Math.max(0, Math.min(amount, left)));
        left = r2(left - off);
        apply(ship.code, label, off, 'shipping');
      };
      // Express at the standard rate; free shipping then takes what is left to zero.
      if (ship?.express && method === 'express') shipOff(ship.express.label, rate.price - (rates.standard?.price ?? 0));
      if (ship?.freeShipping && (method === 'standard' || ship.express)) shipOff(ship.freeShipping.label, left);
      else if (ship?.freeShipping) notes.push('Free shipping covers standard delivery; express is charged at its normal rate.');

      const subtotal = r2(lines.reduce((a, l) => a + l.price * l.quantity, 0));
      const discount_total = r2(lines.reduce((a, l) => a + l.discount, 0));
      const items_total = r2(subtotal - discount_total);
      return {
        applied,
        rejected,
        totals: {
          currency: currency || first?.product.currency || null,
          subtotal,
          discount_total,
          items_total,
          shipping_method: method,
          shipping_list: rate.price,
          shipping_discount: r2(rate.price - left),
          shipping_total: left,
          total: r2(items_total + left),
          ship_days: rate.days,
        },
        deferred,
        notes,
        lines: lines.map(l => ({ variant: l.variant, title: l.title, quantity: l.quantity, price: l.price, discount: l.discount, total: r2(l.price * l.quantity - l.discount) })),
      };
    },

    // The demo checkout takes no payment, so nothing marks a code used by
    // itself; whoever plays the order calls this.
    async redeem(codes, { order_id = `demo-${crypto.randomUUID()}` } = {}) {
      if (typeof store.claimCode !== 'function') throw new SettleError('The store cannot redeem codes atomically.', { reason: 'config' });
      const redeemed = [];
      for (const code of codeList(codes)) {
        const claim = await store.claimCode(code, order_id);
        if (claim.ok && claim.first) redeemed.push(code);
      }
      return { redeemed };
    },

    // There is no order to write on in the demo. The promise is still kept:
    // the terms are logged and a later-order credit becomes a code.
    async annotateOrder(orderId, terms) {
      const t = readTerms(terms);
      const rec = t.code ? await store.getCode(t.code) : null;
      if (rec?.annotated) return { ok: true, order_id: orderId, already: true, terms: t.deferred, codes: rec.annotated.codes, warnings: [] };
      const codes = [], warnings = [];
      for (const c of creditsOf(t.deferred, warnings)) {
        const code = await freshCode();
        const expires_at = iso(now() + (c.valid_days || 90) * DAY);
        await store.putCode({ code, offer_id: t.offer_id, shop, mode: 'dry', credit: { amount: c.amount, label: c.label }, expires_at, used: false, created_at: iso(now()) });
        codes.push({ code, type: c.type, amount: c.amount, currency: t.currency, expires_at });
      }
      if (rec) await store.updateCode(t.code, { annotated: { order_id: orderId, codes } });
      await store.log?.({ type: 'order_annotated', order_id: orderId, code: t.code, offer_id: t.offer_id, terms: t.deferred.map(d => d.label), codes: codes.map(c => c.code) });
      return { ok: true, order_id: orderId, already: false, terms: t.deferred, codes, warnings };
    },
  };
}

// Admin GraphQL documents, each checked against the 2026-10 reference page
// named above it. An operation is named after the field it calls, so a log
// line or an error names the mutation.

// https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeBasicCreate
// Amount off by code. On create DiscountCodeBasicInput needs code, context
// (customerSelection is deprecated), customerGets, startsAt and title.
const BASIC_CREATE = `mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode { id }
    userErrors { field code message }
  }
}`;

// https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeFreeShippingCreate
// All or nothing on a shipping rate: there is no partial shipping discount and
// no way to name a rate, only maximumShippingPrice to leave dearer rates alone.
const FREE_SHIPPING_CREATE = `mutation discountCodeFreeShippingCreate($freeShippingCodeDiscount: DiscountCodeFreeShippingInput!) {
  discountCodeFreeShippingCreate(freeShippingCodeDiscount: $freeShippingCodeDiscount) {
    codeDiscountNode { id }
    userErrors { field code message }
  }
}`;

// https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeBxgyCreate
// Buy X get Y. The reward is discountOnQuantity with a percentage effect
// (discountAmount and percentage are not accepted here) and items.all is not allowed.
const BXGY_CREATE = `mutation discountCodeBxgyCreate($bxgyCodeDiscount: DiscountCodeBxgyInput!) {
  discountCodeBxgyCreate(bxgyCodeDiscount: $bxgyCodeDiscount) {
    codeDiscountNode { id }
    userErrors { field code message }
  }
}`;

// https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeAppCreate
// A code backed by the app's Discount Function, named by functionHandle
// (functionId is deprecated; handles are stable from 2025-10 on). Metafields
// are set in the same call, and the payload is codeAppDiscount with a
// discountId rather than a codeDiscountNode.
const APP_CREATE = `mutation discountCodeAppCreate($codeAppDiscount: DiscountCodeAppInput!) {
  discountCodeAppCreate(codeAppDiscount: $codeAppDiscount) {
    codeAppDiscount { discountId }
    userErrors { field code message }
  }
}`;

// https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeDelete
// Takes back a code that was created but never handed out.
const CODE_DELETE = `mutation discountCodeDelete($id: ID!) {
  discountCodeDelete(id: $id) {
    deletedCodeDiscountId
    userErrors { field code message }
  }
}`;

// https://shopify.dev/docs/api/admin-graphql/latest/queries/codeDiscountNodeByCode
// Case-insensitive lookup. It needs read_discounts, which write_discounts includes.
const NODE_BY_CODE = `query codeDiscountNodeByCode($code: String!) {
  codeDiscountNodeByCode(code: $code) {
    id
    codeDiscount {
      ... on DiscountCodeBasic { title endsAt }
      ... on DiscountCodeBxgy { title endsAt }
      ... on DiscountCodeFreeShipping { title endsAt }
      ... on DiscountCodeApp { title endsAt }
    }
  }
}`;

// https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeDeactivate
// Stops new redemptions and keeps the discount in the merchant's history.
const CODE_DEACTIVATE = `mutation discountCodeDeactivate($id: ID!) {
  discountCodeDeactivate(id: $id) {
    codeDiscountNode { id }
    userErrors { field code message }
  }
}`;

// https://shopify.dev/docs/api/admin-graphql/latest/queries/order
// Read before writing: orderUpdate replaces the note and the tags outright.
const ORDER_READ = `query order($id: ID!) {
  order(id: $id) {
    id
    note
    tags
    metafield(namespace: "$app", key: "offer_terms") { value compareDigest }
  }
}`;

// https://shopify.dev/docs/api/admin-graphql/latest/mutations/orderUpdate
// OrderInput.note and OrderInput.tags overwrite what the order has, so both
// are sent merged. Its userErrors are plain UserError: field and message only.
const ORDER_UPDATE = `mutation orderUpdate($input: OrderInput!) {
  orderUpdate(input: $input) {
    order { id }
    userErrors { field message }
  }
}`;

// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsSet
// Sets a value whether or not it existed, so an order webhook delivered twice
// writes the same thing twice. At most 25 metafields a call.
// Additive tags preserve concurrent merchant and offer annotations.
// https://shopify.dev/docs/api/admin-graphql/latest/mutations/tagsAdd
const TAGS_ADD = `mutation tagsAdd($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) {
    node { id }
    userErrors { field message }
  }
}`;

const METAFIELDS_SET = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { id namespace key }
    userErrors { field message code }
  }
}`;

const refused = (operation, errors) => new SettleError(
  `${operation}: ${errors.length ? errors.map(e => `${(e.field || []).join('.') || 'input'}: ${e.message}`).join('; ') : 'nothing was created'}`,
  { reason: 'user_errors', operation, userErrors: errors },
);

// Real discount codes on a Shopify store. functionHandle switches from native
// discounts to one Function-backed code per offer.
export function shopifyAdapter({ shop, token, apiVersion = '2026-10', fetchFn = fetch, functionHandle = null, now = () => Date.now(), oncePerCustomer = true, retryMs = 1000, timeoutMs = 15000 } = {}) {
  const mode = functionHandle ? 'function' : 'native';

  // What every code shares: live now, gone at its deadline, one use. usageLimit
  // alone makes a code single use; once-per-customer also holds if a merchant
  // later raises it. The start is backdated a minute, so a clock a little
  // ahead of Shopify's cannot leave the code scheduled.
  const limits = (at, endsAt) => ({ startsAt: iso(at - MINUTE), endsAt, context: { all: 'ALL' }, usageLimit: 1, appliesOncePerCustomer: oncePerCustomer });
  const only = id => ({ products: { productVariantsToAdd: [id] } });
  // One amount across the entitled items however many are bought: a saving is a total, not a rate per unit.
  const amountOff = (amount, items) => ({ value: { discountAmount: { amount: dec(amount), appliesOnEachItem: false } }, items });

  // One Admin API call. Shopify answers 200 to most failures, so the body
  // decides: top-level errors are the platform's or ours, userErrors are for
  // the caller to judge.
  async function gql(operation, query, variables, attempt = 0) {
    // The token goes to the shop's own admin host and nowhere else.
    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(String(shop))) throw new SettleError('shop must be a myshopify.com domain', { reason: 'config', operation });
    const secret = typeof token === 'function' ? await token() : token;
    if (!secret) throw new SettleError('no Admin API token for this shop', { reason: 'config', operation });
    let res, body;
    try {
      res = await fetchFn(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': secret },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      body = await res.json().catch(() => null);
    } catch (e) {
      throw new SettleError(`${operation}: the Admin API could not be reached`, { reason: 'fetch_failed', operation, detail: String(e?.message || e) });
    }
    // A 401 carries its errors as one string, not a list; the status speaks for it.
    const errors = Array.isArray(body?.errors) ? body.errors : [];
    if ((res.status === 429 || errors.some(e => e.extensions?.code === 'THROTTLED')) && attempt < 1) {
      await new Promise(done => setTimeout(done, retryMs));
      return gql(operation, query, variables, attempt + 1);
    }
    if (!res.ok) throw new SettleError(`${operation}: the Admin API answered ${res.status}`, { reason: 'http_error', operation, status: res.status });
    if (errors.length) {
      throw new SettleError(`${operation}: ${errors.map(e => e.message).join('; ')}`, { reason: 'graphql_errors', operation, errors: errors.map(e => ({ message: e.message, code: e.extensions?.code ?? null })) });
    }
    if (!body?.data) throw new SettleError(`${operation}: the Admin API sent no data`, { reason: 'bad_response', operation });
    return body.data;
  }

  // Creates one discount. An uncertain retry reconciles its deterministic code
  // against the stored title and expiry; a collision is refused, never redrawn.
  // An input that names its own code is given as a function of it.
  async function create(step) {
    // A retry after an uncertain API response uses the same code. The title
    // fingerprint protects against a short-code collision with another offer.
    const identity = step.identity || null;
    const stable = identity ? new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${shop}|${identity}`))) : null;
    const code = stable ? CODE_PREFIX + [...stable.slice(0, 8)].map(b => ALPHABET[b % ALPHABET.length]).join('') : randomCode();
    const title = `${code}: ${identity ? `[${identity}] ` : ''}${step.label}`.slice(0, 255);
    const input = { title, code, ...(typeof step.input === 'function' ? step.input(code) : step.input) };
    const payload = (await gql(step.operation, step.query, { [step.variable]: input }))[step.operation];
    const errors = payload?.userErrors || [];
    if (identity && errors.length && errors.every(e => e.code === 'TAKEN')) {
      const held = (await gql('codeDiscountNodeByCode', NODE_BY_CODE, { code })).codeDiscountNodeByCode;
      if (held?.id && held.codeDiscount?.title === title && held.codeDiscount.endsAt) {
        return { code, id: held.id, kind: step.kind, does: step.label, expires_at: held.codeDiscount.endsAt, recovered: true };
      }
      throw new SettleError('The existing code could not be reconciled with this offer.', { reason: 'uncertain_mint', operation: step.operation });
    }
    const id = payload?.codeDiscountNode?.id || payload?.codeAppDiscount?.discountId;
    if (errors.length || !id) throw refused(step.operation, errors);
    return { code, id, kind: step.kind, does: step.label, expires_at: input.endsAt };
  }

  async function remove(id) {
    const errors = (await gql('discountCodeDelete', CODE_DELETE, { id })).discountCodeDelete?.userErrors || [];
    if (errors.length) throw refused('discountCodeDelete', errors);
  }

  // Half an offer is worse than none: when a later step fails, the codes
  // already created are taken back before the failure is reported.
  async function createAll(steps) {
    const made = [];
    try {
      for (const step of steps) made.push(await create(step));
    } catch (e) {
      const left_behind = [];
      for (const m of made) if (!m.recovered) await remove(m.id).catch(() => left_behind.push(m.code));
      if (e instanceof SettleError) Object.assign(e, { rolled_back: made.map(m => m.code).filter(c => !left_behind.includes(c)), left_behind });
      throw e;
    }
    return made;
  }

  // The discounts one enforceable offer needs, after side-effect-free preflight.
  // A cent carrier is only used as an explicitly approved price component.
  function plan(terms, parts, base, offer_id) {
    const steps = [];
    const warnings = parts.unknown.map(cannot);
    const undeliverable = parts.unknown.map(c => ({ type: c.type, label: c.label }));
    const lost = (c, why = cannot(c)) => { warnings.push(why); undeliverable.push({ type: c.type, label: c.label }); };
    const basic = (kind, label, input) => steps.push({ kind, label, operation: 'discountCodeBasicCreate', query: BASIC_CREATE, variable: 'basicCodeDiscount', input: { ...base, ...input } });
    // A minimum of one unit is what any cart already has, so a minimum is only stated above that.
    const enough = terms.quantity > 1 ? { minimumRequirement: { quantity: { greaterThanOrEqualToQuantity: String(terms.quantity) } } } : {};
    // An add-on is delivered by discounting its variant, so it needs one.
    let gift = parts.gift;
    if (gift && !tail(gift.variant_id)) { lost(gift); gift = null; }

    if (functionHandle) {
      // One node is the whole offer. combinesWith is left at its default, all
      // false, so no other discount stacks on a price that was set against the floor.
      const discountClasses = [(parts.priceOff > 0 || gift) && 'PRODUCT', (parts.freeShipping || parts.express) && 'SHIPPING'].filter(Boolean);
      if (discountClasses.length) {
        steps.push({
          kind: 'offer', label: terms.headline || 'Agent offer', operation: 'discountCodeAppCreate', query: APP_CREATE, variable: 'codeAppDiscount',
          // The Function is told its code and deadline as well: the offer stays
          // with this one code even if others are added to the discount later.
          input: code => ({ ...base, functionHandle, discountClasses, combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: false }, metafields: [{ namespace: '$app', key: 'offer', type: 'json', value: JSON.stringify({ offer_id, code, expires_at: base.endsAt, ...terms }) }] }),
        });
      }
    } else {
      // Preflight allows one product-bound monetary entitlement. Neither an
      // unconditional gift code nor a product-agnostic shipping code is minted.
      if (parts.priceOff > 0) {
        basic('price', parts.priceLabel, {
          customerGets: amountOff(parts.priceOff, only(terms.variant_id)),
          ...enough,
          combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: false },
        });
      }
      if (gift) {
        steps.push({
          kind: 'gift', label: gift.label, operation: 'discountCodeBxgyCreate', query: BXGY_CREATE, variable: 'bxgyCodeDiscount',
          input: {
            ...base,
            customerBuys: { items: only(terms.variant_id), value: { quantity: String(terms.quantity) } },
            customerGets: { items: only(gift.variant_id), value: { discountOnQuantity: { quantity: '1', effect: { percentage: 1 } } } },
            // Once an order, or buying twice the quantity would earn two add-ons.
            usesPerOrderLimit: 1,
            combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: false },
          },
        });
      }

    }

    return { steps, warnings, undeliverable, gift };
  }

  const describe = (d, credits) => {
    const credit = credits.find(c => c.type === d.type && c.amount === d.amount);
    return credit ? `${d.label} (code ${credit.code}, valid until ${credit.expires_at.slice(0, 10)})` : d.label;
  };

  return {
    mode,

    inspect(offer, mandate) { return checkoutSupport(offer, mandate, mode); },

    async mint(offer, mandate, { offer_id = null, ttl_minutes, storefront } = {}) {
      const terms = vetted(offer, mandate);
      const support = checkoutSupport(offer, mandate, mode);
      if (!support.supported) throw new SettleError(support.reason, { ...support, reason: 'not_deliverable' });
      const parts = split(terms);
      const at = now();
      const expires_at = iso(at + minutes(ttl_minutes) * MINUTE);
      const { steps, warnings, undeliverable, gift } = plan(terms, parts, limits(at, expires_at), offer_id);
      for (const step of steps) if (offer_id) step.identity = `${offer_id}:${step.kind}`;
      const made = await createAll(steps);
      const codes = made.map(m => m.code);
      const actual_expiry = made.map(m => m.expires_at).filter(Boolean).sort()[0] || expires_at;
      // No code means nothing the buyer could use: the service counts that as a failed mint.
      if (!codes.length) warnings.push('There is no code for this offer: nothing in it could be set up as a discount at this store.');
      return {
        codes,
        cart_url: cartUrl(storefront || mandate.storefront || `https://${shop}`, terms, gift, codes),
        expires_at: actual_expiry,
        mode,
        deferred: parts.deferred,
        warnings,
        undeliverable,
        details: made.map(m => ({ code: m.code, kind: m.kind, does: m.does, id: m.id })),
      };
    },

    async revoke(code) {
      const [key] = codeList(code);
      const id = key ? (await gql('codeDiscountNodeByCode', NODE_BY_CODE, { code: key })).codeDiscountNodeByCode?.id : null;
      if (!id) return { ok: false, code: key || null, reason: 'not_found' };
      const errors = (await gql('discountCodeDeactivate', CODE_DEACTIVATE, { id })).discountCodeDeactivate?.userErrors || [];
      return errors.length ? { ok: false, code: key, id, reason: 'user_errors', userErrors: errors } : { ok: true, code: key, id };
    },

    // Writes the promises that checkout could not show onto the order: a note
    // line, tags and a metafield, plus a code for a later-order credit. Safe to
    // call again for the same order: the metafield remembers what was done.
    async annotateOrder(orderGid, terms) {
      const t = readTerms(terms);
      const id = /^gid:\/\//.test(String(orderGid)) ? String(orderGid) : `gid://shopify/Order/${tail(orderGid)}`;
      if (!t.deferred.length) return { ok: true, order_id: id, already: false, terms: [], codes: [], warnings: ['Nothing was deferred for this order.'] };
      let order = (await gql('order', ORDER_READ, { id })).order;
      if (!order) return { ok: false, order_id: id, reason: 'order_not_found' };

      // The metafield is the authoritative ledger. Compare-and-set preserves
      // simultaneous offers; invalid existing data is never silently erased.
      // https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsSet
      const entriesOf = order => {
        if (!order.metafield) return [];
        if (typeof order.metafield.compareDigest !== 'string') throw new SettleError('The order terms could not be read safely.', { reason: 'invalid_order_terms' });
        let entries;
        try { entries = JSON.parse(order.metafield.value); } catch { /* refused below */ }
        if (!Array.isArray(entries) || entries.some(e => !e || typeof e !== 'object' || Array.isArray(e))) throw new SettleError('The existing order terms could not be read safely.', { reason: 'invalid_order_terms' });
        return entries;
      };
      const same = entry => entry.code === t.code && entry.offer_id === t.offer_id;
      const warnings = [];
      let entries = entriesOf(order);
      const prior = entries.find(same);
      let codes = prior?.next_order || [];
      let entry = prior;
      if (!prior) {
        const at = now();
        const credits = creditsOf(t.deferred, warnings);
        const until = d => iso(at + (d.valid_days || 90) * DAY);
        const made = await createAll(credits.map(d => ({
          identity: `${id}:${t.offer_id || t.code || 'terms'}:${d.type}:${d.amount}`, kind: d.type, label: d.label, operation: 'discountCodeBasicCreate', query: BASIC_CREATE, variable: 'basicCodeDiscount',
          input: {
            ...limits(at, until(d)),
            customerGets: amountOff(d.amount, { all: true }),
            combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: false },
          },
        })));
        codes = made.map((m, i) => ({ code: m.code, id: m.id, type: credits[i].type, amount: credits[i].amount, currency: t.currency, expires_at: m.expires_at || until(credits[i]) }));
        entry = { code: t.code, offer_id: t.offer_id, terms: t.deferred, next_order: codes, annotated_at: iso(at) };
      }
      let saved = !!prior;
      for (let attempt = 0; !saved && attempt < 5; attempt++) {
        entries = entriesOf(order);
        const held = entries.find(same);
        if (held) { codes = held.next_order || []; saved = true; break; }
        const errors = (await gql('metafieldsSet', METAFIELDS_SET, { metafields: [{
          ownerId: id, namespace: '$app', key: 'offer_terms', type: 'json',
          value: JSON.stringify([...entries, entry]), compareDigest: order.metafield?.compareDigest ?? null,
        }] })).metafieldsSet?.userErrors || [];
        if (!errors.length) { saved = true; break; }
        if (errors.some(e => !['STALE_OBJECT', 'INVALID_COMPARE_DIGEST'].includes(e.code))) throw refused('metafieldsSet', errors);
        order = (await gql('order', ORDER_READ, { id })).order;
        if (!order) return { ok: false, order_id: id, reason: 'order_not_found' };
      }
      if (!saved) throw new SettleError('Concurrent order updates prevented the terms from being recorded; retry the same delivery.', { reason: 'annotation_conflict' });

      // Shopify has no compare-and-set for an order note. Never replace a
      // buyer's note from a stale snapshot; all promises live in the ledger.
      const tags = [...new Set(['offerad', ...t.deferred.filter(d => DEFERRED.includes(d.type)).map(d => `offerad-${d.type.replace(/_/g, '-')}`)])];
      if (tags.some(tag => !(order.tags || []).includes(tag))) {
        const errors = (await gql('tagsAdd', TAGS_ADD, { id, tags })).tagsAdd?.userErrors || [];
        if (errors.length) throw refused('tagsAdd', errors);
      }
      warnings.push('The full terms are recorded in the order metafield and tags; the buyer’s order note is preserved.');

      return { ok: true, order_id: id, already: !!prior, note: order.note || '', tags: [...new Set([...(order.tags || []), ...tags])], terms: t.deferred, codes, warnings };
    },
  };
}

// For a caller that holds connection details rather than an adapter.
export const annotateOrder = (orderGid, terms, connection) => shopifyAdapter(connection).annotateOrder(orderGid, terms);
