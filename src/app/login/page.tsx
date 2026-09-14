"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import PasswordInput from "@/components/PasswordInput";

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
    <div className="container-page py-16 flex justify-center">
      <div className="card-surface p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">Welcome back to NEXORA</p>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          <div>
            <PasswordInput required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
            <Link href="/forgot-password" className="text-xs text-[var(--brand-accent)] hover:underline block mt-1.5 text-right">
              Forgot password?
            </Link>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button disabled={submitting} className="btn-primary py-2.5 font-medium disabled:opacity-50">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-sm mt-5 text-[var(--text-muted)]">
          New to NEXORA?{" "}
          <Link href="/register" className="text-[var(--brand-accent)] hover:underline font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
