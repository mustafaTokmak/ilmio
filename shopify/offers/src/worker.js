// The worker: routing and wiring, nothing else. It builds the offer desk
// (service.js) on the Durable Object store, works out which shop a request is
// for and where that shop's links should point, and hands the request to a
// door: MCP (mcp.js), the JSON API (the same calls over plain HTTP), the HTML
// pages (pages.js) or the order webhook. Every route is served twice: at the
// root, and under /apps/offerad, which is where Shopify's app proxy puts the
// desk on a store's own domain.

import { createService } from './lib/service.js';
import { doStore } from './lib/store.js';
import { verifyCompetingOffer } from './lib/verify.js';
import { dryAdapter, shopifyAdapter } from './lib/settle.js';
import { draftAdapter } from './lib/draft.js';
import { SHOPS } from './lib/mandates.js';
import { handleMcp, callTool, publicReply, notEnrolled, readBody, readBytes, CORS, MAX_BODY } from './lib/mcp.js';
import {
  offerForm, offerResult, offerAccepted, demoHome, demoProduct, demoCart, demoCheckout, demoPolicies,
  rivalProduct, adminLog, llmsTxt, offersJson, openapiJson,
} from './lib/pages.js';

export { Offers } from './lib/store.js';

const PREFIX = '/apps/offerad';
const DEMO = 'demo';
const HOOKS = ['box', 'desc', 'jsonld', 'webmcp', 'policy'];
// The rival shop's pages are served by this worker but stand for a shop on its
// own domain, the one the mandates list among the shops whose prices count.
const RIVAL_HOST = 'peakboards.demo';
const MYSHOPIFY = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;
const HOSTNAME = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
// What the proxy adds to a query. None of it is the visitor's, and each appears once.
const PROXY_PARAMS = ['shop', 'path_prefix', 'timestamp', 'signature', 'logged_in_customer_id'];
const PROXY_PATH = /^(\/[\w-]{1,40}){1,3}$/;
const PROXY_SECONDS = 90;
const MAX_WEBHOOK = 2 * 1024 * 1024;

// The JSON API: each path is one tool of the MCP door, or the status lookup.
const API = {
  '/api/offers/options': ['GET', 'get_offer_options'],
  '/api/offers/request': ['POST', 'request_offer'],
  '/api/offers/accept': ['POST', 'accept_offer'],
  '/api/offers/status': ['GET', null],
};

// The pages, by the path that is left once the proxy prefix is off.
const PAGES = [
  ['GET', /^\/offer$/, offerForm],
  ['POST', /^\/offer$/, offerResult],
  ['POST', /^\/offer\/accept$/, offerAccepted],
  ['GET', /^\/llms\.txt$/, llmsTxt],
  ['GET', /^\/\.well-known\/offers\.json$/, offersJson],
  ['GET', /^\/openapi\.json$/, openapiJson],
  ['GET', /^\/demo$/, demoHome],
  ['GET', /^\/demo\/products\/[^/]+$/, demoProduct],
  ['GET', /^\/demo\/cart(\/[^/]*)?$/, demoCart],
  ['GET', /^\/demo\/checkout$/, demoCheckout],
  ['GET', /^\/demo\/policies$/, demoPolicies],
  ['GET', /^\/rival\/products\/[^/]+$/, rivalProduct],
  ['GET', /^\/admin\/log$/, adminLog],
];

const enc = new TextEncoder();
const text = x => (typeof x === 'string' ? x.trim() : '');
const parseUrl = x => { try { return new URL(x); } catch { return null; } };
// Own keys only: a shop named "constructor" is not a shop.
const known = shop => typeof shop === 'string' && Object.hasOwn(SHOPS, shop);

const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { ...CORS, 'cache-control': 'no-store', ...headers } });
const notAllowed = allow => json(
  { status: 'invalid_request', error: `This address takes ${allow.join(' or ')} requests.` },
  405, { Allow: [...allow, 'OPTIONS'].join(', ') },
);

const fromHex = s => (/^(?:[0-9a-f]{2})+$/i.test(s) ? Uint8Array.from(s.match(/../g), b => parseInt(b, 16)) : null);
const fromBase64 = s => { try { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); } catch { return null; } };

// HMAC-SHA256 checked by the platform, which compares in constant time.
async function hmacOk(secret, data, mac) {
  if (!secret || !mac) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  return crypto.subtle.verify('HMAC', key, mac, typeof data === 'string' ? enc.encode(data) : data);
}

