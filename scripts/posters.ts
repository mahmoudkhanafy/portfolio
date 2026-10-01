import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

interface Project {
  slug: string;
  source: string;
  time: string;
  youtubeId: string;
  isLandscape?: boolean;
}

export const PROJECTS: Project[] = [
  { slug: 'muscle-up-basics', source: 'work/muscle-up-basics.mp4', time: '00:00:02', youtubeId: 'G_f04GBBKGU' },
  { slug: 'finalll', source: 'work/finalll.mp4', time: '00:00:02', youtubeId: 'aBPZhiIMj_s' },
  { slug: 'skin-and-pain', source: 'work/skin-and-pain.mp4', time: '00:00:02', youtubeId: '5LSBdHHF-0o' },
  { slug: 'blood-sugar-test', source: 'work/blood-sugar-test.mp4', time: '00:00:02', youtubeId: 'eLpztUn5xTQ' },
  { slug: 'nimun-recap', source: 'work/nimun-recap.mov', time: '00:00:02', youtubeId: 'B4V5lTdMy1s' },
  { slug: 'running-film', source: 'work/running-film.mp4', time: '00:00:02', youtubeId: 'm_MjsGfVXVc', isLandscape: true },
];

export async function generatePosters(force = false): Promise<void> {
  const postersDir = join(process.cwd(), 'public/posters');
  mkdirSync(postersDir, { recursive: true });

  for (const p of PROJECTS) {
    const webpPath = join(postersDir, `${p.slug}.webp`);
    const jpgPath = join(postersDir, `${p.slug}.jpg`);
    const tmpPng = join(postersDir, `_tmp_${p.slug}.png`);

    if (!force && existsSync(webpPath) && existsSync(jpgPath)) {
      continue;
    }

    if (existsSync(p.source)) {
      try {
        const vf = p.isLandscape
          ? 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2'
          : 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2';

        execSync(`ffmpeg -y -ss ${p.time} -i "${p.source}" -vf "${vf}" -frames:v 1 -q:v 2 "${tmpPng}"`, { stdio: 'ignore' });

        if (existsSync(tmpPng)) {
          const quality = p.slug === 'nimun-recap' ? 76 : 82;
          await sharp(tmpPng).webp({ quality }).toFile(webpPath);
          await sharp(tmpPng).jpeg({ quality: 85 }).toFile(jpgPath);
          unlinkSync(tmpPng);
          const sizeKb = (statSync(webpPath).size / 1024).toFixed(1);
          console.log(`✓ Generated unzoomed poster for ${p.slug} (${sizeKb} KB)`);
        }
      } catch (err) {
        console.error(`Failed to extract poster for ${p.slug}:`, err);
      }
    }
  }
}

if (process.argv[1]?.endsWith('posters.ts') || process.argv[1]?.endsWith('posters.js')) {
  const force = process.argv.includes('--force');
  generatePosters(force).catch(console.error);
}
