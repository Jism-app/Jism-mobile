import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GroupTile } from '../../../lib/exercises/explore';
import { theme } from '../../theme';
import { createThemedStyles } from '../createThemedStyles';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    grid: {
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
    pressed: {
      opacity: 0.78,
    },
    image: {
      ...StyleSheet.absoluteFillObject,
    },
    shade: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.58)',
    },
    label: {
      ...theme.typography.h2,
      color: '#FFFFFF',
    },
  }),
);

interface MuscleTilesProps {
  tiles: GroupTile[];
  onSelect: (tile: GroupTile) => void;
}

// Photo tiles, one per muscle group.
export function MuscleTiles({ tiles, onSelect }: MuscleTilesProps) {
  const { styles } = useStyles();
  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <Pressable
          key={tile.key}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          onPress={() => onSelect(tile)}
        >
          {tile.image ? <Image source={{ uri: tile.image }} style={styles.image} resizeMode="cover" /> : null}
          <View style={styles.shade} />
          <Text style={styles.label}>{tile.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
