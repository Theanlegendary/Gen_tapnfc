import { GuestGate } from '@/src/components/GuestGate';
import { ActivateCardScreen } from '@/src/features/bio/ActivateCardScreen';

export default function ActivateCardRoute() {
  return (
    <GuestGate>
      <ActivateCardScreen />
    </GuestGate>
  );
}

