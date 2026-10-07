# Requirements

Requirement source: the attached `Assignment Airbnb Clone.docx`, reconciled with explicitly accepted project additions. “Must” in the first section means assignment baseline; proposed extras are separated.

## Functional requirements — assignment baseline

| ID | Requirement | Status/source |
|---|---|---|
| FR-01 | Recreate an Airbnb-like home/explore experience. | CONFIRMED — assignment |
| FR-02 | Display listing cards with photo, title, location, nightly price, rating. | CONFIRMED — assignment |
| FR-03 | Search by location, date range, and guests. | IMPLEMENTED — search submits destination, keyword, dates, guests, category, price, and amenity filters |
| FR-04 | Provide category/filter row, including price, property type, amenities, etc. | IMPLEMENTED — category, price, capacity, amenity, date availability, and step-free filters |
| FR-05 | Provide pagination or infinite scroll. | IMPLEMENTED — backend page/limit for listings and seven-location pages in the home view |
| FR-06 | Listing detail includes photo gallery, title, description, location, amenities, host information, availability/date picker, price breakdown, reviews. | IMPLEMENTED — detail page uses seeded photos, host summary, availability, quote, and seeded reviews |
| FR-07 | Complete booking flow with date range and guest count validation. | CONFIRMED — assignment |
| FR-08 | Prevent booking unavailable/overlapping dates. | CONFIRMED — assignment |
| FR-09 | Present booking summary and mocked checkout/confirmation. | CONFIRMED — assignment |
| FR-10 | Provide My Trips listing user bookings. | CONFIRMED — assignment |
| FR-11 | Persist bookings and block booked dates. | CONFIRMED — assignment |
| FR-12 | Provide full host CRUD for listings. | CONFIRMED — assignment |
| FR-13 | Host can create title, description, photo URL/upload, price, location, amenities. | IMPLEMENTED — host form supports photo URL, price, location, amenities, capacity, rooms, and category; upload is not implemented |
| FR-14 | Host dashboard shows owned listings and their bookings. | IMPLEMENTED — host-scoped listings and bookings use protected API routes |
| FR-15 | Persist listing data. | CONFIRMED — assignment |
| FR-16 | Marketplace-like navigation/layout, cards, galleries, date pickers, modals, search, filters, pagination. | CONFIRMED — assignment |
| FR-17 | Show notifications/toasts. | PARTIAL — inline success/error/status feedback is implemented; no separate toast system was added |
| FR-18 | Provide simple wishlist/favorites. | IMPLEMENTED — saved-stay buttons and account-specific wishlist page use persistent API endpoints |
| FR-19 | Seed varied listings with photos, a few host users, and some existing bookings. | CONFIRMED — assignment; counts beyond project addition are unspecified |
| FR-20 | Support simplified/mock authentication but distinguish guest and host. | CONFIRMED — assignment |

## Functional requirements — user-confirmed project additions

| ID | Requirement | Status |
|---|---|---|
| FR-21 | Register and log in; registration captures name, email, password, and Guest/Host intent. | CONFIRMED discussion; auth details TBD |
| FR-22 | Public visitors can browse/search/filter/details; booking is login-gated. | CONFIRMED discussion |
| FR-23 | Enforce permissions according to logged-in role on backend. | CONFIRMED discussion (RBAC) |
| FR-24 | Guest accounts activate immediately; Host signup waits for Admin approval. | CONFIRMED discussion |
| FR-25 | Admin can approve/reject pending host requests through a limited page. | CONFIRMED discussion; minimal admin scope |
| FR-26 | Rejected Host applicant can remain a Guest and request approval again. | CONFIRMED discussion |
| FR-27 | Mock payment page validates synthetic details, shows 5-second processing, then success or designated decline. | IMPLEMENTED — success/declined outcomes only; no real payment fields are collected |
| FR-28 | Recheck availability after successful simulated payment; only success persists/blocks booking. | CONFIRMED discussion |
| FR-29 | Cancellation marks booking cancelled, preserves record, and releases dates. | CONFIRMED discussion |
| FR-30 | Seed at least 5 stays in each of 26 Indian destinations (>=130). | CONFIRMED discussion |
| FR-31 | Desktop-first polished layout with mobile support. | CONFIRMED direction; responsive is an assignment bonus |
| FR-32 | Use subtle useful transitions, respect reduced-motion preference. | CONFIRMED direction |

