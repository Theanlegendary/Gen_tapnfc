import { GuestProfileScreen } from '@/src/features/guest/GuestProfileScreen';
import { PayoutsProfileScreen } from '@/src/features/payouts/PayoutsProfileScreen';
import { useIsGuest } from '@/src/hooks/useIsGuest';

export default function PayoutsProfileTabRoute() {
  const isGuest = useIsGuest();
  if (isGuest) {
    return <GuestProfileScreen />;
  }
  return <PayoutsProfileScreen />;
}

