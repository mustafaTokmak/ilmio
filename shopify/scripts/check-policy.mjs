// Checks the offer policy against the demo mandates. Run: node shopify/scripts/check-policy.mjs
import assert from 'node:assert/strict';
import { decide, checkOffer, publicOffer, roomFor, unitFloor } from '../offers/src/lib/policy.js';
import { mandateFor, listProducts } from '../offers/src/lib/mandates.js';

const shop = 'demo';
const board = mandateFor(shop, 'the-complete-snowboard');
const wax = mandateFor(shop, 'https://x.example/products/selling-plans-ski-wax?variant=1');
assert.equal(board.product.title, 'The Complete Snowboard');
assert.equal(wax.product.handle, 'selling-plans-ski-wax');
assert.equal(mandateFor(shop, 'gid://shopify/ProductVariant/45900666110115').product.handle, 'the-complete-snowboard');
assert.equal(mandateFor(shop, 'complete snowboard').product.handle, 'the-complete-snowboard');
assert.equal(mandateFor(shop, 'toaster'), null);

const show = (title, d) => {
  console.log(`\n== ${title} -> ${d.status}`);
  for (const o of d.offers) console.log(`   [${o.kind}] ${o.headline} | total ${o.total} (list ${o.list_total}), unit ${o.unit_price}, extras ${o.extras_value}, ships ${o.ship_days}d, seller cost ${o.seller_cost}`);
  for (const n of d.notes) console.log(`   note: ${n}`);
  if (d.question) console.log('   question: ' + d.question.text);
};

// Every offer of every product, every priority and quantity, holds the floor and the budget.
for (const m of listProducts(shop)) {
  for (const priority of [undefined, 'lowest_price', 'fast_delivery', 'easy_returns', 'extras', 'repeat_purchase']) {
    for (const quantity of [1, 2, 5]) {
      const d = decide(m, { priority, quantity });
      for (const o of d.offers) {
        assert.deepEqual(checkOffer(m, o), [], `${m.product.handle} ${priority} x${quantity}: ${checkOffer(m, o)}`);
        assert.ok(o.unit_price >= unitFloor(m) - 1e-9);
        assert.ok(o.seller_cost <= roomFor(m, quantity) + 1e-9);
        assert.ok(!JSON.stringify(publicOffer(o)).includes('seller_cost'));
      }
      assert.equal(JSON.stringify(decide(m, { priority, quantity })), JSON.stringify(d), 'same inputs, same offers');
    }
  }
}

const none = decide(board, {});
show('no priority', none);
assert.ok(none.question, 'asks what the buyer wants');
const price = decide(board, { priority: 'lowest_price' });
show('lowest_price', price);
const fast = decide(board, { priority: 'fast_delivery', need_by_days: 3 });
show('fast_delivery, need by 3 days', fast);
assert.equal(fast.offers[0].ship_days, 2);
show('easy_returns', decide(board, { priority: 'easy_returns' }));
show('extras', decide(board, { priority: 'extras' }));
show('repeat_purchase', decide(board, { priority: 'repeat_purchase' }));
show('lowest_price x2', decide(board, { priority: 'lowest_price', quantity: 2 }));

// A verified cheaper offer from a trusted shop: match it, and also offer value instead.
const ev = { ok: true, domain: 'evo.com', trusted_domain: true, match_by: 'gtin', price: 629.95, shipping: 0 };
const matched = decide(board, { priority: 'lowest_price' }, ev);
show('trusted proof 629.95 delivered', matched);
assert.equal(matched.status, 'price_matched');
assert.equal(matched.offers[0].total, 629.95);
assert.ok(matched.offers.some(o => o.kind === 'value_instead_of_price'));

// Too low to match: best effort with extras, floor intact, floor not revealed.
const low = decide(board, { priority: 'lowest_price' }, { ...ev, price: 499 });
show('trusted proof 499 delivered (below floor)', low);
assert.equal(low.status, 'cannot_match_best_effort');
assert.ok(low.offers[0].unit_price >= unitFloor(board));
assert.ok(!JSON.stringify({ o: low.offers.map(publicOffer), n: low.notes }).includes(String(board.floor)));

// An unlisted shop moves the price only a little.
const unlisted = decide(board, { priority: 'lowest_price' }, { ...ev, domain: 'random-shop.example', trusted_domain: false });
show('unlisted shop proof 629.95', unlisted);
assert.ok(unlisted.offers[0].components.find(c => c.type === 'price').amount_off <= 699.95 * 0.05 + 0.01);

// Their price is not lower.
show('proof not cheaper', decide(board, { priority: 'lowest_price' }, { ...ev, price: 749 }));
// Rejected proof.
show('proof rejected', decide(board, { priority: 'lowest_price' }, { ok: false, reason: 'different_product', reason_text: 'the page shows a different product' }));
show('wax lowest_price', decide(wax, { priority: 'lowest_price' }));
show('over stock', decide(board, { quantity: 99 }));
console.log('\npolicy checks passed');
