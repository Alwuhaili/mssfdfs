import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, signOut as firebaseSignOut, updatePassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, authIsolationReady, db } from '../lib/firebase';
import type { CurrentUser, UserRole } from '../types';

const ALLOWED_ROLES = new Set<UserRole>(['admin', 'teacher', 'student', 'parent', 'supervisor'] as UserRole[]);

const normalizeIdentifier = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const profileCollectionForRole = (role: UserRole): string | null => {
  if (role === 'teacher') return 'teachers';
  if (role === 'student') return 'students';
  if (role === 'parent') return 'parents';
  if (role === 'supervisor') return 'supervisors';
  return null;
};

export class FirebaseAuthService {
  // TEMP_AUTH_RESTORE_SESSION_V1
  static async restoreSession(): Promise<CurrentUser | null> {
    await authIsolationReady;
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;

    try {
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const claimedRole = String(tokenResult.claims.role || '') as UserRole;
      const profileId = String(tokenResult.claims.profileId || '');
      const profileCollection = String(
        tokenResult.claims.profileCollection || profileCollectionForRole(claimedRole) || ''
      );

      if (!ALLOWED_ROLES.has(claimedRole)) {
        await firebaseSignOut(auth);
        return null;
      }

      let profile: any = {};
      if (claimedRole !== 'admin') {
        const expectedCollection = profileCollectionForRole(claimedRole);
        if (!profileId || !profileCollection || profileCollection !== expectedCollection) {
          await firebaseSignOut(auth);
          return null;
        }

        const profileSnap = await getDoc(doc(db, profileCollection, profileId));
        if (!profileSnap.exists()) {
          await firebaseSignOut(auth);
          return null;
        }

        profile = profileSnap.data();
        if (profile.authUid !== firebaseUser.uid) {
          await firebaseSignOut(auth);
          return null;
        }
      }

      const base: CurrentUser = {
        authUid: firebaseUser.uid,
        profileId: profileId || undefined,
        profileCollection: profileCollection || undefined,
        id: profileId || firebaseUser.uid,
        name: profile.name || firebaseUser.displayName || (claimedRole === 'admin' ? 'إدارة ثانوية ميسان للمتميزات' : 'مستخدم النظام'),
        role: claimedRole,
        email: profile.email || firebaseUser.email || undefined,
        phone: profile.phone || undefined,
        avatar: profile.avatar || undefined,
      };

      if (claimedRole === 'teacher') {
        return {
          ...base,
          subject: profile.subject,
          assignedGrades: profile.assignedGrades,
          teacherObj: { ...profile, id: profileId || profile.id, authUid: firebaseUser.uid },
        };
      }
      if (claimedRole === 'student') return { ...base, gradeLevel: profile.gradeLevel, studentObj: profile };
      if (claimedRole === 'parent') return { ...base, parentObj: profile };
      if (claimedRole === 'supervisor') return { ...base, supervisorObj: profile };
      return { ...base, isDirectress: true };
    } catch (error) {
      console.warn('[FirebaseAuth] Persisted session validation failed:', error);
      try { await firebaseSignOut(auth); } catch {}
      return null;
    }
  }

  static async login(identifier: string, password: string, expectedRole?: UserRole | null): Promise<CurrentUser> {
    await authIsolationReady;
    const normalized = normalizeIdentifier(identifier);
    if (!normalized || !password) throw new Error('يرجى إدخال بيانات الدخول كاملة.');

    // The directory is keyed by a one-way hash. Firestore rules allow GET only, never LIST.
    const identifierHash = await sha256Hex(normalized);
    const directoryRef = doc(db, 'authDirectory', identifierHash);
    const directorySnap = await getDoc(directoryRef);
    if (!directorySnap.exists()) {
      throw new Error('بيانات الدخول غير صحيحة.');
    }

    const directory = directorySnap.data() as any;
    const authEmail = String(directory.authEmail || '').trim().toLowerCase();
    if (!authEmail) throw new Error('الحساب غير مهيأ للمصادقة الآمنة.');

    try {
      const credential = await signInWithEmailAndPassword(auth, authEmail, password);
      const tokenResult = await credential.user.getIdTokenResult(true);
      const claimedRole = String(tokenResult.claims.role || '') as UserRole;
      const profileId = String(tokenResult.claims.profileId || '');
      const profileCollection = String(tokenResult.claims.profileCollection || profileCollectionForRole(claimedRole) || '');

      if (!ALLOWED_ROLES.has(claimedRole)) {
        await firebaseSignOut(auth);
        throw new Error('صلاحية الحساب غير معرفة بشكل آمن.');
      }
      if (expectedRole && claimedRole !== expectedRole) {
        await firebaseSignOut(auth);
        throw new Error('هذا الحساب لا يملك الصلاحية المطلوبة لهذه الواجهة.');
      }

      let profile: any = {};
      if (profileId && profileCollection) {
        const profileSnap = await getDoc(doc(db, profileCollection, profileId));
        if (!profileSnap.exists()) {
          await firebaseSignOut(auth);
          throw new Error('ملف المستخدم غير موجود أو غير مرتبط بحساب المصادقة.');
        }
        profile = profileSnap.data();
        if (profile.authUid && profile.authUid !== credential.user.uid) {
          await firebaseSignOut(auth);
          throw new Error('فشل التحقق من ارتباط الحساب بملف المستخدم.');
        }
      }

      // SECURITY_FIREBASE_PROFILE_IDENTITY_V1_3
      const base: CurrentUser = {
        authUid: credential.user.uid,
        profileId: profileId || undefined,
        profileCollection: profileCollection || undefined,
        id: profileId || credential.user.uid,
        name: profile.name || credential.user.displayName || (claimedRole === 'admin' ? 'إدارة ثانوية ميسان للمتميزات' : 'مستخدم النظام'),
        role: claimedRole,
        email: profile.email || credential.user.email || undefined,
        phone: profile.phone || undefined,
        avatar: profile.avatar || undefined,
      };

      if (claimedRole === 'teacher') {
        return {
          ...base,
          subject: profile.subject,
          assignedGrades: profile.assignedGrades,
          teacherObj: {
            ...profile,
            id: profileId || profile.id,
            authUid: credential.user.uid,
          },
        };
      }
      if (claimedRole === 'student') {
        return { ...base, gradeLevel: profile.gradeLevel, studentObj: profile };
      }
      if (claimedRole === 'parent') return { ...base, parentObj: profile };
      if (claimedRole === 'supervisor') return { ...base, supervisorObj: profile };
      return { ...base, isDirectress: true };
    } catch (error: any) {
      // Do not reveal whether identifier or password was the failing factor.
      const safeMessages = new Set([
        'هذا الحساب لا يملك الصلاحية المطلوبة لهذه الواجهة.',
        'صلاحية الحساب غير معرفة بشكل آمن.',
        'ملف المستخدم غير موجود أو غير مرتبط بحساب المصادقة.',
        'فشل التحقق من ارتباط الحساب بملف المستخدم.',
      ]);
      if (safeMessages.has(String(error?.message || ''))) throw error;
      throw new Error('بيانات الدخول غير صحيحة أو الحساب غير مفعّل.');
    }
  }


  static async changeCurrentPassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('يجب تسجيل الدخول مجدداً قبل تغيير كلمة المرور.');
    if (newPassword.length < 10) throw new Error('يجب أن تتكون كلمة المرور الجديدة من 10 أحرف على الأقل.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch {
      throw new Error('كلمة المرور الحالية غير صحيحة أو تعذر تحديث كلمة المرور.');
    }
  }

  static async logout(): Promise<void> {
    await firebaseSignOut(auth);
  }
}
