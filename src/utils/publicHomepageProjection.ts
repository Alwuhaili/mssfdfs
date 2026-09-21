// HOME-004_006_PUBLIC_HOMEPAGE_V1
// Sanitized public projection for publicContent/homepage.
// Never include credentials, adminAuthUid, or private school records.

export const PUBLIC_HOMEPAGE_COLLECTION = 'publicContent';
export const PUBLIC_HOMEPAGE_DOC_ID = 'homepage';

import {
  sanitizePublicFacultyList,
  sanitizePublicHonorBoard,
  type PublicFacultyItem,
  type PublicHonorEntry,
} from './publicHomepageFacultyHonor';
import { sanitizePublicHttpsImageUrl } from './publicHomepageImageUrl';

const FORBIDDEN_PUBLIC_KEYS = [
  'adminAuthUid',
  'authUid',
  'password',
  'passcode',
  'token',
  'apiKey',
  'secret',
  'credential',
  'email',
  'phone',
  'nationalId',
];

export type PublicSchoolInfo = {
  schoolName?: string;
  schoolNameEn?: string;
  schoolLogoUrl?: string;
  schoolWorkingHoursInfo?: string;
  schoolWorkingHoursDetail?: string;
  schoolUniformInfo?: string;
  schoolUniformDetail?: string;
  schoolPolicyInfo?: string;
  schoolPolicyDetail?: string;
  principalName?: string;
  principalBadge?: string;
  principalTitle?: string;
  principalDegree?: string;
  principalImageUrl?: string;
  visionMessage?: string;
  achievements?: string[];
  assistantPrincipalName?: string;
  assistantPrincipalTitle?: string;
  academicSupervisorName?: string;
  academicSupervisorTitle?: string;
};

export type PublicNewsItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  image: string;
  summary: string;
  fullContent: string;
  location: string;
  organizer: string;
};

export type PublicGalleryItem = {
  id: string;
  title: string;
  category: string;
  url: string;
  date: string;
  desc: string;
};

export type PublicHomepageDocument = {
  schoolInfo: PublicSchoolInfo;
  news: PublicNewsItem[];
  gallery: PublicGalleryItem[];
  faculty: PublicFacultyItem[];
  honorBoard: PublicHonorEntry[];
  updatedAt?: string;
};

const asTrimmedString = (value: unknown, max = 20000): string => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

const asStringArray = (value: unknown, maxItems = 40): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asTrimmedString(item, 500))
    .filter(Boolean)
    .slice(0, maxItems);
};

export function assertNoForbiddenPublicFields(value: unknown, path = 'root'): string[] {
  const hits: string[] = [];
  if (!value || typeof value !== 'object') return hits;
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      hits.push(...assertNoForbiddenPublicFields(item, `${path}[${index}]`));
    });
    return hits;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_PUBLIC_KEYS.some((forbidden) => lower.includes(forbidden.toLowerCase()))) {
      hits.push(`${path}.${key}`);
    }
    hits.push(...assertNoForbiddenPublicFields(nested, `${path}.${key}`));
  }
  return hits;
}

export function buildPublicSchoolInfo(source: Record<string, any> | null | undefined): PublicSchoolInfo {
  const data = source && typeof source === 'object' ? source : {};
  return {
    schoolName: asTrimmedString(data.schoolNameAr || data.schoolName) || 'ثانوية ميسان للمتميزات',
    schoolNameEn: asTrimmedString(data.schoolNameEn),
    schoolLogoUrl: sanitizePublicHttpsImageUrl(data.schoolLogoUrl),
    schoolWorkingHoursInfo: asTrimmedString(data.schoolWorkingHoursInfo),
    schoolWorkingHoursDetail: asTrimmedString(data.schoolWorkingHoursDetail),
    schoolUniformInfo: asTrimmedString(data.schoolUniformInfo),
    schoolUniformDetail: asTrimmedString(data.schoolUniformDetail),
    schoolPolicyInfo: asTrimmedString(data.schoolPolicyInfo),
    schoolPolicyDetail: asTrimmedString(data.schoolPolicyDetail),
    principalName: asTrimmedString(data.principalName),
    principalBadge: asTrimmedString(data.principalBadge),
    principalTitle: asTrimmedString(data.principalTitle),
    principalDegree: asTrimmedString(data.principalDegree),
    principalImageUrl: sanitizePublicHttpsImageUrl(data.principalImageUrl),
    visionMessage: asTrimmedString(data.visionMessage, 8000),
    achievements: asStringArray(data.achievements),
    assistantPrincipalName: asTrimmedString(data.assistantPrincipalName),
    assistantPrincipalTitle: asTrimmedString(data.assistantPrincipalTitle),
    academicSupervisorName: asTrimmedString(data.academicSupervisorName),
    academicSupervisorTitle: asTrimmedString(data.academicSupervisorTitle),
  };
}

