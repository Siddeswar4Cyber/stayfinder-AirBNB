from __future__ import annotations

import json
import hashlib
import secrets
import csv
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from sqlalchemy import inspect, select
from sqlalchemy.orm import Session

from models import (
    Amenity,
    Booking,
    Favorite,
    HostApplication,
    Listing,
    ListingAmenity,
    ListingPhoto,
    Review,
    User,
)
from geography import coordinates_for_listing

DESTINATIONS = [
    "Goa", "Jaipur", "Delhi", "Agra", "Mumbai", "Bengaluru", "Hyderabad",
    "Chennai", "Kolkata", "Kochi", "Munnar", "Manali", "Shimla", "Rishikesh",
    "Kashi", "Ayodhya", "Tirupati", "Amritsar", "Udaipur", "Mysuru",
    "Visakhapatnam", "Ooty", "Darjeeling", "Thanjavur", "Puducherry",
    "Jammu & Kashmir",
]


def hash_password(password: str) -> str:
    iterations = 240_000
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${digest.hex()}"


PLACE_DETAILS = {
    "Goa": ("Fontainhas", "Assagao", "Benaulim", "Reis Magos", "Vagator", "Portuguese-era lanes, palm-lined beaches, and slow Konkan mornings"),
    "Jaipur": ("Pink City", "Bani Park", "Amer", "C-Scheme", "Civil Lines", "hand-painted havelis, bustling bazaars, and the old walled city"),
    "Delhi": ("Mehrauli", "Hauz Khas", "Shahjahanabad", "Lodhi Colony", "Greater Kailash", "layered neighbourhoods, Mughal gardens, and excellent street food"),
    "Agra": ("Taj East Gate", "Fatehabad Road", "Sikandra", "Fatehpur Sikri", "Civil Lines", "Mughal gardens, marble craft studios, and early-morning Taj views"),
    "Mumbai": ("Bandra", "Colaba", "Fort", "Juhu", "Powai", "Art Deco promenades, Irani cafés, and the energy of the Arabian Sea"),
    "Bengaluru": ("Indiranagar", "Basavanagudi", "Malleshwaram", "Jayanagar", "Whitefield", "tree-shaded avenues, independent cafés, and lively neighbourhood markets"),
    "Hyderabad": ("Banjara Hills", "Old City", "Jubilee Hills", "Himayatnagar", "Gachibowli", "Charminar lanes, Deccan history, and the aroma of dum biryani"),
    "Chennai": ("Mylapore", "Besant Nagar", "Alwarpet", "Adyar", "ECR", "temple streets, filter coffee, and long walks beside the Bay of Bengal"),
    "Kolkata": ("North Kolkata", "Ballygunge", "Park Street", "Jorasanko", "Salt Lake", "colonial-era balconies, bookshops, and neighbourhood sweet shops"),
    "Kochi": ("Fort Kochi", "Mattancherry", "Vypin", "Kakkanad", "Ernakulam", "Chinese fishing nets, spice-market lanes, and Kerala backwater sunsets"),
    "Munnar": ("Old Munnar", "Chithirapuram", "Pallivasal", "Devikulam", "Anachal", "misty tea gardens, cardamom hills, and winding mountain paths"),
    "Manali": ("Old Manali", "Vashisht", "Naggar", "Aleo", "Prini", "deodar forests, mountain streams, and views of the Beas valley"),
    "Shimla": ("Chhota Shimla", "Mashobra", "Jakhoo", "Kufri", "Summer Hill", "cedar forests, colonial-era walks, and ridgelines above the clouds"),
    "Rishikesh": ("Tapovan", "Laxman Jhula", "Shivpuri", "Swarg Ashram", "Upper Tapovan", "riverfront ashrams, suspension bridges, and quiet Himalayan foothills"),
    "Kashi": ("Assi Ghat", "Godowlia", "Lanka", "Bhelupur", "Ramnagar", "dawn boat rides, riverside steps, and lanes filled with Banarasi silk"),
    "Ayodhya": ("Ram Ki Paidi", "Naya Ghat", "Hanuman Garhi", "Civil Lines", "Guptar Ghat", "quiet riverfront mornings, temple courtyards, and evening aarti"),
    "Tirupati": ("Tiruchanur", "Tirupati town", "Renigunta", "Kapila Theertham", "Alipiri", "pilgrim trails, temple tanks, and the green Tirumala foothills"),
    "Amritsar": ("Ranjit Avenue", "Heritage Street", "Lawrence Road", "Putlighar", "Golden Temple Road", "heritage havelis, the Golden Temple, and generous Punjabi kitchens"),
    "Udaipur": ("Lake Pichola", "Ambamata", "Badi Lake", "Old City", "Fateh Sagar", "lakeside ghats, whitewashed lanes, and Aravalli sunset views"),
    "Mysuru": ("Gokulam", "Lalith Mahal", "Nazarbad", "Vijayanagar", "Kuvempunagar", "palace avenues, sandalwood markets, and relaxed garden neighbourhoods"),
    "Visakhapatnam": ("Rushikonda", "RK Beach", "MVP Colony", "Bheemili", "Yendada", "Bay of Bengal coves, hilltop viewpoints, and fresh coastal seafood"),
    "Ooty": ("Lovedale", "Fern Hill", "Coonoor Road", "Doddabetta", "Charing Cross", "Nilgiri toy-train views, eucalyptus groves, and cool mountain air"),
    "Darjeeling": ("Chowrasta", "Ghoom", "Tukvar", "Lebong", "Kurseong Road", "tea-covered slopes, Himalayan sunrises, and heritage rail journeys"),
    "Thanjavur": ("Big Temple quarter", "Kumbakonam Road", "Old Town", "Vennar banks", "Medical College Road", "Chola stonework, temple-town streets, and the Kaveri delta"),
    "Puducherry": ("White Town", "Auroville", "Serenity Beach", "Heritage Town", "Ariyankuppam", "French-colonial balconies, quiet promenades, and Tamil coastal cooking"),
    "Jammu & Kashmir": ("Dal Lake", "Gulmarg", "Pahalgam", "Srinagar Old City", "Sonamarg", "cedar-clad valleys, houseboat mornings, and mountain meadows"),
}

