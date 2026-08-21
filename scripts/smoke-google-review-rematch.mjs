/**
 * Local smoke: pinned Place IDs + rematch matching (no Google / Vercel call).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const loader = spawnSync(
  process.execPath,
  [
    '--experimental-strip-types',
    '--no-warnings=ExperimentalWarning',
    '--input-type=module',
    '-e',
    `
      const api = await import(${JSON.stringify(join(root, 'api/google-reviews.ts'))});
      if (typeof api.default !== 'function') throw new Error('google-reviews default export missing');

      const src = await import('node:fs').then((fs) =>
        fs.readFileSync(${JSON.stringify(join(root, 'api/google-reviews.ts'))}, 'utf8')
      );
      if (src.includes('process.env.VITE_GOOGLE_PLACE_ID_LITTLEELM ||')
        || src.includes('process.env.VITE_GOOGLE_PLACE_ID_PROSPER ||')) {
        throw new Error('PLACE_IDS must not fall back to Vercel env vars');
      }
      if (!src.includes("littleelm: 'ChIJ0ZxTHVs_FUQRd_o0bDQBv4M'")) {
        throw new Error('Little Elm Place ID is not pinned');
      }
      if (!src.includes("prosper: 'ChIJRWTcb9hBTIYRdcWWthkQiHA'")) {
        throw new Error('Prosper Place ID is not pinned');
      }
      if (!src.includes('reviews_sort=newest')) {
        throw new Error('reviews_sort=newest is missing');
      }
      console.log('module load api/google-reviews.ts: ok');
      console.log('pinned Place IDs: ok');

      const {
        googleReviewCompositeId,
        indexLiveReviewLocations,
        rematchStoredReviewLocation,
        storeIdForReviewLocation,
      } = await import(${JSON.stringify(join(root, 'utils/googleReviewRematch.ts'))});

      const heathId = googleReviewCompositeId('Jacob Norvell', '2026-08-14T23:56:28.000Z');
      const liveIndex = indexLiveReviewLocations({
        littleelm: [
          { authorName: 'Emily Williams', publishTime: '2026-08-21T14:35:20.000Z' },
        ],
        prosper: [
          { authorName: 'Jacob Norvell', publishTime: '2026-08-14T23:56:28.000Z' },
        ],
      });

      const heathOnElm = rematchStoredReviewLocation({
        id: heathId,
        authorName: 'Jacob Norvell',
        publishTime: '2026-08-14T23:56:28.000Z',
        storeId: 'store-elm',
        location: 'littleelm',
      }, liveIndex);
      if (heathOnElm.kind !== 'move' || heathOnElm.location !== 'prosper' || heathOnElm.storeId !== 'store-prosper') {
        throw new Error('Heath review should rematch to prosper, got ' + JSON.stringify(heathOnElm));
      }

      const alreadyCorrect = rematchStoredReviewLocation({
        id: heathId,
        authorName: 'Jacob Norvell',
        publishTime: '2026-08-14T23:56:28.000Z',
        storeId: 'store-prosper',
        location: 'prosper',
      }, liveIndex);
      if (alreadyCorrect.kind !== 'unchanged') {
        throw new Error('already-correct review should stay put, got ' + JSON.stringify(alreadyCorrect));
      }

      const older = rematchStoredReviewLocation({
        id: 'Older Guest::2026-01-01T00:00:00.000Z',
        authorName: 'Older Guest',
        publishTime: '2026-01-01T00:00:00.000Z',
        storeId: 'store-elm',
        location: 'littleelm',
      }, liveIndex);
      if (older.kind !== 'unmatched') {
        throw new Error('older unmatched review must not be flipped, got ' + JSON.stringify(older));
      }

      if (storeIdForReviewLocation('littleelm') !== 'store-elm') {
        throw new Error('littleelm must map to store-elm');
      }
      console.log('rematch matching: ok');
    `,
  ],
  { encoding: 'utf8' }
);

if (loader.status !== 0) {
  console.error((loader.stderr || loader.stdout || 'google review rematch smoke failed').trim());
  process.exit(loader.status || 1);
}
process.stdout.write(loader.stdout);
