import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/src/components/AppText';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: any;
}

export default function NotificationBadge({ 
  count, 
  size = 'medium',
  color = '#3b82f6',
  style
}: NotificationBadgeProps) {
  if (count === 0) return null;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { 
          width: 16, 
          height: 16, 
          fontSize: 10, 
          borderRadius: 8,
          top: -6,
          right: -6,
        };
      case 'large':
        return { 
          width: 28, 
          height: 28, 
          fontSize: 14, 
          borderRadius: 14,
          top: -8,
          right: -8,
        };
      default:
        return { 
          width: 22, 
          height: 22, 
          fontSize: 12, 
          borderRadius: 11,
          top: -8,
          right: -8,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: color,
        width: sizeStyles.width,
        height: sizeStyles.height,
        borderRadius: sizeStyles.borderRadius,
        top: sizeStyles.top,
        right: sizeStyles.right,
      },
      style
    ]}>
      <AppText variant="caption" tone="inverse" weight="bold" style={styles.badgeText}>
        {displayCount}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  badgeText: {
    color: '#ffffff',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
