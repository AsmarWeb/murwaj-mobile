import { usePublicQuery } from '../use-public-query';
import { resolveMediaUrl } from '../core/api';
import React, { useRef, useState } from 'react';
import { FlatList, Image, Modal, PanResponder, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useApp } from '../session-context';
import { FavoriteButton } from '../components/favorite-button';
import {
  Button,
  Busy,
  colors,
  ErrorText,
  Field,
  Money,
  Photo,
  styles,
  Txt,
  useText,
} from '../components/ui';
import type { Page, Product, Shop } from '../core/types';
export const segment = (s: string) =>
  encodeURIComponent(s).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
type Nav = {
  product: (slug: string) => void;
  shop: (slug: string) => void;
  account: () => void;
  cart: () => void;
};
export function Catalog({
  nav,
  shops = false,
  shopSlug,
  store,
  homeContent,
  searchOnly = false,
  categoryId,
  sectionId,
}: {
  nav: Nav;
  shops?: boolean;
  shopSlug?: string;
  store?: Shop;
  homeContent?: React.ReactNode;
  searchOnly?: boolean;
  categoryId?: string;
  sectionId?: string;
}) {
  const { locale } = useApp();
  const t = useText();
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const columns = shops ? 1 : 2;
  const path = shopSlug
    ? `/shops/${segment(shopSlug)}/listings`
    : shops
      ? '/shops'
      : '/listings';

  const {
    data: result,
    error,
    busy,
    retry,
  } = usePublicQuery<Page<Product | Shop>>(
    `${path}?per_page=12&page=${page}&q=${segment(q)}&sort=${shops ? 'newest' : sort}${!shops && inStockOnly ? '&in_stock=1' : ''}${categoryId ? `&category_id=${segment(categoryId)}` : ''}${sectionId ? `&section_id=${segment(sectionId)}` : ''}${shops && verifiedOnly ? '&verified=1' : ''}`,
  );

  function search() {
    setPage(1);
    setQ(draft.trim());
  }

  function clearSearch() {
    setDraft('');
    setQ('');
    setPage(1);
  }

  return (
    <FlatList
      key={columns}
      data={result?.data ?? []}
      numColumns={columns}
      columnWrapperStyle={
        columns === 2 ? { gap: 12, alignItems: 'stretch' } : undefined
      }
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ height: 13 }} />}
      ListHeaderComponent={
        <View style={{ gap: 19, marginBottom: 13 }}>
          {shopSlug && store && (
            <StoreProductsHeader store={store} productCount={result?.meta.total ?? 0} />
          )}
          {!shopSlug && !shops && !searchOnly && (
            <View
              style={[
                styles.hero,
                {
                  backgroundColor: colors.ink,
                  borderRadius: 27,
                  padding: 23,
                },
              ]}
            >
              <View
                style={{
                  alignSelf: locale === 'ar' ? 'flex-end' : 'flex-start',
                  backgroundColor: 'rgba(255,85,23,0.18)',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 30,
                }}
              >
                <Text
                  style={{
                    color: '#FF9B76',
                    fontWeight: '800',
                    fontSize: 12,
                    letterSpacing: 0.5,
                  }}
                >
                  murwaj.com
                </Text>
              </View>

              <TextOnDark large>
                {t(
                  'اكتشف أشياء مميزة. تسوّق بسهولة.',
                  'Discover something special. Shop with ease.',
                )}
              </TextOnDark>

              <TextOnDark>
                {t(
                  'متاجر مستقلة ومنتجات مختارة في مكان واحد.',
                  'Independent stores and products, all in one place.',
                )}
              </TextOnDark>

              <View style={[styles.row, { marginTop: 5 }]}>
                <Button
                  label={t('افتح السلة', 'Open basket')}
                  secondary
                  onPress={nav.cart}
                />
                <Button
                  label={t('حسابي', 'My account')}
                  secondary
                  onPress={nav.account}
                />
              </View>
            </View>
          )}

          <View style={{ gap: 11 }}>
            <Txt title>
              {shopSlug
                ? t('منتجات المتجر', 'Store products')
                : shops
                  ? t('اكتشف المتاجر', 'Discover stores')
                  : searchOnly
                    ? t('ابحث واكتشف', 'Search and discover')
                    : t('اكتشف المنتجات', 'Discover products')}
            </Txt>

            <Field
              label={
                shops
                  ? t('ابحث عن متجر', 'Search stores')
                  : t('ابحث عن منتج', 'Search products')
              }
              placeholder={
                shops
                  ? t('اسم المتجر...', 'Store name...')
                  : shopSlug
                    ? t('ابحث في منتجات هذا المتجر...', 'Search this store’s products...')
                    : t('ما الذي تبحث عنه؟', 'What are you looking for?')
              }
              value={draft}
              onChangeText={setDraft}
              maxLength={100}
              returnKeyType="search"
              onSubmitEditing={search}
              autoCorrect={false}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('بحث', 'Search')}
                  onPress={search}
                />
              </View>
              {!!q && (
                <Button
                  label={t('مسح', 'Clear')}
                  onPress={clearSearch}
                  secondary
                />
              )}
            </View>

            {shops && (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: verifiedOnly }}
                onPress={() => {
                  setVerifiedOnly((value) => !value);
                  setPage(1);
                }}
                style={{
                  alignSelf: locale === 'ar' ? 'flex-end' : 'flex-start',
                  minHeight: 42,
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: verifiedOnly ? colors.primary : colors.line,
                  backgroundColor: verifiedOnly ? colors.primarySoft : colors.white,
                  flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 19,
                    height: 19,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: verifiedOnly ? colors.primary : colors.muted,
                    backgroundColor: verifiedOnly ? colors.primary : colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {verifiedOnly && (
                    <Text style={{ color: colors.white, fontSize: 12, fontWeight: '900' }}>
                      ✓
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    color: verifiedOnly ? colors.primary : colors.ink,
                    fontSize: 12,
                    fontWeight: '800',
                  }}
                >
                  {t('المتاجر الموثّقة فقط', 'Verified stores only')}
                </Text>
              </Pressable>
            )}
          </View>

          {!shops && (
            <View style={{ gap: 10 }}>
              <Txt muted>{t('ترتيب وتصفية المنتجات', 'Sort and filter products')}</Txt>
              <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>
                {([
                  { value: 'newest' as const, ar: 'الأحدث', en: 'Newest' },
                  { value: 'price_asc' as const, ar: 'السعر: الأقل', en: 'Price: low to high' },
                  { value: 'price_desc' as const, ar: 'السعر: الأعلى', en: 'Price: high to low' },
                ]).map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sort === option.value }}
                    onPress={() => { setSort(option.value); setPage(1); }}
                    style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 20, borderWidth: 1, borderColor: sort === option.value ? colors.primary : colors.line, backgroundColor: sort === option.value ? colors.primarySoft : colors.white, justifyContent: 'center' }}
                  >
                    <Text style={{ color: sort === option.value ? colors.primary : colors.ink, fontSize: 11, fontWeight: '800' }}>
                      {t(option.ar, option.en)}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: inStockOnly }}
                  onPress={() => { setInStockOnly((value) => !value); setPage(1); }}
                  style={{ paddingHorizontal: 12, minHeight: 36, borderRadius: 20, borderWidth: 1, borderColor: inStockOnly ? colors.primary : colors.line, backgroundColor: inStockOnly ? colors.primarySoft : colors.white, justifyContent: 'center' }}
                >
                  <Text style={{ color: inStockOnly ? colors.primary : colors.ink, fontSize: 11, fontWeight: '800' }}>
                    {inStockOnly ? '✓ ' : ''}{t('المتوفر فقط', 'In stock only')}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {!shopSlug && !shops && homeContent}

          <View
            style={{
              flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <Txt muted>
              {result
                ? t(
                    `${result.meta.total} نتيجة`,
                    `${result.meta.total} results`,
                  )
                : t('منتجات ومتاجر مختارة', 'Products and stores')}
            </Txt>

            {busy && <Busy />}
          </View>

          <ErrorText error={error} />
        </View>
      }
      renderItem={({ item }) =>
        shops ? (
          <StoreDiscoveryCard
            shop={item as Shop}
            onPress={() => nav.shop((item as Shop).slug)}
          />
        ) : (
          <ProductCard
            product={item as Product}
            onPress={() => nav.product(item.slug)}
            compact
          />
        )
      }
      ListEmptyComponent={
        !busy && !error ? (
          <View style={[styles.card, { gap: 12 }]}>
            <Txt title>
              {shops
                ? verifiedOnly
                  ? t('لا توجد متاجر موثّقة متاحة حاليًا', 'No verified stores available right now')
                  : t('لا توجد متاجر مطابقة', 'No matching stores')
                : categoryId && !q && !inStockOnly
                  ? t(
                      'لا توجد منتجات منشورة ضمن هذه الفئة حاليًا',
                      'There are no published products in this category right now.',
                    )
                  : t('لا توجد نتائج حاليًا', 'No results found')}
            </Txt>
            <Txt muted>
              {shops
                ? verifiedOnly
                  ? t(
                      'لا توجد متاجر موثّقة تطابق خياراتك حاليًا. يمكنك عرض جميع المتاجر.',
                      'No verified stores match your current filters. You can view all stores.',
                    )
                  : t(
                      'جرّب البحث باسم متجر آخر أو امسح عبارة البحث.',
                      'Try another store name or clear your search.',
                    )
                : categoryId && !q && !inStockOnly
                  ? t(
                      'يمكنك استكشاف فئات أخرى أو العودة لاحقًا للاطلاع على المنتجات الجديدة.',
                      'Explore other categories or check back later for new products.',
                    )
                  : t(
                      'جرّب كلمة بحث أخرى أو امسح البحث لعرض المنتجات المتاحة.',
                      'Try another search term or clear the search to see available items.',
                    )}
            </Txt>
            {!!q && (
              <Button
                label={t('مسح البحث', 'Clear search')}
                onPress={clearSearch}
                secondary
              />
            )}
            {shops && verifiedOnly && (
              <Button
                label={t('عرض جميع المتاجر', 'Show all stores')}
                onPress={() => setVerifiedOnly(false)}
                secondary
              />
            )}
          </View>
        ) : undefined
      }
      ListFooterComponent={
        <View style={{ gap: 13, marginTop: 17 }}>
          {!!error && (
            <Button
              label={t('إعادة المحاولة', 'Try again')}
              onPress={retry}
              secondary
            />
          )}

          {result && result.meta.last_page > 1 && (
            <>
              <Txt muted>
                {t(
                  `صفحة ${page} من ${result.meta.last_page}`,
                  `Page ${page} of ${result.meta.last_page}`,
                )}
              </Txt>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('السابق', 'Previous')}
                    disabled={busy || page <= 1}
                    onPress={() => setPage((x) => x - 1)}
                    secondary
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('التالي', 'Next')}
                    disabled={busy || page >= result.meta.last_page}
                    onPress={() => setPage((x) => x + 1)}
                    secondary
                  />
                </View>
              </View>
            </>
          )}
        </View>
      }
    />
  );
}

