import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useApp } from '../../session-context';
import { colors, useText } from '../../components/ui';

const tabs = [
  {
    name: 'index',
    ar: 'الرئيسية',
    en: 'Home',
    icon: { ios: 'house', android: 'home', web: 'home' },
    activeIcon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    name: 'categories',
    ar: 'الفئات',
    en: 'Categories',
    icon: { ios: 'square.grid.2x2', android: 'category', web: 'category' },
    activeIcon: { ios: 'square.grid.2x2.fill', android: 'category', web: 'category' },
  },
  {
    name: 'stores',
    ar: 'المتاجر',
    en: 'Stores',
    icon: { ios: 'storefront', android: 'store', web: 'store' },
    activeIcon: { ios: 'storefront.fill', android: 'store', web: 'store' },
  },
  {
    name: 'cart',
    ar: 'السلة',
    en: 'Cart',
    icon: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' },
    activeIcon: { ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' },
  },
  {
    name: 'account',
    ar: 'حسابي',
    en: 'Account',
    icon: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
    activeIcon: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  },
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
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingHorizontal: 5,
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
            <View
              style={{
                width: 46,
                height: 30,
                borderRadius: 12,
                backgroundColor: focused ? colors.primarySoft : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 1,
              }}
            >
              <SymbolView
                name={focused ? tab.activeIcon : tab.icon}
                tintColor={color}
                size={focused ? 23 : 21}
              />
            </View>
          ),
        }} />
      ))}
      <Tabs.Screen name="orders" options={{ href: null }} />
    </Tabs>
  );
}