STAY_STYLES = [
    ("Courtyard House", "City", "A restored neighbourhood home with a shaded courtyard and locally made details.", 0, ["Wi-Fi", "Kitchen", "Air conditioning"]),
    ("Garden Cottage", "Nature", "A quiet, light-filled cottage with a leafy outdoor corner and an easy pace.", 1, ["Wi-Fi", "Kitchen", "Free parking"]),
    ("Balcony Suite", "Luxury", "A carefully finished suite with a private balcony and room for a slow breakfast.", 2, ["Wi-Fi", "Air conditioning", "Workspace"]),
    ("Family Kitchen Home", "Family", "A practical, welcoming home with a full kitchen and space to gather after exploring.", 3, ["Wi-Fi", "Kitchen", "Free parking", "Step-free access"]),
    ("Viewpoint Villa", "Nature", "An independent stay with an open view, a relaxed sitting area, and thoughtful local touches.", 4, ["Wi-Fi", "Kitchen", "Workspace"]),
]

REVIEWERS = ["Ananya Rao", "Kabir Mehta", "Rhea Nair", "Arjun Sen", "Meera Iyer", "Ishaan Kapoor", "Tara Bose", "Dev Malhotra", "Nisha Menon", "Aditi Shah", "Rohan Das", "Sana Ali"]
REVIEW_NOTES = [
    "The neighbourhood was lovely to explore on foot, and the host shared thoughtful local recommendations.",
    "Everything was clean and comfortable; the balcony became our favourite place for morning tea.",
    "A calm, well-kept base for the trip. Check-in was simple and the kitchen had everything we needed.",
    "The photos matched the space, and the location made it easy to find cafés and local transport.",
    "We appreciated the small details and the quick replies. Would happily stay here again.",
    "Bright, comfortable rooms and a genuinely useful guide to the area made this a relaxing visit.",
    "The home felt personal rather than generic, and the host gave us a great tip for a nearby walk.",
    "Good value for the area, with a peaceful place to return to after a full day out.",
]

