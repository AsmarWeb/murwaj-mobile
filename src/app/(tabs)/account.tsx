import React from 'react';
import { View } from 'react-native';
import { Page } from '../../components/page';
import { AccountScreen } from '../../screens/account';
import { GuestAccountScreen } from '../../screens/guest-account';
import { useApp } from '../../session-context';

export default function Account() {
  const { generation, session } = useApp();

  return (
    <Page>
      <View style={{ gap: 20 }}>
        {session ? (
          <AccountScreen key={generation} />
        ) : (
          <GuestAccountScreen />
        )}
      </View>
    </Page>
  );
}
