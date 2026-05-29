# Developer Structure

The project already uses a feature-first Expo structure. Use this map when adding or moving code so the app stays easy to maintain.

## App Routes

- `app/`: Expo Router route files only.
- `app/(tabs)/`: customer tab routes.
- `app/sales/`: sales route shell.
- `app/printer/`: printer route shell.
- `app/admin/`: admin route shell.
- `app/auth/`: login and register route wrappers.

Route files should stay thin. They should import a screen from `src/features/...` and return it.

## Frontend

- `src/features/`: user-facing screens grouped by domain.
- `src/components/`: reusable UI components shared across features.
- `src/design-system/`: low-level design tokens.
- `src/constants/theme.ts` and `src/constants/themeResolver.ts`: app theme source of truth.

When building UI, prefer shared components like `ScreenContainer`, `AppCard`, `AppButton`, `AppInput`, `AppText`, and `AppIcon` before creating feature-local variants.

## Backend / Data Layer

- `src/services/`: Firebase, Supabase, NFC, file upload, preferences, and persistence logic.
- `src/hooks/`: React hooks that connect screens to auth, Firestore data, NFC jobs, payouts, orders, and preferences.
- `src/types/`: shared app models and service contracts.
- `src/utils/`: pure helpers, parsing, auth role logic, and capability logic.

Screens should not talk directly to Firebase or NFC APIs when an existing service or hook can own that logic.

## Icons

- `src/components/AppIcon.tsx`: single icon registry for the app.

Add new icons here first, then use `<AppIcon name="..." />` across screens. This keeps icon style consistent and avoids one-off icon imports in feature files.

## Suggested Long-Term Folder Shape

If you want a stronger frontend/backend split later, move gradually:

- `src/frontend/components` for shared UI components.
- `src/frontend/features` for screens.
- `src/frontend/design-system` for visual tokens.
- `src/backend/services` for Firebase, Supabase, NFC, storage, and auth services.
- `src/backend/types` for service data contracts.
- `src/shared/utils` for pure helpers used by both sides.
- `src/icons` for the icon registry.

Do this in small PRs with import aliases updated in `tsconfig.json`; avoid moving everything at once.
