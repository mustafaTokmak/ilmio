// The HTML doors. Every export takes ctx = { url, request, env, shop, service,
// hooks, origin, prefix } and returns a Response. Three kinds of page:
//   the offer desk as plain pages (/offer) that work with no script,
//   "Powder Lab" (/demo), the stand-in storefront agents are sent to shop in,
//   "Peak Boards" (/rival), a second shop whose pages serve as competing-offer links.
// Powder Lab is also the control arm of the experiment: with no discovery hook
// active its pages say nothing about the desk, so no shop markup, class name or
// style here may carry a word of it. scripts/check-pages.mjs holds that line.

import { PRIORITIES } from './policy.js';
import { shopConfig, listProducts, mandateFor } from './mandates.js';
import { dryAdapter } from './settle.js';
import { doStore } from './store.js';

const DEMO = 'demo';
const HOOKS = ['box', 'desc', 'jsonld', 'webmcp', 'policy'];
// Quoted in the documents below. They mirror the service defaults.
const LIMITS = { offer_minutes: 30, code_minutes: 60, requests_per_product_per_hour: 3, link_checks_per_product_per_hour: 1 };
// Seller-only keys, the same list the MCP door stops. The log page has a public address.
const PRIVATE = new Set(['seller_cost', 'unit_cost', 'cost', 'floor', 'budget', 'budget_per_order', 'room', 'pace']);

const r2 = x => Math.round(x * 100) / 100;
const num = x => (x === null || x === undefined || x === '' || !Number.isFinite(Number(x)) ? null : Number(x));
const arr = x => (Array.isArray(x) ? x : []);
const str = (x, max = 500) => (typeof x === 'string' || typeof x === 'number' ? String(x).trim().slice(0, max) : '');

