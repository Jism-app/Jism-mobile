import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, useTheme, ColorTokens } from '../theme';

const VISIBLE_MS = 4500;
const HIDDEN_Y = -220;

interface NotificationBannerProps {
  title: string;
  body: string;
  onPress: () => void;
  onDismiss: () => void;
}

export function NotificationBanner({ title, body, onPress, onDismiss }: NotificationBannerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current;
  const closing = useRef(false);

  const dismiss = useCallback(
    (after?: () => void) => {
      if (closing.current) return;
      closing.current = true;
      Animated.timing(translateY, {
        toValue: HIDDEN_Y,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onDismiss();
        after?.();
      });
    },
    [onDismiss, translateY],
  );

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => dismiss(), VISIBLE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { top: insets.top + theme.spacing.sm, transform: [{ translateY }] },
      ]}
    >
      <Pressable
        onPress={() => dismiss(onPress)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.iconWrap}>
          <Bell size={20} color={colors.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {body ? (
            <Text style={styles.body} numberOfLines={2}>
              {body}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: theme.spacing.md,
      right: theme.spacing.md,
      zIndex: 1000,
      elevation: 1000,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      shadowColor: colors.black,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    pressed: { opacity: 0.85 },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    textWrap: { flex: 1 },
    title: {
      ...theme.typography.bodyMedium,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    body: {
      ...theme.typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
}