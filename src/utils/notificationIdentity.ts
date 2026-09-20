import type { CurrentUser, NotificationItem, UserRole } from '../types';

export type NotificationIdentityProfile = {
  id: string;
  authUid?: string;
  gradeLevel?: string;
  section?: string;
};

export type NotificationIdentityCatalog = {
  teachers: NotificationIdentityProfile[];
  students: NotificationIdentityProfile[];
  parents: NotificationIdentityProfile[];
  supervisors: NotificationIdentityProfile[];
  adminAuthUid?: string;
};

export type NotificationRecipientResolution = {
  uids: string[];
  expectedCount: number;
  resolvedCount: number;
  unresolvedProfileIds: string[];
  complete: boolean;
};

const trimUid = (value?: string): string => (typeof value === 'string' ? value.trim() : '');

export const notificationHasAuthUidTargeting = (
  notif: Pick<NotificationItem, 'targetAuthUid' | 'targetAuthUids'> | Partial<NotificationItem>
): boolean => {
  if (trimUid(notif.targetAuthUid)) return true;
  return Array.isArray(notif.targetAuthUids) && notif.targetAuthUids.some((uid) => Boolean(trimUid(uid)));
};

export const collectNotificationTargetAuthUids = (
  notif: Pick<NotificationItem, 'targetAuthUid' | 'targetAuthUids'> | Partial<NotificationItem>
): string[] => {
  const uids = new Set<string>();
  const single = trimUid(notif.targetAuthUid);
  if (single) uids.add(single);
  for (const uid of notif.targetAuthUids || []) {
    const next = trimUid(uid);
    if (next) uids.add(next);
  }
  return [...uids];
};

export const resolveNotificationProfileAuthUid = (
  profileId: string | undefined,
  targetRole: UserRole,
  catalog: NotificationIdentityCatalog
): string | undefined => {
  if (!profileId) return undefined;
  if (targetRole === 'teacher') return trimUid(catalog.teachers.find((item) => item.id === profileId)?.authUid) || undefined;
  if (targetRole === 'student') return trimUid(catalog.students.find((item) => item.id === profileId)?.authUid) || undefined;
  if (targetRole === 'parent') return trimUid(catalog.parents.find((item) => item.id === profileId)?.authUid) || undefined;
  if (targetRole === 'supervisor') return trimUid(catalog.supervisors.find((item) => item.id === profileId)?.authUid) || undefined;
  if (targetRole === 'admin') {
    if (profileId === 'admin-main' || profileId === 'admin') return trimUid(catalog.adminAuthUid) || undefined;
    return undefined;
  }
  return undefined;
};

const resolveAdminAuthUid = (catalog: NotificationIdentityCatalog): string | undefined =>
  trimUid(catalog.adminAuthUid) || undefined;

