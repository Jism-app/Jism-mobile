import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useExerciseInstructions } from '../../hooks/useExerciseInstructions';
import { equipmentLabel, targetLabel, titleCase } from '../../lib/exercises/format';
import { ExerciseListItem, PlannedExercise } from '../../lib/exercises/types';
import { theme } from '../theme';
import { Chip, ChipRow } from './Chip';
import { createThemedStyles } from './createThemedStyles';
import { StepGallery } from './StepGallery';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    title: {
      ...theme.typography.h1,
      color: colors.textPrimary,
      flex: 1,
    },
    close: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
    },
    altNames: {
      ...theme.typography.body,
      color: colors.textSecondary,
      marginBottom: theme.spacing.md,
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
    loader: {
      marginVertical: theme.spacing.xl,
    },
    muted: {
      ...theme.typography.body,
      color: colors.textSecondary,
    },
    error: {
      ...theme.typography.body,
      color: colors.error,
    },
    steps: {
      gap: theme.spacing.md,
    },
    stepRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: theme.radius.full,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepIndex: {
      ...theme.typography.label,
      color: colors.primary,
    },
    stepText: {
      ...theme.typography.body,
      color: colors.textPrimary,
      flex: 1,
      paddingTop: 2,
    },
  }),
);

function Fact({ label, value }: { label: string; value: string }) {
  const { styles } = useStyles();
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

interface ExerciseDetailModalProps {
  item: ExerciseListItem | null;
  /** Set when opened from the program, to show today's sets × reps. */
  planned: PlannedExercise | null;
  visible: boolean;
  onClose: () => void;
}

export function ExerciseDetailModal({ item, planned, visible, onClose }: ExerciseDetailModalProps) {
  const { styles, colors } = useStyles();
  const { width: windowWidth } = useWindowDimensions();
  // True while a photo is zoomed: the page must not scroll under the pan.
  const [pageLocked, setPageLocked] = useState(false);
  const instructions = useExerciseInstructions(item?.id, visible);

  const target = planned
    ? `${planned.sets} × ${planned.repsMin}–${planned.repsMax}`
    : item
      ? targetLabel(item)
      : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={3}>
            {item?.name}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <X color={colors.textPrimary} size={22} strokeWidth={2} />
          </Pressable>
        </View>

        {item ? (
          <ScrollView
            scrollEnabled={!pageLocked}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {item.name_fr || item.name_ar ? (
              <Text style={styles.altNames}>{[item.name_fr, item.name_ar].filter(Boolean).join('  ·  ')}</Text>
            ) : null}

            <StepGallery
              key={item.id}
              item={item}
              width={windowWidth - theme.spacing.lg * 2}
              onLockChange={setPageLocked}
            />

            <View style={styles.facts}>
              <Fact label="Level" value={titleCase(item.difficulty)} />
              <Fact label="Gear" value={equipmentLabel(item)} />
              {target ? <Fact label={planned ? 'Today' : 'Target'} value={target} /> : null}
            </View>

            <Text style={styles.sectionTitle}>Muscles worked</Text>
            <ChipRow>
              {item.primary_muscles.map((m) => (
                <Chip key={m} label={titleCase(m)} selected />
              ))}
              {(item.secondary_muscles ?? []).map((m) => (
                <Chip key={m} label={titleCase(m)} />
              ))}
            </ChipRow>

            <Text style={styles.sectionTitle}>How to do it</Text>
            {instructions.isLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : instructions.isError ? (
              <Text style={styles.error}>Couldn't load the instructions.</Text>
            ) : instructions.data && instructions.data.length > 0 ? (
              <View style={styles.steps}>
                {instructions.data.map((step, index) => (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepIndex}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>No instructions for this exercise yet.</Text>
            )}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
