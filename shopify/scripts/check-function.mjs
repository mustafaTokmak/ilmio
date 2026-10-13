// Checks the Discount Function without Shopify. Runs both targets on sample
// carts for every shape of offer and holds each result to the output rules of
// the Discount Function API, then checks what the CLI would only complain about
// at build or deploy time: the input queries against the schema, and the wiring
// between the toml files, the exports and the embed block.
// Run: node shopify/scripts/check-function.mjs
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import * as fn from '../app/extensions/offer-discount/src/index.js';
import { decide, publicOffer, r2 } from '../offers/src/lib/policy.js';
import { SHOPS, listProducts, mandateFor } from '../offers/src/lib/mandates.js';

const app = new URL('../app/', import.meta.url);
const ext = new URL('extensions/offer-discount/', app);
const read = (base, path) => readFileSync(new URL(path, base), 'utf8');

// First the schema and the input queries. This reads just enough SDL to know
// every type's fields, their arguments and what they return.
function readSchema(sdl) {
  const text = sdl.replace(/"""[\s\S]*?"""/g, '').replace(/^directive .*$/gm, '').replace(/@\w+(\([^)]*\))?/g, '');
  // The built-in scalars are not declared in a schema file.
  const types = Object.fromEntries(['Int', 'Float', 'String', 'Boolean', 'ID'].map(name => [name, { leaf: true }]));
  for (const [, name, members] of text.matchAll(/^union (\w+) = (\w+(?: \| \w+)*)$/gm)) types[name] = { members: members.split(' | ') };
  for (const [, name] of text.matchAll(/^(?:scalar|enum) (\w+)/gm)) types[name] = { leaf: true };
  for (const [, name, impl, body] of text.matchAll(/^(?:type|interface) (\w+)(?: implements ([\w &]+?))? \{([^}]*)\}/gm)) {
    const fields = {};
    for (const [, field, args, type] of body.matchAll(/(\w+)\s*(?:\(([^)]*)\))?\s*:\s*([\w[\]!]+)/g)) {
      fields[field] = { type: type.replace(/[[\]!]/g, ''), args: [...(args ?? '').matchAll(/(\w+)\s*:/g)].map(a => a[1]) };
    }
    types[name] = { fields, interfaces: impl ? impl.split(/\s*&\s*/) : [] };
  }
  return types;
}

