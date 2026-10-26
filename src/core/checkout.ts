import { Api, ApiError, terminal } from './api.ts';
import type { Address, CheckoutState, Locale } from './types.ts';
import type { Vault } from './session.ts';
export type Attempt = {
  version: 1;
  origin: string;
  userId: number;
  key: string;
  body: Address;
  orderId?: number;
  rejected?: boolean;
  state?: CheckoutState;
};
// An attempt is durable BEFORE sending a POST; failures never automatically rotate its key.
export class CheckoutJournal {
  api: Api;
  vault: Vault;
  userId: number;
  token: string;
  locale: Locale;
  uuid: () => string;
  attempt: Attempt | null = null;
  busy = false;
  constructor(
    api: Api,
    vault: Vault,
    userId: number,
    token: string,
    locale: Locale,
    uuid: () => string,
  ) {
    this.api = api;
    this.vault = vault;
    this.userId = userId;
    this.token = token;
    this.locale = locale;
    this.uuid = uuid;
  }
  setLocale(locale: Locale) {
    this.locale = locale;
  }
  get storageKey() {
    return `checkout.${this.userId}`;
  }
  async restore() {
    if (this.attempt) return this.attempt;
    const raw = await this.vault.get(this.storageKey);
    if (!raw) return null;
    let a: Attempt;
    try {
      a = JSON.parse(raw);
    } catch {
      throw new Error('Saved checkout is unreadable. Contact support before a new payment.');
    }
    if (
      a.version !== 1 ||
      a.origin !== this.api.origin ||
      a.userId !== this.userId ||
      !/^[a-f0-9-]{36}$/i.test(a.key) ||
      !Number.isSafeInteger(a.body?.shop_id) ||
      (a.orderId !== undefined && (!Number.isSafeInteger(a.orderId) || a.orderId < 1))
    )
      throw new Error(
        'Saved checkout belongs to another configuration. Recover the original order before paying again.',
      );
    this.attempt = a;
    return a;
  }
  async persist() {
    // URLs are short-lived and not needed for recovery; addresses stay in SecureStore.
    const a = this.attempt;
    if (!a) return;
    const copy = { ...a, state: a.state ? { ...a.state, checkout_url: null } : undefined };
    const raw = JSON.stringify(copy);
    if (encodeURIComponent(raw).replace(/%[A-F0-9]{2}/g, 'x').length > 2000)
      throw new Error('Shorten the delivery address before checkout (secure storage limit).');
    await this.vault.set(this.storageKey, raw);
  }
  async start(body: Address): Promise<CheckoutState> {
    return this.exclusive(async () => {
      if (this.attempt) throw new Error('Recover the existing checkout before starting another.');
      this.attempt = {
        version: 1,
        origin: this.api.origin,
        userId: this.userId,
        key: this.uuid(),
        body: { ...body },
      };
      try {
        await this.persist();
      } catch (error) {
        this.attempt = null;
        throw error;
      }
      return this.sendCreate();
    });
  }
  async recover() {
    return this.exclusive(async () => {
      if (!this.attempt) throw new Error('No saved checkout');
      return this.attempt.orderId ? this.action('resume') : this.sendCreate();
    });
  }
  async refresh() {
    return this.exclusive(async () => this.action('refresh'));
  }
  async cancel() {
    return this.exclusive(async () => this.action('cancel'));
  }
  async action(action: 'resume' | 'refresh' | 'cancel'): Promise<CheckoutState> {
    if (!this.attempt?.orderId) throw new Error('Recover the original request first.');
    try {
      const response = await this.api.request<{ data: CheckoutState }>(
        `/checkout/${this.attempt.orderId}/${action}`,
        this.token,
        this.locale,
        { method: 'POST' },
      );
      return this.accept(response.data);
    } catch (error) {
      await this.rememberError(error, false);
      throw error;
    }
  }
  async sendCreate(): Promise<CheckoutState> {
    const a = this.attempt!;
    try {
      const reply = await this.api.request<{ data: CheckoutState }>(
        '/checkout',
        this.token,
        this.locale,
        { method: 'POST', key: a.key, body: a.body },
      );
      return this.accept(reply.data);
    } catch (error) {
      await this.rememberError(error, true);
      throw error;
    }
  }
  async accept(state: CheckoutState) {
    if (
      !Number.isSafeInteger(state.order_id) ||
      state.order_id < 1 ||
      (this.attempt?.orderId && this.attempt.orderId !== state.order_id)
    )
      throw new Error('Checkout identity mismatch. Contact support.');
    this.attempt = { ...this.attempt!, orderId: state.order_id, state, rejected: false };
    await this.persist();
    return state;
  }
  async rememberError(error: unknown, creating: boolean) {
    if (error instanceof ApiError && this.attempt) {
      if (error.orderId && !this.attempt.orderId) this.attempt.orderId = error.orderId;
      // 422 is a definite server validation rejection; a network/5xx is uncertain.
      if (creating && error.status === 422 && !this.attempt.orderId) this.attempt.rejected = true;
      await this.persist();
    }
  }
  async forgetFinished() {
    if (this.busy) throw new Error('Checkout is busy');
    if (!this.attempt?.rejected && (!this.attempt?.state || !terminal(this.attempt.state)))
      throw new Error('The checkout is still unresolved.');
    await this.vault.remove(this.storageKey);
    this.attempt = null;
  }
  async exclusive<T>(task: () => Promise<T>) {
    if (this.busy) throw new Error('Checkout is busy');
    this.busy = true;
    try {
      return await task();
    } finally {
      this.busy = false;
    }
  }
}
