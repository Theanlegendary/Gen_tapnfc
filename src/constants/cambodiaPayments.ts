import type { AppIconName } from '@/src/components/AppIcon';

/**
 * Cambodia-focused payment methods (UI + order.paymentMethod).
 * Plug real gateways in confirmCambodiaPayment() — see src/services/cambodiaPaymentService.ts
 */
export type CambodiaPaymentMethodId =
  | 'aba_pay'
  | 'khqr'
  | 'acleda'
  | 'wing'
  | 'cash_on_delivery';

export interface CambodiaPaymentMethod {
  id: CambodiaPaymentMethodId;
  labelEn: string;
  hintEn?: string;
  icon: AppIconName;
}

export const CAMBODIA_PAYMENT_METHODS: CambodiaPaymentMethod[] = [
  {
    id: 'aba_pay',
    labelEn: 'Pay with ABA Pay',
    hintEn: 'ABA Mobile / account transfer',
    icon: 'Phone',
  },
  {
    id: 'khqr',
    labelEn: 'Pay with KHQR',
    hintEn: 'Scan Bakong KHQR',
    icon: 'QrCode',
  },
  {
    id: 'acleda',
    labelEn: 'Pay with ACLEDA',
    hintEn: 'ACLEDA Unity / bank',
    icon: 'Wallet',
  },
  {
    id: 'wing',
    labelEn: 'Pay with Wing',
    hintEn: 'Wing wallet or agent',
    icon: 'Wallet',
  },
  {
    id: 'cash_on_delivery',
    labelEn: 'Cash on delivery',
    hintEn: 'Pay when card is delivered (physical only)',
    icon: 'CircleDollarSign',
  },
];

export function getCambodiaPaymentMethod(id: string): CambodiaPaymentMethod | undefined {
  return CAMBODIA_PAYMENT_METHODS.find((m) => m.id === id);
}

export function paymentMethodLabel(id: string): string {
  const method = getCambodiaPaymentMethod(id);
  if (!method) return id.replace(/_/g, ' ');
  return method.labelEn;
}
