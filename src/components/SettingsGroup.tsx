import * as Haptics from 'expo-haptics';
import { PropsWithChildren, ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

const SEPARATOR_INSET = 56;
const SEPARATOR_INSET_COMPACT = 50;

interface SettingsSectionProps {
  title: string;
  footer?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SettingsSection({ title, footer, compact = false, style }: SettingsSectionProps) {
  const { colors } = usePreferences();

  return (
    <View style={[styles.section, compact && styles.sectionCompact, style]}>
      <AppText variant="caption" weight="semibold" style={[styles.sectionTitle, { color: colors.textMuted }]}>
        {title.toUpperCase()}
      </AppText>
      {footer ? (
        <AppText variant="caption" tone="muted" style={styles.sectionFooter}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

interface SettingsGroupProps {
  children: ReactNode;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SettingsGroup({ children, compact = false, style }: SettingsGroupProps) {
  const { colors } = usePreferences();

  return (
    <View
      style={[
        styles.group,
        compact && styles.groupCompact,
        { backgroundColor: colors.surface },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface SettingsRowProps {
  icon?: AppIconName;
  iconColor?: string;
  iconBackgroundColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  isLast?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

function triggerSelectionHaptic() {
  if (Platform.OS === 'ios') {
    void Haptics.selectionAsync();
  }
}

export function SettingsRow({
  icon,
  iconColor,
  iconBackgroundColor,
  title,
  subtitle,
  value,
  onPress,
  showChevron = true,
  destructive = false,
  isLast = false,
  disabled = false,
  compact = false,
}: SettingsRowProps) {
  const { colors } = usePreferences();
  const accent = iconColor ?? colors.textPrimary;
  const iconBg = iconBackgroundColor ?? colors.surfaceSoft;
  const titleColor = destructive ? theme.colors.danger : colors.typographyColor;
  const canPress = Boolean(onPress) && !disabled;

  const renderContent = (pressed = false) => (
    <>
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            compact && styles.iconWrapCompact,
            { backgroundColor: pressed ? colors.textPrimary : iconBg },
          ]}
        >
          <AppIcon name={icon} size={compact ? 16 : 18} color={pressed ? colors.textInverse : accent} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <AppText variant="body" weight="medium" style={{ color: titleColor }}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="body" tone="muted" style={styles.value} numberOfLines={1}>
          {value}
        </AppText>
      ) : null}
      {showChevron && canPress ? (
        <AppIcon name="ChevronRight" size={18} color={pressed ? colors.textPrimary : colors.textMuted} />
      ) : null}
    </>
  );

  const rowStyle = compact ? styles.rowCompact : null;

  if (!canPress) {
    return (
      <View style={[styles.rowStatic, rowStyle]}>
        {renderContent(false)}
        {!isLast ? (
          <View
            style={[
              styles.separator,
              {
                backgroundColor: colors.border,
                marginLeft: icon ? (compact ? SEPARATOR_INSET_COMPACT : SEPARATOR_INSET) : theme.spacing.md,
              },
            ]}
          />
        ) : null}
      </View>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        triggerSelectionHaptic();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.rowPressable,
        rowStyle,
        pressed && { backgroundColor: colors.surfaceSoft },
        disabled && styles.disabled,
      ]}
    >
      {({ pressed }) => (
        <>
          {renderContent(pressed)}
          {!isLast ? (
            <View
              style={[
                styles.separator,
                {
                  backgroundColor: colors.border,
                  marginLeft: icon ? (compact ? SEPARATOR_INSET_COMPACT : SEPARATOR_INSET) : theme.spacing.md,
                },
              ]}
            />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

interface ProfileStatCellProps {
  label: string;
  value: string;
  icon: AppIconName;
  tone?: string;
  index: number;
  total: number;
  compact?: boolean;
}

export function ProfileStatCell({ label, value, icon, tone, index, total, compact = false }: ProfileStatCellProps) {
  const { colors } = usePreferences();
  const valueColor = tone ?? colors.typographyColor;
  const columns = 2;
  const col = index % columns;
  const row = Math.floor(index / columns);
  const lastRow = Math.floor((total - 1) / columns);
  const showRightSeparator = col < columns - 1;
  const showBottomSeparator = row < lastRow;

  return (
    <View
      style={[
        styles.statCell,
        compact && styles.statCellCompact,
        showRightSeparator && styles.statCellRightSpace,
        showBottomSeparator && styles.statCellBottomSpace,
      ]}
    >
      <View style={[styles.statIcon, compact && styles.statIconCompact, { backgroundColor: colors.surfaceSoft }]}>
        <AppIcon name={icon} size={compact ? 15 : 17} color={tone ?? colors.textMuted} />
      </View>
      <AppText variant={compact ? 'body' : 'h2'} weight="bold" style={{ color: valueColor }}>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

export function ProfileStatsGrid({ children }: PropsWithChildren) {
  return <View style={styles.statsGrid}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    gap: 4,
  },
  sectionCompact: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md + 4,
  },
  sectionTitle: {
    letterSpacing: 0.4,
    fontSize: 13,
  },
  sectionFooter: {
    marginTop: 2,
    lineHeight: 17,
  },
  group: {
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  groupCompact: {
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  rowPressable: {
    position: 'relative',
    minHeight: theme.spacing.xl + theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rowStatic: {
    position: 'relative',
    minHeight: theme.spacing.xl + theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rowCompact: {
    minHeight: 48,
    paddingVertical: 11,
    gap: 10,
  },
  separator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  copy: {
    flex: 1,
    gap: 2,
    paddingRight: theme.spacing.xs,
  },
  value: {
    maxWidth: '38%',
    textAlign: 'right',
  },
  disabled: {
    opacity: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCell: {
    width: '50%',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: 4,
  },
  statCellCompact: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: 3,
  },
  statCellRightSpace: {
    paddingRight: theme.spacing.lg,
  },
  statCellBottomSpace: {
    marginBottom: theme.spacing.xs,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statIconCompact: {
    width: 28,
    height: 28,
    borderRadius: 8,
    marginBottom: 0,
  },
});
