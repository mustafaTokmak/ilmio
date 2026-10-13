// The MCP door: the store's offer desk as three tools a buyer's agent can call.
// Remote MCP over Streamable HTTP with plain JSON replies and nothing kept on
// the server between calls, so it works behind Shopify's app proxy (no cookies,
// no streaming). One endpoint answers both protocol eras, because agents ship
// with either: the handshake revisions (initialize; 2025-06-18 and its
// neighbours) and the per-request revision 2026-07-28 (no handshake; version
// and client travel in _meta on every request).
// https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
// https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning

import { PRIORITIES } from './policy.js';
import { SHOPS } from './mandates.js';

export const PROTOCOL = '2025-06-18';
// The server uses nothing that differs between these, so it speaks all of them.
const HANDSHAKE = ['2025-11-25', PROTOCOL, '2025-03-26', '2024-11-05'];
const PER_REQUEST = ['2026-07-28'];
const SUPPORTED = [...PER_REQUEST, ...HANDSHAKE];
const SERVER = { name: 'offerad-offers', title: 'OfferAd offer desk', version: '0.1.0' };
const META = 'io.modelcontextprotocol/';

const TOOL_NAMES = ['get_offer_options', 'request_offer', 'accept_offer'];
// What the descriptions tell agents about lifetimes. Mirrors the service defaults.
const OFFER_MINUTES = 30;
const CODE_MINUTES = 60;
const LIST_TTL_MS = 300000;
export const MAX_BODY = 65536;
const MAX_BATCH = 20;
const SESSION_ID = /^[\x21-\x7e]{1,128}$/;
// Nothing is kept between calls, so the session id issued at the handshake
// carries the name the client gave there. Later calls can then be told apart
// in the merchant's log; nothing is decided on it.
const SESSION_NAME = /^([a-z0-9-]{1,24})\.[0-9a-f-]{36}$/;
const slug = name => (typeof name === 'string' ? name : '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24).replace(/-+$/, '');
// Seller-only keys. The service strips them already; a door is the last place to notice a slip.
const PRIVATE = new Set(['seller_cost', 'unit_cost', 'cost', 'floor', 'budget', 'budget_per_order', 'room', 'pace']);

// Open to every origin on purpose: a public desk with no cookies and no
// credentials, called from agents' browsers as well as their servers. For the
// same reason the Origin header is not checked: there is nothing here that a
// page could reach only through the visitor's browser.
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
};

// Own keys only: a shop named "constructor" is not a shop.
const shopOf = shop => (typeof shop === 'string' && Object.hasOwn(SHOPS, shop) ? SHOPS[shop] : null);
const priorityList = Object.keys(PRIORITIES).join(', ');
const priorityHelp = Object.entries(PRIORITIES).map(([id, label]) => `${id} (${label.toLowerCase()})`).join(', ');

