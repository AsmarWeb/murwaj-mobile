# مروج | Murwaj Mobile

**Get Found. Sell Smarter. Scale Your Creativity and Productivity.**

تطبيق مروج.كوم للبيع عبر الإنترنت، لمساعدة الأعمال على النمو من خلال التسويق الرقمي.
تطبيق العملاء مبني بـReact Native وExpo وTypeScript، في مستودع مستقل عن [منصة Laravel](https://github.com/AsmarWeb/murwaj).

Independent Android/iOS customer app for Murwaj. This repository has its own dependencies, releases and CI. It consumes the versioned Laravel API; Stripe and Raslo integrations stay on the backend.

## الحالة | Status

نسخة تأسيسية للتطوير، وليست إصدار متجر تطبيقات. الواجهة عربية وإنجليزية مع تصفح عام، حسابات، سلة، طلبات، تتبع رسلو المحفوظ، ودفع Stripe للمنتجات الفعلية داخل الإمارات بالدرهم. الاختبار الفعلي على الهاتف وبوابة Stripe التجريبية مطلوب قبل الإصدار.

Development foundation, not an app-store release. Includes public product/store discovery and search, pagination, detail screens, native registration/login/2FA/recovery codes, email-verification guidance, device revocation, basket controls, order details, saved Raslo tracking, UAE physical checkout and durable payment recovery. Browser preview is deliberately guest-only. No merchant dashboard, digital/POD purchase, push notifications, social login or offline mutation queue is included.

## التشغيل | Run

Use Node **22.18+** and npm. The locked Expo SDK 58 app uses React Native 0.88 and React 19.3. Use the current supported Node/toolchain for your operating system. A physical phone needs a server origin it can reach; localhost on your computer is not localhost on the phone.

```bash
cd "$HOME/murwaj-mobile"
npm ci
EXPO_PUBLIC_API_ORIGIN="https://YOUR-LARAVEL-HOST" npm start
```

Replace the example with your real Laravel **origin**, without `/api` or a trailing path. No production host is guessed. Configure this public value separately for every development/build environment. Never put Stripe/Raslo keys or passwords in `EXPO_PUBLIC_*`; they are embedded in the app. No `.env` file is required or created by the installer.

Development-only private-network HTTP (never enabled in release code):

```bash
EXPO_PUBLIC_API_ORIGIN="http://192.168.1.10:8080" EXPO_PUBLIC_ALLOW_LOCAL_HTTP=1 npm start
```

Prefer reachable HTTPS. HTTP transport may need platform-specific native development configuration; this project does not disable platform transport protection. Android emulator can use `http://10.0.2.2:PORT` with the explicit development flag. Browser access to Laravel needs operator-configured CORS; no backend configuration is changed here.

### Native development build

`npm start` opens Metro for an installed **Development Build**, not Expo Go. The `murwaj` scheme and native modules require a matching app build. Local native builds require a compatible Android SDK/JDK or macOS/Xcode/iOS SDK; old macOS versions may not support the current iOS toolchain. Build commands (run only when you choose to build):

```bash
EXPO_PUBLIC_API_ORIGIN="https://YOUR-LARAVEL-HOST" npm run android
# On a supported Mac with Xcode:
EXPO_PUBLIC_API_ORIGIN="https://YOUR-LARAVEL-HOST" npm run ios
```

`eas.json` contains development/preview/production profiles for a future authorized build. No EAS account/project, cloud build, store submission or deployment was created. Choose/confirm `com.murwaj.customer` as the native identifier before the first distributed build.

For guest browser preview:

```bash
EXPO_PUBLIC_API_ORIGIN="https://YOUR-LARAVEL-HOST" npm run web
```

Compatible Expo Go can preview ordinary screens with `npx expo start --go`, but checkout creation/opening is disabled there because the fixed `murwaj://` return is not an Expo Go callback. Native bearer authentication is disabled on web: the separate Laravel browser cookie/CSRF flow is not implemented in this app.

## API contracts

Backend baseline: [murwaj main, PR #10](https://github.com/AsmarWeb/murwaj/commit/6b2a85bf9f61d28c16a40b639eb69654b9610235).

- [Public catalog](https://github.com/AsmarWeb/murwaj/blob/6b2a85bf9f61d28c16a40b639eb69654b9610235/docs/catalog-api-openapi.json)
- [Native authentication](https://github.com/AsmarWeb/murwaj/blob/6b2a85bf9f61d28c16a40b639eb69654b9610235/docs/mobile-auth-openapi.json)
- [Customer shopping](https://github.com/AsmarWeb/murwaj/blob/6b2a85bf9f61d28c16a40b639eb69654b9610235/docs/customer-shopping-openapi.json)
- [Mobile checkout](https://github.com/AsmarWeb/murwaj/blob/6b2a85bf9f61d28c16a40b639eb69654b9610235/docs/mobile-checkout-openapi.json)

API changes should be additive/versioned so older app releases keep working. Native releases and backend releases remain independent. Do not copy Laravel models, provider credentials or payment fulfillment logic into this repository.

## Session and payment behavior

- Tokens and checkout recovery are stored through Expo SecureStore on Android/iOS. No browser localStorage token fallback. An account is checked via `/auth/me` before protected operations; temporary network errors retain the saved session for verification retry.
- A 401 invalidates only the token used by that request. 403/422/429 do not log the user out. Retry-After applies a shared client cooldown. No mutation automatically retries.
- Basket POST is additive: after a failed response the product screen sends the customer to refresh the basket before retrying. Quantity PATCH sets the absolute quantity. The server owns all prices and totals.
- Email verification and password resets use the existing website. Login supports authenticator or recovery code, never both. Checkout requires a verified email.
- Checkout saves a UUID idempotency key and exact address **before** the first request. Secure-storage failure prevents the first payment request. An uncertain result retains the original key/body across app restarts; when the server returns an order ID, resume/refresh/cancel target that order.
- One unresolved checkout is saved per account on this device. Finish/reconcile it before another store checkout. A definite 422 rejection without an order ID can be closed to correct input. Do not remove app storage to work around an unresolved payment.
- Stripe URLs must be HTTPS on exactly `checkout.stripe.com`. Links into `murwaj://checkout/result` only request a server check and open the customer's order; URL parameters never mark a payment paid. Browser dismissal is not cancellation. Cancellation releases stock only when the server confirms it.
- Addresses are bounded in the UI and SecureStore writes are limited to 2000 UTF-8 bytes, including recovery state. Long addresses must be shortened; a post-response storage failure retains the prior same-key recovery record. Current amounts/fees come from the backend; no client-side shipping quote is invented.
- Signing out revokes the current token and removes it locally only after server success/401. Failed sign-out can be retried; it is not presented as successful revocation. Checkout recovery remains private in SecureStore for the same account. Revoke other devices through Account. SecureStore may survive iOS reinstall, so reinstalling is not a reliable logout mechanism.

## Checks

```bash
npm run check
npx expo install --check
npm run export:android
npm run export:ios
```

CI runs TypeScript, ESLint, client behavior tests, dependency compatibility and Android/iOS JavaScript exports. JavaScript export is not a native APK/IPA build and does not verify device behavior. See [verification and device checklist](docs/verification.md). External calls are mocked in tests; no real payment, mail, delivery or database write is needed.

## Project layout

| Location                       | Responsibility                                                 |
| ------------------------------ | -------------------------------------------------------------- |
| `src/app/`                     | Expo Router layouts, native tabs, routes and return-link hints |
| `src/screens/`                 | Discovery, account, basket/orders and checkout screens         |
| `src/core/`                    | Typed API, session store and checkout recovery state           |
| `src/vault.ts`                 | Native secure storage adapter                                  |
| `tests/`                       | Network, identity, session race and payment recovery tests     |
| `.github/workflows/mobile.yml` | Independent mobile checks                                      |

## Community

[Contributing](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [Security](SECURITY.md) · [Support](SUPPORT.md) · [MIT License](LICENSE)

Expo references: [SDK versions](https://docs.expo.dev/versions/latest/), [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [linking](https://docs.expo.dev/linking/into-your-app/), [public environment values](https://docs.expo.dev/guides/environment-variables/).
