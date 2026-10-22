import { useQuery } from '@tanstack/react-query';
import { fetchInstructions } from '../lib/exercises/api';

// Instructions are fetched on demand — they're the heaviest column.
export function useExerciseInstructions(exerciseId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['exercise-instructions', exerciseId],
    queryFn: () => fetchInstructions(exerciseId!),
    enabled: enabled && !!exerciseId,
    staleTime: Infinity,
  });
}
