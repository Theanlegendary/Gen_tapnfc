import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { AppInput } from '@/src/components/AppInput';
import { AppText } from '@/src/components/AppText';
import { CardProductPrice } from '@/src/components/CardProductPrice';
import { CambodiaPaymentSelector } from '@/src/components/CambodiaPaymentSelector';
import {
  CARD_PRODUCTS,
  formatDualPrice,
  getEcardPriceUsd,
  getPhysicalPriceUsd,
  type OrderCurrency,
} from '@/src/constants/cardProducts';
import type { CambodiaPaymentMethodId } from '@/src/constants/cambodiaPayments';
import { appRoutes } from '@/src/constants/navigation';
import { GUEST_DEMO_ORDER_ID } from '@/src/constants/guestDemo';
import type { ProductType } from '@/src/constants/options';
import { iosDesign } from '@/src/design-system/ios';
import {
  GuestDemoPill,
  GuestHintBanner,
  GuestSurfaceCard,
  guestUi,
} from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { useRequireAccount } from '@/src/providers/GuestGateProvider';
import { confirmCambodiaPayment } from '@/src/services/cambodiaPaymentService';
import {
  loadGuestCardDraft,
  loadGuestCheckoutDraft,
  saveGuestCheckoutDraft,
  type GuestCardChoice,
} from '@/src/services/guestDraftService';
import { amountInCurrency } from '@/src/constants/cardProducts';
import { buildOrderPricingFields } from '@/src/utils/orderPricing';

const STEPS = 4;

