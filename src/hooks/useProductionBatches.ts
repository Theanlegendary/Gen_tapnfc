import { useEffect, useState } from 'react';
import { subscribeProductionBatches } from '@/src/services/productionService';
import { ProductionBatch } from '@/src/types/models';
import { useAuth } from '@/src/hooks/useAuth';
import { getAuthErrorMessage } from '@/src/services/authService';

export function useProductionBatches() {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.isGuest) {
      setBatches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeProductionBatches(
      user.branch,
      (next) => {
        setBatches(next);
        setIsLoading(false);
      },
      (err) => {
        setError(getAuthErrorMessage(err));
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.id, user?.branch, user?.isGuest]);

  return { batches, isLoading, error };
}
