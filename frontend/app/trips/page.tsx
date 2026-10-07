"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { api, type Trip } from "../../lib/api";
import { handleImageFallback } from "../../lib/images";

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  }).format(date);
}

function money(value: number) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [tripToCancel, setTripToCancel] = useState<Trip | null>(null);
  const cancelDialogRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setTrips(await api<Trip[]>("/me/bookings"));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const dialog = cancelDialogRef.current;
    if (!dialog) return;
    if (tripToCancel && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLButtonElement>(".trip-dialog-keep")?.focus();
    } else if (!tripToCancel && dialog.open) {
      dialog.close();
    }
  }, [tripToCancel]);

  async function cancel(id: number) {
    setCancelling(id);
    setError("");
    try {
      await api(`/bookings/${id}/cancel`, { method: "POST" });
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setCancelling(null);
      setTripToCancel(null);
    }
  }

  return (
    <main id="main-content">
      <Header />
      <section className="trips-page">
        <div className="trips-heading">
          <p className="eyebrow">YOUR JOURNEY</p>
          <h1>My trips</h1>
          <p>All your getaways, together in one place.</p>
        </div>

        {error && <p className="notice trips-alert" role="alert">{error}{(error === "Authentication required" || error === "Invalid session") && <> <Link href="/login?returnTo=%2Ftrips">Log in →</Link></>}</p>}

        {loading && <div className="trips-loading" role="status">Loading your trips…</div>}

        {!loading && !error && trips.length === 0 && <div className="trips-empty">
          <span aria-hidden="true">✦</span>
          <h2>Your next adventure starts here</h2>
          <p>You don’t have any bookings yet. Find a place that feels like yours.</p>
          <Link href="/" className="trips-primary-link">Explore stays</Link>
        </div>}

        {!loading && trips.length > 0 && <div className="trips-results">
          <div className="trips-count">{trips.length} {trips.length === 1 ? "booking" : "bookings"}</div>
          <div className="trips-list">
            {trips.map(trip => <article className="trip-card" key={trip.id}>
              <Link className="trip-photo-link" href={`/listing/${trip.listing_id}`} aria-label={`View ${trip.title}`}>
                <img src={trip.image} alt={`${trip.title} in ${trip.destination}`} loading="lazy" onError={event => handleImageFallback(event, `listing-${trip.listing_id}`)} />
              </Link>
              <div className="trip-card-body">
                <div className="trip-card-topline">
                  <div className="trip-card-copy">
                    <p className="trip-destination">{trip.destination}</p>
                    <h2><Link href={`/listing/${trip.listing_id}`}>{trip.title}</Link></h2>
                  </div>
                  <span className={`trip-status trip-status-${trip.status.toLowerCase()}`}>{statusLabel(trip.status)}</span>
                </div>

                <div className="trip-essentials">
                  <div><span className="trip-info-icon" aria-hidden="true">▦</span><p><span>DATES</span><strong>{formatDate(trip.check_in)} – {formatDate(trip.check_out)}</strong></p></div>
                  <div><span className="trip-info-icon" aria-hidden="true">♙</span><p><span>GUESTS</span><strong>{trip.guests} {trip.guests === 1 ? "guest" : "guests"}</strong></p></div>
                </div>

                <div className="trip-card-bottom">
                  <p className="trip-total"><span>Total paid</span><strong>{money(trip.total)}</strong></p>
                  <div className="trip-actions">
                    <Link href={`/listing/${trip.listing_id}`} className="trip-view-listing">View listing</Link>
                    {trip.status === "confirmed" && <button type="button" className="trip-cancel" disabled={cancelling === trip.id} onClick={() => setTripToCancel(trip)}>{cancelling === trip.id ? "Cancelling…" : "Cancel booking"}</button>}
                  </div>
                </div>

                <details className="trip-details">
                  <summary>Booking details and price breakdown</summary>
                  <div className="trip-detail-content">
                    <div className="trip-detail-meta"><span>Booking reference</span><strong>#{trip.id}</strong></div>
                    <div className="trip-detail-meta"><span>Length of stay</span><strong>{trip.nights} {trip.nights === 1 ? "night" : "nights"}</strong></div>
                    <div className="trip-detail-price"><span>{money(trip.price)} × {trip.nights} {trip.nights === 1 ? "night" : "nights"}</span><strong>{money(trip.subtotal)}</strong></div>
                    <div className="trip-detail-price"><span>Cleaning fee</span><strong>{money(trip.cleaning_fee)}</strong></div>
                    <div className="trip-detail-price"><span>Service fee</span><strong>{money(trip.service_fee)}</strong></div>
                    <div className="trip-detail-price trip-detail-final"><strong>Total</strong><strong>{money(trip.total)}</strong></div>
                  </div>
                </details>
              </div>
            </article>)}
          </div>
        </div>}
      </section>
      <dialog
        ref={cancelDialogRef}
        className="trip-cancel-dialog"
        aria-labelledby="trip-cancel-title"
        aria-describedby="trip-cancel-description trip-cancel-policy"
        onCancel={event => { event.preventDefault(); if (cancelling === null) setTripToCancel(null); }}
        onClose={() => { if (cancelling === null) setTripToCancel(null); }}
      >
        {tripToCancel && <div className="trip-dialog-content">
          <span className="trip-dialog-icon" aria-hidden="true">!</span>
          <p className="eyebrow">CANCEL BOOKING</p>
          <h2 id="trip-cancel-title">Cancel this trip?</h2>
          <p id="trip-cancel-description" className="trip-dialog-stay">{tripToCancel.title}<br /><span>{formatDate(tripToCancel.check_in)} – {formatDate(tripToCancel.check_out)}</span></p>
          <div id="trip-cancel-policy" className="trip-dialog-policy">
            <strong>Cancellation policy</strong>
            <p>Cancellation is final in this demo and can’t be undone here. Refunds are not modeled, so no refund will be issued through this demo.</p>
          </div>
          <div className="trip-dialog-actions">
            <button type="button" className="trip-dialog-keep" disabled={cancelling !== null} onClick={() => setTripToCancel(null)}>Keep this trip</button>
            <button type="button" className="trip-dialog-confirm" disabled={cancelling !== null} onClick={() => void cancel(tripToCancel.id)}>{cancelling === tripToCancel.id ? "Cancelling…" : "Confirm cancellation"}</button>
          </div>
        </div>}
      </dialog>
    </main>
  );
}
