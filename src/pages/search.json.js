import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  const index = posts.map(post => ({
    title: post.data.title,
    description: post.data.description,
    slug: post.slug,
    tags: post.data.tags || [],
    pubDate: post.data.pubDate.toISOString(),
    heroEmoji: post.data.heroEmoji || '',
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
}
