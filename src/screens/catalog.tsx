import { usePublicQuery } from '../use-public-query';
import React, { useRef, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useApp } from '../session-context';
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
  homeContent,
  searchOnly = false,
  categoryId,
  sectionId,
}: {
  nav: Nav;
  shops?: boolean;
  shopSlug?: string;
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
    `${path}?per_page=12&page=${page}&q=${segment(q)}${categoryId ? `&category_id=${segment(categoryId)}` : ''}${sectionId ? `&section_id=${segment(sectionId)}` : ''}`,
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
                shopSlug || shops
                  ? t('ابحث عن متجر', 'Search stores')
                  : t('ابحث عن منتج', 'Search products')
              }
              placeholder={
                shopSlug || shops
                  ? t('اسم المتجر...', 'Store name...')
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
          </View>

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
          <View style={[styles.card, { gap: 11 }]}>
            <Photo
              uri={(item as Shop).logo_url || (item as Shop).banner_url}
              height={145}
            />

            <Txt title>
              {locale === 'ar'
                ? (item as Shop).name_ar || (item as Shop).name
                : (item as Shop).name}
            </Txt>

            <Txt muted>
              {(item as Shop).verified
                ? t('متجر موثّق', 'Verified store')
                : t('متجر مستقل', 'Independent store')}
            </Txt>

            {!!(item as Shop).description && (
              <Txt>
                {(item as Shop).description}
              </Txt>
            )}

            <Button
              label={t('زيارة المتجر', 'Visit store')}
              onPress={() => nav.shop(item.slug)}
              secondary
            />
          </View>
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
          <View style={styles.card}>
            <Txt title>
              {t('لا توجد نتائج حاليًا', 'No results found')}
            </Txt>
            <Txt muted>
              {t(
                'جرّب كلمة بحث أخرى أو امسح البحث لعرض المنتجات المتاحة.',
                'Try another search term or clear the search to see available items.',
              )}
            </Txt>
            {!!q && (
              <Button
                label={t('عرض جميع النتائج', 'Show all items')}
                onPress={clearSearch}
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

export function ProductCard({
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
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Photo uri={p.image_url} height={compact ? 116 : 165} />
      </Pressable>
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
  const addLock = useRef(false);

  const gallery = product
    ? [...new Set([...(product.image_urls ?? []), product.image_url ?? ''].filter((uri) => /^https?:\/\//i.test(uri)))]
    : [];
  const selectedImage = gallery[activeImage] || product?.image_url || null;

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
        <View style={{ height: 415, backgroundColor: '#F5D2C2' }}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.primary, fontSize: 58, fontWeight: '900' }}>م</Text>
            </View>
          )}
          <View style={{ position: 'absolute', top: 14, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('رجوع', 'Go back')} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' }}>
              <SymbolView name="chevron.left" tintColor={colors.ink} size={19} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('مشاركة المنتج', 'Share product')} onPress={() => void shareProduct()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' }}>
              <SymbolView name="square.and.arrow.up" tintColor={colors.ink} size={19} />
            </Pressable>
          </View>
          {gallery.length > 1 && (
            <View style={{ position: 'absolute', right: 13, top: 76, gap: 8 }}>
              {gallery.slice(0, 4).map((uri, index) => (
                <Pressable key={`${uri}-${index}`} accessibilityRole="button" accessibilityLabel={t(`الصورة ${index + 1}`, `Image ${index + 1}`)} onPress={() => setActiveImage(index)} style={{ width: 52, height: 61, borderRadius: 11, borderWidth: activeImage === index ? 2 : 1, borderColor: activeImage === index ? colors.primary : '#FFFFFF', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </Pressable>
              ))}
              {gallery.length > 4 && (
                <View style={{ width: 52, height: 52, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.ink, fontWeight: '800' }}>+{gallery.length - 4}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ marginTop: -24, paddingHorizontal: 22, paddingTop: 23, paddingBottom: 26, borderTopLeftRadius: 27, borderTopRightRadius: 27, backgroundColor: colors.white, gap: 15 }}>
          {busy && <Busy />}
          <ErrorText error={error ?? fetchError} />
          {!product && !busy && <Button label={t('إعادة المحاولة', 'Retry')} onPress={retry} />}
          {product && (
            <>
              <View style={{ gap: 7 }}>
                <Txt title>{locale === 'ar' ? product.title_ar || product.title : product.title}</Txt>
                <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={{ color: colors.primary, fontSize: 23, fontWeight: '900' }}>{product.price} {product.currency}</Text>
                  {typeof product.rating === 'number' && (
                    <Text style={{ color: '#B96B22', fontSize: 13, fontWeight: '800' }}>★ {product.rating.toFixed(1)}</Text>
                  )}
                </View>
              </View>

              {!!product.description && <Txt>{product.description}</Txt>}
              {!!product.shop?.name && (
                <Pressable accessibilityRole="button" onPress={() => nav.shop(product.shop!.slug)} style={{ alignSelf: locale === 'ar' ? 'flex-end' : 'flex-start', backgroundColor: colors.primarySoft, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8 }}>
                  <Text style={{ color: colors.primary, fontWeight: '800' }}>{product.shop.name}</Text>
                </Pressable>
              )}
              {!!product.features?.length && (
                <View style={{ gap: 7 }}>
                  <Txt title>{t('تفاصيل المنتج', 'Product details')}</Txt>
                  {product.features.map((feature, index) => <Txt muted key={`${index}-${feature}`}>• {feature}</Txt>)}
                </View>
              )}

              <View style={{ height: 1, backgroundColor: colors.line }} />
              <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ gap: 3 }}>
                  <Txt title>{t('الكمية', 'Quantity')}</Txt>
                  <Txt muted>{t(`المتوفر: ${product.quantity}`, `Available: ${product.quantity}`)}</Txt>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 5 }}>
                  <Pressable accessibilityRole="button" accessibilityLabel={t('تقليل الكمية', 'Decrease quantity')} disabled={quantity <= 1} onPress={() => setQuantity((value) => Math.max(1, value - 1))} style={{ width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, opacity: quantity <= 1 ? 0.4 : 1 }}>
                    <SymbolView name="minus" tintColor={colors.ink} size={15} />
                  </Pressable>
                  <Text style={{ minWidth: 20, textAlign: 'center', color: colors.ink, fontSize: 16, fontWeight: '800' }}>{quantity}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={t('زيادة الكمية', 'Increase quantity')} disabled={quantity >= product.quantity} onPress={() => setQuantity((value) => Math.min(product.quantity, value + 1))} style={{ width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, opacity: quantity >= product.quantity ? 0.4 : 1 }}>
                    <SymbolView name="plus" tintColor={colors.ink} size={15} />
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {product && (
        <View style={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line }}>
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
    </View>
  );
}
export function ShopScreen({ slug, nav }: { slug: string; nav: Nav }) {
  const { locale } = useApp();
  const t = useText();
  const { data: payload, error, retry } = usePublicQuery<{ data: Shop }>(`/shops/${segment(slug)}`);
  const shop = payload?.data;
  return (
    <View style={{ gap: 16 }}>
      <ErrorText error={error} />
      {!shop && !error && <Busy />}
      {!!error && <Button label={t('إعادة المحاولة', 'Retry')} onPress={retry} />}
      {shop && (
        <>
          <Txt title>{locale === 'ar' ? shop.name_ar || shop.name : shop.name}</Txt>
          <Txt>{shop.description}</Txt>
          <Button
            label={t('جميع منتجات المتجر', 'All store products')}
            onPress={() => nav.shop(`list:${slug}`)}
          />
        </>
      )}
    </View>
  );
}
