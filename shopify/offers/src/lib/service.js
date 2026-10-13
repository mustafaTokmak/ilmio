// The offer desk: the four operations every door calls. A door (MCP, HTTP, a
// page, the storefront script) only translates; what a buyer's agent may ask,
// what it is told and what it never sees is settled here.
//
// Replies are read by AI agents acting for shoppers, so they say plainly what
// happened and what each next step does. Offers are stored with their
// seller-only fields; a reply carries publicOffer() output and nothing else
// from a stored record. The same request gets the same offers: the policy has
// no randomness, and a link the store has checked is remembered for the hour
// instead of being fetched again.

import { decide, checkOffer, publicOffer, PRIORITIES } from './policy.js';
import { mandateFor, shopConfig } from './mandates.js';

export const DEFAULT_LIMITS = {
  requests_per_product: 3, // per session, per window
  link_checks_per_product: 1, // per session, per window
  requests_per_ip: 20, // per window
  window_minutes: 60,
  offer_ttl_minutes: 30,
  code_ttl_minutes: 60,
};

// Loaded on first use, so a script that injects its own verifier never needs the real one.
const realVerify = async (...args) => (await import('./verify.js')).verifyCompetingOffer(...args);

// Parts of an offer that checkout cannot show as money: the store owes them
// once the order exists. `what` names the part, `how` says what brings it to the order.
const AFTER_PURCHASE = {
  extended_returns: { what: c => c.label, how: them => `The store records this on the order when it is placed with ${them}.` },
  delivery_guarantee: { what: c => c.label, how: them => `The store records this on the order when it is placed with ${them}, and owes the credit if delivery is late.` },
  next_order_credit: { what: c => `${c.label}, valid ${c.valid_days} days`, how: them => `The store creates it after this order is placed with ${them}.` },
};
// Outcomes where no page was read. They do not use up the hourly link check.
const NOT_CHECKED = new Set(['bad_url', 'blocked_domain', 'own_store', 'fetch_failed']);
// How long one accept call owns the minting of an offer's code before another may try.
const CLAIM_SECONDS = 120;
const OFFER_ID = /^of_[0-9a-f]{20}$/;

const WHAT = {
  price: 'A lower price.',
  free_shipping: 'Free standard shipping.',
  express_upgrade: 'Express delivery at the standard shipping rate.',
  gift: 'A free add-on with the order.',
  extended_returns: 'A longer return window.',
  delivery_guarantee: 'An on-time delivery guarantee, with credit if the order arrives late.',
  next_order_credit: 'Credit toward the next order.',
};

const iso = ms => new Date(ms).toISOString();
const text = (x, max) => String(x ?? '').trim().slice(0, max);
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const hostOf = url => { try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; } };
const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
// A short stand-in for a session id: enough to tell shoppers apart in the log without keeping who they are.
const tag = s => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
};

const productView = (m, config) => ({
  title: m.product.title,
  brand: m.product.brand,
  handle: m.product.handle,
  variant_id: m.product.variant_id,
  ...(config.storefront ? { url: `${config.storefront}/products/${m.product.handle}` } : {}),
});

// What a buyer's agent sees of one offer: publicOffer() output, read in a useful order.
const offerView = (id, offer, expires_at) => {
  const { kind, headline, components, ...totals } = publicOffer(offer);
  return { offer_id: id, kind, headline, components, ...totals, expires_at };
};

// The kinds of concession the policy would really put in an offer for this
// product, found by asking it. A kind that is switched on but never fits what
// the merchant allows for this product is not listed, and no amount is.
function kindsFor(m) {
  const seen = new Set();
  const tiers = (m.concessions?.bulk?.on && m.concessions.bulk.tiers) || [];
  for (const quantity of [1, ...tiers.map(t => t.qty)]) {
    for (const priority of [undefined, ...Object.keys(PRIORITIES)]) {
      for (const o of decide(m, { quantity, priority }).offers) {
        for (const c of o.components) seen.add(c.source === 'bulk' ? 'bulk' : c.type);
      }
    }
  }
  const kinds = [];
  for (const type of Object.keys(WHAT)) {
    if (seen.has(type)) kinds.push({ type, what: WHAT[type] });
    if (type === 'price' && seen.has('bulk')) kinds.push({ type, what: 'A lower price per item when buying several.' });
  }
  return kinds;
}

