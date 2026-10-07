"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Header from "../components/Header";
import LocationCarousel from "../components/LocationCarousel";
import SearchForm from "../components/SearchForm";
import { API, type Listing } from "../lib/api";
import Link from "next/link";

type ListingPage = { items: Listing[]; total: number; pages: number; detail?: string };
type TrustStats = { listings: number; destinations: number; reviews: number };
const LOCATIONS_PER_PAGE = 7;
type SearchQuery = Record<string, string | string[]>;

export default function Home() {
  const [items, setItems] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState<SearchQuery>({});
  const [trustStats, setTrustStats] = useState<TrustStats | null>(null);
  const requestSequence = useRef(0);

  async function load(nextQuery: SearchQuery = query) {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const params = new URLSearchParams({ page: "1", limit: "100" });
      Object.entries(nextQuery).forEach(([key, value]) => {
        if (Array.isArray(value)) value.forEach(item => params.append(key, item));
        else if (value) params.set(key, value);
      });
      const firstResponse = await fetch(`${API}/listings?${params}`);
      const firstPage = await firstResponse.json() as ListingPage;
      if (!firstResponse.ok) throw new Error(firstPage?.detail || "Could not load stays.");
      const otherPages = await Promise.all(Array.from({ length: Math.max(0, firstPage.pages - 1) }, async (_, index) => {
        const pageParams = new URLSearchParams(params);
        pageParams.set("page", String(index + 2));
        const response = await fetch(`${API}/listings?${pageParams}`);
        const result = await response.json() as ListingPage;
        if (!response.ok) throw new Error(result?.detail || "Could not load all stays.");
        return result.items;
      }));
      if (requestId !== requestSequence.current) return;
      const allItems = [...firstPage.items, ...otherPages.flat()];
      setItems(allItems);
      if (Object.keys(nextQuery).length === 0) {
        setTrustStats({
          listings: firstPage.total,
          destinations: new Set(allItems.map(item => item.destination)).size,
          reviews: allItems.reduce((sum, item) => sum + (item.review_count ?? 0), 0),
        });
      }
    } catch (e) {
      if (requestId !== requestSequence.current) return;
      setError((e as Error).message);
      setItems([]);
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }

  useEffect(() => { void load({}); }, []);

  const locations = useMemo(() => {
    const grouped = new Map<string, Listing[]>();
    for (const item of items) grouped.set(item.destination, [...(grouped.get(item.destination) || []), item]);
    return [...grouped.entries()].map(([destination, stays]) => [
      destination,
      [...stays].sort((a, b) =>
        (b.booking_count ?? 0) - (a.booking_count ?? 0)
        || (b.review_count ?? 0) - (a.review_count ?? 0)
        || b.rating - a.rating
        || a.id - b.id
      ),
    ] as [string, Listing[]]).sort(([nameA, staysA], [nameB, staysB]) => {
      const metrics = (stays: Listing[]) => ({
        bookings: stays.reduce((sum, stay) => sum + (stay.booking_count ?? 0), 0),
        reviews: stays.reduce((sum, stay) => sum + (stay.review_count ?? 0), 0),
        rating: stays.reduce((sum, stay) => sum + stay.rating, 0) / stays.length,
      });
      const popularityA = metrics(staysA);
      const popularityB = metrics(staysB);
      return popularityB.bookings - popularityA.bookings
        || popularityB.reviews - popularityA.reviews
        || popularityB.rating - popularityA.rating
        || nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });
  }, [items]);
  const pageCount = Math.max(1, Math.ceil(locations.length / LOCATIONS_PER_PAGE));
  const visibleLocations = locations.slice((page - 1) * LOCATIONS_PER_PAGE, page * LOCATIONS_PER_PAGE);

  return <main id="main-content"><Header /><aside className="demo-notice" role="note"><span aria-hidden="true">ⓘ</span><p>This is a demo website created for an assignment. <strong>Bookings and payments are not simulated.</strong></p></aside><section className="hero"><p className="eyebrow">FIND YOUR NEXT ESCAPE</p><h1>Stay somewhere<br /><i>unforgettable.</i></h1><p className="sub">Handpicked homes, warm hosts, and the confidence to book your perfect trip.</p><SearchForm onSearch={values => { setQuery(values); void load(values); }} /></section>{trustStats && <section className="trust-section" aria-label="StayFinder at a glance"><div className="trust-inner"><div className="trust-intro"><p className="eyebrow">A LITTLE MORE CONFIDENCE</p><h2>Good stays start with <i>trust.</i></h2></div><dl className="trust-stats"><div><dt>Stays to explore</dt><dd>{trustStats.listings.toLocaleString("en-IN")}</dd><span>listed on StayFinder</span></div><div><dt>Destinations</dt><dd>{trustStats.destinations.toLocaleString("en-IN")}</dd><span>with places to stay</span></div><div><dt>Guest reviews</dt><dd>{trustStats.reviews.toLocaleString("en-IN")}</dd><span>shared by travelers</span></div></dl></div></section>}<section className="content" aria-labelledby="explore-heading"><div className="sectionhead"><div><p className="eyebrow">EXPLORE STAYS</p><h2 id="explore-heading">Places made for <i>you</i></h2></div><Link href="/compare" className="login">Compare stays</Link></div>{loading ? <div className="loading-grid" aria-live="polite" aria-label="Loading locations">{[1,2,3,4,5,6].map(i => <div className="skeleton-card" key={i} />)}</div> : error ? <div className="notice" role="alert">{error}</div> : visibleLocations.length ? <><div className="location-grid">{visibleLocations.map(([destination, stays]) => <LocationCarousel key={destination} destination={destination} items={stays} />)}</div><div className="pagination" aria-label="Location pagination"><button type="button" disabled={page <= 1} onClick={() => setPage(current => Math.max(1, current - 1))}>← Previous locations</button><span aria-live="polite">Page {page} of {pageCount} · {locations.length} locations</span><button type="button" disabled={page >= pageCount} onClick={() => setPage(current => Math.min(pageCount, current + 1))}>Next locations →</button></div></> : <div className="empty">No stays match those filters.</div>}</section><footer className="site-footer"><div className="footer-main"><div className="footer-about"><Link className="footer-brand" href="/" aria-label="StayFinder home"><img src="/stayfinder-logo.png" alt="StayFinder — Your Home" /></Link><p>Find a place that makes the trip. Thoughtful stays for weekends away and journeys farther afield.</p></div><nav className="footer-links" aria-label="Footer navigation"><div><h2>Explore</h2><Link href="/">Find a stay</Link><Link href="/compare">Compare stays</Link></div><div><h2>Your stay</h2><Link href="/trips">My trips</Link><Link href="/host">Become a host</Link></div><div><h2>Account</h2><Link href="/login">Log in</Link></div></nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} stayfinder</span><span>Made for memorable stays · Demo bookings use mock payments</span></div></footer></main>;
}
