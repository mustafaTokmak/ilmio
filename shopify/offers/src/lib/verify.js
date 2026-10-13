// Competing-offer verifier. A buyer's agent hands the seller a link to a
// cheaper offer; the seller fetches that page itself and reads the price, the
// stock state and the product identity from it. Nothing the agent says about
// the page is trusted, and the page is hostile input too, so every step is
// bounded: which hosts, how many redirects, how many bytes, how long.
// Never throws: every failure is a result with ok:false and a reason code.

// Reason codes with the sentence shown to the buyer's agent. policy.js puts the
// sentence after "Competing offer not accepted: ", so no capital and no full stop.
const TEXT = {
  ok: 'the page shows the same product',
  bad_url: 'the link is not a public https address',
  blocked_domain: 'this store does not compare prices with that site',
  own_store: 'the link points to this store, not to another shop',
  fetch_failed: 'the page could not be loaded',
  no_price_found: 'no price could be read from that page',
  currency_mismatch: 'the price on that page is in a different currency',
  out_of_stock: 'that shop shows the item as out of stock',
  not_new: 'that offer is not for a new item',
  different_product: 'the page shows a different product',
  implausible_price: 'the price on that page is too far below the usual price to count as the same offer',
};
export const REASONS = Object.keys(TEXT);

const AFTER_REDIRECT = {
  bad_url: 'the link redirects to an address that cannot be checked',
  own_store: 'the link redirects to this store, not to another shop',
  blocked_domain: 'the link redirects to a site this store does not compare prices with',
};
const NOT_BUYABLE = new Map([
  ['out_of_stock', TEXT.out_of_stock],
  ['discontinued', 'that shop shows the item as discontinued'],
  ['preorder', 'that shop only takes pre-orders for the item'],
  ['backorder', 'that shop has the item on back order'],
]);

const MAX_URL = 2000;
const MAX_REDIRECTS = 3;
const REDIRECTS = new Set([301, 302, 303, 307, 308]);
const MAX_CHUNKS = 20000; // real pages arrive in a few hundred pieces; one sent in crumbs is cut off
const MAX_TAG = 4096; // longer tags are skipped, not parsed
const MAX_LD_BLOCKS = 60;
const MAX_NODES = 20000; // JSON-LD values walked per page
const MAX_CANDIDATES = 600;
const MAX_SCAN = 3000; // meta tags or itemprops read per page
const MIN_TITLE = 0.6;

// Says what it is: shops that turn robots away should be able to tell this one apart.
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; OfferAdVerifier/0.1; competing-offer price check)',
  accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5',
  'accept-language': 'en',
};

const r2 = x => Math.round(x * 100) / 100;
const arr = x => (x == null ? [] : Array.isArray(x) ? x : [x]);
const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
// Cleanup that must never turn into a failure of its own.
const quiet = fn => { try { Promise.resolve(fn()).catch(() => {}); } catch { /* nothing left to clean up */ } };

const ENTITIES = new Map([['amp', '&'], ['lt', '<'], ['gt', '>'], ['quot', '"'], ['apos', '\''], ['nbsp', ' ']]);
const decodeEntities = s => s.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|[a-z]{2,6});/gi, (all, e) => {
  if (e[0] !== '#') return ENTITIES.get(e.toLowerCase()) ?? all;
  const cp = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
  return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : all;
});

// A name, brand or identifier as one clean line of text, or null.
function str(x) {
  if (isObj(x)) x = x['@value'];
  if (typeof x !== 'string' && typeof x !== 'number') return null;
  return decodeEntities(String(x).slice(0, 600)).replace(/\s+/g, ' ').trim().slice(0, 300) || null;
}

