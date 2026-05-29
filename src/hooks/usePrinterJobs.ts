import { useEffect, useState } from 'react';
import { subscribePrinterJobs } from '@/src/services/firestoreService';
import { PrinterJob } from '@/src/types/models';
import { useAuth } from '@/src/hooks/useAuth';
import { useActiveBatch } from '@/src/hooks/useActiveBatch';
import { getAuthErrorMessage } from '@/src/services/authService';

export function usePrinterJobs() {
  const [jobs, setJobs] = useState<PrinterJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { batchId } = useActiveBatch();

  useEffect(() => {
    setJobs([]);
    setError(null);

    if (!user || user.isGuest) {
      setIsLoading(false);
      return;
    }

    if (!batchId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribePrinterJobs(
      user.role,
      user.id,
      (next) => {
        setJobs(next);
        setIsLoading(false);
      },
      (err) => {
        setError(getAuthErrorMessage(err));
        setIsLoading(false);
      },
      batchId
    );

    return unsubscribe;
  }, [user, batchId]);

  return { jobs, isLoading, error, batchId };
}
