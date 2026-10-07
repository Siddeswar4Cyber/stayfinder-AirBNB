"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, type Listing } from "../lib/api";

type FavoritesContextValue = {
  favoriteIds: Set<number>;
  refreshFavorites: () => Promise<void>;
  toggleFavorite: (listingId: number) => Promise<boolean>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const refreshFavorites = useCallback(async () => {
    try {
      const favorites = await api<Listing[]>("/me/favorites");
      setFavoriteIds(new Set(favorites.map(listing => listing.id)));
    } catch {
      setFavoriteIds(new Set());
    }
  }, []);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = useCallback(async (listingId: number) => {
    const isSaved = favoriteIds.has(listingId);
    await api(`/me/favorites/${listingId}`, { method: isSaved ? "DELETE" : "PUT" });
    setFavoriteIds(current => {
      const updated = new Set(current);
      if (isSaved) updated.delete(listingId);
      else updated.add(listingId);
      return updated;
    });
    return !isSaved;
  }, [favoriteIds]);

  const value = useMemo(() => ({ favoriteIds, refreshFavorites, toggleFavorite }), [favoriteIds, refreshFavorites, toggleFavorite]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside FavoritesProvider");
  return context;
}
