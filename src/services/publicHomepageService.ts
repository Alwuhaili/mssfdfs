// HOME-004_006_PUBLIC_HOMEPAGE_V1
// Dedicated public homepage document. Guests may read; only admin writes.

import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  PUBLIC_HOMEPAGE_COLLECTION,
  PUBLIC_HOMEPAGE_DOC_ID,
  PublicGalleryItem,
  PublicHomepageDocument,
  PublicNewsItem,
  PublicSchoolInfo,
  assertNoForbiddenPublicFields,
  buildPublicSchoolInfo,
  decidePublicSchoolInfoInitialization,
  parsePublicHomepageDocument,
  sanitizePublicGalleryList,
  sanitizePublicNewsList,
  type PublicSchoolInfoInitDecision,
} from '../utils/publicHomepageProjection';
import {
  buildPublicHonorBoard,
  decidePublicFacultyInitialization,
  decidePublicHonorInitialization,
  sanitizePublicFacultyList,
  sanitizePublicHonorBoard,
  type PublicListInitDecision,
} from '../utils/publicHomepageFacultyHonor';

export type PublicHomepageSnapshot = {
  exists: boolean;
  raw: Record<string, any> | null;
  data: PublicHomepageDocument | null;
};

const homepageRef = () => doc(db, PUBLIC_HOMEPAGE_COLLECTION, PUBLIC_HOMEPAGE_DOC_ID);

const stamp = () => new Date().toISOString();

function assertPublishable(payload: Record<string, any>) {
  const forbidden = assertNoForbiddenPublicFields(payload);
  if (forbidden.length > 0) {
    throw new Error(`[PUBLIC_HOMEPAGE] Refused to publish private fields: ${forbidden.join(', ')}`);
  }
}

export function subscribePublicHomepage(
  onNext: (snapshot: PublicHomepageSnapshot) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    homepageRef(),
    (snap) => {
      if (!snap.exists()) {
        onNext({ exists: false, raw: null, data: null });
        return;
      }
      const raw = snap.data() as Record<string, any>;
      onNext({
        exists: true,
        raw,
        data: parsePublicHomepageDocument(raw),
      });
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  );
}

export async function publishPublicSchoolInfo(source: Record<string, any>): Promise<boolean> {
  const schoolInfo: PublicSchoolInfo = buildPublicSchoolInfo(source);
  const payload = { schoolInfo, updatedAt: stamp() };
  assertPublishable(payload);
  try {
    await setDoc(homepageRef(), payload, { merge: true });
    return true;
  } catch (err) {
    console.error('[PUBLIC_HOMEPAGE] Failed to publish schoolInfo:', err);
    return false;
  }
}

export async function publishPublicNews(list: PublicNewsItem[]): Promise<boolean> {
  const payload = { news: sanitizePublicNewsList(list), updatedAt: stamp() };
  assertPublishable(payload);
  try {
    await setDoc(homepageRef(), payload, { merge: true });
    return true;
  } catch (err) {
    console.error('[PUBLIC_HOMEPAGE] Failed to publish news:', err);
    return false;
  }
}

export async function fetchPublicHomepageOnce(): Promise<PublicHomepageSnapshot> {
  const snap = await getDoc(homepageRef());
  if (!snap.exists()) {
    return { exists: false, raw: null, data: null };
  }
  const raw = snap.data() as Record<string, any>;
  return {
    exists: true,
    raw,
    data: parsePublicHomepageDocument(raw),
  };
}

export async function initializePublicSchoolInfoFromAuthoritative(input: {
  authenticated: boolean;
  role?: string | null;
  currentUserRole?: string | null;
  hydrated: boolean;
  authoritativeReceived: boolean;
  pendingSchoolAdminWrite?: boolean;
  schoolAdminData: Record<string, any> | null | undefined;
  initialSchoolAdminData: Record<string, any>;
}): Promise<{ written: boolean; reason: string; decision: PublicSchoolInfoInitDecision }> {
  const preflight = decidePublicSchoolInfoInitialization({
    ...input,
    publicExists: false,
    publicSchoolInfo: null,
  });
  if (
    !preflight.shouldWrite &&
    preflight.reason !== 'missing-or-incomplete'
  ) {
    return { written: false, reason: preflight.reason, decision: preflight };
  }

  let publicExists = false;
  let publicSchoolInfo = null as ReturnType<typeof parsePublicHomepageDocument>['schoolInfo'] | null;
  try {
    const current = await fetchPublicHomepageOnce();
    publicExists = current.exists;
    publicSchoolInfo = current.data?.schoolInfo || null;
  } catch (err) {
    console.error('[PUBLIC_HOMEPAGE] Failed to read homepage before init:', err);
    return {
      written: false,
      reason: 'public-read-failed',
      decision: { shouldWrite: false, reason: 'public-read-failed' },
    };
  }

  const decision = decidePublicSchoolInfoInitialization({
    ...input,
    publicExists,
    publicSchoolInfo,
  });
  if (!decision.shouldWrite) {
    return { written: false, reason: decision.reason, decision };
  }
  const ok = await publishPublicSchoolInfo(input.schoolAdminData || {});
  return { written: ok, reason: ok ? decision.reason : 'publish-failed', decision };
}

