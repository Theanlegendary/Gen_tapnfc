import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  formatFooterDualPrice,
  getEcardPriceUsd,
  getPhysicalPriceUsd,
} from '@/src/constants/cardProducts';
import { cardDesignOptions, productTypeOptions } from '@/src/constants/options';
import { appRoutes } from '@/src/constants/navigation';
import { iosDesign } from '@/src/design-system/ios';
import {
  GuestCenteredHeader,
  GuestFormIconCard,
  GuestFormIconRow,
  GuestFormStepTabs,
  GuestFormSummaryRow,
  GuestSegmentedControl,
  guestUi,
  type GuestFormTab,
} from '@/src/features/guest/GuestScreenUi';
import {
  CAROUSEL_CUSTOM_INDEX,
  CUSTOM_SLOT_PLACEHOLDER_GRADIENT,
  GuestChooseCardPreview,
  PHYSICAL_CARD_GRADIENTS,
  VIRTUAL_CARD_GRADIENTS,
  type ChooseCardGradient,
} from '@/src/features/guest/GuestChooseCardPreview';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import type { ProductType } from '@/src/constants/options';
import type { CardDesign } from '@/src/types/models';
import {
  pickGuestCardImage,
  resolveGuestCustomImageUri,
} from '@/src/features/guest/guestCardImagePicker';
import {
  loadGuestCardDraft,
  saveGuestCardDraft,
  saveGuestCheckoutDraft,
  type GuestCardChoice,
  type GuestCardDesignBackground,
} from '@/src/services/guestDraftService';

const AUTO_SAVE_MS = 1200;

type CardSegment = 'virtual' | 'physical';

const SEGMENT_OPTIONS: { label: string; value: CardSegment }[] = [
  { label: 'Virtual Card', value: 'virtual' },
  { label: 'Physical Card', value: 'physical' },
];

const COPY: Record<CardSegment, { title: string; subtitle: string; showContactless: boolean }> = {
  virtual: {
    title: 'Virtual Card',
    subtitle: 'Pay contactless online or in-store',
    showContactless: true,
  },
  physical: {
    title: 'Physical Card',
    subtitle: 'Printed NFC card · ships to your address in Cambodia',
    showContactless: false,
  },
};

const CAROUSEL_DESIGNS: CardDesign[] = ['classic_black', 'matte_silver', 'gold_premium'];

function segmentToChoice(segment: CardSegment): GuestCardChoice {
  return segment === 'virtual' ? 'ecard' : 'physical';
}

function choiceToSegment(choice: GuestCardChoice | undefined): CardSegment {
  return choice === 'physical' ? 'physical' : 'virtual';
}

function designToCarouselIndex(design: CardDesign | undefined): number {
  if (!design) return 0;
  const idx = CAROUSEL_DESIGNS.indexOf(design);
  return idx >= 0 ? idx : 0;
}

function carouselIndexToDesign(index: number): CardDesign {
  return CAROUSEL_DESIGNS[index % CAROUSEL_DESIGNS.length] ?? 'classic_black';
}

type CarouselSlide =
  | { kind: 'gradient'; gradient: ChooseCardGradient; gradientIndex: number }
  | { kind: 'custom' };

function buildCarouselSlides(gradients: ChooseCardGradient[]): CarouselSlide[] {
  return [
    ...gradients.map((gradient, gradientIndex) => ({
      kind: 'gradient' as const,
      gradient,
      gradientIndex,
    })),
    { kind: 'custom' as const },
  ];
}

function draftToCarouselIndex(draft: {
  gradientIndex?: number;
  designBackground?: GuestCardDesignBackground;
  cardDesign?: CardDesign;
}): number {
  if (
    typeof draft.gradientIndex === 'number'
    && draft.gradientIndex >= 0
    && draft.gradientIndex <= CAROUSEL_CUSTOM_INDEX
  ) {
    return draft.gradientIndex;
  }
  if (draft.designBackground === 'custom') return CAROUSEL_CUSTOM_INDEX;
  return designToCarouselIndex(draft.cardDesign);
}

