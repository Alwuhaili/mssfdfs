import { DirectMessage, UserMessageState } from '../types';

export function getUserState(m: DirectMessage, userId: string): UserMessageState | undefined {
  if (!m || !m.userStates || !userId) return undefined;
  return m.userStates[userId];
}

export function isMessageDeletedForUser(m: DirectMessage, userId: string): boolean {
  if (!m || !userId) return false;
  const uState = m.userStates?.[userId];
  if (uState && uState.isDeleted !== undefined) {
    return uState.isDeleted;
  }
  return false;
}

export function isMessageTrashForUser(m: DirectMessage, userId: string): boolean {
  if (!m || !userId) return false;
  if (isMessageDeletedForUser(m, userId)) return false;
  const uState = m.userStates?.[userId];
  if (uState && uState.isTrash !== undefined) {
    return uState.isTrash;
  }
  if (uState && uState.folder === 'trash') {
    return true;
  }
  return false;
}

export function isMessageSpamForUser(m: DirectMessage, userId: string): boolean {
  if (!m || !userId) return false;
  if (isMessageDeletedForUser(m, userId)) return false;
  const uState = m.userStates?.[userId];
  if (uState && uState.isSpam !== undefined) {
    return uState.isSpam;
  }
  if (uState && uState.folder === 'spam') {
    return true;
  }
  return false;
}

export function isMessageStarredForUser(m: DirectMessage, userId: string): boolean {
  if (!m || !userId) return false;
  if (isMessageDeletedForUser(m, userId)) return false;
  const uState = m.userStates?.[userId];
  if (uState && uState.isStarred !== undefined) {
    return uState.isStarred;
  }
  return m.isStarred ?? false;
}

export function isMessageReadForUser(m: DirectMessage, userId: string): boolean {
  if (!m || !userId) return false;
  const uState = m.userStates?.[userId];
  if (uState && uState.isRead !== undefined) {
    return uState.isRead;
  }
  return m.isRead ?? false;
}

export function isMessageArchivedForUser(m: DirectMessage, userId: string): boolean {
  if (!m || !userId) return false;
  if (isMessageDeletedForUser(m, userId)) return false;
  if (isMessageTrashForUser(m, userId)) return false;
  const uState = m.userStates?.[userId];
  if (uState && uState.isArchived !== undefined) {
    return uState.isArchived;
  }
  if (uState && uState.folder === 'archive') {
    return true;
  }
  return false;
}

export function getMessageFolderForUser(m: DirectMessage, userId: string): string | undefined {
  if (!m || !userId) return undefined;
  const uState = m.userStates?.[userId];
  if (uState && uState.folder) return uState.folder;
  if (uState && uState.customFolderId) return uState.customFolderId;
  return undefined;
}
