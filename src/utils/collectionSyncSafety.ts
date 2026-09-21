// SYNC_MASS_DELETE_SAFETY_V1
// Absence from a client array must never mean delete from Firestore.

export const DEDICATED_WRITE_ONLY_KEY_LIST = [
  'schoolAdminData',
  'teachers',
  'graduates',
  'students',
  'parents',
  'supervisors',
] as const;

export const DEDICATED_WRITE_ONLY_KEYS = new Set<string>(DEDICATED_WRITE_ONLY_KEY_LIST);

export function stripDedicatedWriteOnlyKeys(
  payload: Record<string, any> | null | undefined
): Record<string, any> {
  const next: Record<string, any> = { ...(payload && typeof payload === 'object' ? payload : {}) };
  for (const key of DEDICATED_WRITE_ONLY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(next, key)) {
      delete next[key];
    }
  }
  return next;
}

export type CollectionArrayPatchPlan = {
  upsertIds: string[];
  inferredDeleteIds: string[];
};

export function planCollectionArrayPatch(
  localItems: unknown,
  baseItems: unknown
): CollectionArrayPatchPlan {
  const local = Array.isArray(localItems) ? localItems : [];
  const base = Array.isArray(baseItems) ? baseItems : [];
  const baseIds = new Set(base.map((item: any) => String(item?.id || '')).filter(Boolean));
  const upsertIds: string[] = [];

  for (const item of local) {
    const id = typeof item?.id === 'string' ? item.id : '';
    if (!id) continue;
    upsertIds.push(id);
  }

  const localIds = new Set(upsertIds);
  const inferredDeleteIds = [...baseIds].filter((id) => !localIds.has(id));

  return {
    upsertIds,
    // SYNC_MASS_DELETE_SAFETY_V1: never convert absence into a delete.
    inferredDeleteIds: [],
  };
}

export function countWouldBeInferredDeletes(localItems: unknown, baseItems: unknown): number {
  const local = Array.isArray(localItems) ? localItems : [];
  const base = Array.isArray(baseItems) ? baseItems : [];
  const localIds = new Set(local.map((item: any) => String(item?.id || '')).filter(Boolean));
  return base.filter((item: any) => item?.id && !localIds.has(String(item.id))).length;
}
