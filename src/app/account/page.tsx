import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AccountSettingsForms from "@/components/AccountSettingsForms";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold mb-6">My account</h1>
      <div className="grid gap-3 mb-6">
        <Link href="/account/orders" className="border border-[var(--border-subtle)] rounded-lg p-4 hover:bg-[var(--surface-muted)]">
          Order history
        </Link>
        <Link href="/account/addresses" className="border border-[var(--border-subtle)] rounded-lg p-4 hover:bg-[var(--surface-muted)]">
          Saved addresses
        </Link>
      </div>
      <AccountSettingsForms name={user.name} email={user.email} />
    </div>
  );
}
