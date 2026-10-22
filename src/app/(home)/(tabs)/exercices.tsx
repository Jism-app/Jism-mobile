import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { CalendarDays, Compass } from 'lucide-react-native';
import { Screen } from '../../../components/ui/Screen';
import { theme, useTheme } from '../../../components/theme';
import { ExerciseDetailModal } from '../../../components/exercises/ExerciseDetailModal';
import { InfoCard } from '../../../components/exercises/InfoCard';
import { TabBar } from '../../../components/exercises/TabBar';
import { ExploreTab } from '../../../components/exercises/explore/ExploreTab';
import { ProgramTab } from '../../../components/exercises/program/ProgramTab';
import { useExerciseCatalog } from '../../../hooks/useExerciseCatalog';
import { ExerciseListItem, PlannedExercise } from '../../../lib/exercises/types';

type TabKey = 'program' | 'explore';

const TABS = [
  { key: 'program' as const, label: 'My program', icon: CalendarDays },
  { key: 'explore' as const, label: 'Explore', icon: Compass },
];

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hidden: { display: 'none' },
  loader: { marginVertical: theme.spacing.xl },
});

export default function ExercicesScreen() {
  const { colors } = useTheme();
  const { catalog, isLoading, isError, isRefetching, refetch } = useExerciseCatalog();

  const [tab, setTab] = useState<TabKey>('program');
  const [detail, setDetail] = useState<{ item: ExerciseListItem; planned: PlannedExercise | null } | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const openDetail = useCallback((item: ExerciseListItem, planned?: PlannedExercise) => {
    setDetail({ item, planned: planned ?? null });
    setDetailVisible(true);
  }, []);
  const closeDetail = useCallback(() => setDetailVisible(false), []);

  let body;
  if (isLoading) {
    body = <ActivityIndicator color={colors.primary} style={styles.loader} />;
  } else if (isError) {
    body = (
      <InfoCard
        tone="error"
        body="Couldn't load the exercises. Check your connection and try again."
        action={{ label: 'Retry', onPress: () => refetch() }}
      />
    );
  } else if (catalog.allItems.length === 0) {
    body = (
      <InfoCard
        title="Nothing to show yet"
        body="The exercise library is empty or not readable for your account."
      />
    );
  } else {
    // Both tabs stay mounted (just hidden) so Explore keeps its search/filters
    // and the program keeps the day you were looking at.
    body = (
      <View style={styles.flex}>
        <View style={[styles.flex, tab !== 'program' && styles.hidden]}>
          <ProgramTab catalog={catalog} onOpen={openDetail} />
        </View>
        <View style={[styles.flex, tab !== 'explore' && styles.hidden]}>
          <ExploreTab
            catalog={catalog}
            onOpen={openDetail}
            refreshing={isRefetching}
            onRefresh={() => refetch()}
          />
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {body}
      <ExerciseDetailModal
        item={detail?.item ?? null}
        planned={detail?.planned ?? null}
        visible={detailVisible}
        onClose={closeDetail}
      />
    </Screen>
  );
}
