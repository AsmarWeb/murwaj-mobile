import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';

import { resolveMediaUrl } from '../../core/api';
import type { MobileHomeCategory, MobileHomeReply } from '../../core/types';
import { useApp } from '../../session-context';
import { usePublicQuery } from '../../use-public-query';
import {
  Button,
  Busy,
  colors,
  ErrorText,
  Field,
  styles,
  Txt,
  useText,
} from '../../components/ui';

export default function CategoriesScreen() {
  const { locale } = useApp();
  const t = useText();
  const [search, setSearch] = useState('');
  const { data, error, busy, retry } =
    usePublicQuery<MobileHomeReply>('/mobile/home');

  const categories = useMemo(() => {
    const sections = data?.data?.sections ?? [];
    const unique = new Map<number, MobileHomeCategory>();

    for (const section of sections) {
      if (section.type !== 'categories') continue;
      for (const item of section.items ?? []) {
        const category = item as MobileHomeCategory;

        if (
          Number.isSafeInteger(category.id) &&
          typeof category.slug === 'string' &&
          typeof category.name === 'string'
        ) {
          unique.set(category.id, category);
        }
      }
    }

    const query = search.trim().toLocaleLowerCase(locale === 'ar' ? 'ar' : 'en');
    return [...unique.values()].filter((category) => {
      if (!query) return true;
      return [category.name, category.name_ar, category.slug]
        .some((value) => value?.toLocaleLowerCase(locale === 'ar' ? 'ar' : 'en').includes(query));
    });
  }, [data, search, locale]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>

      <FlatList
        data={categories}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        columnWrapperStyle={{ gap: 12, alignItems: 'stretch' }}
        contentContainerStyle={[styles.page, { paddingTop: 16, paddingBottom: 30 }]}
        ItemSeparatorComponent={() => <View style={{ height: 13 }} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 16 }}>
            <View style={{ borderRadius: 23, padding: 19, backgroundColor: colors.ink, gap: 9 }}>
              <Text style={{ color: '#FF9B76', fontSize: 12, fontWeight: '900' }}>murwaj.com</Text>
              <Text
                style={{
                  color: '#FFFFFF', fontSize: 23, lineHeight: 32, fontWeight: '900',
                  textAlign: locale === 'ar' ? 'right' : 'left',
                  writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
                }}
              >
                {t('اكتشف حسب الفئة', 'Explore by category')}
              </Text>
              <Text
                style={{
                  color: '#E8DED8', fontSize: 13, lineHeight: 21,
                  textAlign: locale === 'ar' ? 'right' : 'left',
                  writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
                }}
              >
                {t(
                  'اختر الفئة المناسبة واكتشف المنتجات المنشورة في متاجر مُروَّج.',
                  'Choose a category and discover products published by Murwaj stores.',
                )}
              </Text>
            </View>
            <Field
              label={t('البحث عن فئة', 'Search categories')}
              placeholder={t('مثلاً: إلكترونيات، أزياء...', 'e.g. Electronics, fashion...')}
              value={search}
              onChangeText={setSearch}
              maxLength={100}
              autoCorrect={false}
            />
            <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt muted>{t(`${categories.length} فئة`, `${categories.length} categories`)}</Txt>
              {busy && <Busy />}
            </View>
            <ErrorText error={error} />
          </View>
        }
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            onPress={() => router.push({ pathname: '/search', params: { category_id: String(item.id) } })}
          />
        )}
        ListEmptyComponent={
          !busy && !error ? (
            <View style={[styles.card, { flex: 1, padding: 20, gap: 8 }]}>
              <Txt title>{t('لا توجد فئات واردة من المنصة حاليًا', 'No categories have been provided yet')}</Txt>
              <Txt muted>
                {t(
                  'ستظهر هنا الفئات الرئيسية التي ترسلها المنصة، بما فيها الفئات التي لم تُضف إليها منتجات بعد.',
                  'Main categories supplied by the platform will appear here, including categories without products.',
                )}
              </Txt>
            </View>
          ) : undefined
        }
        ListFooterComponent={
          !!error ? (
            <View style={{ marginTop: 12 }}>
              <Button label={t('إعادة المحاولة', 'Try again')} secondary onPress={retry} />
            </View>
          ) : undefined
        }
      />
    </View>
  );
}


function CategoryCard({
  category,
  onPress,
}: {
  category: MobileHomeCategory;
  onPress: () => void;
}) {
  const { api, locale } = useApp();
  const t = useText();
  const [failedImage, setFailedImage] = useState<string | null>(null);

  const imageUri = resolveMediaUrl(category.image, api.origin);
  const name =
    locale === 'ar' ? category.name_ar || category.name : category.name;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(`عرض فئة ${name}`, `View ${name} category`)}
      accessibilityHint={t(
        'افتح الفئة لاستكشاف منتجاتها',
        'Open this category to explore its products',
      )}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          flex: 1,
          minWidth: 0,
          padding: 10,
          borderRadius: 22,
          gap: 11,
          opacity: pressed ? 0.93 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View
        style={{
          height: 145,
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: '#F7F1EC',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUri && failedImage !== imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setFailedImage(imageUri)}
          />
        ) : (
          <View
            style={{
              flex: 1,
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              backgroundColor: colors.primarySoft,
            }}
          >
            <View
              style={{
                width: 57,
                height: 57,
                borderRadius: 19,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 29,
                  fontWeight: '900',
                }}
              >
                م
              </Text>
            </View>
            <Text
              style={{
                color: colors.muted,
                fontSize: 9,
                fontWeight: '900',
                letterSpacing: 1,
              }}
            >
              murwaj.com
            </Text>
          </View>
        )}

        <View
          style={{
            position: 'absolute',
            bottom: 9,
            [locale === 'ar' ? 'left' : 'right']: 9,
            width: 31,
            height: 31,
            borderRadius: 11,
            backgroundColor: 'rgba(255,255,255,0.96)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900' }}>
            {locale === 'ar' ? '←' : '→'}
          </Text>
        </View>
      </View>

      <View
        style={{
          minHeight: 62,
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Text
          numberOfLines={2}
          style={{
            color: colors.ink,
            fontSize: 14,
            lineHeight: 21,
            fontWeight: '900',
            textAlign: locale === 'ar' ? 'right' : 'left',
            writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
          }}
        >
          {name}
        </Text>

        <View
          style={{
            flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: 11,
              fontWeight: '900',
            }}
          >
            {t('تسوّق حسب الفئة', 'Shop this category')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
