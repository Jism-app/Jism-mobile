import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme, useTheme, ColorTokens } from '../theme';

interface MacroRowProps {
  label: string;
  grams: number;
  kcalPerGram: number;
  totalKcal: number;
  color: string;
  colors: ColorTokens;
}

function MacroRow({ label, grams, kcalPerGram, totalKcal, color, colors }: MacroRowProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const kcal = grams * kcalPerGram;
  const pct = totalKcal > 0 ? Math.min(100, (kcal / totalKcal) * 100) : 0;

  return (
    <View style={styles.macroRow}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{grams.toFixed(0)}g</Text>
      </View>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

interface NutritionCardProps {
  dailyCalories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export function NutritionCard({ dailyCalories, proteinG, fatG, carbsG }: NutritionCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.calorieRow}>
        <Text style={styles.calorieValue}>{dailyCalories.toFixed(0)}</Text>
        <Text style={styles.calorieLabel}>calories / day</Text>
      </View>

      <MacroRow label="Protein" grams={proteinG} kcalPerGram={4} totalKcal={dailyCalories} color={colors.primary} colors={colors} />
      <MacroRow label="Fat" grams={fatG} kcalPerGram={9} totalKcal={dailyCalories} color={colors.warning} colors={colors} />
      <MacroRow label="Carbs" grams={carbsG} kcalPerGram={4} totalKcal={dailyCalories} color={colors.success} colors={colors} />
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.md,
    },
    calorieRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: theme.spacing.md,
    },
    calorieValue: {
      ...theme.typography.display,
      color: colors.textPrimary,
      marginRight: theme.spacing.xs,
    },
    calorieLabel: {
      ...theme.typography.body,
      color: colors.textSecondary,
    },
    macroRow: {
      marginBottom: theme.spacing.sm,
    },
    macroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    macroLabel: {
      ...theme.typography.caption,
      color: colors.textSecondary,
    },
    macroValue: {
      ...theme.typography.label,
      color: colors.textPrimary,
    },
    macroTrack: {
      height: 6,
      borderRadius: theme.radius.full,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    macroFill: {
      height: '100%',
      borderRadius: theme.radius.full,
    },
  });
}
