import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { SymbolView } from 'expo-symbols';
import type { Product } from '../core/types';
import { useFavorites } from '../favorites-context';
import { colors, useText } from './ui';

export function FavoriteButton({
  product,
  style,
  size = 18,
}: {
  product: Product;
  style?: ViewStyle;
  size?: number;
}) {
  const t = useText();
  const { ready, isFavorite, toggleFavorite } = useFavorites();
  const selected = isFavorite(product.id);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        selected
          ? t('إزالة من المفضلة', 'Remove from favourites')
          : t('إضافة إلى المفضلة', 'Add to favourites')
      }
      accessibilityState={{ selected, disabled: !ready }}
      disabled={!ready}
      onPress={(event) => {
        event.stopPropagation();
        toggleFavorite(product);
      }}
      style={({ pressed }) => [
        {
          width: 38,
          height: 38,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderWidth: 1,
          borderColor: selected ? '#FFD9D0' : 'rgba(33,26,22,0.06)',
          opacity: !ready ? 0.55 : pressed ? 0.78 : 1,
          shadowColor: colors.ink,
          shadowOpacity: 0.08,
          shadowRadius: 9,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
        },
        style,
      ]}
    >
      <SymbolView
        name={
          selected
            ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
            : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
        }
        tintColor={selected ? colors.primary : colors.ink}
        size={size}
      />
    </Pressable>
  );
}