// --- markup ----------------------------------------------------------------

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = x => String(x).replace(/[&<>"']/g, c => ESC[c]);

// Markup built in this file. Anything else that reaches a template is text and
// is escaped there, so a value from a request or from the service cannot turn
// into markup because someone forgot a call.
class Markup {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
const flat = v => (v instanceof Markup ? v.s : Array.isArray(v) ? v.map(flat).join('') : v === null || v === undefined || v === false || v === true ? '' : esc(v));
const html = (strings, ...values) => new Markup(strings.reduce((out, s, i) => out + flat(values[i - 1]) + s));

// JSON inside a script element: nothing in it may end the element or open a comment.
const ld = data => new Markup(`<script type="application/ld+json">${JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)}</script>\n`);

const SIGN = { USD: '$', GBP: '£', EUR: '€' };
function money(x, cur = 'USD') {
  const n = num(x);
  if (n === null) return '';
  const digits = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? '-' : ''}${SIGN[cur] ?? ''}${digits}${SIGN[cur] ? '' : ` ${cur}`}`;
}

// A moment the service named, as a <time> and how far away it is.
function until(x, now = Date.now()) {
  const d = new Date(typeof x === 'number' && x < 1e11 ? x * 1000 : x);
  if (x === null || x === undefined || x === '' || Number.isNaN(d.getTime())) return '';
  const mins = Math.round((d.getTime() - now) / 60000);
  const away = mins > 1 ? ` (in about ${mins} minutes)` : mins >= 0 ? ' (in about a minute)' : ' (passed)';
  return html`<time datetime="${d.toISOString()}">${d.toISOString().slice(0, 16).replace('T', ' ')} UTC</time>${away}`;
}

const days = n => `${n} ${n === 1 ? 'day' : 'days'}`;

// Whatever shape a piece of a reply has, as plain sentences. An object that
// names a thing (and perhaps how it comes about) is one sentence, or two.
function sentences(v) {
  if (v === null || v === undefined || v === '') return [];
  if (typeof v !== 'object') return [String(v)];
  if (Array.isArray(v)) return v.flatMap(sentences);
  const said = ['text', 'label', 'headline', 'what'].map(key => v[key]).find(x => typeof x === 'string' && x);
  if (said) return [typeof v.how === 'string' && v.how ? `${/[.!?]$/.test(said) ? said : `${said}.`} ${v.how}` : said];
  return Object.entries(v).flatMap(([k, x]) => sentences(x).map(s => `${k.replace(/_/g, ' ')}: ${s}`));
}

// A link the service handed over is shown as a link only when it is one. A
// path on this site gets the proxy prefix it was written without, and the
// hooks switch the request carried.
function safeUrl(ctx, u) {
  const s = str(u, 2000);
  if (/^\/(?![/\\])/.test(s)) {
    const p = prefixOf(ctx);
    const path = p && !s.startsWith(`${p}/`) ? p + s : s;
    const hooks = ctx.url.searchParams.get('hooks');
    return hooks === null || /[?&]hooks=/.test(path) ? path : `${path}${path.includes('?') ? '&' : '?'}hooks=${encodeURIComponent(hooks)}`;
  }
  try { return ['http:', 'https:'].includes(new URL(s).protocol) ? s : null; } catch { return null; }
}

// --- the request -----------------------------------------------------------

const originOf = ctx => String(ctx.origin || ctx.url.origin).replace(/\/+$/, '');
const prefixOf = ctx => String(ctx.prefix || '').replace(/\/+$/, '');
const hooked = (ctx, name) => (Array.isArray(ctx.hooks) ? ctx.hooks.includes(name) : !!ctx.hooks?.has?.(name));
const anyHook = ctx => HOOKS.some(h => hooked(ctx, h));

// The path the route saw: the proxy prefix is not part of it.
function route(ctx) {
  const p = prefixOf(ctx);
  const path = ctx.url.pathname;
  return p && path.startsWith(p) ? path.slice(p.length) || '/' : path;
}

// The one path segment after a route's fixed part, or '' when there is none.
function tail(ctx, base) {
  const path = route(ctx);
  if (!path.startsWith(base)) return '';
  try { return decodeURIComponent(path.slice(base.length).split('/')[0]); } catch { return ''; }
}

const query = params => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) if (v !== null && v !== undefined && v !== '') q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
};

// A link a person follows. It carries the proxy prefix always, and the hooks
// switch when the request set one, so an arm chosen in the URL survives a click.
function href(ctx, path, params) {
  const hooks = ctx.url.searchParams.get('hooks');
  const q = query(params);
  return `${prefixOf(ctx)}${path}${q}${hooks === null ? '' : `${q ? '&' : '?'}hooks=${encodeURIComponent(hooks)}`}`;
}
// GET forms replace the query of their action, so the switch rides along as a field.
const carry = ctx => (ctx.url.searchParams.has('hooks') ? html`<input type="hidden" name="hooks" value="${ctx.url.searchParams.get('hooks')}">` : '');
// An address written down for a program or quoted in text: absolute, nothing extra.
const address = (ctx, path, params) => `${originOf(ctx)}${prefixOf(ctx)}${path}${query(params)}`;

// Posted fields as a plain object. A worker that already read the body hands
// it over as ctx.body; otherwise it is read here from a copy of the request.
async function posted(ctx) {
  const given = ctx.body ?? ctx.form;
  if (given && typeof given === 'object') return typeof given.entries === 'function' ? Object.fromEntries(given.entries()) : given;
  const req = ctx.request;
  if (!req || req.bodyUsed || req.method === 'GET' || req.method === 'HEAD') return {};
  try {
    if ((req.headers.get('content-type') || '').includes('json')) {
      const v = await req.clone().json();
      return v && typeof v === 'object' ? v : {};
    }
    return Object.fromEntries((await req.clone().formData()).entries());
  } catch { return {}; }
}

// The worker's store, for the two pages that read it directly: handed over as
// ctx.store, or else the one Durable Object every shop shares.
const storeOf = ctx => (ctx.store && typeof ctx.store === 'object' ? ctx.store : ctx.env?.OFFERS ? doStore(ctx.env) : null);

// Who is asking, for the service's rate limits. The worker's own answer wins;
// without one the page door falls back to address plus browser, hashed.
async function who(ctx) {
  if (ctx.session) return { session: ctx.session, client: ctx.client ?? null };
  const h = ctx.request?.headers;
  const ip = h?.get('cf-connecting-ip') || (h?.get('x-forwarded-for') || '').split(',')[0].trim() || '';
  const ua = h?.get('user-agent') || '';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}|${ua}`));
  const id = [...new Uint8Array(digest)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
  return { session: `page:${id}`, client: ctx.client ?? { ip: ip || null, user_agent: ua.slice(0, 200) || null, door: 'page' } };
}

// --- responses and layout --------------------------------------------------

const HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'content-security-policy': "base-uri 'none'; object-src 'none'; form-action 'self'",
};
// Documents for programs: readable from any origin, safe to keep for a while.
const OPEN = { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff' };
const send = (body, status = 200, headers = {}) => new Response(String(body), { status, headers: { ...HEADERS, ...headers } });
const sendJson = data => new Response(`${JSON.stringify(data, null, 2)}\n`, { headers: { 'content-type': 'application/json; charset=utf-8', ...OPEN } });

// Light only: a page a person reads keeps its colours whatever the system theme is.
const CSS = `
:root{color-scheme:light only;--ink:#16222c;--soft:#566574;--line:#d8e0e7;--bg:#ffffff;--tint:#f2f6f9;--accent:#0a5ea8;--good:#10693d;--bad:#a12b1f}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--accent)}
h1{font-size:1.9rem;line-height:1.2;margin:0 0 .5rem}
h2{font-size:1.25rem;margin:1.6rem 0 .5rem}
h3{font-size:1.1rem;margin:0 0 .25rem}
p{margin:.5rem 0}
.wrap{max-width:1040px;margin:0 auto;padding:0 20px}
.narrow{max-width:760px}
.top{border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;gap:8px 24px;min-height:64px;flex-wrap:wrap}
.name{font-weight:700;font-size:1.3rem;color:var(--ink);text-decoration:none}
.top ul{display:flex;gap:20px;list-style:none;margin:0;padding:0;flex-wrap:wrap}
main{display:block;padding-top:28px;padding-bottom:48px}
.foot{border-top:1px solid var(--line);color:var(--soft);font-size:.92rem;padding:20px 0 32px}
.muted{color:var(--soft)}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.price{font-size:1.5rem;font-weight:700;margin:.25rem 0}
.button,button{display:inline-block;background:var(--accent);color:#fff;border:1px solid var(--accent);border-radius:8px;padding:.65rem 1.2rem;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}
.quiet{background:var(--tint);color:var(--ink);border-color:var(--line)}
input[type=number],input[type=text],input[type=url],select{font:inherit;padding:.55rem .65rem;border:1px solid #8a99a8;border-radius:8px;background:#fff;color:var(--ink);max-width:100%}
input[type=url]{width:100%}
label,legend{font-weight:600}
fieldset{border:1px solid var(--line);border-radius:10px;margin:1rem 0;padding:.6rem 1rem .8rem}
.field{margin:1rem 0}
.field label,.hint{display:block}
.hint{color:var(--soft);font-size:.92rem;font-weight:400}
.choice{display:block;font-weight:400;margin:.35rem 0}
.callout{background:var(--tint);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin:14px 0}
.callout h2{margin-top:0}
table{border-collapse:collapse;width:100%}
th,td{text-align:left;padding:.6rem .5rem;border-bottom:1px solid var(--line);vertical-align:top;font-weight:400}
thead th{font-weight:600;color:var(--soft);font-size:.92rem}
.num{text-align:right;white-space:nowrap}
.sums{display:grid;grid-template-columns:1fr auto;gap:.35rem 1.5rem;margin:1rem 0}
.sums dt{color:var(--soft)}
.sums dd{margin:0;text-align:right;white-space:nowrap}
.sums .total{font-weight:700;color:var(--ink);font-size:1.15rem;border-top:1px solid var(--line);padding-top:.5rem}
.good{color:var(--good)}
.bad{color:var(--bad)}
.panel{border:1px solid var(--line);border-radius:12px;padding:16px 18px;background:#fff}
.panel h2,.panel h3{margin-top:0}
.stack{display:grid;gap:16px}
.inline{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow-wrap:anywhere}
.big{font-size:1.6rem;font-weight:700;letter-spacing:.04em}
`;
const SHOP_CSS = `
.hero{background:var(--tint);border-radius:14px;padding:28px;margin-bottom:28px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:20px;list-style:none;margin:0;padding:0}
.card{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}
.card .text{padding:12px 14px 16px}
.art{background:var(--tint);border-radius:14px}
.card .art{border-radius:0}
.art svg{display:block;width:100%;height:auto}
.product{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:32px;align-items:start;margin-top:16px}
.cols{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:32px;align-items:start}
@media (max-width:800px){.product,.cols{grid-template-columns:1fr}}
.specs{display:grid;grid-template-columns:auto 1fr;gap:.25rem 1.25rem;margin:.5rem 0}
.specs dt{color:var(--soft)}
.specs dd{margin:0}
.buy{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin:1rem 0}
.buy label{display:block}
.buy input,td input{width:5.5rem}
`;
const RIVAL_CSS = `
:root{--ink:#2a1f17;--soft:#6e5f52;--line:#e6d9cc;--tint:#fbf3ea;--accent:#a8400f}
h1,h2,.name{font-family:Georgia,"Times New Roman",serif}
.top{background:var(--tint)}
`;

function page(title, styles, head, body) {
  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${title}</title>
${new Markup(`<style>${styles}</style>`)}
${head}</head>
<body>
${body}</body>
</html>
`;
}

// --- the offer desk --------------------------------------------------------

const OFFER_KINDS = {
  for_your_priority: 'Built for your priority',
  default: 'Our offer',
  alternative: 'Another way',
  price_matched: 'Price matched',
  price_beaten: 'Price beaten',
  cannot_match_best_effort: 'Our best on price',
  value_instead_of_price: 'Value instead of a lower price',
};

// Where a shop's own pages live: the stand-in storefront is served here, a real store has its domain.
const storeHome = (ctx, shop) => (shop.storefront ? shop.storefront : href(ctx, '/demo'));
const productPage = (ctx, shop, handle) => (shop.storefront ? `${shop.storefront}/products/${handle}` : href(ctx, `/demo/products/${handle}`));
const productAddress = (ctx, shop, handle) => (shop.storefront ? `${shop.storefront}/products/${handle}` : address(ctx, `/demo/products/${handle}`));

function deskPage(ctx, { title, body, status = 200 }) {
  const shop = shopConfig(ctx.shop);
  const name = shop?.name || 'This store';
  return send(page(`${title} | ${name}`, CSS, '', html`<header class="top"><div class="wrap narrow">
<a class="name" href="${shop ? storeHome(ctx, shop) : href(ctx, '/offer')}">${name}</a>
<span class="muted">Offer desk</span>
</div></header>
<main class="wrap narrow">
${body}</main>
<footer class="foot"><div class="wrap narrow">
<p>This desk is run for the seller by OfferAd, within limits the merchant set. Nothing is bought here: buying happens in the store's own checkout. The page uses no script, no cookies and no tracking.</p>
</div></footer>
`), status);
}

const noDesk = ctx => deskPage(ctx, { status: 404, title: 'No offer desk here', body: html`<h1>No offer desk here</h1>
<p>This store does not use OfferAd, so there is nothing to ask for at this address. Its listed prices and terms are what apply.</p>
` });

const broke = (ctx, e) => {
  const ref = crypto.randomUUID().slice(0, 8);
  console.error(`offerad page ${ref}`, e);
  return deskPage(ctx, { status: 502, title: 'No answer just now', body: html`<h1>The store could not answer just now</h1>
<p>Nothing was bought or charged, and asking again is safe. Reference ${ref}.</p>
<p><a href="${href(ctx, '/offer')}">Back to the form</a></p>
` });
};

// The form fields as the door reads them: text in, typed values and plain complaints out.
function askValues(raw) {
  const problems = [];
  const v = { product: str(raw.product), priority: '', quantity: 1, need_by_days: null, competing_offer_url: '' };
  const priority = str(raw.priority, 40).toLowerCase().replace(/[\s-]+/g, '_');
  if (PRIORITIES[priority]) v.priority = priority;
  const quantity = str(raw.quantity, 12);
  if (quantity) {
    if (/^\d{1,4}$/.test(quantity) && Number(quantity) >= 1) v.quantity = Number(quantity);
    else problems.push('Quantity is a whole number, 1 or more.');
  }
  const need = str(raw.need_by_days, 12);
  if (need) {
    if (/^\d{1,3}(\.\d+)?$/.test(need)) v.need_by_days = Number(need);
    else problems.push('Days to wait is a number, 0 or more.');
  }
  const link = str(raw.competing_offer_url, 2000);
  if (link) {
    v.competing_offer_url = link;
    let ok = false;
    try { ok = ['http:', 'https:'].includes(new URL(link).protocol); } catch { /* not a link */ }
    if (!ok) problems.push('The link to the other shop starts with https://.');
  }
  return { v, problems };
}

// What the store says it can offer on a product: the service's options(), which
// names kinds and never amounts. A door that cannot ask shows the form without it.
async function optionsFor(ctx, product) {
  try {
    const reply = await ctx.service?.options?.({ shop: ctx.shop, product, ...(await who(ctx)) });
    return reply?.status === 'ok' ? reply : null;
  } catch (e) {
    console.error('offerad page: options', e);
    return null;
  }
}

function askForm(ctx, shop, v, { problems = [], options = null } = {}) {
  const m = v.product ? mandateFor(ctx.shop, v.product) : null;
  const cur = shop.currency;
  const { standard } = shop.shipping;
  const kinds = arr(options?.can_offer).map(k => str(k?.what, 200)).filter(Boolean);
  const links = options?.competing_offers ?? { accepted: !!(m ?? shop).price_match?.on };
  const counted = arr(links.shops_that_count_in_full).map(d => str(d, 80)).filter(Boolean);
  const picked = v.priority || '';
  const product = m
    ? html`<section class="callout" aria-labelledby="item">
<h2 id="item">${m.product.title}</h2>
<p>Listed price ${money(m.product.list, cur)}. Standard delivery in ${days(standard.days)} for ${money(standard.price, cur)}.</p>
<p><a href="${productPage(ctx, shop, m.product.handle)}">See the product page</a></p>
</section>
<input type="hidden" name="product" value="${m.product.handle}">
`
    : html`${v.product ? html`<p class="bad" role="alert">We could not find that product in this store. Pick one below.</p>\n` : ''}<div class="field">
<label for="product">Product</label>
<select id="product" name="product" required>
<option value="">Choose a product</option>
${listProducts(ctx.shop).map(x => html`<option value="${x.product.handle}">${x.product.title} (${money(x.product.list, cur)})</option>\n`)}</select>
</div>
`;
  return html`${problems.length ? html`<ul class="bad" role="alert">${problems.map(p => html`<li>${p}</li>`)}</ul>\n` : ''}<form method="post" action="${href(ctx, '/offer')}">
<input type="hidden" name="shop" value="${ctx.shop}">
${product}${kinds.length ? html`<p>On this product the store can offer:</p>
<ul>${kinds.map(k => html`<li>${k}</li>`)}</ul>
` : ''}<p>Asking is free, nothing is bought or reserved, and no name, email or payment detail is needed.</p>
<fieldset>
<legend>What matters most for this purchase?</legend>
<label class="choice"><input type="radio" name="priority" value=""${picked ? '' : new Markup(' checked')}> Not sure yet</label>
${Object.entries(PRIORITIES).map(([id, label]) => html`<label class="choice"><input type="radio" name="priority" value="${id}"${picked === id ? new Markup(' checked') : ''}> ${label}</label>\n`)}</fieldset>
<div class="field">
<label for="quantity">Quantity</label>
<input id="quantity" name="quantity" type="number" min="1" step="1" value="${v.quantity ?? 1}" required>
</div>
<div class="field">
<label for="need_by_days">Days you can wait for delivery (optional)</label>
<input id="need_by_days" name="need_by_days" type="number" min="0" step="1" value="${v.need_by_days ?? ''}">
</div>
${links.accepted ? html`<div class="field">
<label for="competing_offer_url">Link to the same product for less at another shop (optional)</label>
<input id="competing_offer_url" name="competing_offer_url" type="url" inputmode="url" autocomplete="off" placeholder="https://" value="${v.competing_offer_url ?? ''}" aria-describedby="link-hint">
<span class="hint" id="link-hint">The store opens the link itself and checks that it is the same product, new, in stock and really cheaper. Nothing said about the page is taken on trust.${counted.length ? ` Prices at these shops count in full: ${counted.join(', ')}.` : ''}${str(links.other_shops, 200) ? ` ${str(links.other_shops, 200)}` : ''}</span>
</div>
` : ''}<button type="submit">Ask for an offer</button>
</form>
`;
}

const forSoftware = ctx => html`<section aria-labelledby="software">
<h2 id="software">For software</h2>
<p>The same desk answers programs, on the same terms: free to ask, nothing bought.</p>
<ul>
<li>MCP server (Streamable HTTP): <code>${address(ctx, '/mcp')}</code></li>
<li>JSON over HTTP: <code>POST ${address(ctx, '/api/offers/request')}</code>, described in <a href="${href(ctx, '/openapi.json')}">openapi.json</a></li>
<li>In plain words: <a href="${href(ctx, '/llms.txt')}">llms.txt</a></li>
</ul>
</section>
`;

export async function offerForm(ctx) {
  const shop = shopConfig(ctx.shop);
  if (!shop) return noDesk(ctx);
  const { v } = askValues(Object.fromEntries(ctx.url.searchParams.entries()));
  const options = v.product && mandateFor(ctx.shop, v.product) ? await optionsFor(ctx, v.product) : null;
  return deskPage(ctx, { title: 'Ask for an offer', body: html`<h1>Ask ${shop.name} for an offer</h1>
<p>The listed price is not always the last word. Say what matters most to you and the store answers with one to three concrete offers: a lower price, or something else of value.</p>
${askForm(ctx, shop, v, { options })}${forSoftware(ctx)}` });
}

function offerCard(ctx, o, i, fallbackCur) {
  const cur = o.currency || fallbackCur;
  const parts = arr(o.components).map(c => str(c?.label)).filter(Boolean);
  const qty = num(o.quantity) ?? 1;
  const id = str(o.offer_id, 200);
  const title = str(o.headline) || parts.join(' + ') || 'Offer';
  const row = (label, value, cls) => (value === '' || value === null ? '' : html`<dt${cls ? new Markup(` class="${cls}"`) : ''}>${label}</dt><dd${cls ? new Markup(` class="${cls}"`) : ''}>${value}</dd>\n`);
  return html`<article class="panel" aria-labelledby="offer-${i}">
<p class="muted">${OFFER_KINDS[o.kind] || 'Offer'}</p>
<h3 id="offer-${i}">${title}</h3>
${parts.length > 1 ? html`<ul>${parts.map(p => html`<li>${p}</li>`)}</ul>\n` : ''}<dl class="sums">
${row(`Items (${qty} × ${money(o.unit_price, cur)})`, money(o.items_total, cur))}${row('Shipping', num(o.shipping_total) === 0 ? 'Free' : money(o.shipping_total, cur))}${row('Total', money(o.total, cur), 'total')}${row('Listed total', money(o.list_total, cur))}${num(o.you_save) > 0 ? row('You save', money(o.you_save, cur)) : ''}${num(o.extras_value) > 0 ? row('Extras worth', money(o.extras_value, cur)) : ''}${num(o.ship_days) === null ? '' : row('Delivery', days(num(o.ship_days)))}${row('Open until', until(o.expires_at))}</dl>
${id ? html`<form method="post" action="${href(ctx, '/offer/accept')}">
<input type="hidden" name="shop" value="${ctx.shop}">
<input type="hidden" name="offer_id" value="${id}">
<label class="choice"><input type="checkbox" name="user_approved" value="true" required> The buyer has seen this offer and agrees to it</label>
<button type="submit">Accept this offer<span class="vh">: ${title}</span></button>
</form>
` : ''}</article>
`;
}

// What the store found behind a competing-offer link, in the service's own terms.
function proofLines(p, cur) {
  if (!p || typeof p !== 'object') return [];
  return [
    str(p.domain) && `Shop checked: ${str(p.domain)}.`,
    num(p.their_price) !== null && `Their price: ${money(p.their_price, cur)}.`,
    typeof p.compared === 'string' && p.compared && `Compared: ${p.compared}.`,
    typeof p.accepted === 'boolean' && (p.accepted ? 'The link was accepted as proof.' : 'The link was not accepted as proof.'),
  ].filter(Boolean);
}

export async function offerResult(ctx) {
  const shop = shopConfig(ctx.shop);
  if (!shop) return noDesk(ctx);
  const { v, problems } = askValues(await posted(ctx));
  if (!v.product) problems.unshift('Pick a product first.');
  if (problems.length) {
    return deskPage(ctx, { status: 400, title: 'Ask for an offer', body: html`<h1>Ask ${shop.name} for an offer</h1>
${askForm(ctx, shop, v, { problems })}` });
  }
  let reply;
  try {
    reply = await ctx.service.request({
      shop: ctx.shop, product: v.product, quantity: v.quantity, priority: v.priority || undefined,
      need_by_days: v.need_by_days ?? undefined, competing_offer_url: v.competing_offer_url || undefined, ...(await who(ctx)),
    });
  } catch (e) { return broke(ctx, e); }
  if (!reply || typeof reply !== 'object') return broke(ctx, new Error('request returned no reply'));

  const m = mandateFor(ctx.shop, v.product);
  const cur = str(reply.currency, 3) || shop.currency;
  const offers = arr(reply.offers);
  const title = m?.product.title || str(reply.product?.title ?? reply.product) || 'this product';
  const said = [reply.reason, reply.message, reply.error].map(x => str(x, 600)).filter(Boolean);
  const checked = [...arr(reply.notes).flatMap(sentences), ...proofLines(reply.proof, cur)];
  const question = str(reply.question?.text ?? reply.question, 400);
  const heads = {
    price_matched: 'The price is matched', price_beaten: 'The price is beaten', cannot_match_best_effort: 'The store cannot go that low. This is its best',
    unavailable: 'Not available in that quantity', slow_down: 'Too many requests for now', no_offer: 'No offer this time',
  };
  const heading = heads[reply.status] || (offers.length ? `${offers.length === 1 ? 'An offer' : 'Offers'} on ${title}` : 'No offer this time');
  return deskPage(ctx, { title: heading, body: html`<h1>${heading}</h1>
<p class="muted">${title}${v.quantity > 1 ? `, ${v.quantity} pieces` : ''}${v.priority ? `. Priority: ${PRIORITIES[v.priority].toLowerCase()}` : ''}.</p>
${said.map(s => html`<p role="status">${s}</p>\n`)}${checked.length ? html`<section aria-labelledby="checked">
<h2 id="checked">What was checked</h2>
<ul>${checked.map(n => html`<li>${n}</li>`)}</ul>
</section>
` : ''}${offers.length ? html`<section aria-labelledby="offers">
<h2 id="offers">${offers.length === 1 ? 'The offer' : `The ${offers.length} offers`}</h2>
<p>Accepting prepares your offer for checkout. It does not place an order or charge you.</p>
<div class="stack">
${offers.map((o, i) => offerCard(ctx, o, i + 1, cur))}</div>
</section>
` : !said.length && !checked.length ? html`<p>The store has no offer on this product right now. Its listed price and terms apply.</p>\n` : ''}${str(reply.next, 600) ? html`<p><strong>Next:</strong> ${str(reply.next, 600)}</p>\n` : ''}<section aria-labelledby="again">
<h2 id="again">Ask again</h2>
${question ? html`<p>${question}</p>\n` : ''}${askForm(ctx, shop, v)}</section>
` });
}

export async function offerAccepted(ctx) {
  const shop = shopConfig(ctx.shop);
  if (!shop) return noDesk(ctx);
  const f = await posted(ctx);
  const offerId = str(f.offer_id, 200);
  // Approval is never guessed: the ticked box sends "true", and only that counts.
  const approved = f.user_approved === true || f.user_approved === 'true';
  if (!offerId) {
    return deskPage(ctx, { status: 400, title: 'No offer chosen', body: html`<h1>No offer chosen</h1>
<p>An offer is accepted from the page that lists it. <a href="${href(ctx, '/offer')}">Ask for an offer</a> first.</p>
` });
  }
  let reply;
  try {
    reply = await ctx.service.accept({ shop: ctx.shop, offer_id: offerId, user_approved: approved, ...(await who(ctx)) });
  } catch (e) { return broke(ctx, e); }
  if (!reply || typeof reply !== 'object') return broke(ctx, new Error('accept returned no reply'));

  const said = [reply.reason, reply.message, reply.error].map(x => str(x, 600)).filter(Boolean);
  if (reply.status === 'needs_approval') {
    return deskPage(ctx, { title: 'One thing first', body: html`<h1>One thing first</h1>
${said.length ? said.map(s => html`<p role="status">${s}</p>\n`) : html`<p role="status">A code is issued only when the buyer has seen the offer and agreed to it.</p>\n`}<form method="post" action="${href(ctx, '/offer/accept')}">
<input type="hidden" name="shop" value="${ctx.shop}">
<input type="hidden" name="offer_id" value="${offerId}">
<label class="choice"><input type="checkbox" name="user_approved" value="true" required> The buyer has seen this offer and agrees to it</label>
<button type="submit">Accept this offer</button>
</form>
` });
  }
  const codes = arr(reply.codes).map(c => str(c, 80)).filter(Boolean);
  const invoice = reply.settlement === 'draft' ? safeUrl(ctx, reply.invoice_url) : null;
  if (reply.status === 'accepted' && invoice) {
    const cur = str(reply.terms?.currency, 3) || shop.currency;
    const parts = arr(reply.terms?.components).map(c => str(c?.label)).filter(Boolean);
    return deskPage(ctx, { title: 'Offer accepted', body: html`<h1>Offer accepted</h1>
<p>Your price, items and shipping are applied to this checkout. No discount code is needed.</p>
${parts.length ? html`<ul>${parts.map(t => html`<li>${t}</li>`)}</ul>` : ''}
${num(reply.terms?.total) === null ? '' : html`<p>Quoted items and shipping: <strong>${money(reply.terms.total, cur)}</strong>. Review taxes and the final total in checkout before paying.</p>`}
<p><a class="button" href="${invoice}">Review this offer in checkout</a></p>
${sentences(reply.after_purchase).length ? html`<h2>After the order is placed</h2><ul>${sentences(reply.after_purchase).map(t => html`<li>${t}</li>`)}</ul>` : ''}
${sentences(reply.notes).map(n => html`<p>${n}</p>`)}
<p class="muted">Nothing has been bought or charged. This checkout link has no automatic timed expiry.</p>
` });
  }
  if (reply.status === 'not_deliverable' && arr(reply.alternatives).length) {
    return deskPage(ctx, { title: 'Choose another offer', body: html`<h1>Choose another offer</h1>
${said.map(t => html`<p role="status">${t}</p>`)}
<p>The original terms could not be prepared for checkout. These are different offers; review and approve one to continue.</p>
<div class="stack">${reply.alternatives.map((offer, i) => offerCard(ctx, offer, i + 1, shop.currency))}</div>
<p>Nothing was bought or charged.</p>
` });
  }
  if (reply.status !== 'accepted' || !codes.length) {
    return deskPage(ctx, { title: 'No code this time', body: html`<h1>No code was issued</h1>
${said.length ? said.map(s => html`<p role="status">${s}</p>\n`) : html`<p role="status">The store could not turn this offer into a code. It may have expired.</p>\n`}${str(reply.next, 600) ? html`<p>${str(reply.next, 600)}</p>\n` : ''}<p>Nothing was bought or charged. <a href="${href(ctx, '/offer')}">Ask for a new offer</a>.</p>
` });
  }
  const cart = safeUrl(ctx, reply.cart_url);
  const parts = arr(reply.terms?.components).map(c => str(c?.label)).filter(Boolean);
  const terms = parts.length ? parts : sentences(reply.terms);
  const cur = str(reply.terms?.currency, 3) || shop.currency;
  const later = sentences(reply.after_purchase);
  const notes = sentences(reply.notes);
  const ways = [
    ['In the store\'s cart and checkout tools', str(reply.apply?.ucp, 900)],
    ['In a browser on the store\'s site', str(reply.apply?.webmcp, 900)],
    ['As a link', str(reply.apply?.link, 900)],
  ].filter(([, text]) => text);
  return deskPage(ctx, { title: 'Offer accepted', body: html`<h1>Offer accepted</h1>
<p>${codes.length === 1 ? 'This is your discount code. It works' : 'These are your discount codes. Each works'} once, at ${shop.name}.</p>
<section class="callout" aria-labelledby="code">
<h2 id="code">${codes.length === 1 ? 'Discount code' : 'Discount codes'}</h2>
${codes.map(c => html`<p class="big"><code>${c}</code></p>\n`)}${until(reply.expires_at) ? html`<p>Valid until ${until(reply.expires_at)}.</p>\n` : ''}${cart ? html`<p><a class="button" href="${cart}">Open the cart with the code applied</a></p>\n` : ''}</section>
${terms.length ? html`<section aria-labelledby="terms">
<h2 id="terms">What it does</h2>
<ul>${terms.map(t => html`<li>${t}</li>`)}</ul>
${num(reply.terms?.total) === null ? '' : html`<p>Total with the code: <strong>${money(reply.terms.total, cur)}</strong>${num(reply.terms.list_total) === null ? '' : `, against ${money(reply.terms.list_total, cur)} at the listed price`}.</p>\n`}${notes.map(n => html`<p>${n}</p>\n`)}</section>
` : ''}${later.length ? html`<section aria-labelledby="later">
<h2 id="later">After the order is placed</h2>
<ul>${later.map(t => html`<li>${t}</li>`)}</ul>
</section>
` : ''}${ways.length ? html`<section aria-labelledby="ways">
<h2 id="ways">Ways to use the code</h2>
<dl>${ways.map(([label, text]) => html`<dt><strong>${label}</strong></dt><dd>${text}</dd>`)}</dl>
</section>
` : ''}<p class="muted">Nothing has been bought. You complete the purchase in the store's checkout, or let the code expire.</p>
` });
}

// --- Powder Lab, the stand-in storefront ------------------------------------

// Shop-window words and colours. Prices and identifiers come from the mandates.
const WINDOW = {
  'the-complete-snowboard': {
    blurb: 'All-mountain, medium flex, 154 cm',
    colours: ['#0b3d63', '#56c2e6', '#f2f6f9'],
    text: [
      'The board we reach for when we can only bring one. A medium flex and a directional twin shape keep it steady at speed and easy to turn in tight trees.',
      'The sintered base holds wax well and stays fast on flat run-outs. It comes in one length, 154 cm. Bindings are sold separately.',
    ],
    specs: [['Length', '154 cm'], ['Flex', 'Medium'], ['Shape', 'Directional twin'], ['Base', 'Sintered']],
  },
  'the-videographer-snowboard': {
    blurb: 'Freeride, stiff flex, 158 cm',
    colours: ['#3b2a57', '#f2a33a', '#f7f3ee'],
    text: [
      'A stable freeride board for long lines and heavy days. The stiffer flex and setback stance keep the nose up in deep snow, and the tapered tail lets go when you want it to.',
      'Built for riders who spend more time beside the groomed runs than on them. 158 cm. Bindings are sold separately.',
    ],
    specs: [['Length', '158 cm'], ['Flex', 'Stiff'], ['Shape', 'Tapered directional'], ['Base', 'Sintered']],
  },
  'the-collection-snowboard-hydrogen': {
    blurb: 'Park and resort, soft flex, 152 cm',
    colours: ['#0f5b4c', '#9be0c4', '#f1f8f5'],
    text: [
      'A light, playful true twin for park laps and relaxed resort days. The softer flex forgives small mistakes and makes presses and butters easy.',
      'A good first board that stays fun as you improve. 152 cm. Bindings are sold separately.',
    ],
    specs: [['Length', '152 cm'], ['Flex', 'Soft to medium'], ['Shape', 'True twin'], ['Base', 'Extruded']],
  },
  'selling-plans-ski-wax': {
    kind: 'wax',
    blurb: 'All-temperature wax, 50 g',
    colours: ['#b6461e', '#f6c48d', '#fff7ee'],
    text: [
      'All-temperature wax for skis and snowboards. One 50 g bar is enough for three or four full coats.',
      'Rub it on for a quick fix at the lift, or iron it in at home for a base that stays fast for days.',
    ],
    specs: [['Weight', '50 g'], ['Use', 'Skis and snowboards'], ['Temperature', 'All conditions']],
  },
};

// The catalog as the shop window shows it: public product fields only.
const catalog = () => listProducts(DEMO).map(m => ({
  blurb: '', colours: ['#31506b', '#8fc7dd', '#f2f6f9'], text: [], specs: [], ...WINDOW[m.product.handle], ...m.product, stock: m.stock ?? 99,
}));

// Product pictures are drawn here, so no page needs an image from anywhere.
function picture(p, label) {
  const [a, b, c] = p.colours;
  const shape = p.kind === 'wax'
    ? html`<rect x="58" y="50" width="84" height="56" rx="8" fill="${a}"/><rect x="58" y="50" width="84" height="18" rx="8" fill="${b}"/><rect x="74" y="82" width="52" height="8" rx="4" fill="${c}"/>`
    : html`<g transform="rotate(-24 100 78)"><rect x="14" y="60" width="172" height="36" rx="18" fill="${a}"/><rect x="84" y="60" width="22" height="36" fill="${b}"/><rect x="112" y="60" width="8" height="36" fill="${c}"/><circle cx="58" cy="78" r="4" fill="${c}"/><circle cx="146" cy="78" r="4" fill="${c}"/></g>`;
  return html`<svg viewBox="0 0 200 156" ${label ? html`role="img" aria-label="${label}"` : new Markup('aria-hidden="true"')}>${shape}</svg>`;
}

// "45900666110115:2,45900666142883:1" as cart lines. A line names a variant
// id, a product id or a handle; whatever else is in the link is counted and left out.
function parseLines(text) {
  const all = catalog();
  const lines = [];
  let unknown = 0;
  for (const part of String(text ?? '').split(',').slice(0, 20).map(s => s.trim()).filter(s => s && s !== 'empty')) {
    const m = /^([a-z0-9-]{1,80})(?::(\d{1,3}))?$/i.exec(part);
    const p = m && all.find(x => x.variant_numeric_id === m[1] || x.id === m[1] || x.handle === m[1].toLowerCase());
    if (!p) { unknown++; continue; }
    const quantity = Math.min(99, Number(m[2] ?? 1));
    const had = lines.find(l => l.handle === p.handle);
    if (had) had.quantity = Math.min(99, had.quantity + quantity);
    else if (quantity > 0) lines.push({ ...p, quantity });
  }
  return { lines, unknown };
}

function parseCodes(text) {
  const codes = [];
  const bad = [];
  for (const raw of String(text ?? '').split(/[\s,]+/).filter(Boolean).slice(0, 5)) {
    const code = raw.toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(code)) bad.push(raw.slice(0, 40));
    else if (!codes.includes(code)) codes.push(code);
  }
  return { codes, bad };
}

const lineText = lines => lines.map(l => `${l.variant_numeric_id}:${l.quantity}`).join(',') || 'empty';
// A delivery method is part of a cart only once the visitor has picked one.
const picked = ship => (ship === 'express' || ship === 'standard' ? ship : null);
const cartHref = (ctx, cart, extra) => href(ctx, `/demo/cart/${lineText(cart.lines)}`, { discount: arr(cart.codes).join(','), ship: picked(cart.ship), ...extra });

// The cart a visitor left behind. The address of a cart page is the cart; the
// cookie only lets the header link and the next "Add to cart" find it again.
const COOKIE = 'pl_cart';
function remembered(ctx) {
  const pair = (ctx.request?.headers.get('cookie') || '').split(/;\s*/).find(c => c.startsWith(`${COOKIE}=`));
  let value = '';
  try { value = decodeURIComponent(pair ? pair.slice(COOKIE.length + 1) : ''); } catch { /* not ours */ }
  const [lines = '', codes = '', ship = ''] = value.split('|');
  return { lines: parseLines(lines).lines, codes: parseCodes(codes).codes, ship: picked(ship) };
}
const remember = (ctx, cart) => {
  const value = cart.lines.length ? encodeURIComponent(`${lineText(cart.lines)}|${arr(cart.codes).join(',')}|${picked(cart.ship) ?? ''}`) : '';
  return { 'set-cookie': `${COOKIE}=${value}; Path=${prefixOf(ctx)}/demo; SameSite=Lax; HttpOnly${ctx.url.protocol === 'https:' ? '; Secure' : ''}${value ? '' : '; Max-Age=0'}` };
};

function shopPage(ctx, { title, body, head = '', status = 200, headers, cart, product }) {
  const c = cart ?? remembered(ctx);
  const count = c.lines.reduce((a, l) => a + l.quantity, 0);
  // The storefront script loads where a theme app embed would put it, and never on checkout.
  const embed = hooked(ctx, 'webmcp') && route(ctx) !== '/demo/checkout'
    ? html`<script src="${prefixOf(ctx)}/embed.js" defer data-hook="webmcp" data-endpoint="${originOf(ctx)}${prefixOf(ctx)}" data-shop="${DEMO}"${product ? html` data-product="${product.handle}"` : ''}></script>\n`
    : '';
  return send(page(`${title ? `${title} | ` : ''}Powder Lab`, CSS + SHOP_CSS, head, html`<header class="top"><div class="wrap">
<a class="name" href="${href(ctx, '/demo')}">Powder Lab</a>
<nav aria-label="Main"><ul>
<li><a href="${href(ctx, '/demo')}">Shop</a></li>
<li><a href="${href(ctx, '/demo/policies')}">Shipping and returns</a></li>
<li><a href="${cartHref(ctx, c)}">Cart (${count})</a></li>
</ul></nav>
</div></header>
<main class="wrap">
${body}</main>
<footer class="foot"><div class="wrap">
<p>Powder Lab. Boards and wax for deep days.</p>
<p>This is a demonstration shop: checkout stops before payment and nothing is shipped.</p>
</div></footer>
${embed}`), status, headers);
}

const lost = ctx => shopPage(ctx, { status: 404, title: 'Page not found', body: html`<h1>We could not find that page</h1>
<p><a href="${href(ctx, '/demo')}">Back to the shop</a></p>
` });

export async function demoHome(ctx) {
  return shopPage(ctx, { title: 'Snowboards and wax', body: html`<section class="hero">
<h1>Boards and wax for deep days</h1>
<p>A small shop with a short list: three boards we ride ourselves and the wax we put on them.</p>
</section>
<section aria-labelledby="products">
<h2 id="products">Products</h2>
<ul class="grid">
${catalog().map(p => html`<li><article class="card">
<div class="art">${picture(p)}</div>
<div class="text">
<h3><a href="${href(ctx, `/demo/products/${p.handle}`)}">${p.title}</a></h3>
<p class="muted">${p.blurb}</p>
<p><strong>${money(p.list, p.currency)}</strong></p>
</div>
</article></li>
`)}</ul>
</section>
` });
}

// schema.org's pointer from a product to "ask for a quote on this".
const quoteAction = (ctx, p) => ({
  '@type': 'QuoteAction',
  name: 'Ask this store for an offer',
  description: 'The store answers with one to three concrete offers on this product: a lower price, free or faster shipping, a free add-on, longer returns or credit on a later order. Asking is free and nothing is bought.',
  target: [
    { '@type': 'EntryPoint', name: 'Web form', urlTemplate: address(ctx, '/offer', { product: p.handle }), httpMethod: 'GET', contentType: 'text/html' },
    {
      '@type': 'EntryPoint', name: 'JSON', urlTemplate: address(ctx, '/api/offers/request'), httpMethod: 'POST', encodingType: 'application/json', contentType: 'application/json',
      description: `POST JSON such as {"product":"${p.handle}","priority":"lowest_price"}. Described in ${address(ctx, '/openapi.json')}.`,
    },
  ],
});

const gtinKeys = gtin => (gtin ? { gtin, ...(String(gtin).length === 13 ? { gtin13: gtin } : {}) } : {});

export async function demoProduct(ctx) {
  const p = catalog().find(x => x.handle === tail(ctx, '/demo/products/').toLowerCase());
  if (!p) return lost(ctx);
  const shop = shopConfig(DEMO);
  const { standard, express } = shop.shipping;
  const cur = p.currency;
  const returns = shop.concessions?.extended_returns?.base_days ?? 30;
  const here = address(ctx, `/demo/products/${p.handle}`);
  const ask = address(ctx, '/offer', { product: p.handle });
  const head = hooked(ctx, 'jsonld') ? ld({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: p.text.join(' '),
    brand: { '@type': 'Brand', name: p.brand },
    ...(p.mpn ? { mpn: p.mpn } : {}),
    sku: p.sku || p.mpn || p.variant_numeric_id,
    ...gtinKeys(p.gtin),
    url: here,
    offers: {
      '@type': 'Offer',
      url: here,
      price: p.list.toFixed(2),
      priceCurrency: cur,
      availability: `https://schema.org/${p.stock > 0 ? 'InStock' : 'OutOfStock'}`,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: shop.name },
      shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: standard.price.toFixed(2), currency: cur } },
      hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: returns },
    },
    potentialAction: quoteAction(ctx, p),
  }) : '';
  return shopPage(ctx, { title: p.title, head, product: p, body: html`<nav aria-label="Breadcrumb" class="muted"><a href="${href(ctx, '/demo')}">Shop</a> / <span aria-current="page">${p.title}</span></nav>
<div class="product">
<div class="art">${picture(p, p.title)}</div>
<div>
<h1>${p.title}</h1>
<p class="muted">${p.brand}</p>
<p class="price">${money(p.list, cur)}</p>
${hooked(ctx, 'box') ? html`<aside class="callout" data-hook="box" aria-labelledby="ask">
<h2 id="ask">Ask this store for an offer</h2>
<p>Tell us what matters most to you (price, delivery speed, returns or an extra in the box) and we answer with a concrete offer. Seen it for less at another shop? Send us the link and we check it ourselves.</p>
<p><a class="button" href="${href(ctx, '/offer', { product: p.handle })}">Ask for an offer</a></p>
</aside>
` : ''}<p>${p.stock > 0 ? 'In stock.' : 'Sold out.'} Standard delivery in ${days(standard.days)} for ${money(standard.price, cur)}${express ? `, express in ${days(express.days)} for ${money(express.price, cur)}` : ''}. Returns within ${days(returns)}.</p>
${p.stock > 0 ? html`<form class="buy" method="get" action="${prefixOf(ctx)}/demo/cart/${p.variant_numeric_id}:1">
${carry(ctx)}<div><label for="quantity">Quantity</label>
<input id="quantity" name="quantity" type="number" min="1" max="${Math.min(p.stock, 99)}" step="1" value="1" required></div>
<button type="submit">Add to cart</button>
</form>
` : ''}<section aria-labelledby="about">
<h2 id="about">Description</h2>
${p.text.map(t => html`<p>${t}</p>\n`)}${hooked(ctx, 'desc') ? html`<p data-hook="desc">Shopping with an AI assistant? It can ask this store for an offer on this product (a lower price, free or faster shipping, or an extra in the box) at <a href="${ask}">${ask}</a>. Asking is free and nothing is bought.</p>
` : ''}</section>
<section aria-labelledby="details">
<h2 id="details">Details</h2>
<dl class="specs">
${[...p.specs, ['Brand', p.brand], ['Model', p.mpn], ['GTIN', p.gtin]].filter(([, value]) => value).map(([k, value]) => html`<dt>${k}</dt><dd>${value}</dd>\n`)}</dl>
</section>
</div>
</div>
` });
}

