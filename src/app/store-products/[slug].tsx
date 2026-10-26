import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Catalog } from '../../screens/catalog';
import { nav } from '../../navigation';
export default function StoreProducts() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <Catalog key={slug} shopSlug={slug} nav={nav} />;
}
