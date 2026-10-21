"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
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

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Derived total amount calculated automatically via memo matrix
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const addToCart = (product: CartItem) => {
    setCart((prev) => {
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
    setCart((prev) =>
      prev.filter((item) => getCartItemKey(item) !== id && item._id !== id)
    );
  };

  const increaseQty = (id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        getCartItemKey(item) === id || item._id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQty = (id: string) => {
    setCart((prev) =>
      prev.map((item) =>
        getCartItemKey(item) === id || item._id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
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