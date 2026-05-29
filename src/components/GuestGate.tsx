import { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { appRoutes } from '@/src/constants/navigation';

interface GuestGateProps {
  /** When true, guests are blocked and redirected to consumer tabs. */
  blockGuests?: boolean;
}

/** Blocks guest users from staff-only or account-only routes. */
export function GuestGate({ blockGuests = true, children }: PropsWithChildren<GuestGateProps>) {
  const isGuest = useIsGuest();

  if (blockGuests && isGuest) {
    return <Redirect href={appRoutes.customerTabs} />;
  }

  return <>{children}</>;
}
