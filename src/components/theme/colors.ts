// CADENIQUE color palettes — deep green, lime, energy yellow, black, and
// white tuned per mode for contrast and readability.

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
  primary: '#90B800',
  primaryMuted: '#266210',
  background: '#000000',
  surface: '#081008',
  surfaceElevated: '#102010',
  textPrimary: '#FFFFFF',
  textSecondary: '#D7DED3',
  textMuted: '#9BAA96',
  success: '#90B800',
  warning: '#E1E100',
  error: '#E1E100',
  border: '#266210',
  white: '#FFFFFF',
  black: '#000000',
};

export const lightColors: ColorTokens = {
  primary: '#063B00',
  primaryMuted: '#DCE8D7',
  background: '#F7F9F6',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  textPrimary: '#071007',
  textSecondary: '#40503D',
  textMuted: '#6E7D6A',
  success: '#266210',
  warning: '#90B800',
  error: '#063B00',
  border: '#C9D8C4',
  white: '#FFFFFF',
  black: '#000000',
};
