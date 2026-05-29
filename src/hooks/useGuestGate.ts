import { useCallback, useState } from 'react';
import { useIsGuest } from '@/src/hooks/useIsGuest';

export function useGuestGate() {
  const isGuest = useIsGuest();
  const [unlockVisible, setUnlockVisible] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | undefined>(undefined);

  const closeUnlock = useCallback(() => {
    setUnlockVisible(false);
    setUnlockMessage(undefined);
  }, []);

  const showUnlock = useCallback((message?: string) => {
    setUnlockMessage(message);
    setUnlockVisible(true);
  }, []);

  const requireAccount = useCallback(
    (onAllowed?: () => void, options?: { message?: string }) => {
      if (!isGuest) {
        onAllowed?.();
        return true;
      }
      showUnlock(options?.message);
      return false;
    },
    [isGuest, showUnlock]
  );

  return {
    isGuest,
    unlockVisible,
    unlockMessage,
    closeUnlock,
    showUnlock,
    requireAccount,
  };
}
