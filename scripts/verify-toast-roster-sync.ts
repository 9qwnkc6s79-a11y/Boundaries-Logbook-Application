/**
 * Smoke: Toast is the source of truth for who is active (except Daniel).
 * Failed / empty / junk-only pulls must not deactivate anyone.
 * Run: npx --yes tsx scripts/verify-toast-roster-sync.ts
 */
import { MOCK_USERS } from '../data/mockData.ts';
import { ToastSyncEmployee, User, UserRole } from '../types.ts';
import { isActiveUser, storeRosterUsers, userOnStore } from '../utils/performanceReviews.ts';
import {
  DANIEL_EMAIL,
  DANIEL_USER_ID,
  buildToastSyncedUser,
  decideToastRosterSync,
  findExistingUserForToastEmployee,
  isJunkToastEmployee,
  isProtectedOwner,
  resolvedToastEmail,
} from '../utils/toastRosterSync.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function user(partial: Partial<User> & Pick<User, 'id' | 'name' | 'email' | 'role' | 'storeId'>): User {
  return { ...partial };
}

function emp(partial: Partial<ToastSyncEmployee> & Pick<ToastSyncEmployee, 'guid' | 'name' | 'storeId'>): ToastSyncEmployee {
  const [firstName, ...rest] = (partial.name || '').split(' ');
  return {
    firstName: partial.firstName ?? firstName ?? '',
    lastName: partial.lastName ?? rest.join(' '),
    email: partial.email ?? '',
    phone: '',
    jobTitle: 'Barista',
    location: partial.storeId === 'store-prosper' ? 'prosper' : 'littleelm',
    externalId: '',
    deleted: false,
    ...partial,
  };
}

const daniel = user({
  id: DANIEL_USER_ID,
  name: 'Daniel',
  email: 'Daniel@boundariescoffee.com',
  role: UserRole.ADMIN,
  storeId: 'store-elm',
});
const kate = user({
  id: 'u-admin-2',
  name: 'Kate',
  email: 'Kate@BoundariesCoffee.com',
  role: UserRole.ADMIN,
  storeId: 'store-prosper',
});
const itzel = user({
  id: 'u-itzel-1',
  name: 'Itzel Garcia',
  email: 'itzelgarcia120101@gmail.com',
  role: UserRole.TRAINEE,
  storeId: 'store-elm',
  mustChangePassword: true,
});
const heath = user({
  id: 'u-heath',
  name: 'Heath',
  email: 'heath@boundariescoffee.com',
  role: UserRole.MANAGER,
  storeId: 'store-elm',
  toastEmployeeGuid: 'guid-heath',
});
const leftoverNoStore = user({
  id: 'u-ghost',
  name: 'Ghost',
  email: 'ghost@example.com',
  role: UserRole.TRAINEE,
  storeId: '',
});

const toastHeath = emp({
  guid: 'guid-heath',
  name: 'Heath',
  firstName: 'Heath',
  lastName: 'Smith',
  email: 'heath@boundariescoffee.com',
  storeId: 'store-elm',
});
const toastRafael = emp({
  guid: 'guid-rafael',
  name: 'Rafael',
  firstName: 'Rafael',
  lastName: 'Garcia',
  email: '',
  storeId: 'store-prosper',
});
const toastDaniel = emp({
  guid: 'guid-daniel',
  name: 'Daniel',
  firstName: 'Daniel',
  lastName: 'Keene',
  email: 'Daniel@boundariescoffee.com',
  storeId: 'store-elm',
});

assert(MOCK_USERS.length === 1, 'MOCK_USERS must be Daniel only');
assert(MOCK_USERS[0].id === DANIEL_USER_ID, 'seed must keep u-admin-1');
assert(MOCK_USERS[0].email.toLowerCase() === DANIEL_EMAIL, 'seed must keep Daniel email');
assert(!MOCK_USERS.some(u => /kate/i.test(u.name) || /kate@/i.test(u.email)), 'Kate must not be a seed');
assert(!MOCK_USERS.some(u => /itzel/i.test(u.name) || /itzelgarcia/i.test(u.email)), 'Itzel must not be a seed');

