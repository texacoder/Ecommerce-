"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

/** Fires Meta's ViewContent event for a product detail page. Rendered from
 * a Server Component (the product page itself), since fbq only exists in
 * the browser. */
export default function MetaProductViewTracker({
  id,
  name,
  price,
}: {
  id: string;
  name: string;
  price: number;
}) {
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_ids: [id],
      content_type: "product",
      content_name: name,
      value: price / 100,
      currency: "INR",
    });
    // Only re-fire if the viewed product itself changes (e.g. navigating
    // between two product pages without a full reload).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return null;
}
