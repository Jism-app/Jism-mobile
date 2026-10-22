import { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Moon } from 'lucide-react-native';
import { formatDayLabel } from '../../../lib/exercises/dates';
import { titleCase } from '../../../lib/exercises/format';
import { ExerciseListItem, OpenExercise, Session } from '../../../lib/exercises/types';
import { theme } from '../../theme';
import { Card } from '../Card';
import { Chip, ChipRow } from '../Chip';
import { createThemedStyles } from '../createThemedStyles';
import { PlanCard } from '../PlanCard';
import { SectionHeader } from '../SectionHeader';
import { ShelfRow } from '../ShelfRow';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    content: {
      paddingBottom: theme.spacing.xxl,
    },
    head: {
      marginBottom: theme.spacing.md,
    },
    relativePill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryMuted,
      borderRadius: theme.radius.full,
      paddingVertical: 2,
      paddingHorizontal: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    relativeText: {
      ...theme.typography.label,
      fontSize: 11,
      color: colors.primary,
      letterSpacing: 0.8,
    },
    title: {
      ...theme.typography.h1,
      color: colors.textPrimary,
    },
    dateLabel: {
      ...theme.typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    summary: {
      ...theme.typography.body,
      color: colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    plan: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    rest: {
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    restTitle: {
      ...theme.typography.h2,
      color: colors.textPrimary,
    },
    restBody: {
      ...theme.typography.body,
      color: colors.textSecondary,
    },
  }),
);

interface DayPageProps {
  date: Date;
  weekday: number;
  relative: string | null;
  session: Session | null;
  restPicks: ExerciseListItem[];
  width: number;
  onOpen: OpenExercise;
}

// One page of the program pager: the day's session, or a rest day.
export const DayPage = memo(function DayPage({
  date,
  weekday,
  relative,
  session,
  restPicks,
  width,
  onOpen,
}: DayPageProps) {
  const { styles, colors } = useStyles();

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <View style={styles.head}>
        {relative ? (
          <View style={styles.relativePill}>
            <Text style={styles.relativeText}>{relative.toUpperCase()}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{session ? session.title : 'Rest day'}</Text>
        <Text style={styles.dateLabel}>{formatDayLabel(date, weekday)}</Text>
      </View>

      {session ? (
        <>
          <Text style={styles.summary}>
            {session.exercises.length} exercises · about {session.minutes} min
          </Text>
          <ChipRow>
            {session.focus.map((m) => (
              <Chip key={m} label={titleCase(m)} selected />
            ))}
          </ChipRow>
          <View style={styles.plan}>
            {session.exercises.map((planned, index) => (
              <PlanCard
                key={planned.item.id}
                planned={planned}
                index={index}
                onPress={(item) => onOpen(item, planned)}
              />
            ))}
          </View>
        </>
      ) : (
        <>
          <Card style={styles.rest}>
            <Moon color={colors.primary} size={28} strokeWidth={1.8} />
            <Text style={styles.restTitle}>Recovery is part of the plan</Text>
            <Text style={styles.restBody}>
              Sleep well, eat enough protein, and keep moving lightly. Muscle is built while you rest.
            </Text>
          </Card>
          {restPicks.length > 0 ? (
            <>
              <SectionHeader title="Optional: loosen up" caption="A few gentle stretches" />
              <ShelfRow items={restPicks} onOpen={(item) => onOpen(item)} />
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
});
