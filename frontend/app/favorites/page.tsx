"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import ListingCard from "../../components/ListingCard";
import { api, type Listing } from "../../lib/api";
import { useFavorites } from "../../components/FavoritesProvider";

export default function FavoritesPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { favoriteIds } = useFavorites();

  const load = useCallback(async () => {
    try {
      setItems(await api<Listing[]>("/me/favorites"));
      setError("");
    } catch (cause) {
      const message = (cause as Error).message;
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const savedItems = items.filter(item => favoriteIds.has(item.id));

  return (
    <main id="main-content">
      <Header />
      <section className="content" aria-labelledby="wishlist-heading">
        <p className="eyebrow">YOUR SAVED STAYS</p>
        <h1 id="wishlist-heading">Wishlist</h1>
        {loading && <p role="status">Loading saved stays…</p>}
        {error && <p className="notice" role="alert">{error}{(error === "Authentication required" || error === "Invalid session") && <> <Link href="/login?returnTo=/favorites">Log in →</Link></>}</p>}
        {!loading && !error && (savedItems.length ? <div className="grid">{savedItems.map(item => <ListingCard key={item.id} item={item} />)}</div> : <div className="empty">No saved stays yet. <Link href="/">Explore stays →</Link></div>)}
      </section>
    </main>
  );
}
