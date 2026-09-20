import {
  authorizeNotificationInbox,
  getNotificationActorStateKey,
  prepareNotificationAuthIdentity,
  resolveNotificationRecipients,
} from '../src/utils/notificationIdentity.ts';
import {
  applyIsolatedNotificationState,
  mergeNotificationUserStateMaps,
} from '../src/utils/notificationUserState.ts';

const catalog = {
  students: [
    { id: 's1', authUid: 'uid-s1', gradeLevel: 'الصف الخامس العلمي', section: 'أ', parentId: 'p1' },
    { id: 's2', authUid: 'uid-s2', gradeLevel: 'الصف الخامس العلمي', section: 'أ', parentId: 'p2' },
    { id: 's3', authUid: 'uid-s3', gradeLevel: 'الصف الخامس العلمي', section: 'ب', parentId: 'p3' },
  ],
  parents: [
    { id: 'p1', authUid: 'uid-p1' },
    { id: 'p2', authUid: 'uid-p2' },
    { id: 'p3', authUid: undefined },
  ],
  teachers: [
    { id: 't1', authUid: 'uid-t1' },
    { id: 't2', authUid: 'uid-t2' },
  ],
  supervisors: [
    { id: 'sup-1', authUid: 'uid-sup-1' },
    { id: 'sup-2', authUid: 'uid-sup-2' },
  ],
  adminAuthUid: 'uid-admin',
};

let pass = 0;
let total = 0;
function test(name, fn) {
  total++;
  try {
    fn();
    pass++;
    console.log('PASS', name);
  } catch (err) {
    console.error('FAIL', name, err.message);
  }
}
function ok(value, message) {
  if (!value) throw new Error(message);
}

test('single student -> targetAuthUid', () => {
  const prepared = prepareNotificationAuthIdentity({ targetRole: 'student', targetStudentId: 's1' }, catalog, 'uid-admin');
  ok(prepared.ok && prepared.patch.targetAuthUid === 'uid-s1' && !prepared.patch.targetAuthUids, JSON.stringify(prepared));
});

test('multiple students -> targetAuthUids', () => {
  const prepared = prepareNotificationAuthIdentity({ targetRole: 'student', targetStudentIds: ['s1', 's2'] }, catalog, 'uid-admin');
  ok(
    prepared.ok &&
      !prepared.patch.targetAuthUid &&
      prepared.patch.targetAuthUids?.includes('uid-s1') &&
      prepared.patch.targetAuthUids?.includes('uid-s2') &&
      prepared.patch.targetAuthUids.length === 2,
    JSON.stringify(prepared)
  );
});

test('parents resolve to parent UIDs, never student UIDs', () => {
  const r = resolveNotificationRecipients(
    { targetRole: 'parent', targetStudentIds: ['s1', 's2'], targetParentIds: ['p1', 'p2'] },
    catalog
  );
  ok(r.complete && r.resolvedCount === 2 && r.uids.includes('uid-p1') && r.uids.includes('uid-p2') && !r.uids.includes('uid-s1'), JSON.stringify(r));
});

test('teachers', () => {
  const r = resolveNotificationRecipients({ targetRole: 'teacher', targetTeacherIds: ['t1', 't2'] }, catalog);
  ok(r.complete && r.resolvedCount === 2 && r.uids.includes('uid-t1') && r.uids.includes('uid-t2'), JSON.stringify(r));
});

test('supervisor', () => {
  const r = resolveNotificationRecipients({ targetRole: 'supervisor' }, catalog);
  ok(r.complete && r.uids.includes('uid-sup-1') && r.uids.includes('uid-sup-2') && r.resolvedCount === 2, JSON.stringify(r));
});

test('admin', () => {
  const prepared = prepareNotificationAuthIdentity({ targetRole: 'admin' }, catalog, 'uid-sender');
  ok(prepared.ok && prepared.patch.targetAuthUid === 'uid-admin' && prepared.patch.senderAuthUid === 'uid-sender', JSON.stringify(prepared));
});

test('grade + section', () => {
  const r = resolveNotificationRecipients(
    { targetRole: 'student', targetGradeLevel: 'الصف الخامس العلمي', targetSection: 'أ' },
    catalog
  );
  ok(r.complete && r.resolvedCount === 2 && !r.uids.includes('uid-s3'), JSON.stringify(r));
});

const completeCatalog = {
  ...catalog,
  parents: catalog.parents.filter((item) => item.authUid),
};

test('all/broadcast includes every population', () => {
  const r = resolveNotificationRecipients({ targetRole: 'all' }, completeCatalog);
  ok(
    r.complete &&
      r.uids.includes('uid-admin') &&
      r.uids.includes('uid-t1') &&
      r.uids.includes('uid-s1') &&
      r.uids.includes('uid-p1') &&
      r.uids.includes('uid-sup-1'),
    JSON.stringify(r)
  );
});

test('UID deduplication', () => {
  const r = resolveNotificationRecipients(
    { targetRole: 'student', targetStudentIds: ['s1', 's1'], targetAuthUid: 'uid-s1' },
    catalog
  );
  ok(r.complete && r.uids.filter((uid) => uid === 'uid-s1').length === 1 && r.resolvedCount === 1, JSON.stringify(r));
});

