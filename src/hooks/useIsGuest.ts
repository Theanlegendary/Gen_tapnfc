import { useMemo } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { isGuestUser } from '@/src/utils/authFlow';

export function useIsGuest() {
  const { user } = useAuth();
  return useMemo(() => isGuestUser(user), [user]);
}