// The dry adapter owns the codes and prices a cart the way the checkout would.
// It is reached, in this order, as service.evaluateCart({ shop, codes, cart })
// (a function of two arguments is called like the adapter's own evaluate(codes,
// cart)), through ctx.adapterFor (the function the worker gave the service),
// or by reading the codes from the store the service minted them into.
async function evaluate(ctx, codes, cart) {
  const direct = ctx.service?.evaluateCart;
  if (typeof direct === 'function') return direct.length >= 2 ? direct.call(ctx.service, codes, cart) : direct.call(ctx.service, { shop: DEMO, codes, cart });
  const store = typeof ctx.adapterFor === 'function' ? null : storeOf(ctx);
  const adapter = store ? dryAdapter(store, { shop: DEMO }) : await ctx.adapterFor?.(DEMO, shopConfig(DEMO));
  return typeof adapter?.evaluate === 'function' ? adapter.evaluate(codes, cart) : null;
}

// What the codes do to a cart. The adapter answers { applied: [{ code, title,
// amount }], rejected: [{ code, reason_text }], deferred: [{ code, title }],
// notes, totals: { total, shipping_method } }. A code is on unless the adapter
// refused it, and a code nobody could check is off.
async function settle(ctx, cart, codes, rates) {
  let reply = null;
  try { reply = await evaluate(ctx, codes, cart); } catch (e) { console.error('offerad cart', e); }
  if (!reply || typeof reply !== 'object') reply = null;
  const rejected = arr(reply?.rejected).map(x => ({ code: str(x?.code, 80).toUpperCase(), reason: str(x?.reason_text ?? x?.reason, 200) })).filter(x => codes.includes(x.code));
  if (!reply) rejected.push(...codes.map(code => ({ code, reason: 'It could not be checked just now.' })));
  const on = codes.filter(code => !rejected.some(x => x.code === code));
  const part = x => ({ code: str(x?.code, 80).toUpperCase(), title: str(x?.title, 200), amount: Math.max(0, num(x?.amount) ?? 0) });
  const applied = arr(reply?.applied).map(part).filter(a => on.includes(a.code) && a.amount > 0);
  const later = arr(reply?.deferred).map(part).filter(d => on.includes(d.code) && d.title);
  const hints = arr(reply?.notes).map(n => str(n, 300)).filter(Boolean);
  const totals = reply?.totals && typeof reply.totals === 'object' ? reply.totals : {};
  // An offer with faster delivery ships express unless the visitor chose otherwise.
  const method = Object.hasOwn(rates, totals.shipping_method) ? totals.shipping_method : cart.shipping_method || 'standard';
  const off = r2(applied.reduce((a, x) => a + x.amount, 0));
  const own = r2(Math.max(0, cart.items_total + rates[method].price - off));
  const total = num(totals.total);
  // The rows have to add up whichever way a shipping saving is counted: as a
  // row of its own or inside the shipping total. Shipping is what is left.
  const shipping = total === null ? null : r2(total - cart.items_total + off);
  if (shipping === null || shipping < -0.005 || shipping > Math.max(...Object.values(rates).map(r => r.price)) + 0.005) {
    if (total !== null) console.warn('offerad cart: totals from the evaluation do not add up; showing the cart\'s own');
    return { on, applied, rejected, later, hints, method, shipping: r2(own - cart.items_total + off), total: own };
  }
  return { on, applied, rejected, later, hints, method, shipping: Math.max(0, shipping), total };
}

