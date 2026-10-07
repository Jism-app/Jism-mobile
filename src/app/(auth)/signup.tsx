import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Screen } from '../../components/ui/Screen';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { theme, useTheme, ColorTokens } from '../../components/theme';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email.trim(), password);
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Screen>
        <View style={styles.confirmContainer}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a confirmation link to {email}. Confirm your address, then log in.
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
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Start your personalized program</Text>
      </View>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="At least 6 characters"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Sign up" onPress={handleSubmit} loading={loading} style={styles.submit} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/login">
          <Text style={styles.linkTextBold}>Log in</Text>
        </Link>
      </View>
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
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing.xl,
    },
    footerText: {
      ...theme.typography.body,
      color: colors.textSecondary,
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