export function GuestCheckoutScreen() {
  const { user } = useAuth();
  const { requireAccount } = useRequireAccount();
  const [step, setStep] = useState(1);
  const [cardChoice, setCardChoice] = useState<GuestCardChoice>('ecard');
  const [material, setMaterial] = useState<ProductType>('pvc_card');
  const [quantity, setQuantity] = useState('1');
  const [currency, setCurrency] = useState<OrderCurrency>('KHR');
  const [paymentMethod, setPaymentMethod] = useState<CambodiaPaymentMethodId | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [completed, setCompleted] = useState(false);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);

  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const unitUsd = cardChoice === 'ecard' ? getEcardPriceUsd() : getPhysicalPriceUsd(material);
  const totalUsd = unitUsd * qty;
  const pricing = buildOrderPricingFields({
    productType: cardChoice === 'ecard' ? 'ecard' : 'physical_nfc',
    quantity: qty,
    currency,
    material: cardChoice === 'physical' ? material : undefined,
  });

  const hydrate = useCallback(async () => {
    const [cardDraft, checkoutDraft] = await Promise.all([loadGuestCardDraft(), loadGuestCheckoutDraft()]);
    if (cardDraft) {
      setDisplayName(cardDraft.displayName || user?.displayName || '');
      setMaterial(cardDraft.product);
      if (cardDraft.phone) setPhone(cardDraft.phone);
    }
    if (checkoutDraft) {
      setCardChoice(checkoutDraft.cardChoice ?? 'ecard');
      setMaterial(checkoutDraft.product);
      setQuantity(String(checkoutDraft.quantity));
      setDisplayName(checkoutDraft.displayName);
      setPhone(checkoutDraft.phone);
      setCurrency(checkoutDraft.currency ?? 'KHR');
      if (checkoutDraft.paymentMethod) {
        setPaymentMethod(checkoutDraft.paymentMethod as CambodiaPaymentMethodId);
      }
    }
  }, [user?.displayName]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  function nextStep() {
    if (step === 3 && !phone.trim()) {
      Alert.alert('Phone', 'Add a phone number for your receipt (+855…).');
      return;
    }
    if (step === 4 && !paymentMethod) {
      Alert.alert('Payment', 'Choose a payment method.');
      return;
    }
    if (step < STEPS) {
      setStep(step + 1);
      return;
    }
    void finishCheckout();
  }

  async function finishCheckout() {
    if (!paymentMethod) return;

    const pay = await confirmCambodiaPayment({
      methodId: paymentMethod,
      amount: pricing.amount ?? amountInCurrency(totalUsd, currency),
      currency,
      orderId: GUEST_DEMO_ORDER_ID,
    });

    await saveGuestCheckoutDraft({
      cardChoice,
      product: material,
      quantity: qty,
      displayName: displayName.trim(),
      phone: phone.trim(),
      currency,
      paymentMethod,
    });
    setPaymentRef(pay.reference);
    setCompleted(true);
  }

  const productLabel =
    cardChoice === 'ecard'
      ? CARD_PRODUCTS.ecard.labelEn
      : `${CARD_PRODUCTS.physical_nfc.labelEn} (${material.replace('_', ' ')})`;

  if (completed) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.successHero}>
            <View style={styles.successIcon}>
              <AppIcon name="ShieldCheck" size={40} color={guestUi.accent} />
            </View>
            <GuestDemoPill label="DEMO ORDER" />
            <AppText style={styles.successTitle}>Payment recorded</AppText>
            <AppText style={styles.successSub}>
              Demo order {GUEST_DEMO_ORDER_ID} — no real charge. Ref: {paymentRef}
            </AppText>
          </View>
          <GuestSurfaceCard title="Summary">
            <AppText style={styles.summaryLine}>{productLabel} × {qty}</AppText>
            <CardProductPrice priceUsd={totalUsd} size="lg" color={guestUi.accent} />
            <AppText style={styles.summaryMeta}>Method: {paymentMethod}</AppText>
          </GuestSurfaceCard>
          <AppButton label="Track demo order" onPress={() => router.replace(appRoutes.guestTrackOrder)} />
          <AppButton label="Back to home" variant="outline" onPress={() => router.replace('/(tabs)')} />
          <AppButton
            label="Create account to order for real"
            variant="ghost"
            onPress={() =>
              requireAccount(undefined, { message: 'Sign up to place real orders and sync across devices.' })
            }
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="Checkout" subtitle={`Step ${step} of ${STEPS} · Cambodia · Demo`} showBack />

        <GuestHintBanner>
          <AppText style={styles.hintBody}>
            E-card earns less per unit but ships instantly. Physical NFC costs more (print + ship). Prices in KHR and USD.
          </AppText>
        </GuestHintBanner>

        <View style={styles.stepRow}>
          {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => (
            <View key={n} style={[styles.stepDot, step >= n && styles.stepDotActive]} />
          ))}
        </View>

        {step === 1 ? (
          <GuestSurfaceCard title="Choose card type">
            {(['ecard', 'physical'] as const).map((opt) => {
              const key = opt === 'ecard' ? 'ecard' : 'physical_nfc';
              const product = CARD_PRODUCTS[key];
              const usd = opt === 'ecard' ? product.priceUsd : getPhysicalPriceUsd(material);
              const selected = cardChoice === opt;
              return (
                <Pressable
                  key={opt}
                  style={[styles.productRow, selected && styles.productRowActive]}
                  onPress={() => setCardChoice(opt)}
                >
                  <View style={styles.productCopy}>
                    <AppText style={styles.productTitle}>{product.labelEn}</AppText>
                    <AppText style={styles.productSubtitle}>{product.subtitleEn}</AppText>
                    <CardProductPrice priceUsd={usd} size="sm" color={guestUi.text} mutedColor={guestUi.muted} showPerUnit />
                  </View>
                  {selected ? <AppIcon name="ShieldCheck" size={20} color={guestUi.accent} /> : null}
                </Pressable>
              );
            })}
            <AppInput label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
            <View style={styles.currencyRow}>
              <AppText style={styles.currencyLabel}>Currency</AppText>
              {(['KHR', 'USD'] as const).map((c) => (
                <Pressable
                  key={c}
                  style={[styles.currencyPill, currency === c && styles.currencyPillActive]}
                  onPress={() => setCurrency(c)}
                >
                  <AppText style={[styles.currencyPillText, currency === c && styles.currencyPillTextActive]}>{c}</AppText>
                </Pressable>
              ))}
            </View>
          </GuestSurfaceCard>
        ) : null}

        {step === 2 ? (
          <GuestSurfaceCard title="Review total">
            <AppText style={styles.reviewProduct}>{productLabel} × {qty}</AppText>
            <CardProductPrice priceUsd={totalUsd} size="lg" color={guestUi.accent} />
            <AppText style={styles.reviewNote}>
              {currency === 'KHR'
                ? `Charge: ${(pricing.amount ?? 0).toLocaleString('en-US')} KHR`
                : `Charge: ${formatDualPrice(totalUsd)}`}
            </AppText>
          </GuestSurfaceCard>
        ) : null}

        {step === 3 ? (
          <GuestSurfaceCard title="Contact">
            <AppInput label="Full name" value={displayName} onChangeText={setDisplayName} />
            <AppInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+855 12 345 678"
            />
          </GuestSurfaceCard>
        ) : null}

        {step === 4 ? (
          <GuestSurfaceCard title="Payment">
            <CambodiaPaymentSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
              allowCashOnDelivery={cardChoice === 'physical'}
              accentColor={guestUi.accent}
              borderColor={guestUi.border}
              mutedColor={guestUi.muted}
              textColor={guestUi.text}
            />
            <AppText style={styles.gatewayNote}>
              Demo only — connect ABA / KHQR APIs in cambodiaPaymentService.ts for production.
            </AppText>
          </GuestSurfaceCard>
        ) : null}

        <View style={styles.footer}>
          {step > 1 ? (
            <AppButton label="Back" variant="outline" fullWidth={false} style={styles.half} onPress={() => setStep(step - 1)} />
          ) : null}
          <AppButton
            label={step === STEPS ? 'Confirm payment (demo)' : 'Continue'}
            fullWidth={step === 1}
            style={step > 1 ? styles.half : undefined}
            onPress={nextStep}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  scroll: {
    padding: iosDesign.spacing.md,
    gap: iosDesign.spacing.md,
    paddingBottom: iosDesign.spacing.xxl,
  },
  hintBody: { fontSize: 12, fontWeight: '500', color: guestUi.muted, lineHeight: 17 },
  stepRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  stepDot: { width: 24, height: 4, borderRadius: 2, backgroundColor: guestUi.border },
  stepDotActive: { backgroundColor: guestUi.accent },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: iosDesign.spacing.sm,
    borderRadius: guestUi.radiusSm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    marginBottom: iosDesign.spacing.sm,
  },
  productRowActive: { borderColor: guestUi.accent, backgroundColor: guestUi.accentSoft },
  productCopy: { flex: 1, gap: 2 },
  productTitle: { fontSize: 14, fontWeight: '800', color: guestUi.text },
  productSubtitle: { fontSize: 12, fontWeight: '500', color: guestUi.muted },
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  currencyLabel: { fontSize: 13, fontWeight: '700', color: guestUi.text },
  currencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: iosDesign.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
  },
  currencyPillActive: { backgroundColor: guestUi.accent, borderColor: guestUi.accent },
  currencyPillText: { fontSize: 12, fontWeight: '700', color: guestUi.muted },
  currencyPillTextActive: { color: '#fff' },
  reviewProduct: { fontSize: 15, fontWeight: '700', color: guestUi.text },
  reviewNote: { fontSize: 12, fontWeight: '500', color: guestUi.muted, marginTop: 8 },
  gatewayNote: { fontSize: 11, fontWeight: '500', color: guestUi.muted, marginTop: 12, lineHeight: 16 },
  footer: { flexDirection: 'row', gap: iosDesign.spacing.sm },
  half: { flex: 1 },
  successHero: { alignItems: 'center', gap: iosDesign.spacing.sm, paddingVertical: iosDesign.spacing.lg },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: guestUi.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: guestUi.text, textAlign: 'center' },
  successSub: { fontSize: 14, fontWeight: '500', color: guestUi.muted, textAlign: 'center', lineHeight: 20 },
  summaryLine: { fontSize: 14, fontWeight: '600', color: guestUi.text },
  summaryMeta: { fontSize: 12, fontWeight: '500', color: guestUi.muted, marginTop: 6 },
});
