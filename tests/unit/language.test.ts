import { describe, expect, it } from 'vitest';
import { offerFor } from '../../src/scripts/language.js';

describe('offerFor', () => {
  it.each([
    // The device's first language the site has decides; one it lacks (French) reads English.
    ['ar', ['en-US', 'en'], null, 'en'],
    ['ar', ['fr-FR', 'ar-EG'], null, null],
    ['ar', ['fr-FR'], null, 'en'],
    ['ar', ['ar-EG', 'en-US'], null, null],
    ['ar', ['AR'], null, null],
    ['en', ['ar-EG'], null, 'ar'],
    ['en', ['en-GB'], null, null],
    ['en', [], null, null],
    // Once a visitor has picked a language (the switch, or this offer), the site stops offering.
    ['ar', ['en-US'], 'ar', null],
    ['ar', ['en-US'], 'en', null],
  ] as const)('on a %s page, device %j, chosen %s → offer %s', (page, languages, chosen, want) => {
    expect(offerFor(page, languages, chosen)).toBe(want);
  });
});
