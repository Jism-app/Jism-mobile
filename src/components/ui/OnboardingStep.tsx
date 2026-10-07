import { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from './Screen';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import { theme, useTheme, ColorTokens } from '../theme';

interface OnboardingStepProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  showBack?: boolean;
  onSkip?: () => void;
  scrollable?: boolean;
}

export function OnboardingStep({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  continueLoading = false,
  showBack = true,
  onSkip,
  scrollable = true,
}: OnboardingStepProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Screen scroll={scrollable}>
      <View style={styles.progressRow}>
        {showBack && router.canGoBack() ? (
          <Text style={styles.back} onPress={() => router.back()}>
            ← Back
          </Text>
        ) : (
          <View />
        )}
        <Text style={styles.stepCount}>
          {step} / {totalSteps}
        </Text>
      </View>
      <ProgressBar step={step} totalSteps={totalSteps} />

      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.content}>{children}</View>

      <Button
        label={continueLabel}
        onPress={onContinue}
        disabled={continueDisabled}
        loading={continueLoading}
        style={styles.continueButton}
      />

      {onSkip ? (
        <Text style={styles.skip} onPress={onSkip}>
          Skip this
        </Text>
      ) : null}
    </Screen>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    back: {
      ...theme.typography.body,
      color: colors.textSecondary,
    },
    stepCount: {
      ...theme.typography.caption,
      color: colors.textMuted,
    },
    header: {
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
    },
    title: {
      ...theme.typography.h1,
      color: colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      ...theme.typography.body,
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
    },
    continueButton: {
      marginTop: theme.spacing.lg,
    },
    skip: {
      ...theme.typography.bodyMedium,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
  });
}
