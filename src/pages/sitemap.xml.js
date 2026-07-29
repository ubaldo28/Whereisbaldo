import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  const staticPages = [
    { url: 'https://whereisbaldo.com/', priority: '1.0', changefreq: 'weekly' },
    { url: 'https://whereisbaldo.com/about', priority: '0.8', changefreq: 'monthly' },
    { url: 'https://whereisbaldo.com/blog', priority: '0.9', changefreq: 'weekly' },
    { url: 'https://whereisbaldo.com/work-with-me', priority: '0.6', changefreq: 'monthly' },
    { url: 'https://whereisbaldo.com/contact', priority: '0.6', changefreq: 'monthly' },
    { url: 'https://whereisbaldo.com/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { url: 'https://whereisbaldo.com/terms-and-conditions', priority: '0.3', changefreq: 'yearly' },
    { url: 'https://whereisbaldo.com/disclaimer', priority: '0.3', changefreq: 'yearly' },
    { url: 'https://whereisbaldo.com/affiliate-disclosure', priority: '0.3', changefreq: 'yearly' },
    { url: 'https://whereisbaldo.com/cookie-policy', priority: '0.3', changefreq: 'yearly' },
  ];

  const postPages = posts.map(post => ({
    url: `https://whereisbaldo.com/blog/${post.slug}`,
    priority: '0.9',
    changefreq: 'monthly',
    lastmod: post.data.pubDate.toISOString().split('T')[0],
  }));

  const allPages = [...staticPages, ...postPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
