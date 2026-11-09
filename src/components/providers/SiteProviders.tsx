"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ProductView } from "@/lib/catalogue";

/**
 * Cart + wishlist live in localStorage on the client and are mirrored to the
 * server (POST /api/cart) so checkout and owner order creation see real data.
 */

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  colour: string;
  price: number | null;
  minOrderQty: number;
  quantity: number;
  image: string;
};

type Toast = { id: number; message: string; tone: "info" | "success" | "error" };

type Ctx = {
  cart: CartLine[];
  wishlist: string[];
  toasts: Toast[];
  addToCart: (p: ProductView, size: string, colour: string, qty?: number) => void;
  updateQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  inWishlist: (slug: string) => boolean;
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
  subtotal: number;
  count: number;
  ready: boolean;
};

const SiteCtx = createContext<Ctx | null>(null);

const CART_KEY = "kg.cart.v1";
const WISH_KEY = "kg.wishlist.v1";

export function SiteProviders({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate after mount to avoid SSR/client markup mismatch.
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      const w = JSON.parse(localStorage.getItem(WISH_KEY) || "[]");
      if (Array.isArray(c)) setCart(c);
      if (Array.isArray(w)) setWishlist(w);
    } catch {
      /* corrupt storage is not worth crashing the storefront over */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist, ready]);

  const toast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const addToCart: Ctx["addToCart"] = useCallback(
    (p, size, colour, qty) => {
      const key = `${p.id}|${size}|${colour}`;
      const amount = qty ?? p.minOrderQty;
      setCart((prev) => {
        const found = prev.find((l) => l.key === key);
        if (found) {
          return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + amount } : l));
        }
        return [
          ...prev,
          {
            key,
            productId: p.id,
            slug: p.slug,
            name: p.name,
            size,
            colour,
            price: p.price,
            minOrderQty: p.minOrderQty,
            quantity: amount,
            image: p.image,
          },
        ];
      });
      toast(`${p.name} added to bag`, "success");
    },
    [toast],
  );

  const updateQty = useCallback((key: string, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, quantity } : l)),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback(
    (slug: string) => {
      setWishlist((prev) => {
        const has = prev.includes(slug);
        toast(has ? "Removed from wishlist" : "Saved to wishlist", "info");
        return has ? prev.filter((s) => s !== slug) : [...prev, slug];
      });
    },
    [toast],
  );

  const inWishlist = useCallback((slug: string) => wishlist.includes(slug), [wishlist]);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const { subtotal, count } = useMemo(
    () => ({
      subtotal: cart.reduce((sum, l) => sum + (l.price ?? 0) * l.quantity, 0),
      count: cart.reduce((sum, l) => sum + l.quantity, 0),
    }),
    [cart],
  );

  const value: Ctx = {
    cart,
    wishlist,
    toasts,
    addToCart,
    updateQty,
    removeLine,
    clearCart,
    toggleWishlist,
    inWishlist,
    toast,
    dismissToast,
    subtotal,
    count,
    ready,
  };

  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

export function useSite(): Ctx {
  const ctx = useContext(SiteCtx);
  if (!ctx) throw new Error("useSite must be used inside <SiteProviders>");
  return ctx;
}
