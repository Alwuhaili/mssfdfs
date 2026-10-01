/**
 * Shared rules for NEW account creation only.
 * Login hashing stays aligned with firebaseAuthService.normalizeIdentifier:
 * trim, lowercase, and collapse internal whitespace.
 * Phone / email / nationalId canonical forms stay aligned with identityPolicy.
 */

export const MIN_NEW_ACCOUNT_PASSWORD_LENGTH = 10;
export const MAX_NEW_ACCOUNT_PASSWORD_LENGTH = 200;

export const ACCOUNT_PROVISION_MESSAGES = {
  usernameTaken: 'اسم المستخدم مستخدم بالفعل.',
  emailTaken: 'البريد الإلكتروني مستخدم بالفعل.',
  phoneTaken: 'رقم الهاتف مستخدم بالفعل.',
  nationalIdTaken: 'الرقم الوطني مستخدم بالفعل.',
  passwordMismatch: 'كلمة المرور وتأكيدها غير متطابقين.',
  passwordShort: 'كلمة المرور قصيرة.',
  forbidden: 'غير مخول بإنشاء الحساب.',
  authFailed: 'تعذر إنشاء حساب Firebase.',
  rolledBack: 'تعذر إكمال حفظ المستخدم، وتم التراجع عن العملية.',
  invalid: 'بيانات الحساب غير صالحة.',
  notConfigured: 'خدمة إنشاء الحسابات غير مهيأة على الخادم.',
  profileTaken: 'معرّف الحساب مستخدم بالفعل.',
  usernameInvalid: 'اسم المستخدم غير صالح. استخدم 3 إلى 32 حرفاً إنجليزياً صغيراً أو رقماً، ويمكن استخدام . _ -',
} as const;

export type ProvisionRole = 'teacher' | 'student' | 'parent' | 'supervisor';

export type AliasField = 'username' | 'email' | 'phone' | 'nationalId' | 'profileId';

export interface NewAccountCredentials {
  username: string;
  initialPassword: string;
  confirmPassword: string;
}

export class AccountPolicyError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'AccountPolicyError';
  }
}

export const normalizeLoginIdentifier = (value: string): string =>
  String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

export const canonicalEmail = (value?: string): string => String(value || '').trim().toLowerCase();

export const canonicalPhone = (value?: string): string =>
  String(value || '').replace(/[\s()\-]/g, '').replace(/^00/, '+');

export const canonicalNationalId = (value?: string): string =>
  String(value || '').trim().replace(/[\s\-]/g, '').toUpperCase();

export const canonicalUsername = (value?: string): string =>
  normalizeLoginIdentifier(String(value || '')).replace(/\s+/g, '');

const USERNAME_PATTERN = /^[a-z][a-z0-9._-]{2,31}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFILE_ID_PATTERNS: Record<ProvisionRole, RegExp> = {
  teacher: /^tech-[0-9]{10,}-[a-z0-9]{4,}$/,
  student: /^std-[0-9]{10,}-[a-z0-9]{4,}$/,
  parent: /^prt-[0-9]{10,}-[a-z0-9]{4,}$/,
  supervisor: /^sup-[0-9]{10,}-[a-z0-9]{4,}$/,
};

export const profileCollectionForRole = (role: ProvisionRole): string => {
  if (role === 'teacher') return 'teachers';
  if (role === 'student') return 'students';
  if (role === 'parent') return 'parents';
  return 'supervisors';
};

export const isProvisionRole = (value: unknown): value is ProvisionRole =>
  value === 'teacher' || value === 'student' || value === 'parent' || value === 'supervisor';

export function assertProfileIdForRole(role: ProvisionRole, profileId: string): void {
  if (!PROFILE_ID_PATTERNS[role].test(profileId)) {
    throw new AccountPolicyError('INVALID_PROFILE_ID', ACCOUNT_PROVISION_MESSAGES.invalid);
  }
}

export function validateNewAccountCredentials(input: {
  username?: string;
  password?: string;
  confirmPassword?: string;
  email?: string;
  phone?: string;
  nationalId?: string;
}): { username: string; email: string; phone: string; nationalId: string } {
  const username = canonicalUsername(input.username);
  if (!username) {
    throw new AccountPolicyError('USERNAME_REQUIRED', ACCOUNT_PROVISION_MESSAGES.usernameInvalid);
  }
  if (!USERNAME_PATTERN.test(username)) {
    throw new AccountPolicyError('USERNAME_INVALID', ACCOUNT_PROVISION_MESSAGES.usernameInvalid);
  }

  const password = String(input.password ?? '');
  const confirmPassword = String(input.confirmPassword ?? '');
  if (password !== confirmPassword) {
    throw new AccountPolicyError('PASSWORD_MISMATCH', ACCOUNT_PROVISION_MESSAGES.passwordMismatch);
  }
  if (password.length < MIN_NEW_ACCOUNT_PASSWORD_LENGTH || password.length > MAX_NEW_ACCOUNT_PASSWORD_LENGTH) {
    throw new AccountPolicyError('PASSWORD_SHORT', ACCOUNT_PROVISION_MESSAGES.passwordShort);
  }

  const email = canonicalEmail(input.email);
  if (email && !EMAIL_PATTERN.test(email)) {
    throw new AccountPolicyError('EMAIL_INVALID', ACCOUNT_PROVISION_MESSAGES.invalid);
  }

  const phone = canonicalPhone(input.phone);
  if (phone && !/^\+?[0-9]{8,15}$/.test(phone)) {
    throw new AccountPolicyError('PHONE_INVALID', ACCOUNT_PROVISION_MESSAGES.invalid);
  }

  const nationalId = canonicalNationalId(input.nationalId);
  if (nationalId && !/^[A-Z0-9]{4,32}$/.test(nationalId)) {
    throw new AccountPolicyError('NATIONAL_ID_INVALID', ACCOUNT_PROVISION_MESSAGES.invalid);
  }

  return { username, email, phone, nationalId };
}

export function messageForAliasField(field: AliasField | string): string {
  if (field === 'username') return ACCOUNT_PROVISION_MESSAGES.usernameTaken;
  if (field === 'email') return ACCOUNT_PROVISION_MESSAGES.emailTaken;
  if (field === 'phone') return ACCOUNT_PROVISION_MESSAGES.phoneTaken;
  if (field === 'nationalId') return ACCOUNT_PROVISION_MESSAGES.nationalIdTaken;
  if (field === 'profileId' || field === 'profile') return ACCOUNT_PROVISION_MESSAGES.profileTaken;
  return ACCOUNT_PROVISION_MESSAGES.authFailed;
}

/** Values whose login-normalized hash must resolve to this account. */
export function loginAliasValues(kind: AliasField, raw: string | undefined, canonical: string): string[] {
  const values = new Set<string>();
  const add = (value: string | undefined) => {
    const normalized = normalizeLoginIdentifier(String(value || ''));
    if (normalized) values.add(normalized);
  };
  if (kind === 'username' || kind === 'profileId') {
    add(canonical);
    return [...values];
  }
  add(raw);
  add(canonical);
  return [...values];
}

export function suggestUsername(role: ProvisionRole): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(6);
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) cryptoApi.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  let suffix = '';
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `${role}-${suffix}`;
}

export function assertCanProvision(claims: Record<string, unknown> | null | undefined): void {
  if (!claims || claims.role !== 'admin') {
    throw new AccountPolicyError('FORBIDDEN', ACCOUNT_PROVISION_MESSAGES.forbidden);
  }
}
