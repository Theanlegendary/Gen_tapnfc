import { generateSecureQRData } from './qrSecurity';
import { 
  AttendanceGroup, 
  GroupInviteQRData, 
  GroupAttendanceQRData, 
  GroupAttendanceQR,
  GroupRules 
} from '@/types/groups';

// Generate a secure secret key for the group
export const generateGroupSecretKey = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 12);
  return `GRP_${timestamp}_${random}`.toUpperCase();
};

// Generate Group Invite QR Code
export const generateGroupInviteQR = (
  groupName: string,
  groupDescription: string,
  adminId: string,
  adminName: string,
  rules: GroupRules,
  maxMembers?: number,
  validUntilDays: number = 30
): { group: AttendanceGroup; qrData: string } => {
  const secretKey = generateGroupSecretKey();
  const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validUntilDays);

  // Create the group
  const group: AttendanceGroup = {
    id: groupId,
    name: groupName,
    description: groupDescription,
    secretKey,
    adminId,
    adminName,
    rules,
    isActive: true,
    memberCount: 0,
    maxMembers,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeDates: {
      startDate: new Date().toISOString(),
      endDate: validUntil.toISOString(),
    },
  };

  // Create QR data for group invite
  const baseQRData: Partial<GroupInviteQRData> = {
    type: 'group_invite',
    groupId,
    groupName,
    groupDescription,
    secretKey,
    adminId,
    adminName,
    rules,
    maxMembers,
    currentMembers: 0,
    validUntil: validUntil.toISOString(),
  };

  const qrData = generateSecureQRData(baseQRData, adminId) as GroupInviteQRData;
  
  return {
    group,
    qrData: JSON.stringify(qrData),
  };
};

// Generate Group Attendance QR Code
export const generateGroupAttendanceQR = (
  group: AttendanceGroup,
  title: string,
  description: string,
  attendanceType: 'daily' | 'weekly' | 'monthly' | 'event',
  validFrom: string,
  validUntil: string,
  attendanceWindow: { startTime: string; endTime: string },
  location?: string,
  maxScans?: number
): GroupAttendanceQR => {
  const attendanceId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  
  const baseQRData: Partial<GroupAttendanceQRData> = {
    type: 'group_attendance',
    groupId: group.id,
    groupSecretKey: group.secretKey,
    attendanceId,
    title,
    validFrom,
    validUntil,
    attendanceWindow,
    location,
  };

  const qrData = generateSecureQRData(baseQRData, group.adminId) as GroupAttendanceQRData;

  return {
    id: qrData.id,
    groupId: group.id,
    groupName: group.name,
    title,
    description,
    qrData,
    isActive: true,
    attendanceType,
    validFrom,
    validUntil,
    scanCount: 0,
    maxScans,
    createdBy: group.adminId,
    createdAt: qrData.createdAt,
  };
};

// Generate Quick Attendance QR Codes
export const generateQuickAttendanceQRs = (
  group: AttendanceGroup,
  type: 'today' | 'this_week' | 'this_month'
): GroupAttendanceQR[] => {
  const now = new Date();
  const qrCodes: GroupAttendanceQR[] = [];

  switch (type) {
    case 'today':
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      qrCodes.push(generateGroupAttendanceQR(
        group,
        `Daily Attendance - ${now.toLocaleDateString()}`,
        `Daily attendance for ${group.name}`,
        'daily',
        todayStart.toISOString(),
        todayEnd.toISOString(),
        group.rules.attendanceWindow,
        'Office Location'
      ));
      break;

    case 'this_week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      qrCodes.push(generateGroupAttendanceQR(
        group,
        `Weekly Attendance - Week of ${weekStart.toLocaleDateString()}`,
        `Weekly attendance for ${group.name}`,
        'weekly',
        weekStart.toISOString(),
        weekEnd.toISOString(),
        group.rules.attendanceWindow,
        'Office Location'
      ));
      break;

    case 'this_month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      qrCodes.push(generateGroupAttendanceQR(
        group,
        `Monthly Attendance - ${monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        `Monthly attendance for ${group.name}`,
        'monthly',
        monthStart.toISOString(),
        monthEnd.toISOString(),
        group.rules.attendanceWindow,
        'Office Location'
      ));
      break;
  }

  return qrCodes;
};

// Validate Group Invite QR
export const validateGroupInviteQR = (qrData: GroupInviteQRData): boolean => {
  // Check if group invite is still valid
  if (qrData.validUntil && new Date() > new Date(qrData.validUntil)) {
    return false;
  }

  // Check if group has reached max capacity
  if (qrData.maxMembers && qrData.currentMembers >= qrData.maxMembers) {
    return false;
  }

  return true;
};

// Validate Group Attendance QR
export const validateGroupAttendanceQR = (
  qrData: GroupAttendanceQRData,
  userGroupMembership: any
): { isValid: boolean; reason?: string } => {
  const now = new Date();

  // Check if QR is within valid time range
  if (now < new Date(qrData.validFrom) || now > new Date(qrData.validUntil)) {
    return { isValid: false, reason: 'QR code is not valid at this time' };
  }

  // Check if user is a member of the group
  if (!userGroupMembership || userGroupMembership.status !== 'approved') {
    return { isValid: false, reason: 'You are not a member of this group' };
  }

  // Check if within attendance window
  const currentTime = now.toTimeString().substr(0, 5); // HH:MM format
  if (currentTime < qrData.attendanceWindow.startTime || currentTime > qrData.attendanceWindow.endTime) {
    return { 
      isValid: false, 
      reason: `Attendance window is ${qrData.attendanceWindow.startTime} - ${qrData.attendanceWindow.endTime}` 
    };
  }

  return { isValid: true };
};

// Sample group configurations
export const createSampleGroups = (adminId: string, adminName: string) => {
  const defaultRules: GroupRules = {
    allowLateJoining: true,
    requireApproval: true,
    attendanceWindow: {
      startTime: '08:00',
      endTime: '18:00',
    },
    lateThresholdMinutes: 15,
    allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  };

  return [
    {
      name: 'Software Development Team',
      description: 'Daily attendance for software developers and engineers',
      rules: defaultRules,
      maxMembers: 25,
    },
    {
      name: 'Marketing Department',
      description: 'Marketing team attendance tracking',
      rules: {
        ...defaultRules,
        attendanceWindow: { startTime: '09:00', endTime: '17:00' },
        lateThresholdMinutes: 10,
      },
      maxMembers: 15,
    },
    {
      name: 'Executive Team',
      description: 'Senior management attendance',
      rules: {
        ...defaultRules,
        requireApproval: true,
        attendanceWindow: { startTime: '08:30', endTime: '18:30' },
        lateThresholdMinutes: 5,
      },
      maxMembers: 10,
    },
  ].map(groupConfig => generateGroupInviteQR(
    groupConfig.name,
    groupConfig.description,
    adminId,
    adminName,
    groupConfig.rules,
    groupConfig.maxMembers
  ));
};