"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      await refresh();
      router.push(searchParams.get("next") ?? "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold mb-6">Log in</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
        <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={submitting} className="rounded-md bg-black text-white dark:bg-white dark:text-black py-2.5 font-medium disabled:opacity-50">
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="text-sm mt-4 text-black/60 dark:text-white/60">
        No account?{" "}
        <Link href="/register" className="underline">
          Register
        </Link>
      </p>
    </div>
  );
}