// With no hook active the shop is the control arm: a refusal worded by the
// desk is replaced by the shop's own plain one.
const DESK_WORDS = /offer|agent|negoti|price[\s-]*match/i;
function refusal(ctx, reason) {
  const text = String(reason || '').replace(/_/g, ' ').trim();
  if (!text || (!anyHook(ctx) && DESK_WORDS.test(text))) return 'It cannot be used on this cart.';
  return `${text[0].toUpperCase()}${text.slice(1)}${/[.!?]$/.test(text) ? '' : '.'}`;
}

// One cart, priced: lines at list price, the delivery method, and what the codes do.
async function basket(ctx, linesText, discount, shipKey) {
  const shop = shopConfig(DEMO);
  const rates = Object.fromEntries(['standard', 'express'].filter(k => shop.shipping[k]).map(k => [k, { price: shop.shipping[k].price, days: shop.shipping[k].days }]));
  const parsed = parseLines(linesText);
  const notes = [];
  const lines = parsed.lines.map(l => {
    const quantity = Math.min(l.quantity, Math.max(0, l.stock));
    if (quantity < l.quantity) notes.push(`${l.title}: quantity set to ${quantity}, the most we have.`);
    return { ...l, quantity, total: r2(l.list * quantity) };
  }).filter(l => l.quantity > 0);
  if (parsed.unknown) notes.push(parsed.unknown === 1 ? 'One item in this link is not sold here and was left out.' : `${parsed.unknown} items in this link are not sold here and were left out.`);
  const ship = Object.hasOwn(rates, picked(shipKey) ?? '') ? picked(shipKey) : null;
  const { codes, bad } = parseCodes(discount);
  const items = r2(lines.reduce((a, l) => a + l.total, 0));
  const cart = {
    shop: DEMO,
    currency: shop.currency,
    lines: lines.map(l => ({ variant_id: l.variant_id, variant_numeric_id: l.variant_numeric_id, handle: l.handle, title: l.title, quantity: l.quantity, price: l.list })),
    items_total: items,
    ...(ship ? { shipping_method: ship } : {}),
  };
  const rate = lines.length ? rates[ship || 'standard'].price : 0;
  const s = lines.length && codes.length
    ? await settle(ctx, cart, codes, rates)
    : { on: [], applied: [], rejected: [], later: [], hints: [], method: ship || 'standard', shipping: rate, total: r2(items + rate) };
  return { ...s, shop, rates, lines, notes, ship, codes, bad, items, currency: shop.currency, method: { handle: s.method, title: s.method === 'express' ? 'Express' : 'Standard', ...rates[s.method] } };
}