export function GuestDesignScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isGuest = useIsGuest();

  const [segment, setSegment] = useState<CardSegment>('virtual');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [telegram, setTelegram] = useState('');
  const [formTab, setFormTab] = useState<GuestFormTab>('customer');
  const [product, setProduct] = useState<ProductType>('pvc_card');
  const [cardDesign, setCardDesign] = useState<CardDesign>('classic_black');
  const [customImageUri, setCustomImageUri] = useState('');
  const [customImageBase64, setCustomImageBase64] = useState('');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [loadingDraft, setLoadingDraft] = useState(true);

  const listRef = useRef<FlatList<CarouselSlide>>(null);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardWidth = Math.min(screenWidth * 0.72, 300);
  const cardHeight = cardWidth * 0.63;
  const itemSpacing = iosDesign.spacing.md;
  const sideInset = (screenWidth - cardWidth) / 2;

  const gradients = segment === 'virtual' ? VIRTUAL_CARD_GRADIENTS : PHYSICAL_CARD_GRADIENTS;
  const carouselSlides = useMemo(() => buildCarouselSlides(gradients), [gradients]);
  const priceUsd = segment === 'virtual' ? getEcardPriceUsd() : getPhysicalPriceUsd(product);
  const copy = COPY[segment];
  const cardType = segment;
  const resolvedCustomImageUri = resolveGuestCustomImageUri(customImageUri, customImageBase64);
  const isCustomCarouselSlot = carouselIndex === CAROUSEL_CUSTOM_INDEX;
  const designBackground: GuestCardDesignBackground = isCustomCarouselSlot ? 'custom' : 'gradient';
  const previewExtraData = {
    displayName,
    jobTitle,
    company,
    email,
    phone,
    segment,
    carouselIndex,
    customImageUri: resolvedCustomImageUri,
  };

  const loadDraft = useCallback(async () => {
    const draft = await loadGuestCardDraft();
    if (draft) {
      setDisplayName(draft.displayName || user?.displayName || '');
      setJobTitle(draft.jobTitle);
      setCompany(draft.company);
      setEmail(draft.email || user?.email || '');
      setPhone(draft.phone || user?.phone || '');
      setTelegram(draft.telegram ?? '');
      setProduct(draft.product);
      setCardDesign(draft.cardDesign);
      setCustomImageUri(draft.customImageUri ?? '');
      setCustomImageBase64(draft.customImageBase64 ?? '');
      setSegment(choiceToSegment(draft.cardChoice));
      const idx = draftToCarouselIndex(draft);
      setCarouselIndex(idx);
      if (idx < CAROUSEL_CUSTOM_INDEX) {
        setCardDesign(carouselIndexToDesign(idx));
      }
      setDraftSavedAt(draft.savedAt);
      setSaveState('saved');
      if (idx > 0) {
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: idx, animated: false });
        });
      }
    } else if (user?.displayName) {
      setDisplayName(user.displayName);
    }
    hydrated.current = true;
    setLoadingDraft(false);
  }, [user?.displayName, user?.email, user?.phone]);

  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  const persistDraft = useCallback(async () => {
    if (!hydrated.current) return;
    setSaveState('saving');
    const savedAt = new Date().toISOString();
    await saveGuestCardDraft({
      displayName,
      jobTitle,
      company,
      email,
      phone,
      telegram: telegram.trim() || undefined,
      product,
      cardDesign,
      cardChoice: segmentToChoice(segment),
      designBackground,
      gradientIndex: carouselIndex,
      customImageUri: customImageUri || undefined,
      customImageBase64: customImageBase64 || undefined,
    });
    setDraftSavedAt(savedAt);
    setSaveState('saved');
  }, [
    cardDesign,
    carouselIndex,
    company,
    customImageBase64,
    customImageUri,
    designBackground,
    displayName,
    email,
    jobTitle,
    phone,
    product,
    segment,
    telegram,
  ]);

  useEffect(() => {
    if (!hydrated.current || loadingDraft || !isGuest) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(() => {
      void persistDraft();
    }, AUTO_SAVE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [
    displayName,
    jobTitle,
    company,
    email,
    phone,
    telegram,
    product,
    cardDesign,
    carouselIndex,
    segment,
    designBackground,
    customImageUri,
    customImageBase64,
    loadingDraft,
    persistDraft,
  ]);

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / (cardWidth + itemSpacing));
    const clamped = Math.max(0, Math.min(index, carouselSlides.length - 1));
    setCarouselIndex(clamped);
    if (clamped < CAROUSEL_CUSTOM_INDEX) {
      setCardDesign(carouselIndexToDesign(clamped));
    }
  }

  function handleSegmentChange(next: CardSegment) {
    if (next === segment) return;
    setSegment(next);
    setCarouselIndex(0);
    setCardDesign(carouselIndexToDesign(0));
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }

  function handleFinishSelect(design: CardDesign) {
    setCardDesign(design);
    const idx = designToCarouselIndex(design);
    if (idx >= 0 && idx < CAROUSEL_CUSTOM_INDEX) {
      setCarouselIndex(idx);
      listRef.current?.scrollToIndex({ index: idx, animated: true });
    }
  }

  async function handlePickCustomImage(fromCamera: boolean) {
    const picked = await pickGuestCardImage(fromCamera);
    if (!picked) return;
    setCustomImageUri(picked.uri);
    if (picked.base64) setCustomImageBase64(picked.base64);
    if (carouselIndex !== CAROUSEL_CUSTOM_INDEX) {
      setCarouselIndex(CAROUSEL_CUSTOM_INDEX);
      listRef.current?.scrollToIndex({ index: CAROUSEL_CUSTOM_INDEX, animated: true });
    }
  }

  function handleRemoveCustomImage() {
    setCustomImageUri('');
    setCustomImageBase64('');
  }

  async function handleApply() {
    await saveGuestCardDraft({
      displayName,
      jobTitle,
      company,
      email,
      phone,
      telegram: telegram.trim() || undefined,
      product,
      cardDesign,
      cardChoice: segmentToChoice(segment),
      designBackground,
      gradientIndex: carouselIndex,
      customImageUri: customImageUri || undefined,
      customImageBase64: customImageBase64 || undefined,
    });
    await saveGuestCheckoutDraft({
      cardChoice: segmentToChoice(segment),
      product,
      quantity: 1,
      displayName: displayName.trim() || user?.displayName || '',
      phone: phone.trim(),
      currency: 'KHR',
    });
    router.push(isGuest ? appRoutes.guestCheckout : appRoutes.guestPostLoginChoice);
  }

  const draftCaption =
    !loadingDraft && saveState !== 'idle'
      ? saveState === 'saving'
        ? 'Saving draft…'
        : `Draft saved on this device${
            draftSavedAt && saveState === 'saved'
              ? ` · ${new Date(draftSavedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
              : ''
          }`
      : null;

  const finishLabel =
    cardDesignOptions.find((o) => o.value === cardDesign)?.label ?? 'Classic Black';
  const materialLabel =
    productTypeOptions.find((o) => o.value === product)?.label ?? 'PVC Card';
  const cardTypeLabel = segment === 'virtual' ? 'Virtual NFC' : 'Physical NFC';
  const designSummary = isCustomCarouselSlot ? 'Custom photo' : finishLabel;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <GuestCenteredHeader title="Design your card" onBack={() => router.back()} />

        <View style={styles.previewSection}>
          <View style={styles.segmentWrap}>
            <GuestSegmentedControl options={SEGMENT_OPTIONS} value={segment} onChange={handleSegmentChange} />
          </View>

          <FlatList
            ref={listRef}
            data={carouselSlides}
            extraData={previewExtraData}
            key={`${segment}-${carouselSlides.length}`}
            horizontal
            scrollEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={cardWidth + itemSpacing}
            snapToAlignment="start"
            style={styles.carouselList}
            contentContainerStyle={{
              paddingHorizontal: sideInset,
              gap: itemSpacing,
              paddingVertical: iosDesign.spacing.xs,
            }}
            onMomentumScrollEnd={onMomentumScrollEnd}
            getItemLayout={(_, index) => ({
              length: cardWidth + itemSpacing,
              offset: (cardWidth + itemSpacing) * index,
              index,
            })}
            renderItem={({ item, index }) => {
              const isActive = index === carouselIndex;
              const previewProps = {
                fullName: displayName,
                title: jobTitle,
                company,
                email,
                phone,
                cardType,
                width: cardWidth,
                height: cardHeight,
              } as const;

              return (
                <View
                  style={[
                    styles.carouselItem,
                    {
                      width: cardWidth,
                      marginRight: itemSpacing,
                      opacity: isActive ? 1 : 0.55,
                    },
                  ]}
                >
                  {item.kind === 'custom' ? (
                    <GuestChooseCardPreview
                      {...previewProps}
                      gradient={CUSTOM_SLOT_PLACEHOLDER_GRADIENT}
                      gradientIndex={CAROUSEL_CUSTOM_INDEX}
                      customImageUri={resolvedCustomImageUri}
                      isCustomSlot
                      onAddPhoto={
                        isActive ? () => void handlePickCustomImage(false) : undefined
                      }
                    />
                  ) : (
                    <GuestChooseCardPreview
                      {...previewProps}
                      gradient={item.gradient}
                      gradientIndex={item.gradientIndex}
                      customImageUri={null}
                    />
                  )}
                </View>
              );
            }}
          />

          <View style={styles.copyBlock}>
            <AppText style={styles.productTitle}>{copy.title}</AppText>
            <View style={styles.subtitleRow}>
              <AppText style={styles.productSubtitle}>{copy.subtitle}</AppText>
              {copy.showContactless ? <AppIcon name="Nfc" size={15} color={guestUi.muted} /> : null}
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formTabWrap}>
            <GuestFormStepTabs active={formTab} onChange={setFormTab} />
          </View>

          {formTab === 'customer' ? (
            <GuestFormIconCard>
              <GuestFormIconRow
                icon="User"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Full name"
                autoCapitalize="words"
              />
              <GuestFormIconRow
                icon="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="+855 12 345 678"
                keyboardType="phone-pad"
              />
              <GuestFormIconRow
                icon="Share"
                value={telegram}
                onChangeText={setTelegram}
                placeholder="@telegram"
                autoCapitalize="none"
              />
              <GuestFormIconRow
                icon="Mail"
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <GuestFormIconRow
                icon="MapPin"
                value={company}
                onChangeText={setCompany}
                placeholder="Company name"
              />
              <GuestFormIconRow
                icon="UserRound"
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="Job title"
                last
              />
            </GuestFormIconCard>
          ) : null}

          {formTab === 'product' ? (
            <View style={styles.formPanel}>
              <GuestFormIconCard>
                <GuestFormSummaryRow icon="CreditCard" label="Type" value={cardTypeLabel} />
                {segment === 'physical' ? (
                  <GuestFormSummaryRow icon="Package" label="Material" value={materialLabel} />
                ) : null}
                <GuestFormSummaryRow
                  icon="Sparkles"
                  label="Finish"
                  value={designSummary}
                  last={!isCustomCarouselSlot}
                />
                {isCustomCarouselSlot ? (
                  <GuestFormSummaryRow icon="Image" label="Photo" value={resolvedCustomImageUri ? 'Added' : 'Not set'} last />
                ) : null}
              </GuestFormIconCard>

              {segment === 'physical' ? (
                <View style={styles.formSubsection}>
                  <AppText style={styles.formSubsectionTitle}>Material</AppText>
                  <AppText style={styles.fieldHint}>Tap a material — price updates below.</AppText>
                  <View style={styles.pillRow}>
                    {productTypeOptions.map((opt) => (
                      <Pressable
                        key={opt.value}
                        style={[styles.pill, product === opt.value && styles.pillActive]}
                        onPress={() => setProduct(opt.value)}
                      >
                        <AppText style={[styles.pillText, product === opt.value && styles.pillTextActive]}>
                          {opt.label}
                        </AppText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              {!isCustomCarouselSlot ? (
                <View style={styles.formSubsection}>
                  <AppText style={styles.formSubsectionTitle}>Finish</AppText>
                  <AppText style={styles.fieldHint}>Swipe the preview or pick a finish.</AppText>
                  <View style={styles.pillRow}>
                    {cardDesignOptions
                      .filter((opt) => opt.value !== 'custom')
                      .map((opt) => (
                        <Pressable
                          key={opt.value}
                          style={[styles.pill, cardDesign === opt.value && styles.pillActive]}
                          onPress={() => handleFinishSelect(opt.value)}
                        >
                          <AppText style={[styles.pillText, cardDesign === opt.value && styles.pillTextActive]}>
                            {opt.label}
                          </AppText>
                        </Pressable>
                      ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.formSubsection}>
                <AppText style={styles.formSubsectionTitle}>Custom photo</AppText>
                {resolvedCustomImageUri ? (
                  <View style={styles.photoActions}>
                    <Pressable
                      onPress={() => void handlePickCustomImage(false)}
                      accessibilityRole="button"
                    >
                      <AppText style={styles.changePhotoText}>Change photo</AppText>
                    </Pressable>
                    <Pressable onPress={handleRemoveCustomImage} accessibilityRole="button">
                      <AppText style={styles.removePhotoText}>Remove photo</AppText>
                    </Pressable>
                  </View>
                ) : (
                  <AppText style={styles.fieldHint}>
                    Swipe to the fourth card and tap the preview, or use the buttons below.
                  </AppText>
                )}
                <View style={styles.uploadRow}>
                  <Pressable
                    style={({ pressed }) => [styles.uploadBtn, pressed && styles.uploadBtnPressed]}
                    onPress={() => void handlePickCustomImage(false)}
                    accessibilityRole="button"
                  >
                    <AppIcon name="Image" size={18} color={guestUi.accent} />
                    <AppText style={styles.uploadBtnText}>Gallery</AppText>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.uploadBtn, pressed && styles.uploadBtnPressed]}
                    onPress={() => void handlePickCustomImage(true)}
                    accessibilityRole="button"
                  >
                    <AppIcon name="ScanLine" size={18} color={guestUi.accent} />
                    <AppText style={styles.uploadBtnText}>Camera</AppText>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : null}

          {formTab === 'payment' ? (
            <View style={styles.formPanel}>
              <GuestFormIconCard>
                <GuestFormSummaryRow icon="CreditCard" label="Card" value={cardTypeLabel} />
                {segment === 'physical' ? (
                  <GuestFormSummaryRow icon="Package" label="Material" value={materialLabel} />
                ) : null}
                <GuestFormSummaryRow icon="Sparkles" label="Design" value={designSummary} />
                <GuestFormSummaryRow icon="Wallet" label="Total" value={formatFooterDualPrice(priceUsd)} last />
              </GuestFormIconCard>
              <AppText style={styles.paymentHint}>
                Payment and delivery are completed on the next screen. Tap Apply Card below to continue.
              </AppText>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, iosDesign.spacing.md) }]}>
          <AppText style={styles.footerPrice}>{formatFooterDualPrice(priceUsd)}</AppText>
          {draftCaption ? <AppText style={styles.footerDraftCaption}>{draftCaption}</AppText> : null}
          <Pressable
            onPress={() => void handleApply()}
            style={({ pressed }) => [styles.applyBtn, pressed && styles.applyBtnPressed]}
            accessibilityRole="button"
          >
            <AppText style={styles.applyBtnText}>Apply Card</AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  flex: { flex: 1 },
  previewSection: {
    flexShrink: 0,
    gap: 2,
    paddingBottom: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: guestUi.border,
  },
  formScroll: { flex: 1 },
  scroll: {
    paddingTop: iosDesign.spacing.xs,
    paddingBottom: iosDesign.spacing.lg,
    gap: iosDesign.spacing.md,
  },
  formTabWrap: {
    marginHorizontal: iosDesign.spacing.md,
    marginTop: iosDesign.spacing.xs,
  },
  formPanel: {
    marginHorizontal: iosDesign.spacing.md,
    gap: iosDesign.spacing.md,
  },
  formSubsection: {
    gap: iosDesign.spacing.xs,
  },
  formSubsectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: guestUi.text,
    letterSpacing: -0.1,
  },
  paymentHint: {
    fontSize: 13,
    fontWeight: '500',
    color: guestUi.muted,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: iosDesign.spacing.sm,
  },
  segmentWrap: {
    paddingHorizontal: iosDesign.spacing.md,
    marginTop: 2,
  },
  carouselList: { flexGrow: 0, maxHeight: 210 },
  carouselItem: {
    transform: [{ scale: 1 }],
  },
  copyBlock: {
    alignItems: 'center',
    paddingHorizontal: iosDesign.spacing.lg,
    gap: 3,
    marginTop: iosDesign.spacing.xs,
    paddingBottom: iosDesign.spacing.xs,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: guestUi.text,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  productSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: guestUi.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  fieldHint: { fontSize: 11, fontWeight: '500', color: guestUi.muted, marginBottom: 4 },
  photoActions: {
    flexDirection: 'row',
    gap: iosDesign.spacing.md,
    marginBottom: 4,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: guestUi.accent,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: iosDesign.radius.pill,
    backgroundColor: guestUi.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
  },
  pillActive: { backgroundColor: guestUi.accent, borderColor: guestUi.accent },
  pillText: { fontSize: 12, fontWeight: '600', color: guestUi.muted },
  pillTextActive: { color: '#fff' },
  uploadRow: { flexDirection: 'row', gap: 8 },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: guestUi.radiusMd,
    backgroundColor: guestUi.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
  },
  uploadBtnPressed: { opacity: 0.88 },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: guestUi.text,
  },
  removePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  footer: {
    paddingHorizontal: iosDesign.spacing.md,
    paddingTop: iosDesign.spacing.sm + 2,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: guestUi.border,
    backgroundColor: guestUi.bg,
  },
  footerPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: guestUi.accent,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  footerDraftCaption: {
    fontSize: 11,
    fontWeight: '500',
    color: guestUi.muted,
    textAlign: 'center',
    marginBottom: 2,
  },
  applyBtn: {
    backgroundColor: guestUi.charcoal,
    borderRadius: iosDesign.radius.pill,
    paddingVertical: 16,
    paddingHorizontal: iosDesign.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...guestUi.shadowFloating,
  },
  applyBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
});
