import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useApp } from '../session-context';
import { useFavorites } from '../favorites-context';
import { Button, Busy, colors, ErrorText, Money, Photo, styles, Txt, useText } from '../components/ui';
import type { Product } from '../core/types';

export function FavoritesScreen() {
  const { locale } = useApp();
  const t = useText();
  const { favorites, ready, storageError, removeFavorite } = useFavorites();

  const header = (
    <View style={{ gap: 16, marginBottom: 18 }}>
      <View style={{ backgroundColor: colors.ink, padding: 21, borderRadius: 25, gap: 14 }}>
        <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,85,23,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
            <SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} tintColor="#FF9B76" size={26} />
          </View>
          <View style={{ minWidth: 54, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '900' }}>{favorites.length}</Text>
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 24, lineHeight: 33, fontWeight: '900', textAlign: locale === 'ar' ? 'right' : 'left', writingDirection: locale === 'ar' ? 'rtl' : 'ltr' }}>
            {t('أشياء أحببتها', 'Saved for later')}
          </Text>
          <Text style={{ color: '#E8DED8', fontSize: 13, lineHeight: 21, textAlign: locale === 'ar' ? 'right' : 'left', writingDirection: locale === 'ar' ? 'rtl' : 'ltr' }}>
            {t('اجمع المنتجات التي لفتت انتباهك وارجع إليها وقتما تشاء.', 'Keep the products you love together and come back whenever you like.')}
          </Text>
        </View>

        <View style={{ alignSelf: locale === 'ar' ? 'flex-end' : 'flex-start', flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <SymbolView name={{ ios: 'iphone', android: 'smartphone', web: 'smartphone' }} tintColor="#FFB79C" size={14} />
          <Text style={{ color: '#F2E7E1', fontSize: 11, fontWeight: '700' }}>{t('محفوظة على هذا الجهاز', 'Saved on this device')}</Text>
        </View>
      </View>

      <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Txt title>{t('قائمة المفضلة', 'Your favourites')}</Txt>
          <Txt muted>{String(favorites.length) + ' ' + t('منتج محفوظ', 'saved items')}</Txt>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('استكشاف المنتجات', 'Explore products')} onPress={() => router.push('/search')} style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: colors.primarySoft }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '900' }}>{t('اكتشف المزيد', 'Discover more')}</Text>
          <SymbolView name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }} tintColor={colors.primary} size={13} />
        </Pressable>
      </View>
      <ErrorText error={storageError} />
    </View>
  );

  return (
    <FlatList
      data={favorites}
      numColumns={2}
      keyExtractor={(item) => String(item.id)}
      columnWrapperStyle={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', gap: 12 }}
      contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 18, paddingBottom: 38, flexGrow: 1 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <FavoriteCard product={item} onOpen={() => router.push({ pathname: '/product/[slug]', params: { slug: item.slug } })} onRemove={() => removeFavorite(item.id)} />
      )}
      ListEmptyComponent={
        !ready ? <Busy /> : (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 30, gap: 13, marginTop: 3 }]}>
            <View style={{ width: 82, height: 82, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <SymbolView name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} tintColor={colors.primary} size={39} />
            </View>
            <View style={{ alignItems: 'center', gap: 5 }}>
              <Txt title>{t('لم تحفظ أي منتج بعد', 'No saved products yet')}</Txt>
              <Txt muted>{t('اضغط على القلب في أي منتج ليظهر هنا وتتمكن من الرجوع إليه بسهولة.', 'Tap the heart on any product and it will appear here for easy access.')}</Txt>
            </View>
            <Button label={t('ابدأ استكشاف المنتجات', 'Explore products')} onPress={() => router.push('/search')} />
          </View>
        )
      }
    />
  );
}

function FavoriteCard({ product, onOpen, onRemove }: { product: Product; onOpen: () => void; onRemove: () => void }) {
  const { locale } = useApp();
  const t = useText();

  return (
    <View style={[styles.card, { flex: 1, minWidth: 0, padding: 10, gap: 9, borderRadius: 21 }]}>
      <View style={{ position: 'relative' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('عرض المنتج', 'View product')} onPress={onOpen}>
          <Photo uri={product.image_url} height={137} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('إزالة من المفضلة', 'Remove from favourites')} onPress={onRemove} style={({ pressed }) => ({
          position: 'absolute',
          top: 8,
          [locale === 'ar' ? 'right' : 'left']: 8,
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderWidth: 1,
          borderColor: 'rgba(33,26,22,0.06)',
          opacity: pressed ? 0.75 : 1,
        })}>
          <SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} tintColor={colors.primary} size={18} />
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" onPress={onOpen} style={{ gap: 4 }}>
        <Text numberOfLines={2} style={{ minHeight: 40, color: colors.ink, fontSize: 13, lineHeight: 20, fontWeight: '900', textAlign: locale === 'ar' ? 'right' : 'left', writingDirection: locale === 'ar' ? 'rtl' : 'ltr' }}>
          {locale === 'ar' ? product.title_ar || product.title : product.title}
        </Text>
        {!!product.shop?.name && (
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 10, textAlign: locale === 'ar' ? 'right' : 'left' }}>
            {locale === 'ar' ? product.shop.name_ar || product.shop.name : product.shop.name}
          </Text>
        )}
      </Pressable>

      <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <View style={{ flex: 1 }}>
          <Money value={product.price} currency={product.currency} />
        </View>
        <View style={{ width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
          <SymbolView name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }} tintColor={colors.primary} size={14} />
        </View>
      </View>
    </View>
  );
}
