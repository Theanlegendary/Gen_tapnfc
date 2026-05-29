export interface BaseQRData {
  id: string;
  type: 'user_invite' | 'attendance' | 'event_invite';
  appSignature: string; // Security signature to prevent external QR creation
  createdAt: string;
  expiresAt?: string;
  createdBy: string; // Admin ID
}

export interface UserInviteQRData extends BaseQRData {
  type: 'user_invite';
  inviteCode: string;
  organizationName: string;
  adminName: string;
  role: 'user' | 'admin';
  permissions?: string[];
}

export interface AttendanceQRData extends BaseQRData {
  type: 'attendance';
  locationId: string;
  locationName: string;
  officeId: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  workingHours: {
    start: string;
    end: string;
  };
}

export interface EventInviteQRData extends BaseQRData {
  type: 'event_invite';
  eventId: string;
  eventName: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  location: string;
  maxParticipants?: number;
  currentParticipants: number;
}

export type QRCodeData = UserInviteQRData | AttendanceQRData | EventInviteQRData;

export interface QRCodeRecord {
  id: string;
  type: 'user_invite' | 'attendance' | 'event_invite';
  name: string;
  description: string;
  qrData: QRCodeData;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

export interface UserInviteNotification {
  id: string;
  userId: string;
  inviteCode: string;
  organizationName: string;
  adminName: string;
  role: 'user' | 'admin';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export interface EventInviteNotification {
  id: string;
  userId: string;
  eventId: string;
  eventName: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  location: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}