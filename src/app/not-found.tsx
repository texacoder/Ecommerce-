import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center flex flex-col items-center gap-4">
      <h1 className="text-5xl font-bold text-[var(--brand-navy)]">404</h1>
      <p className="text-lg font-medium">This page took a wrong turn.</p>
      <p className="text-[var(--text-muted)] text-sm max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link href="/" className="btn-primary px-6 py-2.5 text-sm mt-2">
        Back to Home
      </Link>
    </div>
  );
}
