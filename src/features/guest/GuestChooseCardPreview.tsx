import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { iosDesign } from '@/src/design-system/ios';

export type ChooseCardGradient = {
  colors: readonly [string, string, ...string[]];
  accent: string;
};

export type ChooseCardType = 'virtual' | 'physical';

export const VIRTUAL_CARD_GRADIENTS: ChooseCardGradient[] = [
  { colors: ['#E91E8C', '#FF7043', '#FFB74D'], accent: '#FFFFFF' },
  { colors: ['#29B6F6', '#4FC3F7', '#81D4FA'], accent: '#FFFFFF' },
  { colors: ['#7B1FA2', '#EC407A', '#F48FB1'], accent: '#FFFFFF' },
];

export const PHYSICAL_CARD_GRADIENTS: ChooseCardGradient[] = [
  { colors: ['#3B2416', '#8D5524', '#C49A6C'], accent: '#F2C37B' },
  { colors: ['#111827', '#475569', '#94A3B8'], accent: '#E2E8F0' },
  { colors: ['#0F766E', '#14B8A6', '#5EEAD4'], accent: '#FFFFFF' },
];

/** Fourth carousel slide — custom photo background. */
export const CAROUSEL_CUSTOM_INDEX = 3;

export const CUSTOM_SLOT_PLACEHOLDER_GRADIENT: ChooseCardGradient = {
  colors: ['#1C1C1E', '#2C2C2E', '#3A3A3C'],
  accent: '#FFFFFF',
};

type Props = {
  gradient: ChooseCardGradient;
  /** Primary name on card face */
  fullName: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  gradientIndex?: number;
  cardType?: ChooseCardType;
  width: number;
  height: number;
  /** Full-card background photo (gradient used as fallback when absent). */
  customImageUri?: string | null;
  /** Fourth carousel slide — dashed placeholder or uploaded photo. */
  isCustomSlot?: boolean;
  /** Opens image picker when the custom placeholder is tapped. */
  onAddPhoto?: () => void;
  /** @deprecated Use cardType="physical" */
  isPhysical?: boolean;
};

