import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useApp } from '../session-context';
import { Button, Busy, ErrorText, Money, styles, Txt, useText } from '../components/ui';
import type { Cart, Order, Page } from '../core/types';
import { httpsUrl } from '../core/api';
export function NeedAccount({ account }: { account: () => void }) {
  const t = useText();
  return (
    <View style={styles.card}>
      <Txt title>{t('أكمل رحلتك مع مروج', 'Continue with Murwaj')}</Txt>
      <Txt muted>
        {t('سجّل الدخول للوصول إلى السلة والطلبات.', 'Sign in to access your basket and orders.')}
      </Txt>
      <Button label={t('حسابي', 'My account')} onPress={account} />
    </View>
  );
}
export function CartScreen({
  checkout,
  product,
}: {
  checkout: (shop?: number) => void;
  product: (slug: string) => void;
}) {
  const { api, session, locale, checked } = useApp();
  const t = useText();
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!checked || !session) return;
      setBusy(true);
      setCart(null);
      setError(null);
      void api
        .request<{ data: Cart }>('/cart', session.token, locale)
        .then((r) => {
          if (active) setCart(r.data);
        })
        .catch((e) => {
          if (active) setError(e);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
      return () => {
        active = false;
      };
    }, [api, reload, locale, session, checked]),
  );
  async function mutate(path: string, method: 'PATCH' | 'DELETE', body?: unknown) {
    if (busy || !session) return;
    setBusy(true);
    setError(null);
    try {
      await api.request(path, session.token, locale, { method, body });
      setReload((x) => x + 1);
    } catch (e) {
      setError(e);
      setCart(null);
    } finally {
      setBusy(false);
    }
  }
  const shops = Array.from(
    new Map(
      (cart?.items ?? [])
        .filter((i) => i.product)
        .map((i) => [i.product!.shop.id, i.product!.shop]),
    ).values(),
  );
  return (
    <View style={{ gap: 16 }}>
      <Txt title>{t('سلتك', 'Your basket')}</Txt>
      <ErrorText error={error} />
      {busy && <Busy />}
      <Button
        label={t('تحديث السلة', 'Refresh basket')}
        disabled={busy || !checked}
        secondary
        onPress={() => setReload((x) => x + 1)}
      />
      <Button
        label={t('استعادة محاولة دفع محفوظة', 'Recover saved checkout')}
        secondary
        disabled={busy || !checked}
        onPress={() => checkout()}
      />
      {cart?.items.map((i) => (
        <View key={i.id} style={styles.card}>
          <Txt title>
            {i.product
              ? locale === 'ar'
                ? i.product.title_ar || i.product.title
                : i.product.title
              : t('منتج غير متاح', 'Unavailable product')}
          </Txt>
          {i.product && (
            <Button
              secondary
              label={t('عرض المنتج', 'View product')}
              onPress={() => product(i.product!.slug)}
            />
          )}
          <Money value={i.line_total} currency="AED" />
          {!i.available && (
            <Txt muted>
              {t(
                'غير متاح بالكمية المطلوبة. قد يكون المخزون محجوزًا لدفع معلّق.',
                'Unavailable at this quantity. Stock may be reserved for a pending payment.',
              )}
            </Txt>
          )}
          <View style={styles.row}>
            <Button
              label="−"
              disabled={busy || i.quantity <= 1 || !i.available}
              secondary
              onPress={() =>
                void mutate(`/cart/items/${i.id}`, 'PATCH', { quantity: i.quantity - 1 })
              }
            />
            <Txt>{i.quantity}</Txt>
            <Button
              label="+"
              disabled={
                busy ||
                !i.available ||
                i.quantity >= Math.min(99, i.product?.quantity_in_stock ?? 0)
              }
              secondary
              onPress={() =>
                void mutate(`/cart/items/${i.id}`, 'PATCH', { quantity: i.quantity + 1 })
              }
            />
            <Button
              label={t('حذف', 'Remove')}
              disabled={busy}
              secondary
              onPress={() => void mutate(`/cart/items/${i.id}`, 'DELETE')}
            />
          </View>
        </View>
      ))}
      {cart?.items.length === 0 && (
        <Txt muted>
          {t(
            'السلة فارغة. اكتشف المنتجات وأضف ما يعجبك.',
            'Your basket is empty. Discover products to get started.',
          )}
        </Txt>
      )}
      {!!cart?.items.length && (
        <>
          <View style={styles.card}>
            <Txt>{t('مجموع المنتجات', 'Item subtotal')}</Txt>
            <Money value={cart.subtotal} currency="AED" />
            <Txt muted>
              {t(
                'المبلغ النهائي يؤكده الخادم عند الدفع. يُنشأ طلب منفصل لكل متجر.',
                'The server confirms the final amount at checkout. Each store has a separate order.',
              )}
            </Txt>
          </View>
          {shops.map((shop) => (
            <Button
              key={shop.id}
              label={t(`الدفع لدى ${shop.name}`, `Checkout with ${shop.name}`)}
              disabled={
                busy ||
                !session?.user.email_verified ||
                cart.items.some((i) => i.product?.shop.id === shop.id && !i.available)
              }
              onPress={() => checkout(shop.id)}
            />
          ))}
          {!session?.user.email_verified && (
            <Txt muted>
              {t(
                'وثّق بريدك الإلكتروني من صفحة الحساب قبل الدفع.',
                'Verify your email from the account screen before checkout.',
              )}
            </Txt>
          )}
        </>
      )}
    </View>
  );
}
export function OrdersScreen({ open }: { open: (id: number) => void }) {
  const { api, session, locale, checked } = useApp();
  const t = useText();
  const [result, setResult] = useState<Page<Order> | null>(null);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!session || !checked) return;
      setBusy(true);
      setResult(null);
      setError(null);
      void api
        .request<Page<Order>>(`/orders?page=${page}&per_page=10`, session.token, locale)
        .then((r) => {
          if (active) setResult(r);
        })
        .catch((e) => {
          if (active) setError(e);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
      return () => {
        active = false;
      };
    }, [api, page, reload, locale, session, checked]),
  );
  return (
    <View style={{ gap: 16 }}>
      <Txt title>{t('طلباتي', 'My orders')}</Txt>
      <ErrorText error={error} />
      {busy && <Busy />}
      <Button
        label={t('تحديث', 'Refresh')}
        secondary
        disabled={busy || !checked}
        onPress={() => setReload((x) => x + 1)}
      />
      {result?.data.map((o) => (
        <View key={o.id} style={styles.card}>
          <Txt title>{o.order_number}</Txt>
          <Txt muted>{o.shop?.name}</Txt>
          <Txt>
            {statusLabel(o.payment_status, locale === 'ar')} ·{' '}
            {statusLabel(o.status, locale === 'ar')}
          </Txt>
          <Money value={o.total} currency={o.currency} />
          <Button label={t('تفاصيل الطلب', 'Order details')} secondary onPress={() => open(o.id)} />
        </View>
      ))}
      {result?.data.length === 0 && (
        <Txt muted>{t('لا توجد طلبات حتى الآن.', 'No orders yet.')}</Txt>
      )}
      {result && (
        <View style={styles.row}>
          <Button
            secondary
            label={t('السابق', 'Previous')}
            disabled={busy || page <= 1}
            onPress={() => setPage((x) => x - 1)}
          />
          <Txt>
            {page} / {result.meta.last_page}
          </Txt>
          <Button
            secondary
            label={t('التالي', 'Next')}
            disabled={busy || page >= result.meta.last_page}
            onPress={() => setPage((x) => x + 1)}
          />
        </View>
      )}
    </View>
  );
}
export function statusLabel(value: string, arabic: boolean) {
  return arabic
    ? ((
        {
          paid: 'مدفوع',
          pending: 'قيد الانتظار',
          unpaid: 'غير مدفوع',
          refunded: 'مسترد',
          expired: 'منتهي',
          cancelled: 'ملغى',
          completed: 'مكتمل',
          processing: 'قيد المعالجة',
          open: 'مفتوح',
          creating: 'جارٍ الإنشاء',
          fulfilled: 'تم التنفيذ',
        } as Record<string, string>
      )[value] ?? value)
    : value;
}
export function OrderScreen({ id, recover }: { id: number; recover: () => void }) {
  const { api, session, locale, checked } = useApp();
  const t = useText();
  const [order, setOrder] = useState<Order | null>(null);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!session || !checked) return;
      setBusy(true);
      setError(null);
      void api
        .request<{ data: Order }>(`/orders/${id}`, session.token, locale)
        .then((r) => {
          if (active) setOrder(r.data);
        })
        .catch((e) => {
          if (active) setError(e);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
      return () => {
        active = false;
      };
    }, [api, id, reload, locale, session, checked]),
  );
  return (
    <View style={{ gap: 16 }}>
      <Txt title>{t('تفاصيل الطلب', 'Order details')}</Txt>
      <ErrorText error={error} />
      {busy && <Busy />}
      <Button
        label={t('تحديث حالة الطلب', 'Refresh order')}
        secondary
        disabled={busy || !checked}
        onPress={() => setReload((x) => x + 1)}
      />
      {order && (
        <>
          <View style={styles.card}>
            <Txt title>{order.order_number}</Txt>
            <Txt>
              {statusLabel(order.payment_status, locale === 'ar')} ·{' '}
              {statusLabel(order.status, locale === 'ar')}
            </Txt>
            <Money value={order.total} currency={order.currency} />
            <Txt muted>{order.shop?.name}</Txt>
          </View>
          {order.items?.map((i) => (
            <View key={i.id} style={styles.card}>
              <Txt>
                {i.title} × {i.quantity}
              </Txt>
              <Money value={i.total} currency={order.currency} />
            </View>
          ))}
          {order.shipping_address && (
            <View style={styles.card}>
              <Txt title>{t('عنوان التوصيل', 'Delivery address')}</Txt>
              {Object.entries(order.shipping_address)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <Txt key={k}>{v}</Txt>
                ))}
            </View>
          )}
          <View style={styles.card}>
            <Txt title>{t('توصيل رسلو', 'Raslo delivery')}</Txt>
            {order.delivery ? (
              <>
                <Txt>{order.delivery.status_label}</Txt>
                <Txt muted>{order.delivery.tracking_number}</Txt>
                {httpsUrl(order.delivery.tracking_url) && (
                  <Button
                    secondary
                    label={t('فتح رابط التتبع', 'Open tracking')}
                    onPress={() => {
                      void WebBrowser.openBrowserAsync(
                        httpsUrl(order.delivery!.tracking_url)!,
                      ).catch(setError);
                    }}
                  />
                )}
              </>
            ) : (
              <Txt muted>
                {t(
                  'لا توجد شحنة رسلو محفوظة لهذا الطلب حتى الآن.',
                  'No saved Raslo shipment is linked yet.',
                )}
              </Txt>
            )}
          </View>
          {order.payment_status === 'pending' && (
            <Button
              secondary
              label={t(
                'استعادة الدفع المحفوظ على هذا الجهاز',
                'Recover checkout saved on this device',
              )}
              onPress={recover}
            />
          )}
        </>
      )}
    </View>
  );
}
