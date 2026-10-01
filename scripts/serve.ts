/**
 * Serves a built site the way GitHub Pages does, under the repo sub-path: directory indexes, a 301
 * to the trailing slash, 404.html with a 404 status, byte ranges (Safari needs them for video), gzip
 * for text and a 10-minute cache. Used for local runs, end-to-end tests and Lighthouse.
 *
 *   node scripts/serve.ts --dir dist [--base /mahmoud-khaled/] [--port 4750] [--host 0.0.0.0]
 */
import { createReadStream, type Stats } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { gzipSync } from 'node:zlib';
import { normalizeBase } from '../src/lib/urls.ts';
import { DEFAULT_BASE, DEFAULT_PORT } from './config.ts';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.vcf': 'text/vcard; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.xml', '.txt', '.vcf', '.svg']);

const statOrNull = (path: string): Promise<Stats | null> => stat(path).catch(() => null);

/** Parses a single "bytes=a-b" range; null means "ignore it", 'invalid' means 416. */
function parseRange(header: string, size: number): { start: number; end: number } | 'invalid' | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, from = '', to = ''] = match;
  if (from === '' && to === '') return null;
  let start: number;
  let end: number;
  if (from === '') {
    start = Math.max(0, size - Number(to));
    end = size - 1;
  } else {
    start = Number(from);
    end = to === '' ? size - 1 : Math.min(Number(to), size - 1);
  }
  return start >= size || start > end ? 'invalid' : { start, end };
}

export function createPagesServer(options: { root: string; base: string }): Server {
  const root = resolve(options.root);
  const base = normalizeBase(options.base);

  const send = async (req: IncomingMessage, res: ServerResponse, file: string, info: Stats, status: number): Promise<void> => {
    const ext = extname(file).toLowerCase();
    const etag = `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
    res.setHeader('Content-Type', TYPES[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'max-age=600');
    res.setHeader('Last-Modified', info.mtime.toUTCString());
    res.setHeader('ETag', etag);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (status === 200 && req.headers['if-none-match'] === etag) {
      res.writeHead(304).end();
      return;
    }

    const rangeHeader = req.headers.range;
    const range = status === 200 && rangeHeader ? parseRange(rangeHeader, info.size) : null;
    if (range === 'invalid') {
      res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
      return;
    }
    if (range) {
      res.writeHead(206, { 'Content-Range': `bytes ${range.start}-${range.end}/${info.size}`, 'Content-Length': range.end - range.start + 1 });
      if (req.method === 'HEAD') res.end();
      else createReadStream(file, { start: range.start, end: range.end }).pipe(res);
      return;
    }

    if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))) {
      const body = gzipSync(await readFile(file));
      res.writeHead(status, { 'Content-Encoding': 'gzip', 'Content-Length': body.length, Vary: 'Accept-Encoding' });
      res.end(req.method === 'HEAD' ? undefined : body);
      return;
    }
    res.writeHead(status, { 'Content-Length': info.size });
    if (req.method === 'HEAD') res.end();
    else createReadStream(file).pipe(res);
  };

  const notFound = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const page = join(root, '404.html');
    const info = await statOrNull(page);
    if (info?.isFile()) return send(req, res, page, info, 404);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  };

  return createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      let path: string;
      try {
        path = decodeURIComponent(url.pathname);
      } catch {
        return notFound(req, res);
      }
      if (!path.startsWith(base)) {
        // "/repo" or "/" → the site's home, as a user would expect.
        if (base.startsWith(path.endsWith('/') ? path : `${path}/`)) {
          res.writeHead(302, { Location: base }).end();
          return;
        }
        return notFound(req, res);
      }
      const target = resolve(root, `.${sep}${path.slice(base.length)}`);
      if (target !== root && !target.startsWith(root + sep)) return notFound(req, res);

      const info = await statOrNull(target);
      if (info?.isDirectory()) {
        if (!url.pathname.endsWith('/')) {
          res.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
          return;
        }
        const index = join(target, 'index.html');
        const indexInfo = await statOrNull(index);
        return indexInfo?.isFile() ? send(req, res, index, indexInfo, 200) : notFound(req, res);
      }
      if (info?.isFile()) return send(req, res, target, info, 200);
      const html = await statOrNull(`${target}.html`);
      if (html?.isFile()) return send(req, res, `${target}.html`, html, 200);
      return notFound(req, res);
    })().catch(() => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  });
}

function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => net!.address);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({
    options: {
      dir: { type: 'string', default: 'dist' },
      base: { type: 'string', default: process.env.BASE_PATH ?? DEFAULT_BASE },
      port: { type: 'string', default: String(DEFAULT_PORT) },
      host: { type: 'string', default: '0.0.0.0' },
    },
  });
  const base = normalizeBase(values.base);
  const port = Number(values.port);
  const server = createPagesServer({ root: values.dir, base });
  server.listen(port, values.host, () => {
    console.log(`Serving ${values.dir} at:`);
    console.log(`  local  http://localhost:${port}${base}`);
    if (values.host === '0.0.0.0') for (const address of lanAddresses()) console.log(`  LAN    http://${address}:${port}${base}`);
  });
}
