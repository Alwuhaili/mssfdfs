import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Teacher, Student, Parent, GradeLevel, ALL_GRADES_LIST } from '../types';
import { PRESET_SHIELDS_AND_BADGES } from '../data/shieldsData';
import { isMaleTeacher, getTeacherAccountLabel } from '../utils/teacherUtils';
import {
  X,
  UserCheck,
  Edit,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  ShieldAlert,
  Save,
  Lock,
  Ban,
  CheckCircle2,
  Award,
  Camera,
  Upload,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'teacher' | 'student' | 'parent';
  userData: Teacher | Student | Parent | null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  userType,
  userData,
}) => {
  const {
    lang,
    role,
    updateTeacher,
    updateStudent,
    updateParent,
    getUserPasscode,
    adminUpdateUserPasscode,
  } = useApp();

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Passcode field
  const [passcode, setPasscode] = useState('1234');
  const [showPasscode, setShowPasscode] = useState(false);
  const [notifyOwnerOnPasscodeChange, setNotifyOwnerOnPasscodeChange] = useState(true);

  // Teacher fields
  const [subject, setSubject] = useState('');
  const [assignedGrades, setAssignedGrades] = useState<GradeLevel[]>([]);
  const [teacherStatus, setTeacherStatus] = useState<Teacher['status']>('نشط');
  const [availableDays, setAvailableDays] = useState<string[]>([
    'الأحد',
    'الإثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
  ]);

  // Student fields
  const [nationalId, setNationalId] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('الصف السادس العلمي');
  const [section, setSection] = useState('أ');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [gpa, setGpa] = useState<number>(98.5);
  const [enrollmentYear, setEnrollmentYear] = useState('2026');
  const [studentStatus, setStudentStatus] = useState<Student['status']>('منتظمة');
  const [studentBadges, setStudentBadges] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Parent fields
  const [studentName, setStudentName] = useState('');
  const [parentStatus, setParentStatus] = useState<'نشط' | 'محظور' | 'مقيد الوصول'>('نشط');

  useEffect(() => {
    if (!userData) return;

    setName(userData.name || '');
    setEmail(userData.email || '');
    setPhone(userData.phone || '');
    setAvatar((userData as any).avatar || '');

    if (userType === 'teacher') {
      const t = userData as Teacher;
      setSubject(t.subject || '');
      setAssignedGrades(t.assignedGrades || ['الصف السادس العلمي']);
      setTeacherStatus(t.status || 'نشط');
      setAvailableDays(
        t.availableDays && t.availableDays.length > 0
          ? t.availableDays
          : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
      );
    } else if (userType === 'student') {
      const s = userData as Student;
      setNationalId(s.nationalId || '');
      setPhone(s.phone || '');
      setEmail(s.email || '');
      setGradeLevel(s.gradeLevel || 'الصف السادس العلمي');
      setSection(s.section || 'أ');
      setParentName(s.parentName || '');
      setParentPhone(s.parentPhone || '');
      setParentEmail(s.parentEmail || '');
      setGpa(s.gpa || 98.5);
      setEnrollmentYear(s.enrollmentYear || '2026');
      setStudentStatus(s.status || 'منتظمة');
      setStudentBadges(
        (s.shieldsAndBadges && s.shieldsAndBadges.length > 0)
          ? s.shieldsAndBadges.map((b) => b.title)
          : (s.badges || [])
      );
      setNotes(s.notes || '');
    } else if (userType === 'parent') {
      const p = userData as Parent;
      setStudentName(p.studentName || '');
      setGradeLevel(p.gradeLevel || 'الصف السادس العلمي');
      setParentStatus(p.status || 'نشط');
    }

    // Load passcode
    const currentPin = getUserPasscode(userData.id, userType);
    setPasscode(currentPin);
  }, [userData, userType, isOpen, getUserPasscode]);

  if (!isOpen || !userData) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, JPEG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatar(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGradeToggle = (grade: GradeLevel) => {
    if (assignedGrades.includes(grade)) {
      if (assignedGrades.length > 1) {
        setAssignedGrades(assignedGrades.filter((g) => g !== grade));
      }
    } else {
      setAssignedGrades([...assignedGrades, grade]);
    }
  };

  const handleDayToggle = (day: string) => {
    if (availableDays.includes(day)) {
      if (availableDays.length > 1) {
        setAvailableDays(availableDays.filter((d) => d !== day));
      }
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const generateRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setPasscode(pin);
    setShowPasscode(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (userType === 'teacher') {
      updateTeacher(userData.id, {
        name,
        email,
        phone,
        subject,
        assignedGrades,
        status: teacherStatus,
        availableDays,
      });
    } else if (userType === 'student') {
      updateStudent(userData.id, {
        name,
        avatar,
        nationalId,
        phone,
        email,
        gradeLevel,
        section,
        parentName,
        parentPhone,
        parentEmail,
        gpa: Number(gpa),
        enrollmentYear,
        status: studentStatus,
        badges: studentBadges,
        notes,
      });
    } else if (userType === 'parent') {
      updateParent(userData.id, {
        name,
        phone,
        email,
        studentName,
        gradeLevel,
        status: parentStatus,
      });
    }

    // Save passcode if admin
    if (role === 'admin' && passcode.trim()) {
      adminUpdateUserPasscode(userData.id, passcode, {
        userName: name,
        userRole: userType,
        userIdentifier: email || phone || (userData as any).nationalId || userData.id,
        sendNotification: notifyOwnerOnPasscodeChange,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-arabic">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-indigo-600 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20">
              <Edit className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'ar'
                  ? userType === 'teacher'
                    ? (isMaleTeacher(userData, (userData as any)?.gender) ? 'حساب المدرس' : 'حساب المدرسة')
                    : userType === 'student'
                    ? 'تعديل بيانات الطالبة وحالة القيد'
                    : 'تعديل بيانات ولي الأمر والحظر'
                  : 'Edit User Profile & Access'}
              </h3>
              <p className="text-xs text-indigo-100">
                {userType === 'teacher'
                  ? (isMaleTeacher(userData, (userData as any)?.gender) ? 'تعديل حساب وبيانات المدرس' : 'تعديل حساب وبيانات المدرسة')
                  : userData.name}{' '}
                - {userData.name} (معرف: {userData.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Avatar Upload for Student & User */}
          {userType === 'student' && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-2xl bg-white border-2 border-indigo-300 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-2xl select-none">👩🏻‍🎓</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-950">صورة الطالبة الشخصية</h4>
                  <p className="text-[11px] text-slate-500">تظهر في البطاقة التعريفية ولوحة التحكم</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>تغيير الصورة</span>
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-600 text-xs font-bold transition-all cursor-pointer"
                    title="حذف الصورة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Status Access Control Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'ar' ? 'حالة الحساب وصلاحيات الوصول للسيستم:' : 'Account Status & Access Level:'}</span>
            </label>

            {userType === 'teacher' && (
              <select
                value={teacherStatus}
                onChange={(e) => setTeacherStatus(e.target.value as Teacher['status'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="نشط">✅ نشط (مسموح بالدخول وإدارة المحاضرات والاختبارات)</option>
                <option value="في إجازة">🏖️ في إجازة (حساب مؤقت)</option>
                <option value="مقيد الوصول">🔒 مقيد الوصول (عرض البيانات فقط بدون تعديل)</option>
                <option value="محظور">🚫 محظور (منع الدخول تماماً للنظام)</option>
              </select>
            )}

            {userType === 'student' && (
              <select
                value={studentStatus}
                onChange={(e) => setStudentStatus(e.target.value as Student['status'])}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="منتظمة">✅ منتظمة (نشطة بالكامل بالمدرسة)</option>
                <option value="مؤجلة">⏸️ مؤجلة للدراسة</option>
                <option value="منقولة">🎒 منقولة لمدرسة أخرى</option>
                <option value="مقيدة الوصول">🔒 مقيدة الوصول (منع أداء الامتحانات)</option>
                <option value="محظورة">🚫 محظورة (حظر حساب الطالبة)</option>
              </select>
            )}

            {userType === 'parent' && (
              <select
                value={parentStatus}
                onChange={(e) => setParentStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="نشط">✅ نشط (متابعة كاملة للطالبة)</option>
                <option value="مقيد الوصول">🔒 مقيد الوصول (عرض السجلات فقط)</option>
                <option value="محظور">🚫 محظور (حظر حساب ولي الأمر)</option>
              </select>
            )}
          </div>

          {/* Passcode / Secret PIN Management (خاص بالمديرة والإدارة فقط) */}
          {role === 'admin' && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-black text-amber-950">
                    {lang === 'ar' ? 'الرمز السري للدخول للحساب (Passcode PIN) 🔑' : 'Account Passcode PIN 🔑'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={generateRandomPin}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>توليد رمز عشوائي 🎲</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="أدخل الرمز السري (مثال: 1234 أو رمز جديد)"
                  required
                  minLength={3}
                  className="w-full ps-3.5 pe-12 py-2.5 rounded-xl bg-white border border-amber-300 text-xs font-mono font-bold text-slate-900 tracking-widest focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                  title={showPasscode ? 'إخفاء الرمز' : 'إظهار الرمز'}
                >
                  {showPasscode ? <EyeOff className="w-4 h-4 text-amber-700" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-900/80 pt-1">
                <span>الرمز الافتراضي المعتمد للمنصة: <strong>1234</strong></span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={notifyOwnerOnPasscodeChange}
                    onChange={(e) => setNotifyOwnerOnPasscodeChange(e.target.checked)}
                    className="w-3.5 h-3.5 text-amber-600 rounded"
                  />
                  <span>إرسال إشعار لصاحب الحساب بالتغيير 🔔</span>
                </label>
              </div>
            </div>
          )}

          {/* User Name & Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'ar'
                  ? userType === 'student'
                    ? 'اسم الطالبة الرباعي الكامل *'
                    : userType === 'teacher'
                    ? (isMaleTeacher(userData, (userData as any)?.gender) ? 'اسم المدرس الثلاثي واللقب *' : 'اسم المدرسة الثلاثي واللقب *')
                    : 'الاسم الكامل *'
                  : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>

            {userType === 'student' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'الرقم الوطني / رقم القيد المدني *' : 'National ID / Civil Record *'}</span>
                  <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                    {lang === 'ar' ? 'قابل للتعديل ✍️' : 'Editable'}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="مثال: 1092837465"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50/40 text-xs text-indigo-950 font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            )}
          </div>

          {/* Student Phone & Email (Both Optional) OR Standard Email for others */}
          {userType === 'student' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'رقم هاتف الطالبة' : 'Student Phone'}</span>
                  <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                    {lang === 'ar' ? 'اختياري (ليس إجبارياً)' : 'Optional'}
                  </span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0770xxxxxxx (اختياري)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'البريد الإلكتروني للطالبة' : 'Student Email'}</span>
                  <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                    {lang === 'ar' ? 'اختياري (ليس إجبارياً)' : 'Optional'}
                  </span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@maysan-gifted.edu.iq (اختياري)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 font-sans"
                  dir="ltr"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {lang === 'ar' ? 'البريد الإلكتروني الرسمى *' : 'Official Email *'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 font-sans"
                dir="ltr"
              />
            </div>
          )}

          {/* Teacher specific edit fields */}
          {userType === 'teacher' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'التخصص والمادة الدراسية *' : 'Subject *'}
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'الصفوف المكلفة بتدريسها:' : 'Assigned Grades:'}
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ALL_GRADES_LIST.map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => handleGradeToggle(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        assignedGrades.includes(g)
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ar' ? 'أيام الحصص والدوام الدراسي الأسبوعية:' : 'Teaching Days Schedule:'}
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                        }`}
                      >
                        {isSelected ? '✓ ' + day : '✕ ' + day}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {lang === 'ar'
                    ? `عند عدم تحديد يوم معين (مثل الخميس)، فلن يتم وضع أي حصص دراسية ${isMaleTeacher(userData, (userData as any)?.gender) ? 'للمدرس' : 'للمدرسة'} في هذا اليوم عند توليد الجدول الآلي.`
                    : 'Unselected days will be excluded during automatic schedule generation.'}
                </p>
              </div>
            </>
          )}

          {/* Student specific edit fields */}
          {userType === 'student' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرحلة الدراسية:</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
                  >
                    {ALL_GRADES_LIST.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الشعبة:</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-bold"
                  >
                    <option value="أ">شعبة أ</option>
                    <option value="ب">شعبة ب</option>
                    <option value="ج">شعبة ج</option>
                    <option value="د">شعبة د</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المعدل (GPA %):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={gpa}
                    onChange={(e) => setGpa(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>سنة القبول:</span>
                    <span className="text-[10px] text-indigo-600 font-bold">قابل للتعديل</span>
                  </label>
                  <input
                    type="text"
                    value={enrollmentYear}
                    onChange={(e) => setEnrollmentYear(e.target.value)}
                    placeholder="مثال: 2022"
                    className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/30 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم ولي الأمر:</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">هاتف ولي الأمر:</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Badges & Shields Management in Edit Modal */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>الدروع والأوسمة الممنوحة للطالبة:</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {studentBadges.length} أوسمة مفعلة
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80">
                  انقر على أي درع أو وسام لتفعيله أو إلغائه، وسيتم إدراجه تلقائياً في البطاقة التعريفية للطالبة:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {PRESET_SHIELDS_AND_BADGES.map((preset) => {
                    const isAssigned = studentBadges.includes(preset.title);
                    return (
                      <button
                        type="button"
                        key={preset.title}
                        onClick={() => {
                          if (isAssigned) {
                            setStudentBadges(studentBadges.filter((b) => b !== preset.title));
                          } else {
                            setStudentBadges([...studentBadges, preset.title]);
                          }
                        }}
                        className={`p-2 rounded-xl text-right text-xs font-bold transition-all border flex items-center justify-between gap-2 ${
                          isAssigned
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-extrabold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-sm">{preset.icon}</span>
                          <span className="truncate text-[11px]">{preset.title}</span>
                        </div>
                        <span className="text-[10px] shrink-0 font-black">
                          {isAssigned ? '✓ ممنوح' : '+ إضافة'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Parent specific edit fields */}
          {userType === 'parent' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم الطالبة التابعة له:</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'ar' ? 'حفظ التغييرات والتراخيص' : 'Save Changes'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
