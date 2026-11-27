import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FavoritesRepository, FAVORITES_STORAGE_KEY } from '../src/core/favorites.ts';
import type { Product } from '../src/core/types.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: async (key: string) => values.get(key) ?? null,
    setItem: async (key: string, value: string) => { values.set(key, value); },
    removeItem: async (key: string) => { values.delete(key); },
  };
}

const product: Product = {
  id: 7,
  slug: 'handmade-notebook',
  title: 'Handmade notebook',
  title_ar: 'دفتر يدوي',
  price: '45.00',
  currency: 'AED',
  quantity: 4,
  image_url: 'https://cdn.example.test/notebook.jpg',
  shop: { id: 3, slug: 'paper-shop', name: 'Paper Shop' },
};

test('favorites are stored locally and restored after repository recreation', async () => {
  const storage = memoryStorage();
  const first = new FavoritesRepository(storage);
  await first.save([product]);
  const second = new FavoritesRepository(storage);
  const restored = await second.load();

  assert.equal(storage.values.has(FAVORITES_STORAGE_KEY), true);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].id, product.id);
  assert.equal(restored[0].slug, product.slug);
  assert.deepEqual(restored[0].shop, product.shop);
});

test('favorites are deduplicated by product ID while preserving the newest copy', async () => {
  const repository = new FavoritesRepository(memoryStorage());
  const storage = memoryStorage();
  const repo = new FavoritesRepository(storage);
  await repo.save([product, { ...product, title: 'Updated title' }]);
  const restored = await repo.load();

  assert.equal(restored.length, 1);
  assert.equal(restored[0].title, 'Updated title');
  void repository;
});

test('invalid local JSON is safely cleared', async () => {
  const storage = memoryStorage({ [FAVORITES_STORAGE_KEY]: '{broken' });
  const repository = new FavoritesRepository(storage);

  assert.deepEqual(await repository.load(), []);
  assert.equal(storage.values.has(FAVORITES_STORAGE_KEY), false);
});

test('invalid product records are ignored', async () => {
  const storage = memoryStorage({
    [FAVORITES_STORAGE_KEY]: JSON.stringify([
      product,
      { id: 0, slug: '', title: 'Broken', price: '1', currency: 'AED' },
    ]),
  });
  const repository = new FavoritesRepository(storage);
  const restored = await repository.load();

  assert.deepEqual(restored.map((item) => item.id), [product.id]);
});
