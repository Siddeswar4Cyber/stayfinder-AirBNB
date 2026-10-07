from fastapi import FastAPI, HTTPException, Depends, Header, Query, Request, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
import sqlite3, os, hashlib, hmac, json, secrets, time
from urllib.parse import urlparse
import re
from contextlib import contextmanager
from uuid import uuid4
from typing import Annotated, Literal
from db import create_schema, engine, DB_PATH as CONFIGURED_DB_PATH
from marketplace import (
    booked_ranges,
    is_available,
    listing_by_id,
    listing_reviews,
    public_listing,
    search_listings,
    validate_date_range,
)
from seed import initialize_database

DB_PATH = str(CONFIGURED_DB_PATH)
DESTINATIONS = ["Goa","Jaipur","Delhi","Agra","Mumbai","Bengaluru","Hyderabad","Chennai","Kolkata","Kochi","Munnar","Manali","Shimla","Rishikesh","Kashi","Ayodhya","Tirupati","Amritsar","Udaipur","Mysuru","Visakhapatnam","Ooty","Darjeeling","Thanjavur","Puducherry","Jammu & Kashmir"]
APP_ENV = os.getenv("APP_ENV", "production").strip().lower()
if APP_ENV not in {"development", "test", "production"}:
    raise RuntimeError("APP_ENV must be development, test, or production")
if APP_ENV == "production" and len(os.getenv("APP_SECRET", "")) < 32:
    raise RuntimeError("APP_SECRET must contain at least 32 characters in production")
origins = [value.strip() for value in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if value.strip()]
if APP_ENV == "production" and (not origins or any(not origin.startswith("https://") or "*" in origin for origin in origins)):
    raise RuntimeError("Production CORS_ORIGINS must contain only explicit HTTPS origins")
app = FastAPI(title="StayFinder API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"], allow_headers=["Authorization", "Content-Type"])

