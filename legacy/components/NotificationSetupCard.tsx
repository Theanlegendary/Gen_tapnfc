import React from 'react';
import { AppText } from '@/src/components/AppText';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';

interface NotificationSetupCardProps {
  onSetup: () => void;
  onDismiss: () => void;
  visible: boolean;
}

export default function NotificationSetupCard({ onSetup, onDismiss, visible }: NotificationSetupCardProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <AppIcon name="Bell" size={20} color="#3b82f6" />
          </View>
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <AppIcon name="X" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        <AppText style={styles.title}>Get notified about important stuff</AppText>
        <AppText style={styles.subtitle}>We will notify you when</AppText>
        
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <AppText style={styles.featureText}>Your attendance is recorded</AppText>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <AppText style={styles.featureText}>You receive group invitations</AppText>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <AppText style={styles.featureText}>Events are scheduled</AppText>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <AppText style={styles.featureText}>Important system updates</AppText>
          </View>
        </View>

        <AppText style={styles.disclaimer}>
          You can adjust these settings later.
        </AppText>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.laterButton} onPress={onDismiss}>
            <AppText style={styles.laterButtonText}>Later</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.setupButton} onPress={onSetup}>
            <AppText style={styles.setupButtonText}>Get notified</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    padding: 4,
    borderRadius: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 16,
  },
  featuresList: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginTop: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#1f2937',
    lineHeight: 18,
    flex: 1,
  },
  disclaimer: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  laterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  setupButton: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  setupButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});
