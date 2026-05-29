import { PropsWithChildren, createContext, useEffect, useMemo, useRef, useState } from 'react';
import { resolveAppColors, type ResolvedAppColors } from '@/src/constants/themeResolver';
import {
  defaultUiPreferences,
  getUiPreferences,
  resetUiPreferences,
  setUiPreferences,
} from '@/src/services/preferencesService';
import { UiPreferences } from '@/src/types/models';

interface PreferencesContextValue {
  preferences: UiPreferences;
  colors: ResolvedAppColors;
  isReady: boolean;
  updatePreferences: (next: Partial<UiPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState<UiPreferences>(defaultUiPreferences);
  const [isReady, setIsReady] = useState(false);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;
  const persistQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    getUiPreferences()
      .then((stored) => {
        preferencesRef.current = stored;
        setPreferences(stored);
      })
      .finally(() => setIsReady(true));
  }, []);

  const colors = useMemo(() => resolveAppColors(preferences), [preferences]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      colors,
      isReady,
      async updatePreferences(next) {
        const previous = preferencesRef.current;
        const updated = { ...preferencesRef.current, ...next };
        preferencesRef.current = updated;
        setPreferences(updated);

        const persist = persistQueueRef.current.then(() => setUiPreferences(preferencesRef.current));
        persistQueueRef.current = persist.catch(() => undefined);

        try {
          await persist;
        } catch (error) {
          preferencesRef.current = previous;
          setPreferences(previous);
          throw error;
        }
      },
      async resetPreferences() {
        const previous = preferencesRef.current;
        preferencesRef.current = defaultUiPreferences;
        setPreferences(defaultUiPreferences);

        const persist = persistQueueRef.current.then(() => resetUiPreferences());
        persistQueueRef.current = persist.catch(() => undefined);

        try {
          await persist;
        } catch (error) {
          preferencesRef.current = previous;
          setPreferences(previous);
          throw error;
        }
      },
    }),
    [colors, isReady, preferences]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export { PreferencesContext };
