import { Redirect } from 'expo-router';
import { appRoutes } from '@/src/constants/navigation';

/** Legacy route — choose + design are one screen at guest-design. */
export default function GuestChooseCardRoute() {
  return <Redirect href={appRoutes.guestDesign} />;
}
