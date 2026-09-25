import type { CurrentUser, GradeLevel, LectureResource, UserRole } from '../types';

export type LibraryAccessAudience =
  | 'authenticated'
  | 'administration'
  | 'teachers'
  | 'students'
  | 'parents'
  | 'grades'
  | 'sections'
  | 'users';

export interface LibraryAccessSettings {
  audiences: LibraryAccessAudience[];
  gradeLevels?: GradeLevel[];
  sections?: string[];
  userIds?: string[];
}

export interface LibraryViewer {
  userId?: string;
  authUid?: string;
  role?: UserRole | string;
  gradeLevel?: GradeLevel | string;
  section?: string;
}

export interface LibraryReaderProgress {
  userId: string;
  resourceId: string;
  progressPercent?: number;
  lastPosition?: number;
  lastPage?: number;
  currentTime?: number;
  duration?: number;
  lastOpenedAt?: string;
  completedAt?: string;
  opened?: boolean;
  viewed?: boolean;
  completed?: boolean;
}

const SEEDED_ID_PREFIXES = [
  'iraq-book-',
  'notes-physics-',
  'notes-arabic-',
  'notes-english-',
  'exam-archive-',
  'lec-video-',
];

export function getLibraryOwnerId(resource: Pick<LectureResource, 'ownerId' | 'uploaderId'>): string {
  const owner = typeof resource.ownerId === 'string' ? resource.ownerId.trim() : '';
  if (owner) return owner;
  const uploader = typeof resource.uploaderId === 'string' ? resource.uploaderId.trim() : '';
  return uploader;
}

export function isClientSeededLibraryResource(resource: Partial<LectureResource> | null | undefined): boolean {
  if (!resource) return true;
  const id = typeof resource.id === 'string' ? resource.id : '';
  if (SEEDED_ID_PREFIXES.some((prefix) => id.startsWith(prefix))) return true;
  if (resource.storageProvider === 'firebase' && typeof resource.storagePath === 'string' && resource.storagePath.startsWith('library/')) {
    return false;
  }
  const teacherName = typeof resource.teacherName === 'string' ? resource.teacherName : '';
  if (/وزارة التربية|المديرية العامة للمناهج|مديرية المناهج/.test(teacherName) && !resource.storagePath) {
    const fileUrl = typeof resource.fileUrl === 'string' ? resource.fileUrl.trim() : '';
    if (!fileUrl || fileUrl === '#' || fileUrl.startsWith('idb:')) return true;
  }
  if (resource.isOfficialBook && !resource.storagePath) {
    const fileUrl = typeof resource.fileUrl === 'string' ? resource.fileUrl.trim() : '';
    if (!fileUrl || fileUrl === '#' || fileUrl.startsWith('idb:')) return true;
  }
  const fileUrl = typeof resource.fileUrl === 'string' ? resource.fileUrl.trim() : '';
  if (/^https?:\/\//i.test(fileUrl) && !fileUrl.includes('example.com')) {
    const hasOwner = Boolean(getLibraryOwnerId(resource as Pick<LectureResource, 'ownerId' | 'uploaderId'>));
    if (!resource.storagePath && /youtube\.com\/embed/i.test(fileUrl) && !hasOwner) return true;
    return false;
  }
  if (typeof resource.pdfDataUrl === 'string' && resource.pdfDataUrl.startsWith('data:')) return false;
  if (!fileUrl || fileUrl === '#' || fileUrl.startsWith('idb:')) return true;
  return false;
}

export function filterPersistedLibraryResources(resources: LectureResource[] | null | undefined): LectureResource[] {
  return (resources || []).filter((row) => !isClientSeededLibraryResource(row));
}

export function canManageLibraryResource(
  resource: LectureResource | null | undefined,
  actor: LibraryViewer | CurrentUser | null | undefined
): boolean {
  if (!resource || !actor) return false;
  const role = String(actor.role || '');
  if (role === 'guest') return false;
  if (role === 'admin') return true;
  if (role === 'student' || role === 'parent' || role === 'supervisor') return false;

  const ownerId = getLibraryOwnerId(resource);
  if (!ownerId) return false;

  const actorAuth = typeof (actor as CurrentUser).authUid === 'string' ? String((actor as CurrentUser).authUid).trim() : '';
  const actorId = typeof actor.userId === 'string' && actor.userId.trim()
    ? actor.userId.trim()
    : typeof (actor as CurrentUser).id === 'string'
      ? String((actor as CurrentUser).id).trim()
      : '';
  const actorProfile = typeof (actor as CurrentUser).profileId === 'string' ? String((actor as CurrentUser).profileId).trim() : '';

  return ownerId === actorAuth || ownerId === actorId || (!!actorProfile && ownerId === actorProfile);
}

export function applyManagedLibraryResourceUpdate(
  target: LectureResource,
  data: Partial<LectureResource>
): LectureResource {
  return {
    ...target,
    ...data,
    id: target.id,
    ownerId: target.ownerId,
    uploaderId: target.uploaderId,
  };
}

