import { router } from 'expo-router';
export const nav = {
  product: (slug: string) => router.push({ pathname: '/product/[slug]', params: { slug } }),
  shop: (slug: string) =>
    slug.startsWith('list:')
      ? router.push({ pathname: '/store-products/[slug]', params: { slug: slug.slice(5) } })
      : router.push({ pathname: '/store/[slug]', params: { slug } }),
  account: () => router.navigate('/account'),
  cart: () => router.navigate('/cart'),
};
