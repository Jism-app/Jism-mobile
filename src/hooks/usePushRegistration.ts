import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { registerForPush, syncPushToken } from '../lib/notifications';

// Registers the device whenever a user is signed in, and keeps the backend
// in sync when FCM rotates the token.
export function usePushRegistration(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    registerForPush();
    const unsubscribe = messaging().onTokenRefresh((token) => {
      if (!cancelled) syncPushToken(token);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [userId]);
}