function TextOnDark({
  children,
  large = false,
}: {
  children: React.ReactNode;
  large?: boolean;
}) {
  const { locale } = useApp();

  return (
    <Text
      style={{
        color: '#FFFFFF',
        fontSize: large ? 29 : 14,
        fontWeight: large ? '800' : '500',
        lineHeight: large ? 40 : 23,
        textAlign: locale === 'ar' ? 'right' : 'left',
        writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {children}
    </Text>
  );
}

export function StoreProductsScreen({
  slug,
  nav,
}: {
  slug: string;
  nav: Nav;
}) {
  const { data, error, retry } = usePublicQuery<{ data: Shop }>(`/shops/${segment(slug)}`);
  const store = data?.data;

  return (
    <View style={{ flex:  1, backgroundColor: colors.paper }}>
      <Catalog key={slug} nav={nav} shopSlug={slug} store={store} />
      {!!error && (
        <View style={{ paddingHorizontal: 18, paddingBottom: 12, gap: 8 }}>
          <ErrorText error={error} />
          <Button label="Retry store details" onPress={retry} secondary />
        </View>
      )}
    </View>
  );
}

function StoreProductsHeader({
  store,
  productCount,
}: {
  store: Shop;
  productCount: number;
}) {
  const { locale, api } = useApp();
  const t = useText();
  const title = locale === 'ar' ? store.name_ar || store.name : store.name;
  const logoUri = resolveMediaUrl(store.logo_url, api.origin);

  return (
    <View style={[styles.card, { padding: 12, borderRadius: 23, gap: 11 }]}>
      <Photo uri={store.banner_url || store.logo_url} height={142} />
      <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', gap: 11 }}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={{ width: 62, height: 62, borderRadius: 17, backgroundColor: colors.white }} resizeMode="contain" />
        ) : (
          <View style={{ width: 62, height: 62, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.primary, fontSize: 26, fontWeight: '900' }}>م</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 4, alignItems: locale === 'ar' ? 'flex-end' : 'flex-start' }}>
          <Txt title>{title}</Txt>
          <Text style={{ color: store.verified ? colors.primary : colors.muted, fontSize: 11, fontWeight: '800' }}>
            {store.verified ? t('متجر موثّق', 'Verified store') : t('متجر على مُروَّج', 'Murwaj store')}
          </Text>
        </View>
      </View>
      {!!store.description && (
        <Text numberOfLines={3} style={{ color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: locale === 'ar' ? 'right' : 'left', writingDirection: locale === 'ar' ? 'rtl' : 'ltr' }}>
          {store.description}
        </Text>
      )}
      <View style={{ height: 1, backgroundColor: colors.line }} />
      <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt muted>{t('منتجات المتجر', 'Store products')}</Txt>
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '900' }}>
          {t(`${productCount} منتج`, `${productCount} products`)}
        </Text>
      </View>
    </View>
  );
}

