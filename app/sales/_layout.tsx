import { Tabs } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';
import { LiquidTabBar } from '@/src/components/LiquidTabBar';

export default function SalesLayout() {
  return (
    <AuthGate allowedRoles={['sales', 'agent']}>
      <Tabs
        tabBar={(props) => <LiquidTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
        <Tabs.Screen name="payouts" options={{ title: 'Payouts' }} />
        <Tabs.Screen name="me" options={{ title: 'Me' }} />
        <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="new-order" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="settings" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
    </AuthGate>
  );
}
