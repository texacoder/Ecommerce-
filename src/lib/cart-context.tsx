"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

export type CartItem = {
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clear: () => void;
  totalCount: number;
  subtotalEstimate: number;
  // "Buy Now" is a one-off purchase of a single item, kept entirely separate
  // from the saved cart above (never written to localStorage). Abandoning
  // a Buy Now checkout must leave the customer's real cart untouched.
  buyNowItem: CartItem | null;
  setBuyNowItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  clearBuyNowItem: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cart";

function keyOf(productId: string, variantId: string | null) {
  return `${productId}::${variantId ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [buyNowItem, setBuyNowItemState] = useState<CartItem | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt/unavailable storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, loaded]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity: number) => {
    setItems((prev) => {
      const k = keyOf(item.productId, item.variantId);
      const existing = prev.find((i) => keyOf(i.productId, i.variantId) === k);
      if (existing) {
        return prev.map((i) =>
          keyOf(i.productId, i.variantId) === k ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
    trackMetaEvent("AddToCart", {
      content_ids: [item.variantId ?? item.productId],
      content_type: "product",
      contents: [{ id: item.variantId ?? item.productId, quantity }],
      value: (item.unitPrice * quantity) / 100,
      currency: "INR",
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId: string | null) => {
    setItems((prev) => prev.filter((i) => keyOf(i.productId, i.variantId) !== keyOf(productId, variantId)));
  }, []);

  const setQuantity = useCallback((productId: string, variantId: string | null, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          keyOf(i.productId, i.variantId) === keyOf(productId, variantId) ? { ...i, quantity } : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const setBuyNowItem = useCallback((item: Omit<CartItem, "quantity">, quantity: number) => {
    setBuyNowItemState({ ...item, quantity });
  }, []);
  const clearBuyNowItem = useCallback(() => setBuyNowItemState(null), []);

  const totalCount = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotalEstimate = useMemo(() => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [items]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      setQuantity,
      clear,
      totalCount,
      subtotalEstimate,
      buyNowItem,
      setBuyNowItem,
      clearBuyNowItem,
    }),
    [items, addItem, removeItem, setQuantity, clear, totalCount, subtotalEstimate, buyNowItem, setBuyNowItem, clearBuyNowItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
