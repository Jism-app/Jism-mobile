import { useMemo, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { IMAGE_RATIO, PHOTO_BG } from '../../lib/exercises/format';
import { ExerciseListItem } from '../../lib/exercises/types';
import { theme } from '../theme';
import { createThemedStyles } from './createThemedStyles';
import { ZoomableImage } from './ZoomableImage';

const PAGE_GAP = theme.spacing.md;

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    gallery: {
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    frame: {
      backgroundColor: PHOTO_BG,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    badge: {
      position: 'absolute',
      top: theme.spacing.md,
      left: theme.spacing.md,
      backgroundColor: 'rgba(0,0,0,0.72)',
      borderRadius: theme.radius.full,
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
    },
    badgeText: {
      ...theme.typography.label,
      fontSize: 11,
      letterSpacing: 0.8,
      color: '#FFFFFF',
    },
    pills: {
      flexDirection: 'row',
      alignSelf: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    pill: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: theme.radius.full,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    pillActive: {
      borderColor: colors.warning,
      backgroundColor: colors.primaryMuted,
    },
    pillLabel: {
      ...theme.typography.label,
      color: colors.textSecondary,
    },
    pillLabelActive: {
      color: colors.primary,
    },
    hint: {
      ...theme.typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  }),
);

interface StepGalleryProps {
  item: ExerciseListItem;
  width: number;
  /** Fires while an image is zoomed, so the parent can lock its own scrolling. */
  onLockChange: (locked: boolean) => void;
}

// Full-width white frame: swipe between Step 1 / Step 2, pinch to zoom.
export function StepGallery({ item, width, onLockChange }: StepGalleryProps) {
  const { styles } = useStyles();
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
          <View key={uri} style={[styles.frame, { width, height }]}>
            <ZoomableImage uri={uri} width={width} height={height} onActiveChange={handleLock} />
            <View style={styles.badge} pointerEvents="none">
              <Text style={styles.badgeText}>
                STEP {i + 1}
                {uris.length > 1 ? ` / ${uris.length}` : ''}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {uris.length > 1 ? (
        <View style={styles.pills}>
          {uris.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} style={[styles.pill, page === i && styles.pillActive]}>
              <Text style={[styles.pillLabel, page === i && styles.pillLabelActive]}>Step {i + 1}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text style={styles.hint}>Pinch to zoom · double-tap to reset</Text>
    </View>
  );
}
