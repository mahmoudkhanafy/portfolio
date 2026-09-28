import { describe, expect, it } from 'vitest';
import { whatsappMessage, whatsappUrl } from '../../src/lib/contact.ts';

describe('whatsappUrl', () => {
  it('links to the number without text', () => {
    expect(whatsappUrl()).toBe('https://wa.me/201156379179');
  });
  it('percent-encodes spaces and newlines in the prefilled text', () => {
    expect(whatsappUrl('a b\nc')).toBe('https://wa.me/201156379179?text=a%20b%0Ac');
  });
  it('round-trips Arabic text', () => {
    const text = 'أهلاً يا محمود «ريل»';
    const url = new URL(whatsappUrl(text));
    expect(url.searchParams.get('text')).toBe(text);
  });
});

describe('whatsappMessage', () => {
  it('names the video and ends with its link in Arabic', () => {
    const message = whatsappMessage('ar', { title: 'NIMUN — ملخص', url: 'https://e.github.io/r/work/nimun-recap/' });
    expect(message).toContain('«NIMUN — ملخص»');
    expect(message.endsWith('\nhttps://e.github.io/r/work/nimun-recap/')).toBe(true);
  });
  it('names the video and ends with its link in English', () => {
    const message = whatsappMessage('en', { title: 'Run', url: 'https://e.github.io/r/en/work/run/' });
    expect(message).toContain('“Run”');
    expect(message.endsWith('\nhttps://e.github.io/r/en/work/run/')).toBe(true);
  });
  it('has a general greeting without a video', () => {
    expect(whatsappMessage('ar')).toMatch(/^أهلاً يا محمود/);
    expect(whatsappMessage('en')).toMatch(/^Hi Mahmoud/);
    expect(whatsappMessage('en')).not.toContain('http');
  });
});
