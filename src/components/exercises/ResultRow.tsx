import { memo } from 'react';
import { targetLabel } from '../../lib/exercises/format';
import { ExerciseListItem } from '../../lib/exercises/types';
import { ExerciseCard } from './ExerciseCard';

interface ResultRowProps {
  item: ExerciseListItem;
  onPress: (item: ExerciseListItem) => void;
}

// Full-width card used in list / search results.
export const ResultRow = memo(function ResultRow({ item, onPress }: ResultRowProps) {
  const target = targetLabel(item);
  const [value, ...unit] = target ? target.split(' ') : [];
  return (
    <ExerciseCard item={item} onPress={onPress} metric={target ? { value, unit: unit.join(' ') } : null} />
  );
});