// An input query as a tree of selections. Covers what these queries use:
// fields, arguments with plain values, aliases and inline fragments.
function readQuery(text) {
  const tokens = text.replace(/#.*$/gm, '').match(/\.\.\.|[{}():]|"(?:[^"\\]|\\.)*"|[^\s{}():,]+/g);
  let i = 0;
  const take = want => {
    const t = tokens[i++];
    if (want) assert.equal(t, want, `input query: expected ${want}, got ${t}`);
    return t;
  };
  const selectionSet = () => {
    const out = [];
    take('{');
    while (tokens[i] !== '}') {
      if (tokens[i] === '...') {
        take();
        take('on');
        out.push({ on: take(), selection: selectionSet() });
        continue;
      }
      let field = take();
      if (tokens[i] === ':') {
        take();
        field = take();
      }
      const args = [];
      if (tokens[i] === '(') {
        take();
        while (tokens[i] !== ')') {
          args.push(take());
          take(':');
          take();
        }
        take();
      }
      out.push({ field, args, selection: tokens[i] === '{' ? selectionSet() : null });
    }
    take('}');
    return out;
  };
  take('query');
  const name = take();
  const selection = selectionSet();
  assert.equal(i, tokens.length, 'input query: nothing after the closing brace');
  return { name, selection };
}

// Every selection exists on its type; returns the cost Shopify charges the query.
// https://shopify.dev/docs/api/functions/latest#input-query-limits
function checkSelection(types, selection, typeName, path) {
  const type = types[typeName];
  let cost = 0;
  for (const node of selection) {
    if (node.on) {
      const possible = node.on === typeName || type.members?.includes(node.on) || types[node.on]?.interfaces?.includes(typeName);
      assert.ok(possible, `${path}: "... on ${node.on}" cannot match ${typeName}`);
      cost += checkSelection(types, node.selection, node.on, path);
      continue;
    }
    if (node.field === '__typename') continue;
    const def = type.fields?.[node.field];
    assert.ok(def, `${path}.${node.field}: no such field on ${typeName}`);
    for (const arg of node.args) assert.ok(def.args.includes(arg), `${path}.${node.field}: no argument ${arg}`);
    const returns = types[def.type];
    assert.ok(returns, `${path}.${node.field}: unknown type ${def.type}`);
    if (returns.leaf) {
      assert.equal(node.selection, null, `${path}.${node.field} is a ${def.type} and takes no selection`);
      cost += typeName === 'Metafield' ? 0 : 1;
    } else {
      assert.ok(node.selection?.length, `${path}.${node.field} is a ${def.type} and needs a selection`);
      cost += (def.type === 'Metafield' ? 3 : 0) + checkSelection(types, node.selection, def.type, `${path}.${node.field}`);
    }
  }
  return cost;
}

// A sample input may only hold what its query selects, or a check would pass
// on data the function never gets from Shopify.
function conforms(value, selection, path) {
  if (Array.isArray(value)) return value.forEach((v, i) => conforms(v, selection, `${path}[${i}]`));
  if (!value || typeof value !== 'object') return;
  const flat = sel => sel.flatMap(n => (n.on ? flat(n.selection) : [n]));
  const fields = new Map(flat(selection).map(n => [n.field, n]));
  for (const [key, v] of Object.entries(value)) {
    assert.ok(fields.has(key), `${path}.${key} is in the sample input but not in the input query`);
    if (fields.get(key).selection) conforms(v, fields.get(key).selection, `${path}.${key}`);
  }
}

const schemaText = read(ext, 'schema.graphql');
const types = readSchema(schemaText);
const QUERY = { cart: 'src/cart_lines_discounts_generate_run.graphql', delivery: 'src/cart_delivery_options_discounts_generate_run.graphql' };
const queries = {};
for (const [target, path] of Object.entries(QUERY)) {
  const text = read(ext, path);
  queries[target] = readQuery(text);
  const cost = checkSelection(types, queries[target].selection, 'Input', 'Input');
  assert.ok(cost <= 30, `${path}: query cost ${cost} is over 30`);
  assert.ok(Buffer.byteLength(text) <= 3000, `${path}: over 3000 bytes`);
  console.log(`${path}: every field is in schema.graphql, cost ${cost} of 30`);
}
// The reader has to be able to fail, or the lines above prove nothing.
assert.throws(() => checkSelection(types, readQuery('query Q { cart { lines { price } } }').selection, 'Input', 'Input'), /no such field/);
assert.throws(() => checkSelection(types, readQuery('query Q { cart { lines { merchandise { ... on Product { id } } } } }').selection, 'Input', 'Input'), /cannot match/);
assert.throws(() => checkSelection(types, readQuery('query Q { cart { lines } }').selection, 'Input', 'Input'), /needs a selection/);

// The output rules: https://shopify.dev/docs/api/functions/latest/discount#validations
// and the result types in schema.graphql. A code-owned function may add discounts
// but not accept or reject codes, so each target has exactly one operation to use.
const DECIMAL = /^\d+(\.\d+)?$/;
const OPERATION = { cart: 'productDiscountsAdd', delivery: 'deliveryDiscountsAdd' };
const STRATEGIES = { cart: ['ALL', 'FIRST', 'MAXIMUM'], delivery: ['ALL'] };
const only = (object, keys, what) => assert.deepEqual(Object.keys(object).filter(k => !keys.includes(k)), [], `${what}: unexpected keys`);

function checkValue(target, value, what) {
  assert.equal(Object.keys(value).length, 1, `${what}: a value is a percentage or a fixed amount, not both`);
  if (value.percentage) {
    only(value.percentage, ['value'], what);
    // Decimal is serialized as a string.
    assert.equal(typeof value.percentage.value, 'string', `${what}: percentage is a decimal string`);
    assert.match(value.percentage.value, DECIMAL, what);
    assert.ok(Number(value.percentage.value) > 0 && Number(value.percentage.value) <= 100, `${what}: percentage within 0 to 100`);
    return;
  }
  assert.ok(value.fixedAmount, `${what}: unknown kind of value`);
  // appliesToEachItem exists on product candidates only.
  only(value.fixedAmount, target === 'cart' ? ['amount', 'appliesToEachItem'] : ['amount'], what);
  assert.equal(typeof value.fixedAmount.amount, 'string', `${what}: amount is a decimal string`);
  assert.match(value.fixedAmount.amount, DECIMAL, what);
  assert.ok(Number(value.fixedAmount.amount) > 0, `${what}: amount above zero`);
  if ('appliesToEachItem' in value.fixedAmount) assert.equal(typeof value.fixedAmount.appliesToEachItem, 'boolean', what);
}

function checkResult(target, input, result) {
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result, 'the result is plain JSON');
  only(result, ['operations'], 'result');
  assert.ok(Array.isArray(result.operations), 'operations is a list');
  assert.ok(Buffer.byteLength(JSON.stringify(result)) <= 20000, 'output under 20 kB');
  assert.ok(result.operations.length <= 1, 'one of each operation at most, and each target has one to use');
  for (const operation of result.operations) {
    assert.deepEqual(Object.keys(operation), [OPERATION[target]], `${target}: the operation is ${OPERATION[target]}`);
    const { candidates, selectionStrategy, ...rest } = operation[OPERATION[target]];
    assert.deepEqual(rest, {});
    assert.ok(STRATEGIES[target].includes(selectionStrategy), `${target}: selection strategy ${selectionStrategy}`);
    assert.ok(Array.isArray(candidates) && candidates.length, 'an operation has candidates');
    const lines = new Map((input.cart.lines ?? []).map(l => [l.id, l]));
    const handles = new Set((input.cart.deliveryGroups ?? []).flatMap(g => g.deliveryOptions.map(o => o.handle)));
    candidates.forEach((candidate, n) => {
      const what = `${target} candidate ${n}`;
      // No associatedDiscountCode: for a code discount Shopify overwrites it with the triggering code.
      only(candidate, ['message', 'targets', 'value'], what);
      assert.ok(typeof candidate.message === 'string' && candidate.message.trim() && candidate.message.length <= 100, `${what}: a short message`);
      assert.ok(Array.isArray(candidate.targets) && candidate.targets.length, `${what}: targets present`);
      const seen = new Set();
      for (const t of candidate.targets) {
        assert.equal(Object.keys(t).length, 1, `${what}: a target is one thing`);
        if (target === 'cart') {
          only(t.cartLine, ['id', 'quantity'], what);
          const line = lines.get(t.cartLine.id);
          assert.ok(line, `${what}: targets a line that is in the cart`);
          // Shopify reads a missing quantity as the whole line. The function always says how many.
          assert.ok(Number.isInteger(t.cartLine.quantity) && t.cartLine.quantity > 0 && t.cartLine.quantity <= line.quantity, `${what}: quantity within the line`);
          seen.add(t.cartLine.id);
        } else {
          only(t.deliveryOption, ['handle'], what);
          assert.ok(handles.has(t.deliveryOption.handle), `${what}: targets an option the cart has`);
          seen.add(t.deliveryOption.handle);
        }
      }
      assert.equal(seen.size, candidate.targets.length, `${what}: no target twice`);
      checkValue(target, candidate.value, what);
    });
  }
}
// Same here: the rules have to be able to fail.
const lineTarget = { cartLine: { id: 'l', quantity: 1 } };
const oneLine = { cart: { lines: [{ id: 'l', quantity: 1 }] } };
const productResult = (candidate, more = {}) => ({ operations: [{ productDiscountsAdd: { candidates: [{ message: 'm', targets: [lineTarget], value: { percentage: { value: '10' } }, ...candidate }], selectionStrategy: 'ALL', ...more } }] });
checkResult('cart', oneLine, productResult({}));
assert.throws(() => checkResult('cart', oneLine, productResult({ value: { percentage: { value: 10 } } })), /decimal string/);
assert.throws(() => checkResult('cart', oneLine, productResult({ targets: [] })), /targets present/);
assert.throws(() => checkResult('cart', oneLine, productResult({ targets: [{ cartLine: { id: 'x', quantity: 1 } }] })), /in the cart/);
assert.throws(() => checkResult('cart', oneLine, productResult({ targets: [{ cartLine: { id: 'l', quantity: 2 } }] })), /within the line/);
assert.throws(() => checkResult('cart', oneLine, productResult({}, { selectionStrategy: 'BEST' })), /selection strategy/);
assert.throws(() => checkResult('cart', oneLine, { operations: [...productResult({}).operations, ...productResult({}).operations] }), /one of each operation/);
assert.throws(() => checkResult('delivery', oneLine, productResult({})), /deliveryDiscountsAdd/);

