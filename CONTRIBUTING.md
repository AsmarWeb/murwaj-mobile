# Contributing | المساهمة

Thank you for helping develop the independent Murwaj customer app. Discuss substantial changes in an issue before implementation. Use a feature branch and a pull request; preserve support for the documented API baseline.

Use Node 22.18+, `npm ci`, then `npm run check` and native JavaScript exports. Include Arabic and English labels, loading/empty/error states, accessibility labels and safe recovery behavior. Test on a real device before claiming native acceptance. Explain what was actually tested and what remains.

Never commit secrets, personal addresses, tokens, screenshots of customer data, `.env`, generated native signing files or `node_modules`. Never bypass server ownership, email verification, idempotency, payment confirmation or inventory checks. Do not add automatic mutation retries. Security reports follow SECURITY.md.

Use conventional commit messages such as `feat:`, `fix:` and `docs:`. Keep backend changes in AsmarWeb/murwaj and mobile changes here. MIT licensing applies to contributions.

ساهم عبر فرع وطلب دمج، وأرفق نتائج الفحوص وحدود الاختبار. راعِ العربية والإنجليزية والخصوصية، ولا ترفع مفاتيح أو بيانات عملاء.
