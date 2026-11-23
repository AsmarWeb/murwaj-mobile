import React from 'react';
import { router } from 'expo-router';
import { Page } from '../../components/page';
import { OrdersScreen } from '../../screens/shopping';
export default function Orders() {
  return (
    <Page privatePage>
      <OrdersScreen
        discover={() => router.push('/search')}
        open={(id) => router.push({ pathname: '/order/[id]', params: { id: String(id) } })}
      />
    </Page>
  );
}
