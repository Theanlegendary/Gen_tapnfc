import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppIcon, AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

interface AttendanceStatusCardProps {
  status: 'Present' | 'Late' | 'Absent';
  checkInTime: string;
  message: string;
}

export default function AttendanceStatusCard({ 
  status, 
  checkInTime, 
  message 
}: AttendanceStatusCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'Present':
        return {
          icon: 'CircleCheck' as AppIconName,
          color: '#10b981',
          backgroundColor: '#d1fae5',
          textColor: '#065f46',
        };
      case 'Late':
        return {
          icon: 'CircleAlert' as AppIconName,
          color: '#f59e0b',
          backgroundColor: '#fef3c7',
          textColor: '#92400e',
        };
      case 'Absent':
        return {
          icon: 'Circle' as AppIconName,
          color: '#ef4444',
          backgroundColor: '#fee2e2',
          textColor: '#991b1b',
        };
      default:
        return {
          icon: 'Clock' as AppIconName,
          color: '#6b7280',
          backgroundColor: '#f3f4f6',
          textColor: '#374151',
        };
    }
  };

  const config = getStatusConfig();
  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <View style={styles.header}>
        <AppIcon name={config.icon} size={24} color={config.color} />
        <AppText variant="h2" weight="bold" style={[styles.status, { color: config.textColor }]}>
          {status.toUpperCase()}
        </AppText>
      </View>
      
      <View style={styles.details}>
        <View style={styles.timeContainer}>
          <AppIcon name="Clock" size={20} color={config.textColor} />
          <AppText variant="body" weight="semibold" style={[styles.time, { color: config.textColor }]}>
            Check-in: {checkInTime}
          </AppText>
        </View>
        
        <AppText variant="body" style={[styles.message, { color: config.textColor }]}>
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  status: {
    marginLeft: 8,
  },
  details: {
    gap: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
  },
  message: {
    fontStyle: 'italic',
  },
});
