import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { appRoutes } from '@/src/constants/navigation';
import { theme } from '@/src/constants/theme';
import { useAuth } from '@/src/hooks/useAuth';
import { useOrders } from '@/src/hooks/useOrders';
import { usePreferences } from '@/src/hooks/usePreferences';

interface Props {
  state: any;
  navigation: any;
  descriptors?: Record<string, any>;
}

type RouteItem = { type: 'route'; route: any };
type NavItem = RouteItem;

const routeIcons: Record<string, AppIconName> = {
  index: 'Home',
  orders: 'ClipboardList',
  payouts: 'Wallet',
  me: 'User',
  queue: 'ClipboardList',
  scan: 'ScanLine',
  wages: 'BadgeDollarSign',
  attendance: 'CalendarDays',
  profile: 'User',
  settings: 'Settings',
};

function routeLabel(route: any, descriptors?: Record<string, any>) {
  const options = descriptors?.[route.key]?.options ?? {};
  return options.title ?? route.name.charAt(0).toUpperCase() + route.name.slice(1);
}

function TabIcon({
  routeName,
  active,
  activeIconColor,
  inactiveIconColor,
  badgeLabel,
}: {
  routeName: string;
  active: boolean;
  activeIconColor: string;
  inactiveIconColor: string;
  badgeLabel?: string;
}) {
  return (
    <View style={styles.iconBadgeContainer}>
      {badgeLabel ? (
        <View style={styles.badge}>
          <AppText style={styles.badgeText} numberOfLines={1}>
            {badgeLabel}
          </AppText>
        </View>
      ) : null}
      <View style={styles.iconShell}>
        <AppIcon
          name={routeIcons[routeName] ?? 'Home'}
          size={active ? 24 : 22}
          color={active ? activeIconColor : inactiveIconColor}
        />
      </View>
    </View>
  );
}

function useReduceTransparency() {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    let mounted = true;
    const accessibility = AccessibilityInfo as typeof AccessibilityInfo & {
      isReduceTransparencyEnabled?: () => Promise<boolean>;
    };

    if (typeof accessibility.isReduceTransparencyEnabled === 'function') {
      accessibility.isReduceTransparencyEnabled()
        .then((enabled) => {
          if (mounted) setReduceTransparency(enabled);
        })
        .catch(() => undefined);
    }

    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceTransparencyChanged',
      setReduceTransparency
    );

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return reduceTransparency;
}

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    const accessibility = AccessibilityInfo as typeof AccessibilityInfo & {
      isReduceMotionEnabled?: () => Promise<boolean>;
    };

    if (typeof accessibility.isReduceMotionEnabled === 'function') {
      accessibility.isReduceMotionEnabled()
        .then((enabled) => {
          if (mounted) setReduceMotion(enabled);
        })
        .catch(() => undefined);
    }

    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return reduceMotion;
}

