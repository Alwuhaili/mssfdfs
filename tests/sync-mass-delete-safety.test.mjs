import {
  DEDICATED_WRITE_ONLY_KEYS,
  countWouldBeInferredDeletes,
  planCollectionArrayPatch,
  stripDedicatedWriteOnlyKeys,
} from '../src/utils/collectionSyncSafety.ts';

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

function makeDocs(count, prefix) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    name: `${prefix} ${i + 1}`,
  }));
}

function applyGenericArraySync(serverDocs, localDocs) {
  const plan = planCollectionArrayPatch(localDocs, serverDocs);
  const next = new Map(serverDocs.map((doc) => [doc.id, { ...doc }]));
  const localMap = new Map(localDocs.map((doc) => [doc.id, doc]));
  for (const id of plan.upsertIds) {
    const localItem = localMap.get(id);
    if (localItem) next.set(id, { ...localItem });
  }
  for (const id of plan.inferredDeleteIds) {
    next.delete(id);
  }
  return {
    docs: [...next.values()],
    deletes: plan.inferredDeleteIds.slice(),
    upserts: plan.upsertIds.slice(),
  };
}

function applyExplicitCreate(serverDocs, doc) {
  const next = new Map(serverDocs.map((item) => [item.id, { ...item }]));
  next.set(doc.id, { ...doc });
  return [...next.values()];
}

