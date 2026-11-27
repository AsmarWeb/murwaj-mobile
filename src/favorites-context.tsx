import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from './core/types';
import { FavoritesRepository, compactFavoriteProduct } from './core/favorites';

type FavoritesContextValue = {
  favorites: Product[];
  ready: boolean;
  storageError: unknown;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (product: Product) => void;
  removeFavorite: (productId: number) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const repository = new FavoritesRepository(AsyncStorage);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<unknown>(null);
  const favoritesRef = useRef<Product[]>([]);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    void repository
      .load()
      .then((items) => {
        if (!active) return;
        favoritesRef.current = items;
        setFavorites(items);
      })
      .catch((error) => {
        if (active) setStorageError(error);
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
      mounted.current = false;
    };
  }, []);

  const commit = useCallback((next: Product[]) => {
    favoritesRef.current = next;
    setFavorites(next);
    const task = writeQueue.current
      .then(() => repository.save(next))
      .then(() => {
        if (mounted.current) setStorageError(null);
      });
    writeQueue.current = task.catch((error) => {
      if (mounted.current) setStorageError(error);
    });
  }, []);

  const toggleFavorite = useCallback((product: Product) => {
    if (!ready) return;
    const current = favoritesRef.current;
    const exists = current.some((item) => item.id === product.id);
    const next = exists
      ? current.filter((item) => item.id !== product.id)
      : [compactFavoriteProduct(product), ...current];
    commit(next);
  }, [commit, ready]);

  const removeFavorite = useCallback((productId: number) => {
    if (!ready) return;
    commit(favoritesRef.current.filter((item) => item.id !== productId));
  }, [commit, ready]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((product) => product.id)),
    [favorites],
  );
  const isFavorite = useCallback(
    (productId: number) => favoriteIds.has(productId),
    [favoriteIds],
  );

  const value = useMemo(
    () => ({ favorites, ready, storageError, isFavorite, toggleFavorite, removeFavorite }),
    [favorites, ready, storageError, isFavorite, toggleFavorite, removeFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('useFavorites must be used inside FavoritesProvider');
  return value;
}
