import React from 'react';
import { Catalog } from '../../screens/catalog';
import { nav } from '../../navigation';
export default function Stores() {
  return <Catalog nav={nav} shops />;
}