// "1,299.00", "1.299,00", "1 299,00 EUR", "$1,299", 699.95 -> a number; null when no amount can be read.
// When both marks appear the later one is the decimal mark. A lone comma groups thousands only
// in front of exactly three digits; a lone dot is a decimal point, as schema.org asks.
function amount(x) {
  if (typeof x === 'number') return Number.isFinite(x) && x >= 0 ? x : null;
  if (typeof x !== 'string') return null;
  const s = x.slice(0, 64).replace(/[\u00a0\u2009\u202f]/g, ' ');
  const m = /\d{1,3}(?:[ '\u2019]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)*/.exec(s);
  if (!m || s[m.index - 1] === '-') return null;
  let n = m[0].replace(/[ '\u2019]/g, '');
  const dot = n.lastIndexOf('.');
  const comma = n.lastIndexOf(',');
  if (dot >= 0 && comma >= 0) {
    const dec = Math.max(dot, comma);
    n = `${n.slice(0, dec).replace(/[.,]/g, '')}.${n.slice(dec + 1)}`;
  } else if (/^\d{1,3}(,\d{3})+$/.test(n) || /^\d{1,3}(\.\d{3}){2,}$/.test(n)) {
    n = n.replace(/[.,]/g, '');
  } else if (comma >= 0) {
    n = n.replace(',', '.');
  }
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}
const price = x => { const v = amount(x); return v > 0 && v < 1e9 ? v : null; };
const code = x => (typeof x === 'string' && /^[A-Za-z]{3}$/.test(x.trim()) ? x.trim().toUpperCase() : null);

// The last word of a schema.org value: "https://schema.org/InStock", "InStock" and "in stock" all give "instock".
function word(x) {
  const v = arr(x)[0];
  return String((isObj(v) ? v['@id'] ?? v.name : v) ?? '').slice(0, 120).replace(/^.*[/#:]/, '').toLowerCase().replace(/[^a-z]/g, '');
}
const AVAILABILITY = new Map([
  ['instock', 'in_stock'], ['onlineonly', 'in_stock'], ['instoreonly', 'in_stock'], ['limitedavailability', 'in_stock'],
  ['available', 'in_stock'], ['availablefororder', 'in_stock'], ['madetoorder', 'in_stock'],
  ['outofstock', 'out_of_stock'], ['soldout', 'out_of_stock'], ['oos', 'out_of_stock'], ['unavailable', 'out_of_stock'], ['reserved', 'out_of_stock'],
  ['discontinued', 'discontinued'], ['preorder', 'preorder'], ['presale', 'preorder'], ['pending', 'preorder'], ['backorder', 'backorder'],
]);
const availabilityOf = x => AVAILABILITY.get(word(x)) ?? null;
// 'new', or whatever else the page calls it; null when the page does not say.
function conditionOf(x) {
  const w = word(x).replace(/condition$/, '');
  return w === 'new' || w === 'brandnew' ? 'new' : w.slice(0, 30) || null;
}

// Words of a title or brand: lowercased, accents folded, punctuation dropped, single letters dropped, numbers kept.
function tokens(s) {
  const words = String(s ?? '').slice(0, 600).normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase().split(/[^\p{L}\p{N}]+/u);
  return new Set(words.filter(w => w.length > 1 || /^\p{N}$/u.test(w)));
}
function shared(a, b) {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n;
}
const jaccard = (a, b) => { const both = shared(a, b); return both ? both / (a.size + b.size - both) : 0; };
const digits = x => (typeof x === 'string' || typeof x === 'number' ? String(x).replace(/\D/g, '') : '');
// GTIN-8, UPC, EAN and GTIN-14 name the same item once the padding zeros are gone.
function sameGtin(a, b) {
  const x = digits(a);
  const y = digits(b);
  return x.length >= 8 && x.length <= 14 && y.length >= 8 && y.length <= 14 && /[1-9]/.test(x) && x.replace(/^0+/, '') === y.replace(/^0+/, '');
}
const codeKey = x => (typeof x === 'string' || typeof x === 'number' ? String(x).trim().toLowerCase() : '');
const sameCode = (a, b) => codeKey(a).length >= 3 && codeKey(a) === codeKey(b);

// How sure we are that something found on the page is the seller's product: a shared
// identifier first; a similar title is the weakest proof and policy.js caps what it unlocks.
function identify(c, mine) {
  const hit = (by, rank) => ({ by, rank, score: 1, title: c.titles[0] ?? null });
  if (sameGtin(c.gtin, mine.gtin)) return hit('gtin', 3);
  // A part number or SKU means something only inside one brand.
  const brand = shared(tokens(c.brand), mine.brand) > 0;
  if (brand && sameCode(c.mpn, mine.mpn)) return hit('mpn', 2);
  if (brand && sameCode(c.sku, mine.sku)) return hit('sku', 1);
  // A variant is named after its product plus a size or a colour. The words it adds do not count
  // against it unless they are words of ours, so the sizes we did not ask for come out equal.
  const base = tokens(c.base);
  let score = 0;
  let title = c.titles[0] ?? null;
  c.titles.forEach((t, i) => {
    let words = tokens(t);
    if (i === 0 && base.size) words = new Set([...words].filter(w => base.has(w) || mine.title.has(w)));
    const s = jaccard(words, mine.title);
    if (s > score) { score = s; title = t; }
  });
  return { by: score >= MIN_TITLE ? 'title' : null, rank: 0, score: Math.floor(score * 100) / 100, title };
}

// A page often lists many offers: every size of a board, or other products beside the main one.
// Take the one that is most surely the seller's product: a shared identifier, then the variant
// the link names, then the closest title; among equals one that can be bought new today, then
// the first on the page.
function choose(candidates, mine, variant) {
  let best = null;
  for (const c of candidates) {
    const id = identify(c, mine);
    const key = [id.rank, variant && c.variant === variant ? 1 : 0, id.score, NOT_BUYABLE.has(c.availability) ? 0 : 1, c.condition && c.condition !== 'new' ? 0 : 1];
    if (!best || beats(key, best.key)) best = { c, id, key };
  }
  return best;
}
function beats(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

const hostOf = u => u.hostname.toLowerCase().replace(/\.+$/, '');
const bare = host => host.replace(/^www\./, '');
const names = list => arr(list).map(x => (typeof x === 'string' ? x.trim().toLowerCase() : '')).filter(Boolean);
const LOOPBACK = /^(localhost|[a-z0-9.-]+\.localhost|127\.\d+\.\d+\.\d+|\[::1\])$/;
// Names that only resolve inside somebody's own network.
const PRIVATE_TLD = new Set(['localhost', 'local', 'localdomain', 'internal', 'intranet', 'lan', 'home', 'corp', 'private', 'arpa']);

// An own-store entry: 'shop.example', 'https://shop.example', or 'host/path' for a storefront
// that shares its host with other shops (the demo storefront and its rival do).
function ownEntry(e) {
  const s = e.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  const cut = s.search(/[/?#]/);
  const host = bare((cut < 0 ? s : s.slice(0, cut)).replace(/:\d+$/, '').replace(/\.+$/, ''));
  const path = cut < 0 ? '' : s.slice(cut).replace(/[?#].*$/, '').replace(/\/+$/, '');
  return host ? { host, path } : null;
}

// One address against the URL rules. Runs on the link itself and again on every redirect target.
function urlProblem(u, cfg) {
  const host = hostOf(u);
  if (u.protocol !== 'https:' && !(cfg.allowLocal && u.protocol === 'http:')) return ['bad_url', 'only https links can be checked'];
  if (u.username || u.password) return ['bad_url', 'links that carry a login cannot be checked'];
  if (!(cfg.allowLocal && LOOPBACK.test(host))) {
    // Once the URL parser has normalised it, an IP address in any spelling ends in digits or sits in brackets.
    const tld = host.slice(host.lastIndexOf('.') + 1);
    const named = host.includes('.') && !host.startsWith('[') && /^(?:[a-z]{2,}|xn--[a-z0-9-]+)$/.test(tld) && !PRIVATE_TLD.has(tld);
    if (!named || u.port) return ['bad_url', 'the link must point to a public shop website'];
  }
  const path = u.pathname.toLowerCase();
  const own = cfg.own.some(o => (bare(host) === o.host || host.endsWith(`.${o.host}`)) && (!o.path || path === o.path || path.startsWith(`${o.path}/`)));
  if (own) return ['own_store', TEXT.own_store];
  if (cfg.blocked.some(b => host.includes(b))) return ['blocked_domain', TEXT.blocked_domain];
  return null;
}

// GET with the redirects followed by hand, so every hop is checked before it is fetched.
async function get(start, cfg) {
  // Called bare: a Workers fetch refuses to run as some object's method.
  const { fetchFn, race, signal } = cfg;
  let u = start;
  for (let hop = 0; ; hop++) {
    u.hash = '';
    const problem = urlProblem(u, cfg);
    if (problem) return { url: u, fail: hop ? [problem[0], AFTER_REDIRECT[problem[0]]] : problem };
    const failed = text => ({ url: u, fail: ['fetch_failed', signal.aborted ? 'the page took too long to load' : text] });
    let res;
    try {
      res = await race(fetchFn(u.href, { method: 'GET', redirect: 'manual', headers: HEADERS, signal }));
    } catch {
      return failed(TEXT.fetch_failed);
    }
    const status = Number(res?.status);
    if (REDIRECTS.has(status)) {
      const to = res.headers?.get?.('location');
      quiet(() => res.body?.cancel());
      if (hop >= MAX_REDIRECTS) return failed('the link redirects too many times');
      try {
        if (!to) throw new Error('no location');
        u = new URL(to, u);
      } catch {
        return failed('the link redirects to an address that cannot be read');
      }
      continue;
    }
    if (!(status >= 200 && status < 300)) {
      quiet(() => res?.body?.cancel());
      return failed(Number.isFinite(status) ? `the page could not be loaded (HTTP ${status})` : TEXT.fetch_failed);
    }
    // A fetchFn that followed redirects on its own still has to land on an allowed address.
    if (typeof res.url === 'string' && res.url && res.url !== u.href) {
      let landed = null;
      try { landed = new URL(res.url); } catch { /* keep the address we asked for */ }
      const off = landed && urlProblem(landed, cfg);
      if (off) {
        quiet(() => res.body?.cancel());
        return { url: landed, fail: [off[0], AFTER_REDIRECT[off[0]]] };
      }
      if (landed) u = landed;
    }
    const type = String(res.headers?.get?.('content-type') ?? '').toLowerCase();
    if (type && !/html|xml|json|javascript|text\/plain/.test(type)) {
      quiet(() => res.body?.cancel());
      return { url: u, fail: ['no_price_found', 'that link is not a product page'] };
    }
    try {
      return { url: u, ...(await readBody(res, type, cfg)) };
    } catch {
      return failed(TEXT.fetch_failed);
    }
  }
}

// The body as text, cut off at maxBytes: a page that has not named its price by then is not worth more memory.
async function readBody(res, type, cfg) {
  const reader = res.body?.getReader?.();
  if (!reader) {
    // A stand-in response without a stream.
    const text = String(await cfg.race(res.text()));
    return { text: text.slice(0, cfg.maxBytes), cut: text.length > cfg.maxBytes };
  }
  const chunks = [];
  let size = 0;
  let cut = false;
  try {
    while (!cut) {
      const { done, value } = await cfg.race(reader.read());
      if (done) break;
      const room = cfg.maxBytes - size;
      cut = value.byteLength > room || chunks.length >= MAX_CHUNKS;
      const part = value.byteLength > room ? value.subarray(0, room) : value;
      chunks.push(part);
      size += part.byteLength;
    }
  } finally {
    quiet(() => reader.cancel());
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { bytes.set(c, at); at += c.byteLength; }
  const charset = /charset=["']?([\w-]+)/.exec(type)?.[1] ?? 'utf-8';
  try {
    return { text: new TextDecoder(charset).decode(bytes), cut };
  } catch {
    return { text: new TextDecoder().decode(bytes), cut };
  }
}

// The scanners below search with indexOf and always move forward, so markup written to make
// a parser retry from every position costs one pass and no more.

// A lowercase copy for case-blind searching. Its indexes must line up with the original, and a
// few non-ASCII letters grow when lowercased, so such a page gets an ASCII-only pass instead.
function lowerOf(s) {
  const low = s.toLowerCase();
  return low.length === s.length ? low : s.replace(/[A-Z]+/g, m => m.toLowerCase());
}

// Attributes of one tag. Stray quotes and slashes count as separators, so a broken tag is still read once.
const ATTR = /[\s"'<>/=]*([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]*)))?/y;
function attrsOf(tag) {
  const out = Object.create(null);
  ATTR.lastIndex = 0;
  for (let m; (m = ATTR.exec(tag));) {
    const key = m[1].toLowerCase();
    if (!(key in out)) out[key] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return out;
}

function parseJson(text) {
  const t = String(text ?? '').trim();
  if (!t) return null;
  try { return JSON.parse(t); } catch { /* one repair below */ }
  // Raw line breaks and tabs inside strings are the usual reason a shop's JSON-LD does not parse.
  try { return JSON.parse(t.replace(/[\u0000-\u001f]+/g, ' ')); } catch { return null; }
}

// JSON-LD, the format shops write for search engines and the most complete one.
function jsonLd(html, low) {
  const out = [];
  const budget = { left: MAX_NODES, items: 0 };
  let at = 0;
  for (let blocks = 0; blocks < MAX_LD_BLOCKS;) {
    const open = low.indexOf('<script', at);
    if (open < 0) break;
    const gt = low.indexOf('>', open);
    if (gt < 0) break;
    const close = low.indexOf('</script', gt);
    if (close < 0) break;
    at = close + 9;
    if (gt - open > MAX_TAG || !low.slice(open, gt).includes('ld+json')) continue;
    blocks++;
    walk(parseJson(html.slice(gt + 1, close)), 0, budget, out);
  }
  return { list: out, items: budget.items };
}

const typesOf = n => arr(n['@type']).slice(0, 8).map(t => String(t).replace(/^.*[/:#]/, '').toLowerCase());
const PRODUCT_TYPES = new Set(['product', 'productgroup', 'individualproduct', 'productmodel']);

// Every Product in a JSON-LD document, wherever it sits: top level, an array, @graph, mainEntity.
function walk(node, depth, budget, out) {
  if (depth > 8 || budget.left-- <= 0) return;
  if (Array.isArray(node)) {
    for (const n of node) walk(n, depth + 1, budget, out);
    return;
  }
  if (!isObj(node)) return;
  if (typesOf(node).some(t => PRODUCT_TYPES.has(t))) {
    budget.items++;
    fromProduct(node, null, out);
    return;
  }
  for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v, depth + 1, budget, out);
}

const gtinOf = n => str(n.gtin ?? n.gtin14 ?? n.gtin13 ?? n.gtin12 ?? n.gtin8);
const brandOf = n => { const b = arr(n.brand ?? n.manufacturer)[0]; return str(isObj(b) ? b.name : b); };

// One Product, or one variant of a ProductGroup, gives one candidate per offer. A variant
// inherits what only the group states: usually the brand and the plain product name.
function fromProduct(node, group, out) {
  const item = {
    titles: [str(node.name), ...(group?.titles ?? [])].filter(Boolean),
    base: group?.titles[0] ?? null,
    brand: brandOf(node) ?? group?.brand ?? null,
    gtin: gtinOf(node),
    mpn: str(node.mpn) ?? group?.mpn ?? null,
    sku: str(node.sku),
    condition: node.itemCondition ?? group?.condition,
    refs: [node.url, node['@id']],
  };
  for (const offer of arr(node.offers).slice(0, 300)) fromOffer(offer, item, out, 0);
  if (!group) for (const v of arr(node.hasVariant).slice(0, 300)) if (isObj(v)) fromProduct(v, item, out);
}

function fromOffer(offer, item, out, depth) {
  if (!isObj(offer) || out.length >= MAX_CANDIDATES) return;
  const aggregate = typesOf(offer).includes('aggregateoffer');
  const priced = priceOf(offer, aggregate);
  if (priced) {
    const currency = code(priced.currency);
    out.push({
      price: priced.price,
      currency,
      shipping: shippingOf(offer, priced.price, currency),
      availability: availabilityOf(offer.availability),
      condition: conditionOf(offer.itemCondition ?? item.condition),
      titles: item.titles,
      base: item.base,
      brand: item.brand,
      gtin: gtinOf(offer) ?? item.gtin,
      mpn: str(offer.mpn) ?? item.mpn,
      sku: str(offer.sku) ?? item.sku,
      variant: variantIn([offer.url, offer['@id'], ...item.refs]),
    });
  }
  // An AggregateOffer counts with its lowPrice; the single offers inside it are more exact
  // and win when one of them carries our identifier or is the variant the link names.
  if (depth < 1) for (const o of arr(offer.offers).slice(0, 300)) fromOffer(o, item, out, depth + 1);
}

function variantIn(refs) {
  for (const r of refs) {
    const m = typeof r === 'string' && /[?&]variant=(\d{1,20})/.exec(r.slice(0, MAX_URL));
    if (m) return m[1];
  }
  return null;
}

// The price a buyer pays today. In priceSpecification a was-price carries a priceType and a
// member price a validForMemberTier; the active price carries neither.
// https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
const REFERENCE_PRICE = /listprice|strikethroughprice|msrp|srp|minimumadvertisedprice|invoiceprice/i;
function priceOf(offer, aggregate) {
  const specs = arr(offer.priceSpecification).filter(isObj);
  // An AggregateOffer counts with its lowPrice. Shops mix the two types up, so each also reads the other's field.
  const direct = aggregate ? price(offer.lowPrice) ?? price(offer.price) : price(offer.price) ?? price(offer.lowPrice);
  if (direct != null) return { price: direct, currency: offer.priceCurrency ?? specs[0]?.priceCurrency };
  for (const s of specs) {
    if (s.validForMemberTier || REFERENCE_PRICE.test(String(s.priceType ?? ''))) continue;
    const p = price(s.price ?? s.minPrice);
    if (p != null) return { price: p, currency: s.priceCurrency ?? offer.priceCurrency };
  }
  return null;
}

// The delivery charge the page states for this offer, in the offer's own currency. Zero is a
// statement too (free shipping), but "free from" an amount above the item price is not.
function shippingOf(offer, itemPrice, currency) {
  for (const d of arr(offer.shippingDetails).slice(0, 50)) {
    const rate = d?.shippingRate;
    if (!isObj(rate)) continue;
    const cur = code(rate.currency);
    if (cur && currency && cur !== currency) continue;
    const value = amount(rate.value ?? rate.maxValue);
    if (value == null) continue;
    const freeFrom = amount(d.freeShippingThreshold?.price ?? d.freeShippingThreshold?.value);
    if (freeFrom == null) return r2(value);
    if (itemPrice >= freeFrom) return 0;
    if (value > 0) return r2(value);
  }
  return null;
}

// Shopify product JSON, served by every Shopify storefront next to its product pages. Prices
// are integer cents and the reply names no currency.
// https://shopify.dev/docs/api/ajax/reference/product
function shopifyVariants(p) {
  if (!isObj(p) || !Array.isArray(p.variants)) return [];
  const title = str(p.title);
  return p.variants.slice(0, 250).filter(v => isObj(v) && Number.isInteger(v.price) && v.price > 0).map(v => ({
    price: v.price / 100,
    currency: null,
    shipping: null,
    availability: v.available === true ? 'in_stock' : v.available === false ? 'out_of_stock' : null,
    condition: null,
    titles: [str(v.name) ?? (title && str(v.title) ? `${title} ${str(v.title)}` : null), title].filter(Boolean),
    base: title,
    brand: str(p.vendor),
    gtin: str(v.barcode),
    mpn: null,
    sku: str(v.sku),
    variant: v.id == null ? null : String(v.id),
  }));
}

// Where a Shopify storefront would serve that JSON for this page. A market prefix such as
// /en-ca is kept, because prices under it are in that market's currency.
function shopifyRoot(u) {
  const m = /^(.*?)\/products\/([^/.]+)/.exec(u.pathname.slice(0, MAX_URL));
  if (!m) return null;
  const before = m[1].replace(/\/collections\/[^/]+$/i, '');
  return { root: u.origin + (/^\/[a-z]{2,3}(-[a-z0-9]{2,4})?$/i.test(before) ? before : ''), handle: m[2] };
}

// <meta> tags by property, name or itemprop. The first value of a key wins.
function metaTags(html, low) {
  const meta = new Map();
  let at = 0;
  for (let n = 0; n < MAX_SCAN; n++) {
    const open = low.indexOf('<meta', at);
    if (open < 0) break;
    const gt = low.indexOf('>', open);
    if (gt < 0) break;
    at = gt + 1;
    if (gt - open > MAX_TAG || !/[\s/]/.test(low[open + 5])) continue;
    const a = attrsOf(html.slice(open + 5, gt));
    const key = String(a.property ?? a.name ?? a.itemprop ?? '').trim().toLowerCase();
    if (key && a.content != null && !meta.has(key)) meta.set(key, a.content);
  }
  return meta;
}

function titleTag(html, low) {
  const open = low.indexOf('<title');
  const gt = open < 0 ? -1 : low.indexOf('>', open);
  const close = gt < 0 ? -1 : low.indexOf('</title', gt);
  return close < 0 ? null : str(html.slice(gt + 1, Math.min(close, gt + 400)));
}

// OpenGraph product tags: a price and a title, and seldom more.
function openGraph(meta, pageTitle) {
  const p = price(meta.get('product:price:amount')) ?? price(meta.get('og:price:amount'));
  if (p == null) return [];
  return [{
    price: p,
    currency: code(meta.get('product:price:currency') ?? meta.get('og:price:currency')),
    shipping: null,
    availability: availabilityOf(meta.get('product:availability') ?? meta.get('og:availability')),
    condition: conditionOf(meta.get('product:condition')),
    titles: [str(meta.get('og:title')) ?? pageTitle].filter(Boolean),
    brand: str(meta.get('product:brand') ?? meta.get('og:brand')),
    gtin: null,
    mpn: null,
    sku: null,
    variant: null,
  }];
}

const MICRO = new Set(['price', 'lowprice', 'pricecurrency', 'availability', 'itemcondition', 'name', 'brand', 'sku', 'mpn', 'gtin', 'gtin8', 'gtin12', 'gtin13', 'gtin14']);
// Nested items whose own name must not be read as the product's.
const NAMED_SCOPES = new Set(['brand', 'manufacturer', 'author', 'seller', 'publisher', 'review', 'itemreviewed']);

// Microdata, the oldest of the formats: itemprop attributes on the visible markup. Read in
// document order from the first schema.org Product; the first value of each property wins.
function microdata(html, low, pageTitle) {
  const props = new Map();
  let scope = null;
  let at = Math.max(0, low.search(/itemtype\s*=\s*["']?https?:\/\/schema\.org\/product/));
  for (let n = 0; n < MAX_SCAN; n++) {
    const hit = low.indexOf('itemprop', at);
    if (hit < 0) break;
    at = hit + 8;
    // The tag around the hit, looked for in a bounded window on each side.
    const back = low.slice(Math.max(0, hit - MAX_TAG), hit);
    const lt = back.lastIndexOf('<');
    const gt = low.slice(hit, hit + MAX_TAG).indexOf('>');
    if (lt < 0 || gt < 0 || back.indexOf('>', lt) >= 0) continue;
    const end = hit + gt;
    // One tag is one property: the search goes on behind it, so no tag is parsed twice.
    at = end + 1;
    const a = attrsOf(html.slice(hit - back.length + lt + 1, end));
    const name = String(a.itemprop ?? '').trim().toLowerCase().split(/\s+/)[0];
    if ('itemscope' in a) {
      if (NAMED_SCOPES.has(name)) scope = name;
      continue;
    }
    if (!MICRO.has(name)) continue;
    const linked = name === 'availability' || name === 'itemcondition' ? a.href : null;
    const value = a.content ?? linked ?? decodeEntities(html.slice(end + 1, end + 201).split('<')[0]).trim();
    if (name === 'name') {
      const key = scope === 'brand' || scope === 'manufacturer' ? 'brand' : scope ? null : 'name';
      scope = null;
      if (key && value && !props.has(key)) props.set(key, value);
      continue;
    }
    if (name === 'price' || name === 'lowprice' ? price(value) == null : !value) continue;
    if (!props.has(name)) props.set(name, value);
  }
  const p = price(props.get('price')) ?? price(props.get('lowprice'));
  if (p == null) return [];
  return [{
    price: p,
    currency: code(props.get('pricecurrency')),
    shipping: null,
    availability: availabilityOf(props.get('availability')),
    condition: conditionOf(props.get('itemcondition')),
    titles: [str(props.get('name')) ?? pageTitle].filter(Boolean),
    brand: str(props.get('brand')),
    gtin: str(props.get('gtin') ?? props.get('gtin14') ?? props.get('gtin13') ?? props.get('gtin12') ?? props.get('gtin8')),
    mpn: str(props.get('mpn')),
    sku: str(props.get('sku')),
    variant: null,
  }];
}

// The page's currency, for a price that came without one.
function pageCurrency(html, meta) {
  return code(meta.get('product:price:currency') ?? meta.get('og:price:currency') ?? meta.get('pricecurrency'))
    ?? code(/Shopify\.currency\s*=\s*\{\s*"active"\s*:\s*"([A-Za-z]{3})"/.exec(html)?.[1]);
}

// Every key is always present, so callers and logs never have to guess at the shape.
function blank(url, now) {
  let at = Date.now();
  try {
    const t = typeof now === 'function' ? now() : now;
    if (Number.isFinite(t) && Math.abs(t) < 8.64e15) at = t;
  } catch { /* keep the clock */ }
  return {
    ok: false, reason: null, reason_text: null,
    url: typeof url === 'string' ? url.trim().slice(0, MAX_URL) : url instanceof URL ? url.href.slice(0, MAX_URL) : null,
    domain: null, trusted_domain: false,
    price: null, currency: null, shipping: null, availability: null, condition: null,
    title: null, brand: null, gtin: null, mpn: null, sku: null,
    match_by: null, match_score: null, method: null,
    fetched_at: new Date(at).toISOString(),
  };
}

// product: mandate.product { title, brand, gtin, mpn, sku, list, currency }
// policy:  mandate.price_match { trusted_domains, blocked_domains, min_price_ratio }
// opts:    { fetchFn = fetch, now = Date.now(), ownHosts = [], allowLocal = false, timeoutMs = 8000, maxBytes = 1_500_000 }
// returns  { ok, reason, reason_text, url, domain, trusted_domain, price, currency, shipping, availability,
//            condition, title, brand, gtin, mpn, sku, match_by, match_score, method, fetched_at }
// method is 'json_ld', 'shopify_json', 'meta' or 'microdata'; the first that yields a price wins.
export async function verifyCompetingOffer(url, product, policy, opts = {}) {
  const o = isObj(opts) ? opts : {};
  const out = blank(url, o.now);
  const end = (reason, text) => ({ ...out, ok: reason === 'ok', reason, reason_text: text || TEXT[reason] });
  let timer;
  try {
    const p = isObj(product) ? product : {};
    const rules = isObj(policy) ? policy : {};
    const mine = { title: tokens(p.title), brand: tokens(p.brand), gtin: p.gtin, mpn: p.mpn, sku: p.sku, list: Number(p.list), currency: code(p.currency) };
    const trusted = names(rules.trusted_domains);
    const ratio = Number.isFinite(rules.min_price_ratio) && rules.min_price_ratio >= 0 ? rules.min_price_ratio : 0.5;
    const where = u => {
      const host = hostOf(u);
      out.url = u.href.slice(0, MAX_URL);
      out.domain = bare(host);
      out.trusted_domain = trusted.some(d => host === d || host.endsWith(`.${d}`));
    };

    const raw = typeof url === 'string' ? url.trim() : url instanceof URL ? url.href : '';
    if (!raw) return end('bad_url', 'no link was given');
    if (raw.length > MAX_URL) return end('bad_url', 'the link is too long');
    let first;
    try { first = new URL(raw); } catch { return end('bad_url', 'the link is not a valid web address'); }
    if (!mine.title.size && !digits(mine.gtin) && !codeKey(mine.mpn) && !codeKey(mine.sku)) return end('different_product', 'there is no product to compare that page with');

    const ctrl = new AbortController();
    const timeoutMs = Math.min(o.timeoutMs > 0 ? Number(o.timeoutMs) : 8000, 60000);
    timer = setTimeout(() => ctrl.abort(), timeoutMs);
    // One clock for the whole check, redirects and follow-up requests included. A fetchFn may
    // ignore the signal, so every wait also races it.
    const late = new Promise((_, reject) => ctrl.signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true }));
    late.catch(() => {});
    const cfg = {
      // Only a missing fetchFn means the real network; anything else that is not a function fails the check.
      fetchFn: o.fetchFn == null ? (input, init) => fetch(input, init) : o.fetchFn,
      allowLocal: o.allowLocal === true,
      own: names(o.ownHosts).map(ownEntry).filter(Boolean),
      blocked: names(rules.blocked_domains),
      maxBytes: Math.min(o.maxBytes > 0 ? Math.floor(Number(o.maxBytes)) : 1_500_000, 10_000_000),
      signal: ctrl.signal,
      race: promise => Promise.race([promise, late]),
    };

    const page = await get(first, cfg);
    where(page.url);
    if (page.fail) return end(...page.fail);
    const html = page.text;
    const low = lowerOf(html);
    const meta = metaTags(html, low);
    const pageTitle = str(meta.get('og:title')) ?? titleTag(html, low);
    const asked = page.url.searchParams.get('variant') ?? first.searchParams.get('variant');
    const variant = /^\d{1,20}$/.test(asked ?? '') ? asked : null;

    let method = 'json_ld';
    const ld = jsonLd(html, low);
    // A product page that describes one product: the page's own title is another name for it.
    // Some shops put a short model name in the data and the full name in the title, or the reverse.
    if (ld.items === 1 && pageTitle && /product/i.test(meta.get('og:type') ?? '')) for (const c of ld.list) c.titles = [...c.titles, pageTitle];
    let best = choose(ld.list, mine, variant);
    const shop = best ? null : shopifyRoot(page.url);
    if (shop) {
      method = 'shopify_json';
      const js = await get(new URL(`${shop.root}/products/${shop.handle}.js`), cfg);
      best = js.fail ? null : choose(shopifyVariants(parseJson(js.text)), mine, variant);
    }
    if (!best) { method = 'meta'; best = choose(openGraph(meta, pageTitle), mine, variant); }
    if (!best) { method = 'microdata'; best = choose(microdata(html, low, pageTitle), mine, variant); }
    if (!best) return end('no_price_found', page.cut ? 'no price could be read from the first part of that page, and the page is too large to read in full' : null);

    const { c, id } = best;
    let currency = c.currency ?? pageCurrency(html, meta);
    if (!currency && method === 'shopify_json') {
      // The place Shopify documents for asking a storefront which currency it is showing.
      // https://shopify.dev/docs/api/ajax/reference/cart
      const cart = await get(new URL(`${shop.root}/cart.js`), cfg);
      currency = cart.fail ? null : code(parseJson(cart.text)?.currency);
    }
    Object.assign(out, {
      method, price: r2(c.price), currency, shipping: c.shipping, availability: c.availability, condition: c.condition,
      title: id.title, brand: c.brand, gtin: c.gtin, mpn: c.mpn, sku: c.sku, match_by: id.by, match_score: id.score,
    });

    if (!currency) return end('currency_mismatch', 'the page does not say which currency its price is in');
    if (currency !== mine.currency) return end('currency_mismatch', `the price on that page is in ${currency}, not in ${mine.currency ?? 'this store\'s currency'}`);
    if (NOT_BUYABLE.has(c.availability)) return end('out_of_stock', NOT_BUYABLE.get(c.availability));
    if (c.condition && c.condition !== 'new') return end('not_new', ['used', 'refurbished', 'damaged'].includes(c.condition) ? `that offer is for a ${c.condition} item, not a new one` : null);
    if (!id.by) return end('different_product');
    // A price far under ours is more likely a different item, a part or a mistake than a real offer.
    if (!(mine.list > 0) || c.price < ratio * mine.list - 1e-9) return end('implausible_price');
    return end('ok', `${out.domain} lists ${id.by === 'title' ? 'a product with a matching name' : 'the same product'} at ${out.price} ${currency}`);
  } catch {
    return end('fetch_failed', 'the page could not be checked');
  } finally {
    clearTimeout(timer);
  }
}
