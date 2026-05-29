import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppNotification, NotificationContextType } from '@/types/notifications';
import { useAuth } from './AuthContext';
import { FirebaseService } from '@/services/firebaseService';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsub = FirebaseService.subscribeNotifications(user.id, user.role, (items) => {
      setNotifications(items);
    });

    return unsub;
  }, [user?.id, user?.role]);

  const addNotification = (notification: Omit<AppNotification, 'id' | 'createdAt'>) => {
    FirebaseService.createNotification(notification).catch(() => undefined);
  };

  const markAsRead = (notificationId: string) => {
    FirebaseService.markNotificationRead(notificationId).catch(() => undefined);
  };

  const markAllAsRead = (audience?: 'admin' | 'user') => {
    if (!user) return;
    if (audience && audience !== (user.role === 'user' ? 'user' : 'admin')) return;
    FirebaseService.markAllNotificationsRead(user.id, user.role).catch(() => undefined);
  };

  const deleteNotification = (notificationId: string) => {
    FirebaseService.deleteNotification(notificationId).catch(() => undefined);
  };

  const clearAllNotifications = (audience?: 'admin' | 'user') => {
    const filtered = notifications.filter((n) => !audience || n.targetAudience === audience);
    filtered.forEach((n) => FirebaseService.deleteNotification(n.id).catch(() => undefined));
  };

  const getNotificationsByType = (type: AppNotification['type'], audience?: 'admin' | 'user') => {
    return notifications.filter((n) => n.type === type && (!audience || n.targetAudience === audience));
  };

  const getNotificationsByAudience = (audience: 'admin' | 'user') => {
    return notifications.filter((n) => n.targetAudience === audience);
  };

  const getNotificationsByDateRange = (range: 'today' | 'week' | 'month' | 'year', audience?: 'admin' | 'user') => {
    const now = new Date();
    const start = new Date(now);
    if (range === 'today') start.setHours(0, 0, 0, 0);
    if (range === 'week') start.setDate(now.getDate() - 7);
    if (range === 'month') start.setMonth(now.getMonth() - 1);
    if (range === 'year') start.setFullYear(now.getFullYear() - 1);

    return notifications.filter((n) => {
      const created = new Date(n.createdAt);
      const audienceMatch = audience ? n.targetAudience === audience : true;
      return audienceMatch && created >= start;
    });
  };

  const getUpcomingNotifications = (audience?: 'admin' | 'user') => {
    return notifications.filter((n) => {
      if (n.type !== 'event' || !n.metadata?.eventDate) return false;
      const audienceMatch = audience ? n.targetAudience === audience : true;
      return audienceMatch && new Date(n.metadata.eventDate) > new Date();
    });
  };

  const adminNotifications = useMemo(() => getNotificationsByAudience('admin'), [notifications]);
  const userNotifications = useMemo(() => getNotificationsByAudience('user'), [notifications]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const adminUnreadCount = adminNotifications.filter((n) => !n.isRead).length;
  const userUnreadCount = userNotifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        adminNotifications: adminNotifications as any,
        userNotifications: userNotifications as any,
        unreadCount,
        adminUnreadCount,
        userUnreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        getNotificationsByType,
        getNotificationsByAudience,
        getNotificationsByDateRange,
        getUpcomingNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