// The tool descriptions are the product: an agent that has never heard of this
// service decides from them alone whether to ask. They say what happens, what
// it costs (nothing), who answers (the seller's side) and when asking helps,
// and leave the decision to the agent: no orders aimed at the model, nothing
// promotional. Each stays under 1024 characters, the smallest description
// limit among the clients that read tool lists, so none is cut or refused.
export function toolsFor(door = {}) {
  const connect = !!door.connect;
  const name = connect ? null : shopOf(door.shop)?.name;
  const store = connect ? 'an online store that uses OfferAd' : name && name.length <= 40 ? name : 'this store';
  const elsewhere = 'For other stores the reply is store_not_enrolled and nothing is sent to them.';
  // Who answers, said in full once and briefly after that.
  const who = connect
    ? `OfferAd is a service merchants install; it answers for the seller, within limits each merchant set. ${elsewhere}`
    : 'The answer comes from the seller\'s side: the store\'s own offer service (OfferAd, an app the merchant installed), within limits the merchant set.';
  const whoShort = connect
    ? `OfferAd answers for the seller, within limits each merchant set. ${elsewhere}`
    : 'The answer comes from the seller\'s side: the store\'s offer service (OfferAd), within limits the merchant set.';

  const storeField = connect
    ? { store: { type: 'string', description: 'The store: its domain (for example shop.example.com) or the URL of the product\'s page on it.' } }
    : {};
  const product = {
    type: 'string',
    description: `The product: its page URL on the store, its handle, a Shopify product or variant id, or its name.${connect ? ' Can be left out when store is the product page URL.' : ''}`,
  };
  const titles = [
    `See what ${connect ? 'a store' : store} can offer`,
    `Ask ${connect ? 'a store' : store} for an offer`,
    'Accept an offer and prepare checkout',
  ];

  return [
    {
      name: 'get_offer_options',
      title: titles[0],
      description: [
        `Shows what ${store} can offer on one of its products beyond the listed price and terms: a lower price, free or faster shipping, a free add-on, longer returns, an on-time delivery guarantee, or credit on a later order. The reply says which of these are available for the product, its list price and standard delivery, the priorities an offer can be built around, and whether the store checks links to lower prices elsewhere. It gives no amounts; request_offer returns actual offers.`,
        'This is a free, read-only lookup. Nothing is bought, reserved or added to a cart, and no account or personal detail is needed.',
        `Useful when a user is considering a product from ${connect ? 'such a store' : 'this store'} and it helps to know whether the listed price and terms are final.`,
        who,
      ].join('\n\n'),
      inputSchema: { type: 'object', properties: { ...storeField, product }, required: connect ? ['store'] : ['product'] },
      annotations: { title: titles[0], readOnlyHint: true, openWorldHint: false },
    },
    {
      name: 'request_offer',
      title: titles[1],
      description: [
        `Asks ${store} for a concrete offer on one of its products, built around what matters most to the user. It can take a link to the same product selling for less elsewhere, which the store checks itself.`,
        `The reply has one to three offers, each with an offer_id, what is included, exact totals, the delivery time and an expiry (${OFFER_MINUTES} minutes). An offer is not always a lower price: it can be free or faster shipping, a free add-on, longer returns or credit on a later order.`,
        'Asking is free and commits the user to nothing: nothing is bought, reserved or charged, and no name, email, address or payment detail is needed. The same request gets the same offers; only a different priority, quantity, deadline or a verified cheaper link changes them.',
        `Useful before buying at the listed price, or when the user has seen the product for less elsewhere. ${whoShort}`,
      ].join('\n\n'),
      inputSchema: {
        type: 'object',
        properties: {
          ...storeField,
          product,
          quantity: { type: 'integer', minimum: 1, description: 'How many the user wants. Defaults to 1.' },
          priority: { type: 'string', enum: Object.keys(PRIORITIES), description: `What matters most to the user for this purchase: ${priorityHelp}. Left out, the reply asks which one applies.` },
          need_by_days: { type: 'number', minimum: 0, description: 'Days from today by which the user needs delivery, when there is a deadline.' },
          competing_offer_url: { type: 'string', description: 'Public page of another shop selling the same product, new and in stock, for less. The store fetches the page itself and checks the product and the price. A page it cannot read, or one showing a different product, is declined with the reason. One link per product per hour is checked.' },
          note: { type: 'string', description: 'Optional short note about what the user is looking for, kept with the request for the merchant. It does not change the offer and is no place for personal details.' },
        },
        required: connect ? ['store'] : ['product'],
      },
      annotations: { title: titles[1], readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    {
      name: 'accept_offer',
      title: titles[2],
      description: [
        `Turns one offer from request_offer into a checkout link with the approved terms applied for ${connect ? 'the store that made it' : store} and a cart link that already carries the code. It places no order and takes no payment: the purchase still happens in the store's own checkout, where the user or their agent completes it or walks away. A code that is never used simply expires, and accepting costs nothing.`,
        'A code is issued only when user_approved is true, meaning the user has seen this offer and agreed to it. Otherwise the reply is needs_approval and nothing is issued. No personal detail is needed.',
        `The reply gives the code or codes, what they do, when they expire (${CODE_MINUTES} minutes) and how to apply them: the discounts.codes field of the store's cart and checkout tools, the cart link, or the discount box at checkout. Parts that are not money at checkout (longer returns, a delivery guarantee, later credit) are added to the order after purchase and listed in the reply. Accepting the same offer again returns the same code.`,
      ].join('\n\n'),
      inputSchema: {
        type: 'object',
        properties: {
          ...storeField,
          offer_id: { type: 'string', description: 'The offer_id of the chosen offer, from request_offer.' },
          user_approved: { type: 'boolean', description: 'true once the user has seen this offer (what is included and the total) and agreed to it. With false, or left out, the reply is needs_approval and no code is issued.' },
        },
        required: [...(connect ? ['store'] : []), 'offer_id', 'user_approved'],
      },
      annotations: { title: titles[2], readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
  ];
}

function instructions(door) {
  const steps = 'say what kinds of offer a store makes on a product (get_offer_options), make concrete offers with exact totals (request_offer), and turn an offer the user agreed to into a checkout link with the approved terms applied (accept_offer)';
  if (door.connect) return `OfferAd is an offer desk that online stores install. For a store that uses it, this server can ${steps}. It answers for the seller, never places an order or takes payment, and replies store_not_enrolled for stores that do not use it.`;
  const name = shopOf(door.shop)?.name;
  return `This is the offer desk of ${name || 'this store'}, run by OfferAd for the seller. It can ${steps}. It never places an order or takes payment: buying happens in the store's own checkout.`;
}

const parseUrl = x => { try { return new URL(x); } catch { return null; } };
const bareHost = url => url.hostname.toLowerCase().replace(/^www\./, '');

// The cross-store door takes a domain or a product URL and finds the shop that
// runs the app. `hosted(url)` names the shop this worker serves on its own
// host, for the stand-in storefront; it gets the parsed URL and returns a shop or null.
export function resolveStore(store, hosted) {
  const raw = String(store ?? '').trim();
  if (!raw) return null;
  if (shopOf(raw.toLowerCase())) return { shop: raw.toLowerCase(), product: null };
  const url = parseUrl(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!url || !/^https?:$/.test(url.protocol)) return null;
  const host = bareHost(url);
  const front = k => { const u = parseUrl(SHOPS[k].storefront); return u && bareHost(u); };
  const shop = Object.keys(SHOPS).find(k => k === host || k === `${host}.myshopify.com` || front(k) === host) || hosted?.(url) || null;
  if (!shopOf(shop)) return null;
  return { shop, product: /\/products\/[^/?#]+/i.test(url.pathname) ? raw : null };
}

const given = x => x !== undefined && x !== null && x !== '';
const text = (x, max) => (given(x) && String(x).trim() ? String(x).trim().slice(0, max) : undefined);

// One reading of the arguments for every door: tool calls send JSON types,
// query strings and forms send text, and models now and then quote a number.
export function offerArgs(raw) {
  const a = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const problems = [];
  const args = {
    store: text(a.store, 500),
    product: text(a.product, 500),
    competing_offer_url: text(a.competing_offer_url, 2000),
    note: text(a.note, 500),
    offer_id: text(a.offer_id, 200),
    // Approval is never guessed: only true counts, so "yes" and 1 do not.
    user_approved: a.user_approved === true || a.user_approved === 'true',
  };
  if (given(a.quantity)) {
    const q = Number(a.quantity);
    if (Number.isInteger(q) && q >= 1) args.quantity = q;
    else problems.push('quantity is a whole number, 1 or more');
  }
  if (given(a.need_by_days)) {
    const d = Number(a.need_by_days);
    if (Number.isFinite(d) && d >= 0) args.need_by_days = d;
    else problems.push('need_by_days is a number of days, 0 or more');
  }
  if (given(a.priority)) {
    const p = String(a.priority).trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (Object.hasOwn(PRIORITIES, p)) args.priority = p;
    else problems.push(`priority is one of ${priorityList}, or left out`);
  }
  return { args, problems };
}

const invalid = problems => ({ status: 'invalid_request', error: `${problems.join('; ')}.` });

export const notEnrolled = store => ({
  status: 'store_not_enrolled',
  store: store ?? null,
  message: 'This store does not use OfferAd, so there is no offer desk to ask here. Nothing was sent to the store; its listed price and terms are what apply.',
});

// What leaves through a door: the service's reply minus any seller-only key.
export function publicReply(value) {
  if (Array.isArray(value)) return value.map(publicReply);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (PRIVATE.has(k)) { console.warn(JSON.stringify({ at: 'door', warning: `seller-only field "${k}" stopped at the door` })); continue; }
    out[k] = publicReply(v);
  }
  return out;
}

// A door that breaks answers in words the agent can use, with nothing internal
// in them; the cause goes to the log under the same reference.
function failure(e, where) {
  const ref = crypto.randomUUID().slice(0, 8);
  console.error(JSON.stringify({ at: 'door', ref, where, error: String(e?.stack || e) }));
  return { status: 'error', error: `The store could not answer just now (ref ${ref}). Nothing was bought or charged, and asking again is safe.` };
}

async function run(door, name, raw) {
  const { args, problems } = offerArgs(raw);
  let shop = door.shop;
  if (door.connect) {
    if (!args.store) return invalid(['store is needed: the store\'s domain or the product\'s page URL', ...problems]);
    const hit = resolveStore(args.store, door.hosted);
    if (!hit) return notEnrolled(args.store);
    shop = hit.shop;
    args.product ??= hit.product ?? undefined;
  } else if (!shopOf(shop)) {
    return notEnrolled(shop);
  }
  // With no session the service falls back to the caller's address, so none is made up here.
  const who = { session: door.session || undefined, client: door.client || null };
  if (name === 'accept_offer') {
    if (!args.offer_id) problems.unshift('offer_id is needed: the offer_id of one offer from request_offer');
    if (problems.length) return invalid(problems);
    return door.service.accept({ shop, offer_id: args.offer_id, user_approved: args.user_approved, ...who });
  }
  if (!args.product) problems.unshift('product is needed: its page URL, handle, id or name');
  if (problems.length) return invalid(problems);
  if (name === 'get_offer_options') return door.service.options({ shop, product: args.product, ...who });
  return door.service.request({
    shop, product: args.product, quantity: args.quantity, priority: args.priority, need_by_days: args.need_by_days,
    competing_offer_url: args.competing_offer_url, note: args.note, ...who,
  });
}

// One tool call, for this door and for the JSON door beside it. Returns only
// what may leave the service; throws only for a tool that does not exist.
// `door` = { service, shop, connect, hosted, session, client }, where client
// is { ip, name }: the address the rate limits count and a name for the log.
export async function callTool(door, name, raw) {
  if (!TOOL_NAMES.includes(name)) throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32602 });
  try {
    const out = await run(door, name, raw);
    if (!out || typeof out !== 'object') throw new Error(`${name} returned no reply`);
    return publicReply(out);
  } catch (e) {
    return failure(e, name);
  }
}

const fail = (id, code, message, data, status) => ({
  status,
  reply: { jsonrpc: '2.0', id, error: { code, message, ...(data === undefined ? {} : { data }) } },
});

// Header values that are not plain ASCII arrive as =?base64?...?= in the per-request revision.
function plain(value) {
  const m = /^=\?base64\?(.*)\?=$/.exec(value ?? '');
  if (!m) return value;
  try { return new TextDecoder().decode(Uint8Array.from(atob(m[1]), c => c.charCodeAt(0))); } catch { return value; }
}

// The per-request revision mirrors version, method and tool name into headers
// and has the server reject a request whose headers and body disagree.
// https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#server-validation
function headerMismatch(door, http, version, method, params) {
  if (!http) return null;
  const pairs = [['MCP-Protocol-Version', http.version, version], ['Mcp-Method', http.method, method]];
  if (method === 'tools/call') pairs.push(['Mcp-Name', plain(http.name), typeof params.name === 'string' ? params.name : '']);
  for (const [header, got, want] of pairs) {
    if (got == null) {
      // A proxy in front may drop headers it does not know; then the body is all there is.
      if (!door.relaxHeaders) return `${header} header is missing`;
      continue;
    }
    if (got !== want) return `${header} header value '${got}' does not match body value '${want}'`;
  }
  return null;
}

// One message in, one answer out: { reply, status, headers }. reply is null
// for notifications. Same shape of switch as the first OfferAd connector.
async function answer(door, msg, http) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg) || msg.jsonrpc !== '2.0') {
    return fail(null, -32600, 'Invalid Request: not a JSON-RPC 2.0 message', undefined, 400);
  }
  const { id, method } = msg;
  const params = msg.params && typeof msg.params === 'object' && !Array.isArray(msg.params) ? msg.params : {};
  if (typeof method !== 'string') {
    // A reply to a request this server never made: taken and dropped.
    if ('result' in msg || 'error' in msg) return { reply: null };
    return fail(null, -32600, 'Invalid Request: method is missing', undefined, 400);
  }
  if (id === undefined) return { reply: null };
  if (typeof id !== 'string' && !Number.isFinite(id)) return fail(null, -32600, 'Invalid Request: id is a string or a number', undefined, 400);

  const meta = params._meta && typeof params._meta === 'object' ? params._meta : {};
  const asked = meta[`${META}protocolVersion`];
  const handshake = method === 'initialize';
  const requested = handshake ? undefined : asked ?? http?.version ?? undefined;
  if (requested !== undefined && !SUPPORTED.includes(requested)) {
    return fail(id, -32022, 'Unsupported protocol version', { supported: SUPPORTED, requested: String(requested) }, 400);
  }
  const modern = !handshake && (PER_REQUEST.includes(requested) || method === 'server/discover');
  if (modern) {
    if (!PER_REQUEST.includes(asked)) return fail(id, -32602, `Invalid params: _meta["${META}protocolVersion"] is needed on every request and is one of ${PER_REQUEST.join(', ')}`, undefined, 400);
    const caps = meta[`${META}clientCapabilities`];
    if (!caps || typeof caps !== 'object') return fail(id, -32602, `Invalid params: _meta["${META}clientCapabilities"] is needed on every request`, undefined, 400);
    const mismatch = headerMismatch(door, http, asked, method, params);
    if (mismatch) return fail(id, -32020, `Header mismatch: ${mismatch}`, undefined, 400);
  }

  const done = (result, headers) => ({
    headers,
    reply: { jsonrpc: '2.0', id, result: modern ? { resultType: 'complete', ...result, _meta: { [`${META}serverInfo`]: SERVER } } : result },
  });
  // The per-request revision wants a freshness hint on lists; the tools are the same for every caller.
  const cached = modern ? { ttlMs: LIST_TTL_MS, cacheScope: 'public' } : {};
  const notFound = () => fail(id, -32601, `Method not found: ${method}`, undefined, modern ? 404 : undefined);

  try {
    switch (method) {
      case 'initialize': {
        const want = params.protocolVersion;
        // A fresh id per handshake gives the service a stable session to count requests against.
        return done({
          protocolVersion: HANDSHAKE.includes(want) ? want : PROTOCOL,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER,
          instructions: instructions(door),
        }, { 'Mcp-Session-Id': `${slug(params.clientInfo?.name) || 'client'}.${crypto.randomUUID()}` });
      }
      case 'server/discover':
        return done({ supportedVersions: SUPPORTED, capabilities: { tools: { listChanged: false } }, instructions: instructions(door), ...cached });
      case 'tools/list':
        return done({ tools: toolsFor(door), ...cached });
      case 'tools/call': {
        if (typeof params.name !== 'string') throw Object.assign(new Error('Invalid params: name is the name of a tool'), { code: -32602 });
        const raw = params.arguments ?? {};
        if (typeof raw !== 'object' || Array.isArray(raw)) throw Object.assign(new Error('Invalid params: arguments is an object'), { code: -32602 });
        // Who the client says it is: on every request in the per-request revision, in the session id before it.
        const agent = slug(meta[`${META}clientInfo`]?.name) || door.agent;
        const client = agent ? { ...door.client, name: (door.client?.name ? `${door.client.name} (${agent})` : agent).slice(0, 80) } : door.client;
        const out = await callTool({ ...door, client }, params.name, raw);
        return done({
          content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
          structuredContent: out,
          isError: Boolean(out.error),
        });
      }
      // The handshake revisions had these; clients of that era call them without looking at capabilities.
      case 'ping': return modern ? notFound() : done({});
      case 'resources/list': return modern ? notFound() : done({ resources: [] });
      case 'resources/templates/list': return modern ? notFound() : done({ resourceTemplates: [] });
      case 'prompts/list': return modern ? notFound() : done({ prompts: [] });
      default: return notFound();
    }
  } catch (e) {
    if (e?.code) return fail(id, e.code, String(e.message || e));
    console.error(JSON.stringify({ at: 'mcp', method, error: String(e?.stack || e) }));
    return fail(id, -32603, 'Internal error');
  }
}

