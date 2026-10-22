import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { IMAGE_RATIO, PHOTO_BG } from '../../lib/exercises/format';
import { theme } from '../theme';
import { createThemedStyles } from './createThemedStyles';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    thumb: {
      width: 104,
      aspectRatio: IMAGE_RATIO,
      borderRadius: theme.radius.md,
      backgroundColor: PHOTO_BG,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
  }),
);

interface ExerciseThumbProps {
  uri: string | null;
  style?: StyleProp<ImageStyle>;
}

// 3:2 exercise photo; falls back to a dumbbell tile when there is no image.
export function ExerciseThumb({ uri, style }: ExerciseThumbProps) {
  const { styles, colors } = useStyles();

  if (!uri) {
    return (
      <View style={[styles.thumb, styles.empty, style as StyleProp<ViewStyle>]}>
        <Dumbbell color={colors.textMuted} size={24} strokeWidth={1.8} />
      </View>
    );
  }
  return <Image source={{ uri }} style={[styles.thumb, style]} resizeMode="cover" />;
}
