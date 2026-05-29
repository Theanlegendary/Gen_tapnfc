import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppIcon, AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

interface ProfileStatsCardProps {
  period: 'week' | 'month' | 'allTime';
  stats: {
    present: number;
    late: number;
    absent: number;
    total: number;
    percentage: number;
  };
  onPress?: () => void;
}

export default function ProfileStatsCard({ period, stats, onPress }: ProfileStatsCardProps) {
  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'allTime': return 'All Time';
      default: return period;
    }
  };

  const getPeriodIcon = () => {
    switch (period) {
      case 'week': return 'Calendar' as AppIconName;
      case 'month': return 'Clock' as AppIconName;
      case 'allTime': return 'Target' as AppIconName;
      default: return 'TrendingUp' as AppIconName;
    }
  };

  const getPercentageColor = () => {
    if (stats.percentage >= 95) return '#10b981';
    if (stats.percentage >= 85) return '#f59e0b';
    return '#ef4444';
  };

  const periodIcon = getPeriodIcon();

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={styles.header}>
        <AppIcon name={periodIcon} size={20} color="#2563eb" />
        <AppText variant="body" weight="semibold" style={styles.period}>{getPeriodLabel()}</AppText>
      </View>
      
      <View style={styles.statsContainer}>
        <AppText variant="h1" weight="bold" style={[styles.percentage, { color: getPercentageColor() }]}>
          {stats.percentage}%
        </AppText>
        
        <View style={styles.breakdown}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
            <AppText variant="caption" tone="muted" weight="medium" style={styles.statText}>{stats.present} Present</AppText>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
            <AppText variant="caption" tone="muted" weight="medium" style={styles.statText}>{stats.late} Late</AppText>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
            <AppText variant="caption" tone="muted" weight="medium" style={styles.statText}>{stats.absent} Absent</AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  period: {
    color: '#1f2937',
    marginLeft: 8,
  },
  statsContainer: {
    alignItems: 'center',
  },
  percentage: {
    marginBottom: 12,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
  },
});
