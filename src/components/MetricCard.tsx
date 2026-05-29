import { StyleSheet, View } from 'react-native';
import { AppCard } from '@/src/components/AppCard';
import { AppText } from '@/src/components/AppText';
import { theme } from '@/src/constants/theme';

interface MetricCardProps {
  label: string;
  value: string;
  highlight?: string;
}

export function MetricCard({ label, value, highlight }: MetricCardProps) {
  return (
    <AppCard style={styles.card}>
      <AppText variant="caption" tone="muted" style={styles.label}>
        {label}
      </AppText>
      <AppText variant="h1" style={styles.value}>
        {value}
      </AppText>
      {highlight ? (
        <View style={styles.badge}>
          <AppText variant="caption" tone="inverse" style={styles.badgeText}>
            {highlight}
          </AppText>
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0,
    fontSize: 10,
  },
  value: {
    fontSize: 34,
    lineHeight: 40,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginTop: theme.spacing.xxs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