export const resolveNotificationRecipients = (
  notifData: Partial<NotificationItem>,
  catalog: NotificationIdentityCatalog
): NotificationRecipientResolution => {
  const uids = new Set<string>();
  const unresolvedProfileIds = new Set<string>();
  let expectedCount = 0;

  const addUid = (uid?: string) => {
    const next = trimUid(uid);
    if (next) uids.add(next);
  };

  const addProfile = (id: string | undefined, targetRole: UserRole) => {
    if (!id) return;
    expectedCount += 1;
    const uid = resolveNotificationProfileAuthUid(id, targetRole, catalog);
    if (uid) addUid(uid);
    else unresolvedProfileIds.add(id);
  };

  const addPopulation = (role: UserRole, items: NotificationIdentityProfile[]) => {
    if (role === 'admin') {
      expectedCount += 1;
      const uid = resolveAdminAuthUid(catalog);
      if (uid) addUid(uid);
      else unresolvedProfileIds.add('admin');
      return;
    }
    items.forEach((item) => addProfile(item.id, role));
  };

  addUid(notifData.targetAuthUid);
  (notifData.targetAuthUids || []).forEach(addUid);

  const targetUserId = typeof notifData.targetUserId === 'string' ? notifData.targetUserId : '';
  if (targetUserId === 'broadcast-all' || targetUserId === 'all') {
    addPopulation('admin', []);
    addPopulation('teacher', catalog.teachers);
    addPopulation('student', catalog.students);
    addPopulation('parent', catalog.parents);
    addPopulation('supervisor', catalog.supervisors);
  } else if (targetUserId === 'broadcast-all-teachers') {
    addPopulation('teacher', catalog.teachers);
  } else if (targetUserId === 'broadcast-all-students') {
    addPopulation('student', catalog.students);
  } else if (targetUserId === 'broadcast-all-parents') {
    addPopulation('parent', catalog.parents);
  } else if (notifData.targetRole === 'parent' && (notifData.targetParentId || notifData.targetParentIds?.length)) {
    addProfile(notifData.targetParentId, 'parent');
    (notifData.targetParentIds || []).forEach((id) => addProfile(id, 'parent'));
  } else if (notifData.targetRole === 'student' && (notifData.targetStudentId || notifData.targetStudentIds?.length)) {
    addProfile(notifData.targetStudentId, 'student');
    (notifData.targetStudentIds || []).forEach((id) => addProfile(id, 'student'));
  } else if (notifData.targetRole === 'teacher' && (notifData.targetTeacherId || notifData.targetTeacherIds?.length)) {
    addProfile(notifData.targetTeacherId, 'teacher');
    (notifData.targetTeacherIds || []).forEach((id) => addProfile(id, 'teacher'));
  } else if (notifData.targetUserIds?.length && notifData.targetRole && notifData.targetRole !== 'all' && notifData.targetRole !== 'guest') {
    notifData.targetUserIds.forEach((id) => addProfile(id, notifData.targetRole as UserRole));
  } else if (targetUserId && notifData.targetRole && notifData.targetRole !== 'all' && notifData.targetRole !== 'guest') {
    addProfile(targetUserId, notifData.targetRole);
  } else if (notifData.targetRole === 'student' && notifData.targetGradeLevel) {
    const targets = catalog.students.filter(
      (item) =>
        (notifData.targetGradeLevel === 'الكل' || item.gradeLevel === notifData.targetGradeLevel) &&
        (notifData.targetSection === 'الكل' || !notifData.targetSection || item.section === notifData.targetSection)
    );
    targets.forEach((item) => addProfile(item.id, 'student'));
  } else if (notifData.targetRole === 'all') {
    addPopulation('admin', []);
    addPopulation('teacher', catalog.teachers);
    addPopulation('student', catalog.students);
    addPopulation('parent', catalog.parents);
    addPopulation('supervisor', catalog.supervisors);
  } else if (notifData.targetRole === 'student') {
    catalog.students.forEach((item) => addProfile(item.id, 'student'));
  } else if (notifData.targetRole === 'parent') {
    catalog.parents.forEach((item) => addProfile(item.id, 'parent'));
  } else if (notifData.targetRole === 'teacher') {
    catalog.teachers.forEach((item) => addProfile(item.id, 'teacher'));
  } else if (notifData.targetRole === 'supervisor') {
    catalog.supervisors.forEach((item) => addProfile(item.id, 'supervisor'));
  } else if (notifData.targetRole === 'admin') {
    addPopulation('admin', []);
  } else if (targetUserId) {
    const role = notifData.targetRole;
    if (role && role !== 'all' && role !== 'guest') addProfile(targetUserId, role);
    else {
      expectedCount += 1;
      const uid =
        resolveNotificationProfileAuthUid(targetUserId, 'teacher', catalog) ||
        resolveNotificationProfileAuthUid(targetUserId, 'student', catalog) ||
        resolveNotificationProfileAuthUid(targetUserId, 'parent', catalog) ||
        resolveNotificationProfileAuthUid(targetUserId, 'supervisor', catalog) ||
        resolveNotificationProfileAuthUid(targetUserId, 'admin', catalog);
      if (uid) addUid(uid);
      else unresolvedProfileIds.add(targetUserId);
    }
  }

  const resolvedUids = [...uids];
  return {
    uids: resolvedUids,
    expectedCount,
    resolvedCount: resolvedUids.length,
    unresolvedProfileIds: [...unresolvedProfileIds],
    complete: unresolvedProfileIds.size === 0 && resolvedUids.length > 0,
  };
};

