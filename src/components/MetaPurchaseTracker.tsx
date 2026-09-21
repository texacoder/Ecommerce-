"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

/** Fires Meta's Purchase event exactly once per order, from the order
 * confirmation page. Rendered from a Server Component, and guarded with
 * sessionStorage so refreshing (or coming back to) this page never
 * double-reports the same purchase to Meta. */
export default function MetaPurchaseTracker({
  orderId,
  total,
  contentIds,
}: {
  orderId: string;
  total: number;
  contentIds: string[];
}) {
  useEffect(() => {
    const key = `meta-purchase-tracked:${orderId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // If storage is unavailable, fall through and fire anyway - a rare
      // double-count is better than never reporting the sale at all.
    }
    trackMetaEvent("Purchase", {
      content_ids: contentIds,
      content_type: "product",
      value: total / 100,
      currency: "INR",
    });
  }, [orderId, total, contentIds]);

  return null;
}