// One JSON-RPC message, for callers without HTTP around it. null for a notification.
export async function rpc(door, msg) {
  return (await answer(door, msg, null)).reply;
}

// A request body as bytes, or null when it is larger than `max`: these doors
// are open to anyone, so nothing is read without a limit. The bytes are kept as
// they arrived for the callers that check a signature over them.
export async function readBytes(request, max = MAX_BODY) {
  if (Number(request.headers.get('content-length')) > max) return null;
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.byteLength; }
  return out;
}

// The same body as text, or null when it is too large.
export async function readBody(request, max = MAX_BODY) {
  const bytes = await readBytes(request, max);
  return bytes && new TextDecoder().decode(bytes);
}

const send = ({ reply, status, headers }) => (reply
  ? Response.json(reply, { status: status || 200, headers: { ...CORS, ...headers } })
  : new Response(null, { status: 202, headers: CORS }));

// The HTTP door. `door` = { service, shop, connect, hosted, session, client, relaxHeaders }:
// shop is fixed for a store's own endpoint; with connect every tool names its store.
export async function handleMcp(request, door) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  // POST is the whole transport: there is no stream to open with GET and no session to end with DELETE.
  if (request.method !== 'POST') {
    return Response.json({ error: 'This is an MCP endpoint (Streamable HTTP): send JSON-RPC 2.0 messages with POST.' }, { status: 405, headers: { ...CORS, Allow: 'POST, OPTIONS' } });
  }
  const body = await readBody(request);
  if (body === null) return send(fail(null, -32600, 'Invalid Request: body too large', undefined, 413));
  let msg;
  try { msg = JSON.parse(body); } catch { return send(fail(null, -32700, 'Parse error', undefined, 400)); }

  const header = name => request.headers.get(name);
  const sid = header('mcp-session-id');
  const held = sid && SESSION_ID.test(sid);
  const call = { ...door, session: held ? `mcp:${sid}` : door.session, agent: held ? SESSION_NAME.exec(sid)?.[1] : undefined };

  // Batches left the protocol with 2025-06-18; clients of the revision before it still send them.
  if (Array.isArray(msg)) {
    if (!msg.length || msg.length > MAX_BATCH) return send(fail(null, -32600, `Invalid Request: a batch holds 1 to ${MAX_BATCH} messages`, undefined, 400));
    const replies = [];
    for (const m of msg) {
      const { reply } = await answer(call, m, null);
      if (reply) replies.push(reply);
    }
    return replies.length ? Response.json(replies, { headers: CORS }) : new Response(null, { status: 202, headers: CORS });
  }
  return send(await answer(call, msg, { version: header('mcp-protocol-version'), method: header('mcp-method'), name: header('mcp-name') }));
}
