import {
  filterPersistedLibraryResources,
  isClientSeededLibraryResource,
} from './libraryResourceAccess';
import type { LectureResource } from '../types';

const suppressedIds = new Set<string>();

export function suppressLibraryResourceId(id: string): void {
  const trimmed = String(id || '').trim();
  if (trimmed) suppressedIds.add(trimmed);
}

export function clearLibraryResourceSuppression(id: string): void {
  suppressedIds.delete(String(id || '').trim());
}

export function resetLibraryDeletionGuardForTests(): void {
  suppressedIds.clear();
}

export function filterRuntimeLibraryResources(
  resources: LectureResource[] | null | undefined
): LectureResource[] {
  return filterSuppressedLibraryResources(filterPersistedLibraryResources(resources));
}

export function hydrateLibraryDeletionGuard(ids: string[] | null | undefined): void {
  (ids || []).forEach((id) => suppressLibraryResourceId(id));
}

export function isLibraryResourceSuppressed(id: string | null | undefined): boolean {
  return suppressedIds.has(String(id || '').trim());
}

export function filterSuppressedLibraryResources<T extends { id?: string }>(
  resources: T[] | null | undefined
): T[] {
  return (resources || []).filter((row) => !isLibraryResourceSuppressed(row?.id));
}

export type LectureDocumentWriteDecision = 'create' | 'merge' | 'skip';

/**
 * Production helper used by unified collection patch for `lectures`.
 * Prevents stale auto-push from recreating an explicitly deleted document.
 */
export function decideLectureDocumentWrite(input: {
  collectionKey: string;
  id: string;
  baseItem: unknown;
  localItem: unknown;
  serverItem: unknown;
}): LectureDocumentWriteDecision {
  if (input.collectionKey !== 'lectures') return 'skip';
  const id = String(input.id || '').trim();
  if (!id) return 'skip';

  if (isLibraryResourceSuppressed(id)) return 'skip';
  if (input.localItem && isClientSeededLibraryResource(input.localItem as any)) return 'skip';

  // SYNC_MASS_DELETE_SAFETY_V1: never infer delete from a missing local item.
  if (input.baseItem !== undefined && input.localItem === undefined) return 'skip';

  // Explicit server deletion wins over a stale local copy.
  if (input.localItem !== undefined && input.serverItem === undefined && input.baseItem !== undefined) {
    return 'skip';
  }

  // Stale payload after explicit delete: local still has the row, server and base do not.
  if (input.baseItem === undefined && input.localItem !== undefined && input.serverItem === undefined) {
    return 'create';
  }

  if (input.baseItem !== undefined && input.localItem !== undefined && input.serverItem !== undefined) {
    return 'merge';
  }

  return 'skip';
}

export function applyExplicitLibraryDelete<T extends { id: string }>(resources: T[], deletedId: string): T[] {
  suppressLibraryResourceId(deletedId);
  return (resources || []).filter((row) => row.id !== deletedId);
}

export function simulateUnifiedLecturePatch(
  localLectures: Array<{ id: string }>,
  baseLectures: Array<{ id: string }>,
  serverLectures: Array<{ id: string }>
): Array<{ id: string }> {
  const localMap = new Map(localLectures.map((row) => [row.id, row]));
  const baseMap = new Map(baseLectures.map((row) => [row.id, row]));
  const serverMap = new Map(serverLectures.map((row) => [row.id, row]));
  const ids = new Set([...localMap.keys(), ...baseMap.keys(), ...serverMap.keys()]);
  const next: Array<{ id: string }> = [...serverLectures];

  ids.forEach((id) => {
    const decision = decideLectureDocumentWrite({
      collectionKey: 'lectures',
      id,
      baseItem: baseMap.get(id),
      localItem: localMap.get(id),
      serverItem: serverMap.get(id),
    });
    if (decision === 'create' && localMap.get(id) && !next.some((row) => row.id === id)) {
      next.push(localMap.get(id)!);
    }
  });

  return next;
}
