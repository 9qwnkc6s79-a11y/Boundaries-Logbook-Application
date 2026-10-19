/**
 * Smoke: Toast menu lookup never caches an empty/failed menu (429 etc.),
 * retries once with backoff, and falls back to the last good menu.
 * Fake fetch only - never calls Toast.
 * Run: npx --yes tsx scripts/verify-menu-lookup-cache.ts
 */
import * as stock from '../api/toast-stock.ts';
import * as sold from '../api/toast-food-sold.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const GOOD_MENU = {
  menus: [{ name: 'All Day', menuGroups: [{ name: 'Bakery', menuItems: [{ guid: 'g-almond', name: 'Almond Croissant' }] }] }],
};
const OTHER_MENU = {
  menus: [{ name: 'All Day', menuGroups: [{ name: 'Bakery', menuItems: [{ guid: 'g-kolache', name: 'Kolache' }] }] }],
};

type Reply = { status: number; body?: any; retryAfter?: string } | 'throw';

function fakeFetch(replies: Reply[]) {
  const calls: string[] = [];
  const fn = async (url: string) => {
    calls.push(url);
    if (calls.length > 20) throw new Error('runaway fetch loop');
    const r = replies.shift() ?? { status: 500 };
    if (r === 'throw') throw new Error('network down');
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      headers: { get: (h: string) => (h.toLowerCase() === 'retry-after' ? r.retryAfter ?? null : null) },
      json: async () => r.body,
    };
  };
  return { fn, calls };
}

const origWarn = console.warn;
console.warn = () => {}; // keep output readable; behaviour is asserted below

for (const [label, mod] of [['toast-stock', stock], ['toast-food-sold', sold]] as const) {
  assert(typeof mod.loadMenuLookupWith === 'function', `${label}: loadMenuLookupWith exported`);
  let clock = 1_000_000;
  const now = () => clock;
  const sleeps: number[] = [];
  const sleep = async (ms: number) => { sleeps.push(ms); };
  const R = 'rest-1';

  // 1. 429 on v2 + v3, then OK on the retry: one backoff, result cached.
  {
    const cache = new Map();
    const f = fakeFetch([{ status: 429 }, { status: 429 }, { status: 200, body: GOOD_MENU }]);
    const out = await mod.loadMenuLookupWith({ fetch: f.fn, cache, sleep, now }, 't', R);
    assert(out.byGuid.has('g-almond') && !out.menusForbidden && !out.menusStale, `${label}: retry recovers menu`);
    assert(f.calls.length === 3 && sleeps.length === 1 && sleeps[0] === 750, `${label}: one retry after 750ms backoff`);
    assert(cache.get(R)?.byGuid.has('g-almond'), `${label}: good menu cached`);
    const f2 = fakeFetch([]);
    await mod.loadMenuLookupWith({ fetch: f2.fn, cache, sleep, now }, 't', R);
    assert(f2.calls.length === 0, `${label}: fresh cache served without calling Toast`);
  }

  // 2. 429 every time, nothing cached: empty result, NOT cached, next call tries again.
  {
    sleeps.length = 0;
    const cache = new Map();
    const f = fakeFetch([{ status: 429, retryAfter: '30' }, { status: 429, retryAfter: '30' }, { status: 429 }, { status: 429 }]);
    const out = await mod.loadMenuLookupWith({ fetch: f.fn, cache, sleep, now }, 't', R);
    assert(out.byGuid.size === 0 && !out.menusForbidden, `${label}: empty lookup when Toast is rate limited`);
    assert(f.calls.length === 4, `${label}: exactly one retry round (4 calls), got ${f.calls.length}`);
    assert(sleeps.join(',') === '2000', `${label}: Retry-After honoured and capped at 2s, got ${sleeps}`);
    assert(!cache.has(R), `${label}: failed menu must not be cached`);
    const f2 = fakeFetch([{ status: 200, body: GOOD_MENU }]);
    const next = await mod.loadMenuLookupWith({ fetch: f2.fn, cache, sleep, now }, 't', R);
    assert(f2.calls.length === 1 && next.byGuid.has('g-almond'), `${label}: next request refetches and recovers immediately`);
  }

  // 3. Last good menu is past its TTL and Toast 429s: serve the stale menu, keep it stale.
  {
    sleeps.length = 0;
    const cache = new Map();
    await mod.loadMenuLookupWith({ fetch: fakeFetch([{ status: 200, body: GOOD_MENU }]).fn, cache, sleep, now }, 't', R);
    const firstExpiry = cache.get(R).expires;
    clock += 16 * 60 * 1000;
    const f = fakeFetch([{ status: 429 }, { status: 503 }, { status: 429 }, { status: 429 }]);
    const out = await mod.loadMenuLookupWith({ fetch: f.fn, cache, sleep, now }, 't', R);
    assert(out.byGuid.has('g-almond') && out.menusStale === true, `${label}: falls back to last good menu`);
    assert(cache.get(R).expires === firstExpiry, `${label}: stale fallback must not extend the cache`);
    const f2 = fakeFetch([{ status: 200, body: OTHER_MENU }]);
    const next = await mod.loadMenuLookupWith({ fetch: f2.fn, cache, sleep, now }, 't', R);
    assert(f2.calls.length === 1 && next.byGuid.has('g-kolache') && !next.menusStale, `${label}: next good fetch replaces stale menu`);
  }

  // 4. 200 with an empty menu, or bad JSON: never cached; falls through to v3.
  {
    const cache = new Map();
    const f = fakeFetch([{ status: 200, body: { menus: [] } }, { status: 200, body: null }, { status: 200, body: {} }, { status: 200, body: GOOD_MENU }]);
    const out = await mod.loadMenuLookupWith({ fetch: f.fn, cache, sleep, now }, 't', R);
    assert(out.byGuid.has('g-almond') && f.calls.length === 4, `${label}: empty menus skipped until a real one`);
    const cache2 = new Map();
    const out2 = await mod.loadMenuLookupWith({ fetch: fakeFetch([{ status: 200, body: { menus: [] } }]).fn, cache: cache2, sleep, now }, 't', R);
    assert(out2.byGuid.size === 0 && !cache2.has(R), `${label}: empty menu not cached`);
  }

  // 5. 403 stays menusForbidden, no retry, not cached.
  {
    sleeps.length = 0;
    const cache = new Map();
    const f = fakeFetch([{ status: 403 }]);
    const out = await mod.loadMenuLookupWith({ fetch: f.fn, cache, sleep, now }, 't', R);
    assert(out.menusForbidden && f.calls.length === 1 && sleeps.length === 0 && !cache.has(R), `${label}: 403 -> forbidden, no retry, no cache`);
  }

  // 6. Network error then success.
  {
    const cache = new Map();
    const f = fakeFetch(['throw', { status: 200, body: GOOD_MENU }]);
    const out = await mod.loadMenuLookupWith({ fetch: f.fn, cache, sleep, now }, 't', R);
    assert(out.byGuid.has('g-almond') && cache.has(R), `${label}: network error on v2 falls through to v3`);
  }

  console.log(`${label}: 429 retry, no empty cache, last-good fallback, 403, empty menu, network error: ok`);
}

console.warn = origWarn;
console.log('verify-menu-lookup-cache: ok');
