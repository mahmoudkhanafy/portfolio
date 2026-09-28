import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPagesServer } from '../../scripts/serve.ts';

let root: string;
let server: Server;
let origin: string;
const bytes = Buffer.from(Array.from({ length: 1000 }, (_, i) => i % 256));
const css = 'body{color:red}'.repeat(40);

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'pages-server-'));
  mkdirSync(join(root, 'work/x'), { recursive: true });
  mkdirSync(join(root, 'media'));
  writeFileSync(join(root, 'index.html'), '<p>home</p>');
  writeFileSync(join(root, '404.html'), '<p>missing page</p>');
  writeFileSync(join(root, 'work/x/index.html'), '<p>work x</p>');
  writeFileSync(join(root, 'about.html'), '<p>about</p>');
  writeFileSync(join(root, 'media/a.mp4'), bytes);
  writeFileSync(join(root, 'style.css'), css);
  for (const ext of ['avif', 'webp', 'woff2', 'vcf', 'webmanifest', 'xml', 'jpg', 'png', 'txt', 'js', 'json']) writeFileSync(join(root, `f.${ext}`), 'x');
  writeFileSync(join(tmpdir(), 'outside-secret.txt'), 'secret');
  server = createPagesServer({ root, base: '/repo/' });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
  rmSync(root, { recursive: true, force: true });
});

const get = (path: string, headers: Record<string, string> = {}, method = 'GET') => fetch(origin + path, { headers, method, redirect: 'manual' });

describe('Pages-like static server', () => {
  it('serves the home page under the base path', async () => {
    const res = await get('/repo/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(await res.text()).toBe('<p>home</p>');
  });

  it('sends the domain root to the base path', async () => {
    const res = await get('/');
    expect([301, 302]).toContain(res.status);
    expect(res.headers.get('location')).toBe('/repo/');
  });

  it('adds the trailing slash to directories like Pages does', async () => {
    const res = await get('/repo/work/x?utm_source=ig');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('/repo/work/x/?utm_source=ig');
  });

  it('ignores query strings that apps append to shared links', async () => {
    const res = await get('/repo/work/x/?utm_source=ig&fbclid=abc');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<p>work x</p>');
  });

  it('serves name.html for /name', async () => {
    expect(await (await get('/repo/about')).text()).toBe('<p>about</p>');
  });

  it('answers missing pages with the 404 page and a 404 status', async () => {
    const res = await get('/repo/nope/');
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('<p>missing page</p>');
  });

  it('never serves files outside the site folder', async () => {
    for (const path of ['/repo/..%2foutside-secret.txt', '/repo/%2e%2e/%2e%2e/etc/hosts', '/repo/../outside-secret.txt']) {
      const res = await get(path);
      expect(res.status, path).toBe(404);
      expect(await res.text()).not.toContain('secret');
    }
  });

  it('serves byte ranges so Safari can stream video', async () => {
    const res = await get('/repo/media/a.mp4', { Range: 'bytes=0-99' });
    expect(res.status).toBe(206);
    expect(res.headers.get('content-range')).toBe('bytes 0-99/1000');
    expect(res.headers.get('content-length')).toBe('100');
    expect(Buffer.from(await res.arrayBuffer())).toEqual(bytes.subarray(0, 100));
  });

  it('serves open-ended and suffix ranges', async () => {
    const open = await get('/repo/media/a.mp4', { Range: 'bytes=900-' });
    expect(open.headers.get('content-range')).toBe('bytes 900-999/1000');
    const suffix = await get('/repo/media/a.mp4', { Range: 'bytes=-100' });
    expect(suffix.headers.get('content-range')).toBe('bytes 900-999/1000');
    expect(Buffer.from(await suffix.arrayBuffer())).toEqual(bytes.subarray(900));
  });

  it('rejects ranges past the end', async () => {
    const res = await get('/repo/media/a.mp4', { Range: 'bytes=2000-' });
    expect(res.status).toBe(416);
    expect(res.headers.get('content-range')).toBe('bytes */1000');
  });

  it('advertises ranges and caching on full responses', async () => {
    const res = await get('/repo/media/a.mp4');
    expect(res.status).toBe(200);
    expect(res.headers.get('accept-ranges')).toBe('bytes');
    expect(res.headers.get('content-type')).toBe('video/mp4');
    expect(res.headers.get('cache-control')).toBe('max-age=600');
  });

  it.each([
    ['avif', 'image/avif'],
    ['webp', 'image/webp'],
    ['woff2', 'font/woff2'],
    ['vcf', 'text/vcard; charset=utf-8'],
    ['webmanifest', 'application/manifest+json'],
    ['xml', 'application/xml'],
    ['jpg', 'image/jpeg'],
    ['png', 'image/png'],
    ['txt', 'text/plain; charset=utf-8'],
    ['js', 'text/javascript; charset=utf-8'],
    ['json', 'application/json'],
  ])('labels .%s as %s', async (ext, type) => {
    expect((await get(`/repo/f.${ext}`)).headers.get('content-type')).toBe(type);
  });

  it('gzips text but not video', async () => {
    const res = await get('/repo/style.css', { 'Accept-Encoding': 'gzip' });
    expect(res.headers.get('content-encoding')).toBe('gzip');
    const raw = await fetch(`${origin}/repo/style.css`, { headers: { 'Accept-Encoding': 'gzip' } });
    expect(raw.headers.get('content-encoding')).toBe('gzip');
    const video = await get('/repo/media/a.mp4', { 'Accept-Encoding': 'gzip' });
    expect(video.headers.get('content-encoding')).toBeNull();
  });

  it('delivers gzip bodies that inflate to the file', async () => {
    const http = await import('node:http');
    const body = await new Promise<Buffer>((resolve, reject) => {
      http.get(`${origin}/repo/style.css`, { headers: { 'Accept-Encoding': 'gzip' } }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c)).on('end', () => resolve(Buffer.concat(chunks))).on('error', reject);
      });
    });
    expect(gunzipSync(body).toString()).toBe(css);
  });

  it('answers a matching ETag with 304', async () => {
    const first = await get('/repo/style.css');
    const tag = first.headers.get('etag');
    expect(tag).toBeTruthy();
    expect((await get('/repo/style.css', { 'If-None-Match': tag! })).status).toBe(304);
  });

  it('answers HEAD without a body', async () => {
    const res = await get('/repo/media/a.mp4', {}, 'HEAD');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-length')).toBe('1000');
    expect((await res.arrayBuffer()).byteLength).toBe(0);
  });
});
