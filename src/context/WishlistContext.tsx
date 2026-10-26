"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  ReactNode,
} from "react";

export interface WishlistItem {
  _id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  sizes?: string[];
  colors?: string[];
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: WishlistItem) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);
const WISHLIST_STORAGE_KEY = "wishlist";
const WISHLIST_CHANGE_EVENT = "clothestown:wishlist-change";
const EMPTY_WISHLIST: WishlistItem[] = [];
let cachedWishlistRaw: string | null = null;
let cachedWishlist: WishlistItem[] = EMPTY_WISHLIST;

function isWishlistItem(value: unknown): value is WishlistItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<WishlistItem>;
  return (
    typeof item._id === "string" &&
    typeof item.name === "string" &&
    typeof item.slug === "string" &&
    typeof item.image === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    (item.sizes === undefined || Array.isArray(item.sizes)) &&
    (item.colors === undefined || Array.isArray(item.colors))
  );
}

function getWishlistSnapshot() {
  if (typeof window === "undefined") return EMPTY_WISHLIST;

  try {
    const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY) ?? "[]";
    if (stored === cachedWishlistRaw) return cachedWishlist;

    cachedWishlistRaw = stored;
    const parsed: unknown = JSON.parse(stored);
    cachedWishlist = Array.isArray(parsed) ? parsed.filter(isWishlistItem) : EMPTY_WISHLIST;
  } catch {
    cachedWishlistRaw = null;
    cachedWishlist = EMPTY_WISHLIST;
  }

  return cachedWishlist;
}

function subscribeToWishlist(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(WISHLIST_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(WISHLIST_CHANGE_EVENT, onChange);
  };
}

function updateWishlist(updater: (current: WishlistItem[]) => WishlistItem[]) {
  const nextWishlist = updater(getWishlistSnapshot());
  const serialized = JSON.stringify(nextWishlist);
  cachedWishlist = nextWishlist;
  cachedWishlistRaw = serialized;

  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, serialized);
  } catch {}

  window.dispatchEvent(new Event(WISHLIST_CHANGE_EVENT));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const wishlist = useSyncExternalStore(
    subscribeToWishlist,
    getWishlistSnapshot,
    () => EMPTY_WISHLIST
  );

  // Add Item to Wishlist
  function addToWishlist(item: WishlistItem) {
    updateWishlist((prev) => {
      const exists = prev.find((p) => p._id === item._id);
      if (exists) return prev;
      return [...prev, item];
    });
  }

  // Remove Item from Wishlist
  function removeFromWishlist(id: string) {
    updateWishlist((prev) => prev.filter((item) => item._id !== id));
  }

  // Toggle Wishlist Status
  function toggleWishlist(item: WishlistItem) {
    updateWishlist((prev) => {
      const exists = prev.find((p) => p._id === item._id);
      if (exists) {
        return prev.filter((i) => i._id !== item._id);
      }
      return [...prev, item];
    });
  }

  // Clear Entire Wishlist
  function clearWishlist() {
    updateWishlist(() => []);
  }

  // Check if Product Exists in Current State
  function isInWishlist(id: string) {
    return wishlist.some((item) => item._id === id);
  }

  // Active Wishlist Counter
  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        isInWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return context;
}