// Subtotal, what each code takes off, shipping and the total, as one list that adds up.
function sums(b) {
  const cur = b.currency;
  return html`<dl class="sums">
<dt>Subtotal</dt><dd>${money(b.items, cur)}</dd>
${b.applied.map(a => html`<dt>Discount <code>${a.code}</code>${a.title ? `: ${a.title}` : ''}</dt><dd class="good">${money(-a.amount, cur)}</dd>\n`)}<dt>Shipping (${b.method.title}, ${days(b.method.days)})</dt><dd>${b.shipping === 0 && b.lines.length ? 'Free' : money(b.shipping, cur)}</dd>
<dt class="total">Total</dt><dd class="total" data-total="${b.total.toFixed(2)}">${money(b.total, cur)}</dd>
</dl>
${b.later.length ? html`<p>Also with this order:</p>
<ul>${b.later.map(d => html`<li>${d.title}</li>`)}</ul>
` : ''}${b.hints.map(h => html`<p class="muted">${h}</p>\n`)}`;
}

export async function demoCart(ctx) {
  const q = ctx.url.searchParams;
  const asked = parseLines(tail(ctx, '/demo/cart/'));
  const go = cart => new Response(null, { status: 302, headers: { location: cartHref(ctx, cart), 'cache-control': 'no-store', ...remember(ctx, cart) } });

  // "Add to cart" lands here with one line and a quantity: it joins the cart
  // the visitor already has, and the address becomes that whole cart.
  if (q.has('quantity') && asked.lines.length === 1) {
    const had = remembered(ctx);
    const add = Math.min(99, Math.max(1, Math.round(num(q.get('quantity')) ?? 1)));
    const rest = had.lines.filter(l => l.handle !== asked.lines[0].handle);
    const same = had.lines.find(l => l.handle === asked.lines[0].handle);
    return go({ lines: [...rest, { ...asked.lines[0], quantity: Math.min(99, (same?.quantity ?? 0) + add) }], codes: had.codes, ship: had.ship });
  }
  // "Update cart" sends a quantity per line; zero takes the line out.
  if (asked.lines.some(l => q.has(`q_${l.variant_numeric_id}`))) {
    const lines = asked.lines.map(l => {
      const n = num(q.get(`q_${l.variant_numeric_id}`));
      return n === null ? l : { ...l, quantity: Math.min(99, Math.max(0, Math.round(n))) };
    }).filter(l => l.quantity > 0);
    return go({ lines, codes: parseCodes(q.get('discount')).codes, ship: q.get('ship') });
  }

  const b = await basket(ctx, tail(ctx, '/demo/cart/'), q.get('discount'), q.get('ship'));
  const cur = b.currency;
  const cart = { lines: b.lines, codes: b.codes, ship: b.ship };
  const said = [
    ...b.on.map(code => html`<li class="good"><code>${code}</code> is applied. <a href="${cartHref(ctx, { ...cart, codes: b.codes.filter(c => c !== code) })}">Remove<span class="vh"> code ${code}</span></a></li>`),
    ...b.rejected.map(x => html`<li class="bad"><code>${x.code}</code> is not applied. ${refusal(ctx, x.reason)}</li>`),
    ...b.bad.map(x => html`<li class="bad"><code>${x}</code> is not a discount code.</li>`),
  ];
  const body = !b.lines.length
    ? html`<h1>Your cart</h1>
${b.notes.map(n => html`<p role="status">${n}</p>\n`)}<p>Your cart is empty.</p>
<p><a class="button" href="${href(ctx, '/demo')}">Go to the shop</a></p>
`
    : html`<h1>Your cart</h1>
${b.notes.map(n => html`<p role="status">${n}</p>\n`)}<div class="cols">
<section aria-labelledby="items">
<h2 id="items" class="vh">Items</h2>
<form method="get" action="${prefixOf(ctx)}/demo/cart/${lineText(b.lines)}">
${carry(ctx)}<input type="hidden" name="discount" value="${b.codes.join(',')}">
<table>
<thead><tr><th scope="col">Product</th><th scope="col" class="num">Price</th><th scope="col">Quantity</th><th scope="col" class="num">Total</th></tr></thead>
<tbody>
${b.lines.map(l => html`<tr>
<th scope="row"><a href="${href(ctx, `/demo/products/${l.handle}`)}">${l.title}</a><br><a class="muted" href="${cartHref(ctx, { ...cart, lines: b.lines.filter(x => x.handle !== l.handle) })}">Remove<span class="vh"> ${l.title}</span></a></th>
<td class="num">${money(l.list, cur)}</td>
<td><label class="vh" for="q_${l.variant_numeric_id}">Quantity of ${l.title}</label><input id="q_${l.variant_numeric_id}" name="q_${l.variant_numeric_id}" type="number" min="0" max="${Math.min(l.stock, 99)}" step="1" value="${l.quantity}"></td>
<td class="num">${money(l.total, cur)}</td>
</tr>
`)}</tbody>
</table>
<fieldset>
<legend>Delivery</legend>
${Object.entries(b.rates).map(([key, rate]) => html`<label class="choice"><input type="radio" name="ship" value="${key}"${b.method.handle === key ? new Markup(' checked') : ''}> ${key === 'express' ? 'Express' : 'Standard'}, ${days(rate.days)}: ${money(rate.price, cur)}</label>\n`)}</fieldset>
<button type="submit" class="quiet">Update cart</button>
</form>
</section>
<aside class="panel" aria-labelledby="summary">
<h2 id="summary">Summary</h2>
<form class="inline" method="get" action="${prefixOf(ctx)}/demo/cart/${lineText(b.lines)}">
${carry(ctx)}${b.ship ? html`<input type="hidden" name="ship" value="${b.ship}">\n` : ''}<div><label for="discount">Discount code</label>
<input id="discount" name="discount" type="text" value="${[...b.codes, ...b.bad].join(', ')}" autocomplete="off" autocapitalize="characters" spellcheck="false"></div>
<button type="submit" class="quiet">Apply</button>
</form>
${said.length ? html`<ul role="status">${said}</ul>\n` : ''}${sums(b)}<form method="get" action="${prefixOf(ctx)}/demo/checkout">
${carry(ctx)}<input type="hidden" name="cart" value="${lineText(b.lines)}">
<input type="hidden" name="discount" value="${b.codes.join(',')}">
<input type="hidden" name="ship" value="${b.method.handle}">
<button type="submit">Check out</button>
</form>
<p><a href="${href(ctx, '/demo')}">Continue shopping</a></p>
</aside>
</div>
`;
  return shopPage(ctx, { title: 'Your cart', body, cart, headers: remember(ctx, cart) });
}

