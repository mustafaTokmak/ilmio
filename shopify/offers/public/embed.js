// OfferAd storefront script. One tag on a store's pages does up to three
// things, each on its own and each silent when it cannot work:
//   - registers two WebMCP tools next to the ones the site already has,
//   - with data-box, shows an "Ask this store for an offer" box on product pages,
//   - with data-jsonld, adds a schema.org pointer to the offer desk.
// Settings come from window.OfferAd = { endpoint, product, shop } or from data-
// attributes on the script tag (data-endpoint, data-product, data-shop,
// data-webmcp="false", data-box, data-jsonld, data-box-target). The only global
// touched is window.OfferAd, and nothing here may break the page it runs on.
(() => {
  'use strict';
  try {
    const script = document.currentScript;
    const given = window.OfferAd && typeof window.OfferAd === 'object' ? window.OfferAd : {};
    // A second copy of the tag does nothing.
    if (given.loaded) return;

    const attr = name => (script && script.getAttribute ? script.getAttribute(`data-${name}`) : null);
    const setting = (key, name = key) => (given[key] !== undefined && given[key] !== null ? given[key] : attr(name));
    // Theme settings arrive as text, so "false" has to mean off.
    const wants = (key, fallback, name) => {
      const v = setting(key, name);
      return v === null ? fallback : !(v === false || /^(false|0|off|no)$/i.test(String(v).trim()));
    };
    const text = v => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');

    // The desk lives where the script was loaded from unless the tag says otherwise.
    const from = setting('endpoint') || (script && script.src ? String(script.src).replace(/\/embed\.js(?:[?#].*)?$/, '') : '');
    if (!from) return;
    const base = new URL(String(from), location.href).href.replace(/\/+$/, '');
    if (!/^https?:/.test(base)) return;

    const onPage = (location.pathname.match(/\/products\/([^/?#]+)/) || [])[1] || '';
    let handle = onPage;
    try { handle = decodeURIComponent(onPage); } catch (e) { /* keep the raw segment */ }
    const product = text(setting('product')) || handle || null;
    const shop = text(setting('shop')) || text(window.Shopify && window.Shopify.shop) || null;
    window.OfferAd = Object.assign(given, { loaded: true });

    const ASK = 'Ask this store for an offer';
    const offerUrl = `${base}/offer${product ? `?product=${encodeURIComponent(product)}` : ''}`;
    const PRIORITIES = ['lowest_price', 'fast_delivery', 'easy_returns', 'extras', 'repeat_purchase'];
    const OFFER_KEYS = ['offer_id', 'kind', 'headline', 'quantity', 'total', 'list_total', 'you_save', 'extras_value', 'ship_days', 'currency', 'expires_at'];

    const clean = fields => {
      const out = {};
      for (const key of Object.keys(fields)) if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') out[key] = fields[key];
      return out;
    };

    // The page's own cookies go along on purpose: a store behind a storefront
    // password answers its app proxy only to a visitor who is already inside.
    const post = async (path, body, signal) => {
      try {
        const res = await fetch(`${base}${path}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify(body),
          signal,
        });
        const reply = await res.json();
        if (reply && typeof reply === 'object') return reply;
      } catch (e) { /* answered below */ }
      return { status: 'error', error: 'The store could not answer just now. Nothing was bought or charged, and asking again is safe.' };
    };

    // A model reads tool output on a small budget (Chrome suggests 1.5K
    // characters), so the reply keeps what it takes to choose and to accept.
    // The headline already names every part of an offer.
    const brief = reply => {
      const out = { status: reply.status };
      if (Array.isArray(reply.offers)) {
        out.offers = reply.offers.map(o => {
          const kept = {};
          for (const key of OFFER_KEYS) if (o && o[key] !== undefined && o[key] !== null) kept[key] = o[key];
          return kept;
        });
      }
      if (reply.question) out.question = reply.question.text || reply.question;
      for (const key of ['notes', 'proof', 'next', 'reason', 'message', 'error']) {
        if (reply[key] !== undefined && reply[key] !== null && !(Array.isArray(reply[key]) && !reply[key].length)) out[key] = reply[key];
      }
      return out;
    };

    // The descriptions say what happens and leave the decision to the agent.
    // They stay inside Chrome's budgets: 500 characters a tool, 150 a parameter.
    // https://developer.chrome.com/docs/ai/webmcp/secure-tools
    const tools = [
      {
        name: 'request_store_offer',
        title: ASK,
        description: 'Asks this store for an offer on a product, built around what matters to the user: a lower price, free or faster shipping, a free add-on, longer returns or credit on a later order. Can take a link to the same product selling for less elsewhere; the store checks that page itself. Returns one to three offers with exact totals and an offer_id. Asking is free: nothing is bought, reserved or added to the cart, and no personal data is needed.',
        inputSchema: {
          type: 'object',
          properties: {
            product: { type: 'string', description: `The product: its page URL, handle or name.${product ? ' Left out, it is the product on this page.' : ''}` },
            quantity: { type: 'integer', minimum: 1, description: 'How many the user wants. Defaults to 1.' },
            priority: { type: 'string', enum: PRIORITIES, description: 'What matters most to the user for this purchase. Left out, the reply asks.' },
            need_by_days: { type: 'number', minimum: 0, description: 'Days from today the user can wait for delivery, when there is a deadline.' },
            competing_offer_url: { type: 'string', description: 'Another shop\'s public page for the same product, new and in stock, at a lower price.' },
          },
          required: product ? [] : ['product'],
        },
        // The reply can quote what the store found on another shop's page.
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute: async (input, options) => {
          const a = input && typeof input === 'object' ? input : {};
          const item = text(a.product) || product;
          if (!item) return { status: 'invalid_request', error: 'product is needed: the product page URL, its handle or its name.' };
          return brief(await post('/api/offers/request', clean({
            shop, product: item, quantity: a.quantity, priority: a.priority, need_by_days: a.need_by_days, competing_offer_url: a.competing_offer_url,
          }), options && options.signal));
        },
      },
      {
        name: 'accept_store_offer',
        title: 'Accept an offer and prepare checkout',
        description: 'Prepares one offer from request_store_offer for this store\'s checkout. The reply gives a checkout link: either a cart with single-use codes or an invoice with the full quoted price, items and shipping already applied. Nothing is bought or charged: the purchase still happens in the store\'s normal checkout, and a code that is never used simply expires. A code is issued only when user_approved is true, meaning the user has seen the offer and agreed to it.',
        inputSchema: {
          type: 'object',
          properties: {
            offer_id: { type: 'string', description: 'The offer_id of the chosen offer, from request_store_offer.' },
            user_approved: { type: 'boolean', description: 'true when the user has seen this offer and agreed to it. Otherwise no code is issued.' },
          },
          required: ['offer_id', 'user_approved'],
        },
        annotations: { readOnlyHint: false },
        execute: async (input, options) => {
          const a = input && typeof input === 'object' ? input : {};
          const id = text(a.offer_id);
          if (!id) return { status: 'invalid_request', error: 'offer_id is needed: the offer_id of one offer from request_store_offer.' };
          // Approval is never guessed: only true counts.
          return post('/api/offers/accept', clean({ shop, offer_id: id, user_approved: a.user_approved === true }), options && options.signal);
        },
      },
    ];

    // WebMCP as documented today: document.modelContext.registerTool(tool),
    // one call per tool, returning a promise.
    // https://developer.chrome.com/docs/ai/webmcp/imperative-api
    // Browsers from before the move to document kept it on navigator, so that
    // is looked at second. registerTool is the only call made: it adds a tool
    // and cannot remove or replace one, and a name that is already taken is
    // refused by the browser, which leaves the site's tool as it was.
    const context = () => {
      const found = document.modelContext || (typeof navigator === 'object' && navigator && navigator.modelContext) || null;
      return found && typeof found.registerTool === 'function' ? found : null;
    };
    const register = found => {
      for (const tool of tools) {
        try {
          const done = found.registerTool(tool);
          if (done && typeof done.catch === 'function') done.catch(() => {});
        } catch (e) { /* refused: nothing to do */ }
      }
    };
    if (wants('webmcp', true)) {
      // On a Shopify storefront the API shows up only after the page's
      // origin-trial token is processed, so one look at load time would miss it.
      // Keep looking until a little after the page has loaded, then stop.
      let stopAt = 0;
      let looks = 0;
      const loaded = () => { stopAt = Date.now() + 3000; };
      if (document.readyState === 'complete') loaded();
      else window.addEventListener('load', loaded, { once: true });
      const look = () => {
        const found = context();
        if (found) return register(found);
        if (++looks < 240 && (!stopAt || Date.now() < stopAt)) setTimeout(look, 250);
        return undefined;
      };
      look();
    }

    const el = (tag, words, style) => {
      const node = document.createElement(tag);
      if (words) node.textContent = words;
      if (style) node.setAttribute('style', style);
      return node;
    };

    // Under the price where the theme has a known spot for it, else above the
    // buy form, else at the end of the page's main content.
    const PRICE = '.product__info-container .price, .product-single__price, .product__price, [data-product-price], #ProductPrice';
    const showBox = () => {
      if (!product || document.getElementById('offerad-box')) return;
      const box = el('aside', '', 'margin:16px 0;padding:14px 16px;border:1px solid #c9d3dc;border-radius:10px;background:#f4f7fa;color:#16222c;font:inherit;line-height:1.5');
      box.id = 'offerad-box';
      box.setAttribute('aria-label', ASK);
      box.appendChild(el('strong', ASK, 'display:block;font-size:1.05em'));
      box.appendChild(el('span', 'Tell the store what matters most to you (price, delivery speed, returns or an extra in the box) and it answers with a concrete offer. Seen it for less at another shop? Send the link and the store checks it.', 'display:block;margin:4px 0 10px'));
      const link = el('a', 'Ask for an offer', 'font-weight:600;text-decoration:underline;color:#0a5ea8');
      link.href = offerUrl;
      box.appendChild(link);
      let spot = null;
      try { spot = document.querySelector(text(setting('boxTarget', 'box-target')) || PRICE); } catch (e) { /* a selector the merchant mistyped */ }
      const form = spot ? null : document.querySelector('form[action*="/cart/add"]');
      if (spot && spot.parentNode) spot.parentNode.insertBefore(box, spot.nextSibling);
      else if (form && form.parentNode) form.parentNode.insertBefore(box, form);
      else (document.querySelector('main') || document.body).appendChild(box);
    };

    // A WebPage node, not a second Product: the theme already describes the
    // product, and a Product with no price would fail rich-result checks.
    const addPointer = () => {
      if (document.getElementById('offerad-jsonld')) return;
      const canonical = document.querySelector('link[rel="canonical"]');
      const page = (canonical && canonical.href) || `${location.origin}${location.pathname}`;
      const named = document.querySelector('meta[property="og:title"]');
      const node = el('script');
      node.type = 'application/ld+json';
      node.id = 'offerad-jsonld';
      node.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        url: page,
        potentialAction: clean({
          '@type': 'QuoteAction',
          name: ASK,
          description: 'The store answers with one to three concrete offers: a lower price, free or faster shipping, a free add-on, longer returns or credit on a later order. Asking is free and nothing is bought.',
          object: product ? { '@type': 'Product', name: (named && named.content) || document.title || product, url: page } : null,
          target: [
            { '@type': 'EntryPoint', name: 'Web form', urlTemplate: offerUrl, httpMethod: 'GET', contentType: 'text/html' },
            { '@type': 'EntryPoint', name: 'JSON', urlTemplate: `${base}/api/offers/request`, httpMethod: 'POST', encodingType: 'application/json', contentType: 'application/json', description: `Described in ${base}/openapi.json.` },
          ],
        }),
      });
      (document.head || document.body).appendChild(node);
    };

    const whenParsed = run => {
      const safely = () => { try { run(); } catch (e) { /* the page goes on without it */ } };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safely, { once: true });
      else safely();
    };
    if (wants('box', false)) whenParsed(showBox);
    if (wants('jsonld', false)) whenParsed(addPointer);
  } catch (e) { /* a storefront never breaks because of this script */ }
})();
