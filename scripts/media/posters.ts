export * from '../posters.ts';
import { generatePosters } from '../posters.ts';

if (process.argv[1]?.endsWith('posters.ts') || process.argv[1]?.endsWith('posters.js')) {
  const force = process.argv.includes('--force');
  generatePosters(force).catch(console.error);
}
