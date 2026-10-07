# Implementation Plan

## Completed work

- Implemented a local vertical slice in `backend/` (FastAPI + SQLite) and `frontend/` (Next.js + TypeScript).
- Seeded 26 destinations with five synthetic listings each; added public search/details, auth/RBAC, host approval endpoints, host CRUD, quote/mock booking/cancellation, favorites, and My Trips.
- Added responsive UI, static image/map-free presentation, Match Score-ready listing metadata, and focused API tests.

- Assignment document reviewed and its requirement sections/evaluation criteria extracted and cross-checked.
- Product discussions established stack, booking rules, data scope, authentication/host approval, UI direction, and optional roadmap; see `DECISION_LOG.md`.
- The original documentation-only phase is complete; this workspace now contains the approved local implementation.

## Final work/status

- The documentation package and local implementation are both present.
- Product decisions are recorded in the source-of-truth documents; implementation-replaced TBDs are recorded as implemented decisions.
- The implementation is local-only; deployment and the optional OpenRouter chatbot remain out of scope.

## Final validation

1. Backend suite: 29 tests passing.
2. Frontend production build and TypeScript check: passing.
3. Local smoke checks: health, discovery, detail, availability, auth, payment, and booking authorization verified.
4. Deployment remains unexecuted; OpenRouter remains future/out of scope.

## Development phases

### Phase 0 — scope and setup

- Resolve brand-vs-exact-Airbnb fidelity question; settle UI name (currently TBD).
- Establish local environment, versions, API origin, SQLite location, and README structure.
- Scaffold Next.js TypeScript and FastAPI; establish CORS and health check.

### Phase 1 — persistence and sample data

- Design normalized schema and migration/create strategy.
- Add users/roles/host applications, listings/photos/amenities/reviews, bookings, favorites.
- Seed hosts/guest/admin, existing bookings, varied data for all 26 destinations (>=130 listings).

### Phase 2 — assignment guest baseline

- Explore/search/category/filter/pagination.
- Listing detail, gallery, reviews, dates, price breakdown, static map if baseline schedule allows (map is permitted, not a must-have listed in the core feature bullets).
- Register/login and RBAC (project addition), public browsing, guest My Trips.
- Booking summary and minimal mocked checkout/confirmation; enforce persistence/overlap rules.

### Phase 3 — host/admin baseline

- Host registration pending approval; limited Admin approval page.
- Approved Host CRUD and own bookings.
- Favorites and notifications/toasts (favorites/toasts are assignment baseline).

### Phase 4 — design, docs, acceptance

- Refine Airbnb-like UI, desktop first/mobile support, useful transitions/reduced motion.
- README setup, architecture, schema, API, assumptions.
- Verify acceptance criteria and interview explainability; prepare public GitHub repo and demo.

### Phase 5 — extras, one at a time (completed except chatbot)

1. Stay Match Score — implemented.
2. Compare up to four stays — implemented.
3. Step-free filter and static/category/review polish — implemented.
4. AI chatbot via OpenRouter — future, not implemented.

Exact order between the first three extras is proposed; the chatbot-last constraint is confirmed.

## Future phases

- Optional assignment bonuses: guest-written reviews, interactive map, cloud photo upload, dark mode.
- Not planned: real payments, full identity verification, messaging, broad admin console, production marketplace operation.

## Dependencies and milestones

| Milestone | Depends on | Exit criterion |
|---|---|---|
| Scope locked | User completes discussion | Baseline vs extras clearly accepted; open blocking questions resolved. |
| Local vertical slice | Node/Python dependencies available | API and frontend communicate locally. |
| Booking integrity | Schema + listing detail + auth | Successful mock payment confirms one booking; decline/conflict does not. |
| Host approval and CRUD | RBAC + host application flow | Admin approves Host; approved Host CRUD works; pending/rejected cannot manage listings. |
| Submission-ready | Core flows + README | public repo, live demo, core acceptance checklist passed. |

## Schedule constraints

- Deadline stated: 2026-10-07, 4 PM Asia/Kolkata.
- User estimated 12–14 hours available; assignment estimates ~24 hours.
- AI tools allowed and encouraged, but user must understand code.
- Reassess scope against remaining time; never describe stretch work as guaranteed.
