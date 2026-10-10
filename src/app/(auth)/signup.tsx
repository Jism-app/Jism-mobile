import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { Screen } from '../../components/ui/Screen';
import { theme } from '../../components/theme';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const styles = useMemo(() => makeStyles(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      <Screen style={styles.page}>
        <StatusBar style="dark" />
        <View style={styles.brandRow}>
          <Image
            source={require('../../../assets/branding/logos/icon-black.png')}
            style={styles.brandIcon}
            resizeMode="contain"
            accessibilityElementsHidden
          />
          <Image
            source={require('../../../assets/branding/logos/wordmark-black.png')}
            style={styles.wordmark}
            resizeMode="contain"
            accessibilityLabel="CADENIQUE"
          />
        </View>
        <View style={styles.confirmContainer}>
          <View style={styles.accentLine} />
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a confirmation link to {email}. Confirm your address, then log in.
          </Text>
          <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.submit}>
            <Text style={styles.submitText}>Back to Login</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.page}>
      <StatusBar style="dark" />
      <Image
        source={require('../../../assets/branding/logos/icon-black.png')}
        style={styles.watermark}
        resizeMode="contain"
        accessibilityElementsHidden
      />
      <View style={styles.brandRow}>
        <Image
          source={require('../../../assets/branding/logos/icon-black.png')}
          style={styles.brandIcon}
          resizeMode="contain"
          accessibilityElementsHidden
        />
        <Image
          source={require('../../../assets/branding/logos/wordmark-black.png')}
          style={styles.wordmark}
          resizeMode="contain"
          accessibilityLabel="CADENIQUE"
        />
      </View>

      <View style={styles.header}>
        <View style={styles.accentLine} />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your personalized fitness journey</Text>
      </View>

      <View style={styles.inputField}>
        <Mail color="#7D8794" size={24} strokeWidth={1.8} />
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#8A93A1"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
      </View>

      <View style={styles.inputField}>
        <LockKeyhole color="#7D8794" size={24} strokeWidth={1.8} />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="Password"
          placeholderTextColor="#8A93A1"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={12}>
          {showPassword ? (
            <EyeOff color="#7D8794" size={23} strokeWidth={1.8} />
          ) : (
            <Eye color="#7D8794" size={23} strokeWidth={1.8} />
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={handleSubmit} disabled={loading} style={styles.submit}>
        {loading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={styles.submitText}>Sign Up</Text>
        )}
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/login">
          <Text style={styles.linkTextBold}>Log in</Text>
        </Link>
      </View>
    </Screen>
  );
}

function makeStyles() {
  return StyleSheet.create({
    page: {
      backgroundColor: '#FFFFFF',
    },
    watermark: {
      position: 'absolute',
      top: 20,
      right: -80,
      width: 420,
      height: 420,
      opacity: 0.045,
    },
    brandRow: {
      alignItems: 'center',
      flexDirection: 'column',
      marginTop: theme.spacing.xl,
    },
    brandIcon: {
      width: 58,
      height: 58,
      marginBottom: theme.spacing.sm,
    },
    wordmark: {
      width: 238,
      height: 58,
    },
    header: {
      marginTop: theme.spacing.xxl,
      marginBottom: theme.spacing.lg,
    },
    accentLine: {
      width: 34,
      height: 4,
      backgroundColor: '#CFE900',
      marginBottom: theme.spacing.md,
    },
    title: {
      ...theme.typography.h1,
      color: '#071007',
      fontSize: 34,
      lineHeight: 40,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      ...theme.typography.body,
      color: '#7D8794',
    },
    inputField: {
      height: 68,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E0E4E9',
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.88)',
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    input: {
      flex: 1,
      height: '100%',
      color: '#071007',
      fontSize: 16,
      marginLeft: theme.spacing.md,
    },
    submit: {
      height: 60,
      borderRadius: 16,
      backgroundColor: '#D7EF00',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.xs,
    },
    submitText: {
      ...theme.typography.h2,
      color: '#000000',
      fontWeight: '800',
    },
    error: {
      ...theme.typography.caption,
      color: '#B42318',
      marginBottom: theme.spacing.md,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme.spacing.xl,
    },
    footerText: {
      ...theme.typography.body,
      color: '#7D8794',
    },
    linkTextBold: {
      ...theme.typography.bodyMedium,
      color: '#B4D400',
    },
    confirmContainer: {
      flex: 1,
      justifyContent: 'center',
    },
  });
}
