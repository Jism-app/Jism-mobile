import { StyleSheet, Text } from 'react-native';
import { Button } from '../ui/Button';
import { theme } from '../theme';
import { Card } from './Card';
import { createThemedStyles } from './createThemedStyles';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    title: {
      ...theme.typography.h2,
      color: colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    body: {
      ...theme.typography.body,
      color: colors.textSecondary,
    },
    error: {
      color: colors.error,
    },
    action: {
      marginTop: theme.spacing.md,
    },
  }),
);

interface InfoCardProps {
  title?: string;
  body: string;
  tone?: 'default' | 'error';
  action?: { label: string; onPress: () => void };
}

// Empty / error / "nothing here" message card.
export function InfoCard({ title, body, tone = 'default', action }: InfoCardProps) {
  const { styles } = useStyles();
  return (
    <Card>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={[styles.body, tone === 'error' && styles.error]}>{body}</Text>
      {action ? (
        <Button label={action.label} variant="secondary" onPress={action.onPress} style={styles.action} />
      ) : null}
    </Card>
  );
}