// Sample inputs, shaped like the two input queries.
const CODE = 'OFFER-7K2M9Q';
const TODAY = '2026-10-13';
const gid = n => `gid://shopify/ProductVariant/${n}`;
const board = mandateFor('demo', 'the-complete-snowboard');
const BOARD = board.product.variant_id;
const WAX = board.concessions.gift.variant_id;
const OTHER = gid('45900666077347');

// What the service writes on the discount: the public offer plus the variant it was made for.
const config = (m, offer, extra = {}) => ({ ...publicOffer(offer), variant_id: m.product.variant_id, code: CODE, expires_at: `${TODAY}T18:00:00.000Z`, ...extra });
const line = (n, variant, quantity, price, currencyCode = 'USD') => ({
  id: `gid://shopify/CartLine/${n}`,
  quantity,
  cost: { amountPerQuantity: { amount: String(price), currencyCode } },
  merchandise: variant ? { id: variant } : {},
});
const option = (handle, title, amount, deliveryMethodType = 'SHIPPING') => ({ handle, title, deliveryMethodType, cost: { amount: String(amount) } });
const group = (lines, options) => ({ cartLines: lines.map(l => ({ merchandise: l.merchandise })), deliveryOptions: options });
const STANDARD = option('standard-1', 'Standard', '19.9');
const EXPRESS = option('express-1', 'Express', '39.9');

const shared = (jsonValue, o) => ({
  discount: { discountClasses: o.classes ?? ['PRODUCT', 'SHIPPING'], metafield: jsonValue === undefined ? null : { jsonValue } },
  shop: { localTime: { date: o.date ?? TODAY } },
  triggeringDiscountCode: 'code' in o ? o.code : CODE,
});
const cartInput = (jsonValue, lines, o = {}) => ({ cart: { lines }, ...shared(jsonValue, o) });
const deliveryInput = (jsonValue, lines, groups, o = {}) => ({
  cart: { lines: lines.map(({ quantity, merchandise }) => ({ quantity, merchandise })), deliveryGroups: groups ?? [group(lines, [STANDARD, EXPRESS])] },
  ...shared(jsonValue, o),
});

const freeze = x => {
  if (x && typeof x === 'object') Object.values(x).forEach(freeze);
  return Object.freeze(x);
};
const RUN = { cart: fn.cartLinesDiscountsGenerateRun, delivery: fn.cartDeliveryOptionsDiscountsGenerateRun };
function run(target, input) {
  conforms(input, queries[target].selection, target);
  // Frozen: a function that edits its input would throw here.
  const result = RUN[target](freeze(structuredClone(input)));
  assert.deepEqual(RUN[target](input), result, 'same input, same result');
  checkResult(target, input, result);
  return result;
}
const runCart = (jsonValue, lines, o) => run('cart', cartInput(jsonValue, lines, o));
const runDelivery = (jsonValue, lines, groups, o) => run('delivery', deliveryInput(jsonValue, lines, groups, o));
const candidates = result => result.operations[0]?.[Object.keys(result.operations[0])[0]].candidates ?? [];
const NOTHING = { operations: [] };

const show = (title, result) => {
  console.log(`\n== ${title}`);
  if (!result.operations.length) console.log('   no operations');
  for (const c of candidates(result)) {
    const what = c.value.percentage ? `${c.value.percentage.value}% off` : `${c.value.fixedAmount.amount} off`;
    const where = c.targets.map(t => (t.cartLine ? `${t.cartLine.id.split('/').pop()} x${t.cartLine.quantity}` : t.deliveryOption.handle)).join(', ');
    console.log(`   ${what} on ${c.targets[0].cartLine ? 'line' : 'option'} ${where} | "${c.message}"`);
  }
};

// The cart target.
const boardLine = (quantity = 1, n = 1) => line(n, BOARD, quantity, 699.95);
const waxLine = (quantity = 1, n = 2) => line(n, WAX, quantity, 24.95);

