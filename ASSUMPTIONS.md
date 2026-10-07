# Assumptions and Unknowns

## Confirmed assumptions/constraints

- The assignment itself permits mocked/placeholder data, media, external services, checkout, and a static/basic map.
- Sample data will be synthetic. No real Airbnb integration or dataset is planned.
- User has no credit card; free hosting/AI options must accommodate or be avoided.
- User estimated 12–14 hours available before deadline Oct 7, 2026, 4 PM IST; assignment’s estimate is about 24 hours.
- Users must understand and explain submitted code at evaluation.
- At least 5 stays in each of the 26 user-selected destinations is an agreed project target, not an assignment-specified count.
- Airbnb-like UX fidelity is important; user also accepted a warm travel/editorial visual direction.

## Technical assumptions (must validate)

- INR is the likely display currency for India destinations; assignment does not specify currency.
- SQLite is adequate for demo traffic and can be placed on Railway persistent volume if current free plan allows it.
- Free Railway plan can support separate frontend/backend services under its current limits; plan/service limits can change.
- OpenRouter free model routing may be usable without paid inference; account signup/payment requirement for this user is unverified.
- External image URLs can be loaded in evaluation environment; image host, usage rights, and hotlink reliability are TBD.
- A seeded synthetic catalog can represent local properties without geographic coordinates or verified accessibility data.

## Research constraints

- No dataset, formal research methodology, or ML train/test split is required.
- Current Airbnb behavior must be treated as time- and region-sensitive; research was checked on 2026-10-06 and may change.
- The 26 destinations are curated by user, not a certified ranking.
- Scaler office context resulted in Bengaluru inclusion; only a Bengaluru office was verified in the referenced official contact page.

## Dependencies

- Node/npm, Python environment, Python packages, GitHub account/repo, Railway account, network access: availability not yet checked.
- OpenRouter key/account: only needed if chatbot reached; not yet created or tested.
- Image hosting source: not selected.
- Secure auth library/session design: not selected.

## Unknowns / TBD

- Project/product/brand name; “Roamly” was never user-approved.
- How strict visual “exactly like Airbnb” reproduction should be versus distinctive color/brand styling.
- Exact Next.js/Python versions, styling system, ORM, migration strategy, local env variables.
- Whether one account can simultaneously be Guest and Host; whether Host approval adds a role or switches role.
- Auth session mechanism, email verification, password reset, login return URL behavior.
- Admin bootstrap and demo credential process.
- Mock payment form fields and decline test value; no real payment credentials allowed.
- Fee amounts, taxes, cancellation policy, timezone/date display, booked date examples.
- Pagination vs infinite scroll.
- Seed review quantity, image provider/licensing, map image/source, exact category-to-listing distribution.
- Stay Match Score matching thresholds; compare behavior without dates.
- Accessibility feature data accuracy/source.
- Railway free-plan persistence and usage; OpenRouter quota availability at implementation.
- Discussion completion/start-work authorization.

## Risks caused by assumptions

- Scope overload: 12–14 hours vs 24-hour assignment estimate; core flows may take all available time.
- Adding login/RBAC/admin approval creates more than the assignment’s simplified auth requirement.
- 130 listings and visual fidelity compete for time; seed via reusable patterns.
- External images/free providers may be unavailable, rate-limited, or change terms.
- SQLite can lose data if deployed without a verified persistent volume.
- Accepted style direction conflicts with assignment’s exact Airbnb look instruction.
- Free AI routing may vary models, quality, quotas, or no-card availability; keep last and optional.
