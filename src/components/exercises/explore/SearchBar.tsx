import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { theme } from '../../theme';
import { createThemedStyles } from '../createThemedStyles';

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    box: {
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
    input: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: theme.typography.body.fontSize,
      paddingVertical: 0,
    },
  }),
);

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const { styles, colors } = useStyles();
  return (
    <View style={styles.box}>
      <Search color={colors.textMuted} size={18} strokeWidth={2} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search a movement or muscle"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChange('')} hitSlop={10}>
          <X color={colors.textMuted} size={18} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}
