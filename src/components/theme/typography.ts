import { Platform } from 'react-native';

// System fonts for now — no custom font loading in Sprint 1. A branded
// display font can be layered in later (Sprint 7+ UI polish) without
// touching this scale's structure.
const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  fontFamily,

  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' as const },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, lineHeight: 22, fontWeight: '500' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 16, fontWeight: '600' as const },
} as const;

export type TypographyToken = keyof Omit<typeof typography, 'fontFamily'>;
