import Link from "next/link";
import type { Metadata } from "next";
import { whatsappLink, supportMailtoLink, SUPPORT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Customer Service",
  description: "Reach EXORASTORE customer support via WhatsApp or email for order, return, and refund questions.",
  alternates: { canonical: "/customer-service" },
};

export default async function CustomerServicePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  const whatsappMessage = order
    ? `Hi, I have a question about my order #${order}.`
    : "Hi, I have a question about my order.";
  const emailSubject = order ? `Question about order #${order}` : "Question about my order";

  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Customer Service</h1>
      <p className="text-[var(--text-muted)] mb-8">
        Need help with an order, a return, a payment issue, or anything else? We&apos;re here to help.
      </p>

      {order && (
        <p className="text-sm bg-[var(--surface-muted)] border border-[var(--border-subtle)] rounded-md px-3 py-2 mb-6">
          Regarding order <span className="font-medium">#{order}</span>
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <a
          href={whatsappLink(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="card-surface p-5 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow"
        >
          <span className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-6 h-6" fill="white" aria-hidden="true">
              <path d="M16.001 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.4.66 4.65 1.8 6.58L3.2 28.8l6.42-1.75a12.74 12.74 0 0 0 6.38 1.71h.01c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.76-12.8-12.76zm0 23.2h-.01a10.36 10.36 0 0 1-5.28-1.45l-.38-.22-3.93 1.07 1.05-3.83-.25-.4a10.4 10.4 0 0 1-1.6-5.57c0-5.75 4.68-10.43 10.42-10.43 2.79 0 5.4 1.09 7.37 3.06a10.34 10.34 0 0 1 3.05 7.38c0 5.75-4.68 10.39-10.44 10.39zm5.71-7.79c-.31-.16-1.85-.91-2.14-1.02-.29-.1-.5-.16-.71.16-.21.31-.81 1.02-1 1.23-.18.21-.37.23-.68.08-1.85-.93-3.06-1.66-4.28-3.76-.32-.56.32-.52.92-1.73.1-.21.05-.39-.05-.55-.1-.16-.71-1.71-.97-2.34-.26-.63-.52-.55-.71-.56-.18-.01-.39-.01-.6-.01-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.19 3.34 5.31 4.55 2.63 1.02 3.17.82 3.74.76.57-.05 1.85-.76 2.11-1.5.26-.73.26-1.36.18-1.5-.08-.14-.29-.21-.6-.37z" />
            </svg>
          </span>
          <span className="font-medium">Chat on WhatsApp</span>
          <span className="text-xs text-[var(--text-muted)]">Usually the fastest way to reach us</span>
        </a>

        <a
          href={supportMailtoLink(emailSubject)}
          className="card-surface p-5 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow"
        >
          <span className="w-10 h-10 rounded-full bg-[var(--brand-accent)] flex items-center justify-center text-white text-lg">
            ✉
          </span>
          <span className="font-medium">Email us</span>
          <span className="text-xs text-[var(--text-muted)]">{SUPPORT_EMAIL}</span>
        </a>
      </div>

      <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
        <p>
          Looking for a quick answer instead? Check the{" "}
          <Link href="/help" className="text-[var(--brand-accent)] hover:underline">
            Help Center
          </Link>
          .
        </p>
        <p>
          Want to check an order&apos;s status or manage a return? Go to{" "}
          <Link href="/account/orders" className="text-[var(--brand-accent)] hover:underline">
            My Orders
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