@app.middleware("http")
async def reject_untrusted_browser_origins(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        origin = request.headers.get("origin")
        if origin and origin not in origins:
            return JSONResponse(status_code=403, content={"detail": "Untrusted request origin"})
    return await call_next(request)

@contextmanager
def db():
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA busy_timeout=30000")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
PASSWORD_ITERATIONS = 240_000
SESSION_TTL = timedelta(hours=12)
SESSION_SECRET = os.getenv("APP_SECRET", "").encode()
_attempts: dict[tuple[str, str], list[float]] = {}

def session_digest(token_value: str) -> str:
    if SESSION_SECRET:
        return hmac.new(SESSION_SECRET, token_value.encode(), hashlib.sha256).hexdigest()
    return hashlib.sha256(token_value.encode()).hexdigest()

def enforce_rate_limit(request: Request, action: str, limit: int = 10):
    now = time.monotonic()
    key = (request.client.host if request.client else "unknown", action)
    recent = [stamp for stamp in _attempts.get(key, []) if now - stamp < 300]
    if len(recent) >= limit:
        raise HTTPException(429, "Too many attempts; try again in a few minutes")
    recent.append(now)
    _attempts[key] = recent
    if len(_attempts) > 4096:
        for old_key in list(_attempts):
            _attempts[old_key] = [stamp for stamp in _attempts[old_key] if now - stamp < 300]
            if not _attempts[old_key]:
                del _attempts[old_key]

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"

DUMMY_PASSWORD_HASH = hash_password("not-a-real-account-password")

def verify_password(password: str, stored: str) -> bool:
    try:
        if stored.startswith("pbkdf2_sha256$"):
            _, iterations, salt_hex, digest_hex = stored.split("$", 3)
            expected = hashlib.pbkdf2_hmac(
                "sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations)
            ).hex()
            return hmac.compare_digest(expected, digest_hex)
        legacy = hashlib.pbkdf2_hmac("sha256", password.encode(), b"stayfinder", 120000).hex()
        return hmac.compare_digest(legacy, stored)
    except (ValueError, TypeError):
        return False

def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

def create_session(uid: str) -> str:
    raw_token = secrets.token_urlsafe(32)
    now = _utcnow()
    with db() as c:
        c.execute(
            "insert into auth_sessions(id,user_id,token_hash,created_at,expires_at) values(?,?,?,?,?)",
            (uuid4().hex, uid, session_digest(raw_token), now.isoformat(), (now + SESSION_TTL).isoformat()),
        )
    return raw_token

def current_user(authorization: str = Header(None), stay_session: str | None = Cookie(None)):
    if stay_session:
        raw_token = stay_session
    elif authorization and authorization.startswith("Bearer "):
        raw_token = authorization[7:].strip()
    else:
        raise HTTPException(401, "Authentication required")
    try:
        token_hash = session_digest(raw_token)
        with db() as c:
            session = c.execute(
                "select s.*,u.* from auth_sessions s join users u on u.id=s.user_id "
                "where s.token_hash=? and s.revoked_at is null", (token_hash,)
            ).fetchone()
        if not session or datetime.fromisoformat(session["expires_at"]) <= _utcnow(): raise ValueError()
        with db() as c: u = c.execute("select * from users where id=?", (session["user_id"],)).fetchone()
        if not u: raise ValueError()
        return dict(u)
    except Exception: raise HTTPException(401, "Invalid session")
def role(*roles):
    def dep(u=Depends(current_user)):
        if u["role"] not in roles: raise HTTPException(403, "Insufficient permissions")
        if u["role"] == "host" and u["host_status"] != "approved": raise HTTPException(403, "Host approval required")
        return u
    return dep

def init_db():
    create_schema(engine)
    with db() as c:
        for table in ("bookings", "payment_attempts"):
            columns = {row["name"] for row in c.execute(f"pragma table_info({table})")}
            if "check_in_time" not in columns:
                c.execute(f"alter table {table} add column check_in_time text not null default '15:00'")
            if "check_out_time" not in columns:
                c.execute(f"alter table {table} add column check_out_time text not null default '11:00'")
    seed_setting = os.getenv("ALLOW_DEMO_SEED", "true" if APP_ENV == "development" else "false").strip().lower()
    if seed_setting not in {"true", "false"}:
        raise RuntimeError("ALLOW_DEMO_SEED must be either true or false")
    allow_demo_seed = seed_setting == "true"
    if APP_ENV == "production" and allow_demo_seed:
        raise RuntimeError("Demo accounts and listings cannot be seeded in production")
    initialize_database(engine, seed=allow_demo_seed)
    if APP_ENV == "production":
        bootstrap_email = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "").strip().lower()
        bootstrap_password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")
        with db() as c:
            admin_exists = c.execute("select 1 from users where role='admin' limit 1").fetchone()
            if not admin_exists:
                if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", bootstrap_email) or len(bootstrap_password) < 16:
                    raise RuntimeError("A valid BOOTSTRAP_ADMIN_EMAIL and 16+ character BOOTSTRAP_ADMIN_PASSWORD are required to create the first admin")
                c.execute("insert into users(id,name,email,password,role,host_status) values(?,?,?,?,?,?)",
                          (secrets.token_hex(8), "Administrator", bootstrap_email, hash_password(bootstrap_password), "admin", "approved"))
app.add_event_handler("startup", init_db)

class Register(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=12, max_length=128)
    role: Literal["guest", "host"] = "guest"


