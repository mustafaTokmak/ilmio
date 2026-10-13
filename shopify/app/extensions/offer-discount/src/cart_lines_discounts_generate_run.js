// Cart target: the lower price and the free add-on of an offer.
// Enum values are written as strings so this file runs in plain Node too,
// without the types the CLI generates into ../generated.
import { cents, decimal, entitled, numericId, readOffer } from './offer.js';

// What to take off the offered units, in cents. The offer is a price as well
// as an amount: if the shelf price has dropped since the offer was made, take
// off less, so the buyer pays what was agreed and the seller never less.
function priceOff(offer, picks) {
  if (!offer.priceOff) return 0;
  const costs = picks.map(p => p.line.cost?.amountPerQuantity);
  // A fixed amount is read in the cart's currency. In another currency it would be a different offer.
  if (offer.currency && costs.some(c => c?.currencyCode !== offer.currency)) return 0;
  if (offer.itemsTotal == null) return offer.priceOff;
  const shelf = picks.reduce((sum, p, i) => sum + cents(costs[i]?.amount) * p.quantity, 0);
  return Math.min(offer.priceOff, shelf - offer.itemsTotal);
}

/**
 * @param {import('../generated/api').CartInput} input
 * @returns {import('../generated/api').CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  const offer = readOffer(input);
  if (!offer || !input.discount.discountClasses.includes('PRODUCT')) return { operations: [] };
  const lines = input.cart?.lines ?? [];
  const picks = entitled(offer, lines);
  if (!picks) return { operations: [] };

  const candidates = [];
  const off = priceOff(offer, picks);
  if (off > 0) {
    candidates.push({
      message: offer.priceLabel,
      targets: picks.map(p => ({ cartLine: { id: p.line.id, quantity: p.quantity } })),
      // One amount across the offered units, not one per unit: nothing to round.
      value: { fixedAmount: { amount: decimal(off), appliesToEachItem: false } },
    });
  }
  for (const gift of offer.gifts) {
    // One line cannot be both the product bought and the add-on given.
    if (gift.variant === offer.variant) continue;
    // A Function cannot add a line: the cart link or the agent puts the add-on in the cart.
    const line = lines.find(l => numericId(l.merchandise?.id) === gift.variant);
    if (line) candidates.push({ message: gift.label, targets: [{ cartLine: { id: line.id, quantity: 1 } }], value: { percentage: { value: '100.0' } } });
  }
  if (!candidates.length) return { operations: [] };
  // ALL, because the price and the add-on sit on different lines and both apply.
  return { operations: [{ productDiscountsAdd: { candidates, selectionStrategy: 'ALL' } }] };
}
