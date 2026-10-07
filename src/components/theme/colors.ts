// PhysiqueAI color palettes — light and dark. The coral/orange brand
// color (#FF5A36) stays identical across both modes; everything else is
// tuned per-mode for contrast and readability.

export interface ColorTokens {
  primary: string;
  primaryMuted: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  white: string;
  black: string;
}

export const darkColors: ColorTokens = {
  primary: '#FF5A36',
  primaryMuted: '#4A2A20',
  background: '#0E0F12',
  surface: '#1A1C21',
  surfaceElevated: '#24272E',
  textPrimary: '#F5F5F7',
  textSecondary: '#9A9DA6',
  textMuted: '#5C5F68',
  success: '#3DD68C',
  warning: '#F5B942',
  error: '#FF5C5C',
  border: '#2C2F36',
  white: '#FFFFFF',
  black: '#000000',
};

export const lightColors: ColorTokens = {
  primary: '#FF5A36', // identical brand color in both modes
  primaryMuted: '#FFE4DA', // light tint instead of dark tint
  background: '#F7F7F8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#14151A',
  textSecondary: '#5C5F68',
  textMuted: '#9A9DA6',
  success: '#1B9A63', // darkened for contrast against a light background
  warning: '#B9790A',
  error: '#D93A3A',
  border: '#E2E3E7',
  white: '#FFFFFF',
  black: '#000000',
};
