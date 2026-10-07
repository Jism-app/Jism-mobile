import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ColorTokens } from './colors';

export type Scheme = 'light' | 'dark';

interface ThemeValue {
  colors: ColorTokens;
  scheme: Scheme;
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

// Follows the device's system setting automatically — no in-app toggle
// for now (easy to add later: swap useColorScheme() for a Zustand-backed
// override that defaults to 'system'). Defaults to dark if the system
// preference is unavailable/null, matching the app's original dark-first
// design intent.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const scheme: Scheme = systemScheme === 'light' ? 'light' : 'dark';
  const colors = scheme === 'light' ? lightColors : darkColors;

  const value = useMemo(() => ({ colors, scheme }), [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