export async function publishPublicGallery(list: PublicGalleryItem[]): Promise<boolean> {
  const payload = { gallery: sanitizePublicGalleryList(list), updatedAt: stamp() };
  assertPublishable(payload);
  try {
    await setDoc(homepageRef(), payload, { merge: true });
    return true;
  } catch (err) {
    console.error('[PUBLIC_HOMEPAGE] Failed to publish gallery:', err);
    return false;
  }
}

export async function publishPublicFaculty(teachers: unknown): Promise<boolean> {
  const payload = { faculty: sanitizePublicFacultyList(teachers), updatedAt: stamp() };
  assertPublishable(payload);
  try {
    await setDoc(homepageRef(), payload, { merge: true });
    return true;
  } catch (err) {
    console.error('[PUBLIC_HOMEPAGE] Failed to publish faculty:', err);
    return false;
  }
}

export async function publishPublicHonorBoard(entries: unknown): Promise<boolean> {
  const payload = { honorBoard: sanitizePublicHonorBoard(entries), updatedAt: stamp() };
  assertPublishable(payload);
  try {
    await setDoc(homepageRef(), payload, { merge: true });
    return true;
  } catch (err) {
    console.error('[PUBLIC_HOMEPAGE] Failed to publish honorBoard:', err);
    return false;
  }
}

export async function initializePublicFacultyFromAuthoritative(input: {
  authenticated: boolean;
  role?: string | null;
  currentUserRole?: string | null;
  hydrated: boolean;
  authoritativeReceived: boolean;
  teachers: unknown;
  initialTeachers: unknown;
}): Promise<{ written: boolean; reason: string; decision: PublicListInitDecision }> {
  const preflight = decidePublicFacultyInitialization({
    ...input,
    publicExists: false,
    publicFaculty: [],
  });
  if (!preflight.shouldWrite && preflight.reason !== 'missing-or-incomplete') {
    return { written: false, reason: preflight.reason, decision: preflight };
  }
  try {
    const current = await fetchPublicHomepageOnce();
    const decision = decidePublicFacultyInitialization({
      ...input,
      publicExists: current.exists,
      publicFaculty: current.data?.faculty,
    });
    if (!decision.shouldWrite) return { written: false, reason: decision.reason, decision };
    const ok = await publishPublicFaculty(input.teachers);
    return { written: ok, reason: ok ? decision.reason : 'publish-failed', decision };
  } catch (err) {
    console.error('[PUBLIC_HOMEPAGE] Faculty init failed:', err);
    return { written: false, reason: 'public-read-failed', decision: { shouldWrite: false, reason: 'public-read-failed' } };
  }
}

export async function initializePublicHonorBoardFromAuthoritative(input: {
  authenticated: boolean;
  role?: string | null;
  currentUserRole?: string | null;
  hydrated: boolean;
  authoritativeReceived: boolean;
  students: unknown;
  graduates: unknown;
  honorRollDemo?: unknown;
}): Promise<{ written: boolean; reason: string; decision: PublicListInitDecision }> {
  const preflight = decidePublicHonorInitialization({
    ...input,
    publicExists: false,
    publicHonorBoard: [],
  });
  if (!preflight.shouldWrite && preflight.reason !== 'missing-or-incomplete') {
    return { written: false, reason: preflight.reason, decision: preflight };
  }
  try {
    const current = await fetchPublicHomepageOnce();
    const decision = decidePublicHonorInitialization({
      ...input,
      publicExists: current.exists,
      publicHonorBoard: current.data?.honorBoard,
    });
    if (!decision.shouldWrite) return { written: false, reason: decision.reason, decision };
    const ok = await publishPublicHonorBoard(buildPublicHonorBoard(input.students, input.graduates));
    return { written: ok, reason: ok ? decision.reason : 'publish-failed', decision };
  } catch (err) {
    console.error('[PUBLIC_HOMEPAGE] Honor init failed:', err);
    return { written: false, reason: 'public-read-failed', decision: { shouldWrite: false, reason: 'public-read-failed' } };
  }
}
