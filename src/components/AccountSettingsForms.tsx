"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AccountSettingsForms({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex flex-col gap-6">
      <ProfileForm initialName={name} initialEmail={email} />
      <PasswordForm />
    </div>
  );
}

function ProfileForm({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState<{ text: string; kind: "error" | "success" } | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update profile");
      await refresh();
      router.refresh();
      setMessage({ text: "Profile updated.", kind: "success" });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Something went wrong", kind: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-surface p-5 flex flex-col gap-3">
      <h2 className="font-semibold">Profile</h2>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Name
        <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
      </label>
      {message && (
        <p className={`text-sm ${message.kind === "error" ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>{message.text}</p>
      )}
      <button disabled={saving} className="btn-primary py-2 text-sm font-medium disabled:opacity-50 w-fit px-5">
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; kind: "error" | "success" } | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords don't match", kind: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to change password");
      setMessage({ text: "Password changed.", kind: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Something went wrong", kind: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-surface p-5 flex flex-col gap-3">
      <h2 className="font-semibold">Change password</h2>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Current password
        <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        New password
        <input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Confirm new password
        <input required type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" />
      </label>
      {message && (
        <p className={`text-sm ${message.kind === "error" ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>{message.text}</p>
      )}
      <button disabled={saving} className="btn-primary py-2 text-sm font-medium disabled:opacity-50 w-fit px-5">
        {saving ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
