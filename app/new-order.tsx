import { GuestGate } from '@/src/components/GuestGate';
import { NewOrderScreen } from '@/src/features/orders/NewOrderScreen2';

export default function NewOrderRoute() {
  return (
    <GuestGate>
      <NewOrderScreen />
    </GuestGate>
  );
}