assert(isProtectedOwner(daniel), 'Daniel id is protected');
assert(isProtectedOwner({ id: 'other', email: 'DANIEL@BOUNDARIESCOFFEE.COM' }), 'Daniel email is protected case-insensitively');
assert(!isProtectedOwner(kate), 'Kate is not protected');

assert(isJunkToastEmployee(emp({ guid: '1', name: 'Default', storeId: 'store-elm' })), 'Default is junk');
assert(isJunkToastEmployee(emp({ guid: '2', name: 'TDS', storeId: 'store-elm' })), 'TDS is junk');
assert(isJunkToastEmployee(emp({ guid: '3', name: 'Test', storeId: 'store-elm' })), 'Test is junk');
assert(isJunkToastEmployee(emp({ guid: '4', name: 'Training', storeId: 'store-elm' })), 'Training is junk');
assert(
  isJunkToastEmployee(emp({ guid: '5', name: 'Bot', email: 'bot@toasttab.com', storeId: 'store-elm' })),
  '@toasttab.com is junk'
);
assert(isJunkToastEmployee(emp({ guid: '6', name: 'Gone', deleted: true, storeId: 'store-elm' })), 'deleted is junk');
assert(!isJunkToastEmployee(toastHeath), 'real employee is not junk');

assert(resolvedToastEmail(toastRafael) === 'rafael.garcia@boundariescoffee.com', 'firstname.lastname fallback');
assert(resolvedToastEmail(toastDaniel) === 'daniel@boundariescoffee.com', 'explicit email wins');

assert(decideToastRosterSync([daniel, kate, itzel], null).kind === 'skip-empty', 'null Toast list is skip');
assert(decideToastRosterSync([daniel, kate, itzel], []).kind === 'skip-empty', 'empty Toast list is skip');
assert(
  decideToastRosterSync([daniel, kate, itzel], [
    emp({ guid: 'j1', name: 'Default', storeId: 'store-elm' }),
    emp({ guid: 'j2', name: 'TDS', storeId: 'store-prosper' }),
  ]).kind === 'skip-empty',
  'junk-only list is skip — do not empty the roster'
);

const users = [daniel, kate, itzel, heath, leftoverNoStore];
const bothStores = [toastHeath, toastRafael, toastDaniel];
const apply = decideToastRosterSync(users, bothStores);
assert(apply.kind === 'apply', 'successful two-store pull applies');
if (apply.kind !== 'apply') throw new Error('unreachable');

assert(apply.deactivate.some(u => u.id === kate.id), 'Kate leftover seed is deactivated');
assert(apply.deactivate.some(u => u.id === itzel.id), 'Itzel leftover seed is deactivated');
assert(apply.deactivate.some(u => u.id === leftoverNoStore.id), 'unassigned leftover is deactivated on a full pull');
assert(!apply.deactivate.some(u => u.id === daniel.id), 'never deactivate Daniel');
assert(!apply.deactivate.some(u => u.id === heath.id), 'current Toast employee stays active');
assert(apply.create.length === 1 && apply.create[0].email === 'rafael.garcia@boundariescoffee.com', 'new Toast person is created');
assert(apply.link.some(l => l.user.id === daniel.id && l.guid === 'guid-daniel'), 'link GUID onto existing Daniel instead of duplicating');
assert(!apply.create.some(c => c.email === 'daniel@boundariescoffee.com'), 'do not create a second Daniel');

