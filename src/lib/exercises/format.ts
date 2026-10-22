import { isStrength } from './curation';
import { ExerciseListItem } from './types';

export const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export const IMAGE_RATIO = 1.5;

// The source photos are shot on white, so every image frame is white too —
// the picture then fills its frame instead of floating inside a dark box.
export const PHOTO_BG = '#FFFFFF';

export function targetLabel(item: ExerciseListItem): string | null {
  if (isStrength(item)) {
    if (item.default_rep_range_min == null || item.default_rep_range_max == null) return null;
    return `${item.default_rep_range_min}–${item.default_rep_range_max} reps`;
  }
  if (item.default_duration_seconds != null) return `${item.default_duration_seconds} sec`;
  return null;
}

export const equipmentLabel = (item: ExerciseListItem, empty = 'None') =>
  item.equipment?.length ? titleCase(item.equipment.join(', ')) : empty;

export const musclesLabel = (item: ExerciseListItem) => item.primary_muscles.map(titleCase).join(', ');
