// Weekly training program. Generated on the client from the user's profile
// until the backend program (Sprint 7) exists — swap `buildWeekPlan` for the
// server plan and nothing else in the UI has to change.

import { hashString, pickShelf, eligiblePool, isStrength } from './curation';
import { Catalog, ExerciseListItem, PlannedExercise, ProfilePrefs, WeekPlan } from './types';

type SessionKey = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full';

interface Slot {
  muscles: string[];
  sets: number;
  patterns?: string[];
}

const slot = (muscles: string[], sets: number, patterns?: string[]): Slot => ({ muscles, sets, patterns });

const SESSION_DEFS: Record<SessionKey, { title: string; slots: Slot[] }> = {
  push: {
    title: 'Push day',
    slots: [
      slot(['chest'], 4, ['push']),
      slot(['shoulders'], 3, ['push']),
      slot(['chest'], 3, ['push', 'isolation']),
      slot(['triceps'], 3),
      slot(['shoulders'], 3, ['isolation']),
    ],
  },
  pull: {
    title: 'Pull day',
    slots: [
      slot(['lats', 'middle back'], 4, ['pull']),
      slot(['lats', 'middle back'], 3, ['pull']),
      slot(['traps', 'shoulders', 'middle back'], 3, ['pull', 'isolation']),
      slot(['biceps'], 3),
      slot(['biceps', 'forearms'], 2),
    ],
  },
  legs: {
    title: 'Leg day',
    slots: [
      slot(['quadriceps'], 4, ['squat']),
      slot(['hamstrings', 'glutes'], 4, ['hinge']),
      slot(['quadriceps', 'glutes'], 3, ['squat']),
      slot(['hamstrings'], 3, ['isolation']),
      slot(['calves'], 3),
    ],
  },
  upper: {
    title: 'Upper body',
    slots: [
      slot(['chest'], 3, ['push']),
      slot(['lats', 'middle back'], 3, ['pull']),
      slot(['shoulders'], 3, ['push']),
      slot(['middle back', 'lats'], 3, ['pull']),
      slot(['biceps'], 2),
      slot(['triceps'], 2),
    ],
  },
  lower: {
    title: 'Lower body',
    slots: [
      slot(['quadriceps'], 4, ['squat']),
      slot(['hamstrings', 'glutes'], 4, ['hinge']),
      slot(['glutes', 'quadriceps'], 3),
      slot(['calves'], 3),
      slot(['abdominals'], 3),
    ],
  },
  full: {
    title: 'Full body',
    slots: [
      slot(['quadriceps', 'glutes'], 3, ['squat']),
      slot(['chest'], 3, ['push']),
      slot(['lats', 'middle back'], 3, ['pull']),
      slot(['hamstrings', 'glutes'], 3, ['hinge']),
      slot(['shoulders'], 2),
      slot(['abdominals'], 2),
    ],
  },
};

// weekday 0 = Monday. Rest days are simply the weekdays not listed.
const SCHEDULES: Record<number, { day: number; key: SessionKey; variant: number }[]> = {
  2: [
    { day: 0, key: 'full', variant: 0 },
    { day: 3, key: 'full', variant: 1 },
  ],
  3: [
    { day: 0, key: 'full', variant: 0 },
    { day: 2, key: 'full', variant: 1 },
    { day: 4, key: 'full', variant: 2 },
  ],
  4: [
    { day: 0, key: 'upper', variant: 0 },
    { day: 1, key: 'lower', variant: 0 },
    { day: 3, key: 'upper', variant: 1 },
    { day: 4, key: 'lower', variant: 1 },
  ],
  5: [
    { day: 0, key: 'push', variant: 0 },
    { day: 1, key: 'pull', variant: 0 },
    { day: 2, key: 'legs', variant: 0 },
    { day: 4, key: 'upper', variant: 0 },
    { day: 5, key: 'lower', variant: 0 },
  ],
  6: [
    { day: 0, key: 'push', variant: 0 },
    { day: 1, key: 'pull', variant: 0 },
    { day: 2, key: 'legs', variant: 0 },
    { day: 3, key: 'push', variant: 1 },
    { day: 4, key: 'pull', variant: 1 },
    { day: 5, key: 'legs', variant: 1 },
  ],
};

function pickForSlot(
  pool: ExerciseListItem[],
  s: Slot,
  taken: Set<string>,
  weekUsed: Set<string>,
  seed: number,
  scores: Map<string, number>,
): ExerciseListItem | undefined {
  const byMuscle = pool.filter((i) => !taken.has(i.id) && i.primary_muscles.some((m) => s.muscles.includes(m)));
  const byPattern = s.patterns ? byMuscle.filter((i) => s.patterns!.includes(i.movement_pattern)) : byMuscle;
  const tiers = [
    byPattern.filter((i) => !weekUsed.has(i.id)),
    byPattern,
    byMuscle.filter((i) => !weekUsed.has(i.id)),
    byMuscle,
  ];
  for (const tier of tiers) {
    if (tier.length > 0) return pickShelf(tier, 1, seed, scores)[0];
  }
  return undefined;
}

export function buildWeekPlan(
  prefs: ProfilePrefs | null,
  pool: ExerciseListItem[],
  scores: Map<string, number>,
  userKey: string,
): WeekPlan {
  const days = Math.min(6, Math.max(2, prefs?.training_days_per_week ?? 3));
  const beginner = (prefs?.experience_level ?? 'beginner') === 'beginner';
  const strength = pool.filter(isStrength);
  const baseSeed = hashString(userKey);
  const weekUsed = new Set<string>();
  const plan: WeekPlan = Array.from({ length: 7 }, () => null);

  for (const entry of SCHEDULES[days] ?? SCHEDULES[3]) {
    const def = SESSION_DEFS[entry.key];
    const taken = new Set<string>();
    const exercises: PlannedExercise[] = [];

    def.slots.forEach((s, idx) => {
      const seed = baseSeed + hashString(entry.key) + entry.variant * 101 + idx * 13;
      const item = pickForSlot(strength, s, taken, weekUsed, seed, scores);
      if (!item) return;
      taken.add(item.id);
      weekUsed.add(item.id);
      exercises.push({
        item,
        sets: beginner ? Math.max(2, s.sets - 1) : s.sets,
        repsMin: item.default_rep_range_min ?? 8,
        repsMax: item.default_rep_range_max ?? 12,
        rir: item.recommended_rir,
      });
    });

    if (exercises.length === 0) continue;
    const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
    const focus: string[] = [];
    for (const e of exercises) {
      const m = e.item.primary_muscles[0];
      if (m && !focus.includes(m)) focus.push(m);
    }
    plan[entry.day] = {
      title: def.title,
      focus: focus.slice(0, 4),
      exercises,
      minutes: Math.max(20, Math.round((totalSets * 2.5 + 5) / 5) * 5),
    };
  }
  return plan;
}

// A few gentle stretches for rest days.
export function pickRestStretches(catalog: Catalog, seed: number): ExerciseListItem[] {
  const pool = eligiblePool(catalog).filter((i) => i.exercise_type === 'stretch');
  return pickShelf(pool, 5, hashString('rest') + seed, catalog.scores);
}
