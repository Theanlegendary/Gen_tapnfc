export interface BaseNotification {
  id: string;
  type: 'user_invite' | 'attendance' | 'event' | 'qr_management' | 'general' | 'join_request';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId?: string;
  adminId?: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  metadata?: Record<string, any>;
  targetAudience: 'admin' | 'user'; // New field to differentiate
}

// Admin-specific Notifications
export interface AdminUserInviteNotification extends BaseNotification {
  type: 'user_invite';
  targetAudience: 'admin';
  metadata: {
    inviteId: string;
    userName: string;
    userEmail: string;
    organizationName: string;
    status: 'pending' | 'approved' | 'declined';
    role: 'user' | 'admin';
    requestedAt: string;
  };
}

export interface AdminAttendanceNotification extends BaseNotification {
  type: 'attendance';
  targetAudience: 'admin';
  metadata: {
    employeeId: string;
    employeeName: string;
    status: 'present' | 'late' | 'absent' | 'checkout';
    location: string;
    checkInTime?: string;
    checkOutTime?: string;
    isLateArrival?: boolean;
    missedCheckIn?: boolean;
  };
}

export interface AdminEventNotification extends BaseNotification {
  type: 'event';
  targetAudience: 'admin';
  metadata: {
    eventId: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    participantCount: number;
    maxParticipants?: number;
    rsvpType: 'new_rsvp' | 'rsvp_update' | 'event_reminder';
    location: string;
    recentRsvps?: string[]; // Recent participant names
  };
}

export interface AdminQRManagementNotification extends BaseNotification {
  type: 'qr_management';
  targetAudience: 'admin';
  metadata: {
    qrCodeId: string;
    qrCodeName: string;
    qrCodeType: 'user_invite' | 'attendance' | 'event_invite';
    usageCount: number;
    maxUsage?: number;
    expiresAt?: string;
    status: 'active' | 'expired' | 'deactivated' | 'near_expiry';
    alertType: 'usage_milestone' | 'expiry_warning' | 'deactivated';
    daysUntilExpiry?: number;
  };
}

// User-specific Notifications
export interface UserJoinRequestNotification extends BaseNotification {
  type: 'join_request';
  targetAudience: 'user';
  metadata: {
    requestId: string;
    organizationName: string;
    adminName: string;
    status: 'approved' | 'declined' | 'pending';
    role: 'user' | 'admin';
    processedAt?: string;
    reason?: string; // For declined requests
  };
}

export interface UserAttendanceNotification extends BaseNotification {
  type: 'attendance';
  targetAudience: 'user';
  metadata: {
    employeeId: string;
    status: 'success' | 'error' | 'invalid_qr';
    location?: string;
    checkInTime?: string;
    checkOutTime?: string;
    errorMessage?: string;
    attendanceType: 'check_in' | 'check_out';
  };
}

export interface UserEventNotification extends BaseNotification {
  type: 'event';
  targetAudience: 'user';
  metadata: {
    eventId: string;
    eventName: string;
    eventDescription: string;
    eventDate: string;
    eventTime: string;
    location: string;
    invitationType: 'invitation' | 'reminder' | 'update';
    rsvpStatus?: 'pending' | 'accepted' | 'declined';
    maxParticipants?: number;
    currentParticipants: number;
    hoursUntilEvent?: number;
  };
}

export interface UserGeneralNotification extends BaseNotification {
  type: 'general';
  targetAudience: 'user';
  metadata: {
    category: 'app_update' | 'announcement' | 'maintenance' | 'feature';
    version?: string;
    updateRequired?: boolean;
    announcementType?: 'info' | 'warning' | 'success';
    maintenanceWindow?: string;
    featureName?: string;
  };
}

export type AdminNotification = 
  | AdminUserInviteNotification 
  | AdminAttendanceNotification 
  | AdminEventNotification 
  | AdminQRManagementNotification;

export type UserNotification = 
  | UserJoinRequestNotification 
  | UserAttendanceNotification 
  | UserEventNotification 
  | UserGeneralNotification;

export type AppNotification = AdminNotification | UserNotification;

export interface NotificationContextType {
  notifications: AppNotification[];
  adminNotifications: AdminNotification[];
  userNotifications: UserNotification[];
  unreadCount: number;
  adminUnreadCount: number;
  userUnreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (audience?: 'admin' | 'user') => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: (audience?: 'admin' | 'user') => void;
  getNotificationsByType: (type: AppNotification['type'], audience?: 'admin' | 'user') => AppNotification[];
  getNotificationsByAudience: (audience: 'admin' | 'user') => AppNotification[];
  getNotificationsByDateRange: (range: 'today' | 'week' | 'month' | 'year', audience?: 'admin' | 'user') => AppNotification[];
  getUpcomingNotifications: (audience?: 'admin' | 'user') => AppNotification[];
}