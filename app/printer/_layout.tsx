import { Tabs } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';
import { LiquidTabBar } from '@/src/components/LiquidTabBar';

export default function PrinterLayout() {
  return (
    <AuthGate allowedRoles={['printer', 'printer_operator']}>
      <Tabs
        tabBar={(props) => <LiquidTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="batch-select" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="queue" options={{ title: 'Queue' }} />
        <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
        <Tabs.Screen name="wages" options={{ title: 'Wages' }} />
        <Tabs.Screen name="me" options={{ title: 'Me' }} />
        <Tabs.Screen name="new-order" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="nfc/[jobId]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="qa/[jobId]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="settings" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
    </AuthGate>
  );
}
