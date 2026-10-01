/**
 * Account provisioning for NEW teachers, students, parents, and supervisors.
 * This module has no Firebase import so it can be tested without touching live accounts.
 * Firebase Admin wiring lives in server/accountProvisioningFirebase.ts and must never be imported from src/.
 */
import { createHash } from 'node:crypto';
import {
  ACCOUNT_PROVISION_MESSAGES,
  AccountPolicyError,
  type AliasField,
  type ProvisionRole,
  assertProfileIdForRole,
  isProvisionRole,
  loginAliasValues,
  messageForAliasField,
  normalizeLoginIdentifier,
  profileCollectionForRole,
  validateNewAccountCredentials,
} from '../src/utils/newAccountPolicy.js';

export class ProvisionError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ProvisionError';
  }
}

export interface ProvisionAccountInput {
  role: ProvisionRole;
  profileId: string;
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
  nationalId?: string;
  profile?: Record<string, unknown>;
}

export interface ProvisionExtraDocument {
  collection: 'financial';
  id: string;
  data: Record<string, unknown>;
}

export interface PlannedWrite {
  collection: string;
  id: string;
  data: Record<string, unknown>;
  conflictField: AliasField | 'profile' | 'financial' | 'audit';
  /** Student/parent email or phone alias. An existing directory entry is left untouched. */
  optional?: boolean;
}

export interface PreparedAccount {
  role: ProvisionRole;
  profileId: string;
  profileCollection: string;
  username: string;
  password: string;
  displayName: string;
  authEmail: string;
  claims: { role: ProvisionRole; profileId: string; profileCollection: string };
  aliases: Array<{ field: AliasField; value: string; hash: string }>;
  profile: Record<string, unknown>;
}

export interface AuthGateway {
  createUser(input: { email: string; password: string; displayName: string }): Promise<{ uid: string }>;
  setClaims(uid: string, claims: { role: string; profileId: string; profileCollection: string }): Promise<void>;
  deleteUser(uid: string): Promise<void>;
}

export interface AccountStore {
  getExisting(refs: Array<{ collection: string; id: string }>): Promise<Array<{ collection: string; id: string; exists: boolean }>>;
  createAll(docs: PlannedWrite[]): Promise<void>;
}

export interface ProvisionSuccessAccount {
  role: ProvisionRole;
  profileId: string;
  profileCollection: string;
  authUid: string;
  username: string;
  profile: Record<string, unknown>;
}

const SECRET_KEY = /password|passcode|secret|credential|token/i;
const FINANCIAL_ID = /^fin-[0-9]{10,}-[a-z0-9]{4,}$/;

export const hashLoginIdentifier = (value: string): string =>
  createHash('sha256').update(normalizeLoginIdentifier(value), 'utf8').digest('hex');

export const syntheticAuthEmail = (role: string, profileId: string): string => {
  const digest = createHash('sha256').update(`${role}:${profileId}`, 'utf8').digest('hex');
  return `u-${digest.slice(0, 32)}@auth.maysan.local`;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

export function stripSecretsDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => stripSecretsDeep(item));
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY.test(key) || key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    out[key] = stripSecretsDeep(nested);
  }
  return out;
}

const safeName = (profile: Record<string, unknown>, fallback: string): string => {
  const name = String(profile.name || fallback).replace(/[\r\n]+/g, ' ').trim().slice(0, 120);
  return name || fallback;
};

const auditCategory = (role: ProvisionRole): string => {
  if (role === 'teacher') return 'teachers';
  if (role === 'student') return 'students';
  if (role === 'parent') return 'parents';
  return 'system';
};

