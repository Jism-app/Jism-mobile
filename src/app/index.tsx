import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { useTheme, ColorTokens } from '../components/theme';
import { CadeniqueLoader } from '../components/ui/CadeniqueLoader';
import { useMemo } from 'react';

const WELCOME_SEEN_KEY = 'cadenique-welcome-seen';

type Destination = '/welcome' | '/(auth)/login' | '/(onboarding)/age' | '/(home)/(tabs)';

export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [welcomeSeen, setWelcomeSeen] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(WELCOME_SEEN_KEY).then((value) => {
      setWelcomeSeen(value === 'true');
      setWelcomeChecked(true);
    });
  }, []);

  useEffect(() => {
    if (authLoading || !welcomeChecked) return;

    if (!welcomeSeen) {
      setDestination('/welcome');
      return;
    }

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
  }, [session, authLoading, welcomeChecked, welcomeSeen]);

  if (authLoading || !welcomeChecked || checkingProfile || !destination) {
    return (
      <View style={styles.container}>
        <CadeniqueLoader />
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
