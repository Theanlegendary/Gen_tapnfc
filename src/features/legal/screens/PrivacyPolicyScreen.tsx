import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <AppIcon name="ArrowLeft" size={24} color="#2563eb" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Privacy Policy</AppText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <AppIcon name="ShieldCheck" size={24} color="#2563eb" />
        </View>

        <AppText style={styles.title}>Privacy Policy</AppText>
        <AppText style={styles.lastUpdated}>Last updated: January 20, 2025</AppText>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>1. Information We Collect</AppText>
          <AppText style={styles.sectionText}>
            We collect information you provide directly to us, such as when you create an account, 
            update your profile, or use our attendance tracking features. This includes:
            {'\n\n'}• Name and employee identification
            {'\n'}• Email address and contact information
            {'\n'}• Work schedule and attendance records
            {'\n'}• Profile photos (optional)
            {'\n'}• Device information for QR code scanning
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>2. How We Use Your Information</AppText>
          <AppText style={styles.sectionText}>
            We use the information we collect to:
            {'\n\n'}• Provide and maintain our attendance tracking service
            {'\n'}• Process and record your attendance data
            {'\n'}• Send you notifications about attendance and events
            {'\n'}• Improve our services and user experience
            {'\n'}• Ensure security and prevent fraud
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>3. Information Sharing</AppText>
          <AppText style={styles.sectionText}>
            We do not sell, trade, or otherwise transfer your personal information to third parties. 
            Your attendance data is only accessible to:
            {'\n\n'}• You (your own attendance records)
            {'\n'}• Authorized administrators in your organization
            {'\n'}• System administrators for technical support
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>4. Data Security</AppText>
          <AppText style={styles.sectionText}>
            We implement appropriate security measures to protect your personal information:
            {'\n\n'}• Encrypted data transmission (HTTPS/TLS)
            {'\n'}• Secure password hashing
            {'\n'}• Regular security audits
            {'\n'}• Access controls and authentication
            {'\n'}• Data backup and recovery procedures
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>5. Your Rights</AppText>
          <AppText style={styles.sectionText}>
            You have the right to:
            {'\n\n'}• Access your personal data
            {'\n'}• Correct inaccurate information
            {'\n'}• Request deletion of your data
            {'\n'}• Export your attendance records
            {'\n'}• Opt-out of non-essential notifications
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>6. Contact Us</AppText>
          <AppText style={styles.sectionText}>
            If you have any questions about this Privacy Policy, please contact us at:
            {'\n\n'}Email: privacy@mahakasolutions.com
            {'\n'}Phone: +1 (555) 123-4567
            {'\n'}Address: 123 Business St, Tech City, TC 12345
          </AppText>
        </View>

        <View style={styles.footer}>
          <AppText style={styles.footerText}>
            By using our app, you agree to this Privacy Policy and our Terms of Service.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
  },
  headerTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
