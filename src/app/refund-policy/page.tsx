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
            <a href="mailto:support@nexora.com" className="text-[var(--brand-accent)] hover:underline">support@nexora.com</a>{" "}
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
            <a href="mailto:support@nexora.com" className="text-[var(--brand-accent)] hover:underline">support@nexora.com</a>{" "}
            with your order number. We aim to respond within 24-48 hours.
          </p>
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
