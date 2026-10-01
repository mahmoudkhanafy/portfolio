import { describe, expect, it } from 'vitest';
import { ui } from '../../src/lib/i18n.ts';
import { captionWords, kashidaAt, RHYTHM, splitWords } from '../../src/lib/words.ts';

describe('splitWords', () => {
  it('splits a line into its words, keeping punctuation with its word', () => {
    expect(splitWords('مونتاج ريلز، كتابة متحركة، تغطية فعاليات وبراندات', 'rtl')).toEqual(['مونتاج', 'ريلز،', 'كتابة', 'متحركة،', 'تغطية', 'فعاليات', 'وبراندات']);
    expect(splitWords('Reels, kinetic captions, events and brands', 'ltr')).toEqual(['Reels,', 'kinetic', 'captions,', 'events', 'and', 'brands']);
  });

  it('ignores extra spaces and line breaks', () => {
    expect(splitWords('  يلا \n نشتغل   سوا ', 'rtl')).toEqual(['يلا', 'نشتغل', 'سوا']);
  });

  it('keeps a run in the other direction together, so it reads in its own order', () => {
    expect(splitWords('قبل ما تجرّب الـ Muscle-up', 'rtl')).toEqual(['قبل', 'ما', 'تجرّب', 'الـ', 'Muscle-up']);
    expect(splitWords('ريل لـ Nike Air Max 2024 في القاهرة', 'rtl')).toEqual(['ريل', 'لـ', 'Nike Air Max 2024', 'في', 'القاهرة']);
    expect(splitWords('ليلة Nike - Air 🎬 مع الفريق', 'rtl')).toEqual(['ليلة', 'Nike - Air', '🎬', 'مع', 'الفريق']);
    expect(splitWords('A recap of مؤتمر الشباب ٢٠٢٦ in Cairo', 'ltr')).toEqual(['A', 'recap', 'of', 'مؤتمر الشباب ٢٠٢٦', 'in', 'Cairo']);
  });

  it('leaves numbers in the line’s own direction as words of their own', () => {
    expect(splitWords('فيديو ٣ دقايق', 'rtl')).toEqual(['فيديو', '٣', 'دقايق']);
  });

  it('keeps pasted markup, links and hashtags as plain words', () => {
    expect(splitWords('عنوان </script><b>مش عريض</b> & 🎬 #هاشتاج_طويل_جداً', 'rtl')).toEqual(['عنوان', '</script><b>مش', 'عريض</b>', '&', '🎬', '#هاشتاج_طويل_جداً']);
  });
});

describe('kashidaAt', () => {
  it('stretches «متحركة» between ح and ر, the joining point nearest its middle', () => {
    expect(kashidaAt('متحركة')).toBe(3);
    expect(kashidaAt('متحركة،')).toBe(3);
  });

  it('only follows a letter that joins the next one, and never splits a letter from its marks', () => {
    expect(kashidaAt('كلّمني')).toBe(3); // after ل and its shadda
    expect(kashidaAt('ورد')).toBeNull(); // و, ر and د never join the letter after them
    expect(kashidaAt('Reels')).toBeNull();
  });
});

describe('captionWords', () => {
  it('times the Arabic hero line: 270 ms apart, a beat after a sentence, and «حكايتك» orange and stretched', () => {
    const words = captionWords(ui.ar.heroLead, 'rtl', RHYTHM.hero);
    expect(words.map((w) => w.delay)).toEqual([1150, 1420, 1690, 1960, 2470, 2740, 3010]);
    expect(words.filter((w) => w.key).map((w) => w.text)).toEqual(['حكايتك.']);
    expect(words.filter((w) => w.kashida !== undefined)).toEqual([{ text: 'حكايتك.', key: true, kashida: 2, delay: 3010 }]);
  });

  it('builds the English hero line with its key word orange and nothing stretched', () => {
    const words = captionWords(ui.en.heroLead, 'ltr', RHYTHM.hero);
    expect(words.map((w) => w.delay)).toEqual([1150, 1420, 1690, 1960, 2230, 2740, 3010, 3280]);
    expect(words.filter((w) => w.key).map((w) => w.text)).toEqual(['yours.']);
    expect(words.every((w) => w.kashida === undefined)).toBe(true);
  });

  it('breaks the hero line after its first sentence, in both languages', () => {
    expect(captionWords(ui.ar.heroLead, 'rtl', RHYTHM.hero).filter((w) => w.breakAfter).map((w) => w.text)).toEqual(['حكاية.']);
    expect(captionWords(ui.en.heroLead, 'ltr', RHYTHM.hero).filter((w) => w.breakAfter).map((w) => w.text)).toEqual(['story.']);
  });

  it('marks the key words of the about and contact headings', () => {
    expect(captionWords(ui.ar.contactHeading, 'rtl', RHYTHM.heading).filter((w) => w.key).map((w) => w.text)).toEqual(['صورة.']);
    expect(captionWords(ui.en.contactHeading, 'ltr', RHYTHM.heading).filter((w) => w.key).map((w) => w.text)).toEqual(['visual.']);
    expect(captionWords(ui.ar.aboutHeading, 'rtl', RHYTHM.heading).filter((w) => w.key).map((w) => w.text)).toEqual(['والصورة', 'عندي.']);
    expect(captionWords(ui.en.aboutHeading, 'ltr', RHYTHM.heading).filter((w) => w.key).map((w) => w.text)).toEqual(['My', 'lens.']);
  });

  it('fails the build when a key word or the stretched word is not in the line, or cannot stretch', () => {
    expect(() => captionWords({ text: 'يلا نشتغل سوا', key: 'بكرة' }, 'rtl', RHYTHM.heading)).toThrow(/بكرة/);
    expect(() => captionWords({ text: 'ورد جميل', stretch: 'ورد' }, 'rtl', RHYTHM.hero)).toThrow(/kashida/);
  });

  it('starts in-view builds at 0 and a video page title once its frame has landed', () => {
    expect(captionWords({ text: 'شغل تاني' }, 'rtl', RHYTHM.heading).map((w) => w.delay)).toEqual([0, 210]);
    expect(captionWords({ text: 'قبل ما تجرّب' }, 'rtl', RHYTHM.page).map((w) => w.delay)).toEqual([650, 840, 1030]);
  });

  it('never lets a long title take longer than its limit, and keeps the words in order', () => {
    const text = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ');
    const delays = captionWords({ text }, 'ltr', RHYTHM.title).map((w) => w.delay);
    expect(delays.at(-1)! - delays[0]!).toBeLessThanOrEqual(1200);
    expect(delays).toEqual([...delays].sort((a, b) => a - b));
  });
});
