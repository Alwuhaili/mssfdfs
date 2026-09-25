export type PersistableItem = { id: string };

export interface CollectionPersistPlan<T extends PersistableItem> {
  upserts: T[];
  deletes: string[];
}

/**
 * Targeted collection persistence plan for an explicit command.
 * Deletes are included only when the command itself replaces/removes entities.
 */
export function planCollectionPersistence<T extends PersistableItem>(
  previous: T[],
  next: T[],
  options?: { includeDeletes?: boolean }
): CollectionPersistPlan<T> {
  const prevMap = new Map(previous.map((item) => [item.id, item]));
  const nextIds = new Set(next.map((item) => item.id));
  const upserts = next.filter((item) => JSON.stringify(prevMap.get(item.id)) !== JSON.stringify(item));
  const deletes = options?.includeDeletes
    ? previous.filter((item) => !nextIds.has(item.id)).map((item) => item.id)
    : [];
  return { upserts, deletes };
}

export function assertNoWriteBackFromSnapshot(input: {
  snapshotApplied: boolean;
  persistenceInvoked: boolean;
}): boolean {
  if (!input.snapshotApplied) return true;
  return input.persistenceInvoked === false;
}
