import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { queryClient } from '../lib/queryClient';
import { ThemeProvider, useTheme } from '../components/theme';

function ThemedStatusBar() {
  const { scheme } = useTheme();
  // Light content (white icons/text) on a dark background, and vice versa.
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ThemedStatusBar />
            <Stack
              screenOptions={{
                animation: 'none',
                headerShown: false,
                contentStyle: { backgroundColor: '#020500' },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
