import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  MavenPro_400Regular,
  MavenPro_500Medium,
  MavenPro_600SemiBold,
  MavenPro_700Bold,
} from '@expo-google-fonts/maven-pro';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeStatusBar } from '@/src/components/ThemeStatusBar';
import { AuthProvider } from '@/src/providers/AuthProvider';
import { GuestGateProvider } from '@/src/providers/GuestGateProvider';
import { PreferencesProvider } from '@/src/providers/PreferencesProvider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    MavenPro_400Regular,
    MavenPro_500Medium,
    MavenPro_600SemiBold,
    MavenPro_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <AuthProvider>
      <PreferencesProvider>
        <GuestGateProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="sales" />
            <Stack.Screen name="printer" />
            <Stack.Screen name="qa" />
            <Stack.Screen name="shipping" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="new-order" />
            <Stack.Screen name="order-detail/[orderId]" />
            <Stack.Screen name="activate-card" options={{ headerShown: true, title: 'Activate Card' }} />
            <Stack.Screen name="edit-bio" options={{ headerShown: true, title: 'Edit Bio Page' }} />
            <Stack.Screen name="theme-picker" options={{ headerShown: false }} />
            <Stack.Screen name="language-picker" options={{ headerShown: false }} />
            <Stack.Screen name="public/[slug]" options={{ headerShown: true, title: 'Public Bio Page' }} />
            <Stack.Screen name="scan" options={{ headerShown: false }} />
            <Stack.Screen name="nfc-demo" options={{ headerShown: false }} />
            <Stack.Screen name="guest-analytics" options={{ headerShown: false }} />
            <Stack.Screen name="guest-design" options={{ headerShown: false }} />
            <Stack.Screen name="guest-checkout" options={{ headerShown: false }} />
            <Stack.Screen name="guest-track-order" options={{ headerShown: false }} />
            <Stack.Screen name="guest-post-login-choice" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <ThemeStatusBar />
        </GuestGateProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
