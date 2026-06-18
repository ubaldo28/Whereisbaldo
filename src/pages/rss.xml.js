import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const items = posts.map(post => `
    <item>
      <title><![CDATA[${post.data.title}]]></title>
      <description><![CDATA[${post.data.description}]]></description>
      <link>https://whereisbaldo.com/blog/${post.slug}</link>
      <guid>https://whereisbaldo.com/blog/${post.slug}</guid>
      <pubDate>${new Date(post.data.pubDate).toUTCString()}</pubDate>
    </item>`).join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Where Is Baldo?</title>
    <link>https://whereisbaldo.com</link>
    <description>Real travel stories from a California barber. 22 countries. No plan.</description>
    <language>en-us</language>
    <atom:link href="https://whereisbaldo.com/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
}
