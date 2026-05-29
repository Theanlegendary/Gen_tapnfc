import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { IosFormActionFooter } from '@/src/components/IosFormActionFooter';
import { iosDesign } from '@/src/design-system/ios';
import { salesUi } from '@/src/features/sales/components/SalesScreenUi';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { cardDesignOptions, paymentMethodOptions, productTypeOptions } from '@/src/constants/options';
import { useAuth } from '@/src/hooks/useAuth';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { createOrder } from '@/src/services/firestoreService';
import { buildOrderPricingFields } from '@/src/utils/orderPricing';
import type { ProductType } from '@/src/constants/options';
import { getAuthErrorMessage } from '@/src/services/authService';
import { uploadOrderArtwork } from '@/src/services/orderArtworkService';
import { CardDesign } from '@/src/types/models';

import { theme } from '@/src/constants/theme';

const salesTheme = theme.roles.sales;
const PINK = salesTheme.primary;
const INK = theme.colors.textPrimary;
const SOFT_PLACEHOLDER = '#8FA1BC';

type ProductValue = typeof productTypeOptions[number]['value'];
type PaymentValue = typeof paymentMethodOptions[number]['value'];
type Priority = 'low' | 'normal' | 'high' | 'urgent';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';
type SubmitMessage = { type: 'error' | 'success'; text: string } | null;
type PrinterLineItem = { product: ProductValue; quantity: number };
const PRINTER_STEP_ICONS: Record<'Customer' | 'Product' | 'Payment', AppIconName> = {
  Customer: 'User',
  Product: 'Package',
  Payment: 'Wallet',
};
const PRINTER_PAYMENT_METHODS: { label: string; value: PaymentValue; icon: AppIconName }[] = [
  { label: 'Cash', value: 'later_manual', icon: 'CircleDollarSign' },
  { label: 'Bank', value: 'online', icon: 'MapPin' },
  { label: 'Card', value: 'deposit', icon: 'CreditCard' },
];

type ArtworkAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

type ProductCardTheme = {
  colors: readonly [string, string];
  accent: string;
  text: string;
  muted: string;
};

const PRODUCT_CARD_THEMES: Record<ProductValue, ProductCardTheme> = {
  wood_card: {
    colors: ['#3B2416', '#A46B38'],
    accent: '#F2C37B',
    text: '#FFF7E8',
    muted: 'rgba(255,247,232,0.72)',
  },
  metal_card: {
    colors: ['#111827', '#64748B'],
    accent: '#DDE6EF',
    text: '#F8FAFC',
    muted: 'rgba(248,250,252,0.72)',
  },
  pvc_card: {
    colors: ['#0F766E', salesTheme.primary],
    accent: '#B8FFF2',
    text: '#FFFFFF',
    muted: 'rgba(255,255,255,0.76)',
  },
};

const PRIORITY_OPTIONS: { label: string; value: Priority; color: string }[] = [
  { label: 'Low', value: 'low', color: '#6E8A95' },
  { label: 'Normal', value: 'normal', color: '#00A4A6' },
  { label: 'High', value: 'high', color: '#FFB343' },
  { label: 'Urgent', value: 'urgent', color: '#E74C3C' },
];

const PAYMENT_STATUS_OPTIONS: { label: string; value: PaymentStatus; color: string }[] = [
  { label: 'Unpaid', value: 'unpaid', color: '#E74C3C' },
  { label: 'Partial', value: 'partial', color: '#FFB343' },
  { label: 'Paid', value: 'paid', color: '#000000' },
];

function SalesPremiumFormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={premiumFormStyles.section}>
      <AppText style={premiumFormStyles.sectionLabel}>{title}</AppText>
      <View style={premiumFormStyles.card}>{children}</View>
    </View>
  );
}

const premiumFormStyles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: salesUi.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: salesUi.radiusLg,
    backgroundColor: salesUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: theme.spacing.sm + 2,
    ...salesUi.shadow,
  },
});

function PillPicker<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={pp.row}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[
            pp.pill,
            value === opt.value && {
              backgroundColor: opt.color ?? PINK,
            },
          ]}
          onPress={() => onChange(opt.value)}
        >
          <AppText style={[pp.text, value === opt.value && { color: '#fff' }]}>{opt.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const pp = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    ...theme.shadows.control,
  },
  text: { fontSize: 13, fontWeight: '600', color: '#555' },
});

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={f.wrap}>
      <AppText style={f.label}>
        {label}
        {required ? <AppText style={f.req}> *</AppText> : null}
      </AppText>
      {children}
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  req: { color: '#E74C3C' },
});

function ToggleControl({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={[styles.toggleTrack, value && styles.toggleTrackActive]}
    >
      <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
    </Pressable>
  );
}

const inputStyle: object = {
  width: '100%',
  minWidth: 0,
  backgroundColor: '#fff',
  borderRadius: 12,
  paddingHorizontal: 14,
  height: 48,
  fontSize: 15,
  color: INK,
};

const multilineStyle: object = {
  ...inputStyle,
  minHeight: 80,
  height: undefined,
  paddingTop: 12,
  paddingBottom: 12,
  textAlignVertical: 'top',
};

