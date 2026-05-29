# Guest Export

This folder is a holding area for guest-mode code before the app removes guest access.

## Files

- `guest-module-single-file.md` contains a copy of the guest-related routes, screens, hooks, provider code, demo data, and the login screen guest entry point.

## Main Guest Entry Points

- `src/providers/AuthProvider.tsx`: creates and applies the local guest user.
- `src/features/auth/LoginScreen.tsx`: owns the `Continue as Guest` button.
- `app/(tabs)/_layout.tsx`: allows `guest` and `customer` into the consumer tabs.
- `src/features/home/HomeScreen.tsx`: switches guests to `GuestHomeScreen`.
- `src/features/guest/*`: dedicated guest screens.
- `src/providers/GuestGateProvider.tsx`: unlock modal and guest account gating.
- `src/components/GuestGate.tsx`: redirects guest users away from account-only routes.

## Removal Checklist

1. Remove `signInAsGuest` from `src/types/auth.ts`, `src/providers/AuthProvider.tsx`, and `src/features/auth/LoginScreen.tsx`.
2. Remove `guest` from `UserRole` in `src/types/models.ts` and from role helpers.
3. Replace `useIsGuest` checks with customer-only logic, or delete the branch when the screen is no longer used by guests.
4. Delete `src/features/guest`, `src/constants/guestDemo.ts`, and `src/utils/guestScan.ts`.
5. Remove guest routes from `app/_layout.tsx`: `scan`, `nfc-demo`, and `guest-analytics`, unless they are converted to authenticated customer routes.
6. Update `app/(tabs)/_layout.tsx` to allow `customer` only.
7. Run `npx tsc --noEmit` and `npx expo lint`.
