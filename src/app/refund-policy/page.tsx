import type { Metadata } from "next";
import { whatsappLink } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "EXORASTORE's refund, return, and order cancellation policy — including timelines, eligibility, and how to request one.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Refund &amp; Cancellation Policy</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</p>

      <div className="flex flex-col gap-6 text-sm">
        <Section title="Order cancellation">
          <p>
            You can cancel an order yourself, free of charge, at any time before it has been paid for. Once
            an order has been paid and confirmed, please contact us at{" "}
            <a href="mailto:exorastorebuz@gmail.com" className="text-[var(--brand-accent)] hover:underline">exorastorebuz@gmail.com</a>{" "}
            with your order number as soon as possible — we can usually still cancel it if it hasn&apos;t
            shipped yet.
          </p>
        </Section>

        <Section title="Returns">
          <p>
            Most items can be returned within <strong>7 days of delivery</strong>, provided they are unused,
            in their original packaging, and in resellable condition. To start a return, contact us with your
            order number and the reason for the return.
          </p>
          <p className="mt-2">The following items cannot be returned unless defective on arrival:</p>
          <ul className="list-disc pl-5 mt-1 flex flex-col gap-1">
            <li>Personal care and hygiene products (e.g. skincare, haircare) once opened</li>
            <li>Innerwear and swimwear</li>
            <li>Items marked as non-returnable on the product page</li>
          </ul>
        </Section>

        <Section title="Refunds">
          <p>
            Refunds are issued once we&apos;ve received and inspected the returned item, or immediately for a
            pre-shipment cancellation. Approved refunds are credited back to your original payment method via
            Razorpay, typically within <strong>5-7 business days</strong>, though your bank may take a little
            longer to reflect it.
          </p>
          <p className="mt-2">
            Shipping charges (if any were paid) are non-refundable unless the return is due to our error
            (wrong or defective item).
          </p>
        </Section>

        <Section title="Damaged or wrong items">
          <p>
            If you receive a damaged, defective, or incorrect item, contact us within 48 hours of delivery
            with photos of the item — we&apos;ll arrange a free replacement or a full refund, including any
            shipping charges, at no cost to you.
          </p>
        </Section>

        <Section title="How to reach us">
          <p>
            For any cancellation, return, or refund request, email{" "}
            <a href="mailto:exorastorebuz@gmail.com" className="text-[var(--brand-accent)] hover:underline">exorastorebuz@gmail.com</a>{" "}
            with your order number. We aim to respond within 24-48 hours.
          </p>
          <a
            href={whatsappLink("Hi, I have a question about a cancellation, return, or refund.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-[var(--brand-accent)] hover:underline"
          >
            <span className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 32 32" className="w-4 h-4" fill="white" aria-hidden="true">
                <path d="M16.001 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.4.66 4.65 1.8 6.58L3.2 28.8l6.42-1.75a12.74 12.74 0 0 0 6.38 1.71h.01c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.76-12.8-12.76zm0 23.2h-.01a10.36 10.36 0 0 1-5.28-1.45l-.38-.22-3.93 1.07 1.05-3.83-.25-.4a10.4 10.4 0 0 1-1.6-5.57c0-5.75 4.68-10.43 10.42-10.43 2.79 0 5.4 1.09 7.37 3.06a10.34 10.34 0 0 1 3.05 7.38c0 5.75-4.68 10.39-10.44 10.39zm5.71-7.79c-.31-.16-1.85-.91-2.14-1.02-.29-.1-.5-.16-.71.16-.21.31-.81 1.02-1 1.23-.18.21-.37.23-.68.08-1.85-.93-3.06-1.66-4.28-3.76-.32-.56.32-.52.92-1.73.1-.21.05-.39-.05-.55-.1-.16-.71-1.71-.97-2.34-.26-.63-.52-.55-.71-.56-.18-.01-.39-.01-.6-.01-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.19 3.34 5.31 4.55 2.63 1.02 3.17.82 3.74.76.57-.05 1.85-.76 2.11-1.5.26-.73.26-1.36.18-1.5-.08-.14-.29-.21-.6-.37z" />
              </svg>
            </span>
            <span className="font-medium">Chat on WhatsApp</span>
          </a>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-surface p-5">
      <h2 className="font-semibold mb-2">{title}</h2>
      {children}
    </section>
  );
}
