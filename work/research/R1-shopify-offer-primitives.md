# R1 - Shopify offer primitives (what an app can make the checkout do)

Date of research: 13 Oct 2026. Author: research subagent R1.
Labels used: [P] primary_source_read, [S] secondary_source, [I] inferred, [T] tested_live.
Raw copies of every page fetched are in `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/` (files added by this task are prefixed `r1-`).

---

## 0. How the Discount Function reference was read

File: `/Users/mustafatokmak/.herdr-projects/offerad/threads/t-0006/work/docs/fn-discount-input.md` (16,250 lines, api_version 2026-10, source https://shopify.dev/docs/api/functions/latest/discount.md). It is byte-identical to `discount-fn.md` in the same folder (checked with `cmp`).

Structure of the file:
- L1-L109: intro, surfaces compatibility, fetch-target restriction, getting started, targets note.
- L110-L2323: `cart.lines.discounts.generate.run` Input object (every field).
- L2324-L2557: `CartLinesDiscountsGenerateRunResult` output.
- L2558-L2595: `cart.delivery-options.discounts.generate.run` (Input not expanded again; output object).
- L2596-L16110: 26 worked examples, each with Rust and JavaScript variants (input query, input object, function code, output JSON).
- L16112-L16120: Validations. L16123-L16175: migration tables. L16178-end: links.

Method: L1-L420 read raw; L404-L2596 read as a one-line-per-field rendering (every field name, type, flag and description kept; only the 245-value country/currency enum lists were collapsed); all 26 examples read in their JavaScript variant with the Rust input query / input object / output JSON compared by script and every difference displayed; L16108-L16250 read raw. Nothing was skipped except verbatim Rust duplicates of the JS function bodies.

### 0.1 Everything a Discount Function can read (Input object) [P]

Top-level fields of `Input` (L120-L2318): `cart`, `discount`, `enteredDiscountCodes`, `fetchResult`, `localization`, `presentmentCurrencyRate`, `shop`, `triggeringDiscountCode`. There is nothing else.

`cart` fields: `attribute(key)`, `billingAddress`, `buyerIdentity`, `cost`, `deliverableLines`, `deliveryGroups`, `discountApplications`, `lines`, `localizedFields`, `metafield`, `poNumber`, `retailLocation`.

- `cart.attribute(key: String)` (L134): "The custom attributes associated with a cart to store additional information. Cart attributes allow you to collect specific information from customers on the **Cart** page, such as order notes, gift wrapping requests, or custom product details. Attributes are stored as key-value pairs."
- `cart.buyerIdentity` (L338): `customer { amountSpent, createdAt, displayName, email, firstName, hasAnyTag(tags), hasTags(tags), id, lastName, metafield(namespace,key), numberOfOrders }`, `email`, `isAuthenticated`, `phone`, `purchasingCompany { company, contact, location }`, `shopUser { metafield }`.
  - `email` (L490): "The email address of the customer that's interacting with the cart."
  - `isAuthenticated` (L496): "Whether the customer is authenticated through their customer account."
- `cart.cost` (L712): `subtotalAmount`, `totalAmount`, `totalDutyAmount`, `totalTaxAmount`.
- `cart.lines[]` (L1700): `attribute(key)`, `cost` (examples use `amountPerQuantity`, `compareAtAmountPerQuantity`, `subtotalAmount`, `totalAmount`), `discountAllocations`, `id`, `merchandise` (ProductVariant: `id`, `inAnyCollection(ids)`, `inCollections(ids)`, `metafield`, `product { handle, hasAnyTag, hasTags, id, inAnyCollection, inCollections, isGiftCard, metafield, productType, title, vendor }`, `requiresShipping`, `sku`, `title`, `weight`, `weightUnit`; or CustomProduct), `parentRelationship { parent }`, `quantity`, `sellingPlanAllocation`.
  - line `attribute` (L1708): "Cart line attributes are equivalent to the `line_item` object in Liquid."
- `cart.deliveryGroups[]` (L1096): `cartLines`, `deliveryAddress` (address1, address2, city, company, countryCode, firstName, lastName, latitude, longitude, name, phone, provinceCode, zip), `deliveryOptions[] { code, cost, deliveryMethodType (LOCAL, NONE, PICK_UP, PICKUP_POINT, RETAIL, SHIPPING), description, handle, metafield, title }`, `discountAllocations`, `groupType`, `id`, `selectedDeliveryOption`.
- `cart.discountApplications[]` (L1646): "The discounts that have been applied to the cart." (allocationMethod, metafield, targetSelection, targetType, totalAllocatedAmount, value).
- `cart.metafield` (L1816), `cart.poNumber`, `cart.retailLocation`.

`discount` (L1946): "The discount node that owns the Shopify Function. Discounts are a way for merchants to promote sales and special offers, or as customer loyalty rewards. A single discount can be automatic or code-based, and can be applied to a cart lines, orders, and delivery."
- `discount.discountClasses` (L1954): ORDER, PRODUCT, SHIPPING.
- `discount.metafield(namespace, key)` (L1964) -> `jsonValue`, `type`, `value`. This is the per-discount configuration channel. Namespace note (L286): "If omitted, then the app-reserved namespace is used."

`enteredDiscountCodes[]` (L1970): "Discount codes entered by the buyer at checkout, excluding gift cards. For cart.lines.discounts.generate.run and cart.delivery-options.discounts.generate.run targets, these discount codes are validated to ensure they are not deleted, maintain an active status, and are eligible for the current cart. For fetch targets, all entered discount codes are included, excluding gift cards."
- `code` (L1978), `rejectable` (L1986): "Always check this value before you reject the code. If you reject a code that isn't rejectable, the Function result is invalid. | This value is `false` when the Function is owned by a code discount. In a delivery target, it's also `false` when the code already applied a product or order discount."

`triggeringDiscountCode: String` (L2318): "The discount code entered by a customer, which caused the Discount Function to run. This input is only available in the `cart.lines.discounts.generate.run` and `cart.delivery-options.discounts.generate.run` extension targets."

`fetchResult` (L1996): only with network access. Restriction (L78): "The fetch target is limited to custom apps installed on Shopify Plus and Enterprise stores. You'll also need to request network access for Shopify Functions, as it's not currently available on development stores or in a feature preview."

`shop` (L2136): `localTime { date, dateTimeAfter, dateTimeBefore, dateTimeBetween, timeAfter, timeBefore, timeBetween }`, `metafield`, `metaobject(handle|id)` ("Only app-owned metaobjects with the $app reserved prefix are accessible to functions.").

`localization` (country, language, market), `presentmentCurrencyRate`.

NOT in the input (grep over the whole file: 0 matches for "agent", "attribution", "salesChannel", "checkoutToken", "usageLimit"; the single "intent" hit is the word "intentionally"): no UCP `context.intent`, no `context.eligibility`, no attribution/UTM, no sales-channel or agent identity, no cart id or checkout token, no cart note. A function cannot tell that the cart came from an agent, and cannot identify "this exact cart" except through cart attributes, line attributes, line contents, buyer identity and delivery address.

### 0.2 Everything a Discount Function can write (output) [P]

`CartLinesDiscountsGenerateRunResult.operations[]` (L2330) can contain:
- `enteredDiscountCodesAccept { codes[] }` (L2344): "An operation that selects which entered discount codes to accept. Use this to validate discount codes from external systems."
- `enteredDiscountCodesReject { codes[], message }` (L2366): "An operation that rejects entered discount codes with a custom message. Use this to conditionally reject discount codes based on business logic. This operation can only be used if the function is backed by an automatic discount." `message` (L2380): "The custom message to display to the customer when the discount codes are rejected."
- `orderDiscountsAdd { candidates[], selectionStrategy FIRST|MAXIMUM }` (L2388). Candidate: `associatedDiscountCode`, `conditions[]` (`cartLineMinimumQuantity`, `cartLineMinimumSubtotal`, `orderMinimumSubtotal`), `message`, `targets[] { orderSubtotal { excludedCartLineIds } }`, `value` (percentage or fixedAmount).
- `productDiscountsAdd { candidates[], selectionStrategy FIRST|MAXIMUM|ALL }` (L2534). Candidate (from examples): `message`, `targets[] { cartLine { id, quantity? } }`, `value { percentage { value } | fixedAmount { amount, appliesToEachItem } }`.

`CartDeliveryOptionsDiscountsGenerateRunResult.operations[]` (L2582): `deliveryDiscountsAdd { candidates[], selectionStrategy ALL }` with candidate `message`, `targets[] { deliveryOption { handle } | deliveryGroup { id } }`, `value { percentage | fixedAmount }`; plus `enteredDiscountCodesAccept` / `enteredDiscountCodesReject` (migration table L16166-L16174).

Candidate `message` (L2488): "A notification on the **Cart** page informs customers about available discounts. If an automatic discount applies, the notification displays this message, such as "Save 20% on all t-shirts." If a discount code is entered, the notification displays the code instead."

`associatedDiscountCode` (L2402): "An optional discount code associated with this discount candidate, for use with automatic discounts. If a code discount is the function trigger, the associated discount code will be overwritten by the triggering discount code."

There is NO operation that adds, removes or re-prices a cart line, adds a note, sets an attribute or returns free text other than `message`. A Discount Function can only subtract money from existing lines, from the order subtotal and from delivery options.

Validations (L16114-L16119):
- "There can only be one of each operation (`enteredDiscountCodesAccept`, `deliveryDiscountsAdd`, `orderDiscountsAdd`, or `productDiscountsAdd`) in a single function result."
- "`enteredDiscountCodesAccept.codes` must only contain discount codes that are a subset of the `enteredDiscountCodes` input to the fetch targets."
- "`enteredDiscountCodesReject.codes` must only contain discount codes that are a subset of the `enteredDiscountCodes` input to the run targets (or fetch targets if network access enabled) and are `rejectable: true`."
- "The `associatedDiscountCode.code` field ... must only contain discount codes that are a subset of the `enteredDiscountCodes` input to the run target."

Limits and surfaces (L24, L38-L74):
- "You can activate a maximum of 25 discount functions on each store. All discount functions run concurrently, and have no knowledge of each other. The potential discount that a function outputs can be combined with the candidate from another discount, in alignment with the combination and stacking rules set on the discount node."
- Supported: B2B, Cart, Checkout, POS, Admin, Storefront, Storefront Accelerated Checkout. Not supported: Create Order API, Order Edit (Admin), Pre-order and Try Before You Buy. Draft Order (Admin and Checkout): "Partially supported - Discount functions with network access aren't supported on draft orders." Subscriptions: "The function isn't re-run when the recurring orders are created."

### 0.3 The examples that matter for OfferAd [P]

1. "Create a dynamic discount from discount codes" (L3956): "A Shopify Discount Function that parses entered discount codes with the format "X%OFF" to extract and apply the specified percentage discount to the entire order if a discount code associated to this function exists. For example, entering "10%OFF" applies a 10% discount, while "25%OFF" applies a 25% discount." Input query: `query CartInput { discount { discountClasses } triggeringDiscountCode }`; input object `{"discount":{"discountClasses":["ORDER"],"metafield":null},"triggeringDiscountCode":"20%OFF"}`; code: `const percentageOff = code.match(/([\d]{1,2})%OFF/)`. The same pattern is repeated for the delivery target (`"triggeringDiscountCode":"50%OFF"` -> 50% off shipping). Meaning: the code STRING itself can carry the terms, as long as that code exists on a code discount owned by the function.
2. "Create a configurable discount with metafields" (L14812): "reads its configuration from a discount metafield ... retrieve product discount percentage, order discount percentage, eligible collection IDs and shipping discount percentage." Query: `discount { discountClasses metafield(namespace: "$app" key: "function-configuration") { jsonValue } }`; config `{"cartLinePercentage":15,"orderPercentage":10,"collectionIds":[...]}` for the cart target and `{"deliveryPercentage":100}` for the delivery target. Meaning: one discount node = one JSON config = product + order + shipping effects together.
3. "Create combined multi-type discounts" (L14101): one function returning 10% off order, 20% off the most expensive line, and 100% off delivery, each gated on `discount.discountClasses`.
4. "Create loyalty program discounts" (L12456): customer tag `loyalty-member` -> $10 off last line + 10% off order + free shipping.
5. "Apply a shipping discount based on location" (L9150): targets one delivery option by title: `if (option.title?.toLowerCase().includes("express"))` -> `{ message: "50% off express shipping for Ottawa", targets: [{ deliveryOption: { handle: option.handle } }], value: { percentage: { value: "50.0" } } }`. This is "discounted express shipping".
6. "Create a Buy X get Y discount" (L11811): discounts line Y (quantity 1) only "if it's also in the cart". The function does not add Y.
7. "Apply a per-item discount to a product with quantity limits" (L7334): `fixedAmount { amount, appliesToEachItem: true }` with `cartLine { id, quantity }` to cap the discounted quantity.
8. "Apply tiered discounts based on order subtotal" (L5502) and "Create a tiered discount based on line subtotals" (L3504): quantity/subtotal tiers with `conditions: [{ orderMinimumSubtotal }]` and `selectionStrategy: MAXIMUM`.
9. "Create discounts managed by external services" (L9960): fetch target posts `enteredDiscountCodes` to an external URL and applies the returned operations, including `enteredDiscountCodesAccept` for codes Shopify does not know. Needs network access (custom apps on Plus/Enterprise only), so it is closed to a public app.
10. "Apply a percentage discount for VIP customers" (L8383) and "Apply tiered shipping discounts for loyal customers" (L9484): gate on `cart.buyerIdentity.customer.hasAnyTag(tags: [...])`.
11. "Create a tiered percentage discount based on cart total using metaobjects" (L11325): config from `shop.metaobject(handle: { type: "$app:tiered_discount_config", handle: "default" })`, including a `discount_message` template.
12. "Create a free shipping discount with currency thresholds" (L15663): config from a shop metafield.

Performance numbers given in the file: Rust examples 16k-94k instructions; JavaScript 194k-520k instructions.

---

## 1. Plan and public-app availability (cross-cutting) [P]

Source: https://shopify.dev/docs/api/functions/latest.md (saved `r1-functions-overview.md`), section "API availability":
- "**All plans**: Except as noted in individual API pages, stores on any plan can use public apps that are distributed through the Shopify App Store and contain functions."
- "**Shopify Plus**: Only stores on a Shopify Plus plan can use custom apps that contain Shopify Function APIs."
- Fetch target: "The fetch target is limited to custom apps installed on Enterprise stores. You'll also need to request network access for Shopify Functions, as it's not currently available on development stores or in a feature preview."
- "Shopify doesn't allow nondeterminism in functions, which means that you can't use any randomizing or clock functionality in your functions." (time is only available through `shop.localTime` comparisons in the input query)
- "The Shopify App Store doesn't permit apps that provide dynamic editing and execution of function code."
- "Some functions support network access ... You can also pre-populate data by using metafields on products and customers, or passing data using cart attributes."
- Limits: compiled binary 256 kB; 11 million instructions (carts up to 200 lines); function input 128 kB; output 20 kB; input query max 3000 bytes and max cost 30 (each `metafield` costs 3, `hasAnyTag`/`hasTags`/`inAnyCollection`/`inCollections` 3, other leaves 1); "Metafields with values exceeding 10,000 bytes in size will not be returned."
- Execution order in checkout: 1 Cart Transform -> 2 Discount (cart lines) -> 3 Fulfillment constraints / order routing -> 4 Delivery methods (Delivery Customization) -> 5 Discount (delivery) -> 6 Payment Customization -> 7 Cart and Checkout Validation.

Scopes (https://shopify.dev/docs/api/usage/access-scopes.md, saved `r1-access-scopes.md`): `write_discounts`, `write_draft_orders`, `write_gift_cards`, `write_store_credit_account_transactions`, `write_cart_transforms`, `write_delivery_customizations`, `write_payment_customizations`, `write_validations`, `write_orders`, `write_returns`, `write_customers` are listed WITHOUT the "Shopify approval required" flag. Flagged as approval-required: `read_all_orders`, subscription contract scopes, payment mandate scopes, marketplace scopes. Protected customer data: "By default, apps don't have access to any protected customer data ... the API won't return data from non-development stores until your app is configured and approved for protected customer data use." (matters for reading buyer email, creating customers, customer-bound codes).

Checkout UI extensions: "Checkout UI extensions for the information, shipping, and payment steps are available only to stores on a Shopify Plus plan." (https://shopify.dev/docs/api/checkout-ui-extensions.md). [I] The sentence names only those three steps, so Thank you page targets are presumably open to other plans; the page does not say so in as many words.

## 2. Native discounts through Admin GraphQL [P]

All need `write_discounts`. Sources: `r1-m-discountCode*Create.md`, `r1-m-discountAutomatic*Create.md`, `r1-i-Discount*Input.md` (https://shopify.dev/docs/api/admin-graphql/latest/...).

### 2.1 Field inventory

`DiscountCodeBasicInput` (percent or fixed amount off, by code): `appliesOncePerCustomer` ("Whether a customer can only use the discount once."), `code`, `combinesWith`, `context` ("The context defining which buyers can use the discount. You can target specific customer IDs, customer segments, or make the discount available to all buyers."), `customerGets` (items: all / products / collections; value: `percentage` 0.00-1.00, `discountAmount`, or `discountOnQuantity`), `endsAt`, `minimumRequirement` (quantity or subtotal), `recurringCycleLimit`, `startsAt`, `tags`, `title` ("The discount's name that displays to merchants in the Shopify admin and to customers."), `usageLimit` ("The maximum number of times the discount can be redeemed. For unlimited usage, specify `null`."). No `metafields` field in this input.

`DiscountCodeFreeShippingInput`: the above plus `destination` (all countries or listed countries), `maximumShippingPrice` ("The maximum shipping price, in the shop's currency, that qualifies for free shipping. For example, if set to 20.00, then only shipping rates that cost $20.00 or less will be made free."), `appliesOnOneTimePurchase`, `appliesOnSubscription`. It is 100% off or nothing: there is no partial shipping discount and no way to name a rate, so "discounted express" needs a Discount Function.

`DiscountCodeBxgyInput`: `customerBuys` (items + quantity or amount), `customerGets` (items + `discountOnQuantity { quantity, effect percentage }`), `usesPerOrderLimit` ("The maximum number of times that the discount can be applied to an order."), plus the common fields. `DiscountCustomerGetsValueInput`: "Note: BXGY doesn't support discountAmount." / "Note: BXGY doesn't support percentage." (it uses `discountOnQuantity`).
Help Center (https://help.shopify.com/en/manual/discounts/discount-types/buy-x-get-y, read through WebFetch): "Customers must add all items to their cart manually." and "The free or discounted 'get' item is never automatically added to the cart."

`DiscountContextInput`: `all`, `customers` (add/remove customer IDs), `customerSegments`, `markets`. The older `customerSelection` is deprecated.

`DiscountCombinesWithInput`: `orderDiscounts`, `productDiscounts`, `shippingDiscounts` (all default false), and `productDiscountsWithTagsOnSameCartLine`: "By default, only one product discount applies per line. Available only on a Shopify Plus plan and requires the `productDiscounts` field to be set to `true`."

Automatic variants (`discountAutomaticBasicCreate`, `discountAutomaticBxgyCreate`, `discountAutomaticFreeShippingCreate`, `discountAutomaticAppCreate`): same shape without `code`, `usageLimit`, `appliesOncePerCustomer`.

### 2.2 App (Function-backed) discounts

`DiscountCodeAppInput` (https://shopify.dev/docs/api/admin-graphql/latest/input-objects/DiscountCodeAppInput.md): `appliesOncePerCustomer`, `appliesOnOneTimePurchase`, `appliesOnSubscription`, `code`, `combinesWith`, `context`, `discountClasses` ("Determines which discount effects the discount can apply."), `endsAt`, `functionHandle` ("The handle of the function providing the discount."; `functionId` deprecated), `metafields` ("Additional metafields to associate to the discount. Metafields provide dynamic function configuration with different parameters, such as `percentage` for a percentage discount."), `recurringCycleLimit`, `startsAt`, `tags`, `title` ("The discount's name that displays to merchants in the Shopify admin and to customers."), `usageLimit`.

The `discountCodeAppCreate` reference example creates a code with its own config in one call:
```
"codeAppDiscount": { "code": "PRODUCT10", "title": "10% off selected products", "functionId": "...", "appliesOncePerCustomer": false, "combinesWith": {...}, "startsAt": "...", "endsAt": "...", "metafields": [ { "namespace": "default", "key": "function-configuration", "type": "json", "value": "{...}" } ] }
```
`DiscountAutomaticAppInput`: `combinesWith`, `context`, `discountClasses`, `endsAt`, `functionHandle`, `metafields`, `startsAt`, `title`.

Functions overview: "Apps can reference only their own functions in GraphQL Admin API mutations, such as `discountAutomaticAppCreate` and `cartTransformCreate`. Referencing a function from another app results in a `Function not found` error."

### 2.3 Limits and stacking

- Help Center (https://help.shopify.com/en/manual/discounts/discount-methods/discount-codes, WebFetch): "There's a cumulative limit of 20,000,000 unique discount codes for each store." and "A discount code can apply to up to 100 specific customers, products, and variants."
- Help Center (https://help.shopify.com/en/manual/discounts/discount-combinations, WebFetch): "Customers can use a maximum of 5 product or order discount codes and 1 shipping discount code on the same order." / "You can have a maximum of 25 active automatic discounts. This total includes app-based discounts." / "Multiple shipping discounts can't apply to the same order." / "To combine multiple product discounts on the same line item, your store must be on the Shopify Plus plan." / "Discounts can only be combined on orders that are made through the Online Store, Storefront API, and Shopify POS." / "All products that are part of a Buy X get Y discount are ineligible for further product discounts."
- Function reference: "You can activate a maximum of 25 discount functions on each store."
- Code length: legacy REST DiscountCode doc: "The case-insensitive discount code that customers use at checkout. (maximum: 255 characters)" (https://shopify.dev/docs/api/admin-rest/latest/resources/discountcode.md).
- One-per-customer tracking (Help Center BXGY and amount-off pages, WebFetch): "Limit to one per customer lets you limit a customer's email address or phone number to one use of the discount code."

### 2.4 Speed of code creation

- GraphQL Admin rate limits (https://shopify.dev/docs/apps/build/apis/graphql-admin/rate-limits.md): Standard "100 points/second", Advanced "200 points/second", Plus "1000 points/second", Enterprise "2000 points/second"; "GraphQL Admin API rate limits are based on the combination of the app and store"; default cost of a mutation is 10 (plus 1 per returned object); "A single query may not exceed a cost of 1,000 points"; leaky bucket, so bursts are allowed (bucket size is not stated on the page; the sample response shows `maximumAvailable: 1000, restoreRate: 50`). [I] So roughly 8-10 `discountCodeAppCreate` calls per second sustained on a non-Plus store, one offer = one mutation, no bulk operation needed.
- `discountRedeemCodeBulkAdd` (https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountRedeemCodeBulkAdd.md): "Asynchronously add discount codes in bulk that customers can use to redeem a discount." `codes`: "The list of codes to associate with the code discount. Maximum: 250 codes." Result is a `DiscountRedeemCodeBulkCreation` with `done`, `importedCount`, `failedCount`. All codes added this way hang off ONE discount node, so they share that node's rules and metafields.
- Legacy REST batch for comparison: "The batch endpoint can be used to asynchronously create up to 100 discount codes in a single request ... You can enqueue a single creation job per a shop and you can't enqueue more until the job completes." Legacy REST PriceRule: "`usage_limit`: The maximum number of times the price rule can be used, per discount code." [I] The same per-code semantics probably hold for `usageLimit` on a GraphQL discount with many codes, but the GraphQL page only says "The maximum number of times the discount can be redeemed"; test before relying on it.

## 3. Other Function APIs an app can use on a non-Plus store [P]

### 3.1 Cart Transform (https://shopify.dev/docs/api/functions/latest/cart-transform.md, saved `r1-fn-cart-transform.md`)

- "To modify the appearance of cart items, such as updating titles and images, changing prices, and bundling items, you can only use the Cart Transform API."
- "You can install a maximum of one cart transform function per app on each store. If a store has cart transform functions from more than one app, all of them run."
- Plan gate: "Only development stores or stores on a Shopify Plus plan can use apps with `lineUpdate` operations." `lineExpand` and `linesMerge` carry no such note.
- Operations: `lineExpand { cartLineId, expandedCartItems[] { merchandiseId, quantity, price { adjustment { fixedPricePerUnit { amount } } }, attributes[] }, title, image, price }`; `linesMerge { cartLines[], parentVariantId, title, image, price, attributes }`; `lineUpdate { cartLineId, title, image, price }` (Plus only).
- `lineExpand.title`: "The title that replaces the existing title for the cart line item."
- Input: `cart { attribute(key), billingAddress, buyerIdentity, lines { attribute(key), cost, merchandise, quantity, ... }, metafield, retailLocation }`, `cartTransform { metafield }`, `localization`, `presentmentCurrencyRate`, `shop { localTime, metafield, metaobject }`. There is NO `enteredDiscountCodes` or `triggeringDiscountCode`: a cart transform cannot see discount codes.
- Official example "Add gift wrapping to cart items": "1. A customer adds an item to their cart with the "Gift Wrap" attribute 2. The cart transform function checks for this attribute 3. The cart line is expanded to add the $5 gift wrap add-on". The code expands one line into two `expandedCartItems` (the original variant at its own price, plus the add-on variant with `fixedPricePerUnit`). The same shape with amount 0 is a free gift that nobody had to add.
- Surfaces: Cart, Checkout ("Shopify rejects `lineExpand`, `linesMerge`, and `lineUpdate` operations if a selling plan is present."), Draft Order (Admin and Checkout), Storefront, Accelerated Checkout supported; POS partial; not on order edits, subscriptions, pre-order/TBYB.
- Collisions: "If multiple `lineExpand` operations target the same cart line, then the first `lineExpand` operation in the list is executed" (ordered by activation time of each app's function). Max 150 expanded items. Error `expanded_items_missing_prices`: "Either all must have a price, or none."
- "Title and image overrides appear across various surfaces, including the cart, checkout, and order notification emails. To see title overrides applied by cart transform functions in these areas, you'll need to modify your themes."

### 3.2 Delivery Customization (https://shopify.dev/docs/api/functions/latest/delivery-customization.md)

- "A delivery customization enables you to rename, sort, and hide the delivery options available to customers during checkout." Use case listed: "Add messaging to delivery option titles." Example: "Add delivery timeframes to express shipping".
- "You can activate a maximum of 25 delivery customization functions on each store."
- Operations: `deliveryOptionHide`, `deliveryOptionMove` ("you are prohibited from automatically selecting higher-priced delivery alternatives by default. The cheapest shipping delivery option must always be the first option selected."), `deliveryOptionRename { deliveryOptionHandle, title }` ("The carrier name is automatically prepended to the delivery option title at checkout ... and can't be altered or omitted through the API.").
- Input includes `cart.attribute`, `cart.buyerIdentity`, `cart.lines`, `cart.deliveryGroups`, and `cart.discountApplications[] { allocationMethod, metafield, targetSelection, targetType, totalAllocatedAmount, value }` ("The discounts that have been applied to the cart."). It cannot change a price; only the Discount Function's delivery target can.
- Surfaces: Checkout, Draft Order (Checkout), Accelerated Checkout supported; Cart and Storefront NOT supported.

### 3.3 Cart and Checkout Validation (https://shopify.dev/docs/api/functions/latest/cart-and-checkout-validation.md)

- "You can activate a maximum of 25 validation functions on each store." "Errors from validation functions are exposed to the Storefront API's `Cart` object, in themes that use the `cart` template and during checkout."
- Output: `validationAdd { errors[] { message, target } }` - "The validation errors that block a customer from proceeding through checkout."
- Input includes `buyerJourney.step`, `cart.attribute`, `cart.buyerIdentity`, `cart.lines`, `cart.discountApplications`, `validation.metafield`. No entered-codes field.
- Use for OfferAd: enforce the seller's limits a second time (for example block completion if an offer-only free-gift variant is in the cart without its offer). It can only block and show text; it cannot grant anything.

### 3.4 Payment Customization (https://shopify.dev/docs/api/functions/latest/payment-customization.md)

- "rename, reorder, hide the payment methods available to customers during checkout, set payment terms, and add a review requirement for a specific order" - payment terms and review are B2B. Max 25 per store. "Hiding specific placements is only available on Shopify Plus stores." Marginal for OfferAd.

## 4. Draft orders [P]

Sources: https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftOrderCreate.md, `.../input-objects/DraftOrderInput.md`, `.../DraftOrderLineItemInput.md`, `.../DraftOrderAppliedDiscountInput.md`, `.../ShippingLineInput.md`, `.../objects/DraftOrder.md`. Scope `write_draft_orders` ("Caution: Only use this data if it's required for your app's functionality. Shopify will restrict access to scopes for apps that don't have a legitimate use for the associated data.").

What one `draftOrderCreate` can express:
- Line prices: `lineItems[].priceOverride` ("This price will be used in place of the product variant's catalog price in this draft order."), `lineItems[].appliedDiscount` (title, description, value, valueType), `generatePriceOverride` ("will create a price override from the current price" = price lock).
- Custom lines with any title and price (`title`, `originalUnitPriceWithCurrency`, `requiresShipping`, `taxable`): a $0 "Free gift", or a $0 line named "60-day returns, extended" that makes a non-monetary term a visible order line.
- Order-level `appliedDiscount` with free-text `title` and `description`.
- `shippingLine { title, priceWithCurrency }`: "A custom shipping line includes a title and price with `shippingRateHandle` set to `nil`." So a custom-priced, custom-named shipping line ("Express, guaranteed by Fri 16 Oct") is possible.
- `discountCodes` ("will be attempted to be applied to the draft order"), `acceptAutomaticDiscounts`, `allowDiscountCodesInCheckout`.
- `reserveInventoryUntil`: "The time after which inventory reservation will expire." Mutation note: "When you create a draft order, you can't reserve or hold inventory for the items in the order by default. However, you can reserve inventory using the `reserveInventoryUntil` input."
- `customAttributes`, `note`, `tags`, `metafields`, `email`, `shippingAddress`, `visibleToCustomer`, `sourceName`.
- Output `invoiceUrl`: "The link to the checkout, which is sent to the customer in the invoice email." (the URL exists on the object; sending the email is a separate `draftOrderInvoiceSend`).
- Housekeeping: "Draft orders created on or after April 1, 2025 will be automatically purged after one year of inactivity." There is no native expiry on the link; the app has to delete or update the draft to end a price hold.
- Limits: "Accepts a maximum of 499 line items. NOTE: Draft orders don't currently support subscriptions." Store credit cannot pay a draft order (Help Center: "Store credit can't be used as a payment method on draft orders or edited orders.").

## 5. Store credit and gift cards [P]

- `storeCreditAccountCredit` (https://shopify.dev/docs/api/admin-graphql/latest/mutations/storeCreditAccountCredit.md), scope `write_store_credit_account_transactions`: "Adds funds to a `StoreCreditAccount` ... The mutation accepts either a store credit account ID, a `Customer` ID, or a `CompanyLocation` ID. When you provide a customer or company location ID, it automatically creates an account if one doesn't exist for the specified currency." "Credits can optionally include an expiration date."
- Help Center (https://help.shopify.com/en/manual/customers/store-credit, WebFetch): "Store credit isn't available for legacy customer accounts." / "Customers can use their store credit as a payment method on your store only when signed in through customer accounts or using Shop Pay." / "Store credit is available as a payment method only on your online store, Point of Sale (POS), and Shop. It isn't accepted on other sales channels." / "Only the full store credit amount can be applied as a payment method." / "You can set expiration dates for store credit."
- `giftCardCreate` (https://shopify.dev/docs/api/admin-graphql/latest/mutations/giftCardCreate.md), scope `write_gift_cards`: "Creates a new `GiftCard` with a specified initial value. You can assign the gift card to a `Customer` or create it without assignment for manual distribution. You can customize the gift card with an optional code, expiration date, and internal note." Returns `giftCardCode`.
- Storefront API `CartInput.giftCardCodes`: "The case-insensitive gift card codes." So a gift card can be pre-applied to a cart that the app builds.

## 6. Storefront API cart, cart permalinks, discount links [P]

- Storefront API authentication (https://shopify.dev/docs/api/storefront.md): "Tokenless access allows API queries without an access token providing access to essential features such as: Products and Collections, Selling Plans, Search, Pages, Blogs, and Articles, Cart (read/write)". Token needed for "Metaobjects and Metafields", customers, product tags. Rate limits: "requests from real buyers aren't subject to a fixed request-per-minute limit. Automated traffic and checkout creation are limited." "Checkout creation: Throttled per minute, returning a `200 Throttled` error".
- `CartInput` (https://shopify.dev/docs/api/storefront/latest/input-objects/CartInput.md): `attributes` (max 250), `buyerIdentity { email, phone, countryCode, customerAccessToken, ... }`, `delivery`, `discountCodes` ("The case-insensitive discount codes that the customer added at checkout."), `giftCardCodes`, `lines[] { merchandiseId, quantity, attributes, sellingPlanId, parent }`, `metafields`, `note`, `sourceName`. `Cart.checkoutUrl`: "The URL of the checkout for the cart."
- Cart permalinks (https://shopify.dev/docs/apps/build/checkout/create-cart-permalinks.md, saved `permalinks.md`): `https://{shop}/cart/{variant_id}:{quantity}(,...)`; `?discount={code}` and "You can also append multiple discounts in the cart permalink URL, separated by a comma"; `properties=` ("You can add line item properties (up to 25) to the first product. Properties must be Base64 URL-encoded JSON."); `checkout[email]`, `checkout[shipping_address][...]`; `note`, `attributes[key]=value`, `ref`; `access_token` + `source_name` for channel attribution; `storefront=true` ("redirect customers to the online store cart instead of the checkout page"); `payment=shop_pay`. Limitations: "Selling plans don't work with cart permalinks" and "Cart permalinks cannot bypass storefront passwords".
- Shareable discount link (https://help.shopify.com/en/manual/discounts/managing-discount-codes, WebFetch): path `/discount/code`, optional `/discount/code?redirect=/new-path`. "The discount associated with the link or QR code applies automatically to your customer's next checkout cart or to any active carts they have open." "The discount is saved to the customer's cart and to their browser, so it stays applied until it's removed." "Your shareable link or QR code can have only a single discount applied to it."
- Browser-side standard action (https://shopify.dev/docs/api/storefront-events-and-actions/actions/update-cart.md): `updateCart` "Adds, updates, or removes cart lines, sets the cart note, applies discount codes, and updates cart attributes. A single call can do more than one of these." Payload: `lines[] { id | merchandiseId, quantity, attributes, sellingPlanId }`, `note`, `discountCodes` ("The complete set of discount codes the cart should end up with."), `attributes`. "Actions work out of the box on every Liquid storefront."

## 7. Non-monetary terms: where they can live [P]

- Before the order: cart attributes and note (permalink, Storefront API cart, `updateCart` action), line attributes, a $0 line item, the title of a discount, the title of a delivery option (Delivery Customization rename), a draft order's custom lines / shipping line title / applied-discount title.
- After the order: `orderUpdate` (scope `write_orders`): "Updates the attributes of an order, such as the customer's email, the shipping address for the order, tags, and metafields associated with the order." Cart attributes and note arrive on the order ("`note` and `attributes` parameters will display in the **Notes** section on the order details page.").
- Honouring an extended return window: `returnCreate` (scope `write_returns`) "Creates a return in the `OPEN` state, and assumes that the return request from the customer has already been approved" - the app, not Shopify's return rules, decides eligibility.
- Honouring a late-delivery credit: `storeCreditAccountCredit`, `giftCardCreate`, a customer-bound single-use discount code, or a refund.
- Shopify Flow (https://shopify.dev/docs/apps/build/flow.md): "Flow is an optional app that's available to Shopify merchants on any paid plan." "if you have a custom app, your Flow app extensions are available only to a Shopify Plus store". Apps add triggers and actions; "As a developer you cannot create a condition task." Flow is optional glue for the merchant, not a requirement: the app can do the same with webhooks and the Admin API.

## 8. Selling plans (purchase options) [P]

- https://shopify.dev/docs/apps/build/purchase-options.md: subscriptions, pre-order, try-before-you-buy; selling plans carry pricing, billing, delivery and inventory policies. "Public apps that use subscriptions, pre-order or TBYB need to meet specific requirements to be published on the Shopify App Store." Scopes marked "Shopify approval required": `read_all_orders`, `read_customer_payment_methods`, `read/write_own_subscription_contracts`, `read/write_payment_mandate`.
- Not redeemable by agents today: the live MCP `line_items[]` schema has only `id`, `quantity`, `item.id` (no selling plan); "Selling plans don't work with cart permalinks"; Discount Functions are "Not supported" for pre-order and TBYB; cart transform operations are rejected when a selling plan is present. Only the browser `updateCart` action and the Storefront API accept `sellingPlanId`.

## 8b. Two more primitives found during the search

### CarrierService: the only synchronous server callback in a non-Plus checkout [P]

Source: https://shopify.dev/docs/api/admin-rest/latest/resources/carrierservice.md (saved `r1-rest-carrierservice.md`), GraphQL `carrierServiceCreate` (scope `write_shipping`).
- "Using the CarrierService resource, you can add a carrier service to a shop and then provide a list of applicable shipping rates at checkout. You can even use the cart data to adjust shipping rates and offer shipping discounts based on what is in the customer's cart."
- Plan gate: "Your app's request to create a carrier service will fail unless the store installing your carrier service meets one of the following requirements: It's on the Advanced Shopify plan or higher. It's on the Shopify plan with yearly billing, or the carrier service feature has been added to the store for a monthly fee. ... It's a development store."
- Shopify POSTs to the app's `callback_url` with `origin`, `destination` (address, name) and `items[] { name, sku, quantity, grams, price, vendor, properties, product_id, variant_id }`, `currency`, `locale`. No discount codes, no cart attributes, no buyer email.
- The app answers with `rates[] { service_name ("The name of the rate, which customers see at checkout."), description ("A description of the rate, which customers see at checkout."), service_code, currency, total_price, min_delivery_date, max_delivery_date }`.
- Timeouts 10 s / 5 s / 3 s by request rate; "There is no retry mechanism." Cache: identical requests (variant IDs, quantities, origin, destination, ...) are served from cache; "The cache expires 15 minutes after rates are successfully returned."
- Meaning for OfferAd: on eligible stores the seller agent's own server can price and name the express option in real time and attach delivery dates. It keys on items (including a marker variant or line properties) and destination, not on codes.

### Order editing after purchase [P]

`orderEditBegin` -> `orderEditAddVariant` ("Adds a `ProductVariant` as a line item to an `Order` that's being edited.") -> `orderEditAddLineItemDiscount` ("Applies a discount to a `LineItem` during an order edit session. The discount can be either a fixed amount or percentage value.") -> `orderEditCommit` ("You can only edit unfulfilled line items. If an edit changes the total order value, then the customer might need to pay a balance or receive a refund."). Scope `write_order_edits`. This adds a 100%-discounted gift to an order after checkout, on every channel, with no cooperation from the buyer's agent. `refundCreate` (the page says: "Requires `orders` access scope, `marketplace_orders` access scope or `buyer_membership_orders` access scope.") pays money back for a price match or a missed delivery promise.

## 9. What agents can actually send and see (live checks and Shopify docs)

### 9.1 Server MCP at /api/ucp/mcp [T: schema saved from allbirds.com in `tools-list.json`]

Input of `create_cart` / `update_cart` (every path listed): `line_items[] { id, quantity, item.id (Product Variant ID) }`, `buyer { email, phone_number }`, `context { address_country, address_region, postal_code, intent, language, currency, eligibility }`, `attribution { referring_domain, click_id_tag/value, activity_id_tag/value, utm_campaign, utm_source, utm_medium, utm_content, utm_term }`, `fulfillment { methods[] ... groups[].selected_option_id }`, `discounts { codes[] }`. `update_checkout` adds `payment.instruments[]`. There is no attributes, note, line-property, selling-plan, gift-card, store-credit or declared-fields input.

The `discounts` field carries this instruction to the agent in Shopify's own schema: "Discount or promo codes to apply to the cart. Only prompt if customer mentions having a discount code." `codes`: "Discount codes to apply. Case-insensitive. Replaces previously submitted codes. Send empty array to clear."

Output of `create_checkout` (declared paths): `line_items[] { id, item { id, title, price, image_url }, quantity, totals[] { type, amount, display_text } }`, `discounts { codes[], applied[] { code, title, amount, method (each|across|one), automatic, allocations[] { path, amount } } }`, `messages[] { type (error|warning|info), content_type (plain|markdown), code, content, severity (recoverable|requires_buyer_input|requires_buyer_review|unrecoverable), path }`, `fulfillment.methods[].groups[].options[] { id, title, description.plain, totals[] }`, `links[] { type, title, url }`, `continue_url`. The live schema does NOT declare `provisional`, `eligibility` or `priority` on applied discounts (checked by string search over the three output schemas; `additionalProperties` is true).

Cart to checkout (`checkout-mcp.md`): "**Discount codes must be forwarded.** If the cart has applied discount codes, include those codes in `checkout.discounts.codes`. Don't assume Shopify re-applies cart discount codes automatically during conversion." (The UCP spec says the opposite duty lies with the business: "businesses MUST carry forward any discount codes that were applied to the cart.")

Identity (`auth-tiers.md`): checkout tools apply "any automatic discounts when presenting a buyer-linked token"; "Buyer-linked tokens carry a signed-in Shop customer's identity." Signed and anonymous agents have no customer identity beyond `buyer.email`.

### 9.2 Storefront WebMCP [T: script fetched from https://www.allbirds.com/cdn/shopifycloud/storefront/assets/storefront/webmcp-f427de6a.js on 13 Oct 2026, saved `r1-live-allbirds-webmcp-f427de6a.js`]

Tools registered by the live script: `search_catalog`, `browse_store`, `get_product`, `show_variant`, `get_cart`, `add_to_cart`, `update_cart_lines`, `cancel_cart`, `proceed_to_checkout`, `manage_orders`, `search_shop_policies_and_faqs`, `get_ucp_profile`. The docs page (https://shopify.dev/docs/api/web-mcp.md) lists a single `update_cart`; the live script splits it into `add_to_cart` ("this tool can only add") and `update_cart_lines`, and adds an undocumented `get_ucp_profile` ("Get this store's Universal Commerce Protocol (UCP) profile, as served at /.well-known/ucp ... Use it to discover how to continue a purchase with this store over UCP").
- `add_to_cart` input: `cart.line_items[] { item.id (ProductVariant GID), handle, query, quantity }`, 1-10 entries. Nothing else.
- The word "discount" does not occur anywhere in the 83,615-byte script. The cart tools call `window.Shopify.actions.updateCart({ lines })` only. So Storefront WebMCP cannot submit a code, a cart attribute or a note.
- Tools that return store content carry `annotations: { untrustedContentHint: true }` (search_catalog, browse_store, get_product, show_variant, get_cart, add_to_cart, update_cart_lines, search_shop_policies_and_faqs, get_ucp_profile). Shopify itself tells the agent to treat product text, policy text and cart content as untrusted.

Standard actions [T: https://cdn.shopify.com/storefront/standard-actions.js, saved `r1-live-standard-actions.js`]: the script posts to `/api/2026-07/graphql.json` with only a `Content-Type` header (tokenless Storefront API) and builds `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove`, `cartNoteUpdate`, `cartDiscountCodesUpdate`, `cartAttributesUpdate`. So any script on the storefront, including an app's theme app embed, can set codes, attributes and note through `Shopify.actions.updateCart`.

### 9.3 Checkout WebMCP [P: `checkout-webmcp.md`]

- `update_checkout`: "Checkout WebMCP ignores `line_items` and `attribution`. The buyer changes items on the page." `checkout.discounts`: "A `codes` array with every buyer-entered code. `[]` removes them all, and automatic discounts stay. A returned code doesn't mean it applied, so check `discounts.applied` and `messages` when present."
- Declared fields: "`store_credit`: A boolean, offered when the buyer has store credit. `true` applies the balance, and `false` removes it."
- Example response in the doc: `"discounts": { "codes": ["WELCOME10"], "applied": [ { "title": "WELCOME10", "code": "WELCOME10", "amount": 880 } ] }`. For a code discount the title the agent receives is the code itself.

### 9.4 Which agent channels run what [P: Shopify Help Center, read through WebFetch]

- Meta, including Muse (https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts/meta): "Any automatic discounts or discount codes that you set up are supported in Meta's direct checkout." "Shopify Functions, such as shipping, discount, and cart and checkout validation functions, are supported or run in Meta's direct checkout." Not supported: "Subscriptions, product bundles, customizable products, and B2B-only products"; "Checkout blocks aren't supported in Meta's direct checkout."; "You can't require customers to sign in to their account before checkout."; "Local delivery, pickup in store, and pickup points aren't supported". Fallback: "If a customer's checkout requires information that can't be collected on the Meta surface," the customer continues in the online store in an in-app browser. Region: US, Canada, Mexico.
- Microsoft Copilot (.../agentic-storefronts/ai-channels-with-built-in-checkout): same two sentences about discounts and Functions; same unsupported list.
- ChatGPT (.../agentic-storefronts/chatgpt): "ChatGPT users complete their purchase on your online store checkout in a ChatGPT in-app browser or in a new tab when customers use ChatGPT web." "Because ChatGPT sales happen in your online store checkout, all your customizations, branding, selling strategies, and payment methods are supported."
- Overview (.../agentic-storefronts): "For Google AI Mode and Gemini, Microsoft Copilot, and Meta surfaces such as Muse, if you have direct checkout activated ..."; "Orders from AI channels display in your Shopify admin with channel or referrer attribution".
- Cart transform is not named in the supported-functions sentence and "product bundles" are listed as unsupported, so a cart-transform gift may not work in direct checkouts. [I]

## 10. Redemption paths per mechanism

Legend: (a) = Cart/Checkout MCP at /api/ucp/mcp; (b) = Storefront or Checkout WebMCP; (c) = link.

| Mechanism | Plan / public app | (a) MCP | (b) WebMCP | (c) Link |
| - | - | - | - | - |
| Native code discount (basic, BXGY, free shipping) | All plans; public app with `write_discounts` | `discounts.codes` on create/update cart and checkout; re-send on checkout creation | Checkout WebMCP `update_checkout` `discounts.codes`. Not possible with Storefront WebMCP tools | `/cart/{variant}:{qty}?discount=CODE[,CODE2]`, `/discount/CODE?redirect=/path`, Storefront cart `checkoutUrl` with `discountCodes` |
| App code discount (Discount Function + metafield config) | All plans via public App Store app; custom apps Plus only | Same as above | Same as above | Same as above |
| Automatic discount (native or app) | All plans; max 25 active automatic per store | Nothing to redeem; shows in `discounts.applied` with `automatic: true`. Buyer-linked token needed for customer-specific ones | Nothing to redeem | Nothing to redeem |
| Rejection with custom message (automatic app function) | All plans via public app | Appears as a `messages[]` warning per UCP; Shopify's exact content untested | Same; "warning banner in checkout" | Same |
| Free gift, agent adds the line | All plans | Add gift variant in `line_items[].item.id`, plus code (or automatic BXGY) | `add_to_cart` with variant GID, code at checkout | Gift variant in the permalink path |
| Free gift, Cart Transform `lineExpand` | All plans via public app (one function per app per store) | Trigger must be readable by the function: line contents, buyer email, marker variant. No cart attributes on this path. Direct checkouts list bundles as unsupported | Trigger via line attribute set by an app script; or marker variant | `properties=` on the first product, or `attributes[...]` |
| Delivery discount on a named option (Discount Function delivery target) | All plans via public app | Code in `discounts.codes`; agent selects option via `fulfillment...selected_option_id` and reads `options[].totals` | Code + option selection in `update_checkout` | Code in link; buyer or agent picks the option |
| Delivery option rename (Delivery Customization) | All plans via public app; checkout only (not cart) | Read `fulfillment...options[].title` at checkout | Same | Same |
| CarrierService rates | Advanced plan, or Shopify plan yearly / paid add-on | Options appear in `fulfillment` once a destination is set | Same | Same |
| Draft order (`invoiceUrl`) | All plans; public app with `write_draft_orders` | None found | Opens a normal checkout page; Checkout WebMCP availability there untested | `invoiceUrl` |
| Store credit | New customer accounts required; buyer signed in or Shop Pay | No field in live schema | Checkout WebMCP declared field `store_credit: true` when offered | Buyer applies it at checkout |
| Gift card | `write_gift_cards` | No field in live schema | Not in the documented `update_checkout` fields | Storefront cart `giftCardCodes` -> `checkoutUrl`; or buyer types it |
| Cart attributes / note | - | Not available | Not through WebMCP tools; through `Shopify.actions.updateCart` from a page script | `attributes[key]=value`, `note=`, Storefront cart |
| Selling plan | Approval-gated scopes | Not available | Not through WebMCP tools | Not in permalinks; Storefront cart only |
| Post-purchase order edit, refund, return, store credit | `write_order_edits`, `write_orders`, `write_returns`, store credit scope | Nothing to redeem; result visible in `get_order` | Nothing to redeem | Nothing to redeem |

## 11. Offer menu

| Offer | Best primitive on a non-Plus store | What the agent does | Honest limits |
| - | - | - | - |
| Percent or fixed discount | `discountCodeBasicCreate`, or `discountCodeAppCreate` with `orderDiscountsAdd` / `productDiscountsAdd` (`percentage` or `fixedAmount`, `appliesToEachItem`, per-line `quantity` cap); `usageLimit: 1`, `endsAt`, `appliesOncePerCustomer` | Submits code in `discounts.codes` (MCP or Checkout WebMCP), or follows a link carrying `?discount=` | Max 5 product/order codes + 1 shipping code per order; one product discount per line unless Plus; the label the agent sees is the code string; agents are told to "Only prompt if customer mentions having a discount code" |
| Free shipping | `discountCodeFreeShippingCreate` (`maximumShippingPrice`, `destination`), or Function `deliveryDiscountsAdd` 100% on a `deliveryGroup` | Same code path; needs a destination before the effect shows | "Multiple shipping discounts can't apply to the same order."; subscriptions keep 100% shipping discount on renewals |
| Discounted express shipping | Function delivery target: candidate targeting `deliveryOption.handle` chosen by `title` containing "express", `percentage` or `fixedAmount`; or CarrierService rate on Advanced | Submits code, then selects the express option and reads its `totals` | Function sees options only when Shopify has them (address known); title matching is merchant-specific; CarrierService is plan-gated and cannot see codes |
| Free gift or add-on | (1) gift variant added by link or by the agent, zeroed by Function `productDiscountsAdd` 100% with `cartLine { id, quantity: 1 }` or native BXGY; (2) Cart Transform `lineExpand` adding the gift to an existing line; (3) order edit after purchase | (1) adds variant + code, or follows the link; (2) nothing; (3) nothing | Native: "The free or discounted 'get' item is never automatically added to the cart."; Cart Transform cannot see codes, is rejected with selling plans, and bundles are unsupported in Meta/Copilot direct checkouts; order edit only on unfulfilled lines and invisible before purchase |
| Bundle or quantity tier | Automatic or code Function with `conditions` (`cartLineMinimumQuantity`, `orderMinimumSubtotal`) and `selectionStrategy: MAXIMUM`; native `minimumRequirement`; native BXGY; Cart Transform `linesMerge` for fixed bundles | Raises quantity; automatic tiers need no code | 25 active automatic discounts per store including native ones; tiers are public to every buyer unless gated by code or customer |
| Extended returns or warranty | No checkout primitive. Record: $0 titled line (variant or draft-order custom line), self-describing code, cart attribute (link only), then order tag/metafield via `orderUpdate`; honour with `returnCreate` | Submits the code or adds the $0 line; reads the line title or the code | Shopify's return rules stay store-wide; enforcement is the app's and merchant's process, not checkout; a $0 "service" variant must exist and be published to the channel |
| Delivery guarantee with credit if late | Promise text in delivery option title (Delivery Customization rename, or CarrierService `service_name`/`description`/`max_delivery_date`); monitor fulfilment; pay with `storeCreditAccountCredit`, `giftCardCreate`, customer-bound code or `refundCreate` | Selects the named option; nothing else | Rename keeps the carrier name prefix; Delivery Customization does not run on cart, only checkout; store credit needs new customer accounts and sign-in to spend |
| Credit on the next purchase | `storeCreditAccountCredit` (optional expiry), or `giftCardCreate`, or a single-use code with `context.customers` created after the order webhook | Nothing now; next time: `store_credit: true` on Checkout WebMCP, or code in `discounts.codes` | Store credit: "only when signed in through customer accounts or using Shop Pay", "Only the full store credit amount can be applied", not on draft orders, not in the MCP schema; gift card has no MCP field |
| Price hold for N hours | Code with `endsAt = now + N h` and `usageLimit: 1`; or draft order with `priceOverride` / `generatePriceOverride` plus `reserveInventoryUntil` | Redeems the code before expiry, or opens `invoiceUrl` | A code holds the discount, not the stock; only draft orders reserve inventory and they are link-only; draft links do not expire by themselves |
| Price match | Seller agent computes the gap and mints a `fixedAmount` product discount on that line (floor enforced in app code before minting, and again in the Function from the metafield); or draft order `priceOverride`; or `refundCreate` after purchase | Code or link | Multi-currency: the reference gives `presentmentCurrencyRate` for converting discounts between shop and presentment currency and says condition amounts are "in the shop's currency"; which currency a `fixedAmount` value is read in was not stated, so test it; stacking with other discounts can go below the floor unless `combinesWith` is all false and the Function re-checks line cost |

## 12. Precise answers

1. Can ONE runtime-created code carry its own configuration that a Discount Function reads, so one code stands for a composite offer? YES [P]. `discountCodeAppCreate` takes `code`, `title`, `functionHandle`, `discountClasses: [PRODUCT, ORDER, SHIPPING]`, `metafields`, `usageLimit`, `appliesOncePerCustomer`, `startsAt`, `endsAt`, `context`, `combinesWith` in one call. The Function reads `discount { discountClasses metafield(namespace: "$app", key: "function-configuration") { jsonValue } }` in both targets. Official example: "Create a configurable discount with metafields". Second route: many codes on one node, with terms parsed from `triggeringDiscountCode` (official example "Create a dynamic discount from discount codes", which works "if a discount code associated to this function exists"). Bounds: metafield value up to 10,000 bytes, input query cost 30, output 20 kB, money effects only.
2. How fast? [P for limits, I for the rate] 100 cost points per second per app-and-store on standard plans, 200 on Advanced, 1000 on Plus; a mutation costs about 10; so about 10 offers per second sustained, more in bursts. Bulk: `discountRedeemCodeBulkAdd`, max 250 codes per call, asynchronous, all on one node. Store-wide ceiling: "20,000,000 unique discount codes". To remove latency from the negotiation, pre-mint a pool.
3. Bound to one customer email or one cart? Customer: yes natively through `context.customers` (customer IDs; "up to 100 specific customers") and `appliesOncePerCustomer` ("limit a customer's email address or phone number to one use"); the buyer must be recognised at checkout; forum reports say the check bites once an email is entered [S]. In code: the Function compares `cart.buyerIdentity.email` or customer id/tag/metafield with its config [P for field existence]. Cart: no native binding and no cart id in Function input [P]. Approximation: `usageLimit: 1` + short `endsAt` + config that names the exact variants and quantities + email match; a cart attribute token is possible only on link and browser paths.
4. What does a Discount Function see when an agent submits the code through `discounts.codes`? [I, not tested] The same as for a typed code: the owning function gets `triggeringDiscountCode`; every discount function (including automatic ones) gets `enteredDiscountCodes[] { code, rejectable }` limited to codes that exist, are active and are eligible; plus `cart.buyerIdentity.email` if the agent sent `buyer.email`. Nothing identifies the agent, the channel, `context.intent`, `context.eligibility` or attribution [P: full read of the input schema]. Support statement: "Shopify Functions, such as shipping, discount, and cart and checkout validation functions, are supported or run in Meta's direct checkout."
5. Can a Discount Function add a message or title the buyer and agent see? Partly [P]. Candidate `message` shows for automatic discounts; "If a discount code is entered, the notification displays the code instead." Discount `title`: "displays to merchants in the Shopify admin and to customers." An automatic-discount function can reject entered codes with a custom `message` ("displays as a warning banner in checkout"; about 120 characters per Shopify staff on the forum [S]); "Discount rejection operations are only supported for automatic discounts." Whether Shopify copies that text into UCP `messages[].content` is untested.
6. Can anything an app controls add or zero a free-gift line without the agent adding it? Zero: yes (Function or native BXGY). Add: not a Discount Function. Yes with Cart Transform `lineExpand` (adds a component with its own `fixedPricePerUnit` to an existing line; public app, all plans; cannot see codes). Yes outside Functions: the link itself (permalink, app-built Storefront cart, draft order), a storefront script calling `Shopify.actions.updateCart`, or an order edit after purchase.

## 13. Workaround ideas (improved, killed, added)

- A1 (improves A). One offer = one `DiscountCodeApp` node: code + JSON config in the node's metafield + `usageLimit: 1` + `endsAt` + `combinesWith` all false by default. The Function re-checks the floor against `cart.lines[].cost` so the limit is enforced in checkout code, not only at minting.
- A2. Self-describing code strings. For code discounts the agent receives `title == code`, so write the terms into the code (for example `OA-10OFF-FREEEXPRESS-60DRETURNS-7QK2`, max 255 characters, no commas).
- A3. Code pool. Pre-mint codes per offer template with `discountRedeemCodeBulkAdd` (250 per call) and let the Function parse the template from `triggeringDiscountCode`; hand one out at decision time with zero Admin API latency; delete expired ones in bulk.
- A4. Referee function. One always-on automatic app discount owned by OfferAd that (i) applies public tier offers, (ii) sees every entered code and (iii) rejects with a short custom message ("needs 2 units", "expired, ask for a new offer"). Costs one of the 25 automatic slots.
- C1 (improves C). Priority menu as codes: `ASK-SPEED`, `ASK-RETURNS`, `ASK-PRICE`, `ASK-BUNDLE` exist as real codes on one node; the agent states the user's priority by submitting one through the standard `discounts.codes` field; the Function returns the matching concession. No extra endpoint, no trust in page text beyond learning that the codes exist.
- G (new). Offer as a line item. A $0 "offer token" variant (config in a variant metafield in the app's namespace) that the agent adds through `line_items`. An automatic Function keys on it; it is visible as a titled line in cart, checkout and order; it is the only non-code carrier that works on server MCP. Also carries non-monetary terms ("60-day returns").
- H (new). Non-monetary terms as titled artefacts: $0 line, delivery option rename, code string, then order tag/metafield and an app-side obligation ledger honoured by `returnCreate`, `storeCreditAccountCredit`, `refundCreate`.
- I (new). CarrierService callback for real-time shipping terms on Advanced-plan stores.
- J (improves A's link). App-built cart: Storefront API `cartCreate` (tokenless cart writes) with lines, gift, codes, attributes, optional gift card; return `checkoutUrl`. Works wherever the purchase ends in the online store checkout (ChatGPT today).
- K (improves F). Draft order for fully bespoke deals: price override, custom lines, custom shipping line title and price, inventory reservation; link-only.
- L (new). Browser path: theme app embed applies an offer with one `Shopify.actions.updateCart({ lines, discountCodes, attributes })` when the session carries an offer token; a WebMCP agent only has to navigate.
- M (new). Post-purchase delivery of promises (order edit gift, refund, store credit, return) so the checkout never has to carry them; works on every channel; needs the promise to be stated before purchase.
- D: no Function-side support found. Claims are not in Function input and the live schema does not declare `provisional` / `eligibility`. Park it.
- Closed routes: fetch targets (custom apps on Plus/Enterprise), `lineUpdate` price override (Plus), checkout UI extensions on information/shipping/payment steps (Plus), selling plans (approval-gated, no MCP field), store credit and gift cards on server MCP (no field).

## 14. Corrections to the brief

- Item 4: `provisional` and `eligibility` on `discounts.applied` come from the UCP spec; Shopify's live output schema declares only `code`, `title`, `amount`, `method` (each|across|one), `automatic`, `allocations`.
- Item 5: Shopify's Checkout MCP doc tells the AGENT to forward codes from cart to checkout; the UCP spec puts that duty on the business.
- Item 7: the 25 limit is on active automatic discounts ("increasing the limit for automatic app-based discounts from 5 to 25"; "maximum of 25 active automatic discounts. This total includes app-based discounts"). Code-triggered app discounts are not documented as capped at 25. Also not in Function input: attribution/UTM, any agent or channel identity, cart id.
- Item 7: `enteredDiscountCodes` in run targets only contains codes that exist and are valid; a made-up string never reaches a public app's Function.
- Item 8: permalinks also take several comma-separated codes, `properties=` (Base64 URL-encoded JSON, first product only), `note`, `ref`, `checkout[email]`, `checkout[shipping_address][...]`, `access_token` + `source_name`, `storefront=true`, `payment=shop_pay`; "Selling plans don't work with cart permalinks".
- Item 9: the live storefront script registers `add_to_cart` and `update_cart_lines` (not `update_cart`) plus `get_ucp_profile`; none of the storefront tools can submit a discount code, attribute or note; Checkout WebMCP also exposes `declared_fields` including `store_credit`.
- Idea B(ii): Shopify marks catalog, cart and policy tool results with `untrustedContentHint: true`, and the MCP schema says to prompt for codes only "if customer mentions having a discount code". Both work against instructions planted in store content.
- Idea A: a free gift does not need the link to add the line; Cart Transform `lineExpand` can add it, with the limits above.

## 15. Not verified, and the tests that would settle each (own development store only)

1. That `discounts.codes` sent through MCP reaches the Function as `triggeringDiscountCode` / `enteredDiscountCodes`, and that `buyer.email` arrives as `cart.buyerIdentity.email`.
2. What `discounts.applied[].title` contains for a Function-backed code discount and for an automatic app discount (candidate `message` or discount `title`).
3. Whether a Function's rejection `message` is copied into UCP `messages[].content`, and with which `code`.
4. Whether `usageLimit` is per code when one node has many codes.
5. Whether more than 25 code-triggered app discount nodes can be active at once.
6. Whether Cart Transform runs in UCP carts/checkouts and in Meta/Copilot direct checkouts, and whether `fixedPricePerUnit` 0 is accepted.
7. What `cart.discountApplications[].metafield` returns inside Delivery Customization and Validation functions (the reference gives only the generic metafield description).
8. Whether `attribution.*` or `context.intent` sent through MCP surfaces anywhere a Function or webhook can read (cart attributes, order `customerJourney`, landing site).
9. Whether a Storefront-API cart id is accepted as `cart_id` in MCP `create_checkout`.
10. How a customer-restricted code behaves for an anonymous or signed agent that only sends `buyer.email`.
11. Whether a public app's Function receives `buyerIdentity.email` before protected-customer-data approval.
12. Whether Checkout WebMCP tools register on a draft order `invoiceUrl` checkout.
13. Whether Muse, Dots and Grok Bot expose any way for the agent to enter a code in their own direct checkouts.

## 16. Sources

shopify.dev (all fetched as `.md` on 13 Oct 2026, saved under `r1-*`): api/functions/latest/discount; api/functions/latest (overview); api/functions/latest/cart-transform; .../delivery-customization; .../payment-customization; .../cart-and-checkout-validation; api/admin-graphql/latest/mutations/{discountCodeBasicCreate, discountCodeBxgyCreate, discountCodeFreeShippingCreate, discountCodeAppCreate, discountCodeAppUpdate, discountAutomaticBasicCreate, discountAutomaticBxgyCreate, discountAutomaticFreeShippingCreate, discountAutomaticAppCreate, discountRedeemCodeBulkAdd, draftOrderCreate, draftOrderInvoiceSend, draftOrderComplete, storeCreditAccountCredit, giftCardCreate, orderUpdate, returnCreate, refundCreate, customerCreate, orderEditAddVariant, orderEditAddLineItemDiscount, orderEditCommit, carrierServiceCreate}; input-objects/{DiscountCodeAppInput, DiscountCodeBasicInput, DiscountCodeBxgyInput, DiscountCodeFreeShippingInput, DiscountAutomaticAppInput, DiscountAutomaticBasicInput, DiscountAutomaticBxgyInput, DiscountAutomaticFreeShippingInput, DiscountContextInput, DiscountCustomerSelectionInput, DiscountCombinesWithInput, DiscountMinimumRequirementInput, DiscountCustomerGetsInput, DiscountCustomerGetsValueInput, DiscountCustomerBuysInput, DiscountOnQuantityInput, DiscountRedeemCodeInput, DraftOrderInput, DraftOrderLineItemInput, DraftOrderAppliedDiscountInput, ShippingLineInput}; objects/{DiscountCodeApp, DiscountCodeBasic, DiscountNode, DiscountRedeemCodeBulkCreation, DraftOrder, DeliveryCarrierService}; api/usage/limits; apps/build/apis/graphql-admin/rate-limits; api/usage/access-scopes; apps/launch/protected-customer-data; apps/build/discounts; apps/build/discounts/discount-rejections; changelog/posts/discount-rejection-support-for-discount-functions; changelog/posts/increased-limits-for-automatic-function-based-discounts; api/admin-rest/latest/resources/{pricerule, discountcode, carrierservice}; api/storefront (overview) and storefront/latest {mutations/cartCreate, mutations/cartDiscountCodesUpdate, input-objects/CartInput, CartLineInput, CartBuyerIdentityInput, objects/Cart}; api/storefront-events-and-actions (overview, actions, actions/update-cart, actions/call, events); apps/build/purchase-options (+ subscriptions/selling-plans, deferred); apps/build/flow; api/checkout-ui-extensions; apps/build/orders-fulfillment/order-management-apps/edit-orders; apps/build/functions/network-access; apps/build/online-store/app-proxies.

help.shopify.com (HTTP 403 to curl; read through the WebFetch tool, which returns extracted quotes): manual/discounts/discount-methods/discount-codes; manual/discounts/discount-types/buy-x-get-y; manual/discounts/discount-types/percentage-fixed-amount; manual/discounts/discount-combinations; manual/discounts/managing-discount-codes; manual/customers/store-credit; manual/fulfillment/managing-orders/create-orders/create-draft; manual/online-sales-channels/agentic-storefronts (+ /meta, /chatgpt, /ai-channels-with-built-in-checkout, /customer-experience).

Forum threads with Shopify staff replies [S]: community.shopify.dev/t/discount-api-rejection-limitations/28180; .../discount-reject-function-fails-against-app-generated-discount-code/32006; .../discount-function-entereddiscountcodesreject-message-maximum-120-characters/28806.

Live read-only fetches [T]: https://www.allbirds.com/ (home page HTML, to locate scripts); https://www.allbirds.com/cdn/shopifycloud/storefront/assets/storefront/webmcp-f427de6a.js; https://cdn.shopify.com/storefront/standard-actions.js. No carts or checkouts were created on any store.
