"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface WishlistItem {
  _id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
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

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initial Load: Run only once on mount safely in the browser client side
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wishlist");
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to parse wishlist from localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Save Updates: Sync to localStorage only after the initial local state is completely loaded
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, isLoaded]);

  // Add Item to Wishlist
  function addToWishlist(item: WishlistItem) {
    setWishlist((prev) => {
      const exists = prev.find((p) => p._id === item._id);
      if (exists) return prev;
      return [...prev, item];
    });
  }

  // Remove Item from Wishlist
  function removeFromWishlist(id: string) {
    setWishlist((prev) => prev.filter((item) => item._id !== id));
  }

  // Toggle Wishlist Status
  function toggleWishlist(item: WishlistItem) {
    setWishlist((prev) => {
      const exists = prev.find((p) => p._id === item._id);
      if (exists) {
        return prev.filter((i) => i._id !== item._id);
      }
      return [...prev, item];
    });
  }

  // Clear Entire Wishlist
  function clearWishlist() {
    setWishlist([]);
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