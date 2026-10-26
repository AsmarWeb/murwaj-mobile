import React from 'react';
import { router } from 'expo-router';
import { Page } from '../../components/page';
import { Button, Txt, useText } from '../../components/ui';
export default function ReturnHint() {
  const t = useText();
  return (
    <Page privatePage>
      <Txt>
        {t(
          'العودة من المتصفح لا تؤكد الدفع. نتحقق من الطلب لدى الخادم.',
          'Returning from the browser does not confirm payment. We check the server for order status.',
        )}
      </Txt>
      <Button label={t('طلباتي', 'My orders')} onPress={() => router.replace('/orders')} />
      <Button
        secondary
        label={t('استعادة الدفع المحفوظ', 'Recover saved checkout')}
        onPress={() => router.replace('/checkout')}
      />
    </Page>
  );
}
