import React from 'react';
import { router } from 'expo-router';
import { Page } from '../components/page';
import { Button, Txt, useText } from '../components/ui';
export default function NotFound() {
  const t = useText();
  return (
    <Page>
      <Txt>{t('الصفحة غير موجودة.', 'Page not found.')}</Txt>
      <Button label={t('اكتشف', 'Discover')} onPress={() => router.replace('/')} />
    </Page>
  );
}
