# Security | الأمان

This is a development foundation. Security fixes target the current main branch; no long-term support promise is made for older unreleased snapshots.

Do not post vulnerabilities, tokens, payment sessions, addresses or provider keys in public issues. If GitHub private vulnerability reporting is enabled, use the repository's Security > Report a vulnerability page. Otherwise contact the repository owner privately through a verified contact on their GitHub profile and request a private reporting channel. No guaranteed response SLA is currently offered.

Include affected version/commit, minimal reproduction with synthetic data, impact and proposed mitigation. Do not access accounts or payments you do not own. Rotate exposed credentials with their provider and revoke affected device tokens through the backend.

Native bearer tokens belong in SecureStore; provider secrets and fulfillment belong on Laravel. Deep links are untrusted navigation hints. Never confirm payment from a return URL or release stock from client state.

لا تنشر الثغرات أو بيانات العملاء علنًا. استخدم الإبلاغ الخاص إن كان مفعّلًا، أو تواصل مع صاحب المستودع عبر قناة خاصة موثوقة.
