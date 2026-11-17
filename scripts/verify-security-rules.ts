/**
 * Firestore + Storage rules against the local emulator.
 * Run via npm run test:rules (firebase emulators:exec).
 * Does not touch the production project.
 */
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getBytes } from 'firebase/storage';

const PROJECT_ID = 'demo-boundaries-logbook';
const ORG = 'org-boundaries';

const trainee = {
  role: 'TRAINEE',
  storeId: 'store-elm',
  orgId: ORG,
  userId: 'u-elm',
};

const prosperTrainee = {
  role: 'TRAINEE',
  storeId: 'store-prosper',
  orgId: ORG,
  userId: 'u-prosper',
};

const manager = {
  role: 'MANAGER',
  storeId: 'store-elm',
  orgId: ORG,
  userId: 'u-manager',
};

const admin = {
  role: 'ADMIN',
  storeId: 'store-elm',
  orgId: ORG,
  userId: 'u-admin',
};

async function setEnforcement(env: RulesTestEnvironment, enforceAuth: boolean) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `organizations/${ORG}/config/security`), {
      enforceAuth,
    });
  });
}

async function seed(env: RulesTestEnvironment) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, `organizations/${ORG}/logbookSubmissions/sub-draft`), {
      id: 'sub-draft',
      storeId: 'store-elm',
      userId: 'u-elm',
      status: 'DRAFT',
      date: '2026-11-01',
    });
    await setDoc(doc(db, `organizations/${ORG}/logbookSubmissions/sub-done`), {
      id: 'sub-done',
      storeId: 'store-elm',
      userId: 'u-elm',
      status: 'PENDING',
      date: '2026-11-01',
    });
    await setDoc(doc(db, `organizations/${ORG}/logbookSubmissions/sub-prosper`), {
      id: 'sub-prosper',
      storeId: 'store-prosper',
      userId: 'u-prosper',
      status: 'PENDING',
      date: '2026-11-01',
    });
    await setDoc(doc(db, `organizations/${ORG}/users/u-elm`), {
      id: 'u-elm',
      email: 'elm@example.com',
      role: 'TRAINEE',
      storeId: 'store-elm',
    });
    await setDoc(doc(db, `organizations/${ORG}/data/users`), {
      data: [{ id: 'u-elm', email: 'elm@example.com' }],
    });
  });
}

