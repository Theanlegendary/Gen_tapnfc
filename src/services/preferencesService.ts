import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeUiPreferences } from '@/src/constants/themeResolver';
import { UiPreferences } from '@/src/types/models';

const PREFERENCE_KEY = 'ui_preferences_v2';

export const defaultUiPreferences: UiPreferences = normalizeUiPreferences({
  language: 'en',
  theme: 'vibrant_pink',
  profileTheme: 'aqua',
  colorMode: 'light',
  typographyColor: 'deep_teal',
});

export async function getUiPreferences(): Promise<UiPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCE_KEY);
    if (!raw) {
      const legacy = await AsyncStorage.getItem('ui_preferences_v1');
      if (legacy) {
        const parsed = normalizeUiPreferences(JSON.parse(legacy) as Partial<UiPreferences>);
        await setUiPreferences(parsed);
        return parsed;
      }
      return defaultUiPreferences;
    }

    return normalizeUiPreferences(JSON.parse(raw) as Partial<UiPreferences>);
  } catch {
    return defaultUiPreferences;
  }
}

export async function setUiPreferences(preferences: UiPreferences) {
  await AsyncStorage.setItem(PREFERENCE_KEY, JSON.stringify(preferences));
}

export async function resetUiPreferences() {
  await AsyncStorage.removeItem(PREFERENCE_KEY);
}
