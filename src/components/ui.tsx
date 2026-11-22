import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import { useApp } from '../session-context';
import { ApiError, resolveMediaUrl } from '../core/api';
export const colors = {
  ink: '#211A16',
  muted: '#81756E',
  green: '#FF5517',
  primary: '#FF5517',
  primarySoft: '#FFF0E9',
  lime: '#FFF0E9',
  paper: '#FAF7F3',
  white: '#FFFFFF',
  line: '#EFE7E1',
  red: '#A43737',
};

export const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 21,
    paddingBottom: 52,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  card: {
    padding: 17,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 13,
    shadowColor: colors.ink,
    shadowOpacity: 0.045,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  hero: {
    padding: 25,
    borderRadius: 26,
    backgroundColor: colors.ink,
    gap: 13,
  },
  heading: {
    fontSize: 29,
    fontWeight: '900',
    color: colors.ink,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.ink,
    lineHeight: 27,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.ink,
  },
  muted: {
    fontSize: 13,
    lineHeight: 21,
    color: colors.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 15,
    backgroundColor: colors.white,
    fontSize: 16,
    color: colors.ink,
    minHeight: 52,
  },
  image: {
    width: '100%',
    height: 190,
    borderRadius: 18,
    backgroundColor: colors.paper,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 51,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  error: {
    color: colors.red,
    fontSize: 14,
    lineHeight: 23,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
  },
  label: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },
});

export function useText() {
  const { locale } = useApp();
  return (ar: string, en: string) => (locale === 'ar' ? ar : en);
}
export function Txt({
  children,
  muted = false,
  title = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
  title?: boolean;
}) {
  const { locale } = useApp();
  return (
    <Text
      style={[
        title ? styles.title : muted ? styles.muted : styles.text,
        {
          textAlign: locale === 'ar' ? 'right' : 'left',
          writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
        },
      ]}
    >
      {children}
    </Text>
  );
}
export function Button({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text
        style={{
          fontWeight: '700',
          color: secondary ? colors.ink : '#FFF',
          fontSize: 15,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { locale } = useApp();
  return (
    <View style={{ gap: 6 }}>
      <Txt muted>{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, { textAlign: locale === 'ar' ? 'right' : 'left' }, props.style]}
      />
    </View>
  );
}
export function Photo({
  uri,
  height,
}: {
  uri?: string | null;
  height?: number;
}) {
  const { api } = useApp();
  const [failedImageUri, setFailedImageUri] = useState<string | null>(null);
  const imageUri = resolveMediaUrl(uri, api.origin);
  const imageStyle = height ? [styles.image, { height }] : styles.image;

  return imageUri && failedImageUri !== imageUri ? (
    <Image
      accessibilityIgnoresInvertColors
      source={{ uri: imageUri }}
      style={imageStyle}
      resizeMode="cover"
      onError={() => setFailedImageUri(imageUri)}
    />
  ) : (
    <View
      style={[
        imageStyle,
        { alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <Text style={{ fontSize: 38, color: colors.green, fontWeight: '900' }}>م</Text>
    </View>
  );
}

export function Busy() {
  return (
    <ActivityIndicator accessibilityLabel="Loading" color={colors.green} style={{ padding: 24 }} />
  );
}
export function ErrorText({ error }: { error: unknown }) {
  const t = useText();
  if (!error) return null;
  let text = t(
    'تعذّر الاتصال. حدّث البيانات قبل إعادة أي إضافة للسلة.',
    'Connection failed. Refresh before retrying a cart addition.',
  );
  if (error instanceof ApiError) {
    text =
      error.status === 429
        ? t(
            `طلبات كثيرة؛ انتظر ${error.retryAfter || 60} ثانية.`,
            `Too many requests; wait ${error.retryAfter || 60} seconds.`,
          )
        : error.status === 401
          ? t('انتهت الجلسة. سجّل الدخول مجددًا.', 'Session expired. Sign in again.')
          : error.status === 403
            ? t(
                'تحقق من البريد وصلاحية الحساب قبل المتابعة.',
                'Verify your email and account access before continuing.',
              )
            : error.status === 404
              ? t('العنصر غير متاح لهذا الحساب.', 'This resource is unavailable for this account.')
              : error.status === 503
                ? t(
                    'خدمة الدفع غير متاحة. استعد المحاولة الأصلية؛ لا تنشئ دفعًا جديدًا.',
                    'Payment service unavailable. Recover the original attempt; do not create another payment.',
                  )
                : error.message;
    const details = Object.values(error.errors)
      .flat()
      .filter((x) => typeof x === 'string')
      .join('\n');
    if (details) text += '\n' + details;
  } else if (
    error instanceof Error &&
    error.message &&
    !(error instanceof TypeError) &&
    error.name !== 'AbortError'
  )
    text = error.message;
  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {text}
    </Text>
  );
}
export function Money({
  value,
  currency,
}: {
  value: string | null | undefined;
  currency?: string | null;
}) {
  return (
    <Txt>
      {value ?? '—'} {currency ?? ''}
    </Txt>
  );
}