function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function moneyValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([work, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function formatProductLabel(value: string) {
  const option = productTypeOptions.find((item) => item.value === value);
  return option?.label ?? value.replace(/_/g, ' ');
}

function ProductBankCard({
  option,
  selected,
  cardWidthStyle,
  onPress,
}: {
  option: typeof productTypeOptions[number];
  selected: boolean;
  cardWidthStyle: object;
  onPress: () => void;
}) {
  const palette = PRODUCT_CARD_THEMES[option.value];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.productCardShell, cardWidthStyle, selected && styles.productCardShellActive]}
    >
      <LinearGradient
        colors={palette.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bankCard}
      >
        <View style={styles.bankCardTop}>
          <View style={[styles.chip, { borderColor: palette.accent }]}>
            <View style={[styles.chipLine, { backgroundColor: palette.accent }]} />
            <View style={[styles.chipLine, { backgroundColor: palette.accent }]} />
          </View>
          <AppIcon name="Nfc" size={20} color={palette.accent} />
        </View>
        <View style={styles.bankCardMid}>
          <AppText style={[styles.bankCardBrand, { color: palette.muted }]}>BIOCLOUD CARD</AppText>
          <AppText style={[styles.bankCardName, { color: palette.text }]}>{option.label}</AppText>
        </View>
        <View style={styles.bankCardBottom}>
          <View>
            <AppText style={[styles.bankCardMeta, { color: palette.muted }]}>NFC + QR READY</AppText>
            <AppText style={[styles.bankCardMeta, { color: palette.muted }]}>CUSTOM ARTWORK</AppText>
          </View>
          <AppText style={[styles.bankCardPrice, { color: palette.text }]}>${option.price}</AppText>
        </View>
      </LinearGradient>
      {selected ? (
        <View style={styles.selectedCheck}>
          <AppIcon name="ShieldCheck" size={14} color="#fff" />
        </View>
      ) : null}
    </Pressable>
  );
}