export function sanitizePublicNewsItem(item: any): PublicNewsItem | null {
  if (!item || typeof item !== 'object') return null;
  const id = asTrimmedString(item.id, 80);
  if (!id) return null;
  return {
    id,
    title: asTrimmedString(item.title, 200),
    category: asTrimmedString(item.category, 80),
    date: asTrimmedString(item.date, 80),
    image: sanitizePublicHttpsImageUrl(item.image),
    summary: asTrimmedString(item.summary, 2000),
    fullContent: asTrimmedString(item.fullContent, 8000),
    location: asTrimmedString(item.location, 200),
    organizer: asTrimmedString(item.organizer, 200),
  };
}

export function sanitizePublicGalleryItem(item: any): PublicGalleryItem | null {
  if (!item || typeof item !== 'object') return null;
  const id = asTrimmedString(item.id, 80);
  if (!id) return null;
  return {
    id,
    title: asTrimmedString(item.title, 200),
    category: asTrimmedString(item.category, 80),
    url: sanitizePublicHttpsImageUrl(item.url),
    date: asTrimmedString(item.date, 80),
    desc: asTrimmedString(item.desc, 2000),
  };
}

export function sanitizePublicNewsList(list: unknown): PublicNewsItem[] {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizePublicNewsItem).filter((item): item is PublicNewsItem => Boolean(item)).slice(0, 50);
}

export function sanitizePublicGalleryList(list: unknown): PublicGalleryItem[] {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizePublicGalleryItem).filter((item): item is PublicGalleryItem => Boolean(item)).slice(0, 50);
}

export function parsePublicHomepageDocument(raw: any): PublicHomepageDocument {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    schoolInfo: buildPublicSchoolInfo(source.schoolInfo || {}),
    news: sanitizePublicNewsList(source.news),
    gallery: sanitizePublicGalleryList(source.gallery),
    faculty: sanitizePublicFacultyList(source.faculty),
    honorBoard: sanitizePublicHonorBoard(source.honorBoard),
    updatedAt: asTrimmedString(source.updatedAt, 80) || undefined,
  };
}

export function hasNewsField(raw: any): boolean {
  return Boolean(raw && typeof raw === 'object' && Object.prototype.hasOwnProperty.call(raw, 'news'));
}

export function hasGalleryField(raw: any): boolean {
  return Boolean(raw && typeof raw === 'object' && Object.prototype.hasOwnProperty.call(raw, 'gallery'));
}

export const REQUIRED_PUBLIC_SCHOOL_INFO_FIELDS = [
  'schoolWorkingHoursInfo',
  'schoolWorkingHoursDetail',
  'schoolUniformInfo',
  'schoolUniformDetail',
  'schoolPolicyInfo',
  'schoolPolicyDetail',
  'principalName',
  'principalBadge',
  'principalTitle',
  'visionMessage',
] as const;

