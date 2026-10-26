import { normalizeOrigin } from './core/api';
const raw = process.env.EXPO_PUBLIC_API_ORIGIN ?? '';
let origin = '';
let problem = '';
try {
  origin = normalizeOrigin(raw, __DEV__ && process.env.EXPO_PUBLIC_ALLOW_LOCAL_HTTP === '1');
} catch {
  problem =
    'Set EXPO_PUBLIC_API_ORIGIN to your Laravel HTTPS origin (without /api). حدّد عنوان خادم Laravel أولًا.';
}
export const config = { origin, problem };
