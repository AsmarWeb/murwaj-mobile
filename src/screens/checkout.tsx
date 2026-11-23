import React, { useEffect, useState } from 'react';
import { Alert, AppState, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useApp } from '../session-context';
import { Button, Busy, ErrorText, Field, Money, styles, Txt, useText } from '../components/ui';
import { stripeUrl, terminal } from '../core/api';
import type { Address, CheckoutState } from '../core/types';
import type { CheckoutJournal } from '../core/checkout';
import { statusLabel } from './shopping';
const emirates = [
  ['dubai', 'دبي', 'Dubai'],
  ['abu_dhabi', 'أبوظبي', 'Abu Dhabi'],
  ['sharjah', 'الشارقة', 'Sharjah'],
  ['ajman', 'عجمان', 'Ajman'],
  ['umm_al_quwain', 'أم القيوين', 'Umm Al Quwain'],
  ['ras_al_khaimah', 'رأس الخيمة', 'Ras Al Khaimah'],
  ['fujairah', 'الفجيرة', 'Fujairah'],
];
export function CheckoutScreen({
  journal,
  shopId,
  order,
}: {
  journal: CheckoutJournal;
  shopId?: number;
  order: (id: number) => void;
}) {
  const { session, locale, checked } = useApp();
  const t = useText();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [state, setState] = useState<CheckoutState | null>(null);
  const [, setVersion] = useState(0);
  const [restored, setRestored] = useState(false);
  const [body, setBody] = useState<Address>({
    shop_id: shopId ?? 0,
    recipient_name: session?.user.name ?? '',
    recipient_phone: '',
    emirate: 'dubai',
    city: '',
    area: '',
    address_line: '',
    building: '',
    unit: '',
  });
  useEffect(() => {
    let active = true;
    void journal
      .restore()
      .then((a) => {
        if (active) {
          setState(a?.state ?? null);
          setRestored(true);
        }
      })
      .catch((e) => {
        if (active) setError(e);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [journal]);
  // Foregrounding can follow a browser dismissal or a verified web return; neither proves payment.
  useEffect(() => {
    const listener = AppState.addEventListener('change', (next) => {
      if (next === 'active' && checked && journal.attempt?.orderId && !journal.busy) {
        void journal
          .refresh()
          .then((s) => {
            setState(s);
            setVersion((x) => x + 1);
          })
          .catch(setError);
      }
    });
    return () => listener.remove();
  }, [journal, checked]);
  async function run(task: () => Promise<CheckoutState>) {
    if (busy || journal.busy || !checked) return;
    setBusy(true);
    setError(null);
    try {
      setState(await task());
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
      setVersion((x) => x + 1);
    }
  }
  async function openPayment() {
    const url = stripeUrl(state?.checkout_url ?? null);
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url);
      if (journal.attempt?.orderId && !journal.busy) await run(() => journal.refresh());
    } catch (e) {
      setError(e);
    }
  }
  const attempt = journal.attempt;
  const inExpoGo = Constants.executionEnvironment === 'storeClient';
  const fields: [keyof Omit<Address, 'shop_id' | 'emirate'>, string, string, number][] = [
    ['recipient_name', 'اسم المستلم', 'Recipient name', 80],
    ['recipient_phone', 'هاتف إماراتي', 'UAE phone', 20],
    ['city', 'المدينة', 'City', 60],
    ['area', 'المنطقة', 'Area', 60],
    ['address_line', 'الشارع والعنوان', 'Street address', 180],
    ['building', 'المبنى', 'Building', 60],
    ['unit', 'الوحدة (اختياري)', 'Unit (optional)', 30],
  ];
  return (
    <View style={{ gap: 16 }}>
      <Txt title>{t('إتمام الطلب', 'Checkout')}</Txt>
      <Txt muted>
        {t(
          'منتجات فعلية داخل الإمارات · الدفع بالدرهم',
          'Physical products in the UAE · AED checkout',
        )}
      </Txt>
      <ErrorText error={error} />
      {(!ready || busy) && <Busy />}
      {inExpoGo && (
        <Txt muted>
          {t(
            'عودة الدفع تحتاج Development Build برابط murwaj. التصفح متاح في Expo Go المتوافق.',
            'Payment return requires a Development Build with the murwaj scheme. Browsing works in compatible Expo Go.',
          )}
        </Txt>
      )}
      {!session?.user.email_verified && (
        <Txt>
          {t(
            'وثّق بريدك الإلكتروني ثم حدّث الحساب قبل الدفع.',
            'Verify your email and refresh the account before checkout.',
          )}
        </Txt>
      )}
      {attempt ? (
        <>
          <View style={styles.card}>
            <Txt title>{t('محاولة الدفع الأصلية', 'Original checkout attempt')}</Txt>
            <Txt muted>
              {t(
                'لن ننشئ محاولة جديدة عند فشل الاتصال. استعد هذه المحاولة أولًا.',
                'Connection errors keep the same attempt. Recover it before starting another.',
              )}
            </Txt>
            <Txt>
              {t('المتجر', 'Store')}: {attempt.body.shop_id}
            </Txt>
            {attempt.orderId && (
              <Txt>
                {t('رقم الطلب', 'Order ID')}: {attempt.orderId}
              </Txt>
            )}
            {state && (
              <>
                <Txt>
                  {statusLabel(state.payment_status, locale === 'ar')} ·{' '}
                  {statusLabel(state.checkout_state, locale === 'ar')}
                </Txt>
                <Money value={state.total} currency={state.currency} />
              </>
            )}
          </View>
          {!state || !terminal(state) ? (
            <>
              <Button
                disabled={busy || !checked}
                label={t('استعادة الدفع الأصلي', 'Recover original checkout')}
                onPress={() => void run(() => journal.recover())}
              />
              {attempt.orderId && (
                <>
                  <Button
                    disabled={busy || !checked}
                    secondary
                    label={t('التحقق من حالة الدفع', 'Check payment status')}
                    onPress={() => void run(() => journal.refresh())}
                  />
                  <Button
                    disabled={busy || !checked}
                    secondary
                    label={t('إلغاء محاولة الدفع', 'Cancel checkout attempt')}
                    onPress={() =>
                      Alert.alert(
                        t('إلغاء الدفع؟', 'Cancel checkout?'),
                        t(
                          'يؤكد الخادم الإلغاء قبل تحرير المخزون.',
                          'The server confirms expiry before releasing stock.',
                        ),
                        [
                          { text: t('رجوع', 'Back'), style: 'cancel' },
                          {
                            text: t('إلغاء المحاولة', 'Cancel checkout'),
                            style: 'destructive',
                            onPress: () => void run(() => journal.cancel()),
                          },
                        ],
                      )
                    }
                  />
                </>
              )}
            </>
          ) : (
            <Txt>
              {state.payment_status === 'paid'
                ? t('أكد الخادم إتمام الدفع.', 'The server confirmed payment.')
                : t('انتهت محاولة الدفع.', 'This checkout is closed.')}
            </Txt>
          )}
          {stripeUrl(state?.checkout_url ?? null) && !terminal(state!) && (
            <Button
              disabled={busy || inExpoGo || !checked}
              label={t('فتح صفحة Stripe الآمنة', 'Open secure Stripe checkout')}
              onPress={() => void openPayment()}
            />
          )}
          {attempt.orderId && (
            <Button
              secondary
              label={t('عرض الطلب', 'View order')}
              onPress={() => order(attempt.orderId!)}
            />
          )}
          {(attempt.rejected || (state && terminal(state))) && (
            <Button
              secondary
              disabled={busy}
              label={t('إغلاق المحاولة المحفوظة', 'Close saved attempt')}
              onPress={() => {
                void journal
                  .forgetFinished()
                  .then(() => {
                    setState(null);
                    setVersion((x) => x + 1);
                  })
                  .catch(setError);
              }}
            />
          )}
        </>
      ) : ready && restored && shopId ? (
        <>

          <View style={[styles.card, { gap: 12 }]}>
            <Txt title>{t('بيانات المستلم', 'Recipient details')}</Txt>
            <Txt muted>
              {t(
                'أدخل بيانات الشخص الذي سيستلم الطلب.',
                'Enter the details of the person receiving the order.',
              )}
            </Txt>

            {fields.slice(0, 2).map(([key, ar, en, max]) => (
              <Field
                key={key}
                label={t(ar, en)}
                value={body[key]}
                maxLength={max}
                onChangeText={(v) => setBody((x) => ({ ...x, [key]: v }))}
                keyboardType={key === 'recipient_phone' ? 'phone-pad' : 'default'}
              />
            ))}
          </View>

          <View style={[styles.card, { gap: 12 }]}>
            <Txt title>{t('عنوان التوصيل', 'Delivery address')}</Txt>
            <Txt muted>
              {t(
                'أدخل العنوان بالتفصيل لتسهيل توصيل طلبك.',
                'Enter a detailed address to help deliver your order.',
              )}
            </Txt>

            {fields.slice(2).map(([key, ar, en, max]) => (
              <Field
                key={key}
                label={t(ar, en)}
                value={body[key]}
                maxLength={max}
                onChangeText={(v) => setBody((x) => ({ ...x, [key]: v }))}
                keyboardType="default"
              />
            ))}

            <View style={{ gap: 9 }}>
              <Txt title>{t('الإمارة', 'Emirate')}</Txt>
              <Txt muted>
                {t('اختر الإمارة التي سيتم توصيل الطلب إليها.', 'Select the emirate for delivery.')}
              </Txt>
              <View style={styles.row}>
                {emirates.map(([id, ar, en]) => (
                  <Button
                    key={id}
                    secondary={body.emirate !== id}
                    label={t(ar, en)}
                    onPress={() => setBody((x) => ({ ...x, emirate: id }))}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.card, { gap: 12 }]}>
            <Txt title>{t('مراجعة وإتمام الدفع', 'Review and checkout')}</Txt>
            <Txt muted>
              {t(
                'ستُحفظ بيانات العنوان لاستعادة محاولة الدفع الأصلية عند انقطاع الاتصال. لا تغلق المحاولة أو تبدأ دفعًا آخر قبل التحقق من حالتها.',
                'Your address is saved to recover the original checkout if the connection drops. Do not replace the attempt before checking its status.',
              )}
            </Txt>
            <Button
              disabled={
                busy ||
                !checked ||
                !session?.user.email_verified ||
                inExpoGo ||
                fields.some(([k]) => k !== 'unit' && !body[k].trim())
              }
              label={t('إنشاء طلب الدفع', 'Create checkout')}
              onPress={() => void run(() => journal.start({ ...body, shop_id: shopId }))}
            />
          </View>

        </>
      ) : ready && restored ? (
        <Txt muted>
          {t(
            'لا توجد محاولة محفوظة. ابدأ الدفع من متجر في السلة.',
            'No saved attempt. Start checkout from a store in your basket.',
          )}
        </Txt>
      ) : null}
    </View>
  );
}
