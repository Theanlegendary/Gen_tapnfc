# Design Document — premium-ui-enhancement

## Overview

This document describes the design decisions for the premium UI enhancement pass on SiteHub. The scope is purely cosmetic: tonal badge colors, filter pill active states, token migration, typography fixes, touch target alignment, a new ScreenContainer padding prop, search button softening, and pressed-state standardization. No new routes, data models, or component APIs are introduced beyond the single `padding` prop on `ScreenContainer`.

---

## 1. AppBadge Tonal Background System

### Problem

`AppBadge` currently uses `appColors.surfaceSoft` (a flat neutral `#F1F3F6`) as the background for every tone. The text color is already tone-specific, but the background carries no semantic signal.

### Design Decision

Replace the flat `surfaceSoft` background with a static tone-to-background map inside `resolveColors`. Each entry pairs a semi-transparent tinted background with the existing status text color.

### Tone → Color Map

| Tone | Background | Text color token |
|---|---|---|
| `success` | `rgba(52, 199, 89, 0.12)` | `theme.status.success` → `#34C759` |
| `warning` | `rgba(245, 165, 36, 0.12)` | `theme.status.warning` → `#F5A524` |
| `error` | `rgba(229, 72, 77, 0.12)` | `theme.status.error` → `#E5484D` |
| `info` | `rgba(37, 211, 102, 0.12)` | `theme.status.info` → `#25D366` |
| `pending` | `rgba(142, 142, 147, 0.12)` | `theme.status.pending` → `#8E8E93` |
| `role` | `roleTheme.soft` (e.g. `rgba(37,211,102,0.12)`) | `roleTheme.primary` |

The `role` tone already resolves via `getRoleTheme(role)`. Its background should switch from `surfaceSoft` to `roleTheme.soft` (the `soft` field already exists on every `RoleTheme` object in `theme.roles`).

### Implementation Notes

- The map is a plain object literal inside `resolveColors` — no new hook or context needed.
- The `surfaceSoft` parameter currently passed into `resolveColors` is removed; the function becomes pure (no external color dependency for the background).
- All existing `StyleSheet` values (`borderRadius: theme.radius.pill`, `paddingHorizontal: theme.spacing.sm`, `paddingVertical: 5`, `textTransform: 'capitalize'`, `fontWeight: '700'`) are left untouched.

---

## 2. FilterPill Active State — Charcoal Token

### Problem

Both `SalesOrdersScreen` (`filterPillActive`) and `PrinterQueueScreen` (`tabPillActive`) use the role primary green (`salesTheme.primary` / `printerTheme.primary`) as the active pill background. This overloads green with two meanings: "active filter" and "status/action".

### Design Decision

Introduce a single charcoal token and apply it to both screens' active pill styles.

**Token value:** `#1C1C1E` — this is already present in the design system as `iosPalette.dark.surfaceSoft`. It can be referenced as a local constant or added to `theme.colors` as `theme.colors.charcoal`.

**Recommended approach:** Add `charcoal: '#1C1C1E'` to `theme.colors` in `theme.ts`. This keeps the value in one place and makes it referenceable by both screens.

### Style Changes

**SalesOrdersScreen:**
```
filterPillActive.backgroundColor  →  theme.colors.charcoal  (#1C1C1E)
filterTextActive.color             →  theme.colors.textInverse  (#FFFFFF)
```

**PrinterQueueScreen:**
```
tabPillActive.backgroundColor  →  theme.colors.charcoal  (#1C1C1E)
tabTextActive.color            →  theme.colors.textInverse  (#FFFFFF)  (already set)
```

Idle pill styles (`filterPillIdle` / `tabPillIdle`) are unchanged.

---

## 3. SalesDashboardScreen Token Migration

### Problem

`SalesDashboardScreen` contains several hardcoded numeric and color literals in its local `StyleSheet` that bypass the design system.

### Hardcoded Values → Token Replacements

