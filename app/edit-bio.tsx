import { GuestGate } from '@/src/components/GuestGate';
import { EditBioScreen } from '@/src/features/bio/EditBioScreen';

export default function EditBioRoute() {
  return (
    <GuestGate>
      <EditBioScreen />
    </GuestGate>
  );
}

