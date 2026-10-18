import { memo, useCallback, useMemo, useRef, useState, ReactElement } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  GestureResponderEvent,
  Image,
  ImageStyle,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Dumbbell, Moon, Search, X } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Screen } from '../../../components/ui/Screen';
import { Button } from '../../../components/ui/Button';
import { theme, useTheme, ColorTokens } from '../../../components/theme';

// ─── Types (mirror public.exercises / public.profiles) ──────────────────────

type ExerciseType = 'strength' | 'cardio' | 'stretch';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type Goal = 'muscle_gain' | 'fat_loss' | 'recomposition' | 'general_fitness';

interface ExerciseListItem {
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

interface ProfilePrefs {
  equipment: string[];
  experience_level: Difficulty;
  goal: Goal;
  training_days_per_week: number;
}

// Everything both tabs need, computed once.
interface Catalog {
  allItems: ExerciseListItem[];
  eligibleIds: Set<string>;
  scores: Map<string, number>;
  prefs: ProfilePrefs | null;
}

// ─── Supabase queries ───────────────────────────────────────────────────────

const LIST_COLUMNS =
  'id, name, name_ar, name_fr, primary_muscles, secondary_muscles, equipment, ' +
  'movement_pattern, difficulty, exercise_type, default_rep_range_min, ' +
  'default_rep_range_max, default_duration_seconds, recommended_rir, ' +
  'image_start_url, image_end_url';

// Supabase caps one response (1000 rows by default), so page through the table.
// `instructions` stays out of this query — it is only fetched when a card opens.
const FETCH_PAGE = 500;

async function fetchExercises(): Promise<ExerciseListItem[]> {
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

async function fetchProfilePrefs(userId: string): Promise<ProfilePrefs | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('equipment, experience_level, goal, training_days_per_week')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfilePrefs | null) ?? null;
}

async function fetchInstructions(exerciseId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('instructions')
    .eq('id', exerciseId)
    .single();
  if (error) throw error;
  return ((data as { instructions: string[] | null } | null)?.instructions ?? []) as string[];
}

// ─── Curation: what the user should (not) see ───────────────────────────────

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

const COMPOUND = new Set(['push', 'pull', 'squat', 'hinge']);
const isStrength = (i: ExerciseListItem) => i.exercise_type === 'strength';

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

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hashString = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

// Best-scored candidates, shuffled with a seed, then spread across muscles so
// one muscle can't take over a shelf.
function pickShelf(
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

// ─── Training program (generated client-side until the backend plan exists) ─

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

interface PlannedExercise {
  item: ExerciseListItem;
  sets: number;
  repsMin: number;
  repsMax: number;
  rir: number;
}

interface Session {
  title: string;
  focus: string[];
  exercises: PlannedExercise[];
  minutes: number;
}

type WeekPlan = (Session | null)[];

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

function buildWeekPlan(
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

// ─── Dates ──────────────────────────────────────────────────────────────────

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const PAGER_DAYS = 28; // this week + the next three

function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function relativeLabel(index: number, todayIdx: number): string | null {
  const diff = index - todayIdx;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return null;
}

// ─── Explore: shelves / groups ──────────────────────────────────────────────

interface ListView {
  title: string;
  subtitle?: string;
  filter: (item: ExerciseListItem) => boolean;
}

interface ShelfDef {
  title: string;
  caption: string;
  filter: (item: ExerciseListItem) => boolean;
  count: number;
  hero?: boolean;
}

const SHELF_DEFS: Record<string, ShelfDef> = {
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

const SHELF_ORDER: Record<Goal, string[]> = {
  muscle_gain: ['picks', 'push', 'pull', 'legs', 'mobility', 'cardio'],
  recomposition: ['picks', 'push', 'pull', 'legs', 'cardio', 'mobility'],
  fat_loss: ['picks', 'cardio', 'legs', 'push', 'pull', 'mobility'],
  general_fitness: ['picks', 'cardio', 'push', 'pull', 'legs', 'mobility'],
};

const GOAL_TAGLINE: Record<Goal, string> = {
  muscle_gain: 'Built to add muscle',
  fat_loss: 'Built to burn fat',
  recomposition: 'Built to recomp',
  general_fitness: 'Built for all-round fitness',
};

const GROUPS = [
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

// ─── Display helpers ────────────────────────────────────────────────────────

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const RESULT_STEP = 20;
const IMAGE_RATIO = 1.5;
// The source photos are shot on white, so every image frame is white too —
// the picture then fills its frame instead of floating inside a dark box.
const PHOTO_BG = '#FFFFFF';

function targetLabel(item: ExerciseListItem): string | null {
  if (isStrength(item)) {
    if (item.default_rep_range_min == null || item.default_rep_range_max == null) return null;
    return `${item.default_rep_range_min}–${item.default_rep_range_max} reps`;
  }
  if (item.default_duration_seconds != null) return `${item.default_duration_seconds} sec`;
  return null;
}

type Styles = ReturnType<typeof makeStyles>;

// ─── Small components ───────────────────────────────────────────────────────

function Chip({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: Styles;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function Thumb({
  uri,
  styles,
  iconColor,
  style,
}: {
  uri: string | null;
  styles: Styles;
  iconColor: string;
  style?: StyleProp<ImageStyle>;
}) {
  if (!uri) {
    return (
      <View style={[styles.thumb, styles.thumbEmpty, style as object]}>
        <Dumbbell color={iconColor} size={24} strokeWidth={1.8} />
      </View>
    );
  }
  return <Image source={{ uri }} style={[styles.thumb, style]} resizeMode="cover" />;
}

interface CardProps {
  item: ExerciseListItem;
  onPress: (item: ExerciseListItem) => void;
  styles: Styles;
  iconColor: string;
}

// Big image card used in the horizontal shelves.
const ShelfCard = memo(function ShelfCard({
  item,
  onPress,
  styles,
  iconColor,
  hero,
}: CardProps & { hero?: boolean }) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        styles.shelfCard,
        hero && styles.shelfCardHero,
        pressed && styles.pressed,
      ]}
    >
      <Thumb uri={item.image_start_url} styles={styles} iconColor={iconColor} style={styles.shelfImage} />
      <Text style={styles.shelfTitle} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.shelfMeta} numberOfLines={1}>
        {item.primary_muscles.map(titleCase).join(', ')}
      </Text>
    </Pressable>
  );
});

// Compact row used in list / search results.
const ResultRow = memo(function ResultRow({ item, onPress, styles, iconColor }: CardProps) {
  const equipment = item.equipment?.length ? titleCase(item.equipment.join(', ')) : 'No equipment';
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.card, styles.row, pressed && styles.pressed]}
    >
      <Thumb uri={item.image_start_url} styles={styles} iconColor={iconColor} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.rowMuscles} numberOfLines={1}>
          {item.primary_muscles.map(titleCase).join(', ')}
        </Text>
        <View style={styles.badges}>
          <Text style={[styles.badge, styles.badgeAccent]}>{titleCase(item.difficulty)}</Text>
          <Text style={styles.badge} numberOfLines={1}>
            {equipment}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

