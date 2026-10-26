"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useSyncExternalStore,
} from "react";

export interface CartItem {
  _id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
}

export function getCartItemKey(item: Pick<CartItem, "_id" | "size" | "color">) {
  return `${item._id}:${item.size ?? ""}:${item.color ?? ""}`;
}

interface CartContextType {
  cart: CartItem[];
  cartTotal: number;
  addToCart: (product: CartItem) => void;
  removeFromCart: (id: string) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = "clothestown_cart";
const CART_CHANGE_EVENT = "clothestown:cart-change";
const EMPTY_CART: CartItem[] = [];
let cachedCartRaw: string | null = null;
let cachedCart: CartItem[] = EMPTY_CART;

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item._id === "string" &&
    typeof item.name === "string" &&
    typeof item.slug === "string" &&
    typeof item.image === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    item.price >= 0 &&
    Number.isInteger(item.quantity) &&
    Number(item.quantity) > 0 &&
    (item.size === undefined || typeof item.size === "string") &&
    (item.color === undefined || typeof item.color === "string")
  );
}

function getCartSnapshot() {
  if (typeof window === "undefined") return EMPTY_CART;

  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]";
    if (stored === cachedCartRaw) return cachedCart;

    cachedCartRaw = stored;
    const parsed: unknown = JSON.parse(stored);
    cachedCart = Array.isArray(parsed) ? parsed.filter(isCartItem) : EMPTY_CART;
  } catch {
    cachedCartRaw = null;
    cachedCart = EMPTY_CART;
  }

  return cachedCart;
}

function subscribeToCart(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CART_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CART_CHANGE_EVENT, onChange);
  };
}

function updateCart(updater: (current: CartItem[]) => CartItem[]) {
  const nextCart = updater(getCartSnapshot());
  const serialized = JSON.stringify(nextCart);
  cachedCart = nextCart;
  cachedCartRaw = serialized;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, serialized);
  } catch {}

  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const cart = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    () => EMPTY_CART
  );

  // Derived total amount calculated automatically via memo matrix
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const addToCart = (product: CartItem) => {
    updateCart((prev) => {
      const productKey = getCartItemKey(product);
      const exists = prev.find((item) => getCartItemKey(item) === productKey);

      if (exists) {
        return prev.map((item) =>
          getCartItemKey(item) === productKey
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      }

      return [...prev, product];
    });
  };

  const removeFromCart = (id: string) => {
    updateCart((prev) =>
      prev.filter((item) => getCartItemKey(item) !== id && item._id !== id)
    );
  };

  const increaseQty = (id: string) => {
    updateCart((prev) =>
      prev.map((item) =>
        getCartItemKey(item) === id || item._id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQty = (id: string) => {
    updateCart((prev) =>
      prev.map((item) =>
        getCartItemKey(item) === id || item._id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const clearCart = () => {
    updateCart(() => []);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartTotal,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}