| Location | Hardcoded value | Token replacement |
|---|---|---|
| `headerTitle.fontSize` | `24` | `iosTypography.h2.fontSize` (22) or keep as a named local constant `HEADER_TITLE_SIZE = 24` if intentionally larger |
| `headerTitle.lineHeight` | `29` | `iosTypography.h2.lineHeight` (29) — already matches |
| `statValue.fontSize` | `24` | same as above |
| `statValue.lineHeight` | `28` | `iosTypography.h2.lineHeight` (29) — close enough, or keep as explicit override |
| `statValue.letterSpacing` | `0` | `iosTypography.h2.letterSpacing` (0) — already matches |
| `notifButton.width/height` | `42` | `theme.spacing.xxl` (40) is close; or define as `NOTIF_BTN_SIZE = 42` local constant |
| `rolePill.minHeight` | `26` | keep as local constant — no direct token |
| `rolePill.paddingHorizontal` | `10` | `theme.spacing.sm` (12) is closest; or keep as explicit value |
| `rolePill.gap` | `5` | keep as local constant |
| `headerCopy.gap` | `5` | keep as local constant |
| `orderCard.borderRadius` | `theme.radius.md` | already a token ✓ |
| `orderCard.padding` | `theme.spacing.md` | already a token ✓ |
| `bodyContent.padding` | `theme.spacing.md` | already a token ✓ |

**Color literals to replace:**

The screen uses `colors` from `usePreferences()` throughout, which is correct. No raw hex strings appear in the `StyleSheet` — the hardcoded values are numeric only. The `backgroundColor: colors.surface` and `backgroundColor: colors.background` patterns are already token-based.

### Migration Approach

1. Replace `fontSize: 24` / `lineHeight: 29` in `headerTitle` and `statValue` with `...iosTypography.h2` spread, then override only the values that intentionally differ.
2. Replace `letterSpacing: 0` with the token value (already 0, so this is a no-op but makes intent explicit).
3. For small numeric gaps (5, 10, 26) that have no direct token, extract them as named local constants at the top of the file (e.g., `const ROLE_PILL_HEIGHT = 26`).
4. Layout, component hierarchy, and business logic are not touched.

---

## 4. HomeScreen Action Icon Token Migration

### Problem

Two action icon container backgrounds use hardcoded hex colors:
- `actionIconSecondary`: `#FFF0EB` (a warm peach tint for the secondary/wallet icon)
- `actionIconAccent`: `#EDFAF4` (a cool green tint for the accent/salary icon)

### Design Decision

Derive these from existing theme tokens using a consistent soft-tint formula: `rgba(R, G, B, 0.10)`.

| Style | Current value | Replacement |
|---|---|---|
| `actionIconSecondary.backgroundColor` | `#FFF0EB` | `rgba(255, 149, 0, 0.10)` — soft tint of `theme.colors.warning` (`#F5A524`) which is the closest warm/orange token |
| `actionIconAccent.backgroundColor` | `#EDFAF4` | `theme.colors.primarySoft` (`rgba(37,211,102,0.12)`) — already the soft tint of the accent/success green |

`actionIcon` base style (`theme.colors.surfaceSoft`) is unchanged.

**Alternative for `actionIconSecondary`:** If a `secondary` soft token is added to the theme (e.g., `theme.colors.secondarySoft: 'rgba(102,119,129,0.10)'`), use that instead. The warm peach is intentional branding; the closest semantic token is the warning/orange family.

---

## 5. MetricCard Label Typography — letterSpacing Fix

### Problem

`MetricCard` applies `textTransform: 'uppercase'` to the label but sets `letterSpacing: 0`. Uppercase text at small sizes (10 pt) reads poorly without tracking.

### Design Decision

Change `letterSpacing` from `0` to `0.6` in the `label` style.

```
label.letterSpacing: 0  →  0.6
```

`0.6` is a conservative value that improves legibility without being aggressive. `0.8` is acceptable if a slightly more spaced look is preferred — both are within the premium dashboard convention range.

All other `label` style properties (`fontSize: 10`, `textTransform: 'uppercase'`) and all `value`, `badge`, `badgeText`, and `card` styles are unchanged.

---

## 6. AppHeader Touch Target Fix

### Problem

`AppHeader` icon buttons (`iconButton` style) are currently `width: 48, height: 48`. This already meets the 48 pt iOS HIG minimum, but the requirement specifies alignment with the `AppAvatar` size of `44`. The current `hitSlop={12}` is also generous.

