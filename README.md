# Suburaaj Salon & Studio

A React + TypeScript salon website with shared opening hours, a server-protected admin page, and a total page-view counter. The free Cloudflare Pages, Workers, and D1 tiers provide the hosting, API, and database.

## Local development

```sh
npm install
npm run dev
```

`npm run dev` starts the Vite-only preview; Cloudflare Pages Functions and APIs (including appointments) do not run in it. To test the complete site locally, install the documented Node.js version, create an ignored `.dev.vars` file with local secrets, apply the D1 migrations locally, then run:

```sh
npx wrangler d1 migrations apply suburaaj-salon --local
npm run dev:pages
```

Set at least `ADMIN_SESSION_SECRET` and `BOOKING_ENCRYPTION_KEY` in `.dev.vars` for appointment bookings. Generate each independently; use a strong random secret for the session secret and the documented 32-byte base64 key for booking encryption. The Pages local runtime reads `.dev.vars` and the D1/AI bindings from `wrangler.toml`. `npm run dev:pages` builds the site once and starts the Cloudflare Pages local runtime; rerun it after frontend changes. The server-backed admin, counter, and appointment APIs are not available from the Vite-only preview.

## Deploy to Cloudflare

Use Node.js 22.12+ (required by current Wrangler and Vite), then:

1. Sign in with `npx wrangler login`.
2. Create the Pages project with `npx wrangler pages project create suburaaj-salon --production-branch main`.
3. Create the database with `npx wrangler d1 create suburaaj-salon` and replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.toml` with the returned ID.
4. Apply the schema with `npx wrangler d1 migrations apply suburaaj-salon --remote`.
5. In the Cloudflare dashboard, open **Workers & Pages → suburaaj-salon → Settings → Variables and Secrets**. Add `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` as encrypted secrets for production. Choose your own strong admin credentials and a random session secret of at least 32 bytes; never put these values in source files.
6. The Wrangler config declares a **Workers AI** binding with the variable name `AI`. Cloudflare Workers AI is the primary chat provider. To enable the DeepSeek V4 Pro fallback when Workers AI fails or returns an invalid response, add `DEEPSEEK_API_KEY` as an encrypted production secret in **Workers & Pages → suburaaj-salon → Settings → Variables and Secrets**, or run `npx wrangler pages secret put DEEPSEEK_API_KEY --project-name suburaaj-salon`. Obtain the key from the DeepSeek platform; never put it in source files or expose it to the browser. If the dashboard has an existing project configuration that overrides the Wrangler config, add the Workers AI binding in **Workers & Pages → suburaaj-salon → Settings → Bindings** for production. Workers AI on the Workers Free plan includes 10,000 Neurons per day; this chatbot caps itself at 50 generated replies per UTC day and five per IP in ten minutes. DeepSeek API requests may incur separate charges under your DeepSeek account, so check its current pricing and usage limits.
7. To enable secure appointment booking, configure `BOOKING_ENCRYPTION_KEY` as an encrypted secret. Generate a 32-byte key encoded as base64 with `node --input-type=commonjs -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Keep it private, back it up securely, and do not rotate it without first migrating existing appointment records; records encrypted with an old key cannot be decrypted. Customer names, phone numbers, and email addresses are encrypted before storage in the existing D1 `appointments` table. Only a signed-in admin can view stored bookings. This key is required for slot listing, booking, and viewing customer details.
8. To send appointment confirmation emails to the customer and salon, create a Brevo account, add and verify `rajamanju720@gmail.com` as a sender (Brevo may send a verification code to this inbox), and create a transactional email API key. In Cloudflare Pages **Settings → Variables and Secrets**, add `BREVO_API_KEY` as an encrypted secret, set `APPOINTMENT_EMAIL_FROM` to `rajamanju720@gmail.com`, and set `SALON_NOTIFICATION_EMAIL` to the salon's recipient address. You can also set values with `npx wrangler pages secret put BREVO_API_KEY --project-name suburaaj-salon`, `npx wrangler pages secret put APPOINTMENT_EMAIL_FROM --project-name suburaaj-salon`, and `npx wrangler pages secret put SALON_NOTIFICATION_EMAIL --project-name suburaaj-salon`. If Brevo requires domain authentication instead of sender-email verification for this address, Gmail's DNS cannot be changed for this purpose; use an authenticated sender address on a domain you control. Cloudflare calls Brevo directly over HTTPS; customer and salon notifications are tracked separately in D1, and pending emails can be retried from the signed-in admin appointments list. No Supabase project or duplicate appointments table is needed. Brevo's free-plan quotas and sender requirements can change; check current terms before relying on free delivery.
9. Deploy with `npm run deploy`.

The public price list and SURA show these services: Haircut & shaving ₹140 (offer price; regular price ₹160), Hair dye / hair color ₹100, Shaving ₹80 (offer price; regular price ₹100), and Baby haircut ₹100. Facial and oil massage are not currently offered. The admin page is available at `/admin`; signed-in admins can edit weekly opening and closing hours, mark closed days, add or remove future holiday dates, and explicitly save or reset the schedule. Opening times must be earlier than closing times, holiday dates are validated, and resetting requires confirmation. Schedule changes are shared through D1. Admins can also view appointments in chronological order, cancel a booking, or reschedule it to an available slot. Rescheduling emails the customer only; cancellation emails the customer before removing the booking and releasing its slot. These actions are protected by the admin session and checked again on the server. Admin sessions persist across refreshes and normal page navigation, and are ended only by the **Log out** action or session expiry. The appointment page is `/appointment`. It offers one-hour slots during the configured salon hours, up to 30 days ahead. A successful booking reserves the slot immediately, and a D1 uniqueness constraint prevents two simultaneous requests from taking the same slot. Both the appointment page and SURA's guided chat booking flow use the same rate-limited booking API and accept Indian mobile numbers and email addresses. Booking and cancelling an in-progress booking are available within SURA's chat without navigating away; mentioning an appointment or booking starts the guided flow immediately. Customer names, phone numbers, and email addresses are encrypted at application level before D1 storage. SURA collects booking details in the browser and submits them directly to the secure booking API; those details are never sent to chat AI or included in chat messages. For new bookings, Cloudflare sends only the needed booking details over HTTPS to Brevo for separate customer and salon emails; D1 records whether each booking email was sent, and the admin can retry pending booking confirmations. Admin login is checked on the server, sessions are signed and held in an `HttpOnly`, `SameSite=Strict` cookie, and failed login attempts are limited. The public-page chat answers common salon questions locally and sends other questions to Cloudflare Workers AI through a server-side binding, with DeepSeek V4 Pro as an optional server-side fallback; chat questions are not stored by this site. When the fallback is used, the question is sent to DeepSeek. Visitors should avoid sharing sensitive personal information in general salon questions. The public page counts each load as a page view; repeat visits and automated traffic can also increase that total.

Cloudflare must be the public-facing host for the security headers, Functions, and counter to work. Keep the repository private if it contains any other operational information, and enable HTTPS on the deployed domain.

## Search indexing

After deployment, open `https://suburaaj-salon.pages.dev/robots.txt` and `https://suburaaj-salon.pages.dev/sitemap.xml` to confirm both load. Add the site in Google Search Console, verify domain ownership, submit `/sitemap.xml`, then use URL inspection to request indexing for the homepage. Search indexing is not immediate and cannot be guaranteed; it may take days or longer.

## Verify

```sh
npm run build
npm run lint
```