test('unresolved explicit recipient -> FAIL CLOSED', () => {
  const prepared = prepareNotificationAuthIdentity({ targetRole: 'parent', targetParentIds: ['p1', 'p3'] }, catalog, 'uid-admin');
  ok(!prepared.ok && prepared.unresolvedProfileIds.includes('p3'), JSON.stringify(prepared));
});

test('UID-targeted inbox accepts correct authUid', () => {
  ok(authorizeNotificationInbox({ targetAuthUid: 'uid-s1' }, 'uid-s1') === 'uid-allow', 'expected uid-allow');
});

test('UID-targeted inbox rejects wrong authUid even if profile/name/email would match', () => {
  const notif = { targetAuthUid: 'uid-s1', targetStudentId: 's2', targetRole: 'student' };
  ok(authorizeNotificationInbox(notif, 'uid-s2') === 'uid-deny', 'same-school student must not inherit UID inbox');
});

test('UID-less legacy notification still uses legacy compatibility', () => {
  ok(authorizeNotificationInbox({ targetRole: 'student', targetStudentId: 's1' }, 'uid-s1') === 'legacy', 'expected legacy path');
});

test('UID notification read-state key = authUid', () => {
  const key = getNotificationActorStateKey(
    { targetAuthUid: 'uid-s1' },
    { id: 's1', name: 'Same Name', role: 'student', authUid: 'uid-s1', email: 'shared@example.com' },
    's1'
  );
  ok(key === 'uid-s1', key);
});

test('legacy notification read-state key = profileId', () => {
  const key = getNotificationActorStateKey(
    { targetRole: 'student', targetStudentId: 's1' },
    { id: 's1', name: 'Same Name', role: 'student', authUid: 'uid-s1' },
    's1'
  );
  ok(key === 's1', key);
});

test('UID notification delete-state key = authUid', () => {
  const key = getNotificationActorStateKey(
    { targetAuthUids: ['uid-p1', 'uid-p2'] },
    { id: 'p1', name: 'Parent', role: 'parent', authUid: 'uid-p1', phone: '0770' },
    'p1'
  );
  ok(key === 'uid-p1', key);
});

test('legacy notification delete-state key = profileId', () => {
  const key = getNotificationActorStateKey(
    { targetRole: 'parent', targetParentId: 'p1' },
    { id: 'p1', name: 'Parent', role: 'parent', authUid: 'uid-p1' },
    'p1'
  );
  ok(key === 'p1', key);
});

test('untargeted new notification becomes school-wide UID set', () => {
  const prepared = prepareNotificationAuthIdentity({ title: 'broadcast' }, completeCatalog, 'uid-admin');
  ok(prepared.ok && prepared.patch.targetAuthUids?.includes('uid-admin') && prepared.patch.targetAuthUids.includes('uid-sup-2'), JSON.stringify(prepared));
});

test('isolated read/delete does not affect another notification', () => {
  const nA = { id: 'n-a', title: 'a', message: '', type: 'info', isRead: false, targetAuthUid: 'uid-s1' };
  const flags = applyIsolatedNotificationState(nA, 'uid-s1', {
    'n-b': { notificationId: 'n-b', isRead: true, isDeleted: true },
  });
  ok(flags.isRead === false && flags.isDeleted === false, JSON.stringify(flags));
});

test('user A isolated state does not apply to user B overlay', () => {
  const n = { id: 'n-a', title: 'a', message: '', type: 'info', isRead: false, targetAuthUid: 'uid-s1' };
  const flagsB = applyIsolatedNotificationState(n, 'uid-s2', {});
  ok(flagsB.isRead === false && flagsB.isDeleted === false, JSON.stringify(flagsB));
});

test('realtime state merge overlays without dropping notification content', () => {
  const n = { id: 'n-a', title: 'keep-me', message: 'body', type: 'info', isRead: false, targetAuthUid: 'uid-s1' };
  const flags = applyIsolatedNotificationState(n, 'uid-s1', {
    'n-a': { notificationId: 'n-a', isRead: true, isDeleted: false },
  });
  ok(n.title === 'keep-me' && flags.isRead === true && flags.isDeleted === false, JSON.stringify(flags));
});

test('session/user switch starts from empty isolated state', () => {
  const previous = { 'n-a': { notificationId: 'n-a', isRead: true, isDeleted: true } };
  const nextUser = mergeNotificationUserStateMaps({}, {});
  ok(Object.keys(nextUser).length === 0, JSON.stringify(nextUser));
  const loadedB = mergeNotificationUserStateMaps(
    { 'n-b': { notificationId: 'n-b', isRead: true, isDeleted: false } },
    {}
  );
  ok(loadedB['n-b']?.isRead === true && !loadedB['n-a'], JSON.stringify(loadedB));
  void previous;
});

console.log(`NOTIFICATION C4 TEST: ${pass}/${total} PASS`);
if (pass !== total) process.exit(1);