class Login(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class Quote(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    check_in_time: str = Field(default="15:00", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    check_out_time: str = Field(default="11:00", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    guests: int = Field(gt=0)


class MockPayment(BaseModel):
    outcome: str = Field(pattern="^(success|declined)$")
    listing_id: int
    check_in: date
    check_out: date
    check_in_time: str = Field(default="15:00", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    check_out_time: str = Field(default="11:00", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    guests: int = Field(gt=0, le=100)
    demo_reference: str | None = Field(default=None, max_length=120)

class Booking(Quote):
    payment_attempt_id: int
class ListingIn(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(default="", max_length=5000)
    destination: str = Field(min_length=2, max_length=120)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    price: float = Field(gt=0, le=1_000_000)
    capacity: int = Field(gt=0, le=100)
    bedrooms: int = Field(default=1, gt=0, le=100)
    bathrooms: int = Field(default=1, gt=0, le=100)
    category: str = Field(default="City", min_length=2, max_length=80)
    image: str = Field(default="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900", max_length=500)
    amenities: list[Annotated[str, Field(min_length=1, max_length=80)]] = Field(default_factory=list, max_length=30)

    @field_validator("title", "destination", "category", mode="before")
    @classmethod
    def trim_required_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def coordinates_must_be_a_pair(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Latitude and longitude must be provided together")
        return self

    @field_validator("image", mode="before")
    @classmethod
    def safe_image_url(cls, value):
        if not value:
            return "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900"
        parsed = urlparse(str(value))
        if parsed.scheme != "https" or parsed.hostname not in {"images.unsplash.com", "picsum.photos"}:
            raise ValueError("Image must be an HTTPS URL hosted by images.unsplash.com or picsum.photos")
        return str(value)

def listing(row):
    x=dict(row); x["amenities"]=json.loads(x["amenities"]); return x
def availability(c,lid,start,end,start_time="15:00",end_time="11:00"):
    return is_available(c,lid,start,end,start_time,end_time)
def calculate_total(price, nights):
    nightly = Decimal(str(price))
    subtotal = nightly * nights
    cleaning = (nightly * Decimal("0.35")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    service = (subtotal * Decimal("0.12")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return subtotal, cleaning, service, subtotal + cleaning + service

def quote(c, q):
    try: validate_date_range(q.check_in, q.check_out)
    except ValueError as error: raise HTTPException(422, str(error))
    l=c.execute("select * from listings where id=?",(q.listing_id,)).fetchone()
    if not l: raise HTTPException(404,"Listing not found")
    if q.guests>l["capacity"]: raise HTTPException(422,"Guest capacity exceeded")
    if not is_available(c,q.listing_id,q.check_in,q.check_out,q.check_in_time,q.check_out_time): raise HTTPException(409,"Those dates are no longer available")
    nights=(q.check_out-q.check_in).days
    subtotal, cleaning, service, total = calculate_total(l["price"], nights)
    return {"listing":listing(l),"nights":nights,"subtotal":float(subtotal),"cleaning_fee":float(cleaning),"service_fee":float(service),"total":float(total)}

def quote_without_availability(c, q):
    try: validate_date_range(q.check_in, q.check_out)
    except ValueError as error: raise HTTPException(422, str(error))
    l=c.execute("select * from listings where id=?",(q.listing_id,)).fetchone()
    if not l: raise HTTPException(404,"Listing not found")
    if q.guests > l["capacity"]: raise HTTPException(422,"Guest capacity exceeded")
    nights=(q.check_out-q.check_in).days
    subtotal, cleaning, service, total = calculate_total(l["price"], nights)
    return {"listing":listing(l),"nights":nights,"subtotal":float(subtotal),"cleaning_fee":float(cleaning),"service_fee":float(service),"total":float(total)}

def trip_details(row):
    details = dict(row)
    nights = (date.fromisoformat(details["check_out"]) - date.fromisoformat(details["check_in"])).days
    subtotal, cleaning, service, _ = calculate_total(details["price"], nights)
    details.update({
        "nights": nights,
        "subtotal": float(subtotal),
        "cleaning_fee": float(cleaning),
        "service_fee": float(service),
    })
    return details

@app.get("/api/health")
def health():
    with db() as connection:
        connection.execute("SELECT 1").fetchone()
    return {"status": "ok", "version": "1.0.0"}
@app.get("/api/destinations")
def destinations(): return DESTINATIONS
@app.get("/api/listings")
def listings(
    destination: str | None = None,
    search: str | None = None,
    category: str | None = None,
    amenity: str | None = None,
    styles: list[str] | None = Query(None),
    amenities: list[str] | None = Query(None),
    step_free_access: bool | None = None,
    guests: int | None = None,
    min_price: float | None = Query(None, ge=0, le=1_000_000),
    max_price: float | None = Query(None, ge=0, le=1_000_000),
    check_in: date | None = None,
    check_out: date | None = None,
    page: int = 1,
    limit: int = Query(24, ge=1, le=100),
):
    try:
        with db() as c:
            items, total = search_listings(
                c,
                destination=destination,
                search=search,
                category=category,
                amenity=amenity,
                styles=styles,
                amenities=amenities,
                step_free_access=step_free_access,
                guests=guests,
                min_price=min_price,
                max_price=max_price,
                check_in=check_in,
                check_out=check_out,
                page=page,
                limit=limit,
            )
        return {"items": items, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}
    except ValueError as error:
        raise HTTPException(422, str(error))

@app.get("/api/listings/compare")
def compare(ids: str, u=Depends(current_user)):
    try:
        wanted = list(dict.fromkeys(int(value) for value in ids.split(",")))
    except ValueError:
        raise HTTPException(422, "ids must be comma-separated integers")
    if not wanted or len(wanted) > 4:
        raise HTTPException(422, "compare requires between 1 and 4 listing ids")
    with db() as c:
        rows = c.execute(
            "select listings.*,users.name as host_name from listings join users on users.id=listings.host_id "
            f"where listings.id in ({','.join('?' * len(wanted))})",
            wanted,
        ).fetchall()
    by_id = {row["id"]: public_listing(row, include_host=True) for row in rows}
    return [by_id[listing_id] for listing_id in wanted if listing_id in by_id]

@app.get("/api/listings/{lid}")
def listing_detail(lid:int):
    with db() as c:
        l=listing_by_id(c, lid)
        if not l: raise HTTPException(404,"Listing not found")
        x=public_listing(l, include_host=True)
        x["photos"]=[dict(photo) for photo in c.execute(
            "select id,image_url,sort_order,alt_text from listing_photos where listing_id=? order by sort_order,id",
            (lid,),
        ).fetchall()]
        x["reviews"]=listing_reviews(c, lid)
        x["availability"]={"booked_ranges": booked_ranges(c, lid)}
        return x
@app.get("/api/listings/{lid}/availability")
def listing_availability(lid: int, check_in: date | None = None, check_out: date | None = None, check_in_time: str = Query("15:00", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$"), check_out_time: str = Query("11:00", pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")):
    with db() as c:
        if not listing_by_id(c, lid):
            raise HTTPException(404, "Listing not found")
        if (check_in is None) != (check_out is None):
            raise HTTPException(422, "check_in and check_out must be provided together")
        if check_in and check_out:
            try:
                validate_date_range(check_in, check_out)
            except ValueError as error:
                raise HTTPException(422, str(error))
            return {"listing_id": lid, "available": is_available(c, lid, check_in, check_out, check_in_time, check_out_time)}
        return {"listing_id": lid, "available": True, "booked_ranges": booked_ranges(c, lid)}

@app.get("/api/listings/{lid}/reviews")
def reviews(lid: int):
    with db() as c:
        if not listing_by_id(c, lid):
            raise HTTPException(404, "Listing not found")
        return listing_reviews(c, lid)

@app.get("/api/listings/{lid}/match-score")
def match_score(
    lid: int,
    guests: int = Query(1, ge=1),
    max_price: float | None = Query(None, gt=0),
    category: str | None = None,
    amenity: str | None = None,
    nearby_place: str | None = None,
    step_free_access: bool | None = None,
):
    with db() as c:
        l=listing_by_id(c, lid)
        if not l: raise HTTPException(404,"Listing not found")
    amenities = json.loads(l["amenities"] or "[]")
    preferences: list[tuple[str, bool]] = [
        ("capacity", guests <= l["capacity"]),
    ]
    if max_price is not None:
        preferences.append(("budget", l["price"] <= max_price))
    if category:
        preferences.append(("category", l["category"].lower() == category.strip().lower()))
    if amenity:
        preferences.append(("amenity", amenity.strip().lower() in {str(value).lower() for value in amenities}))
    if nearby_place and nearby_place.strip():
        place = nearby_place.strip().lower()
        preferences.append(("nearby_place", place in l["destination"].lower() or place in l["description"].lower()))
    if step_free_access is True:
        preferences.append(("step_free_access", "step-free access" in {str(value).lower() for value in amenities}))
    reasons = {
        name: ("Matches your preference" if matched else "Does not match this preference")
        for name, matched in preferences
    }
    matched = sum(value for _, value in preferences)
    return {
        "listing_id": lid,
        "score": round(matched / len(preferences) * 100),
        "criteria": dict(preferences),
        "reasons": reasons,
        "is_subjective": True,
    }
def set_session_cookie(response: Response, token_value: str):
    response.set_cookie("stay_session", token_value, httponly=True, secure=APP_ENV == "production", samesite="none" if APP_ENV == "production" else "strict", max_age=int(SESSION_TTL.total_seconds()), path="/")

@app.post("/api/auth/register")
def register(r:Register, request: Request, response: Response):
    enforce_rate_limit(request, "register", 5)
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", r.email.strip()):
        raise HTTPException(422, "Enter a valid email address")
    r.email = r.email.strip().lower()
    r.name = r.name.strip()
    if not r.name:
        raise HTTPException(422, "Name cannot be blank")
    with db() as c:
        try:
            status="pending" if r.role=="host" else "none"; uid=secrets.token_hex(8)
            c.execute("insert into users values(?,?,?,?,?,?)",(uid,r.name,r.email.lower(),hash_password(r.password),r.role,status))
            if r.role=="host": c.execute("insert into applications(user_id,status,created_at) values(?,?,?)",(uid,"pending",datetime.utcnow().isoformat()))
        except sqlite3.IntegrityError: raise HTTPException(409,"Email already registered")
    set_session_cookie(response, create_session(uid))
    return {"user":{"id":uid,"name":r.name,"email":r.email,"role":r.role,"host_status":status}}
@app.post("/api/auth/login")
def login(r:Login, request: Request, response: Response):
    enforce_rate_limit(request, "login", 10)
    r.email = r.email.strip().lower()
    with db() as c: u=c.execute("select * from users where email=?",(r.email.lower(),)).fetchone()
    valid_password = verify_password(r.password, u["password"] if u else DUMMY_PASSWORD_HASH)
    if not u or not valid_password: raise HTTPException(401,"Invalid email or password")
    set_session_cookie(response, create_session(u["id"]))
    return {"user":dict(u)|{"password":None}}
@app.post("/api/auth/logout")
def logout(response: Response, authorization: str = Header(None), stay_session: str | None = Cookie(None), u=Depends(current_user)):
    raw_token = stay_session or (authorization[7:].strip() if authorization and authorization.startswith("Bearer ") else "")
    token_hash = session_digest(raw_token)
    with db() as c:
        c.execute("update auth_sessions set revoked_at=? where token_hash=? and user_id=?", (_utcnow().isoformat(), token_hash, u["id"]))
    response.delete_cookie("stay_session", path="/", secure=APP_ENV == "production", httponly=True, samesite="none" if APP_ENV == "production" else "strict")
    return {"logged_out": True}
@app.get("/api/auth/me")
def me(u=Depends(current_user)): return dict(u)|{"password":None}
@app.post("/api/host-applications")
def apply_host(u=Depends(current_user)):
    with db() as c:
        existing = c.execute(
            "select status from applications where user_id=? order by id desc limit 1",
            (u["id"],),
        ).fetchone()
        if existing and existing["status"] == "pending":
            raise HTTPException(409, "Host application is already pending")
        if existing and existing["status"] == "approved":
            raise HTTPException(409, "Host application is already approved")
        c.execute("update users set role='host',host_status='pending' where id=?",(u["id"],)); c.execute("insert into applications(user_id,status,created_at) values(?,?,?)",(u["id"],"pending",datetime.utcnow().isoformat()))
    return {"status":"pending"}
@app.get("/api/admin/host-applications")
def applications(status: str = Query("pending", pattern="^(pending|approved|rejected|all)$"), u=Depends(role("admin"))):
    with db() as c:
        if status == "all":
            rows = c.execute("select a.*,u.name,u.email from applications a join users u on u.id=a.user_id order by a.id desc").fetchall()
        else:
            rows = c.execute("select a.*,u.name,u.email from applications a join users u on u.id=a.user_id where a.status=? order by a.id desc", (status,)).fetchall()
        return [dict(x) for x in rows]
@app.post("/api/admin/host-applications/{aid}/decision")
def decision(aid:int, approve:bool=Query(...), u=Depends(role("admin"))):
    with db() as c:
        a=c.execute("select * from applications where id=?",(aid,)).fetchone()
        if not a: raise HTTPException(404,"Application not found")
        if a["status"] != "pending": raise HTTPException(409,"Application has already been decided")
        status="approved" if approve else "rejected"; c.execute("update applications set status=?,decision_note=? where id=?",(status,"Approved by admin" if approve else "Not approved",aid)); c.execute("update users set host_status=? where id=?",(status,a["user_id"]))
    return {"status":status}
@app.post("/api/bookings/quote")
def booking_quote(q:Quote,u=Depends(current_user)):
    with db() as c: return quote(c,q)

@app.post("/api/payments/mock")
def mock_payment(payment: MockPayment, u=Depends(current_user)):
    if APP_ENV != "development":
        raise HTTPException(404, "Mock payments are disabled")
    with db() as c:
        details = quote(c, payment)
        cur = c.execute(
            "insert into payment_attempts(user_id,outcome,created_at,demo_reference,listing_id,check_in,check_out,check_in_time,check_out_time,guests,total) values(?,?,?,?,?,?,?,?,?,?,?)",
            (u["id"], payment.outcome, _utcnow().isoformat(), payment.demo_reference,
             payment.listing_id, payment.check_in.isoformat(), payment.check_out.isoformat(), payment.check_in_time, payment.check_out_time, payment.guests, details["total"]),
        )
        return {"payment_attempt_id": cur.lastrowid, "outcome": payment.outcome}

@app.post("/api/bookings")
def create_booking(q:Booking,u=Depends(role("guest","admin"))):
    with db() as c:
        try:
            c.execute("BEGIN IMMEDIATE")
            payment = c.execute(
                "select * from payment_attempts where id=? and user_id=? "
                "and outcome='success' and booking_id is null",
                (q.payment_attempt_id, u["id"]),
            ).fetchone()
            if not payment:
                c.rollback()
                raise HTTPException(402, "A new successful mock payment is required")
            if (payment["listing_id"] != q.listing_id or payment["check_in"] != q.check_in.isoformat()
                    or payment["check_out"] != q.check_out.isoformat() or payment["check_in_time"] != q.check_in_time
                    or payment["check_out_time"] != q.check_out_time or payment["guests"] != q.guests):
                c.rollback()
                raise HTTPException(409, "Payment attempt does not match this booking")
            if not availability(c, q.listing_id, q.check_in, q.check_out, q.check_in_time, q.check_out_time):
                c.rollback()
                raise HTTPException(409,"Those dates are no longer available")
            details = quote_without_availability(c, q)
            if abs(float(payment["total"]) - details["total"]) >= 0.01:
                c.rollback()
                raise HTTPException(409, "Booking total changed; request a new quote and payment")
            now = _utcnow().isoformat()
            cur = c.execute(
                "insert into bookings(listing_id,guest_id,check_in,check_out,check_in_time,check_out_time,guests,total,status,created_at) "
                "values(?,?,?,?,?,?,?,?,?,?)",
                (q.listing_id,u["id"],q.check_in.isoformat(),q.check_out.isoformat(),q.check_in_time,q.check_out_time,q.guests,
                 float(details["total"]),"confirmed",now),
            )
            claimed = c.execute(
                "update payment_attempts set booking_id=? where id=? and user_id=? "
                "and outcome='success' and booking_id is null",
                (cur.lastrowid, q.payment_attempt_id, u["id"]),
            )
            if claimed.rowcount != 1:
                c.rollback()
                raise HTTPException(409, "Mock payment was already used")
            c.commit()
            return {"id":cur.lastrowid,"status":"confirmed","total":details["total"],"listing":details["listing"]}
        except HTTPException:
            raise
        except Exception:
            c.rollback()
            raise HTTPException(500, "Booking could not be confirmed")
@app.get("/api/me/bookings")
def trips(u=Depends(current_user)):
    with db() as c: return [trip_details(x) for x in c.execute("select b.*,l.title,l.destination,l.image,l.price from bookings b join listings l on l.id=b.listing_id where b.guest_id=? order by b.check_in desc",(u["id"],)).fetchall()]
@app.get("/api/me/bookings/{bid}")
def trip_detail(bid:int,u=Depends(current_user)):
    with db() as c:
        b=c.execute("select b.*,l.title,l.destination,l.image,l.price from bookings b join listings l on l.id=b.listing_id where b.id=? and b.guest_id=?",(bid,u["id"])).fetchone()
        if not b: raise HTTPException(404,"Booking not found")
        return trip_details(b)
@app.get("/api/host/bookings")
def host_bookings(u=Depends(role("host","admin"))):
    with db() as c:
        if u["role"] == "admin":
            rows = c.execute("select b.*,l.title,l.destination,l.image,u.name as guest_name from bookings b join listings l on l.id=b.listing_id join users u on u.id=b.guest_id order by b.check_in desc").fetchall()
        else:
            rows = c.execute("select b.*,l.title,l.destination,l.image,u.name as guest_name from bookings b join listings l on l.id=b.listing_id join users u on u.id=b.guest_id where l.host_id=? order by b.check_in desc",(u["id"],)).fetchall()
        return [dict(row) for row in rows]
@app.post("/api/bookings/{bid}/cancel")
def cancel(bid:int,u=Depends(current_user)):
    with db() as c:
        b=c.execute("select * from bookings where id=?",(bid,)).fetchone()
        if not b or (b["guest_id"]!=u["id"] and u["role"]!="admin"): raise HTTPException(404,"Booking not found")
        c.execute("update bookings set status='cancelled' where id=? and status='confirmed'",(bid,))
    return {"status":"cancelled"}
@app.get("/api/me/favorites")
def get_favorites(u=Depends(current_user)):
    with db() as c: return [public_listing(x) for x in c.execute("select l.*,u.name as host_name from favorites f join listings l on l.id=f.listing_id join users u on u.id=l.host_id where f.user_id=?",(u["id"],)).fetchall()]
@app.put("/api/me/favorites/{lid}")
def favorite(lid:int,u=Depends(current_user)):
    with db() as c:
        if not listing_by_id(c, lid):
            raise HTTPException(404, "Listing not found")
        c.execute("insert or ignore into favorites(user_id,listing_id,created_at) values(?,?,?)",(u["id"],lid,_utcnow().isoformat()))
    return {"saved":True}
@app.delete("/api/me/favorites/{lid}")
def unfavorite(lid:int,u=Depends(current_user)):
    with db() as c: c.execute("delete from favorites where user_id=? and listing_id=?",(u["id"],lid))
    return {"saved":False}
@app.get("/api/host/listings")
def host_listings(u=Depends(role("host","admin"))):
    with db() as c:
        if u["role"] == "admin":
            rows = c.execute("select * from listings order by id").fetchall()
        else:
            rows = c.execute("select * from listings where host_id=? order by id", (u["id"],)).fetchall()
        return [listing(x) for x in rows]
@app.post("/api/host/listings")
def create_listing(x:ListingIn,u=Depends(role("host"))):
    with db() as c:
        try:
            cur=c.execute("insert into listings(host_id,title,description,destination,latitude,longitude,price,capacity,bedrooms,bathrooms,category,rating,image,amenities) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",(u["id"],x.title.strip(),x.description,x.destination.strip(),x.latitude,x.longitude,x.price,x.capacity,x.bedrooms,x.bathrooms,x.category.strip(),5,x.image,json.dumps(x.amenities)))
        except sqlite3.IntegrityError:
            raise HTTPException(422, "Listing data is invalid")
        return listing(c.execute("select * from listings where id=?",(cur.lastrowid,)).fetchone())
@app.patch("/api/host/listings/{lid}")
def update_listing(lid:int,x:ListingIn,u=Depends(role("host"))):
    with db() as c:
        if not c.execute("select 1 from listings where id=? and host_id=?",(lid,u["id"])).fetchone(): raise HTTPException(404,"Listing not found")
        c.execute("update listings set title=?,description=?,destination=?,latitude=?,longitude=?,price=?,capacity=?,bedrooms=?,bathrooms=?,category=?,image=?,amenities=? where id=?",(x.title.strip(),x.description,x.destination.strip(),x.latitude,x.longitude,x.price,x.capacity,x.bedrooms,x.bathrooms,x.category.strip(),x.image,json.dumps(x.amenities),lid))
        return listing(c.execute("select * from listings where id=?",(lid,)).fetchone())
@app.delete("/api/host/listings/{lid}")
def delete_listing(lid:int,u=Depends(role("host"))):
    with db() as c:
        if not c.execute("select 1 from listings where id=? and host_id=?",(lid,u["id"])).fetchone(): raise HTTPException(404,"Listing not found")
        if c.execute("select 1 from bookings where listing_id=? and status in ('pending','confirmed')",(lid,)).fetchone():
            raise HTTPException(409, "Listing has active bookings and cannot be deleted")
        c.execute("delete from listings where id=?",(lid,))
    return {"deleted":True}
