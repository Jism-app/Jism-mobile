import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface NutritionTargets {
  id: string;
  user_id: string;
  bmr: number;
  tdee: number;
  daily_calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  source: string;
  is_active: boolean;
  created_at: string;
}

export function useNutritionTargets() {
  return useQuery({
    queryKey: ['nutrition', 'targets'],
    queryFn: () => api.get<NutritionTargets>('/nutrition/targets'),
  });
}
