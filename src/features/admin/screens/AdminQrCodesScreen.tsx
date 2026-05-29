import React, { useState } from 'react';
import { AppText } from '@/src/components/AppText';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { AppIcon } from '@/src/components/AppIcon';
import { generateUserInviteQR, generateAttendanceQR, generateEventInviteQR } from '@/src/features/admin/qr/qrGenerator';
import QRCodePreview from '@/src/features/admin/components/QRCodePreview';
import { QRCodeRecord } from '@/src/types/qr';
import { isAdminRole } from '@/src/utils/authz';

export default function QRCodeManagementScreen() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<QRCodeRecord | null>(null);
  const [selectedQRType, setSelectedQRType] = useState<'user_invite' | 'attendance' | 'event_invite'>('attendance');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // User invite fields
    organizationName: 'Mahaka Solutions',
    role: 'user' as 'user' | 'admin',
    expiresInDays: 7,
    // Attendance fields
    locationName: '',
    officeId: 'OFFICE_001',
    address: '',
    workStartTime: '09:00',
    workEndTime: '17:00',
    // Event fields
    eventName: '',
    eventDescription: '',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    maxParticipants: '',
  });

  // Redirect if not admin
  React.useEffect(() => {
    if (!user || !isAdminRole(user.role)) {
      router.replace('/(tabs)');
    }
  }, [user]);

  // Mock QR codes data
  const [qrCodes, setQRCodes] = useState<QRCodeRecord[]>([
    {
      id: 'qr-1',
      type: 'attendance',
      name: 'Attendance - Main Entrance',
      description: 'Main office entrance attendance tracking',
      qrData: generateAttendanceQR('Main Entrance', 'OFFICE_001', user?.id || 'admin-1').qrData,
      isActive: true,
      usageCount: 245,
      createdBy: user?.id || 'admin-1',
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'qr-2',
      type: 'user_invite',
      name: 'User Invite - Employee',
      description: 'Invite new employees to join the system',
      qrData: generateUserInviteQR('Mahaka Solutions', user?.displayName || 'Admin', user?.id || 'admin-1', 'user').qrData,
      isActive: true,
      usageCount: 12,
      maxUsage: undefined,
      createdBy: user?.id || 'admin-1',
      createdAt: '2025-01-01T00:00:00Z',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'qr-3',
      type: 'event_invite',
      name: 'Event - Team Meeting',
      description: 'Monthly team sync meeting invitation',
      qrData: generateEventInviteQR(
        'Team Meeting',
        'Monthly team sync and planning',
        '2025-02-01',
        '10:00',
        'Conference Room A',
        user?.id || 'admin-1',
        20
      ).qrData,
      isActive: true,
      usageCount: 8,
      maxUsage: 20,
      createdBy: user?.id || 'admin-1',
      createdAt: '2025-01-01T00:00:00Z',
      expiresAt: '2025-02-01T10:00:00Z',
    },
  ]);

  const handleCreateQR = () => {
    if (!user) return;
    
    let newQRCode: QRCodeRecord;
    
    try {
      switch (selectedQRType) {
        case 'user_invite':
          if (!formData.organizationName) {
            Alert.alert('Error', 'Organization name is required');
            return;
          }
          newQRCode = generateUserInviteQR(
            formData.organizationName,
            user.displayName,
            user.id,
            formData.role,
            formData.expiresInDays
          );
          break;
          
        case 'attendance':
          if (!formData.locationName || !formData.officeId) {
            Alert.alert('Error', 'Location name and office ID are required');
            return;
          }
          newQRCode = generateAttendanceQR(
            formData.locationName,
            formData.officeId,
            user.id,
            formData.address,
            undefined,
            { start: formData.workStartTime, end: formData.workEndTime }
          );
          break;
          
        case 'event_invite':
          if (!formData.eventName || !formData.eventDate || !formData.eventTime) {
            Alert.alert('Error', 'Event name, date, and time are required');
            return;
          }
          const expiresAt = new Date(`${formData.eventDate}T${formData.eventTime}`);
          newQRCode = generateEventInviteQR(
            formData.eventName,
            formData.eventDescription,
            formData.eventDate,
            formData.eventTime,
            formData.eventLocation,
            user.id,
            formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
            expiresAt.toISOString()
          );
          break;
          
        default:
          Alert.alert('Error', 'Invalid QR code type');
          return;
      }
      
      setQRCodes(prev => [...prev, newQRCode]);
      resetForm();
      setShowCreateModal(false);
      Alert.alert('Success', `${selectedQRType.replace('_', ' ')} QR code created successfully`);
      
    } catch {
      Alert.alert('Error', 'Failed to create QR code');
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      organizationName: 'Mahaka Solutions',
      role: 'user',
      expiresInDays: 7,
      locationName: '',
      officeId: 'OFFICE_001',
      address: '',
      workStartTime: '09:00',
      workEndTime: '17:00',
      eventName: '',
      eventDescription: '',
      eventDate: '',
      eventTime: '',
      eventLocation: '',
      maxParticipants: '',
    });
  };

  const handleDeleteQR = (qrId: string) => {
    Alert.alert(
      'Delete QR Code',
      'Are you sure you want to delete this QR code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setQRCodes(prev => prev.filter(qr => qr.id !== qrId));
            Alert.alert('Success', 'QR code deleted successfully');
          },
        },
      ]
    );
  };

  const handleToggleActive = (qrId: string) => {
    setQRCodes(prev => prev.map(qr => 
      qr.id === qrId 
        ? { ...qr, isActive: !qr.isActive }
        : qr
    ));
  };

  const handleDownloadQR = (qrCode: QRCodeRecord) => {
    Alert.alert(
      'Download QR Code',
      `Download QR code for "${qrCode.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download PDF', 
          onPress: () => Alert.alert('Success', 'QR code PDF downloaded!') 
        },
      ]
    );
  };

  const handlePreviewQR = (qrCode: QRCodeRecord) => {
    setSelectedQRCode(qrCode);
    setShowPreviewModal(true);
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

  const CreateQRModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <AppText style={styles.modalTitle}>
            Create New QR Code
          </AppText>
          <TouchableOpacity
            onPress={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          >
            <AppText style={styles.modalCloseText}>Cancel</AppText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.modalForm}>
            {/* QR Type Selection */}
            <View style={styles.typeSelector}>
              <AppText style={styles.typeSelectorLabel}>QR Code Type:</AppText>
              <View style={styles.typeButtons}>
                {[
                  { key: 'user_invite', label: '👥 User Invite', desc: 'Invite users to join' },
                  { key: 'attendance', label: '📍 Attendance', desc: 'Track attendance' },
                  { key: 'event_invite', label: '📅 Event Invite', desc: 'Invite to events' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      selectedQRType === type.key && styles.typeButtonActive
                    ]}
                    onPress={() => setSelectedQRType(type.key as any)}
                  >
                    <AppText style={[
                      styles.typeButtonText,
                      selectedQRType === type.key && styles.typeButtonTextActive
                    ]}>
                      {type.label}
                    </AppText>
                    <AppText style={[
                      styles.typeButtonDesc,
                      selectedQRType === type.key && styles.typeButtonDescActive
                    ]}>
                      {type.desc}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* User Invite Fields */}
            {selectedQRType === 'user_invite' && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Organization Name *"
                  value={formData.organizationName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, organizationName: text }))}
                />
                
                <View style={styles.roleSelector}>
                  <AppText style={styles.roleSelectorLabel}>User Role:</AppText>
                  <View style={styles.roleButtons}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        formData.role === 'user' && styles.roleButtonActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, role: 'user' }))}
                    >
                      <AppText style={[
                        styles.roleButtonText,
                        formData.role === 'user' && styles.roleButtonTextActive
                      ]}>User</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        formData.role === 'admin' && styles.roleButtonActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                    >
                      <AppText style={[
                        styles.roleButtonText,
                        formData.role === 'admin' && styles.roleButtonTextActive
                      ]}>Admin</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Expires in days (default: 7)"
                  value={formData.expiresInDays.toString()}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, expiresInDays: parseInt(text) || 7 }))}
                  keyboardType="numeric"
                />
              </>
            )}

            {/* Attendance Fields */}
            {selectedQRType === 'attendance' && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Location Name *"
                  value={formData.locationName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, locationName: text }))}
                />
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Office ID *"
                  value={formData.officeId}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, officeId: text }))}
                />
                
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Address"
                  value={formData.address}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                  multiline
                  numberOfLines={2}
                />
                
                <View style={styles.timeInputs}>
                  <View style={styles.timeInputContainer}>
                    <AppText style={styles.timeLabel}>Work Start</AppText>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="09:00"
                      value={formData.workStartTime}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, workStartTime: text }))}
                    />
                  </View>
                  <View style={styles.timeInputContainer}>
                    <AppText style={styles.timeLabel}>Work End</AppText>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="17:00"
                      value={formData.workEndTime}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, workEndTime: text }))}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Event Invite Fields */}
            {selectedQRType === 'event_invite' && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Event Name *"
                  value={formData.eventName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, eventName: text }))}
                />
                
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Event Description"
                  value={formData.eventDescription}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, eventDescription: text }))}
                  multiline
                  numberOfLines={3}
                />
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Event Date (YYYY-MM-DD) *"
                  value={formData.eventDate}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, eventDate: text }))}
                />
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Event Time (HH:MM) *"
                  value={formData.eventTime}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, eventTime: text }))}
                />
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Event Location"
                  value={formData.eventLocation}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, eventLocation: text }))}
                />
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Max Participants (optional)"
                  value={formData.maxParticipants}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, maxParticipants: text }))}
                  keyboardType="numeric"
                />
              </>
            )}

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleCreateQR}
            >
              <AppText style={styles.modalSubmitButtonText}>
                Create QR Code
              </AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <AppIcon name="ArrowLeft" size={24} color="#2563eb" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>QR Code Management</AppText>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowCreateModal(true)}
        >
          <AppIcon name="Plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <AppIcon name="QrCode" size={24} color="#2563eb" />
            <AppText style={styles.statNumber}>{qrCodes.length}</AppText>
            <AppText style={styles.statLabel}>Total QR Codes</AppText>
          </View>
          <View style={styles.statCard}>
            <AppIcon name="MapPin" size={24} color="#10b981" />
            <AppText style={styles.statNumber}>
              {qrCodes.filter(qr => qr.isActive).length}
            </AppText>
            <AppText style={styles.statLabel}>Active</AppText>
          </View>
          <View style={styles.statCard}>
            <AppIcon name="Download" size={24} color="#f59e0b" />
            <AppText style={styles.statNumber}>
              {qrCodes.reduce((sum, qr) => sum + qr.usageCount, 0)}
            </AppText>
            <AppText style={styles.statLabel}>Total Scans</AppText>
          </View>
        </View>

        {/* QR Codes List */}
        <View style={styles.qrCodesSection}>
          <AppText style={styles.sectionTitle}>QR Codes</AppText>
          
          <View style={styles.qrCodesList}>
            {qrCodes.map((qrCode) => (
              <View key={qrCode.id} style={styles.qrCodeCard}>
                <View style={styles.qrCodeHeader}>
                  <View style={styles.qrCodeInfo}>
                    <View style={styles.qrCodeTitleRow}>
                      <AppText style={styles.qrCodeType}>
                        {getQRTypeIcon(qrCode.type)} {qrCode.type.replace('_', ' ').toUpperCase()}
                      </AppText>
                      <View style={[
                        styles.typeBadge,
                        { backgroundColor: getQRTypeColor(qrCode.type) }
                      ]}>
                        <AppText style={styles.typeBadgeText}>{qrCode.type}</AppText>
                      </View>
                    </View>
                    <AppText style={styles.qrCodeName}>{qrCode.name}</AppText>
                    <AppText style={styles.qrCodeDescription}>{qrCode.description}</AppText>
                  </View>
                  <View style={styles.qrCodeActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handlePreviewQR(qrCode)}
                    >
                      <AppIcon name="Eye" size={20} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handlePreviewQR(qrCode)}
                    >
                      <AppIcon name="Printer" size={20} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteQR(qrCode.id)}
                    >
                      <AppIcon name="Trash2" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.qrCodeDetails}>
                  <View style={styles.qrCodeStats}>
                    <AppText style={styles.statText}>
                      Created: {new Date(qrCode.createdAt).toLocaleDateString()}
                    </AppText>
                    <AppText style={styles.statText}>
                      Scans: {qrCode.usageCount}{qrCode.maxUsage ? `/${qrCode.maxUsage}` : ''}
                    </AppText>
                    {qrCode.expiresAt && (
                      <AppText style={styles.statText}>
                        Expires: {new Date(qrCode.expiresAt).toLocaleDateString()}
                      </AppText>
                    )}
                  </View>

                  <View style={styles.qrCodeControls}>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        qrCode.isActive ? styles.activeButton : styles.inactiveButton
                      ]}
                      onPress={() => handleToggleActive(qrCode.id)}
                    >
                      <AppText style={[
                        styles.statusButtonText,
                        qrCode.isActive ? styles.activeButtonText : styles.inactiveButtonText
                      ]}>
                        {qrCode.isActive ? 'Active' : 'Inactive'}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={() => handleDownloadQR(qrCode)}
                    >
                      <AppIcon name="Download" size={20} color="#ffffff" />
                      <AppText style={styles.downloadButtonText}>Download</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <AppText style={styles.instructionsTitle}>How to Use QR Codes</AppText>
          <AppText style={styles.instructionsText}>
            📍 Attendance QR: Place at office entrances for attendance tracking{'\n'}
            👥 User Invite QR: Share with new employees to join the system{'\n'}
            📅 Event Invite QR: Share for event invitations and RSVPs{'\n\n'}
            • Download and print QR codes{'\n'}
            • Monitor usage and manage codes{'\n'}
            • All QR codes are secured and can only be generated by this app
          </AppText>
        </View>
      </ScrollView>

      <CreateQRModal />
      <QRCodePreview
        visible={showPreviewModal}
        qrCode={selectedQRCode}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedQRCode(null);
        }}
      />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
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
  addButton: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: '#2563eb',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  qrCodesSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  qrCodesList: {
    gap: 16,
  },
  qrCodeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  qrCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  qrCodeInfo: {
    flex: 1,
    marginRight: 12,
  },
  qrCodeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  qrCodeType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  qrCodeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  qrCodeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  qrCodeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  qrCodeDetails: {
    gap: 12,
  },
  qrCodeStats: {
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  qrCodeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeButton: {
    backgroundColor: '#e8f8ef',
  },
  inactiveButton: {
    backgroundColor: '#fdecec',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeButtonText: {
    color: '#10b981',
  },
  inactiveButtonText: {
    color: '#ef4444',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionsSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f7f7fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#2563eb',
  },
  modalContent: {
    flex: 1,
  },
  modalForm: {
    padding: 16,
    gap: 16,
  },
  modalInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  typeButtons: {
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
  },
  typeButtonActive: {
    backgroundColor: '#eaf2ff',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#2563eb',
  },
  typeButtonDesc: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  typeButtonDescActive: {
    color: '#3b82f6',
  },
  roleSelector: {
    marginBottom: 16,
  },
  roleSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#2563eb',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  roleButtonTextActive: {
    color: '#ffffff',
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#374151',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalSubmitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  modalSubmitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