## Proposed/after-baseline functional requirements

| ID | Requirement | Status |
|---|---|---|
| FR-33 | Stay Match Score equally weights selected budget/location/amenities/property-type preferences and explains score. | IMPLEMENTED — subjective backend score with criteria/reasons |
| FR-34 | Allow a named nearby place (beach, office, landmark) to influence location matching. | IMPLEMENTED — local destination/description matching; no external geolocation |
| FR-35 | Compare up to four stays by estimated total price, location, amenities, score. | PARTIAL — comparison shows listing, location, and amenity summaries; estimated totals and per-stay match scores are not included |
| FR-36 | Static map preview on listing detail. | IMPLEMENTED — local static placeholder only |
| FR-37 | Add Beach, Cabins, Amazing Views, Countryside, Devotional / Spiritual category labels. | PARTIAL — seeded category labels are Beach, City, Nature, Family, and Luxury |
| FR-38 | Add step-free access filter. | IMPLEMENTED — synthetic `Step-free access` metadata/filter |
| FR-39 | AI chatbot via OpenRouter free model routing, based on listing data. | FUTURE, explicitly last; feasibility recheck required |

## Non-functional requirements

### Usability and accessibility

- **CONFIRMED:** Airbnb-like, photo-forward and high-quality UI/UX is a priority.
- **CONFIRMED direction:** warm editorial travel feel with large photos, soft neutral colors, restrained coral, clean typography, familiar Airbnb-style patterns. Potential fidelity conflict documented in `DESIGN_DECISIONS.md`.
- **CONFIRMED direction:** helpful validation, availability feedback, clear booking breakdown, success/error feedback.
- **PROPOSED standard:** semantic labels, keyboard support, sufficient contrast, responsive layout, reduced-motion support. Specific WCAG target is TBD.

### Performance

- No numeric performance target appears in the assignment. **UNKNOWN/TBD:** page load, API latency, image sizes, concurrency.
- **ASSUMPTION:** small demo dataset (>=130 listings) and evaluation traffic; tune for perceived responsiveness rather than production scale.

### Reliability and data integrity

- **CONFIRMED:** listings and bookings persist; booking date conflicts must be checked and dates blocked after successful confirmation.
- **PROPOSED:** server-side transactional conflict recheck at confirmation, unique/auth ownership checks, graceful empty/error/loading states.
- Hosting free-tier availability and volume durability must be checked; no production SLA is promised.

### Scalability

- **ASSUMPTION:** demo/academic scale. SQLite is assignment-mandated and appropriate to this scope; horizontal multi-instance production scaling is not a target.
- Future DB migration is possible but not planned for this submission.

### Compatibility

- **CONFIRMED:** modern desktop browser first; mobile support chosen though assignment calls responsive design optional.
- Exact browser matrix, OS, and minimum viewport are TBD.

### Security/privacy

- **PROPOSED/necessary:** hash passwords; enforce ownership and RBAC server-side; keep AI secrets server-side; never persist real payment credentials; validate inputs; CORS restrict to frontend origin.
- Detailed controls in `SECURITY.md`.

## Research/experimental requirements

- Compare product behavior only against official Airbnb public sources where possible; current features vary by region/rollout.
- No ML training, formal dataset split, or quantitative research experiment is required by the assignment.
- AI chatbot is an integration experiment, not a requirement; test free API limits and model variability if reached.

## Acceptance criteria

See [TEST_PLAN.md](TEST_PLAN.md). Do not invent weighted marks: the assignment lists evaluation dimensions but no weights or point totals.
