// Payment providers. Phase 1 only supports cash on delivery ("Plaćanje pouzećem").
// To add online card payment later (a Serbian bank gateway or Stripe), implement another
// PaymentProvider and register it in `providers` — the checkout calls provider.pay(order)
// and only needs to handle the returned result.

/** @typedef {{ status: 'pending' | 'paid' | 'redirect' | 'failed', method: string, redirectUrl?: string, reference?: string }} PaymentResult */

export class PaymentProvider {
  /** @returns {string} */
  get id() {
    throw new Error('not implemented');
  }
  /** Whether the method can be selected in the checkout. */
  get available() {
    return false;
  }
  /**
   * @param {object} order the full order object (number, customer, lines, totals)
   * @returns {Promise<PaymentResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async pay(order) {
    throw new Error('not implemented');
  }
}

export class CashOnDeliveryProvider extends PaymentProvider {
  get id() {
    return 'cod';
  }
  get available() {
    return true;
  }
  async pay() {
    // Nothing to charge now — the customer pays the courier on delivery.
    return { status: 'pending', method: 'cod' };
  }
}

// Placeholder for the future card provider (kept unavailable so the option shows as "uskoro").
export class CardProvider extends PaymentProvider {
  get id() {
    return 'card';
  }
  get available() {
    return false;
  }
}

export const providers = {
  cod: new CashOnDeliveryProvider(),
  card: new CardProvider(),
};

export function getProvider(id) {
  const p = providers[id];
  if (!p || !p.available) throw new Error(`Payment method "${id}" is not available`);
  return p;
}
