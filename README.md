# Where Is Baldo?

Personal travel blog, live at [whereisbaldo.com](https://whereisbaldo.com).

Astro on Cloudflare Pages. Static output, five Pages Functions doing the work that
static pages can't. Three runtime dependencies in `package.json` — Astro and the two
packages that draw the social share images. No CSS framework, no UI framework, no
plugin for the feed, the sitemap or the search index. Those are files in `src/pages/`.

```
npm install && npm run dev      # localhost:4321
npm run build                   # static build into dist/
```

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro 7, `output: 'static'` | A blog is documents. Ship HTML, add JavaScript only where something has to happen. |
| Hosting | Cloudflare Pages + Pages Functions | Pages serves the HTML from the edge; Functions run the five endpoints on the same deploy. |
| CMS | Decap CMS 3 at `/admin` | Writes Markdown back to this repo, so a post is a commit and there is no database to lose. |
| Auth | GitHub OAuth, written by hand | Decap needs an OAuth backend. The hosted one is a third party holding tokens for my repo. |
| Email | Resend HTTP API | Called with `fetch`. No SDK. |
| Images | satori + `@resvg/resvg-js` | Per-post Open Graph cards rendered at build time, not by a service. |
| Push | GitHub Actions + Webpushr | Fires when a post's front matter flips from draft to published. |

## The parts worth reading

### GitHub OAuth without a hosted broker

Decap CMS signs in through GitHub, and the usual answer is to point it at somebody
else's OAuth service. That service ends up holding a token with write access to this
repository. `functions/api/auth.js` and `functions/api/callback.js` are the whole flow
instead, about 90 lines:

- `auth.js` mints a random `state`, stores it in an `HttpOnly; Secure; SameSite=Lax`
  cookie with a 10-minute life, and redirects to GitHub.
- `callback.js` compares the returned `state` against that cookie **before** it will
  exchange the code for a token. A callback that arrives from anywhere else is refused.
- The token is handed to the CMS window over `postMessage` and never touches this repo.

### The contact form is the only interesting attack surface

`functions/api/contact.js` is 193 lines, and most of them are refusals:

- **Origin allowlist**, two exact origins, never a wildcard. A `POST` from anywhere else
  gets a 403 with no CORS headers to work with.
- **Per-IP throttle**, 5 messages per 6 hours, built on the Cache API — Pages Functions
  have it with no binding and no dashboard setup, so there is nothing to configure and no
  extra secret. It is per-colo, not global: it stops a script hammering the form, it is
  not a defence against a distributed flood, and the code says so.
- **Honeypot field, counted before it is checked**, so a bot that trips it still spends
  its rate-limit budget instead of getting a free retry.
- **Cloudflare Turnstile** verified server-side against `siteverify`. The secret lives in
  an environment variable on the Pages project, never in the repo.
- **Every field escaped** before it reaches the email template, and the subject line
  stripped of newlines, because that value ends up inside an email header.

Both failure paths fail open on purpose: if Turnstile is unreachable or the rate limiter
throws, a real person's message still goes through. Losing mail is worse than letting one
bot in.

### Preview URLs competing with the real site

Cloudflare serves this project at `whereisbaldo.pages.dev` and at a fresh preview URL for
every pull request. Same pages, different hostname, all indexable — which means the site
competes with itself in search. A redirect would break the previews I actually use, so
`functions/_middleware.js` adds `X-Robots-Tag: noindex, nofollow` to any response not
served from the real domain. Crawlers stop, humans don't notice.

### Publishing fires the push notification

`.github/workflows/notify-new-story.yml` diffs the last commit for changed post files and
reads `draft:` out of the old and new versions of each one. Only a `true` → `false`
transition sends anything, so editing a published post is silent and a new draft is
silent. The payload is assembled with `jq -n --arg`, so a quote or a `$` in a title can't
break the JSON or inject into the shell.

### Build-time Open Graph cards

`src/pages/og/[route].png.ts` renders a card per post with satori and rasterises it with
Resvg, using the Lora fonts committed alongside it. It runs during the build, so the
images are static files on the CDN and no request ever waits on an image service.

## Security headers

`public/_headers` sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin` and a `Permissions-Policy` that turns
off camera, microphone and geolocation, on every route. `/admin/*` also gets
`X-Robots-Tag: noindex`.

`.gitignore` refuses `*.pdf` outright. Personal documents were in here once and the rule
is there so they cannot come back.

## Layout

```
functions/
  _middleware.js      noindex on preview hostnames
  api/auth.js         GitHub OAuth, step 1
  api/callback.js     GitHub OAuth, step 2 — state check, then token exchange
  api/contact.js      contact form: origin, rate limit, honeypot, Turnstile, Resend
  subscribe.js        newsletter signup into a Resend audience
src/
  pages/              25 routes: blog, tags, search, portfolio, contact, policies
  pages/rss.xml.js    feed, hand-written
  pages/sitemap.xml.js
  pages/search.json.js  the search index the search page fetches
  pages/og/           per-post social cards, rendered at build
  content/posts/      15 posts, Markdown with front matter
  components/         Header, Footer, PostCard, Subscribe, AdSlot
public/admin/         Decap CMS
.github/workflows/    push notification on publish
```

## Environment

Set on the Cloudflare Pages project, not in the repo:

```
GITHUB_OAUTH_CLIENT_ID
GITHUB_OAUTH_CLIENT_SECRET
RESEND_API_KEY
RESEND_AUDIENCE_ID
TURNSTILE_SECRET_KEY
```