HOSTS = [
    ("host1", "Aarav Host", "host@stayfinder.local"),
    ("host2", "Ananya Sharma", "ananya.host@stayfinder.local"),
    ("host3", "Kabir Nair", "kabir.host@stayfinder.local"),
    ("host4", "Meera Iyer", "meera.host@stayfinder.local"),
    ("host5", "Rohan Das", "rohan.host@stayfinder.local"),
    ("host6", "Tara Kapoor", "tara.host@stayfinder.local"),
]
GUESTS = [
    ("guest1", "Demo Guest", "guest@stayfinder.local"),
    ("guest2", "Aditi Shah", "aditi.guest@stayfinder.local"),
    ("guest3", "Rohan Mehta", "rohan.guest@stayfinder.local"),
    ("guest4", "Nisha Menon", "nisha.guest@stayfinder.local"),
    ("guest5", "Dev Bose", "dev.guest@stayfinder.local"),
    ("guest6", "Sana Ali", "sana.guest@stayfinder.local"),
]
IMAGE_IDS = [
    "1564013799919-ab600027ffc6", "1600607687939-ce8a6c25118c",
    "1600566753190-17f0baa2a6c3", "1613490493576-7fde63acd811",
    "1600047509807-ba8f99d2cdde",
]
IMAGE_LINKS_PATH = Path(__file__).resolve().parent.parent / "IMAGE_LINKS.csv"
CATEGORIES = ["Beach", "City", "Nature", "Family", "Luxury"]
AMENITIES = ["Wi-Fi", "Kitchen", "Air conditioning", "Workspace", "Step-free access", "Free parking", "Balcony", "Breakfast", "Pool", "Pet-friendly"]


