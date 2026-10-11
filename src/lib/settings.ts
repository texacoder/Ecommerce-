import { prisma } from "@/lib/db";

const MAINTENANCE_KEY = "maintenanceMode";
const CACHE_TTL_MS = 5000;

// Proxy checks this on every single page view, so a bare point lookup on
// every request would add a database round trip to every page load for no
// real benefit - this flag changes rarely and doesn't need to be exact to
// the millisecond. A few-second cache means the toggle still takes effect
// almost immediately everywhere, without hitting the database constantly.
// Scoped per warm serverless instance - each one re-checks independently,
// which is fine for a flag that isn't security-critical.
let cached: { value: boolean; expiresAt: number } | null = null;

export async function getMaintenanceMode(): Promise<boolean> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const row = await prisma.setting.findUnique({ where: { key: MAINTENANCE_KEY } });
  const value = row?.value === "true";
  cached = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key: MAINTENANCE_KEY },
    update: { value: String(enabled) },
    create: { key: MAINTENANCE_KEY, value: String(enabled) },
  });
  cached = { value: enabled, expiresAt: Date.now() + CACHE_TTL_MS };
}

const ANNOUNCEMENT_ENABLED_KEY = "announcementEnabled";
const ANNOUNCEMENT_MESSAGE_KEY = "announcementMessage";

// The root layout reads this on every request anyway (it's already a
// force-dynamic page fetching the category list fresh each time), so
// there's no need for the same kind of cache maintenance mode uses here -
// this one's always current.
export async function getAnnouncement(): Promise<{ enabled: boolean; message: string }> {
  const [enabledRow, messageRow] = await Promise.all([
    prisma.setting.findUnique({ where: { key: ANNOUNCEMENT_ENABLED_KEY } }),
    prisma.setting.findUnique({ where: { key: ANNOUNCEMENT_MESSAGE_KEY } }),
  ]);
  return { enabled: enabledRow?.value === "true", message: messageRow?.value ?? "" };
}

export async function setAnnouncement(enabled: boolean, message: string): Promise<void> {
  await Promise.all([
    prisma.setting.upsert({
      where: { key: ANNOUNCEMENT_ENABLED_KEY },
      update: { value: String(enabled) },
      create: { key: ANNOUNCEMENT_ENABLED_KEY, value: String(enabled) },
    }),
    prisma.setting.upsert({
      where: { key: ANNOUNCEMENT_MESSAGE_KEY },
      update: { value: message },
      create: { key: ANNOUNCEMENT_MESSAGE_KEY, value: message },
    }),
  ]);
}
