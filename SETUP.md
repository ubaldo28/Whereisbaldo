# WhereIsBaldo — Deployment Setup Guide

This is your complete step-by-step guide to getting the site live on Cloudflare Pages. You only need to do this once.

---

## What You'll Need

- A free GitHub account (github.com)
- A free Cloudflare account (cloudflare.com)
- This `astro-site` folder on your computer

---

## Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in (or create an account)
2. Click the **+** icon in the top right → **New repository**
3. Name it: `whereisbaldo`
4. Set it to **Private** (your drafts won't be public)
5. Click **Create repository**
6. GitHub will show you setup instructions — copy the repo URL (looks like `https://github.com/YOUR_USERNAME/whereisbaldo.git`)

---

## Step 2: Push Your Code to GitHub

Open Terminal (on Mac, search "Terminal" in Spotlight):

```bash
cd "/Users/purpleworldinc/Documents/Claude/Projects/WhereIsBaldo Blog/astro-site"
git init
git add .
git commit -m "Initial site build"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/whereisbaldo.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 3: Connect to Cloudflare Pages

1. Go to [cloudflare.com](https://cloudflare.com) and sign in (or create a free account)
2. In the left sidebar, click **Workers & Pages**
3. Click **Create application** → **Pages** → **Connect to Git**
4. Click **Connect GitHub** and authorize Cloudflare
5. Select your `whereisbaldo` repository
6. Click **Begin setup**

**Build settings:**
- Framework preset: **Astro**
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `18` (set this under Environment variables as `NODE_VERSION = 18`)

7. Click **Save and Deploy**

Cloudflare will build and deploy your site. First build takes ~2 minutes. You'll get a URL like `whereisbaldo.pages.dev` immediately.

---

## Step 4: Connect Your Custom Domain

1. In Cloudflare Pages, go to your project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `whereisbaldo.com`
4. Follow the DNS instructions (if your domain is registered elsewhere, you'll need to point your DNS to Cloudflare, or transfer the domain to Cloudflare — transferring is easiest and free)

---

## Step 5: Set Up the CMS (Decap CMS with GitHub OAuth)

The CMS lets you write and publish posts from your browser at `whereisbaldo.com/admin`.

### 5a. Create a GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - Application name: `WhereIsBaldo CMS`
   - Homepage URL: `https://whereisbaldo.com`
   - Authorization callback URL: `https://whereisbaldo.com/`
4. Click **Register application**
5. Copy the **Client ID** (you'll need this in a moment)

### 5b. Update the CMS Config

Open `public/admin/config.yml` and replace:
- `YOUR_GITHUB_USERNAME` with your GitHub username
- `YOUR_GITHUB_OAUTH_APP_CLIENT_ID` with the Client ID from step 5a

Example:
```yaml
backend:
  name: github
  repo: ubaldofig/whereisbaldo
  branch: main
  auth_type: pkce
  app_id: Ov23liABC123xyz456  # ← your actual client ID
```

### 5c. Push the Update

```bash
cd "/Users/purpleworldinc/Documents/Claude/Projects/WhereIsBaldo Blog/astro-site"
git add public/admin/config.yml
git commit -m "Add CMS OAuth config"
git push
```

Cloudflare will auto-rebuild in ~1 minute.

### 5d. Test the CMS

Go to `https://whereisbaldo.com/admin` (or `whereisbaldo.pages.dev/admin` while your domain is still connecting). Click **Login with GitHub**, authorize, and you're in.

---

## Step 6: Set Up Google Analytics (Optional but Recommended)

1. Go to [analytics.google.com](https://analytics.google.com) and create a new property for `whereisbaldo.com`
2. Get your Measurement ID (looks like `G-XXXXXXXXXX`)
3. Open `src/layouts/BaseLayout.astro`
4. Find the comment `<!-- Google Analytics: add your GA4 script here -->`
5. Replace it with:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

6. Push to GitHub and Cloudflare auto-deploys.

---

## Ongoing: Publishing New Posts

**Option A — From the CMS (easiest):**
1. Go to `whereisbaldo.com/admin`
2. Login with GitHub
3. Click **Blog Posts** → **New Blog Post**
4. Write your post, fill in all fields, click **Publish**
5. Cloudflare detects the GitHub commit and auto-deploys in ~1 min

**Option B — From the files:**
1. Create a new `.md` file in `astro-site/src/content/posts/`
2. Copy the frontmatter from an existing post, update the fields
3. Write your post content below the frontmatter
4. Run the git push commands from Step 2 (minus `git init` and `git remote add`)

---

## File Structure Reference

```
astro-site/
├── src/
│   ├── content/
│   │   └── posts/           ← your blog posts go here
│   ├── pages/               ← all site pages
│   ├── components/          ← Header, Footer, PostCard
│   ├── layouts/             ← BaseLayout, PostLayout
│   └── styles/
│       └── global.css       ← all site styles
├── public/
│   ├── admin/               ← Decap CMS files
│   ├── favicon.svg
│   └── robots.txt
├── _headers                 ← Cloudflare security headers
├── astro.config.mjs
└── package.json
```

---

## Support

If anything breaks or you need help, just open a session and describe the issue. All the files are in the `WhereIsBaldo Blog` folder on your computer.
