"""Approximate map coordinates for the application's seeded Indian destinations."""
from __future__ import annotations

# City/destination centers, in (latitude, longitude) order. These are suitable
# for demo map pins, not property-address navigation or turn-by-turn routing.
DESTINATION_CENTERS: dict[str, tuple[float, float]] = {
    "Goa": (15.4909, 73.8278),
    "Jaipur": (26.9124, 75.7873),
    "Delhi": (28.6139, 77.2090),
    "Agra": (27.1767, 78.0081),
    "Mumbai": (19.0760, 72.8777),
    "Bengaluru": (12.9716, 77.5946),
    "Hyderabad": (17.3850, 78.4867),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639),
    "Kochi": (9.9312, 76.2673),
    "Munnar": (10.0889, 77.0595),
    "Manali": (32.2396, 77.1887),
    "Shimla": (31.1048, 77.1734),
    "Rishikesh": (30.0869, 78.2676),
    "Kashi": (25.3176, 82.9739),
    "Ayodhya": (26.7922, 82.1998),
    "Tirupati": (13.6288, 79.4192),
    "Amritsar": (31.6340, 74.8723),
    "Udaipur": (24.5854, 73.7125),
    "Mysuru": (12.2958, 76.6394),
    "Visakhapatnam": (17.6868, 83.2185),
    "Ooty": (11.4064, 76.6932),
    "Darjeeling": (27.0360, 88.2627),
    "Thanjavur": (10.7870, 79.1378),
    "Puducherry": (11.9416, 79.8083),
    "Jammu & Kashmir": (34.0837, 74.7973),
}

TITLE_OFFSETS: dict[str, tuple[float, float]] = {
    "Courtyard House": (-0.004, -0.004),
    "Garden Cottage": (-0.004, 0.004),
    "Balcony Suite": (0.004, -0.004),
    "Family Kitchen Home": (0.004, 0.004),
    "Viewpoint Villa": (0.0, 0.0),
}


def coordinates_for_listing(destination: str, title: str) -> tuple[float, float] | tuple[None, None]:
    """Return a stable, small listing-type spread around a destination center.

    The inputs are synthetic demo listings with destination/neighborhood names,
    not street addresses. Unknown destinations deliberately return no pin.
    """
    center = DESTINATION_CENTERS.get(destination.strip())
    if center is None:
        return None, None

    # Keep pins close to the destination center while separating the five demo
    # listing types so overlapping markers remain selectable. A deployed
    # marketplace should store verified property coordinates instead.
    title = title.strip()
    offset = next((offset for listing_type, offset in TITLE_OFFSETS.items() if title.endswith(listing_type)), (0.0, 0.0))
    latitude_offset, longitude_offset = offset
    return round(center[0] + latitude_offset, 6), round(center[1] + longitude_offset, 6)
