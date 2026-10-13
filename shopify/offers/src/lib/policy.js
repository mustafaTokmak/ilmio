// Offer policy: what a seller's agent may give a buyer's agent, decided in code.
// Same inputs, same offers. Nothing here is random and no model picks a number,
// so asking again cannot walk the price down toward the floor: the only things
// that change an offer are the buyer's stated priority, the quantity, the
// need-by date and a competing offer the seller has verified itself.

export const PRIORITIES = {
  lowest_price: 'Lowest total price',
  fast_delivery: 'Faster delivery',
  easy_returns: 'Easier returns and less risk',
  extras: 'Extras in the box',
  repeat_purchase: 'Value on a later order',
};

// Share of the room between list and floor the seller gives without proof.
// A verified competing offer unlocks all of it.
export const PACE_SHARE = { none: 0.5, balanced: 0.75, asap: 1 };

// Which concessions each priority reaches for, in order.
const ORDER = {
  lowest_price: ['bulk', 'price', 'free_shipping'],
  fast_delivery: ['express_upgrade', 'delivery_guarantee', 'free_shipping'],
  easy_returns: ['extended_returns', 'delivery_guarantee', 'free_shipping'],
  extras: ['gift', 'bulk', 'free_shipping'],
  repeat_purchase: ['next_order_credit', 'free_shipping'],
};
// Value instead of price: used as the alternative, and when a price cannot be matched.
const VALUE_KEYS = ['express_upgrade', 'gift', 'next_order_credit', 'free_shipping', 'extended_returns', 'delivery_guarantee'];
const VALUE_MAX = 4;

export const r2 = x => Math.round(x * 100) / 100;
const money = (x, cur) => `${cur === 'GBP' ? '£' : cur === 'EUR' ? '€' : '$'}${Number.isInteger(x) ? x : x.toFixed(2)}`;
const on = (m, key) => !!m.concessions?.[key]?.on;

// The lowest unit price the seller may agree to: never below cost unless the floor says so.
export function unitFloor(m) {
  return m.below_cost_reason || m.unit_cost == null ? m.floor : Math.max(m.floor, m.unit_cost);
}

// What one order may cost the seller in concessions.
export function roomFor(m, qty) {
  const byFloor = Math.max(0, m.product.list - unitFloor(m)) * qty;
  return r2(Math.min(byFloor, m.budget_per_order ?? Infinity));
}

function bulkPct(m, qty) {
  if (!on(m, 'bulk')) return 0;
  return (m.concessions.bulk.tiers || []).filter(t => qty >= t.qty).reduce((best, t) => Math.max(best, t.pct), 0);
}