// Price only.
const priceOffer = decide(board, { priority: 'lowest_price' }).offers[0];
assert.deepEqual(priceOffer.components.map(c => c.type), ['price']);
const price = config(board, priceOffer);
let result = runCart(price, [boardLine()]);
show('price only, one unit in the cart', result);
assert.deepEqual(result, {
  operations: [{
    productDiscountsAdd: {
      candidates: [{ message: '$112 off', targets: [{ cartLine: { id: 'gid://shopify/CartLine/1', quantity: 1 } }], value: { fixedAmount: { amount: '112.00', appliesToEachItem: false } } }],
      selectionStrategy: 'ALL',
    },
  }],
});
assert.deepEqual(runDelivery(price, [boardLine()]), NOTHING, 'a price offer leaves shipping alone');
// Other things in the cart are not touched, and a third unit is not discounted.
result = runCart(price, [line(7, OTHER, 1, 885.95), line(8, null, 1, 10), boardLine(3)]);
assert.deepEqual(candidates(result)[0].targets, [{ cartLine: { id: 'gid://shopify/CartLine/1', quantity: 1 } }]);
assert.deepEqual(runCart(price, [line(7, OTHER, 1, 885.95)]), NOTHING, 'the product is not in the cart');
assert.deepEqual(runCart(price, []), NOTHING, 'empty cart');
assert.deepEqual(runCart({ ...price, items_total: undefined }, [{ ...boardLine(), quantity: undefined }]), NOTHING, 'a line without a quantity counts for nothing');
assert.deepEqual(runCart(price, [boardLine()], { classes: ['SHIPPING'] }), NOTHING, 'the discount has no PRODUCT class');

// Two price components (bulk tier plus discount), priced for two units.
const twoOffer = decide(board, { priority: 'lowest_price', quantity: 2 }).offers[0];
assert.deepEqual(twoOffer.components.map(c => c.type), ['price', 'price']);
const two = config(board, twoOffer);
result = runCart(two, [boardLine(3)]);
show('two price components for two units, three in the cart', result);
assert.deepEqual(candidates(result), [{ message: '5% off for 2 or more + $42 off', targets: [{ cartLine: { id: 'gid://shopify/CartLine/1', quantity: 2 } }], value: { fixedAmount: { amount: '112.00', appliesToEachItem: false } } }]);
result = runCart(two, [boardLine(1, 1), boardLine(2, 3)]);
show('the same, the units on two lines', result);
assert.deepEqual(candidates(result)[0].targets, [{ cartLine: { id: 'gid://shopify/CartLine/1', quantity: 1 } }, { cartLine: { id: 'gid://shopify/CartLine/3', quantity: 1 } }]);
assert.deepEqual(runCart(two, [boardLine(1)]), NOTHING, 'priced for two units, one in the cart');

// The offer is a price: a lower shelf price shrinks the amount, never the agreed total.
result = runCart(price, [line(1, BOARD, 1, 649.95)]);
show('shelf price dropped to 649.95 since the offer', result);
assert.equal(candidates(result)[0].value.fixedAmount.amount, '62.00');
assert.equal(r2(649.95 - 62), priceOffer.items_total);
assert.deepEqual(runCart(price, [line(1, BOARD, 1, 580)]), NOTHING, 'shelf price already under the agreed price');
assert.equal(candidates(runCart(price, [line(1, BOARD, 1, 749.95)]))[0].value.fixedAmount.amount, '112.00', 'a higher shelf price does not raise the amount');
assert.deepEqual(runCart(price, [line(1, BOARD, 1, 699.95, 'CAD')]), NOTHING, 'an amount in USD is not applied to a cart in CAD');
assert.equal(candidates(runCart({ ...price, currency: undefined, items_total: undefined }, [boardLine()]))[0].value.fixedAmount.amount, '112.00', 'currency and items_total are optional');

// Price plus free shipping: a matched competing offer.
const matchOffer = decide(board, { priority: 'lowest_price' }, { ok: true, domain: 'evo.com', trusted_domain: true, match_by: 'gtin', price: 629.95, shipping: 0 }).offers[0];
assert.deepEqual(matchOffer.components.map(c => c.type), ['free_shipping', 'price']);
const match = config(board, matchOffer);
result = runCart(match, [boardLine()]);
show('price plus free shipping: cart target', result);
assert.equal(candidates(result)[0].value.fixedAmount.amount, '70.00');
result = runDelivery(match, [boardLine()]);
show('price plus free shipping: delivery target', result);
assert.deepEqual(result, {
  operations: [{
    deliveryDiscountsAdd: {
      candidates: [{ message: 'Free standard shipping', targets: [{ deliveryOption: { handle: 'standard-1' } }], value: { percentage: { value: '100.0' } } }],
      selectionStrategy: 'ALL',
    },
  }],
});

