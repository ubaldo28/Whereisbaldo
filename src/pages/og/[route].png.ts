import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const fontRegular = fs.readFileSync(
  path.join(process.cwd(), 'src/assets/lora-latin-700-normal.woff')
);
const fontItalic = fs.readFileSync(
  path.join(process.cwd(), 'src/assets/lora-latin-700-italic.woff')
);

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { route: post.id },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as any;
  const stops = (post.data.heroColor || '#4A2C10, #8B5E2E')
    .split(',')
    .map((s: string) => s.trim());
  const tag = (post.data.tags && post.data.tags[0]) || 'Where Is Baldo?';

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          backgroundImage: `linear-gradient(135deg, ${stops[0]}, ${stops[1] || stops[0]})`,
          fontFamily: 'Lora',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                fontSize: '24px',
                letterSpacing: '6px',
                color: '#C4995A',
                textTransform: 'uppercase',
              },
              children: tag.toUpperCase(),
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                fontSize: post.data.title.length > 60 ? '58px' : '72px',
                lineHeight: 1.15,
                color: '#FFFAED',
                fontStyle: 'italic',
              },
              children: post.data.title,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '26px',
                color: '#F5E3B0',
              },
              children: [
                { type: 'div', props: { style: { display: 'flex' }, children: 'whereisbaldo.com' } },
                { type: 'div', props: { style: { display: 'flex', color: '#E07830' }, children: 'Even he doesn’t know.' } },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Lora', data: fontRegular, weight: 700, style: 'normal' },
        { name: 'Lora', data: fontItalic, weight: 700, style: 'italic' },
      ],
    }
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
