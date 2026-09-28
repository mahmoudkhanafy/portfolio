import { describe, expect, it } from 'vitest';
import { buildEntries, type WorkFile } from '../../scripts/media/entries.ts';

const yml = (name: string, text: string): WorkFile => ({ name, text });
const video = (name: string): WorkFile => ({ name });

describe('pairing videos with info files', () => {
  it('pairs files that share a name and fills defaults', () => {
    const r = buildEntries([video('a.mp4'), yml('a.yml', 'title: "عنوان"')]);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.entries).toEqual([
      {
        slug: 'a',
        videoPath: 'a.mp4',
        infoPath: 'a.yml',
        auto: false,
        title: { ar: 'عنوان', en: null },
        description: { ar: null, en: null },
        type: 'reel',
        client: null,
        role: { ar: null, en: null },
        cover: null,
        order: 0,
        hidden: false,
      },
    ]);
  });

  it('reads every field', () => {
    const text = [
      'title: "جري"',
      'title_en: "Run"',
      'description: "وصف"',
      'description_en: "About it"',
      'type: film',
      'client: "V7"',
      'role: "تصوير ومونتاج"',
      'role_en: "Shot and edited"',
      'cover: "1:04"',
      'order: 3',
      'hidden: false',
      'video: "Final Cut (2).MOV"',
    ].join('\n');
    const r = buildEntries([video('Final Cut (2).MOV'), yml('run.yml', text)]);
    expect(r.errors).toEqual([]);
    expect(r.entries[0]).toMatchObject({
      slug: 'run',
      videoPath: 'Final Cut (2).MOV',
      title: { ar: 'جري', en: 'Run' },
      description: { ar: 'وصف', en: 'About it' },
      type: 'film',
      client: 'V7',
      role: { ar: 'تصوير ومونتاج', en: 'Shot and edited' },
      cover: 64,
      order: 3,
      hidden: false,
    });
  });

  it('matches video extensions and explicit names case-insensitively', () => {
    const r = buildEntries([video('Clip.MOV'), yml('Clip.yml', 'title: "x"'), video('Other File.Mp4'), yml('o.yml', 'title: "y"\nvideo: "other file.mp4"')]);
    expect(r.errors).toEqual([]);
    expect(r.entries.map((e) => [e.slug, e.videoPath])).toEqual([
      ['clip', 'Clip.MOV'],
      ['o', 'Other File.Mp4'],
    ]);
  });

  it('ignores templates, hidden files and non-video files', () => {
    const r = buildEntries([yml('_template.yml', 'title: ""'), video('.DS_Store'), video('README.md'), video('notes.txt')]);
    expect(r).toEqual({ entries: [], warnings: [], errors: [] });
  });
});

describe('videos uploaded without an info file', () => {
  it('publishes them with a title from the file name and warns', () => {
    const r = buildEntries([video('My Clip.mp4')]);
    expect(r.errors).toEqual([]);
    expect(r.entries[0]).toMatchObject({ slug: 'my-clip', auto: true, infoPath: null, title: { ar: 'My Clip', en: null } });
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]?.file).toBe('work/My Clip.mp4');
  });

  it('gives an Arabic-named upload a safe link', () => {
    const r = buildEntries([video('فيديو جديد.MP4')]);
    expect(r.entries[0]?.slug).toMatch(/^video-[0-9a-f]{6}$/);
    expect(r.entries[0]?.title.ar).toBe('فيديو جديد');
  });
});

