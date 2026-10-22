// Types mirroring public.exercises / public.profiles, plus the derived shapes
// the exercises screens share.

export type ExerciseType = 'strength' | 'cardio' | 'stretch';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Goal = 'muscle_gain' | 'fat_loss' | 'recomposition' | 'general_fitness';

export interface ExerciseListItem {
  id: string;
  name: string;
  name_ar: string | null;
  name_fr: string | null;
  primary_muscles: string[];
  secondary_muscles: string[] | null;
  equipment: string[];
  movement_pattern: string;
  difficulty: Difficulty;
  exercise_type: ExerciseType;
  default_rep_range_min: number | null;
  default_rep_range_max: number | null;
  default_duration_seconds: number | null;
  recommended_rir: number;
  image_start_url: string | null;
  image_end_url: string | null;
}

export interface ProfilePrefs {
  equipment: string[];
  experience_level: Difficulty;
  goal: Goal;
  training_days_per_week: number;
}

// Everything both tabs need, computed once per (library, profile).
export interface Catalog {
  allItems: ExerciseListItem[];
  eligibleIds: Set<string>;
  scores: Map<string, number>;
  prefs: ProfilePrefs | null;
}

// ─── Training program ───────────────────────────────────────────────────────

export interface PlannedExercise {
  item: ExerciseListItem;
  sets: number;
  repsMin: number;
  repsMax: number;
  rir: number;
}

export interface Session {
  title: string;
  focus: string[];
  exercises: PlannedExercise[];
  minutes: number;
}

// Index = weekday, 0 = Monday. null = rest day.
export type WeekPlan = (Session | null)[];

// Opens the detail sheet; `planned` is passed when opened from the program.
export type OpenExercise = (item: ExerciseListItem, planned?: PlannedExercise) => void;
