# App Feature Status (3-Color)

Legend:
- ?? Working
- ?? Partial / Demo / Needs integration
- ?? Not working / Placeholder

## Core Features

| Area | Status | Notes |
|---|---|---|
| App boot + navigation | ?? | Expo app runs, stack/tabs are wired and launch correctly. |
| Authentication UI flow | ?? | Login/register screens exist and flow works locally via `AuthContext`, but uses mock users/password (`password123`) and AsyncStorage demo auth. |
| Real backend auth (Supabase) | ?? | `services/api.ts` has Supabase auth logic, but active auth flow in `AuthContext` is still mock/demo, not fully switched to API. |
| Attendance scan flow | ?? | QR scanner and attendance screens exist; there is logic for attendance processing, but some flows still rely on local/mock behavior and pending edge-case hardening. |
| Notifications | ?? | Notification system works with local persistence and generated sample data; not fully connected to live backend stream. |
| Admin dashboard | ?? | Admin pages exist (users/groups/reports/qr/join requests), some actions are functional, several actions still show "coming soon" alerts. |
| Group management | ?? | Group types/utilities and admin pages exist; some member/export/settings operations are placeholders. |
| QR generation/preview | ?? | QR utilities and preview component exist; needs full end-to-end backend activation/validation consistency checks. |
| Legal/info pages | ?? | Privacy policy and Terms screens exist and render. |
| Global design system | ?? | Shared tokens/components were added, but not all screens are fully migrated yet (legacy per-screen styles still present). |

## What Is Working Now

- ?? App starts and runs on Expo.
- ?? Base route structure (auth, tabs, admin, scanner, summary, notifications).
- ?? Local session persistence with AsyncStorage.
- ?? Local notification CRUD behavior (read/unread/delete/clear) in context.
- ?? Supabase client and migration files are present in the codebase.

## What Is Not Fully Working Yet

- ?? Production-grade authentication is not fully enabled in the active login flow (still mock credentials in `AuthContext`).
- ?? Multiple UI actions are placeholders with "coming soon" alerts.
- ?? Full strict design-system compliance across every screen is not complete yet.
- ?? Lint currently reports multiple pre-existing issues across screens.

## Backend Notes

| Backend Part | Status | Note |
|---|---|---|
| Supabase client setup (`lib/supabase.ts`) | ?? | Client is configured and available. |
| Database schema/migrations (`supabase/migrations`) | ?? | Migration SQL files exist for backend structure. |
| API service layer (`services/api.ts`) | ?? | Includes methods for auth, attendance, notifications, groups. |
| Active app usage of API layer | ?? | Some app logic still uses local/mock contexts instead of full API usage. |
| Realtime / push integration | ?? | Notification handling is mostly local sample-driven, not fully live backend-driven. |
| Env readiness (`EXPO_PUBLIC_SUPABASE_*`) | ?? | Works only when correct keys are configured; defaults are placeholder values in code fallback. |

## Immediate Next Priorities

1. Replace mock auth in `AuthContext` with `AttendanceAPI.login/register`.
2. Remove placeholder actions and wire admin/group operations to backend endpoints.
3. Complete screen-by-screen migration to shared design-system components/tokens.
4. Fix lint errors and enforce no hardcoded colors/icons/style drift.
