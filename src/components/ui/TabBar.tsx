import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { theme } from '../theme';
import { createThemedStyles } from './createThemedStyles';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    button: {
      flex: 1,
      alignItems: 'center',
      paddingTop: theme.spacing.sm,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    label: {
      ...theme.typography.bodyMedium,
      fontWeight: '700',
      color: colors.textMuted,
    },
    labelActive: {
      color: colors.textPrimary,
    },
    underline: {
      height: 3,
      alignSelf: 'stretch',
      borderRadius: theme.radius.full,
      backgroundColor: 'transparent',
    },
    underlineActive: {
      backgroundColor: colors.warning,
    },
  }),
);

interface TabBarProps<K extends string> {
  tabs: { key: K; label: string; icon?: LucideIcon }[];
  active: K;
  onChange: (key: K) => void;
}

// Instagram-style underline tabs, with an optional Lucide icon per tab.
export function TabBar<K extends string>({ tabs, active, onChange }: TabBarProps<K>) {
  const { styles, colors } = useStyles();
  return (
    <View style={styles.bar}>
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <Pressable key={key} onPress={() => onChange(key)} style={styles.button}>
            <View style={styles.content}>
              {Icon ? (
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.4 : 1.8}
                  color={isActive ? colors.primary : colors.textMuted}
                />
              ) : null}
              <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
            </View>
            <View style={[styles.underline, isActive && styles.underlineActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}
