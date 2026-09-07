/**
 * Educational Supervisors Management Hub
 * نظام إدارة المشرفين التربويين والاختصاصيين - ثانوية ميسان للمتميزات
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { EducationalSupervisor, GradeLevel, ALL_GRADES_LIST, OFFICIAL_SUBJECTS_LIST } from '../types';
import {
  Building2,
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Crown,
  Search,
  CheckCircle2,
  ShieldCheck,
  Award,
  BookOpen,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  X,
  AlertTriangle,
  FileCheck,
  Star,
  GraduationCap,
  KeyRound,
  Filter,
  Check,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupervisorManagementHubProps {
  isOpen?: boolean;
  onClose?: () => void;
  embeddedMode?: boolean;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
];

const HONORIFICS = ['أ.د.', 'د.', 'أ.', 'المشرف الاختصاصي', 'المشرفة الاختصاصية', 'الأستاذ', 'الأستاذة'];

const DEGREES_LIST = [
  'دكتوراه في الفيزياء النظرية والطرائق الحديثة',
  'دكتوراه في المناهج والطرائق التدريسية',
  'دكتوراه في الأدب العربي والنقد والبلاغة',
  'دكتوراه في الرياضيات التطبيقية والتفكير الرياضي',
  'دكتوراه في القيادة والإشراف التربوي',
  'ماجستير العلوم الحياتية والمختبرات التعليمية',
  'ماجستير الكيمياء التحليلية ورعاية المتفوقات',
  'ماجستير اللغة الإنجليزية واللسانيات التطبيقية',
  'دبلوم عالي في الإدارة والتقويم التربوي',
  'بكالوريوس في التربية والتعليم العالي',
];

export const SupervisorManagementHub: React.FC<SupervisorManagementHubProps> = ({
  isOpen = true,
  onClose,
  embeddedMode = false,
}) => {
  const {
    supervisors,
    addSupervisor,
    updateSupervisor,
    deleteSupervisor,
    setPrimarySupervisor,
    schoolAdminData,
    lang,
    userPasscodes,
    adminUpdateUserPasscode,
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Add / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState<EducationalSupervisor | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formDegree, setFormDegree] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAssignedSubjects, setFormAssignedSubjects] = useState<string[]>([]);
  const [formAssignedGrades, setFormAssignedGrades] = useState<GradeLevel[]>([]);
  const [formStatus, setFormStatus] = useState<EducationalSupervisor['status']>('نشط');
  const [formSupervisorType, setFormSupervisorType] = useState<EducationalSupervisor['supervisorType']>('مشرف اختصاصي');
  const [formEvaluationScore, setFormEvaluationScore] = useState<number>(99.5);
  const [formNotes, setFormNotes] = useState('');
  const [formAvatar, setFormAvatar] = useState(PRESET_AVATARS[0]);
  const [formIsPrimary, setFormIsPrimary] = useState(false);

  // Delete Dialog State
  const [supervisorToDelete, setSupervisorToDelete] = useState<EducationalSupervisor | null>(null);

  // Quick Passcode Modal State
  const [passcodeModalSupervisor, setPasscodeModalSupervisor] = useState<EducationalSupervisor | null>(null);
  const [newPasscode, setNewPasscode] = useState('');
  const [passcodeSavedMessage, setPasscodeSavedMessage] = useState<string | null>(null);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingSupervisor(null);
    setFormName('');
    setFormTitle('مشرف اختصاص - وزارة التربية');
    setFormSpecialization('الرياضيات والعلوم المتقدمة');
    setFormDegree('دكتوراه في المناهج والطرائق التدريسية');
    setFormEmail(`supervisor.${Date.now().toString().slice(-4)}@maysan.edu.iq`);
    setFormPhone('0770' + Math.floor(1000000 + Math.random() * 9000000));
    setFormAssignedSubjects(['الرياضيات']);
    setFormAssignedGrades(['الصف السادس العلمي', 'الصف الخامس العلمي']);
    setFormStatus('نشط');
    setFormSupervisorType('مشرف اختصاصي');
    setFormEvaluationScore(99.5);
    setFormNotes('متابعة خطط المدرسات، تقييم الاختبارات الشهرية، وتدقيق الدفاتر الامتحانية.');
    setFormAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
    setFormIsPrimary(supervisors.length === 0);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sup: EducationalSupervisor) => {
    setEditingSupervisor(sup);
    setFormName(sup.name);
    setFormTitle(sup.title);
    setFormSpecialization(sup.specialization);
    setFormDegree(sup.degree || 'دكتوراه في المناهج والطرائق التدريسية');
    setFormEmail(sup.email);
    setFormPhone(sup.phone);
    setFormAssignedSubjects(sup.assignedSubjects || []);
    setFormAssignedGrades(sup.assignedGrades || []);
    setFormStatus(sup.status);
    setFormSupervisorType(sup.supervisorType || 'مشرف اختصاصي');
    setFormEvaluationScore(sup.evaluationScore || 99.0);
    setFormNotes(sup.notes || '');
    setFormAvatar(sup.avatar || PRESET_AVATARS[0]);
    setFormIsPrimary(Boolean(sup.isPrimary));
    setIsFormModalOpen(true);
  };

  // Handle Form Submission
  const handleSaveSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('⚠️ يرجى كتابة اسم المشرف التربوي');
      return;
    }

    if (editingSupervisor) {
      updateSupervisor(editingSupervisor.id, {
        name: formName.trim(),
        title: formTitle.trim(),
        specialization: formSpecialization.trim(),
        degree: formDegree.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        assignedSubjects: formAssignedSubjects,
        assignedGrades: formAssignedGrades,
        status: formStatus,
        supervisorType: formSupervisorType,
        evaluationScore: Number(formEvaluationScore) || 99.0,
        notes: formNotes.trim(),
        avatar: formAvatar,
        isPrimary: formIsPrimary,
      });
      showToast(`تم تحديث بيانات المشرف (${formName}) بنجاح ✨`);
    } else {
      addSupervisor({
        name: formName.trim(),
        title: formTitle.trim() || 'مشرف تربوي معتمد',
        specialization: formSpecialization.trim() || 'إشراف أكاديمي عام',
        degree: formDegree.trim() || 'دكتوراه في التربية والتعليم',
        email: formEmail.trim(),
        phone: formPhone.trim(),
        assignedSubjects: formAssignedSubjects.length > 0 ? formAssignedSubjects : ['الرياضيات'],
        assignedGrades: formAssignedGrades.length > 0 ? formAssignedGrades : ['الصف السادس العلمي'],
        status: formStatus,
        supervisorType: formSupervisorType,
        evaluationScore: Number(formEvaluationScore) || 99.5,
        notes: formNotes.trim(),
        avatar: formAvatar,
        isPrimary: formIsPrimary,
      });
      showToast(`تمت إضافة المشرف التربوي (${formName}) بنجاح 🎉`);
    }

    setIsFormModalOpen(false);
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = () => {
    if (!supervisorToDelete) return;
    deleteSupervisor(supervisorToDelete.id);
    showToast(`تم حذف المشرف التربوي (${supervisorToDelete.name}) من السجل الإشرافي`);
    setSupervisorToDelete(null);
  };

  // Handle Set Primary
  const handleSetPrimary = (sup: EducationalSupervisor) => {
    setPrimarySupervisor(sup.id);
    showToast(`👑 تم اعتماد (${sup.name}) كمشرف أكاديمي رئيسي للمدرسة`);
  };

  // Toggle Subject in Form
  const toggleSubject = (subject: string) => {
    setFormAssignedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  // Toggle Grade in Form
  const toggleGrade = (grade: GradeLevel) => {
    setFormAssignedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  // Add Honorific Prefix to Name
  const applyHonorific = (prefix: string) => {
    const cleaned = formName.replace(/^(أ\.د\.|د\.|أ\.|المشرف الاختصاصي|المشرفة الاختصاصية|الأستاذ|الأستاذة)\s*/, '');
    setFormName(`${prefix} ${cleaned}`.trim());
  };

  // Filtered Supervisors
  const filteredSupervisors = useMemo(() => {
    return supervisors.filter((s) => {
      const matchesSearch =
        !searchTerm.trim() ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.degree && s.degree.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSubject =
        selectedSubjectFilter === 'all' ||
        (s.assignedSubjects && s.assignedSubjects.includes(selectedSubjectFilter)) ||
        s.specialization.includes(selectedSubjectFilter);

      const matchesStatus = selectedStatusFilter === 'all' || s.status === selectedStatusFilter;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [supervisors, searchTerm, selectedSubjectFilter, selectedStatusFilter]);

  // Extract unique subjects across supervisors
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    supervisors.forEach((s) => {
      s.assignedSubjects?.forEach((sub) => set.add(sub));
    });
    return Array.from(set);
  }, [supervisors]);

  // Primary Supervisor (if any)
  const primarySupervisor = useMemo(() => {
    return supervisors.find((s) => s.isPrimary) || supervisors[0];
  }, [supervisors]);

  // Handle Passcode Save
  const handleSaveSupervisorPasscode = () => {
    if (!passcodeModalSupervisor || !newPasscode.trim()) return;
    adminUpdateUserPasscode(passcodeModalSupervisor.id, newPasscode.trim(), {
      userName: passcodeModalSupervisor.name,
      userRole: 'supervisor',
      sendNotification: true,
    });
    setPasscodeSavedMessage(`تم تحديث رمز الدخول للمشرف (${passcodeModalSupervisor.name}) إلى [${newPasscode.trim()}] بنجاح! 🔒`);
    setTimeout(() => {
      setPasscodeModalSupervisor(null);
      setPasscodeSavedMessage(null);
      setNewPasscode('');
    }, 1800);
  };

  const content = (
    <div className="space-y-6 font-arabic text-slate-900">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-2xl border border-amber-400/40 flex items-center gap-2.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner & Stats Overview */}
      <div className="p-6 rounded-3xl bg-indigo-950 text-white shadow-xl relative overflow-hidden border border-indigo-800/60">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/15 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Building2 className="w-4 h-4" />
              <span>وزارة التربية العراقية - المديرية العامة لتربية ميسان - قسم الإشراف التربوي</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span>سجل وإدارة المشرفين التربويين والاختصاصيين</span>
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                {supervisors.length} مشرفين معتمدين
              </span>
            </h2>
            <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
              إدارة الهيئة الإشرافية الوزارية المعتمدة لمتابعة الخطط التدريسية، تقويم أداء المدرسات، تدقيق السجلات الامتحانية، واعتماد الشهادات والجداول الرسمية في ثانوية ميسان للمتميزات.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/20 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-5 h-5 text-slate-950" />
              <span>إضافة مشرف تربوي جديد 🏛️</span>
            </button>

            {!embeddedMode && onClose && (
              <button
                onClick={onClose}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                title="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-indigo-800/60">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-indigo-300 font-semibold block">إجمالي المشرفين:</span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">{supervisors.length}</span>
            <span className="text-[10px] text-emerald-400 font-bold block">مكلفون رسمياً</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-indigo-300 font-semibold block">المشرفين النشطين:</span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
              {supervisors.filter((s) => s.status === 'نشط').length}
            </span>
            <span className="text-[10px] text-indigo-200 font-bold block">في الميدان التربوي</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-indigo-300 font-semibold block">التخصصات المغطاة:</span>
            <span className="text-xl font-black text-amber-300 font-mono mt-0.5 block">
              {availableSubjects.length || 6}
            </span>
            <span className="text-[10px] text-indigo-200 font-bold block">مناهج ومواد دراسية</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-indigo-300 font-semibold block">المشرف الرئيسي للشهادات:</span>
            <span className="text-xs font-black text-white truncate block mt-1" title={primarySupervisor?.name}>
              {primarySupervisor?.name || schoolAdminData.academicSupervisorName || 'أ.د. حيدر الكناني'}
            </span>
            <span className="text-[10px] text-amber-300 font-bold block">معتمد في الكتب والجداول</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث بالاسم، اللقب، التخصص، الدرجة العلمية، أو الهاتف..."
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">جميع المواد والتخصصات ({availableSubjects.length})</option>
            {availableSubjects.map((sub) => (
              <option key={sub} value={sub}>
                مادة: {sub}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">جميع الحالات</option>
            <option value="نشط">نشط فقط</option>
            <option value="في مهمة رسمية">في مهمة رسمية</option>
            <option value="في إجازة">في إجازة</option>
            <option value="غير نشط">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Supervisors List / Cards Grid */}
      {filteredSupervisors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">لم يتم العثور على أي مشرفين تربويين</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            جرّب تغيير عبارة البحث أو إعادة ضبط الفلاتر، أو أضف مشرفاً تربوياً جديداً الآن.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all"
          >
            + إضافة مشرف تربوي جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSupervisors.map((sup) => {
            const isPrimary = Boolean(sup.isPrimary);
            return (
              <div
                key={sup.id}
                className={`p-6 rounded-3xl bg-white border transition-all duration-200 relative group flex flex-col justify-between ${
                  isPrimary
                    ? 'border-amber-400 shadow-md shadow-amber-400/10 ring-2 ring-amber-400/30'
                    : 'border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200'
                }`}
              >
                {/* Primary Tag & Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    {isPrimary && (
                      <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-1.5 shadow-sm">
                        <Crown className="w-3.5 h-3.5 text-slate-950" />
                        <span>المشرف الأكاديمي الرئيسي المعتمد</span>
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                      {sup.supervisorType || 'مشرف اختصاصي'}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      sup.status === 'نشط'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : sup.status === 'في مهمة رسمية'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    ● {sup.status}
                  </span>
                </div>

                {/* Main Body */}
                <div className="space-y-4">
                  {/* Supervisor Profile Header */}
                  <div className="flex items-start gap-4">
                    <img
                      src={sup.avatar || PRESET_AVATARS[0]}
                      alt={sup.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm shrink-0"
                    />

                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <span className="truncate">{sup.name}</span>
                        {isPrimary && <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />}
                      </h3>

                      <p className="text-xs font-bold text-indigo-700">{sup.title}</p>

                      <p className="text-[11px] text-slate-600 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{sup.degree || 'دكتوراه في التربية'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Specialization & Evaluation */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold">التخصص الدقيق:</span>
                      <span className="font-bold text-slate-900 text-left">{sup.specialization}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold">مؤشر الجودة والتقويم:</span>
                      <span className="font-mono font-bold text-amber-600 flex items-center gap-1">
                        <span>⭐⭐⭐⭐⭐</span>
                        <span>({sup.evaluationScore || 99.5}%)</span>
                      </span>
                    </div>
                  </div>

                  {/* Assigned Subjects & Grades */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block mb-1">المواد الدراسية المكلف بها:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {sup.assignedSubjects && sup.assignedSubjects.length > 0 ? (
                          sup.assignedSubjects.map((sub) => (
                            <span
                              key={sub}
                              className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200/80 font-bold text-[11px]"
                            >
                              📚 {sub}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">إشراف أكاديمي عام</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block mb-1">الصفوف المشمولة بالإشراف:</span>
                      <div className="flex flex-wrap gap-1">
                        {sup.assignedGrades && sup.assignedGrades.length > 0 ? (
                          sup.assignedGrades.map((gr) => (
                            <span
                              key={gr}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[10px]"
                            >
                              {gr}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">كافة المراحل الدراسية</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono truncate">{sup.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono truncate">{sup.email}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {sup.notes && (
                    <p className="text-[11px] text-slate-500 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/50 leading-relaxed">
                      💡 {sup.notes}
                    </p>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {!isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(sup)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                        title="اعتماد هذا المشرف كمشرف رئيسي في الشهادات والجداول الرسمية"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-700" />
                        <span>تعيين كرئيسي 👑</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setPasscodeModalSupervisor(sup);
                        setNewPasscode(userPasscodes[sup.id as any] || '1234');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all"
                      title="تعديل رمز الدخول لهذا المشرف"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                      <span>الرمز السري 🔑</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(sup)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل ✍️</span>
                    </button>

                    <button
                      onClick={() => setSupervisorToDelete(sup)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Supervisor Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-6 bg-indigo-950 text-white flex items-center justify-between border-b border-indigo-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {editingSupervisor ? 'تعديل بيانات المشرف التربوي' : 'إضافة مشرف تربوي جديد'}
                    </h3>
                    <p className="text-xs text-indigo-200">
                      {editingSupervisor
                        ? `تحديث السجل الإشرافي للمشرف (${editingSupervisor.name})`
                        : 'تسجيل وتكليف مشرف تربوي جديد ضمن الكادر الإشرافي للمدرسة'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveSupervisor} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* 1. Quick Honorific Prefix Buttons */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">إضافة لقب أكاديمي سريع للاسم:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {HONORIFICS.map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => applyHonorific(pref)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-100 hover:text-indigo-900 text-slate-700 text-xs font-bold transition-all"
                      >
                        + {pref}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Full Name & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      الاسم الثلاثي واللقب للمشرف <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="مثال: أ.د. حيدر جاسم الكناني"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      المسمى والصفة الإشرافية <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="مثال: المشرف الأكاديمي والتربوي المعتمد"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 3. Specialization & Academic Degree */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      التخصص الأكاديمي الدقيق <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formSpecialization}
                      onChange={(e) => setFormSpecialization(e.target.value)}
                      placeholder="مثال: الفيزياء المتقدمة ورعاية المتفوقات"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">الدرجة العلمية والشهادة</label>
                    <select
                      value={formDegree}
                      onChange={(e) => setFormDegree(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    >
                      {DEGREES_LIST.map((deg) => (
                        <option key={deg} value={deg}>
                          {deg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Type & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">نوع الإشراف</label>
                    <select
                      value={formSupervisorType}
                      onChange={(e) => setFormSupervisorType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="مشرف اختصاصي">مشرف اختصاصي</option>
                      <option value="مشرف تربوي عام">مشرف تربوي عام</option>
                      <option value="مشرف إدارة مدرسية">مشرف إدارة مدرسية</option>
                      <option value="مشرف جودة واعتماد">مشرف جودة واعتماد</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">حالة التكليف</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="نشط">نشط (في الميدان)</option>
                      <option value="في مهمة رسمية">في مهمة رسمية</option>
                      <option value="في إجازة">في إجازة</option>
                      <option value="غير نشط">غير نشط</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">تقييم الأداء والجودة %</label>
                    <input
                      type="number"
                      min="70"
                      max="100"
                      step="0.1"
                      value={formEvaluationScore}
                      onChange={(e) => setFormEvaluationScore(parseFloat(e.target.value) || 99.0)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 5. Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">رقم الهاتف الرسمي</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="0770xxxxxxx"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">البريد الإلكتروني الوزاري</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="supervisor@maysan.edu.iq"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 6. Assigned Subjects (Multi-select) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    المواد الدراسية المكلف بالإشراف عليها:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    {OFFICIAL_SUBJECTS_LIST.map((subj) => {
                      const isSelected = formAssignedSubjects.includes(subj);
                      return (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => toggleSubject(subj)}
                          className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between border transition-all text-right ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <span className="truncate">{subj}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 7. Assigned Grades (Multi-select) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    المراحل الدراسية الخاضعة للإشراف:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    {ALL_GRADES_LIST.map((gr) => {
                      const isSelected = formAssignedGrades.includes(gr);
                      return (
                        <button
                          key={gr}
                          type="button"
                          onClick={() => toggleGrade(gr)}
                          className={`p-2 rounded-xl text-[11px] font-bold flex items-center justify-between border transition-all text-right ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <span className="truncate">{gr}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 8. Avatar Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">اختيار الصورة الشخصية للمشرف:</label>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                    {PRESET_AVATARS.map((avUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormAvatar(avUrl)}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                          formAvatar === avUrl ? 'border-amber-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={avUrl} alt="Avatar" className="w-12 h-12 object-cover" referrerPolicy="no-referrer" />
                        {formAvatar === avUrl && (
                          <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-amber-600 drop-shadow" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 9. Primary Supervisor Toggle */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300/80 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="formIsPrimary"
                    checked={formIsPrimary}
                    onChange={(e) => setFormIsPrimary(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="formIsPrimary" className="text-xs text-amber-950 font-bold cursor-pointer">
                    اعتماد هذا المشرف كمشرف أكاديمي رئيسي للمدرسة 👑
                    <span className="block text-[11px] text-amber-800 font-normal mt-0.5">
                      يتم اعتماد اسمه تلقائياً في خانة توقيع المشرف التربوي على شهادات الطالبات وجداول الدروس الأسبوعية والكتب الرسمية.
                    </span>
                  </label>
                </div>

                {/* 10. Notes & Supervisory Mandate */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">ملاحظات والتكليف الإشرافي</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="ملاحظات حول المهام الإشرافية أو التكليف الوزاري..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all transform hover:scale-105"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingSupervisor ? 'حفظ تعديلات المشرف' : 'إضافة المشرف الآن'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {supervisorToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">تأكيد حذف المشرف التربوي</h3>
                <p className="text-xs text-slate-600">
                  هل أنتِ متأكدة من حذف المشرف التربوي ({supervisorToDelete.name}) من السجل الإشرافي للمدرسة؟
                </p>
              </div>

              {supervisorToDelete.isPrimary && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-right">
                  ⚠️ هذا المشرف هو المشرف الأكاديمي الرئيسي المعتمد. سيتم نقل الصفة للمشرف التالي تلقائياً.
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSupervisorToDelete(null)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/20 transition-all"
                >
                  نعم، تأكيد الحذف 🗑️
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Passcode Edit Modal */}
      <AnimatePresence>
        {passcodeModalSupervisor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900">تعيين الرمز السري للمشرف</h3>
                </div>
                <button
                  onClick={() => setPasscodeModalSupervisor(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  المشرف: <strong className="text-indigo-900">{passcodeModalSupervisor.name}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  أدخلي الرمز السري الجديد المكون من 4 إلى 8 أرقام أو أحرف:
                </p>
                <input
                  type="text"
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="مثال: 1234"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-center font-mono text-lg font-black tracking-widest focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {passcodeSavedMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200">
                  {passcodeSavedMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPasscodeModalSupervisor(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveSupervisorPasscode}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all"
                >
                  حفظ الرمز السري 🔒
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  if (embeddedMode) {
    return content;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 p-6 my-8 max-h-[92vh] overflow-y-auto">
        {content}
      </div>
    </div>
  );
};
