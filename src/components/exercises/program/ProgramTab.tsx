import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { daySeed, PAGER_DAYS, addDays, relativeLabel, startOfWeek, weekdayOf } from '../../../lib/exercises/dates';
import { buildWeekPlan, pickRestStretches } from '../../../lib/exercises/program';
import { eligiblePool } from '../../../lib/exercises/curation';
import { Catalog, OpenExercise } from '../../../lib/exercises/types';
import { theme } from '../../theme';
import { DayPage } from './DayPage';
import { WeekStrip } from './WeekStrip';

const styles = StyleSheet.create({ flex: { flex: 1 } });

interface ProgramTabProps {
  catalog: Catalog;
  onOpen: OpenExercise;
}

// "My program": a week strip on top, and a pager you swipe through day by day.
export function ProgramTab({ catalog, onOpen }: ProgramTabProps) {
  const { session } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = windowWidth - theme.spacing.lg * 2;

  const today = useMemo(() => new Date(), []);
  const days = useMemo(
    () => Array.from({ length: PAGER_DAYS }, (_, i) => addDays(startOfWeek(today), i)),
    [today],
  );
  const todayIdx = weekdayOf(today);

  const [selected, setSelected] = useState(todayIdx);
  const pagerRef = useRef<FlatList<Date>>(null);

  const plan = useMemo(
    () => buildWeekPlan(catalog.prefs, eligiblePool(catalog), catalog.scores, session?.user.id ?? 'guest'),
    [catalog, session?.user.id],
  );
  const restPicks = useMemo(() => pickRestStretches(catalog, daySeed()), [catalog]);

  const goTo = useCallback((index: number) => {
    setSelected(index);
    pagerRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
      setSelected(Math.max(0, Math.min(PAGER_DAYS - 1, index)));
    },
    [pageWidth],
  );

  const renderDay = useCallback(
    ({ item: date, index }: { item: Date; index: number }) => (
      <DayPage
        date={date}
        weekday={index % 7}
        relative={relativeLabel(index, todayIdx)}
        session={plan[index % 7]}
        restPicks={restPicks}
        width={pageWidth}
        onOpen={onOpen}
      />
    ),
    [plan, restPicks, pageWidth, onOpen, todayIdx],
  );

  return (
    <View style={styles.flex}>
      <WeekStrip days={days} selected={selected} todayIdx={todayIdx} plan={plan} onSelect={goTo} />
      <FlatList
        ref={pagerRef}
        data={days}
        keyExtractor={(d) => d.toISOString()}
        renderItem={renderDay}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={todayIdx}
        getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
        onMomentumScrollEnd={onMomentumEnd}
        initialNumToRender={3}
        windowSize={3}
        style={styles.flex}
      />
    </View>
  );
}
