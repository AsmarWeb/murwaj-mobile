import type { Locale } from './types.ts';

export class ApiError extends Error {
  status: number;
  code?: string;
  errors: Record<string, string[]>;
  retryAfter: number;
  orderId?: number;
  constructor(status: number, body: Record<string, unknown> = {}, retryAfter = 0) {
    super(typeof body.message === 'string' ? body.message : `HTTP ${status}`);
    this.status = status;
    this.code = typeof body.code === 'string' ? body.code : undefined;
    this.errors =
      body.errors && typeof body.errors === 'object'
        ? (body.errors as Record<string, string[]>)
        : {};
    this.retryAfter = retryAfter;
    this.orderId =
      Number.isSafeInteger(body.order_id) && Number(body.order_id) > 0
        ? Number(body.order_id)
        : undefined;
  }
}
export function normalizeOrigin(raw: string, allowLocalHttp = false): string {
  const u = new URL(raw);
  if (u.username || u.password || u.search || u.hash || (u.pathname !== '/' && u.pathname !== ''))
    throw new Error('Use the website origin without /api or a path.');
  const local =
    /^(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(
      u.hostname,
    );
  if (u.protocol !== 'https:' && !(allowLocalHttp && local && u.protocol === 'http:'))
    throw new Error('HTTPS is required. Local HTTP needs the explicit development flag.');
  return u.origin;
}

/** Resolve localhost media URLs against the API host reachable by this device. */
export function resolveMediaUrl(raw: string | null | undefined, apiOrigin: string): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const media = new URL(raw.trim());
    if (media.protocol !== 'http:' && media.protocol !== 'https:') return null;
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(media.hostname.toLowerCase())) {
      const api = new URL(apiOrigin);
      media.protocol = api.protocol;
      media.hostname = api.hostname;
      media.port = api.port;
    }
    return media.href;
  } catch {
    return null;
  }
}
export type ApiOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  key?: string;
  signal?: AbortSignal;
};
export class Api {
  origin: string;
  cooldownUntil = 0;
  fetcher: typeof fetch;
  invalid: (token: string) => void;
  constructor(
    origin: string,
    fetcher: typeof fetch = fetch,
    invalid: (token: string) => void = () => {},
  ) {
    this.origin = origin;
    this.fetcher = fetcher;
    this.invalid = invalid;
  }
  async request<T>(
    path: string,
    token: string | null,
    locale: Locale,
    options: ApiOptions = {},
  ): Promise<T> {
    if (this.cooldownUntil > Date.now())
      throw new ApiError(429, {}, Math.ceil((this.cooldownUntil - Date.now()) / 1000));
    if (!/^\/[a-z0-9/?=&%_.~-]*$/i.test(path) || path.startsWith('//') || path.includes('..'))
      throw new Error('Invalid API path');
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Language': locale,
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.key) headers['Idempotency-Key'] = options.key;
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort);
    if (options.signal?.aborted) controller.abort();
    const timeout = setTimeout(abort, 20000);
    try {
      const response = await this.fetcher(`${this.origin}/api/v1${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
        redirect: 'error',
        credentials: 'omit',
      });
      if (response.status === 204) return undefined as T;
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new ApiError(response.status === 401 ? 401 : response.ok ? 502 : response.status);
      }
      if (response.status === 429)
        this.cooldownUntil =
          Date.now() +
          Math.min(3600, Math.max(1, Number(response.headers.get('Retry-After')) || 60)) * 1000;
      if (!response.ok)
        throw new ApiError(
          response.status,
          typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {},
          Number(response.headers.get('Retry-After')) || 0,
        );
      return body as T;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && token) this.invalid(token);
      throw error;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abort);
    }
  }
}
export function checkoutReturn(url: string): number | null {
  try {
    const u = new URL(url);
    const id = u.searchParams.get('order_id') ?? '';
    const outcome = u.searchParams.get('outcome');
    if (
      u.protocol !== 'murwaj:' ||
      u.hostname !== 'checkout' ||
      u.pathname !== '/result' ||
      u.username ||
      u.password ||
      u.port ||
      u.hash ||
      !['returned', 'closed'].includes(outcome ?? '') ||
      !/^[1-9]\d*$/.test(id) ||
      u.searchParams.getAll('order_id').length !== 1 ||
      u.searchParams.getAll('outcome').length !== 1
    )
      return null;
    const n = Number(id);
    return Number.isSafeInteger(n) ? n : null;
  } catch {
    return null;
  }
}
export function stripeUrl(raw: string | null): string | null {
  try {
    const u = new URL(raw ?? '');
    return u.protocol === 'https:' &&
      u.hostname === 'checkout.stripe.com' &&
      !u.username &&
      !u.password &&
      !u.port
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export function httpsUrl(raw: string | null | undefined): string | null {
  try {
    const u = new URL(raw ?? '');
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : null;
  } catch {
    return null;
  }
}
export function terminal(state: { payment_status: string; checkout_state: string }): boolean {
  return ['paid', 'refunded'].includes(state.payment_status) || state.checkout_state === 'expired';
}
