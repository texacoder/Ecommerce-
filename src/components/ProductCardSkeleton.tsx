export default function ProductCardSkeleton() {
  return (
    <div className="card-surface overflow-hidden flex flex-col">
      <div className="skeleton aspect-square" />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-4 w-2/3 mt-1" />
        <div className="skeleton h-8 w-full mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
