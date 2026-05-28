import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().default(false),
    heroEmoji: z.string().optional().default('✈️'),
    heroColor: z.string().optional().default('#4A2C10, #8B5E2E'),
  }),
});

export const collections = { posts };