export function isPublicSchoolInfoComplete(info?: PublicSchoolInfo | null): boolean {
  if (!info || typeof info !== 'object') return false;
  return REQUIRED_PUBLIC_SCHOOL_INFO_FIELDS.every((key) => {
    const value = info[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

export function publicSchoolInfoEquals(
  left?: PublicSchoolInfo | null,
  right?: PublicSchoolInfo | null
): boolean {
  return JSON.stringify(buildPublicSchoolInfo(left || {})) === JSON.stringify(buildPublicSchoolInfo(right || {}));
}

export function looksLikeInitialPublicProjection(
  source: Record<string, any> | null | undefined,
  initialSource: Record<string, any> | null | undefined
): boolean {
  return publicSchoolInfoEquals(buildPublicSchoolInfo(source), buildPublicSchoolInfo(initialSource));
}

export type PublicSchoolInfoInitDecision = {
  shouldWrite: boolean;
  reason: string;
};

export function decidePublicSchoolInfoInitialization(input: {
  authenticated: boolean;
  role?: string | null;
  currentUserRole?: string | null;
  hydrated: boolean;
  authoritativeReceived: boolean;
  pendingSchoolAdminWrite?: boolean;
  schoolAdminData: Record<string, any> | null | undefined;
  initialSchoolAdminData: Record<string, any>;
  publicExists: boolean;
  publicSchoolInfo?: PublicSchoolInfo | null;
}): PublicSchoolInfoInitDecision {
  if (!input.authenticated) return { shouldWrite: false, reason: 'unauthenticated' };
  if (input.role === 'guest' || !input.role) return { shouldWrite: false, reason: 'guest' };
  if (input.role !== 'admin' || input.currentUserRole !== 'admin') {
    return { shouldWrite: false, reason: 'not-admin' };
  }
  if (!input.hydrated) return { shouldWrite: false, reason: 'not-hydrated' };
  if (!input.authoritativeReceived) return { shouldWrite: false, reason: 'no-authoritative-schoolAdminData' };
  if (input.pendingSchoolAdminWrite) return { shouldWrite: false, reason: 'pending-private-write' };
  if (!input.schoolAdminData || typeof input.schoolAdminData !== 'object') {
    return { shouldWrite: false, reason: 'missing-source' };
  }
  if (looksLikeInitialPublicProjection(input.schoolAdminData, input.initialSchoolAdminData)) {
    return { shouldWrite: false, reason: 'initial-data-blocked' };
  }
  const expected = buildPublicSchoolInfo(input.schoolAdminData);
  if (input.publicExists && publicSchoolInfoEquals(input.publicSchoolInfo, expected)) {
    return { shouldWrite: false, reason: 'already-current' };
  }
  if (!input.publicExists || !isPublicSchoolInfoComplete(input.publicSchoolInfo)) {
    return { shouldWrite: true, reason: 'missing-or-incomplete' };
  }
  return { shouldWrite: false, reason: 'public-complete' };
}

/** Conservative JSON-char warning only — not an exact Firestore byte-size measurement. */
export const PUBLIC_HOMEPAGE_JSON_WARN_CHARS = 700_000;

export function publicHomepageImageFieldsAreHttpsOrEmpty(doc: PublicHomepageDocument): boolean {
  const urls = [
    doc.schoolInfo.schoolLogoUrl,
    doc.schoolInfo.principalImageUrl,
    ...doc.news.map((item) => item.image),
    ...doc.gallery.map((item) => item.url),
    ...doc.faculty.map((item) => item.avatar),
    ...doc.honorBoard.map((item) => item.avatar),
  ];
  return urls.every((url) => !url || url.toLowerCase().startsWith('https://'));
}

export function collectLegacyHomepageDataUrlFields(raw: any): string[] {
  const hits: string[] = [];
  const school = raw?.schoolInfo || {};
  if (typeof school.schoolLogoUrl === 'string' && school.schoolLogoUrl.trim().toLowerCase().startsWith('data:')) {
    hits.push('schoolInfo.schoolLogoUrl');
  }
  if (typeof school.principalImageUrl === 'string' && school.principalImageUrl.trim().toLowerCase().startsWith('data:')) {
    hits.push('schoolInfo.principalImageUrl');
  }
  (Array.isArray(raw?.news) ? raw.news : []).forEach((item: any, i: number) => {
    if (typeof item?.image === 'string' && item.image.trim().toLowerCase().startsWith('data:')) {
      hits.push(`news[${i}].image`);
    }
  });
  (Array.isArray(raw?.gallery) ? raw.gallery : []).forEach((item: any, i: number) => {
    if (typeof item?.url === 'string' && item.url.trim().toLowerCase().startsWith('data:')) {
      hits.push(`gallery[${i}].url`);
    }
  });
  (Array.isArray(raw?.faculty) ? raw.faculty : []).forEach((item: any, i: number) => {
    if (typeof item?.avatar === 'string' && item.avatar.trim().toLowerCase().startsWith('data:')) {
      hits.push(`faculty[${i}].avatar`);
    }
  });
  (Array.isArray(raw?.honorBoard) ? raw.honorBoard : []).forEach((item: any, i: number) => {
    if (typeof item?.avatar === 'string' && item.avatar.trim().toLowerCase().startsWith('data:')) {
      hits.push(`honorBoard[${i}].avatar`);
    }
  });
  return hits;
}
