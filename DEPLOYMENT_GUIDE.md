# StayFinder deployment guide

This guide describes a Railway deployment for the current repository. It does not create a Railway project, GitHub repository, or production account, and it does not claim that a hosted deployment has been completed.

## Architecture

- `frontend/`: Next.js app, deployed as its own Railway service.
- `backend/`: FastAPI app, deployed as its own Railway service.
- The browser calls the API directly using `NEXT_PUBLIC_API_URL`.
- SQLite data must live on a Railway volume mounted at `/data`. Keep the API to one replica.

## Railway setup

1. Push the repository to GitHub and create a Railway project with two services from the same repository.
2. API service: set root directory to `/backend`; set start command to `uvicorn main:app --host 0.0.0.0 --port $PORT`; set healthcheck path to `/api/health`.
3. Attach a persistent volume to the API with mount path `/data`. Add these variables to the API service:

   ```text
   APP_ENV=production
   ALLOW_DEMO_SEED=false
   DATABASE_PATH=/data/stayfinder.db
   APP_SECRET=<random secret of at least 32 characters>
   CORS_ORIGINS=<exact frontend HTTPS origin>
   BOOTSTRAP_ADMIN_EMAIL=<administrator email for first startup>
   BOOTSTRAP_ADMIN_PASSWORD=<unique password of at least 16 characters for first startup>
   ```

   Generate a random app secret locally with `python -c "import secrets; print(secrets.token_hex(32))"`. Do not put production secrets in Git.
4. Frontend service: set root directory to `/frontend`, build command to `npm ci && npm run build`, and start command to `npm run start -- --hostname 0.0.0.0 --port $PORT`. Generate HTTPS domains for both services. Use the exact frontend origin, with no path or trailing slash, for the API's `CORS_ORIGINS`.
5. Before building the frontend, set `APP_ENV=production` and `NEXT_PUBLIC_API_URL=https://<api-domain>/api` on its service. The Next.js configuration fails the build if this value is missing, not HTTPS, or does not end in `/api`. This value is embedded in the browser bundle during build; changing the API domain requires rebuilding the frontend.
6. Deploy the API first. On a new volume, startup creates the SQLite schema and creates the initial admin using the bootstrap variables. After confirming the API is running, remove both bootstrap variables; the saved admin account remains. Then deploy the frontend.
7. Check `https://<api-domain>/api/health` returns a successful JSON status, then open the frontend domain and log in as the bootstrap admin. Register a host account, approve it in Admin, and create listings.

## Production variables

| Variable | Service | Purpose |
|---|---|---|
| `APP_ENV=production` | Both | Enables production checks and secure session cookies. |
| `ALLOW_DEMO_SEED=false` | API | Prevents public demo users and sample bookings from being created. |
| `DATABASE_PATH=/data/stayfinder.db` | API | Places the database on the attached persistent volume. The API verifies this is inside Railway's volume mount path. |
| `APP_SECRET` | API | Secret of at least 32 characters used to HMAC session token hashes. |
| `CORS_ORIGINS` | API | Exact public frontend origin, for example `https://stayfinder-frontend.up.railway.app`. |
| `BOOTSTRAP_ADMIN_EMAIL` | API, one-time | Creates the first administrator when the database has no admin. |
| `BOOTSTRAP_ADMIN_PASSWORD` | API, one-time | Initial admin password, minimum 16 characters. Remove after first successful startup. |
| `NEXT_PUBLIC_API_URL` | Frontend, build time | Public API URL with `/api` suffix, for example `https://stayfinder-api.up.railway.app/api`. |

The `.env.example` files are templates only and are not loaded automatically by the backend. Set variables in Railway's service settings. Never expose secrets via `NEXT_PUBLIC_*` variables.

## Database and runtime limits

The app creates missing tables at startup and has a small set of compatibility additions for older SQLite files. There is no general-purpose migration framework, so back up the volume before deploying schema changes and do not assume arbitrary old schemas will be upgraded. The production database starts empty because synthetic demo data is prohibited in production; add real listings through the admin and host flows.

SQLite with a persistent volume is suitable for a small, single-instance demo. Do not run multiple API replicas or regions against this file. Use a managed database and a versioned migration process before scaling. Railway volumes are mounted at runtime, so database creation occurs when the API starts.

The mock payment endpoint is disabled outside development. No live payment provider is integrated, so production checkout cannot complete a booking until a real payment flow is implemented. Do not accept real users or payments based on the mock flow.

Railway plan limits and storage pricing change over time; verify the [current Railway plans](https://railway.com/pricing) before deploying. A Railway trial is not a guarantee of free, durable, always-on production hosting.

## Local production-style startup check

From the repository root, use a new database path and temporary credentials so the local database is not touched:

```powershell
$env:APP_ENV = "production"
$env:ALLOW_DEMO_SEED = "false"
$env:DATABASE_PATH = (Join-Path $env:TEMP "stayfinder-production-check.db")
$env:APP_SECRET = (python -c "import secrets; print(secrets.token_hex(32))")
$env:CORS_ORIGINS = "https://example.invalid"
$env:BOOTSTRAP_ADMIN_EMAIL = "admin@example.invalid"
$env:BOOTSTRAP_ADMIN_PASSWORD = "replace-with-a-unique-16-character-password"
Set-Location backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/api/health`; stop the process with Ctrl+C. The health endpoint checks that the database can be queried. Delete the temporary check database when finished.
