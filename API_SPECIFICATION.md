# API Specification

## Existing APIs/interfaces

Implemented in `backend/main.py`; FastAPI also publishes interactive OpenAPI docs at `/docs`. The endpoint table below remains the contract reference, with exact implementation details available from the generated OpenAPI schema.

## Implemented API style

- FastAPI JSON REST API under `/api`.
- Authentication uses opaque, database-backed HttpOnly session cookies with a 12-hour expiry, SameSite protection, and revocation on logout. Passwords use salted PBKDF2-SHA256 hashes. FastAPI validation errors use the standard JSON error shape; list responses use `{items,total,page,pages}`.
- All authorization must be checked by the backend.
- Data contracts below describe needed capabilities, not finalized paths or schemas. Final OpenAPI spec should be generated from implementation.

## Implemented endpoint/contracts

| Capability | Proposed method/path | Access | Inputs/outputs (high level) |
|---|---|---|---|
| Health | `GET /api/health` | Public | status/version. |
| Destinations | `GET /api/destinations` | Public | canonical destination list. |
| Search/listings | `GET /api/listings` | Public | query: destination, keyword, dates, guests, category, amenity, price range, page, limit; returns public cards and pagination metadata. |
| Accessibility filter | `GET /api/listings?step_free_access=true` | Public | filters synthetic listings that advertise the seeded `Step-free access` amenity. |
| Listing detail | `GET /api/listings/{id}` | Public | listing fields, photos, amenities, public host summary, database-backed reviews, and booked ranges. |
| Availability | `GET /api/listings/{id}/availability` | Public | optional check-in/check-out interval validation plus availability; without dates returns confirmed booked ranges. |
| Reviews | `GET /api/listings/{id}/reviews` | Public | seeded synthetic reviews; review submission is not implemented because it remains a future bonus. |
| Register | `POST /api/auth/register` | Public | name, email, password, intended role; returns safe user and role/application status. Host intent creates pending application. |
| Login/logout/current user | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Public/authenticated as appropriate | Credentials/session and safe identity/role/status. HttpOnly cookie sessions are stored as hashes and revoked on logout. |
| Host application | `POST /api/host-applications` | Guest/authenticated | request Host access; repeat after rejection permitted. |
| Admin pending applications | `GET /api/admin/host-applications?status=pending` | Admin | list applications filtered by `pending`, `approved`, `rejected`, or `all`. |
| Admin decision | `POST /api/admin/host-applications/{id}/decision?approve=true|false` | Admin | approve/reject only a pending application; repeat decisions return conflict. |
| Quote/availability | `POST /api/bookings/quote` | Authenticated | listing, dates, guest count; validates availability and returns nights, subtotal, cleaning fee, service fee, and total. |
| Mock payment | `POST /api/payments/mock` | Guest/authenticated | `{outcome: success|declined, listing_id, check_in, check_out, guests, demo_reference?}`; stores synthetic outcome and quote terms; endpoint is disabled in production. |
| Confirm booking | `POST /api/bookings` | Guest/authenticated | listing, dates, guests, and a required authenticated user's unconsumed successful `payment_attempt_id`; server recalculates total and performs a final transactional overlap check. |
| My Trips | `GET /api/me/bookings`, `GET /api/me/bookings/{id}` | Guest/authenticated | only current user bookings and details. |
| Cancel trip | `POST /api/bookings/{id}/cancel` | Owning guest | idempotent status transition to `cancelled`; canceled dates become available. |
| Favorites | `GET /api/me/favorites`, `PUT/DELETE /api/me/favorites/{listing_id}` | Authenticated | current-user saved listing details; listing existence and ownership are enforced server-side. |
| Comparison | `GET /api/listings/compare?ids=...` | Authenticated | one to four public listing summaries, returned in requested order. |
| Match Score | `GET /api/listings/{id}/match-score` | Public | equal-weight score for selected capacity, budget, category, amenity, nearby-place, and step-free preferences; returns criteria/reasons and marks the result subjective. |
| Host listings/bookings | `GET /api/host/listings`, `GET /api/host/bookings` | Approved Host | only owned listings and bookings; admins may view all booking rows. |
| Create listing | `POST /api/host/listings` | Approved Host | listing details and photo URL(s); returns persisted listing. |
| Update/delete listing | `PATCH/DELETE /api/host/listings/{id}` | Owning approved Host | changes to owned listing; deletion is rejected while pending/confirmed bookings exist. |
| Optional chatbot | `POST /api/assistant/chat` | Auth/public policy TBD | user message plus relevant listing context; answer/fallback; OpenRouter key backend-only. FUTURE. |

## Error behavior

- `400` invalid dates/fields, `401` missing/invalid session, `403` role/ownership denied, `404` missing record, `409` availability conflict/state conflict, `422` validation, `429` rate limit, `5xx` service failure.
- Domain errors use `{detail: string}`; Pydantic validation errors use FastAPI's standard `{detail: [{loc,msg,type,...}]}` shape.

## Authentication/security

- Registration/login and RBAC are implemented with backend-enforced role and ownership checks. Password hashes and session token hashes are never returned.
- Never return password hash or sensitive internals.
- Do not accept owner/user/role from client as authority; derive identity from authenticated session.
- Payment simulation must avoid real payment credential collection.
- OpenRouter key is server secret; no client-side direct call.

## API deployment

Frontend calls the backend URL configured by `NEXT_PUBLIC_API_URL`. Local development uses separate Next.js and FastAPI processes. The current backend CORS allowlist is local-only (`http://localhost:3000`); production deployment must make the allowed frontend origin environment-driven before launch.
