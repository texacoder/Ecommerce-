"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setDevLink(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message);
      if (data.devResetLink) setDevLink(data.devResetLink);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-16 flex justify-center">
      <div className="card-surface p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-1">Reset your password</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">Enter your account email and we&apos;ll send you a reset link.</p>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          <button disabled={submitting} className="btn-primary py-2.5 font-medium disabled:opacity-50">
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>
        {message && <p className="text-sm text-[var(--text-muted)] mt-4">{message}</p>}
        {devLink && (
          <div className="mt-3 text-xs bg-[var(--surface-muted)] rounded p-3 break-all">
            <p className="font-medium mb-1">Dev mode: no email provider configured</p>
            <Link href={devLink.replace(process.env.NEXT_PUBLIC_APP_URL ?? "", "")} className="text-[var(--brand-accent)] hover:underline">
              {devLink}
            </Link>
          </div>
        )}
        <p className="text-sm mt-5 text-[var(--text-muted)]">
          <Link href="/login" className="text-[var(--brand-accent)] hover:underline font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