export function LiquidTabBar({ state, navigation, descriptors }: Props) {
  const { colors } = usePreferences();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const reduceTransparency = useReduceTransparency();
  const reduceMotion = useReduceMotion();
  const entrance = useRef(new Animated.Value(0)).current;
  const activePulse = useRef(new Animated.Value(0)).current;
  const activeRoute = state.routes[state.index];
  const activeOptions = descriptors?.[activeRoute?.key]?.options ?? {};
  const shouldHide = activeOptions.href === null || activeOptions.tabBarStyle?.display === 'none';

  const visibleRoutes = state.routes.filter((route: any) => {
    const options = descriptors?.[route.key]?.options ?? {};
    return options.href !== null && options.tabBarStyle?.display !== 'none';
  });
  const isSalesBar =
    visibleRoutes.some((route: any) => route.name === 'orders') &&
    visibleRoutes.some((route: any) => route.name === 'payouts');
  const isPrinterBar =
    visibleRoutes.some((route: any) => route.name === 'queue') &&
    visibleRoutes.some((route: any) => route.name === 'scan') &&
    visibleRoutes.some((route: any) => route.name === 'wages');
  const showFloatingAction = isSalesBar || isPrinterBar;
  const activeIconColor = '#0EA5E9';
  const inactiveIconColor = theme.colors.iconInactive;

  const isSalesUser = user?.role === 'sales';
  const { orders } = useOrders(isSalesUser ? 'sales' : 'guest', isSalesUser ? user?.id ?? 'guest' : 'guest');
  const activeOrdersCount = useMemo(
    () =>
      isSalesUser
        ? orders.filter((order) => order.status !== 'delivered' && (order.cardStatus ?? 'active') !== 'closed').length
        : 0,
    [isSalesUser, orders]
  );
  const ordersBadgeLabel = activeOrdersCount > 99 ? '99+' : activeOrdersCount > 0 ? String(activeOrdersCount) : '';

  const newOrderHref = isSalesBar
    ? appRoutes.sales.newOrder
    : isPrinterBar
      ? appRoutes.printer.newOrder
      : appRoutes.newOrder;

  const items: NavItem[] = visibleRoutes.map((route: any) => ({ type: 'route', route }) as RouteItem);

  const blurIntensity = reduceTransparency ? 0 : Platform.select({ ios: 78, android: 58, default: 66 });
  const activeScale = activePulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.02, 1],
  });
  const barTransform = {
    opacity: reduceMotion ? 1 : entrance,
    transform: [
      {
        translateY: reduceMotion
          ? 0
          : entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
      },
      {
        scale: reduceMotion
          ? 1
          : entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [0.96, 1],
            }),
      },
    ],
  };
  useEffect(() => {
    if (reduceMotion) {
      entrance.setValue(1);
      return;
    }

    Animated.spring(entrance, {
      toValue: 1,
      damping: 18,
      stiffness: 150,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [entrance, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      activePulse.setValue(0);
      return;
    }

    activePulse.setValue(0);
    Animated.timing(activePulse, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activePulse, reduceMotion, state.index]);


  if (shouldHide) return null;

  return (
    <Animated.View style={[styles.wrapper, barTransform, { paddingBottom: Math.max(insets.bottom, theme.spacing.xs) }]}>
      <BlurView
        intensity={reduceTransparency ? 0 : Math.min(blurIntensity ?? 0, 56)}
        tint="light"
        style={[
          styles.bar,
          showFloatingAction && styles.barWithFloatingAction,
          { backgroundColor: colors.surfaceGlass },
          reduceTransparency && { backgroundColor: colors.surface },
        ]}
      >
        {!reduceTransparency ? (
          <View pointerEvents="none" style={styles.glassLayer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.88)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.82)']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : null}

        {items.map((item) => {
          const route = item.route;
          const isActive = activeRoute?.name === route.name;
          const label = routeLabel(route, descriptors);
          const showOrdersBadge = isSalesBar && route.name === 'orders' && activeOrdersCount > 0;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
            >
              <Animated.View
                style={[
                  styles.tabGlass,
                  isActive && !reduceMotion && { transform: [{ scale: activeScale }] },
                ]}
              >
                <TabIcon
                  routeName={route.name}
                  active={isActive}
                  activeIconColor={activeIconColor}
                  inactiveIconColor={inactiveIconColor}
                  badgeLabel={showOrdersBadge ? ordersBadgeLabel : undefined}
                />
                <AppText
                  variant="caption"
                  weight={isActive ? 'medium' : 'regular'}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  style={[
                    styles.label,
                    isActive ? styles.labelActive : styles.labelInactive,
                  ]}
                >
                  {label}
                </AppText>
              </Animated.View>
            </Pressable>
          );
        })}
      </BlurView>
      {showFloatingAction ? (
        <Pressable
          onPress={() => router.push(newOrderHref)}
          style={({ pressed }) => [styles.floatingActionButton, pressed && styles.actionButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={isPrinterBar ? 'New print' : 'New sale'}
        >
          {!reduceTransparency ? (
            <View pointerEvents="none" style={styles.floatingActionGloss} />
          ) : null}
          <View pointerEvents="none" style={styles.floatingActionInnerRing} />
          <View style={styles.actionIcon}>
            <AppIcon name="PlusSimple" size={24} color={theme.colors.textPrimary} />
          </View>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    minHeight: 64,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 5,
    paddingBottom: 5,
    borderRadius: 999,
    overflow: 'visible',
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.86)',
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  barWithFloatingAction: {
    minHeight: 64,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingTop: 5,
    paddingBottom: 5,
  },
  barReducedTransparency: {
    backgroundColor: theme.colors.surface,
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: 'hidden',
  },
  innerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
  },
  topShine: {
    position: 'absolute',
    top: 1,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  movingSheen: {
    position: 'absolute',
    top: -36,
    bottom: -36,
    width: 56,
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    overflow: 'visible',
  },
  tabItemPressed: {
    opacity: 0.72,
  },
  tabGlass: {
    width: '100%',
    minHeight: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingHorizontal: 1,
    paddingTop: 1,
    overflow: 'visible',
  },
  tabGlassActive: {},
  iconBadgeContainer: {
    position: 'relative',
    width: 32,
    height: 31,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
    zIndex: 2,
  },
  iconShell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShellActive: {},
  badge: {
    position: 'absolute',
    top: 0,
    right: 2,
    zIndex: 3,
    minWidth: 18,
    minHeight: 18,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  badgeText: {
    color: theme.colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  label: {
    maxWidth: '100%',
    fontSize: 10,
    letterSpacing: 0,
  },
  labelActive: {
    color: '#2596be',
    fontWeight: '700',
  },
  labelInactive: {
    color: '#55565A',
    fontWeight: '600',
  },
  actionButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.94 }],
  },
  actionIcon: {
    zIndex: 1,
  },
  floatingActionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.90)',
    backgroundColor: 'rgba(255,255,255,0.62)',
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  floatingActionInnerRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.88)',
  },
  floatingActionGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});
