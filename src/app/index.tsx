import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { CadeniqueSplash } from '../components/ui/CadeniqueSplash';
import { CadeniqueLoader } from '../components/ui/CadeniqueLoader';

const WELCOME_SEEN_KEY = 'cadenique-welcome-seen';
let startupSplashShown = false;

type Destination = '/welcome' | '/(auth)/login' | '/(onboarding)/age' | '/(home)/(tabs)';

export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [welcomeSeen, setWelcomeSeen] = useState(false);
  const [showStartupSplash] = useState(() => {
    if (startupSplashShown) return false;
    startupSplashShown = true;
    return true;
  });
  const [startupSplashFinished, setStartupSplashFinished] = useState(!showStartupSplash);

  useEffect(() => {
    if (!showStartupSplash) return;

    const timer = setTimeout(() => setStartupSplashFinished(true), 3000);
    return () => clearTimeout(timer);
  }, [showStartupSplash]);

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

  if (showStartupSplash && !startupSplashFinished) {
    return <CadeniqueSplash />;
  }

  if (authLoading || !welcomeChecked || checkingProfile || !destination) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
        <CadeniqueLoader />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
