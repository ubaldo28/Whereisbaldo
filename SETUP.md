# Where Is Baldo — setup

How this site is deployed and what it needs. Nothing secret lives in this repo.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output into dist/
npm run preview    # serve dist/ locally
```

Node 22.12 or newer (Astro 7). The Pages Functions in `functions/` only run on
Cloudflare, so the contact form, newsletter signup and CMS login do not work on
`npm run dev`.

## Deploy (Cloudflare Pages)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick
   this repository.
2. Framework preset **Astro**, build command `npm run build`, output directory `dist`.
3. Every push to `main` deploys to production. Every other branch or pull request gets a
   preview URL, which `functions/_middleware.js` marks `noindex`.
4. Custom domain: Pages project → Custom domains → `whereisbaldo.com`.

## Environment variables

Set these on the Pages project (Settings → Environment variables), never in the repo:

| Name | Used by |
|---|---|
| `GITHUB_OAUTH_CLIENT_ID` | CMS login (`functions/api/auth.js`, `callback.js`) |
| `GITHUB_OAUTH_CLIENT_SECRET` | CMS login |
| `RESEND_API_KEY` | contact form and newsletter email |
| `RESEND_AUDIENCE_ID` | newsletter signup (`functions/subscribe.js`) |
| `TURNSTILE_SECRET_KEY` | contact form spam check |

The GitHub OAuth app's callback URL must be
`https://whereisbaldo.com/api/callback`.

## Writing posts

Posts are Markdown files in `src/content/posts/`. Either edit them directly, or sign in
at `/admin` (Decap CMS, GitHub login) and publish from the browser. Both end up as a
commit on `main`. A post with `draft: true` is not built into the site, the feed, the
sitemap or search.

## Things wired in the page code

- Google Analytics `G-BSDXJ1PRGL`, loaded only after a visitor accepts the consent
  banner (`src/components/ConsentBanner.astro`).
- Webpushr push notifications, in `src/layouts/BaseLayout.astro`.
- Cloudflare Turnstile on the contact form.
- Security headers and cache rules in `public/_headers`.
- `public/_redirects` for moved pages.
