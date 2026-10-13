// Seller mandates: what each shop told OfferAd it may give, per product.
// In the app these come from the merchant's settings; here they are the two
// shops the prototype runs against. Costs, floors and budgets never leave the
// service: publicOffer() in policy.js strips them from every reply.

const gid = id => `gid://shopify/ProductVariant/${id}`;

// Concessions shared by a shop's products unless a product overrides them.
const SNOWBOARD_SHOP = {
  currency: 'USD',
  pace: 'balanced',
  shipping: { standard: { days: 6, price: 19.9, cost: 19.9 }, express: { days: 2, price: 39.9, cost: 34 } },
  concessions: {
    price: { on: true },
    free_shipping: { on: true },
    express_upgrade: { on: true },
    gift: { on: true, variant_id: gid('45900666142883'), handle: 'selling-plans-ski-wax', title: 'Ski wax (regular $24.95)', value: 24.95, cost: 8 },
    extended_returns: { on: true, days: 60, base_days: 30, cost: 6 },
    delivery_guarantee: { on: true, credit: 25, cost: 3 },
    next_order_credit: { on: true, amount: 40, cost: 18, valid_days: 90 },
    bulk: { on: true, tiers: [{ qty: 2, pct: 5 }, { qty: 4, pct: 8 }] },
  },
  price_match: {
    on: true,
    beat_by: 0,
    trusted_domains: ['rei.com', 'evo.com', 'backcountry.com', 'burton.com', 'tactics.com', 'peakboards.demo'],
    blocked_domains: ['ebay.', 'facebook.com', 'craigslist.org', 'aliexpress.', 'temu.com', 'mercari.com', 'poshmark.com'],
    untrusted_cap_pct: 5,
    title_match_cap_pct: 5,
    min_price_ratio: 0.5,
  },
};

const product = (shop, p) => ({
  ...shop,
  ...p.overrides,
  shop: shop.shop,
  product: { id: p.id, variant_id: gid(p.variant), variant_numeric_id: p.variant, handle: p.handle, title: p.title, brand: p.brand, gtin: p.gtin ?? null, mpn: p.mpn ?? null, sku: p.sku ?? null, list: p.list, currency: shop.currency },
  unit_cost: p.unit_cost,
  floor: p.floor,
  stock: p.stock,
  budget_per_order: p.budget_per_order,
});

// The catalog is the sample catalog of the development store, with identifiers
// and costs added by hand so price matching has something to compare.
const SNOWBOARDS = [
  { id: '8778500112547', variant: '45900666110115', handle: 'the-complete-snowboard', title: 'The Complete Snowboard', brand: 'Snowboard Vendor', gtin: '0840123456784', mpn: 'SV-COMPLETE-154', list: 699.95, unit_cost: 410, floor: 545, stock: 10, budget_per_order: 150 },
  { id: '8778500047011', variant: '45900666077347', handle: 'the-videographer-snowboard', title: 'The Videographer Snowboard', brand: 'Snowboard Vendor', gtin: '0840123456791', mpn: 'SV-VIDEO-158', list: 885.95, unit_cost: 520, floor: 690, stock: 6, budget_per_order: 190 },
  { id: '8778500014243', variant: '45900666011811', handle: 'the-collection-snowboard-hydrogen', title: 'The Collection Snowboard: Hydrogen', brand: 'Hydrogen Vendor', gtin: '0840123456807', mpn: 'HV-HYDRO-152', list: 600, unit_cost: 350, floor: 470, stock: 20, budget_per_order: 130 },
  { id: '8778499948707', variant: '45900666142883', handle: 'selling-plans-ski-wax', title: 'Selling Plans Ski Wax', brand: 'Snowboard Vendor', gtin: '0840123456814', mpn: 'SV-WAX-50', list: 24.95, unit_cost: 8, floor: 16, stock: 200, budget_per_order: 9,
    overrides: { concessions: { ...SNOWBOARD_SHOP.concessions, gift: { on: false }, express_upgrade: { on: false }, next_order_credit: { on: true, amount: 5, cost: 2, valid_days: 90 }, extended_returns: { on: false }, delivery_guarantee: { on: false } } } },
];

export const SHOPS = {
  // The owner's development store: codes are minted through the Admin API.
  'mustafa-test-dev.myshopify.com': { ...SNOWBOARD_SHOP, shop: 'mustafa-test-dev.myshopify.com', name: 'Mustafa Test Dev', storefront: 'https://mustafa-test-dev.myshopify.com', settle: 'shopify', price_match: { ...SNOWBOARD_SHOP.price_match, trusted_domains: SNOWBOARD_SHOP.price_match.trusted_domains.filter(host => host !== 'peakboards.demo') } },
  // The stand-in storefront this worker serves itself, for agent runs that need a public page.
  demo: { ...SNOWBOARD_SHOP, shop: 'demo', name: 'Powder Lab', storefront: null, settle: 'dry' },
};

export const shopConfig = shop => SHOPS[shop] || null;

export function listProducts(shop) {
  const s = SHOPS[shop];
  return s ? SNOWBOARDS.map(p => product(s, p)) : [];
}

const norm = x => String(x ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Find a product from whatever the agent sent: a variant or product id (numeric
// or gid), a handle, a product URL, or words from the title.
export function mandateFor(shop, ref) {
  const all = listProducts(shop);
  const raw = String(ref ?? '').trim();
  if (!raw) return null;
  const digits = raw.match(/(\d{8,})/g) || [];
  for (const d of digits) {
    const hit = all.find(m => m.product.variant_numeric_id === d || m.product.id === d);
    if (hit) return hit;
  }
  const handle = (raw.match(/\/products\/([a-z0-9-]+)/i) || [])[1] || raw;
  const byHandle = all.find(m => m.product.handle === handle.toLowerCase());
  if (byHandle) return byHandle;
  const words = norm(raw).split(' ').filter(w => w.length > 2);
  if (!words.length) return null;
  const scored = all.map(m => ({ m, score: words.filter(w => norm(m.product.title).includes(w)).length / words.length })).sort((a, b) => b.score - a.score);
  return scored[0].score >= 0.6 ? scored[0].m : null;
}
