# Requirements Document

## Introduction

This feature refines the existing SiteHub mobile app UI into a premium, modern operational dashboard — inspired by Apple, Stripe, Linear, Shopify, and modern logistics/internal workflow systems. The scope covers shared components (AppBadge, AppCard, AppSearchBar, AppHeader, MetricCard, ScreenContainer) and four screens (HomeScreen, SalesDashboardScreen, SalesOrdersScreen, PrinterQueueScreen). The existing layout, navigation structure, and business workflow logic are preserved. The work focuses exclusively on visual refinement: tonal badge backgrounds, filter pill active states, typography consistency, spacing, touch target alignment, and token hygiene.

---

## Glossary

- **AppBadge**: Shared status chip component used across all screens to communicate order, payment, and card states.
- **AppCard**: Shared surface container component used for action cards and content groupings on HomeScreen.
- **AppHeader**: Shared top navigation bar component with blur background, title, subtitle, back button, and action icon.
- **AppSearchBar**: Shared search input component with embedded and standalone modes.
- **MetricCard**: Shared numeric summary card used in HomeScreen metrics rows.
- **ScreenContainer**: Shared scroll/safe-area wrapper used by HomeScreen.
- **FilterPill**: Interactive tab/pill element used in SalesOrdersScreen and PrinterQueueScreen to filter list content.
- **TonalBackground**: A soft, semi-transparent background color derived from a semantic status tone (success, warning, error, info, pending).
- **ThemeToken**: A named value defined in `theme.ts` or `ios.ts` (e.g., `theme.colors.surfaceSoft`, `theme.spacing.md`) used instead of hardcoded hex or numeric literals.
- **TouchTarget**: The tappable area of an interactive element; must meet the 48×48 pt minimum per iOS HIG.
- **SalesDashboardScreen**: The primary sales role dashboard showing financial stats, a recommendation card, and the active order pipeline.
- **SalesOrdersScreen**: The order management list screen for the sales role, with search and filter pills.
- **PrinterQueueScreen**: The printer role job queue screen with animated job cards, search, and filter tabs.
- **HomeScreen**: The role-aware home screen showing greeting, NFC card, metrics, and action cards.
- **LiquidTabBar**: The bottom navigation tab bar component; already premium — excluded from this feature scope.
- **surfaceSoft**: The existing flat neutral background token (`#F1F3F6`) currently used as the background for all AppBadge tones.
- **charcoal**: A dark near-black color (`#1C1C1E` or equivalent) used as the active FilterPill background.

---

## Requirements

### Requirement 1 — AppBadge Tonal Background System

**User Story:** As a user, I want status badges to communicate their semantic meaning through color at a glance, so that I can quickly identify order states, payment states, and card states without reading the label.

#### Acceptance Criteria

1. WHEN AppBadge renders with `tone="success"`, THE AppBadge SHALL display a soft green-tinted background (e.g., `rgba(52,199,89,0.12)`) and green text matching `theme.status.success`.
2. WHEN AppBadge renders with `tone="warning"`, THE AppBadge SHALL display a soft amber-tinted background (e.g., `rgba(245,165,36,0.12)`) and amber text matching `theme.status.warning`.
3. WHEN AppBadge renders with `tone="error"`, THE AppBadge SHALL display a soft red-tinted background (e.g., `rgba(229,72,77,0.12)`) and red text matching `theme.status.error`.
4. WHEN AppBadge renders with `tone="info"`, THE AppBadge SHALL display a soft blue/primary-tinted background (e.g., `rgba(37,211,102,0.12)` or the role primary soft token) and primary text matching `theme.status.info`.
5. WHEN AppBadge renders with `tone="pending"`, THE AppBadge SHALL display a soft gray-tinted background (e.g., `rgba(142,142,147,0.12)`) and muted text matching `theme.status.pending`.
6. WHEN AppBadge renders with `tone="role"`, THE AppBadge SHALL display a soft tinted background derived from the role's primary color and text matching the role's primary color.
7. THE AppBadge SHALL resolve tonal backgrounds from a static tone-to-background map defined within the component, replacing the current flat `surfaceSoft` background used for all tones.
8. THE AppBadge SHALL preserve its existing `borderRadius`, `paddingHorizontal`, `paddingVertical`, label capitalization, and font weight styles unchanged.

