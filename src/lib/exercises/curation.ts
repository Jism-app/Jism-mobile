// Decides what a given user should (not) see: gear, level, niche variants,
// and which "standard" exercises rank first.

import { Catalog, Difficulty, ExerciseListItem, ProfilePrefs } from './types';

// Onboarding equipment values (profiles.equipment) → the equipment strings the
// exercises were imported with (free-exercise-db naming).
const EQUIPMENT_MAP: Record<string, string[]> = {
  barbell: ['barbell', 'e-z curl bar'],
  dumbbells: ['dumbbell'],
  machines: ['machine'],
  cables: ['cable'],
  resistance_bands: ['bands'],
  pull_up_bar: [], // pull-ups are tagged "body only" in the dataset
  bodyweight_only: [],
};
const NO_GEAR = ['body only', 'bodyweight', 'none'];

const LEVEL_RANK: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };

// Specialty / competition / odd-gear variants that clutter a general library.
const NICHE =
  /(chains?\b|reverse band|with bands|- with bands|powerlifting|\bjerk\b|snatch|\bclean\b|plate movers|\bthrow\b|conan|\bsprint\b|\byoke\b|farmer|\batlas\b|\btire\b|rickshaw|\baxle\b|car deadlift|\bsled\b|zercher|jefferson|frankenstein|rocky|bench jump|turkish|\bget-?up\b|muscle-?up|handstand|sissy|speed |box squat|guillotine)/i;

export const COMPOUND = new Set(['push', 'pull', 'squat', 'hinge']);
export const isStrength = (i: ExerciseListItem) => i.exercise_type === 'strength';

function buildAllowedEquipment(profileEquipment: string[]): Set<string> {
  const allowed = new Set<string>(NO_GEAR);
  for (const value of profileEquipment) {
    allowed.add(value.toLowerCase());
    (EQUIPMENT_MAP[value] ?? []).forEach((e) => allowed.add(e));
  }
  return allowed;
}

function matchesEquipment(item: ExerciseListItem, allowed: Set<string>): boolean {
  if (!item.equipment || item.equipment.length === 0) return true;
  return item.equipment.every((e) => allowed.has(e.toLowerCase()));
}

// "Standard" exercises first: short names, both frames, compound lifts, and the
// user's own level.
function scoreOf(item: ExerciseListItem, level: Difficulty | undefined): number {
  let s = 100 - Math.min(item.name.length, 60);
  if (item.image_start_url && item.image_end_url) s += 15;
  if (isStrength(item) && COMPOUND.has(item.movement_pattern)) s += 20;
  if (level && item.difficulty === level) s += 10;
  return s;
}

// What this user may see by default: has pictures, isn't a niche variant, fits
// their gear, and isn't above their level.
export function buildCatalog(allItems: ExerciseListItem[], prefs: ProfilePrefs | null): Catalog {
  const allowed = prefs ? buildAllowedEquipment(prefs.equipment ?? []) : null;
  const eligibleIds = new Set<string>();
  const scores = new Map<string, number>();
  for (const item of allItems) {
    scores.set(item.id, scoreOf(item, prefs?.experience_level));
    if (!item.image_start_url) continue;
    if (NICHE.test(item.name)) continue;
    if (allowed && !matchesEquipment(item, allowed)) continue;
    if (prefs && LEVEL_RANK[item.difficulty] > LEVEL_RANK[prefs.experience_level]) continue;
    eligibleIds.add(item.id);
  }
  return { allItems, eligibleIds, scores, prefs };
}

export const eligiblePool = (catalog: Catalog): ExerciseListItem[] =>
  catalog.allItems.filter((i) => catalog.eligibleIds.has(i.id));

// ─── Deterministic picking ──────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hashString = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

// Best-scored candidates, shuffled with a seed, then spread across muscles so
// one muscle can't take over a shelf.
export function pickShelf(
  items: ExerciseListItem[],
  count: number,
  seed: number,
  scores: Map<string, number>,
): ExerciseListItem[] {
  const ranked = [...items]
    .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
    .slice(0, count * 4);
  const rand = mulberry32(seed);
  for (let i = ranked.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ranked[i], ranked[j]] = [ranked[j], ranked[i]];
  }
  const perMuscle = new Map<string, number>();
  const out: ExerciseListItem[] = [];
  for (const item of ranked) {
    const m = item.primary_muscles[0] ?? '';
    const n = perMuscle.get(m) ?? 0;
    if (n >= 2) continue;
    perMuscle.set(m, n + 1);
    out.push(item);
    if (out.length === count) break;
  }
  for (const item of ranked) {
    if (out.length >= count) break;
    if (!out.includes(item)) out.push(item);
  }
  return out;
}
