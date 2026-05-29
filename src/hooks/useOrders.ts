import { useCallback, useEffect, useState } from 'react';
import { CreateOrderInput, createOrder, listOrders } from '@/src/services/firestoreService';
import { Order, UserRole } from '@/src/types/models';
import { getAuthErrorMessage } from '@/src/services/authService';

export function useOrders(role: UserRole, userId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || userId === 'guest' || role === 'guest') {
      setOrders([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await listOrders(role, userId);
      setOrders(result);
    } catch (err) {
      setOrders([]);
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [role, userId]);

  useEffect(() => {
    setOrders([]);
    refresh();
  }, [refresh]);

  const submitOrder = useCallback(
    async (input: CreateOrderInput) => {
      setError(null);
      await createOrder(input);
      await refresh();
    },
    [refresh]
  );

  return { orders, isLoading, error, refresh, submitOrder };
}
