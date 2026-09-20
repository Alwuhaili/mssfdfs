/**
 * SECURITY_NOTIFICATION_USER_STATE_PERSIST_V1_D6F2
 * Per-user notification mailbox state. Never writes shared /notifications docs.
 */
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

const safeDocId = (id: string): string => encodeURIComponent(id).replace(/%/g, '_');

export async function persistNotificationUserStateDocument(
  db: any,
  ownerAuthUid: string,
  notificationId: string,
  patch: { isRead?: boolean; isDeleted?: boolean }
): Promise<{ success: boolean; message?: string }> {
  try {
    const uid = typeof ownerAuthUid === 'string' ? ownerAuthUid.trim() : '';
    const id = typeof notificationId === 'string' ? notificationId.trim() : '';
    if (!uid || !id) throw new Error('SECURITY: notification user state requires Auth UID and notificationId');
    const payload: Record<string, unknown> = {
      notificationId: id,
      isRead: patch.isRead === true,
      isDeleted: patch.isDeleted === true,
      updatedAt: serverTimestamp(),
    };
    if (typeof patch.isRead !== 'boolean' && typeof patch.isDeleted !== 'boolean') {
      throw new Error('SECURITY: notification user state patch is empty');
    }
    if (typeof patch.isRead === 'boolean') payload.isRead = patch.isRead;
    if (typeof patch.isDeleted === 'boolean') payload.isDeleted = patch.isDeleted;
    await setDoc(doc(db, 'notificationUserStates', uid, 'items', safeDocId(id)), payload, { merge: true });
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      message: `${err?.code ? `[${err.code}] ` : ''}${err?.message || 'فشل حفظ حالة التنبيه'}`,
    };
  }
}
