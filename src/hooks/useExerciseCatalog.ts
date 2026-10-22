import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { fetchExercises, fetchProfilePrefs } from '../lib/exercises/api';
import { buildCatalog } from '../lib/exercises/curation';
import { Catalog } from '../lib/exercises/types';

// The whole exercise library plus the signed-in user's profile, turned into a
// Catalog (what they're allowed to see + how things rank).
export function useExerciseCatalog() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const exercises = useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises,
    staleTime: 1000 * 60 * 60, // the library barely changes
  });

  const profile = useQuery({
    queryKey: ['profile-prefs', userId],
    queryFn: () => fetchProfilePrefs(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const prefs = profile.data ?? null;
  const allItems = useMemo(() => exercises.data ?? [], [exercises.data]);
  const catalog = useMemo<Catalog>(() => buildCatalog(allItems, prefs), [allItems, prefs]);

  return {
    catalog,
    isLoading: exercises.isLoading || profile.isLoading,
    isError: exercises.isError,
    isRefetching: exercises.isRefetching,
    refetch: exercises.refetch,
  };
}
