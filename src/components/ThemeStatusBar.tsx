import { StatusBar } from 'expo-status-bar';
import { getStatusBarStyle } from '@/src/constants/themeResolver';
import { usePreferences } from '@/src/hooks/usePreferences';

export function ThemeStatusBar() {
  const { preferences, isReady } = usePreferences();
  if (!isReady) return <StatusBar style="dark" />;
  return <StatusBar style={getStatusBarStyle(preferences.colorMode)} />;
}
