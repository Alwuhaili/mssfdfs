/**
 * SECURITY_MESSAGING_DIRECT_PERSIST_V1_3D6F2C_STAGE0_6
 * Single-document DirectMessage create/overwrite. Never writes userStates.
 */
import { doc, setDoc } from 'firebase/firestore';
import { prepareDirectMessageForPersistence } from '../utils/messageSyncIsolation';

const safeDocId = (id: string): string => encodeURIComponent(id).replace(/%/g, '_');

export async function persistDirectMessageDocument(
  db: any,
  message: any,
  sourceUser?: { id?: string; name?: string; role?: string }
): Promise<{ success: boolean; message?: string; id?: string }> {
  try {
    const prepared = prepareDirectMessageForPersistence(message);
    if (Object.prototype.hasOwnProperty.call(prepared, 'userStates')) {
      throw new Error('SECURITY: userStates must not be persisted on shared messages');
    }
    await setDoc(doc(db, 'messages', safeDocId(prepared.id)), {
      ...prepared,
      __sync: {
        updatedAt: new Date().toISOString(),
        updatedBy: JSON.parse(JSON.stringify(sourceUser || {})),
      },
    });
    return { success: true, id: prepared.id };
  } catch (err: any) {
    return {
      success: false,
      message: `${err?.code ? `[${err.code}] ` : ''}${err?.message || 'فشل حفظ الرسالة في Firestore'}`,
    };
  }
}
