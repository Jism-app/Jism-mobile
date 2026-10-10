import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { theme, useTheme, ColorTokens } from '../theme';

interface ProgressBarProps {
  step: number;
  totalSteps: number;
}

export function ProgressBar({ step, totalSteps }: ProgressBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pct = Math.min(100, Math.max(0, (step / totalSteps) * 100));

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    track: {
      height: 4,
      borderRadius: theme.radius.full,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.warning,
      borderRadius: theme.radius.full,
    },
  });
}
