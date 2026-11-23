import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useApp } from '../session-context';
import { Button, Busy, ErrorText, Money, Photo, styles, Txt, useText, colors } from '../components/ui';
import type { Cart, CartItem, Order, Page, Shop } from '../core/types';
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
  discover,
}: {
  checkout: (shop?: number) => void;
  product: (slug: string) => void;
  discover: () => void;
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
        .then((reply) => {
          if (active) setCart(reply.data);
        })
        .catch((requestError) => {
          if (active) setError(requestError);
        })
        .finally(() => {
          if (active) setBusy(false);
        });

      return () => {
        active = false;
      };
    // `reload` intentionally retriggers this focus effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, reload, locale, session, checked]),
  );

  async function mutate(
    path: string,
    method: 'PATCH' | 'DELETE',
    body?: unknown,
  ) {
    if (busy || !session) return;

    setBusy(true);
    setError(null);

    try {
      await api.request(path, session.token, locale, { method, body });
      setReload((value) => value + 1);
    } catch (mutationError) {
      setError(mutationError);
      setCart(null);
    } finally {
      setBusy(false);
    }
  }

  const groups = (cart?.items ?? []).reduce<
    { id: number; shop: Shop | null; items: CartItem[] }[]
  >((result, item) => {
    const shop = item.product?.shop ?? null;
    const id = shop?.id ?? 0;
    let group = result.find((entry) => entry.id === id);

    if (!group) {
      group = { id, shop, items: [] };
      result.push(group);
    }

    group.items.push(item);
    return result;
  }, []);

  const direction = locale === 'ar' ? 'row-reverse' : 'row';
  const currency = cart?.currency || 'AED';

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 7 }}>
        <View
          style={{
            flexDirection: direction,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Txt title>{t('سلة التسوق', 'Shopping basket')}</Txt>

          <View
            style={{
              minWidth: 42,
              height: 36,
              paddingHorizontal: 12,
              borderRadius: 18,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '900' }}>
              {cart?.total_quantity ?? '—'}
            </Text>
          </View>
        </View>

        <Txt muted>
          {t(
            'راجع اختياراتك وأكمل التسوق من متاجرك المفضلة.',
            'Review your selections and continue shopping with your favorite stores.',
          )}
        </Txt>
      </View>

      <ErrorText error={error} />

      {busy && <Busy />}

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.ink,
            borderColor: colors.ink,
            padding: 19,
            gap: 9,
          },
        ]}
      >
        <Text style={{ color: '#FF9B76', fontSize: 12, fontWeight: '900' }}>
          murwaj.com
        </Text>

        <Text
          style={{
            color: colors.white,
            fontSize: 21,
            lineHeight: 29,
            fontWeight: '900',
            textAlign: locale === 'ar' ? 'right' : 'left',
          }}
        >
          {t('كل اختياراتك في مكان واحد', 'Everything you picked, in one place')}
        </Text>

        <Text
          style={{
            color: '#E8DED8',
            fontSize: 12,
            lineHeight: 19,
            textAlign: locale === 'ar' ? 'right' : 'left',
          }}
        >
          {cart
            ? t(
                `${cart.total_quantity} قطعة من ${groups.filter((group) => group.shop).length} متجر`,
                `${cart.total_quantity} items from ${groups.filter((group) => group.shop).length} stores`,
              )
            : t(
                'تجربة تسوق سهلة ومنظمة من متاجر مُروَّج.',
                'A simple, organized shopping experience from Murwaj stores.',
              )}
        </Text>
      </View>

      <View style={{ flexDirection: direction, gap: 9 }}>
        <View style={{ flex: 1 }}>
          <Button
            label={t('تحديث السلة', 'Refresh basket')}
            disabled={busy || !checked}
            secondary
            onPress={() => setReload((value) => value + 1)}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Button
            label={t('استعادة الدفع', 'Recover checkout')}
            disabled={busy || !checked}
            secondary
            onPress={() => checkout()}
          />
        </View>
      </View>

      {cart?.items.length === 0 && (
        <View
          style={[
            styles.card,
            {
              alignItems: 'center',
              paddingVertical: 27,
              paddingHorizontal: 22,
              gap: 13,
            },
          ]}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 34, fontWeight: '900' }}>
              م
            </Text>
          </View>

          <Txt title>{t('سلتك بانتظار اختياراتك', 'Your basket is waiting')}</Txt>

          <Txt muted>
            {t(
              'لم تضف أي منتجات بعد. اكتشف المتاجر والمنتجات وأضف ما يناسبك.',
              'You have not added any products yet. Explore stores and discover something you love.',
            )}
          </Txt>

          <Button
            label={t('ابدأ التسوق', 'Start shopping')}
            onPress={discover}
          />
        </View>
      )}

      {groups.map((group) => {
        const shopName = group.shop
          ? locale === 'ar'
            ? group.shop.name_ar || group.shop.name
            : group.shop.name
          : t('منتجات غير متاحة', 'Unavailable products');

        const hasUnavailableItems = group.items.some((item) => !item.available);

        return (
          <View key={group.id} style={{ gap: 11 }}>
            <View
              style={{
                flexDirection: direction,
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Txt title>{shopName}</Txt>
                <Txt muted>
                  {t(
                    `${group.items.length} منتجات في هذا المتجر`,
                    `${group.items.length} items from this store`,
                  )}
                </Txt>
              </View>

              {group.shop?.verified && (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 13,
                    backgroundColor: colors.primarySoft,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900' }}>
                    {t('متجر موثّق', 'Verified')}
                  </Text>
                </View>
              )}
            </View>

            {group.items.map((item) => {
              const name = item.product
                ? locale === 'ar'
                  ? item.product.title_ar || item.product.title
                  : item.product.title
                : t('منتج لم يعد متاحاً', 'Product no longer available');

              const stockLimit = Math.min(
                99,
                item.product?.quantity_in_stock ?? 0,
              );

              return (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    {
                      padding: 12,
                      borderRadius: 21,
                      gap: 12,
                      opacity: item.available ? 1 : 0.88,
                    },
                  ]}
                >
                  <View style={{ flexDirection: direction, gap: 12 }}>
                    <View
                      style={{
                        width: 96,
                        height: 112,
                        borderRadius: 16,
                        overflow: 'hidden',
                        backgroundColor: colors.paper,
                      }}
                    >
                      <Photo uri={item.product?.image_url} height={112} />
                    </View>

                    <View
                      style={{
                        flex: 1,
                        minWidth: 0,
                        justifyContent: 'center',
                        gap: 7,
                      }}
                    >
                      <Text
                        numberOfLines={2}
                        style={{
                          color: colors.ink,
                          fontSize: 14,
                          lineHeight: 20,
                          fontWeight: '900',
                          textAlign: locale === 'ar' ? 'right' : 'left',
                          writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
                        }}
                      >
                        {name}
                      </Text>

                      {group.shop && (
                        <Text
                          numberOfLines={1}
                          style={{
                            color: colors.muted,
                            fontSize: 11,
                            textAlign: locale === 'ar' ? 'right' : 'left',
                          }}
                        >
                          {shopName}
                        </Text>
                      )}

                      <Money value={item.unit_price} currency={currency} />

                      {!item.available && (
                        <View
                          style={{
                            alignSelf: locale === 'ar' ? 'flex-end' : 'flex-start',
                            paddingHorizontal: 9,
                            paddingVertical: 5,
                            borderRadius: 10,
                            backgroundColor: '#FFF1EF',
                          }}
                        >
                          <Text
                            style={{
                              color: colors.red,
                              fontSize: 10,
                              fontWeight: '800',
                            }}
                          >
                            {t('غير متوفر بالكمية المطلوبة', 'Quantity unavailable')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View
                    style={{
                      height: 1,
                      backgroundColor: colors.line,
                    }}
                  />

                  <View
                    style={{
                      flexDirection: direction,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: direction,
                        alignItems: 'center',
                        gap: 9,
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('تقليل الكمية', 'Decrease quantity')}
                        accessibilityState={{
                          disabled: busy || item.quantity <= 1 || !item.available,
                        }}
                        disabled={busy || item.quantity <= 1 || !item.available}
                        onPress={() =>
                          void mutate(`/cart/items/${item.id}`, 'PATCH', {
                            quantity: item.quantity - 1,
                          })
                        }
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: colors.line,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: busy || item.quantity <= 1 || !item.available ? 0.4 : 1,
                        }}
                      >
                        <Text style={{ color: colors.ink, fontSize: 19, fontWeight: '700' }}>
                          −
                        </Text>
                      </Pressable>

                      <Text
                        style={{
                          minWidth: 20,
                          color: colors.ink,
                          fontSize: 14,
                          fontWeight: '900',
                          textAlign: 'center',
                        }}
                      >
                        {item.quantity}
                      </Text>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('زيادة الكمية', 'Increase quantity')}
                        accessibilityState={{
                          disabled: busy || !item.available || item.quantity >= stockLimit,
                        }}
                        disabled={busy || !item.available || item.quantity >= stockLimit}
                        onPress={() =>
                          void mutate(`/cart/items/${item.id}`, 'PATCH', {
                            quantity: item.quantity + 1,
                          })
                        }
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: colors.line,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: busy || !item.available || item.quantity >= stockLimit ? 0.4 : 1,
                        }}
                      >
                        <Text style={{ color: colors.ink, fontSize: 19, fontWeight: '700' }}>
                          +
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('إزالة المنتج من السلة', 'Remove item from basket')}
                        accessibilityState={{ disabled: busy }}
                        disabled={busy}
                        onPress={() => void mutate(`/cart/items/${item.id}`, 'DELETE')}
                        style={{ paddingHorizontal: 5, paddingVertical: 8 }}
                      >
                        <Text
                          style={{
                            color: colors.red,
                            fontSize: 12,
                            fontWeight: '800',
                          }}
                        >
                          {t('إزالة', 'Remove')}
                        </Text>
                      </Pressable>
                    </View>

                    <View style={{ alignItems: locale === 'ar' ? 'flex-start' : 'flex-end' }}>
                      <Text
                        style={{
                          color: colors.muted,
                          fontSize: 10,
                          fontWeight: '700',
                        }}
                      >
                        {t('الإجمالي', 'Line total')}
                      </Text>
                      <Money value={item.line_total} currency={currency} />
                    </View>
                  </View>
                </View>
              );
            })}

            {group.shop && (
              <Button
                label={t(`الدفع لدى ${shopName}`, `Checkout with ${shopName}`)}
                disabled={
                  busy ||
                  !checked ||
                  !session?.user.email_verified ||
                  hasUnavailableItems
                }
                onPress={() => checkout(group.shop!.id)}
              />
            )}

            {group.shop && hasUnavailableItems && (
              <Txt muted>
                {t(
                  'عالج المنتجات غير المتوفرة قبل الدفع من هذا المتجر.',
                  'Resolve unavailable items before checking out with this store.',
                )}
              </Txt>
            )}
          </View>
        );
      })}

      {!!cart?.items.length && (
        <View style={[styles.card, { padding: 19, gap: 12 }]}>
          <Txt title>{t('ملخص السلة', 'Basket summary')}</Txt>

          <View
            style={{
              flexDirection: direction,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Txt muted>{t('عدد المنتجات', 'Total items')}</Txt>
            <Txt>{cart.total_quantity}</Txt>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.line,
            }}
          />

          <View
            style={{
              flexDirection: direction,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Txt title>{t('مجموع المنتجات', 'Items subtotal')}</Txt>
            <Money value={cart.subtotal} currency={currency} />
          </View>

          <Txt muted>
            {t(
              'يؤكد الخادم المبلغ النهائي عند الدفع. تتم عملية دفع مستقلة لكل متجر، ولا نضيف رسوم توصيل أو ضرائب تقديرية هنا.',
              'The server confirms the final amount at checkout. Each store has a separate checkout; delivery fees and taxes are not estimated here.',
            )}
          </Txt>

          {!session?.user.email_verified && (
            <View
              style={{
                padding: 12,
                borderRadius: 14,
                backgroundColor: colors.primarySoft,
              }}
            >
              <Txt muted>
                {t(
                  'وثّق بريدك الإلكتروني من صفحة الحساب قبل إتمام الدفع.',
                  'Verify your email from the account screen before checkout.',
                )}
              </Txt>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function formatOrderDate(value: string | null, locale: string) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function OrderStatusBadge({
  value,
  arabic,
}: {
  value: string;
  arabic: boolean;
}) {
  const success = ['paid', 'completed', 'fulfilled', 'delivered'].includes(value);
  const danger = ['cancelled', 'expired', 'unpaid', 'failed'].includes(value);

  const background = success
    ? '#E8F5EE'
    : danger
      ? '#FCECEC'
      : colors.primarySoft;

  const foreground = success
    ? '#23734D'
    : danger
      ? colors.red
      : colors.primary;

  return (
    <View
      accessible
      accessibilityLabel={statusLabel(value, arabic)}
      style={{
        backgroundColor: background,
        borderRadius: 12,
        paddingHorizontal: 11,
        paddingVertical: 7,
      }}
    >
      <Text style={{ color: foreground, fontSize: 11, fontWeight: '900' }}>
        {statusLabel(value, arabic)}
      </Text>
    </View>
  );
}

function addressFieldLabel(key: string, arabic: boolean) {
  const labels: Record<string, [string, string]> = {
    recipient_name: ['اسم المستلم', 'Recipient name'],
    recipient_phone: ['هاتف المستلم', 'Recipient phone'],
    emirate: ['الإمارة', 'Emirate'],
    city: ['المدينة', 'City'],
    area: ['المنطقة', 'Area'],
    address_line: ['العنوان', 'Address'],
    building: ['المبنى', 'Building'],
    unit: ['الوحدة', 'Unit'],
  };

  const label = labels[key];
  return label ? label[arabic ? 0 : 1] : key;
}

export function OrdersScreen({
  open,
  discover,
}: {
  open: (id: number) => void;
  discover: () => void;
}) {
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
        .then((reply) => {
          if (active) setResult(reply);
        })
        .catch((requestError) => {
          if (active) setError(requestError);
        })
        .finally(() => {
          if (active) setBusy(false);
        });

      return () => {
        active = false;
      };
    // `reload` intentionally retriggers this focus effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, page, reload, locale, session, checked]),
  );

  const direction = locale === 'ar' ? 'row-reverse' : 'row';

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Txt title>{t('طلباتي', 'My orders')}</Txt>
        <Txt muted>
          {t(
            'تابع مشترياتك وحالة الدفع والتوصيل من مكان واحد.',
            'Follow your purchases, payment status and delivery in one place.',
          )}
        </Txt>
      </View>

      <ErrorText error={error} />

      {busy && <Busy />}

      <View style={{ flexDirection: direction }}>
        <View style={{ flex: 1 }}>
          <Button
            label={t('تحديث الطلبات', 'Refresh orders')}
            secondary
            disabled={busy || !checked}
            onPress={() => setReload((value) => value + 1)}
          />
        </View>
      </View>

      {result && (
        <Txt muted>
          {t(
            `${result.meta.total} طلب في حسابك`,
            `${result.meta.total} orders in your account`,
          )}
        </Txt>
      )}

      {result?.data.map((order) => {
        const shopName = order.shop
          ? locale === 'ar'
            ? order.shop.name_ar || order.shop.name
            : order.shop.name
          : t('متجر', 'Store');

        return (
          <View key={order.id} style={[styles.card, { padding: 16, gap: 14 }]}>
            <View
              style={{
                flexDirection: direction,
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: colors.ink,
                    fontSize: 15,
                    fontWeight: '900',
                    textAlign: locale === 'ar' ? 'right' : 'left',
                  }}
                >
                  {order.order_number}
                </Text>

                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 11,
                    textAlign: locale === 'ar' ? 'right' : 'left',
                  }}
                >
                  {formatOrderDate(order.created_at, locale)}
                </Text>
              </View>

              <View
                style={{
                  width: 49,
                  height: 49,
                  borderRadius: 15,
                  overflow: 'hidden',
                  backgroundColor: colors.paper,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {order.shop?.logo_url ? (
                  <Photo uri={order.shop.logo_url} height={49} />
                ) : (
                  <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '900' }}>
                    م
                  </Text>
                )}
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <Txt title>{shopName}</Txt>
              {order.shop?.verified && (
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 10,
                    fontWeight: '800',
                    textAlign: locale === 'ar' ? 'right' : 'left',
                  }}
                >
                  {t('متجر موثّق', 'Verified store')}
                </Text>
              )}
            </View>

            <View
              style={{
                flexDirection: direction,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <OrderStatusBadge
                value={order.payment_status}
                arabic={locale === 'ar'}
              />
              <OrderStatusBadge
                value={order.status}
                arabic={locale === 'ar'}
              />
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: colors.line,
              }}
            />

            <View
              style={{
                flexDirection: direction,
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Txt muted>{t('إجمالي الطلب', 'Order total')}</Txt>
                <Money value={order.total} currency={order.currency} />
              </View>

              <View style={{ minWidth: 138 }}>
                <Button
                  label={t('عرض التفاصيل', 'View details')}
                  secondary
                  onPress={() => open(order.id)}
                />
              </View>
            </View>
          </View>
        );
      })}

      {result?.data.length === 0 && (
        <View
          style={[
            styles.card,
            {
              alignItems: 'center',
              paddingVertical: 28,
              paddingHorizontal: 20,
              gap: 13,
            },
          ]}
        >
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 23,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 32, fontWeight: '900' }}>
              م
            </Text>
          </View>

          <Txt title>{t('لا توجد طلبات حتى الآن', 'No orders yet')}</Txt>

          <Txt muted>
            {t(
              'عندما تشتري من أحد المتاجر ستظهر تفاصيل طلبك هنا.',
              'Your order details will appear here after your first purchase.',
            )}
          </Txt>

          <Button
            label={t('اكتشف المنتجات والمتاجر', 'Explore products and stores')}
            onPress={discover}
          />
        </View>
      )}

      {result && result.meta.last_page > 1 && (
        <View
          style={{
            flexDirection: direction,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Button
              secondary
              label={t('السابق', 'Previous')}
              disabled={busy || page <= 1}
              onPress={() => setPage((value) => value - 1)}
            />
          </View>

          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800' }}>
            {result.meta.current_page} / {result.meta.last_page}
          </Text>

          <View style={{ flex: 1 }}>
            <Button
              secondary
              label={t('التالي', 'Next')}
              disabled={busy || page >= result.meta.last_page}
              onPress={() => setPage((value) => value + 1)}
            />
          </View>
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
  const direction = locale === 'ar' ? 'row-reverse' : 'row';

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!session || !checked) return;

      setBusy(true);
      setError(null);

      void api
        .request<{ data: Order }>(`/orders/${id}`, session.token, locale)
        .then((reply) => {
          if (active) setOrder(reply.data);
        })
        .catch((requestError) => {
          if (active) setError(requestError);
        })
        .finally(() => {
          if (active) setBusy(false);
        });

      return () => {
        active = false;
      };
    // `reload` intentionally retriggers this focus effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, id, reload, locale, session, checked]),
  );

  const shopName = order?.shop
    ? locale === 'ar'
      ? order.shop.name_ar || order.shop.name
      : order.shop.name
    : null;

  const trackingUrl = httpsUrl(order?.delivery?.tracking_url);

  return (
    <View style={{ gap: 17 }}>
      <View style={{ gap: 5 }}>
        <Txt title>{t('تفاصيل الطلب', 'Order details')}</Txt>
        {order && <Txt muted>{formatOrderDate(order.created_at, locale)}</Txt>}
      </View>

      <ErrorText error={error} />

      {busy && <Busy />}

      <Button
        label={t('تحديث حالة الطلب', 'Refresh order status')}
        secondary
        disabled={busy || !checked}
        onPress={() => setReload((value) => value + 1)}
      />

      {order && (
        <>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.ink,
                borderColor: colors.ink,
                padding: 19,
                gap: 12,
              },
            ]}
          >
            <Text
              style={{
                color: '#FF9B76',
                fontSize: 11,
                fontWeight: '900',
                textAlign: locale === 'ar' ? 'right' : 'left',
              }}
            >
              murwaj.com
            </Text>

            <Text
              style={{
                color: colors.white,
                fontSize: 20,
                fontWeight: '900',
                textAlign: locale === 'ar' ? 'right' : 'left',
              }}
            >
              {order.order_number}
            </Text>

            {shopName && (
              <Text
                style={{
                  color: '#E8DED8',
                  fontSize: 13,
                  textAlign: locale === 'ar' ? 'right' : 'left',
                }}
              >
                {shopName}
              </Text>
            )}

            <View
              style={{
                flexDirection: direction,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <OrderStatusBadge
                value={order.payment_status}
                arabic={locale === 'ar'}
              />
              <OrderStatusBadge
                value={order.status}
                arabic={locale === 'ar'}
              />
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: '#554841',
              }}
            />

            <Text
              style={{
                color: '#E8DED8',
                fontSize: 11,
                fontWeight: '700',
                textAlign: locale === 'ar' ? 'right' : 'left',
              }}
            >
              {t('إجمالي الطلب', 'Order total')}
            </Text>

            <Text
              style={{
                color: colors.white,
                fontSize: 22,
                fontWeight: '900',
                textAlign: locale === 'ar' ? 'right' : 'left',
              }}
            >
              {order.total} {order.currency ?? ''}
            </Text>
          </View>

          {!!order.items?.length && (
            <View style={[styles.card, { gap: 14 }]}>
              <Txt title>{t('منتجات الطلب', 'Order items')}</Txt>

              {order.items.map((item, index) => (
                <View key={item.id} style={{ gap: 11 }}>
                  {index > 0 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: colors.line,
                      }}
                    />
                  )}

                  <View
                    style={{
                      flexDirection: direction,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1, gap: 5 }}>
                      <Text
                        style={{
                          color: colors.ink,
                          fontSize: 13,
                          lineHeight: 19,
                          fontWeight: '800',
                          textAlign: locale === 'ar' ? 'right' : 'left',
                        }}
                      >
                        {item.title}
                      </Text>

                      <Text
                        style={{
                          color: colors.muted,
                          fontSize: 11,
                          textAlign: locale === 'ar' ? 'right' : 'left',
                        }}
                      >
                        {t('الكمية', 'Quantity')}: {item.quantity}
                      </Text>
                    </View>

                    <Money value={item.total} currency={order.currency} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {order.shipping_address && (
            <View style={[styles.card, { gap: 13 }]}>
              <Txt title>{t('عنوان التوصيل', 'Delivery address')}</Txt>

              {Object.entries(order.shipping_address)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <View
                    key={key}
                    style={{
                      flexDirection: direction,
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 14,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Txt muted>{addressFieldLabel(key, locale === 'ar')}</Txt>
                    </View>

                    <View style={{ flex: 1.5 }}>
                      <Text
                        style={{
                          color: colors.ink,
                          fontSize: 13,
                          lineHeight: 20,
                          textAlign: locale === 'ar' ? 'right' : 'left',
                        }}
                      >
                        {value}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          )}

          <View style={[styles.card, { gap: 13 }]}>
            <View
              style={{
                flexDirection: direction,
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <Txt title>{t('توصيل رسلو', 'Raslo delivery')}</Txt>

              <View
                style={{
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: colors.primarySoft,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900' }}>
                  {order.delivery
                    ? t('بيانات الشحنة', 'Shipment details')
                    : t('بانتظار الشحنة', 'Awaiting shipment')}
                </Text>
              </View>
            </View>

            {order.delivery ? (
              <>
                <View style={{ gap: 5 }}>
                  <Txt muted>{t('حالة التوصيل', 'Delivery status')}</Txt>
                  <Txt>{order.delivery.status_label}</Txt>
                </View>

                {order.delivery.tracking_number && (
                  <View style={{ gap: 5 }}>
                    <Txt muted>{t('رقم التتبع', 'Tracking number')}</Txt>
                    <Text
                      selectable
                      style={{
                        color: colors.ink,
                        fontSize: 14,
                        fontWeight: '900',
                        textAlign: locale === 'ar' ? 'right' : 'left',
                      }}
                    >
                      {order.delivery.tracking_number}
                    </Text>
                  </View>
                )}

                {order.delivery.updated_at && (
                  <View style={{ gap: 5 }}>
                    <Txt muted>{t('آخر تحديث', 'Last updated')}</Txt>
                    <Txt>{formatOrderDate(order.delivery.updated_at, locale)}</Txt>
                  </View>
                )}

                {trackingUrl && (
                  <Button
                    secondary
                    label={t('تتبع الشحنة', 'Track shipment')}
                    onPress={() => {
                      void WebBrowser.openBrowserAsync(trackingUrl).catch(setError);
                    }}
                  />
                )}
              </>
            ) : (
              <Txt muted>
                {t(
                  'لم تُسجّل بيانات شحنة لهذا الطلب حتى الآن. ستظهر معلومات التوصيل هنا عند توفرها.',
                  'No shipment information is linked to this order yet. Delivery details will appear here when available.',
                )}
              </Txt>
            )}
          </View>

          {order.payment_status === 'pending' && (
            <View style={[styles.card, { gap: 12 }]}>
              <Txt title>{t('استكمال الدفع', 'Complete payment')}</Txt>

              <Txt muted>
                {t(
                  'يمكنك استعادة محاولة الدفع المحفوظة على هذا الجهاز بدل إنشاء محاولة جديدة.',
                  'Recover the checkout attempt saved on this device instead of creating a new one.',
                )}
              </Txt>

              <Button
                label={t('استعادة الدفع المحفوظ', 'Recover saved checkout')}
                onPress={recover}
              />
            </View>
          )}
        </>
      )}

      {!order && !busy && !error && (
        <Txt muted>
          {t('تعذر تحميل تفاصيل الطلب حاليًا.', 'Order details are not available right now.')}
        </Txt>
      )}
    </View>
  );
}