---

### Requirement 2 — FilterPill Active State

**User Story:** As a user, I want the active filter tab to be visually distinct using a neutral dark treatment, so that the green color remains reserved for status and action semantics.

#### Acceptance Criteria

1. WHEN a FilterPill is in the active state in SalesOrdersScreen, THE FilterPill SHALL display a dark charcoal background (e.g., `#1C1C1E`) with white text (`theme.colors.textInverse`).
2. WHEN a FilterPill is in the active state in PrinterQueueScreen, THE FilterPill SHALL display a dark charcoal background (e.g., `#1C1C1E`) with white text (`theme.colors.textInverse`).
3. WHEN a FilterPill is in the idle state, THE FilterPill SHALL retain its existing background (`theme.colors.surfaceSoft` or `theme.colors.surface`) and muted text color.
4. THE FilterPill active background SHALL NOT use the role primary color (green) in either SalesOrdersScreen or PrinterQueueScreen.
5. THE FilterPill active state change SHALL be applied by updating the existing `filterPillActive` / `tabPillActive` style objects without altering the FilterPill layout, size, or border-radius.

---

### Requirement 3 — SalesDashboardScreen Token Migration

**User Story:** As a developer, I want SalesDashboardScreen to use theme tokens for all visual values, so that the screen participates in the design system and future theme changes propagate automatically.

#### Acceptance Criteria

1. THE SalesDashboardScreen SHALL replace every hardcoded numeric font size, line height, and letter spacing value in its local `StyleSheet` with the corresponding `iosTypography` or `theme.typography` token.
2. THE SalesDashboardScreen SHALL replace every hardcoded color hex string in its local `StyleSheet` with the corresponding `theme.colors`, `theme.status`, or `theme.roles` token.
3. THE SalesDashboardScreen SHALL replace every hardcoded spacing or radius numeric literal in its local `StyleSheet` with the corresponding `theme.spacing` or `theme.radius` token.
4. WHEN SalesDashboardScreen uses `usePreferences` colors, THE SalesDashboardScreen SHALL reference only tokens exposed by that hook rather than importing raw palette values directly.
5. THE SalesDashboardScreen SHALL preserve its existing layout structure, component hierarchy, and business logic unchanged after token migration.

---

### Requirement 4 — HomeScreen Action Icon Token Migration

**User Story:** As a developer, I want HomeScreen action icon containers to use theme tokens instead of hardcoded hex colors, so that the icon backgrounds are consistent with the design system.

#### Acceptance Criteria

1. THE HomeScreen SHALL replace the hardcoded `backgroundColor: '#FFF0EB'` on `actionIconSecondary` with a theme token or a token-derived value (e.g., a soft tint of `theme.colors.secondary`).
2. THE HomeScreen SHALL replace the hardcoded `backgroundColor: '#EDFAF4'` on `actionIconAccent` with a theme token or a token-derived value (e.g., a soft tint of `theme.colors.accent` or `theme.colors.success`).
3. THE HomeScreen SHALL retain the existing `actionIcon` base style using `theme.colors.surfaceSoft` unchanged.
4. THE HomeScreen SHALL preserve its existing layout, component hierarchy, and business logic unchanged after token migration.

---

### Requirement 5 — MetricCard Label Typography Consistency

**User Story:** As a user, I want MetricCard labels to use consistent letter spacing so that the uppercase label style matches the premium typographic standard used elsewhere in the app.

#### Acceptance Criteria

1. THE MetricCard label SHALL use a `letterSpacing` value greater than 0 (e.g., `0.6` or `0.8`) when `textTransform: 'uppercase'` is applied, so that the uppercase label is visually legible and consistent with premium dashboard conventions.
2. THE MetricCard label font size SHALL remain at `10` and the `textTransform: 'uppercase'` style SHALL be preserved.
3. THE MetricCard SHALL preserve its existing layout, value typography, and highlight badge styles unchanged.

---

### Requirement 6 — AppHeader Touch Target Consistency

**User Story:** As a user, I want all interactive icon buttons in AppHeader to have a touch target consistent with the app's minimum interactive size, so that the header is easy to tap reliably.