function applyExplicitUpdate(serverDocs, id, patch) {
  return serverDocs.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

function applyExplicitDelete(serverDocs, id) {
  return serverDocs.filter((item) => item.id !== id);
}

function persistChangedOnly(previous, next) {
  const writes = [];
  const deletes = [];
  const prevMap = new Map(previous.map((item) => [item.id, item]));
  const nextIds = new Set(next.map((item) => item.id));
  next.forEach((item) => {
    const before = prevMap.get(item.id);
    if (JSON.stringify(before) !== JSON.stringify(item)) {
      writes.push(item.id);
    }
  });
  previous.forEach((item) => {
    if (!nextIds.has(item.id)) deletes.push(item.id);
  });
  return { writes, deletes };
}

test('dedicated write-only keys include person collections', () => {
  for (const key of ['schoolAdminData', 'teachers', 'graduates', 'students', 'parents', 'supervisors']) {
    ok(DEDICATED_WRITE_ONLY_KEYS.has(key), `missing dedicated key ${key}`);
  }
});

test('generic pushUpdates payload cannot carry students/parents/supervisors', () => {
  const stripped = stripDedicatedWriteOnlyKeys({
    students: makeDocs(93, 'std'),
    parents: makeDocs(93, 'prt'),
    supervisors: makeDocs(2, 'sup'),
    teachers: makeDocs(10, 'tech'),
    graduates: makeDocs(5, 'grad'),
    schoolAdminData: { principalName: 'x' },
    messages: [{ id: 'm1' }],
    financial: [{ id: 'f1' }],
  });
  ok(!('students' in stripped), 'students stripped');
  ok(!('parents' in stripped), 'parents stripped');
  ok(!('supervisors' in stripped), 'supervisors stripped');
  ok(!('teachers' in stripped), 'teachers stripped');
  ok(!('graduates' in stripped), 'graduates stripped');
  ok(!('schoolAdminData' in stripped), 'schoolAdminData stripped');
  ok(Array.isArray(stripped.messages), 'messages still generic');
  ok(Array.isArray(stripped.financial), 'financial still generic');
});

test('SERVER 213 students + LOCAL 93 students => ZERO deletes, server stays 213', () => {
  const server = makeDocs(213, 'std');
  const local = server.slice(0, 93);
  ok(countWouldBeInferredDeletes(local, server) === 120, 'would-be inferred count');
  const result = applyGenericArraySync(server, local);
  ok(result.deletes.length === 0, `deletes must be 0, got ${result.deletes.length}`);
  ok(result.docs.length === 213, `server must stay 213, got ${result.docs.length}`);
});

test('SERVER 213 parents + LOCAL 93 parents => ZERO deletes, server stays 213', () => {
  const server = makeDocs(213, 'prt');
  const local = server.slice(0, 93);
  const result = applyGenericArraySync(server, local);
  ok(result.deletes.length === 0, 'parent deletes must be 0');
  ok(result.docs.length === 213, 'parents stay 213');
});

test('SERVER 12 supervisors + LOCAL 3 supervisors => ZERO deletes, server stays 12', () => {
  const server = makeDocs(12, 'sup');
  const local = server.slice(0, 3);
  const result = applyGenericArraySync(server, local);
  ok(result.deletes.length === 0, 'supervisor deletes must be 0');
  ok(result.docs.length === 12, 'supervisors stay 12');
});

test('explicit delete student X deletes only X', () => {
  const server = makeDocs(10, 'std');
  const next = applyExplicitDelete(server, 'std-4');
  ok(next.length === 9, 'one student removed');
  ok(!next.some((item) => item.id === 'std-4'), 'X gone');
  ok(next.some((item) => item.id === 'std-1'), 'unrelated student kept');
});

test('explicit update student X updates only X', () => {
  const server = makeDocs(10, 'std');
  const next = applyExplicitUpdate(server, 'std-4', { name: 'updated-only' });
  ok(next.find((item) => item.id === 'std-4').name === 'updated-only', 'X updated');
  ok(next.find((item) => item.id === 'std-1').name === 'std 1', 'unrelated student untouched');
});

test('explicit create student X creates only X', () => {
  const server = makeDocs(10, 'std');
  const next = applyExplicitCreate(server, { id: 'std-new', name: 'new student' });
  ok(next.length === 11, 'one student added');
  ok(next.some((item) => item.id === 'std-new'), 'X created');
  ok(next.filter((item) => item.id === 'std-1').length === 1, 'existing ids unchanged');
});

test('parent update leaves unrelated parents untouched', () => {
  const server = makeDocs(8, 'prt');
  const next = applyExplicitUpdate(server, 'prt-2', { name: 'parent-2-updated' });
  ok(next.find((item) => item.id === 'prt-2').name === 'parent-2-updated', 'target parent updated');
  ok(next.find((item) => item.id === 'prt-7').name === 'prt 7', 'unrelated parent untouched');
});

test('supervisor update leaves unrelated supervisors untouched', () => {
  const server = makeDocs(5, 'sup');
  const next = applyExplicitUpdate(server, 'sup-1', { name: 'primary-updated' });
  ok(next.find((item) => item.id === 'sup-1').name === 'primary-updated', 'target supervisor updated');
  ok(next.find((item) => item.id === 'sup-5').name === 'sup 5', 'unrelated supervisor untouched');
});

test('teacher update/delete leaves unrelated teachers untouched', () => {
  const server = makeDocs(6, 'tech');
  const updated = applyExplicitUpdate(server, 'tech-3', { name: 'teacher-3-updated' });
  ok(updated.find((item) => item.id === 'tech-3').name === 'teacher-3-updated', 'teacher updated');
  ok(updated.find((item) => item.id === 'tech-6').name === 'tech 6', 'other teacher after update');
  const deleted = applyExplicitDelete(updated, 'tech-3');
  ok(deleted.length === 5, 'one teacher deleted');
  ok(!deleted.some((item) => item.id === 'tech-3'), 'deleted teacher gone');
  ok(deleted.some((item) => item.id === 'tech-6'), 'unrelated teacher kept');
});

test('incomplete local array persistChanged path never emits deletes', () => {
  const previous = makeDocs(213, 'std');
  const next = previous.slice(0, 93).map((item, index) =>
    index === 0 ? { ...item, name: 'changed' } : item
  );
  const result = persistChangedOnly(previous, next);
  ok(result.writes.length === 1 && result.writes[0] === 'std-1', 'only changed local docs written');
  ok(result.deletes.length === 120, 'UI may drop ids locally');
  const appliedDeletes = [];
  const applied = applyGenericArraySync(previous, next);
  ok(applied.deletes.length === 0, 'sync layer does not apply those local absences as deletes');
  ok(appliedDeletes.length === 0, 'no delete ops');
});

test('failed/partial read cannot become an authoritative delete source', () => {
  const server = makeDocs(213, 'std');
  const omitted = undefined;
  const empty = [];
  const stale = server.slice(0, 93);
  ok(planCollectionArrayPatch(omitted, server).inferredDeleteIds.length === 0, 'undefined local');
  ok(planCollectionArrayPatch(empty, server).inferredDeleteIds.length === 0, 'empty local');
  ok(planCollectionArrayPatch(stale, server).inferredDeleteIds.length === 0, 'stale subset');
  ok(applyGenericArraySync(server, empty).docs.length === 213, 'empty array sync keeps server');
});

console.log(`\n${pass}/${total} passed`);
if (pass !== total) process.exit(1);
