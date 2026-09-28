import { describe, expect, it } from 'vitest';
import { absoluteUrl, normalizeBase, pagePath, withBase } from '../../src/lib/urls.ts';

describe('normalizeBase', () => {
  it.each([
    ['/mahmoud-khaled/', '/mahmoud-khaled/'],
    ['/mahmoud-khaled', '/mahmoud-khaled/'],
    ['mahmoud-khaled/', '/mahmoud-khaled/'],
    ['//a//', '/a/'],
    ['/', '/'],
    ['', '/'],
    ['  /repo  ', '/repo/'],
  ])('%j → %j', (base, want) => {
    expect(normalizeBase(base)).toBe(want);
  });
});

describe('withBase', () => {
  it('prefixes a sub-path base', () => {
    expect(withBase('work/x/', '/repo/')).toBe('/repo/work/x/');
  });
  it('does not double a leading slash', () => {
    expect(withBase('/media/a.mp4', '/repo')).toBe('/repo/media/a.mp4');
  });
  it('returns the base itself for the home path', () => {
    expect(withBase('', '/repo/')).toBe('/repo/');
  });
  it('works at the domain root', () => {
    expect(withBase('en/', '/')).toBe('/en/');
  });
});

describe('absoluteUrl', () => {
  it('joins origin, base and path', () => {
    expect(absoluteUrl('work/x/', 'https://u.github.io/', '/repo/')).toBe('https://u.github.io/repo/work/x/');
  });
  it('keeps a LAN origin with a port', () => {
    expect(absoluteUrl('', 'http://192.168.100.60:4747', '/mahmoud-khaled/')).toBe('http://192.168.100.60:4747/mahmoud-khaled/');
  });
  it('handles a custom domain at the root', () => {
    expect(absoluteUrl('media/og.jpg', 'https://mahmoud.video', '')).toBe('https://mahmoud.video/media/og.jpg');
  });
});

describe('pagePath', () => {
  it.each([
    ['ar', undefined, ''],
    ['en', undefined, 'en/'],
    ['ar', 'nimun-recap', 'work/nimun-recap/'],
    ['en', 'nimun-recap', 'en/work/nimun-recap/'],
  ] as const)('%s %s → %j', (lang, slug, want) => {
    expect(pagePath(lang, slug)).toBe(want);
  });
});
