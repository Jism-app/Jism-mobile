import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme, useTheme, ColorTokens } from '../theme';

interface SparklineProps {
  values: number[];
  height?: number;
}

export function Sparkline({ values, height = 40 }: SparklineProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <View style={[styles.container, { height }]}>
      {values.map((value, i) => {
        const pct = ((value - min) / range) * 0.8 + 0.2;
        return (
          <View
            key={i}
            style={[
              styles.bar,
              { height: `${pct * 100}%`, opacity: i === values.length - 1 ? 1 : 0.5 },
            ]}
          />
        );
      })}
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
    },
    bar: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: theme.radius.sm,
      minHeight: 4,
    },
  });
}