def demo_booking_total(price: Decimal, nights: int) -> Decimal:
    subtotal = price * nights
    cleaning = (price * Decimal("0.35")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    service = (subtotal * Decimal("0.12")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return subtotal + cleaning + service


def seed_database(session: Session) -> None:
    if session.scalar(select(User.id).limit(1)) is not None:
        return

    users = [
        User(
            id="admin",
            name="Admin",
            email="admin@stayfinder.local",
            password=hash_password("admin123"),
            role="admin",
            host_status="approved",
        ),
        User(
            id="host1",
            name="Aarav Host",
            email="host@stayfinder.local",
            password=hash_password("host123"),
            role="host",
            host_status="approved",
        ),
        User(
            id="guest1",
            name="Demo Guest",
            email="guest@stayfinder.local",
            password=hash_password("guest123"),
            role="guest",
            host_status="none",
        ),
    ]
    session.add_all(users)
    session.flush()

    amenity_rows = {name: Amenity(name=name) for name in AMENITIES}
    session.add_all(amenity_rows.values())
    session.flush()

    listings: list[Listing] = []
    for destination_index, destination in enumerate(DESTINATIONS):
        for variant in range(5):
            price = Decimal(1800 + (destination_index * 137 + variant * 500) % 6200)
            listing = Listing(
                host_id="host1",
                title=f"{destination} {['Sunrise', 'Heritage', 'Garden', 'Coastal', 'Vista'][variant]} Stay",
                description=f"A welcoming synthetic stay in {destination}, ideal for exploring local highlights.",
                destination=destination,
                price=price,
                capacity=2 + variant % 5,
                bedrooms=1 + variant % 3,
                bathrooms=1 + variant % 2,
                category=CATEGORIES[variant],
                rating=Decimal("4.30") + Decimal(variant % 7) / Decimal("10"),
                image=f"https://images.unsplash.com/photo-{IMAGE_IDS[variant]}?auto=format&fit=crop&w=900&q=80",
                amenities=json.dumps(
                    ["Wi-Fi", "Kitchen", "Air conditioning"]
                    + (["Workspace"] if variant % 2 else [])
                    + (["Step-free access"] if variant == 0 else [])
                ),
            )
            session.add(listing)
            listings.append(listing)
    session.flush()

    for listing in listings:
        names = ["Wi-Fi", "Kitchen", "Air conditioning"] + (["Workspace"] if listing.category in {"City", "Family"} else [])
        if listing.title.endswith("Sunrise Stay"):
            names.append("Step-free access")
        for name in names:
            session.add(ListingAmenity(listing_id=listing.id, amenity_id=amenity_rows[name].id))
        session.add(ListingPhoto(listing_id=listing.id, image_url=listing.image, sort_order=0, alt_text=listing.title))
        session.add_all(
            [
                Review(
                    listing_id=listing.id,
                    author_name="Verified guest",
                    rating=5,
                    text="A comfortable, thoughtfully prepared synthetic stay.",
                ),
                Review(
                    listing_id=listing.id,
                    author_name="Weekend traveller",
                    rating=4,
                    text="Great location and responsive synthetic host.",
                ),
            ]
        )

    session.add(
        Booking(
            listing_id=listings[0].id,
            guest_id="guest1",
            check_in=date(2099, 2, 1),
            check_out=date(2099, 2, 4),
            guests=2,
            total=listings[0].price * 3,
            status="confirmed",
        )
    )
    session.add(HostApplication(user_id="host1", status="approved", decision_note="Seeded demo host"))
    session.add(Favorite(user_id="guest1", listing_id=listings[0].id))
    session.commit()


def initialize_database(target_engine, *, reset: bool = False, seed: bool = True) -> None:
    from models import Base

    if reset:
        Base.metadata.drop_all(target_engine)
    Base.metadata.create_all(target_engine)
    listing_columns = {column["name"] for column in inspect(target_engine).get_columns("listings")}
    with target_engine.begin() as connection:
        if "latitude" not in listing_columns:
            connection.exec_driver_sql("ALTER TABLE listings ADD COLUMN latitude FLOAT")
        if "longitude" not in listing_columns:
            connection.exec_driver_sql("ALTER TABLE listings ADD COLUMN longitude FLOAT")
    if seed:
        from db import session_factory

        with session_factory(target_engine)() as session:
            seed_database(session)
            backfill_derived_seed_data(session)


def backfill_derived_seed_data(session: Session) -> None:
    """Backfill normalized seed relations for databases created before Phase 2."""
    listings = session.scalars(select(Listing)).all()
    if not listings:
        return
    amenities = {row.name: row for row in session.scalars(select(Amenity)).all()}
    for name in AMENITIES:
        if name not in amenities:
            amenities[name] = Amenity(name=name)
            session.add(amenities[name])
    session.flush()
    for listing in listings:
        legacy_title = any(listing.title == f"{listing.destination} {suffix} Stay"
                           for suffix in ("Sunrise", "Heritage", "Garden", "Coastal", "Vista"))
        enriched_title = listing.destination in PLACE_DETAILS and any(
            listing.title == f"{locality} {style[0]}"
            for locality in PLACE_DETAILS[listing.destination][:5]
            for style in STAY_STYLES
        )
        if legacy_title or enriched_title:
            # The demo fixture is normalized and replaced by enrich_demo_marketplace below.
            continue
        metadata_names = json.loads(listing.amenities or "[]")
        if listing.title.endswith("Sunrise Stay") and "Step-free access" not in metadata_names:
            listing.amenities = json.dumps([*metadata_names, "Step-free access"])
        if not listing.photos:
            session.add(ListingPhoto(listing_id=listing.id, image_url=listing.image, sort_order=0, alt_text=listing.title))
        if not listing.reviews:
            session.add_all(
                [
                    Review(
                        listing_id=listing.id,
                        author_name="Verified guest",
                        rating=5,
                        text="A comfortable, thoughtfully prepared synthetic stay.",
                    ),
                    Review(
                        listing_id=listing.id,
                        author_name="Weekend traveller",
                        rating=4,
                        text="Great location and responsive synthetic host.",
                    ),
                ]
            )
        existing_names = {link.amenity.name for link in listing.listing_amenities}
        names = ["Wi-Fi", "Kitchen", "Air conditioning"] + (
            ["Workspace"] if listing.category in {"City", "Family"} else []
        )
        if listing.title.endswith("Sunrise Stay"):
            names.append("Step-free access")
        for name in names:
            if name not in existing_names:
                session.add(ListingAmenity(listing_id=listing.id, amenity_id=amenities[name].id))
    enrich_demo_marketplace(session)
    session.commit()


def enrich_demo_marketplace(session: Session) -> None:
    """Enrich only the known synthetic fixtures; leave host-created data untouched."""
    for user_id, name, email in HOSTS[1:]:
        if session.get(User, user_id) is None:
            session.add(User(id=user_id, name=name, email=email, password=hash_password("homestay2026"), role="host", host_status="approved"))
    for user_id, name, email in GUESTS[1:]:
        if session.get(User, user_id) is None:
            session.add(User(id=user_id, name=name, email=email, password=hash_password("traveller2026"), role="guest", host_status="none"))

    applicants = [
        ("applicant1", "Priya Kulkarni", "priya.host@stayfinder.local"),
        ("applicant2", "Sameer Fernandes", "sameer.host@stayfinder.local"),
        ("applicant3", "Lakshmi Krishnan", "lakshmi.host@stayfinder.local"),
    ]
    for user_id, name, email in applicants:
        user = session.get(User, user_id)
        if user is None:
            user = User(id=user_id, name=name, email=email, password=hash_password("homestay2026"), role="host", host_status="pending")
            session.add(user)
            session.flush()
        if session.scalar(select(HostApplication.id).where(HostApplication.user_id == user_id).limit(1)) is None:
            session.add(HostApplication(user_id=user_id, status="pending", decision_note="Demo application for the local admin dashboard"))

    amenity_rows = {row.name: row for row in session.scalars(select(Amenity)).all()}
    for name in AMENITIES:
        if name not in amenity_rows:
            amenity_rows[name] = Amenity(name=name)
            session.add(amenity_rows[name])
    session.flush()

    styles = [
        "Courtyard House", "Garden Cottage", "Balcony Suite", "Family Kitchen Home", "Viewpoint Villa",
    ]
    coastal = {"Goa", "Mumbai", "Chennai", "Kochi", "Visakhapatnam", "Puducherry"}
    prices = [0, 950, 2100, 1250, 3800]
    capacities = [2, 2, 2, 5, 4]
    bedrooms = [1, 1, 1, 2, 2]
    bathrooms = [1, 1, 1, 2, 2]
    seed_ids: set[int] = set()
    seeded_listings: list[Listing] = []
    image_map: dict[tuple[str, int], tuple[str, str]] = {}
    if IMAGE_LINKS_PATH.is_file():
        with IMAGE_LINKS_PATH.open(encoding="utf-8-sig", newline="") as image_file:
            for image_row in csv.DictReader(image_file):
                image_url = (image_row.get("image_url") or "").strip()
                if not image_url.startswith("https://images.unsplash.com/photo-"):
                    continue
                destination_name = (image_row.get("destination") or "").strip()
                if destination_name == "Kashi Varanasi":
                    destination_name = "Kashi"
                try:
                    variant_number = int(image_row["image_number"]) - 1
                except (KeyError, TypeError, ValueError):
                    continue
                if 0 <= variant_number < len(STAY_STYLES):
                    image_map[(destination_name, variant_number)] = (
                        image_url,
                        (image_row.get("subject") or "property").strip(),
                    )

    for destination_index, destination in enumerate(DESTINATIONS):
        place = PLACE_DETAILS[destination]
        for variant, (suffix, base_category, description, _, amenity_names) in enumerate(STAY_STYLES):
            title = f"{place[variant]} {styles[variant]}"
            listing = session.scalar(select(Listing).where(Listing.destination == destination, Listing.title == title).limit(1))
            if listing is None:
                old_suffix = ["Sunrise", "Heritage", "Garden", "Coastal", "Vista"][variant]
                listing = session.scalar(select(Listing).where(Listing.destination == destination, Listing.title == f"{destination} {old_suffix} Stay").limit(1))
            if listing is None and (destination, variant) == ("Amritsar", 3):
                listing = session.scalar(select(Listing).where(Listing.destination == destination, Listing.title == "Ranjit Avenue Family Kitchen Home").limit(1))
            if listing is None:
                continue

            seed_ids.add(listing.id)
            seeded_listings.append(listing)
            category = "Beach" if variant == 4 and destination in coastal else base_category
            listing.host_id = HOSTS[(destination_index * 3 + variant) % len(HOSTS)][0]
            listing.title = title
            listing.latitude, listing.longitude = coordinates_for_listing(destination, title)
            listing.description = (
                f"{description} Set in {place[variant]}, it is a comfortable base for {place[5]}. "
                f"The host's local guide includes {place[(variant + 1) % 5]} and nearby independent cafés."
            )
            listing.price = Decimal(2850 + (destination_index % 8) * 570 + prices[variant])
            listing.capacity = capacities[variant]
            listing.bedrooms = bedrooms[variant]
            listing.bathrooms = bathrooms[variant]
            listing.category = category
            listing.rating = Decimal("4.20") + Decimal((destination_index * 3 + variant * 2) % 9) / Decimal("10")
            listing.amenities = json.dumps(amenity_names)

            matched_image = image_map.get((destination, variant))
            photo_rows = (
                [matched_image[0]]
                if matched_image
                else [
                    f"https://picsum.photos/id/{10 + (destination_index * 5 + variant) * 4 + photo_index}/1200/800"
                    for photo_index in range(4)
                ]
            )
            listing.image = photo_rows[0]
            listing.photos.clear()
            session.flush()
            session.add_all([
                ListingPhoto(listing_id=listing.id, image_url=image_url, sort_order=sort_order,
                             alt_text=(
                                 f"{destination} {matched_image[1]} for {title}"
                                 if matched_image
                                 else f"Sample property photo {sort_order + 1} for {title} in {destination}"
                             ))
                for sort_order, image_url in enumerate(photo_rows)
            ])

            existing_links = {link.amenity_id: link for link in listing.listing_amenities}
            wanted_amenity_ids = {amenity_rows[name].id for name in amenity_names}
            for amenity_id, link in existing_links.items():
                if amenity_id not in wanted_amenity_ids:
                    session.delete(link)
            for amenity_name in amenity_names:
                amenity_id = amenity_rows[amenity_name].id
                if amenity_id not in existing_links:
                    listing.listing_amenities.append(ListingAmenity(amenity_id=amenity_id))

            # Replace only the old/generated demo reviews for these known seed listings.
            for review in list(listing.reviews):
                if review.author_name in REVIEWERS or review.author_name in {"Verified guest", "Weekend traveller"}:
                    session.delete(review)
            ratings = [5, 5, 4, 5]
            for review_index in range(3):
                reviewer_index = (destination_index * 3 + variant * 5 + review_index) % len(REVIEWERS)
                note = REVIEW_NOTES[(destination_index + variant + review_index) % len(REVIEW_NOTES)]
                locality = place[(variant + review_index) % 5]
                session.add(Review(
                    listing_id=listing.id,
                    author_name=REVIEWERS[reviewer_index],
                    rating=ratings[(destination_index + variant + review_index) % len(ratings)],
                    text=f"{note} We especially enjoyed having {locality} close by.",
                ))

            generated_ratings = [ratings[(destination_index + variant + index) % len(ratings)] for index in range(3)]
            listing.rating = Decimal(sum(generated_ratings)) / Decimal(len(generated_ratings))

    session.flush()
    if not seeded_listings:
        return

    # Reserve a believable demo itinerary while keeping the idempotent legacy seed row.
    first = next((listing for listing in seeded_listings if listing.destination == DESTINATIONS[0]), seeded_listings[0])
    legacy_trip = session.scalar(select(Booking).where(
        Booking.listing_id == first.id, Booking.guest_id == "guest1",
        Booking.check_in == date(2099, 2, 1), Booking.check_out == date(2099, 2, 4),
    ).limit(1))
    sample_trips = session.scalars(select(Booking).where(
        Booking.listing_id == first.id, Booking.guest_id == "guest1",
        Booking.check_in == date(2027, 2, 12), Booking.check_out == date(2027, 2, 16),
    ).order_by(Booking.id)).all()
    for duplicate in sample_trips[1:]:
        session.delete(duplicate)
    if legacy_trip:
        legacy_trip.check_in = date(2027, 2, 12)
        legacy_trip.check_out = date(2027, 2, 16)
        legacy_trip.guests = min(2, first.capacity)
        legacy_trip.total = demo_booking_total(first.price, 4)
    else:
        if not sample_trips:
            session.add(Booking(listing_id=first.id, guest_id="guest1", check_in=date(2027, 2, 12),
                                check_out=date(2027, 2, 16), guests=min(2, first.capacity),
                                total=demo_booking_total(first.price, 4), status="confirmed"))

    # Add a modest, deterministic spread of upcoming bookings so popularity and host calendars vary.
    for ordinal, listing in enumerate(seeded_listings):
        destination_index = DESTINATIONS.index(listing.destination)
        variant = ordinal % 5
        booking_count = (destination_index * 7 + variant * 3) % 4
        for booking_index in range(booking_count):
            guest_id = GUESTS[1 + (ordinal + booking_index) % (len(GUESTS) - 1)][0]
            month = 1 + (ordinal * 5 + booking_index * 3) % 12
            day = 2 + (ordinal * 7 + booking_index * 9) % 24
            check_in = date(2027, month, day)
            nights = 2 + (destination_index + booking_index) % 4
            check_out = check_in + timedelta(days=nights)
            exists = session.scalar(select(Booking.id).where(
                Booking.listing_id == listing.id, Booking.guest_id == guest_id,
                Booking.check_in == check_in, Booking.check_out == check_out,
            ).limit(1))
            if exists is None:
                session.add(Booking(listing_id=listing.id, guest_id=guest_id,
                                    check_in=check_in, check_out=check_out,
                                    guests=min(capacities[variant], listing.capacity),
                                    total=demo_booking_total(listing.price, nights), status="confirmed"))

    # A cancelled older trip exercises the complete trip-state display without blocking inventory.
    second = seeded_listings[min(1, len(seeded_listings) - 1)]
    if session.scalar(select(Booking.id).where(
        Booking.listing_id == second.id, Booking.guest_id == "guest1",
        Booking.check_in == date(2026, 6, 12), Booking.check_out == date(2026, 6, 15),
    ).limit(1)) is None:
        session.add(Booking(listing_id=second.id, guest_id="guest1", check_in=date(2026, 6, 12),
                            check_out=date(2026, 6, 15), guests=min(2, second.capacity),
                            total=demo_booking_total(second.price, 3), status="cancelled"))

    for listing in seeded_listings[:5]:
        exists = session.scalar(select(Favorite.id).where(Favorite.user_id == "guest1", Favorite.listing_id == listing.id).limit(1))
        if exists is None:
            session.add(Favorite(user_id="guest1", listing_id=listing.id))