export async function demoCheckout(ctx) {
  const q = ctx.url.searchParams;
  // A visitor who typed the address gets the cart they left; a form brings its own.
  const had = q.has('cart') ? null : remembered(ctx);
  const b = await basket(ctx, had ? lineText(had.lines) : q.get('cart'), had ? had.codes.join(',') : q.get('discount'), had ? had.ship : q.get('ship'));
  const cur = b.currency;
  const cart = { lines: b.lines, codes: b.codes, ship: b.ship };
  if (!b.lines.length) {
    return shopPage(ctx, { title: 'Checkout', cart, body: html`<h1>Checkout</h1>
<p>Your cart is empty, so there is nothing to check out.</p>
<p><a class="button" href="${href(ctx, '/demo')}">Go to the shop</a></p>
` });
  }
  const off = [...b.rejected.map(x => x.code), ...b.bad];
  return shopPage(ctx, { title: 'Checkout', cart, body: html`<h1>Checkout</h1>
<p class="muted">Review your order.</p>
${b.notes.map(n => html`<p role="status">${n}</p>\n`)}<div class="cols">
<section aria-labelledby="order">
<h2 id="order">Your order</h2>
<table>
<thead><tr><th scope="col">Product</th><th scope="col">Quantity</th><th scope="col" class="num">Total</th></tr></thead>
<tbody>
${b.lines.map(l => html`<tr><th scope="row">${l.title}</th><td>${l.quantity}</td><td class="num">${money(l.total, cur)}</td></tr>\n`)}</tbody>
</table>
<p>Delivery: ${b.method.title}, ${days(b.method.days)}.</p>
${off.length ? html`<ul role="status">${off.map(c => html`<li class="bad"><code>${c}</code> is not applied.</li>`)}</ul>\n` : ''}<p><a href="${cartHref(ctx, cart)}">Back to the cart</a></p>
</section>
<aside class="panel" aria-labelledby="summary">
<h2 id="summary">Summary</h2>
${sums(b)}</aside>
</div>
<section class="callout" aria-labelledby="payment">
<h2 id="payment">Payment</h2>
<p role="status">The order would be placed here. Powder Lab is a demonstration shop, so checkout stops at this step: no payment is taken and nothing is shipped.</p>
</section>
` });
}

