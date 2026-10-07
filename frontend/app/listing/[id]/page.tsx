"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "../../../components/Header";
import BookingDatePicker from "../../../components/BookingDatePicker";
import { api, type Listing } from "../../../lib/api";
import { handleImageFallback } from "../../../lib/images";

const ListingLocationMap = dynamic(() => import("../../../components/ListingLocationMap"), {
  ssr: false,
  loading: () => <div className="detail-map-loading" role="status">Loading location map…</div>,
});

type Photo = { id: number; image_url: string; sort_order: number; alt_text: string };
type Review = { author: string; rating: number; text: string };
type Detail = Listing & { photos: Photo[]; reviews: Review[]; availability: { booked_ranges: string[][] } };
type Quote = { nights: number; subtotal: number; cleaning_fee: number; service_fee: number; total: number };
type MatchScore = { score: number; criteria: Record<string, boolean> };

function isBookedAtTime(date: string, time: string, ranges: string[][]) {
  const instant = `${date}T${time}`;
  return ranges.some(([start, end, startTime = "15:00", endTime = "11:00"]) => instant >= `${start}T${startTime}` && instant < `${end}T${endTime}`);
}

function overlapsBookedRange(checkIn: string, checkOut: string, ranges: string[][], checkInTime: string, checkOutTime: string) {
  const start = `${checkIn}T${checkInTime}`;
  const end = `${checkOut}T${checkOutTime}`;
  return ranges.some(([bookedStart, bookedEnd, bookedCheckInTime = "15:00", bookedCheckOutTime = "11:00"]) => start < `${bookedEnd}T${bookedCheckOutTime}` && end > `${bookedStart}T${bookedCheckInTime}`);
}

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Detail | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInTime, setCheckInTime] = useState("15:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [guests, setGuests] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [nearbyPlace, setNearbyPlace] = useState("");
  const [score, setScore] = useState<MatchScore | null>(null);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const lightboxOpen = lightboxIndex !== null;
  const photoCount = listing?.photos?.length || 1;

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight") {
        setPhotoLoading(true);
        setLightboxIndex(index => index === null ? null : (index + 1) % photoCount);
      }
      if (event.key === "ArrowLeft") {
        setPhotoLoading(true);
        setLightboxIndex(index => index === null ? null : (index - 1 + photoCount) % photoCount);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, photoCount]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    setCheckIn(params.get("check_in") || "");
    setCheckOut(params.get("check_out") || "");
    setCheckInTime(params.get("check_in_time") || "15:00");
    setCheckOutTime(params.get("check_out_time") || "11:00");
    const requestedGuests = Number(params.get("guests") || 1);
    setGuests(Number.isInteger(requestedGuests) && requestedGuests > 0 ? requestedGuests : 1);
    api<Detail>(`/listings/${id}`).then(result => {
      if (active) setListing(result);
    }).catch(cause => {
      if (active) setError((cause as Error).message);
    });
    return () => { active = false; };
  }, [id]);

  async function getQuote() {
    try {
      const result = await api<Quote>("/bookings/quote", {
        method: "POST",
        body: JSON.stringify({ listing_id: Number(id), check_in: checkIn, check_out: checkOut, check_in_time: checkInTime, check_out_time: checkOutTime, guests }),
      });
      setQuote(result);
      setError("");
    } catch (cause) {
      const message = (cause as Error).message;
      if (message === "Authentication required" || message === "Invalid session") {
        const returnParams = new URLSearchParams({ check_in: checkIn, check_out: checkOut, check_in_time: checkInTime, check_out_time: checkOutTime, guests: String(guests) });
        router.push(`/login?returnTo=${encodeURIComponent(`/listing/${id}?${returnParams}`)}`);
      } else {
        setError(message);
      }
    }
  }

  async function calculateScore() {
    try {
      const params = new URLSearchParams({ guests: String(guests) });
      if (nearbyPlace.trim()) params.set("nearby_place", nearbyPlace.trim());
      setScore(await api<MatchScore>(`/listings/${id}/match-score?${params}`));
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  if (!listing) {
    return <main id="main-content"><Header /><div className="empty" role={error ? "alert" : undefined}>{error || "Loading stay…"}</div></main>;
  }

  const photos = listing.photos?.length ? listing.photos : [{
    id: listing.id,
    image_url: listing.image,
    sort_order: 0,
    alt_text: `${listing.title} in ${listing.destination}`,
  }];
  const checkoutParams = new URLSearchParams({ listing: id, check_in: checkIn, check_out: checkOut, check_in_time: checkInTime, check_out_time: checkOutTime, guests: String(guests) });
  const lightboxPhoto = lightboxIndex === null ? null : photos[(lightboxIndex + photos.length) % photos.length];
  function moveLightbox(direction: -1 | 1) {
    setPhotoLoading(true);
    setLightboxIndex(index => index === null ? null : (index + direction + photos.length) % photos.length);
  }
  function openLightbox(index: number) {
    setPhotoLoading(true);
    setLightboxIndex(index);
  }

  return (
    <main id="main-content">
      <Header />
      <section className="detail">
        <Link href="/" className="back">← Back to stays</Link>
        <div className="detailgrid">
          <div className="detailgallery">
            <button className="detailgallery-photo-button detailgallery-main-button" type="button" onClick={() => openLightbox(0)} aria-label="Open photo 1">
              <img className="detailgallery-main" src={photos[0].image_url} alt={photos[0].alt_text || listing.title} onError={event => handleImageFallback(event, "photo-" + photos[0].id)} />
            </button>
            <div className="detailgallery-thumbs">
              {photos.slice(1, 4).map((photo, index) => <button className="detailgallery-photo-button" key={photo.id} type="button" onClick={() => openLightbox(index + 1)} aria-label={"Open photo " + (index + 2)}>
                <img src={photo.image_url} alt={photo.alt_text || listing.title} loading="lazy" onError={event => handleImageFallback(event, "photo-" + photo.id)} />
              </button>)}
            </div>
          </div>

          <div className="detailcopy">
            <p className="eyebrow">{listing.destination} · {listing.category}</p>
            <h1>{listing.title}</h1>
            <p className="rating" aria-label={`Rating ${Number(listing.rating).toFixed(1)} out of 5`}>★ {Number(listing.rating).toFixed(1)} · {listing.capacity} guests · {listing.bedrooms} bedrooms</p>
            <p className="host-summary">Hosted by <strong>{listing.host_name || "StayFinder host"}</strong></p>
            <p>{listing.description}</p>
            <div className="amenities" aria-label="Amenities">{listing.amenities.map(amenity => <span key={amenity}>✓ {amenity}</span>)}</div>

            <div className="booking">
              <div><b>₹{Number(listing.price).toLocaleString()}</b> / night</div>
              <BookingDatePicker
                label="CHECK IN"
                value={checkIn}
                bookedRanges={listing.availability?.booked_ranges || []}
                time={checkInTime}
                onTimeChange={value => {
                  setCheckInTime(value);
                  const ranges = listing.availability?.booked_ranges || [];
                  if (checkIn && isBookedAtTime(checkIn, value, ranges)) { setCheckIn(""); setCheckOut(""); }
                  else if (checkOut && overlapsBookedRange(checkIn, checkOut, ranges, value, checkOutTime)) setCheckOut("");
                  setQuote(null);
                }}
                onChange={value => {
                  setCheckIn(value);
                  if (checkOut && (checkOut <= value || overlapsBookedRange(value, checkOut, listing.availability?.booked_ranges || [], checkInTime, checkOutTime))) setCheckOut("");
                  setQuote(null);
                }}
              />
              <BookingDatePicker
                label="CHECK OUT"
                value={checkOut}
                checkIn={checkIn}
                bookedRanges={listing.availability?.booked_ranges || []}
                time={checkOutTime}
                checkInTime={checkInTime}
                onTimeChange={value => {
                  setCheckOutTime(value);
                  if (checkIn && checkOut && overlapsBookedRange(checkIn, checkOut, listing.availability?.booked_ranges || [], checkInTime, value)) setCheckOut("");
                  setQuote(null);
                }}
                onChange={value => { setCheckOut(value); setQuote(null); }}
              />
              <label>GUESTS<input aria-label="Number of guests" type="number" min="1" max={listing.capacity} value={guests} onChange={event => { setGuests(Number(event.target.value)); setQuote(null); }} /></label>
              <button type="button" disabled={!checkIn || !checkOut || overlapsBookedRange(checkIn, checkOut, listing.availability?.booked_ranges || [], checkInTime, checkOutTime)} onClick={() => void getQuote()}>Check availability &amp; quote</button>
              {checkIn && checkOut && overlapsBookedRange(checkIn, checkOut, listing.availability?.booked_ranges || [], checkInTime, checkOutTime) && <p className="notice" role="status">Those dates and times overlap an existing booking. Adjust your arrival or departure time.</p>}
              {quote && <div className="quote">
                <p>{quote.nights} nights: ₹{Number(quote.subtotal).toLocaleString()}</p>
                <p>Cleaning fee: ₹{Number(quote.cleaning_fee).toLocaleString()}</p>
                <p>Service fee: ₹{Number(quote.service_fee).toLocaleString()}</p>
                <p><strong>Total: ₹{Number(quote.total).toLocaleString()}</strong></p>
                <button type="button" onClick={() => router.push(`/checkout?${checkoutParams}`)}>Continue to checkout</button>
              </div>}
              {error && <p className="notice" role="alert">{error}</p>}
            </div>

            <div className="matchbox">
              <b>Find your match</b>
              <p>Compare this stay to your own preferences; this is a subjective guide.</p>
              <input aria-label="Nearby place or landmark" placeholder="Nearby place or landmark" value={nearbyPlace} onChange={event => setNearbyPlace(event.target.value)} />
              <button type="button" onClick={() => void calculateScore()}>Calculate match score</button>
              {score && <p className="confirmed" role="status">{score.score}% match · {Object.values(score.criteria).filter(Boolean).length} preferences matched</p>}
            </div>
          </div>
        </div>

        <section className="detail-location" aria-labelledby="approximate-location-heading">
          <div className="detail-location-heading">
            <div><h2 id="approximate-location-heading">Approximate location</h2><p>Explore the area around this stay.</p></div>
            <span>◉ {listing.destination}</span>
          </div>
          <div className="detail-location-map"><ListingLocationMap listing={listing} /></div>
          <small className="detail-location-note">The map pin shows an approximate area, not the property’s exact address.</small>
        </section>
        {lightboxPhoto && <div className="gallery-lightbox" onClick={() => setLightboxIndex(null)}>
          <div className="gallery-lightbox-dialog" role="dialog" aria-modal="true" aria-label={listing.title + " photo gallery"} onClick={event => event.stopPropagation()}>
            <button className="gallery-lightbox-close" type="button" autoFocus onClick={() => setLightboxIndex(null)} aria-label="Close photo viewer">×</button>
            {photos.length > 1 && <button className="gallery-lightbox-arrow" type="button" onClick={() => moveLightbox(-1)} aria-label="Previous photo">‹</button>}
            <figure className="gallery-lightbox-figure" aria-busy={photoLoading}>
              {photoLoading && <div className="gallery-photo-loading" role="status"><span className="gallery-photo-spinner" aria-hidden="true" />Loading photo…</div>}
              <img className={photoLoading ? "gallery-lightbox-image is-loading" : "gallery-lightbox-image"} src={lightboxPhoto.image_url} alt={lightboxPhoto.alt_text || listing.title} onLoad={() => setPhotoLoading(false)} onError={event => {
                const image = event.currentTarget;
                if (image.dataset.fallbackApplied) setPhotoLoading(false);
                else handleImageFallback(event, "photo-" + lightboxPhoto.id);
              }} />
              <figcaption>{listing.title} · {(lightboxIndex! + photos.length) % photos.length + 1} of {photos.length}</figcaption>
            </figure>
            {photos.length > 1 && <button className="gallery-lightbox-arrow" type="button" onClick={() => moveLightbox(1)} aria-label="Next photo">›</button>}
          </div>
        </div>}        <h2>Guest reviews</h2>
        {listing.reviews?.length ? listing.reviews.map(review => <div className="review" key={`${review.author}-${review.text}`}><b>★ {review.rating} · {review.author}</b><p>{review.text}</p></div>) : <p className="empty">No reviews yet.</p>}
      </section>
    </main>
  );
}