async function main() {
  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
    storage: {
      rules: readFileSync(new URL('../storage.rules', import.meta.url), 'utf8'),
    },
  });

  try {
    await env.clearFirestore();
    await seed(env);

    const anon = env.unauthenticatedContext();
    await assertSucceeds(getDoc(doc(anon.firestore(), `organizations/${ORG}/data/users`)));
    await assertSucceeds(setDoc(doc(anon.firestore(), `organizations/${ORG}/data/submissions`), { data: [] }));
    await assertFails(setDoc(doc(anon.firestore(), `organizations/${ORG}/metrics/daily`), { score: 1 }));
    await assertFails(setDoc(doc(anon.firestore(), `organizations/${ORG}/config/security`), { enforceAuth: false }));

    await setEnforcement(env, false);
    await assertSucceeds(getDoc(doc(anon.firestore(), `organizations/${ORG}/data/users`)));

    await setEnforcement(env, true);
    await assertFails(getDoc(doc(anon.firestore(), `organizations/${ORG}/data/users`)));
    await assertFails(setDoc(doc(anon.firestore(), `organizations/${ORG}/data/submissions`), { data: [{ id: 'x' }] }));
    await assertFails(getDoc(doc(anon.firestore(), `organizations/${ORG}/logbookSubmissions/sub-draft`)));

    const elm = env.authenticatedContext('u-elm', trainee);
    await assertSucceeds(getDoc(doc(elm.firestore(), `organizations/${ORG}/logbookSubmissions/sub-draft`)));
    await assertFails(getDoc(doc(elm.firestore(), `organizations/${ORG}/logbookSubmissions/sub-prosper`)));
    await assertFails(setDoc(doc(elm.firestore(), `organizations/${ORG}/users/u-new`), {
      id: 'u-new', email: 'new@example.com', storeId: 'store-elm', role: 'TRAINEE',
    }));
    await assertFails(setDoc(doc(elm.firestore(), `organizations/${ORG}/data/users`), { data: [] }));
    await assertFails(setDoc(doc(elm.firestore(), `organizations/${ORG}/metrics/scorecard`), { value: 1 }));
    await assertFails(setDoc(doc(elm.firestore(), `organizations/${ORG}/scores/week`), { value: 1 }));
    await assertFails(setDoc(doc(elm.firestore(), `organizations/${ORG}/toastSnapshots/store-elm_2026-11-01`), { sales: 1 }));
    await assertSucceeds(setDoc(doc(elm.firestore(), `organizations/${ORG}/data/submissions`), { data: [{ id: 'kept' }] }));
    await assertSucceeds(updateDoc(doc(elm.firestore(), `organizations/${ORG}/logbookSubmissions/sub-draft`), {
      id: 'sub-draft',
      storeId: 'store-elm',
      userId: 'u-elm',
      status: 'DRAFT',
      date: '2026-11-01',
      note: 'still drafting',
    }));
    await assertFails(updateDoc(doc(elm.firestore(), `organizations/${ORG}/logbookSubmissions/sub-done`), {
      id: 'sub-done',
      storeId: 'store-elm',
      userId: 'u-elm',
      status: 'PENDING',
      date: '2026-11-01',
      note: 'rewrite',
    }));
    await assertFails(setDoc(doc(elm.firestore(), `organizations/${ORG}/logbookSubmissions/sub-other-store`), {
      id: 'sub-other-store',
      storeId: 'store-prosper',
      userId: 'u-elm',
      status: 'DRAFT',
    }));

    const mgr = env.authenticatedContext('u-manager', manager);
    await assertSucceeds(setDoc(doc(mgr.firestore(), `organizations/${ORG}/users/u-hire`), {
      id: 'u-hire',
      email: 'hire@example.com',
      storeId: 'store-elm',
      role: 'TRAINEE',
    }));
    await assertFails(setDoc(doc(mgr.firestore(), `organizations/${ORG}/users/u-other-store`), {
      id: 'u-other-store',
      email: 'other@example.com',
      storeId: 'store-prosper',
      role: 'TRAINEE',
    }));
    await assertSucceeds(getDoc(doc(mgr.firestore(), `organizations/${ORG}/data/users`)));

    const adm = env.authenticatedContext('u-admin', admin);
    await assertSucceeds(setDoc(doc(adm.firestore(), `organizations/${ORG}/users/u-prosper-admin`), {
      id: 'u-prosper-admin',
      email: 'padmin@example.com',
      storeId: 'store-prosper',
      role: 'TRAINEE',
    }));
    await assertSucceeds(getDoc(doc(adm.firestore(), `organizations/${ORG}/logbookSubmissions/sub-prosper`)));
    await assertFails(setDoc(doc(adm.firestore(), `organizations/${ORG}/metrics/scorecard`), { value: 9 }));

    const other = env.authenticatedContext('u-prosper', prosperTrainee);
    await assertFails(getDoc(doc(other.firestore(), `organizations/${ORG}/users/u-elm`)));

    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), `organizations/${ORG}/toastSnapshots/store-elm_2026-11-01`), {
        storeId: 'store-elm',
        businessDate: '2026-11-01',
      });
    });
    await assertSucceeds(getDoc(doc(mgr.firestore(), `organizations/${ORG}/toastSnapshots/store-elm_2026-11-01`)));
    await assertFails(getDoc(doc(elm.firestore(), `organizations/${ORG}/toastSnapshots/store-elm_2026-11-01`)));

    const photo = ref(elm.storage(), 'photos/store-elm/2026-11-17/sub-draft/task.jpg');
    await assertFails(uploadString(ref(anon.storage(), 'photos/store-elm/2026-11-17/sub-draft/task.jpg'), 'x', 'raw', { contentType: 'image/jpeg' }));
    await assertSucceeds(uploadString(photo, 'image-bytes', 'raw', { contentType: 'image/jpeg' }));
    await assertSucceeds(getBytes(photo));
    await assertFails(uploadString(ref(elm.storage(), 'photos/store-prosper/2026-11-17/sub/task.jpg'), 'x', 'raw', { contentType: 'image/jpeg' }));
    await assertSucceeds(uploadString(
      ref(mgr.storage(), 'documents/employee-handbook.pdf'),
      'pdf',
      'raw',
      { contentType: 'application/pdf' },
    ));
    await assertFails(uploadString(
      ref(elm.storage(), 'documents/employee-handbook.pdf'),
      'pdf',
      'raw',
      { contentType: 'application/pdf' },
    ));
    const handbook = ref(anon.storage(), 'documents/employee-handbook.pdf');
    await assertSucceeds(getBytes(handbook));

    console.log('verify-security-rules: OK');
  } finally {
    await env.cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
