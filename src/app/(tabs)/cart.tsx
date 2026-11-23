import React from 'react';
import { router } from 'expo-router';
import { Page } from '../../components/page';
import { CartScreen } from '../../screens/shopping';
import { nav } from '../../navigation';
export default function Cart() {
  return (
    <Page privatePage>
      <CartScreen
        discover={() => router.navigate('/search')}
        product={nav.product}
        checkout={(shopId) =>
          router.push({ pathname: '/checkout', params: shopId ? { shopId: String(shopId) } : {} })
        }
      />
    </Page>
  );
}
