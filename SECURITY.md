# Security

## Security objectives

- Protect account credentials and private booking information.
- Ensure guests can only access their own trips and favorites.
- Ensure hosts can change only listings they own and see only related booking data.
- Ensure only Admin can approve/reject host applications.
- Prevent double booking through server-side availability checks.
- Never collect or retain real payment credentials in the mock flow.
- Demo account seeding is controlled by `ALLOW_DEMO_SEED`; production deployments must disable it and provide a separate secure administrator bootstrap process.
- Booking confirmation requires an authenticated user's unconsumed successful mock payment attempt; payment attempts are atomically claimed and cannot be reused.
- Login return paths accept only same-origin relative paths, preventing external redirect targets.
- Mock payment attempts are linked to the authenticated user and store only outcome/reference metadata; card, CVV, banking, and payment-secret fields are not accepted or persisted.
- Booking confirmation ignores client totals, serializes SQLite writes with `BEGIN IMMEDIATE`, and performs the final overlap check inside the transaction.
- Guest trip details/cancellation are ownership-scoped; approved hosts can view bookings only for their own listings.

## Threat model and attack surface

| Surface | Example risk |
|---|---|
| Registration/login API | Credential stuffing, weak passwords, enumeration, plaintext credential leak. |
| Auth/session mechanism | Token theft/replay and cross-site requests. Opaque sessions expire after 12 hours, are stored as hashes, and are delivered in HttpOnly SameSite cookies; unsafe browser requests are restricted to configured origins. |
| Role and owner checks | Guest elevates to Host/Admin; Host edits another Host’s listing; guest reads another trip. |
| Booking endpoints | Date race/double booking, forged total/status, invalid guest count or date ranges. |
| Listing CRUD/forms | Stored XSS in text/photo metadata, malformed URLs, excessive input, unauthorized deletion. |
| Admin approval | Unauthorized approval or forged request state. |
| Mock payment | Users mistake demo form for real payment; accidental collection of actual card details. |
| Public images/external API | Tracking, broken/malicious URLs, availability dependency. |
| Deployment/secrets | API key, database, debug details, or credentials committed/publicly exposed. |
| Optional OpenRouter integration | Key theft, prompt injection via listing/user text, data over-sharing, quota exhaustion, model hallucinations. |

## Controls

### CONFIRMED product controls

- Auth-gate booking; role-based permissions determine guest/host/admin access.
- Host approval must precede host privileges.
- Listing management requires an authenticated host with `host_status=approved`; ownership is checked against the authenticated user for every read, update, and delete.
- Listings with pending or confirmed bookings cannot be deleted, preventing referential loss of active reservations.
- Admin application decisions are restricted to pending applications and cannot be replayed after a decision.
- Backend must enforce roles/ownership, not merely hide UI controls.
- Booking availability is rechecked after simulated payment; failed payment creates no confirmed booking.
- Payment is a simulation; no real transaction integration.

### PROPOSED implementation controls to adopt

- Password hashing using a current password-hashing library; never log passwords.
- Opaque session tokens are stored only as SHA-256 hashes in `auth_sessions`; HttpOnly cookies expire after 12 hours and logout records a revocation timestamp.
- Parameterized ORM/database access; strict Pydantic validation; safe error messages.
- Server-calculated pricing and status; never trust client-supplied total/role/owner ID.
- Transactional booking conflict check + insert; protect from concurrent requests.
- CORS restricted to actual frontend origin; HTTPS in deployment; no wildcard credentialed CORS.
- Rate-limit/auth-throttle login and chatbot endpoints if feasible.
- Keep OpenRouter key server-side in environment; constrain model output and listing context; degrade safely on quota/API failure.
- Strictly label payment as demo and only accept documented synthetic test values. Do not request users’ real card details. If visual card form is necessary, ensure values remain client-side and are not logged or persisted; safer alternative is synthetic payment token/test selector.
- Validate image URL scheme (`https` preferred), lengths, and text rendering; escape user content.
- Provide privacy notice and minimal data retention policy before public demo.

## Privacy requirements

- Minimize personal data to name, email, password hash, and booking fields required by the app.
- No real payment data; no identity documents; no real Airbnb data.
- Seed/demo account data must be clearly synthetic.
- Before chatbot requests, send listing facts needed to answer, not passwords, email, or guest booking history.
- Establish data deletion/retention and public privacy notice before deployment: **TBD**.

## Risks and future improvements

- Free hosting may expose a public demo with weakly protected sample data; use synthetic content and enforce auth.
- Pending hosts and admin bootstrap may be abused if no rate limiting or secure seeded-admin process exists.
- Mock payment UI can confuse users unless prominently labeled.
- SQLite on a single persistent volume is vulnerable to loss/quota limits and single-instance constraints; backup/recovery decision is TBD.
- OpenRouter free model routing can change and may be unreliable; chatbot is last and optional.
- Future production scope would require threat review, stronger account recovery/verification, audit logs, backups, payment provider compliance, and formal privacy/legal review.
