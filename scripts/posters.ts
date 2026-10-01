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
  { slug: 'muscle-up-basics', source: 'work/muscle-up-basics.mp4', time: '00:00:02.5', youtubeId: 'G_f04GBBKGU' },
  { slug: 'finalll', source: 'work/finalll.mp4', time: '00:00:02.5', youtubeId: 'aBPZhiIMj_s' },
  { slug: 'skin-and-pain', source: 'work/skin-and-pain.mp4', time: '00:00:02.5', youtubeId: '5LSBdHHF-0o' },
  { slug: 'blood-sugar-test', source: 'work/blood-sugar-test.mp4', time: '00:00:02.5', youtubeId: 'eLpztUn5xTQ' },
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
        let vf: string;
        if (p.isLandscape) {
          // Card 6: Landscape 16:9 letterbox with clean black space above and below
          vf = 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2';
        } else if (p.slug === 'nimun-recap') {
          // Card 5: 4:5 vertical video preserving existing letterbox framing
          vf = 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2';
        } else {
          // Cards 1-4: True 9:16 vertical reels full bleed edge-to-edge (no pad, zero black bars)
          vf = 'scale=1080:1980:force_original_aspect_ratio=increase,crop=1080:1980';
        }

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
    } else if (p.youtubeId) {
      // Fallback: If local video unavailable, fetch YouTube thumbnail and center crop to 9:16 (never letterbox 16:9)
      try {
        const ytUrl = `https://i.ytimg.com/vi/${p.youtubeId}/maxresdefault.jpg`;
        const res = await fetch(ytUrl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const meta = await sharp(buf).metadata();
          if (p.isLandscape) {
            await sharp(buf).resize(1920, 1080, { fit: 'contain', background: '#000000' }).webp({ quality: 82 }).toFile(webpPath);
            await sharp(buf).resize(1920, 1080, { fit: 'contain', background: '#000000' }).jpeg({ quality: 85 }).toFile(jpgPath);
          } else {
            // Center crop 9:16 directly so no black bars remain in the file
            const cropW = Math.round((meta.height || 720) * (9 / 16));
            await sharp(buf)
              .extract({ left: Math.max(0, Math.floor(((meta.width || 1280) - cropW) / 2)), top: 0, width: cropW, height: meta.height || 720 })
              .resize(1080, 1980)
              .webp({ quality: 82 })
              .toFile(webpPath);
            await sharp(buf)
              .extract({ left: Math.max(0, Math.floor(((meta.width || 1280) - cropW) / 2)), top: 0, width: cropW, height: meta.height || 720 })
              .resize(1080, 1980)
              .jpeg({ quality: 85 })
              .toFile(jpgPath);
          }
          const sizeKb = (statSync(webpPath).size / 1024).toFixed(1);
          console.log(`✓ Generated fallback poster from YouTube for ${p.slug} (${sizeKb} KB)`);
        }
      } catch (ytErr) {
        console.error(`Failed fallback poster for ${p.slug}:`, ytErr);
      }
    }
  }
}

if (process.argv[1]?.endsWith('posters.ts') || process.argv[1]?.endsWith('posters.js')) {
  const force = process.argv.includes('--force');
  generatePosters(force).catch(console.error);
}
