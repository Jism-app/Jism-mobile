import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { GroupTile, ListView, Shelf } from '../../../lib/exercises/explore';
import { ExerciseListItem } from '../../../lib/exercises/types';
import { theme } from '../../theme';
import { createThemedStyles } from '../createThemedStyles';
import { SectionHeader } from '../SectionHeader';
import { ShelfRow } from '../ShelfRow';
import { MuscleTiles } from './MuscleTiles';

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    content: {
      paddingBottom: theme.spacing.xxl,
    },
  }),
);

interface BrowseViewProps {
  shelves: Shelf[];
  tiles: GroupTile[];
  onOpen: (item: ExerciseListItem) => void;
  onOpenView: (view: ListView) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

// Curated shelves, with the muscle tiles slotted in after the first shelf.
export function BrowseView({ shelves, tiles, onOpen, onOpenView, refreshing, onRefresh }: BrowseViewProps) {
  const { styles, colors } = useStyles();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {shelves.map((shelf, index) => (
        <View key={shelf.id}>
          <SectionHeader
            title={shelf.def.title}
            caption={shelf.def.caption}
            action={
              shelf.id !== 'picks'
                ? {
                    label: 'More',
                    onPress: () =>
                      onOpenView({
                        title: shelf.def.title,
                        subtitle: shelf.def.caption,
                        filter: shelf.def.filter,
                      }),
                  }
                : undefined
            }
          />
          <ShelfRow items={shelf.items} onOpen={onOpen} hero={shelf.def.hero} />

          {index === 0 ? (
            <View>
              <SectionHeader title="Train a muscle" caption="Pick a target, we'll show the best moves" />
              <MuscleTiles
                tiles={tiles}
                onSelect={(tile) => onOpenView({ title: tile.label, filter: tile.filter })}
              />
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
