import type { Href } from 'expo-router';
import { appRoutes } from '@/src/constants/navigation';
import { shouldPromptGuestDraftContinuation } from '@/src/services/guestDraftService';
import { AppUser } from '@/src/types/models';
import { getDashboardRoute } from '@/src/utils/authFlow';

/** Where to send the user immediately after sign-in or sign-up. */
export async function getPostAuthDestination(user: AppUser): Promise<Href> {
  if (user.isGuest || user.role !== 'customer') {
    return getDashboardRoute(user);
  }
  if (await shouldPromptGuestDraftContinuation()) {
    return appRoutes.guestPostLoginChoice as Href;
  }
  return getDashboardRoute(user);
}