// One concession as a component, or null when it does not apply or does not fit
// what is left of the budget. `st` carries the running state of the offer.
function build(key, m, req, st) {
  const c = m.concessions?.[key];
  const cur = m.product.currency;
  const { standard, express } = m.shipping;
  if (key !== 'price' && !on(m, key)) return null;
  const fits = cost => cost <= st.left + 1e-9;
  switch (key) {
    case 'bulk': {
      const pct = bulkPct(m, req.qty);
      if (!pct) return null;
      const off = Math.min(r2(m.product.list * req.qty * pct / 100), st.price_left, st.left);
      if (off <= 0) return null;
      return { type: 'price', source: 'bulk', label: `${pct}% off for ${req.qty} or more`, amount_off: r2(off), buyer_value: r2(off), seller_cost: r2(off) };
    }
    case 'price': {
      if (!on(m, 'price') && !st.matching) return null;
      const cap = st.price_cap ?? (c?.max_off != null ? c.max_off * req.qty : Infinity);
      let off = Math.min(st.want_off ?? Infinity, cap, st.price_left, st.left);
      if (st.want_off == null && off >= 1) off = Math.floor(off);
      if (off <= 0) return null;
      return { type: 'price', source: st.matching ? 'price_match' : 'sponsored_discount', label: `${money(r2(off), cur)} off`, amount_off: r2(off), buyer_value: r2(off), seller_cost: r2(off) };
    }
    case 'free_shipping': {
      if (st.has.free_shipping || !(standard.price > 0)) return null;
      const cost = standard.cost ?? standard.price;
      if (!fits(cost)) return null;
      return { type: 'free_shipping', label: 'Free standard shipping', buyer_value: standard.price, seller_cost: r2(cost) };
    }
    case 'express_upgrade': {
      if (!express || express.days >= standard.days) return null;
      if (req.need_by_days != null && express.days > req.need_by_days) return null;
      const cost = (express.cost ?? express.price) - (standard.cost ?? standard.price);
      if (!fits(cost)) return null;
      return { type: 'express_upgrade', label: `Express ${express.days}-day delivery at the standard rate`, ship_days: express.days, buyer_value: r2(express.price - standard.price), seller_cost: r2(cost) };
    }
    case 'gift':
      if (!fits(c.cost)) return null;
      return { type: 'gift', label: `Free add-on: ${c.title}`, variant_id: c.variant_id, buyer_value: c.value, seller_cost: c.cost };
    case 'extended_returns':
      if (!fits(c.cost)) return null;
      return { type: 'extended_returns', label: `${c.days}-day returns (standard is ${c.base_days})`, days: c.days, buyer_value: 0, seller_cost: c.cost };
    case 'delivery_guarantee':
      if (!fits(c.cost)) return null;
      return { type: 'delivery_guarantee', label: `On-time guarantee: ${money(c.credit, cur)} credit if it arrives late`, credit: c.credit, buyer_value: 0, seller_cost: c.cost };
    case 'next_order_credit':
      if (!fits(c.cost)) return null;
      return { type: 'next_order_credit', label: `${money(c.amount, cur)} credit on your next order`, amount: c.amount, valid_days: c.valid_days ?? 90, buyer_value: c.amount, seller_cost: c.cost };
  }
  return null;
}

// The value concessions that apply, most buyer value per unit of seller cost first.
function valueOrder(m, req) {
  const st = { left: Infinity, price_left: 0, has: {} };
  return VALUE_KEYS.map(key => ({ key, c: build(key, m, req, st) })).filter(x => x.c)
    .sort((a, b) => b.c.buyer_value / Math.max(0.01, b.c.seller_cost) - a.c.buyer_value / Math.max(0.01, a.c.seller_cost))
    .map(x => x.key);
}

function assemble(m, req, keys, budget, extra = {}) {
  const priceRoom = r2(Math.max(0, m.product.list - unitFloor(m)) * req.qty);
  const { max = Infinity, ...rest } = extra;
  const st = { left: budget, price_left: priceRoom, has: {}, ...rest };
  const components = [];
  for (const key of keys) {
    if (components.length >= max) break;
    const comp = build(key, m, req, st);
    if (!comp) continue;
    components.push(comp);
    st.left = r2(st.left - comp.seller_cost);
    st.has[comp.type] = true;
    if (comp.type === 'price') st.price_left = r2(st.price_left - comp.amount_off);
  }
  return components.length ? finish(m, req, components) : null;
}

// Totals a buyer can check against the cart. Express upgrade means the buyer
// pays the standard rate; free shipping takes that to zero.
function finish(m, req, components) {
  const { list, currency } = m.product;
  const has = t => components.some(c => c.type === t);
  const priceOff = r2(components.filter(c => c.type === 'price').reduce((a, c) => a + c.amount_off, 0));
  const ship = has('free_shipping') ? 0 : m.shipping.standard.price;
  const listTotal = r2(list * req.qty + m.shipping.standard.price);
  const total = r2(list * req.qty - priceOff + ship);
  const express = components.find(c => c.type === 'express_upgrade');
  const extras = r2(components.filter(c => !['price', 'free_shipping'].includes(c.type)).reduce((a, c) => a + c.buyer_value, 0));
  return {
    headline: components.map(c => c.label).join(' + '),
    components,
    quantity: req.qty,
    currency,
    unit_price: r2(list - priceOff / req.qty),
    items_total: r2(list * req.qty - priceOff),
    shipping_total: ship,
    total,
    list_total: listTotal,
    you_save: r2(listTotal - total),
    extras_value: extras,
    ship_days: express ? express.ship_days : m.shipping.standard.days,
    seller_cost: r2(components.reduce((a, c) => a + c.seller_cost, 0)),
  };
}

