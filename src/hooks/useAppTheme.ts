import { usePreferences } from '@/src/hooks/usePreferences';

export function useAppTheme() {
  return usePreferences();
}
