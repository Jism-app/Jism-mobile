import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Screen } from '../../components/ui/Screen';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { theme, useTheme, ColorTokens } from '../../components/theme';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const { error: resetError } = await resetPassword(email.trim());
    setLoading(false);

    if (resetError) {
      setError(resetError);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <Screen>
        <View style={styles.confirmContainer}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            If an account exists for {email}, we sent a password reset link.
          </Text>
          <Button
            label="Back to login"
            variant="secondary"
            onPress={() => router.replace('/(auth)/login')}
            style={styles.submit}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>We'll email you a reset link</Text>
      </View>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholder="you@example.com"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Send reset link" onPress={handleSubmit} loading={loading} style={styles.submit} />

      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkTextBold}>Back to login</Text>
      </Link>
    </Screen>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    header: {
      marginTop: theme.spacing.xxl,
      marginBottom: theme.spacing.xl,
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
    submit: {
      marginTop: theme.spacing.sm,
    },
    error: {
      ...theme.typography.caption,
      color: colors.error,
      marginBottom: theme.spacing.md,
    },
    link: {
      marginTop: theme.spacing.lg,
      alignSelf: 'center',
    },
    linkTextBold: {
      ...theme.typography.bodyMedium,
      color: colors.primary,
    },
    confirmContainer: {
      flex: 1,
      justifyContent: 'center',
    },
  });
}
