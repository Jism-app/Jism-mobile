import { PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { api } from './api';

// Module-level so signOut can unregister the exact token this device registered.
let currentToken: string | null = null;

export async function requestPushPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Android 12 and below need no runtime permission.
    if (Number(Platform.Version) < 33) return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

// Sends a token to the backend. Never throws: a push problem must not
// break login or app start.
export async function syncPushToken(token: string): Promise<void> {
  try {
    await api.post('/notifications/devices', {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    currentToken = token;
  } catch (err) {
    console.warn('[push] failed to register token with backend', err);
  }
}

export async function registerForPush(): Promise<void> {
  try {
    const granted = await requestPushPermission();
    if (!granted) return;
    const token = await messaging().getToken();
    if (token) await syncPushToken(token);
  } catch (err) {
    console.warn('[push] registration failed', err);
  }
}

// Call BEFORE supabase.auth.signOut(): the backend call needs the JWT.
export async function unregisterPushToken(): Promise<void> {
  try {
    if (currentToken) {
      await api.delete('/notifications/devices', { token: currentToken });
    }
    // Invalidates the token on Firebase's side too.
    await messaging().deleteToken();
  } catch (err) {
    console.warn('[push] failed to unregister token', err);
  } finally {
    currentToken = null;
  }
}