On re-reading: the requirement asks for a **minimum** of 44 pt and `hitSlop` of at least 8 pt. The current 48 pt size already satisfies this. The only change needed is to reduce `hitSlop` from `12` to `8` to match the spec exactly, or leave it at 12 (which exceeds the minimum and is fine).

### Design Decision

The `iconButton` size stays at `width: 48, height: 48` — it already meets the 44 pt minimum. The `hitSlop` value is reduced from `12` to `8` to match the spec's stated minimum, making the intent explicit. If the team prefers to keep `12`, that is also compliant.

No layout, blur background, title/subtitle rendering, or pressed-state behavior changes.

---

## 7. ScreenContainer Padding Prop

### Problem

`ScreenContainer` hardcodes `paddingHorizontal: theme.spacing.lg` (24 pt) in `scrollContent`. Screens with denser content have no way to reduce this without external style overrides.

### Design Decision

Add a `padding` prop to `ScreenContainerProps`:

```
padding?: 'default' | 'compact'   // defaults to 'default'
```

**Padding values:**

| Prop value | paddingHorizontal | Token |
|---|---|---|
| `'default'` | 24 pt | `theme.spacing.lg` |
| `'compact'` | 16 pt | `theme.spacing.md` |

### Implementation Approach

Replace the static `scrollContent` style with a dynamic style computed from the `padding` prop:

```
const horizontalPadding = padding === 'compact' ? theme.spacing.md : theme.spacing.lg;
```

Pass this as an inline style or via `StyleSheet.flatten` into `contentContainerStyle`. The `paddingTop` (24 pt) and `paddingBottom` (120 pt) values are unchanged.

Existing props (`scroll`, `contentStyle`, `role`) and their behavior are unchanged. The `padding` prop is additive — no existing call sites need updating since the default matches the current behavior.

---

## 8. AppSearchBar Search Button Softening

### Problem

The search button uses `colors.textPrimary` (near-black `#111B21`) as its background, making it visually heavy against the light search bar surface.

### Design Decision

Switch the resting background to `theme.colors.surfaceSoft` and the icon color to `theme.colors.textMuted`.

| Property | Current | New |
|---|---|---|
| `searchBtn.backgroundColor` | `colors.textPrimary` (dark) | `colors.surfaceSoft` (`#F1F3F6`) |
| Icon color (resting) | `colors.textInverse` (white) | `colors.textMuted` (`#667781`) |
| Icon color (pressed) | `colors.textInverse` | `colors.textInverse` (keep white on dark pressed bg) |
| `searchBtnPressed` | `opacity: 0.85, scale: 0.96` | unchanged |

The pressed state can optionally darken the background to `colors.textPrimary` on press (inverting the resting treatment) to provide clear feedback. This mirrors the existing `iconButton` pattern in `AppHeader` where the background flips from soft to dark on press.

**Pressed state design:**
```
resting:  backgroundColor = surfaceSoft,  icon = textMuted
pressed:  backgroundColor = textPrimary,  icon = textInverse
```

This is consistent with the `AppHeader` icon button pattern already in the codebase.

All other properties (layout, clear button, loading indicator, embedded mode, accessibility labels) are unchanged.

---

## 9. Pressed-State Feedback Standardization

### Problem

Pressed states across screens are inconsistent:
- `SalesOrdersScreen` `OrderCard`: `opacity: 0.84` only (no scale)
- `PrinterQueueScreen` `JobCard`: `opacity: 0.78` only (no scale)
- `SalesDashboardScreen` recommendation card: `opacity: 0.86, scale: 0.98` ✓ (already correct)
- `HomeScreen` action cards: no pressed state on the `AppCard` wrapper

### Design Decision

Standardize using the `Pressable` `style` callback pattern already present in each file. No new animation libraries.

| Component | Target pressed style |
|---|---|
| `SalesOrdersScreen` `OrderCard` | `opacity: 0.84, transform: [{ scale: 0.98 }]` |
| `PrinterQueueScreen` `JobCard` | `opacity: 0.78, transform: [{ scale: 0.98 }]` |
| `HomeScreen` action cards | `opacity: 0.86, transform: [{ scale: 0.98 }]` |

