import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppEmptyState } from '@/src/components/AppState';
import { AppHeader } from '@/src/components/AppHeader';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';
import { useNotifications } from '@/src/hooks/useNotifications';
import { usePreferences } from '@/src/hooks/usePreferences';

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function SalesNotificationsScreen() {
  const { colors } = usePreferences();
  const { items, markRead } = useNotifications();

  const sorted = useMemo(() => items, [items]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <AppHeader title="Notifications" subtitle="Sales" role="sales" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {sorted.length === 0 ? (
          <AppEmptyState
            title="You're all caught up"
            description="No notifications for this account yet."
            iconName="Bell"
            role="sales"
          />
        ) : (
          sorted.map((n, idx) => (
            <Pressable
              key={n.id}
              accessibilityRole="button"
              onPress={() => void markRead(n.id)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.88 : 1,
                },
                idx === sorted.length - 1 && { marginBottom: 0 },
              ]}
            >
              <View style={styles.rowTop}>
                <AppText variant="body" weight={n.isRead ? 'semibold' : 'bold'} numberOfLines={1}>
                  {n.title}
                </AppText>
                <AppText variant="caption" tone="muted" weight="medium">
                  {formatDate(n.createdAt)}
                </AppText>
              </View>
              {n.message ? (
                <AppText variant="caption" tone="muted" numberOfLines={2} style={styles.message}>
                  {n.message}
                </AppText>
              ) : null}
              {!n.isRead ? (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              ) : null}
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 120,
    gap: theme.spacing.sm,
  },
  row: {
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    gap: theme.spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.08)',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  message: {
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
