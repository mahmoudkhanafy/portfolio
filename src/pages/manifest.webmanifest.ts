import type { APIRoute } from 'astro';
import { href } from '../lib/site.ts';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: 'Mahmoud Khaled — Video editor & videographer',
      short_name: 'Mahmoud Khaled',
      lang: 'en',
      dir: 'ltr',
      start_url: href(''),
      scope: href(''),
      display: 'browser',
      background_color: '#000000',
      theme_color: '#000000',
      icons: [
        { src: href('icon-192.png'), sizes: '192x192', type: 'image/png' },
        { src: href('icon-512.png'), sizes: '512x512', type: 'image/png' },
        { src: href('icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
