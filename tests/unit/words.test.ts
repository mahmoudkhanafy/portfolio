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
  it('times the Arabic hero line: 270 ms apart, a beat after a comma, and a wait while «متحركة» stretches', () => {
    const words = captionWords(ui.ar.heroCaption, 'rtl', RHYTHM.hero);
    expect(words.map((w) => w.delay)).toEqual([1150, 1420, 1930, 2200, 2800, 3070, 3340]);
    expect(words.filter((w) => w.key).map((w) => w.text)).toEqual(['كتابة', 'متحركة،']);
    expect(words.filter((w) => w.kashida !== undefined)).toEqual([{ text: 'متحركة،', key: true, kashida: 3, delay: 2200 }]);
  });

  it('builds the English hero line with its key words gold and nothing stretched', () => {
    const words = captionWords(ui.en.heroCaption, 'ltr', RHYTHM.hero);
    expect(words.map((w) => w.delay)).toEqual([1150, 1660, 1930, 2440, 2710, 2980]);
    expect(words.filter((w) => w.key).map((w) => w.text)).toEqual(['kinetic', 'captions,']);
    expect(words.every((w) => w.kashida === undefined)).toBe(true);
  });

  it('marks «سوا» and "together" in the contact heading', () => {
    expect(captionWords(ui.ar.contactHeading, 'rtl', RHYTHM.heading).filter((w) => w.key).map((w) => w.text)).toEqual(['سوا']);
    expect(captionWords(ui.en.contactHeading, 'ltr', RHYTHM.heading).filter((w) => w.key).map((w) => w.text)).toEqual(['together']);
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
