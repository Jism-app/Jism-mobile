import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { useTheme, ColorTokens } from '../components/theme';
import { useMemo } from 'react';

type Destination = '/(auth)/login' | '/(onboarding)/age' | '/(home)/(tabs)';

export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      setDestination('/(auth)/login');
      return;
    }

    setCheckingProfile(true);
    api
      .get('/profiles/me')
      .then(() => setDestination('/(home)/(tabs)'))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setDestination('/(onboarding)/age');
        } else {
          setDestination('/(onboarding)/age');
        }
      })
      .finally(() => setCheckingProfile(false));
  }, [session, authLoading]);

  if (authLoading || checkingProfile || !destination) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={destination} />;
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
