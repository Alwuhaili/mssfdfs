import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, EducationalSupervisor } from '../types';
import {
  Lock,
  Mail,
  User,
  Phone,
  KeyRound,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface RoleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: UserRole | null;
  onSuccess: (role: UserRole) => void;
}

export const ROLE_CREDENTIALS_DEMO: Record<
  UserRole,
  {
    roleTitleAr: string;
    roleTitleEn: string;
    iconStr: string;
    defaultEmail: string;
    defaultUsername: string;
    defaultPhone: string;
    defaultPasscode: string;
  }
> = {
  admin: {
    roleTitleAr: 'المديرة والإدارة المدرسية',
    roleTitleEn: 'Principal & Admin',
    iconStr: '👑',
    defaultEmail: 'admin@maysan.edu',
    defaultUsername: 'admin_maysan',
    defaultPhone: '07701234567',
    defaultPasscode: '1234',
  },
  teacher: {
    roleTitleAr: 'الهيئة التدريسية',
    roleTitleEn: 'Faculty Teacher',
    iconStr: '👩‍🏫',
    defaultEmail: 'teacher@maysan-gifted.edu.iq',
    defaultUsername: 'teacher_maysan',
    defaultPhone: '07701234567',
    defaultPasscode: '1234',
  },
  student: {
    roleTitleAr: 'الطالبات المتميزات',
    roleTitleEn: 'Gifted Student',
    iconStr: '🎓',
    defaultEmail: 'nagham.alkaabi@maysan-gifted.edu.iq',
    defaultUsername: 'student_nagham',
    defaultPhone: '07709998877',
    defaultPasscode: '1234',
  },
  parent: {
    roleTitleAr: 'أولياء الأمور',
    roleTitleEn: 'Parent / Guardian',
    iconStr: '👪',
    defaultEmail: 'ali.alkaabi@gmail.com',
    defaultUsername: 'parent_ali',
    defaultPhone: '07709998877',
    defaultPasscode: '1234',
  },
  supervisor: {
    roleTitleAr: 'المشرف التربوي',
    roleTitleEn: 'Educational Supervisor',
    iconStr: '🏛️',
    defaultEmail: 'haider.supervisor@maysan.edu.iq',
    defaultUsername: 'haider_supervisor',
    defaultPhone: '07709988776',
    defaultPasscode: '1234',
  },
};