const sameMix = (a, b) => a && b && a.headline === b.headline;

// The offers for one request. `evidence` is the verifier's result for a
// competing offer, or null. Returns everything the service needs; the service
// strips seller-only fields with publicOffer() before anything leaves.
export function decide(m, request, evidence = null) {
  const qty = Math.max(1, Math.round(Number(request.quantity) || 1));
  const priority = PRIORITIES[request.priority] ? request.priority : null;
  const req = { qty, priority, need_by_days: request.need_by_days ?? null };
  const notes = [];
  if (m.stock != null && qty > m.stock) return { status: 'unavailable', offers: [], notes: [`Only ${m.stock} in stock.`], question: null };

  const room = roomFor(m, qty);
  const share = PACE_SHARE[m.pace] ?? PACE_SHARE.balanced;
  const proofOk = evidence?.ok === true && !!m.price_match?.on;
  // Proof from a shop the seller trusts, for a product matched by identifier,
  // unlocks all of the room, and only when their price really is lower.
  const strong = proofOk && evidence.trusted_domain === true && evidence.match_by !== 'title';
  const budget = strong && gapTo(m, req, evidence).gap > 0 ? room : r2(room * share);
  const valueKeys = valueOrder(m, req);
  const offers = [];
  let status = 'offer';
  let match = null;

  if (evidence && !evidence.ok) notes.push(`Competing offer not accepted: ${evidence.reason_text || evidence.reason}.`);
  if (evidence?.ok && !m.price_match?.on) notes.push('This store does not match prices, so the link was not used.');

  if (proofOk) {
    match = matchPlan(m, req, evidence, budget);
    notes.push(match.note);
    if (match.offer) { offers.push({ ...match.offer, kind: match.kind }); status = match.kind; }
    // A different kind of offer for the same proof: value instead of a lower price.
    if (match.gap > 0) {
      const value = assemble(m, req, valueKeys, budget, { max: VALUE_MAX });
      if (value && !offers.some(o => sameMix(o, value))) offers.push({ ...value, kind: 'value_instead_of_price' });
    }
  }

  if (!offers.length || !proofOk) {
    const first = assemble(m, req, ORDER[priority || 'lowest_price'], budget);
    if (first && !offers.some(o => sameMix(o, first))) offers.push({ ...first, kind: priority ? 'for_your_priority' : 'default' });
    const priceFirst = priority === 'lowest_price' || !priority;
    const alt = assemble(m, req, priceFirst ? valueKeys : ORDER.lowest_price, budget, priceFirst ? { max: VALUE_MAX } : {});
    if (alt && !offers.some(o => sameMix(o, alt))) offers.push({ ...alt, kind: 'alternative' });
  }

  if (req.need_by_days != null) {
    const fastest = Math.min(...offers.map(o => o.ship_days), m.shipping.standard.days);
    if (fastest > req.need_by_days) notes.push(`Fastest delivery is ${fastest} days, later than the ${req.need_by_days} days asked for.`);
  }
  if (!offers.length) status = 'no_offer';

  return {
    status,
    offers: offers.slice(0, 3),
    notes,
    match: match && { kind: match.kind, gap: match.gap, their_total: match.their_total, shipping_compared: match.shipping_compared },
    question: priority ? null : {
      text: 'What matters most to your user for this purchase? Answer with one priority to get an offer built for it.',
      options: Object.entries(PRIORITIES).map(([id, label]) => ({ id, label })),
    },
  };
}

// Our total against theirs. Delivered prices when their shipping is known, item prices otherwise.
function gapTo(m, req, ev) {
  const shippingCompared = ev.shipping != null;
  const ours = r2(m.product.list * req.qty + (shippingCompared ? m.shipping.standard.price : 0));
  const theirs = r2(ev.price * req.qty + (shippingCompared ? ev.shipping : 0));
  return { ours, theirs, gap: r2(ours - theirs), shippingCompared };
}

