import type { CambodiaPaymentMethodId } from '@/src/constants/cambodiaPayments';
import type { OrderCurrency } from '@/src/constants/cardProducts';

export type ConfirmPaymentInput = {
  methodId: CambodiaPaymentMethodId;
  amount: number;
  currency: OrderCurrency;
  orderId?: string;
};

export type ConfirmPaymentResult = {
  success: boolean;
  /** Stub reference — replace with gateway transaction id */
  reference: string;
  paidAt: string;
};

/**
 * Stub payment confirmation for Cambodia methods (ABA, KHQR, ACLEDA, Wing, COD).
 *
 * REAL INTEGRATION: call your provider here, e.g.:
 * - ABA Pay: https://developer.ababank.com/
 * - KHQR / Bakong: National Bank of Cambodia KHQR API
 * - ACLEDA / Wing: partner SDK or server-side redirect
 *
 * On success, return { success: true, reference: txnId } and set order.paymentStatus to 'paid'.
 */
export async function confirmCambodiaPayment(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const ref = `STUB-${input.methodId.toUpperCase()}-${Date.now().toString(36)}`;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[cambodiaPayment] stub confirm', { ...input, reference: ref });
  }
  return {
    success: true,
    reference: ref,
    paidAt: new Date().toISOString(),
  };
}
