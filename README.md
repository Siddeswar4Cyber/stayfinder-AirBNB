# StayFinder

StayFinder is a local Airbnb-style accommodation marketplace demo. It uses synthetic property, host, guest, review, and booking data. Booking payments are simulated; the app does not connect to Airbnb or a real payment processor. Listing maps use OpenStreetMap tiles when coordinates are available.

## Features

- Browse stays grouped by destination, with responsive place cards, location pagination, and popularity sorting.
- Search by destination or keyword, dates, guest count, property category/style, price range, and amenity, including step-free access. The API validates date ranges and filters out unavailable stays.
- View listing photos, description, amenities, host name, seeded reviews, approximate map location, availability, and an itemized price quote.
- Register and log in as a guest or prospective host. Host applications need administrator approval before host management routes are available. The backend enforces roles and listing ownership.
- Make a demo booking using a success or decline mock-payment outcome. The backend recalculates prices, consumes a successful payment attempt once, and rechecks availability in a SQLite write transaction. Guests can view and cancel bookings; cancellation retains the record and releases its dates. Refunds are not modeled.
- Save and remove stays in an account-specific wishlist.
- Create, edit, and delete host listings and view bookings for owned listings. Listing photos are supplied by URL; file upload is not implemented.
- Review pending host applications in the admin page; compare up to four stays; view the subjective Stay Match Score on listing details.
- Seed 130 synthetic stays (five for each of 26 Indian destinations), with image URLs, hosts, reviews, and sample bookings.

## Technology and architecture

- **Frontend:** Next.js App Router, React, and TypeScript. Pages live in `frontend/app`; reusable UI and shared favorites state are in `frontend/components`; API calls and types are in `frontend/lib`. The browser calls the backend using `NEXT_PUBLIC_API_URL` and sends credentials with requests.
- **Backend:** Python and FastAPI with Pydantic request validation. Routes and request handlers are in `backend/main.py`; search and availability logic are in `backend/marketplace.py`; geography/destination data is in `backend/geography.py`; deterministic demo data is in `backend/seed.py`.
- **Persistence:** SQLite, configured in `backend/db.py`. SQLAlchemy models in `backend/models.py` define the schema and create missing tables. API handlers currently use parameterized `sqlite3` statements. Startup includes compatibility additions for listing coordinates and booking check-in/check-out times. There is no general-purpose migration framework; `create_all` does not update arbitrary existing columns.
- **Authentication:** Passwords use salted PBKDF2-HMAC-SHA256. Random session tokens are stored as hashes, issued in an HttpOnly cookie, and expire after 12 hours. Protected endpoints also accept a bearer token. Role and ownership checks run in the API.
- **External resources:** Listing imagery is provided by image URLs, with a generated fallback in the frontend. The map uses OpenStreetMap tiles. No map key or payment credentials are used.

### Database schema

| Table | Purpose |
|---|---|
| `users` | Guest, host, and administrator accounts; role and host approval state. |
| `auth_sessions` | Hashed session tokens, expiry, and revocation state. |
| `applications` | Host applications and administrator decisions. |
| `listings` | Listing details, owner, location, capacity, price, category, image, and amenities JSON. |
| `amenities` | Shared amenity names. |
| `listing_amenities` | Normalized listing-to-amenity associations. |
| `listing_photos` | Listing photo URLs, order, and alt text. |
| `reviews` | Seeded review author, rating, and text. Review submission is not implemented. |
| `bookings` | Guest reservation dates/times, guest count, total, and status. |
| `favorites` | Account-specific saved listings, unique per user/listing pair. |
| `payment_attempts` | Synthetic payment outcomes and the booking, if any, that consumed the attempt. |

Listings currently store amenities both as JSON and in the normalized relation tables. This is a transitional duplication. SQLite foreign-key enforcement is enabled for API connections.

## Local setup

