import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

export const printerUi = {
  bg: '#F7F8FB',
  surface: '#FFFFFF',
  border: '#F1F5F9',
  text: '#0F172A',
  muted: '#94A3B8',
  accent: '#0EA5E9',
  dark: '#0F172A',
  green: '#32D74B',
  radiusLg: 28,
  radiusMd: 22,
  radiusSm: 18,
  shadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
} as const;

export function PrinterScreenHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub: string;
  right?: string;
}) {
  return (
    <View style={ui.header}>
      <View style={ui.headerCopy}>
        <AppText style={ui.title}>{title}</AppText>
        <AppText style={ui.sub}>{sub}</AppText>
      </View>
      {right ? (
        <View style={ui.headerBadge}>
          <AppText style={ui.headerBadgeText}>{right}</AppText>
        </View>
      ) : null}
    </View>
  );
}

export function PrinterSegment<T extends string>({
  items,
  active,
  onChange,
}: {
  items: T[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={ui.segment}>
      {items.map((item) => {
        const isActive = item === active;
        return (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            style={[ui.segmentBtn, isActive && ui.segmentBtnActive]}
          >
            <AppText style={[ui.segmentText, isActive && ui.segmentTextActive]}>{item}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PrinterSurfaceCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[ui.card, style]}>{children}</View>;
}

export function PrinterInfoRow({
  icon,
  title,
  value,
  last,
}: {
  icon: AppIconName;
  title: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[ui.row, last && ui.rowLast]}>
      <View style={ui.rowIcon}>
        <AppIcon name={icon} size={16} color="#64748B" />
      </View>
      <AppText style={ui.rowTitle}>{title}</AppText>
      <AppText style={ui.rowValue} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

export function PrinterMenuRow({
  icon,
  title,
  onPress,
  last,
}: {
  icon: AppIconName;
  title: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[ui.menuRow, last && ui.menuRowLast]}>
      <AppIcon name={icon} size={16} color="#64748B" />
      <AppText style={ui.menuTitle}>{title}</AppText>
      <AppIcon name="ChevronRight" size={16} color="#94A3B8" />
    </Pressable>
  );
}

export function PrinterSettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  destructive,
  last,
  disabled,
}: {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
  disabled?: boolean;
}) {
  const titleColor = destructive ? '#FF3B30' : printerUi.text;
  const valueColor = destructive ? '#FF3B30' : '#64748B';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        ui.settingsRow,
        last && ui.settingsRowLast,
        pressed && onPress && !disabled && { opacity: 0.88 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={ui.rowIcon}>
        <AppIcon name={icon} size={16} color={destructive ? '#FF3B30' : '#64748B'} />
      </View>
      <View style={ui.settingsCopy}>
        <AppText style={[ui.settingsTitle, { color: titleColor }]}>{title}</AppText>
        {subtitle ? <AppText style={ui.settingsSub}>{subtitle}</AppText> : null}
      </View>
      {value ? (
        <AppText style={[ui.settingsValue, { color: valueColor }]}>{value}</AppText>
      ) : onPress ? (
        <AppIcon name="ChevronRight" size={16} color="#94A3B8" />
      ) : null}
    </Pressable>
  );
}

type MiniStatTone = 'default' | 'green' | 'blue' | 'orange';

const miniStatToneStyles: Record<
  MiniStatTone,
  { iconBg: string; iconColor: string; valueColor: string }
> = {
  default: { iconBg: '#F4F6FA', iconColor: '#64748B', valueColor: printerUi.text },
  green: { iconBg: '#ECFDF5', iconColor: '#16A34A', valueColor: '#16A34A' },
  blue: { iconBg: '#EFF6FF', iconColor: '#2563EB', valueColor: '#2563EB' },
  orange: { iconBg: '#FFF7ED', iconColor: '#EA580C', valueColor: '#EA580C' },
};

export function PrinterMiniStat({
  icon,
  value,
  label,
  tone = 'default',
}: {
  icon: AppIconName;
  value: string;
  label: string;
  tone?: MiniStatTone;
}) {
  const colors = miniStatToneStyles[tone];
  return (
    <View style={ui.miniStat}>
      <View style={[ui.miniStatIcon, { backgroundColor: colors.iconBg }]}>
        <AppIcon name={icon} size={15} color={colors.iconColor} />
      </View>
      <AppText style={[ui.miniStatValue, { color: colors.valueColor }]} numberOfLines={1}>
        {value}
      </AppText>
      <AppText style={ui.miniStatLabel} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export function PrinterMiniStatGrid({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[ui.miniStatGrid, style]}>{children}</View>;
}

export type StatsBandItem = {
  icon: AppIconName;
  value: string;
  label: string;
  tone?: MiniStatTone;
};

/** One card, multiple metrics — replaces a row of separate stat boxes. */
export function PrinterStatsBand({
  title = 'Period snapshot',
  items,
  style,
  embedded,
}: {
  title?: string;
  items: StatsBandItem[];
  style?: ViewStyle;
  embedded?: boolean;
}) {
  return (
    <View style={[ui.statsBand, embedded && ui.statsBandEmbedded, style]}>
      <View style={ui.statsBandHeader}>
        <AppText style={ui.statsBandTitle}>{title}</AppText>
        <View style={ui.statsBandDots}>
          <View style={[ui.statsBandDot, { backgroundColor: '#2563EB' }]} />
          <View style={[ui.statsBandDot, { backgroundColor: '#16A34A' }]} />
          <View style={[ui.statsBandDot, { backgroundColor: '#EA580C' }]} />
        </View>
      </View>
      <View style={ui.statsBandRow}>
        {items.map((item, index) => {
          const colors = miniStatToneStyles[item.tone ?? 'default'];
          const isLast = index === items.length - 1;
          return (
            <View key={`${item.label}-${index}`} style={[ui.statsBandCell, isLast && ui.statsBandCellLast]}>
              <View style={[ui.statsBandIcon, { backgroundColor: colors.iconBg }]}>
                <AppIcon name={item.icon} size={14} color={colors.iconColor} />
              </View>
              <AppText style={[ui.statsBandValue, { color: colors.valueColor }]} numberOfLines={1}>
                {item.value}
              </AppText>
              <AppText style={ui.statsBandLabel} numberOfLines={1}>
                {item.label}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function PrinterJobRow({
  id,
  status,
  onPress,
}: {
  id: string;
  status: 'Todo' | 'Doing' | 'Done';
  onPress?: () => void;
}) {
  const pill =
    status === 'Done'
      ? { bg: '#F1F5F9', color: '#64748B' }
      : status === 'Doing'
        ? { bg: '#EFF6FF', color: '#2563EB' }
        : { bg: '#FFF7ED', color: '#EA580C' };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [ui.jobRow, pressed && { opacity: 0.9 }]}>
      <View>
        <AppText style={ui.jobLabel}>JOB</AppText>
        <AppText style={ui.jobId}>{id}</AppText>
      </View>
      <View style={[ui.jobPill, { backgroundColor: pill.bg }]}>
        <AppText style={[ui.jobPillText, { color: pill.color }]}>{status}</AppText>
      </View>
    </Pressable>
  );
}

const ui = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: printerUi.text,
    letterSpacing: -0.6,
  },
  sub: {
    fontSize: 12,
    fontWeight: '600',
    color: printerUi.muted,
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...printerUi.shadow,
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: printerUi.text,
  },
  segment: {
    marginTop: 16,
    height: 44,
    borderRadius: printerUi.radiusSm,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    padding: 4,
    flexDirection: 'row',
    ...printerUi.shadow,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: printerUi.dark,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '800',
    color: printerUi.muted,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  card: {
    borderRadius: printerUi.radiusLg,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    overflow: 'hidden',
    ...printerUi.shadow,
  },
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: printerUi.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: printerUi.text,
  },
  rowValue: {
    maxWidth: 130,
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'right',
  },
  menuRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: printerUi.border,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: printerUi.text,
  },
  settingsRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: printerUi.border,
  },
  settingsRowLast: {
    borderBottomWidth: 0,
  },
  settingsCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: printerUi.text,
  },
  settingsSub: {
    fontSize: 11,
    fontWeight: '600',
    color: printerUi.muted,
  },
  settingsValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  jobRow: {
    height: 70,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...printerUi.shadow,
  },
  jobLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: printerUi.muted,
  },
  jobId: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '900',
    color: printerUi.text,
  },
  jobPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  jobPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  miniStatGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statsBand: {
    borderRadius: printerUi.radiusLg,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    overflow: 'hidden',
    ...printerUi.shadow,
  },
  statsBandEmbedded: {
    borderWidth: 0,
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  statsBandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: printerUi.border,
  },
  statsBandTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: printerUi.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statsBandDots: {
    flexDirection: 'row',
    gap: 4,
  },
  statsBandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statsBandRow: {
    flexDirection: 'row',
  },
  statsBandCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: printerUi.border,
    gap: 5,
  },
  statsBandCellLast: {
    borderRightWidth: 0,
  },
  statsBandIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBandValue: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  statsBandLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: printerUi.muted,
    textAlign: 'center',
  },
  miniStat: {
    flex: 1,
    minHeight: 92,
    borderRadius: printerUi.radiusMd,
    backgroundColor: printerUi.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: printerUi.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...printerUi.shadow,
  },
  miniStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: printerUi.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: printerUi.muted,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
