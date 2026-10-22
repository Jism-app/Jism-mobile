import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { ActivityLevel, ExperienceLevel, Goal, Sex } from '../store/onboardingStore';

export interface Profile {
  id: string;
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  goal: Goal;
  experience_level: ExperienceLevel;
  training_days_per_week: number;
  equipment: string[];
  activity_level: ActivityLevel;
  onboarding_completed: boolean;
}

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    // Keyed by user so a different account never sees the previous user's cache.
    queryKey: ['profile', userId],
    queryFn: () => api.get<Profile>('/profiles/me'),
    enabled: !!userId,
    // 404 just means onboarding isn't finished — don't retry that.
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 1,
  });
}