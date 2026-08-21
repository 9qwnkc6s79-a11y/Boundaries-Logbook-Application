/**
 * Match stored Google review cards to live /api/google-reviews payloads.
 * Used by ManagerHub migration v5 — never blanket-flips unmatched rows.
 */

export const PINNED_PLACE_IDS = {
  littleelm: 'ChIJ0ZxTHVs_FUQRd_o0bDQBv4M',
  prosper: 'ChIJRWTcb9hBTIYRdcWWthkQiHA',
} as const;

export type LiveReviewKey = {
  authorName?: string;
  publishTime?: string;
};

export type RematchDecision =
  | { kind: 'unmatched' }
  | { kind: 'unchanged' }
  | { kind: 'move'; storeId: 'store-elm' | 'store-prosper'; location: string };

export function googleReviewCompositeId(authorName: string, publishTime: string): string {
  return `${authorName}::${publishTime}`;
}

export function storeIdForReviewLocation(location: string): 'store-elm' | 'store-prosper' {
  return location === 'prosper' ? 'store-prosper' : 'store-elm';
}

/** First location wins if the same authorName::publishTime appears twice. */
export function indexLiveReviewLocations(
  liveByLocation: Record<string, LiveReviewKey[]>,
  locations: string[] = ['littleelm', 'prosper'],
): Map<string, string> {
  const index = new Map<string, string>();
  for (const location of locations) {
    for (const review of liveByLocation[location] || []) {
      if (!review.authorName || !review.publishTime) continue;
      const id = googleReviewCompositeId(review.authorName, review.publishTime);
      if (!index.has(id)) {
        index.set(id, location);
      }
    }
  }
  return index;
}

/**
 * If the live API assigns this review to a different store, return the corrected
 * storeId/location. Reviews that do not appear in either live payload stay put
 * (Google only returns the 5 newest).
 */
/** True only when both locations report the Maps-verified pinned Place IDs. */
export function livePayloadsArePinned(
  payloads: Record<string, { placeId?: string | null }>,
  locations: Array<keyof typeof PINNED_PLACE_IDS> = ['littleelm', 'prosper'],
): boolean {
  return locations.every((location) => payloads[location]?.placeId === PINNED_PLACE_IDS[location]);
}

export function rematchStoredReviewLocation(
  review: { id?: string; authorName?: string; publishTime?: string; storeId: string; location: string },
  liveIndex: Map<string, string>,
): RematchDecision {
  const composite = review.authorName && review.publishTime
    ? googleReviewCompositeId(review.authorName, review.publishTime)
    : '';
  const liveLocation = (review.id && liveIndex.get(review.id))
    || (composite ? liveIndex.get(composite) : undefined);
  if (!liveLocation) return { kind: 'unmatched' };

  const storeId = storeIdForReviewLocation(liveLocation);
  if (storeId === review.storeId && liveLocation === review.location) {
    return { kind: 'unchanged' };
  }
  return { kind: 'move', storeId, location: liveLocation };
}
