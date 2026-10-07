import { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useNutritionTargets } from '../../../hooks/useNutritionTargets';
import { Screen } from '../../../components/ui/Screen';
import { NutritionCard } from '../../../components/ui/NutritionCard';
import { Sparkline } from '../../../components/ui/Sparkline';
import { Button } from '../../../components/ui/Button';
import { theme, useTheme, ColorTokens } from '../../../components/theme';

const MOCK_WEIGHT_TREND = [82.1, 81.8, 81.9, 81.5, 81.3, 81.0, 80.8];

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const nutrition = useNutritionTargets();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back</Text>
        <Text style={styles.email}>{session?.user.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's plan</Text>
        <Text style={styles.cardBody}>
          Your training program isn't set up yet — that lands in Sprint 7.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Nutrition targets</Text>
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

      <Text style={styles.sectionTitle}>Weight trend</Text>
      <View style={styles.card}>
        <Sparkline values={MOCK_WEIGHT_TREND} />
        <Text style={styles.mockNote}>Mock data — real tracking starts in Sprint 8</Text>
      </View>

      <Pressable style={styles.scanCta} disabled>
        <Text style={styles.scanCtaTitle}>📸 Body Scan</Text>
        <Text style={styles.scanCtaBody}>Coming in Sprint 4-6</Text>
      </Pressable>

      <Button
        label="Sign out"
        variant="secondary"
        onPress={handleSignOut}
        style={styles.signOut}
      />
    </Screen>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    header: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    greeting: {
      ...theme.typography.h1,
      color: colors.textPrimary,
    },
    email: {
      ...theme.typography.body,
      color: colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    sectionTitle: {
      ...theme.typography.label,
      color: colors.textSecondary,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.md,
    },
    cardTitle: {
      ...theme.typography.h2,
      color: colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    cardBody: {
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
    mockNote: {
      ...theme.typography.caption,
      color: colors.textMuted,
      marginTop: theme.spacing.sm,
    },
    scanCta: {
      backgroundColor: colors.primaryMuted,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      marginTop: theme.spacing.lg,
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
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
    },
  });
}
