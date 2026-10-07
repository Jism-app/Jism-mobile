import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingStep } from '../../components/ui/OnboardingStep';
import { useOnboardingStore, isDraftComplete } from '../../store/onboardingStore';
import { api, ApiError } from '../../lib/api';
import { theme, useTheme, ColorTokens } from '../../components/theme';

const TOTAL_STEPS = 9;

const SUMMARY_ROWS: { key: keyof ReturnType<typeof useOnboardingStore.getState>['draft']; label: string }[] = [
  { key: 'age', label: 'Age' },
  { key: 'sex', label: 'Sex' },
  { key: 'height_cm', label: 'Height (cm)' },
  { key: 'weight_kg', label: 'Weight (kg)' },
  { key: 'goal', label: 'Goal' },
  { key: 'experience_level', label: 'Experience' },
  { key: 'training_days_per_week', label: 'Training days/week' },
];

export default function SummaryStep() {
  const { draft, reset } = useOnboardingStore();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const complete = isDraftComplete(draft);

  const handleSubmit = async () => {
    if (!complete) {
      setError('Some required steps are incomplete — go back and fill them in.');
      return;
    }
    setError(null);
    setLoading(true);
    console.log('[onboarding] submitting draft:', JSON.stringify(draft));
    try {
      const result = await api.post('/profiles/me', draft);
      console.log('[onboarding] profile created:', JSON.stringify(result));
      reset();
      router.replace('/');
    } catch (err) {
      console.error('[onboarding] submit failed:', err);
      if (err instanceof ApiError) {
        setError(`(${err.status}) ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStep
      step={9}
      totalSteps={TOTAL_STEPS}
      title="Review your info"
      subtitle="This sets up your initial nutrition and training targets"
      onContinue={handleSubmit}
      continueLabel="Finish setup"
      continueLoading={loading}
    >
      <View style={styles.card}>
        {SUMMARY_ROWS.map(({ key, label }) => (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{String(draft[key] ?? '—')}</Text>
          </View>
        ))}
        <View style={styles.row}>
          <Text style={styles.label}>Equipment</Text>
          <Text style={styles.value}>
            {draft.equipment.length ? draft.equipment.join(', ') : 'None'}
          </Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingStep>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    label: {
      ...theme.typography.body,
      color: colors.textSecondary,
    },
    value: {
      ...theme.typography.bodyMedium,
      color: colors.textPrimary,
    },
    error: {
      ...theme.typography.caption,
      color: colors.error,
      marginTop: theme.spacing.md,
    },
  });
}
