import { memo } from 'react';
import { ExerciseListItem, PlannedExercise } from '../../lib/exercises/types';
import { ExerciseCard } from './ExerciseCard';

interface PlanCardProps {
  planned: PlannedExercise;
  index: number;
  onPress: (item: ExerciseListItem) => void;
}

// One line of the day's program: numbered picture, sets × reps, RIR.
export const PlanCard = memo(function PlanCard({ planned, index, onPress }: PlanCardProps) {
  const { item, sets, repsMin, repsMax, rir } = planned;
  return (
    <ExerciseCard
      item={item}
      onPress={onPress}
      badge={String(index + 1).padStart(2, '0')}
      metric={{ value: `${sets} × ${repsMin}–${repsMax}`, unit: 'reps' }}
      tag={`${rir} RIR`}
    />
  );
});
