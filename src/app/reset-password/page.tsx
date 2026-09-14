"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to reset password");
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-[var(--danger)]">Missing or invalid reset link.</p>
        <Link href="/forgot-password" className="text-[var(--brand-accent)] hover:underline text-sm mt-2 inline-block">
          Request a new one
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-[var(--success)] font-medium">Password updated! Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <div className="container-page py-16 flex justify-center">
      <div className="card-surface p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6">Choose a new password</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input required type="password" minLength={8} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
          <input required type="password" minLength={8} placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button disabled={submitting} className="btn-primary py-2.5 font-medium disabled:opacity-50">
            {submitting ? "Saving..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
