import { AccountPolicyError, ACCOUNT_PROVISION_MESSAGES } from '../src/utils/newAccountPolicy.js';
import { executeAccountProvisioning, ProvisionError, type AccountStore, type AuthGateway } from './accountProvisioningCore.js';
import { getProvisioningBackend } from './accountProvisioningFirebase.js';

export interface ProvisionBackend {
  verifyAdmin(authorization?: string): Promise<{ uid: string; name?: string }>;
  auth: AuthGateway;
  store: AccountStore;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

const allowRate = (ip: string): boolean => {
  const key = ip || 'unknown';
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (current.count >= 30) return false;
  current.count += 1;
  return true;
};

const fail = (status: number, message: string, code: string) => ({
  status,
  body: { success: false as const, code, message },
});

export async function handleProvisionHttp(options: {
  method?: string;
  authorization?: string;
  payload?: unknown;
  ip?: string;
  backend?: ProvisionBackend;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  if (String(options.method || 'POST').toUpperCase() !== 'POST') {
    return fail(405, ACCOUNT_PROVISION_MESSAGES.invalid, 'METHOD');
  }
  if (!allowRate(String(options.ip || 'unknown'))) {
    return fail(429, 'تم تجاوز عدد المحاولات المسموح مؤقتاً. حاول لاحقاً.', 'RATE_LIMIT');
  }

  const payload = options.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return fail(400, ACCOUNT_PROVISION_MESSAGES.invalid, 'INVALID');
  }

  try {
    const backend = options.backend || await getProvisioningBackend();
    const actor = await backend.verifyAdmin(options.authorization);
    const result = await executeAccountProvisioning(backend, actor, payload as { accounts?: never[]; extraDocuments?: never[] });
    return {
      status: 200,
      body: {
        success: true,
        accounts: result.accounts.map((account) => ({
          role: account.role,
          profileId: account.profileId,
          profileCollection: account.profileCollection,
          authUid: account.authUid,
          username: account.username,
          profile: account.profile,
        })),
      },
    };
  } catch (error) {
    if (error instanceof AccountPolicyError) return fail(403, error.message, error.code);
    if (error instanceof ProvisionError) return fail(error.status, error.message, error.code);
    return fail(500, ACCOUNT_PROVISION_MESSAGES.authFailed, 'AUTH_CREATE_FAILED');
  }
}