export async function demoPolicies(ctx) {
  const shop = shopConfig(DEMO);
  const { standard, express } = shop.shipping;
  const cur = shop.currency;
  const returns = shop.concessions?.extended_returns?.base_days ?? 30;
  const ask = address(ctx, '/offer');
  return shopPage(ctx, { title: 'Shipping and returns', body: html`<h1>Shipping and returns</h1>
<section aria-labelledby="shipping">
<h2 id="shipping">Shipping</h2>
<p>We ship within the United States. Standard delivery takes ${days(standard.days)} and costs ${money(standard.price, cur)} per order.${express ? ` Express delivery takes ${days(express.days)} and costs ${money(express.price, cur)} per order.` : ''}</p>
</section>
<section aria-labelledby="returns">
<h2 id="returns">Returns</h2>
<p>Send it back unused within ${days(returns)} of delivery for a full refund.</p>
</section>
<section aria-labelledby="paying">
<h2 id="paying">Payment</h2>
<p>Prices are in US dollars. We take all major cards.</p>
</section>
${hooked(ctx, 'policy') ? html`<section data-hook="policy" aria-labelledby="asking">
<h2 id="asking">Price match and offers</h2>
<p>Seen one of our products for less at another shop, or need it sooner? Ask us for an offer at <a href="${ask}">${ask}</a>. Say what matters most to you (price, delivery speed, returns or an extra in the box) and, if you have one, send the link to the lower price. We check it ourselves and answer with a concrete offer. An AI shopping assistant can ask on your behalf at the same address. Asking is free and nothing is bought.</p>
</section>
` : ''}<section aria-labelledby="contact">
<h2 id="contact">Contact</h2>
<p>Questions about sizing or an order? Write to [EMAIL REDACTED].</p>
</section>
` });
}

// --- Peak Boards, the other shop --------------------------------------------

const RIVAL = { name: 'Peak Boards', domain: 'peakboards.demo' };
// What the page shows instead of the product, for the test that a link to
// something else is not taken as proof.
const OTHER = { title: 'Trailhead Splitboard 161', brand: 'Peak Boards', gtin: '0850009876541', mpn: 'PB-TRAIL-161', text: 'A split touring board for skinning up and riding down. 161 cm, with skins and hardware in the box.' };

// Peak Boards' price for one of the catalog's products, by test case. "cheaper"
// is a price a seller can meet, "much-cheaper" sits well below any floor, and
// the plain page costs more than the list price.
function rivalCase(p, variant) {
  const cheaper = Math.min(r2(Math.floor(p.list * 0.9) + 0.95), r2(p.list * 0.95));
  const base = { title: p.title, brand: p.brand, gtin: p.gtin, mpn: p.mpn, text: p.text[0] || '', inStock: true };
  switch (variant) {
    case 'cheaper': return { ...base, price: cheaper, shipping: 0 };
    case 'much-cheaper': return { ...base, price: Math.floor(p.list * 0.656), shipping: null };
    case 'out-of-stock': return { ...base, price: cheaper, shipping: 0, inStock: false };
    case 'different-product': return { ...OTHER, price: Math.floor(p.list * 0.55), shipping: 0, inStock: true };
    default: return { ...base, price: r2(Math.floor(p.list * 1.07) + 0.95), shipping: 14.95 };
  }
}

function rivalPage(ctx, { title, body, head = '', status = 200 }) {
  return send(page(`${title} | ${RIVAL.name}`, CSS + SHOP_CSS + RIVAL_CSS, head, html`<header class="top"><div class="wrap">
<span class="name">${RIVAL.name}</span>
<span class="muted">${RIVAL.domain}</span>
</div></header>
<main class="wrap">
${body}</main>
<footer class="foot"><div class="wrap">
<p>${RIVAL.name}, ${RIVAL.domain}. Mountain gear since 2009.</p>
<p>This is a demonstration page: nothing can be ordered here.</p>
</div></footer>
`), status);
}

// The page answers at /rival/products/<handle> on this site, and at
// /products/<handle> for a caller that serves it as peakboards.demo.
export async function rivalProduct(ctx) {
  const base = tail(ctx, '/rival/products/') ? '/rival/products/' : '/products/';
  const p = catalog().find(x => x.handle === tail(ctx, base).toLowerCase());
  if (!p) return rivalPage(ctx, { status: 404, title: 'Page not found', body: html`<h1>We could not find that page</h1>\n` });
  const variant = str(ctx.url.searchParams.get('variant'), 40).toLowerCase().replace(/[\s_]+/g, '-');
  const known = ['cheaper', 'much-cheaper', 'out-of-stock', 'different-product'].includes(variant);
  const d = rivalCase(p, variant);
  const cur = p.currency;
  const here = address(ctx, `${base}${p.handle}`, known ? { variant } : {});
  const head = ld({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: d.title,
    description: d.text,
    brand: { '@type': 'Brand', name: d.brand },
    ...(d.mpn ? { mpn: d.mpn, sku: d.mpn } : {}),
    ...gtinKeys(d.gtin),
    url: here,
    offers: {
      '@type': 'Offer',
      url: here,
      price: d.price.toFixed(2),
      priceCurrency: cur,
      availability: `https://schema.org/${d.inStock ? 'InStock' : 'OutOfStock'}`,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: RIVAL.name },
      ...(d.shipping === null ? {} : { shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: d.shipping.toFixed(2), currency: cur } } }),
    },
  });
  const delivery = d.shipping === null ? 'Shipping is worked out at checkout.' : d.shipping === 0 ? 'Free shipping.' : `Shipping ${money(d.shipping, cur)}.`;
  return rivalPage(ctx, { title: d.title, head, body: html`<div class="product">
<div class="art">${picture(d.title === p.title ? p : { ...p, kind: 'board', colours: ['#5a3a1c', '#e9b46a', '#fbf3ea'] }, d.title)}</div>
<div>
<h1>${d.title}</h1>
<p class="muted">${d.brand}</p>
<p class="price">${money(d.price, cur)}</p>
<p>${d.inStock ? 'In stock.' : 'Out of stock.'} New. ${delivery}</p>
<section aria-labelledby="about">
<h2 id="about">Description</h2>
<p>${d.text}</p>
</section>
<section aria-labelledby="details">
<h2 id="details">Details</h2>
<dl class="specs">
${[['Brand', d.brand], ['Model', d.mpn], ['GTIN', d.gtin], ['Condition', 'New']].filter(([, value]) => value).map(([k, value]) => html`<dt>${k}</dt><dd>${value}</dd>\n`)}</dl>
</section>
</div>
</div>
` });
}

// --- the log, for whoever runs the demo -------------------------------------

const scrub = v => (Array.isArray(v) ? v.map(scrub) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => !PRIVATE.has(k)).map(([k, x]) => [k, scrub(x)])) : v);

// The recent events, from wherever the worker made them reachable.
async function recentEvents(ctx) {
  try {
    if (Array.isArray(ctx.events)) return ctx.events;
    for (const source of [ctx.service, storeOf(ctx)]) if (typeof source?.recent === 'function') return arr(await source.recent(200));
  } catch (e) { console.error('offerad log page', e); }
  return null;
}

export async function adminLog(ctx) {
  const events = await recentEvents(ctx);
  const rows = arr(events).map(scrub).map(e => {
    if (!e || typeof e !== 'object') return { at: '', what: '', rest: String(e) };
    const { at, ts, time, created_at: created, type, event, ...rest } = e;
    const when = at ?? ts ?? time ?? created;
    const d = new Date(typeof when === 'number' && when < 1e11 ? when * 1000 : when);
    return { at: when === undefined || when === null || Number.isNaN(d.getTime()) ? '' : d.toISOString().replace('T', ' ').slice(0, 19), what: str(type ?? event, 80), rest: JSON.stringify(rest) };
  });
  return deskPage(ctx, { title: 'Recent events', body: html`<h1>Recent events</h1>
<p class="muted">What the offer desk did lately, newest first as the store keeps them. Seller-only numbers are left out. <a href="${href(ctx, '/admin/log')}">Refresh</a></p>
${events === null ? html`<p role="status">The event log is not connected to this page.</p>\n` : !rows.length ? html`<p role="status">Nothing has happened yet.</p>\n` : html`<table>
<thead><tr><th scope="col">When (UTC)</th><th scope="col">Event</th><th scope="col">Details</th></tr></thead>
<tbody>
${rows.map(r => html`<tr><td class="num">${r.at}</td><td>${r.what}</td><td><code>${r.rest}</code></td></tr>\n`)}</tbody>
</table>
`}` });
}

// --- documents for programs --------------------------------------------------

const deskName = shop => (shop ? `${shop.name} offer desk` : 'Offer desk');
const publicProducts = (ctx, shop) => (shop ? listProducts(ctx.shop).map(m => ({ handle: m.product.handle, title: m.product.title, list: m.product.list, currency: m.product.currency, url: productAddress(ctx, shop, m.product.handle) })) : []);

