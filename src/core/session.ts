import type { Session } from './types.ts';
export type Vault = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};
// Serializing writes keeps a delayed save from restoring a logged-out token.
export class SessionStore {
  vault: Vault;
  origin: string;
  current: Session | null = null;
  generation = 0;
  queue: Promise<void> = Promise.resolve();
  constructor(vault: Vault, origin: string) {
    this.vault = vault;
    this.origin = origin;
  }
  write(task: () => Promise<void>) {
    const p = this.queue.then(task);
    this.queue = p.catch(() => {});
    return p;
  }
  async restore(): Promise<Session | null> {
    const generation = this.generation;
    const raw = await this.vault.get('session');
    if (generation !== this.generation) return this.current;
    let candidate: Session | null = null;
    try {
      candidate = raw ? JSON.parse(raw) : null;
    } catch {}
    if (
      !candidate ||
      candidate.origin !== this.origin ||
      typeof candidate.token !== 'string' ||
      !candidate.token ||
      !Number.isSafeInteger(candidate.user?.id) ||
      candidate.user.id < 1 ||
      !Number.isFinite(Date.parse(candidate.expires)) ||
      Date.parse(candidate.expires) <= Date.now()
    ) {
      await this.clear();
      return null;
    }
    this.current = candidate;
    return candidate;
  }
  async save(session: Session) {
    const generation = ++this.generation;
    await this.write(() => this.vault.set('session', JSON.stringify(session)));
    if (generation === this.generation) this.current = session;
  }
  async clear(expectedToken?: string) {
    if (expectedToken && this.current?.token !== expectedToken) return;
    ++this.generation;
    this.current = null;
    await this.write(() => this.vault.remove('session'));
  }
}