// Close the gap to a verified competing offer, cheapest way for the seller first.
function matchPlan(m, req, ev, budget) {
  const cur = m.product.currency;
  const { standard } = m.shipping;
  const { ours, theirs, gap, shippingCompared } = gapTo(m, req, ev);
  const base = { gap, their_total: theirs, shipping_compared: shippingCompared };
  if (gap <= 0) return { ...base, kind: 'already_lower', offer: null, note: `Checked ${ev.domain}: their ${shippingCompared ? 'delivered ' : ''}price is ${money(theirs, cur)}, ours is ${money(ours, cur)}. Ours is already lower or equal.` };

  const pm = m.price_match;
  const want = r2(gap + (pm.beat_by || 0));
  // An unlisted shop can move the price only a little; an unverified product identity even less.
  const capPct = ev.trusted_domain ? 100 : (pm.untrusted_cap_pct ?? 10);
  const idCap = ev.match_by === 'title' ? (pm.title_match_cap_pct ?? 10) : 100;
  const priceCap = r2(m.product.list * req.qty * Math.min(capPct, idCap) / 100);

  const comps = [];
  const st = { left: budget, price_left: r2(Math.max(0, m.product.list - unitFloor(m)) * req.qty), has: {}, matching: true, price_cap: priceCap };
  let closed = 0;
  // Free shipping closes part of a delivered-price gap for the courier cost only.
  if (shippingCompared && gap >= standard.price) {
    const fs = build('free_shipping', m, req, st);
    if (fs) { comps.push(fs); st.left = r2(st.left - fs.seller_cost); st.has.free_shipping = true; closed = fs.buyer_value; }
  }
  if (want - closed > 0) {
    st.want_off = r2(want - closed);
    const p = build('price', m, req, st);
    if (p) { comps.push(p); st.left = r2(st.left - p.seller_cost); st.price_left = r2(st.price_left - p.amount_off); closed = r2(closed + p.amount_off); }
  }
  const full = closed + 1e-9 >= gap;
  if (!full) {
    // Could not reach their price: add a little value with what is left.
    let extras = 0;
    for (const key of valueOrder(m, req)) {
      if (extras >= 2) break;
      const c = build(key, m, req, st);
      if (!c) continue;
      comps.push(c); st.left = r2(st.left - c.seller_cost); st.has[c.type] = true; extras++;
    }
  }
  if (!comps.length) return { ...base, kind: 'cannot_match', offer: null, note: `Checked ${ev.domain} at ${money(theirs, cur)}. We cannot move on this one.` };
  const offer = finish(m, req, comps);
  const kind = full ? (closed > gap ? 'price_beaten' : 'price_matched') : 'cannot_match_best_effort';
  const how = shippingCompared ? 'delivered price' : 'item price (their shipping was not shown)';
  const note = full
    ? `Checked ${ev.domain}: their ${how} is ${money(theirs, cur)}. ${kind === 'price_beaten' ? 'We beat it' : 'We match it'}.`
    : `Checked ${ev.domain}: their ${how} is ${money(theirs, cur)}. We cannot go that low; this is our best, with extras instead.`;
  return { ...base, kind, offer, note };
}

// Re-check an offer against the mandate before a code is minted. Stored offers
// are data, and data is not trusted with money.
export function checkOffer(m, offer) {
  const problems = [];
  const qty = offer.quantity;
  const priceOff = offer.components.filter(c => c.type === 'price').reduce((a, c) => a + c.amount_off, 0);
  if (m.product.list - priceOff / qty < unitFloor(m) - 1e-9) problems.push('unit price below floor');
  const cost = r2(offer.components.reduce((a, c) => a + c.seller_cost, 0));
  if (cost > roomFor(m, qty) + 1e-9) problems.push('concessions over budget');
  for (const c of offer.components) {
    const key = c.type === 'price' ? (c.source === 'bulk' ? 'bulk' : c.source === 'price_match' ? null : 'price') : c.type;
    if (key && !on(m, key)) problems.push(`${c.type} not approved`);
    if (c.source === 'price_match' && !m.price_match?.on) problems.push('price match not approved');
  }
  if (m.stock != null && qty > m.stock) problems.push('over stock');
  return problems;
}

// What the buyer's agent may see: no costs, no floor, no room.
export function publicOffer(o) {
  const { seller_cost, components, ...rest } = o;
  return { ...rest, components: components.map(({ seller_cost: _c, source: _s, ...c }) => c) };
}
