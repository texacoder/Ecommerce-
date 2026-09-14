import { ProductGridSkeleton } from "@/components/ProductCardSkeleton";

export default function Loading() {
  return (
    <div className="container-page py-8 grid md:grid-cols-[240px_1fr] gap-6">
      <div className="skeleton h-96 hidden md:block" />
      <div>
        <div className="skeleton h-6 w-48 mb-4" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