// Free add-on, in the cart and not.
const giftOffer = decide(board, { priority: 'extras' }).offers[0];
assert.deepEqual(giftOffer.components.map(c => c.type), ['gift', 'free_shipping']);
const gift = config(board, giftOffer);
result = runCart(gift, [boardLine(), waxLine(2)]);
show('free add-on, two of it in the cart', result);
assert.deepEqual(candidates(result), [{ message: 'Free add-on: Ski wax (regular $24.95)', targets: [{ cartLine: { id: 'gid://shopify/CartLine/2', quantity: 1 } }], value: { percentage: { value: '100.0' } } }]);
result = runCart(gift, [boardLine()]);
show('free add-on, not in the cart', result);
assert.deepEqual(result, NOTHING);
assert.deepEqual(runCart(gift, [waxLine()]), NOTHING, 'the add-on without the product is not free');
// Price, add-on and free shipping together: two candidates in one operation.
const full = config(board, { ...giftOffer, components: [...priceOffer.components, ...giftOffer.components] }, { items_total: priceOffer.items_total });
result = runCart(full, [boardLine(), waxLine()]);
show('price and free add-on together', result);
assert.equal(result.operations.length, 1);
assert.deepEqual(candidates(result).map(c => c.targets[0].cartLine.id.split('/').pop()), ['1', '2']);
// An add-on that is the product itself cannot be told apart from the unit bought.
assert.deepEqual(runCart({ ...gift, components: [{ type: 'gift', label: 'Second one free', variant_id: BOARD }] }, [boardLine(2)]), NOTHING);
// The same add-on listed twice is still one free unit.
assert.equal(candidates(runCart({ ...gift, components: [...giftOffer.components, ...giftOffer.components] }, [boardLine(), waxLine(3)])).length, 1);
// Messages come from the offer's labels, cut to size, with a plain one when a label is missing.
const labels = { ...full, components: [{ type: 'price', amount_off: 100, label: 'y'.repeat(80) }, { type: 'price', amount_off: 12, label: 'z'.repeat(80) }, { type: 'gift', variant_id: WAX, label: 'x'.repeat(300) }, { type: 'free_shipping', label: 42 }, { type: 'express_upgrade' }] };
assert.deepEqual(candidates(runCart(labels, [boardLine(), waxLine()])).map(c => c.message), [`${'y'.repeat(80)} + ${'z'.repeat(17)}`, 'x'.repeat(100)]);
assert.deepEqual(candidates(runDelivery(labels, [boardLine(), waxLine()])).map(c => c.message), ['Free standard shipping', 'Express delivery at the standard rate']);
assert.deepEqual(candidates(runCart({ ...full, components: [{ type: 'price', amount_off: 112 }, { type: 'gift', variant_id: WAX }] }, [boardLine(), waxLine()])).map(c => c.message), ['Offer price', 'Free add-on']);

// Unknown or missing config.
for (const [why, jsonValue] of [
  ['no metafield', undefined],
  ['null', null],
  ['an empty object', {}],
  ['a list', [price]],
  ['text that is not JSON', 'OFFER'],
  ['no components', { ...price, components: undefined }],
  ['components that are not a list', { ...price, components: { type: 'price', amount_off: 112 } }],
  ['no variant', { ...price, variant_id: undefined }],
  ['only components settled after the order', { ...price, components: [{ type: 'extended_returns', days: 60 }, { type: 'next_order_credit', amount: 40 }, { type: 'something_new' }] }],
]) {
  assert.deepEqual(runCart(jsonValue, [boardLine(), waxLine()]), NOTHING, `cart: ${why}`);
  assert.deepEqual(runDelivery(jsonValue, [boardLine(), waxLine()]), NOTHING, `delivery: ${why}`);
}
// Without a variant nothing is the product, not even a line that has no variant of its own.
assert.deepEqual(runCart({ ...price, variant_id: undefined }, [line(8, null, 1, 699.95)]), NOTHING, 'no variant, a custom line in the cart');
console.log('\n== unknown or missing config: no operations from either target');
// The same offer written in the other ways the function reads.
for (const jsonValue of [
  JSON.stringify(price),
  { offer: publicOffer(priceOffer), variant_id: BOARD },
  { ...price, variant_id: undefined, product: { variant_id: BOARD } },
  { ...price, variant_id: board.product.variant_numeric_id },
  { ...price, variant_id: Number(board.product.variant_numeric_id) },
  { ...price, code: CODE.toLowerCase() },
]) assert.equal(candidates(runCart(jsonValue, [boardLine()]))[0].value.fixedAmount.amount, '112.00');

// Expired or malformed config. The offer underneath applies in full, and a bad
// component sits among good ones: it has to void the offer, not just itself.
assert.equal(candidates(runDelivery(full, [boardLine(), waxLine()])).length, 1);
const among = bad => ({ components: [...full.components, bad] });
for (const [why, change, o] of [
  ['expired three days ago', { expires_at: '2026-10-10T12:00:00.000Z' }],
  ['expired three days ago, in epoch milliseconds', { expires_at: Date.parse('2026-10-10T12:00:00Z') }],
  ['expired three days ago, in epoch seconds', { expires_at: Date.parse('2026-10-10T12:00:00Z') / 1000 }],
  ['an expiry that is not a date', { expires_at: 'soon' }],
  ['an expiry of the wrong type', { expires_at: { at: TODAY } }],
  ['an expiry beyond what a date can hold', { expires_at: 1e20 }],
  ['an amount that is not a number', among({ type: 'price', amount_off: 'a lot' })],
  ['an amount that is a flag', among({ type: 'price', amount_off: true })],
  ['an amount of zero', among({ type: 'price', amount_off: 0 })],
  ['a negative amount', among({ type: 'price', amount_off: -5 })],
  ['a price without an amount', among({ type: 'price', label: '$5 off' })],
  ['an add-on without a variant', among({ type: 'gift', label: 'Free add-on' })],
  ['a component that is not an object', among('price')],
  ['a quantity of zero', { quantity: 0 }],
  ['a quantity that is not whole', { quantity: 1.5 }],
  ['a quantity as text', { quantity: '1' }],
  ['a variant without an id', { variant_id: 'the-complete-snowboard' }],
  ['a variant that only ends in the id', { variant_id: `snowboard-${board.product.variant_numeric_id}` }],
  ['a product id where the variant goes', { variant_id: `gid://shopify/Product/${board.product.variant_numeric_id}` }],
  ['an agreed total that is not a number', { items_total: '$587.95' }],
  ['an agreed total that is blank', { items_total: '' }],
  ['an express pattern that is not a pattern', { express_pattern: '(' }],
  ['an empty express pattern', { express_pattern: ' ' }],
  ['a config written for another code', { code: 'OFFER-OTHER1' }],
  ['no code entered: an automatic discount', {}, { code: null }],
  ['no code entered and none in the config', { code: undefined }, { code: null }],
]) {
  assert.deepEqual(runCart({ ...full, ...change }, [boardLine(), waxLine()], o), NOTHING, `cart: ${why}`);
  assert.deepEqual(runDelivery({ ...full, ...change }, [boardLine(), waxLine()], undefined, o), NOTHING, `delivery: ${why}`);
}
console.log('== expired or malformed config: no operations from either target');
// The date check is a backstop with a day of slack, because the Function only
// gets the shop's local date. Inside the slack it is the discount's endsAt that ends the offer.
const applies = (change, why) => assert.equal(candidates(runCart({ ...full, ...change }, [boardLine(), waxLine()])).length, 2, why);
applies({ expires_at: '2026-10-12T23:00:00.000Z' }, 'expired yesterday: inside the slack');
assert.deepEqual(runCart({ ...full, expires_at: '2026-10-11T23:59:59.000Z' }, [boardLine(), waxLine()]), NOTHING, 'two days past: outside the slack');
applies({ expires_at: Date.parse(`${TODAY}T18:00:00Z`) }, 'an expiry in epoch milliseconds');
applies({ expires_at: Date.parse(`${TODAY}T18:00:00Z`) / 1000 }, 'an expiry in epoch seconds');
applies({ expires_at: undefined }, 'no expiry in the config');
applies({ code: undefined }, 'no code in the config: the entered one is enough');

