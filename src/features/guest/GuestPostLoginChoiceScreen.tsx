import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { CardProductPrice } from '@/src/components/CardProductPrice';
import { CambodiaPaymentSelector } from '@/src/components/CambodiaPaymentSelector';
import {
  CARD_PRODUCTS,
  formatDualPrice,
  getPhysicalPriceUsd,
  type CardProductSku,
  type OrderCurrency,
} from '@/src/constants/cardProducts';
import type { CambodiaPaymentMethodId } from '@/src/constants/cambodiaPayments';
import { appRoutes } from '@/src/constants/navigation';
import { iosDesign } from '@/src/design-system/ios';
import {
  GuestHintBanner,
  GuestSurfaceCard,
  guestUi,
} from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { confirmCambodiaPayment } from '@/src/services/cambodiaPaymentService';
import { migrateGuestDraft } from '@/src/services/guestDraftMigrationService';
import { loadGuestCardDraft, type GuestCardChoice } from '@/src/services/guestDraftService';
import type { ProductType } from '@/src/constants/options';
import { getAuthErrorMessage } from '@/src/services/authService';
import { buildOrderPricingFields } from '@/src/utils/orderPricing';

export function GuestPostLoginChoiceScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [choice, setChoice] = useState<GuestCardChoice | null>(null);
  const [currency, setCurrency] = useState<OrderCurrency>('KHR');
  const [paymentMethod, setPaymentMethod] = useState<CambodiaPaymentMethodId | null>(null);
  const [step, setStep] = useState<'choose' | 'pay'>('choose');
  const [materialLabel, setMaterialLabel] = useState<string | null>(null);
  const [draftMaterial, setDraftMaterial] = useState<ProductType | undefined>();

  const hydrate = useCallback(async () => {
    const draft = await loadGuestCardDraft();
    if (!draft) {
      router.replace(appRoutes.customerTabs);
      return;
    }
    const { productTypeOptions } = await import('@/src/constants/options');
    const mat = productTypeOptions.find((p) => p.value === draft.product);
    setMaterialLabel(mat?.label ?? null);
    setDraftMaterial(draft.product);
    setLoading(false);
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const priceUsd =
    choice === 'ecard'
      ? CARD_PRODUCTS.ecard.priceUsd
      : choice === 'physical'
        ? getPhysicalPriceUsd(draftMaterial)
        : 0;

  async function handleConfirmPayment() {
    if (!user || !choice || !paymentMethod) {
      Alert.alert('Choose payment', 'Select how you want to pay.');
      return;
    }
    setSubmitting(true);
    try {
      const productType = choice === 'ecard' ? 'ecard' : 'physical_nfc';
      const pricing = buildOrderPricingFields({
        productType,
        quantity: 1,
        currency,
        material: choice === 'physical' ? draftMaterial : undefined,
      });

      const payment = await confirmCambodiaPayment({
        methodId: paymentMethod,
        amount: pricing.amount ?? 0,
        currency,
      });

      if (!payment.success) {
        throw new Error('Payment could not be confirmed. Try again.');
      }

      const orderId = await migrateGuestDraft(user, choice, undefined, {
        paymentMethod,
        paymentStatus: paymentMethod === 'cash_on_delivery' ? 'unpaid' : 'paid',
        currency,
        amount: pricing.amount,
        salesCommission: pricing.salesCommission,
        salesCommissionCurrency: pricing.salesCommissionCurrency,
        paymentReference: payment.reference,
      });

      Alert.alert(
        choice === 'ecard' ? 'E-card ready' : 'Order placed',
        choice === 'ecard'
          ? 'Your digital profile is live. Payment recorded.'
          : `Physical card order ${orderId.slice(0, 8)}… is queued for print after payment clears.`,
        [{ text: 'OK', onPress: () => router.replace(appRoutes.customerTabs) }]
      );
    } catch (err) {
      Alert.alert('Could not complete', getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={styles.loader} color={guestUi.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader
          title="Choose your card"
          subtitle={step === 'choose' ? 'Earn path: digital or printed NFC' : 'Cambodia payment'}
          showBack={step === 'pay'}
          onBackPress={step === 'pay' ? () => setStep('choose') : undefined}
        />

        <GuestHintBanner>
          <AppText style={styles.hintBody}>
            {step === 'choose'
              ? 'E-card is instant and lower cost. Physical NFC includes print, chip, and shipping.'
              : 'Pay with ABA, KHQR, ACLEDA, Wing, or cash on delivery. Gateway is demo until you connect a live provider.'}
          </AppText>
        </GuestHintBanner>

        {step === 'choose' ? (
          <>
            {(['ecard', 'physical'] as const).map((sku) => {
              const key: CardProductSku = sku === 'ecard' ? 'ecard' : 'physical_nfc';
              const product = CARD_PRODUCTS[key];
              const usd = sku === 'ecard' ? product.priceUsd : getPhysicalPriceUsd(draftMaterial);
              const selected = choice === sku;
              return (
                <Pressable
                  key={sku}
                  style={[styles.choiceCard, selected && styles.choiceCardActive]}
                  onPress={() => setChoice(sku)}
                >
                  <View style={styles.choiceHeader}>
                    <AppIcon
                      name={sku === 'ecard' ? 'QrCode' : 'Nfc'}
                      size={24}
                      color={selected ? guestUi.accent : guestUi.muted}
                    />
                    <View style={styles.choiceCopy}>
                      <AppText style={styles.choiceTitle}>{product.labelEn}</AppText>
                      <AppText style={styles.choiceSub}>{product.subtitleEn}</AppText>
                      {sku === 'physical' && materialLabel ? (
                        <AppText style={styles.materialNote}>Material: {materialLabel}</AppText>
                      ) : null}
                    </View>
                  </View>
                  <CardProductPrice priceUsd={usd} size="lg" color={guestUi.accent} mutedColor={guestUi.muted} />
                </Pressable>
              );
            })}

            <View style={styles.currencyRow}>
              <AppText style={styles.currencyLabel}>Display currency</AppText>
              <View style={styles.currencyPills}>
                {(['KHR', 'USD'] as const).map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.currencyPill, currency === c && styles.currencyPillActive]}
                    onPress={() => setCurrency(c)}
                  >
                    <AppText style={[styles.currencyPillText, currency === c && styles.currencyPillTextActive]}>
                      {c}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            {choice ? (
              <AppText style={styles.totalPreview}>
                Total: {formatDualPrice(choice === 'ecard' ? CARD_PRODUCTS.ecard.priceUsd : getPhysicalPriceUsd(draftMaterial))}
              </AppText>
            ) : null}

            <AppButton
              label="Continue to payment"
              disabled={!choice}
              onPress={() => setStep('pay')}
            />
          </>
        ) : (
          <>
            <GuestSurfaceCard title="Order total">
              <CardProductPrice
                priceUsd={priceUsd}
                size="lg"
                color={guestUi.text}
                mutedColor={guestUi.muted}
              />
              <AppText style={styles.payNote}>
                {choice === 'ecard'
                  ? 'Digital delivery — profile goes live after payment.'
                  : 'Physical cards enter print batch after payment is marked paid.'}
              </AppText>
            </GuestSurfaceCard>

            <GuestSurfaceCard title="Payment method">
              <CambodiaPaymentSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                allowCashOnDelivery={choice === 'physical'}
                accentColor={guestUi.accent}
                borderColor={guestUi.border}
                mutedColor={guestUi.muted}
                textColor={guestUi.text}
              />
            </GuestSurfaceCard>

            <AppButton
              label={submitting ? 'Confirming…' : 'Confirm payment (demo)'}
              disabled={!paymentMethod || submitting}
              onPress={() => void handleConfirmPayment()}
            />
          </>
        )}
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
  loader: { marginTop: 80 },
  hintBody: { fontSize: 12, fontWeight: '500', color: guestUi.muted, lineHeight: 17 },
  choiceCard: {
    padding: iosDesign.spacing.md,
    borderRadius: guestUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    backgroundColor: guestUi.surface,
    gap: iosDesign.spacing.sm,
  },
  choiceCardActive: {
    borderColor: guestUi.accent,
    backgroundColor: guestUi.accentSoft,
  },
  choiceHeader: { flexDirection: 'row', gap: iosDesign.spacing.sm },
  choiceCopy: { flex: 1, gap: 2 },
  choiceTitle: { fontSize: 15, fontWeight: '800', color: guestUi.text },
  choiceSub: { fontSize: 12, fontWeight: '500', color: guestUi.muted },
  materialNote: { fontSize: 11, fontWeight: '600', color: guestUi.accent, marginTop: 4 },
  currencyRow: { gap: 8 },
  currencyLabel: { fontSize: 13, fontWeight: '700', color: guestUi.text },
  currencyPills: { flexDirection: 'row', gap: 8 },
  currencyPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: iosDesign.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
  },
  currencyPillActive: { backgroundColor: guestUi.accent, borderColor: guestUi.accent },
  currencyPillText: { fontSize: 13, fontWeight: '700', color: guestUi.muted },
  currencyPillTextActive: { color: '#fff' },
  totalPreview: { fontSize: 14, fontWeight: '700', color: guestUi.text, textAlign: 'center' },
  payNote: { fontSize: 12, fontWeight: '500', color: guestUi.muted, marginTop: 8, lineHeight: 17 },
});
