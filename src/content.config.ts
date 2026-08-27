import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().default(false),
    heroEmoji: z.string().optional().default('\u2708\ufe0f'),
    heroColor: z.string().optional().default('#4A2C10, #8B5E2E'),
    ogImage: z.string().optional(),
  }),
});

export const collections = { posts };
