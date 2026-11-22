import React from 'react';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useApp } from '../../session-context';
import { colors, useText } from '../../components/ui';

const tabs = [
  { name: 'index', ar: 'الرئيسية', en: 'Home', icon: { ios: 'house', android: 'home', web: 'home' }, activeIcon: { ios: 'house.fill', android: 'home', web: 'home' } },
  { name: 'search', ar: 'بحث', en: 'Search', icon: { ios: 'magnifyingglass', android: 'search', web: 'search' }, activeIcon: { ios: 'magnifyingglass', android: 'search', web: 'search' } },
  { name: 'cart', ar: 'السلة', en: 'Cart', icon: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' }, activeIcon: { ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' } },
  { name: 'account', ar: 'حسابي', en: 'Profile', icon: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }, activeIcon: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' } },
] as const;

export default function TabLayout() {
  const { locale } = useApp();
  const t = useText();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: '#9A908A',
      tabBarStyle: {
        backgroundColor: colors.white,
        borderTopColor: colors.line,
        borderTopWidth: 1,
        height: 74,
        paddingTop: 7,
        paddingBottom: 8,
        flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
        shadowColor: colors.ink,
        shadowOpacity: 0.07,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: -4 },
        elevation: 12,
      },
      tabBarItemStyle: { paddingVertical: 2 },
      tabBarLabelStyle: { fontSize: 10.5, fontWeight: '800', marginTop: 2 },
    }}>
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{
          title: t(tab.ar, tab.en),
          tabBarIcon: ({ color, focused }) => (
            <SymbolView name={focused ? tab.activeIcon : tab.icon} tintColor={color} size={focused ? 24 : 22} />
          ),
        }} />
      ))}
      <Tabs.Screen name="stores" options={{ href: null }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
    </Tabs>
  );
}