function ProductCard({
  product: p,
  onPress,
  compact = false,
}: {
  product: Product;
  onPress: () => void;
  compact?: boolean;
}) {
  const { api, locale, session, checked } = useApp();
  const t = useText();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<unknown>();
  const [uncertain, setUncertain] = useState(false);
  const lock = useRef(false);

  async function quickAdd() {
    if (added) {
      router.push('/cart');
      return;
    }
    if (!session) {
      router.navigate('/account');
      return;
    }
    if (!checked || lock.current || uncertain || p.quantity < 1 || p.currency !== 'AED') return;

    lock.current = true;
    setAdding(true);
    setError(null);
    try {
      await api.request('/cart/items', session.token, locale, {
        method: 'POST',
        body: { listing_id: p.id, quantity: 1 },
      });
      setAdded(true);
    } catch (e) {
      setError(e);
      setUncertain(true);
    } finally {
      setAdding(false);
      lock.current = false;
    }
  }

  return (
    <View style={[styles.card, compact && { flex: 1, minWidth: 0, padding: 9, gap: 7, borderRadius: 19 }]}>
      <View style={{ position: 'relative' }}>
        <Pressable accessibilityRole="button" onPress={onPress}>
          <Photo uri={p.image_url} height={compact ? 116 : 165} />
        </Pressable>
        <FavoriteButton
          product={p}
          style={{
            position: 'absolute',
            top: 8,
            [locale === 'ar' ? 'left' : 'right']: 8,
          }}
        />
      </View>
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Txt title>{locale === 'ar' ? p.title_ar || p.title : p.title}</Txt>
      </Pressable>
      {!!p.shop?.name && <Txt muted>{p.shop.name}</Txt>}
      <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 }}>
        <View style={{ flex: 1 }}>
          <Money value={p.price} currency={p.currency} />
          {typeof p.rating === 'number' && (
            <Text style={{ color: '#B96B22', fontSize: 11, fontWeight: '800', marginTop: 2 }}>★ {p.rating.toFixed(1)}</Text>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={added ? t('فتح السلة', 'Open basket') : t('إضافة للسلة', 'Add to basket')}
          accessibilityState={{ disabled: adding || uncertain || p.quantity < 1 || p.currency !== 'AED' || (!!session && !checked) }}
          disabled={adding || uncertain || p.quantity < 1 || p.currency !== 'AED' || (!!session && !checked)}
          onPress={() => void quickAdd()}
          style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: added ? '#2E7D55' : colors.primary, opacity: adding ? 0.55 : 1 }}
        >
          <SymbolView name={added ? 'checkmark' : 'plus'} tintColor="#FFFFFF" size={18} />
        </Pressable>
      </View>
      {!!error && <ErrorText error={error} />}
      {uncertain && (
        <View style={{ gap: 6, paddingTop: 3 }}>
          <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>
            {t(
              'تحقق من السلة قبل إعادة المحاولة؛ قد تكون الإضافة تمت.',
              'Check the basket before retrying; the item may already have been added.',
            )}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('فتح السلة للتحقق', 'Open basket to check')}
            onPress={() => router.push('/cart')}
            style={{ alignSelf: locale === 'ar' ? 'flex-start' : 'flex-end', paddingVertical: 5 }}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>
              {t('افتح السلة للتحقق', 'Open basket to check')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function ProductScreen({ slug, nav }: { slug: string; nav: Nav }) {
  const { api, locale, session, checked } = useApp();
  const t = useText();
  const {
    data: payload,
    error: fetchError,
    busy,
    retry,
  } = usePublicQuery<{ data: Product }>(`/listings/${segment(slug)}`);
  const product = payload?.data;
  const [error, setError] = useState<unknown>();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [failedImageUri, setFailedImageUri] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const addLock = useRef(false);

  const gallery = product
    ? [...new Set([...(product.image_urls ?? []), product.image_url ?? ''].filter((uri) => /^https?:\/\//i.test(uri)))]
        .map((uri) => resolveMediaUrl(uri, api.origin))
        .filter((uri): uri is string => Boolean(uri))
    : [];
  const selectedImage = gallery[activeImage] ?? resolveMediaUrl(product?.image_url, api.origin);

  const galleryPanResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gallery.length > 1 &&
          Math.abs(gesture.dx) > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx <= -45) {
            setActiveImage((current) => Math.min(gallery.length - 1, current + 1));
          } else if (gesture.dx >= 45) {
            setActiveImage((current) => Math.max(0, current - 1));
          }
        },
      }),
    [gallery.length],
  );

  async function add() {
    if (!session) {
      nav.account();
      return;
    }
    if (added) {
      nav.cart();
      return;
    }
    if (addLock.current || uncertain || !checked || !product) return;
    addLock.current = true;
    setAdding(true);
    setError(null);
    try {
      await api.request('/cart/items', session.token, locale, {
        method: 'POST',
        body: { listing_id: product.id, quantity },
      });
      setAdded(true);
    } catch (e) {
      setError(e);
      setUncertain(true);
    } finally {
      setAdding(false);
      addLock.current = false;
    }
  }

  async function shareProduct() {
    if (!product) return;
    try {
      await Share.share({
        title: locale === 'ar' ? product.title_ar || product.title : product.title,
        message: `${locale === 'ar' ? product.title_ar || product.title : product.title} · ${product.price} ${product.currency}`,
      });
    } catch {
      // Sharing cancellation is not an application error.
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 22 }}>
        <View style={{ height: 415, backgroundColor: '#F5D2C2' }} {...galleryPanResponder.panHandlers}>
          {selectedImage && failedImageUri !== selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              resizeMode="contain"
              style={{ width: '100%', height: '100%' }}
              onError={() => setFailedImageUri(selectedImage)}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF3EE' }}>
              <Text style={{ color: colors.primary, fontSize: 58, fontWeight: '900' }}>م</Text>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', marginTop: 7 }}>murwaj.com</Text>
            </View>
          )}
          <View style={{ position: 'absolute', top: 14, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('رجوع', 'Go back')} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' }}>
              <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={colors.ink} size={19} />
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              {product ? <FavoriteButton product={product} /> : null}
              <Pressable accessibilityRole="button" accessibilityLabel={t('مشاركة المنتج', 'Share product')} onPress={() => void shareProduct()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' }}>
                <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} tintColor={colors.ink} size={19} />
              </Pressable>
            </View>
          </View>
          {gallery.length > 1 && (
            <View style={{ position: 'absolute', left: locale === 'ar' ? 13 : undefined, right: locale === 'ar' ? undefined : 13, top: 76, gap: 8 }}>
              {gallery.slice(0, 4).map((uri, index) => (
                <Pressable key={`${uri}-${index}`} accessibilityRole="button" accessibilityState={{ selected: activeImage === index }} accessibilityLabel={t(`الصورة ${index + 1}`, `Image ${index + 1}`)} onPress={() => setActiveImage(index)} style={{ width: 52, height: 61, borderRadius: 11, borderWidth: activeImage === index ? 2 : 1, borderColor: activeImage === index ? colors.primary : '#FFFFFF', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                  {failedImageUri === uri ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF3EE' }}>
                      <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '900' }}>م</Text>
                    </View>
                  ) : (
                    <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => setFailedImageUri(uri)} />
                  )}
                </Pressable>
              ))}
              {gallery.length > 4 && (
                <View style={{ width: 52, height: 52, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.ink, fontWeight: '800' }}>+{gallery.length - 4}</Text>
                </View>
              )}
            </View>
          )}
          {gallery.length > 1 && (
            <View
              accessibilityLabel={t(
                `الصورة ${activeImage + 1} من ${gallery.length}`,
                `Image ${activeImage + 1} of ${gallery.length}`,
              )}
              style={{
                position: 'absolute',
                bottom: 14,
                left: locale === 'ar' ? undefined : 16,
                right: locale === 'ar' ? 16 : undefined,
                paddingHorizontal: 11,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.94)',
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.05)',
              }}
            >
              <Text style={{ color: colors.ink, fontSize: 12, fontWeight: '800' }}>
                {activeImage + 1} / {gallery.length}
              </Text>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('عرض الصور بملء الشاشة', 'View images full screen')}
            onPress={() => setGalleryVisible(true)}
            style={{
              position: 'absolute',
              bottom: 14,
              left: locale === 'ar' ? 13 : undefined,
              right: locale === 'ar' ? undefined : 13,
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: 'rgba(255,255,255,0.96)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SymbolView
              name={{ ios: 'arrow.up.left.and.arrow.down.right', android: 'fullscreen', web: 'fullscreen' }}
              tintColor={colors.ink}
              size={19}
            />
          </Pressable>
        </View>

        <View style={{ marginTop: -24, paddingHorizontal: 22, paddingTop: 23, paddingBottom: 26, borderTopLeftRadius: 27, borderTopRightRadius: 27, backgroundColor: colors.white, gap: 15 }}>
          {busy && <Busy />}
          <ErrorText error={error ?? fetchError} />
          {!product && !busy && <Button label={t('إعادة المحاولة', 'Retry')} onPress={retry} />}
          {product && (
            <>
              <View style={{ gap: 7 }}>
                <Txt title>{locale === 'ar' ? product.title_ar || product.title : product.title}</Txt>
                <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <Text style={{ color: colors.primary, fontSize: 25, fontWeight: '900' }}>{product.price} {product.currency}</Text>

                  <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    {typeof product.rating === 'number' && (
                      <View style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FFF5E8', borderWidth: 1, borderColor: '#F5E3C8' }}>
                        <Text style={{ color: '#A76518', fontSize: 12, fontWeight: '800' }}>★ {product.rating.toFixed(1)}</Text>
                      </View>
                    )}

                    <View style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: product.quantity > 0 ? '#EDF7F0' : '#FFF0ED', borderWidth: 1, borderColor: product.quantity > 0 ? '#D8EBDD' : '#F5D9D3' }}>
                      <Text style={{ color: product.quantity > 0 ? '#287344' : '#B54735', fontSize: 11, fontWeight: '800' }}>
                        {product.quantity > 0 ? t('متوفر', 'In stock') : t('نفد المخزون', 'Out of stock')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {!!product.description && (
                <View style={{ gap: 7 }}>
                  <Text
                    numberOfLines={descriptionExpanded ? undefined : 4}
                    style={{
                      color: colors.ink,
                      fontSize: 14,
                      lineHeight: 23,
                      fontWeight: '500',
                      textAlign: locale === 'ar' ? 'right' : 'left',
                    }}
                  >
                    {product.description}
                  </Text>

                  {product.description.length > 180 && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: descriptionExpanded }}
                      onPress={() => setDescriptionExpanded((value) => !value)}
                      style={{
                        alignSelf: locale === 'ar' ? 'flex-end' : 'flex-start',
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '800' }}>
                        {descriptionExpanded
                          ? t('عرض أقل', 'Show less')
                          : t('قراءة المزيد', 'Read more')}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
              {!!product.shop?.name && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t(`زيارة متجر ${product.shop.name}`, `Visit ${product.shop.name} store`)}
                  onPress={() => nav.shop(product.shop!.slug)}
                  style={{
                    flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.line,
                    backgroundColor: colors.paper,
                  }}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primarySoft,
                  }}>
                    <SymbolView
                      name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
                      tintColor={colors.primary}
                      size={21}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 4, alignItems: locale === 'ar' ? 'flex-end' : 'flex-start' }}>
                    <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>
                      {t('المتجر', 'STORE')}
                    </Text>
                    <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '900' }}>
                      {product.shop.name}
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                      {t('زيارة المتجر ومشاهدة منتجاته', 'Visit store and explore products')}
                    </Text>
                  </View>
                </Pressable>
              )}
              {!!product.features?.length && (
                <View style={{ gap: 10 }}>
                  <Txt title>{t('تفاصيل المنتج', 'Product details')}</Txt>
                  <View style={{
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: colors.white,
                  }}>
                    {product.features.map((feature, index) => (
                      <View
                        key={`${index}-${feature}`}
                        style={{
                          flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
                          alignItems: 'center',
                          gap: 11,
                          paddingHorizontal: 14,
                          paddingVertical: 13,
                          borderBottomWidth: index < product.features!.length - 1 ? 1 : 0,
                          borderBottomColor: colors.line,
                        }}
                      >
                        <View style={{
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: colors.primary,
                        }} />
                        <Text style={{
                          flex: 1,
                          color: colors.ink,
                          fontSize: 13,
                          lineHeight: 21,
                          textAlign: locale === 'ar' ? 'right' : 'left',
                        }}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ height: 1, backgroundColor: colors.line }} />
              <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ gap: 3 }}>
                  <Txt title>{t('الكمية', 'Quantity')}</Txt>
                  <Txt muted>{t(`المتوفر: ${product.quantity}`, `Available: ${product.quantity}`)}</Txt>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: colors.line, borderRadius: 17, padding: 6, backgroundColor: colors.white }}>
                  <Pressable accessibilityRole="button" accessibilityLabel={t('تقليل الكمية', 'Decrease quantity')} accessibilityState={{ disabled: quantity <= 1 }} disabled={quantity <= 1} onPress={() => setQuantity((value) => Math.max(1, value - 1))} style={{ width: 44, height: 44, borderRadius: 13, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, opacity: quantity <= 1 ? 0.45 : 1 }}>
                    <Text style={{ color: colors.ink, fontSize: 28, lineHeight: 32, fontWeight: '700' }}>−</Text>
                  </Pressable>
                  <Text accessibilityLabel={t(`الكمية ${quantity}`, `Quantity ${quantity}`)} style={{ minWidth: 25, textAlign: 'center', color: colors.ink, fontSize: 18, fontWeight: '900' }}>{quantity}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={t('زيادة الكمية', 'Increase quantity')} accessibilityState={{ disabled: quantity >= product.quantity }} disabled={quantity >= product.quantity} onPress={() => setQuantity((value) => Math.min(product.quantity, value + 1))} style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, opacity: quantity >= product.quantity ? 0.45 : 1 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 27, lineHeight: 32, fontWeight: '700' }}>+</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {product && (
        <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 16, minHeight: 82, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line, shadowColor: colors.ink, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 12 }}>
          <Button
            label={adding ? t('جارٍ الإضافة...', 'Adding...') : added ? t('عرض السلة', 'View basket') : t('أضف إلى السلة', 'Add to basket')}
            disabled={adding || uncertain || product.quantity < 1 || product.currency !== 'AED' || (!!session && !checked) || !product}
            onPress={() => void add()}
          />
          {(product.quantity < 1 || product.currency !== 'AED') && (
            <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 5 }}>
              {product.quantity < 1 ? t('هذا المنتج غير متوفر حالياً', 'This product is currently unavailable') : t('العملة غير مدعومة لإتمام الشراء من التطبيق', 'This currency is not supported for app checkout')}
            </Text>
          )}
          {uncertain && <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 5 }}>{t('تحقق من السلة قبل إعادة المحاولة؛ قد تكون الإضافة تمت.', 'Check the basket before retrying; the item may already have been added.')}</Text>}
        </View>
      )}
      <Modal
        visible={galleryVisible}
        animationType="fade"
        onRequestClose={() => setGalleryVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#090909' }}>
          <View
            style={{
              paddingTop: 18,
              paddingHorizontal: 18,
              paddingBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('إغلاق المعرض', 'Close gallery')}
              onPress={() => setGalleryVisible(false)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.14)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                tintColor="#FFFFFF"
                size={21}
              />
            </Pressable>

            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}>
              {gallery.length ? `${activeImage + 1} / ${gallery.length}` : '1 / 1'}
            </Text>
            <View style={{ width: 44 }} />
          </View>

          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            {...galleryPanResponder.panHandlers}
          >
            {selectedImage && failedImageUri !== selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                resizeMode="contain"
                style={{ width: '100%', height: '100%' }}
                onError={() => setFailedImageUri(selectedImage)}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#171717',
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 58, fontWeight: '900' }}>م</Text>
                <Text style={{ color: '#BBBBBB', fontSize: 11, fontWeight: '800', marginTop: 7 }}>
                  murwaj.com
                </Text>
              </View>
            )}

            {gallery.length > 1 && (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('الصورة السابقة', 'Previous image')}
                  accessibilityState={{ disabled: activeImage === 0 }}
                  disabled={activeImage === 0}
                  onPress={() => setActiveImage((current) => Math.max(0, current - 1))}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '46%',
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: 'rgba(255,255,255,0.16)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: activeImage === 0 ? 0.35 : 1,
                  }}
                >
                  <SymbolView
                    name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                    tintColor="#FFFFFF"
                    size={21}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('الصورة التالية', 'Next image')}
                  accessibilityState={{ disabled: activeImage >= gallery.length - 1 }}
                  disabled={activeImage >= gallery.length - 1}
                  onPress={() =>
                    setActiveImage((current) => Math.min(gallery.length - 1, current + 1))
                  }
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '46%',
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: 'rgba(255,255,255,0.16)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: activeImage >= gallery.length - 1 ? 0.35 : 1,
                  }}
                >
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'arrow_forward', web: 'arrow_forward' }}
                    tintColor="#FFFFFF"
                    size={21}
                  />
                </Pressable>
              </>
            )}
          </View>

          {gallery.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 10,
                paddingHorizontal: 18,
                paddingTop: 12,
                paddingBottom: 26,
              }}
            >
              {gallery.map((uri, index) => (
                <Pressable
                  key={`${uri}-${index}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeImage === index }}
                  accessibilityLabel={t(`الصورة ${index + 1}`, `Image ${index + 1}`)}
                  onPress={() => setActiveImage(index)}
                  style={{
                    width: 62,
                    height: 72,
                    borderRadius: 11,
                    borderWidth: activeImage === index ? 2 : 1,
                    borderColor: activeImage === index ? colors.primary : '#555555',
                    overflow: 'hidden',
                    backgroundColor: '#252525',
                  }}
                >
                  {failedImageUri === uri ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '900' }}>م</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                      onError={() => setFailedImageUri(uri)}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );


}
export function ShopScreen({ slug, nav }: { slug: string; nav: Nav }) {
  const { api, locale } = useApp();
  const t = useText();
  const { data: payload, error, busy, retry } =
    usePublicQuery<{ data: Shop }>(`/shops/${segment(slug)}`);
  const shop = payload?.data;
  const [failedBanner, setFailedBanner] = useState<string | null>(null);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);

  const bannerUri = resolveMediaUrl(shop?.banner_url, api.origin);
  const logoUri = resolveMediaUrl(shop?.logo_url, api.origin);
  const name = shop
    ? locale === 'ar' ? shop.name_ar || shop.name : shop.name
    : '';
  const previewProducts = shop?.listings ?? [];

  return (
    <View style={{ gap: 17 }}>
      {!!error && <ErrorText error={error} />}
      {busy && !shop && <Busy />}
      {!!error && !shop && (
        <Button label={t('إعادة تحميل المتجر', 'Reload store')} onPress={retry} secondary />
      )}

      {shop && (
        <>
          <View style={{ borderRadius: 25, overflow: 'hidden', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }}>
            <View style={{ height: 188, backgroundColor: '#F7E9E1' }}>
              {bannerUri && failedBanner !== bannerUri ? (
                <Image
                  source={{ uri: bannerUri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                  onError={() => setFailedBanner(bannerUri)}
                />
              ) : (
                <View style={{ flex: 1, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Text style={{ color: colors.primary, fontSize: 29, fontWeight: '900' }}>murwaj.com</Text>
                  <Text style={{ color: colors.ink, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>INDEPENDENT STORE</Text>
                </View>
              )}
            </View>

            <View style={{ paddingHorizontal: 17, paddingBottom: 18, gap: 12 }}>
              <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 12, marginTop: -37 }}>
                <View style={{ width: 82, height: 82, borderRadius: 23, borderWidth: 4, borderColor: colors.white, backgroundColor: colors.white, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                  {logoUri && failedLogo !== logoUri ? (
                    <Image
                      source={{ uri: logoUri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                      onError={() => setFailedLogo(logoUri)}
                    />
                  ) : (
                    <Text style={{ color: colors.primary, fontSize: 34, fontWeight: '900' }}>م</Text>
                  )}
                </View>
                <View style={{ flex: 1, paddingBottom: 4, gap: 4, alignItems: locale === 'ar' ? 'flex-end' : 'flex-start' }}>
                  <Text numberOfLines={2} style={{ color: colors.ink, fontSize: 19, lineHeight: 25, fontWeight: '900', textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    {name}
                  </Text>
                  <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <View style={{ borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: shop.verified ? colors.primarySoft : colors.paper }}>
                      <Text style={{ color: shop.verified ? colors.primary : colors.muted, fontSize: 10, fontWeight: '900' }}>
                        {shop.verified ? t('متجر موثّق', 'Verified store') : t('متجر مستقل', 'Independent store')}
                      </Text>
                    </View>
                    {typeof shop.rating === 'number' && shop.rating > 0 && (
                      <Text style={{ color: colors.ink, fontSize: 12, fontWeight: '900' }}>★ {shop.rating.toFixed(1)}</Text>
                    )}
                  </View>
                </View>
              </View>

              {!!shop.description && (
                <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 22, textAlign: locale === 'ar' ? 'right' : 'left', writingDirection: locale === 'ar' ? 'rtl' : 'ltr' }}>
                  {shop.description}
                </Text>
              )}

              {!!shop.location && (
                <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={{ color: colors.primary, fontSize: 15 }}>⌖</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, flex: 1, textAlign: locale === 'ar' ? 'right' : 'left' }}>
                    {shop.location}
                  </Text>
                </View>
              )}

              <Button
                label={t('تصفّح جميع منتجات المتجر', 'Browse all store products')}
                onPress={() => nav.shop(`list:${slug}`)}
              />
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <Txt title>{t('منتجات المتجر', 'Store products')}</Txt>
              {!!previewProducts.length && (
                <Pressable accessibilityRole="button" onPress={() => nav.shop(`list:${slug}`)} hitSlop={8}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '900' }}>{t('عرض الكل', 'See all')} ›</Text>
                </Pressable>
              )}
            </View>

            {previewProducts.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 5 }}>
                {previewProducts.map((product) => (
                  <View key={product.id} style={{ width: 220 }}>
                    <ProductCard product={product} onPress={() => nav.product(product.slug)} />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.card, { padding: 18, gap: 7 }]}>
                <Txt title>{t('المتجر يستعد لإضافة منتجاته', 'This store is preparing its products')}</Txt>
                <Txt muted>
                  {t('يمكنك العودة قريبًا لاكتشاف المنتجات الجديدة.', 'Come back soon to discover new products.')}
                </Txt>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}


function StoreDiscoveryCard({
  shop,
  onPress,
}: {
  shop: Shop;
  onPress: () => void;
}) {
  const { api, locale } = useApp();
  const t = useText();
  const [bannerFailed, setBannerFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const bannerUri = resolveMediaUrl(shop.banner_url, api.origin);
  const logoUri = resolveMediaUrl(shop.logo_url, api.origin);
  const name = locale === 'ar' ? shop.name_ar || shop.name : shop.name;
  const description = shop.description?.trim();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(`زيارة متجر ${name}`, `Visit ${name}`)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          padding: 0,
          borderRadius: 23,
          overflow: 'hidden',
          gap: 0,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <View style={{ height: 142, backgroundColor: '#F8E8DF', overflow: 'hidden' }}>
        {bannerUri && !bannerFailed ? (
          <Image
            source={{ uri: bannerUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setBannerFailed(true)}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.primary, fontSize: 34, fontWeight: '900', letterSpacing: 1 }}>murwaj</Text>
            <Text style={{ color: colors.ink, fontSize: 10, fontWeight: '700', marginTop: 3 }}>INDEPENDENT STORE</Text>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 15, paddingBottom: 15, gap: 9 }}>
        <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', gap: 11, marginTop: -31 }}>
          <View style={{ width: 66, height: 66, borderRadius: 19, borderWidth: 3, borderColor: colors.white, backgroundColor: colors.white, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {logoUri && !logoFailed ? (
              <Image
                source={{ uri: logoUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <Text style={{ color: colors.primary, fontSize: 27, fontWeight: '900' }}>م</Text>
            )}
          </View>
          <View style={{ flex: 1, paddingTop: 25, gap: 4, alignItems: locale === 'ar' ? 'flex-end' : 'flex-start' }}>
            <Text numberOfLines={1} style={{ color: colors.ink, fontSize: 16, fontWeight: '900', textAlign: locale === 'ar' ? 'right' : 'left' }}>
              {name}
            </Text>
            <Text style={{ color: shop.verified ? colors.primary : colors.muted, fontSize: 11, fontWeight: '800' }}>
              {shop.verified ? t('متجر موثّق', 'Verified store') : t('متجر مستقل', 'Independent store')}
            </Text>
          </View>
        </View>

        {!!description && (
          <Text numberOfLines={2} style={{ color: colors.muted, fontSize: 12, lineHeight: 19, textAlign: locale === 'ar' ? 'right' : 'left' }}>
            {description}
          </Text>
        )}

        <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 }}>
          {!!shop.location && (
            <Text numberOfLines={1} style={{ flex: 1, color: colors.muted, fontSize: 11, textAlign: locale === 'ar' ? 'right' : 'left' }}>
              {shop.location}
            </Text>
          )}
          {typeof shop.rating === 'number' && shop.rating > 0 && (
            <Text style={{ color: colors.ink, fontSize: 12, fontWeight: '800' }}>
              ★ {shop.rating.toFixed(1)}
            </Text>
          )}
        </View>

        <View style={{ minHeight: 42, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '900' }}>
            {t('استكشف المتجر', 'Explore store')} ›
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
