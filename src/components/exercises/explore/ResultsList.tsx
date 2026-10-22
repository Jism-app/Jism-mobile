import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '../../ui/Button';
import { ListView } from '../../../lib/exercises/explore';
import { ExerciseListItem } from '../../../lib/exercises/types';
import { theme } from '../../theme';
import { Chip } from '../Chip';
import { createThemedStyles } from '../createThemedStyles';
import { InfoCard } from '../InfoCard';
import { ResultRow } from '../ResultRow';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    content: {
      paddingBottom: theme.spacing.xxl,
    },
    header: {
      marginBottom: theme.spacing.md,
    },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    backLabel: {
      ...theme.typography.label,
      color: colors.primary,
    },
    title: {
      ...theme.typography.h2,
      color: colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    chips: {
      flexDirection: 'row',
      marginTop: theme.spacing.md,
    },
    showMore: {
      marginTop: theme.spacing.lg,
    },
    separator: {
      height: theme.spacing.md,
    },
  }),
);

interface ResultsListProps {
  results: ExerciseListItem[];
  visible: number;
  view: ListView | null;
  broaden: boolean;
  onToggleBroaden: () => void;
  onBack: () => void;
  onShowMore: () => void;
  onOpen: (item: ExerciseListItem) => void;
}

// Results for a shelf / muscle / search. Paged: only `visible` rows render.
export function ResultsList({
  results,
  visible,
  view,
  broaden,
  onToggleBroaden,
  onBack,
  onShowMore,
  onOpen,
}: ResultsListProps) {
  const { styles, colors } = useStyles();

  const renderRow = useCallback(
    ({ item }: { item: ExerciseListItem }) => <ResultRow item={item} onPress={onOpen} />,
    [onOpen],
  );

  const header = (
    <View style={styles.header}>
      {view ? (
        <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
          <ChevronLeft color={colors.primary} size={20} strokeWidth={2.2} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      ) : null}
      <Text style={styles.title}>{view ? view.title : 'Results'}</Text>
      {view?.subtitle ? <Text style={styles.subtitle}>{view.subtitle}</Text> : null}
      <View style={styles.chips}>
        <Chip label="Include other gear & levels" selected={broaden} onPress={onToggleBroaden} />
      </View>
    </View>
  );

  const empty = (
    <InfoCard
      title="Nothing here for your setup"
      body={broaden ? 'Try a different search.' : 'Your gear and level filter hides some moves. You can widen it.'}
      action={!broaden ? { label: 'Include other gear & levels', onPress: onToggleBroaden } : undefined}
    />
  );

  return (
    <FlatList
      data={results.slice(0, visible)}
      keyExtractor={(item) => item.id}
      renderItem={renderRow}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={
        results.length > visible ? (
          <Button label="Show more" variant="secondary" onPress={onShowMore} style={styles.showMore} />
        ) : null
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      initialNumToRender={10}
      windowSize={7}
      showsVerticalScrollIndicator={false}
    />
  );
}