export function prepareAccount(input: ProvisionAccountInput): PreparedAccount {
  if (!isProvisionRole(input?.role)) {
    throw new ProvisionError('INVALID', ACCOUNT_PROVISION_MESSAGES.invalid, 400);
  }
  const profileId = String(input.profileId || '').trim();
  assertProfileIdForRole(input.role, profileId);
  let canonical: { username: string; email: string; phone: string; nationalId: string };
  try {
    canonical = validateNewAccountCredentials({
      username: input.username,
      password: input.password,
      confirmPassword: input.confirmPassword,
      email: input.email,
      phone: input.phone,
      nationalId: input.nationalId,
    });
  } catch (error) {
    if (error instanceof AccountPolicyError) throw new ProvisionError(error.code, error.message, 400);
    throw error;
  }

  const incoming = stripSecretsDeep(input.profile || {}) as Record<string, unknown>;
  delete incoming.authUid;
  delete incoming.uid;
  delete incoming.id;
  delete incoming.username;
  const profileCollection = profileCollectionForRole(input.role);
  const displayName = safeName(incoming, profileId);
  const aliases: PreparedAccount['aliases'] = [];
  const pushAlias = (field: AliasField, raw: string | undefined, canonicalValue: string) => {
    if (!canonicalValue && field !== 'profileId') return;
    for (const value of loginAliasValues(field, raw, canonicalValue)) {
      const hash = hashLoginIdentifier(value);
      if (aliases.some((alias) => alias.hash === hash)) continue;
      aliases.push({ field, value, hash });
    }
  };
  pushAlias('username', canonical.username, canonical.username);
  pushAlias('profileId', profileId, profileId);
  if (canonical.email) pushAlias('email', input.email, canonical.email);
  if (canonical.phone) pushAlias('phone', input.phone, canonical.phone);
  if (canonical.nationalId) pushAlias('nationalId', input.nationalId, canonical.nationalId);

  const profile: Record<string, unknown> = {
    ...incoming,
    id: profileId,
    username: canonical.username,
    name: displayName,
  };
  if (canonical.email) profile.email = canonical.email;
  else delete profile.email;
  if (canonical.phone) profile.phone = canonical.phone;
  else delete profile.phone;
  if (canonical.nationalId) profile.nationalId = canonical.nationalId;
  else delete profile.nationalId;

  return {
    role: input.role,
    profileId,
    profileCollection,
    username: canonical.username,
    password: String(input.password),
    displayName,
    authEmail: syntheticAuthEmail(input.role, profileId),
    claims: { role: input.role, profileId, profileCollection },
    aliases,
    profile,
  };
}

const contactCanStayOffLogin = (field: AliasField, roles: Array<PreparedAccount['role']>): boolean =>
  (field === 'email' || field === 'phone') &&
  roles.length > 1 &&
  roles.every((role) => role === 'student' || role === 'parent') &&
  roles.includes('student') &&
  roles.includes('parent');

/** Shared student/parent contact stays on the profiles, but one hash cannot point at two UIDs. */
export function releaseSharedStudentParentContact(accounts: PreparedAccount[]): void {
  const owners = new Map<string, Array<{ account: PreparedAccount; field: AliasField }>>();
  for (const account of accounts) {
    for (const alias of account.aliases) {
      if (alias.field !== 'email' && alias.field !== 'phone') continue;
      const list = owners.get(alias.hash) || [];
      list.push({ account, field: alias.field });
      owners.set(alias.hash, list);
    }
  }
  const drop = new Set<string>();
  for (const [hash, list] of owners) {
    if (list.length < 2) continue;
    if (!contactCanStayOffLogin(list[0].field, list.map((item) => item.account.role))) {
      throw new ProvisionError('ALIAS_CONFLICT', messageForAliasField(list[0].field), 409);
    }
    drop.add(hash);
  }
  if (!drop.size) return;
  for (const account of accounts) {
    account.aliases = account.aliases.filter((alias) => !drop.has(alias.hash));
  }
}

const assertBatchLinks = (accounts: PreparedAccount[]): void => {
  releaseSharedStudentParentContact(accounts);
  const byId = new Map(accounts.map((account) => [account.profileId, account]));
  const seenHashes = new Map<string, { profileId: string; field: AliasField }>();
  for (const account of accounts) {
    for (const alias of account.aliases) {
      const owner = seenHashes.get(alias.hash);
      if (owner) {
        throw new ProvisionError('ALIAS_CONFLICT', messageForAliasField(alias.field), 409);
      }
      seenHashes.set(alias.hash, { profileId: account.profileId, field: alias.field });
    }
  }

  const students = accounts.filter((account) => account.role === 'student');
  const parents = accounts.filter((account) => account.role === 'parent');
  if (students.length && parents.length) {
    for (const student of students) {
      const parentId = String(student.profile.parentId || '');
      const parent = byId.get(parentId);
      if (!parent || parent.role !== 'parent') {
        throw new ProvisionError('INVALID_LINK', ACCOUNT_PROVISION_MESSAGES.invalid, 400);
      }
    }
    for (const parent of parents) {
      const studentId = String(parent.profile.studentId || '');
      const student = byId.get(studentId);
      if (!student || student.role !== 'student') {
        throw new ProvisionError('INVALID_LINK', ACCOUNT_PROVISION_MESSAGES.invalid, 400);
      }
    }
  }
};

const omitUndefinedDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((item) => omitUndefinedDeep(item));
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (nested === undefined) continue;
    out[key] = omitUndefinedDeep(nested);
  }
  return out;
};

export function planWrites(
  accounts: PreparedAccount[],
  extraDocuments: ProvisionExtraDocument[],
  actor: { uid: string; name?: string },
  nowIso: string,
  authUids: Map<string, string>,
): PlannedWrite[] {
  const writes: PlannedWrite[] = [];
  for (const account of accounts) {
    const authUid = authUids.get(account.profileId) || '';
    const profile = { ...account.profile, authUid };
    writes.push({
      collection: account.profileCollection,
      id: account.profileId,
      conflictField: 'profile',
      data: {
        ...profile,
        __sync: {
          updatedAt: nowIso,
          updatedBy: { id: actor.uid, role: 'admin', name: actor.name || 'إدارة المدرسة' },
        },
      },
    });
    const directory = {
      authEmail: account.authEmail,
      uid: authUid,
      role: account.role,
      profileId: account.profileId,
      profileCollection: account.profileCollection,
      updatedAt: nowIso,
    };
    for (const alias of account.aliases) {
      writes.push({
        collection: 'authDirectory',
        id: alias.hash,
        conflictField: alias.field,
        optional: (account.role === 'student' || account.role === 'parent') && (alias.field === 'email' || alias.field === 'phone'),
        data: directory,
      });
    }
    const auditId = `log-provision-${account.profileId}`;
    writes.push({
      collection: 'auditLogs',
      id: auditId,
      conflictField: 'audit',
      data: {
        id: auditId,
        timestamp: nowIso,
        userId: actor.uid,
        userName: actor.name || 'إدارة المدرسة',
        userRole: 'admin',
        action: `إنشاء حساب ${account.role}: ${account.displayName}`,
        actionType: 'create',
        targetCategory: auditCategory(account.role),
        targetId: account.profileId,
        targetName: account.displayName,
        role: account.role,
        details: `تم إنشاء حساب ${account.role} وربطه بالملف ${account.profileId}`,
        severity: 'success',
      },
    });
  }

  for (const extra of extraDocuments) {
    writes.push({
      collection: extra.collection,
      id: extra.id,
      conflictField: 'financial',
      data: stripSecretsDeep(extra.data) as Record<string, unknown>,
    });
  }
  return writes.map((write) => ({ ...write, data: omitUndefinedDeep(write.data) as Record<string, unknown> }));
}

