import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Page } from '../../components/page';
import { ShopScreen } from '../../screens/catalog';
import { nav } from '../../navigation';
export default function Store() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return (
    <Page>
      <ShopScreen key={slug} slug={slug} nav={nav} />
    </Page>
  );
}
