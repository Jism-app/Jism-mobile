import { memo } from 'react';
import { useWindowDimensions } from 'react-native';
import { targetLabel } from '../../lib/exercises/format';
import { ExerciseListItem } from '../../lib/exercises/types';
import { ExerciseCard } from './ExerciseCard';

interface ShelfCardProps {
  item: ExerciseListItem;
  onPress: (item: ExerciseListItem) => void;
  hero?: boolean;
}

// Wide card for horizontal shelves; sized so the next card peeks in.
export const ShelfCard = memo(function ShelfCard({ item, onPress, hero }: ShelfCardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.round(Math.min(hero ? 340 : 300, width * (hero ? 0.84 : 0.76)));
  const target = targetLabel(item);
  const [value, ...unit] = target ? target.split(' ') : [];
  return (
    <ExerciseCard
      item={item}
      onPress={onPress}
      style={{ width: cardWidth }}
      metric={target ? { value, unit: unit.join(' ') } : null}
    />
  );
});
