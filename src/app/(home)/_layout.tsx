import { Redirect, Slot } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function HomeLayout() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return <Slot />;
}