// The delivery target.
const freeOnly = config(board, { ...giftOffer, components: giftOffer.components.filter(c => c.type === 'free_shipping') });
const fastOffer = decide(board, { priority: 'fast_delivery', need_by_days: 3 }).offers[0];
assert.deepEqual(fastOffer.components.map(c => c.type), ['express_upgrade', 'delivery_guarantee', 'free_shipping']);
const expressOnly = config(board, { ...fastOffer, components: fastOffer.components.filter(c => c.type !== 'free_shipping') });
const expressFree = config(board, fastOffer);
const ECONOMY = option('economy-1', 'Economy', '5');

result = runDelivery(freeOnly, [boardLine()]);
show('free shipping only', result);
assert.deepEqual(candidates(result), [{ message: 'Free standard shipping', targets: [{ deliveryOption: { handle: 'standard-1' } }], value: { percentage: { value: '100.0' } } }]);
assert.deepEqual(runCart(freeOnly, [boardLine()]), NOTHING, 'a shipping offer leaves the lines alone');

result = runDelivery(expressOnly, [boardLine()]);
show('express upgrade with a standard and an express option', result);
assert.deepEqual(result, {
  operations: [{
    deliveryDiscountsAdd: {
      candidates: [{ message: 'Express 2-day delivery at the standard rate', targets: [{ deliveryOption: { handle: 'express-1' } }], value: { fixedAmount: { amount: '20.00' } } }],
      selectionStrategy: 'ALL',
    },
  }],
});

result = runDelivery(expressFree, [boardLine()]);
show('express upgrade plus free shipping', result);
assert.deepEqual(candidates(result), [
  { message: 'Free standard shipping', targets: [{ deliveryOption: { handle: 'standard-1' } }], value: { percentage: { value: '100.0' } } },
  { message: 'Express 2-day delivery at the standard rate', targets: [{ deliveryOption: { handle: 'express-1' } }], value: { percentage: { value: '100.0' } } },
]);

// Which rate is "standard" when a shop has more than two.
const only1 = (jsonValue, options, o) => candidates(runDelivery(jsonValue, [boardLine()], [group([boardLine()], options)], o));
assert.equal(only1(expressOnly, [ECONOMY, STANDARD, EXPRESS])[0].value.fixedAmount.amount, '20.00', 'the dearest rate that is not express');
assert.equal(only1(expressOnly, [option('free-1', 'Free shipping', '0'), STANDARD, EXPRESS])[0].value.fixedAmount.amount, '20.00');
assert.equal(only1(expressOnly, [STANDARD, option('freight-1', 'Freight', '150'), EXPRESS])[0].value.fixedAmount.amount, '20.00', 'a rate above express is not the standard rate');
assert.deepEqual(only1(expressOnly, [EXPRESS]), [], 'no standard rate to pay instead');
assert.deepEqual(only1(expressOnly, [STANDARD, option('express-1', 'Express', '15')]), [], 'express already costs less');
assert.deepEqual(only1(expressOnly, [STANDARD]), [], 'no express option');
assert.deepEqual(only1(freeOnly, [ECONOMY, STANDARD, EXPRESS])[0].targets, [{ deliveryOption: { handle: 'economy-1' } }, { deliveryOption: { handle: 'standard-1' } }]);
assert.deepEqual(only1(freeOnly, [option('free-1', 'Free shipping', '0'), EXPRESS]), [], 'standard is free already');
// Pickup is not shipping.
assert.deepEqual(only1(freeOnly, [option('pickup-1', 'Shop location', '4', 'PICK_UP'), STANDARD])[0].targets, [{ deliveryOption: { handle: 'standard-1' } }]);
assert.deepEqual(only1(expressOnly, [option('pickup-1', 'Shop location', '4', 'PICK_UP'), EXPRESS]), []);
// Express by title, by handle, or by the shop's own pattern.
assert.equal(only1(expressOnly, [STANDARD, option('ups-next-day-air', 'UPS Air', '45')])[0].value.fixedAmount.amount, '25.10');
assert.deepEqual(only1(expressOnly, [STANDARD, option('ups-2', 'UPS Second Day', '45')]), []);
assert.equal(only1({ ...expressOnly, express_pattern: 'second day|air' }, [STANDARD, option('ups-2', 'UPS Second Day', '45')])[0].value.fixedAmount.amount, '25.10');
assert.deepEqual(only1({ ...expressOnly, express_pattern: 'second day|air' }, [STANDARD, EXPRESS]), [], 'the pattern replaces the default');

