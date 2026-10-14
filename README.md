# Suburaaj Salon & Studio

A React + TypeScript salon website with shared opening hours, a server-protected admin page, and a total page-view counter. The free Cloudflare Pages, Workers, and D1 tiers provide the hosting, API, and database.

## Local development

```sh
npm install
npm run dev
```

The Vite server previews the public page. The server-backed admin and counter require Cloudflare Pages Functions and a D1 database.

## Deploy to Cloudflare

Use Node.js 22.12+ (required by current Wrangler and Vite), then:

1. Sign in with `npx wrangler login`.
2. Create the Pages project with `npx wrangler pages project create suburaaj-salon --production-branch main`.
3. Create the database with `npx wrangler d1 create suburaaj-salon` and replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.toml` with the returned ID.
4. Apply the schema with `npx wrangler d1 migrations apply suburaaj-salon --remote`.
5. In the Cloudflare dashboard, open **Workers & Pages → suburaaj-salon → Settings → Variables and Secrets**. Add `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` as encrypted secrets for production. Choose your own strong admin credentials and a random session secret of at least 32 bytes; never put these values in source files.
6. The Wrangler config declares a **Workers AI** binding with the variable name `AI`, so no provider API key is required. If the dashboard has an existing project configuration that overrides the Wrangler config, add the same Workers AI binding in **Workers & Pages → suburaaj-salon → Settings → Bindings** for production. On the Workers Free plan, Workers AI includes 10,000 Neurons per day; this chatbot caps itself at 50 generated replies per UTC day and five per IP in ten minutes. Usage above the free allocation requires a Workers Paid plan and is billed, so keep the Cloudflare account on the Free plan if you do not want charges.
7. Deploy with `npm run deploy`.

The admin page is available at `/admin`. Login is checked on the server, sessions are signed and held in an `HttpOnly`, `SameSite=Strict` cookie, and failed login attempts are limited. Schedule changes are shared through D1. The public-page chat answers common salon questions locally and sends other questions to Cloudflare Workers AI through a server-side binding; chat questions are not stored by this site. Visitors should not enter sensitive personal information. The public page counts each load as a page view; repeat visits and automated traffic can also increase that total.

Cloudflare must be the public-facing host for the security headers, Functions, and counter to work. Keep the repository private if it contains any other operational information, and enable HTTPS on the deployed domain.

## Search indexing

After deployment, open `https://suburaaj-salon.pages.dev/robots.txt` and `https://suburaaj-salon.pages.dev/sitemap.xml` to confirm both load. Add the site in Google Search Console, verify domain ownership, submit `/sitemap.xml`, then use URL inspection to request indexing for the homepage. Search indexing is not immediate and cannot be guaranteed; it may take days or longer.

## Verify

```sh
npm run build
npm run lint
```
