import { AuthGate } from '@/src/components/AuthGate';
import { GuestPostLoginChoiceScreen } from '@/src/features/guest/GuestPostLoginChoiceScreen';

export default function GuestPostLoginChoiceRoute() {
  return (
    <AuthGate>
      <GuestPostLoginChoiceScreen />
    </AuthGate>
  );
}
