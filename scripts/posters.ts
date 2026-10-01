import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import https from 'node:https';
import sharp from 'sharp';

interface Project {
  slug: string;
  source: string;
  time: string;
  youtubeId: string;
}

export const PROJECTS: Project[] = [
  { slug: 'muscle-up-basics', source: 'work/muscle-up-basics.mp4', time: '00:00:02.5', youtubeId: 'G_f04GBBKGU' },
  { slug: 'finalll', source: 'work/finalll.mp4', time: '00:00:02.5', youtubeId: 'aBPZhiIMj_s' },
  { slug: 'skin-and-pain', source: 'work/skin-and-pain.mp4', time: '00:00:02.5', youtubeId: '5LSBdHHF-0o' },
  { slug: 'blood-sugar-test', source: 'work/blood-sugar-test.mp4', time: '00:00:02.5', youtubeId: 'eLpztUn5xTQ' },
  { slug: 'nimun-recap', source: 'work/nimun-recap.mov', time: '00:00:02.5', youtubeId: 'B4V5lTdMy1s' },
  { slug: 'running-film', source: 'work/running-film.mp4', time: '00:00:02.5', youtubeId: 'm_MjsGfVXVc' },
];

async function downloadYoutubeThumbnail(youtubeId: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = createWriteStream(dest);
    https.get(`https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else {
        https.get(`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`, (resHq) => {
          if (resHq.statusCode === 200) {
            resHq.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve(true);
            });
          } else {
            resolve(false);
          }
        });
      }
    }).on('error', () => resolve(false));
  });
}

export async function generatePosters(force = false): Promise<void> {
  const postersDir = join(process.cwd(), 'public/posters');
  mkdirSync(postersDir, { recursive: true });

  for (const p of PROJECTS) {
    const webpPath = join(postersDir, `${p.slug}.webp`);
    const jpgPath = join(postersDir, `${p.slug}.jpg`);
    const tmpJpg = join(postersDir, `_tmp_${p.slug}.jpg`);

    if (!force && existsSync(webpPath) && existsSync(jpgPath)) {
      continue;
    }

    let extracted = false;

    // 1. Try local extraction with ffmpeg
    if (existsSync(p.source)) {
      try {
        execSync(`ffmpeg -y -ss ${p.time} -i "${p.source}" -frames:v 1 -q:v 2 "${tmpJpg}"`, { stdio: 'ignore' });
        if (existsSync(tmpJpg)) {
          await sharp(tmpJpg).webp({ quality: 90 }).toFile(webpPath);
          await sharp(tmpJpg).jpeg({ quality: 90 }).toFile(jpgPath);
          unlinkSync(tmpJpg);
          extracted = true;
          console.log(`✓ Generated poster from source for ${p.slug}`);
        }
      } catch {
        extracted = false;
      }
    }

    // 2. Fallback to YouTube maxresdefault thumbnail
    if (!extracted) {
      console.log(`Fetching YouTube fallback for ${p.slug}...`);
      const downloaded = await downloadYoutubeThumbnail(p.youtubeId, tmpJpg);
      if (downloaded && existsSync(tmpJpg)) {
        await sharp(tmpJpg).webp({ quality: 90 }).toFile(webpPath);
        await sharp(tmpJpg).jpeg({ quality: 90 }).toFile(jpgPath);
        unlinkSync(tmpJpg);
        console.log(`✓ Fetched YouTube thumbnail fallback for ${p.slug}`);
      }
    }
  }
}

if (process.argv[1]?.endsWith('posters.ts') || process.argv[1]?.endsWith('posters.js')) {
  const force = process.argv.includes('--force');
  generatePosters(force).catch(console.error);
}
