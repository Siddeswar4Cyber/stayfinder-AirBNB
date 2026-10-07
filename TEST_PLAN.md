# Test Plan

## Strategy

Validate assignment acceptance through unit, API/integration, end-to-end, visual/usability, security, and deployment checks. Keep this file as the validation plan and record only checks that can be reproduced from the current working tree in the section below.

## Existing validation

- The assignment was re-read and cross-checked against `REQUIREMENTS.md` during this review.
- Frontend production build: **passed** for the current working tree.
- Backend Python source compilation: **passed** using `backend/.venv`.
- API and browser behavior: **not verified** in this review. FastAPI's `TestClient` cannot import because `httpx` is not installed in the current virtual environment; the local Uvicorn process did not remain available for an HTTP check.
- The backend test files referenced by earlier validation notes are not present in this working tree, so those historical test results were not rerun.
- No deployment check was performed.

## Unit tests (planned)

- Search filter composition and pagination.
- Date range validation and half-open overlap cases, including same-day checkout/check-in.
- Capacity validation and quote calculation.
- Booking status transitions and canceled-date release.
- Stay Match Score equally weighting selected preferences (if implemented).
- Role/status permission predicates and host-application transition rules.

## Integration/API tests (planned)

- Registration/login and duplicate email/invalid inputs.
- Guest browse/search/details; unauthenticated protected action denied.
- Guest can only access own trips/favorites.
- Pending/rejected host cannot mutate listings; approved host can CRUD own but not another host’s listings.
- Admin can approve/reject pending requests; non-admin cannot.
- Booking success persists booking and blocks dates; overlap returns conflict; decline makes no confirmed booking; cancellation persists status and reopens dates.
- Listings and bookings survive backend restart when using persistent DB path.
- Seed check: all 26 canonical locations each have at least five listings; seeded hosts and existing bookings exist.

## System / end-to-end tests (planned)

- Visitor browses and opens a listing; attempts booking; signs in/registers and returns to booking.
- Guest selects dates/guests, sees breakdown, runs mock-payment success, sees confirmation and My Trips, dates become unavailable.
- Designated decline result yields no confirmed booking and no date block.
- Two competing confirmations for overlapping dates: at most one succeeds.
- Guest cancels confirmed trip; record remains canceled and dates become bookable.
- Host registers and is pending; Admin approval; Host logs in and creates/edits/deletes listing; own bookings display.
- Favorites/toasts and pagination behavior.
- Listing card/detail/map/category content renders on desktop and mobile.

## Visual/usability tests

- Compare against Airbnb’s current official website patterns and assignment’s “exact look and feel” instruction.
- Review all main screens at agreed desktop-first layout and mobile viewport.
- Check loading, empty, error, validation, success, and permission-denied states.
- Verify motion is subtle and reduced-motion preferences are respected.
- Verify keyboard access, labels, contrast, and focus indicators; target standard TBD.

## Research evaluation

- **N/A:** No trained model/dataset split or ML evaluation is required.
- If chatbot is implemented: test answers against known seeded listing facts, refusal/fallback on unavailable data, no invented availability/prices, API outage, rate-limit handling, and content/data minimization.

## Security tests

- Verify role escalation is rejected server-side.
- Verify cross-user trip/favorite and cross-host listing access is denied.
- Verify request cannot alter price, role, owner, or booking status by client payload.
- Verify overlapping bookings are race-safe.
- Verify mock payment success/decline, payment-attempt ownership, quote recalculation, booking detail ownership, host booking visibility, cancellation idempotency, and transactional rollback.
- Verify listing validation bounds, pending/approved host CRUD restrictions, cross-host ownership, admin application filters and decision replay rejection, and deletion protection for active bookings.
- Verify no real payment data is transmitted, logged, or stored.
- Verify secrets do not appear in git, client bundle, logs, or error responses.
- Basic injection/XSS and malformed URL/input checks.

## Performance/reliability tests

- No numeric SLO specified. Check search pagination and image loading with >=130 listings.
- Test backend restart/database persistence and free-host cold-start/limit behavior.
- Load/concurrency tests are optional and not a submission priority unless time permits.

## Acceptance criteria

Do not mark acceptance complete until the planned API, booking-concurrency, role/ownership, browser-flow, and visual checks pass. The frontend build and backend compilation pass, but API behavior, booking persistence, UI behavior, and deployment remain unverified in this review. No hosted link is claimed because deployment was not executed.