async function digest(value) {
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(value));
  return [...new Uint8Array(hash)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Two secrets compared over their digests, so the time taken says nothing about where they differ.
async function sameSecret(a, b) {
  const [x, y] = await Promise.all([a, b].map(async s => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(String(s))))));
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

// Shopify signs what its app proxy forwards: every query parameter except
// `signature`, written key=value with repeated values joined by commas, the
// pairs sorted and joined with nothing between them, then HMAC-SHA256 with the
// app's client secret, in hex.
// https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies
// Shopify's own library adds two rules the page leaves out, and they are kept
// here: a proxy parameter appears once, and a signature is good for 90 seconds.
// https://github.com/Shopify/shopify-app-js/blob/main/packages/apps/shopify-api/lib/utils/hmac-validator.ts
// Returns the shop the signature vouches for, or null.
async function proxyShop(url, secret, now = Date.now()) {
  const q = url.searchParams;
  if (PROXY_PARAMS.some(k => q.getAll(k).length > 1)) return null;
  const shop = (q.get('shop') || '').toLowerCase();
  const stamp = Number(q.get('timestamp'));
  if (!MYSHOPIFY.test(shop) || !Number.isFinite(stamp) || Math.abs(now / 1000 - stamp) > PROXY_SECONDS) return null;
  const message = [...new Set(q.keys())].filter(k => k !== 'signature').map(k => `${k}=${q.getAll(k).join(',')}`).sort().join('');
  return (await hmacOk(secret, message, fromHex(q.get('signature') || ''))) ? shop : null;
}

// The Admin API token for a shop that settles through Shopify. One set by
// hand wins. Otherwise the app trades its client id and secret for a token,
// which works for a store in the app's own organization and lasts a day.
// https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant
// Kept between requests on purpose: the token is the shop's, not a caller's.
const tokens = new Map();
async function adminToken(env, shop) {
  if (env.SHOPIFY_ADMIN_TOKEN) return env.SHOPIFY_ADMIN_TOKEN;
  if (!env.SHOPIFY_API_KEY || !env.SHOPIFY_API_SECRET || !MYSHOPIFY.test(shop)) return null;
  const held = tokens.get(shop);
  if (held && held.until > Date.now()) return held.token;
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SHOPIFY_API_KEY, client_secret: env.SHOPIFY_API_SECRET }).toString(),
    signal: AbortSignal.timeout(10000),
  });
  const reply = await res.json().catch(() => null);
  if (!res.ok || !reply?.access_token) throw new Error(`the token exchange for ${shop} answered ${res.status}`);
  // Renewed a minute early, so a token is never used in its last seconds.
  tokens.set(shop, { token: reply.access_token, until: Date.now() + (Number(reply.expires_in) || 3600) * 1000 - 60000 });
  return reply.access_token;
}

const offPrefix = (pathname, prefixes) => {
  const hit = prefixes.find(p => p && (pathname === p || pathname.startsWith(`${p}/`)));
  return hit ? pathname.slice(hit.length) || '/' : pathname;
};

