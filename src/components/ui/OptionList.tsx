import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme, useTheme, ColorTokens } from '../theme';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface OptionListProps {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function OptionList({ options, selected, onToggle }: OptionListProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.list}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[styles.option, isSelected && styles.optionSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
            {option.description ? (
              <Text style={styles.description}>{option.description}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    list: {
      gap: theme.spacing.sm,
    },
    option: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryMuted,
    },
    label: {
      ...theme.typography.bodyMedium,
      color: colors.textPrimary,
    },
    labelSelected: {
      color: colors.primary,
    },
    description: {
      ...theme.typography.caption,
      color: colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
  });
}