export const RoleAuthModal: React.FC<RoleAuthModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  onSuccess,
}) => {
  const { lang, teachers, students, parents, supervisors, userPasscodes, setCurrentUser } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [passcode, setPasscode] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [matchedRoleTitle, setMatchedRoleTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setIsSuccess(false);
      setShowPasscode(false);
      if (targetRole === 'teacher' && teachers && teachers.length > 0) {
        setSelectedTeacherId(teachers[0].id);
        setSelectedStudentId('');
        setSelectedParentId('');
        setSelectedSupervisorId('');
        setIdentifier(teachers[0].email);
        setPasscode(ROLE_CREDENTIALS_DEMO.teacher.defaultPasscode);
      } else if (targetRole === 'student' && students && students.length > 0) {
        setSelectedTeacherId('');
        setSelectedStudentId(students[0].id);
        setSelectedParentId('');
        setSelectedSupervisorId('');
        setIdentifier(students[0].nationalId || students[0].email || ROLE_CREDENTIALS_DEMO.student.defaultEmail);
        setPasscode(ROLE_CREDENTIALS_DEMO.student.defaultPasscode);
      } else if (targetRole === 'parent' && parents && parents.length > 0) {
        setSelectedTeacherId('');
        setSelectedStudentId('');
        setSelectedParentId(parents[0].id);
        setSelectedSupervisorId('');
        setIdentifier(parents[0].email || parents[0].phone || ROLE_CREDENTIALS_DEMO.parent.defaultEmail);
        setPasscode(ROLE_CREDENTIALS_DEMO.parent.defaultPasscode);
      } else if (targetRole === 'supervisor' && supervisors && supervisors.length > 0) {
        setSelectedTeacherId('');
        setSelectedStudentId('');
        setSelectedParentId('');
        const primaryOrFirstSup = supervisors.find((s) => s.isPrimary) || supervisors[0];
        setSelectedSupervisorId(primaryOrFirstSup.id);
        setIdentifier(primaryOrFirstSup.email || primaryOrFirstSup.phone || primaryOrFirstSup.name);
        const customPass = userPasscodes?.[primaryOrFirstSup.id] || '1234';
        setPasscode(customPass);
      } else if (targetRole) {
        setSelectedTeacherId('');
        setSelectedStudentId('');
        setSelectedParentId('');
        setSelectedSupervisorId('');
        const info = ROLE_CREDENTIALS_DEMO[targetRole];
        setIdentifier(info.defaultEmail);
        setPasscode(info.defaultPasscode);
      } else {
        setSelectedTeacherId('');
        setSelectedStudentId('');
        setSelectedParentId('');
        setSelectedSupervisorId('');
        setIdentifier('');
        setPasscode('');
      }
    }
  }, [isOpen, targetRole, teachers, students, parents, supervisors]);

  if (!isOpen) return null;

  const roleInfo = targetRole ? ROLE_CREDENTIALS_DEMO[targetRole] : ROLE_CREDENTIALS_DEMO.admin;

  const handleAutoFill = () => {
    if (targetRole === 'teacher' && teachers && teachers.length > 0) {
      const targetTech = selectedTeacherId
        ? teachers.find((t) => t.id === selectedTeacherId) || teachers[0]
        : teachers[0];
      setSelectedTeacherId(targetTech.id);
      setIdentifier(targetTech.email);
      setPasscode(ROLE_CREDENTIALS_DEMO.teacher.defaultPasscode);
    } else if (targetRole === 'student' && students && students.length > 0) {
      const targetStd = selectedStudentId
        ? students.find((s) => s.id === selectedStudentId) || students[0]
        : students[0];
      setSelectedStudentId(targetStd.id);
      setIdentifier(targetStd.nationalId || targetStd.name || ROLE_CREDENTIALS_DEMO.student.defaultEmail);
      setPasscode(ROLE_CREDENTIALS_DEMO.student.defaultPasscode);
    } else if (targetRole === 'parent' && parents && parents.length > 0) {
      const targetPr = selectedParentId
        ? parents.find((p) => p.id === selectedParentId) || parents[0]
        : parents[0];
      setSelectedParentId(targetPr.id);
      setIdentifier(targetPr.email || targetPr.phone || ROLE_CREDENTIALS_DEMO.parent.defaultEmail);
      setPasscode(ROLE_CREDENTIALS_DEMO.parent.defaultPasscode);
    } else if (targetRole === 'supervisor' && supervisors && supervisors.length > 0) {
      const targetSup = selectedSupervisorId
        ? supervisors.find((s) => s.id === selectedSupervisorId) || supervisors[0]
        : (supervisors.find((s) => s.isPrimary) || supervisors[0]);
      setSelectedSupervisorId(targetSup.id);
      setIdentifier(targetSup.email || targetSup.phone || targetSup.name);
      const customPass = userPasscodes?.[targetSup.id] || '1234';
      setPasscode(customPass);
    } else {
      setIdentifier(roleInfo.defaultEmail);
      setPasscode(roleInfo.defaultPasscode);
    }
    setErrorMsg('');
  };

  const findTeacher = (searchStr: string) => {
    const query = searchStr.trim().toLowerCase();

    if (query) {
      let found = teachers.find(
        (t) =>
          t.id.toLowerCase() === query ||
          t.email.toLowerCase() === query ||
          t.phone === query ||
          (t.name && t.name.toLowerCase() === query)
      );
      if (found) return found;

      found = teachers.find((t) => {
        const prefix = t.email.split('@')[0].toLowerCase();
        return prefix === query || query.includes(prefix) || prefix.includes(query.replace(/^(teacher_|tech_|أ_|د_)/g, ''));
      });
      if (found) return found;

      found = teachers.find(
        (t) => t.name.toLowerCase().includes(query) || query.includes(t.name.toLowerCase())
      );
      if (found) return found;
    }

    if (selectedTeacherId && targetRole === 'teacher') {
      const sel = teachers.find((t) => t.id === selectedTeacherId);
      if (sel) return sel;
    }

    return undefined;
  };

  const findStudent = (searchStr: string) => {
    const query = searchStr.trim().toLowerCase();

    if (query) {
      let found = students.find(
        (s) =>
          s.id.toLowerCase() === query ||
          s.nationalId.toLowerCase() === query ||
          (s.email && s.email.toLowerCase() === query) ||
          s.parentEmail.toLowerCase() === query ||
          (s.phone && s.phone === query) ||
          s.parentPhone === query ||
          (s.name && s.name.toLowerCase() === query) ||
          (s.name && (s.name.toLowerCase().includes(query) || query.includes(s.name.toLowerCase())))
      );
      if (found) return found;

      if (
        query === ROLE_CREDENTIALS_DEMO.student.defaultEmail.toLowerCase() ||
        query === ROLE_CREDENTIALS_DEMO.student.defaultUsername.toLowerCase() ||
        query.includes('student') ||
        query.includes('طالبة') ||
        query.includes('متميزة') ||
        query.includes('نغم')
      ) {
        return students[0];
      }
    }

    if (selectedStudentId && targetRole === 'student') {
      const sel = students.find((s) => s.id === selectedStudentId);
      if (sel) return sel;
    }

    return students[0];
  };

  const findParent = (searchStr: string) => {
    const query = searchStr.trim().toLowerCase();

    if (query) {
      let found = parents.find(
        (p) =>
          p.id.toLowerCase() === query ||
          p.email.toLowerCase() === query ||
          p.phone === query ||
          (p.name && p.name.toLowerCase() === query) ||
          (p.name && (p.name.toLowerCase().includes(query) || query.includes(p.name.toLowerCase())))
      );
      if (found) return found;

      if (
        query === ROLE_CREDENTIALS_DEMO.parent.defaultEmail.toLowerCase() ||
        query === ROLE_CREDENTIALS_DEMO.parent.defaultUsername.toLowerCase() ||
        query.includes('parent') ||
        query.includes('ولي') ||
        query.includes('أمر') ||
        query.includes('علي')
      ) {
        return parents[0];
      }
    }

    if (selectedParentId && targetRole === 'parent') {
      const sel = parents.find((p) => p.id === selectedParentId);
      if (sel) return sel;
    }

    return parents[0];
  };

  const findSupervisor = (searchStr: string): EducationalSupervisor | undefined => {
    const query = searchStr.trim().toLowerCase();

    if (query && supervisors && supervisors.length > 0) {
      // 1. Direct ID / Email / Phone / Name match
      let found = supervisors.find(
        (s) =>
          s.id.toLowerCase() === query ||
          (s.email && s.email.toLowerCase() === query) ||
          (s.phone && s.phone === query) ||
          (s.name && s.name.toLowerCase() === query)
      );
      if (found) return found;

      // 2. Email prefix or username match
      found = supervisors.find((s) => {
        if (!s.email) return false;
        const prefix = s.email.split('@')[0].toLowerCase();
        return prefix === query || query.includes(prefix) || prefix.includes(query.replace(/^(supervisor_|sup_|أ_|د_)/g, ''));
      });
      if (found) return found;

      // 3. Substring name match
      found = supervisors.find(
        (s) => s.name.toLowerCase().includes(query) || query.includes(s.name.toLowerCase())
      );
      if (found) return found;

      // 4. Specialization match
      found = supervisors.find(
        (s) => s.specialization && (s.specialization.toLowerCase().includes(query) || query.includes(s.specialization.toLowerCase()))
      );
      if (found) return found;
    }

    if (selectedSupervisorId && supervisors && supervisors.length > 0) {
      const sel = supervisors.find((s) => s.id === selectedSupervisorId);
      if (sel) return sel;
    }

    if (supervisors && supervisors.length > 0) {
      return supervisors.find((s) => s.isPrimary) || supervisors[0];
    }

    return undefined;
  };

  const handleVerifyAndSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMatchedRoleTitle('');

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = passcode.trim();

    if (!cleanId) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم أو رقم الهاتف'
          : 'Please enter your email, username, or phone number'
      );
      return;
    }

    if (!cleanPass) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى إدخال الرمز السري أو كلمة المرور'
          : 'Please enter passcode or password'
      );
      return;
    }

    // Auto-detect user role from registered database entities & demo credentials
    let detectedRole: UserRole | null = null;
    let accountName = '';

    // Check targetRole first if explicitly selected
    if (targetRole === 'admin') {
      if (
        cleanId === ROLE_CREDENTIALS_DEMO.admin.defaultEmail.toLowerCase() ||
        cleanId === ROLE_CREDENTIALS_DEMO.admin.defaultUsername.toLowerCase() ||
        cleanId === ROLE_CREDENTIALS_DEMO.admin.defaultPhone.toLowerCase() ||
        cleanId.includes('admin') ||
        cleanId.includes('إدارة') ||
        cleanId.includes('مديرة') ||
        cleanPass === '1234'
      ) {
        detectedRole = 'admin';
        accountName = 'إدارة ثانوية ميسان';
      }
    } else if (targetRole === 'teacher') {
      const matchedTeacher = findTeacher(cleanId);
      if (matchedTeacher) {
        detectedRole = 'teacher';
        accountName = `${matchedTeacher.name} - قسم ${matchedTeacher.subject}`;
      } else if (cleanPass === '1234') {
        detectedRole = 'teacher';
        accountName = teachers[0]?.name ? `${teachers[0].name} - قسم ${teachers[0].subject}` : 'الهيئة التدريسية';
      }
    } else if (targetRole === 'student') {
      const matchedStudent = findStudent(cleanId);
      if (matchedStudent) {
        detectedRole = 'student';
        accountName = matchedStudent.name;
      } else if (cleanPass === '1234') {
        detectedRole = 'student';
        accountName = students[0]?.name || 'الطالبات المتميزات';
      }
    } else if (targetRole === 'parent') {
      const matchedParent = findParent(cleanId);
      if (matchedParent) {
        detectedRole = 'parent';
        accountName = matchedParent.name;
      } else if (cleanPass === '1234') {
        detectedRole = 'parent';
        accountName = parents[0]?.name || 'أولياء الأمور';
      }
    } else if (targetRole === 'supervisor') {
      const matchedSup = findSupervisor(cleanId);
      if (matchedSup) {
        detectedRole = 'supervisor';
        accountName = `${matchedSup.name} - ${matchedSup.title}`;
      } else if (
        cleanId === ROLE_CREDENTIALS_DEMO.supervisor.defaultEmail.toLowerCase() ||
        cleanId === ROLE_CREDENTIALS_DEMO.supervisor.defaultUsername.toLowerCase() ||
        cleanId === ROLE_CREDENTIALS_DEMO.supervisor.defaultPhone.toLowerCase() ||
        cleanId.includes('supervisor') ||
        cleanId.includes('مشرف') ||
        cleanPass === '1234'
      ) {
        detectedRole = 'supervisor';
        const primarySup = supervisors?.find(s => s.isPrimary) || supervisors?.[0];
        accountName = primarySup ? `${primarySup.name} - ${primarySup.title}` : 'المشرف التربوي المعتمد';
      }
    }

    // Generic fallback checks if not matched via targetRole
    if (!detectedRole) {
      if (
        cleanId === ROLE_CREDENTIALS_DEMO.admin.defaultEmail.toLowerCase() ||
        cleanId === ROLE_CREDENTIALS_DEMO.admin.defaultUsername.toLowerCase() ||
        cleanId.includes('admin') ||
        cleanId.includes('مديرة')
      ) {
        detectedRole = 'admin';
        accountName = 'إدارة ثانوية ميسان';
      } else if (findTeacher(cleanId)) {
        const t = findTeacher(cleanId)!;
        detectedRole = 'teacher';
        accountName = `${t.name} - قسم ${t.subject}`;
      } else if (supervisors && supervisors.some((s) => (s.email && s.email.toLowerCase() === cleanId) || (s.phone && s.phone === cleanId) || s.name.toLowerCase() === cleanId || s.id.toLowerCase() === cleanId)) {
        const s = supervisors.find((sup) => (sup.email && sup.email.toLowerCase() === cleanId) || (sup.phone && sup.phone === cleanId) || sup.name.toLowerCase() === cleanId || sup.id.toLowerCase() === cleanId)!;
        detectedRole = 'supervisor';
        accountName = `${s.name} - ${s.title}`;
      } else if (students.some((s) => s.nationalId.toLowerCase() === cleanId || s.email?.toLowerCase() === cleanId || s.name?.toLowerCase() === cleanId)) {
        const s = students.find((st) => st.nationalId.toLowerCase() === cleanId || st.email?.toLowerCase() === cleanId || st.name?.toLowerCase() === cleanId)!;
        detectedRole = 'student';
        accountName = s.name;
      } else if (parents.some((p) => p.email.toLowerCase() === cleanId || p.phone === cleanId || p.name?.toLowerCase() === cleanId)) {
        const p = parents.find((pr) => pr.email.toLowerCase() === cleanId || pr.phone === cleanId || pr.name?.toLowerCase() === cleanId)!;
        detectedRole = 'parent';
        accountName = p.name;
      } else if (cleanId.includes('supervisor') || cleanId.includes('مشرف')) {
        detectedRole = 'supervisor';
        const primarySup = supervisors?.find(s => s.isPrimary) || supervisors?.[0];
        accountName = primarySup ? `${primarySup.name} - ${primarySup.title}` : 'المشرف التربوي المعتمد';
      } else if (targetRole) {
        detectedRole = targetRole;
      }
    }

    if (!detectedRole) {
      setErrorMsg(
        lang === 'ar'
          ? 'عذراً! لم يتم العثور على حساب مسجل بهذا البريد أو الاسم أو الرقم في النظام.'
          : 'No registered user found with these credentials.'
      );
      return;
    }

    // Check Passcode validation for detectedRole
    const matchedTeacher = detectedRole === 'teacher' ? findTeacher(cleanId) : null;
    const matchedStudent = detectedRole === 'student' ? findStudent(cleanId) : null;
    const matchedParent = detectedRole === 'parent' ? findParent(cleanId) : null;
    const matchedSupervisor = detectedRole === 'supervisor' ? findSupervisor(cleanId) : null;

    const specificId =
      matchedTeacher?.id ||
      matchedStudent?.id ||
      matchedParent?.id ||
      matchedSupervisor?.id ||
      (detectedRole === 'admin' ? 'admin-main' : undefined);

    const specificCustomPasscode = specificId && userPasscodes ? userPasscodes[specificId] : undefined;
    const adminCustomPasscode =
      detectedRole === 'admin' && userPasscodes
        ? userPasscodes['admin-main'] || userPasscodes['admin']
        : undefined;

    const effectivePasscode =
      specificCustomPasscode ||
      adminCustomPasscode ||
      ROLE_CREDENTIALS_DEMO[detectedRole]?.defaultPasscode ||
      '1234';
    
    const isPasscodeValid = cleanPass === effectivePasscode;

    if (!isPasscodeValid) {
      setErrorMsg(
        lang === 'ar'
          ? `عذراً! الرمز السري غير صحيح للحساب المحدد (${accountName || ROLE_CREDENTIALS_DEMO[detectedRole].roleTitleAr}). يرجى مراجعة إدارة المدرسة للتأكد من الرمز السري.`
          : `Invalid passcode for account (${accountName || ROLE_CREDENTIALS_DEMO[detectedRole].roleTitleEn}). Please check with administration.`
      );
      return;
    }

    // Check account status restriction (banned / blocked)
    if (detectedRole === 'teacher') {
      const teacherObj = findTeacher(cleanId);
      if (teacherObj && teacherObj.status === 'محظور') {
        setErrorMsg(
          lang === 'ar'
            ? '🚫 عذراً! تم حظر حساب المدرسة بقرار إداري. يرجى مراجعة إدارة المدرسة.'
            : '🚫 Teacher account blocked by school administration.'
        );
        return;
      }
      if (teacherObj && teacherObj.status === 'مقيد الوصول') {
        setErrorMsg(
          lang === 'ar'
            ? '🔒 تنبيه! تم تقييد صلاحيات هذا الحساب. يرجى التواصل مع الإدارة.'
            : '🔒 Account access restricted.'
        );
        return;
      }
    } else if (detectedRole === 'student') {
      const studentObj = findStudent(cleanId);
      if (studentObj && studentObj.status === 'محظورة') {
        setErrorMsg(
          lang === 'ar'
            ? '🚫 عذراً! تم حظر حساب الطالبة بقرار إداري من إدارة المدرسة.'
            : '🚫 Student account blocked by school administration.'
        );
        return;
      }
      if (studentObj && studentObj.status === 'مقيدة الوصول') {
        setErrorMsg(
          lang === 'ar'
            ? '🔒 تنبيه! الوصول مقيد لهذه الطالبة (عرض السجلات فقط).'
            : '🔒 Student access restricted.'
        );
        return;
      }
    } else if (detectedRole === 'parent') {
      const parentObj = findParent(cleanId);
      if (parentObj && parentObj.status === 'محظور') {
        setErrorMsg(
          lang === 'ar'
            ? '🚫 عذراً! حساب ولي الأمر محظور حالياً.'
            : '🚫 Parent account blocked.'
        );
        return;
      }
      if (parentObj && parentObj.status === 'مقيد الوصول') {
        setErrorMsg(
          lang === 'ar'
            ? '🔒 تنبيه! حساب ولي الأمر مقيد الوصول.'
            : '🔒 Parent account access restricted.'
        );
        return;
      }
    } else if (detectedRole === 'supervisor') {
      const supObj = findSupervisor(cleanId);
      if (supObj && supObj.status === 'غير نشط') {
        setErrorMsg(
          lang === 'ar'
            ? '🚫 عذراً! تم تعطيل حساب هذا المشرف التربوي مؤقتاً. يرجى التواصل مع إدارة المدرسة.'
            : '🚫 Supervisor account is currently inactive.'
        );
        return;
      }
    }

    // Successful Auth!
    const finalRoleToSwitch = detectedRole;
    const roleTitleAr = ROLE_CREDENTIALS_DEMO[finalRoleToSwitch].roleTitleAr;
    setMatchedRoleTitle(accountName || roleTitleAr);
    setIsSuccess(true);

    // Build user object for setCurrentUser
    if (finalRoleToSwitch === 'teacher') {
      const activeTeacher = findTeacher(cleanId) || teachers[0];

      if (activeTeacher) {
        setCurrentUser({
          id: activeTeacher.id,
          name: activeTeacher.name,
          role: 'teacher',
          email: activeTeacher.email,
          phone: activeTeacher.phone,
          subject: activeTeacher.subject,
          assignedGrades: activeTeacher.assignedGrades,
          teacherObj: activeTeacher,
        });
      } else {
        setCurrentUser({
          id: 'teacher-main',
          name: 'الهيئة التدريسية',
          role: 'teacher',
          email: 'teacher@maysan-gifted.edu.iq',
          subject: 'المناهج العلمية',
          assignedGrades: ['الصف الأول المتوسط', 'الصف السادس العلمي'],
        });
      }
    } else if (finalRoleToSwitch === 'student') {
      const activeStudent = findStudent(cleanId) || students[0];

      if (activeStudent) {
        setCurrentUser({
          id: activeStudent.id,
          name: activeStudent.name,
          role: 'student',
          email: activeStudent.email || activeStudent.parentEmail || 'student@maysan-gifted.edu.iq',
          phone: activeStudent.phone || activeStudent.parentPhone,
          gradeLevel: activeStudent.gradeLevel,
          studentObj: activeStudent,
        });
      }
    } else if (finalRoleToSwitch === 'parent') {
      const activeParent = findParent(cleanId) || parents[0];

      if (activeParent) {
        setCurrentUser({
          id: activeParent.id,
          name: activeParent.name,
          role: 'parent',
          email: activeParent.email,
          phone: activeParent.phone,
          parentObj: activeParent,
        });
      }
    } else if (finalRoleToSwitch === 'admin') {
      setCurrentUser({
        id: 'admin-main',
        name: 'إدارة ثانوية ميسان للمتميزات',
        role: 'admin',
        email: 'admin@maysan-gifted.edu.iq',
      });
    } else if (finalRoleToSwitch === 'supervisor') {
      const activeSupervisor =
        findSupervisor(cleanId) ||
        (selectedSupervisorId ? supervisors.find((s) => s.id === selectedSupervisorId) : null) ||
        supervisors?.find((s) => s.isPrimary) ||
        supervisors?.[0];

      if (activeSupervisor) {
        setCurrentUser({
          id: activeSupervisor.id,
          name: activeSupervisor.name,
          role: 'supervisor',
          email: activeSupervisor.email,
          phone: activeSupervisor.phone,
          avatar: activeSupervisor.avatar,
          supervisorObj: activeSupervisor,
        });
      } else {
        setCurrentUser({
          id: 'supervisor-main',
          name: 'المشرف التربوي المعتمد',
          role: 'supervisor',
          email: 'haider.supervisor@maysan.edu.iq',
        });
      }
    }

    setTimeout(() => {
      setIsSuccess(false);
      setIdentifier('');
      setPasscode('');
      onSuccess(finalRoleToSwitch);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-arabic">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-2xl flex items-center justify-center shadow-inner">
              {roleInfo.iconStr}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>التحقق من هوية الحساب</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                التبديل إلى {lang === 'ar' ? roleInfo.roleTitleAr : roleInfo.roleTitleEn}
              </h3>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleVerifyAndSwitch} className="p-6 space-y-4">
          
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 leading-relaxed">
            {lang === 'ar'
              ? 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم أو رقم الهاتف مع الرمز السري للتحقق والدخول بهذا الدور.'
              : 'Enter your Email, Username, or Phone Number with Passcode to switch role.'}
          </div>

          {/* Quick Auto Fill Demo Helper Button */}
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-2xl">
            <div className="text-xs">
              <span className="font-bold text-amber-900 block">بيانات الدخول السريعة للتجربة:</span>
              <span className="text-[11px] font-mono text-amber-800">
                الرمز السري: <strong className="text-indigo-700">1234</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تعبئة تلقائية</span>
            </button>
          </div>

          {/* Teacher Fast Selector Dropdown (when switching to faculty role) */}
          {(targetRole === 'teacher' || (!targetRole && teachers.length > 0)) && (
            <div className="space-y-1.5 bg-indigo-50/90 p-3.5 rounded-2xl border border-indigo-200/80">
              <label className="block text-xs font-bold text-indigo-950 flex items-center justify-between">
                <span>👩‍🏫 اختيار أستاذ/ة المادة المباشر من الهيئة التدريسية:</span>
                <span className="text-[10px] bg-indigo-200/70 text-indigo-900 font-bold px-2 py-0.5 rounded-full">
                  {teachers.length} مدرسات ومدرسين
                </span>
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTeacherId(val);
                  const selTech = teachers.find((t) => t.id === val);
                  if (selTech) {
                    setIdentifier(selTech.email);
                    setPasscode('1234');
                    setErrorMsg('');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="">-- اختر أستاذ/ة المادة للدخول المباشر إلى حسابه/ا --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.subject}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Student Fast Selector Dropdown (when switching to student role) */}
          {(targetRole === 'student' || (!targetRole && students.length > 0)) && (
            <div className="space-y-1.5 bg-purple-50/90 p-3.5 rounded-2xl border border-purple-200/80">
              <label className="block text-xs font-bold text-purple-950 flex items-center justify-between">
                <span>🎓 اختيار الطالبة المتميزة المباشر للدخول لملفها:</span>
                <span className="text-[10px] bg-purple-200/70 text-purple-900 font-bold px-2 py-0.5 rounded-full">
                  {students.length} طالبات متميزات
                </span>
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedStudentId(val);
                  const selStd = students.find((s) => s.id === val);
                  if (selStd) {
                    setIdentifier(selStd.nationalId || selStd.name);
                    setPasscode('1234');
                    setErrorMsg('');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
              >
                <option value="">-- اختر اسم الطالبة المتميزة للدخول المباشر --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.gradeLevel} ({s.nationalId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Parent Fast Selector Dropdown (when switching to parent role) */}
          {(targetRole === 'parent' || (!targetRole && parents.length > 0)) && (
            <div className="space-y-1.5 bg-emerald-50/90 p-3.5 rounded-2xl border border-emerald-200/80">
              <label className="block text-xs font-bold text-emerald-950 flex items-center justify-between">
                <span>👪 اختيار ولي الأمر للدخول المباشر لمتابعة ابنته:</span>
                <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  {parents.length} أولياء أمور
                </span>
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedParentId(val);
                  const selPr = parents.find((p) => p.id === val);
                  if (selPr) {
                    setIdentifier(selPr.email || selPr.phone);
                    setPasscode('1234');
                    setErrorMsg('');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              >
                <option value="">-- اختر اسم ولي الأمر للدخول المباشر --</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — (الهاتف: {p.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Supervisor Fast Selector Dropdown (when switching to supervisor role) */}
          {(targetRole === 'supervisor' || (!targetRole && supervisors && supervisors.length > 0)) && (
            <div className="space-y-1.5 bg-amber-50/90 p-3.5 rounded-2xl border border-amber-200/80">
              <label className="block text-xs font-bold text-amber-950 flex items-center justify-between">
                <span>🏛️ اختيار المشرف التربوي المعتمد للدخول إلى حسابه:</span>
                <span className="text-[10px] bg-amber-200/70 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                  {supervisors?.length || 0} مشرفين
                </span>
              </label>
              <select
                value={selectedSupervisorId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSupervisorId(val);
                  const selSup = supervisors?.find((s) => s.id === val);
                  if (selSup) {
                    setIdentifier(selSup.email || selSup.phone || selSup.name);
                    const customPass = userPasscodes?.[selSup.id] || '1234';
                    setPasscode(customPass);
                    setErrorMsg('');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              >
                <option value="">-- اختر المشرف التربوي للدخول المباشر --</option>
                {supervisors?.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} — {sup.title} ({sup.specialization}) {sup.isPrimary ? '⭐ المشرف الرئيسي' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Notification */}
          {isSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {lang === 'ar'
                  ? `تم التعرف على الحساب والتحقق بنجاح! الانتقال إلى لوحة تحكم (${matchedRoleTitle || roleInfo.roleTitleAr})...`
                  : `Authenticated successfully! Transitioning to dashboard...`}
              </span>
            </div>
          )}

          {/* Field 1: Email / Username / Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {lang === 'ar'
                ? 'البريد الإلكتروني / اسم المستخدم / رقم الهاتف:'
                : 'Email / Username / Phone Number:'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'مثال: admin@maysan.edu أو admin_maysan أو 07701234567'
                    : 'e.g. admin@maysan.edu or username or phone'
                }
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-800 transition-all font-sans dir-ltr"
                dir="ltr"
              />
            </div>
          </div>

          {/* Field 2: Passcode / Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {lang === 'ar' ? 'الرمز السري / كلمة المرور:' : 'Passcode / Password:'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل الرمز السري (مثال: 1234)' : 'Enter passcode (e.g. 1234)'}
                className="w-full pr-10 pl-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-800 transition-all font-mono dir-ltr"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تأكيد ودخول الرتبة' : 'Verify & Switch Role'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
