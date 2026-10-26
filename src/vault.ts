import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Vault } from './core/session';
export const native = Platform.OS !== 'web';
// Web is deliberately guest-only: never persist native bearer tokens in a browser.
export const vault: Vault = {
  get: (key) => (native ? SecureStore.getItemAsync(`murwaj.${key}`) : Promise.resolve(null)),
  set: (key, value) =>
    native
      ? SecureStore.setItemAsync(`murwaj.${key}`, value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        })
      : Promise.reject(new Error('Native authentication only')),
  remove: (key) => (native ? SecureStore.deleteItemAsync(`murwaj.${key}`) : Promise.resolve()),
};
