import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../session-context';
import { Button, styles, Txt, useText } from './ui';
import { NeedAccount } from '../screens/shopping';
export function Page({
  children,
  privatePage = false,
}: {
  children: React.ReactNode;
  privatePage?: boolean;
}) {
  const { session, checked, recheck, generation } = useApp();
  const t = useText();
  let content = children;
  if (privatePage && !session)
    content = <NeedAccount account={() => router.navigate('/account')} />;
  else if (privatePage && !checked)
    content = (
      <>
        <Txt>{t('تحقق من الجلسة قبل المتابعة.', 'Verify your session before continuing.')}</Txt>
        <Button
          label={t('إعادة التحقق', 'Retry verification')}
          onPress={() => {
            void recheck().catch(() => {});
          }}
        />
        <Button
          label={t('الحساب', 'Account')}
          secondary
          onPress={() => router.navigate('/account')}
        />
      </>
    );
  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 16 }} key={privatePage ? generation : 'public'}>
        {content}
      </View>
    </ScrollView>
  );
}
