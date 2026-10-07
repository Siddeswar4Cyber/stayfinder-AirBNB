"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Listing } from "../lib/api";
import { handleImageFallback } from "../lib/images";
import { useFavorites } from "./FavoritesProvider";

export default function ListingCard({ item }: { item: Listing }) {
  const router = useRouter();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [favoriteError, setFavoriteError] = useState("");
  const isFavorite = favoriteIds.has(item.id);
  const detailUrl = `/listing/${item.id}`;

  async function handleFavorite() {
    setFavoriteError("");
    try {
      await toggleFavorite(item.id);
    } catch (error) {
      const message = (error as Error).message;
      if (message === "Authentication required" || message === "Invalid session") {
        router.push(`/login?returnTo=${encodeURIComponent(detailUrl)}`);
      } else {
        setFavoriteError(message);
      }
    }
  }

  return (
    <article className="listing-card">
      <div className="photo">
        <Link href={detailUrl} aria-label={`View ${item.title}`}>
          <img src={item.image} alt={`${item.title} in ${item.destination}`} loading="lazy" onError={event => handleImageFallback(event, `listing-${item.id}`)} />
          <span className="tag">{item.category}</span>
        </Link>
        <button type="button" className="heart" aria-label={isFavorite ? `Remove ${item.title} from wishlist` : `Add ${item.title} to wishlist`} aria-pressed={isFavorite} onClick={handleFavorite}>
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>
      <div className="cardbody">
        <Link href={detailUrl}>
          <h3>{item.title}</h3>
          <p>{item.destination} · {item.capacity} guests</p>
          <p className="price">₹{Number(item.price).toLocaleString()} <small>/ night</small></p>
          <span className="details">View stay <span>★ {Number(item.rating).toFixed(1)}</span></span>
        </Link>
        {favoriteError && <p className="card-error" role="alert">{favoriteError}</p>}
      </div>
    </article>
  );
}
