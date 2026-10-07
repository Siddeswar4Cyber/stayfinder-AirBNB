# Architecture

## Current architecture/state

**Current implementation:** local vertical slice in `backend/` and `frontend/`. FastAPI serves the SQLite-backed API and Next.js provides the browser application. No deployment has been executed.

## Architecture

```text
Browser
  └── Next.js + TypeScript frontend (frontend/)
        └── HTTPS JSON API calls
              └── FastAPI backend (backend/)
                    └── SQLite database (persistent storage)
                    └── Optional OpenRouter API (chatbot only, last phase)
```

### Components

| Component | Responsibilities | Status |
|---|---|---|
| Next.js frontend | Public explore/search/details; auth screens; guest trips/favorites/comparison; mock payment; approved-host dashboard; limited admin approval; UI transitions. | CONFIRMED stack, component breakdown PROPOSED |
| FastAPI backend | REST endpoints, request validation, authentication, role/ownership checks, booking availability integrity, host application decisions, seed data. | CONFIRMED backend; endpoint architecture PROPOSED |
| SQLite | Users, host applications/roles, listings, bookings, favorites, reviews, listing features/images. | CONFIRMED database; SQLAlchemy schema implemented in `backend/models.py` |
| OpenRouter | Optional external language model service for AI stay helper. | FUTURE / EXPERIMENTAL |

## Data/control flows

### Public search

1. Browser submits destination/dates/guest and filter values to Next.js.
2. Next.js calls FastAPI search endpoint.
3. FastAPI filters persisted listing data and confirmed booking ranges.
4. Frontend renders paginated cards, loading/error/empty states.

### Registration and RBAC

1. User submits registration form.
2. Backend validates email/password and stores password hash, role/status.
3. Guest becomes active; Host application becomes pending.
4. On login, backend authenticates user and exposes role/application status.
5. Backend authorizes every protected operation; frontend reflects available actions.
6. Admin reviews pending host applications; approval activates host privileges; rejection leaves guest access and permits reapplication.

Sessions are opaque random bearer tokens. Only SHA-256 token hashes are persisted in `auth_sessions`; sessions expire after 12 hours and logout records revocation. New passwords use salted PBKDF2-SHA256; legacy synthetic seed hashes remain compatible for local demos.

### Booking

1. Guest chooses dates/guests; if signed out, auth flow returns to booking.
2. Backend reports availability and quote inputs.
3. User completes mock payment page; browser waits five seconds in processing state.
4. Success path requests final booking confirmation; backend rechecks overlaps and capacity, then commits booking.
5. Decline path does not create confirmed booking. Trips and host booking views read persisted records.
6. Cancellation changes status; availability query ignores cancelled rows.

Local implementation uses `nightly * nights`, cleaning fee `35% of nightly`, and service fee `12% of subtotal`. Mock payment accepts only `success` or `declined` plus an optional synthetic reference. Booking confirmation opens a SQLite `BEGIN IMMEDIATE` transaction, recalculates the quote, rechecks half-open date overlap, and inserts only after success.

### Host/admin operations

Host CRUD requests carry authenticated identity; backend scopes each listing by owner. Admin approval endpoints are role-restricted. No unauthenticated direct host CRUD.

## External dependencies

- **CONFIRMED/proposed:** Next.js, TypeScript, Python, FastAPI, SQLite.
- SQLAlchemy 2.0 defines the schema; `Base.metadata.create_all` plus the narrow compatibility backfill in `db.py` is the local initialization strategy. Seed/reset is driven by `backend/init_db.py`. Host listing images are URL-based synthetic/external placeholders.
- **FUTURE:** OpenRouter account/API key and free model availability.
- **No real Airbnb API or payment processor.** Assignment says external services can be mocked.

## Deployment/environment structure

- Repository layout required by assignment: `frontend/` and `backend/` plus README.
- **PROPOSED:** Railway project with separate frontend and backend services sourced from those subdirectories; backend SQLite file mounted on a persistent volume.
- User has no credit card. Railway’s free/no-card availability, quotas, persistence policy, and trial-to-free transition must be rechecked at deployment. Do not promise always-on hosting or durable data without verifying current free-plan terms.
- Local development runs FastAPI on port 8000 and Next.js on port 3000. `DATABASE_PATH`, `APP_SECRET`, `ALLOW_DEMO_SEED`, and `NEXT_PUBLIC_API_URL` are documented in the environment templates.
- Secrets belong in environment variables, never committed.

## Future architecture extensions

- Optional AI assistant: FastAPI server calls OpenRouter; provide a bounded selection of current listing facts in prompt; fallback to normal search if unavailable.
- Real payment provider, email verification, messaging, uploaded image storage, richer mapping, or different DB are outside current assignment scope and would require new decisions.
