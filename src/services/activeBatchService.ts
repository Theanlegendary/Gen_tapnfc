import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_BATCH_KEY = 'sitehub_active_batch_v1';

export async function getActiveBatchId(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(ACTIVE_BATCH_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export async function setActiveBatchId(batchId: string | null): Promise<void> {
  if (!batchId?.trim()) {
    await AsyncStorage.removeItem(ACTIVE_BATCH_KEY);
    return;
  }
  await AsyncStorage.setItem(ACTIVE_BATCH_KEY, batchId.trim());
}

export async function clearActiveBatchId(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_BATCH_KEY);
}
