import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { useAuth } from './AuthContext';
import { NotificationBanner } from '../components/ui/NotificationBanner';

// Must be registered at module scope. Background/quit notifications that
// carry a `notification` payload are displayed by the OS itself, so there is
// nothing to do here — but Firebase warns if no handler is registered.
messaging().setBackgroundMessageHandler(async () => {});

interface BannerMessage {
  id: number;
  title: string;
  body: string;
  route?: string;
}

interface NotificationContextValue {
  showBanner: (title: string, body: string, route?: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// The backend can put a `route` (e.g. "/(home)/(tabs)/exercices") in the push
// data. Only in-app paths are accepted — never a full URL.
function routeOf(remote: FirebaseMessagingTypes.RemoteMessage): string | undefined {
  const route = remote.data?.route;
  if (typeof route === 'string' && route.startsWith('/') && !route.includes('://')) {
    return route;
  }
  return undefined;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [message, setMessage] = useState<BannerMessage | null>(null);
  const idRef = useRef(0);
  const handledInitial = useRef(false);

  const showBanner = useCallback((title: string, body: string, route?: string) => {
    idRef.current += 1;
    setMessage({ id: idRef.current, title, body, route });
  }, []);

  const openRoute = useCallback(
    (route?: string) => {
      if (route) router.push(route);
    },
    [router],
  );

  // App in foreground: the OS shows nothing, so we render our own banner.
  useEffect(() => {
    return messaging().onMessage(async (remote) => {
      const title = remote.notification?.title;
      const body = remote.notification?.body;
      if (!title && !body) return;
      showBanner(title ?? 'CADENIQUE', body ?? '', routeOf(remote));
    });
  }, [showBanner]);

  // App in background, user taps the system notification.
  useEffect(() => {
    if (!session) return;
    return messaging().onNotificationOpenedApp((remote) => openRoute(routeOf(remote)));
  }, [session, openRoute]);

  // App was fully closed, user tapped the notification to launch it.
  useEffect(() => {
    if (loading || !session || handledInitial.current) return;
    handledInitial.current = true;
    messaging()
      .getInitialNotification()
      .then((remote) => {
        if (remote) openRoute(routeOf(remote));
      });
  }, [loading, session, openRoute]);

  const value = useMemo(() => ({ showBanner }), [showBanner]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {message ? (
        <NotificationBanner
          key={message.id}
          title={message.title}
          body={message.body}
          onPress={() => openRoute(message.route)}
          onDismiss={() => setMessage((m) => (m?.id === message.id ? null : m))}
        />
      ) : null}
    </NotificationContext.Provider>
  );
}

export function useNotificationBanner() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationBanner must be used within a NotificationProvider');
  return ctx;
}