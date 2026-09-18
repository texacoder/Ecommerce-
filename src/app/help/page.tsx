import Link from "next/link";

const FAQS = [
  {
    q: "How do I track my order?",
    a: "Go to Returns & Orders in the top menu, open the order, and you'll see its current status and tracking number if one has been added.",
  },
  {
    q: "How do I return a product?",
    a: "Most products can be returned within 7 days of delivery. Contact support with your order number to start a return.",
  },
  {
    q: "What payment methods are accepted?",
    a: "EXORASTORE uses Razorpay for secure checkout, supporting cards, UPI, netbanking and wallets.",
  },
  {
    q: "How do I apply a coupon code?",
    a: "Enter your coupon code on the checkout page before completing payment. The discount is verified and applied automatically.",
  },
];

export default function HelpPage() {
  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Help Center</h1>
      <div className="flex flex-col gap-4">
        {FAQS.map((item) => (
          <div key={item.q} className="card-surface p-4">
            <h2 className="font-semibold mb-1">{item.q}</h2>
            <p className="text-sm text-[var(--text-muted)]">{item.a}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-[var(--text-muted)] mt-6">
        Still need help? Visit our{" "}
        <Link href="/customer-service" className="text-[var(--brand-accent)] hover:underline">
          Customer Service
        </Link>{" "}
        page to chat with us on WhatsApp or send an email.
      </p>
    </div>
  );
}
