import { supabase } from '../supabase';
import { ExerciseListItem, ProfilePrefs } from './types';

const LIST_COLUMNS =
  'id, name, name_ar, name_fr, primary_muscles, secondary_muscles, equipment, ' +
  'movement_pattern, difficulty, exercise_type, default_rep_range_min, ' +
  'default_rep_range_max, default_duration_seconds, recommended_rir, ' +
  'image_start_url, image_end_url';

// Supabase caps one response (1000 rows by default), so page through the table.
// `instructions` stays out of this query — it is only fetched when a card opens.
const FETCH_PAGE = 500;

export async function fetchExercises(): Promise<ExerciseListItem[]> {
  const rows: ExerciseListItem[] = [];
  for (let from = 0; ; from += FETCH_PAGE) {
    const { data, error } = await supabase
      .from('exercises')
      .select(LIST_COLUMNS)
      .order('name', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + FETCH_PAGE - 1);
    if (error) throw error;
    const page = (data ?? []) as unknown as ExerciseListItem[];
    rows.push(...page);
    if (page.length < FETCH_PAGE) break;
  }
  return rows;
}

export async function fetchProfilePrefs(userId: string): Promise<ProfilePrefs | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('equipment, experience_level, goal, training_days_per_week')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfilePrefs | null) ?? null;
}

export async function fetchInstructions(exerciseId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('instructions')
    .eq('id', exerciseId)
    .single();
  if (error) throw error;
  return ((data as { instructions: string[] | null } | null)?.instructions ?? []) as string[];
}
