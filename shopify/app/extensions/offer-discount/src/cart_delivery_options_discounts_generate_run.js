// Delivery target: the free standard shipping and the express upgrade of an offer.
import { cents, decimal, entitled, numericId, readOffer } from './offer.js';

const rate = option => cents(option.cost?.amount);

/**
 * @param {import('../generated/api').DeliveryInput} input
 * @returns {import('../generated/api').CartDeliveryOptionsDiscountsGenerateRunResult}
 */
export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const offer = readOffer(input);
  if (!offer || !(offer.freeShipping || offer.express)) return { operations: [] };
  if (!input.discount.discountClasses.includes('SHIPPING')) return { operations: [] };
  if (!entitled(offer, input.cart?.lines)) return { operations: [] };

  const isExpress = o => offer.expressPattern.test(o.title ?? '') || offer.expressPattern.test(String(o.handle ?? ''));
  const freeStandard = new Set();
  const freeExpress = new Set();
  const candidates = [];
  // A cart can ship in several groups, each with its own options and rates.
  for (const group of input.cart?.deliveryGroups ?? []) {
    // The offer covers the shipment that carries its product, not every parcel of the order.
    if (!(group.cartLines ?? []).some(l => numericId(l.merchandise?.id) === offer.variant)) continue;
    // Pickup and local delivery are not what the offer calls shipping.
    const options = (group.deliveryOptions ?? []).filter(o => o.deliveryMethodType === 'SHIPPING');
    const express = options.filter(isExpress);
    const standard = options.filter(o => !isExpress(o));
    if (offer.freeShipping) {
      for (const o of standard) if (rate(o) > 0) freeStandard.add(o.handle);
      // With both, the standard rate is zero, so express at the standard rate is free too.
      if (offer.express) for (const o of express) if (rate(o) > 0) freeExpress.add(o.handle);
      continue;
    }
    for (const o of express) {
      // The standard rate: the dearest option that is not express and still costs less than this one.
      const below = standard.map(rate).filter(r => r < rate(o));
      if (!below.length) continue;
      candidates.push({ message: offer.express.label, targets: [{ deliveryOption: { handle: o.handle } }], value: { fixedAmount: { amount: decimal(rate(o) - Math.max(...below)) } } });
    }
  }
  const free = (message, handles) => ({ message, targets: [...handles].map(handle => ({ deliveryOption: { handle } })), value: { percentage: { value: '100.0' } } });
  if (freeStandard.size) candidates.push(free(offer.freeShipping.label, freeStandard));
  if (freeExpress.size) candidates.push(free(offer.express.label, freeExpress));
  if (!candidates.length) return { operations: [] };
  // One operation for all groups: a result may hold only one deliveryDiscountsAdd.
  return { operations: [{ deliveryDiscountsAdd: { candidates, selectionStrategy: 'ALL' } }] };
}
