# Roadmap

## Current state

Pre-implementation. Assignment has been reviewed. No app code remains. Product discussion has not been declared complete; do not begin implementation until explicitly authorized.

## Stage 1 — Assignment baseline (first priority)

- Next.js/TypeScript and FastAPI/SQLite project structure.
- Seed varied listing catalog, host users, existing bookings; make 26 destinations x >=5 stays part of agreed catalog target.
- Airbnb-like home/search/cards, filters/categories, pagination/infinite scroll.
- Listing details, photo gallery, amenities/host/reviews, availability, total price breakdown.
- Mock checkout/confirmation; persisted My Trips; overlap/date blocking.
- Host CRUD/dashboard and listing/booking persistence.
- Favorites, toasts/modals, README, public GitHub repo, deployed demo.

## Stage 2 — Confirmed project-specific account workflow

- Registration/login and RBAC.
- Public browsing; login-gated booking and guest account actions.
- Guest/Host intent on registration; Host application pending until Admin decision.
- Minimal Admin host-approval page; rejected applicant retains Guest access and can reapply.

Note: Authentication is an addition beyond the assignment’s simplified/mockable requirement and increases scope.

## Stage 3 — Confirmed/accepted experience enhancements

- Match Score with explanation and nearby place preference.
- Compare up to four stays.
- Static map preview.
- Cancellation retaining record and freeing dates.
- Warm editorial style, desktop-first with mobile support, subtle transitions.
- Specific category labels, including Devotional / Spiritual.

These should be added one by one after required baseline works. Exact ordering among extras remains open.

## Stage 4 — Stretch

- Step-free accessibility filter.
- Guest-written reviews, interactive map, cloud image uploads, dark mode, richer calendar/pricing tools if time permits.
- AI chatbot through OpenRouter free API **last**, only if still free/available and time remains.

## Out of scope for initial submission

- Real payment processing, real identity verification, messaging, Airbnb APIs/data, live map pricing pins, production marketplace/legal operations, full admin dashboard, social login.

## Milestone gates

1. Discussion finished and scope approved.
2. Required browse-to-book and host CRUD work with persistence.
3. Auth and approval path works if time allows within chosen scope (currently accepted user addition).
4. UI polish, README, public repo, deployment validated.
5. Only then add extras; chatbot remains last.
