# Product Requirements Document

**Project:** StayFinder — Airbnb-inspired India stay marketplace
**Version:** 0.1 — pre-implementation
**Status:** Local implementation baseline; deployment has not been executed.

## Project vision

Create a polished, photo-forward marketplace for discovering and booking stays across India. The guest experience should resemble Airbnb’s familiar search, browse, listing, and booking patterns. Hosts need a usable way to create and manage listings. The project is an SDE full-stack assignment, not a production accommodation marketplace.

## Problem statement

The assignment requires a functional accommodation marketplace rather than a static mockup or generic CRUD interface. It must support search, listing details, date availability, booking persistence, and host listing management while matching Airbnb’s visual and interaction style closely enough to demonstrate those workflows.

## Goals

### CONFIRMED baseline goals

- Meet every assignment “Core Features (Must Have)” item and its required deliverables.
- Provide guest and host experiences with persisted listings and bookings.
- Make the interface photo-forward and Airbnb-like, with clear search, filters, listing details, checkout, and host tools.
- Keep the code understandable to the developer for the evaluation interview.
- Use sample/mock data and mocked checkout; do not depend on live Airbnb services.

### CONFIRMED project decisions beyond the brief

- Use 26 Indian destinations with at least five seeded stays each (at least 130 stays).
- Add registration/login and role-based access control (RBAC).
- Host applications require administrator approval.
- Focus on polished UI/UX and add restrained animations where they help.
- Build the assignment baseline first, then add agreed extras one at a time. Put the AI chatbot last.

## Target users and use cases

| User | Main use cases |
|---|---|
| Visitor (not signed in) | Browse and search stays, use filters, inspect listing details. Restricted actions prompt login. |
| Guest | Book a stay, see/cancel own trips, save favorites, compare stays. |
| Host | Create/read/update/delete own listings and inspect bookings for those listings. Host tools require login and approved Host role. |
| Admin | Review pending host applications and approve/reject them. A broad admin console is not in scope. |

## Product behavior and feature status

### CONFIRMED assignment baseline (implemented locally; deployment pending)

- Home/explore listing grid, listing cards, location/date/guest search, category/filter row, and pagination or infinite scrolling.
- Listing gallery and detail fields; availability calendar/date range; price breakdown; reviews section.
- End-to-end booking with date/guest validation, overlap prevention, summary, mocked checkout/confirmation, My Trips, persistence, and blocking booked dates.
- Host listing CRUD, host dashboard showing owned listings and their bookings, and persistence.
- Airbnb-like navigation/cards/galleries/date pickers/modals, search/filters/pagination, notifications/toasts, and simple wishlist/favorites.
- Seed diverse listings with photos, several host users, and existing bookings.
- README, public GitHub repository with `frontend/` and `backend/`, and deployed demo.

### CONFIRMED additions to the project plan (not assignment requirements)

- Account registration asks for name, email, password, and account intent (Guest or Host). Guests become active immediately; Host registration is pending Admin review.
- Login-based RBAC. Public browsing remains available. Booking requires login. Guests can use guest tools; only approved Hosts can manage their own listings. Admin can process host applications.
- A Host request rejected by Admin leaves the person able to use guest features and request Host access again later.
- Mock payment gets a dedicated page, validates synthetic demo details, displays a five-second processing state, and returns success or a designated decline outcome. A booking becomes confirmed and blocks dates only after simulated success and a final availability recheck.
- Desktop-first, responsive layouts; warm travel/editorial visual direction was accepted (large photos, soft neutrals, restrained coral, clean typography) with Airbnb-like navigation/booking patterns. This direction must be reconciled with the brief’s “look and feel should be exactly the same” instruction; see [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md).
- Subtle, quick transitions where useful: cards, favorites, filters, date selection, booking progress, payment feedback, toasts, and mobile navigation; respect reduced-motion preferences.
- Seed 26 Indian destinations and at least five stays in each. The confirmed list is in [DATA_SPECIFICATION.md](DATA_SPECIFICATION.md).

### Implemented approved extras

- Stay Match Score: implemented with equal weighting across selected capacity, budget, category, amenity, nearby-place, and step-free preferences; explanations identify matched criteria. Guests may specify a nearby point of interest using local metadata matching. It is explicitly subjective.
- Side-by-side comparison of up to four stays by estimated total price, location, amenities, and match score.
- Static map preview on listing details (assignment permits static/basic maps).
- Devotional / Spiritual category plus Beach, Cabins, Amazing Views, and Countryside. Assignment requires categories/filters generally, not these exact labels.
- Step-free-access filter, if time permits.
- Favorites are assignment baseline; login requirement follows the later access-control discussion.

### FUTURE / stretch

- AI stay-finder chatbot using OpenRouter free API/model routing remains FUTURE/OPTIONAL and is not implemented.
- Guest-authored review submission after a completed stay (assignment bonus).
- Interactive map, cloud image storage, dark mode, richer accessibility, and fuller host calendar/pricing tools (assignment bonuses or broader Airbnb features).
- Broader admin tooling, messaging, identity verification, social login, and production payments are not planned for the first version.

## Success criteria

### Assignment acceptance

- Required guest browsing/search/details/booking/My Trips and host CRUD/dashboard flows work end to end.
- Date conflicts are rejected; confirmed bookings persist and block dates; canceled bookings release dates.
- Listing and booking data persists in SQLite.
- The visual design and interaction patterns credibly reproduce Airbnb’s marketplace feel.
- Public GitHub repo, complete README, and live demo are submitted.
- Developer can explain the data model, API, auth, and key behavior in interview.

### Project-specific acceptance

- 26 locations have at least five seeded stays each.
- Auth and RBAC enforce guest/host/admin permissions; pending hosts cannot host until approved.
- Mock-payment outcomes do not store or transmit real payment credentials.
- Optional features are clearly marked as optional and never displace the required flows.

No numeric evaluator score or weighted rubric is provided in the assignment.

## Scope and out of scope

See [PROJECT_SPECIFICATION.md](PROJECT_SPECIFICATION.md) and [REQUIREMENTS.md](REQUIREMENTS.md) for the authoritative detailed boundaries. Real payment processing, real Airbnb APIs/data, live map pricing, real identity verification, production messaging, and copying existing repositories are out of scope.