export async function llmsTxt(ctx) {
  const shop = shopConfig(ctx.shop);
  const store = shop?.name || 'this store';
  const at = (path, params) => address(ctx, path, params);
  const text = `# ${deskName(shop)}

> Ask ${store} for an offer on one of its products: a lower price, free or faster shipping, a free add-on, longer returns, an on-time delivery guarantee or credit on a later order. Asking is free. Nothing is bought or reserved, and no personal data is needed.

The desk is run for the seller by OfferAd, an app the merchant installed. Its limits are fixed rules the merchant set, so the same request always gets the same offers. What changes an offer is the buyer's priority, the quantity, a delivery deadline, or a link to the same product selling for less elsewhere, which the store opens and checks itself.

## How it works

1. Request an offer for a product. Optional: one priority, the quantity, the number of days the buyer can wait, and a link to a cheaper competing offer.
2. The reply holds one to three offers with exact totals, each with an offer_id. Offers stay open for ${LIMITS.offer_minutes} minutes.
3. Accept an offer the buyer has seen and agreed to. The reply is a single-use discount code, valid for ${LIMITS.code_minutes} minutes, and a cart link that already carries it.
4. The purchase happens in the store's own checkout. A code that is never used simply expires.

## Priorities

${Object.entries(PRIORITIES).map(([id, label]) => `- ${id}: ${label}`).join('\n')}

## Ways in

- MCP server (Streamable HTTP, JSON replies): ${at('/mcp')} with the tools get_offer_options, request_offer and accept_offer
- JSON over HTTP, described in ${at('/openapi.json')}:
  - GET ${at('/api/offers/options')}?product={product}
  - POST ${at('/api/offers/request')}
  - POST ${at('/api/offers/accept')}
  - GET ${at('/api/offers/status')}?offer_id={offer_id}
- A plain web page with a form, no script needed: ${at('/offer')}?product={product}
- A machine-readable summary: ${at('/.well-known/offers.json')}
- One connector for every store that runs OfferAd, where each tool also takes the store: ${at('/connect/mcp')}

A product is named by its page URL, its handle, a Shopify product or variant id, or its name.

## Using the code

- In the store's cart and checkout tools: the discounts.codes field.
- As a link: the cart link from the accept reply opens the cart with the code applied.
- By hand: the discount field at checkout.

## Limits

${LIMITS.requests_per_product_per_hour} requests per product per hour are answered, and ${LIMITS.link_checks_per_product_per_hour} competing-offer link check per product per hour, so the best link is the one worth sending.
${shop ? `
## Products

${publicProducts(ctx, shop).map(p => `- [${p.title}](${p.url}): ${money(p.list, p.currency)}`).join('\n')}
` : ''}`;
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8', ...OPEN } });
}

export async function offersJson(ctx) {
  const shop = shopConfig(ctx.shop);
  const at = path => address(ctx, path);
  return sendJson({
    name: deskName(shop),
    version: '0.1',
    summary: 'Ask this store for an offer on a product: a lower price, free or faster shipping, a free add-on, longer returns, an on-time delivery guarantee or credit on a later order. Asking is free, nothing is bought or reserved, and no personal data is needed.',
    acts_for: 'seller',
    run_by: 'OfferAd, an app the merchant installed',
    store: shop ? { name: shop.name, shop: shop.shop, url: shop.storefront || at('/demo'), currency: shop.currency } : null,
    priorities: Object.entries(PRIORITIES).map(([id, label]) => ({ id, label })),
    competing_offer_link: {
      accepted: !!shop?.price_match?.on,
      how: 'The store fetches the page itself and checks that it shows the same product, new, in stock and at a lower price.',
    },
    doors: {
      mcp: { url: at('/mcp'), transport: 'streamable-http', tools: ['get_offer_options', 'request_offer', 'accept_offer'] },
      http: {
        openapi: at('/openapi.json'),
        options: { method: 'GET', url: at('/api/offers/options') },
        request: { method: 'POST', url: at('/api/offers/request') },
        accept: { method: 'POST', url: at('/api/offers/accept') },
        status: { method: 'GET', url: at('/api/offers/status') },
      },
      page: { url: at('/offer') },
      webmcp: { script: at('/embed.js'), tools: ['request_store_offer', 'accept_store_offer'] },
      connector: { url: at('/connect/mcp') },
    },
    codes: {
      single_use: true,
      apply: ['discounts.codes in the store\'s cart and checkout tools', 'the cart link from the accept reply', 'the discount field at checkout'],
    },
    limits: LIMITS,
    products: publicProducts(ctx, shop),
    docs: { llms_txt: at('/llms.txt') },
  });
}

export async function openapiJson(ctx) {
  const shop = shopConfig(ctx.shop);
  const json = schema => ({ content: { 'application/json': { schema } } });
  const ref = name => ({ $ref: `#/components/schemas/${name}` });
  const product = { type: 'string', description: 'The product: its page URL on the store, its handle, a Shopify product or variant id, or its name.' };
  const shopField = { type: 'string', description: 'The store\'s myshopify.com domain. Only needed on a host that serves more than one store.' };
  const priority = { type: 'string', enum: Object.keys(PRIORITIES), description: 'What matters most to the buyer. Left out, the reply asks.' };
  return sendJson({
    openapi: '3.1.0',
    info: {
      title: deskName(shop),
      version: '0.1.0',
      description: 'Ask the store for an offer on one of its products and turn an offer the buyer agreed to into a single-use discount code. Asking is free, nothing is bought or reserved, and no personal data is needed. The desk acts for the seller, within limits the merchant set.',
    },
    servers: [{ url: address(ctx, '') }],
    paths: {
      '/api/offers/options': {
        get: {
          operationId: 'getOfferOptions',
          summary: 'What kinds of offer the store can make on a product',
          description: 'A read-only lookup. Names the kinds of offer open for the product, the list price, standard delivery and the priorities the store understands. It gives no amounts.',
          parameters: [{ name: 'product', in: 'query', required: true, schema: product }, { name: 'shop', in: 'query', required: false, schema: shopField }],
          responses: { 200: { description: 'What the store can offer on this product.', ...json({ type: 'object' }) } },
        },
      },
      '/api/offers/request': {
        post: {
          operationId: 'requestOffer',
          summary: 'Ask for one to three concrete offers',
          description: `Offers stay open for ${LIMITS.offer_minutes} minutes. The same request always gets the same offers.`,
          requestBody: { required: true, ...json(ref('OfferRequest')) },
          responses: { 200: { description: 'The offers, or the reason there are none.', ...json(ref('OfferReply')) } },
        },
      },
      '/api/offers/accept': {
        post: {
          operationId: 'acceptOffer',
          summary: 'Turn an offer into a single-use discount code',
          description: `No order is placed and no payment is taken. The code is valid for ${LIMITS.code_minutes} minutes. Accepting the same offer again returns the same code.`,
          requestBody: { required: true, ...json(ref('AcceptRequest')) },
          responses: { 200: { description: 'The code and how to use it, or why none was issued.', ...json(ref('AcceptReply')) } },
        },
      },
      '/api/offers/status': {
        get: {
          operationId: 'getOfferStatus',
          summary: 'Where an offer stands',
          parameters: [{ name: 'offer_id', in: 'query', required: true, schema: { type: 'string' } }, { name: 'shop', in: 'query', required: false, schema: shopField }],
          responses: { 200: { description: 'Whether the offer is open, accepted or expired.', ...json({ type: 'object' }) } },
        },
      },
    },
    components: {
      schemas: {
        OfferRequest: {
          type: 'object',
          required: ['product'],
          properties: {
            product,
            shop: shopField,
            quantity: { type: 'integer', minimum: 1, default: 1 },
            priority,
            need_by_days: { type: 'number', minimum: 0, description: 'How many days from today the buyer can wait for delivery.' },
            competing_offer_url: { type: 'string', format: 'uri', description: 'Another shop\'s public page for the same product, new and in stock, at a lower price. The store fetches it itself.' },
            note: { type: 'string', description: 'A short note for the merchant. It does not change the offer and is no place for personal details.' },
          },
        },
        Offer: {
          type: 'object',
          properties: {
            offer_id: { type: 'string' },
            kind: { type: 'string' },
            headline: { type: 'string' },
            components: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, label: { type: 'string' } } } },
            quantity: { type: 'integer' },
            unit_price: { type: 'number' },
            items_total: { type: 'number' },
            shipping_total: { type: 'number' },
            total: { type: 'number' },
            list_total: { type: 'number' },
            you_save: { type: 'number' },
            extras_value: { type: 'number' },
            ship_days: { type: 'number' },
            currency: { type: 'string' },
            expires_at: { type: 'string' },
          },
        },
        OfferReply: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'For example offer, price_matched, price_beaten, cannot_match_best_effort, no_offer, unavailable or slow_down.' },
            offers: { type: 'array', maxItems: 3, items: ref('Offer') },
            question: { type: ['object', 'null'], description: 'Asked when no priority was given. Asking again with the answer gets a better-fitting offer.' },
            notes: { type: 'array', items: { type: 'string' } },
            proof: { type: ['object', 'null'], description: 'What the store found behind the competing-offer link.' },
            next: { type: 'string' },
          },
        },
        AcceptRequest: {
          type: 'object',
          required: ['offer_id', 'user_approved'],
          properties: {
            offer_id: { type: 'string', description: 'The offer_id of the chosen offer.' },
            user_approved: { type: 'boolean', description: 'true when the buyer has seen this offer and agreed to it. Otherwise the reply is needs_approval and no code is issued.' },
            shop: shopField,
          },
        },
        AcceptReply: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'accepted, or needs_approval when user_approved was not true.' },
            codes: { type: 'array', items: { type: 'string' } },
            cart_url: { type: 'string', description: 'Checkout link: a cart with codes, or a draft invoice with the quote already applied.' },
            settlement: { type: 'string', enum: ['dry', 'native', 'function', 'draft'] },
            invoice_url: { type: 'string', description: 'For draft settlement, use this quote checkout directly; codes is empty.' },
            alternatives: { type: 'array', items: ref('Offer'), description: 'Different terms requiring fresh approval when the original offer is not deliverable.' },
            apply: { type: 'object', description: 'How to use the code: in the store\'s cart and checkout tools, in the browser, or as a link.' },
            terms: { description: 'Exact approved terms of the checkout offer.' },
            expires_at: { type: ['string', 'null'], description: 'Null for draft invoices: no automatic quote expiry is claimed.' },
            after_purchase: { type: 'array', description: 'Parts of the offer that are attached to the order after it is placed.' },
          },
        },
      },
    },
  });
}
