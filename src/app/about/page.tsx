import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "EXORASTORE is an online marketplace for electronics, fashion, home essentials, beauty, accessories and sports gear. Learn what we're about.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">About EXORASTORE</h1>
      <p className="text-[var(--text-muted)] leading-relaxed mb-4">
        EXORASTORE is an online marketplace built to make everyday shopping simple: electronics, fashion, home
        essentials, beauty, accessories and sports gear, all in one place.
      </p>
      <p className="text-[var(--text-muted)] leading-relaxed">
        We work directly with sellers and brands to bring you competitive prices, transparent product
        information, and reliable delivery tracking from checkout to your doorstep.
      </p>
    </div>
  );
}