const notEnrolled = store => ({
  status: 'store_not_enrolled',
  store: store ?? null,
  message: 'This store does not use OfferAd, so there is no offer desk to ask here. Nothing was sent to the store; its listed price and terms are what apply.',
});

const noProduct = asked => ({
  status: 'product_not_found',
  asked_for: text(asked, 120) || null,
  reason: 'No product of this store matched what was sent.',
  next: 'Send the product page URL, its handle, a Shopify product or variant id, or its name as the store writes it.',
});

export function createService({ store, adapterFor, verify = realVerify, now = () => Date.now(), limits } = {}) {
  const lim = { ...DEFAULT_LIMITS, ...limits };
  const windowSeconds = lim.window_minutes * 60;
  const span = lim.window_minutes === 60 ? 'hour' : `${lim.window_minutes} minutes`;

  // The log is for the merchant's eyes but is shown on a public demo page, so
  // it never holds a seller-only number, a code, a full offer id or a session id.
  const log = event => Promise.resolve().then(() => store.log(event)).catch(() => {});

  function caller(input) {
    const client = input.client;
    const address = text(input.ip ?? client?.ip, 64) || null;
    const who = text(input.session, 200) || (address ? `ip:${address}` : 'anon');
    const name = text(typeof client === 'string' ? client : client?.name ?? client?.door, 80) || null;
    return { who, address, name, mark: tag(who) };
  }

  function find(input) {
    const shop = text(input.shop, 200).toLowerCase();
    const config = shopConfig(shop);
    if (!config) return { miss: notEnrolled(input.shop) };
    const m = mandateFor(shop, input.product);
    if (!m) return { miss: noProduct(input.product) };
    return { shop, config, m };
  }

  async function options(input = {}) {
    const { miss, shop, config, m } = find(input);
    if (miss) return miss;
    const c = caller(input);
    const pm = m.price_match;
    await log({ type: 'options', shop, product: m.product.handle, who: c.mark, client: c.name });
    return {
      status: 'ok',
      store: config.name,
      product: productView(m, config),
      currency: m.product.currency,
      list_price: m.product.list,
      standard_delivery: { days: m.shipping.standard.days, price: m.shipping.standard.price },
      can_offer: kindsFor(m),
      priorities: Object.entries(PRIORITIES).map(([id, label]) => ({ id, label })),
      competing_offers: pm?.on ? {
        accepted: true,
        send: 'A link to another shop\'s public page for this same product, new and in stock, at a lower price (competing_offer_url).',
        checked: 'The store opens the page itself and compares product, condition, stock and price. Nothing said about the page is taken on trust.',
        shops_that_count_in_full: pm.trusted_domains || [],
        other_shops: pm.untrusted_cap_pct === 0 ? 'A lower price at any other shop does not move the price here.' : 'A lower price at any other shop counts for less.',
        shops_not_accepted: (pm.blocked_domains || []).map(d => d.replace(/\.$/, '')),
        what_happens: `A verified lower price is matched or beaten when the merchant's limits allow, and otherwise answered with the store's best offer and extras. The store checks ${count(lim.link_checks_per_product, 'link')} per product per ${span}.`,
      } : { accepted: false, what_happens: 'This store does not check competing offers, so a link sent with a request is not used.' },
      how_to_ask: `Send the product and, when known, one priority, the quantity, the days the user can wait (need_by_days) and a competing_offer_url. The reply holds one to three offers with exact totals. Asking is free, buys nothing and needs no personal data. Offers stay open ${lim.offer_ttl_minutes} minutes, and the store answers ${count(lim.requests_per_product, 'request')} per product per ${span}.`,
      next: 'An offer request for this product returns concrete offers. Naming what matters most to the user gets an offer built around it.',
    };
  }

  // Over a limit. `name` is the key in DEFAULT_LIMITS that was reached.
  async function slow(name, c, shop, handle) {
    const kept = 'Offers already given stay open until their expires_at and can still be accepted.';
    const again = `once that ${span} is over`;
    const said = {
      requests_per_ip: {
        reason: `This store answers ${count(lim.requests_per_ip, 'offer request')} per ${span} from one network address, and that many were already answered.`,
        next: `${kept} New requests are answered again ${again}.`,
      },
      requests_per_product: {
        reason: `This store answers ${count(lim.requests_per_product, 'offer request')} per product per ${span} for each shopper, and that many were already answered for this product.`,
        next: `${kept} New requests for this product are answered again ${again}.`,
      },
      link_checks_per_product: {
        reason: `This store checks ${count(lim.link_checks_per_product, 'competing-offer link')} per product per ${span} for each shopper, and it already did.`,
        next: `Ask again with a link that was already checked, or with no link. A different link is checked again ${again}.`,
      },
    }[name];
    await log({ type: 'request', status: 'slow_down', limit: name, shop, product: handle, who: c.mark, client: c.name });
    return { status: 'slow_down', reason: said.reason, limit: { name, max: lim[name], window_minutes: lim.window_minutes }, next: said.next };
  }

  // The seller fetches the page itself. Whatever comes back is checked again
  // before it can move a price: a verifier that breaks counts as a page that
  // could not be read, and a price that is not a positive number as no price.
  async function check(url, m, config, t) {
    let ev = null;
    try {
      const own = new Set([hostOf(config.storefront), hostOf(`https://${config.shop}`)].filter(h => h && h.includes('.')));
      ev = await verify(url, m.product, m.price_match, { now: t, shop: m.shop, ownHosts: [...own] });
    } catch (e) {
      console.error('offerad: the competing-offer check failed', e);
    }
    if (!ev || typeof ev !== 'object') return { ok: false, reason: 'fetch_failed', reason_text: 'the page could not be checked just now', url, domain: hostOf(url) };
    if (ev.ok !== true) return { ...ev, ok: false, reason: ev.reason || 'fetch_failed' };
    if (!(Number(ev.price) > 0)) return { ...ev, ok: false, reason: 'no_price_found', reason_text: 'no price could be read from the page' };
    const shipping = ev.shipping == null || !(Number(ev.shipping) >= 0) ? null : Number(ev.shipping);
    return { ...ev, reason: 'ok', price: Number(ev.price), shipping };
  }

  function proofView(url, evidence, d, m) {
    if (!url) return null;
    const none = { accepted: false, domain: evidence?.domain ?? hostOf(url), their_price: null, compared: null };
    if (!m.price_match?.on) return { ...none, reason: 'store_does_not_check_links' };
    if (!evidence.ok) return { ...none, reason: evidence.reason };
    return {
      accepted: true,
      domain: evidence.domain,
      their_price: evidence.price,
      their_shipping: evidence.shipping,
      compared: d.match.shipping_compared ? 'delivered price (item plus shipping)' : 'item price (their shipping was not shown)',
      result: d.match.kind,
      shop_counts_in_full: evidence.trusted_domain === true,
      product_matched_by: evidence.match_by ?? null,
    };
  }

  function nextFor(d) {
    if (d.status === 'unavailable') return 'Ask again with a quantity the store has in stock.';
    if (!d.offers.length) return 'The store has nothing to add for this request, so its listed price and terms apply. A different priority or quantity can change that.';
    const take = 'Accepting an offer by its offer_id, once the user has agreed to it, turns it into a discount code and buys nothing.';
    return d.question
      ? `The offers can be shown to the user as they are, or ask again with one priority from question.options for an offer built around it. ${take}`
      : `The offers can be shown to the user with their totals; any that are not accepted simply expire. ${take}`;
  }

  async function request(input = {}) {
    const { miss, shop, config, m } = find(input);
    if (miss) return miss;
    const c = caller(input);
    const handle = m.product.handle;
    const t = now();
    const notes = [];

    if (c.address && await store.bump(`ip:${c.address}`, windowSeconds) > lim.requests_per_ip) return slow('requests_per_ip', c, shop, handle);

    const asked = text(input.priority, 60).toLowerCase().replace(/[\s-]+/g, '_');
    const priority = PRIORITIES[asked] ? asked : null;
    if (asked && !priority) notes.push('The priority sent is not one this store knows, so it was left out.');
    const quantity = Math.max(1, Math.round(Number(input.quantity) || 1));
    const days = Number(input.need_by_days);
    const need_by_days = input.need_by_days != null && input.need_by_days !== '' && Number.isFinite(days) && days >= 0 ? days : null;
    const url = text(input.competing_offer_url, 2000) || null;
    const checks = !!url && !!m.price_match?.on;

    // A link checked earlier this hour is answered from memory: same link, same
    // evidence, same offers. A different link is refused here, before the
    // request is counted, so the refusal does not use up one of the requests.
    const key = `${shop}:${handle}:${c.who}`;
    let memo = null;
    let evidence = null;
    if (checks) {
      const kept = await store.getOffer(`proof:${key}`);
      memo = kept && Date.parse(kept.expires_at) > t ? kept : null;
      evidence = memo?.checks.find(x => x.url === url)?.evidence ?? null;
      if (!evidence && memo && memo.checks.length >= lim.link_checks_per_product) return slow('link_checks_per_product', c, shop, handle);
    }

    if (await store.bump(`req:${key}`, windowSeconds) > lim.requests_per_product) return slow('requests_per_product', c, shop, handle);

    if (checks && !evidence) {
      // The counter is what holds when two requests arrive together. Its key
      // moves on after an attempt that read no page, so that one can be retried.
      const round = memo?.round || 0;
      if (await store.bump(`link:${round}:${key}`, windowSeconds) > lim.link_checks_per_product) return slow('link_checks_per_product', c, shop, handle);
      evidence = await check(url, m, config, t);
      const counted = !NOT_CHECKED.has(evidence.reason);
      await store.putOffer({
        id: `proof:${key}`,
        type: 'proof',
        checks: counted ? [...(memo?.checks || []), { url, evidence }] : memo?.checks || [],
        round: counted ? round : round + 1,
        expires_at: memo?.expires_at || iso(t + windowSeconds * 1000),
      });
    }
    if (url && !checks) notes.push('This store does not check competing offers, so the link was not used.');

    const d = decide(m, { quantity, priority, need_by_days }, evidence);
    if (evidence && !evidence.ok) notes.push(NOT_CHECKED.has(evidence.reason)
      ? `No page was read, so this did not count as the link check for this ${span}.`
      : `That was the link check for this product for this ${span}.`);
    // Say why a verified lower price moved this store's price less than the gap.
    if (evidence?.ok && d.match?.gap > 0 && !['price_matched', 'price_beaten'].includes(d.match.kind)) {
      if (evidence.trusted_domain !== true) notes.push(`${evidence.domain} is not on this store's list of shops whose prices count in full, so the link counted for less.`);
      if (evidence.match_by === 'title') notes.push('The product was recognised by its name, not by a product code, so the link counted for less.');
    }

    const product = productView(m, config);
    const expires_at = iso(t + lim.offer_ttl_minutes * 60000);
    const made = d.offers.map(offer => ({ id: `of_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`, offer }));
    await Promise.all(made.map(({ id, offer }) => store.putOffer({
      id,
      type: 'offer',
      status: 'open',
      shop,
      product,
      offer,
      asked: { quantity, priority, need_by_days, competing_offer_url: url, note: text(input.note, 500) || null },
      evidence,
      session: c.who,
      client: c.name,
      created_at: iso(t),
      expires_at,
    })));

    await log({
      type: 'request', status: d.status, shop, product: handle, quantity, priority, need_by_days,
      link: url ? hostOf(url) : null,
      proof: !url ? null : !checks ? 'not_checked' : evidence.ok ? 'accepted' : evidence.reason,
      offers: d.offers.map(o => ({ kind: o.kind, headline: o.headline, total: o.total })),
      who: c.mark, client: c.name,
    });
    return {
      status: d.status,
      product,
      list: m.product.list,
      currency: m.product.currency,
      question: d.question,
      offers: made.map(({ id, offer }) => offerView(id, offer, expires_at)),
      notes: [...d.notes, ...notes],
      proof: proofView(url, evidence, d, m),
      next: nextFor(d),
    };
  }

  // The reply for an accepted offer, built from the stored record, so accepting
  // again gives the same answer word for word. `state` is where its codes
  // stand, when the caller has looked that up.
  function accepted(rec, state = null) {
    if (rec.mode === 'draft') {
      const terms = publicOffer(rec.offer);
      const gift = terms.components.find(c => c.type === 'gift' && c.variant_id);
      const lines = [{ variant_id: rec.product.variant_id, quantity: rec.offer.quantity, title: rec.product.title }];
      if (gift) lines.push({ variant_id: gift.variant_id, quantity: 1, title: gift.label, free_with_invoice: true });
      const ordered = !!rec.order_id;
      return {
        status: 'accepted', offer_id: rec.id, settlement: 'draft', codes: [],
        invoice_url: rec.invoice_url, cart_url: rec.invoice_url, expires_at: null,
        apply: {
          link: 'Open invoice_url: it is the store’s checkout for this exact quote, with the item price, add-on and shipping already applied. No discount code is needed.',
          ucp: 'Use invoice_url for this quote. There is no code to send in discounts.codes; creating another cart or checkout does not preserve the invoice quote.',
          webmcp: 'Open invoice_url and review that checkout’s totals. There is no code to apply to another checkout.',
        },
        terms, cart_lines: lines,
        after_purchase: terms.components.filter(c => AFTER_PURCHASE[c.type]).map(c => `${AFTER_PURCHASE[c.type].what(c)}. The store records this on the order placed through this invoice.`),
        notes: ['Review the final invoice totals before paying. This invoice has no enforced timed expiry; expires_at is null.'],
        next: ordered ? 'This quote is linked to an order.' : 'Nothing is bought yet. Show the invoice checkout to the user for final review and payment, or walk away.',
      };
    }
    const codes = rec.codes;
    // An offer made only of what comes after the purchase changes nothing at
    // checkout, and an adapter with nothing to discount gives no code for it.
    const none = !codes.length;
    const many = codes.length > 1;
    const them = many ? 'the codes' : 'the code';
    const list = JSON.stringify(codes);
    const { kind, headline, components, ...totals } = publicOffer(rec.offer);
    // Parts the adapter said this store's checkout cannot apply. terms stays
    // the offer as the user agreed to it, and these are named as missing.
    const missing = components.filter(x => (rec.left_out || []).includes(x.type));
    const gift = components.find(x => x.type === 'gift' && x.variant_id && !missing.includes(x));
    const lines = [{ variant_id: rec.product.variant_id, quantity: rec.offer.quantity, title: rec.product.title }];
    if (gift) lines.push({ variant_id: gift.variant_id, quantity: 1, title: gift.label, free_with_code: true });

    const link = none
      ? `${rec.cart_url ? 'Open cart_url: it loads the items and leads to the store\'s own checkout.' : 'The user buys from the store as usual.'} There is no code to enter.`
      : rec.cart_url
        ? `Open cart_url: it loads the items with ${them} applied and leads to the store's own checkout. ${many ? 'The codes' : 'The code'} can also be typed into the discount field at checkout.`
        : `Type ${them} into the discount field at the store's checkout.`;
    // Shopify's storefront browser tools take no discount codes; its UCP cart and
    // checkout tools and the checkout page's update_checkout do. Its docs tell
    // agents to send a cart's codes again on the checkout made from it.
    // https://shopify.dev/docs/agents/carts-and-checkout/checkout-mcp
    // https://shopify.dev/docs/agents/carts-and-checkout/checkout-webmcp
    const apply = none ? {
      link,
      ucp: 'There is no code to send.',
      webmcp: 'There is no code to send.',
    } : rec.mode === 'dry' ? {
      link,
      ucp: `This store has no UCP cart or checkout tools. cart_url is the way to use ${them}.`,
      webmcp: `In a browser on the store's site, open cart_url: the cart shows ${them} applied.`,
    } : {
      link,
      ucp: `With the store's UCP tools, send ${list} as cart.discounts.codes in create_cart or update_cart, and again as checkout.discounts.codes in create_checkout or update_checkout. A checkout is not sure to inherit its cart's codes, and each call replaces the list${many ? ', so send all of them together' : ''}. discounts.applied in the reply shows what took effect.${gift ? ` The free add-on is not added by its code: put it in the cart as its own line (${gift.variant_id}, quantity 1).` : ''}`,
      webmcp: `In a browser on the store's site, the storefront cart tools take no discount codes: open cart_url, or on the checkout page call update_checkout with ${list} as checkout.discounts.codes and read discounts.applied.`,
    };

    const later = new Set([...Object.keys(AFTER_PURCHASE), ...(rec.deferred || [])]);
    // An order placed without a code does not show which offer it belongs to.
    const claim = `No code carries this to the order. The store has it on record under this offer id (${rec.id}): the user quotes that id with the order number to claim it.`;
    const after = components.filter(x => later.has(x.type) && !missing.includes(x)).map(x => {
      const part = AFTER_PURCHASE[x.type];
      return `${part ? part.what(x) : x.label}. ${none ? claim : part ? part.how(them) : `The store arranges this after the order is placed with ${them}.`}`;
    });
    // What an adapter warns about is written for the merchant and stays on the
    // record. The buyer is told what it means for them: which parts are missing.
    const notes = [];
    if (components.some(x => x.type === 'express_upgrade' && !missing.includes(x))) notes.push('The faster delivery applies when the express delivery option is chosen at checkout.');
    if (missing.length) notes.push(`This store's checkout cannot apply ${missing.length > 1 ? 'these parts' : 'this part'} of the offer, so ${missing.length > 1 ? 'they are' : 'it is'} not included: ${missing.map(x => `"${x.label}"`).join(', ')}. The user should hear this before paying; terms shows the offer as it was made.`);

    const over = Date.parse(rec.code_expires_at) <= now();
    const fresh = 'Asking for a new offer gets a fresh one.';
    let next;
    if (state === 'used') next = `${many ? 'These codes were' : 'This code was'} used on an order and ${many ? 'do' : 'does'} not work again.`;
    else if (state === 'revoked') next = `The store cancelled ${many ? 'these codes' : 'this code'}. ${fresh}`;
    else if (over) next = none ? `The time to order under this offer ended at ${rec.code_expires_at}. ${fresh}` : `${many ? 'These codes' : 'This code'} expired at ${rec.code_expires_at}. ${fresh}`;
    else {
      next = none
        ? `Nothing is bought yet: the user pays in the store's own checkout, or walks away. There is no code to apply; after_purchase says what the store owes once the order is placed and how the user claims it. This holds for an order placed by ${rec.code_expires_at}.`
        : `Nothing is bought yet: the user pays in the store's own checkout, or walks away and ${them} simply lapse${many ? '' : 's'}. ${many ? 'The codes work' : 'The code works'} for one order until ${rec.code_expires_at}; cart_url opens the cart with ${many ? 'them' : 'it'} applied, and apply lists the other ways.`;
      if (missing.length) next += ' Part of the offer is not included: see not_included.';
    }
    return {
      status: 'accepted',
      offer_id: rec.id,
      codes,
      ...(none ? { reason: missing.length
        ? 'This offer has no discount code: the part that would have changed what the checkout charges cannot be applied at this store.'
        : 'This offer has no discount code, because nothing in it changes what the checkout charges.' } : {}),
      cart_url: rec.cart_url,
      expires_at: rec.code_expires_at,
      apply,
      terms: { kind, headline, components, ...totals },
      ...(missing.length ? { not_included: missing.map(x => ({ type: x.type, label: x.label })) } : {}),
      cart_lines: lines,
      after_purchase: after,
      notes,
      next,
    };
  }

  // Where an accepted offer's codes stand. One spent code spends the offer.
  async function codeState(rec) {
    if (!rec.codes.length) return 'none';
    const held = await Promise.all(rec.codes.map(code => store.getCode(code)));
    if (held.some(h => h?.used === true)) return 'used';
    if (held.some(h => h?.revoked === true)) return 'revoked';
    return Date.parse(rec.code_expires_at) <= now() ? 'expired' : 'unused';
  }

  const notFound = () => ({
    status: 'not_found',
    reason: 'No offer with this offer_id exists at this store.',
    next: 'Use the offer_id of an offer from a recent request, or ask for a new offer.',
  });

  async function lookup(input, id) {
    const rec = OFFER_ID.test(id) ? await store.getOffer(id) : null;
    const shop = text(input.shop, 200).toLowerCase();
    return rec && rec.type === 'offer' && (!shop || rec.shop === shop) ? rec : null;
  }

  // Turn an approved offer into a code. A single-use code is money, so one
  // offer must never get two: the counter lets exactly one call mint, and a
  // call that arrives meanwhile waits for that result instead of minting again.
  async function issue(rec, m, config, event, adapter) {
    const attempt = rec.mint_attempts || 0;
    const failed = () => ({
      status: 'failed',
      error: 'The store could not confirm the checkout quote just now. Nothing was charged; a quote may already exist and the same offer can be retried.',
      next: 'Accepting the same offer again is safe and may work; the offer stays open until its expires_at.',
    });

    if (await store.bump(`mint:${attempt}:${rec.id}`, CLAIM_SECONDS) > 1) {
      for (let i = 0; i < 8; i++) {
        const cur = await store.getOffer(rec.id);
        if (cur?.status === 'accepted') return accepted(cur);
        if ((cur?.mint_attempts || 0) !== attempt) return failed();
        await pause(250);
      }
      return {
        status: 'in_progress',
        reason: 'An earlier accept call for this offer is still creating its code.',
        next: 'Accept again in a few seconds: the reply will carry that same code.',
      };
    }

    let minted = rec.mint_result;
    try {
      if (!minted) {
        const reconcile_only = adapter.mode === 'draft' && !!(rec.mint_intent || rec.mint_uncertain);
        await store.updateOffer(rec.id, { mint_intent: { mode: adapter.mode || null, started_at: iso(now()) } });
        minted = await adapter.mint(rec.offer, m, { offer_id: rec.id, ttl_minutes: lim.code_ttl_minutes, ...(reconcile_only ? { reconcile_only: true } : {}) });
      }
      if (minted?.undeliverable?.length) {
        await Promise.all((minted.codes || []).map(code => adapter.revoke(code)));
        return { status: 'not_deliverable', reason: 'The checkout could not apply the whole offer. No partial offer was accepted.', not_included: minted.undeliverable.map(x => ({ type: x.type, label: x.label })), next: 'Request another offer or ask the store to enable its composite Discount Function.' };
      }
      if (minted?.mode === 'draft') {
        let invoice;
        try { invoice = new URL(minted.invoice_url); } catch { /* refused below */ }
        if (!invoice || invoice.protocol !== 'https:' || invoice.hostname !== rec.shop || invoice.username || invoice.password || !/^gid:\/\/shopify\/DraftOrder\/\d+$/.test(minted.draft_order_id || '')) throw new Error('the adapter returned no valid Shopify invoice');
        if (!Array.isArray(minted.codes) || minted.codes.length) throw new Error('a draft invoice must not invent a discount code');
      } else if (!Array.isArray(minted?.codes) || !minted.codes.length || !minted.codes.every(x => typeof x === 'string' && x)) throw new Error('the adapter returned no code');
    } catch (e) {
      console.error(`offerad: no code could be minted for ${rec.id}`, e);
      // Moving the attempt number on frees the next call to try again at once.
      await store.updateOffer(rec.id, { mint_attempts: attempt + 1, ...(adapter.mode === 'draft' ? { mint_uncertain: true } : {}) });
      await log({ ...event, status: 'failed' });
      return failed();
    }

    const t = now();
    const until = Date.parse(minted.expires_at) || Number(minted.expires_at) || t + lim.code_ttl_minutes * 60000;
    const deferred = (minted.deferred || []).map(x => (typeof x === 'string' ? x : x?.type)).filter(Boolean);
    const patch = {
      status: 'accepted',
      accepted_at: iso(t),
      codes: minted.codes,
      cart_url: minted.cart_url || null,
      code_expires_at: minted.mode === 'draft' ? null : iso(until),
      ...(minted.mode === 'draft' ? { invoice_url: minted.invoice_url, draft_order_id: minted.draft_order_id } : {}),
      mode: minted.mode || config.settle || null,
      deferred,
      warnings: (minted.warnings || []).map(w => text(typeof w === 'string' ? w : w?.text ?? w?.message, 300)).filter(Boolean),
    };
    // Save the external outcome before final acceptance. A retry resumes this
    // result and never mints again when code mapping or acceptance failed.
    await store.updateOffer(rec.id, { mint_result: minted });

    // What the store still owes once an order uses the code is kept against the
    // code, where the order webhook looks it up. An adapter that keeps its own
    // code record gets these fields added to it.
    const owed = {
      shop: rec.shop,
      offer_id: rec.id,
      product: rec.product.handle,
      headline: rec.offer.headline,
      deferred: minted.deferred?.length ? minted.deferred : publicOffer(rec.offer).components.filter(x => AFTER_PURCHASE[x.type]),
    };
    for (const code of minted.codes) {
      if (await store.getCode(code)) await store.updateCode(code, owed);
      else await store.putCode({ code, ...owed, expires_at: patch.code_expires_at, used: false, created_at: patch.accepted_at });
    }
    const saved = (await store.updateOffer(rec.id, patch)) || { ...rec, ...patch };
    await log({ ...event, status: 'accepted', codes: minted.codes.length, mode: patch.mode });
    return accepted(saved);
  }

  async function accept(input = {}) {
    const c = caller(input);
    const rec = await lookup(input, text(input.offer_id, 80));
    if (!rec) return notFound();
    if (rec.status === 'accepted') return accepted(rec, await codeState(rec));
    const view = offerView(rec.id, rec.offer, rec.expires_at);
    const event = { type: 'accept', shop: rec.shop, product: rec.product.handle, kind: rec.offer.kind, headline: rec.offer.headline, total: rec.offer.total, who: c.mark, client: c.name };

    if (!rec.mint_result && rec.mint_intent?.mode !== 'draft' && Date.parse(rec.expires_at) <= now()) {
      await log({ ...event, status: 'expired' });
      return {
        status: 'expired',
        reason: `This offer was open until ${rec.expires_at}. No code was issued for it.`,
        next: 'Ask for a new offer. The same request gets the same terms unless the store\'s settings or a competing price have changed.',
      };
    }
    // Approval is never guessed: only true counts.
    if (input.user_approved !== true) {
      await log({ ...event, status: 'needs_approval' });
      return {
        status: 'needs_approval',
        reason: 'A code is issued only once the user has seen this offer and agreed to it, so nothing was issued.',
        offer: view,
        next: 'Show the user what the offer includes and its total. When they agree, accept again with user_approved: true.',
      };
    }
    // The stored offer is data. It is checked against the merchant's limits as
    // they stand now before it becomes a code; why it failed stays with the seller.
    const config = shopConfig(rec.shop);
    const m = config && mandateFor(rec.shop, rec.product.variant_id);
    const problems = m ? checkOffer(m, rec.offer) : ['product no longer offered'];
    if (problems.length) {
      await store.updateOffer(rec.id, { withdrawn_at: iso(now()), withdrawn_for: problems });
      await log({ ...event, status: 'withdrawn' });
      return {
        status: 'withdrawn',
        reason: 'The store\'s terms changed after this offer was made, and it can no longer be honoured as written. No code was issued.',
        next: 'Ask for a new offer to see what the store can do now.',
      };
    }
    const adapter = await adapterFor(rec.shop, config);
    const support = !rec.mint_result && adapter.inspect ? await adapter.inspect(rec.offer, m) : null;
    if (support && !support.supported) {
      let alternatives = await Promise.all((rec.checkout_alternative_ids || []).map(id => store.getOffer(id)));
      alternatives = alternatives.filter(Boolean);
      if (!alternatives.length) {
        alternatives = (support.alternatives || []).filter(offer => !checkOffer(m, offer).length).map(offer => ({
          ...rec, id: `of_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`, offer,
          status: 'open', original_offer_id: rec.id,
        }));
        await Promise.all(alternatives.map(offer => store.putOffer(offer)));
        await store.updateOffer(rec.id, { checkout_alternative_ids: alternatives.map(offer => offer.id) });
      }
      return {
        status: 'not_deliverable', reason: support.reason,
        offer: view, not_included: support.not_included || [],
        alternatives: alternatives.map(offer => offerView(offer.id, offer.offer, offer.expires_at)),
        next: 'The full offer needs the store’s composite Discount Function. Nothing was minted. Show the alternatives and their changed terms to the user; accept an alternative by its own offer_id only after fresh approval.',
      };
    }
    return issue(rec, m, config, event, adapter);
  }

  // Where an offer or a code stands. Takes offer_id, or code.
  async function status(input = {}) {
    let id = text(input.offer_id, 80);
    if (!id && input.code) id = (await store.getCode(text(input.code, 80)))?.offer_id || '';
    const rec = await lookup(input, id);
    if (!rec) return { ...notFound(), reason: 'Nothing is known under this offer_id or code at this store.' };
    if (rec.status === 'accepted') {
      if (rec.mode === 'draft') return { ...accepted(rec), settlement_state: rec.order_id ? 'ordered' : 'invoice_ready' };
      const state = await codeState(rec);
      return { ...accepted(rec, state), code_state: state };
    }
    const offer = offerView(rec.id, rec.offer, rec.expires_at);
    if (Date.parse(rec.expires_at) <= now()) {
      return { status: 'expired', offer, reason: `This offer was open until ${rec.expires_at}. No code was issued for it.`, next: 'Ask for a new offer.' };
    }
    return { status: 'open', offer, next: `This offer can be accepted until ${rec.expires_at}, once the user has agreed to it. Accepting turns it into a discount code and buys nothing.` };
  }

  return { options, request, accept, status };
}
