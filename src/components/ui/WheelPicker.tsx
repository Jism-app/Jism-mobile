import { useCallback, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { theme, useTheme, ColorTokens } from '../theme';

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelPickerProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}

export function WheelPicker({ min, max, step = 1, value, onChange, suffix }: WheelPickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const values: number[] = [];
  for (let v = min; v <= max; v += step) values.push(Number(v.toFixed(2)));

  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<number>>(null);

  const initialIndex = Math.max(0, values.findIndex((v) => v === value));

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clamped = Math.min(values.length - 1, Math.max(0, index));
      const selected = values[clamped];
      if (selected !== value) onChange(selected);
    },
    [values, value, onChange],
  );

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.highlightBand} />

      <Animated.FlatList
        ref={listRef}
        data={values}
        keyExtractor={(item) => String(item)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        contentContainerStyle={{
          paddingVertical: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
        }}
        style={{ height: PICKER_HEIGHT }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item, index }) => {
          const itemOffset = index * ITEM_HEIGHT;
          const inputRange = [itemOffset - ITEM_HEIGHT, itemOffset, itemOffset + ITEM_HEIGHT];

          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.8, 1.15, 0.8],
            extrapolate: 'clamp',
          });
          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.35, 1, 0.35],
            extrapolate: 'clamp',
          });

          return (
            <View style={styles.itemRow}>
              <Animated.View style={[styles.itemContent, { transform: [{ scale }], opacity }]}>
                <Text style={styles.itemText} numberOfLines={1}>
                  {item}
                </Text>
                {suffix ? (
                  <Text style={styles.suffix} numberOfLines={1}>
                    {' '}
                    {suffix}
                  </Text>
                ) : null}
              </Animated.View>
            </View>
          );
        }}
      />
    </View>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      height: PICKER_HEIGHT,
      justifyContent: 'center',
    },
    highlightBand: {
      position: 'absolute',
      top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
      left: 0,
      right: 0,
      height: ITEM_HEIGHT,
      borderRadius: theme.radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    itemRow: {
      height: ITEM_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },
    itemContent: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
    },
    itemText: {
      ...theme.typography.h1,
      lineHeight: theme.typography.h1.fontSize * 1.4,
      color: colors.textPrimary,
      includeFontPadding: false,
      paddingTop: 4,
    },
    suffix: {
      ...theme.typography.body,
      lineHeight: theme.typography.h1.fontSize * 1.4,
      color: colors.textSecondary,
      includeFontPadding: false,
    },
  });
}
