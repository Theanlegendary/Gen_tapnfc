import { useEffect, useState } from 'react';
import { subscribeBatchPrinterJobs } from '@/src/services/productionService';
import { PrinterJob } from '@/src/types/models';
import { useActiveBatch } from '@/src/hooks/useActiveBatch';
import { getAuthErrorMessage } from '@/src/services/authService';

export function useBatchPrinterJobs() {
  const { batchId } = useActiveBatch();
  const [jobs, setJobs] = useState<PrinterJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) {
      setJobs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeBatchPrinterJobs(
      batchId,
      (next) => {
        setJobs(next);
        setIsLoading(false);
      },
      (err) => {
        setError(getAuthErrorMessage(err));
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [batchId]);

  return { jobs, isLoading, error, batchId };
}
