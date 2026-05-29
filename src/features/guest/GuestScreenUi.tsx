import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { iosDesign, premiumPalette } from '@/src/design-system/ios';

/** Guest consumer UI — aligned with sales/printer premium tokens. */
export const guestUi = {
  bg: premiumPalette.background,
  surface: premiumPalette.surface,
  surfaceSoft: premiumPalette.surfaceSoft,
  border: premiumPalette.border,
  text: premiumPalette.textPrimary,
  muted: premiumPalette.textSecondary,
  accent: premiumPalette.accent,
  accentSoft: premiumPalette.accentSoft,
  charcoal: premiumPalette.charcoal,
  radiusLg: iosDesign.radius.lg,
  radiusMd: iosDesign.radius.md,
  radiusSm: iosDesign.radius.sm,
  shadow: iosDesign.shadows.card,
  shadowFloating: iosDesign.shadows.floating,
} as const;

export function GuestDemoPill({ label = 'DEMO' }: { label?: string }) {
  return (
    <View style={ui.demoPill}>
      <AppText style={ui.demoPillText}>{label}</AppText>
    </View>
  );
}

export function GuestHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <LinearGradient
      colors={['#1C1C1E', '#2C2C2E', '#1C1C1E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={ui.hero}
    >
      <GuestDemoPill label="GUEST PREVIEW" />
      <AppText style={ui.heroEyebrow}>{eyebrow}</AppText>
      <AppText style={ui.heroTitle}>{title}</AppText>
      <AppText style={ui.heroSub}>{subtitle}</AppText>
    </LinearGradient>
  );
}

export function GuestQuickTile({
  icon,
  title,
  description,
  onPress,
  accent = guestUi.accent,
  style,
}: {
  icon: AppIconName;
  title: string;
  description: string;
  onPress: () => void;
  accent?: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [ui.quickTile, style, pressed && ui.quickTilePressed]}
      accessibilityRole="button"
    >
      <View style={[ui.quickIcon, { backgroundColor: `${accent}18` }]}>
        <AppIcon name={icon} size={22} color={accent} />
      </View>
      <View style={ui.quickCopy}>
        <AppText style={ui.quickTitle}>{title}</AppText>
        <AppText style={ui.quickDesc}>{description}</AppText>
      </View>
      <AppIcon name="ChevronRight" size={18} color={guestUi.muted} />
    </Pressable>
  );
}

export function GuestSurfaceCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={ui.surfaceCard}>
      {title ? <AppText style={ui.surfaceTitle}>{title}</AppText> : null}
      {children}
    </View>
  );
}

export function GuestHintBanner({ children }: { children: ReactNode }) {
  return (
    <View style={ui.hintBanner}>
      <AppIcon name="Info" size={16} color={guestUi.accent} />
      <View style={ui.hintCopy}>{children}</View>
    </View>
  );
}