const rafaelExisting = user({
  id: 'u-rafael',
  name: 'Rafael Garcia',
  email: 'rafael.garcia@boundariescoffee.com',
  role: UserRole.MANAGER,
  storeId: 'store-prosper',
});
const linkInstead = decideToastRosterSync([daniel, rafaelExisting], [toastRafael, toastDaniel]);
assert(linkInstead.kind === 'apply', 'email fallback match applies');
if (linkInstead.kind === 'apply') {
  assert(linkInstead.create.length === 0, 'email fallback must not create a duplicate');
  assert(
    linkInstead.link.some(l => l.user.id === rafaelExisting.id && l.guid === 'guid-rafael'),
    'email fallback links the Toast GUID'
  );
}

const prosperOnly = decideToastRosterSync(users, [toastRafael]);
assert(prosperOnly.kind === 'apply', 'single-store success still applies');
if (prosperOnly.kind === 'apply') {
  assert(prosperOnly.deactivate.some(u => u.id === kate.id), 'Prosper leftover is deactivated when Prosper is in the pull');
  assert(!prosperOnly.deactivate.some(u => u.id === itzel.id), 'Little Elm people stay put when that store is missing from the pull');
  assert(!prosperOnly.deactivate.some(u => u.id === leftoverNoStore.id), 'unassigned not deactivated on a single-store pull');
  assert(!prosperOnly.deactivate.some(u => u.id === daniel.id), 'Daniel stays on a partial pull');
}

const alreadyOff = { ...itzel, active: false };
const noRepeat = decideToastRosterSync([daniel, alreadyOff, heath], [toastHeath, toastDaniel]);
assert(noRepeat.kind === 'apply', 'already-inactive still applies');
if (noRepeat.kind === 'apply') {
  assert(!noRepeat.deactivate.some(u => u.id === alreadyOff.id), 'do not rewrite an already-inactive row');
}

const returning = { ...kate, active: false, toastEmployeeGuid: 'guid-kate' };
const toastKate = emp({
  guid: 'guid-kate',
  name: 'Kate',
  firstName: 'Kate',
  lastName: 'M',
  email: 'Kate@BoundariesCoffee.com',
  storeId: 'store-prosper',
});
const back = decideToastRosterSync([daniel, returning], [toastKate, toastDaniel]);
assert(back.kind === 'apply', 'returnee applies');
if (back.kind === 'apply') {
  assert(back.reactivate.some(u => u.id === returning.id), 'Toast returnee is reactivated');
  assert(!back.deactivate.some(u => u.id === returning.id), 'returnee is not deactivated');
  assert(back.create.length === 0, 'returnee is not duplicated');
}

const created = buildToastSyncedUser(toastRafael, 'rafael.garcia@boundariescoffee.com', 'hashed', 'org-1');
assert(created.id === 'toast-guid-rafael', 'new id is toast-guid');
assert(created.active === true, 'new Toast user is active');
assert(created.role === UserRole.TRAINEE, 'new Toast user starts as TRAINEE');
assert(created.toastEmployeeGuid === 'guid-rafael', 'new user stores GUID');

assert(findExistingUserForToastEmployee([heath], toastHeath)?.id === heath.id, 'match by GUID first');
assert(
  findExistingUserForToastEmployee([rafaelExisting], toastRafael)?.id === rafaelExisting.id,
  'then match by fallback email'
);

assert(isActiveUser(daniel) && !isActiveUser({ ...kate, active: false }), 'isActiveUser is active !== false');
assert(userOnStore(heath, 'store-elm') && !userOnStore(heath, 'store-prosper'), 'userOnStore is exact store');
assert(!userOnStore(leftoverNoStore, 'store-elm'), 'unassigned is not on every store');
const roster = storeRosterUsers([daniel, kate, { ...itzel, active: false }, leftoverNoStore], 'store-elm');
assert(roster.length === 1 && roster[0].id === daniel.id, 'store roster hides inactive and unassigned');
assert(
  storeRosterUsers([daniel, kate], 'store-prosper').every(u => u.id === kate.id),
  'Prosper roster does not include Little Elm Daniel'
);

console.log('verify-toast-roster-sync: ok');
