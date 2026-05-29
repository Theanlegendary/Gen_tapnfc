# Implementation Plan: premium-ui-enhancement

## Overview

A purely cosmetic UI refinement pass across shared components and four screens. Tasks follow a foundation-first order: add the charcoal token, update shared components, then migrate each screen. No new routes, data models, or business logic are introduced.

## Tasks

- [ ] 1. Add charcoal token to theme
  - [ ] 1.1 Add `charcoal: '#1C1C1E'` to `theme.colors` in `src/constants/theme.ts`
    - Locate the `colors` object in `theme.ts` and append the new entry
    - Verify the token is exported and accessible via `theme.colors.charcoal`
    - _Requirements: 2.1, 2.2, 2.4_

- [ ] 2. Update AppBadge tonal background system
  - [ ] 2.1 Replace flat `surfaceSoft` background with a tone-to-background map in `src/components/AppBadge.tsx`
    - Inside `resolveColors`, define a static map: `success → rgba(52,199,89,0.12)`, `warning → rgba(245,165,36,0.12)`, `error → rgba(229,72,77,0.12)`, `info → rgba(37,211,102,0.12)`, `pending → rgba(142,142,147,0.12)`
    - For `tone='role'`, switch background from `surfaceSoft` to `roleTheme.soft`
    - Remove the `surfaceSoft` parameter dependency from `resolveColors` — the function becomes pure
    - Preserve all existing style properties: `borderRadius`, `paddingHorizontal`, `paddingVertical`, `textTransform: 'capitalize'`, `fontWeight: '700'`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 2.2 Write property test for AppBadge tonal color resolution (Property 1)
    - **Property 1: AppBadge tonal color resolution is total and consistent**
    - For every valid `BadgeTone` value, assert `resolveColors` returns a non-empty `backgroundColor` string that differs from `#F1F3F6` (surfaceSoft), and a `color` matching the corresponding `theme.status` entry (or `roleTheme.primary` for `tone='role'`)
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

  - [ ]* 2.3 Write property test for AppBadge tonal background uniqueness (Property 2)
    - **Property 2: AppBadge tonal backgrounds are semantically distinct**
    - For any two distinct non-`'role'` tone values `t1` and `t2`, assert `resolveColors(t1).backgroundColor !== resolveColors(t2).backgroundColor`
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [ ] 3. Fix MetricCard label letter spacing
  - [ ] 3.1 Update `label.letterSpacing` from `0` to `0.6` in `src/components/MetricCard.tsx`
    - Locate the `label` style in the `StyleSheet` and change `letterSpacing: 0` to `letterSpacing: 0.6`
    - Confirm `fontSize: 10` and `textTransform: 'uppercase'` remain unchanged
    - Confirm all other styles (`value`, `badge`, `badgeText`, `card`) are untouched
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 4. Confirm AppHeader touch target and adjust hitSlop
  - [ ] 4.1 Verify `iconButton` dimensions and set `hitSlop` to `8` in `src/components/AppHeader.tsx`
    - Confirm `iconButton` style has `width: 48, height: 48` (already meets 44 pt minimum)
    - Change `hitSlop` from `12` to `8` on the icon `Pressable` elements to match the spec's stated minimum
    - Preserve blur background, title/subtitle rendering, and pressed-state color inversion behavior
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 5. Add padding prop to ScreenContainer
  - [ ] 5.1 Add `padding?: 'default' | 'compact'` prop and derive `paddingHorizontal` dynamically in `src/components/ScreenContainer.tsx`
    - Extend `ScreenContainerProps` with `padding?: 'default' | 'compact'` (default: `'default'`)
    - Replace the static `paddingHorizontal: theme.spacing.lg` in `scrollContent` with a computed value: `padding === 'compact' ? theme.spacing.md : theme.spacing.lg`
    - Keep `paddingTop` (24 pt) and `paddingBottom` (120 pt) unchanged
    - Preserve existing `scroll`, `contentStyle`, and `role` props and their behavior
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 5.2 Write property test for ScreenContainer padding prop mapping (Property 3)
    - **Property 3: ScreenContainer padding prop maps to correct token values**
    - For `padding='default'`, assert `paddingHorizontal === theme.spacing.lg` (24); for `padding='compact'`, assert `paddingHorizontal === theme.spacing.md` (16); assert `paddingTop` and `paddingBottom` are unaffected in both cases
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 6. Soften AppSearchBar search button
  - [ ] 6.1 Update search button resting and pressed styles in `src/components/AppSearchBar.tsx`
    - Change `searchBtn.backgroundColor` from `colors.textPrimary` to `colors.surfaceSoft`
    - Change the search icon color at rest from `colors.textInverse` to `colors.textMuted`
    - On press, set background to `colors.textPrimary` and icon color to `colors.textInverse` (inverted treatment, consistent with `AppHeader` icon button pattern)
    - Leave `searchBtnPressed` opacity/scale values, clear button, loading indicator, embedded mode, and accessibility labels unchanged
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 7. Checkpoint — shared components complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Migrate HomeScreen tokens and add pressed states
  - [ ] 8.1 Replace hardcoded hex colors with token-derived values in `src/features/home/HomeScreen.tsx`
    - Replace `backgroundColor: '#FFF0EB'` on `actionIconSecondary` with `rgba(255, 149, 0, 0.10)` (soft tint of `theme.colors.warning`)
    - Replace `backgroundColor: '#EDFAF4'` on `actionIconAccent` with `theme.colors.primarySoft` (`rgba(37,211,102,0.12)`)
    - Confirm `actionIcon` base style (`theme.colors.surfaceSoft`) is unchanged
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 8.2 Add pressed-state feedback to HomeScreen action card Pressables
    - For each action card `Pressable` in `HomeScreen`, apply `style` callback: `({ pressed }) => [styles.actionCard, pressed && { opacity: 0.86, transform: [{ scale: 0.98 }] }]`
    - Where an action card uses `AppCard` directly without a `Pressable`, wrap it in a `Pressable` at the call site and apply the same pressed style
    - Preserve existing layout, component hierarchy, and business logic
    - _Requirements: 9.3, 9.4_

