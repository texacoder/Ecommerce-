export default function StarRating({ rating, count, size = "sm" }: { rating: number | null; count?: number; size?: "sm" | "md" }) {
  if (rating === null) {
    return <span className="text-xs text-[var(--text-faint)]">No ratings yet</span>;
  }
  const rounded = Math.round(rating * 2) / 2;
  const textSize = size === "md" ? "text-base" : "text-xs";
  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      <span className="flex text-[var(--brand-buy)]" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => {
          const filled = rounded >= i + 1;
          const half = !filled && rounded >= i + 0.5;
          return (
            <span key={i} className="relative inline-block">
              <span className="text-[var(--border-subtle)]">★</span>
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? "50%" : "100%" }}
                >
                  ★
                </span>
              )}
            </span>
          );
        })}
      </span>
      <span className="text-[var(--text-muted)]">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-[var(--text-faint)]">({count})</span>}
    </span>
  );
}
