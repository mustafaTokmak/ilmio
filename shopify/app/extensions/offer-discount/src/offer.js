// The offer behind a discount code, read the same way by both targets.
// The service mints one code per accepted offer and puts the offer on the
// discount as a JSON metafield ($app:offer): the public offer from policy.js
// plus the variant it was made for.
//
//   { variant_id, quantity, currency, items_total, expires_at, code,
//     components: [{ type, label, amount_off, variant_id }], express_pattern }
//
// Only variant_id and components are required. Components that money cannot
// express at checkout (extended_returns, delivery_guarantee, next_order_credit)
// ride along and are ignored here: the service settles them after the order.

// Rate names differ per shop, so the offer may carry its own express_pattern.
const EXPRESS = /express|expedited|overnight|next[ -]?day|same[ -]?day/i;
const DAY_MS = 86400000;
const LABEL_MAX = 100;

const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);

// Money as whole cents. Shopify sends decimals as strings ("19.9").
export function cents(x) {
  const n = typeof x === 'number' ? x : typeof x === 'string' && x.trim() ? Number(x) : NaN;
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

// Decimals go back to Shopify as strings.
export const decimal = c => (c / 100).toFixed(2);

// "gid://shopify/ProductVariant/123" and 123 name the same variant. Nothing else is one.
export const numericId = x => (String(x ?? '').match(/^(?:gid:\/\/shopify\/ProductVariant\/)?(\d+)$/) || [])[1] || null;

const label = (c, fallback) => (typeof c.label === 'string' && c.label.trim() ? c.label.trim().slice(0, LABEL_MAX) : fallback);

// A Function has no clock, only the shop's local date, so this is a backstop
// with a day of slack for time zones: the exact expiry is the discount's own
// endsAt. An expiry that cannot be read counts as expired.
function expired(expiresAt, today) {
  if (expiresAt == null) return false;
  let ms = typeof expiresAt === 'number' ? expiresAt : Date.parse(expiresAt);
  if (ms < 1e11) ms *= 1000; // epoch seconds
  if (!Number.isFinite(ms) || Math.abs(ms) > 8e15) return true;
  return typeof today === 'string' && today > new Date(ms + DAY_MS).toISOString().slice(0, 10);
}

// Null when there is nothing safe to apply: no code, no config, a config that
// does not parse or validate, or an offer that has run out.
export function readOffer(input) {
  // An offer belongs to its code. No code means the discount was set up as an
  // automatic one, and an offer must never apply by itself.
  const code = input?.triggeringDiscountCode;
  if (!code) return null;

  let cfg = input?.discount?.metafield?.jsonValue;
  if (typeof cfg === 'string') {
    try { cfg = JSON.parse(cfg); } catch { return null; }
  }
  if (!isObject(cfg)) return null;
  // Also accepted: the offer nested under "offer", the variant beside it.
  if (isObject(cfg.offer)) cfg = { ...cfg.offer, ...cfg };
  if (!Array.isArray(cfg.components)) return null;
  if (cfg.code != null && String(cfg.code).toUpperCase() !== String(code).toUpperCase()) return null;

  const variant = numericId(cfg.variant_id ?? cfg.product?.variant_id ?? cfg.variant_numeric_id ?? cfg.product?.variant_numeric_id);
  const quantity = cfg.quantity ?? 1;
  if (!variant || !Number.isInteger(quantity) || quantity < 1) return null;
  if (expired(cfg.expires_at, input?.shop?.localTime?.date)) return null;

  const offer = { variant, quantity, currency: cfg.currency ?? null, itemsTotal: null, priceOff: 0, priceLabel: '', gifts: [], freeShipping: null, express: null, expressPattern: EXPRESS };
  const priceLabels = [];
  // A known component that does not validate voids the whole offer: half an
  // offer is not what either side agreed to.
  for (const c of cfg.components) {
    if (!isObject(c)) return null;
    if (c.type === 'price') {
      const off = cents(c.amount_off);
      if (!(off > 0)) return null;
      offer.priceOff += off;
      priceLabels.push(label(c, ''));
    } else if (c.type === 'gift') {
      const gift = numericId(c.variant_id);
      if (!gift) return null;
      if (!offer.gifts.some(g => g.variant === gift)) offer.gifts.push({ variant: gift, label: label(c, 'Free add-on') });
    } else if (c.type === 'free_shipping') {
      offer.freeShipping = { label: label(c, 'Free standard shipping') };
    } else if (c.type === 'express_upgrade') {
      offer.express = { label: label(c, 'Express delivery at the standard rate') };
    }
  }
  offer.priceLabel = (priceLabels.filter(Boolean).join(' + ') || 'Offer price').slice(0, LABEL_MAX);

  if (cfg.items_total != null) {
    offer.itemsTotal = cents(cfg.items_total);
    if (!(offer.itemsTotal >= 0)) return null;
  }
  if (cfg.express_pattern != null) {
    if (typeof cfg.express_pattern !== 'string' || !cfg.express_pattern.trim()) return null;
    try { offer.expressPattern = new RegExp(cfg.express_pattern, 'i'); } catch { return null; }
  }
  return offer;
}

// The lines that hold the product the offer was made for, and how many units
// of each the offer covers. Null when the cart holds fewer units than the
// offer was priced for: then nothing of the offer applies.
export function entitled(offer, lines) {
  let left = offer.quantity;
  const picks = [];
  for (const line of lines ?? []) {
    if (left <= 0) break;
    if (numericId(line.merchandise?.id) !== offer.variant || !(line.quantity > 0)) continue;
    const quantity = Math.min(left, line.quantity);
    picks.push({ line, quantity });
    left -= quantity;
  }
  return left > 0 ? null : picks;
}
