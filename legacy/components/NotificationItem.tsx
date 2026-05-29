import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AppIcon, AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppNotification } from '@/types/notifications';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationItemProps {
  notification: AppNotification;
  onPress?: () => void;
}

export default function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'user_invite':
        return 'UserPlus' as AppIconName;
      case 'join_request':
        return 'Users' as AppIconName;
      case 'attendance':
        return 'Clock' as AppIconName;
      case 'event':
        return 'Calendar' as AppIconName;
      case 'qr_management':
        return 'QrCode' as AppIconName;
      case 'general':
        return 'Info' as AppIconName;
      default:
        return 'Bell' as AppIconName;
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'user_invite':
      case 'join_request':
        return '#1877f2';
      case 'attendance':
        return notification.metadata?.status === 'success' ? '#42b883' : 
               notification.metadata?.status === 'late' ? '#ff6b35' : '#1877f2';
      case 'event':
        return '#8b5cf6';
      case 'qr_management':
        return '#f59e0b';
      case 'general':
        return '#6b7280';
      default:
        return '#1877f2';
    }
  };

  const getAvatarBackground = () => {
    switch (notification.type) {
      case 'user_invite':
      case 'join_request':
        return '#e3f2fd';
      case 'attendance':
        return '#e8f5e8';
      case 'event':
        return '#f3e5f5';
      case 'qr_management':
        return '#fff3e0';
      case 'general':
        return '#f5f5f5';
      default:
        return '#e3f2fd';
    }
  };

  const getStatusIcon = () => {
    if (notification.type === 'user_invite' || notification.type === 'join_request') {
      const status = notification.metadata?.status;
      switch (status) {
        case 'approved':
          return { icon: 'CircleCheck' as AppIconName, color: '#42b883' };
        case 'declined':
        case 'rejected':
          return { icon: 'Circle' as AppIconName, color: '#e74c3c' };
        default:
          return { icon: 'Clock' as AppIconName, color: '#f39c12' };
      }
    }
    
    if (notification.type === 'attendance') {
      const status = notification.metadata?.status;
      switch (status) {
        case 'success':
        case 'present':
          return { icon: 'CircleCheck' as AppIconName, color: '#42b883' };
        case 'late':
          return { icon: 'TriangleAlert' as AppIconName, color: '#ff6b35' };
        case 'error':
        case 'invalid_qr':
          return { icon: 'Circle' as AppIconName, color: '#e74c3c' };
        default:
          return { icon: 'Clock' as AppIconName, color: '#1877f2' };
      }
    }

    if (notification.type === 'event') {
      const rsvpStatus = notification.metadata?.rsvpStatus;
      switch (rsvpStatus) {
        case 'accepted':
          return { icon: 'CircleCheck' as AppIconName, color: '#42b883' };
        case 'declined':
          return { icon: 'Circle' as AppIconName, color: '#e74c3c' };
        default:
          return { icon: 'Calendar' as AppIconName, color: '#8b5cf6' };
      }
    }

    return null;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w`;
    
    return notificationDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handlePress = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onPress?.();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteNotification(notification.id)
        },
      ]
    );
  };

  const handleMoreOptions = () => {
    Alert.alert(
      'Notification Options',
      'Choose an action:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: notification.isRead ? 'Mark as Unread' : 'Mark as Read',
          onPress: () => markAsRead(notification.id)
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: handleDelete
        },
      ]
    );
  };

  const notificationIcon = getNotificationIcon();
  const statusIcon = getStatusIcon();
  const iconColor = getIconColor();
  const avatarBackground = getAvatarBackground();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.isRead && styles.unreadContainer
      ]}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      {/* Left: Enhanced Avatar */}
      <View style={styles.leftSection}>
        <View style={[styles.avatarContainer, { backgroundColor: avatarBackground }]}>
          <AppIcon name={notificationIcon} size={20} color={iconColor} />
          {statusIcon && (
            <View style={[styles.statusBadge, { backgroundColor: statusIcon.color }]}>
              <AppIcon name={statusIcon.icon} size={20} color="#ffffff" />
            </View>
          )}
        </View>
        {!notification.isRead && <View style={styles.unreadDot} />}
      </View>

      {/* Center: Enhanced Content */}
      <View style={styles.contentSection}>
        <View style={styles.headerRow}>
          <AppText variant="body" style={[
            styles.title,
            !notification.isRead && styles.unreadTitle
          ]} numberOfLines={1}>
            {notification.title}
          </AppText>
          
          <View style={styles.rightSection}>
            <AppText variant="caption" tone="muted" style={styles.timeAgo}>
              {formatTimeAgo(notification.createdAt)}
            </AppText>
          </View>
        </View>

        <AppText variant="body" tone="muted" style={[
          styles.message,
          !notification.isRead && styles.unreadMessage
        ]} numberOfLines={2}>
          {notification.message}
        </AppText>

        {/* Enhanced metadata display */}
        {notification.metadata && (
          <View style={styles.metadataContainer}>
            {notification.type === 'user_invite' && notification.targetAudience === 'admin' && (
              <View style={styles.metadataRow}>
                <View style={styles.metadataChip}>
                  <AppText variant="caption" tone="muted" style={styles.metadataText}>{notification.metadata.userEmail}</AppText>
                </View>
                <View style={[styles.metadataChip, styles.roleChip]}>
                  <AppText variant="caption" style={styles.roleText}>
                    {notification.metadata.role?.toUpperCase()}
                  </AppText>
                </View>
              </View>
            )}

            {notification.type === 'join_request' && notification.targetAudience === 'user' && (
              <View style={styles.metadataRow}>
                <View style={styles.metadataChip}>
                  <AppText variant="caption" tone="muted" style={styles.metadataText}>{notification.metadata.organizationName}</AppText>
                </View>
                <View style={styles.metadataChip}>
                  <AppText variant="caption" tone="muted" style={styles.metadataText}>by {notification.metadata.adminName}</AppText>
                </View>
              </View>
            )}

            {notification.type === 'attendance' && (
              <View style={styles.metadataRow}>
                {notification.metadata.location && (
                  <View style={styles.metadataChip}>
                    <AppIcon name="MapPin" size={20} color="#6b7280" />
                    <AppText variant="caption" tone="muted" style={styles.metadataText}>{notification.metadata.location}</AppText>
                  </View>
                )}
                {notification.metadata.checkInTime && (
                  <View style={styles.metadataChip}>
                    <AppIcon name="Clock" size={20} color="#6b7280" />
                    <AppText variant="caption" tone="muted" style={styles.metadataText}>{notification.metadata.checkInTime}</AppText>
                  </View>
                )}
              </View>
            )}

            {notification.type === 'event' && (
              <View style={styles.metadataRow}>
                <View style={styles.metadataChip}>
                  <AppIcon name="Calendar" size={20} color="#6b7280" />
                  <AppText variant="caption" tone="muted" style={styles.metadataText}>
                    {notification.metadata.eventDate}
                  </AppText>
                </View>
                {notification.metadata.location && (
                  <View style={styles.metadataChip}>
                    <AppIcon name="MapPin" size={20} color="#6b7280" />
                    <AppText variant="caption" tone="muted" style={styles.metadataText}>{notification.metadata.location}</AppText>
                  </View>
                )}
              </View>
            )}

            {notification.type === 'qr_management' && notification.targetAudience === 'admin' && (
              <View style={styles.metadataRow}>
                <View style={styles.metadataChip}>
                  <AppText variant="caption" tone="muted" style={styles.metadataText}>{notification.metadata.qrCodeType}</AppText>
                </View>
                <View style={styles.metadataChip}>
                  <AppText variant="caption" tone="muted" style={styles.metadataText}>{notification.metadata.usageCount} scans</AppText>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* More options button */}
      <TouchableOpacity
        style={styles.moreButton}
        onPress={handleMoreOptions}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <AppIcon name="MoreHorizontal" size={20} color="#9ca3af" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
    alignItems: 'flex-start',
    minHeight: 72,
  },
  unreadContainer: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  leftSection: {
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
    paddingTop: 2,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  contentSection: {
    flex: 1,
    paddingTop: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
    minWidth: 28,
    textAlign: 'right',
  },
  message: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  unreadMessage: {
    color: '#4b5563',
    fontWeight: '500',
  },
  metadataContainer: {
    marginTop: 2,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  metadataChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  roleChip: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  metadataText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  roleText: {
    fontSize: 10,
    color: '#1e40af',
    fontWeight: '700',
  },
  moreButton: {
    padding: 8,
    marginTop: -4,
    marginRight: -4,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
});
