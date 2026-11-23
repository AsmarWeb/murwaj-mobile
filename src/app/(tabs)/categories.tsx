import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { resolveMediaUrl } from '../../core/api';
import type { MobileHomeCategory } from '../../core/types';
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

const categorySymbol = {
  ios: 'square.grid.2x2.fill',
  android: 'category',
  web: 'category',
} as const;

export default function CategoriesScreen() {
  const { locale } = useApp();
  const t = useText();

  const [search, setSearch] = useState('');

  const {
    data,
    error,
    busy,
    retry,
  } = usePublicQuery<{ data: MobileHomeCategory[] }>('/categories');

  const allCategories = useMemo(() => {
    const rows = data?.data ?? [];

    return rows.filter(
      (category) =>
        Number.isSafeInteger(category.id) &&
        category.id > 0 &&
        typeof category.slug === 'string' &&
        typeof category.name === 'string',
    );
  }, [data]);

  const categories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);

    if (!query) return allCategories;

    return allCategories.filter((category) => {
      const values = [
        category.name,
        category.name_ar,
        category.slug,
      ];

      return values.some((value) =>
        value?.toLocaleLowerCase(locale).includes(query),
      );
    });
  }, [allCategories, search, locale]);

  const isArabic = locale === 'ar';

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <FlatList
        data={categories}
        numColumns={2}
        key={isArabic ? 'categories-ar' : 'categories-en'}
        keyExtractor={(item) => String(item.id)}
        columnWrapperStyle={{
          gap: 12,
          alignItems: 'stretch',
          flexDirection: isArabic ? 'row-reverse' : 'row',
        }}
        contentContainerStyle={[
          styles.page,
          {
            paddingTop: 15,
            paddingBottom: 38,
            gap: 13,
          },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 18, marginBottom: 5 }}>
            <View
              style={{
                minHeight: 184,
                padding: 21,
                borderRadius: 27,
                overflow: 'hidden',
                backgroundColor: '#211A16',
                justifyContent: 'space-between',
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: 190,
                  height: 190,
                  borderRadius: 95,
                  top: -105,
                  [isArabic ? 'left' : 'right']: -57,
                  backgroundColor: 'rgba(255,85,23,0.25)',
                }}
              />

              <View
                style={{
                  gap: 10,
                  alignItems: isArabic ? 'flex-end' : 'flex-start',
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 30,
                    backgroundColor: 'rgba(255,85,23,0.18)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,155,118,0.22)',
                  }}
                >
                  <Text
                    style={{
                      color: '#FF9B76',
                      fontSize: 11,
                      fontWeight: '900',
                      letterSpacing: 1,
                    }}
                  >
                    murwaj.com
                  </Text>
                </View>

                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 25,
                    lineHeight: 35,
                    fontWeight: '900',
                    textAlign: isArabic ? 'right' : 'left',
                    writingDirection: isArabic ? 'rtl' : 'ltr',
                  }}
                >
                  {t('اكتشف عالمك حسب الفئة', 'Explore by category')}
                </Text>

                <Text
                  style={{
                    color: '#E6DCD5',
                    fontSize: 13,
                    lineHeight: 22,
                    textAlign: isArabic ? 'right' : 'left',
                    writingDirection: isArabic ? 'rtl' : 'ltr',
                  }}
                >
                  {t(
                    'تصفّح مجموعات متنوعة واكتشف المنتجات التي تناسب ذوقك.',
                    'Explore collections and discover products that match your style.',
                  )}
                </Text>
              </View>

              <View
                style={{
                  marginTop: 15,
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: isArabic ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <SymbolView
                    name={categorySymbol}
                    tintColor="#FF9B76"
                    size={17}
                  />
                  <Text style={{ color: '#F9E7DE', fontSize: 12, fontWeight: '800' }}>
                    {t(
                      `${allCategories.length} فئة متاحة`,
                      `${allCategories.length} available categories`,
                    )}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('استكشف المنتجات', 'Explore products')}
                  onPress={() => router.push('/search')}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    minHeight: 39,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.82 : 1,
                  })}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>
                    {t('كل المنتجات', 'All products')}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Txt title>{t('تصفّح الفئات', 'Browse categories')}</Txt>
                  <Txt muted>
                    {t(
                      'اختر فئة للانتقال إلى منتجاتها.',
                      'Choose a category to view its products.',
                    )}
                  </Txt>
                </View>

                {busy && <Busy />}
              </View>

              <Field
                label={t('ابحث عن فئة', 'Search categories')}
                placeholder={t(
                  'ما الفئة التي تبحث عنها؟',
                  'Which category are you looking for?',
                )}
                value={search}
                onChangeText={setSearch}
                maxLength={100}
                autoCorrect={false}
                returnKeyType="search"
              />

              {search.length > 0 && (
                <View
                  style={{
                    flexDirection: isArabic ? 'row-reverse' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Txt muted>
                    {t(
                      `${categories.length} نتيجة`,
                      `${categories.length} results`,
                    )}
                  </Txt>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSearch('')}
                    hitSlop={8}
                  >
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '900' }}>
                      {t('مسح البحث', 'Clear search')}
                    </Text>
                  </Pressable>
                </View>
              )}

              <ErrorText error={error} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            onPress={() =>
              router.push({
                pathname: '/search',
                params: { category_id: String(item.id) },
              })
            }
          />
        )}
        ListEmptyComponent={
          busy ? (
            <View style={{ paddingVertical: 24 }}>
              <Busy />
            </View>
          ) : error ? (
            <View style={[styles.card, { padding: 20 }]}>
              <Txt title>{t('تعذّر تحميل الفئات', 'Could not load categories')}</Txt>
              <Txt muted>
                {t(
                  'تحقق من الاتصال ثم حاول مرة أخرى.',
                  'Check your connection and try again.',
                )}
              </Txt>
              <Button
                label={t('إعادة المحاولة', 'Try again')}
                onPress={retry}
              />
            </View>
          ) : (
            <View
              style={[
                styles.card,
                {
                  padding: 21,
                  alignItems: 'center',
                  gap: 12,
                },
              ]}
            >
              <View
                style={{
                  width: 61,
                  height: 61,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primarySoft,
                }}
              >
                <SymbolView
                  name={categorySymbol}
                  tintColor={colors.primary}
                  size={27}
                />
              </View>

              <Txt title>
                {allCategories.length === 0
                  ? t('الفئات قيد التجهيز', 'Categories are being prepared')
                  : t('لم نجد فئة مطابقة', 'No matching categories')}
              </Txt>

              <Txt muted>
                {allCategories.length === 0
                  ? t(
                      'ستظهر هنا الفئات التي تنشرها المنصة. ويمكنك استكشاف المنتجات والمتاجر في الوقت الحالي.',
                      'Categories published by the platform will appear here. You can explore products and stores in the meantime.',
                    )
                  : t(
                      'جرّب كلمة بحث أخرى أو امسح البحث لعرض جميع الفئات.',
                      'Try another search term or clear your search to see all categories.',
                    )}
              </Txt>

              {search.length > 0 ? (
                <Button
                  secondary
                  label={t('مسح البحث', 'Clear search')}
                  onPress={() => setSearch('')}
                />
              ) : (
                <Button
                  label={t('استكشف المنتجات', 'Explore products')}
                  onPress={() => router.push('/search')}
                />
              )}
            </View>
          )
        }
        ListFooterComponent={
          error ? (
            <View style={{ marginTop: 13 }}>
              <Button
                secondary
                label={t('إعادة المحاولة', 'Try again')}
                onPress={retry}
              />
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

  const isArabic = locale === 'ar';
  const imageUri = resolveMediaUrl(category.image, api.origin);

  const name = isArabic
    ? category.name_ar || category.name
    : category.name;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(
        `استكشف فئة ${name}`,
        `Explore ${name} category`,
      )}
      accessibilityHint={t(
        'افتح الفئة لعرض المنتجات المتاحة.',
        'Open this category to view available products.',
      )}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          flex: 1,
          minWidth: 0,
          padding: 8,
          borderRadius: 23,
          gap: 0,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View
        style={{
          height: 168,
          borderRadius: 17,
          overflow: 'hidden',
          backgroundColor: '#F8E7DE',
        }}
      >
        {imageUri && failedImage !== imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
            onError={() => setFailedImage(imageUri)}
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFF0E9',
            }}
          >
            <View
              style={{
                width: 65,
                height: 65,
                borderRadius: 23,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
              }}
            >
              <SymbolView
                name={categorySymbol}
                tintColor="#FFFFFF"
                size={30}
              />
            </View>

            <Text
              style={{
                marginTop: 10,
                color: colors.ink,
                fontSize: 10,
                fontWeight: '900',
                letterSpacing: 1,
              }}
            >
              murwaj.com
            </Text>
          </View>
        )}

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(24,17,13,0.10)',
          }}
        />

        <View
          style={{
            position: 'absolute',
            top: 9,
            ...(isArabic ? { left: 9 } : { right: 9 }),
            width: 31,
            height: 31,
            borderRadius: 11,
            backgroundColor: 'rgba(255,255,255,0.96)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: 18,
              fontWeight: '900',
            }}
          >
            {isArabic ? '←' : '→'}
          </Text>
        </View>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: 'rgba(28,19,14,0.70)',
            gap: 4,
            alignItems: isArabic ? 'flex-end' : 'flex-start',
          }}
        >
          <Text
            numberOfLines={2}
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '900',
              textAlign: isArabic ? 'right' : 'left',
              writingDirection: isArabic ? 'rtl' : 'ltr',
            }}
          >
            {name}
          </Text>

          <Text
            style={{
              color: '#FFE2D4',
              fontSize: 10,
              fontWeight: '800',
              textAlign: isArabic ? 'right' : 'left',
            }}
          >
            {t('اكتشف المنتجات', 'Discover products')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
