import type { Product, Shop } from './types';

export type AsyncKeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

export const FAVORITES_STORAGE_KEY = '@murwaj/favorites/v1';
const MAX_FAVORITES = 1000;

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function compactShop(shop: Shop | null | undefined): Shop | null {
  if (!shop) return null;
  return {
    id: shop.id,
    slug: shop.slug,
    name: shop.name,
    ...(shop.name_ar ? { name_ar: shop.name_ar } : {}),
    ...(shop.logo_url ? { logo_url: shop.logo_url } : {}),
    ...(typeof shop.verified === 'boolean' ? { verified: shop.verified } : {}),
    ...(typeof shop.rating === 'number' ? { rating: shop.rating } : {}),
  };
}

/** Keep only fields needed for a saved-item card and reopening its product route. */
export function compactFavoriteProduct(product: Product): Product {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    ...(product.title_ar ? { title_ar: product.title_ar } : {}),
    price: product.price,
    currency: product.currency,
    quantity: Number.isFinite(product.quantity) ? product.quantity : 0,
    ...(product.image_url ? { image_url: product.image_url } : {}),
    ...(product.image_urls?.length
      ? { image_urls: product.image_urls.filter(Boolean).slice(0, 3) }
      : {}),
    ...(typeof product.rating === 'number' && Number.isFinite(product.rating)
      ? { rating: product.rating }
      : {}),
    shop: compactShop(product.shop),
  };
}

function parseFavorite(value: unknown): Product | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Product>;

  if (
    !Number.isSafeInteger(item.id) ||
    (item.id ?? 0) < 1 ||
    typeof item.slug !== 'string' ||
    !item.slug.trim() ||
    typeof item.title !== 'string' ||
    typeof item.price !== 'string' ||
    typeof item.currency !== 'string'
  ) return null;

  const shopValue = item.shop;
  let shop: Shop | null = null;
  if (
    shopValue &&
    Number.isSafeInteger(shopValue.id) &&
    shopValue.id > 0 &&
    typeof shopValue.slug === 'string' &&
    typeof shopValue.name === 'string'
  ) shop = compactShop(shopValue);

  return compactFavoriteProduct({
    id: item.id!,
    slug: item.slug,
    title: item.title,
    title_ar: optionalString(item.title_ar),
    price: item.price,
    currency: item.currency,
    quantity: typeof item.quantity === 'number' && Number.isFinite(item.quantity)
      ? item.quantity
      : 0,
    image_url: optionalString(item.image_url),
    image_urls: Array.isArray(item.image_urls)
      ? item.image_urls.filter((uri): uri is string => typeof uri === 'string').slice(0, 3)
      : [],
    rating: typeof item.rating === 'number' && Number.isFinite(item.rating)
      ? item.rating
      : null,
    shop,
  });
}

function uniqueProducts(products: Product[]): Product[] {
  const unique = new Map<number, Product>();
  for (const product of products) {
    const compact = parseFavorite(product);
    if (compact) unique.set(compact.id, compact);
  }
  return [...unique.values()].slice(0, MAX_FAVORITES);
}

export class FavoritesRepository {
  constructor(
    private readonly storage: AsyncKeyValueStorage,
    private readonly key = FAVORITES_STORAGE_KEY,
  ) {}

  async load(): Promise<Product[]> {
    const raw = await this.storage.getItem(this.key);
    if (!raw) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      await this.storage.removeItem(this.key);
      return [];
    }

    if (!Array.isArray(parsed)) {
      await this.storage.removeItem(this.key);
      return [];
    }
    return uniqueProducts(parsed as Product[]);
  }

  async save(products: Product[]): Promise<void> {
    await this.storage.setItem(this.key, JSON.stringify(uniqueProducts(products)));
  }
}
