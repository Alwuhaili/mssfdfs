import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  User,
  Shield,
  Check,
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { role, currentUser, changePassword, lang, userPasscodes, teachers, students, parents } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>(role);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(role);
      setSelectedUserId(currentUser?.id || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setShowCurrentPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);
    }
  }, [isOpen, role, currentUser]);

  if (!isOpen) return null;

  const roleOptions: { id: UserRole; titleAr: string; titleEn: string; iconStr: string }[] = [
    { id: 'admin', titleAr: 'المديرة والإدارة المدرسية', titleEn: 'Principal & Admin', iconStr: '👑' },
    { id: 'teacher', titleAr: 'الهيئة التدريسية', titleEn: 'Faculty Teacher', iconStr: '👩‍🏫' },
    { id: 'student', titleAr: 'الطالبات المتميزات', titleEn: 'Gifted Student', iconStr: '🎓' },
    { id: 'parent', titleAr: 'أولياء الأمور', titleEn: 'Parent / Guardian', iconStr: '👪' },
    { id: 'supervisor', titleAr: 'المشرف التربوي', titleEn: 'Educational Supervisor', iconStr: '🏛️' },
  ];

  // Derive active account display name
  const getAccountDisplayName = () => {
    if (currentUser?.name) {
      return currentUser.name;
    }
    if (selectedRole === 'admin') return 'إدارة ثانوية ميسان (المديرة)';
    if (selectedRole === 'supervisor') return 'المشرف التربوي';
    if (selectedRole === 'teacher' && teachers && teachers.length > 0) return teachers[0].name;
    if (selectedRole === 'student' && students && students.length > 0) return students[0].name;
    if (selectedRole === 'parent' && parents && parents.length > 0) return parents[0].name;
    const r = roleOptions.find((ro) => ro.id === selectedRole);
    return r ? (lang === 'ar' ? r.titleAr : r.titleEn) : 'الحساب النشط';
  };

  // Password Strength Calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, labelAr: '', labelEn: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 4) score += 1;
    if (pass.length >= 6) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 33, labelAr: 'ضعيفة', labelEn: 'Weak', color: 'bg-rose-500', textCol: 'text-rose-600' };
    if (score === 2) return { score: 66, labelAr: 'متوسطة', labelEn: 'Medium', color: 'bg-amber-500', textCol: 'text-amber-600' };
    return { score: 100, labelAr: 'قوية وآمنة جداً 🛡️', labelEn: 'Very Strong 🛡️', color: 'bg-emerald-500', textCol: 'text-emerald-600' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword.trim()) {
      setErrorMsg(
        lang === 'ar' ? 'يرجى إدخال كلمة السر / الرمز السري الحالي.' : 'Please enter current password.'
      );
      return;
    }

    if (!newPassword.trim()) {
      setErrorMsg(
        lang === 'ar' ? 'يرجى إدخال كلمة السر الجديدة.' : 'Please enter new password.'
      );
      return;
    }

    if (newPassword.trim().length < 4) {
      setErrorMsg(
        lang === 'ar'
          ? 'يجب أن تتكون كلمة السر الجديدة من 4 خانات على الأقل.'
          : 'New password must be at least 4 characters.'
      );
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMsg(
        lang === 'ar' ? 'كلمات السر الجديدة غير متطابقة!' : 'New passwords do not match!'
      );
      return;
    }

    const accountName = getAccountDisplayName();
    const effectiveUserKey = selectedUserId || currentUser?.id;
    const res = changePassword(selectedRole, currentPassword.trim(), newPassword.trim(), {
      targetUserId: effectiveUserKey,
      userKey: effectiveUserKey,
      accountName: accountName,
    });

    if (res.success) {
      setSuccessMsg(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2200);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden font-arabic transition-all">
        
        {/* Modal Top Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={lang === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {lang === 'ar' ? 'تغيير كلمة السر لهذا الحساب' : 'Change Account Password'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>تنبيه فوري خاص 🔒</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {lang === 'ar'
                  ? 'تحديث الرمز السري للحساب الحالي مع إرسال إشعار فوري لمالك الحساب فقط'
                  : 'Update security passcode with instant notification strictly for this account'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Form Content */}
        <div className="p-6 space-y-4 text-xs">

          {/* Current Active Account Box */}
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {lang === 'ar' ? 'الحساب المستهدف بالتعديل:' : 'Target Account:'}
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  {getAccountDisplayName()}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
              {roleOptions.find((r) => r.id === selectedRole)?.iconStr}{' '}
              {lang === 'ar'
                ? roleOptions.find((r) => r.id === selectedRole)?.titleAr
                : roleOptions.find((r) => r.id === selectedRole)?.titleEn}
            </span>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-3 font-bold animate-pulse">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs">{successMsg}</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-normal mt-0.5">
                  تم إرسال إشعار فوري خاص لصاحب الحساب، وتم تأمين الحساب بكلمة السر الجديدة.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-center gap-3 font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <p className="text-xs">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role switch option if user wants to change another account */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {lang === 'ar' ? '1. نوع الحساب / الصفة:' : '1. Account Role:'}
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as UserRole);
                  setErrorMsg('');
                }}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-xs"
              >
                {roleOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.iconStr} {lang === 'ar' ? r.titleAr : r.titleEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">
                  {lang === 'ar' ? '2. كلمة السر / الرمز السري الحالي *' : '2. Current Password *'}
                </label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  {userPasscodes[selectedUserId || currentUser?.id || selectedRole] ? 'تم تعيين رمز خاص مسبقاً 🔒' : 'الافتراضي: 1234'}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  placeholder={lang === 'ar' ? 'أدخلي الرمز السري الحالي للحساب...' : 'Enter current passcode...'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                {lang === 'ar' ? '3. كلمة السر الجديدة *' : '3. New Password *'}
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  placeholder={lang === 'ar' ? 'أدخلي كلمة السر الجديدة (4 خانات أو أكثر)...' : 'Enter new password (4+ chars)...'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    <span>مستوى قوة الأمان:</span>
                    <span className={strength.textCol}>
                      {lang === 'ar' ? strength.labelAr : strength.labelEn}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password Field */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                {lang === 'ar' ? '4. تأكيد كلمة السر الجديدة *' : '4. Confirm New Password *'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  placeholder={lang === 'ar' ? 'أعيدي إدخال كلمة السر الجديدة للتأكيد...' : 'Re-enter new password to confirm...'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                  ⚠️ كلمات المرور غير متطابقة!
                </p>
              )}
            </div>

            {/* Privacy Guarantee Box */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900 flex items-start gap-2.5 text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                {lang === 'ar'
                  ? '🔒 استقلالية وحماية تامة للرمز السري: هذا التغيير خاص بحسابك الفردي فقط، ولن يؤثر مطلقاً على كلمات السر لبقية المستخدمين أو المعلمات أو الطالبات أو المجموعة أو الفئة.'
                  : '🔒 Strict Passcode Isolation: This change is strictly for your individual account and will never affect other users, teachers, students, or the role group.'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
              >
                <KeyRound className="w-4 h-4" />
                <span>{lang === 'ar' ? 'حفظ وتحديث كلمة السر' : 'Save New Password'}</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