// A cart in two shipments: the offer covers the one that carries its product.
result = runDelivery(expressFree, [boardLine(), line(7, OTHER, 1, 885.95)], [
  group([line(7, OTHER, 1, 885.95)], [option('standard-b', 'Standard', '19.9'), option('express-b', 'Express', '39.9')]),
  group([boardLine()], [STANDARD, EXPRESS]),
]);
show('two delivery groups, the product in the second', result);
assert.equal(result.operations.length, 1, 'one operation whatever the number of groups');
assert.deepEqual(candidates(result).flatMap(c => c.targets.map(t => t.deliveryOption.handle)), ['standard-1', 'express-1']);
result = runDelivery(freeOnly, [boardLine(1, 1), boardLine(1, 3)], [group([boardLine(1, 1)], [STANDARD]), group([boardLine(1, 3)], [option('standard-b', 'Standard', '12')])]);
assert.deepEqual(candidates(result), [{ message: 'Free standard shipping', targets: [{ deliveryOption: { handle: 'standard-1' } }, { deliveryOption: { handle: 'standard-b' } }], value: { percentage: { value: '100.0' } } }]);

assert.deepEqual(runDelivery(expressFree, [boardLine()], undefined, { classes: ['PRODUCT'] }), NOTHING, 'the discount has no SHIPPING class');
assert.deepEqual(runDelivery(expressFree, [line(7, OTHER, 1, 885.95)]), NOTHING, 'the product is not in the cart');
assert.deepEqual(runDelivery(expressFree, [boardLine()], []), NOTHING, 'no delivery groups yet: no address');
assert.deepEqual(runDelivery(config(board, { ...twoOffer, components: fastOffer.components }), [boardLine(1)]), NOTHING, 'priced for two units, one in the cart');

// Every offer the policy makes, end to end: what the buyer pays once Shopify
// applies both results to the cart the offer was made for. It has to be the
// total the service quoted.
function checkoutTotal(m, offer, cfg = config(m, offer), o = {}) {
  const has = type => offer.components.some(c => c.type === type);
  const lines = [line(1, m.product.variant_id, offer.quantity, m.product.list)];
  const add = offer.components.find(c => c.type === 'gift');
  if (add) lines.push(line(2, add.variant_id, 1, m.concessions.gift.value));
  const options = [option('standard', 'Standard', m.shipping.standard.price), option('express', 'Express', m.shipping.express.price)];

  let total = lines.reduce((sum, l) => sum + Number(l.cost.amountPerQuantity.amount) * l.quantity, 0);
  for (const c of candidates(runCart(cfg, lines, o))) {
    if (c.value.fixedAmount) total -= Number(c.value.fixedAmount.amount);
    else for (const t of c.targets) total -= Number(lines.find(l => l.id === t.cartLine.id).cost.amountPerQuantity.amount) * t.cartLine.quantity * Number(c.value.percentage.value) / 100;
  }
  // The buyer picks express when the offer upgrades it, standard otherwise.
  const picked = options[has('express_upgrade') ? 1 : 0];
  let shipping = Number(picked.cost.amount);
  for (const c of candidates(runDelivery(cfg, lines, [group(lines, options)], o))) {
    if (!c.targets.some(t => t.deliveryOption.handle === picked.handle)) continue;
    shipping -= c.value.fixedAmount ? Number(c.value.fixedAmount.amount) : shipping * Number(c.value.percentage.value) / 100;
  }
  return r2(total + shipping);
}

// The service's own writer of the metafield, when it is there to ask. A broken
// settle.js is check-settle's to report, so here it only means this part is skipped.
const settleFile = new URL('../offers/src/lib/settle.js', import.meta.url);
const settle = existsSync(settleFile) ? await import(settleFile.href).catch(e => ({ missing: `does not load (${e.message})` })) : { missing: 'is not there' };
const classesFor = offer => {
  const has = type => offer.components.some(c => c.type === type);
  return [(has('price') || has('gift')) && 'PRODUCT', (has('free_shipping') || has('express_upgrade')) && 'SHIPPING'].filter(Boolean);
};

let offers = 0;
const proofs = [null, { ok: true, domain: 'evo.com', trusted_domain: true, match_by: 'gtin', price: 629.95, shipping: 0 }, { ok: true, domain: 'shop.example', trusted_domain: false, match_by: 'title', price: 600, shipping: null }];
for (const shop of Object.keys(SHOPS)) {
  for (const m of listProducts(shop)) {
    for (const priority of [undefined, 'lowest_price', 'fast_delivery', 'easy_returns', 'extras', 'repeat_purchase']) {
      for (const quantity of [1, 2, 5]) {
        for (const need_by_days of [undefined, 2, 5]) {
          for (const proof of proofs) {
            for (const offer of decide(m, { priority, quantity, need_by_days }, proof).offers) {
              const what = `${shop} ${m.product.handle} ${priority} x${quantity} in ${need_by_days} days: ${offer.headline}`;
              assert.equal(checkoutTotal(m, offer), offer.total, what);
              offers++;
              if (!settle.offerTerms) continue;
              // As the metafield holds it, and with no more classes than a discount for this offer is given.
              const written = JSON.parse(JSON.stringify({ offer_id: 'of_1', ...settle.offerTerms(offer, m) }));
              assert.equal(checkoutTotal(m, offer, written, { classes: classesFor(offer) }), offer.total, `${what}, as settle.js writes it`);
            }
          }
        }
      }
    }
  }
}
console.log(`\n== ${offers} offers from the policy: the cart each was made for checks out at the quoted total`);
console.log(settle.offerTerms ? '   and at the same total from the metafield settle.js writes' : `   not checked against the metafield the service writes: settle.js ${settle.missing ?? 'has no offerTerms'}`);

