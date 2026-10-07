import { spacing, radius } from './spacing';
import { typography } from './typography';

// NOTE: `colors` is intentionally NOT exported here anymore. Colors are
// now theme-dependent (light/dark) and must come from useTheme(), not
// a static import — that's the whole point of this refactor. Importing
// `theme.colors.X` statically would silently freeze on whichever mode
// was active at module-load time and never update when the OS setting
// changes.
export const theme = {
  spacing,
  radius,
  typography,
};

export { spacing, radius, typography };
export { useTheme, ThemeProvider } from './ThemeContext';
export type { ColorTokens } from './colors';
export type { SpacingToken, RadiusToken } from './spacing';
export type { TypographyToken } from './typography';
