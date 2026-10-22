import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0..1 (values outside the range are clamped). */
  progress: number;
  size?: number;
  strokeWidth?: number;
  /** Arc color. Defaults to the theme's primary. */
  color?: string;
  /** Background track color. Defaults to the theme's primaryMuted. */
  trackColor?: string;
  /** Rendered in the center of the ring. */
  children?: ReactNode;
}

export function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 10,
  color,
  trackColor,
  children,
}: ProgressRingProps) {
  const { colors } = useTheme();

  const clamped = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: clamped,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // SVG props can't use the native driver
    }).start();
  }, [clamped, animated]);

  const strokeDashoffset = useMemo(
    () => animated.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] }),
    [animated, circumference],
  );

  return (
    <View style={{ width: size, height: size }}>
      {/* Rotated so the arc starts at 12 o'clock. */}
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor ?? colors.primaryMuted}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color ?? colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          // Round caps draw a dot even at 0 — hide the arc when empty.
          strokeOpacity={clamped > 0 ? 1 : 0}
          fill="none"
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});