export function normalizeLibraryAccess(resource: LectureResource | null | undefined): LibraryAccessSettings {
  const configured = resource?.access;
  if (configured && Array.isArray(configured.audiences)) {
    return {
      audiences: configured.audiences,
      gradeLevels: configured.gradeLevels,
      sections: configured.sections,
      userIds: configured.userIds,
    };
  }
  return { audiences: ['authenticated'] };
}

export function canViewLibraryResource(
  resource: LectureResource | null | undefined,
  actor: LibraryViewer | CurrentUser | null | undefined
): boolean {
  if (!resource || isClientSeededLibraryResource(resource)) return false;
  if (!actor || actor.role === 'guest' || !actor.role) return false;
  if (canManageLibraryResource(resource, actor)) return true;

  const access = normalizeLibraryAccess(resource);
  if (access.audiences.length === 0) return false;

  const role = String(actor.role || '');
  const actorAuth = typeof (actor as CurrentUser).authUid === 'string' ? String((actor as CurrentUser).authUid).trim() : '';
  const actorId = typeof actor.userId === 'string' && actor.userId.trim()
    ? actor.userId.trim()
    : typeof (actor as CurrentUser).id === 'string'
      ? String((actor as CurrentUser).id).trim()
      : '';
  const actorProfile = typeof (actor as CurrentUser).profileId === 'string' ? String((actor as CurrentUser).profileId).trim() : '';
  const ids = [actorAuth, actorId, actorProfile].filter(Boolean);

  if (access.audiences.includes('users')) {
    const allowed = (access.userIds || []).map((value) => String(value).trim()).filter(Boolean);
    if (ids.some((id) => allowed.includes(id))) return true;
    if (access.audiences.length === 1) return false;
  }

  if (access.audiences.includes('authenticated')) return true;
  if (access.audiences.includes('administration') && role === 'admin') return true;
  if (access.audiences.includes('teachers') && role === 'teacher') return true;
  if (access.audiences.includes('students') && role === 'student') return true;
  if (access.audiences.includes('parents') && role === 'parent') return true;

  if (access.audiences.includes('grades')) {
    const grades = access.gradeLevels || [];
    const actorGrade = typeof actor.gradeLevel === 'string' ? actor.gradeLevel : (actor as CurrentUser).gradeLevel;
    if (actorGrade && grades.includes(actorGrade as GradeLevel)) return true;
  }
  if (access.audiences.includes('sections')) {
    const sections = (access.sections || []).map((value) => value.trim()).filter(Boolean);
    const actorSection = typeof actor.section === 'string' ? actor.section.trim() : '';
    if (actorSection && sections.includes(actorSection)) return true;
  }

  return false;
}

export function progressDocId(userId: string, resourceId: string): string {
  return `${String(userId || '').trim()}__${String(resourceId || '').trim()}`;
}

export function mergeLibraryProgress(
  previous: LibraryReaderProgress | null | undefined,
  patch: Partial<LibraryReaderProgress>,
  userId: string,
  resourceId: string
): LibraryReaderProgress {
  const uid = String(userId || '').trim();
  const rid = String(resourceId || '').trim();
  if (!uid || !rid) {
    throw new Error('progress requires userId and resourceId');
  }
  if (patch.userId && patch.userId !== uid) {
    throw new Error('progress userId mismatch');
  }
  if (patch.resourceId && patch.resourceId !== rid) {
    throw new Error('progress resourceId mismatch');
  }
  return {
    ...(previous || {}),
    ...patch,
    userId: uid,
    resourceId: rid,
  };
}

export function canApplyLibraryProgressWrite(
  existing: LibraryReaderProgress | null | undefined,
  next: LibraryReaderProgress,
  actorUserId: string
): boolean {
  const uid = String(actorUserId || '').trim();
  if (!uid || next.userId !== uid || !next.resourceId) return false;
  if (existing && existing.userId !== uid) return false;
  return true;
}

export type LibraryFileKind = 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';

export function getLibraryFileKind(resource: Partial<LectureResource> | null | undefined): LibraryFileKind {
  const name = `${resource?.fileName || ''} ${resource?.originalFileName || ''} ${resource?.fileUrl || ''}`.toLowerCase();
  const extMatch = name.match(/\.([a-z0-9]+)(?:\?|$)/);
  const ext = resource?.fileExtension || extMatch?.[1] || '';
  const mime = String(resource?.mimeType || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || mime.startsWith('image/')) return 'image';
  if (['mp4', 'webm', 'mov'].includes(ext) || mime.startsWith('video/')) return 'video';
  if (['mp3', 'wav', 'm4a'].includes(ext) || mime.startsWith('audio/')) return 'audio';
  if (['zip', 'rar', '7z'].includes(ext) || mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return 'archive';
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv'].includes(ext) || mime.includes('pdf') || mime.includes('officedocument') || mime.startsWith('text/')) {
    return 'document';
  }
  return 'other';
}
