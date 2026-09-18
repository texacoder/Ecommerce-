// Only allow redirecting to a same-origin, absolute path after login/etc.
// Without this, a crafted link like /login?next=https://evil.com (or the
// protocol-relative //evil.com) would send someone straight to a phishing
// page immediately after they type their real password into the real site.
export function safeRedirectPath(next: string | null): string {
  if (!next) return "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  return next;
}
