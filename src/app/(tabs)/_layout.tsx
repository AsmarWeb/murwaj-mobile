import React from 'react';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useApp } from '../../session-context';
import { colors, useText } from '../../components/ui';

const tabs = [
  {
    name: 'index',
    ar: 'اكتشف',
    en: 'Discover',
    icon: { ios: 'house', android: 'home', web: 'home' },
    activeIcon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  {
    name: 'stores',
    ar: 'المتاجر',
    en: 'Stores',
    icon: { ios: 'storefront', android: 'storefront', web: 'storefront' },
    activeIcon: { ios: 'storefront.fill', android: 'storefront', web: 'storefront' },
  },
  {
    name: 'cart',
    ar: 'السلة',
    en: 'Basket',
    icon: { ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' },
    activeIcon: { ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' },
  },
  {
    name: 'orders',
    ar: 'طلباتي',
    en: 'Orders',
    icon: { ios: 'shippingbox', android: 'receipt_long', web: 'receipt_long' },
    activeIcon: { ios: 'shippingbox.fill', android: 'receipt_long', web: 'receipt_long' },
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
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          paddingTop: 7,
          paddingBottom: 7,
          flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
          shadowColor: colors.ink,
          shadowOpacity: 0.06,
          shadowRadius: 13,
          shadowOffset: { width: 0, height: -4 },
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 3,
        },
        tabBarIconStyle: {
          marginTop: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.ar, tab.en),
            tabBarIcon: ({ color, focused }) => (
              <SymbolView
                name={focused ? tab.activeIcon : tab.icon}
                tintColor={color}
                size={23}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
