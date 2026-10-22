import { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useNutritionTargets } from '../../../hooks/useNutritionTargets';
import { useProfile } from '../../../hooks/useProfile';
import { Screen } from '../../../components/ui/Screen';
import { HomeHeader } from '../../../components/ui/HomeHeader';
import { GoalCard } from '../../../components/ui/GoalCard';
import { NutritionCard } from '../../../components/ui/NutritionCard';
import { Sparkline } from '../../../components/ui/Sparkline';
import { Button } from '../../../components/ui/Button';
import { theme, useTheme, ColorTokens } from '../../../components/theme';

const MOCK_WEIGHT_TREND = [82.1, 81.8, 81.9, 81.5, 81.3, 81.0, 80.8];

// Mock progress until real tracking lands (Sprint 8).
const MOCK_PROGRESS = { water: 750, calories: 1200, protein: 60, workouts: 2 };

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const nutrition = useNutritionTargets();
  const profile = useProfile();

  const handleSignOut = async () => {
    await signOut();
  };

  const calorieTarget = nutrition.data?.daily_calories ?? 2000;
  const proteinTarget = nutrition.data?.protein_g ?? 120;

  const latestWeight = MOCK_WEIGHT_TREND[MOCK_WEIGHT_TREND.length - 1];
  const weightDelta = latestWeight - MOCK_WEIGHT_TREND[0];
  const deltaLabel = `${weightDelta > 0 ? '+' : '−'}${Math.abs(weightDelta).toFixed(1)} kg this week`;

  return (
    <Screen scroll>
      <HomeHeader email={session?.user.email} profile={profile.data ?? null} />

      {/* Today */}
      <View style={styles.planCard}>
        <Text style={styles.planTitle}>Today's plan</Text>
        <Text style={styles.planBody}>
          Your training program isn't set up yet — that lands in Sprint 7.
        </Text>
      </View>

      {/* Daily goals */}
      <SectionTitle title="Daily goals" note="Preview data" styles={styles} />
      <View style={styles.goalRow}>
        <GoalCard
          title="Water"
          current={MOCK_PROGRESS.water}
          target={2000}
          unit="ml"
          color={colors.primary}
        />
        <GoalCard
          title="Calories"
          current={MOCK_PROGRESS.calories}
          target={calorieTarget}
          unit="kcal"
          color={colors.warning}
        />
      </View>
      <View style={styles.goalRow}>
        <GoalCard
          title="Protein"
          current={MOCK_PROGRESS.protein}
          target={proteinTarget}
          unit="g"
          color={colors.warning}
        />
        <GoalCard
          title="Workout"
          current={MOCK_PROGRESS.workouts}
          target={4}
          unit="sessions"
          color={colors.primary}
        />
      </View>

      {/* Nutrition */}
      <SectionTitle title="Nutrition targets" styles={styles} />
      {nutrition.isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : nutrition.isError ? (
        <View style={styles.card}>
          <Text style={styles.errorText}>
            Couldn't load your nutrition targets. Pull to refresh or check your connection.
          </Text>
        </View>
      ) : nutrition.data ? (
        <NutritionCard
          dailyCalories={nutrition.data.daily_calories}
          proteinG={nutrition.data.protein_g}
          fatG={nutrition.data.fat_g}
          carbsG={nutrition.data.carbs_g}
        />
      ) : null}

      {/* Progress */}
      <SectionTitle title="Weight trend" note="Preview data" styles={styles} />
      <View style={styles.card}>
        <View style={styles.weightRow}>
          <Text style={styles.weightValue}>{latestWeight.toFixed(1)}</Text>
          <Text style={styles.weightUnit}>kg</Text>
          <Text style={styles.weightDelta}>{deltaLabel}</Text>
        </View>
        <Sparkline values={MOCK_WEIGHT_TREND} />
      </View>

      {/* Body scan */}
      <Pressable style={styles.scanCta} disabled>
        <Text style={styles.scanCtaTitle}>📸 Body Scan</Text>
        <Text style={styles.scanCtaBody}>Coming in Sprint 4-6</Text>
      </Pressable>

      <Button
        label="Sign out"
        variant="ghost"
        onPress={handleSignOut}
        style={styles.signOut}
      />
    </Screen>
  );
}

function SectionTitle({
  title,
  note,
  styles,
}: {
  title: string;
  note?: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
      ...theme.typography.label,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    sectionNote: {
      ...theme.typography.caption,
      color: colors.textMuted,
    },
    goalRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.md,
    },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      padding: theme.spacing.md,
    },
    planTitle: {
      ...theme.typography.h2,
      color: colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    planBody: {
      ...theme.typography.body,
      color: colors.textSecondary,
    },
    loader: {
      marginVertical: theme.spacing.lg,
    },
    errorText: {
      ...theme.typography.body,
      color: colors.error,
    },
    weightRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: theme.spacing.md,
    },
    weightValue: {
      ...theme.typography.h1,
      color: colors.textPrimary,
    },
    weightUnit: {
      ...theme.typography.body,
      color: colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
    weightDelta: {
      ...theme.typography.caption,
      color: colors.success,
      marginLeft: 'auto',
    },
    scanCta: {
      backgroundColor: colors.primaryMuted,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginTop: theme.spacing.xl,
      opacity: 0.6,
    },
    scanCtaTitle: {
      ...theme.typography.h2,
      color: colors.textPrimary,
    },
    scanCtaBody: {
      ...theme.typography.caption,
      color: colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    signOut: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
  });
}