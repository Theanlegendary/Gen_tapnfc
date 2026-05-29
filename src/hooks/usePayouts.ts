import { useCallback, useEffect, useState } from 'react';
import { listPayouts } from '@/src/services/firestoreService';
import { Payout } from '@/src/types/models';
import { getAuthErrorMessage } from '@/src/services/authService';

export function usePayouts(userId: string) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || userId === 'guest') {
      setPayouts([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await listPayouts(userId);
      setPayouts(result);
    } catch (err) {
      setPayouts([]);
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setPayouts([]);
    refresh();
  }, [refresh]);

  return { payouts, isLoading, error, refresh };
}
