import { PropsWithChildren, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

interface AdminScreenShellProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  headerBottom?: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function AdminScreenShell({
  title,
  subtitle = 'Admin',
  showBack = true,
  rightAction,
  headerBottom,
  scroll = true,
  contentContainerStyle,
  children,
}: AdminScreenShellProps) {
  const { colors } = usePreferences();

  const header = (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
          >
            <AppIcon name="ChevronLeft" size={22} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.headerCopy}>
          <AppText variant="caption" tone="muted" weight="medium">
            {subtitle}
          </AppText>
          <AppText variant="h2" weight="bold" numberOfLines={1} style={{ color: colors.typographyColor }}>
            {title}
          </AppText>
        </View>
        {rightAction ?? <View style={styles.backPlaceholder} />}
      </View>
      {headerBottom}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {header}
      {body}
    </SafeAreaView>
  );
}

interface AdminHeaderActionProps {
  label: string;
  onPress: () => void;
  icon?: 'Plus' | 'User';
}

export function AdminHeaderAction({ label, onPress, icon = 'Plus' }: AdminHeaderActionProps) {
  const { colors } = usePreferences();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
    >
      <AppIcon name={icon} size={18} color={colors.primary} />
      <AppText variant="body" weight="semibold" style={{ color: colors.primary }}>
        {label}
      </AppText>
    </Pressable>
  );
}

interface AdminStatusPillProps {
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
}

const PILL_TONES = {
  success: { bg: 'rgba(0,0,0,0.08)', border: 'rgba(0,0,0,0.14)', text: '#000000' },
  warning: { bg: 'rgba(255,159,10,0.14)', border: 'rgba(255,159,10,0.28)', text: '#9A5D00' },
  danger: { bg: 'rgba(255,59,48,0.12)', border: 'rgba(255,59,48,0.28)', text: '#C41E14' },
  info: { bg: 'rgba(0,122,255,0.12)', border: 'rgba(0,122,255,0.24)', text: '#0056B3' },
  neutral: { bg: 'rgba(142,142,147,0.14)', border: 'rgba(142,142,147,0.24)', text: '#636366' },
} as const;

export function AdminStatusPill({ label, tone = 'neutral' }: AdminStatusPillProps) {
  const palette = PILL_TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <AppText variant="caption" weight="semibold" style={{ color: palette.text, fontSize: 11 }}>
        {label}
      </AppText>
    </View>
  );
}

interface AdminStatChipProps {
  label: string;
  value: string;
  tone?: string;
}

export function AdminStatChip({ label, value, tone }: AdminStatChipProps) {
  const { colors } = usePreferences();
  const valueColor = tone ?? colors.typographyColor;

  return (
    <View style={[styles.statChip, { backgroundColor: colors.surface }]}>
      <AppText variant="caption" tone="muted" weight="medium" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="body" weight="bold" numberOfLines={1} style={{ color: valueColor }}>
        {value}
      </AppText>
    </View>
  );
}

export function AdminStatChipRow({ children }: PropsWithChildren) {
  return <View style={styles.statRow}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.control,
  },
  backPlaceholder: { width: 36 },
  headerCopy: { flex: 1, gap: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    minHeight: 36,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  body: { flex: 1 },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  statChip: {
    flexGrow: 1,
    flexBasis: '47%',
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: 4,
    minWidth: 120,
    ...theme.shadows.control,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
});
