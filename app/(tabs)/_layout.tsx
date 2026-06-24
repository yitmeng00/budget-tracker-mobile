import { Tabs } from 'expo-router';
import { LayoutList, BarChart2, Wallet, Settings } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useColors } from '@/context/ThemeContext';
import { useStrings } from '@/context/LanguageContext';

export default function TabLayout() {
  const colors = useColors();
  const t = useStrings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabTransactions,
          tabBarIcon: ({ color, size }) => <LayoutList color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t.tabStats,
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: t.tabAccounts,
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabSettings,
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size - 2} />,
        }}
      />
    </Tabs>
  );
}