export const authorizeNotificationInbox = (
  notif: Pick<NotificationItem, 'targetAuthUid' | 'targetAuthUids'>,
  authUid: string | undefined
): 'uid-allow' | 'uid-deny' | 'legacy' => {
  if (!notificationHasAuthUidTargeting(notif)) return 'legacy';
  return notificationVisibleToAuthUid(notif, authUid) ? 'uid-allow' : 'uid-deny';
};

export const notificationVisibleToAuthUid = (
  notif: Pick<NotificationItem, 'targetAuthUid' | 'targetAuthUids'>,
  authUid: string | undefined
): boolean => {
  const uid = trimUid(authUid);
  if (!uid || !notificationHasAuthUidTargeting(notif)) return false;
  return collectNotificationTargetAuthUids(notif).includes(uid);
};

export const getNotificationActorStateKey = (
  notif: Pick<NotificationItem, 'targetAuthUid' | 'targetAuthUids'>,
  currentUser: CurrentUser | null | undefined,
  legacyProfileId: string
): string => {
  if (notificationHasAuthUidTargeting(notif)) return trimUid(currentUser?.authUid);
  return legacyProfileId || '';
};

export const prepareNotificationAuthIdentity = (
  notifData: Partial<NotificationItem>,
  catalog: NotificationIdentityCatalog,
  senderAuthUid?: string
):
  | { ok: true; patch: { senderAuthUid?: string; targetAuthUid?: string; targetAuthUids?: string[] } }
  | { ok: false; reason: string; unresolvedProfileIds: string[]; resolution: NotificationRecipientResolution } => {
  const dataForResolve: Partial<NotificationItem> = { ...notifData };
  const hasExplicitTarget =
    Boolean(dataForResolve.targetRole) ||
    Boolean(trimUid(dataForResolve.targetUserId)) ||
    Boolean(dataForResolve.targetUserIds?.length) ||
    Boolean(dataForResolve.targetStudentId) ||
    Boolean(dataForResolve.targetStudentIds?.length) ||
    Boolean(dataForResolve.targetParentId) ||
    Boolean(dataForResolve.targetParentIds?.length) ||
    Boolean(dataForResolve.targetTeacherId) ||
    Boolean(dataForResolve.targetTeacherIds?.length) ||
    Boolean(dataForResolve.targetGradeLevel) ||
    notificationHasAuthUidTargeting(dataForResolve);

  if (!hasExplicitTarget) dataForResolve.targetRole = 'all';

  const resolution = resolveNotificationRecipients(dataForResolve, catalog);
  if (!resolution.complete) {
    return {
      ok: false,
      reason: `SECURITY_NOTIFICATION_AUTH_UID_FAIL_CLOSED unresolved=${resolution.unresolvedProfileIds.join(',') || 'none'} resolved=${resolution.resolvedCount}`,
      unresolvedProfileIds: resolution.unresolvedProfileIds,
      resolution,
    };
  }

  const sender = trimUid(senderAuthUid) || trimUid(notifData.senderAuthUid) || undefined;
  const patch: { senderAuthUid?: string; targetAuthUid?: string; targetAuthUids?: string[] } = {};
  if (sender) patch.senderAuthUid = sender;
  if (resolution.uids.length === 1) patch.targetAuthUid = resolution.uids[0];
  else patch.targetAuthUids = resolution.uids;
  return { ok: true, patch };
};