- [ ] 9. Migrate SalesDashboardScreen tokens and add charcoal pill
  - [ ] 9.1 Replace hardcoded numeric literals with tokens or named constants in `src/features/sales/screens/SalesDashboardScreen.tsx`
    - Replace `fontSize: 24, lineHeight: 29` in `headerTitle` and `statValue` with `...iosTypography.h2` spread, overriding only intentionally different values
    - Replace `letterSpacing: 0` with the token value (explicit no-op for intent clarity)
    - Extract small numeric gaps (`5`, `10`, `26`) that have no direct token as named local constants (e.g., `const ROLE_PILL_HEIGHT = 26`)
    - Replace `notifButton.width/height: 42` with a local constant `NOTIF_BTN_SIZE = 42` (no exact token match)
    - Confirm no raw hex strings exist in the `StyleSheet`; all colors already use `usePreferences()` tokens
    - Preserve layout structure, component hierarchy, and business logic
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 10. Update SalesOrdersScreen charcoal pill and pressed state
  - [ ] 10.1 Apply charcoal active pill and scale pressed state in `src/features/sales/screens/SalesOrdersScreen.tsx`
    - Change `filterPillActive.backgroundColor` to `theme.colors.charcoal` (`#1C1C1E`)
    - Change `filterTextActive.color` to `theme.colors.textInverse` (`#FFFFFF`)
    - Add `transform: [{ scale: 0.98 }]` to the `cardPressed` style alongside the existing `opacity: 0.84`
    - Confirm idle pill styles (`filterPillIdle`) are unchanged
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 9.1, 9.4_

- [ ] 11. Update PrinterQueueScreen charcoal pill and pressed state
  - [ ] 11.1 Apply charcoal active pill and scale pressed state in `src/features/printer/screens/PrinterQueueScreen.tsx`
    - Change `tabPillActive.backgroundColor` to `theme.colors.charcoal` (`#1C1C1E`)
    - Confirm `tabTextActive.color` is already `theme.colors.textInverse` (white); set it explicitly if not
    - Add `transform: [{ scale: 0.98 }]` to the `JobCard` pressed style alongside the existing `opacity: 0.78`
    - Confirm idle pill styles (`tabPillIdle`) are unchanged
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 9.2, 9.4_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The charcoal token (Task 1.1) must be completed before Tasks 10.1 and 11.1
- AppBadge (Task 2.1) must be completed before property tests 2.2 and 2.3
- ScreenContainer (Task 5.1) must be completed before property test 5.2
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- The `padding` prop on `ScreenContainer` is additive — no existing call sites need updating (default matches current behavior)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "5.1", "6.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "5.2", "8.1", "9.1"] },
    { "id": 3, "tasks": ["8.2", "10.1", "11.1"] }
  ]
}
```
