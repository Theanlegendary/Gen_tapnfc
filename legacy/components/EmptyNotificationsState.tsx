import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';

interface EmptyNotificationsStateProps {
  hasNotifications: boolean;
  onCustomize?: () => void;
  onHistorical?: () => void;
}

export default function EmptyNotificationsState({ 
  hasNotifications, 
  onCustomize,
  onHistorical 
}: EmptyNotificationsStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.iconBackground}>
          <AppIcon name="Bell" size={24} color="#3b82f6" />
          <View style={styles.sparkleContainer}>
            <AppIcon name="Sparkles" size={20} color="#fbbf24" fill="#fbbf24" />
          </View>
        </View>
      </View>
      
      <AppText variant="h2" weight="bold" style={styles.title}>
        {hasNotifications ? 'All caught up!' : 'No notifications yet'}
      </AppText>
      
      <AppText variant="body" tone="muted" style={styles.message}>
        {hasNotifications 
          ? 'You\'re up to date with all your notifications. Great job staying on top of things!'
          : 'Your notifications will appear here once you\'ve received them. We\'ll keep you informed about important updates.'
        }
      </AppText>

      {onHistorical && (
        <TouchableOpacity style={styles.linkButton} onPress={onHistorical}>
          <AppIcon name="History" size={20} color="#3b82f6" />
          <AppText variant="caption" style={styles.linkText}>
            Missing notifications?{'\n'}
            <AppText variant="caption" style={styles.linkUnderline}>Go to historical notifications.</AppText>
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  iconContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
  },
  linkText: {
    color: '#3b82f6',
    textAlign: 'center',
  },
  linkUnderline: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
