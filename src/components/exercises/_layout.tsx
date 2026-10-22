import { Tabs } from 'expo-router';
import { Dumbbell, House } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from '../../../components/ui/TabBarIcon';
import { theme, useTheme } from '../../../components/theme';

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, theme.spacing.sm);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true, // keeps the bar out of the way of the search field
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.4,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 58 + bottomInset,
          paddingTop: theme.spacing.sm,
          paddingBottom: bottomInset,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => <TabBarIcon icon={House} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="exercices"
        options={{
          title: 'Exercices',
          tabBarIcon: ({ focused, color }) => <TabBarIcon icon={Dumbbell} focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}
