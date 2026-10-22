import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../theme';
import { createThemedStyles } from './createThemedStyles';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.md,
    },
    pressed: {
      opacity: 0.78,
    },
  }),
);

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  const { styles } = useStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PressableCard({ children, style, onPress }: CardProps & { onPress: () => void }) {
  const { styles } = useStyles();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}
