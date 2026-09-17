# EXORASTORE

A full-stack e-commerce marketplace — product catalog, cart, checkout with
real Razorpay payment integration, order tracking, and a complete admin
dashboard for managing products, categories, inventory, orders, customers,
reviews, coupons and promotions.

Built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL and
Prisma. Nothing here is a UI mockup: every button is wired to a real API
route backed by the database, prices/stock/coupons are always recomputed
server-side, and admin routes re-check the caller's role against the
database on every request.

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 with a small custom design system (`src/app/globals.css`)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Custom JWT session cookies (`jose`) + `bcryptjs` password hashing — no third-party auth SaaS required
- **Payments:** Razorpay (Orders API, checkout widget, signature verification, webhook)
- **Image storage:** Cloudinary in production, local disk (`/public/uploads`) in development, behind one abstraction (`src/lib/storage.ts`)
- **Charts:** Recharts (admin dashboard only)

## 1. Install

```bash
npm install
```

## 2. Configure environment variables

Copy the example file and fill in what you have:

```bash
cp .env.example .env
```

See `.env.example` for the full list with explanations. At minimum you need:

- `DATABASE_URL` — a PostgreSQL connection string
- `JWT_SECRET` — any long random string (`openssl rand -base64 32`)

Everything else (Razorpay, Cloudinary) is optional for local development —
the app runs correctly without them, it just tells you plainly that
checkout/image-upload-to-cloud isn't configured instead of faking it.

## 3. Create the database

**Local Postgres:**

```bash
createdb nexora
# or, from the psql shell:
# CREATE DATABASE nexora;
```

