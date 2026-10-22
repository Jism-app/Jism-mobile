import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { createThemedStyles } from './createThemedStyles';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: theme.radius.full,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    // Same selected treatment as OptionList.
    chipSelected: {
      borderColor: colors.warning,
      backgroundColor: colors.primaryMuted,
    },
    label: {
      ...theme.typography.label,
      color: colors.textSecondary,
    },
    labelSelected: {
      color: colors.primary,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  }),
);

interface ChipProps {
  label: string;
  selected?: boolean;
  /** Omit for a static tag. */
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  const { styles } = useStyles();
  const containerStyle = [styles.chip, selected && styles.chipSelected];
  const text = <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>;

  if (!onPress) return <View style={containerStyle}>{text}</View>;
  return (
    <Pressable onPress={onPress} style={containerStyle}>
      {text}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  const { styles } = useStyles();
  return <View style={styles.row}>{children}</View>;
}
