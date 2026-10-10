import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme, useTheme, ColorTokens } from '../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[`variant_${variant}`],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.black : colors.primary} />
      ) : (
        <Text style={[styles.label, styles[`labelVariant_${variant}`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    base: {
      height: 60,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    label: {
      ...theme.typography.bodyMedium,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.78,
    },
    variant_primary: { backgroundColor: colors.warning },
    variant_secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    variant_ghost: { backgroundColor: 'transparent' },
    labelVariant_primary: { color: colors.black },
    labelVariant_secondary: { color: colors.textPrimary },
    labelVariant_ghost: { color: colors.primary },
  });
}