**Hosted (recommended for deployment):** create a free Postgres database on
[Neon](https://neon.tech) or [Supabase](https://supabase.com) and paste the
connection string they give you into `DATABASE_URL`.

## 4. Run migrations

```bash
npx prisma migrate deploy   # or `npx prisma migrate dev` while developing
```

## 5. Seed sample products

```bash
npm run db:seed
```

This creates:

- An admin account: `texacoderzz@gmail.com` / `Admin123!`
- Two customer accounts: `customer@example.com` / `Customer123!` and `rahul@example.com` / `Customer123!`
- 6 categories (Electronics, Fashion, Home & Kitchen, Beauty, Accessories, Sports) with subcategories
- 18 realistic products with images, variants, stock levels and reviews
- 3 coupons and 3 homepage promotions

Delete or edit any of this once you start adding your own catalog — nothing
in the frontend hardcodes product data, it's all read from the database.

## 6. Create your own admin account

Register a normal account on the site (`/register`), then promote it:

```bash
npm run make-admin -- you@example.com
```

Log out and back in, and you'll see **Admin Dashboard** in the header.

## 7. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`. The admin dashboard is at `/admin`.

## 8. Deploy

- **App:** [Vercel](https://vercel.com) — connect the repo, set the environment variables from `.env.example` in the project settings, and deploy. `npm run build` runs `prisma generate` automatically via the `postinstall`-free Prisma client generation on build.
- **Database:** [Neon](https://neon.tech) or [Supabase](https://supabase.com) Postgres.
- **Image storage:** [Cloudinary](https://cloudinary.com) — required for production, since Vercel's filesystem isn't writable/persistent between requests (the local-disk fallback only works for local dev).
- **Payments:** Razorpay — see below.

After deploying, run against the production database once:

```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
DATABASE_URL="<production-url>" npm run db:seed   # optional
```

### Before actually going live (real customers, real money)

The app is functional before all of these, but don't accept real payments or
real customer signups until you've gone through this list:

- [ ] Replace the placeholder legal name "EXORASTORE" and the placeholder support
      email `support@exorastore.com` in `src/app/terms/page.tsx`,
      `src/app/privacy/page.tsx`, and `src/app/refund-policy/page.tsx` with
      your real registered business name and a support email/phone you
      actually monitor.
- [ ] Buy and verify your own domain in Resend (see section 9 below), then
      update `EMAIL_FROM` — until then, password-reset emails only deliver
      to the email address you signed up to Resend with.
- [ ] Switch Razorpay from test keys to live keys (see section 10 below) once
      you're ready to accept real payments.
- [ ] Change the seed admin password (`Admin123!`) if you haven't already —
      it's a publicly documented default.
- [ ] Consider deleting the `SETUP_SECRET` environment variable once initial
      setup/admin recovery is done — while it's set, it can reset the seed
      admin account's password (see the `/api/setup/seed` route).
- [ ] Delete or reseed any placeholder demo products/categories you don't
      want live.

## 9. Connect email (Resend) for password resets

1. Create a free account at [resend.com](https://resend.com).
2. Go to API Keys → create one → copy it into `RESEND_API_KEY`.
3. Leave `EMAIL_FROM` as the default `onboarding@resend.dev` sender to start — it works immediately with no domain setup. Once you verify your own domain in the Resend dashboard, switch `EMAIL_FROM` to an address on it (e.g. `EXORASTORE <noreply@yourdomain.com>`) for better deliverability and to avoid landing in spam.

Without `RESEND_API_KEY` set, "Forgot password" still generates a real,
single-use reset token, but only logs the link server-side instead of
emailing it — fine for local development (the link is also returned
directly in the API response outside of production), but customers on a
real deployment have no way to see that link without this configured.

## 10. Connect Razorpay (real payments)

1. Create a free account at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Grab your **test mode** key pair from Settings → API Keys.
3. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same value as `RAZORPAY_KEY_ID`).
4. In Settings → Webhooks, add `https://<your-domain>/api/payments/webhook`, subscribe to `payment.captured` and `payment.failed`, and copy the generated signing secret into `RAZORPAY_WEBHOOK_SECRET`.
5. Switch to live keys when you're ready to accept real payments.

Without these variables set, checkout still works end-to-end except the
final payment step — the order is created with a "Payment pending" status
and the UI tells the customer plainly that the payment gateway isn't
configured, rather than faking a successful charge.

## 11. Configure image storage (Cloudinary)

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the console dashboard, copy your **Cloud name**, **API key**, and **API secret**.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Without these, uploads from the admin dashboard are written to
`/public/uploads` on disk — fine for local development, but you should
configure Cloudinary before deploying to Vercel or another serverless host.

To swap in S3 or Supabase Storage instead, add another adapter class in
`src/lib/storage.ts` implementing the same `StorageAdapter` interface and
select it in `getAdapter()` — no other code needs to change.

## How the core flows actually work

- **Checkout → payment:** `POST /api/orders` recomputes prices/stock/coupon
  server-side inside a database transaction, reserves stock, and creates a
  real Razorpay order. The client opens Razorpay's checkout widget with that
  order id. On success, `POST /api/orders/[id]/verify-payment` re-derives the
  HMAC signature server-side before marking anything paid.
  `POST /api/payments/webhook` is the authoritative, idempotent
  confirmation path recommended by Razorpay for when the client-side
  callback never fires (closed tab, dropped connection).
- **Stock:** decremented at order creation (reserved), restored on
  cancellation or a failed/abandoned payment (`src/lib/orders.ts` →
  `restockOrderItems`). Customers can never buy more than what's in stock —
  it's re-checked inside the same transaction that creates the order.
- **Historical orders never change:** `OrderItem` stores a snapshot of the
  product name, SKU, and price at the time of purchase, so editing or even
  deleting a product later never rewrites a past order's numbers.
- **Admin authorization:** `middleware.ts` blocks `/admin/*` and
  `/api/admin/*` for non-admins at the edge, and every admin API route
  additionally calls `requireAdmin()` (in `src/lib/auth.ts`), which re-reads
  the user's role from the database rather than trusting the session token
  alone — so a demoted admin loses access immediately, not just after their
  token expires.

## Project structure

```
prisma/schema.prisma       Database schema (Postgres)
prisma/seed.ts             Sample catalog + accounts
scripts/make-admin.ts      Promote a registered user to ADMIN
src/lib/                   Auth, pricing/quote engine, Razorpay, storage, db client
src/app/api/               REST API routes (public + /api/admin/* + /api/auth/*)
src/app/(storefront pages) Home, /products, /search, /category/[slug], /cart, /checkout, /account/*
src/app/admin/             Admin dashboard pages (products, categories, inventory, orders, customers, reviews, coupons, promotions, analytics)
src/components/            Shared UI components
```