describe('mistakes Mahmoud can make', () => {
  it('reports YAML syntax errors with the line number in both languages', () => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', 'type: event\ntitle: NIMUN: recap')]);
    expect(r.entries).toEqual([]);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]?.file).toBe('work/n.yml');
    expect(r.errors[0]?.en).toMatch(/line 2/i);
    expect(r.errors[0]?.ar).toMatch(/السطر 2/);
  });

  it('does not re-publish the video of a broken info file under a file-name title', () => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', 'title: NIMUN: recap')]);
    expect(r.entries).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.errors).toHaveLength(1);
  });

  it('still reports a same-named video when a valid info file points elsewhere', () => {
    const r = buildEntries([video('a.mp4'), video('b.mp4'), yml('a.yml', 'title: "x"\nvideo: "b.mp4"')]);
    expect(r.entries.map((e) => e.videoPath)).toEqual(['b.mp4']);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]?.file).toBe('work/a.mp4');
  });

  it('reports a repeated field', () => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', 'title: "a"\ntitle: "b"')]);
    expect(r.errors[0]?.en).toMatch(/line 2/i);
  });

  it('suggests the intended field for a typo', () => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', 'titel: "x"')]);
    expect(r.warnings.some((w) => /Did you mean "title"/.test(w.en))).toBe(true);
    expect(r.errors[0]?.en).toMatch(/"title"/);
  });

  it('ignores an unknown field that looks like nothing known', () => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', 'title: "x"\nmood: happy')]);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]?.en).toMatch(/"mood"/);
    expect(r.warnings[0]?.en).not.toMatch(/Did you mean/);
  });

  it('requires a non-empty title', () => {
    for (const text of ['', 'title: ""', 'title: "   "', 'client: "x"']) {
      const r = buildEntries([video('n.mp4'), yml('n.yml', text)]);
      expect(r.errors.map((e) => e.file)).toEqual(['work/n.yml']);
    }
  });

  it('rejects a file that is not a list of fields', () => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', '- title\n- other')]);
    expect(r.errors).toHaveLength(1);
  });

  it('names the expected video when it is missing', () => {
    const r = buildEntries([yml('n.yml', 'title: "x"')]);
    expect(r.errors[0]?.file).toBe('work/n.yml');
    expect(r.errors[0]?.en).toMatch(/n\.mp4/);
  });

  it('names the file when an explicit video does not exist', () => {
    const r = buildEntries([video('a.mp4'), yml('n.yml', 'title: "x"\nvideo: "b.mp4"')]);
    expect(r.errors[0]?.en).toMatch(/b\.mp4/);
  });

  it('rejects an explicit video that is not a video file', () => {
    const r = buildEntries([video('notes.txt'), yml('n.yml', 'title: "x"\nvideo: "notes.txt"')]);
    expect(r.errors[0]?.en).toMatch(/notes\.txt/);
  });

  it('lists the allowed types for an unknown one', () => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', 'title: "x"\ntype: wedding')]);
    expect(r.errors[0]?.en).toMatch(/reel, event, brand, film/);
    expect(r.errors[0]?.en).toMatch(/wedding/);
  });

  it.each([
    ['events', 'event'],
    ['Cinematic', 'film'],
    ['ريلز', 'reel'],
    ['فعالية', 'event'],
    ['إعلان', 'brand'],
    ['ad', 'brand'],
  ])('accepts the type synonym %j', (value, want) => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', `title: "x"\ntype: ${value}`)]);
    expect(r.errors).toEqual([]);
    expect(r.entries[0]?.type).toBe(want);
  });

  it('accepts a cover time written with Arabic digits', () => {
    const r = buildEntries([video('n.mov'), yml('n.yml', 'title: "x"\ncover: "٠:٠٥"')]);
    expect(r.entries[0]?.cover).toBe(5);
  });

  it('rejects an unreadable cover time', () => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', 'title: "x"\ncover: soon')]);
    expect(r.errors[0]?.en).toMatch(/"cover"/);
  });

  it.each([
    ['2.5', 2.5],
    ['"3"', 3],
    ['-1', -1],
  ])('reads order %s', (value, want) => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', `title: "x"\norder: ${value}`)]);
    expect(r.entries[0]?.order).toBe(want);
  });

  it('rejects an order that is not a number', () => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', 'title: "x"\norder: first')]);
    expect(r.errors[0]?.en).toMatch(/"order"/);
  });

  it.each([
    ['true', true],
    ['yes', true],
    ['"Yes"', true],
    ['نعم', true],
    ['no', false],
    ['false', false],
  ])('reads hidden %s', (value, want) => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', `title: "x"\nhidden: ${value}`)]);
    expect(r.errors).toEqual([]);
    expect(r.entries[0]?.hidden).toBe(want);
  });

  it('rejects an unclear hidden value', () => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', 'title: "x"\nhidden: maybe')]);
    expect(r.errors[0]?.en).toMatch(/"hidden"/);
  });

  it('rejects two info files claiming one video', () => {
    const r = buildEntries([video('a.mp4'), yml('a.yml', 'title: "x"'), yml('b.yml', 'title: "y"\nvideo: "a.mp4"')]);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]?.en).toMatch(/a\.mp4/);
    expect(r.entries).toHaveLength(1);
  });

  it('rejects two entries that would share a link', () => {
    const r = buildEntries([video('x.mp4'), yml('my-clip.yml', 'title: "x"\nvideo: "x.mp4"'), video('My Clip.mov')]);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]?.en).toMatch(/my-clip/);
  });

  it('strips a byte-order mark and Windows line endings', () => {
    const r = buildEntries([video('n.mp4'), yml('n.yml', '\ufefftitle: "x"\r\ntype: brand\r\n')]);
    expect(r.errors).toEqual([]);
    expect(r.entries[0]).toMatchObject({ title: { ar: 'x' }, type: 'brand' });
  });
});
