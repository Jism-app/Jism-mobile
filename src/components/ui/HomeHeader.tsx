import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Scale, Target, LucideIcon } from 'lucide-react-native';
import { theme, useTheme, ColorTokens } from '../theme';
import type { Profile } from '../../hooks/useProfile';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const GOAL_LABELS: Record<Profile['goal'], string> = {
  muscle_gain: 'Muscle gain',
  fat_loss: 'Fat loss',
  recomposition: 'Recomposition',
  general_fitness: 'General fitness',
};

// No display name exists on the profile yet, so derive one from the email.
function nameFromEmail(email?: string | null): string {
  const local = email?.split('@')[0] ?? '';
  const first = local.split(/[._-]+/)[0].replace(/[0-9]+$/, '');
  if (!first) return 'there';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

interface HomeHeaderProps {
  email?: string | null;
  profile?: Profile | null;
}

export function HomeHeader({ email, profile }: HomeHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const now = new Date();
  const dateLabel = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
  const name = nameFromEmail(email);
  const initials = name.slice(0, 2).toUpperCase();

  const chips: { icon: LucideIcon; label: string; filled?: boolean }[] = [];
  if (profile) {
    chips.push({ icon: Target, label: GOAL_LABELS[profile.goal], filled: true });
    chips.push({ icon: Scale, label: `${profile.weight_kg} kg` });
    chips.push({ icon: CalendarDays, label: `${profile.training_days_per_week} days/wk` });
  }

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <Text style={styles.date}>{dateLabel}</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      <Text style={styles.greeting}>{greetingFor(now.getHours())},</Text>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>

      {chips.length > 0 ? (
        <View style={styles.chips}>
          {chips.map(({ icon: Icon, label, filled }) => (
            <View key={label} style={[styles.chip, filled ? styles.chipFilled : styles.chipOutline]}>
              <Icon size={14} color={filled ? colors.primary : colors.textSecondary} />
              <Text style={[styles.chipText, filled ? styles.chipTextFilled : styles.chipTextOutline]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    root: {
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    date: {
      ...theme.typography.label,
      letterSpacing: 1,
      color: colors.textMuted,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.full,
      backgroundColor: colors.primaryMuted,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...theme.typography.label,
      fontSize: 15,
      fontWeight: '800',
      color: colors.primary,
    },
    greeting: {
      ...theme.typography.h2,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    name: {
      ...theme.typography.display,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 32,
      paddingHorizontal: 12,
      borderRadius: theme.radius.full,
    },
    chipFilled: { backgroundColor: colors.primaryMuted },
    chipOutline: { borderWidth: 1, borderColor: colors.border },
    chipText: {
      ...theme.typography.label,
      marginLeft: 6,
    },
    chipTextFilled: { color: colors.primary },
    chipTextOutline: { color: colors.textSecondary },
  });
}