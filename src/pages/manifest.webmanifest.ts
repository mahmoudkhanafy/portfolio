import type { APIRoute } from 'astro';
import { href } from '../lib/site.ts';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: 'محمود خالد — مونتير ومصوّر فيديو',
      short_name: 'محمود خالد',
      lang: 'ar',
      dir: 'rtl',
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
