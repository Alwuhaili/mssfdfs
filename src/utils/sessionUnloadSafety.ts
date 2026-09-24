export interface PersistenceWriteTracker {
  count: number;
}

export function createPersistenceWriteTracker(): PersistenceWriteTracker {
  return { count: 0 };
}

export function beginActivePersistenceWrite(tracker: PersistenceWriteTracker): void {
  tracker.count += 1;
}

export function endActivePersistenceWrite(tracker: PersistenceWriteTracker): void {
  if (tracker.count > 0) tracker.count -= 1;
}

export function activePersistenceWriteCount(tracker: PersistenceWriteTracker): number {
  return tracker.count;
}

export function shouldWarnOnBeforeUnload(input: {
  activePersistenceWrites: number;
  logoutUnloadBypass: boolean;
}): boolean {
  if (input.logoutUnloadBypass) return false;
  return input.activePersistenceWrites > 0;
}

export interface SessionAdmissionGate {
  writes: PersistenceWriteTracker;
  logoutInProgress: boolean;
  logoutUnloadBypass: boolean;
}

export function createSessionAdmissionGate(): SessionAdmissionGate {
  return {
    writes: createPersistenceWriteTracker(),
    logoutInProgress: false,
    logoutUnloadBypass: false,
  };
}

export type LogoutAdmissionResult =
  | { admitted: true }
  | { admitted: false; reason: 'already-in-progress' | 'active-write' };

export function admitAuthenticatedLogout(gate: SessionAdmissionGate): LogoutAdmissionResult {
  if (gate.logoutInProgress) {
    return { admitted: false, reason: 'already-in-progress' };
  }
  if (activePersistenceWriteCount(gate.writes) > 0) {
    return { admitted: false, reason: 'active-write' };
  }
  gate.logoutInProgress = true;
  return { admitted: true };
}

/** Returns false without incrementing if logout admission is already closed. */
export function tryBeginPersistenceWrite(gate: SessionAdmissionGate): boolean {
  if (gate.logoutInProgress) return false;
  beginActivePersistenceWrite(gate.writes);
  return true;
}

export function armLogoutUnloadBypass(gate: SessionAdmissionGate): boolean {
  if (!gate.logoutInProgress) return false;
  if (activePersistenceWriteCount(gate.writes) > 0) return false;
  gate.logoutUnloadBypass = true;
  return true;
}

/** Bypass is armed only after logout is allowed to navigate (no in-flight write). */
export function shouldArmLogoutUnloadBypass(input: {
  logoutNavigationAllowed: boolean;
  activePersistenceWrites: number;
}): boolean {
  return input.logoutNavigationAllowed && input.activePersistenceWrites <= 0;
}

export const GUEST_PRIVATE_ARRAY_KEYS = [
  'teachers',
  'students',
  'parents',
  'supervisors',
  'graduates',
  'exams',
  'submissions',
  'attendance',
  'announcements',
  'messages',
  'lectures',
  'timetable',
  'subjectQuotas',
  'financial',
  'notifications',
  'certificates',
  'academicEnrollments',
  'accelerationPolicies',
  'accelerationAttempts',
  'calendarEvents',
  'customFolders',
  'auditLogs',
  'annualPlans',
  'dailyLessonPlans',
  'examSchedules',
  'challenges',
  'deletedLectureIds',
  'deletedChallengeIds',
] as const;

export const GUEST_PRESERVED_PUBLIC_KEYS = ['schoolAdminData'] as const;

export const GUEST_PRIVATE_OBJECT_KEYS = ['userPasscodes', 'notificationUserStates'] as const;

export function purgePrivateGuestSessionMemory<T extends Record<string, any>>(state: T): T {
  const next: Record<string, any> = { ...state };
  for (const key of GUEST_PRIVATE_ARRAY_KEYS) {
    next[key] = [];
  }
  next.userPasscodes = {};
  next.notificationUserStates = {};
  return next as T;
}

export function applyCanonicalGuestMemoryPurge<T extends Record<string, any>>(state: T): T {
  const next = purgePrivateGuestSessionMemory(state);
  next.activeTakingExam = null;
  return next;
}