// The desk for one request: the store, the adapters that turn offers into
// codes, and the service on top. `origin` and `prefix` are where the request's
// shop is reached from outside; `hosts` are the names this worker answers to.
function wire(env, { origin, prefix, hosts, front }) {
  const store = doStore(env);
  const dry = dryAdapter(store, { storefront: `${origin}${prefix}/demo`, shop: DEMO });
  const adapterFor = shop => {
    if (!known(shop) || SHOPS[shop].settle !== 'shopify') return dry;
    const config = { shop, token: () => adminToken(env, shop), ...(env.SHOPIFY_API_VERSION ? { apiVersion: env.SHOPIFY_API_VERSION } : {}) };
    // A quote invoice can carry the whole offer before a Function is deployed.
    // Native codes remain available when explicitly selected, with preflight
    // restrictions; a deployed Function keeps offers on ordinary carts.
    return !env.SHOPIFY_FUNCTION_HANDLE && env.SHOPIFY_SETTLEMENT !== 'native'
      ? draftAdapter(config)
      : shopifyAdapter({ ...config, functionHandle: env.SHOPIFY_FUNCTION_HANDLE || null });
  };

  // A link to the rival's pages here is checked as a link to the rival's own
  // domain and read in process: a worker cannot fetch its own address, and a
  // name ending in .demo resolves nowhere.
  const standIn = link => {
    const u = parseUrl(text(link));
    const m = u && hosts.includes(u.host.toLowerCase()) && /^\/rival(\/products\/[^/]+)\/?$/.exec(offPrefix(u.pathname, [prefix, PREFIX]));
    return m ? `https://${RIVAL_HOST}${m[1]}${u.search}` : link;
  };
  const fetchFn = async (input, init) => {
    const u = parseUrl(String(input));
    if (u?.hostname !== RIVAL_HOST) return fetch(input, init);
    if (!/^\/products\/[^/]+$/.test(u.pathname)) return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    const at = new URL(`/rival${u.pathname}${u.search}`, origin);
    return rivalProduct({ url: at, request: new Request(at), env, shop: DEMO, service: null, hooks: [], origin, prefix });
  };
  // The stand-in storefront shares its host with the rival, so only its own
  // paths count as "this store". A real store's public domain counts whole.
  const own = [...hosts.flatMap(h => [...new Set(['', PREFIX, prefix])].map(p => `${h}${p}/demo`)), ...(front ? [front] : [])];
  const verify = (link, product, policy, opts = {}) => {
    const demo = opts.shop === DEMO;
    const original = parseUrl(text(link));
    const mapped = standIn(link);
    // Fixture pages are proof only for the fixture shop. They must never
    // change a real merchant's quote, even when reached on this worker.
    if (!demo && (mapped !== link || original?.hostname === RIVAL_HOST)) {
      return Promise.resolve({ ok: false, reason: 'blocked_domain', reason_text: 'Demonstration competitor pages cannot support an offer from a real store.' });
    }
    return verifyCompetingOffer(demo ? mapped : link, product, policy, {
      ...opts, ownHosts: [...(opts.ownHosts || []), ...own],
      fetchFn: demo ? fetchFn : fetch,
    });
  };

  return { store, dry, adapterFor, service: createService({ store, adapterFor, verify }) };
}

