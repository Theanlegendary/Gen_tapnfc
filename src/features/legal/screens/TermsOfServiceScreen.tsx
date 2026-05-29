import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { router } from 'expo-router';
import { AppIcon } from '@/src/components/AppIcon';

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <AppIcon name="ArrowLeft" size={24} color="#2563eb" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Terms of Service</AppText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <AppIcon name="FileText" size={24} color="#2563eb" />
        </View>

        <AppText style={styles.title}>Terms of Service</AppText>
        <AppText style={styles.lastUpdated}>Last updated: January 20, 2025</AppText>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>1. Acceptance of Terms</AppText>
          <AppText style={styles.sectionText}>
            By accessing and using the Attendance App Service, you accept and agree to be bound 
            by the terms and provision of this agreement. If you do not agree to abide by the above, 
            please do not use this service.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>2. Use License</AppText>
          <AppText style={styles.sectionText}>
            Permission is granted to temporarily use the Attendance App for personal, 
            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            {'\n\n'}• Modify or copy the materials
            {'\n'}• Use the materials for commercial purposes
            {'\n'}• Attempt to reverse engineer the software
            {'\n'}• Remove any copyright or proprietary notations
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>3. User Responsibilities</AppText>
          <AppText style={styles.sectionText}>
            As a user of this service, you agree to:
            {'\n\n'}• Provide accurate and truthful information
            {'\n'}• Use the app only for legitimate attendance tracking
            {'\n'}• Not share your login credentials with others
            {'\n'}• Report any security vulnerabilities or bugs
            {'\n'}• Comply with your organization attendance policies
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>4. Data Accuracy</AppText>
          <AppText style={styles.sectionText}>
            You are responsible for ensuring the accuracy of your attendance records. 
            While we strive to provide accurate time tracking, you should verify your 
            records and report any discrepancies to your administrator promptly.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>5. Service Availability</AppText>
          <AppText style={styles.sectionText}>
            We strive to maintain high availability of our service, but we do not guarantee 
            uninterrupted access. The service may be temporarily unavailable due to:
            {'\n\n'}• Scheduled maintenance
            {'\n'}• Technical difficulties
            {'\n'}• Force majeure events
            {'\n'}• Third-party service disruptions
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>6. Limitation of Liability</AppText>
          <AppText style={styles.sectionText}>
            In no event shall Mahaka Solutions or its suppliers be liable for any damages 
            (including, without limitation, damages for loss of data or profit, or due to 
            business interruption) arising out of the use or inability to use the materials 
            on this service, even if authorized representative has been notified orally or 
            in writing of the possibility of such damage.
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>7. Modifications</AppText>
          <AppText style={styles.sectionText}>
            Mahaka Solutions may revise these terms of service at any time without notice. 
            By using this service, you are agreeing to be bound by the then current version 
            of these terms of service.
          </AppText>
        </View>

        <View style={styles.footer}>
          <AppText style={styles.footerText}>
            For questions about these Terms of Service, contact us at legal@mahakasolutions.com
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
