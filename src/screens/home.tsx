import React from 'react';
import { ImageBackground, ScrollView, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { httpsUrl } from '../core/api';

import { useApp } from '../session-context';
import { usePublicQuery } from '../use-public-query';
import {
  Button,
  Busy,
  ErrorText,
  Photo,
  styles,
  Txt,
  useText,
} from '../components/ui';
import { Catalog, ProductCard } from './catalog';
import type {
  MobileHomeCatalogSection,
  MobileHomeCategory,
  MobileHomeReply,
  MobileHomeSection,
  Product,
  Shop,
} from '../core/types';
import { nav } from '../navigation';

export function HomeScreen() {
  const t = useText();

  const {
    data,
    error,
    busy,
    retry,
  } = usePublicQuery<MobileHomeReply>('/mobile/home');

  const sections = data?.data?.sections ?? [];

  const homeContent = (
    <View style={{ gap: 20 }}>
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

      {sections.map((section) => (
        <HomeSection
          key={section.id ?? `${section.type}-${section.position}`}
          section={section}
        />
      ))}
    </View>
  );

  // Catalog remains the main list and retains its existing search,
  // pagination, product navigation and fallback behavior.
  return <Catalog nav={nav} homeContent={homeContent} />;
}

function HomeSection({ section }: { section: MobileHomeSection }) {
  const { locale } = useApp();
  const t = useText();

  const title =
    locale === 'ar'
      ? section.title_ar || section.title
      : section.title || section.title_ar;

  const items = section.items ?? [];


  if (section.type === 'banner') {
    const imageUrl =
      typeof section.image === 'string' && /^https?:\/\//i.test(section.image.trim())
        ? section.image.trim()
        : null;

    const content =
      locale === 'ar'
        ? section.content_ar || section.content
        : section.content || section.content_ar;

    const buttonText =
      locale === 'ar'
        ? section.button_text_ar || section.button_text
        : section.button_text || section.button_text_ar;

    const buttonUrl = httpsUrl(section.button_url);

    const bannerContent = (
      <View
        style={{
          padding: 22,
          gap: 12,
          backgroundColor: 'rgba(24, 18, 15, 0.48)',
        }}
      >
        {!!title && (
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 25,
              lineHeight: 33,
              fontWeight: '800',
              textAlign: locale === 'ar' ? 'right' : 'left',
              writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
            }}
          >
            {title}
          </Text>
        )}

        {!!content && (
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 15,
              lineHeight: 24,
              textAlign: locale === 'ar' ? 'right' : 'left',
              writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
            }}
          >
            {content}
          </Text>
        )}

        {!!buttonText && !!buttonUrl && (
          <Button
            label={buttonText}
            onPress={() => void WebBrowser.openBrowserAsync(buttonUrl)}
          />
        )}
      </View>
    );

    const bannerFrame = {
      minHeight: 225,
      justifyContent: 'flex-end' as const,
      overflow: 'hidden' as const,
      backgroundColor: '#FF5517',
    };

    return (
      <View
        style={{
          borderRadius: 22,
          overflow: 'hidden',
          backgroundColor: '#FF5517',
        }}
      >
        {imageUrl ? (
          <ImageBackground
            source={{ uri: imageUrl }}
            resizeMode="cover"
            style={bannerFrame}
            imageStyle={{ borderRadius: 22 }}
          >
            {bannerContent}
          </ImageBackground>
        ) : (
          <View style={bannerFrame}>
            {bannerContent}
          </View>
        )}
      </View>
    );
  }

  if (section.type === 'editorial') {
    const content =
      locale === 'ar'
        ? section.content_ar || section.content
        : section.content || section.content_ar;

    const buttonText =
      locale === 'ar'
        ? section.button_text_ar || section.button_text
        : section.button_text || section.button_text_ar;

    const buttonUrl = section.button_url;

    return (
      <View style={styles.card}>
        {!!title && <Txt title>{title}</Txt>}
        {!!content && <Txt>{content}</Txt>}

        {!!buttonText && !!buttonUrl && /^https:\/\//i.test(buttonUrl) && (
          <Button
            label={buttonText}
            onPress={() => void WebBrowser.openBrowserAsync(buttonUrl)}
          />
        )}
      </View>
    );
  }

  if (items.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      {!!title && <Txt title>{title}</Txt>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingRight: 4 }}
      >
        {items.map((item, index) => {
          const key = `${section.type}-${item.id}-${index}`;

          if (
            section.type === 'products_latest' ||
            section.type === 'products_featured' ||
            section.type === 'products_selected'
          ) {
            const product = item as Product;

            return (
              <View key={key} style={{ width: 245 }}>
                <ProductCard
                  product={product}
                  onPress={() => nav.product(product.slug)}
                />
              </View>
            );
          }

          if (
            section.type === 'shops_latest' ||
            section.type === 'shops_selected'
          ) {
            const shop = item as Shop;

            return (
              <View key={key} style={[styles.card, { width: 220 }]}>
                <Photo uri={shop.logo_url || shop.banner_url} />

                <Txt title>
                  {locale === 'ar'
                    ? shop.name_ar || shop.name
                    : shop.name}
                </Txt>

                <Txt muted>
                  {shop.verified
                    ? t('متجر موثّق', 'Verified store')
                    : t('متجر مستقل', 'Independent store')}
                </Txt>

                <Button
                  label={t('زيارة المتجر', 'Visit store')}
                  secondary
                  onPress={() => nav.shop(shop.slug)}
                />
              </View>
            );
          }

          if (section.type === 'categories') {
            const category = item as MobileHomeCategory;

            return (
              <View key={key} style={[styles.card, { width: 165 }]}>
                <Photo uri={category.image} />
                <Txt title>
                  {locale === 'ar'
                    ? category.name_ar || category.name
                    : category.name}
                </Txt>
              </View>
            );
          }

          const catalogSection = item as MobileHomeCatalogSection;

          return (
            <View key={key} style={[styles.card, { width: 165 }]}>
              <Photo uri={catalogSection.image} />
              <Txt title>
                {locale === 'ar'
                  ? catalogSection.name_ar || catalogSection.name
                  : catalogSection.name}
              </Txt>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
