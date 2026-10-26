import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Page } from '../../components/page';
import { OrderScreen } from '../../screens/shopping';
import { Txt } from '../../components/ui';
export default function Order() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const valid = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
  return (
    <Page privatePage>
      {valid ? (
        <OrderScreen id={Number(id)} recover={() => router.push('/checkout')} />
      ) : (
        <Txt>Invalid order / طلب غير صالح</Txt>
      )}
    </Page>
  );
}