/** Centered title + back — Veloxpay-style choose-card header. */
export function GuestCenteredHeader({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) {
  return (
    <View style={ui.centeredHeader}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={({ pressed }) => [ui.centeredBack, pressed && ui.centeredBackPressed]}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <AppIcon name="ChevronLeft" size={24} color={guestUi.text} />
      </Pressable>
      <AppText style={ui.centeredTitle}>{title}</AppText>
      <View style={ui.centeredSpacer} />
    </View>
  );
}

export type GuestFormTab = 'customer' | 'product' | 'payment';

const GUEST_FORM_TAB_META: { key: GuestFormTab; label: string; icon: AppIconName }[] = [
  { key: 'customer', label: 'Customer', icon: 'User' },
  { key: 'product', label: 'Product', icon: 'Package' },
  { key: 'payment', label: 'Payment', icon: 'Wallet' },
];

/** Customer | Product | Payment — navy active pill, grey inactive (printer/sales reference). */
export function GuestFormStepTabs({
  active,
  onChange,
}: {
  active: GuestFormTab;
  onChange: (tab: GuestFormTab) => void;
}) {
  return (
    <View style={ui.formTabTrack}>
      {GUEST_FORM_TAB_META.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[ui.formTabItem, isActive && ui.formTabItemActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <AppIcon name={tab.icon} size={13} color={isActive ? '#FFFFFF' : '#94A3B8'} />
            <AppText style={[ui.formTabLabel, isActive && ui.formTabLabelActive]}>{tab.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function GuestFormIconCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[ui.formIconCard, style]}>{children}</View>;
}

export function GuestFormIconRow({
  icon,
  value,
  onChangeText,
  placeholder,
  last,
  ...inputProps
}: {
  icon: AppIconName;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  last?: boolean;
} & Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'autoCorrect'>) {
  return (
    <View style={[ui.formIconRow, last && ui.formIconRowLast]}>
      <View style={ui.formIconWrap}>
        <AppIcon name={icon} size={16} color="#64748B" />
      </View>
      <TextInput
        style={ui.formIconInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        {...inputProps}
      />
    </View>
  );
}

export function GuestFormSummaryRow({
  icon,
  label,
  value,
  last,
}: {
  icon: AppIconName;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[ui.formSummaryRow, last && ui.formIconRowLast]}>
      <View style={ui.formIconWrap}>
        <AppIcon name={icon} size={16} color="#64748B" />
      </View>
      <AppText style={ui.formSummaryLabel}>{label}</AppText>
      <AppText style={ui.formSummaryValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

export function GuestSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={ui.segmentTrack}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[ui.segmentItem, active && ui.segmentItemActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <AppText style={[ui.segmentLabel, active && ui.segmentLabelActive]}>{opt.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const ui = StyleSheet.create({
  demoPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(48,209,88,0.2)',
    borderRadius: iosDesign.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  demoPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: guestUi.accent,
  },
  hero: {
    borderRadius: guestUi.radiusLg,
    padding: iosDesign.spacing.lg,
    gap: 6,
    ...guestUi.shadowFloating,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroSub: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 20,
    marginTop: 2,
  },
  quickTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.md,
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    padding: iosDesign.spacing.md,
    ...guestUi.shadow,
  },
  quickTilePressed: {
    opacity: 0.92,
    transform: [{ scale: iosDesign.animation.softPressScale }],
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: guestUi.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCopy: {
    flex: 1,
    gap: 2,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: guestUi.text,
  },
  quickDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: guestUi.muted,
    lineHeight: 16,
  },
  surfaceCard: {
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    padding: iosDesign.spacing.md,
    gap: iosDesign.spacing.sm,
    ...guestUi.shadow,
  },
  surfaceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: guestUi.text,
    letterSpacing: -0.1,
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: iosDesign.spacing.xs,
    backgroundColor: guestUi.accentSoft,
    borderRadius: guestUi.radiusMd,
    padding: iosDesign.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(48,209,88,0.25)',
  },
  hintCopy: {
    flex: 1,
    gap: 2,
  },
  centeredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: iosDesign.spacing.xs,
    paddingVertical: iosDesign.spacing.sm,
  },
  centeredBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredBackPressed: { opacity: 0.55 },
  centeredTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: guestUi.text,
    letterSpacing: -0.2,
  },
  centeredSpacer: { width: 40 },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: guestUi.surfaceSoft,
    borderRadius: iosDesign.radius.pill,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: iosDesign.radius.pill,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: guestUi.surface,
    ...guestUi.shadow,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: guestUi.muted,
  },
  segmentLabelActive: {
    color: guestUi.text,
    fontWeight: '700',
  },
  formTabTrack: {
    height: 48,
    borderRadius: 16,
    backgroundColor: guestUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E9EF',
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...guestUi.shadow,
  },
  formTabItem: {
    flex: 1,
    height: '100%',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  formTabItemActive: {
    backgroundColor: '#0F172A',
  },
  formTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  formTabLabelActive: {
    color: '#FFFFFF',
  },
  formIconCard: {
    borderRadius: guestUi.radiusLg,
    backgroundColor: guestUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6E9EF',
    overflow: 'hidden',
    ...guestUi.shadow,
  },
  formIconRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: iosDesign.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  formIconRowLast: {
    borderBottomWidth: 0,
  },
  formIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formIconInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    padding: 0,
  },
  formSummaryRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: iosDesign.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  formSummaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    width: 72,
  },
  formSummaryValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
});
