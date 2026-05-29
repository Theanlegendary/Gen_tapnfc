import { useCallback, useEffect, useState } from 'react';
import { getActiveBatchId, setActiveBatchId } from '@/src/services/activeBatchService';
import { getProductionBatch } from '@/src/services/productionService';
import { ProductionBatch } from '@/src/types/models';

export function useActiveBatch() {
  const [batchId, setBatchIdState] = useState<string | null>(null);
  const [batch, setBatch] = useState<ProductionBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const id = await getActiveBatchId();
      setBatchIdState(id);
      if (id) {
        const loaded = await getProductionBatch(id);
        setBatch(loaded);
        if (!loaded) {
          await setActiveBatchId(null);
          setBatchIdState(null);
        }
      } else {
        setBatch(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectBatch = useCallback(async (id: string) => {
    await setActiveBatchId(id);
    setBatchIdState(id);
    const loaded = await getProductionBatch(id);
    setBatch(loaded);
  }, []);

  const clearBatch = useCallback(async () => {
    await setActiveBatchId(null);
    setBatchIdState(null);
    setBatch(null);
  }, []);

  return {
    batchId,
    batch,
    isLoading,
    refresh,
    selectBatch,
    clearBatch,
    hasActiveBatch: Boolean(batchId && batch),
  };
}
