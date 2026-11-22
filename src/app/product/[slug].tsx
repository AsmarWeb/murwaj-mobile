import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ProductScreen } from '../../screens/catalog';
import { nav } from '../../navigation';

export default function Product() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <ProductScreen key={slug} slug={slug} nav={nav} />;
}
