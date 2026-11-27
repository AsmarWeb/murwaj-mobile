import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';

import { resolveMediaUrl, httpsUrl } from '../core/api';
import { useApp } from '../session-context';
import { FavoriteButton } from '../components/favorite-button';
import { usePublicQuery } from '../use-public-query';
import {
  Button,
  Busy,
  ErrorText,
  styles,
  Txt,
  useText,
  colors,
} from '../components/ui';
import type {
  MobileHomeCatalogSection,
  MobileHomeCategory,
  MobileHomeReply,
  MobileHomeSection,
  Page,
  Product,
  Shop,
} from '../core/types';

const productRoute = (slug: string) =>
  router.push({ pathname: '/product/[slug]', params: { slug } });

export function HomeScreen() {
  const { locale } = useApp();
  const t = useText();
  const { data, error, busy, retry } =
    usePublicQuery<MobileHomeReply>('/mobile/home');
  const {
    data: latestProducts,
    error: productsError,
    busy: productsBusy,
    retry: retryProducts,
  } = usePublicQuery<Page<Product>>('/listings?per_page=8&page=1&sort=newest');

  const sections = data?.data?.sections ?? [];
  const hasPublishedProductRail = sections.some((section) =>
    ['products_latest', 'products_featured', 'products_selected'].includes(section.type) &&
    (section.items?.length ?? 0) > 0,
  );
  const hasVisibleHomeContent = sections.some((section) =>
    section.type === 'banner' || section.type === 'editorial' || (section.items?.length ?? 0) > 0,
  );
  const hasPublishedBanner = sections.some((section) => section.type === 'banner');
  const products = latestProducts?.data ?? [];
  const now = new Date();
  const isWhiteFridaySeason =
    now.getFullYear() === 2026 &&
    now.getMonth() === 10 &&
    now.getDate() >= 22 &&
    now.getDate() <= 30;

  return (
    <ScrollView
      contentContainerStyle={[styles.page, { paddingTop: 14, paddingBottom: 34, gap: 21 }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('البحث عن المنتجات والمتاجر', 'Search products and stores')}
        onPress={() => router.push('/search')}
        style={{
          minHeight: 55,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.white,
          paddingHorizontal: 15,
          flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: 11,
        }}
      >
        <SearchGlyph color={colors.muted} />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            color: colors.muted,
            fontSize: 13,
            textAlign: locale === 'ar' ? 'right' : 'left',
            writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
          }}
        >
          {t('ابحث عن المنتجات والمتاجر...', 'Search products and stores...')}
        </Text>
      </Pressable>

      <HomeDiscoveryShortcuts />

      {isWhiteFridaySeason && !hasPublishedBanner && <WhiteFridayCampaign />}

      {busy && <Busy />}
      {!!error && (
        <View style={styles.card}>
          <ErrorText error={error} />
          <Button
            label={t('إعادة تحميل الصفحة الرئيسية', 'Reload homepage')}
            secondary
            onPress={retry}
          />
        </View>
      )}

      {!busy && !error && !hasVisibleHomeContent && !isWhiteFridaySeason && (
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}> 
          <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 25, fontWeight: '900' }}>م</Text>
          </View>
          <Txt title>{t('مرحباً بك في مُروَّج.كم', 'Welcome to murwaj.com')}</Txt>
          <Txt muted>
            {t(
              'نجهّز لك تجربة تسوّق تجمع المنتجات والمتاجر في مكان واحد.',
              'Your shopping destination for products and independent stores.',
            )}
          </Txt>
        </View>
      )}

      {sections.map((section) => (
        <HomeSection
          key={section.id ?? `${section.type}-${section.position}`}
          section={section}
        />
      ))}

      {!hasPublishedProductRail && (
        <View style={{ gap: 12 }}>
          <View
            style={{
              flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <Txt title>{t('وصل حديثاً', 'New arrivals')}</Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('عرض كل المنتجات', 'See all products')}
              onPress={() => router.push('/search')}
              hitSlop={8}
            >
              <Txt muted>{t('عرض الكل', 'See all')} ›</Txt>
            </Pressable>
          </View>

          {productsBusy && <Busy />}
          {!!productsError && (
            <View style={styles.card}>
              <ErrorText error={productsError} />
              <Button
                label={t('إعادة المحاولة', 'Try again')}
                secondary
                onPress={retryProducts}
              />
            </View>
          )}

          {products.length === 1 ? (
            <HomeProductCard product={products[0]} wide onPress={() => productRoute(products[0].slug)} />
          ) : products.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
            >
              {products.map((product) => (
                <View key={product.id} style={{ width: 178 }}>
                  <HomeProductCard product={product} onPress={() => productRoute(product.slug)} />
                </View>
              ))}
            </ScrollView>
          ) : !productsBusy && !productsError ? (
            <View style={[styles.card, { paddingVertical: 20 }]}>
              <Txt muted>
                {t('ستظهر المنتجات الجديدة هنا عند توفرها.', 'New arrivals will appear here when available.')}
              </Txt>
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

function SearchGlyph({ color }: { color: string }) {
  return (
    <View style={{ width: 21, height: 21, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 13,
          height: 13,
          borderRadius: 7,
          borderWidth: 2,
          borderColor: color,
          marginRight: 4,
          marginBottom: 4,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 8,
          height: 2,
          borderRadius: 2,
          backgroundColor: color,
          right: 0,
          bottom: 2,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}


function HomeDiscoveryShortcuts() {
  const { locale } = useApp();
  const t = useText();

  const actions = [
    {
      key: 'categories',
      route: '/categories' as const,
      ar: 'تصفح الفئات',
      en: 'Browse categories',
      subtitleAr: 'اكتشف حسب اهتماماتك',
      subtitleEn: 'Explore by interest',
      icon: {
        ios: 'square.grid.2x2.fill',
        android: 'category',
        web: 'category',
      },
    },
    {
      key: 'stores',
      route: '/stores' as const,
      ar: 'اكتشف المتاجر',
      en: 'Discover stores',
      subtitleAr: 'تعرّف على المتاجر',
      subtitleEn: 'Meet independent stores',
      icon: {
        ios: 'storefront.fill',
        android: 'store',
        web: 'store',
      },
    },
  ] as const;

  return (
    <View
      style={{
        flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
        gap: 10,
      }}
    >
      {actions.map((action) => (
        <Pressable
          key={action.key}
          accessibilityRole="button"
          accessibilityLabel={t(action.ar, action.en)}
          onPress={() => router.push(action.route)}
          style={({ pressed }) => ({
            flex: 1,
            minWidth: 0,
            minHeight: 88,
            padding: 12,
            borderRadius: 19,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.white,
            flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 9,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SymbolView
              name={action.icon}
              tintColor={colors.primary}
              size={20}
            />
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 0,
              gap: 4,
              alignItems: locale === 'ar' ? 'flex-end' : 'flex-start',
            }}
          >
            <Text
              numberOfLines={2}
              style={{
                color: colors.ink,
                fontSize: 12,
                lineHeight: 17,
                fontWeight: '900',
                textAlign: locale === 'ar' ? 'right' : 'left',
                writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
              }}
            >
              {t(action.ar, action.en)}
            </Text>

            <Text
              numberOfLines={1}
              style={{
                color: colors.muted,
                fontSize: 9,
                textAlign: locale === 'ar' ? 'right' : 'left',
                writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
              }}
            >
              {t(action.subtitleAr, action.subtitleEn)}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function WhiteFridayCampaign() {
  const { locale } = useApp();
  const t = useText();
  const isArabic = locale === 'ar';

  return (
    <View
      accessibilityLabel={t('حملة الجمعة البيضاء', 'White Friday campaign')}
      style={{
        minHeight: 238,
        padding: 22,
        borderRadius: 27,
        overflow: 'hidden',
        justifyContent: 'space-between',
        backgroundColor: '#191512',
        borderWidth: 1,
        borderColor: '#332821',
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 210,
          height: 210,
          borderRadius: 105,
          right: isArabic ? undefined : -70,
          left: isArabic ? -70 : undefined,
          top: -92,
          backgroundColor: 'rgba(255,85,23,0.24)',
        }}
      />
      <View style={{ gap: 14 }}>
        <View
          style={{
            alignSelf: isArabic ? 'flex-end' : 'flex-start',
            borderRadius: 30,
            backgroundColor: colors.primary,
            paddingHorizontal: 13,
            paddingVertical: 7,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>
            WHITE FRIDAY · 2026
          </Text>
        </View>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 29,
            lineHeight: 39,
            fontWeight: '900',
            textAlign: isArabic ? 'right' : 'left',
            writingDirection: isArabic ? 'rtl' : 'ltr',
          }}
        >
          {isArabic ? 'الجمعة البيضاء\nبذوق مُروَّج' : 'WHITE FRIDAY\nTHE MURWAJ EDIT'}
        </Text>
        <Text
          style={{
            color: '#E2D9D2',
            fontSize: 14,
            lineHeight: 23,
            textAlign: isArabic ? 'right' : 'left',
            writingDirection: isArabic ? 'rtl' : 'ltr',
          }}
        >
          {isArabic
            ? 'اكتشف المنتجات والمتاجر واختيارات الموسم في تجربة تسوّق واحدة.'
            : 'Discover products, independent stores and seasonal finds in one place.'}
        </Text>
      </View>
      <View
        style={{
          marginTop: 20,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.16)',
          flexDirection: isArabic ? 'row-reverse' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>
          {isArabic ? 'اكتشف عروض الموسم' : 'Explore the season'}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/search')}
          style={{
            minHeight: 39,
            paddingHorizontal: 17,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
            {isArabic ? 'تسوّق الآن' : 'Shop now'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}


function HomeProductCard({
  product,
  onPress,
  wide = false,
}: {
  product: Product;
  onPress: () => void;
  wide?: boolean;
}) {
  const { api, locale } = useApp();
  const t = useText();
  const [failedImageUri, setFailedImageUri] = useState<string | null>(null);

  const imageUri = resolveMediaUrl(product.image_url, api.origin);
  const productTitle =
    locale === 'ar' ? product.title_ar || product.title : product.title;
  const shopName = product.shop
    ? locale === 'ar'
      ? product.shop.name_ar || product.shop.name
      : product.shop.name
    : null;
  const verified = Boolean(product.shop?.verified);
  const hasRating =
    typeof product.rating === 'number' &&
    Number.isFinite(product.rating);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(`عرض ${productTitle}`, `View ${productTitle}`)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width: '100%',
          padding: wide ? 13 : 10,
          gap: 11,
          borderRadius: 22,
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View
        style={{
          height: wide ? 225 : 148,
          borderRadius: 17,
          overflow: 'hidden',
          backgroundColor: '#F7F1EC',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUri && failedImageUri !== imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            onError={() => setFailedImageUri(imageUri)}
          />
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <View
              style={{
                width: wide ? 62 : 52,
                height: wide ? 62 : 52,
                borderRadius: wide ? 21 : 18,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: wide ? 30 : 25,
                  fontWeight: '900',
                }}
              >
                م
              </Text>
            </View>
            <Text
              style={{
                color: '#8D8179',
                fontSize: 10,
                fontWeight: '800',
                letterSpacing: 1,
              }}
            >
              murwaj.com
            </Text>
          </View>
        )}

        <FavoriteButton
          product={product}
          style={{
            position: 'absolute',
            top: 9,
            [locale === 'ar' ? 'right' : 'left']: 9,
          }}
        />

        {hasRating && (
          <View
            style={{
              position: 'absolute',
              top: 9,
              [locale === 'ar' ? 'left' : 'right']: 9,
              paddingHorizontal: 9,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.95)',
            }}
          >
            <Text style={{ color: '#9B641F', fontSize: 11, fontWeight: '900' }}>
              ★ {product.rating!.toFixed(1)}
            </Text>
          </View>
        )}

        {verified && (
          <View
            style={{
              position: 'absolute',
              bottom: 9,
              [locale === 'ar' ? 'right' : 'left']: 9,
              paddingHorizontal: 9,
              paddingVertical: 6,
              borderRadius: 11,
              backgroundColor: 'rgba(255,255,255,0.96)',
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900' }}>
              {t('✓ متجر موثّق', '✓ Verified store')}
            </Text>
          </View>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Text
          numberOfLines={2}
          style={{
            minHeight: wide ? 48 : 42,
            color: colors.ink,
            fontSize: wide ? 17 : 14,
            lineHeight: wide ? 25 : 21,
            fontWeight: '900',
            textAlign: locale === 'ar' ? 'right' : 'left',
            writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
          }}
        >
          {productTitle}
        </Text>

        {shopName && (
          <View
            style={{
              minHeight: 24,
              flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                color: colors.muted,
                fontSize: 11,
                textAlign: locale === 'ar' ? 'right' : 'left',
              }}
            >
              {shopName}
            </Text>
            {verified && (
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '900' }}>
                ✓
              </Text>
            )}
          </View>
        )}

        <View
          style={{
            height: 1,
            backgroundColor: colors.line,
          }}
        />

        <View
          style={{
            minHeight: 39,
            flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: colors.ink,
              fontSize: wide ? 17 : 14,
              fontWeight: '900',
              textAlign: locale === 'ar' ? 'right' : 'left',
            }}
          >
            {product.price} {product.currency}
          </Text>

          <View
            style={{
              paddingHorizontal: 11,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: colors.primarySoft,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '900' }}>
              {t('التفاصيل', 'Details')} ›
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function HomeSection({ section }: { section: MobileHomeSection }) {
  const { api, locale } = useApp();
  const t = useText();
  const title = locale === 'ar'
    ? section.title_ar || section.title
    : section.title || section.title_ar;
  const items = section.items ?? [];

  if (section.type === 'banner') {
    const imageUrl = resolveMediaUrl(section.image, api.origin);
    const content = locale === 'ar'
      ? section.content_ar || section.content
      : section.content || section.content_ar;
    const buttonText = locale === 'ar'
      ? section.button_text_ar || section.button_text
      : section.button_text || section.button_text_ar;
    const buttonUrl = httpsUrl(section.button_url);

    return (
      <View style={{ minHeight: 230, borderRadius: 25, overflow: 'hidden', backgroundColor: '#F7C7B4' }}>
        {imageUrl ? (
          <ImageBackground source={{ uri: imageUrl }} resizeMode="cover" style={{ flex: 1, minHeight: 230, justifyContent: 'flex-end' }}>
            <View style={{ padding: 20, gap: 9, backgroundColor: 'rgba(31,22,18,0.42)' }}>
              {!!title && <Text style={{ color: '#FFFFFF', fontSize: 27, lineHeight: 34, fontWeight: '900', textAlign: locale === 'ar' ? 'right' : 'left', writingDirection: locale === 'ar' ? 'rtl' : 'ltr' }}>{title}</Text>}
              {!!content && <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 22, textAlign: locale === 'ar' ? 'right' : 'left', writingDirection: locale === 'ar' ? 'rtl' : 'ltr' }}>{content}</Text>}
              {!!buttonText && !!buttonUrl && <View style={{ alignSelf: locale === 'ar' ? 'flex-end' : 'flex-start', minWidth: 145 }}><Button label={buttonText} onPress={() => void WebBrowser.openBrowserAsync(buttonUrl)} /></View>}
            </View>
          </ImageBackground>
        ) : (
          <View style={{ flex: 1, minHeight: 230, padding: 20, justifyContent: 'flex-end', gap: 10 }}>
            {!!title && <Txt title>{title}</Txt>}
            {!!content && <Txt>{content}</Txt>}
            {!!buttonText && !!buttonUrl && <Button label={buttonText} onPress={() => void WebBrowser.openBrowserAsync(buttonUrl)} />}
          </View>
        )}
      </View>
    );
  }

  if (section.type === 'editorial') {
    const content = locale === 'ar'
      ? section.content_ar || section.content
      : section.content || section.content_ar;
    const buttonText = locale === 'ar'
      ? section.button_text_ar || section.button_text
      : section.button_text || section.button_text_ar;
    return (
      <View style={[styles.card, { borderRadius: 23 }] }>
        {!!title && <Txt title>{title}</Txt>}
        {!!content && <Txt>{content}</Txt>}
        {!!buttonText && !!section.button_url && /^https:\/\//i.test(section.button_url) && (
          <Button label={buttonText} onPress={() => void WebBrowser.openBrowserAsync(section.button_url!)} />
        )}
      </View>
    );
  }

  if (items.length === 0) return null;

  const productSection =
    section.type === 'products_latest' ||
    section.type === 'products_featured' ||
    section.type === 'products_selected';

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {!!title && <Txt title>{title}</Txt>}
        {(section.type === 'categories' ||
          productSection ||
          section.type === 'shops_latest' ||
          section.type === 'shops_selected') && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('عرض الكل', 'See all')}
            onPress={() =>
              router.push(
                section.type === 'categories'
                  ? '/categories'
                  : section.type === 'shops_latest' || section.type === 'shops_selected'
                    ? '/stores'
                    : '/search',
              )
            }
            hitSlop={8}
          >
            <Txt muted>{t('عرض الكل', 'See all')} ›</Txt>
          </Pressable>
        )}
      </View>

      {productSection && items.length === 1 ? (
        <HomeProductCard
          product={items[0] as Product}
          wide
          onPress={() => productRoute((items[0] as Product).slug)}
        />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 3 }}>
          {items.map((item, index) => {
            const key = `${section.type}-${item.id}-${index}`;

            if (productSection) {
              const product = item as Product;
              return (
                <View key={key} style={{ width: 178 }}>
                  <HomeProductCard product={product} onPress={() => productRoute(product.slug)} />
                </View>
              );
            }


            if (section.type === 'shops_latest' || section.type === 'shops_selected') {
              const shop = item as Shop;
              const bannerUri = resolveMediaUrl(shop.banner_url, api.origin);
              const logoUri = resolveMediaUrl(shop.logo_url, api.origin);
              const shopName = locale === 'ar'
                ? shop.name_ar || shop.name
                : shop.name;
              const hasRating =
                typeof shop.rating === 'number' && Number.isFinite(shop.rating);
              const hasLocation = Boolean(shop.location?.trim());

              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={t(`زيارة متجر ${shopName}`, `Visit ${shopName}`)}
                  onPress={() =>
                    router.push({
                      pathname: '/store/[slug]',
                      params: { slug: shop.slug },
                    })
                  }
                  style={({ pressed }) => [
                    styles.card,
                    {
                      width: 246,
                      padding: 0,
                      borderRadius: 23,
                      overflow: 'hidden',
                      gap: 0,
                      opacity: pressed ? 0.94 : 1,
                      transform: [{ scale: pressed ? 0.99 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={{
                      height: 132,
                      backgroundColor: colors.primarySoft,
                      overflow: 'hidden',
                    }}
                  >
                    {bannerUri ? (
                      <Image
                        source={{ uri: bannerUri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
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
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 43,
                            fontWeight: '900',
                          }}
                        >
                          م
                        </Text>
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

                    {shop.verified && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 10,
                          [locale === 'ar' ? 'right' : 'left']: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 7,
                          borderRadius: 12,
                          backgroundColor: 'rgba(255,255,255,0.96)',
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 10,
                            fontWeight: '900',
                          }}
                        >
                          ✓ {t('موثّق', 'Verified')}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={{ paddingHorizontal: 13, paddingBottom: 13 }}>
                    <View
                      style={{
                        flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: 10,
                        marginTop: -29,
                      }}
                    >
                      <View
                        style={{
                          width: 67,
                          height: 67,
                          borderRadius: 19,
                          borderWidth: 3,
                          borderColor: colors.white,
                          backgroundColor: colors.white,
                          overflow: 'hidden',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {logoUri ? (
                          <Image
                            source={{ uri: logoUri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                          />
                        ) : (
                          <Text
                            style={{
                              color: colors.primary,
                              fontSize: 29,
                              fontWeight: '900',
                            }}
                          >
                            م
                          </Text>
                        )}
                      </View>

                      <View
                        style={{
                          flex: 1,
                          paddingBottom: 5,
                          alignItems: locale === 'ar' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {hasRating && (
                          <Text
                            style={{
                              color: '#9B641F',
                              fontSize: 11,
                              fontWeight: '900',
                            }}
                          >
                            ★ {shop.rating!.toFixed(1)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={{ gap: 8, marginTop: 12 }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: colors.ink,
                          fontSize: 16,
                          fontWeight: '900',
                          textAlign: locale === 'ar' ? 'right' : 'left',
                          writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
                        }}
                      >
                        {shopName}
                      </Text>

                      {!!shop.description && (
                        <Text
                          numberOfLines={2}
                          style={{
                            minHeight: 34,
                            color: colors.muted,
                            fontSize: 11,
                            lineHeight: 17,
                            textAlign: locale === 'ar' ? 'right' : 'left',
                            writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
                          }}
                        >
                          {shop.description}
                        </Text>
                      )}

                      {hasLocation && (
                        <View
                          style={{
                            flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Text style={{ color: colors.primary, fontSize: 12 }}>
                            ⌖
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              flex: 1,
                              color: colors.muted,
                              fontSize: 10,
                              textAlign: locale === 'ar' ? 'right' : 'left',
                            }}
                          >
                            {shop.location}
                          </Text>
                        </View>
                      )}

                      <View
                        style={{
                          height: 1,
                          backgroundColor: colors.line,
                          marginTop: 2,
                        }}
                      />

                      <View
                        style={{
                          minHeight: 39,
                          borderRadius: 12,
                          backgroundColor: colors.primarySoft,
                          flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 7,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 12,
                            fontWeight: '900',
                          }}
                        >
                          {t('استكشف المتجر', 'Explore store')} ›
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            }

            if (section.type === 'categories') {
              const category = item as MobileHomeCategory;
              const uri = resolveMediaUrl(category.image, api.origin);
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={locale === 'ar' ? category.name_ar || category.name : category.name}
                  onPress={() => router.push({ pathname: '/search', params: { category_id: String(category.id) } })}
                  style={({ pressed }) => ({
                    width: 128,
                    padding: 7,
                    borderRadius: 20,
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: colors.line,
                    gap: 9,
                    opacity: pressed ? 0.92 : 1,
                  })}
                >
                  <View style={{ width: '100%', height: 104, borderRadius: 15, overflow: 'hidden', backgroundColor: '#F7F1EC', alignItems: 'center', justifyContent: 'center' }}>
                    {uri ? (
                      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '900' }}>م</Text>
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={2} style={{ minHeight: 34, color: colors.ink, textAlign: 'center', fontSize: 12, lineHeight: 17, fontWeight: '800' }}>
                    {locale === 'ar' ? category.name_ar || category.name : category.name}
                  </Text>
                </Pressable>
              );
            }

            const catalogSection = item as MobileHomeCatalogSection;
            const uri = resolveMediaUrl(catalogSection.image, api.origin);
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/search', params: { section_id: String(catalogSection.id) } })}
                style={({ pressed }) => ({
                  width: 128,
                  padding: 7,
                  borderRadius: 20,
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.line,
                  gap: 9,
                  opacity: pressed ? 0.92 : 1,
                })}
              >
                <View style={{ width: '100%', height: 104, borderRadius: 15, overflow: 'hidden', backgroundColor: '#F7F1EC', alignItems: 'center', justifyContent: 'center' }}>
                  {uri ? (
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '900' }}>م</Text>
                    </View>
                  )}
                </View>
                <Text numberOfLines={2} style={{ minHeight: 34, color: colors.ink, textAlign: 'center', fontSize: 12, lineHeight: 17, fontWeight: '800' }}>
                  {locale === 'ar' ? catalogSection.name_ar || catalogSection.name : catalogSection.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
