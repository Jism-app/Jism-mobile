import { useTheme, ColorTokens } from '../theme';

// Each component declares its own styles next to its markup:
//
//   const useStyles = createThemedStyles((colors) => StyleSheet.create({ ... }));
//   const { styles, colors } = useStyles();
//
// Styles are cached per color palette (light/dark), so a list of 100 rows
// builds one StyleSheet, not 100.
export function createThemedStyles<T>(factory: (colors: ColorTokens) => T) {
  const cache = new WeakMap<ColorTokens, T>();
  return function useThemedStyles() {
    const { colors } = useTheme();
    let styles = cache.get(colors);
    if (!styles) {
      styles = factory(colors);
      cache.set(colors, styles);
    }
    return { styles, colors };
  };
}
