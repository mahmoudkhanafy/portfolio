import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// WCAG 2.x relative luminance and contrast ratio, written out here so the check does not depend on site code.
const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const token = (name: string): string => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\b`));
  if (!match?.[1]) throw new Error(`token --${name} not found as a 6-digit hex`);
  return match[1];
};

describe('palette contrast (WCAG AA)', () => {
  it('ink and body text are comfortably readable on paper and on the soft band', () => {
    for (const surface of ['paper', 'soft']) {
      expect(contrast(token('ink'), token(surface))).toBeGreaterThanOrEqual(7);
      expect(contrast(token('body'), token(surface))).toBeGreaterThanOrEqual(7);
    }
  });

  it('secondary text meets AA for normal text on paper and on the soft band', () => {
    expect(contrast(token('muted'), token('paper'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('muted'), token('soft'))).toBeGreaterThanOrEqual(4.5);
  });

  it('orange text and the focus ring read on paper; text on the orange band and buttons reads too', () => {
    expect(contrast(token('accent-ink'), token('paper'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('accent-ink'), token('soft'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('on-accent'), token('accent'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('on-accent'), token('accent-hover'))).toBeGreaterThanOrEqual(4.5);
    // The contact heading's key word, large text in the darkest shade on the orange band.
    expect(contrast(token('night'), token('accent'))).toBeGreaterThanOrEqual(3);
  });

  it('text on the dark bands meets AA', () => {
    expect(contrast(token('paper'), token('night'))).toBeGreaterThanOrEqual(7);
    expect(contrast(token('night-text'), token('night'))).toBeGreaterThanOrEqual(4.5);
  });
});
