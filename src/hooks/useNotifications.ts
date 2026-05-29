import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppNotification } from '@/src/types/models';
import { markNotificationRead, subscribeNotifications } from '@/src/services/firestoreService';
import { useAuth } from '@/src/hooks/useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uid = user?.id ?? '';
    const unsubscribe = subscribeNotifications(
      uid,
      (next) => {
        setItems(next);
        setError(null);
      },
      (err) => setError(err.message)
    );

    return unsubscribe;
  }, [user?.id]);

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const markRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update notification.');
    }
  }, []);

  return { items, unreadCount, error, markRead };
}
