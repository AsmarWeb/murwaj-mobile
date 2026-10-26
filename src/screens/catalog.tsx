import { usePublicQuery } from '../use-public-query';
import React, { useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useApp } from '../session-context';
import {
  Button,
  Busy,
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
}: {
  nav: Nav;
  shops?: boolean;
  shopSlug?: string;
}) {
  const { locale } = useApp();
  const t = useText();
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const path = shopSlug ? `/shops/${segment(shopSlug)}/listings` : shops ? '/shops' : '/listings';
  const {
    data: result,
    error,
    busy,
    retry,
  } = usePublicQuery<Page<Product | Shop>>(`${path}?per_page=12&page=${page}&q=${segment(q)}`);
  return (
    <FlatList
      data={result?.data ?? []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 16 }}>
          {!shopSlug && (
            <View style={styles.hero}>
              <Txt>
                <TextOnDark>{t('مروج.كوم', 'MURWAJ.COM')}</TextOnDark>
              </Txt>
              <TextOnDark large>
                {t('اكتشف الإبداع.\nتسوّق بذكاء.', 'Get Found.\nSell Smarter.')}
              </TextOnDark>
              <TextOnDark>
                {t('منتجات ومتاجر تستحق أن تكتشفها.', 'Independent stores. Fresh discoveries.')}
              </TextOnDark>
            </View>
          )}
          <Txt title>
            {shopSlug
              ? t('منتجات المتجر', 'Store products')
              : shops
                ? t('اكتشف المتاجر', 'Discover stores')
                : t('اكتشف المنتجات', 'Discover products')}
          </Txt>
          <Field
            label={t('بحث', 'Search')}
            value={draft}
            onChangeText={setDraft}
            maxLength={100}
            returnKeyType="search"
            onSubmitEditing={() => {
              setPage(1);
              setQ(draft.trim());
            }}
          />
          <Button
            label={t('بحث', 'Search')}
            onPress={() => {
              setPage(1);
              setQ(draft.trim());
              retry();
            }}
            secondary
          />
          <ErrorText error={error} />
          {busy && <Busy />}
        </View>
      }
      renderItem={({ item }) =>
        shops ? (
          <View style={styles.card}>
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
            <Button
              label={t('عرض المتجر', 'Visit store')}
              onPress={() => nav.shop(item.slug)}
              secondary
            />
          </View>
        ) : (
          <ProductCard product={item as Product} onPress={() => nav.product(item.slug)} />
        )
      }
      ListEmptyComponent={
        !busy && !error ? (
          <Txt muted>{t('لا توجد نتائج حاليًا.', 'No results yet.')}</Txt>
        ) : undefined
      }
      ListFooterComponent={
        <View style={{ gap: 14, marginTop: 18 }}>
          {!!error && <Button label={t('إعادة المحاولة', 'Retry')} onPress={() => retry()} />}
          {result && (
            <>
              <Txt muted>
                {t(
                  `صفحة ${page} من ${result.meta.last_page}`,
                  `Page ${page} of ${result.meta.last_page}`,
                )}
              </Txt>
              <View style={styles.row}>
                <Button
                  label={t('السابق', 'Previous')}
                  disabled={busy || page <= 1}
                  onPress={() => setPage((x) => x - 1)}
                  secondary
                />
                <Button
                  label={t('التالي', 'Next')}
                  disabled={busy || page >= result.meta.last_page}
                  onPress={() => setPage((x) => x + 1)}
                  secondary
                />
              </View>
            </>
          )}
        </View>
      }
    />
  );
}
function TextOnDark({ children, large = false }: { children: React.ReactNode; large?: boolean }) {
  const { locale } = useApp();
  return (
    <Text
      style={{
        color: '#EFF4DF',
        fontSize: large ? 32 : 14,
        fontWeight: large ? '800' : '500',
        lineHeight: large ? 43 : 23,
        textAlign: locale === 'ar' ? 'right' : 'left',
      }}
    >
      {children}
    </Text>
  );
}
export function ProductCard({ product: p, onPress }: { product: Product; onPress: () => void }) {
  const { locale } = useApp();
  const t = useText();
  return (
    <View style={styles.card}>
      <Photo uri={p.image_url} />
      <Txt title>{locale === 'ar' ? p.title_ar || p.title : p.title}</Txt>
      <Txt muted>{p.shop?.name}</Txt>
      <Money value={p.price} currency={p.currency} />
      <Button label={t('عرض المنتج', 'View product')} onPress={onPress} secondary />
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
