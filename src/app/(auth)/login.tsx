import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Screen } from '../../components/ui/Screen';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { theme, useTheme, ColorTokens } from '../../components/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);

    if (signInError) {
      setError(signInError);
      return;
    }
    router.replace('/');
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to continue your program</Text>
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
        placeholder="••••••••"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Log in" onPress={handleSubmit} loading={loading} style={styles.submit} />

      <Link href="/(auth)/forgot-password" style={styles.link}>
        <Text style={styles.linkText}>Forgot password?</Text>
      </Link>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/(auth)/signup">
          <Text style={styles.linkTextBold}>Sign up</Text>
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
    link: {
      marginTop: theme.spacing.lg,
      alignSelf: 'center',
    },
    linkText: {
      ...theme.typography.bodyMedium,
      color: colors.textSecondary,
    },
    linkTextBold: {
      ...theme.typography.bodyMedium,
      color: colors.primary,
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
  });
}
