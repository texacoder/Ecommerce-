"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page py-24 text-center flex flex-col items-center gap-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-[var(--text-muted)] text-sm max-w-sm">
        An unexpected error occurred. You can try again, or head back to the homepage.
      </p>
      <div className="flex gap-3 mt-2">
        <button onClick={reset} className="btn-primary px-6 py-2.5 text-sm">
          Try again
        </button>
        <Link href="/" className="btn-outline px-6 py-2.5 text-sm">
          Go home
        </Link>
      </div>
    </div>
  );
}
