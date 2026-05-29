import type { ProductType } from '@/src/constants/options';

/** Fixed display rate — replace with live FX API when integrating real payments. */
export const USD_TO_KHR_RATE = 4100;

export type CardProductSku = 'ecard' | 'physical_nfc';

export type OrderCurrency = 'USD' | 'KHR';

export interface CardProductDefinition {
  sku: CardProductSku;
  /** Stored on Order.productType for fulfillment routing */
  productType: string;
  labelEn: string;
  subtitleEn: string;
  priceUsd: number;
  fulfillment: 'digital' | 'physical';
}

/** Core earn SKUs: digital e-card (lower) vs physical NFC (higher, print + ship). */
export const CARD_PRODUCTS: Record<CardProductSku, CardProductDefinition> = {
  ecard: {
    sku: 'ecard',
    productType: 'ecard',
    labelEn: 'E-Card (Digital)',
    subtitleEn: 'Instant digital profile — no printing',
    priceUsd: 12,
    fulfillment: 'digital',
  },
  physical_nfc: {
    sku: 'physical_nfc',
    productType: 'physical_nfc',
    labelEn: 'Physical NFC Card',
    subtitleEn: 'Printed card + NFC chip + shipping',
    priceUsd: 49,
    fulfillment: 'physical',
  },
};

/** Material add-on when guest picks wood / metal / PVC on physical orders. */
export const PHYSICAL_MATERIAL_ADDON_USD: Record<ProductType, number> = {
  wood_card: 10,
  metal_card: 25,
  pvc_card: 0,
};

/** Default sales commission rate (10%) — adjust in admin settings later. */
export const DEFAULT_SALES_COMMISSION_RATE = 0.1;

export function usdToKhr(usd: number): number {
  const raw = usd * USD_TO_KHR_RATE;
  return Math.round(raw / 1000) * 1000;
}

export function formatKhr(amount: number): string {
  return `៛${amount.toLocaleString('en-US')}`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

/** Dual display e.g. "៛49,200 / $12" */
export function formatDualPrice(usd: number): string {
  return `${formatKhr(usdToKhr(usd))} / ${formatUsd(usd)}`;
}

/** Guest footer / summary — USD first, KHR amount labeled (no $ on riel). */
export function formatFooterDualPrice(usd: number): string {
  return `${formatUsd(usd)} · ${usdToKhr(usd).toLocaleString('en-US')} KHR`;
}

export function getCardProduct(sku: CardProductSku): CardProductDefinition {
  return CARD_PRODUCTS[sku];
}

export function getEcardPriceUsd(): number {
  return CARD_PRODUCTS.ecard.priceUsd;
}

export function getPhysicalPriceUsd(material?: ProductType): number {
  const base = CARD_PRODUCTS.physical_nfc.priceUsd;
  if (!material) return base;
  return base + (PHYSICAL_MATERIAL_ADDON_USD[material] ?? 0);
}

export function resolveLineTotalUsd(productType: string, quantity: number, material?: ProductType): number {
  const qty = Math.max(1, quantity);
  if (productType === 'ecard') {
    return getEcardPriceUsd() * qty;
  }
  if (productType === 'physical_nfc') {
    return getPhysicalPriceUsd(material) * qty;
  }
  // Legacy material-only orders (sales flow)
  if (material && productType in PHYSICAL_MATERIAL_ADDON_USD) {
    return getPhysicalPriceUsd(material) * qty;
  }
  return CARD_PRODUCTS.physical_nfc.priceUsd * qty;
}

export function computeSalesCommission(totalUsd: number, rate = DEFAULT_SALES_COMMISSION_RATE): number {
  return Math.round(totalUsd * rate * 100) / 100;
}

export function amountInCurrency(totalUsd: number, currency: OrderCurrency): number {
  return currency === 'KHR' ? usdToKhr(totalUsd) : totalUsd;
}
