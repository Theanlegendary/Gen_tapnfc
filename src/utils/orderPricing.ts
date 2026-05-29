import {
  USD_TO_KHR_RATE,
  amountInCurrency,
  computeSalesCommission,
  formatDualPrice,
  formatKhr,
  formatUsd,
  resolveLineTotalUsd,
  usdToKhr,
  type OrderCurrency,
} from '@/src/constants/cardProducts';
import type { ProductType } from '@/src/constants/options';
import type { Order } from '@/src/types/models';

export function getOrderTotalUsd(order: Pick<Order, 'amount' | 'currency' | 'productType' | 'quantity'> & {
  materialProductType?: ProductType;
}): number {
  if (typeof order.amount === 'number' && order.amount > 0) {
    if (order.currency === 'KHR') {
      return order.amount / USD_TO_KHR_RATE;
    }
    return order.amount;
  }
  return resolveLineTotalUsd(order.productType, order.quantity, order.materialProductType);
}

export function formatOrderTotal(order: Pick<Order, 'amount' | 'currency' | 'productType' | 'quantity'>): string {
  if (typeof order.amount === 'number' && order.currency === 'KHR') {
    return `${formatKhr(order.amount)} / ~${formatUsd(getOrderTotalUsd(order))}`;
  }
  if (typeof order.amount === 'number' && order.currency === 'USD') {
    return formatDualPrice(order.amount);
  }
  const usd = getOrderTotalUsd(order);
  return formatDualPrice(usd);
}

export function buildOrderPricingFields(input: {
  productType: string;
  quantity: number;
  currency: OrderCurrency;
  material?: ProductType;
  commissionRate?: number;
}): Pick<Order, 'amount' | 'currency' | 'salesCommission' | 'salesCommissionCurrency'> {
  const totalUsd = resolveLineTotalUsd(input.productType, input.quantity, input.material);
  const amount = amountInCurrency(totalUsd, input.currency);
  const rate = input.commissionRate;
  const salesCommission = computeSalesCommission(totalUsd, rate);
  return {
    amount,
    currency: input.currency,
    salesCommission,
    salesCommissionCurrency: input.currency,
  };
}

export { formatDualPrice, formatKhr, formatUsd, usdToKhr };
