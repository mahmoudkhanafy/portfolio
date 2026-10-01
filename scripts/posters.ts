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
  isLandscape?: boolean;
}

export const PROJECTS: Project[] = [
  { slug: 'muscle-up-basics', source: 'work/muscle-up-basics.mp4', time: '00:00:02.5', youtubeId: 'G_f04GBBKGU' },
  { slug: 'finalll', source: 'work/finalll.mp4', time: '00:00:02.5', youtubeId: 'aBPZhiIMj_s' },
  { slug: 'skin-and-pain', source: 'work/skin-and-pain.mp4', time: '00:00:02.5', youtubeId: '5LSBdHHF-0o' },
  { slug: 'blood-sugar-test', source: 'work/blood-sugar-test.mp4', time: '00:00:02.5', youtubeId: 'eLpztUn5xTQ' },
  { slug: 'nimun-recap', source: 'work/nimun-recap.mov', time: '00:00:02.5', youtubeId: 'B4V5lTdMy1s' },
  { slug: 'running-film', source: 'work/running-film.mp4', time: '00:00:02.5', youtubeId: 'm_MjsGfVXVc', isLandscape: true },
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

    // 1. Try local extraction with ffmpeg ensuring full-frame vertical (9:16) for reels and landscape (16:9) for film
    if (existsSync(p.source)) {
      try {
        let vfFilter = '';
        if (p.isLandscape) {
          // Full HD 16:9 landscape
          vfFilter = 'scale=1920:1080:flags=lanczos,setsar=1';
        } else if (p.slug === 'nimun-recap') {
          // 4:5 source -> crop to full vertical 9:16 frame (1080x1920)
          vfFilter = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1';
        } else {
          // Anamorphic vertical 9:16 source (1080x1080 with SAR 9:16) -> expand to true 1080x1920
          vfFilter = 'scale=1080:1920:flags=lanczos,setsar=1';
        }

        execSync(`ffmpeg -y -ss ${p.time} -i "${p.source}" -vf "${vfFilter}" -frames:v 1 -q:v 2 "${tmpJpg}"`, { stdio: 'ignore' });

        if (existsSync(tmpJpg)) {
          await sharp(tmpJpg).webp({ quality: 92 }).toFile(webpPath);
          await sharp(tmpJpg).jpeg({ quality: 92 }).toFile(jpgPath);
          unlinkSync(tmpJpg);
          extracted = true;
          console.log(`✓ Generated full-frame poster for ${p.slug} (${p.isLandscape ? '16:9 landscape' : '9:16 vertical'})`);
        }
      } catch {
        extracted = false;
      }
    }

    // 2. Fallback to YouTube maxresdefault thumbnail with intelligent center crop for vertical shorts
    if (!extracted) {
      console.log(`Fetching YouTube fallback for ${p.slug}...`);
      const downloaded = await downloadYoutubeThumbnail(p.youtubeId, tmpJpg);
      if (downloaded && existsSync(tmpJpg)) {
        if (!p.isLandscape) {
          // If fallback image is horizontal (16:9 like YouTube shorts thumbnails with pillarboxes), crop the center 9:16
          const meta = await sharp(tmpJpg).metadata();
          if (meta.width && meta.height && meta.width > meta.height) {
            const cropWidth = Math.round((meta.height * 9) / 16);
            const left = Math.round((meta.width - cropWidth) / 2);
            await sharp(tmpJpg)
              .extract({ left, top: 0, width: cropWidth, height: meta.height })
              .resize(1080, 1920)
              .webp({ quality: 92 })
              .toFile(webpPath);
            await sharp(tmpJpg)
              .extract({ left, top: 0, width: cropWidth, height: meta.height })
              .resize(1080, 1920)
              .jpeg({ quality: 92 })
              .toFile(jpgPath);
            unlinkSync(tmpJpg);
            console.log(`✓ Cropped and saved vertical 9:16 YouTube fallback for ${p.slug}`);
            continue;
          }
        }

        await sharp(tmpJpg).webp({ quality: 92 }).toFile(webpPath);
        await sharp(tmpJpg).jpeg({ quality: 92 }).toFile(jpgPath);
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
