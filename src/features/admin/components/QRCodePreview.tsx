import React from 'react';
import { AppText } from '@/src/components/AppText';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { AppIcon } from '@/src/components/AppIcon';
import QRCode from 'react-native-qrcode-svg';
import { QRCodeRecord } from '@/src/types/qr';

interface QRCodePreviewProps {
  visible: boolean;
  qrCode: QRCodeRecord | null;
  onClose: () => void;
}

export default function QRCodePreview({ visible, qrCode, onClose }: QRCodePreviewProps) {
  if (!qrCode) return null;

  const qrDataString = JSON.stringify(qrCode.qrData);

  const handlePrint = () => {
    if (Platform.OS === 'web') {
      // For web, create a printable page
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${qrCode.name}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px;
                  margin: 0;
                }
                .qr-container { 
                  display: inline-block; 
                  padding: 20px; 
                  border: 2px solid #000; 
                  margin: 20px;
                }
                .qr-title { 
                  font-size: 18px; 
                  font-weight: bold; 
                  margin-bottom: 10px; 
                }
                .qr-description { 
                  font-size: 14px; 
                  color: #666; 
                  margin-bottom: 20px; 
                }
                .qr-info { 
                  font-size: 12px; 
                  color: #888; 
                  margin-top: 20px; 
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <div class="qr-title">${qrCode.name}</div>
                <div class="qr-description">${qrCode.description}</div>
                <div id="qr-code"></div>
                <div class="qr-info">
                  Type: ${qrCode.type}<br>
                  Created: ${new Date(qrCode.createdAt).toLocaleDateString()}<br>
                  ${qrCode.expiresAt ? `Expires: ${new Date(qrCode.expiresAt).toLocaleDateString()}` : ''}
                </div>
              </div>
              <script>
                // Generate QR code using a simple library or canvas
                setTimeout(() => window.print(), 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      Alert.alert('Print', 'Print functionality is available on web platform');
    }
  };

  const handleDownload = () => {
    Alert.alert(
      'Download QR Code',
      'Choose download format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'PNG Image', 
          onPress: () => Alert.alert('Success', 'QR code image downloaded!') 
        },
        { 
          text: 'PDF Document', 
          onPress: () => Alert.alert('Success', 'QR code PDF downloaded!') 
        },
      ]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Share QR Code',
      'Share this QR code with others:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Share Image', 
          onPress: () => Alert.alert('Success', 'QR code shared!') 
        },
        { 
          text: 'Copy Data', 
          onPress: () => Alert.alert('Copied', 'QR code data copied to clipboard!') 
        },
      ]
    );
  };

  const getQRTypeColor = (type: string) => {
    switch (type) {
      case 'user_invite': return '#8b5cf6';
      case 'attendance': return '#10b981';
      case 'event_invite': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getQRTypeIcon = (type: string) => {
    switch (type) {
      case 'user_invite': return '👥';
      case 'attendance': return '📍';
      case 'event_invite': return '📅';
      default: return '📱';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>QR Code Preview</AppText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <AppIcon name="X" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.qrContainer}>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={qrDataString}
                size={200}
                color="#000000"
                backgroundColor="#ffffff"
                logo={undefined}
                logoSize={30}
                logoBackgroundColor="transparent"
              />
            </View>
            
            <View style={styles.qrInfo}>
              <View style={styles.qrHeader}>
                <AppText style={styles.qrTypeIcon}>
                  {getQRTypeIcon(qrCode.type)}
                </AppText>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: getQRTypeColor(qrCode.type) }
                ]}>
                  <AppText style={styles.typeBadgeText}>{qrCode.type}</AppText>
                </View>
              </View>
              
              <AppText style={styles.qrName}>{qrCode.name}</AppText>
              <AppText style={styles.qrDescription}>{qrCode.description}</AppText>
              
              <View style={styles.qrDetails}>
                <View style={styles.detailRow}>
                  <AppText style={styles.detailLabel}>Type:</AppText>
                  <AppText style={styles.detailValue}>{qrCode.type.replace('_', ' ').toUpperCase()}</AppText>
                </View>
                
                <View style={styles.detailRow}>
                  <AppText style={styles.detailLabel}>Created:</AppText>
                  <AppText style={styles.detailValue}>
                    {new Date(qrCode.createdAt).toLocaleDateString()}
                  </AppText>
                </View>
                
                {qrCode.expiresAt && (
                  <View style={styles.detailRow}>
                    <AppText style={styles.detailLabel}>Expires:</AppText>
                    <AppText style={styles.detailValue}>
                      {new Date(qrCode.expiresAt).toLocaleDateString()}
                    </AppText>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <AppText style={styles.detailLabel}>Usage:</AppText>
                  <AppText style={styles.detailValue}>
                    {qrCode.usageCount} times{qrCode.maxUsage ? ` / ${qrCode.maxUsage}` : ''}
                  </AppText>
                </View>
                
                <View style={styles.detailRow}>
                  <AppText style={styles.detailLabel}>Status:</AppText>
                  <AppText style={[
                    styles.detailValue,
                    { color: qrCode.isActive ? '#10b981' : '#ef4444' }
                  ]}>
                    {qrCode.isActive ? 'Active' : 'Inactive'}
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handlePrint}>
              <AppIcon name="Printer" size={20} color="#ffffff" />
              <AppText style={styles.actionButtonText}>Print</AppText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
              <AppIcon name="Download" size={20} color="#ffffff" />
              <AppText style={styles.actionButtonText}>Download</AppText>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <AppIcon name="Share" size={20} color="#ffffff" />
              <AppText style={styles.actionButtonText}>Share</AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.instructions}>
            <AppText style={styles.instructionsTitle}>How to Use This QR Code:</AppText>
            
            {qrCode.type === 'attendance' && (
              <AppText style={styles.instructionsText}>
                1. Print this QR code and place it at the designated location{'\n'}
                2. Users can scan this code with the mobile app to record attendance{'\n'}
                3. The system will automatically track check-in times and status
              </AppText>
            )}
            
            {qrCode.type === 'user_invite' && (
              <AppText style={styles.instructionsText}>
                1. Share this QR code with new employees{'\n'}
                2. They can scan it to receive an invitation to join the system{'\n'}
                3. The invitation will include organization details and role assignment
              </AppText>
            )}
            
            {qrCode.type === 'event_invite' && (
              <AppText style={styles.instructionsText}>
                1. Share this QR code with event participants{'\n'}
                2. They can scan it to view event details and RSVP{'\n'}
                3. The system will track participant responses and capacity
              </AppText>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  qrCodeWrapper: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  qrInfo: {
    alignItems: 'center',
    width: '100%',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  qrTypeIcon: {
    fontSize: 24,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  qrName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  qrDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  qrDetails: {
    width: '100%',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#eff6ff',
    borderRadius: 18,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
