# Data Specification

## Data sources and lineage

| Data | Source/status | Notes |
|---|---|---|
| Application listing catalog | Synthetic seed data, CONFIRMED. | Minimum 5 stays in each of 26 destinations; >=130 total. No real Airbnb data/API. |
| Guest/host/admin accounts | Synthetic seed records, CONFIRMED. | Local demo seed creates 1 admin, 1 approved host, and 1 guest when `ALLOW_DEMO_SEED=true`; disable this outside local development. |
| Existing bookings | Synthetic seed records, CONFIRMED. | Local seed creates 1 confirmed booking on listing 1 for 2099-02-01 through 2099-02-04. |
| Listing photos | Mock/placeholder media allowed. Host image URL accepted. Specific seed source/license is UNKNOWN/TBD. | Do not assume Unsplash or any specific provider; transient deleted scaffold used sample URLs but that code was removed and source not approved. |
| Reviews | Synthetic seeded review text, PROPOSED/necessary to populate required reviews section. | Assignment requires a reviews section, but does not specify review count/source. Guest-authored reviews are optional bonus. Clearly use demonstrative sample content; avoid false real testimonials. |
| Categories, amenities, nearby points | Curated synthetic listing metadata. | Labels should support requested category/filter demonstrations. Accuracy/source policy TBD. |

## Implemented logical entities/schema

The local backend implements this schema with SQLAlchemy models in `backend/models.py`. The SQLite schema is reproducibly created by `backend/init_db.py`; API behavior remains documented separately.

| Entity | Key fields | Relationships / notes |
|---|---|---|
| User | id, name, email (unique), password_hash, role (`guest`, `host`, `admin`), account_status | Hosts may have pending/approved/rejected application state; role/state model needs a final schema decision. Never store plaintext password. |
| HostApplication | id, user_id, status, created_at, optional decision_note | Reapplication after rejection creates a new application row; prior decisions remain persisted. |
| Listing | id, host_id, title, description, destination/city, locality/landmark, location description, nightly_price, currency, type, guest_capacity, bedrooms, bathrooms, category, rating aggregate | Owned by approved host. Search filters use persisted attributes. |
| ListingPhoto | id, listing_id, image_url, sort_order, alt_text | Assignment allows URL or upload; URL entry chosen for initial host workflow. |
| Amenity | id, name | ListingAmenity join table if normalized; JSON storage is an alternative but not decided. |
| Booking | id, guest_id, listing_id, check_in, check_out, guests, total, status, created_at | Status is `confirmed` or `cancelled` in the current implementation. Confirmed date ranges block nights; cancelled rows do not. |
| Review | id, guest_id or sample author label, listing_id, rating, text, created_at | Seeded display first; submission after completed stay is optional future. |
| Favorite | guest_id, listing_id, created_at | Unique guest/listing pair recommended. |
| PaymentAttempt | id, booking/session reference, outcome, created_at, safe demo metadata | Stores only synthetic outcome/reference metadata. It has no PAN, CVV, expiration, or real payment credential fields. |

## Data processing rules

- Destination list is canonicalized as listed below. Kashi is an alternate name for Varanasi and counts as one destination.
- At least five listings per canonical destination, minimum 130 total.
- Seed varied listing types, prices, guest capacities, amenities, ratings, photos, hosts, and category values. Exact distribution is TBD.
- Synthetic listings using the `Sunrise Stay` variant advertise `Step-free access` for the approved accessibility filter; this is demonstrative metadata, not verified accessibility certification.
- Search date availability considers overlapping confirmed bookings using half-open stay intervals `[check_in, check_out)`; same-day checkout/check-in is normally non-overlapping. This interval rule is a proposed conventional assumption and should be confirmed in implementation.
- Booking checks `check_out > check_in`, guest count within capacity, and overlap status. Recheck at final confirmation.
- Price quote uses INR nightly rate × nights, cleaning fee `35%` of the nightly rate, and service fee `12%` of the subtotal. No tax is currently added.
- Cancellation changes status rather than deleting the booking and releases the blocked interval.
- Stay Match Score: selected preferences use equal weighting and return match/non-match explanations. Nearby-place matching is intentionally local metadata matching against destination/description; no external geolocation service is used. The result is subjective.
- Comparison accepts one to four listing IDs and returns public summaries in requested order; it is authenticated and does not persist a comparison set.

## Confirmed destination catalog (26)

1. Goa
2. Jaipur
3. Delhi
4. Agra
5. Mumbai
6. Bengaluru
7. Hyderabad
8. Chennai
9. Kolkata
10. Kochi
11. Munnar
12. Manali
13. Shimla
14. Rishikesh
15. Kashi (Varanasi)
16. Ayodhya
17. Tirupati
18. Amritsar
19. Udaipur
20. Mysuru
21. Visakhapatnam
22. Ooty
23. Darjeeling
24. Thanjavur
25. Puducherry
26. Jammu & Kashmir (one broad region)

This is a user-curated destination list, not a verified official ranking. Bengaluru was included to represent the discussed Scaler AI Labs office location; Scaler’s official contact page lists a Bengaluru office, but this is not evidence of an official “Scaler AI Labs destination list.”

## Splitting/evaluation policy

**N/A for current assignment.** There is no ML training corpus, model training, train/validation/test split, or research benchmark. The app uses sample data for functional demonstration. If formal model/data evaluation is later proposed, define a separate non-leaky protocol first.

## Privacy and retention

- Collect only fields needed for accounts and bookings.
- Passwords stored only as secure hashes (security requirement proposed).
- Payment form uses synthetic values and must not store/send real card numbers or security codes.
- Payment attempts contain only the authenticated user, synthetic outcome/reference, timestamps, and optional booking link. They must never contain card numbers, CVVs, bank details, or payment secrets.
- Avoid sending guest personal data to optional AI. Chatbot should receive only relevant listing facts and user query after minimizing personal context.
- Deletion/retention, user export, and privacy notice requirements are TBD; assignment does not specify them.
