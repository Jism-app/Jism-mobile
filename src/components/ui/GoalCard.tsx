import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme, useTheme, ColorTokens } from '../theme';
import { ProgressRing } from './ProgressRing';

interface GoalCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  /** Ring color. Defaults to the theme's primary. */
  color?: string;
}

// 5500 -> "5,500" (no Intl dependency, so output is identical on every device).
function formatNumber(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function GoalCard({ title, current, target, unit, color }: GoalCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const progress = target > 0 ? current / target : 0;

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${title}: ${formatNumber(current)} of ${formatNumber(target)} ${unit}`}
    >
      <Text style={styles.title}>{title}</Text>

      <View style={styles.ringWrap}>
        <ProgressRing progress={progress} color={color ?? colors.primary} size={104} strokeWidth={10}>
          <Text style={styles.value}>{formatNumber(current)}</Text>
          <Text style={styles.unit}>{unit}</Text>
        </ProgressRing>
      </View>

      <Text style={styles.target}>
        {formatNumber(target)} {unit}
      </Text>
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.md,
    },
    title: {
      ...theme.typography.label,
      color: colors.textSecondary,
    },
    ringWrap: {
      alignItems: 'center',
      marginVertical: theme.spacing.md,
    },
    value: {
      ...theme.typography.bodyMedium,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    unit: {
      ...theme.typography.caption,
      color: colors.textMuted,
    },
    target: {
      ...theme.typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
}