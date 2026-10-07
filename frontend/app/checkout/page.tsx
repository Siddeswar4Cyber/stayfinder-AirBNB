"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import { api, type Listing } from "../../lib/api";
import { handleImageFallback } from "../../lib/images";

type Quote = {
  listing: Listing;
  nights: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
};
type PaymentOutcome = "success" | "declined";

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  }).format(date);
}

function money(value: number) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export default function Checkout() {
  const router = useRouter();
  const [details, setDetails] = useState({ listingId: "", checkIn: "", checkOut: "", checkInTime: "15:00", checkOutTime: "11:00", guests: 1 });
  const { listingId, checkIn, checkOut, checkInTime, checkOutTime, guests } = details;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedGuests = Number(params.get("guests") || 1);
    setDetails({
      listingId: params.get("listing") || "",
      checkIn: params.get("check_in") || "",
      checkOut: params.get("check_out") || "",
      checkInTime: params.get("check_in_time") || "15:00",
      checkOutTime: params.get("check_out_time") || "11:00",
      guests: Number.isInteger(requestedGuests) && requestedGuests > 0 ? requestedGuests : 1,
    });
  }, []);

  useEffect(() => {
    if (!listingId) {
      setError("Booking details are missing. Return to the listing to choose your stay.");
      setLoading(false);
      return;
    }
    if (!checkIn || !checkOut) {
      setError("Booking dates are missing. Return to the listing to choose your stay.");
      setLoading(false);
      return;
    }

    let current = true;
    setLoading(true);
    setError("");
    api<Quote>("/bookings/quote", {
      method: "POST",
      body: JSON.stringify({ listing_id: Number(listingId), check_in: checkIn, check_out: checkOut, check_in_time: checkInTime, check_out_time: checkOutTime, guests }),
    }).then(result => {
      if (current) setQuote(result);
    }).catch(cause => {
      if (current) setError((cause as Error).message);
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [listingId, checkIn, checkOut, checkInTime, checkOutTime, guests]);

  async function simulatePayment(outcome: PaymentOutcome) {
    if (!quote || busy) return;
    setBusy(true);
    setError("");

    try {
      await new Promise(resolve => window.setTimeout(resolve, 1200));
      const payment = await api<{ payment_attempt_id: number }>("/payments/mock", {
        method: "POST",
        body: JSON.stringify({
          outcome,
          listing_id: Number(listingId),
          check_in: checkIn,
          check_out: checkOut,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          guests,
          demo_reference: `demo-${Date.now()}`,
        }),
      });

      if (outcome === "declined") {
        setError("The demo payment was declined. Your stay has not been booked.");
        return;
      }

      await api("/bookings", {
        method: "POST",
        body: JSON.stringify({
          listing_id: Number(listingId),
          check_in: checkIn,
          check_out: checkOut,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          guests,
          payment_attempt_id: payment.payment_attempt_id,
        }),
      });
      router.push("/trips");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const returnToListing = listingId ? `/listing/${listingId}` : "/";
  const loginReturn = `/checkout?listing=${listingId}&check_in=${checkIn}&check_out=${checkOut}&check_in_time=${checkInTime}&check_out_time=${checkOutTime}&guests=${guests}`;

  return (
    <main id="main-content">
      <Header />
      <section className="checkout-page">
        <Link href={returnToListing} className="checkout-back">← Back to listing</Link>
        <div className="checkout-heading">
          <p className="eyebrow">DEMO CHECKOUT</p>
          <h1>Confirm your stay</h1>
          <p>Review the details before you book.</p>
        </div>

        {loading && <div className="checkout-loading" role="status">Preparing your booking details…</div>}
        {!loading && quote && <div className="checkout-layout">
          <div className="checkout-main-column">
            <section className="checkout-card checkout-listing-card" aria-labelledby="listing-heading">
              <img
                className="checkout-listing-photo"
                src={quote.listing.photos?.[0]?.image_url || quote.listing.image}
                alt={quote.listing.photos?.[0]?.alt_text || `${quote.listing.title} in ${quote.listing.destination}`}
                onError={event => handleImageFallback(event, `listing-${quote.listing.id}`)}
              />
              <div className="checkout-listing-copy">
                <p className="checkout-location">{quote.listing.destination} <span aria-hidden="true">·</span> {quote.listing.category}</p>
                <h2 id="listing-heading">{quote.listing.title}</h2>
                <p className="checkout-listing-meta">★ {Number(quote.listing.rating).toFixed(1)} <span aria-hidden="true">·</span> {quote.listing.bedrooms} bedrooms <span aria-hidden="true">·</span> {quote.listing.bathrooms} bathrooms</p>
              </div>
            </section>

            <section className="checkout-card checkout-stay-card" aria-labelledby="stay-heading">
              <div className="checkout-section-title">
                <div><p className="eyebrow">YOUR BOOKING</p><h2 id="stay-heading">Stay details</h2></div>
                <Link href={returnToListing} className="checkout-edit-link">Edit</Link>
              </div>
              <div className="checkout-stay-grid">
                <div><span>CHECK IN</span><strong>{formatDate(checkIn)} · {checkInTime}</strong></div>
                <div><span>CHECK OUT</span><strong>{formatDate(checkOut)} · {checkOutTime}</strong></div>
                <div><span>GUESTS</span><strong>{guests} {guests === 1 ? "guest" : "guests"}</strong></div>
                <div><span>LOCATION</span><strong>{quote.listing.destination}</strong></div>
              </div>
            </section>

            <section className="checkout-card checkout-policy" aria-labelledby="policy-heading">
              <div className="checkout-policy-icon" aria-hidden="true">✓</div>
              <div><h2 id="policy-heading">Cancellation policy</h2><p>Manage or cancel a confirmed booking from <Link href="/trips">My trips</Link>. In this demo, cancellation changes the booking status; refunds are not modeled.</p></div>
            </section>
          </div>

          <aside className="checkout-card checkout-price-card" aria-labelledby="price-heading">
            <p className="eyebrow">PRICE SUMMARY</p>
            <h2 id="price-heading">Your total</h2>
            <div className="checkout-price-lines">
              <div><span>{money(Number(quote.listing.price))} × {quote.nights} {quote.nights === 1 ? "night" : "nights"}</span><strong>{money(quote.subtotal)}</strong></div>
              <div><span>Cleaning fee</span><strong>{money(quote.cleaning_fee)}</strong></div>
              <div><span>Service fee</span><strong>{money(quote.service_fee)}</strong></div>
            </div>
            <div className="checkout-total"><strong>Total</strong><strong>{money(quote.total)}</strong></div>
            <p className="checkout-includes">Total price for {quote.nights} {quote.nights === 1 ? "night" : "nights"}, including fees.</p>
            <div className="checkout-demo-note"><span aria-hidden="true">ⓘ</span><p>Demo booking only. No card details are requested or processed.</p></div>
            <div className="checkout-confirm-actions">
              <button type="button" disabled={busy} onClick={() => void simulatePayment("success")}>
                {busy ? "Confirming your booking…" : "Confirm booking"}
              </button>
              {busy && <p role="status">Please wait while we confirm your demo booking.</p>}
              <button type="button" className="checkout-decline" disabled={busy} onClick={() => void simulatePayment("declined")}>Try declined payment</button>
            </div>
          </aside>
        </div>}

        {!loading && !quote && error && <div className="checkout-error-state"><p className="notice" role="alert">{error}{(error === "Authentication required" || error === "Invalid session") && <> <Link href={`/login?returnTo=${encodeURIComponent(loginReturn)}`}>Log in to continue</Link></>}</p><Link className="checkout-error-back" href={returnToListing}>Return to listing →</Link></div>}
        {quote && error && <p role="alert" className="notice checkout-alert">{error}{(error === "Authentication required" || error === "Invalid session") && <> <Link href={`/login?returnTo=${encodeURIComponent(loginReturn)}`}>Log in</Link></>}</p>}
      </section>
    </main>
  );
}
