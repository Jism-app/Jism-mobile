// Explore tab: which shelves to show, the muscle-group tiles, and search.

import { COMPOUND, eligiblePool, hashString, isStrength, pickShelf } from './curation';
import { Catalog, ExerciseListItem, Goal, ProfilePrefs } from './types';

export const RESULT_STEP = 20;

export interface ListView {
  title: string;
  subtitle?: string;
  filter: (item: ExerciseListItem) => boolean;
}

export interface ShelfDef {
  title: string;
  caption: string;
  filter: (item: ExerciseListItem) => boolean;
  count: number;
  hero?: boolean;
}

export const SHELF_DEFS: Record<string, ShelfDef> = {
  picks: {
    title: 'Picked for you',
    caption: 'Fresh picks every day',
    filter: (i) => isStrength(i) && COMPOUND.has(i.movement_pattern),
    count: 8,
    hero: true,
  },
  push: {
    title: 'Push',
    caption: 'Chest, shoulders and triceps',
    filter: (i) => isStrength(i) && i.movement_pattern === 'push',
    count: 8,
  },
  pull: {
    title: 'Pull',
    caption: 'Back and biceps',
    filter: (i) => isStrength(i) && i.movement_pattern === 'pull',
    count: 8,
  },
  legs: {
    title: 'Legs',
    caption: 'Squats and hinges',
    filter: (i) => isStrength(i) && (i.movement_pattern === 'squat' || i.movement_pattern === 'hinge'),
    count: 8,
  },
  cardio: {
    title: 'Raise your heart rate',
    caption: 'Cardio',
    filter: (i) => i.exercise_type === 'cardio',
    count: 8,
  },
  mobility: {
    title: 'Warm up & stretch',
    caption: 'Mobility',
    filter: (i) => i.exercise_type === 'stretch',
    count: 8,
  },
};

export const SHELF_ORDER: Record<Goal, string[]> = {
  muscle_gain: ['picks', 'push', 'pull', 'legs', 'mobility', 'cardio'],
  recomposition: ['picks', 'push', 'pull', 'legs', 'cardio', 'mobility'],
  fat_loss: ['picks', 'cardio', 'legs', 'push', 'pull', 'mobility'],
  general_fitness: ['picks', 'cardio', 'push', 'pull', 'legs', 'mobility'],
};

export const GOAL_TAGLINE: Record<Goal, string> = {
  muscle_gain: 'Built to add muscle',
  fat_loss: 'Built to burn fat',
  recomposition: 'Built to recomp',
  general_fitness: 'Built for all-round fitness',
};

export const GROUPS = [
  { key: 'chest', label: 'Chest', muscles: ['chest'] },
  { key: 'back', label: 'Back', muscles: ['lats', 'middle back', 'lower back', 'traps'] },
  { key: 'shoulders', label: 'Shoulders', muscles: ['shoulders', 'neck'] },
  { key: 'arms', label: 'Arms', muscles: ['biceps', 'triceps', 'forearms'] },
  {
    key: 'legs',
    label: 'Legs & glutes',
    muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'],
  },
  { key: 'core', label: 'Core', muscles: ['abdominals'] },
];

export interface Shelf {
  id: string;
  def: ShelfDef;
  items: ExerciseListItem[];
}

export function buildShelves(catalog: Catalog, seed: number): Shelf[] {
  const pool = eligiblePool(catalog);
  const used = new Set<string>();
  const order = SHELF_ORDER[catalog.prefs?.goal ?? 'muscle_gain'] ?? SHELF_ORDER.muscle_gain;
  const out: Shelf[] = [];
  for (const id of order) {
    const def = SHELF_DEFS[id];
    const candidates = pool.filter((i) => def.filter(i) && !used.has(i.id));
    const items = pickShelf(candidates, def.count, seed + hashString(id), catalog.scores);
    if (items.length < 3) continue;
    items.forEach((i) => used.add(i.id));
    out.push({ id, def, items });
  }
  return out;
}

export interface GroupTile {
  key: string;
  label: string;
  filter: (item: ExerciseListItem) => boolean;
  image: string | null;
}

// One tile per muscle group, pictured with its best-ranked exercise.
export function buildGroupTiles(catalog: Catalog): GroupTile[] {
  const { allItems, eligibleIds, scores } = catalog;
  return GROUPS.map((group) => {
    const filter = (i: ExerciseListItem) =>
      isStrength(i) && i.primary_muscles.some((m) => group.muscles.includes(m));
    let best: ExerciseListItem | null = null;
    for (const i of allItems) {
      if (!eligibleIds.has(i.id) || !filter(i)) continue;
      if (!best || (scores.get(i.id) ?? 0) > (scores.get(best.id) ?? 0)) best = i;
    }
    return { key: group.key, label: group.label, filter, image: best?.image_start_url ?? null };
  });
}

export function searchResults(
  catalog: Catalog,
  opts: { search: string; view: ListView | null; broaden: boolean },
): ExerciseListItem[] {
  const { allItems, eligibleIds, scores } = catalog;
  const q = opts.search.trim().toLowerCase();
  const matches = allItems.filter((item) => {
    if (!opts.broaden && !eligibleIds.has(item.id)) return false;
    if (opts.view && !opts.view.filter(item)) return false;
    if (!q) return true;
    return [item.name, item.name_fr, item.name_ar, ...item.primary_muscles]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
  return matches.sort((a, b) => {
    if (q) {
      const aStart = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bStart = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStart !== bStart) return aStart - bStart;
    }
    return (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
  });
}

export const taglineFor = (prefs: ProfilePrefs | null) =>
  prefs ? GOAL_TAGLINE[prefs.goal] ?? 'Curated for you' : 'Curated for you';