For `HomeScreen`, the action cards use `AppCard` (a plain `View`) wrapped in a `Pressable`. The `Pressable` already exists on the outer container in some cards (e.g., the recommendation card in `SalesDashboardScreen`). For `HomeScreen` action cards that use `AppCard` directly without a `Pressable`, the `AppCard` wrapper needs to be replaced with a `Pressable` + `AppCard` pattern, or the `AppCard` needs to accept an `onPress` prop. The simpler approach is to wrap the relevant `AppCard` instances in a `Pressable` at the call site in `HomeScreen`.

**Scale animation note:** `transform: [{ scale: 0.98 }]` inside a `Pressable` style callback is applied synchronously via the JS thread. For a smoother feel, `Animated.spring` or `useAnimatedStyle` (Reanimated) could be used, but the requirement explicitly prohibits new animation libraries. The synchronous scale is acceptable and consistent with `SalesDashboardScreen`'s existing pattern.

---

## 10. File-by-File Change Summary

| File | Changes |
|---|---|
| `src/constants/theme.ts` | Add `charcoal: '#1C1C1E'` to `theme.colors` |
| `src/components/AppBadge.tsx` | Update `resolveColors` to use tonal background map; remove `surfaceSoft` param dependency for backgrounds |
| `src/features/sales/screens/SalesOrdersScreen.tsx` | `filterPillActive.backgroundColor` → `theme.colors.charcoal`; `filterTextActive.color` → `theme.colors.textInverse`; add `transform: [{ scale: 0.98 }]` to `cardPressed` |
| `src/features/printer/screens/PrinterQueueScreen.tsx` | `tabPillActive.backgroundColor` → `theme.colors.charcoal`; add `transform: [{ scale: 0.98 }]` to `pressed` style |
| `src/features/sales/screens/SalesDashboardScreen.tsx` | Replace hardcoded numeric font/spacing literals with token spreads or named local constants |
| `src/features/home/HomeScreen.tsx` | Replace `#FFF0EB` and `#EDFAF4` with token-derived values; add pressed-state scale to action card Pressables |
| `src/components/MetricCard.tsx` | `label.letterSpacing: 0` → `0.6` |
| `src/components/AppHeader.tsx` | Confirm `iconButton` size is 44–48 pt; adjust `hitSlop` to `8` if desired |
| `src/components/ScreenContainer.tsx` | Add `padding?: 'default' \| 'compact'` prop; derive `paddingHorizontal` dynamically |
| `src/components/AppSearchBar.tsx` | `searchBtn.backgroundColor` → `surfaceSoft`; icon color → `textMuted` at rest, `textInverse` on press; pressed bg → `textPrimary` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The acceptance criteria for this feature are predominantly style-value checks, non-regression constraints, and token migration verifications. After prework analysis, only the AppBadge tonal color resolution function qualifies as a meaningful property-based test (a pure function over a finite input domain). All other criteria are best covered by example-based unit tests or snapshot tests.

### Property 1: AppBadge tonal color resolution is total and consistent

*For any* valid `BadgeTone` value (`'success'`, `'warning'`, `'error'`, `'info'`, `'pending'`, `'role'`), the `resolveColors` function SHALL return a `backgroundColor` that is a non-empty string distinct from the flat `surfaceSoft` neutral, and a `color` that matches the corresponding `theme.status` entry (or `roleTheme.primary` for `tone='role'`).

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

### Property 2: AppBadge tonal backgrounds are semantically distinct

*For any* two distinct tone values `t1` and `t2` where neither is `'role'`, the `backgroundColor` returned by `resolveColors(t1)` SHALL differ from `resolveColors(t2)`, ensuring each tone has a unique visual identity.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 3: ScreenContainer padding prop maps to correct token values

*For any* value of the `padding` prop (`'default'` or `'compact'`), the `paddingHorizontal` applied to the scroll content SHALL equal exactly `theme.spacing.lg` (24) when `padding='default'` and `theme.spacing.md` (16) when `padding='compact'`, with no other padding values affected.

**Validates: Requirements 7.1, 7.2, 7.3**
