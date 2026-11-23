import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Catalog } from '../screens/catalog';
import { nav } from '../navigation';
import { useApp } from '../session-context';
import { colors, useText } from '../components/ui';

type SearchMode = 'products' | 'shops';

export default function Search() {
  const params = useLocalSearchParams<{ category_id?: string; section_id?: string }>();
  const categoryId = params.category_id && /^\d+$/.test(params.category_id) ? params.category_id : undefined;
  const sectionId = params.section_id && /^\d+$/.test(params.section_id) ? params.section_id : undefined;
  const [mode, setMode] = useState<SearchMode>('products');
  const { locale } = useApp();
  const t = useText();

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 11, paddingBottom: 4 }}>
        <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 4, gap: 5 }}>
          {([
            { id: 'products' as const, label: t('المنتجات', 'Products') },
            { id: 'shops' as const, label: t('المتاجر', 'Stores') },
          ]).map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === option.id }}
              onPress={() => setMode(option.id)}
              style={{ flex: 1, minHeight: 43, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === option.id ? colors.primary : 'transparent' }}
            >
              <Text style={{ color: mode === option.id ? '#FFFFFF' : colors.ink, fontSize: 14, fontWeight: '800' }}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Catalog
          nav={nav}
          searchOnly
          shops={mode === 'shops'}
          categoryId={mode === 'products' ? categoryId : undefined}
          sectionId={mode === 'products' ? sectionId : undefined}
        />
      </View>
    </View>
  );
}