function CardPreview({
  product,
  customerName,
  company,
  cardDesign,
  artwork,
  nfcWrite,
  qrPrinted,
}: {
  product: ProductValue;
  customerName: string;
  company: string;
  cardDesign: CardDesign;
  artwork: ArtworkAsset | null;
  nfcWrite: boolean;
  qrPrinted: boolean;
}) {
  const palette = PRODUCT_CARD_THEMES[product];
  const designLabel = cardDesignOptions.find((item) => item.value === cardDesign)?.label ?? 'Classic Black';

  return (
    <View style={styles.previewWrap}>
      <View style={styles.previewHeader}>
        <View>
          <AppText style={styles.previewTitle}>Card preview</AppText>
          <AppText style={styles.previewSubtitle}>{formatProductLabel(product)} / {designLabel}</AppText>
        </View>
        <View style={styles.previewBadge}>
          <AppIcon name="CreditCard" size={14} color={PINK} />
          <AppText style={styles.previewBadgeText}>Bank card fit</AppText>
        </View>
      </View>

      <LinearGradient
        colors={palette.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.previewCard}
      >
        {artwork?.uri ? (
          <Image source={{ uri: artwork.uri }} style={styles.previewImage} resizeMode="cover" />
        ) : null}
        <View style={styles.previewOverlay} />
        <View style={styles.previewTop}>
          <View style={[styles.previewChip, { borderColor: palette.accent }]}>
            <View style={[styles.previewChipLine, { backgroundColor: palette.accent }]} />
            <View style={[styles.previewChipLine, { backgroundColor: palette.accent }]} />
          </View>
          <View style={styles.previewFeatureRow}>
            {qrPrinted ? (
              <View style={styles.previewFeature}>
                <AppIcon name="QrCode" size={13} color="#fff" />
              </View>
            ) : null}
            {nfcWrite ? (
              <View style={styles.previewFeature}>
                <AppIcon name="Nfc" size={13} color="#fff" />
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.previewBottom}>
          <View style={styles.previewIdentity}>
            <AppText style={styles.previewName} numberOfLines={1}>
              {(customerName.trim() || 'Customer Name').toUpperCase()}
            </AppText>
            <AppText style={styles.previewCompany} numberOfLines={1}>
              {company.trim() || 'Company / Brand'}
            </AppText>
          </View>
          <AppText style={styles.previewNetwork}>NFC</AppText>
        </View>
      </LinearGradient>
    </View>
  );
}

export function NewOrderScreen() {
  const { user } = useAuth();
  const { requireAccount } = useRequireAccount();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const isPrinterFlow = user?.role === 'printer' || user?.role === 'printer_operator';
  const isNarrow = width < 460;
  const productCardWidthStyle = width >= 520 ? styles.productCardWide : styles.productCardNarrow;

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const [product, setProduct] = useState<ProductValue>('wood_card');
  const [quantity, setQuantity] = useState('1');
  const [printerItems, setPrinterItems] = useState<PrinterLineItem[]>([{ product: 'wood_card', quantity: 1 }]);
  const [priority, setPriority] = useState<Priority>('normal');
  const [cardDesign, setCardDesign] = useState<CardDesign>('classic_black');
  const [qrPrinted, setQrPrinted] = useState(false);
  const [nfcWrite, setNfcWrite] = useState(true);
  const [nfcTargetUrl, setNfcTargetUrl] = useState('');
  const [customArtwork, setCustomArtwork] = useState<ArtworkAsset | null>(null);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentValue>('online');
  const [deposit, setDeposit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const selectedProduct = productTypeOptions.find((p) => p.value === product)!;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const printerTotalQty = printerItems.reduce((sum, item) => sum + item.quantity, 0);
  const effectiveQty = isPrinterFlow ? Math.max(1, printerTotalQty) : qty;
  const effectiveProduct: ProductValue = isPrinterFlow ? (printerItems[0]?.product ?? product) : product;
  const total = isPrinterFlow
    ? printerItems.reduce((sum, item) => {
        const p = productTypeOptions.find((opt) => opt.value === item.product);
        return sum + (p ? p.price * item.quantity : 0);
      }, 0)
    : selectedProduct.price * qty;
  const printerItemsLabel = isPrinterFlow
    ? printerItems
        .map((item) => {
          const p = productTypeOptions.find((opt) => opt.value === item.product);
          return `${p?.label ?? item.product} x ${item.quantity}`;
        })
        .join(', ')
    : `${selectedProduct.label} x ${qty}`;

  function addAnotherProduct() {
    const addQty = Math.max(1, parseInt(quantity, 10) || 1);
    setPrinterItems((prev) => {
      const existing = prev.find((item) => item.product === product);
      if (existing) {
        return prev.map((item) =>
          item.product === product ? { ...item, quantity: item.quantity + addQty } : item
        );
      }
      return [...prev, { product, quantity: addQty }];
    });
    setQuantity('1');
  }

  async function pickArtwork() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach custom card artwork.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setCustomArtwork({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    });
    setCardDesign('custom');
  }

  function validate() {
    if (step === 1) {
      if (!isPrinterFlow && !customerName.trim()) {
        Alert.alert('Required', 'Customer name is required.');
        return false;
      }
      if (!phone.trim() && !telegram.trim()) {
        Alert.alert('Required', 'Add at least one contact: phone or Telegram.');
        return false;
      }
    }

    if (step === 2) {
      if (!isPrinterFlow && qty < 1) {
        Alert.alert('Invalid', 'Quantity must be at least 1.');
        return false;
      }
      if (isPrinterFlow && printerItems.length === 0) {
        Alert.alert('Required', 'Add at least one product.');
        return false;
      }
      if (nfcWrite && !isValidUrl(nfcTargetUrl)) {
        Alert.alert('Invalid NFC URL', 'Enter a valid http or https URL, or leave it blank to use the generated profile URL.');
        return false;
      }
    }

    if (step === 3) {
      const depositAmount = moneyValue(deposit);
      if (depositAmount === null || (depositAmount !== undefined && depositAmount < 0)) {
        Alert.alert('Invalid deposit', 'Deposit amount must be a valid number.');
        return false;
      }
    }

    return true;
  }

  async function handleSubmit() {
    if (saving || createdOrderId) return;
    if (!requireAccount(undefined, { message: 'Create an account to submit orders and save customer records.' })) {
      return;
    }
    if (!user) return;
    if (!validate()) return;

    setSaving(true);
    setSubmitMessage(null);
    setCreatedOrderId(null);
    try {
      let artworkUpload: Awaited<ReturnType<typeof uploadOrderArtwork>> | undefined;
      if (customArtwork) {
        artworkUpload = await withTimeout(
          uploadOrderArtwork({
            uri: customArtwork.uri,
            fileName: customArtwork.fileName,
            mimeType: customArtwork.mimeType,
            salesUserId: user.id,
          }),
          20000,
          'Artwork upload is taking too long. Check your connection and try again.'
        );
      }

      const depositAmount = moneyValue(deposit);
      const pricing = buildOrderPricingFields({
        productType: 'physical_nfc',
        quantity: effectiveQty,
        currency: 'USD',
        material: effectiveProduct as ProductType,
      });
      const orderId = await withTimeout(
        createOrder({
          customerName: customerName.trim() || company.trim() || phone.trim() || 'Customer',
          phone: phone.trim(),
          telegram: telegram.trim() || undefined,
          email: email.trim() || undefined,
          company: company.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
          productType: effectiveProduct,
          quantity: effectiveQty,
          cardDesign,
          designArtworkUrl: artworkUpload?.url,
          designArtworkPath: artworkUpload?.path,
          designArtworkFileName: customArtwork?.fileName || undefined,
          nfcEnabled: nfcWrite,
          nfcTargetUrl: nfcWrite ? nfcTargetUrl.trim() || undefined : undefined,
          qrPrinted,
          depositAmount: depositAmount ?? undefined,
          dueDate: dueDate.trim() || undefined,
          paymentStatus,
          paymentMethod,
          amount: pricing.amount,
          currency: pricing.currency,
          fulfillment: 'physical',
          salesCommission: pricing.salesCommission,
          salesCommissionCurrency: pricing.salesCommissionCurrency,
          priority: priority === 'urgent' ? 'urgent' : 'standard',
          notes: notes.trim() || undefined,
          assignedSalesman: user.id,
          createdBy: user.id,
        }),
        20000,
        'Order creation is taking too long. Check Firebase connection/rules and try again.'
      );

      setSubmitMessage({ type: 'success', text: 'Order created and sent to the printer queue.' });
      setCreatedOrderId(orderId);
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setSubmitMessage({ type: 'error', text: message });
      setSaving(false);
    } finally {
      setSaving(false);
    }
  }

  function viewCreatedOrder() {
    if (!createdOrderId) return;
    router.replace({ pathname: '/order-detail/[orderId]', params: { orderId: createdOrderId } });
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isPrinterFlow ? colors.background : salesUi.bg }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.premiumHeaderWrap}>
        <View style={styles.premiumHeaderTop}>
          <Pressable
            style={styles.premiumBackBtn}
            onPress={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
            hitSlop={8}
          >
            <AppIcon name="ChevronLeft" size={22} color="#475569" />
          </Pressable>
          <View style={styles.premiumHeaderTitleWrap}>
            <AppText style={styles.premiumStepText}>{`Step ${step} of ${totalSteps}`}</AppText>
            <AppText style={styles.premiumTitle}>New Order</AppText>
          </View>
          <View style={styles.premiumBackPlaceholder} />
        </View>

        <View style={styles.premiumSegmentWrap}>
          {['Customer', 'Product', 'Payment'].map((label, i) => {
            const active = i + 1 === step;
            return (
              <View key={label} style={[styles.premiumSegmentItem, active && styles.premiumSegmentItemActive]}>
                <AppIcon
                  name={PRINTER_STEP_ICONS[label as keyof typeof PRINTER_STEP_ICONS]}
                  size={13}
                  color={active ? '#FFFFFF' : '#8FA1BC'}
                />
                <AppText style={[styles.premiumSegmentText, active && styles.premiumSegmentTextActive]}>
                  {label}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, styles.scrollPremium]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        {createdOrderId ? (
          <>
            <CardPreview
              product={product}
              customerName={customerName}
              company={company}
              cardDesign={cardDesign}
              artwork={customArtwork}
              nfcWrite={nfcWrite}
              qrPrinted={qrPrinted}
            />
            <View style={styles.createdInfoCard}>
              <View style={styles.createdInfoHeader}>
                <AppIcon name="ShieldCheck" size={20} color={theme.status.success} />
                <View style={styles.createdInfoCopy}>
                  <AppText style={styles.createdInfoTitle}>Order ready for printing</AppText>
                  <AppText style={styles.createdInfoText}>
                    #{createdOrderId.slice(0, 8).toUpperCase()} is in the printer queue.
                  </AppText>
                </View>
              </View>
              {[
                ['Customer', customerName || 'Not set'],
                ['Contact', phone || telegram || 'Not set'],
                ['Product', printerItemsLabel],
                ['Design', cardDesignOptions.find((item) => item.value === cardDesign)?.label ?? cardDesign],
                ['Payment', paymentStatus],
                ['Total', `$${total}`],
              ].map(([k, v]) => (
                <View key={k} style={styles.summaryRow}>
                  <AppText style={styles.summaryKey}>{k}</AppText>
                  <AppText style={[styles.summaryVal, k === 'Total' && styles.summaryTotal]} numberOfLines={2}>
                    {v}
                  </AppText>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {step === 1 && !createdOrderId && (
          isPrinterFlow ? (
            <View style={styles.printerCustomerCard}>
              <View style={styles.printerCustomerRow}>
                <AppIcon name="Phone" size={17} color="#C4CFDE" />
                <TextInput
                  style={styles.printerCustomerInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+855 12 345 678"
                  placeholderTextColor={SOFT_PLACEHOLDER}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.printerCustomerRow}>
                <AppIcon name="Share" size={17} color="#C4CFDE" />
                <TextInput
                  style={styles.printerCustomerInput}
                  value={telegram}
                  onChangeText={setTelegram}
                  placeholder="@telegram"
                  placeholderTextColor={SOFT_PLACEHOLDER}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.printerCustomerRow}>
                <AppIcon name="Mail" size={17} color="#C4CFDE" />
                <TextInput
                  style={styles.printerCustomerInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="client@example.com"
                  placeholderTextColor={SOFT_PLACEHOLDER}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.printerCustomerRow}>
                <AppIcon name="MapPin" size={17} color="#C4CFDE" />
                <TextInput
                  style={styles.printerCustomerInput}
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Company name"
                  placeholderTextColor={SOFT_PLACEHOLDER}
                />
              </View>
              <View style={styles.printerCustomerRowLast}>
                <AppIcon name="UserRound" size={17} color="#C4CFDE" />
                <TextInput
                  style={styles.printerCustomerInput}
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  placeholder="Job title"
                  placeholderTextColor={SOFT_PLACEHOLDER}
                />
              </View>
            </View>
          ) : (
            <View style={premiumFormStyles.section}>
              <AppText style={premiumFormStyles.sectionLabel}>Customer Information</AppText>
              <View style={styles.premiumCustomerCard}>
                <View style={styles.premiumCustomerRow}>
                  <AppIcon name="User" size={17} color="#C4CFDE" />
                  <TextInput
                    style={styles.premiumCustomerInput}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Full name of client"
                    placeholderTextColor={SOFT_PLACEHOLDER}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.premiumCustomerRow}>
                  <AppIcon name="Phone" size={17} color="#C4CFDE" />
                  <TextInput
                    style={styles.premiumCustomerInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="012 345 678"
                    placeholderTextColor={SOFT_PLACEHOLDER}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.premiumCustomerRow}>
                  <AppIcon name="Share" size={17} color="#C4CFDE" />
                  <TextInput
                    style={styles.premiumCustomerInput}
                    value={telegram}
                    onChangeText={setTelegram}
                    placeholder="@username"
                    placeholderTextColor={SOFT_PLACEHOLDER}
                    autoCapitalize="none"
                  />
                </View>
                <AppText style={styles.premiumHint}>At least one contact is required.</AppText>
                <View style={styles.premiumCustomerRow}>
                  <AppIcon name="Mail" size={17} color="#C4CFDE" />
                  <TextInput
                    style={styles.premiumCustomerInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="client@example.com"
                    placeholderTextColor={SOFT_PLACEHOLDER}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.premiumCustomerRow}>
                  <AppIcon name="MapPin" size={17} color="#C4CFDE" />
                  <TextInput
                    style={styles.premiumCustomerInput}
                    value={company}
                    onChangeText={setCompany}
                    placeholder="Company name"
                    placeholderTextColor={SOFT_PLACEHOLDER}
                  />
                </View>
                <View style={styles.premiumCustomerRowLast}>
                  <AppIcon name="UserRound" size={17} color="#C4CFDE" />
                  <TextInput
                    style={styles.premiumCustomerInput}
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    placeholder="Job title"
                    placeholderTextColor={SOFT_PLACEHOLDER}
                  />
                </View>
              </View>
            </View>
          )
        )}

        {step === 2 && !createdOrderId && (
          isPrinterFlow ? (
            <View style={styles.printerPanelStack}>
              <View style={styles.printerProductCard}>
                <View style={styles.printerProductPickerRow}>
                  {productTypeOptions.map((opt) => {
                    const active = product === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        style={[styles.printerProductPick, active && styles.printerProductPickActive]}
                        onPress={() => setProduct(opt.value)}
                      >
                        <AppText style={[styles.printerProductPickText, active && styles.printerProductPickTextActive]}>
                          {opt.label.replace(' Card', '')}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.printerProductHead}>
                  <View style={styles.printerProductIcon}>
                    <AppIcon name="CreditCard" size={24} color="#2563EB" />
                  </View>
                  <View style={styles.printerProductInfo}>
                    <AppText style={styles.printerProductTitle}>{selectedProduct.label}</AppText>
                    <AppText style={styles.printerProductSub}>
                      {cardDesignOptions.find((item) => item.value === cardDesign)?.label ?? 'Design'}
                    </AppText>
                  </View>
                  <AppText style={styles.printerProductPrice}>${selectedProduct.price}</AppText>
                </View>

                <View style={styles.printerQtyBar}>
                  <View style={styles.printerQtyLabelWrap}>
                    <AppIcon name="Package" size={14} color="#8FA1BC" />
                    <AppText style={styles.printerQtyLabel}>Qty</AppText>
                  </View>
                  <View style={styles.printerQtyControls}>
                    <Pressable
                      style={styles.printerQtyBtnSoft}
                      onPress={() => setQuantity((q) => String(Math.max(1, (parseInt(q, 10) || 1) - 1)))}
                    >
                      <AppText style={styles.printerQtyBtnSoftText}>-</AppText>
                    </Pressable>
                    <AppText style={styles.printerQtyValue}>{qty}</AppText>
                    <Pressable
                      style={styles.printerQtyBtnDark}
                      onPress={() => setQuantity((q) => String((parseInt(q, 10) || 1) + 1))}
                    >
                      <AppText style={styles.printerQtyBtnDarkText}>+</AppText>
                    </Pressable>
                  </View>
                </View>

                {printerItems.length > 0 ? (
                  <View style={styles.printerAddedList}>
                    {printerItems.map((item) => {
                      const p = productTypeOptions.find((opt) => opt.value === item.product);
                      return (
                        <View key={item.product} style={styles.printerAddedRow}>
                          <AppText style={styles.printerAddedText}>{p?.label ?? item.product}</AppText>
                          <AppText style={styles.printerAddedQty}>x{item.quantity}</AppText>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              <Pressable style={styles.printerAddProductBtn} onPress={addAnotherProduct}>
                <AppIcon name="Package" size={16} color="#2563EB" />
                <AppText style={styles.printerAddProductText}>Add another product</AppText>
              </Pressable>
            </View>
          ) : (
            <SalesPremiumFormSection title="Product Details">
                <Field label="Product Type" required>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.productScroller}
                    snapToAlignment="start"
                    decelerationRate="fast"
                  >
                    {productTypeOptions.map((opt) => (
                      <ProductBankCard
                        key={opt.value}
                        option={opt}
                        selected={product === opt.value}
                        cardWidthStyle={productCardWidthStyle}
                        onPress={() => setProduct(opt.value)}
                      />
                    ))}
                  </ScrollView>
                </Field>

                <CardPreview
                  product={product}
                  customerName={customerName}
                  company={company}
                  cardDesign={cardDesign}
                  artwork={customArtwork}
                  nfcWrite={nfcWrite}
                  qrPrinted={qrPrinted}
                />

                <Field label="Card Design">
                  <PillPicker options={cardDesignOptions.map((o) => ({ ...o, color: PINK }))} value={cardDesign} onChange={setCardDesign} />
                </Field>

                <View style={styles.uploadBox}>
                  <View style={styles.uploadCopy}>
                    <View style={styles.uploadIcon}>
                      <AppIcon name="Image" size={18} color={PINK} />
                    </View>
                    <View style={styles.uploadTextWrap}>
                      <AppText style={styles.uploadTitle}>Custom artwork</AppText>
                      <AppText style={styles.uploadHint} numberOfLines={2}>
                        {customArtwork?.fileName || 'Upload the customer card face design.'}
                      </AppText>
                    </View>
                  </View>
                  <View style={styles.uploadActions}>
                    {customArtwork ? (
                      <Pressable style={styles.clearArtworkBtn} onPress={() => setCustomArtwork(null)}>
                        <AppText style={styles.clearArtworkText}>Clear</AppText>
                      </Pressable>
                    ) : null}
                    <Pressable style={styles.uploadBtn} onPress={pickArtwork}>
                      <AppIcon name="Upload" size={15} color="#fff" />
                      <AppText style={styles.uploadBtnText}>{customArtwork ? 'Replace' : 'Upload'}</AppText>
                    </Pressable>
                  </View>
                </View>

                <View style={[styles.row, isNarrow && styles.stackRow]}>
                  <View style={[styles.half, isNarrow && styles.full]}>
                    <Field label="Quantity" required>
                      <View style={styles.qtyRow}>
                        <Pressable
                          style={styles.qtyBtn}
                          onPress={() => setQuantity((q) => String(Math.max(1, (parseInt(q, 10) || 1) - 1)))}
                        >
                          <AppText style={styles.qtyBtnText}>-</AppText>
                        </Pressable>
                        <TextInput
                          style={styles.qtyInput}
                          value={quantity}
                          onChangeText={setQuantity}
                          keyboardType="number-pad"
                          textAlign="center"
                        />
                        <Pressable
                          style={styles.qtyBtn}
                          onPress={() => setQuantity((q) => String((parseInt(q, 10) || 1) + 1))}
                        >
                          <AppText style={styles.qtyBtnText}>+</AppText>
                        </Pressable>
                      </View>
                    </Field>
                  </View>
                  <View style={[styles.half, isNarrow && styles.full]}>
                    <Field label="Total">
                      <View style={styles.totalBox}>
                        <AppText style={styles.totalAmount}>${total}</AppText>
                      </View>
                    </Field>
                  </View>
                </View>

                <Field label="Priority" required>
                  <PillPicker options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
                </Field>

                <View style={[styles.toggleRow, isNarrow && styles.stackRow]}>
                  <View style={[styles.toggleItem, isNarrow && styles.full]}>
                    <AppIcon name="QrCode" size={18} color={PINK} />
                    <AppText style={styles.toggleLabel}>QR printed</AppText>
                    <ToggleControl value={qrPrinted} onChange={setQrPrinted} />
                  </View>
                  <View style={[styles.toggleItem, isNarrow && styles.full]}>
                    <AppIcon name="Nfc" size={18} color={PINK} />
                    <AppText style={styles.toggleLabel}>NFC write</AppText>
                    <ToggleControl value={nfcWrite} onChange={setNfcWrite} />
                  </View>
                </View>

                {nfcWrite ? (
                  <Field label="Custom NFC URL">
                    <TextInput
                      style={inputStyle}
                      value={nfcTargetUrl}
                      onChangeText={setNfcTargetUrl}
                      placeholder="Optional: https://example.com/profile"
                      placeholderTextColor={SOFT_PLACEHOLDER}
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </Field>
                ) : null}
            </SalesPremiumFormSection>
          )
        )}

        {step === 3 && !createdOrderId && (
          isPrinterFlow ? (
            <View style={styles.printerPanelStack}>
              <View style={styles.printerPaymentCard}>
                <View style={styles.printerPaymentRow}>
                  <AppText style={styles.printerPaymentLabel}>Subtotal</AppText>
                  <AppText style={styles.printerPaymentValue}>${total.toFixed(2)}</AppText>
                </View>
                <View style={styles.printerPaymentRow}>
                  <AppText style={styles.printerPaymentLabel}>Delivery</AppText>
                  <AppText style={styles.printerPaymentValue}>$0.00</AppText>
                </View>
                <View style={styles.printerDivider} />
                <View style={styles.printerPaymentRow}>
                  <AppText style={styles.printerTotalLabel}>Total</AppText>
                  <AppText style={styles.printerTotalValue}>${total.toFixed(2)}</AppText>
                </View>
              </View>

              <View style={styles.printerMethodWrap}>
                {PRINTER_PAYMENT_METHODS.map((method) => {
                  const active = paymentMethod === method.value;
                  return (
                    <Pressable
                      key={method.value}
                      style={[styles.printerMethodBtn, active && styles.printerMethodBtnActive]}
                      onPress={() => setPaymentMethod(method.value)}
                    >
                      <AppIcon
                        name={method.icon}
                        size={13}
                        color={active ? '#FFFFFF' : '#7A8799'}
                      />
                      {active ? <AppIcon name="BadgeCheck" size={12} color="#FFFFFF" /> : null}
                      <AppText style={[styles.printerMethodText, active && styles.printerMethodTextActive]}>
                        {method.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <SalesPremiumFormSection title="Payment & Delivery">
              <Field label="Payment Status" required>
                <PillPicker options={PAYMENT_STATUS_OPTIONS} value={paymentStatus} onChange={setPaymentStatus} />
              </Field>

              <Field label="Payment Method">
                <PillPicker
                  options={paymentMethodOptions.map((o) => ({ ...o, color: o.color }))}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                />
              </Field>

              <View style={[styles.row, isNarrow && styles.stackRow]}>
                <View style={[styles.half, isNarrow && styles.full]}>
                  <Field label="Deposit Amount">
                    <View style={styles.prefixInput}>
                      <AppText style={styles.prefix}>$</AppText>
                      <TextInput
                        style={[inputStyle, styles.inlineInput]}
                        value={deposit}
                        onChangeText={setDeposit}
                        placeholder="0.00"
                        placeholderTextColor={SOFT_PLACEHOLDER}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </Field>
                </View>
                <View style={[styles.half, isNarrow && styles.full]}>
                  <Field label="Due Date">
                    <TextInput
                      style={inputStyle}
                      value={dueDate}
                      onChangeText={setDueDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={SOFT_PLACEHOLDER}
                    />
                  </Field>
                </View>
              </View>

              <Field label="Delivery Address">
                <TextInput
                  style={multilineStyle}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  placeholder="Street, building, floor..."
                  placeholderTextColor={SOFT_PLACEHOLDER}
                  multiline
                  numberOfLines={2}
                />
              </Field>

              <Field label="Notes">
                <TextInput
                  style={multilineStyle}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Special instructions, finish requirements..."
                  placeholderTextColor={SOFT_PLACEHOLDER}
                  multiline
                  numberOfLines={3}
                />
              </Field>

              <View style={styles.summaryCard}>
                <AppText style={styles.summaryTitle}>Order Summary</AppText>
                {[
                  ['Customer', customerName || 'Not set'],
                  ['Contact', phone || telegram || 'Not set'],
                  ['Product', printerItemsLabel],
                  ['Design', cardDesignOptions.find((item) => item.value === cardDesign)?.label ?? cardDesign],
                  ['NFC', nfcWrite ? (nfcTargetUrl.trim() ? 'Custom URL' : 'Generated profile URL') : 'Disabled'],
                  ['Payment', paymentStatus],
                  ['Total', `$${total}`],
                ].map(([k, v]) => (
                  <View key={k} style={styles.summaryRow}>
                    <AppText style={styles.summaryKey}>{k}</AppText>
                    <AppText style={[styles.summaryVal, k === 'Total' && styles.summaryTotal]} numberOfLines={2}>
                      {v}
                    </AppText>
                  </View>
                ))}
              </View>
            </SalesPremiumFormSection>
          )
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: isPrinterFlow ? colors.surface : salesUi.surface,
            borderTopColor: isPrinterFlow ? colors.border : salesUi.border,
          },
          isPrinterFlow && styles.footerPrinter,
        ]}
      >
        {submitMessage ? (
          <View
            style={[
              styles.submitMessage,
              submitMessage.type === 'error' ? styles.submitMessageError : styles.submitMessageSuccess,
            ]}
          >
            <AppText
              style={[
                styles.submitMessageText,
                submitMessage.type === 'error' ? styles.submitMessageErrorText : styles.submitMessageSuccessText,
              ]}
            >
              {submitMessage.text}
            </AppText>
          </View>
        ) : null}
        {createdOrderId ? (
          <IosFormActionFooter
            embedded
            stacked={isNarrow}
            secondaryLabel="Go Back"
            secondaryIcon="ChevronLeft"
            onSecondaryPress={() => router.back()}
            primaryLabel="View Order"
            primaryIcon="ExternalLink"
            onPrimaryPress={viewCreatedOrder}
          />
        ) : isPrinterFlow ? (
          <View style={styles.printerActionsRow}>
            <Pressable
              style={({ pressed }) => [styles.printerActionSecondary, pressed && styles.printerActionPressed]}
              onPress={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
            >
              <AppText style={styles.printerActionSecondaryText}>{step > 1 ? 'Back' : 'Cancel'}</AppText>
            </Pressable>
            {step < totalSteps ? (
              <Pressable
                style={({ pressed }) => [styles.printerActionPrimary, pressed && styles.printerActionPressed]}
                onPress={() => {
                  if (validate()) setStep((s) => s + 1);
                }}
              >
                <AppText style={styles.printerActionPrimaryText}>Continue {'>'}</AppText>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.printerActionPrimary,
                  saving && styles.printerActionPrimaryDisabled,
                  pressed && styles.printerActionPressed,
                ]}
                onPress={handleSubmit}
                disabled={saving}
              >
                <AppText style={styles.printerActionPrimaryText}>{saving ? 'Submitting...' : 'Create Order'}</AppText>
              </Pressable>
            )}
          </View>
        ) : step < totalSteps ? (
          <IosFormActionFooter
            embedded
            stacked={isNarrow}
            secondaryLabel={step > 1 ? 'Back' : 'Cancel'}
            secondaryIcon={step > 1 ? 'ChevronLeft' : 'X'}
            onSecondaryPress={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
            primaryLabel="Continue"
            primaryIcon="ChevronRight"
            onPrimaryPress={() => {
              if (validate()) setStep((s) => s + 1);
            }}
          />
        ) : (
          <IosFormActionFooter
            embedded
            stacked={isNarrow}
            secondaryLabel="Back"
            secondaryIcon="ChevronLeft"
            onSecondaryPress={() => setStep((s) => Math.max(1, s - 1))}
            primaryLabel={saving ? 'Submitting...' : 'Submit Order'}
            onPrimaryPress={handleSubmit}
            loading={saving}
            disabled={saving}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  premiumHeaderWrap: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  premiumHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumBackBtn: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E9EF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  premiumBackPlaceholder: {
    width: 48,
  },
  premiumHeaderTitleWrap: {
    alignItems: 'center',
    gap: 1,
  },
  premiumStepText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9AA4B2',
  },
  premiumTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.7,
  },
  premiumSegmentWrap: {
    height: 48,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E9EF',
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  premiumSegmentItem: {
    flex: 1,
    height: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  premiumSegmentItemActive: {
    backgroundColor: '#0F172A',
  },
  premiumSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  premiumSegmentTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    paddingBottom: 120,
    gap: theme.spacing.md,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  scrollPremium: {
    paddingHorizontal: 18,
    paddingTop: 6,
    gap: 12,
  },
  premiumCustomerCard: {
    borderRadius: salesUi.radiusLg,
    backgroundColor: salesUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    overflow: 'hidden',
    ...salesUi.shadow,
  },
  premiumCustomerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7EBF1',
    paddingHorizontal: 18,
  },
  premiumCustomerRowLast: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
  },
  premiumCustomerInput: {
    fontSize: 15,
    color: '#4A5D79',
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
    padding: 0,
  },
  premiumHint: {
    fontSize: 11,
    color: salesUi.accent,
    fontWeight: '600',
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7EBF1',
  },
  printerCustomerCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9EDF3',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  printerCustomerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7EBF1',
    paddingHorizontal: 18,
  },
  printerCustomerRowLast: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  printerCustomerInput: {
    fontSize: 15,
    color: '#4A5D79',
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
    padding: 0,
  },
  fields: { gap: 14 },
  row: { flexDirection: 'column', gap: 10 },
  stackRow: { flexDirection: 'column' },
  half: { width: '100%', minWidth: 0 },
  full: { width: '100%' },
  hint: { fontSize: 11, color: PINK, marginTop: -8, fontWeight: '600' },
  productScroller: {
    gap: 10,
    paddingRight: theme.spacing.md,
  },
  productCardShell: {
    position: 'relative',
    borderRadius: 16,
    padding: 2,
    backgroundColor: 'transparent',
  },
  productCardNarrow: { width: 274 },
  productCardWide: { width: 310 },
  productCardShellActive: {
    backgroundColor: PINK,
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  },
  bankCard: {
    aspectRatio: 1.586,
    borderRadius: 14,
    padding: 14,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  bankCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: {
    width: 34,
    height: 25,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 5,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chipLine: { height: 1, opacity: 0.85 },
  bankCardMid: { gap: 4 },
  bankCardBrand: { fontSize: 9, fontWeight: '800', letterSpacing: 0 },
  bankCardName: { fontSize: 16, lineHeight: 20, fontWeight: '800' },
  bankCardBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  bankCardMeta: { fontSize: 8.5, lineHeight: 12, fontWeight: '800', letterSpacing: 0 },
  bankCardPrice: { fontSize: 20, lineHeight: 24, fontWeight: '800' },
  selectedCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerPanelStack: {
    gap: 12,
  },
  printerProductCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9EDF3',
    padding: 14,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  printerProductPickerRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F8F9FC',
    borderRadius: 14,
    padding: 4,
  },
  printerProductPick: {
    flex: 1,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerProductPickActive: {
    backgroundColor: '#0F172A',
  },
  printerProductPickText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA1BC',
  },
  printerProductPickTextActive: {
    color: '#FFFFFF',
  },
  printerProductHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  printerProductIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerProductInfo: {
    flex: 1,
    minWidth: 0,
  },
  printerProductTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  printerProductSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#8FA1BC',
  },
  printerProductPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  printerQtyBar: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F8F9FC',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9EDF3',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  printerQtyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7A90',
  },
  printerQtyLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  printerQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  printerQtyBtnSoft: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DCE3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerQtyBtnSoftText: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
    color: '#64748B',
  },
  printerQtyBtnDark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerQtyBtnDarkText: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  printerQtyValue: {
    minWidth: 18,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  printerAddProductBtn: {
    height: 48,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9EDF3',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  printerAddProductText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2563EB',
  },
  printerAddedList: {
    marginTop: 2,
    borderRadius: 12,
    backgroundColor: '#F8F9FC',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9EDF3',
    overflow: 'hidden',
  },
  printerAddedRow: {
    minHeight: 32,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7EBF1',
  },
  printerAddedText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  printerAddedQty: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '800',
  },
  printerPaymentCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9EDF3',
    padding: 14,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
  printerPaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  printerPaymentLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  printerPaymentValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  printerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E7EBF1',
  },
  printerTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  printerTotalValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  printerMethodWrap: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9EDF3',
    padding: 6,
    flexDirection: 'row',
    gap: 6,
  },
  printerMethodBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8F9FC',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  printerMethodBtnActive: {
    backgroundColor: '#0F172A',
  },
  printerMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  printerMethodTextActive: {
    color: '#FFFFFF',
  },
  previewWrap: {
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusMd,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    ...salesUi.shadow,
  },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  previewTitle: { fontSize: 14, fontWeight: '800', color: INK },
  previewSubtitle: { fontSize: 11, color: theme.colors.textMuted, fontWeight: '600', marginTop: 2 },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  previewBadgeText: { color: PINK, fontSize: 10, fontWeight: '800' },
  previewCard: {
    aspectRatio: 1.586,
    borderRadius: 18,
    overflow: 'hidden',
    padding: 18,
    justifyContent: 'space-between',
  },
  previewImage: { ...StyleSheet.absoluteFillObject },
  previewOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  previewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewChip: {
    width: 46,
    height: 34,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 7,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  previewChipLine: { height: 1.2, opacity: 0.9 },
  previewFeatureRow: { flexDirection: 'row', gap: 6 },
  previewFeature: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 },
  previewIdentity: { flex: 1 },
  previewName: { color: '#fff', fontSize: 17, lineHeight: 22, fontWeight: '800' },
  previewCompany: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700', marginTop: 2 },
  previewNetwork: { color: '#fff', fontSize: 18, fontWeight: '900' },
  uploadBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    gap: 12,
    ...theme.shadows.control,
  },
  uploadCopy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTextWrap: { flex: 1, gap: 2 },
  uploadTitle: { fontSize: 14, fontWeight: '800', color: INK },
  uploadHint: { fontSize: 12, color: theme.colors.textMuted, lineHeight: 17 },
  uploadActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' },
  uploadBtn: {
    minHeight: 38,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: PINK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  clearArtworkBtn: {
    minHeight: 38,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.control,
  },
  clearArtworkText: { color: PINK, fontSize: 13, fontWeight: '800' },
  qtyRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 21,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 24 },
  qtyInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 48,
    fontSize: 18,
    fontWeight: '700',
    color: INK,
  },
  totalBox: {
    backgroundColor: salesTheme.background,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalAmount: { fontSize: 20, fontWeight: '700', color: PINK },
  toggleRow: { flexDirection: 'column', gap: 12 },
  toggleTrack: {
    width: 50,
    height: 30,
    flexShrink: 0,
    borderRadius: 15,
    padding: 3,
    backgroundColor: '#D8CDD4',
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: PINK,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  toggleItem: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    width: '100%',
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: salesTheme.background,
    borderRadius: 12,
    padding: 12,
  },
  toggleLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: '#555' },
  prefixInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingLeft: 12,
    height: 48,
  },
  prefix: { fontSize: 16, fontWeight: '700', color: '#555' },
  inlineInput: { flex: 1, borderWidth: 0, backgroundColor: 'transparent' },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: salesUi.radiusSm,
    padding: 14,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: INK, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryKey: { fontSize: 12, color: '#888', flexShrink: 0 },
  summaryVal: { flex: 1, fontSize: 12, fontWeight: '600', color: INK, textAlign: 'right' },
  summaryTotal: { color: PINK, fontWeight: '800' },
  createdInfoCard: {
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusMd,
    padding: 16,
    gap: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    ...salesUi.shadow,
  },
  createdInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 4,
  },
  createdInfoCopy: {
    flex: 1,
    minWidth: 0,
  },
  createdInfoTitle: {
    color: INK,
    fontSize: 15,
    fontWeight: '800',
  },
  createdInfoText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: iosDesign.spacing.md,
    paddingTop: iosDesign.spacing.sm + 2,
    paddingBottom: iosDesign.spacing.lg,
    ...theme.shadows.control,
    shadowOffset: { width: 0, height: -4 },
  },
  footerPrinter: {
    borderTopWidth: 0,
    shadowColor: 'transparent',
    elevation: 0,
    paddingTop: 8,
    paddingBottom: 16,
  },
  printerActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  printerActionSecondary: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DCE3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  printerActionSecondaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  printerActionPrimary: {
    flex: 1.4,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#32D74B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#32D74B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 3,
  },
  printerActionPrimaryDisabled: {
    opacity: 0.65,
  },
  printerActionPrimaryText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  printerActionPressed: {
    opacity: 0.85,
  },
  submitMessage: {
    width: '92%',
    maxWidth: 720,
    alignSelf: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  submitMessageError: {
    backgroundColor: '#FFE8E6',
    borderColor: '#F5B9B2',
  },
  submitMessageSuccess: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  submitMessageText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  submitMessageErrorText: {
    color: '#C0392B',
  },
  submitMessageSuccessText: {
    color: '#167B51',
  },
});
