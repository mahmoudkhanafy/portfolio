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
  it('display and body text are comfortably readable on the screen colour', () => {
    expect(contrast(token('white'), token('screen'))).toBeGreaterThanOrEqual(7);
    expect(contrast(token('text'), token('screen'))).toBeGreaterThanOrEqual(7);
  });

  it('secondary text meets AA for normal text', () => {
    expect(contrast(token('dim'), token('screen'))).toBeGreaterThanOrEqual(4.5);
  });

  it('caption gold works as a focus ring on the screen and as a button behind black text', () => {
    expect(contrast(token('caption'), token('screen'))).toBeGreaterThanOrEqual(3);
    expect(contrast(token('on-caption'), token('caption'))).toBeGreaterThanOrEqual(4.5);
  });

  it('secondary text still reads on raised surfaces', () => {
    expect(contrast(token('dim'), token('raised'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token('text'), token('raised'))).toBeGreaterThanOrEqual(7);
  });
});
