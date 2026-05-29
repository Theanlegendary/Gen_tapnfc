import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { cardDesignOptions, productTypeOptions } from '@/src/constants/options';
import { iosDesign } from '@/src/design-system/ios';
import { GuestDemoPill, guestUi } from '@/src/features/guest/GuestScreenUi';
import type { ProductType } from '@/src/constants/options';
import type { CardDesign } from '@/src/types/models';

const PRODUCT_THEMES: Record<
  ProductType,
  { colors: readonly [string, string]; accent: string; text: string; muted: string }
> = {
  wood_card: { colors: ['#3B2416', '#A46B38'], accent: '#F2C37B', text: '#FFF7E8', muted: 'rgba(255,247,232,0.72)' },
  metal_card: { colors: ['#111827', '#64748B'], accent: '#DDE6EF', text: '#F8FAFC', muted: 'rgba(248,250,252,0.72)' },
  pvc_card: { colors: ['#0F766E', '#30D158'], accent: '#B8FFF2', text: '#FFFFFF', muted: 'rgba(255,255,255,0.76)' },
};

export type GuestCardPreviewProps = {
  displayName: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  product: ProductType;
  cardDesign: CardDesign;
};

export function GuestCardPreview({
  displayName,
  jobTitle = '',
  company = '',
  email = '',
  phone = '',
  product,
  cardDesign,
}: GuestCardPreviewProps) {
  const palette = PRODUCT_THEMES[product];
  const designLabel = cardDesignOptions.find((d) => d.value === cardDesign)?.label ?? 'Classic Black';
  const productLabel = productTypeOptions.find((p) => p.value === product)?.label ?? 'Card';
  const subtitle = [jobTitle.trim(), company.trim()].filter(Boolean).join(' · ');

  return (
    <View style={styles.wrap}>
      <View style={styles.previewMeta}>
        <GuestDemoPill label="PREVIEW" />
        <AppText style={styles.previewMetaText}>
          {productLabel} · {designLabel}
        </AppText>
      </View>
      <LinearGradient colors={palette.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.chip, { borderColor: palette.accent }]}>
            <View style={[styles.chipLine, { backgroundColor: palette.accent }]} />
            <View style={[styles.chipLine, { backgroundColor: palette.accent }]} />
          </View>
          <AppIcon name="Nfc" size={20} color={palette.accent} />
        </View>
        <View style={styles.cardMid}>
          <AppText style={[styles.cardBrand, { color: palette.muted }]}>SITEHUB NFC</AppText>
          <AppText style={[styles.cardName, { color: palette.text }]} numberOfLines={1}>
            {(displayName.trim() || 'Your Name').toUpperCase()}
          </AppText>
          {subtitle ? (
            <AppText style={[styles.cardSubtitle, { color: palette.muted }]} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.contactCol}>
            {email.trim() ? (
              <AppText style={[styles.cardContact, { color: palette.muted }]} numberOfLines={1}>
                {email.trim()}
              </AppText>
            ) : null}
            {phone.trim() ? (
              <AppText style={[styles.cardContact, { color: palette.muted }]} numberOfLines={1}>
                {phone.trim()}
              </AppText>
            ) : null}
            {!email.trim() && !phone.trim() ? (
              <AppText style={[styles.cardCompany, { color: palette.muted }]} numberOfLines={1}>
                {company.trim() || 'Company / Brand'}
              </AppText>
            ) : null}
          </View>
          <View style={styles.cardFeatures}>
            <AppIcon name="QrCode" size={14} color={palette.text} />
            <AppIcon name="Nfc" size={14} color={palette.text} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: iosDesign.spacing.sm },
  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  previewMetaText: { fontSize: 12, fontWeight: '600', color: guestUi.muted },
  card: {
    borderRadius: guestUi.radiusMd,
    padding: iosDesign.spacing.md,
    minHeight: 200,
    justifyContent: 'space-between',
    ...guestUi.shadowFloating,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: {
    width: 42,
    height: 30,
    borderRadius: 6,
    borderWidth: 1.5,
    padding: 5,
    gap: 4,
    justifyContent: 'center',
  },
  chipLine: { height: 3, borderRadius: 2, width: '80%' },
  cardMid: { gap: 4, marginTop: iosDesign.spacing.lg },
  cardBrand: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  cardName: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  cardSubtitle: { fontSize: 11, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  contactCol: { flex: 1, gap: 2 },
  cardCompany: { fontSize: 12, fontWeight: '600' },
  cardContact: { fontSize: 11, fontWeight: '600' },
  cardFeatures: { flexDirection: 'row', gap: 8 },
});
