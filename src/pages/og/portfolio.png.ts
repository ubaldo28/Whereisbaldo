import type { APIRoute } from 'astro';
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

const row = (style: Record<string, unknown>, children: unknown) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

export const GET: APIRoute = async () => {
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
          backgroundColor: '#0a0a0a',
          fontFamily: 'Lora',
        },
        children: [
          row(
            { fontSize: '24px', letterSpacing: '8px', color: '#2ec4c0' },
            'FULL-STACK · DEVELOPER'
          ),
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column' },
              children: [
                row({ fontSize: '86px', color: '#ffffff', lineHeight: 1.05 }, 'Ubaldo Figueroa'),
                row({ width: '480px', height: '6px', backgroundColor: '#2ec4c0', marginTop: '28px' }, ''),
                row(
                  {
                    fontSize: '32px',
                    color: '#b9b9b9',
                    marginTop: '28px',
                    lineHeight: 1.4,
                    width: '900px',
                  },
                  'Five live production sites — including an AI news platform that publishes itself.'
                ),
              ],
            },
          },
          row(
            { justifyContent: 'space-between', alignItems: 'center', fontSize: '26px', color: '#8a8a8a' },
            [
              row({}, 'whereisbaldo.com/portfolio'),
              row({ color: '#2ec4c0', fontStyle: 'italic' }, 'Available for work'),
            ]
          ),
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

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
