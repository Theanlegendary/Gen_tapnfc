import { Tabs } from 'expo-router';
import { AuthGate } from '@/src/components/AuthGate';
import { LiquidTabBar } from '@/src/components/LiquidTabBar';

export default function TabsLayout() {
  return (
    <AuthGate allowedRoles={['guest', 'customer']}>
      <Tabs
        tabBar={(props) => <LiquidTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="attendance" options={{ title: 'Connections' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </AuthGate>
  );
}
