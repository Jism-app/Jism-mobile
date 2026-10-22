import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { createThemedStyles } from './createThemedStyles';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    head: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
    },
    text: {
      flex: 1,
    },
    title: {
      ...theme.typography.h2,
      color: colors.textPrimary,
    },
    caption: {
      ...theme.typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    link: {
      ...theme.typography.label,
      color: colors.primary,
    },
  }),
);

interface SectionHeaderProps {
  title: string;
  caption?: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, caption, action }: SectionHeaderProps) {
  const { styles } = useStyles();
  return (
    <View style={styles.head}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
      {action ? (
        <Pressable hitSlop={10} onPress={action.onPress}>
          <Text style={styles.link}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