// A posted body as plain fields: a JSON object, or a form's pairs. JSON is
// also known by its first character, because agents often post it unlabelled.
async function readFields(request) {
  const raw = await readBody(request);
  if (raw === null) return { tooLarge: true };
  const type = (request.headers.get('content-type') || '').toLowerCase();
  if (type.includes('json') || (!type.includes('urlencoded') && /^\s*[[{]/.test(raw))) {
    try {
      const v = JSON.parse(raw);
      if (v && typeof v === 'object' && !Array.isArray(v)) return { values: v };
    } catch { /* answered by the caller */ }
    return { values: {}, bad: true };
  }
  return { values: Object.fromEntries(new URLSearchParams(raw)) };
}

// Which discovery hooks the demo shop shows: ?hooks= when the request has one
// (an empty one is the control arm), DEMO_HOOKS otherwise.
function hooksFor(q, env) {
  const names = String((q.has('hooks') ? q.get('hooks') : env.DEMO_HOOKS) ?? '').toLowerCase().split(/[\s,]+/);
  return names.includes('all') ? [...HOOKS] : HOOKS.filter(h => names.includes(h));
}

// Who called, for the merchant's log: the product names in a User-Agent say
// more than the browser boilerplate around them.
const BOILERPLATE = /^(mozilla|applewebkit|khtml|gecko|safari|version|mobile)\//i;
function agentName(ua) {
  const all = ua.match(/[A-Za-z][\w.-]*\/\d[\w.-]*/g) || [];
  const own = all.filter(t => !BOILERPLATE.test(t));
  return ((own.length ? own : all.slice(-1)).join(' ') || ua).trim().slice(0, 48) || 'unknown';
}

// The log is open unless ADMIN_KEY is set; then that is its password, with any user name.
async function logAllowed(request, env) {
  if (!env.ADMIN_KEY) return true;
  const [scheme = '', value = ''] = (request.headers.get('authorization') || '').trim().split(/\s+/);
  let given = '';
  if (/^bearer$/i.test(scheme)) given = value;
  else if (/^basic$/i.test(scheme)) { try { given = atob(value).split(':').slice(1).join(':'); } catch { /* not a password */ } }
  return sameSecret(given, env.ADMIN_KEY);
}

async function offerStatus(door, args) {
  if (!known(door.shop)) return notEnrolled(door.shop);
  const offer_id = text(args.offer_id);
  const code = text(args.code);
  if (!offer_id && !code) return { status: 'invalid_request', error: 'offer_id is needed: the offer_id of an offer from a request. A code issued for an offer works too, as code.' };
  return publicReply(await door.service.status({ shop: door.shop, offer_id, code, session: door.session, client: door.client }));
}

// What an order owes because of the codes it used: the parts of an offer that
// checkout could not show as money are written on the order. Every step can
// run twice, because Shopify sends a failed delivery again.
async function settleOrder({ store, adapterFor }, shop, order) {
  const id = text(order.admin_graphql_api_id) || (Number.isSafeInteger(order.id) ? `gid://shopify/Order/${order.id}` : text(order.id) || text(order.name));
  const list = x => (Array.isArray(x) ? x : []);
  const codes = [...new Set([
    ...list(order.discount_codes).map(d => d?.code),
    ...list(order.discount_applications).filter(a => a?.type === 'discount_code').map(a => a.code),
  ].map(c => text(c).toUpperCase()).filter(Boolean))].slice(0, 20);
  if (!id) return { handled: [] };

  // The codes of one offer carry the same promises, so an offer is written on
  // the order once, however many of its codes the order used.
  const owed = new Map();
  for (const code of codes) {
    const rec = await store.getCode(code);
    if (!rec?.offer_id || rec.shop !== shop) continue;
    if (!rec.used) await store.updateCode(code, { used: true, used_at: new Date().toISOString(), order_id: id });
    const entry = owed.get(rec.offer_id) || { codes: [], deferred: [] };
    entry.codes.push(code);
    if (Array.isArray(rec.deferred) && rec.deferred.length) entry.deferred = rec.deferred;
    owed.set(rec.offer_id, entry);
  }

  // Order attributes identify a candidate quote; only the Admin API's
  // draft→order relationship proves that this order redeemed that invoice.
  const draftIds = list(order.note_attributes).filter(a => a?.name === 'offerad_offer_id' || a?.key === 'offerad_offer_id').map(a => text(a.value)).filter(v => /^of_[0-9a-f]{20}$/.test(v)).slice(0, 3);
  for (const offer_id of draftIds) {
    const rec = await store.getOffer(offer_id);
    if (rec?.shop !== shop || rec.mode !== 'draft' || rec.status !== 'accepted' || !rec.draft_order_id) continue;
    if (rec.order_id && rec.order_id !== id) continue;
    const adapter = adapterFor(shop);
    if (typeof adapter.confirmOrder !== 'function') continue;
    const linked = await adapter.confirmOrder(id, { draft_order_id: rec.draft_order_id, offer_id });
    if (linked?.ok !== true) continue;
    if (!rec.order_id) await store.updateOffer(offer_id, { order_id: id });
    owed.set(offer_id, { codes: [], deferred: rec.mint_result?.deferred || [] });
  }

  const handled = [];
  for (const [offer_id, { codes: used, deferred }] of owed) {
    if (!deferred.length) continue;
    const offer = await store.getOffer(offer_id);
    // An offer's promises are kept once: on the first order that used one of its codes.
    if (offer?.order_id && offer.order_id !== id) continue;
    if (offer && !offer.order_id) await store.updateOffer(offer_id, { order_id: id });
    // The same code names the offer on every delivery, so the adapter can tell a repeat.
    const out = await adapterFor(shop).annotateOrder(id, { code: offer?.codes?.[0] || used[0], offer_id, currency: text(order.currency) || null, deferred });
    if (out?.ok === false) throw new Error(`the order could not be annotated: ${out.reason || 'no reason given'}`);
    handled.push({
      terms: list(out?.terms).map(t => t?.label).filter(Boolean),
      later_codes: list(out?.codes).map(c => ({ code: c.code, amount: c.amount ?? null, expires_at: c.expires_at ?? null })),
    });
  }
  // The log has a public page, so it names no code and no order.
  await store.log({ type: 'order', shop, status: handled.length ? 'annotated' : 'nothing_owed', offers: owed.size, kept: handled.flatMap(h => h.terms) });
  return { handled };
}

// Shopify's order webhook. Each delivery is signed: X-Shopify-Hmac-Sha256 is
// the base64 HMAC-SHA256 of the raw request body, keyed with the app's client
// secret. The bytes are checked as they arrived and parsed only afterwards.
// https://shopify.dev/docs/apps/build/webhooks/verify-deliveries
async function orderWebhook(request, env, ctx, desk) {
  const secret = env.SHOPIFY_API_SECRET;
  const mac = request.headers.get('x-shopify-hmac-sha256') || '';
  if (secret && !mac) return json({ ok: false, error: 'This delivery is not signed.' }, 401);
  const bytes = await readBytes(request, MAX_WEBHOOK);
  if (bytes === null) return json({ ok: false, error: 'The body is too large.' }, 413);
  if (secret && !(await hmacOk(secret, bytes, fromBase64(mac)))) return json({ ok: false, error: 'The signature does not match the body.' }, 401);

  let order = null;
  try { order = JSON.parse(new TextDecoder().decode(bytes)); } catch { /* answered below */ }
  if (!order || typeof order !== 'object' || Array.isArray(order)) return json({ ok: false, error: 'The body is not a JSON order.' }, 400);

  const shop = (text(request.headers.get('x-shopify-shop-domain')) || (secret ? '' : text(order.shop) || DEMO)).toLowerCase();
  // Taken and dropped: answering an error would only make Shopify send it again.
  if (!known(shop)) return json({ ok: true, handled: [], note: 'This store does not use the offer desk.' });
  // Without the secret nobody vouches for a delivery, so it can only play an
  // order on the stand-in shop: nothing unsigned writes to a real store.
  if (!secret && SHOPS[shop].settle === 'shopify') return json({ ok: false, error: 'Deliveries for this store are signed, and no secret is configured to check them.' }, 401);

  // Shopify hangs up after five seconds; the work is finished all the same.
  const work = settleOrder(desk, shop, order);
  ctx?.waitUntil?.(work.catch(() => {}));
  return json({ ok: true, ...(await work) });
}

async function route(request, env, ctx) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = new URL(request.url);
  const q = url.searchParams;
  const header = name => request.headers.get(name) || '';
  const proxied = url.pathname === PREFIX || url.pathname.startsWith(`${PREFIX}/`);
  const path = (proxied ? url.pathname.slice(PREFIX.length) : url.pathname).replace(/\/+$/, '') || '/';
  const method = request.method === 'HEAD' ? 'GET' : request.method;

  // A request that carries the proxy's signature has to pass it once the
  // secret is configured: a signed request that fails is refused, never
  // quietly treated as an unsigned one.
  let via = null;
  if (env.SHOPIFY_API_SECRET && ['shop', 'timestamp', 'signature'].every(k => q.has(k))) {
    via = await proxyShop(url, env.SHOPIFY_API_SECRET);
    if (!via) return json({ status: 'error', error: 'The Shopify app-proxy signature on this request does not check out.' }, 401);
  }

  // Through the proxy the desk lives on the store's own domain, under the path
  // the merchant gave the proxy. Only a verified request is believed about
  // either, or about the visitor's address: the proxy sends it in X-Forwarded-For.
  const forwarded = via ? header('x-forwarded-host').split(',')[0].trim().toLowerCase() : '';
  const front = via ? (HOSTNAME.test(forwarded) ? forwarded : via) : null;
  const origin = front ? `https://${front}` : url.origin;
  const prefix = via ? (PROXY_PATH.test(q.get('path_prefix') || '') ? q.get('path_prefix') : PREFIX) : proxied ? PREFIX : '';
  const ip = via ? header('x-forwarded-for').split(',')[0].trim() : header('cf-connecting-ip');
  const self = url.host.toLowerCase();

  const desk = wire(env, { origin, prefix, hosts: front ? [self, front] : [self], front });
  const { store, service, dry } = desk;
  if (path === '/webhooks/orders') return method === 'POST' ? orderWebhook(request, env, ctx, desk) : notAllowed(['POST']);

  // A stable id for the rate limits when the door has none of its own: address
  // and browser, hashed with a secret and the date, so no address is stored
  // and yesterday's id cannot be tied to today's.
  const ua = header('user-agent').slice(0, 300);
  const salt = `${env.SESSION_SALT || env.SHOPIFY_API_SECRET || 'offerad'}|${new Date().toISOString().slice(0, 10)}`;
  const address = ip ? `h${await digest(`${salt}|${ip}`)}` : null;
  const session = `web:${await digest(`${salt}|${ip}|${ua}`)}`;
  const caller = name => ({ ip: address, name: `${name}: ${agentName(ua)}` });

  // The cross-store door knows a store by its domain. This worker's own host
  // is the stand-in shop; a store's public domain is known once its proxy vouched for it.
  const hosted = u => (u.host.toLowerCase() === self ? DEMO : front && u.host.toLowerCase() === front ? via : null);
  const door = { service, session, hosted, relaxHeaders: !!via };
  if (path === '/connect/mcp') return handleMcp(request, { ...door, connect: true, client: caller('connect') });

  const api = API[path];
  const pages = PAGES.filter(([, pattern]) => pattern.test(path));
  let fields = null;
  if (method === 'POST' && (api?.[0] === 'POST' || pages.some(([verb]) => verb === 'POST'))) {
    fields = await readFields(request);
    if (fields.tooLarge) return json({ status: 'invalid_request', error: `The body is larger than ${MAX_BODY} bytes.` }, 413);
  }

  // Which shop: the proxy's signature, then a shop field in the query or the
  // body, then the stand-in shop. The demo and rival pages are always that shop.
  const named = (/^\/(demo|rival)(\/|$)/.test(path) ? DEMO : via || text(q.get('shop')) || text(fields?.values.shop) || DEMO).toLowerCase();

  if (path === '/mcp') return handleMcp(request, { ...door, shop: named, client: caller('mcp') });

  if (api) {
    const [verb, tool] = api;
    if (method !== verb) return notAllowed([verb]);
    if (fields?.bad) return json({ status: 'invalid_request', error: 'The body could not be read. Send a JSON object, for example {"product":"<handle or page URL>","priority":"lowest_price"}.' }, 400);
    const call = { ...door, shop: named, client: caller('api') };
    const args = verb === 'GET' ? Object.fromEntries(q) : fields.values;
    const reply = tool ? await callTool(call, tool, args) : await offerStatus(call, args);
    // Whatever the desk answered is the answer, so it goes out as 200 with its
    // own `status`, as a tool result does on the MCP door: an agent's fetch
    // tool often shows the model nothing but a number for anything else, and
    // the words are what let it correct the request. Only a desk that broke says so in HTTP.
    return json(reply, reply.status === 'error' ? 500 : 200);
  }

  if (pages.length) {
    const page = pages.find(([verb]) => verb === method);
    if (!page) return notAllowed(pages.map(([verb]) => verb));
    if (page[2] === adminLog && !(await logAllowed(request, env))) {
      return new Response('The log needs its password.', { status: 401, headers: { 'www-authenticate': 'Basic realm="OfferAd log", charset="UTF-8"', 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
    }
    // The pages see the path without the prefix and a query without the proxy's additions.
    const clean = new URL(url);
    clean.pathname = path;
    for (const k of PROXY_PARAMS) if (via || k !== 'shop') clean.searchParams.delete(k);
    return page[2]({
      url: clean, request, env, origin, prefix, session,
      shop: known(named) ? named : null,
      hooks: hooksFor(q, env),
      client: caller('page'),
      // The demo cart asks what its codes are worth; the dry adapter knows, and takes the delivery method by this name.
      service: { ...service, evaluateCart: ({ codes, cart }) => dry.evaluate(codes, { ...cart, shipping_method: cart?.shipping_method || cart?.shipping?.handle }) },
      store: { recent: store.recent },
      ...(fields ? { body: fields.values } : {}),
    });
  }

  if (method === 'GET' && path === '/') {
    const hooks = q.has('hooks') ? `?hooks=${encodeURIComponent(q.get('hooks'))}` : '';
    return new Response(null, { status: 302, headers: { location: `${prefix}${named === DEMO ? '/demo' : '/offer'}${hooks}`, 'cache-control': 'no-store' } });
  }
  // Static files sit at the root; under the prefix they are fetched from there.
  if (method === 'GET' && proxied && env.ASSETS) {
    const asset = await env.ASSETS.fetch(new Request(new URL(path, url.origin), { headers: request.headers }));
    if (asset.status !== 404) return asset;
  }
  return json({ status: 'not_found', error: 'There is nothing at this address.', see: `${origin}${prefix}/llms.txt` }, 404);
}

export default {
  async fetch(request, env, ctx) {
    try {
      const res = await route(request, env, ctx);
      return request.method === 'HEAD' ? new Response(null, { status: res.status, headers: res.headers }) : res;
    } catch (e) {
      // The query stays out of the log: it can carry a signature.
      const ref = crypto.randomUUID().slice(0, 8);
      console.error(JSON.stringify({ at: 'worker', ref, method: request.method, url: request.url.split('?')[0], error: String(e?.stack || e) }));
      return json({ status: 'error', error: `The desk could not answer just now (ref ${ref}). Nothing was bought or charged, and asking again is safe.` }, 500);
    }
  },
};
