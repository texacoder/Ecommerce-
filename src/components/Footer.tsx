import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[var(--brand-navy)] text-white/80 mt-12">
      <div className="container-page py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4 text-sm">
        <div>
          <h3 className="text-white font-semibold mb-3">Get to Know Us</h3>
          <ul className="flex flex-col gap-2">
            <li><Link href="/about" className="hover:underline">About NEXORA</Link></li>
            <li><Link href="/products" className="hover:underline">Careers</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Let Us Help You</h3>
          <ul className="flex flex-col gap-2">
            <li><Link href="/account/orders" className="hover:underline">Your Orders</Link></li>
            <li><Link href="/account/addresses" className="hover:underline">Your Addresses</Link></li>
            <li><Link href="/help" className="hover:underline">Help Center</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">Shop</h3>
          <ul className="flex flex-col gap-2">
            <li><Link href="/products" className="hover:underline">All Products</Link></li>
            <li><Link href="/deals" className="hover:underline">Today&apos;s Deals</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-3">NEXORA</h3>
          <p className="text-white/60">Your everyday marketplace for electronics, fashion, home, beauty, accessories and sports.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} NEXORA. All rights reserved.
      </div>
    </footer>
  );
}
