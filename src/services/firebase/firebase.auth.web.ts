import { getAuth } from 'firebase/auth';
import { app } from '@/src/services/firebase/firebase.shared';

export const auth = getAuth(app);
