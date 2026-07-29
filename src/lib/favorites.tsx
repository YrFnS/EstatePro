"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { MAX_FAVORITES } from "@/lib/account-state";
import { logActivity } from "@/lib/activity-log";
import { usePersistentIdCollection } from "@/lib/use-persistent-id-collection";

type FavoritesState = Set<string>;

interface FavoritesContextType {
  favorites: FavoritesState;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => boolean;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
  favoritesCount: number;
  favoritesList: string[];
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    ids: favoritesList,
    replaceIds,
    isLoading,
  } = usePersistentIdCollection({
    endpoint: "/api/account/favorites",
    responseKey: "favorites",
    guestStorageKey: "estatepro-favorites",
    accountStoragePrefix: "estatepro-favorites",
    maxItems: MAX_FAVORITES,
  });

  const favorites = useMemo(
    () => new Set(favoritesList),
    [favoritesList]
  );

  const isFavorite = useCallback(
    (id: string) => favorites.has(id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const wasFavorite = favorites.has(id);
      const next = wasFavorite
        ? favoritesList.filter((favoriteId) => favoriteId !== id)
        : [id, ...favoritesList];

      replaceIds(next);
      logActivity(
        "favorite",
        wasFavorite
          ? "Removed property from favorites"
          : "Added property to favorites"
      );
      return !wasFavorite;
    },
    [favorites, favoritesList, replaceIds]
  );

  const addFavorite = useCallback(
    (id: string) => {
      if (favorites.has(id)) return;
      replaceIds([id, ...favoritesList]);
      logActivity("favorite", "Added property to favorites");
    },
    [favorites, favoritesList, replaceIds]
  );

  const removeFavorite = useCallback(
    (id: string) => {
      if (!favorites.has(id)) return;
      replaceIds(
        favoritesList.filter((favoriteId) => favoriteId !== id)
      );
      logActivity("favorite", "Removed property from favorites");
    },
    [favorites, favoritesList, replaceIds]
  );

  const clearFavorites = useCallback(() => {
    replaceIds([]);
  }, [replaceIds]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites,
        favoritesCount: favoritesList.length,
        favoritesList,
        isLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error(
      "useFavorites must be used within a FavoritesProvider"
    );
  }
  return context;
}
