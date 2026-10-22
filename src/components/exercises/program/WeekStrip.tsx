import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MONTHS, WEEKDAY_SHORT } from '../../../lib/exercises/dates';
import { WeekPlan } from '../../../lib/exercises/types';
import { theme } from '../../theme';
import { createThemedStyles } from '../createThemedStyles';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    month: {
      ...theme.typography.label,
      color: colors.textSecondary,
    },
    link: {
      ...theme.typography.label,
      color: colors.primary,
    },
    strip: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.md,
    },
    chip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    chipSelected: {
      borderColor: colors.warning,
      backgroundColor: colors.primaryMuted,
    },
    weekday: {
      ...theme.typography.caption,
      color: colors.textMuted,
    },
    date: {
      ...theme.typography.bodyMedium,
      color: colors.textPrimary,
      marginTop: 2,
    },
    dateToday: {
      color: colors.primary,
      fontWeight: '800',
    },
    textSelected: {
      color: colors.primary,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 6,
      backgroundColor: 'transparent',
    },
    dotOn: {
      backgroundColor: colors.warning,
    },
  }),
);

interface WeekStripProps {
  days: Date[];
  selected: number;
  todayIdx: number;
  plan: WeekPlan;
  onSelect: (index: number) => void;
}

// Month label + the 7 days of the selected day's week. A dot marks training days.
export function WeekStrip({ days, selected, todayIdx, plan, onSelect }: WeekStripProps) {
  const { styles } = useStyles();
  const weekStart = Math.floor(selected / 7) * 7;
  const selectedDate = days[selected];

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.month}>
          {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>
        {selected !== todayIdx ? (
          <Pressable onPress={() => onSelect(todayIdx)} hitSlop={10}>
            <Text style={styles.link}>Back to today</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.strip}>
        {Array.from({ length: 7 }, (_, k) => weekStart + k).map((index) => {
          const isSelected = index === selected;
          const trains = plan[index % 7] !== null;
          return (
            <Pressable
              key={index}
              onPress={() => onSelect(index)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text style={[styles.weekday, isSelected && styles.textSelected]}>
                {WEEKDAY_SHORT[index % 7]}
              </Text>
              <Text
                style={[
                  styles.date,
                  index === todayIdx && styles.dateToday,
                  isSelected && styles.textSelected,
                ]}
              >
                {days[index].getDate()}
              </Text>
              <View style={[styles.dot, trains && styles.dotOn]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
