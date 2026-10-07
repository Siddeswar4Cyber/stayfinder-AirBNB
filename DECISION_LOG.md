# Decision Log

Chronological record based on project conversations. Dates are included only where known from session context; earlier message timestamps were not individually retained, so sequence is used.

| Sequence/date | Decision | Reason/context | Status/impact |
|---|---|---|---|
| Initial assignment review; 2026-10-06 | Project is an Airbnb-style stay app, not a real Airbnb integration. Assignment allows mock data and payment. | Brief reviewed. | CONFIRMED baseline. |
| Discussion | Focus only on stays, not Experiences/Services. | User selected stays only. | CONFIRMED. |
| Discussion | Add Stay Match Score based on budget, location, amenities, property type, with equal weights and explanations; allow specific nearby place. | User accepted preference set and nearby place addition. | PROPOSED extra accepted; algorithm details TBD. |
| Discussion | Compare up to four stays by total estimate/location/amenities/match score. | User selected four. | PROPOSED extra accepted. |
| Discussion | 20 popular India locations plus Scaler AI Labs location; then add requested destinations. | User initially requested 20 plus Scaler location; clarified Scaler AI Labs office locations; later added Kashi (alias of Varanasi), Visakhapatnam, Ooty, Darjeeling, Thanjavur, Puducherry, Jammu & Kashmir. | Final user-curated 26 canonical destinations; at least five each (>=130). Not official “top 20.” |
| Discussion | FastAPI, not Django. | User said “FastAPI only it fix.” | CONFIRMED stack. |
| Discussion | Booking only blocks dates after successful mock payment and final availability recheck. | User agreed after payment behavior discussion. | CONFIRMED. |
| Discussion | Mock payment gets page, all necessary synthetic details/validation, 5-second process, success and designated test decline. | User requested payment page and accepted decline path. | CONFIRMED; exact fields/test values TBD; must not collect real card credentials. |
| Discussion | Login/register added; public visitors can browse but actions limited; booking requires login. | User requested auth, then said browsing without login but limited; confirmed booking must require login. | CONFIRMED project addition. |
| Discussion | Account role determines access (RBAC). | User explicitly requested RBAC. | CONFIRMED; server enforcement required. |
| Discussion | New accounts start Guest; Become a host can create Host access. | Assistant recommended; user initially approved. | SUPERSEDED by later host-registration approval decision below; retain as possible Guest-to-Host application re-entry behavior. |
| Later discussion | Host registration requests go to Admin for approval. | User explicitly proposed, then confirmed. | CONFIRMED; pending application and minimal admin approval page required. |
| Following turn | Rejected applicant remains Guest and may apply again. | User accepted recommendation. | CONFIRMED. |
| Discussion | Seed Admin account; no broad admin console. | Needed to demonstrate host approval; earlier general admin page deferred. | CONFIRMED limited admin approval interface. Actual credentials TBD and must be private/synthetic. |
| Discussion | Host photos entered by URL first. | User accepted. | CONFIRMED initial approach; assignment allows URL/upload. |
| Discussion | Seed listing reviews; guest-written reviews later if time. | User accepted sample reviews and deferred review creation. | Seed review display required; write-review is optional future. |
| Discussion | Favorites and compare up to four; user login gates account features. | Assignment requires simple favorites; comparison extra. | Favorites CONFIRMED baseline, four-way compare extra. |
| Discussion | Search filters include price, property type, amenities, capacity, date availability. | User approved recommendation. | CONFIRMED baseline interpretation; exact controls TBD. |
| Discussion | Cancel confirmed trips, retain canceled record and release dates. | User approved. | CONFIRMED addition. |
| Discussion | Static map preview on detail. | User approved; assignment allows static/basic map. | CONFIRMED proposed scope; exact map asset TBD. |
| Discussion | Category examples Beach, Cabins, Amazing Views, Countryside; later user added Devotional. | User requested devotional category. | Specific category labels accepted as project design; required category row itself is assignment baseline. |
| Discussion | Desktop-first, mobile support. | User approved. | CONFIRMED preference; responsive optional in assignment. |
| Discussion | Warm editorial visual design with restrained coral, soft neutrals, large images; Airbnb-like patterns. | User approved proposed style. | CONFIRMED direction; exact match brief tension remains OPEN (see `DESIGN_DECISIONS.md`). |
| Discussion | Use animations when useful; several UI examples; short/subtle and reduced motion. | User requested and liked examples. | CONFIRMED direction. |
| 2026-10-06 | Deadline Oct 7 at 4 PM IST; user has 12–14 hours. | User supplied. | CONFIRMED constraint, local date/time. |
| Discussion | AI chatbot using OpenRouter free API; add at last. | User identified free OpenRouter API; explicitly said add at last. | FUTURE/EXPERIMENTAL; verify terms/model availability. |
| Earlier interrupted build attempt | Assistant prematurely created scaffold despite discussion not complete; user asked delete all; assistant removed files. | Process correction. | No code remains; user reiterated don't assume requirements; this documentation separates assignment vs extras. |
| Current documentation task; 2026-10-06 | Create 14 requested docs plus useful companion docs; no implementation code. | User explicitly requested complete pre-implementation package. | CONFIRMED task; this does not mark project discussion complete or authorize app implementation. |
