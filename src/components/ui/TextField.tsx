import { useMemo } from 'react';
import { TextInput, TextInputProps, StyleSheet, Text, View } from 'react-native';
import { theme, useTheme, ColorTokens } from '../theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      ...theme.typography.label,
      color: colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    input: {
      height: 52,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: theme.spacing.md,
      color: colors.textPrimary,
      fontSize: theme.typography.body.fontSize,
    },
    inputError: {
      borderColor: colors.error,
    },
    errorText: {
      ...theme.typography.caption,
      color: colors.error,
      marginTop: theme.spacing.xs,
    },
  });
}