export function GuestChooseCardPreview({
  gradient,
  fullName,
  title = '',
  company = '',
  email = '',
  phone = '',
  gradientIndex = 0,
  cardType,
  width,
  height,
  customImageUri = null,
  isCustomSlot = false,
  onAddPhoto,
  isPhysical = false,
}: Props) {
  const resolvedType: ChooseCardType = cardType ?? (isPhysical ? 'physical' : 'virtual');
  const isPhysicalCard = resolvedType === 'physical';
  const name = (fullName.trim() || 'Your Name').toUpperCase();
  const subtitle = [title.trim(), company.trim()].filter(Boolean).join(' · ');
  const contactLine = email.trim() || phone.trim();
  const paletteIndex = Math.max(0, Math.min(gradientIndex, 2));
  const hasCustomImage = Boolean(customImageUri?.trim());
  const showPlaceholder = isCustomSlot && !hasCustomImage;
  const textAccent = hasCustomImage || showPlaceholder ? '#FFFFFF' : gradient.accent;

  const cardBody = (
    <View
      style={[
        styles.cardShell,
        { width, height },
        showPlaceholder && styles.cardShellCustomEmpty,
      ]}
    >
      {showPlaceholder ? (
        <>
          <LinearGradient
            colors={CUSTOM_SLOT_PLACEHOLDER_GRADIENT.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.customPlaceholder} pointerEvents="none">
            <View style={styles.yourDesignBadge}>
              <AppText style={styles.yourDesignBadgeText}>Your design</AppText>
            </View>
            <AppIcon name="Upload" size={28} color="rgba(255,255,255,0.85)" />
            <AppText style={styles.tapAddPhotoText}>Tap to add photo</AppText>
          </View>
        </>
      ) : hasCustomImage ? (
        <>
          <Image
            source={{ uri: customImageUri!.trim() }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.52)', 'rgba(0,0,0,0.72)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </>
      ) : (
        <>
          <LinearGradient
            colors={gradient.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.12)', 'transparent']}
            start={{ x: 0.05, y: 0 }}
            end={{ x: 0.95, y: 0.55 }}
            style={styles.shinePrimary}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.18)']}
            start={{ x: 0.2, y: 0.6 }}
            end={{ x: 1, y: 1 }}
            style={styles.shineSecondary}
            pointerEvents="none"
          />
        </>
      )}

      <View style={styles.cardContent}>
        <View style={styles.topRow}>
          <View style={styles.networkMark}>
            <View style={[styles.mcCircle, styles.mcRed]} />
            <View style={[styles.mcCircle, styles.mcOrange]} />
          </View>
          <View style={styles.brandRow}>
            <AppIcon name="Sparkles" size={14} color={textAccent} />
            <AppText style={[styles.brand, { color: textAccent }]}>SiteHub</AppText>
          </View>
        </View>

        <View style={styles.mid}>
          <View style={styles.labelRow}>
            <AppText style={styles.networkLabel}>
              {isPhysicalCard ? 'BIO CLOUD NATIVE' : 'DIGITAL NFC'}
            </AppText>
            {!isPhysicalCard ? (
              <View style={styles.digitalBadge}>
                <AppIcon name="Nfc" size={11} color="rgba(255,255,255,0.9)" />
                <AppText style={styles.digitalBadgeText}>Tap</AppText>
              </View>
            ) : null}
          </View>
          <AppText style={[styles.name, { color: textAccent }]} numberOfLines={1}>
            {name}
          </AppText>
          {subtitle ? (
            <AppText style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
          {contactLine ? (
            <AppText style={styles.contact} numberOfLines={1}>
              {contactLine}
            </AppText>
          ) : null}
        </View>

        <View style={styles.bottomRow}>
          <AppText style={[styles.nfcMark, { color: textAccent }]}>NFC</AppText>
          {isPhysicalCard ? (
            <View style={[styles.chip, styles.chipPhysical]}>
              <View style={[styles.chipLine, { backgroundColor: textAccent }]} />
              <View style={[styles.chipLine, { backgroundColor: textAccent }]} />
              <View style={[styles.chipLine, styles.chipLineShort, { backgroundColor: textAccent }]} />
            </View>
          ) : (
            <View style={styles.virtualMark}>
              <AppIcon name="QrCode" size={16} color={textAccent} />
              {!hasCustomImage ? (
                <View style={styles.paletteDots}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.paletteDot,
                        i === paletteIndex && styles.paletteDotActive,
                        { backgroundColor: textAccent },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (showPlaceholder && onAddPhoto) {
    return (
      <Pressable
        onPress={onAddPhoto}
        accessibilityRole="button"
        accessibilityLabel="Tap to add photo"
        style={({ pressed }) => [pressed && styles.cardShellPressed]}
      >
        {cardBody}
      </Pressable>
    );
  }

  return cardBody;
}

const styles = StyleSheet.create({
  cardShell: {
    borderRadius: iosDesign.radius.lg,
    overflow: 'hidden',
    ...iosDesign.shadows.card,
  },
  cardShellCustomEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.42)',
  },
  cardShellPressed: {
    opacity: 0.92,
  },
  customPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: iosDesign.spacing.md,
  },
  yourDesignBadge: {
    position: 'absolute',
    top: iosDesign.spacing.sm,
    left: iosDesign.spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: iosDesign.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  yourDesignBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.92)',
    textTransform: 'uppercase',
  },
  tapAddPhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 0.2,
  },
  cardContent: {
    flex: 1,
    padding: iosDesign.spacing.md,
    justifyContent: 'space-between',
  },
  shinePrimary: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  shineSecondary: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkMark: {
    flexDirection: 'row',
    width: 36,
    height: 22,
  },
  mcCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: 'absolute',
  },
  mcRed: { backgroundColor: '#EB001B', left: 0, opacity: 0.92 },
  mcOrange: { backgroundColor: '#F79E1B', left: 12, opacity: 0.92 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  mid: {
    gap: 4,
    marginTop: iosDesign.spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  networkLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.72)',
  },
  digitalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: iosDesign.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  digitalBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.4,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
  },
  contact: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.62)',
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  nfcMark: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  chip: {
    width: 42,
    height: 30,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    padding: 5,
    gap: 3,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  chipPhysical: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  chipLine: {
    height: 3,
    borderRadius: 2,
    width: '82%',
    opacity: 0.95,
  },
  chipLineShort: {
    width: '58%',
  },
  virtualMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paletteDots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  paletteDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    opacity: 0.35,
  },
  paletteDotActive: {
    opacity: 1,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
