import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
      <ThemeProvider>
        <AuthProvider>
          <ThemedStatusBar />
          <Slot />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
