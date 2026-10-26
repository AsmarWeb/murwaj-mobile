import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Api,
  ApiError,
  checkoutReturn,
  httpsUrl,
  normalizeOrigin,
  stripeUrl,
  terminal,
} from '../src/core/api.ts';
import { SessionStore } from '../src/core/session.ts';
import type { Vault } from '../src/core/session.ts';
import { CheckoutJournal } from '../src/core/checkout.ts';
import type { Address, CheckoutState, Session } from '../src/core/types.ts';
const origin = 'https://shop.example.test';
function memory(): Vault & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    get: async (k) => data.get(k) ?? null,
    set: async (k, v) => {
      data.set(k, v);
    },
    remove: async (k) => {
      data.delete(k);
    },
  };
}
const session: Session = {
  token: 'secret',
  expires: '2099-01-01T00:00:00Z',
  origin,
  user: {
    id: 1,
    name: 'Buyer',
    email: 'buyer@example.test',
    email_verified: true,
    two_factor_enabled: false,
  },
};
const body: Address = {
  shop_id: 2,
  recipient_name: 'Buyer',
  recipient_phone: '0501234567',
  emirate: 'dubai',
  city: 'Dubai',
  area: 'Marina',
  address_line: 'Street 10',
  building: 'A',
  unit: '1',
};
const state: CheckoutState = {
  order_id: 9,
  order_number: 'MW-EXAMPLE',
  status: 'pending',
  payment_status: 'pending',
  checkout_state: 'open',
  currency: 'AED',
  total: '12.35',
  checkout_url: 'https://checkout.stripe.com/c/pay/cs_test_example',
  expires_at: null,
};
const uuid = '8b962031-f92b-4cd4-8cef-788353c141fe';
const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
function client(
  handler: (url: string, init: RequestInit) => Promise<Response> | Response,
  invalid?: (t: string) => void,
) {
  return new Api(
    origin,
    ((url, init) => handler(String(url), init ?? {})) as typeof fetch,
    invalid,
  );
}
test('configuration requires an origin and HTTPS except explicit private-network development', () => {
  assert.equal(normalizeOrigin(origin + '/'), origin);
  for (const url of [
    'https://u:p@host.test',
    'https://host.test/api',
    'https://host.test?token=1',
    'http://shop.test',
    'javascript:alert(1)',
  ])
    assert.throws(() => normalizeOrigin(url));
  assert.equal(normalizeOrigin('http://192.168.1.10:8080', true), 'http://192.168.1.10:8080');
  assert.throws(() => normalizeOrigin('http://shop.test', true));
  assert.throws(() => normalizeOrigin('http://127.0.0.1'));
});
test('catalog omits bearer/cookies; authenticated JSON uses fixed-origin API paths', async () => {
  const calls: RequestInit[] = [];
  const api = client((url, init) => {
    assert.ok(url.startsWith(origin + '/api/v1/'));
    calls.push(init);
    return json({ data: [] });
  });
  await api.request('/listings?q=%D9%85', null, 'ar');
  await api.request('/cart', 'secret', 'en', { method: 'PATCH', body: { quantity: 2 } });
  assert.equal((calls[0].headers as Record<string, string>).Authorization, undefined);
  assert.equal(calls[0].credentials, 'omit');
  assert.equal(calls[1].redirect, 'error');
  assert.equal((calls[1].headers as Record<string, string>).Authorization, 'Bearer secret');
  assert.equal((calls[1].headers as Record<string, string>)['Accept-Language'], 'en');
  assert.equal(calls[1].body, '{"quantity":2}');
});
test('absolute and traversal paths are rejected before attaching a token', async () => {
  let calls = 0;
  const api = client(() => {
    calls++;
    return json({});
  });
  for (const path of ['https://evil.test', '//evil.test', '/../user', '/cart\\evil'])
    await assert.rejects(api.request(path, 'secret', 'ar'));
  assert.equal(calls, 0);
});
test('204 responses need no JSON body', async () => {
  const api = client(() => new Response(null, { status: 204 }));
  assert.equal(await api.request('/auth/logout', 'secret', 'en', { method: 'POST' }), undefined);
});
test('only 401 invalidates the specific request token, including non-JSON 401', async () => {
  const invalid: string[] = [];
  let status = 403;
  const api = client(
    () =>
      status === 401
        ? new Response('unauthorized', { status })
        : json({ message: 'denied' }, status),
    (t) => invalid.push(t),
  );
  for (const code of [403, 422, 503, 401]) {
    status = code;
    await assert.rejects(api.request('/cart', 'old-token', 'en'));
  }
  assert.deepEqual(invalid, ['old-token']);
});
test('429 respects Retry-After without automatic request replay', async () => {
  let calls = 0;
  const api = client(() => {
    calls++;
    return json({}, 429, { 'Retry-After': '30' });
  });
  await assert.rejects(
    api.request('/cart', 'secret', 'en'),
    (e) => e instanceof ApiError && e.retryAfter === 30,
  );
  await assert.rejects(
    api.request('/cart', 'secret', 'en'),
    (e) => e instanceof ApiError && e.status === 429,
  );
  assert.equal(calls, 1);
});
test('a network failure performs exactly one mutation request', async () => {
  let calls = 0;
  const api = client(() => {
    calls++;
    throw new TypeError('Network');
  });
  await assert.rejects(
    api.request('/cart/items', 'secret', 'en', {
      method: 'POST',
      body: { listing_id: 1, quantity: 1 },
    }),
  );
  assert.equal(calls, 1);
});
test('payment-return links are navigation hints with strict scheme, host and positive ID', () => {
  assert.equal(checkoutReturn('murwaj://checkout/result?order_id=9&outcome=returned'), 9);
  for (const link of [
    'https://checkout/result?order_id=9&outcome=returned',
    'murwaj://evil/result?order_id=9&outcome=returned',
    'murwaj://checkout/result?order_id=0&outcome=returned',
    'murwaj://checkout/result?order_id=9&order_id=8&outcome=returned',
    'murwaj://checkout/result?order_id=9&outcome=paid',
    'murwaj://checkout/result?order_id=9007199254740992&outcome=returned',
  ])
    assert.equal(checkoutReturn(link), null);
});
test('only exact HTTPS Stripe host may open checkout; tracking rejects unsafe schemes', () => {
  assert.equal(stripeUrl(state.checkout_url), state.checkout_url);
  for (const u of [
    'https://checkout.stripe.com.evil.test/a',
    'http://checkout.stripe.com/a',
    'https://user@checkout.stripe.com/a',
    'javascript:alert(1)',
  ])
    assert.equal(stripeUrl(u), null);
  assert.equal(httpsUrl('http://raslo.test'), null);
});
test('paid/refunded/expired are terminal; returning or closing the browser is not', () => {
  assert.equal(terminal(state), false);
  assert.equal(terminal({ ...state, payment_status: 'paid' }), true);
  assert.equal(terminal({ ...state, payment_status: 'refunded' }), true);
  assert.equal(terminal({ ...state, checkout_state: 'expired' }), true);
});
test('sessions restore only for the exact origin with a future expiry', async () => {
  const v = memory();
  await v.set('session', JSON.stringify(session));
  const s = new SessionStore(v, origin);
  assert.deepEqual(await s.restore(), session);
  await v.set('session', JSON.stringify({ ...session, origin: 'https://other.test' }));
  assert.equal(await s.restore(), null);
  assert.equal(v.data.has('session'), false);
  await v.set('session', JSON.stringify({ ...session, expires: '2000-01-01' }));
  assert.equal(await s.restore(), null);
});
test('corrupt session is removed and old request cannot clear a newer token', async () => {
  const v = memory();
  await v.set('session', 'invalid');
  const s = new SessionStore(v, origin);
  assert.equal(await s.restore(), null);
  await s.save(session);
  await s.save({ ...session, token: 'new' });
  await s.clear('secret');
  assert.equal(s.current?.token, 'new');
});
test('logout beats a slow storage write and serializes final removal', async () => {
  let unblock!: () => void;
  let raw: string | null = null;
  const v: Vault = {
    get: async () => raw,
    set: async (_, value) => {
      await new Promise<void>((r) => {
        unblock = r;
      });
      raw = value;
    },
    remove: async () => {
      raw = null;
    },
  };
  const s = new SessionStore(v, origin);
  const save = s.save(session);
  await Promise.resolve();
  const clear = s.clear();
  unblock();
  await Promise.all([save, clear]);
  assert.equal(s.current, null);
  assert.equal(raw, null);
});
test('a failed secure save prevents the first checkout network request', async () => {
  let calls = 0;
  const v = memory();
  v.set = async () => {
    throw new Error('Storage unavailable');
  };
  const j = new CheckoutJournal(
    client(() => {
      calls++;
      return json({ data: state });
    }),
    v,
    1,
    'secret',
    'en',
    () => uuid,
  );
  await assert.rejects(j.start(body));
  assert.equal(calls, 0);
  assert.equal(j.attempt, null);
});
test('uncertain creation survives restart and reuses exactly the same key and body', async () => {
  const calls: RequestInit[] = [];
  let fail = true;
  const v = memory();
  const api = client((_, init) => {
    calls.push(init);
    if (fail) throw new TypeError('Lost response');
    return json({ data: state });
  });
  const j = new CheckoutJournal(api, v, 1, 'secret', 'en', () => uuid);
  await assert.rejects(j.start(body));
  const disk = JSON.parse(v.data.get('checkout.1')!);
  assert.equal(disk.key, uuid);
  assert.deepEqual(disk.body, body);
  fail = false;
  const restored = new CheckoutJournal(api, v, 1, 'secret', 'en', () => {
    throw new Error('Must not rotate key');
  });
  await restored.restore();
  await restored.recover();
  assert.equal(
    (calls[0].headers as Record<string, string>)['Idempotency-Key'],
    (calls[1].headers as Record<string, string>)['Idempotency-Key'],
  );
  assert.equal(calls[0].body, calls[1].body);
  assert.equal(restored.attempt?.orderId, 9);
});
test('known provider failure resumes the original order rather than creating again', async () => {
  const paths: string[] = [];
  const v = memory();
  const api = client((url) => {
    paths.push(url);
    return paths.length === 1
      ? json({ code: 'PAYMENT_PROVIDER_UNAVAILABLE', order_id: 9 }, 503)
      : json({ data: state });
  });
  const j = new CheckoutJournal(api, v, 1, 'secret', 'en', () => uuid);
  await assert.rejects(j.start(body));
  await j.recover();
  assert.ok(paths[1].endsWith('/checkout/9/resume'));
});
test('an unresolved checkout cannot be forgotten or replaced by another store', async () => {
  const j = new CheckoutJournal(
    client(() => {
      throw new TypeError('Network');
    }),
    memory(),
    1,
    'secret',
    'en',
    () => uuid,
  );
  await assert.rejects(j.start(body));
  await assert.rejects(j.forgetFinished());
  await assert.rejects(j.start({ ...body, shop_id: 3 }));
  assert.equal(j.attempt?.body.shop_id, 2);
});
test('double checkout taps have only one in-flight create', async () => {
  let done!: (r: Response) => void;
  let calls = 0;
  const j = new CheckoutJournal(
    client(() => {
      calls++;
      return new Promise<Response>((r) => {
        done = r;
      });
    }),
    memory(),
    1,
    'secret',
    'en',
    () => uuid,
  );
  const first = j.start(body);
  await new Promise((r) => setTimeout(r, 0));
  await assert.rejects(j.start(body));
  assert.equal(calls, 1);
  done(json({ data: state }));
  await first;
});
test('server-paid refresh may close recovery; browser URLs are not stored', async () => {
  const v = memory();
  const j = new CheckoutJournal(
    client((url) =>
      json({
        data: url.endsWith('/refresh')
          ? { ...state, payment_status: 'paid', checkout_url: null }
          : state,
      }),
    ),
    v,
    1,
    'secret',
    'en',
    () => uuid,
  );
  await j.start(body);
  assert.equal(JSON.parse(v.data.get('checkout.1')!).state.checkout_url, null);
  await j.refresh();
  await j.forgetFinished();
  assert.equal(j.attempt, null);
  assert.equal(v.data.has('checkout.1'), false);
});
test('failed cancellation retains durable attempt and reserved order identity', async () => {
  let calls = 0;
  const v = memory();
  const j = new CheckoutJournal(
    client(() =>
      ++calls === 1
        ? json({ data: state })
        : json({ code: 'PAYMENT_PROVIDER_UNAVAILABLE', order_id: 9 }, 503),
    ),
    v,
    1,
    'secret',
    'en',
    () => uuid,
  );
  await j.start(body);
  await assert.rejects(j.cancel());
  assert.equal(j.attempt?.orderId, 9);
  await assert.rejects(j.forgetFinished());
});
test('explicit validation rejection permits correcting an address with a new attempt', async () => {
  const j = new CheckoutJournal(
    client(() => json({ errors: { recipient_phone: ['Invalid'] } }, 422)),
    memory(),
    1,
    'secret',
    'en',
    () => uuid,
  );
  await assert.rejects(j.start(body));
  assert.equal(j.attempt?.rejected, true);
  await j.forgetFinished();
  assert.equal(j.attempt, null);
});
test('cross-account and cross-origin journal restoration is blocked', async () => {
  const v = memory();
  await v.set(
    'checkout.1',
    JSON.stringify({ version: 1, origin: 'https://other.test', userId: 1, key: uuid, body }),
  );
  const j = new CheckoutJournal(
    client(() => json({})),
    v,
    1,
    'secret',
    'en',
    () => uuid,
  );
  await assert.rejects(j.restore());
  await v.set('checkout.1', JSON.stringify({ version: 1, origin, userId: 2, key: uuid, body }));
  await assert.rejects(j.restore());
});
test('server response cannot switch the saved checkout order identity', async () => {
  let calls = 0;
  const j = new CheckoutJournal(
    client(() => json({ data: ++calls === 1 ? state : { ...state, order_id: 10 } })),
    memory(),
    1,
    'secret',
    'en',
    () => uuid,
  );
  await j.start(body);
  await assert.rejects(j.refresh());
  assert.equal(j.attempt?.orderId, 9);
});
test('oversized UTF-8 recovery payload is rejected before charging', async () => {
  let calls = 0;
  const j = new CheckoutJournal(
    client(() => {
      calls++;
      return json({ data: state });
    }),
    memory(),
    1,
    'secret',
    'ar',
    () => uuid,
  );
  await assert.rejects(j.start({ ...body, address_line: 'ع'.repeat(2000) }));
  assert.equal(calls, 0);
  assert.equal(j.attempt, null);
});
