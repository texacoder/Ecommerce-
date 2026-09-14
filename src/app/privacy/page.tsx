export default function PrivacyPage() {
  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Privacy Policy</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</p>

      <div className="flex flex-col gap-6 text-sm">
        <Section title="1. What we collect">
          <p>When you use NEXORA, we collect:</p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li>Account details: name, email address, password (stored as a secure hash, never in plain text)</li>
            <li>Order details: items purchased, delivery address, phone number, order history</li>
            <li>Reviews and any other content you choose to submit</li>
          </ul>
          <p className="mt-2">
            We do <strong>not</strong> collect or store your card, UPI, or bank account details — payments
            are handled directly by Razorpay, our payment processor.
          </p>
        </Section>

        <Section title="2. How we use it">
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>To process and deliver your orders</li>
            <li>To send order updates, password reset links, and respond to support requests</li>
            <li>To show you your own order history, addresses, and reviews</li>
            <li>To detect and prevent fraud or abuse of the platform</li>
          </ul>
          <p className="mt-2">We do not sell your personal data to third parties.</p>
        </Section>

        <Section title="3. Who we share it with">
          <p>We share the minimum necessary data with:</p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li><strong>Razorpay</strong> — to process your payment</li>
            <li><strong>Delivery partners</strong> — your name, address, and phone number, to deliver your order</li>
          </ul>
        </Section>

        <Section title="4. Cookies">
          <p>
            We use essential cookies to keep you signed in and to remember your session. We don&apos;t use
            third-party advertising or tracking cookies.
          </p>
        </Section>

        <Section title="5. Your rights">
          <p>
            You can view and update your name and email at any time from{" "}
            <a href="/account" className="text-[var(--brand-accent)] hover:underline">My Account</a>. To
            request a copy of your data, or to have your account and personal data deleted, email us at{" "}
            <a href="mailto:support@nexora.com" className="text-[var(--brand-accent)] hover:underline">support@nexora.com</a>{" "}
            — we&apos;ll keep only what we&apos;re legally required to retain (e.g. order records for tax
            purposes).
          </p>
        </Section>

        <Section title="6. Data security">
          <p>
            Passwords are hashed and never stored in readable form. Access to admin functions is restricted
            and re-verified on every request. That said, no online system is 100% secure, and you should
            also keep your own password confidential.
          </p>
        </Section>

        <Section title="7. Changes to this policy">
          <p>We may update this policy occasionally; the &quot;Last updated&quot; date above will reflect any changes.</p>
        </Section>

        <Section title="8. Contact">
          <p>
            Questions about this policy or your data? Email{" "}
            <a href="mailto:support@nexora.com" className="text-[var(--brand-accent)] hover:underline">support@nexora.com</a>.
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
