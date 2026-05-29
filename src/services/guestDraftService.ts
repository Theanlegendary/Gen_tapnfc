import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardDesign } from '@/src/types/models';
import type { ProductType } from '@/src/constants/options';

const GUEST_CARD_DRAFT_KEY = 'sitehub_guest_card_draft_v1';
const GUEST_CHECKOUT_DRAFT_KEY = 'sitehub_guest_checkout_draft_v1';
const GUEST_DRAFT_MIGRATED_KEY = 'sitehub_guest_draft_migrated_v1';
const GUEST_LAST_ORDER_ID_KEY = 'sitehub_guest_last_order_id_v1';

export type GuestCardDesignBackground = 'gradient' | 'custom';

export type GuestCardDraft = {
  displayName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  /** Telegram or social handle — optional. */
  telegram?: string;
  product: ProductType;
  cardDesign: CardDesign;
  /** Virtual e-card vs physical NFC — persisted for unified design screen. */
  cardChoice?: GuestCardChoice;
  /** Gradient carousel vs uploaded photo background. */
  designBackground?: GuestCardDesignBackground;
  /** Carousel slide index: 0–2 gradient presets, 3 = custom photo. */
  gradientIndex?: number;
  customImageUri?: string;
  /** Optional base64 for draft persistence when file URIs expire. */
  customImageBase64?: string;
  savedAt: string;
};

export type GuestCheckoutDraft = {
  cardChoice: GuestCardChoice;
  product: ProductType;
  quantity: number;
  displayName: string;
  phone: string;
  currency: 'USD' | 'KHR';
  paymentMethod?: string;
  savedAt: string;
};

export type GuestCardChoice = 'ecard' | 'physical';

function normalizeGuestCardDraft(raw: Partial<GuestCardDraft>): GuestCardDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const displayName = typeof raw.displayName === 'string' ? raw.displayName : '';
  const customImageUri = typeof raw.customImageUri === 'string' ? raw.customImageUri : undefined;
  const customImageBase64 = typeof raw.customImageBase64 === 'string' ? raw.customImageBase64 : undefined;
  if (!displayName && !raw.company && !raw.email && !customImageUri && !customImageBase64) return null;
  const designBackground: GuestCardDesignBackground | undefined =
    raw.designBackground === 'custom' || raw.designBackground === 'gradient'
      ? raw.designBackground
      : customImageUri || customImageBase64
        ? 'custom'
        : undefined;
  const gradientIndex =
    typeof raw.gradientIndex === 'number' && raw.gradientIndex >= 0 && raw.gradientIndex <= 3
      ? raw.gradientIndex
      : designBackground === 'custom'
        ? 3
        : undefined;
  return {
    displayName,
    jobTitle: typeof raw.jobTitle === 'string' ? raw.jobTitle : '',
    company: typeof raw.company === 'string' ? raw.company : '',
    email: typeof raw.email === 'string' ? raw.email : '',
    phone: typeof raw.phone === 'string' ? raw.phone : '',
    telegram: typeof raw.telegram === 'string' ? raw.telegram : undefined,
    product: (raw.product as ProductType) ?? 'wood_card',
    cardDesign: (raw.cardDesign as CardDesign) ?? 'classic_black',
    cardChoice:
      raw.cardChoice === 'ecard' || raw.cardChoice === 'physical' ? raw.cardChoice : undefined,
    designBackground,
    gradientIndex,
    customImageUri,
    customImageBase64,
    savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : new Date().toISOString(),
  };
}

export async function loadGuestCardDraft(): Promise<GuestCardDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_CARD_DRAFT_KEY);
    if (!raw) return null;
    return normalizeGuestCardDraft(JSON.parse(raw) as Partial<GuestCardDraft>);
  } catch {
    return null;
  }
}

export async function saveGuestCardDraft(draft: Omit<GuestCardDraft, 'savedAt'>): Promise<void> {
  const payload: GuestCardDraft = { ...draft, savedAt: new Date().toISOString() };
  await AsyncStorage.setItem(GUEST_CARD_DRAFT_KEY, JSON.stringify(payload));
}

export async function clearGuestCardDraft(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_CARD_DRAFT_KEY);
}

export async function loadGuestCheckoutDraft(): Promise<GuestCheckoutDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_CHECKOUT_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestCheckoutDraft;
  } catch {
    return null;
  }
}

export async function saveGuestCheckoutDraft(draft: Omit<GuestCheckoutDraft, 'savedAt'>): Promise<void> {
  const payload: GuestCheckoutDraft = { ...draft, savedAt: new Date().toISOString() };
  await AsyncStorage.setItem(GUEST_CHECKOUT_DRAFT_KEY, JSON.stringify(payload));
}

export async function clearGuestCheckoutDraft(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_CHECKOUT_DRAFT_KEY);
}

export async function isGuestDraftMigrated(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(GUEST_DRAFT_MIGRATED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markGuestDraftMigrated(): Promise<void> {
  await AsyncStorage.setItem(GUEST_DRAFT_MIGRATED_KEY, 'true');
}

export async function clearGuestDraftMigrationFlag(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_DRAFT_MIGRATED_KEY);
}

export async function saveGuestLastOrderId(orderId: string): Promise<void> {
  await AsyncStorage.setItem(GUEST_LAST_ORDER_ID_KEY, orderId.trim());
}

export async function loadGuestLastOrderId(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(GUEST_LAST_ORDER_ID_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export async function clearGuestLastOrderId(): Promise<void> {
  await AsyncStorage.removeItem(GUEST_LAST_ORDER_ID_KEY);
}

/** True when a customer should see the post-login card choice screen. */
export async function shouldPromptGuestDraftContinuation(): Promise<boolean> {
  if (await isGuestDraftMigrated()) return false;
  const draft = await loadGuestCardDraft();
  if (!draft) return false;
  return Boolean(
    draft.displayName.trim()
    || draft.company.trim()
    || draft.email.trim()
    || draft.phone.trim()
  );
}
