import React from 'react';
import { AppText } from '@/src/components/AppText';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { AppIcon, AppIconName } from '@/src/components/AppIcon';

interface ProfileCardProps {
  title: string;
  description?: string;
  icon: AppIconName;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
  variant?: 'default' | 'highlighted' | 'warning';
  style?: ViewStyle;
}

export default function ProfileCard({
  title,
  description,
  icon,
  value,
  onPress,
  showChevron = true,
  rightElement,
  variant = 'default',
  style,
}: ProfileCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'highlighted':
        return {
          backgroundColor: '#f0f9ff',
          borderColor: '#3b82f6',
          borderWidth: 1.5,
        };
      case 'warning':
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          borderWidth: 1.5,
        };
      default:
        return {
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          borderWidth: 1,
        };
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'highlighted':
        return '#3b82f6';
      case 'warning':
        return '#f59e0b';
      default:
        return '#2563eb';
    }
  };

  const variantStyles = getVariantStyles();
  const iconColor = getIconColor();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variantStyles,
        style
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <AppIcon name={icon} size={22} color={iconColor} />
        </View>
        
        <View style={styles.textContainer}>
          <AppText style={styles.title}>{title}</AppText>
          {description && (
            <AppText style={styles.description}>{description}</AppText>
          )}
          {value && (
            <AppText style={styles.value}>{value}</AppText>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {rightElement}
        {showChevron && onPress && (
          <AppIcon name="ChevronRight" size={20} color="#9ca3af" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  description: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
