import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Page } from '../../components/page';
import { CheckoutScreen } from '../../screens/checkout';
import { useCheckout } from '../../checkout-context';
export default function Checkout() {
  const journal = useCheckout();
  const { shopId } = useLocalSearchParams<{ shopId?: string }>();
  const id =
    shopId && /^[1-9]\d*$/.test(shopId) && Number.isSafeInteger(Number(shopId))
      ? Number(shopId)
      : undefined;
  return (
    <Page privatePage>
      {journal && (
        <CheckoutScreen
          journal={journal}
          shopId={id}
          order={(orderId) =>
            router.replace({ pathname: '/order/[id]', params: { id: String(orderId) } })
          }
        />
      )}
    </Page>
  );
}
