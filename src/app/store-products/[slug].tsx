import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StoreProductsScreen } from '../../screens/catalog';
import { nav } from '../../navigation';

export default function StoreProducts() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <StoreProductsScreen key={slug} slug={slug} nav={nav} />;
}