Prerequisites: Python 3.10 or newer, Node.js 18.18 or newer, and npm. Run the backend and frontend in separate PowerShell terminals from the repository root.

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:APP_ENV = "development"
$env:ALLOW_DEMO_SEED = "true"
python -m uvicorn main:app --reload --port 8000
```

The API base URL is `http://localhost:8000/api`; interactive FastAPI docs are at `http://localhost:8000/docs`. The default database is `backend/stayfinder.db`. Set `DATABASE_PATH` to use a different SQLite file; relative paths are resolved from `backend/`. At startup the schema is created and missing seed data is added when demo seeding is enabled. Seeding does not reset an existing database.

### Frontend

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The default API URL is `http://localhost:8000/api`. Set `NEXT_PUBLIC_API_URL` to the API base URL, including `/api`, before building or starting the frontend. The `.env.example` files document variables but are not loaded automatically by the backend; export them in the shell or configure them in the process manager.

### Demo accounts

These accounts are seeded only when `ALLOW_DEMO_SEED=true`:

| Role | Email | Password |
|---|---|---|
| Guest | `guest@stayfinder.local` | `guest123` |
| Approved host | `host@stayfinder.local` | `host123` |
| Administrator | `admin@stayfinder.local` | `admin123` |

The seed data also creates additional hosts (`@stayfinder.local`, password `homestay2026`) and guests (`@stayfinder.local`, password `traveller2026`). These public demo credentials must not be used in a deployed environment.

## API overview

All application endpoints are prefixed with `/api`. FastAPI publishes the exact request and response schemas at `/docs`.

| Area | Routes | Purpose |
|---|---|---|
| Discovery | `GET /health`, `GET /destinations`, `GET /listings`, `GET /listings/{id}`, `GET /listings/{id}/availability`, `GET /listings/{id}/reviews` | Health, destinations, filtered/paginated search, details, availability, and seeded reviews. |
| Matching and comparison | `GET /listings/{id}/match-score`, `GET /listings/compare` | Preference-based subjective score and comparison of one to four listings (authenticated). |
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Guest/host registration and cookie-backed sessions. |
| Host approval | `POST /host-applications`, `GET /admin/host-applications`, `POST /admin/host-applications/{id}/decision` | Submit host applications and let admins review them. |
| Bookings | `POST /bookings/quote`, `POST /payments/mock`, `POST /bookings`, `GET /me/bookings`, `GET /me/bookings/{id}`, `GET /host/bookings`, `POST /bookings/{id}/cancel` | Quote, development-only mock payment, booking confirmation, guest trip views, host booking views, and cancellation. |
| Wishlist | `GET /me/favorites`, `PUT /me/favorites/{listing_id}`, `DELETE /me/favorites/{listing_id}` | Account-specific saved stays. |
| Host listings | `GET /host/listings`, `POST /host/listings`, `PATCH /host/listings/{id}`, `DELETE /host/listings/{id}` | Read and manage listings owned by an approved host. |

Search accepts destination, search text, category, style and amenity filters, step-free access, guests, price range, dates, page, and limit. See `API_SPECIFICATION.md` for the broader API notes and `DATA_SPECIFICATION.md` for data definitions. The mock-payment endpoint deliberately returns 404 outside development; production bookings therefore require a payment-mode decision and implementation before they can work.

## Configuration and deployment

Backend variables are documented in `backend/.env.example`; frontend configuration is in `frontend/.env.example`.

| Variable | Behavior |
|---|---|
| `APP_ENV` | `development`, `test`, or `production`; defaults to `production`. Set `development` for the local commands above. |
| `DATABASE_PATH` | SQLite file path; defaults to `backend/stayfinder.db` locally. Required in production and must point to persistent storage. |
| `APP_SECRET` | Required in production; use a random secret of at least 32 characters. Used to HMAC session-token hashes. |
| `CORS_ORIGINS` | Comma-separated allowed browser origins. Production requires explicit HTTPS origins. |
| `ALLOW_DEMO_SEED` | Defaults to true only in development and false otherwise. Production rejects `true`. |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | Used once to create the initial production administrator when the database has no admin. Use a valid email and a password of at least 16 characters, then remove both variables. |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL, including `/api`; public and must not contain secrets. In production it must be HTTPS and is embedded into the frontend at build time. |

