export type IdentityRole = 'student' | 'teacher' | 'parent' | 'supervisor' | 'admin';
export type IdentityField = 'email' | 'phone' | 'nationalId';

export interface IdentityRecord {
  id: string;
  role: IdentityRole;
  email?: string;
  phone?: string;
  nationalId?: string;
}

export class DuplicateIdentityError extends Error {
  constructor(public field: IdentityField, public owner?: IdentityRecord) {
    const ar = field === 'email'
      ? 'البريد الإلكتروني مستخدم بالفعل. إذا كان هذا البريد يعود لك، يرجى تسجيل الدخول بدل إنشاء حساب جديد.'
      : field === 'phone'
        ? 'رقم الهاتف مستخدم بالفعل لحساب آخر. يرجى استخدام رقم هاتف آخر أو مراجعة الإدارة.'
        : 'رقم المعرّف مسجل بالفعل في النظام. لا يمكن إنشاء حساب آخر باستخدام المعرّف نفسه.';
    super(ar);
    this.name = 'DuplicateIdentityError';
  }
}

export const normalizeEmail = (v?: string) => String(v || '').trim().toLowerCase();
export const normalizePhone = (v?: string) => String(v || '').replace(/[\s()\-]/g, '').replace(/^00/, '+');
export const normalizeNationalId = (v?: string) => String(v || '').trim().replace(/[\s\-]/g, '').toUpperCase();

export function stableUsername(role: IdentityRole, profileId: string): string {
  const prefix: Record<IdentityRole, string> = { student: 'student', teacher: 'teacher', parent: 'parent', supervisor: 'supervisor', admin: 'admin' };
  const clean = String(profileId || '').trim().replace(/^(std|prt|tch|tea|sup|admin)-/i, '').replace(/[^a-zA-Z0-9_-]/g, '-');
  return `${prefix[role]}-${clean}`.toLowerCase();
}

export function assertUniqueIdentity(candidate: IdentityRecord, records: IdentityRecord[], sameProfileId?: string): void {
  const checks: Array<[IdentityField, string, (v?: string) => string]> = [
    ['email', candidate.email || '', normalizeEmail],
    ['phone', candidate.phone || '', normalizePhone],
    ['nationalId', candidate.nationalId || '', normalizeNationalId],
  ];
  for (const [field, raw, norm] of checks) {
    const value = norm(raw);
    if (!value) continue;
    const owner = records.find(r => r.id !== sameProfileId && norm(r[field]) === value);
    if (owner) throw new DuplicateIdentityError(field, owner);
  }
}
