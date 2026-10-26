# Verification and device acceptance

## Automated scope

The client suite uses synthetic responses and in-memory storage. It covers fixed-origin API requests, no bearer on catalog reads, 204 handling, precise 401 invalidation, rate-limit cooldown, no automatic cart retries, strict return/Stripe URLs, session expiry and origin isolation, slow-storage logout races, durable UUID/body recovery, provider-failure resume, duplicate submission, forbidden unresolved reset, server-confirmed completion, cancellation uncertainty, cross-account journals, identity mismatch and UTF-8 storage limits.

The app was checked against the Laravel contracts at main commit `6b2a85bf9f61d28c16a40b639eb69654b9610235` (PR #10). Automated client checks are not evidence of a successful live API/payment/device integration. Android/iOS Metro exports only verify JavaScript bundling; no APK/IPA, native signing or app-store review is covered.

## Recorded local result

- TypeScript: passed.
- Client tests: 24 passed, 0 skipped.
- Expo Doctor: 20/20 checks passed.
- ESLint: 0 errors; 3 advisory warnings for intentional manual-refresh revision dependencies.
- Android, iOS and web JavaScript exports: passed.
- Browser smoke/visual acceptance: not completed; the headless browser download was unavailable in the execution environment.

## Manual acceptance before release

Use a dedicated HTTPS test backend, synthetic customer accounts and Stripe test mode. These actions intentionally create test accounts/cart/orders and may reserve test stock. Do not run against production data to validate the UI.

- Test Arabic/English layouts, long product names, large accessibility text, keyboards, back navigation, empty lists, offline/error states and pagination on physical Android/iOS devices.
- Verify media URLs and Laravel origin are reachable on the device. Check server route caches and CORS separately without putting server keys in the app.
- Register, complete website email verification, refresh account, sign out/in, use both TOTP and recovery-code flows, revoke another device, and test expired/revoked tokens.
- Add a basket item with a deliberately lost response; refresh before another additive POST. Verify quantity changes, hidden products and per-store grouping.
- Create a physical checkout; interrupt connectivity before/after the server response, force-close/reopen, and recover the same key/order. Never clear secure storage to bypass an unresolved attempt.
- Complete Stripe test payment, delayed webhook, cancel/expire, provider failure and paid-vs-cancel race. Check server totals and a single invoice/stock reservation.
- Open a forged or another customer's `murwaj://checkout/result` link: no local success and no foreign order data. Test cold-start and warm-start links in a Development Build.
- Confirm Raslo tracking uses only saved server status, and missing shipment is shown as missing rather than delivered.
- Validate platform native permissions, signing identifiers, privacy disclosures, icons, screenshots and store requirements before distribution.

## Known limits

No real-device, simulator, native compilation, live mail, live Stripe/Raslo or production endpoint test was performed by this package. Browser preview remains guest-only. The app handles one unresolved native checkout per account/device; checkout created on another device or the website must be recovered through that original workflow/support. A validated signed return may appear before a delayed webhook: use server refresh and order history, never infer success from navigation.

SDK 58 requires modern native build tools; an older Mac may be able to edit source but cannot be assumed to build the current iOS target. Cloud/native builds are a separate explicit step and are not run by the installer.