### Deploy to Railway

The repository is a monorepo, so deploy the frontend and backend as two services from the same GitHub repository. Railway's service root directory controls which subdirectory is built; the backend must have persistent storage because its SQLite file stores accounts, listings, and bookings.

1. Push this repository to GitHub. In Railway, create a project and add a service from that repository for the API and another for the frontend.
2. For the API service, set **Settings → Root Directory** to `/backend`. Set its start command to `uvicorn main:app --host 0.0.0.0 --port $PORT` and healthcheck path to `/api/health`.
3. Attach a persistent volume to the API service with mount path `/data`. Set these API service variables:

   ```text
   APP_ENV=production
   ALLOW_DEMO_SEED=false
   DATABASE_PATH=/data/stayfinder.db
   APP_SECRET=<random secret, at least 32 characters>
   BOOTSTRAP_ADMIN_EMAIL=<your administrator email>
   BOOTSTRAP_ADMIN_PASSWORD=<unique password, at least 16 characters>
   CORS_ORIGINS=<frontend HTTPS origin>
   ```

   Generate an `APP_SECRET` locally with `python -c "import secrets; print(secrets.token_hex(32))"`. Keep secrets in Railway variables; never commit them.
4. For the frontend service, set **Settings → Root Directory** to `/frontend`. Set its build command to `npm ci && npm run build` and start command to `npm run start -- --hostname 0.0.0.0 --port $PORT`. Generate a Railway HTTPS domain for each service. Set the API's `CORS_ORIGINS` to the exact frontend origin (scheme and host only, no trailing slash or path).
5. Set these frontend service variables before building:

   ```text
   APP_ENV=production
   NEXT_PUBLIC_API_URL=https://<api-service-domain>/api
   ```

   The Next.js config rejects a missing, non-HTTPS, or malformed production API URL during build, so set this variable before the first frontend deployment. If the API domain changes, update this variable and rebuild the frontend.
6. Deploy the API first. On a new volume, the API creates the schema and the bootstrap administrator. After the API starts successfully, remove `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` from the API variables; the stored administrator remains. Then deploy the frontend and open its HTTPS domain.
7. Verify `https://<api-service-domain>/api/health` returns `{"status":"ok","version":"1.0.0"}` and that the frontend can load the API. Log in to the admin account, register a host, approve the host, and add listings. Production disables synthetic demo seeding, so a new production database starts without demo listings or demo accounts.

Railway's free trial/plan limits and storage pricing can change; check its [current plans](https://railway.com/pricing) before deploying. A persistent volume is required for data durability. This SQLite setup is for one API instance; do not scale it to multiple replicas or regions. For higher traffic, use a managed database and add a versioned schema migration process.

This deployment runs the application but is not a production payment service: mock payments are deliberately disabled outside development, and no real payment processor is implemented. Reservation checkout will not complete until a payment provider and verified payment flow are added. No hosted deployment or production credentials are included in this repository. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for environment setup and a local production-style startup check.

## Checks

Available project commands include:

```powershell
cd frontend
npm run typecheck
npm run build
cd ..\backend
python -m compileall -q .
```

There is no backend test suite or configured frontend lint script in the current repository. For this production-readiness pass, `npm run typecheck`, a frontend production build, a second frontend build with `APP_ENV=production` and a valid HTTPS API URL, and backend Python compilation all passed. An isolated production-mode SQLite startup check created the schema and bootstrap admin, verified database health, and confirmed that demo listings were not seeded. The application flows were not exercised end to end against a hosted service.

## Scope and assumptions

- Listings, images, reviews, accounts, and sample bookings are synthetic examples.
- Demo payments model success/decline without collecting or charging payment details.
- The map marks approximate coordinates using OpenStreetMap; it does not use a third-party geocoding or booking service.
- Guest-to-host messaging, identity verification, image upload/storage, review submission, real payments/refunds, and the optional AI chatbot are not implemented.
- StayFinder uses original branding and does not connect to Airbnb services.
