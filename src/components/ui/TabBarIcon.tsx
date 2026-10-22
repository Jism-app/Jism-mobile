import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { theme, useTheme, ColorTokens } from '../theme';

interface TabBarIconProps {
  icon: LucideIcon;
  focused: boolean;
  /** Tint from the navigator (active / inactive). */
  color: string;
  size?: number;
}

// Bottom-tab icon: a Lucide glyph that gets a soft pill behind it when its tab
// is active. The pill springs in/out; the stroke also gets heavier when active.
export function TabBarIcon({ icon: Icon, focused, color, size = 22 }: TabBarIconProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      friction: 7,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.pill,
          {
            opacity: progress,
            transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          },
        ]}
      />
      <Icon color={color} size={size} strokeWidth={focused ? 2.4 : 1.8} />
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    wrap: {
      width: 56,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pill: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: theme.radius.full,
      backgroundColor: colors.primaryMuted,
    },
  });
}
