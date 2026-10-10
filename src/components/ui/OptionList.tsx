import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Activity,
  CalendarDays,
  Cable,
  CircleDot,
  Dumbbell,
  Flame,
  HeartPulse,
  PersonStanding,
  RefreshCcw,
  Sprout,
  Target,
  Trophy,
  TrendingUp,
  UserRound,
} from 'lucide-react-native';
import { theme, useTheme, ColorTokens } from '../theme';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface OptionListProps {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  layout?: 'list' | 'grid';
}

type OptionIcon = typeof Dumbbell;

const ICONS: Record<string, OptionIcon> = {
  male: UserRound,
  female: PersonStanding,
  muscle_gain: Dumbbell,
  fat_loss: Flame,
  recomposition: RefreshCcw,
  general_fitness: HeartPulse,
  beginner: Sprout,
  intermediate: TrendingUp,
  advanced: Trophy,
  barbell: Dumbbell,
  dumbbells: Dumbbell,
  machines: Target,
  cables: Cable,
  resistance_bands: Activity,
  pull_up_bar: Dumbbell,
  bodyweight_only: PersonStanding,
  '2': CalendarDays,
  '3': CalendarDays,
  '4': CalendarDays,
  '5': CalendarDays,
  '6': CalendarDays,
};

export function OptionList({ options, selected, onToggle, layout = 'list' }: OptionListProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors, layout), [colors, layout]);

  return (
    <View style={styles.list}>
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        const Icon = ICONS[option.value] ?? CircleDot;
        return (
          <Pressable
            key={option.value}
            onPress={() => onToggle(option.value)}
            style={[styles.option, isSelected && styles.optionSelected]}
          >
            <View style={styles.optionMain}>
              {option.value === 'male' || option.value === 'female' ? (
                <Text style={[styles.genderGlyph, isSelected && styles.genderGlyphSelected]}>
                  {option.value === 'male' ? '♂' : '♀'}
                </Text>
              ) : (
                <Icon
                  color={isSelected ? colors.primary : colors.textSecondary}
                  size={layout === 'grid' ? 34 : 22}
                  strokeWidth={1.8}
                />
              )}
              <View style={styles.textBlock}>
                <Text style={[styles.label, isSelected && styles.labelSelected]}>
                  {option.label}
                </Text>
                {option.description ? (
                  <Text style={styles.description}>{option.description}</Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ColorTokens, layout: 'list' | 'grid') {
  return StyleSheet.create({
    list: {
      gap: theme.spacing.sm,
      flexDirection: layout === 'grid' ? 'row' : 'column',
      flexWrap: layout === 'grid' ? 'wrap' : 'nowrap',
    },
    option: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: layout === 'grid' ? 144 : 64,
      flexBasis: layout === 'grid' ? '47%' : undefined,
      justifyContent: layout === 'grid' ? 'center' : 'flex-start',
    },
    optionMain: {
      flexDirection: layout === 'grid' ? 'column' : 'row',
      alignItems: layout === 'grid' ? 'center' : 'center',
      gap: theme.spacing.sm,
    },
    textBlock: {
      flex: 1,
    },
    optionSelected: {
      borderColor: colors.warning,
      backgroundColor: colors.primaryMuted,
    },
    label: {
      ...theme.typography.bodyMedium,
      color: colors.textPrimary,
    },
    labelSelected: {
      color: colors.primary,
    },
    genderGlyph: {
      color: colors.textSecondary,
      fontSize: 42,
      lineHeight: 44,
      fontWeight: '400',
    },
    genderGlyphSelected: {
      color: colors.primary,
    },
    description: {
      ...theme.typography.caption,
      color: colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
  });
}
