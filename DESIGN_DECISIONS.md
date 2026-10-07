# Design Decisions

Status terminology is defined in [PROJECT_SPECIFICATION.md](PROJECT_SPECIFICATION.md). Items marked **OPEN** require reconciliation/confirmation before implementation where indicated.

| ID | Decision / topic | Status | Alternatives and rationale | Trade-off / unresolved point |
|---|---|---|---|---|
| DD-01 | Product is stays only. | CONFIRMED | Assignment is accommodation listings and booking. Excludes Experiences/Services. | Narrower than current Airbnb marketplace. |
| DD-02 | Frontend Next.js + TypeScript. | CONFIRMED | Assignment-mandated; no alternative chosen. | Version and styling/tooling TBD. |
| DD-03 | Backend FastAPI. | CONFIRMED | User explicitly selected “FastAPI only”; Django was the assignment alternative. | Requires Python API integration with frontend. |
| DD-04 | SQLite. | CONFIRMED | Assignment-mandated. | Suitable for demo; not intended for multi-instance write scaling. |
| DD-05 | Mock, not real, payment. | CONFIRMED | Assignment explicitly permits mocked checkout; user asked dedicated sample payment page. | Must clearly label simulation; no real processing. |
| DD-06 | Booking is committed only on mock-payment success and final availability recheck. | CONFIRMED | Avoids reserving dates for failed attempts and handles race between quote and checkout. | Atomicity/transaction design TBD. |
| DD-07 | Public browse, protected account actions. Booking requires login. | CONFIRMED | User explicitly said guests may browse with limitations and confirmed login is required to book. Later RBAC discussion accepted role-gated functionality. | Exact redirect/return behavior TBD. |
| DD-08 | Host role requires Admin approval. | CONFIRMED | User specified host registration goes to Admin for approval. Rejected applicant can remain Guest and reapply. | Requires a minimal Admin approval page; this supersedes earlier discussion deferring all admin UI. |
| DD-09 | RBAC with Guest, Host, Admin. | CONFIRMED | User requested access based on logged-in role. Server must enforce. | Whether one user may hold multiple roles is TBD; discussion currently frames a role/status model. |
| DD-10 | 26 destinations, >=5 stays each (>=130). | CONFIRMED discussion | User requested India top destinations, Scaler AI Labs location, and specified additional locations; agreed to 5 per destination. | “Top 20” is curated rather than official ranking; see research notes. |
| DD-11 | Photos for host listings can be URL-based. | CONFIRMED initial approach | User accepted URL entry first; assignment permits URL/upload. | Seed asset source/licensing and upload feature TBD. |
| DD-12 | Admin scope limited to host approval. | CONFIRMED reconciliation | Earlier admin dashboard was deferred; later host approval requires an admin interface. Small approval page only resolves conflict. | Broader moderation/user management remains out of scope. |
| DD-13 | Desktop-first, mobile support. | CONFIRMED user preference | User agreed desktop primary with mobile support. Responsive design is assignment bonus, but user wants polished UI. | Exact supported breakpoints TBD. |
| DD-14 | Visual style: warm travel editorial with coral accents, while following Airbnb interaction patterns. | CONFIRMED direction | User accepted recommendation: large photos, warm neutrals, restrained coral, clean typography. | **OPEN CONFLICT:** assignment says the app should match Airbnb look and feel “exactly the same”; exact brand imitation may conflict with distinct Roamly-like identity. Do not assume app name “Roamly”—that name appeared only in deleted assistant-generated scaffold and was never confirmed. Clarify priority before design implementation. |
| DD-15 | Useful subtle motion; respect reduced motion. | CONFIRMED direction | User requested animations/transitions when needed and approved examples. | Exact motion durations/easing are design-time choices; avoid motion overload. |
| DD-16 | Stay Match Score equals-weight selected preferences; reasons shown. | PROPOSED accepted as extra | User approved budget, location, amenities, property type; named nearby point can be used. | Scoring thresholds/normalization and empty-preference behavior TBD. |
| DD-17 | Compare up to four stays. | PROPOSED accepted as extra | User selected four; compare price/location/amenities/match score. | Whether compare requires saved favorites/login follows protected-actions plan; comparison persistence TBD. |
| DD-18 | Mock payment takes synthetic details, validates, waits 5 sec, reports success or decline. | CONFIRMED | User specified and accepted success/decline demonstration. | Which synthetic values trigger decline and exact form fields TBD. Never use real credentials. |
| DD-19 | AI chatbot via OpenRouter, last. | FUTURE / EXPERIMENTAL | User pointed out OpenRouter free API; official pricing currently shows free models and 50 requests/day. | Free model pool/rate limits change; user account requirements/no-card status not personally verified. Add only after all other scope if time permits. |
| DD-20 | Accessibility step-free filter. | CONFIRMED implemented extra | User approved after suggestion. | Uses synthetic `Step-free access` amenity metadata; no external accessibility verification is claimed. |
| DD-21 | Maps: static listing preview first, no live map. | PROPOSED accepted | Assignment allows static/basic map. | Exact map visual/data source TBD; no external map key expected in baseline. |
| DD-22 | User wants all assignment requirements first; extras one by one. | CONFIRMED | User explicitly directed this order. | Exact ordering among extras is not fixed except chatbot last. |

## Rejected / superseded options

- Django was considered but superseded by explicit FastAPI selection.
- Stays plus Experiences/Services was considered and rejected; project is stays only.
- Full real payments are explicitly out of scope; use mocked checkout.
- Open host dashboard without login was suggested before RBAC decision and is superseded: only logged-in approved Hosts get host tools.
- Full admin dashboard was initially deferred; superseded only to extent of a minimal host-approval page.
- “Roamly” is not a confirmed project name; it appeared in a deleted scaffold and must not be treated as accepted branding.

## External research decision

Compare against current official Airbnb sources, not memory. As of 2026-10-06, Airbnb official materials describe AI search, AI filters, listing highlights, and AI-powered home comparison (rollout may be limited by region). Therefore Stay Match Score, comparison, and chatbot must not be advertised as definitely absent from Airbnb. See [RESEARCH_NOTES.md](RESEARCH_NOTES.md).
