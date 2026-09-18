export default function TermsPage() {
  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2">Terms &amp; Conditions</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long" })}</p>

      <div className="flex flex-col gap-6 text-sm">
        <Section title="1. Who we are">
          <p>
            EXORASTORE (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates this website. By creating an
            account, browsing, or placing an order on this site, you agree to these Terms &amp; Conditions.
          </p>
        </Section>

        <Section title="2. Accounts">
          <p>
            You&apos;re responsible for keeping your login credentials confidential and for all activity
            under your account. Provide accurate information when registering and keep it up to date. We
            reserve the right to suspend accounts used for fraud, abuse, or violation of these terms.
          </p>
        </Section>

        <Section title="3. Products &amp; pricing">
          <p>
            Product descriptions, images, and prices are shown on a best-effort basis and may occasionally
            contain errors, which we&apos;ll correct promptly. All prices are listed in Indian Rupees (₹)
            and are inclusive of applicable taxes unless stated otherwise. We reserve the right to change
            prices, discontinue products, or limit order quantities at any time.
          </p>
        </Section>

        <Section title="4. Orders &amp; payment">
          <p>
            Placing an order is an offer to purchase, which we may accept or decline (e.g. if an item is
            out of stock or pricing was in error). Payments are processed securely through Razorpay; we do
            not store your card, UPI, or bank details on our servers.
          </p>
        </Section>

        <Section title="5. Cancellations, returns &amp; refunds">
          <p>
            These are covered in detail in our{" "}
            <a href="/refund-policy" className="text-[var(--brand-accent)] hover:underline">Refund &amp; Cancellation Policy</a>.
          </p>
        </Section>

        <Section title="6. Coupons &amp; promotions">
          <p>
            Coupon codes and promotional offers are subject to the specific conditions shown at checkout
            (e.g. minimum order value, applicable products, usage limits) and may be withdrawn or modified
            at any time without prior notice.
          </p>
        </Section>

        <Section title="7. User conduct">
          <p>
            You agree not to misuse the site — including attempting unauthorized access, submitting false
            reviews, or using the platform for any unlawful purpose. Reviews and content you submit must be
            honest and not infringe on anyone else&apos;s rights; we may remove content that violates this.
          </p>
        </Section>

        <Section title="8. Limitation of liability">
          <p>
            We aim to provide a reliable service but do not guarantee uninterrupted or error-free access to
            the site. To the extent permitted by law, we are not liable for indirect or consequential losses
            arising from your use of the site.
          </p>
        </Section>

        <Section title="9. Changes to these terms">
          <p>
            We may update these terms from time to time; continued use of the site after a change means you
            accept the updated terms.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            Questions about these terms? Email{" "}
            <a href="mailto:exorastorebuz@gmail.com" className="text-[var(--brand-accent)] hover:underline">exorastorebuz@gmail.com</a>.
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
