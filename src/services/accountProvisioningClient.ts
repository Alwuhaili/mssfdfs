import { auth } from '../lib/firebase';
import {
  ACCOUNT_PROVISION_MESSAGES,
  type ProvisionRole,
} from '../utils/newAccountPolicy';

export interface ProvisionAccountRequest {
  role: ProvisionRole;
  profileId: string;
  username: string;
  password: string;
  confirmPassword: string;
  email?: string;
  phone?: string;
  nationalId?: string;
  profile: Record<string, unknown>;
}

export interface ProvisionedAccount {
  role: ProvisionRole;
  profileId: string;
  profileCollection: string;
  authUid: string;
  username: string;
  profile: Record<string, unknown>;
}

export type ManagedAccountCreateResult =
  | { success: true; accounts: ProvisionedAccount[] }
  | { success: false; message: string };

const publicMessage = (value: unknown, fallback: string): string => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > 180) return fallback;
  if (/password|initialPassword|confirmPassword|passcode|stack|Bearer |eyJ|firebase-admin|service.account/i.test(text)) {
    return fallback;
  }
  return text;
};

export async function provisionAccounts(input: {
  accounts: ProvisionAccountRequest[];
  extraDocuments?: Array<{ collection: 'financial'; id: string; data: Record<string, unknown> }>;
}): Promise<ManagedAccountCreateResult> {
  const user = auth.currentUser;
  if (!user) return { success: false, message: ACCOUNT_PROVISION_MESSAGES.forbidden };

  let token = '';
  try {
    token = await user.getIdToken();
  } catch {
    return { success: false, message: ACCOUNT_PROVISION_MESSAGES.forbidden };
  }

  try {
    const response = await fetch('/api/accounts/provision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.success || !Array.isArray(body.accounts)) {
      const fallback = response.status === 403
        ? ACCOUNT_PROVISION_MESSAGES.forbidden
        : ACCOUNT_PROVISION_MESSAGES.authFailed;
      return { success: false, message: publicMessage(body?.message, fallback) };
    }
    return { success: true, accounts: body.accounts as ProvisionedAccount[] };
  } catch {
    return { success: false, message: ACCOUNT_PROVISION_MESSAGES.authFailed };
  }
}
