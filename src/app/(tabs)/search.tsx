import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Catalog } from '../../screens/catalog';
import { nav } from '../../navigation';

export default function Search() {
  const params = useLocalSearchParams<{ category_id?: string; section_id?: string }>();
  const categoryId = params.category_id && /^\d+$/.test(params.category_id) ? params.category_id : undefined;
  const sectionId = params.section_id && /^\d+$/.test(params.section_id) ? params.section_id : undefined;
  return <Catalog nav={nav} searchOnly categoryId={categoryId} sectionId={sectionId} />;
}
