"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

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
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold mb-6">Create an account</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
        <input required type="password" minLength={8} placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={submitting} className="rounded-md bg-black text-white dark:bg-white dark:text-black py-2.5 font-medium disabled:opacity-50">
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="text-sm mt-4 text-black/60 dark:text-white/60">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
