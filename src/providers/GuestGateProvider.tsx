import { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { SignupUnlockModal } from '@/src/components/SignupUnlockModal';
import { useGuestGate } from '@/src/hooks/useGuestGate';

type GuestGateContextValue = ReturnType<typeof useGuestGate>;

const GuestGateContext = createContext<GuestGateContextValue | undefined>(undefined);

export function GuestGateProvider({ children }: PropsWithChildren) {
  const gate = useGuestGate();

  const value = useMemo(() => gate, [gate]);

  return (
    <GuestGateContext.Provider value={value}>
      {children}
      <SignupUnlockModal
        visible={gate.unlockVisible}
        onClose={gate.closeUnlock}
        message={gate.unlockMessage}
      />
    </GuestGateContext.Provider>
  );
}

export function useGuestGateContext() {
  const ctx = useContext(GuestGateContext);
  if (!ctx) {
    throw new Error('useGuestGateContext must be used within GuestGateProvider');
  }
  return ctx;
}

/** Prefer provider context; falls back to a local gate when no provider is mounted. */
export function useRequireAccount() {
  const ctx = useContext(GuestGateContext);
  const local = useGuestGate();
  return ctx ?? local;
}
