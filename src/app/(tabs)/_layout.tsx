import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useApp } from '../../session-context';
import { colors, useText } from '../../components/ui';
export default function TabLayout() {
  const { locale } = useApp();
  const t = useText();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopColor: colors.line,
          flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      {(
        [
          ['index', 'اكتشف', 'Discover', '◈'],
          ['stores', 'المتاجر', 'Stores', '▤'],
          ['cart', 'السلة', 'Basket', '＋'],
          ['orders', 'طلباتي', 'Orders', '≡'],
          ['account', 'حسابي', 'Account', '○'],
        ] as const
      ).map(([name, ar, en, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(ar, en),
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>{icon}</Text>,
          }}
        />
      ))}
    </Tabs>
  );
}
