import { 
  GroupInviteQRData, 
  GroupAttendanceQRData, 
  GroupJoinRequest, 
  GroupAttendanceRecord 
} from '@/types/groups';
import { validateAppSignature, validateQRCodeStructure, isQRCodeExpired } from './qrSecurity';

// Parse and validate group QR codes
export const parseGroupQRCode = (data: string): GroupInviteQRData | GroupAttendanceQRData | null => {
  try {
    const parsed = JSON.parse(data);
    
    // Validate structure
    if (!validateQRCodeStructure(parsed)) {
      return null;
    }
    
    // Validate app signature
    if (!validateAppSignature(parsed)) {
      return null;
    }
    
    // Check expiration
    if (isQRCodeExpired(parsed)) {
      return null;
    }
    
    // Validate group-specific fields
    if (parsed.type === 'group_invite') {
      if (!parsed.groupId || !parsed.secretKey || !parsed.groupName) {
        return null;
      }
      return parsed as GroupInviteQRData;
    }
    
    if (parsed.type === 'group_attendance') {
      if (!parsed.groupId || !parsed.groupSecretKey || !parsed.attendanceId) {
        return null;
      }
      return parsed as GroupAttendanceQRData;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// Create join request from group invite QR
export const createJoinRequest = (
  qrData: GroupInviteQRData,
  userId: string,
  userEmail: string,
  userName: string,
  employeeId: string
): GroupJoinRequest => {
  return {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    groupId: qrData.groupId,
    groupName: qrData.groupName,
    userId,
    userEmail,
    userName,
    employeeId,
    secretKey: qrData.secretKey,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
};

// Record group attendance
export const recordGroupAttendance = (
  qrData: GroupAttendanceQRData,
  userId: string,
  userEmail: string,
  userName: string,
  employeeId: string,
  location?: string
): GroupAttendanceRecord => {
  const now = new Date();
  const currentTime = now.toTimeString().substr(0, 5); // HH:MM format
  
  // Determine attendance status
  let status: 'present' | 'late' | 'early' = 'present';
  
  if (currentTime < qrData.attendanceWindow.startTime) {
    status = 'early';
  } else if (currentTime > qrData.attendanceWindow.endTime) {
    status = 'late';
  }

  return {
    id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    groupId: qrData.groupId,
    attendanceQRId: qrData.attendanceId,
    userId,
    userEmail,
    userName,
    employeeId,
    scannedAt: now.toISOString(),
    status,
    location: location || qrData.location,
    notes: status === 'early' ? 'Checked in early' : status === 'late' ? 'Checked in late' : undefined,
  };
};

// Validate user's group membership
export const validateGroupMembership = (
  groupId: string,
  userId: string,
  mockMemberships: any[] = []
): { isMember: boolean; status?: string; reason?: string } => {
  // In production, this would query the database
  // For now, we'll simulate membership validation
  
  const membership = mockMemberships.find(m => m.groupId === groupId && m.userId === userId);
  
  if (!membership) {
    return { 
      isMember: false, 
      reason: 'You are not a member of this group. Please scan the group invite QR first.' 
    };
  }
  
  if (membership.status !== 'approved') {
    return { 
      isMember: false, 
      status: membership.status,
      reason: membership.status === 'pending' 
        ? 'Your join request is pending admin approval'
        : 'Your group membership was rejected'
    };
  }
  
  return { isMember: true, status: 'approved' };
};

// Check if attendance window is active
export const isAttendanceWindowActive = (
  attendanceWindow: { startTime: string; endTime: string },
  currentTime?: Date
): { isActive: boolean; reason?: string } => {
  const now = currentTime || new Date();
  const currentTimeStr = now.toTimeString().substr(0, 5); // HH:MM format
  
  if (currentTimeStr < attendanceWindow.startTime) {
    return { 
      isActive: false, 
      reason: `Attendance window opens at ${attendanceWindow.startTime}` 
    };
  }
  
  if (currentTimeStr > attendanceWindow.endTime) {
    return { 
      isActive: false, 
      reason: `Attendance window closed at ${attendanceWindow.endTime}` 
    };
  }
  
  return { isActive: true };
};

// Get attendance status message
export const getGroupAttendanceMessage = (
  status: 'present' | 'late' | 'early',
  groupName: string
): string => {
  switch (status) {
    case 'present':
      return `Perfect timing! Your attendance for ${groupName} has been recorded.`;
    case 'early':
      return `You're early! Your attendance for ${groupName} has been recorded.`;
    case 'late':
      return `You're checking in late for ${groupName}. Please try to arrive on time.`;
    default:
      return `Attendance recorded for ${groupName}.`;
  }
};

// Mock data for testing
export const getMockGroupMemberships = (userId: string) => [
  {
    id: 'member-1',
    groupId: 'group-1',
    userId,
    status: 'approved',
    joinedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'member-2',
    groupId: 'group-2',
    userId,
    status: 'pending',
    joinedAt: '2025-01-19T00:00:00Z',
  },
];