export async function executeAccountProvisioning(
  deps: { auth: AuthGateway; store: AccountStore; now?: () => string },
  actor: { uid: string; name?: string },
  input: { accounts?: ProvisionAccountInput[]; extraDocuments?: ProvisionExtraDocument[] },
): Promise<{ accounts: ProvisionSuccessAccount[] }> {
  const rawAccounts = Array.isArray(input?.accounts) ? input.accounts : [];
  const extraDocuments = Array.isArray(input?.extraDocuments) ? input.extraDocuments : [];
  if (!rawAccounts.length || rawAccounts.length > 2) {
    throw new ProvisionError('INVALID', ACCOUNT_PROVISION_MESSAGES.invalid, 400);
  }
  if (extraDocuments.length > 1) {
    throw new ProvisionError('INVALID', ACCOUNT_PROVISION_MESSAGES.invalid, 400);
  }

  const accounts = rawAccounts.map((account) => prepareAccount(account));
  if (new Set(accounts.map((account) => account.profileId)).size !== accounts.length) {
    throw new ProvisionError('PROFILE_ID', ACCOUNT_PROVISION_MESSAGES.profileTaken, 409);
  }
  if (new Set(accounts.map((account) => account.username)).size !== accounts.length) {
    throw new ProvisionError('USERNAME_TAKEN', ACCOUNT_PROVISION_MESSAGES.usernameTaken, 409);
  }
  assertBatchLinks(accounts);

  for (const extra of extraDocuments) {
    if (extra?.collection !== 'financial' || !FINANCIAL_ID.test(String(extra.id || ''))) {
      throw new ProvisionError('INVALID', ACCOUNT_PROVISION_MESSAGES.invalid, 400);
    }
    const studentId = String(asRecord(extra.data).studentId || '');
    if (!accounts.some((account) => account.role === 'student' && account.profileId === studentId)) {
      throw new ProvisionError('INVALID', ACCOUNT_PROVISION_MESSAGES.invalid, 400);
    }
    const encoded = JSON.stringify(stripSecretsDeep(extra.data));
    if (encoded.length > 50_000) throw new ProvisionError('INVALID', ACCOUNT_PROVISION_MESSAGES.invalid, 400);
  }

  for (const account of accounts) {
    if (JSON.stringify(account.profile).length > 80_000) {
      throw new ProvisionError('INVALID', ACCOUNT_PROVISION_MESSAGES.invalid, 400);
    }
  }

  const preliminaryWrites = planWrites(accounts, extraDocuments, actor, deps.now?.() || new Date().toISOString(), new Map());
  const existing = await deps.store.getExisting(preliminaryWrites.map((write) => ({ collection: write.collection, id: write.id })));
  const occupiedContact = new Set<string>();
  for (let index = 0; index < existing.length; index += 1) {
    if (!existing[index]?.exists) continue;
    const write = preliminaryWrites[index];
    if (write.optional) {
      occupiedContact.add(`${write.collection}/${write.id}`);
      continue;
    }
    throw new ProvisionError('ALIAS_TAKEN', messageForAliasField(write.conflictField), 409);
  }
  if (occupiedContact.size) {
    for (const account of accounts) {
      account.aliases = account.aliases.filter((alias) => !occupiedContact.has(`authDirectory/${alias.hash}`));
    }
  }

  const createdUids: string[] = [];
  const uidByProfile = new Map<string, string>();
  try {
    for (const account of accounts) {
      const user = await deps.auth.createUser({
        email: account.authEmail,
        password: account.password,
        displayName: account.displayName,
      });
      const uid = String(user?.uid || '').trim();
      if (!uid || uidByProfile.has(account.profileId) || createdUids.includes(uid)) {
        throw new ProvisionError('AUTH_CREATE_FAILED', ACCOUNT_PROVISION_MESSAGES.authFailed, 500);
      }
      createdUids.push(uid);
      uidByProfile.set(account.profileId, uid);
    }
    if (new Set(createdUids).size !== accounts.length) {
      throw new ProvisionError('AUTH_CREATE_FAILED', ACCOUNT_PROVISION_MESSAGES.authFailed, 500);
    }
    for (const account of accounts) {
      await deps.auth.setClaims(uidByProfile.get(account.profileId) as string, account.claims);
    }
    const nowIso = deps.now?.() || new Date().toISOString();
    const writes = planWrites(accounts, extraDocuments, actor, nowIso, uidByProfile);
    await deps.store.createAll(writes);
    return {
      accounts: accounts.map((account) => {
        const authUid = uidByProfile.get(account.profileId) as string;
        return {
          role: account.role,
          profileId: account.profileId,
          profileCollection: account.profileCollection,
          authUid,
          username: account.username,
          profile: { ...account.profile, authUid },
        };
      }),
    };
  } catch (error) {
    if (createdUids.length === 0) {
      if (error instanceof ProvisionError) throw error;
      throw new ProvisionError('AUTH_CREATE_FAILED', ACCOUNT_PROVISION_MESSAGES.authFailed, 500);
    }
    let compensationFailed = false;
    for (const uid of createdUids) {
      try {
        await deps.auth.deleteUser(uid);
      } catch {
        compensationFailed = true;
      }
    }
    if (compensationFailed) {
      throw new ProvisionError(
        'COMPENSATION_FAILED',
        'تعذر إكمال حفظ المستخدم، وتعذر التراجع عن حساب المصادقة الجديد.',
        500,
      );
    }
    if (error instanceof ProvisionError && (error.code === 'ALIAS_TAKEN' || error.code === 'USERNAME_TAKEN' || error.code === 'PROFILE_ID')) {
      throw error;
    }
    throw new ProvisionError('ROLLED_BACK', ACCOUNT_PROVISION_MESSAGES.rolledBack, 500);
  }
}
