export default function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10 mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-black/60 dark:text-white/60">
        © {new Date().getFullYear()} Storefront. All rights reserved.
      </div>
    </footer>
  );
}