// One line of today's program: big picture, sets x reps, RIR.
const PlanCard = memo(function PlanCard({
  planned,
  index,
  onPress,
  styles,
  iconColor,
}: {
  planned: PlannedExercise;
  index: number;
  onPress: (item: ExerciseListItem) => void;
  styles: Styles;
  iconColor: string;
}) {
  const { item, sets, repsMin, repsMax, rir } = planned;
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [styles.card, styles.planCard, pressed && styles.pressed]}
    >
      <Thumb uri={item.image_start_url} styles={styles} iconColor={iconColor} style={styles.planImage} />
      <View style={styles.planBody}>
        <Text style={styles.planIndex}>{String(index + 1).padStart(2, '0')}</Text>
        <Text style={styles.planTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.planMuscles} numberOfLines={1}>
          {item.primary_muscles.map(titleCase).join(', ')}
        </Text>
        <View style={styles.planPills}>
          <View style={styles.planPill}>
            <Text style={styles.planPillText}>
              {sets} × {repsMin}–{repsMax}
            </Text>
          </View>
          <View style={[styles.planPill, styles.planPillQuiet]}>
            <Text style={[styles.planPillText, styles.planPillTextQuiet]}>{rir} RIR</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

// ─── Pinch-to-zoom image (no extra native deps: PanResponder + Animated) ────

const MAX_ZOOM = 3;

interface ZoomableImageProps {
  uri: string;
  width: number;
  height: number;
  onActiveChange: (zoomed: boolean) => void;
}

function ZoomableImage({ uri, width, height, onActiveChange }: ZoomableImageProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const cur = useRef({ s: 1, x: 0, y: 0 });
  const g = useRef({ n: 0, has: false, dist: null as number | null, cx: 0, cy: 0 });
  const lastTap = useRef(0);
  const dims = useRef({ width, height });
  const notify = useRef(onActiveChange);
  dims.current = { width, height };
  notify.current = onActiveChange;

  const apply = useRef((s: number, x: number, y: number) => {
    const ns = Math.min(MAX_ZOOM, Math.max(1, s));
    const maxX = ((ns - 1) * dims.current.width) / 2;
    const maxY = ((ns - 1) * dims.current.height) / 2;
    const nx = Math.min(maxX, Math.max(-maxX, x));
    const ny = Math.min(maxY, Math.max(-maxY, y));
    cur.current = { s: ns, x: nx, y: ny };
    scale.setValue(ns);
    tx.setValue(nx);
    ty.setValue(ny);
  }).current;

  const finish = useRef(() => {
    if (cur.current.s < 1.05) apply(1, 0, 0);
    notify.current(cur.current.s > 1.05);
  }).current;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length >= 2 || cur.current.s > 1.01,
      onMoveShouldSetPanResponderCapture: (e) =>
        e.nativeEvent.touches.length >= 2 || cur.current.s > 1.01,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        g.current = { n: 0, has: false, dist: null, cx: 0, cy: 0 };
        notify.current(true); // lock the parent scrollers while we own the gesture
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        const touches = e.nativeEvent.touches;
        const n = touches.length;
        const st = g.current;
        if (n === 0) return;
        if (n !== st.n) {
          st.n = n;
          st.has = false;
          st.dist = null;
        }
        const cx = touches.reduce((sum, t) => sum + t.pageX, 0) / n;
        const cy = touches.reduce((sum, t) => sum + t.pageY, 0) / n;
        let s = cur.current.s;
        if (n >= 2) {
          const d = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
          if (st.dist != null && st.dist > 0) s = cur.current.s * (d / st.dist);
          st.dist = d;
        }
        if (st.has) apply(s, cur.current.x + (cx - st.cx), cur.current.y + (cy - st.cy));
        st.cx = cx;
        st.cy = cy;
        st.has = true;
      },
      onPanResponderRelease: () => finish(),
      onPanResponderTerminate: () => finish(),
    }),
  ).current;

  const handlePress = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      const target = cur.current.s > 1.05 ? 1 : 2.2;
      cur.current = { s: target, x: 0, y: 0 };
      notify.current(target > 1);
      Animated.parallel([
        Animated.timing(scale, { toValue: target, duration: 200, useNativeDriver: false }),
        Animated.timing(tx, { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(ty, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
    } else {
      lastTap.current = now;
    }
  };

  return (
    <View style={{ width, height, overflow: 'hidden' }} {...responder.panHandlers}>
      <Pressable onPress={handlePress} style={{ width, height }}>
        <Animated.Image
          source={{ uri }}
          resizeMode="contain"
          style={{ width, height, transform: [{ translateX: tx }, { translateY: ty }, { scale }] }}
        />
      </Pressable>
    </View>
  );
}

// ─── Step gallery: full-width white frame, swipe Step 1 / Step 2, pinch zoom ─

const PAGE_GAP = theme.spacing.md;

function StepGallery({
  item,
  width,
  styles,
  onLockChange,
}: {
  item: ExerciseListItem;
  width: number;
  styles: Styles;
  onLockChange: (locked: boolean) => void;
}) {
  const [page, setPage] = useState(0);
  const [locked, setLocked] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const uris = [item.image_start_url, item.image_end_url].filter(Boolean) as string[];
  const height = width / IMAGE_RATIO;
  const stride = width + PAGE_GAP;

  // Warm the cache so swiping to Step 2 never shows a blank frame.
  useMemo(() => uris.forEach((u) => Image.prefetch(u).catch(() => undefined)), [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLock = (v: boolean) => {
    setLocked(v);
    onLockChange(v);
  };

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * stride, animated: true });
    setPage(i);
  };

  if (uris.length === 0) return null;

  return (
    <View style={styles.gallery}>
      <ScrollView
        ref={scrollRef}
        horizontal
        scrollEnabled={!locked && uris.length > 1}
        showsHorizontalScrollIndicator={false}
        snapToInterval={stride}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        nestedScrollEnabled
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
          setPage(Math.max(0, Math.min(uris.length - 1, Math.round(e.nativeEvent.contentOffset.x / stride))))
        }
        contentContainerStyle={{ gap: PAGE_GAP }}
      >
        {uris.map((uri, i) => (
          <View key={uri} style={[styles.galleryFrame, { width, height }]}>
            <ZoomableImage uri={uri} width={width} height={height} onActiveChange={handleLock} />
            <View style={styles.stepBadge} pointerEvents="none">
              <Text style={styles.stepBadgeText}>
                STEP {i + 1}
                {uris.length > 1 ? ` / ${uris.length}` : ''}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {uris.length > 1 ? (
        <View style={styles.stepPills}>
          {uris.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => goTo(i)}
              style={[styles.stepPill, page === i && styles.stepPillActive]}
            >
              <Text style={[styles.stepPillLabel, page === i && styles.stepPillLabelActive]}>
                Step {i + 1}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text style={styles.galleryHint}>Pinch to zoom · double-tap to reset</Text>
    </View>
  );
}

// ─── Detail sheet ───────────────────────────────────────────────────────────

function Fact({ label, value, styles }: { label: string; value: string; styles: Styles }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function ExerciseDetailModal({
  item,
  planned,
  visible,
  onClose,
  styles,
  colors,
}: {
  item: ExerciseListItem | null;
  planned: PlannedExercise | null;
  visible: boolean;
  onClose: () => void;
  styles: Styles;
  colors: ColorTokens;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const [pageLocked, setPageLocked] = useState(false);

  const instructions = useQuery({
    queryKey: ['exercise-instructions', item?.id],
    queryFn: () => fetchInstructions(item!.id),
    enabled: visible && !!item,
    staleTime: Infinity,
  });

  const target = planned
    ? `${planned.sets} × ${planned.repsMin}–${planned.repsMax}`
    : item
      ? targetLabel(item)
      : null;
  const secondary = item?.secondary_muscles ?? [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={3}>
            {item?.name}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
            <X color={colors.textPrimary} size={22} strokeWidth={2} />
          </Pressable>
        </View>

        {item ? (
          <ScrollView
            scrollEnabled={!pageLocked}
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {item.name_fr || item.name_ar ? (
              <Text style={styles.altNames}>{[item.name_fr, item.name_ar].filter(Boolean).join('  ·  ')}</Text>
            ) : null}

            <StepGallery
              key={item.id}
              item={item}
              width={windowWidth - theme.spacing.lg * 2}
              styles={styles}
              onLockChange={setPageLocked}
            />

            <View style={styles.facts}>
              <Fact label="Level" value={titleCase(item.difficulty)} styles={styles} />
              <Fact
                label="Gear"
                value={item.equipment?.length ? titleCase(item.equipment.join(', ')) : 'None'}
                styles={styles}
              />
              {target ? <Fact label={planned ? 'Today' : 'Target'} value={target} styles={styles} /> : null}
            </View>

            <Text style={styles.sectionTitle}>Muscles worked</Text>
            <View style={styles.tagRow}>
              {item.primary_muscles.map((m) => (
                <View key={m} style={[styles.chip, styles.chipSelected]}>
                  <Text style={[styles.chipLabel, styles.chipLabelSelected]}>{titleCase(m)}</Text>
                </View>
              ))}
              {secondary.map((m) => (
                <View key={m} style={styles.chip}>
                  <Text style={styles.chipLabel}>{titleCase(m)}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>How to do it</Text>
            {instructions.isLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : instructions.isError ? (
              <Text style={styles.errorText}>Couldn't load the instructions.</Text>
            ) : instructions.data && instructions.data.length > 0 ? (
              <View style={styles.instructions}>
                {instructions.data.map((step, index) => (
                  <View key={index} style={styles.instructionRow}>
                    <View style={styles.instructionBadge}>
                      <Text style={styles.instructionIndex}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{step}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.cardBody}>No instructions for this exercise yet.</Text>
            )}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Tab 1: My program (calendar, swipe between days) ───────────────────────

interface TabProps {
  catalog: Catalog;
  onOpen: (item: ExerciseListItem, planned?: PlannedExercise) => void;
  styles: Styles;
  colors: ColorTokens;
}

const DayPage = memo(function DayPage({
  date,
  weekday,
  relative,
  session,
  restPicks,
  width,
  onOpen,
  styles,
  colors,
}: {
  date: Date;
  weekday: number;
  relative: string | null;
  session: Session | null;
  restPicks: ExerciseListItem[];
  width: number;
  onOpen: TabProps['onOpen'];
  styles: Styles;
  colors: ColorTokens;
}) {
  const dateLabel = `${WEEKDAY_LONG[weekday]}, ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}`;

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.dayContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <View style={styles.dayHead}>
        {relative ? (
          <View style={styles.relativePill}>
            <Text style={styles.relativeText}>{relative.toUpperCase()}</Text>
          </View>
        ) : null}
        <Text style={styles.dayTitle}>{session ? session.title : 'Rest day'}</Text>
        <Text style={styles.sectionCaption}>{dateLabel}</Text>
      </View>

      {session ? (
        <>
          <Text style={styles.daySummary}>
            {session.exercises.length} exercises · about {session.minutes} min
          </Text>
          <View style={styles.tagRow}>
            {session.focus.map((m) => (
              <View key={m} style={[styles.chip, styles.chipSelected]}>
                <Text style={[styles.chipLabel, styles.chipLabelSelected]}>{titleCase(m)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.planList}>
            {session.exercises.map((planned, index) => (
              <PlanCard
                key={planned.item.id}
                planned={planned}
                index={index}
                onPress={(item) => onOpen(item, planned)}
                styles={styles}
                iconColor={colors.textMuted}
              />
            ))}
          </View>
        </>
      ) : (
        <>
          <View style={[styles.card, styles.restCard]}>
            <Moon color={colors.primary} size={28} strokeWidth={1.8} />
            <Text style={styles.restTitle}>Recovery is part of the plan</Text>
            <Text style={styles.cardBody}>
              Sleep well, eat enough protein, and keep moving lightly. Muscle is built while you rest.
            </Text>
          </View>
          {restPicks.length > 0 ? (
            <>
              <View style={styles.sectionHead}>
                <View style={styles.flex}>
                  <Text style={styles.sectionHeading}>Optional: loosen up</Text>
                  <Text style={styles.sectionCaption}>A few gentle stretches</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfRow}
                nestedScrollEnabled
              >
                {restPicks.map((item) => (
                  <ShelfCard
                    key={item.id}
                    item={item}
                    onPress={(i) => onOpen(i)}
                    styles={styles}
                    iconColor={colors.textMuted}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
});

function ProgramTab({ catalog, onOpen, styles, colors }: TabProps) {
  const { session: authSession } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = windowWidth - theme.spacing.lg * 2;
  const { allItems, eligibleIds, scores, prefs } = catalog;

  const today = useMemo(() => new Date(), []);
  const monday = useMemo(() => startOfWeek(today), [today]);
  const days = useMemo(() => Array.from({ length: PAGER_DAYS }, (_, i) => addDays(monday, i)), [monday]);
  const todayIdx = (today.getDay() + 6) % 7;

  const [selected, setSelected] = useState(todayIdx);
  const pagerRef = useRef<FlatList<Date>>(null);

  const plan = useMemo(() => {
    const pool = allItems.filter((i) => eligibleIds.has(i.id));
    return buildWeekPlan(prefs, pool, scores, authSession?.user.id ?? 'guest');
  }, [allItems, eligibleIds, prefs, scores, authSession?.user.id]);

  const restPicks = useMemo(() => {
    const pool = allItems.filter((i) => eligibleIds.has(i.id) && i.exercise_type === 'stretch');
    return pickShelf(pool, 5, hashString('rest') + Math.floor(today.getTime() / 86_400_000), scores);
  }, [allItems, eligibleIds, scores, today]);

  const goTo = useCallback((index: number) => {
    setSelected(index);
    pagerRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
      setSelected(Math.max(0, Math.min(PAGER_DAYS - 1, index)));
    },
    [pageWidth],
  );

  const weekStart = Math.floor(selected / 7) * 7;
  const selectedDate = days[selected];

  const renderDay = useCallback(
    ({ item: date, index }: { item: Date; index: number }) => (
      <DayPage
        date={date}
        weekday={index % 7}
        relative={relativeLabel(index, todayIdx)}
        session={plan[index % 7]}
        restPicks={restPicks}
        width={pageWidth}
        onOpen={onOpen}
        styles={styles}
        colors={colors}
      />
    ),
    [plan, restPicks, pageWidth, onOpen, styles, colors, todayIdx],
  );

  return (
    <View style={styles.flex}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekMonth}>
          {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>
        {selected !== todayIdx ? (
          <Pressable onPress={() => goTo(todayIdx)} hitSlop={10}>
            <Text style={styles.link}>Back to today</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.weekStrip}>
        {Array.from({ length: 7 }, (_, k) => weekStart + k).map((index) => {
          const date = days[index];
          const isSelected = index === selected;
          const isToday = index === todayIdx;
          const trains = plan[index % 7] !== null;
          return (
            <Pressable
              key={index}
              onPress={() => goTo(index)}
              style={[styles.dayChip, isSelected && styles.dayChipSelected]}
            >
              <Text style={[styles.dayChipWeekday, isSelected && styles.dayChipTextSelected]}>
                {WEEKDAY_SHORT[index % 7]}
              </Text>
              <Text
                style={[
                  styles.dayChipDate,
                  isToday && styles.dayChipToday,
                  isSelected && styles.dayChipTextSelected,
                ]}
              >
                {date.getDate()}
              </Text>
              <View style={[styles.dayDot, trains && styles.dayDotOn]} />
            </Pressable>
          );
        })}
      </View>

      <FlatList
        ref={pagerRef}
        data={days}
        keyExtractor={(d) => d.toISOString()}
        renderItem={renderDay}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={todayIdx}
        getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
        onMomentumScrollEnd={onMomentumEnd}
        initialNumToRender={3}
        windowSize={3}
        style={styles.flex}
      />
    </View>
  );
}

// ─── Tab 2: Explore (curated shelves, muscle tiles, search) ─────────────────

interface Shelf {
  id: string;
  def: ShelfDef;
  items: ExerciseListItem[];
}

function ExploreTab({
  catalog,
  onOpen,
  styles,
  colors,
  onRefresh,
  refreshing,
}: TabProps & { onRefresh: () => void; refreshing: boolean }) {
  const { allItems, eligibleIds, scores, prefs } = catalog;

  const [search, setSearch] = useState('');
  const [view, setView] = useState<ListView | null>(null);
  const [broaden, setBroaden] = useState(false);
  const [visible, setVisible] = useState(RESULT_STEP);

  const daySeed = useMemo(() => Math.floor(Date.now() / 86_400_000), []);

  const shelves = useMemo<Shelf[]>(() => {
    const pool = allItems.filter((i) => eligibleIds.has(i.id));
    const used = new Set<string>();
    const order = SHELF_ORDER[prefs?.goal ?? 'muscle_gain'] ?? SHELF_ORDER.muscle_gain;
    const out: Shelf[] = [];
    for (const id of order) {
      const def = SHELF_DEFS[id];
      const candidates = pool.filter((i) => def.filter(i) && !used.has(i.id));
      const items = pickShelf(candidates, def.count, daySeed + hashString(id), scores);
      if (items.length < 3) continue;
      items.forEach((i) => used.add(i.id));
      out.push({ id, def, items });
    }
    return out;
  }, [allItems, eligibleIds, prefs, daySeed, scores]);

  const groupTiles = useMemo(
    () =>
      GROUPS.map((group) => {
        const filter = (i: ExerciseListItem) =>
          isStrength(i) && i.primary_muscles.some((m) => group.muscles.includes(m));
        let best: ExerciseListItem | null = null;
        for (const i of allItems) {
          if (!eligibleIds.has(i.id) || !filter(i)) continue;
          if (!best || (scores.get(i.id) ?? 0) > (scores.get(best.id) ?? 0)) best = i;
        }
        return { ...group, filter, image: best?.image_start_url ?? null };
      }),
    [allItems, eligibleIds, scores],
  );

  const listMode = view !== null || search.trim() !== '';

  const results = useMemo(() => {
    if (!listMode) return [];
    const q = search.trim().toLowerCase();
    const matches = allItems.filter((item) => {
      if (!broaden && !eligibleIds.has(item.id)) return false;
      if (view && !view.filter(item)) return false;
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
  }, [listMode, allItems, broaden, eligibleIds, view, search, scores]);

  const openView = useCallback((next: ListView) => {
    setView(next);
    setVisible(RESULT_STEP);
  }, []);

  const closeView = useCallback(() => {
    setView(null);
    setSearch('');
    setBroaden(false);
    setVisible(RESULT_STEP);
  }, []);

  const onSearchChange = useCallback((text: string) => {
    setSearch(text);
    setVisible(RESULT_STEP);
  }, []);

  const open = useCallback((item: ExerciseListItem) => onOpen(item), [onOpen]);

  const renderResult = useCallback(
    ({ item }: { item: ExerciseListItem }) => (
      <ResultRow item={item} onPress={open} styles={styles} iconColor={colors.textMuted} />
    ),
    [open, styles, colors.textMuted],
  );

  const tagline = prefs ? GOAL_TAGLINE[prefs.goal] ?? 'Curated for you' : 'Curated for you';

  const searchBar = (
    <View>
      <Text style={styles.exploreTagline}>{tagline}</Text>
      <View style={styles.searchBox}>
        <Search color={colors.textMuted} size={18} strokeWidth={2} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search a movement or muscle"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 ? (
          <Pressable onPress={() => onSearchChange('')} hitSlop={10}>
            <X color={colors.textMuted} size={18} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  const browse = (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.browseContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {shelves.map((shelf, index) => (
        <View key={shelf.id}>
          <View style={styles.sectionHead}>
            <View style={styles.flex}>
              <Text style={styles.sectionHeading}>{shelf.def.title}</Text>
              <Text style={styles.sectionCaption}>{shelf.def.caption}</Text>
            </View>
            {shelf.id !== 'picks' ? (
              <Pressable
                hitSlop={10}
                onPress={() =>
                  openView({ title: shelf.def.title, subtitle: shelf.def.caption, filter: shelf.def.filter })
                }
              >
                <Text style={styles.link}>More</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shelfRow}
            keyboardShouldPersistTaps="handled"
          >
            {shelf.items.map((item) => (
              <ShelfCard
                key={item.id}
                item={item}
                onPress={open}
                styles={styles}
                iconColor={colors.textMuted}
                hero={shelf.def.hero}
              />
            ))}
          </ScrollView>

          {index === 0 ? (
            <View>
              <View style={styles.sectionHead}>
                <View style={styles.flex}>
                  <Text style={styles.sectionHeading}>Train a muscle</Text>
                  <Text style={styles.sectionCaption}>Pick a target, we'll show the best moves</Text>
                </View>
              </View>
              <View style={styles.tileGrid}>
                {groupTiles.map((group) => (
                  <Pressable
                    key={group.key}
                    style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
                    onPress={() => openView({ title: group.label, filter: group.filter })}
                  >
                    {group.image ? (
                      <Image source={{ uri: group.image }} style={styles.tileImage} resizeMode="cover" />
                    ) : null}
                    <View style={styles.tileShade} />
                    <Text style={styles.tileLabel}>{group.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );

  const listHeader = (
    <View style={styles.listHeader}>
      {view ? (
        <Pressable onPress={closeView} hitSlop={10} style={styles.back}>
          <ChevronLeft color={colors.primary} size={20} strokeWidth={2.2} />
          <Text style={styles.link}>Back</Text>
        </Pressable>
      ) : null}
      <Text style={styles.listTitle}>{view ? view.title : 'Results'}</Text>
      {view?.subtitle ? <Text style={styles.sectionCaption}>{view.subtitle}</Text> : null}
      <View style={styles.listChips}>
        <Chip
          label="Include other gear & levels"
          selected={broaden}
          onPress={() => {
            setBroaden((v) => !v);
            setVisible(RESULT_STEP);
          }}
          styles={styles}
        />
      </View>
    </View>
  );

  const listEmpty: ReactElement = (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Nothing here for your setup</Text>
      <Text style={styles.cardBody}>
        {broaden ? 'Try a different search.' : 'Your gear and level filter hides some moves. You can widen it.'}
      </Text>
      {!broaden ? (
        <Button
          label="Include other gear & levels"
          variant="secondary"
          onPress={() => setBroaden(true)}
          style={styles.cardButton}
        />
      ) : null}
    </View>
  );

  const list = (
    <FlatList
      data={results.slice(0, visible)}
      keyExtractor={(item) => item.id}
      renderItem={renderResult}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      ListFooterComponent={
        results.length > visible ? (
          <Button
            label="Show more"
            variant="secondary"
            onPress={() => setVisible((v) => v + RESULT_STEP)}
            style={styles.showMore}
          />
        ) : null
      }
      ItemSeparatorComponent={Separator}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      initialNumToRender={10}
      windowSize={7}
      showsVerticalScrollIndicator={false}
    />
  );

  return (
    <View style={styles.flex}>
      {searchBar}
      <View style={styles.flex}>{listMode ? list : browse}</View>
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

type TabKey = 'program' | 'explore';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'program', label: 'My program' },
  { key: 'explore', label: 'Explore' },
];

export default function ExercicesScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const userId = session?.user.id;

  const [tab, setTab] = useState<TabKey>('program');
  const [selected, setSelected] = useState<ExerciseListItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlannedExercise | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const exercises = useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises,
    staleTime: 1000 * 60 * 60,
  });

  const profile = useQuery({
    queryKey: ['profile-prefs', userId],
    queryFn: () => fetchProfilePrefs(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const prefs = profile.data ?? null;
  const allItems = useMemo(() => exercises.data ?? [], [exercises.data]);

  // What this user is allowed to see by default: has pictures, isn't a niche
  // variant, fits their gear, and isn't above their level.
  const catalog = useMemo<Catalog>(() => {
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
  }, [allItems, prefs]);

  const openDetail = useCallback((item: ExerciseListItem, planned?: PlannedExercise) => {
    setSelected(item);
    setSelectedPlan(planned ?? null);
    setDetailVisible(true);
  }, []);
  const closeDetail = useCallback(() => setDetailVisible(false), []);

  const tabBar = (
    <View style={styles.tabBar}>
      {TABS.map((t) => {
        const active = tab === t.key;
        return (
          <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tabButton}>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
          </Pressable>
        );
      })}
    </View>
  );

  let body: ReactElement;
  if (exercises.isLoading || profile.isLoading) {
    body = <ActivityIndicator color={colors.primary} style={styles.loader} />;
  } else if (exercises.isError) {
    body = (
      <View style={styles.card}>
        <Text style={styles.errorText}>Couldn't load the exercises. Check your connection and try again.</Text>
        <Button label="Retry" variant="secondary" onPress={() => exercises.refetch()} style={styles.cardButton} />
      </View>
    );
  } else if (allItems.length === 0) {
    body = (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nothing to show yet</Text>
        <Text style={styles.cardBody}>The exercise library is empty or not readable for your account.</Text>
      </View>
    );
  } else {
    // Both tabs stay mounted (just hidden) so Explore keeps its search/filters
    // and the program keeps the day you were looking at.
    body = (
      <View style={styles.flex}>
        <View style={[styles.flex, tab !== 'program' && styles.hidden]}>
          <ProgramTab catalog={catalog} onOpen={openDetail} styles={styles} colors={colors} />
        </View>
        <View style={[styles.flex, tab !== 'explore' && styles.hidden]}>
          <ExploreTab
            catalog={catalog}
            onOpen={openDetail}
            styles={styles}
            colors={colors}
            onRefresh={() => exercises.refetch()}
            refreshing={exercises.isRefetching}
          />
        </View>
      </View>
    );
  }

  return (
    <Screen>
      {tabBar}
      {body}
      <ExerciseDetailModal
        item={selected}
        planned={selectedPlan}
        visible={detailVisible}
        onClose={closeDetail}
        styles={styles}
        colors={colors}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={{ height: theme.spacing.md }} />;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    flex: { flex: 1 },
    hidden: { display: 'none' },

    // Top tabs (Instagram-style underline)
    tabBar: {
      flexDirection: 'row',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      paddingTop: theme.spacing.sm,
    },
    tabLabel: {
      ...theme.typography.bodyMedium,
      fontWeight: '700',
      color: colors.textMuted,
      paddingBottom: theme.spacing.sm,
    },
    tabLabelActive: {
      color: colors.textPrimary,
    },
    tabUnderline: {
      height: 3,
      alignSelf: 'stretch',
      borderRadius: theme.radius.full,
      backgroundColor: 'transparent',
    },
    tabUnderlineActive: {
      backgroundColor: colors.warning,
    },

    // Week strip + pager
    weekHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    weekMonth: {
      ...theme.typography.label,
      color: colors.textSecondary,
    },
    weekStrip: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.md,
    },
    dayChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    dayChipSelected: {
      borderColor: colors.warning,
      backgroundColor: colors.primaryMuted,
    },
    dayChipWeekday: {
      ...theme.typography.caption,
      color: colors.textMuted,
    },
    dayChipDate: {
      ...theme.typography.bodyMedium,
      color: colors.textPrimary,
      marginTop: 2,
    },
    dayChipToday: {
      color: colors.primary,
      fontWeight: '800',
    },
    dayChipTextSelected: {
      color: colors.primary,
    },
    dayDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 6,
      backgroundColor: 'transparent',
    },
    dayDotOn: {
      backgroundColor: colors.warning,
    },

    // Day page
    dayContent: {
      paddingBottom: theme.spacing.xxl,
    },
    dayHead: {
      marginBottom: theme.spacing.md,
    },
    relativePill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryMuted,
      borderRadius: theme.radius.full,
      paddingVertical: 2,
      paddingHorizontal: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    relativeText: {
      ...theme.typography.label,
      fontSize: 11,
      color: colors.primary,
      letterSpacing: 0.8,
    },
    dayTitle: {
      ...theme.typography.h1,
      color: colors.textPrimary,
    },
    daySummary: {
      ...theme.typography.body,
      color: colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    planList: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    planCard: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      padding: theme.spacing.sm,
    },
    planImage: {
      width: 124,
      borderRadius: theme.radius.md,
    },
    planBody: {
      flex: 1,
      paddingVertical: theme.spacing.xs,
    },
    planIndex: {
      ...theme.typography.label,
      color: colors.primary,
    },
    planTitle: {
      ...theme.typography.bodyMedium,
      color: colors.textPrimary,
      marginTop: 2,
    },
    planMuscles: {
      ...theme.typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    planPills: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    planPill: {
      backgroundColor: colors.primaryMuted,
      borderRadius: theme.radius.full,
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
    },
    planPillQuiet: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    planPillText: {
      ...theme.typography.label,
      color: colors.primary,
    },
    planPillTextQuiet: {
      color: colors.textSecondary,
    },
    restCard: {
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    restTitle: {
      ...theme.typography.h2,
      color: colors.textPrimary,
    },

    // Explore
    exploreTagline: {
      ...theme.typography.body,
      color: colors.primary,
      marginBottom: theme.spacing.md,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      height: 52,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    searchInput: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: theme.typography.body.fontSize,
      paddingVertical: 0,
    },

    // Chips (selected treatment matches OptionList)
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: theme.radius.full,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    chipSelected: {
      borderColor: colors.warning,
      backgroundColor: colors.primaryMuted,
    },
    chipLabel: {
      ...theme.typography.label,
      color: colors.textSecondary,
    },
    chipLabelSelected: {
      color: colors.primary,
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },

    // Browse
    browseContent: {
      paddingBottom: theme.spacing.xxl,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
    },
    sectionHeading: {
      ...theme.typography.h2,
      color: colors.textPrimary,
    },
    sectionCaption: {
      ...theme.typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    link: {
      ...theme.typography.label,
      color: colors.primary,
    },
    shelfRow: {
      gap: theme.spacing.md,
      paddingRight: theme.spacing.lg,
    },
    shelfCard: {
      width: 176,
      padding: theme.spacing.sm,
    },
    shelfCardHero: {
      width: 260,
      padding: theme.spacing.md,
    },
    shelfImage: {
      width: '100%',
      borderRadius: theme.radius.md,
    },
    shelfTitle: {
      ...theme.typography.bodyMedium,
      color: colors.textPrimary,
      marginTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
    },
    shelfMeta: {
      ...theme.typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
      marginBottom: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    },

    // Muscle tiles
    tileGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    tile: {
      flexBasis: '48.5%',
      flexGrow: 1,
      height: 104,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
      justifyContent: 'flex-end',
      padding: theme.spacing.md,
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tileImage: {
      ...StyleSheet.absoluteFillObject,
    },
    tileShade: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.58)',
    },
    tileLabel: {
      ...theme.typography.h2,
      color: '#FFFFFF',
    },

    // Cards / rows
    card: {
      backgroundColor: colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.md,
    },
    cardTitle: {
      ...theme.typography.h2,
      color: colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    cardBody: {
      ...theme.typography.body,
      color: colors.textSecondary,
    },
    cardButton: {
      marginTop: theme.spacing.md,
    },
    pressed: {
      opacity: 0.78,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.sm,
    },
    thumb: {
      width: 104,
      aspectRatio: IMAGE_RATIO,
      borderRadius: theme.radius.md,
      backgroundColor: PHOTO_BG,
    },
    thumbEmpty: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      ...theme.typography.bodyMedium,
      color: colors.textPrimary,
    },
    rowMuscles: {
      ...theme.typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    badge: {
      ...theme.typography.label,
      color: colors.textMuted,
      flexShrink: 1,
    },
    badgeAccent: {
      color: colors.primary,
    },

    // List mode
    listContent: {
      paddingBottom: theme.spacing.xxl,
    },
    listHeader: {
      marginBottom: theme.spacing.md,
    },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    listTitle: {
      ...theme.typography.h2,
      color: colors.textPrimary,
    },
    listChips: {
      flexDirection: 'row',
      marginTop: theme.spacing.md,
    },
    showMore: {
      marginTop: theme.spacing.lg,
    },

    // States
    loader: {
      marginVertical: theme.spacing.xl,
    },
    errorText: {
      ...theme.typography.body,
      color: colors.error,
    },

    // Detail sheet
    modalSafe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    modalTitle: {
      ...theme.typography.h1,
      color: colors.textPrimary,
      flex: 1,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalScroll: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    altNames: {
      ...theme.typography.body,
      color: colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    gallery: {
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    galleryFrame: {
      backgroundColor: PHOTO_BG,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    stepBadge: {
      position: 'absolute',
      top: theme.spacing.md,
      left: theme.spacing.md,
      backgroundColor: 'rgba(0,0,0,0.72)',
      borderRadius: theme.radius.full,
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
    },
    stepBadgeText: {
      ...theme.typography.label,
      fontSize: 11,
      letterSpacing: 0.8,
      color: '#FFFFFF',
    },
    stepPills: {
      flexDirection: 'row',
      alignSelf: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    stepPill: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: theme.radius.full,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    stepPillActive: {
      borderColor: colors.warning,
      backgroundColor: colors.primaryMuted,
    },
    stepPillLabel: {
      ...theme.typography.label,
      color: colors.textSecondary,
    },
    stepPillLabelActive: {
      color: colors.primary,
    },
    galleryHint: {
      ...theme.typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
    facts: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    fact: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.md,
    },
    factLabel: {
      ...theme.typography.label,
      color: colors.textMuted,
    },
    factValue: {
      ...theme.typography.bodyMedium,
      color: colors.textPrimary,
      marginTop: theme.spacing.xs,
    },
    sectionTitle: {
      ...theme.typography.label,
      color: colors.textSecondary,
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.md,
    },
    instructions: {
      gap: theme.spacing.md,
    },
    instructionRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    instructionBadge: {
      width: 28,
      height: 28,
      borderRadius: theme.radius.full,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    instructionIndex: {
      ...theme.typography.label,
      color: colors.primary,
    },
    instructionText: {
      ...theme.typography.body,
      color: colors.textPrimary,
      flex: 1,
      paddingTop: 2,
    },
  });
}