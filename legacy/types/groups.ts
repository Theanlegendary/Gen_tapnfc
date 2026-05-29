export interface AttendanceGroup {
  id: string;
  name: string;
  description: string;
  secretKey: string;
  adminId: string;
  adminName: string;
  rules: GroupRules;
  isActive: boolean;
  memberCount: number;
  maxMembers?: number;
  createdAt: string;
  updatedAt: string;
  activeDates: {
    startDate: string;
    endDate?: string;
  };
}

export interface GroupRules {
  allowLateJoining: boolean;
  requireApproval: boolean;
  attendanceWindow: {
    startTime: string;
    endTime: string;
  };
  lateThresholdMinutes: number;
  allowedDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  userEmail: string;
  userName: string;
  employeeId: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  joinedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  role: 'member' | 'moderator';
}

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  groupName: string;
  adminId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  employeeId: string;
  secretKey: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  adminMessage?: string;
}

export interface GroupAttendanceQR {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  description: string;
  qrData: GroupAttendanceQRData;
  isActive: boolean;
  attendanceType: 'daily' | 'weekly' | 'monthly' | 'event';
  validFrom: string;
  validUntil: string;
  scanCount: number;
  maxScans?: number;
  createdBy: string;
  createdAt: string;
}

export interface GroupAttendanceQRData {
  id: string;
  type: 'group_attendance';
  groupId: string;
  groupSecretKey: string;
  attendanceId: string;
  title: string;
  validFrom: string;
  validUntil: string;
  attendanceWindow: {
    startTime: string;
    endTime: string;
  };
  location?: string;
  appSignature: string;
  createdAt: string;
  createdBy: string;
}

export interface GroupInviteQRData {
  id: string;
  type: 'group_invite';
  groupId: string;
  groupName: string;
  groupDescription: string;
  secretKey: string;
  adminId: string;
  adminName: string;
  rules: GroupRules;
  maxMembers?: number;
  currentMembers: number;
  validUntil?: string;
  appSignature: string;
  createdAt: string;
}

export interface GroupAttendanceRecord {
  id: string;
  groupId: string;
  attendanceQRId: string;
  userId: string;
  userEmail: string;
  userName: string;
  employeeId: string;
  scannedAt: string;
  status: 'present' | 'late' | 'early';
  location?: string;
  notes?: string;
}
