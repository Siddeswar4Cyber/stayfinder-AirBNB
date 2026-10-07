# Project Specification

**Status:** Implementation-aligned single-source-of-truth companion to [PRD.md](PRD.md).
**Implementation state:** Local FastAPI/SQLite backend and Next.js/TypeScript frontend are implemented; deployment has not been executed.

## Product definition

An Airbnb-inspired stay marketplace focused on India. It supports public discovery, registered guest booking, host listing management, and a limited admin workflow to approve hosts. It is an academic full-stack assignment with mock data and simulated checkout.

## Authority and status vocabulary

- **CONFIRMED** — explicitly required by the assignment or accepted by the user in discussion.
- **PROPOSED** — a design proposal accepted as direction or scoped as a later addition; details may remain open.
- **FUTURE** — later/optional idea, not part of baseline.
- **EXPERIMENTAL** — external capability or research whose availability/behavior needs a fresh check.
- **ASSUMPTION** — implementation assumption not explicitly verified.
- **UNKNOWN / TBD** — not established in source material.

The assignment is authoritative for its must-have/optional requirements. User-confirmed additions are project scope but must not be mislabeled as assignment requirements. This document set records the decisions and implementation status; deployment remains outside the current scope.

## Current agreed system behavior

### Discovery and listing

- Anyone may browse, search, filter, and inspect listing detail without login.
- Search fields: destination/location, check-in/check-out dates, and guests.
- Core filter concepts are implemented as price range, category, amenities, guest capacity, date availability, and step-free access controls.
- Listing pages show required content: gallery, title/description/location, amenities, host details, date availability, price breakdown, and reviews.
- Home cards include photo, title, location, nightly price, and rating.
- Page/limit pagination is implemented.
- Hosts provide image URLs for listing images; seeded photos use synthetic remote placeholder URLs.

### Auth, roles, and access

- Registration fields: name, email, password, and Guest/Host intent (the latter follows the confirmed host-approval decision).
- Guest registration activates guest access. Host registration creates a pending host application; host-management access waits for Admin approval.
- A rejected applicant remains a Guest and may apply again.
- Login determines permissions (RBAC); backend enforcement is required, not only hidden frontend controls.
- Public access: browse/search/filter/details.
- Guest-only when authenticated: booking, My Trips, favorites, and comparison.
- Approved Host: manage only owned listings and view their bookings.
- Admin: review and approve/reject host applications. No general admin dashboard in current scope.
- User also stated “host access can get by login”; reconciled as Host tools require login plus approved Host role, not that any login grants host privileges. See [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md).
- Sessions use opaque database-backed bearer tokens with 12-hour expiry and logout revocation. Password reset and email verification are not implemented. Login return paths are restricted to safe same-origin relative paths.

### Booking and mock payment

1. Guest selects dates/guest count and sees summary/price breakdown.
2. Guest must be authenticated; otherwise send to login/register and return to the attempted booking flow (return-path details TBD).
3. Validate date ordering, capacity, availability, and overlapping confirmed reservations.
4. Show dedicated mock payment page. No real processor. Validate designated synthetic test details, show processing for five seconds, then success or decline.
5. On success, recheck availability server-side and create confirmed persistent booking; block dates. On decline, do not create a confirmed booking or block dates.
6. Confirmed booking appears in My Trips. Cancellation preserves a cancelled record and releases the dates.

Price/fee formula is implemented in INR as nightly rate × nights, cleaning fee `35%` of the nightly rate, and service fee `12%` of subtotal. The payment mock accepts synthetic success/declined outcomes and never retains or sends real card data.

### Host and admin

- Host CRUD fields from assignment: title, description, photos by URL/upload, price, location, amenities. Proposed practical fields also include property type, guest capacity, bedrooms, bathrooms.
- Host dashboard shows owned listings and their bookings.
- Admin approval interface is limited to pending Host applications; approve/reject decisions persist.
- Admin identity/bootstrap mechanism and seeded demo credentials must be designed safely; no actual credentials are documented here.

## Major components (proposed architecture)

See [ARCHITECTURE.md](ARCHITECTURE.md) and [API_SPECIFICATION.md](API_SPECIFICATION.md).

1. Next.js TypeScript frontend (`frontend/`): public explore/search, listing details, auth, guest account pages, host dashboard, limited admin approvals, mock payment.
2. FastAPI backend (`backend/`): REST API, auth/RBAC, validation, booking conflict checks, persistence, seed data.
3. SQLite: relational application data and synthetic seed content, initialized through SQLAlchemy models and `backend/init_db.py`.
4. Railway Free: proposed hosting for frontend and backend, with persistent volume for SQLite, subject to current limits and no-card account feasibility.

## Functional scope

Assignment baseline items are itemized in [REQUIREMENTS.md](REQUIREMENTS.md). Project additions and roadmap status are in [ROADMAP.md](ROADMAP.md). Core feature order: implement assignment baseline first; add agreed enhancements one at a time; chatbot last.

## Technical scope

### CONFIRMED

- Frontend: Next.js with TypeScript.
- Backend: Python FastAPI (chosen over Django).
- Database: SQLite with a project-designed schema.
- Public GitHub repository must contain `frontend/` and `backend/`.
- README must document setup, stack, architecture, schema, API overview, and assumptions.

### Remaining TBD / future

- Deployment URL/domain, production database, provider configuration, and secure production admin bootstrap remain TBD.

## Research scope and external-product comparison

This is not a formal academic ML project. Research is product reconnaissance against Airbnb official public product/help pages to understand current search, filtering, wishlist, hosting, pricing, and AI capabilities. References and findings appear in [RESEARCH_NOTES.md](RESEARCH_NOTES.md) and [REFERENCES.md](REFERENCES.md).

Do not claim our Match Score, comparison, or chatbot is absent from Airbnb: official Airbnb materials available on 2026-10-06 report AI search/filtering, AI listing summaries, AI-powered comparison, and AI support in some rollouts. Our features are assignment/app additions, not verified market-first innovations.

## Constraints

- Deadline discussed: October 7, 2026, 4:00 PM IST.
- Available focused work time stated by user: 12–14 hours, less than assignment’s approximate 24-hour estimate.
- User has no credit card. Hosting/API choices must respect this; free-tier availability and account eligibility need rechecking.
- Sample catalog scope is at least 130 stays across 26 destinations; use generated/reusable seed patterns, not hand-authored detail for each row.
- Keep AI chatbot last and only if time and free-tier access allow.
- UI/UX quality is a user priority; no code currently exists.

## Future expansion

See [ROADMAP.md](ROADMAP.md): optional reviews, richer map, cloud photo uploads, accessibility, AI stay assistant, full messaging/identity, production payment are future or out of scope.
