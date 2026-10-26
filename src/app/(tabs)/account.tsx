import React from 'react';
import { Page } from '../../components/page';
import { AccountScreen } from '../../screens/account';
import { useApp } from '../../session-context';
export default function Account() {
  const { generation } = useApp();
  return (
    <Page>
      <AccountScreen key={generation} />
    </Page>
  );
}
