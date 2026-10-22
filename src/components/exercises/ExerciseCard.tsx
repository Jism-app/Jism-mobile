import { memo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { equipmentLabel, musclesLabel, titleCase } from '../../lib/exercises/format';
import { ExerciseListItem } from '../../lib/exercises/types';
import { theme } from '../theme';
import { createThemedStyles } from './createThemedStyles';
import { ExerciseThumb } from './ExerciseThumb';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    pressed: { opacity: 0.85 },
    frame: {
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    image: {
      width: '100%',
      borderRadius: 0,
    },
    overlay: {
      position: 'absolute',
      top: theme.spacing.sm,
      left: theme.spacing.sm,
      backgroundColor: 'rgba(10,10,12,0.72)',
      borderRadius: theme.radius.full,
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
    },
    overlayText: {
      ...theme.typography.label,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    title: {
      flex: 1,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    metric: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 3,
    },
    metricValue: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    metricUnit: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.6,
      color: colors.textMuted,
    },
    subRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: 6,
    },
    sub: {
      flexShrink: 1,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    tag: {
      borderRadius: 4,
      backgroundColor: colors.primaryMuted,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    tagText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.primary,
    },
  }),
);

interface ExerciseCardProps {
  item: ExerciseListItem;
  onPress: (item: ExerciseListItem) => void;
  style?: StyleProp<ViewStyle>;
  /** Pill on the picture, top-left (defaults to the difficulty). */
  badge?: string | null;
  /** Bold figure at the right of the title, e.g. {value:'8–12', unit:'reps'}. */
  metric?: { value: string; unit: string } | null;
  /** Small highlighted tag after the muscles (defaults to the equipment). */
  tag?: string | null;
}

// Image-first card: big photo, title with a metric at the right, muscles in
// small caps and a tag — shared by the shelves, the results and the program.
export const ExerciseCard = memo(function ExerciseCard({
  item,
  onPress,
  style,
  badge,
  metric,
  tag,
}: ExerciseCardProps) {
  const { styles } = useStyles();
  const badgeText = badge === undefined ? titleCase(item.difficulty) : badge;
  const tagText = tag === undefined ? equipmentLabel(item, 'No equipment') : tag;

  return (
    <Pressable onPress={() => onPress(item)} style={({ pressed }) => [style, pressed && styles.pressed]}>
      <View style={styles.frame}>
        <ExerciseThumb uri={item.image_start_url} style={styles.image} />
        {badgeText ? (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>{badgeText}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>
          {item.name}
        </Text>
        {metric ? (
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricUnit}>{metric.unit.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.subRow}>
        <Text style={styles.sub} numberOfLines={1}>
          {musclesLabel(item)}
        </Text>
        {tagText ? (
          <View style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>
              {tagText}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});
