import { productTypeOptions } from '@/src/constants/options';
import {
  getEcardPriceUsd,
  getPhysicalPriceUsd,
  type OrderCurrency,
} from '@/src/constants/cardProducts';
import type { PaymentStatus } from '@/src/types/models';
import {
  clearGuestCardDraft,
  GuestCardDraft,
  GuestCardChoice,
  loadGuestCardDraft,
  markGuestDraftMigrated,
  saveGuestLastOrderId,
} from '@/src/services/guestDraftService';
import { createCustomerOrder, upsertBioPage } from '@/src/services/firestoreService';
import { AppUser } from '@/src/types/models';
import { buildOrderPricingFields } from '@/src/utils/orderPricing';

export type GuestDraftPaymentOptions = {
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  currency: OrderCurrency;
  amount?: number;
  salesCommission?: number;
  salesCommissionCurrency?: OrderCurrency;
  paymentReference?: string;
};

function slugFromName(name: string, userId: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  const suffix = userId.slice(0, 6);
  return base ? `${base}-${suffix}` : `card-${suffix}`;
}

function paymentNoteSuffix(opts?: GuestDraftPaymentOptions): string {
  if (!opts?.paymentReference) return '';
  return ` · ref ${opts.paymentReference}`;
}

export async function migrateGuestDraft(
  user: AppUser,
  choice: GuestCardChoice,
  draft?: GuestCardDraft | null,
  payment?: GuestDraftPaymentOptions
): Promise<string> {
  const cardDraft = draft ?? (await loadGuestCardDraft());
  if (!cardDraft) {
    throw new Error('No saved design found on this device.');
  }

  const displayName = cardDraft.displayName.trim() || user.displayName || 'My Card';
  const phone = cardDraft.phone.trim() || user.phone?.trim() || '+1000000000';
  const email = cardDraft.email.trim() || user.email;
  const productMeta = productTypeOptions.find((p) => p.value === cardDraft.product);
  const currency: OrderCurrency = payment?.currency ?? 'KHR';

  if (choice === 'ecard') {
    const slug = slugFromName(displayName, user.id);
    await upsertBioPage(user.id, {
      slug,
      displayName,
      tagline: [cardDraft.jobTitle.trim(), cardDraft.company.trim()].filter(Boolean).join(' · ') || undefined,
      email: email || undefined,
      whatsapp: phone || undefined,
      theme: 'vibrant_pink',
      customLinks: [],
    });

    const pricing = buildOrderPricingFields({
      productType: 'ecard',
      quantity: 1,
      currency,
    });

    const orderId = await createCustomerOrder({
      customerName: displayName,
      phone,
      email,
      company: cardDraft.company.trim() || undefined,
      jobTitle: cardDraft.jobTitle.trim() || undefined,
      productType: 'ecard',
      quantity: 1,
      cardDesign: cardDraft.cardDesign,
      nfcEnabled: true,
      qrPrinted: true,
      paymentStatus: payment?.paymentStatus ?? 'unpaid',
      paymentMethod: payment?.paymentMethod ?? 'digital',
      amount: payment?.amount ?? pricing.amount,
      currency,
      salesCommission: payment?.salesCommission ?? pricing.salesCommission,
      salesCommissionCurrency: payment?.salesCommissionCurrency ?? pricing.salesCommissionCurrency,
      notes: `E-card — ${formatUsd(getEcardPriceUsd())} (guest design import)${paymentNoteSuffix(payment)}`,
      fulfillment: 'digital',
    });

    await finalizeGuestDraftMigration(orderId);
    return orderId;
  }

  const physicalUsd = getPhysicalPriceUsd(cardDraft.product);
  const pricing = buildOrderPricingFields({
    productType: 'physical_nfc',
    quantity: 1,
    currency,
    material: cardDraft.product,
  });

  const orderId = await createCustomerOrder({
    customerName: displayName,
    phone,
    email,
    company: cardDraft.company.trim() || undefined,
    jobTitle: cardDraft.jobTitle.trim() || undefined,
    productType: 'physical_nfc',
    quantity: 1,
    cardDesign: cardDraft.cardDesign,
    nfcEnabled: true,
    qrPrinted: true,
    paymentStatus: payment?.paymentStatus ?? 'unpaid',
    paymentMethod: payment?.paymentMethod,
    amount: payment?.amount ?? pricing.amount,
    currency,
    salesCommission: payment?.salesCommission ?? pricing.salesCommission,
    salesCommissionCurrency: payment?.salesCommissionCurrency ?? pricing.salesCommissionCurrency,
    notes: `Physical NFC — ${productMeta?.label ?? cardDraft.product} · ${formatUsd(physicalUsd)} (guest import)${paymentNoteSuffix(payment)}`,
    fulfillment: 'physical',
  });

  await finalizeGuestDraftMigration(orderId);
  return orderId;
}

function formatUsd(usd: number): string {
  return `$${usd}`;
}

async function finalizeGuestDraftMigration(orderId: string): Promise<void> {
  await saveGuestLastOrderId(orderId);
  await markGuestDraftMigrated();
  await clearGuestCardDraft();
}
