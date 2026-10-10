import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// This is draft data only — nothing here is trusted until it's submitted
// as a whole via POST /profiles/me, which is the only point the server
// flips onboarding_completed. Losing this store just means redoing the
// wizard, never a data-integrity problem.
//
// Small payload (a dozen short fields), so SecureStore's per-item size
// limit isn't a concern — kept consistent with the rest of the app's
// "never AsyncStorage for persisted state" convention.
const secureStorage: StateStorage = {
  getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
  setItem: async (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: async (name) => SecureStore.deleteItemAsync(name),
};

export type Sex = 'male' | 'female';
export type Goal = 'muscle_gain' | 'fat_loss' | 'recomposition' | 'general_fitness';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

interface OnboardingDraft {
  age?: number;
  sex?: Sex;
  height_cm?: number;
  weight_kg?: number;
  goal?: Goal;
  experience_level?: ExperienceLevel;
  training_days_per_week?: number;
  equipment: string[];
  activity_level?: ActivityLevel;
  waist_cm?: number;
  chest_cm?: number;
  arm_cm?: number;
  thigh_cm?: number;
  sleep_hours?: number;
}

interface OnboardingState {
  draft: OnboardingDraft;
  setField: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;
  reset: () => void;
}

const emptyDraft: OnboardingDraft = { equipment: [] };

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      draft: emptyDraft,
      setField: (key, value) =>
        set((state) => ({ draft: { ...state.draft, [key]: value } })),
      reset: () => set({ draft: emptyDraft }),
    }),
    {
      name: 'cadenique-onboarding-draft',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);

// Steps that MUST be filled before summary can submit. `equipment` is
// intentionally excluded — an empty array (bodyweight-only) is valid.
const REQUIRED_KEYS: (keyof OnboardingDraft)[] = [
  'age',
  'sex',
  'height_cm',
  'weight_kg',
  'goal',
  'experience_level',
  'training_days_per_week',
];

export function isDraftComplete(draft: OnboardingDraft): boolean {
  return REQUIRED_KEYS.every((key) => draft[key] !== undefined);
}
