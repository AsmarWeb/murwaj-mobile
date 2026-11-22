import { usePublicQuery } from '../use-public-query';
import React, { useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
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
}: {
  nav: Nav;
  shops?: boolean;
  shopSlug?: string;
  homeContent?: React.ReactNode;
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
    `${path}?per_page=12&page=${page}&q=${segment(q)}`,
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
          {!shopSlug && !shops && (
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
  const { locale } = useApp();
  const t = useText();

  return (
    <View
      style={[
        styles.card,
        compact && {
          flex: 1,
          minWidth: 0,
          padding: 11,
          gap: 8,
          borderRadius: 18,
        },
      ]}
    >
      <Photo uri={p.image_url} height={compact ? 128 : 175} />

      <Txt title>
        {locale === 'ar' ? p.title_ar || p.title : p.title}
      </Txt>

      {!!p.shop?.name && <Txt muted>{p.shop.name}</Txt>}

      <Money value={p.price} currency={p.currency} />

      <Button
        label={t('عرض المنتج', 'View product')}
        onPress={onPress}
        secondary
      />
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
  const addLock = useRef(false);
  async function add() {
    if (!session) {
      nav.account();
      return;
    }
    if (addLock.current || uncertain) return;
    addLock.current = true;
    setAdding(true);
    setError(null);
    try {
      await api.request('/cart/items', session.token, locale, {
        method: 'POST',
        body: { listing_id: product!.id, quantity: 1 },
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
  return (
    <View style={{ gap: 16 }}>
      {busy && <Busy />}
      <ErrorText error={error ?? fetchError} />
      {!product && !busy && <Button label={t('إعادة المحاولة', 'Retry')} onPress={retry} />}
      {product && (
        <>
          <Photo uri={product.image_url} />
          <Txt title>{locale === 'ar' ? product.title_ar || product.title : product.title}</Txt>
          <Money value={product.price} currency={product.currency} />
          <Txt>{product.description || t('لا يوجد وصف إضافي.', 'No additional description.')}</Txt>
          {product.features?.map((s, i) => (
            <Txt muted key={i}>
              • {s}
            </Txt>
          ))}
          {product.shop && (
            <Button
              label={product.shop.name}
              secondary
              onPress={() => nav.shop(product.shop!.slug)}
            />
          )}
          <Button
            label={added ? t('عرض السلة', 'View basket') : t('أضف للسلة', 'Add to basket')}
            disabled={
              adding ||
              uncertain ||
              (!added && (product.currency !== 'AED' || product.quantity < 1)) ||
              (!!session && !checked)
            }
            onPress={added ? nav.cart : () => void add()}
          />
          {uncertain && (
            <>
              <Txt muted>
                {t(
                  'تحقق من السلة قبل أي إضافة أخرى؛ قد تكون الإضافة وصلت.',
                  'Check the basket before adding again; the request may have succeeded.',
                )}
              </Txt>
              <Button label={t('تحقق من السلة', 'Check basket')} onPress={nav.cart} />
            </>
          )}
        </>
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
