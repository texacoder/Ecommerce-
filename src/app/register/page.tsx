"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import PasswordInput from "@/components/PasswordInput";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { refresh } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      await refresh();
      router.push("/");
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
        <h1 className="text-xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">Join NEXORA to start shopping</p>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          <PasswordInput required minLength={8} placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button disabled={submitting} className="btn-primary py-2.5 font-medium disabled:opacity-50">
            {submitting ? "Creating account..." : "Create account"}
          </button>
          <p className="text-xs text-[var(--text-faint)] text-center">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-[var(--brand-accent)] hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-[var(--brand-accent)] hover:underline">Privacy Policy</Link>.
          </p>
        </form>
        <p className="text-sm mt-5 text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--brand-accent)] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
