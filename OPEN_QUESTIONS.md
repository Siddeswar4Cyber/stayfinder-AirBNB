# Open Questions

These items are unresolved; no defaults should be silently promoted to confirmed decisions.

## Blocking product/design questions

1. **Brand/UI fidelity:** Assignment says visual look and feel should match Airbnb “exactly”; user accepted warm editorial styling with coral accents. Does exact Airbnb fidelity take precedence, or should the app be distinct while retaining familiar patterns? App name is TBD; “Roamly” was never confirmed.
2. **Discussion completion:** User said discussion is not complete. Explicit start-development authorization is still required after reviewing this package.
3. **Auth/RBAC model:** Can one account have both Guest and Host permissions after approval, or does approved Host replace Guest role? Current notes assume role/status checks but don’t finalize multi-role representation.
4. **Registration:** The latest direction allows Guest or Host intent at registration, Host intent pending approval. Earlier recommendation said everyone starts Guest then chooses Become a host. The later host-request decision supersedes that as the primary signup path, but confirm whether Guest can later reapply via “Become a host.”
5. **Auth implementation:** Cookie session or token, email verification, password reset, session expiry, and post-login redirect behavior.
6. **Mock payment:** Which fields are shown and which synthetic test value indicates decline? Ensure no real card entry/storage/transmission.
7. **Pricing:** Currency/locale (INR assumed), cleaning/service fee amounts, taxes, cancellation terms, quote display when dates are absent.
8. **Browse mechanics:** Pagination vs infinite scrolling; exact filters, category order, and sort controls.

## Data/source questions

9. Seed photo source and licensing; local images vs external URL provider.
10. Number/quality of synthetic reviews per listing; labels to avoid representing them as verified real guest statements.
11. Seed booking dates/statuses and intended demo accounts; admin bootstrap method without publishing secrets.
12. Accessibility facts and source for step-free filter; avoid unsupported accessibility claims.
13. Landmark distance/geographic data needed by nearby-place score; no coordinates/data provider selected.

## Extra feature behavior

14. Stay Match Score thresholds/normalization for budget, distance, property type, amenities; exact examples.
15. Comparison behavior without selected dates and whether totals include fees/tax.
16. Whether favorites and comparison persist only in database for signed-in account (recommended but implementation choice).
17. Cancellation eligibility/time rule; assignment does not require cancellation at all.
18. Static map source/visual; no provider chosen.
19. AI chatbot—OpenRouter account setup, actual no-credit-card eligibility, selected free model/router, quotas, privacy, fallback. Explicitly last.

## Technical/deployment questions

20. Framework/library versions, CSS/design system, ORM, migration tool, app ports/env variable names.
21. Railway free plan current no-card eligibility, monthly credit sufficiency, service limits, volume persistence, and data retention at deployment time.
22. GitHub account/repository setup and whether credentials/integration are available.
23. README deployment URL and final demo access credentials.
24. Exact deadline and remaining work time should be rechecked if schedule changes; known statement is 2026-10-07 4 PM IST and 12–14 available hours as reported.

## Research questions

25. Reinspect Airbnb live desktop/mobile experience before design, since features and regional rollouts change.
26. Verify any claim of feature uniqueness before making it; current official Airbnb material already describes AI search and comparison.
