import { ScrollView, StyleSheet } from 'react-native';
import { ExerciseListItem } from '../../lib/exercises/types';
import { theme } from '../theme';
import { ShelfCard } from './ShelfCard';

const styles = StyleSheet.create({
  row: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.lg,
  },
});

interface ShelfRowProps {
  items: ExerciseListItem[];
  onOpen: (item: ExerciseListItem) => void;
  hero?: boolean;
}

// Horizontal carousel of ShelfCards.
export function ShelfRow({ items, onOpen, hero }: ShelfRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {items.map((item) => (
        <ShelfCard key={item.id} item={item} onPress={onOpen} hero={hero} />
      ))}
    </ScrollView>
  );
}
