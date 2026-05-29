import { generateSecureQRData } from './qrSecurity';
import { UserInviteQRData, AttendanceQRData, EventInviteQRData, QRCodeRecord } from '@/src/types/qr';

// Generate User Invite QR Code
export const generateUserInviteQR = (
  organizationName: string,
  adminName: string,
  adminId: string,
  role: 'user' | 'admin' = 'user',
  expiresInDays: number = 7
): QRCodeRecord => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  const inviteCode = `INV_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  const baseData: Partial<UserInviteQRData> = {
    type: 'user_invite',
    inviteCode,
    organizationName,
    adminName,
    role,
    expiresAt: expiresAt.toISOString(),
  };
  
  const qrData = generateSecureQRData(baseData, adminId) as UserInviteQRData;
  
  return {
    id: qrData.id,
    type: 'user_invite',
    name: `User Invite - ${role.toUpperCase()}`,
    description: `Invite new ${role} to join ${organizationName}`,
    qrData,
    isActive: true,
    usageCount: 0,
    maxUsage: role === 'admin' ? 1 : undefined, // Admin invites are single-use
    createdBy: adminId,
    createdAt: qrData.createdAt,
    expiresAt: qrData.expiresAt,
  };
};

// Generate Attendance QR Code
export const generateAttendanceQR = (
  locationName: string,
  officeId: string,
  adminId: string,
  address?: string,
  coordinates?: { latitude: number; longitude: number },
  workingHours: { start: string; end: string } = { start: '09:00', end: '17:00' }
): QRCodeRecord => {
  const locationId = `LOC_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  const baseData: Partial<AttendanceQRData> = {
    type: 'attendance',
    locationId,
    locationName,
    officeId,
    coordinates,
    workingHours,
  };
  
  const qrData = generateSecureQRData(baseData, adminId) as AttendanceQRData;

  return {
    id: qrData.id,
    type: 'attendance',
    name: `Attendance - ${locationName}`,
    description: `Attendance tracking for ${locationName}${address ? ` at ${address}` : ''}`,
    qrData,
    isActive: true,
    usageCount: 0,
    createdBy: adminId,
    createdAt: qrData.createdAt,
  };
};

// Generate Event Invite QR Code
export const generateEventInviteQR = (
  eventName: string,
  eventDescription: string,
  eventDate: string,
  eventTime: string,
  location: string,
  adminId: string,
  maxParticipants?: number,
  expiresAt?: string
): QRCodeRecord => {
  const eventId = `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  const baseData: Partial<EventInviteQRData> = {
    type: 'event_invite',
    eventId,
    eventName,
    eventDescription,
    eventDate,
    eventTime,
    location,
    maxParticipants,
    currentParticipants: 0,
    expiresAt,
  };
  
  const qrData = generateSecureQRData(baseData, adminId) as EventInviteQRData;
  
  return {
    id: qrData.id,
    type: 'event_invite',
    name: `Event - ${eventName}`,
    description: `Invitation to ${eventName} on ${eventDate}`,
    qrData,
    isActive: true,
    usageCount: 0,
    maxUsage: maxParticipants,
    createdBy: adminId,
    createdAt: qrData.createdAt,
    expiresAt,
  };
};

// Legacy function for backward compatibility
export const generateOfficeQRData = (
  officeId: string,
  locationName: string,
  adminId: string = 'legacy'
): any => {
  return {
    officeId,
    locationName,
    address: 'Legacy Office Address',
    workingHours: {
      start: '09:00',
      end: '17:00',
    },
    type: 'checkin',
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

// Sample QR codes for testing
export const generateSampleQRCodes = (adminId: string) => {
  return {
    user_invite: generateUserInviteQR('Mahaka Solutions', 'Admin User', adminId, 'user'),
    attendance: generateAttendanceQR('Main Entrance', 'OFFICE_001', adminId),
    event_invite: generateEventInviteQR(
      'Team Meeting',
      'Monthly team sync and planning session',
      '2025-02-01',
      '10:00',
      'Conference Room A',
      adminId,
      20
    ),
  };
};

// Get test QR code data
export const getTestQRCode = (type: 'user_invite' | 'attendance' | 'event_invite' = 'attendance'): string => {
  const samples = generateSampleQRCodes('admin-test');
  return JSON.stringify(samples[type].qrData);
};