#### Acceptance Criteria

1. THE AppHeader icon button (back button and action button) SHALL have a minimum `width` and `height` of `44` pt, matching the iOS HIG minimum touch target recommendation and aligning with the `AppAvatar` size used in the same header.
2. WHEN AppHeader renders an action icon button, THE AppHeader SHALL apply a `hitSlop` of at least `8` pt on all sides to supplement the touch area.
3. THE AppHeader SHALL preserve its existing blur background, layout, title/subtitle rendering, and pressed-state color inversion behavior unchanged.

---

### Requirement 7 — ScreenContainer Padding Variant

**User Story:** As a developer, I want ScreenContainer to support a compact padding variant, so that screens with dense content can reduce horizontal padding without overriding styles externally.

#### Acceptance Criteria

1. THE ScreenContainer SHALL accept a `padding` prop with values `'default'` and `'compact'`, defaulting to `'default'`.
2. WHEN ScreenContainer renders with `padding="default"`, THE ScreenContainer SHALL apply `paddingHorizontal: theme.spacing.lg` (24 pt) to the scroll content.
3. WHEN ScreenContainer renders with `padding="compact"`, THE ScreenContainer SHALL apply `paddingHorizontal: theme.spacing.md` (16 pt) to the scroll content.
4. THE ScreenContainer SHALL preserve its existing `scroll`, `contentStyle`, and `role` props and their behavior unchanged.

---

### Requirement 8 — AppSearchBar Search Button Softening

**User Story:** As a user, I want the AppSearchBar search button to use a softer background so that it feels less visually heavy and more consistent with the premium surface treatment of the surrounding UI.

#### Acceptance Criteria

1. THE AppSearchBar search button SHALL use `theme.colors.surfaceSoft` or a role-tinted soft background instead of `colors.textPrimary` (dark/black) as its default resting background color.
2. THE AppSearchBar search button icon SHALL use `theme.colors.textMuted` or the role primary color when the button is in its resting state, ensuring sufficient contrast against the soft background.
3. WHEN the AppSearchBar search button is pressed, THE AppSearchBar SHALL apply a pressed-state visual feedback (e.g., opacity reduction or scale transform) consistent with the existing `searchBtnPressed` style.
4. THE AppSearchBar SHALL preserve its existing layout, clear button behavior, loading indicator, embedded mode, and accessibility labels unchanged.

---

### Requirement 9 — Consistent Pressed-State Feedback

**User Story:** As a user, I want all interactive cards and buttons to provide consistent pressed-state visual feedback, so that the app feels responsive and polished.

#### Acceptance Criteria

1. WHEN an OrderCard in SalesOrdersScreen is pressed, THE OrderCard SHALL apply an opacity of `0.84` and a scale transform of `0.98` simultaneously.
2. WHEN a JobCard in PrinterQueueScreen is pressed, THE JobCard SHALL apply an opacity of `0.78` and a scale transform of `0.98` simultaneously.
3. WHEN an action card (AppCard with Pressable) in HomeScreen is pressed, THE action card SHALL apply an opacity of `0.86` and a scale transform of `0.98` simultaneously.
4. THE pressed-state feedback SHALL be applied using the existing `Pressable` `style` callback pattern already present in each screen, without introducing new animation libraries.

---

### Requirement 10 — No Layout or Workflow Regression

**User Story:** As a developer, I want all UI refinements to be purely cosmetic, so that no existing navigation, data flow, business logic, or component API is broken.

#### Acceptance Criteria

1. THE premium-ui-enhancement changes SHALL NOT alter any navigation route, screen transition, or deep-link parameter in the app.
2. THE premium-ui-enhancement changes SHALL NOT modify any data-fetching hook, Firestore query, or state management logic.
3. THE premium-ui-enhancement changes SHALL NOT remove or rename any exported component prop that is currently consumed by other screens or components.
4. WHEN any modified component is rendered in its existing usage context, THE component SHALL produce a layout visually equivalent to the pre-enhancement layout in terms of element order, scroll behavior, and content structure.
5. THE LiquidTabBar component SHALL NOT be modified as part of this feature.
