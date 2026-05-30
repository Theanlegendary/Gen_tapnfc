import { doc, getDoc } from 'firebase/firestore';
import { firebaseCollections } from '@/src/constants/collections';
import { db } from '@/src/services/firebaseClient';

let cachedDefaultSalesUid: string | null = null;

/**
 * Sales rep who receives web/guest checkout orders (assignedSalesman).
 * Set via seed (app_config/ops) or EXPO_PUBLIC_DEFAULT_SALES_UID.
 */
export async function getDefaultSalesUid(): Promise<string> {
  const fromEnv = process.env.EXPO_PUBLIC_DEFAULT_SALES_UID?.trim();
  if (fromEnv) return fromEnv;

  if (cachedDefaultSalesUid) return cachedDefaultSalesUid;

  const snap = await getDoc(doc(db, firebaseCollections.appConfig, 'ops'));
  const uid = snap.data()?.defaultSalesUid;
  if (typeof uid === 'string' && uid.trim()) {
    cachedDefaultSalesUid = uid.trim();
    return cachedDefaultSalesUid;
  }

  throw new Error(
    'No default sales rep configured. Run npm run seed:demo or set EXPO_PUBLIC_DEFAULT_SALES_UID.'
  );
}

export function clearDefaultSalesUidCache(): void {
  cachedDefaultSalesUid = null;
}
