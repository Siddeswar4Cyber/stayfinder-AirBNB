"""Read-only listing search and public serialization helpers."""
import json
from datetime import date


def listing_by_id(conn, listing_id):
    return conn.execute("select l.*,u.name as host_name from listings l join users u on u.id=l.host_id where l.id=?", (listing_id,)).fetchone()


def public_listing(row, include_host=False):
    result = dict(row)
    result["amenities"] = json.loads(result.get("amenities") or "[]")
    result.pop("password", None)
    result.pop("host_id", None)
    if not include_host:
        result.pop("host_name", None)
    return result


def validate_date_range(check_in: date, check_out: date):
    if check_out <= check_in:
        raise ValueError("Check-out must be after check-in")
    if check_in < date.today():
        raise ValueError("Check-in cannot be in the past")
    if (check_out - check_in).days > 90:
        raise ValueError("A stay cannot exceed 90 nights")


def is_available(conn, listing_id, check_in, check_out, check_in_time="15:00", check_out_time="11:00"):
    validate_date_range(check_in, check_out)
    requested_start = f"{check_in.isoformat()}T{check_in_time}"
    requested_end = f"{check_out.isoformat()}T{check_out_time}"
    rows = conn.execute("select check_in,check_out,check_in_time,check_out_time from bookings where listing_id=? and status='confirmed'", (listing_id,)).fetchall()
    return not any(
        requested_start < f"{row['check_out']}T{row['check_out_time']}"
        and requested_end > f"{row['check_in']}T{row['check_in_time']}"
        for row in rows
    )


def booked_ranges(conn, listing_id):
    return [[row["check_in"], row["check_out"], row["check_in_time"], row["check_out_time"]] for row in conn.execute("select check_in,check_out,check_in_time,check_out_time from bookings where listing_id=? and status='confirmed' order by check_in", (listing_id,)).fetchall()]


def listing_reviews(conn, listing_id):
    return [{"author": row["author_name"], "rating": row["rating"], "text": row["text"]} for row in conn.execute("select author_name,rating,text from reviews where listing_id=? order by id desc", (listing_id,)).fetchall()]


def search_listings(conn, *, destination=None, search=None, category=None, amenity=None, styles=None, amenities=None, step_free_access=None, guests=None, min_price=None, max_price=None, check_in=None, check_out=None, page=1, limit=24):
    if page < 1 or limit < 1 or limit > 100:
        raise ValueError("Invalid page or limit")
    if min_price is not None and min_price < 0 or max_price is not None and max_price < 0:
        raise ValueError("Prices must be non-negative")
    if min_price is not None and max_price is not None and min_price > max_price:
        raise ValueError("Minimum price cannot exceed maximum price")
    if guests is not None and guests < 1:
        raise ValueError("Guests must be at least one")
    if (check_in is None) != (check_out is None):
        raise ValueError("Provide both check-in and check-out dates")
    if check_in and check_out:
        validate_date_range(check_in, check_out)
    clauses, values = [], []
    for field, value in (("destination", destination), ("category", category)):
        if value:
            clauses.append(f"lower(l.{field})=lower(?)")
            values.append(value.strip())
    selected_styles = list(dict.fromkeys(value.strip() for value in (styles or []) if value.strip()))
    if selected_styles:
        clauses.append("lower(l.category) in (" + ",".join("lower(?)" for _ in selected_styles) + ")")
        values.extend(selected_styles)
    if search:
        clauses.append("(lower(l.title) like ? or lower(l.description) like ? or lower(l.destination) like ?)")
        pattern = f"%{search.strip().lower()}%"
        values.extend([pattern] * 3)
    if guests is not None:
        clauses.append("l.capacity>=?")
        values.append(guests)
    if min_price is not None:
        clauses.append("l.price>=?")
        values.append(min_price)
    if max_price is not None:
        clauses.append("l.price<=?")
        values.append(max_price)
    if amenity:
        clauses.append("lower(l.amenities) like ?")
        values.append(f"%{amenity.strip().lower()}%")
    selected_amenities = list(dict.fromkeys(value.strip() for value in (amenities or []) if value.strip()))
    if selected_amenities:
        clauses.append("(" + " or ".join("lower(l.amenities) like ?" for _ in selected_amenities) + ")")
        values.extend(f"%{value.lower()}%" for value in selected_amenities)
    if step_free_access:
        clauses.append("lower(l.amenities) like ?")
        values.append("%step-free access%")
    if check_in and check_out:
        clauses.append("not exists (select 1 from bookings b where b.listing_id=l.id and b.status='confirmed' and b.check_in < ? and b.check_out > ?)")
        values.extend([check_out.isoformat(), check_in.isoformat()])
    where = (" where " + " and ".join(clauses)) if clauses else ""
    total = conn.execute("select count(*) from listings l" + where, values).fetchone()[0]
    rows = conn.execute(
        "select l.*,u.name as host_name,"
        "(select count(*) from bookings b where b.listing_id=l.id and b.status='confirmed') as booking_count,"
        "(select count(*) from reviews r where r.listing_id=l.id) as review_count "
        "from listings l join users u on u.id=l.host_id" + where + " order by l.id limit ? offset ?",
        [*values, limit, (page - 1) * limit],
    ).fetchall()
    return [public_listing(row) for row in rows], total
