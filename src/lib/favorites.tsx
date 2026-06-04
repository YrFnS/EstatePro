"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import { logActivity } from "@/lib/activity-log";

type FavoritesState = Set<string>;

let favorites: FavoritesState = new Set<string>();
const listeners = new Set<() => void>();

// Cached server snapshot to avoid infinite loop warning
const emptySet = new Set<string>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): FavoritesState {
  return favorites;
}

function getServerSnapshot(): FavoritesState {
  return emptySet;
}

function initFavorites() {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("estatepro-favorites");
      if (saved) {
        favorites = new Set(JSON.parse(saved));
      }
    } catch {
      favorites = new Set<string>();
    }
  }
}

function saveFavorites() {
  if (typeof window !== "undefined") {
    localStorage.setItem("estatepro-favorites", JSON.stringify([...favorites]));
  }
}

initFavorites();

interface FavoritesContextType {
  favorites: FavoritesState;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => boolean;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
  favoritesCount: number;
  favoritesList: string[];
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const favSet = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isFavorite = useCallback((id: string) => favSet.has(id), [favSet]);

  const toggleFavorite = useCallback((id: string) => {
    const wasFavorite = favorites.has(id);
    if (wasFavorite) {
      favorites = new Set([...favorites].filter((f) => f !== id));
      logActivity("favorite", `Removed property from favorites`);
    } else {
      favorites = new Set([...favorites, id]);
      logActivity("favorite", `Added property to favorites`);
    }
    saveFavorites();
    notifyListeners();
    return favorites.has(id);
  }, []);

  const addFavorite = useCallback((id: string) => {
    favorites = new Set([...favorites, id]);
    saveFavorites();
    notifyListeners();
  }, []);

  const removeFavorite = useCallback((id: string) => {
    favorites = new Set([...favorites].filter((f) => f !== id));
    saveFavorites();
    notifyListeners();
  }, []);

  const clearFavorites = useCallback(() => {
    favorites = new Set<string>();
    saveFavorites();
    notifyListeners();
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites: favSet,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites,
        favoritesCount: favSet.size,
        favoritesList: [...favSet],
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
