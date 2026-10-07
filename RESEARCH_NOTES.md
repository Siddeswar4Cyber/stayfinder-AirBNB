# Research Notes

## Motivation and scope

The assignment directs the developer to study Airbnb’s UI/UX before starting. Research is product reconnaissance to reproduce relevant stay marketplace patterns and avoid outdated comparisons. This project is not an academic model-training study.

## Research questions

1. What are current Airbnb’s core stay discovery/search patterns?
2. Which functions in the assignment can be faithfully mocked?
3. Which proposed app differentiators overlap with Airbnb’s current product?
4. Which deployment/AI options fit the user’s no-credit-card constraint?

## Findings already obtained (official sources checked 2026-10-06)

- Airbnb stay search includes location/destination, dates, and guests; search guide describes flexible-date/monthly options, point-of-interest search, map browsing, wishlists, and split stays. [Search guide](https://www.airbnb.com/help/article/252)
- Airbnb offers filters such as price, property type, rooms/beds, amenities, booking options, accessibility, and other categories. [Filter guide](https://www.airbnb.com/help/article/479)
- Airbnb host resources describe Today, Calendar, and Listings dashboards. [Host resource guide](https://www.airbnb.com/help/article/3116)
- Airbnb says total price with fees before taxes is shown in search results worldwide. [Total price announcement](https://news.airbnb.com/total-price-display-is-now-standard-globally)
- Official Airbnb autumn 2026 update (dated Sep 30, 2026) describes AI search, AI filters, AI listing descriptions, AI-powered home comparisons, and AI customer support; feature rollout can vary by market. This invalidates any claim that our planned chatbot or comparison is definitely absent from Airbnb. [Airbnb autumn update](https://news.airbnb.com/en-uk/airbnb-2026-autumn-update)
- Airbnb’s official homepage has promoted homes, experiences, services, and AI search. The user selected a stays-only project; other categories are excluded. [Airbnb homepage](https://www.airbnb.com/)
- Scaler’s official contact page lists a Bengaluru office. Bengaluru was included in the sample destinations as the user requested Scaler AI Labs office location representation. This does not establish a list of multiple Scaler AI Labs offices. [Scaler contact page](https://fp.scaler.com/contact/)
- Government of India tourism sources were consulted for destination context, but there is no agreed authoritative “top 20” list used. User-curated 26 destinations are canonical for this project. [Tourism Ministry material](https://www.tourism.gov.in/sites/default/files/2020-04/Maharashtra.pdf), [Incredible India: Varanasi](https://www.incredibleindia.gov.in/en/uttar-pradesh/varanasi), [Ayodhya](https://www.incredibleindia.gov.in/en/uttar-pradesh/ayodhya), [Tirupati](https://www.incredibleindia.gov.in/en/andhra-pradesh/tirupati)
- OpenRouter current pricing page lists a free plan with 25+ free models and 50 requests/day; its `openrouter/free` router routes among free models at zero token price. Rate limits and model pool can change. [Pricing](https://openrouter.ai/pricing), [free router](https://openrouter.ai/openrouter/free)
- Railway pages were consulted: Railway pricing advertises Free at $0, $1 monthly usage credit after trial, no card required as presented on the pricing page, and 0.5 GB volume; free services/volumes have plan/usage/data-retention constraints. Recheck exact terms before deployment. [Pricing](https://railway.com/pricing), [free trial](https://docs.railway.com/pricing/free-trial), [volumes](https://docs.railway.com/volumes/reference), [monorepo deploy](https://docs.railway.com/guides/deploying-a-monorepo)

## Decisions informed by research

- Use Airbnb-like destination/date/guest search, filters, cards, listing detail, booking, favorites, and host tools.
- Do not build full real payment, live map pricing, identity verification, messaging, or cloud photo pipeline for baseline; assignment explicitly permits mock/placeholder approaches.
- Treat Match Score and compare as additional app features, not claims of originality relative to Airbnb.
- Keep the map static/basic initially.
- Prefer Railway as discussed for a monorepo with Next.js/FastAPI and SQLite volume, but free usage/persistence/no-card eligibility is not guaranteed and must be revalidated.
- OpenRouter is a plausible final stretch chatbot route, with free tier quotas and variability.

## Methodology and experiments

- Method: read assignment document; search/open official Airbnb/Scaler/Railway/OpenRouter pages; record current claims and dates.
- No prototype experiments, usability studies, analytics, or API calls against OpenRouter have been run.
- No user dataset, model evaluation split, or benchmark exists.

## Limitations and open research

- Airbnb experience changes frequently; features and rollout differ by geography/account/app. Recheck immediately before design/deployment.
- “Top Indian destinations” has no project-agreed official ranking; list is curated by user.
- Scaler office research confirmed Bengaluru only via official contact page; user’s phrase “Scaler AI Labs office locations” was not verified as a plural list.
- OpenRouter no-card signup conditions were not independently verified for this user/account.
- Railway persistence, monthly credit sufficiency, trial transitions, cold-start/availability, and no-card restrictions require fresh verification at deployment.
- Image sources/licensing for seed photos remain open.

## Future research

- Review actual current Airbnb desktop/mobile UI directly before styling.
- Verify Railway and OpenRouter plan terms as of implementation date.
- If chatbot is implemented, evaluate fact grounding with seeded listings, uncertainty handling, and failure fallback.
- Optional short usability walkthrough with evaluators/peers; not yet planned as formal study.