// Last, the wiring between the files. This reads the part of TOML they use:
// tables, lists of tables and one-line values.
function readToml(text) {
  const root = {};
  let at = root;
  const walk = keys => keys.reduce((o, k) => {
    o[k] ??= {};
    return Array.isArray(o[k]) ? o[k].at(-1) : o[k];
  }, root);
  for (const raw of text.split('\n')) {
    const row = raw.trim();
    if (!row || row.startsWith('#')) continue;
    const list = row.match(/^\[\[(.+)\]\]$/);
    const table = row.match(/^\[(.+)\]$/);
    if (list) {
      const keys = list[1].split('.');
      const parent = walk(keys.slice(0, -1));
      (parent[keys.at(-1)] ??= []).push(at = {});
    } else if (table) {
      at = walk(table[1].split('.'));
    } else {
      const [, key, value] = row.match(/^([\w-]+)\s*=\s*(.+)$/) ?? assert.fail(`toml line not understood: ${row}`);
      at[key] = JSON.parse(value);
    }
  }
  return root;
}

const extension = readToml(read(ext, 'shopify.extension.toml'));
const [func] = extension.extensions;
assert.equal(extension.api_version, schemaText.match(/^# api_version: (\S+)/)[1], 'schema.graphql is the schema of this api_version');
assert.equal(func.type, 'function');
assert.equal(func.handle, 'offer-discount');
assert.deepEqual(func.targeting.map(t => t.target), ['cart.lines.discounts.generate.run', 'cart.delivery-options.discounts.generate.run']);
assert.deepEqual(func.targeting.map(t => t.input_query), Object.values(QUERY));
for (const t of func.targeting) {
  // The CLI maps a kebab-case export in the toml to the camelCase export of src/index.js.
  assert.match(t.export, /^[a-z0-9-]+$/);
  assert.equal(typeof fn[t.export.replace(/-(\w)/g, (_, c) => c.toUpperCase())], 'function', `src/index.js exports ${t.export}`);
}
const locale = JSON.parse(read(ext, 'locales/en.default.json'));
for (const key of ['name', 'description']) assert.ok(func[key] === `t:${key}` && locale[key], `${key} is in the locale file`);
const pkg = JSON.parse(read(ext, 'package.json'));
assert.equal(pkg.type, 'module');
assert.ok(pkg.dependencies['@shopify/shopify_function'], 'the CLI builds JavaScript functions with this library');
assert.ok(existsSync(new URL(pkg.codegen.schema, ext)));

const config_ = readToml(read(app, 'shopify.app.toml'));
assert.equal(config_.name, 'OfferAd agent offers');
assert.equal(config_.embedded, false);
for (const scope of ['write_discounts', 'read_products', 'read_orders', 'write_orders', 'write_app_proxy']) assert.ok(config_.access_scopes.scopes.split(',').includes(scope), `scope ${scope}`);
assert.deepEqual([config_.app_proxy.prefix, config_.app_proxy.subpath], ['apps', 'offerad']);
assert.ok(config_.webhooks.subscriptions.some(s => s.topics.includes('orders/create') && s.uri === '/webhooks/orders'));
const urls = { application_url: config_.application_url, 'app_proxy.url': config_.app_proxy.url, 'auth.redirect_urls': config_.auth.redirect_urls[0] };
for (const [key, url] of Object.entries(urls)) assert.equal(new URL(url).protocol, 'https:', key);
assert.equal(new URL(config_.app_proxy.url).pathname, '/apps/offerad', 'the worker serves the proxied routes under the same path');
const unfilled = [...(config_.client_id ? [] : ['client_id']), ...Object.keys(urls).filter(key => new URL(urls[key]).hostname.endsWith('.invalid'))];

const theme = readToml(read(app, 'extensions/agent-offers/shopify.extension.toml'));
assert.equal(theme.type, 'theme');
const block = read(app, 'extensions/agent-offers/blocks/agent-offers.liquid');
// Theme app extensions take strict JSON here: no comments, no trailing commas.
const blockSchema = JSON.parse(block.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
assert.equal(blockSchema.target, 'body');
assert.ok(blockSchema.name.length <= 25, 'the name fits the theme editor');
const settings = blockSchema.settings.map(s => s.id);
assert.deepEqual([...new Set([...block.matchAll(/block\.settings\.(\w+)/g)].map(m => m[1]))].sort(), [...settings].sort(), 'every setting is used, every setting used exists');
assert.equal(blockSchema.settings.find(s => s.id === 'proxy_path').default, new URL(config_.app_proxy.url).pathname.replace(/^\/apps\/offerad$/, `/${config_.app_proxy.prefix}/${config_.app_proxy.subpath}`));
assert.match(block, /src="\{\{ endpoint \| escape \}\}\/embed\.js"/);
for (const attribute of ['data-endpoint', 'data-shop', 'data-product', 'data-webmcp', 'data-box', 'data-box-target', 'data-jsonld']) assert.ok(block.includes(`${attribute}="`), attribute);

console.log('== wiring: toml targets, exports, input queries, locale, app config and embed block agree');
if (unfilled.length) console.log(`   still placeholders in shopify.app.toml: ${unfilled.join(', ')}`);
console.log('\nfunction checks passed');
