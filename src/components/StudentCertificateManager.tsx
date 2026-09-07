/**
 * Student Certificates & Academic Report Card Component
 * مدرسة ثانوية ميسان للمتميزات - نظام إدارة وإصدار الشهادات والنتائج المدرسية
 */

import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StudentCertificate, SubjectGrade, ALL_GRADES_LIST, GradeLevel, CertificateModelType, CERTIFICATE_MODELS, MinistryDecisionSettings } from '../types';
import { EditCertificateHeaderModal } from './EditCertificateHeaderModal';
import { MinistryDecisionSettingsModal } from './MinistryDecisionSettingsModal';
import { OfficialCertificateA4Template } from './OfficialCertificateA4Template';
import { CertificatePreviewModal } from './CertificatePreviewModal';
import { SharePdfModal } from './SharePdfModal';
import { BulkIssueCertificatesModal } from './BulkIssueCertificatesModal';
import { BulkDownloadModelSelectorModal } from './BulkDownloadModelSelectorModal';
import { StudentManualGradesEditorModal } from './StudentManualGradesEditorModal';
import { DeleteCertificateConfirmModal, DeleteCertificateTarget } from './DeleteCertificateConfirmModal';
import { savePdfBlob, downloadTextOrAttachmentAsPdf, ensureFontsLoaded, applyFontAndStyleFixesToClone } from '../utils/pdfExporter';
import {
  Award,
  Search,
  Printer,
  Edit3,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  School,
  Share2,
  QrCode,
  ShieldCheck,
  BookOpen,
  Filter,
  Check,
  HelpCircle,
  Crown,
  Settings,
  Camera,
  Upload,
  Zap,
  RotateCcw,
  FileText,
  Download,
  Table,
  Layers,
  ArrowUpDown,
  Lock,
} from 'lucide-react';

const renderGradeValue = (
  val: number | string | null | undefined,
  defaultClassName: string = '',
  suffix: string = ''
) => {
  if (val === null || val === undefined || val === '') return <span className="text-slate-400 font-normal">-</span>;
  const num = typeof val === 'number' ? val : Number(val);
  if (isNaN(num)) return <span className="text-slate-400 font-normal">-</span>;

  if (num < 50) {
    const sanitizedClass = defaultClassName
      .replace(/text-[a-z0-9\/-]+/g, '')
      .replace(/bg-[a-z0-9\/-]+/g, '')
      .trim();

    return (
      <span
        className={`text-red-600 font-black underline decoration-red-600 decoration-2 underline-offset-2 inline-block ${sanitizedClass}`}
        title="درجة أقل من 50 (راسبة / إكمال)"
      >
        {val}{suffix}
      </span>
    );
  }
  return <span className={defaultClassName}>{val}{suffix}</span>;
};

export const getFirstTermStudentStatus = (cert: StudentCertificate) => {
  const subjects = cert.subjects || [];
  const failedSubjects = subjects.filter((s) => {
    const grade = s.firstTermAvg;
    return grade !== null && grade !== undefined && Number(grade) < 50;
  });
  const failedCount = failedSubjects.length;

  if (failedCount === 0) {
    return {
      status: 'ناجحة',
      badge: 'ناجحة بالفصل الأول',
      colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  } else if (failedCount <= 3) {
    let label = 'مكملة بدرس واحد';
    if (failedCount === 2) label = 'مكملة بدرسين';
    else if (failedCount === 3) label = 'مكملة بثلاث دروس';
    return {
      status: 'مكملة',
      badge: label,
      colorClass: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  } else {
    return {
      status: 'راسبة',
      badge: `راسبة بالفصل الأول (${failedCount} دروس)`,
      colorClass: 'bg-rose-100 text-rose-900 border-rose-300',
    };
  }
};

export const getMidYearStudentStatus = (cert: StudentCertificate) => {
  const subjects = cert.subjects || [];
  const failedSubjects = subjects.filter((s) => {
    const grade = s.midYearGrade;
    return grade !== null && grade !== undefined && Number(grade) < 50;
  });
  const failedCount = failedSubjects.length;

  if (failedCount === 0) {
    return {
      status: 'ناجحة',
      badge: 'ناجحة بنصف السنة',
      colorClass: 'bg-teal-100 text-teal-900 border-teal-300',
    };
  } else if (failedCount <= 3) {
    let label = 'مكملة بدرس واحد';
    if (failedCount === 2) label = 'مكملة بدرسين';
    else if (failedCount === 3) label = 'مكملة بثلاث دروس';
    return {
      status: 'مكملة',
      badge: label,
      colorClass: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  } else {
    return {
      status: 'راسبة',
      badge: `راسبة بنصف السنة (${failedCount} دروس)`,
      colorClass: 'bg-rose-100 text-rose-900 border-rose-300',
    };
  }
};

export const getAnnualSaeiStudentStatus = (cert: StudentCertificate) => {
  const subjects = cert.subjects || [];
  const failedSubjects = subjects.filter((s) => {
    const saei =
      s.annualSaeiAvg !== undefined && s.annualSaeiAvg !== null && s.annualSaeiAvg > 0
        ? s.annualSaeiAvg
        : Math.round(((s.firstTermAvg || 0) + (s.midYearGrade || 0) + (s.secondTermAvg || 0)) / 3);
    return saei < 50;
  });
  const failedCount = failedSubjects.length;

  if (failedCount === 0) {
    let badge = 'ناجحة بالسعي السنوي';
    if (cert.exemptionType === 'general') badge = 'معفاة إعفاء عام 🌟';
    else if (cert.exemptionType === 'individual') badge = `معفاة فردي (${cert.exemptSubjectsCount || 0})`;
    return {
      status: 'ناجحة',
      badge,
      colorClass: 'bg-blue-100 text-blue-900 border-blue-300',
    };
  } else if (failedCount <= 3) {
    let label = 'مكملة بالسعي (درس واحد)';
    if (failedCount === 2) label = 'مكملة بالسعي (درسين)';
    else if (failedCount === 3) label = 'مكملة بالسعي (3 دروس)';
    return {
      status: 'مكملة',
      badge: label,
      colorClass: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  } else {
    return {
      status: 'راسبة',
      badge: `راسبة بالسعي (${failedCount} دروس)`,
      colorClass: 'bg-rose-100 text-rose-900 border-rose-300',
    };
  }
};

export const getFinalRound1StudentStatus = (
  cert: StudentCertificate,
  decisionSettings?: MinistryDecisionSettings
) => {
  const passThreshold = decisionSettings?.minPassingGrade ?? 50;
  const maxResit = decisionSettings?.maxResitSubjects ?? 3;
  const subjects = cert.subjects || [];
  const failedSubjects = subjects.filter((s) => {
    const grade = s.finalGrade !== undefined && s.finalGrade !== null ? s.finalGrade : 0;
    return grade < passThreshold;
  });
  const failedCount = failedSubjects.length;
  const hasDecision = (cert.hasDecisionMarks && (cert.decisionMarksUsed || 0) > 0) || subjects.some((s) => (s.decisionMarks || 0) > 0);
  const totalDecisionMarks = cert.decisionMarksUsed || subjects.reduce((acc, s) => acc + (s.decisionMarks || 0), 0);

  if (failedCount === 0) {
    const isPassedByDecision = hasDecision && (cert.originalStatus === 'مكملة' || cert.originalStatus === 'راسبة' || totalDecisionMarks > 0);
    return {
      status: 'ناجحة',
      badge: isPassedByDecision ? `ناجحة بالدور الأول (بالقرار 🌟 +${totalDecisionMarks} د)` : 'ناجحة بالدور الأول 🌟',
      colorClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    };
  } else if (failedCount <= maxResit) {
    let label = 'مكملة بالدور الأول (درس واحد)';
    if (failedCount === 2) label = 'مكملة بالدور الأول (درسين)';
    else if (failedCount === 3) label = 'مكملة بالدور الأول (3 دروس)';
    else label = `مكملة بالدور الأول (${failedCount} دروس)`;

    const isHelpedByDecision = hasDecision && cert.originalStatus === 'راسبة';
    return {
      status: 'مكملة',
      badge: isHelpedByDecision ? `${label} (بالقرار)` : label,
      colorClass: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  } else {
    return {
      status: 'راسبة',
      badge: `راسبة بالدور الأول (${failedCount} دروس)`,
      colorClass: 'bg-rose-100 text-rose-900 border-rose-300',
    };
  }
};

export const getPostResitStudentStatus = (
  cert: StudentCertificate,
  decisionSettings?: MinistryDecisionSettings
) => {
  const passThreshold = decisionSettings?.minPassingGrade ?? 50;
  const maxResit = decisionSettings?.maxResitSubjects ?? 3;
  const subjects = cert.subjects || [];
  const failedSubjects = subjects.filter((s) => {
    const effectiveGrade =
      s.postResitGrade !== undefined && s.postResitGrade !== null
        ? s.postResitGrade
        : s.finalGrade !== undefined && s.finalGrade !== null
        ? s.finalGrade
        : 0;
    return effectiveGrade < passThreshold;
  });
  const failedCount = failedSubjects.length;

  if (failedCount === 0) {
    return {
      status: 'ناجحة',
      badge: 'ناجحة بعد الإكمال ✨',
      colorClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    };
  } else if (failedCount <= maxResit) {
    let label = 'مكملة بعد الإكمال (درس واحد)';
    if (failedCount === 2) label = 'مكملة بعد الإكمال (درسين)';
    else if (failedCount === 3) label = 'مكملة بعد الإكمال (3 دروس)';
    else label = `مكملة بعد الإكمال (${failedCount} دروس)`;
    return {
      status: 'مكملة',
      badge: label,
      colorClass: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  } else {
    return {
      status: 'راسبة',
      badge: `راسبة بعد الإكمال (${failedCount} دروس)`,
      colorClass: 'bg-rose-100 text-rose-900 border-rose-300',
    };
  }
};

export const StudentCertificateManager: React.FC = () => {
  const {
    certificates,
    students,
    teachers,
    parents,
    currentUser,
    updateCertificate,
    updateSubjectGrade,
    recalculateCertificate,
    addStudentCertificate,
    deleteCertificate,
    deleteMultipleCertificates,
    deleteCertificatesForScope,
    clearAllCertificates,
    schoolAdminData,
    updateSchoolAdminData,
    decisionSettings,
    applySubjectDecisionMarks,
    autoOptimizeDecisionMarksForCert,
    resetDecisionMarksForCert,
    role,
    lang,
  } = useApp();

  // Active student object derived dynamically from logged-in user
  const activeStudent = useMemo(() => {
    if (role !== 'student' && role !== 'parent') return null;
    if (role === 'student') {
      const found = students.find(
        (s) =>
          (currentUser?.id && s.id === currentUser.id) ||
          (currentUser?.email && s.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser?.phone && (s.phone === currentUser.phone || s.parentPhone === currentUser.phone)) ||
          (currentUser?.name && (s.name.toLowerCase() === currentUser.name.toLowerCase() || currentUser.name.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(currentUser.name.toLowerCase()))) ||
          (currentUser?.studentObj?.id && s.id === currentUser.studentObj.id)
      );
      if (found) return found;
      if (currentUser?.studentObj) return currentUser.studentObj;
      if (currentUser?.name) {
        return {
          id: currentUser.id || 'std-current',
          name: currentUser.name,
          nationalId: '1099887766',
          gradeLevel: currentUser.gradeLevel || 'الصف السادس العلمي',
          section: 'أ',
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          gpa: 99.6,
          status: 'منتظمة',
          enrollmentYear: '2022',
        };
      }
      return students[0];
    }
    if (role === 'parent') {
      const parentObj =
        parents.find(
          (p) =>
            (currentUser?.id && p.id === currentUser.id) ||
            (currentUser?.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            (currentUser?.phone && p.phone === currentUser.phone)
        ) || currentUser?.parentObj;

      return (
        students.find(
          (s) =>
            (parentObj && s.parentEmail.toLowerCase() === parentObj.email.toLowerCase()) ||
            (parentObj && s.parentPhone === parentObj.phone) ||
            (parentObj && s.parentName === parentObj.name) ||
            (currentUser?.studentObj && s.id === currentUser.studentObj.id)
        ) || students[0]
      );
    }
    return null;
  }, [role, currentUser, students, parents]);

  // Active teacher info when role === 'teacher'
  const activeTeacher = useMemo(() => {
    if (role !== 'teacher') return null;
    return (
      currentUser?.teacherObj ||
      teachers.find(
        (t) =>
          (currentUser?.id && t.id === currentUser.id) ||
          (currentUser?.email && t.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser?.name && t.name.toLowerCase() === currentUser.name.toLowerCase())
      ) ||
      teachers[0]
    );
  }, [role, currentUser, teachers]);

  const teacherSubject = useMemo(() => {
    return activeTeacher?.subject || currentUser?.subject || 'الفيزياء المتقدمة';
  }, [activeTeacher, currentUser]);

  const teacherAssignedGrades = useMemo(() => {
    if (activeTeacher?.assignedGrades && activeTeacher.assignedGrades.length > 0) {
      return activeTeacher.assignedGrades;
    }
    return ALL_GRADES_LIST;
  }, [activeTeacher]);

  // Base list of certificates filtered by user role:
  // - Students and parents ONLY see their own single certificate.
  // - Teachers see student certificates for their assigned grade levels.
  // - Admins see all certificates.
  const userRoleCertificates: StudentCertificate[] = useMemo(() => {
    if ((role === 'student' || role === 'parent') && activeStudent) {
      const matched = certificates.filter(
        (c) =>
          c.studentId === activeStudent.id ||
          c.studentName.toLowerCase() === activeStudent.name.toLowerCase() ||
          (activeStudent.nationalId && c.nationalId === activeStudent.nationalId) ||
          (currentUser?.name && c.studentName.toLowerCase().includes(currentUser.name.toLowerCase()))
      );
      if (matched.length > 0) return matched;

      // Dynamic fallback certificate generated for logged in student
      return [{
        id: `cert-${activeStudent.id}`,
        studentId: activeStudent.id,
        studentName: activeStudent.name,
        nationalId: activeStudent.nationalId || '1099887766',
        gradeLevel: activeStudent.gradeLevel || 'الصف السادس العلمي',
        section: activeStudent.section || 'أ',
        academicYear: '2026 - 2027',
        issueDate: '2027-06-25',
        status: 'ناجحة' as const,
        certificateModel: 'model3_final_round1' as CertificateModelType,
        appreciation: 'امتياز مرتفع جداً',
        notes: `الشهادة الرسمية الموثقة للطالبة المتميزة (${activeStudent.name})`,
        overallFirstTermAvg: activeStudent.gpa || 99.6,
        overallMidYearGrade: activeStudent.gpa || 99.6,
        overallSecondTermAvg: activeStudent.gpa || 99.6,
        overallAnnualSaeiAvg: activeStudent.gpa || 99.6,
        overallFinalExamGrade: activeStudent.gpa || 99.6,
        overallFinalGrade: activeStudent.gpa || 99.6,
        overallPostResitAvg: activeStudent.gpa || 99.6,
        subjects: [
          { id: 'sub-d1', subjectName: 'التربية الإسلامية', firstTermAvg: 100, midYearGrade: 100, secondTermAvg: 100, annualSaeiAvg: 100, finalExamGrade: 100, finalGrade: 100, resitGrade: null, postResitGrade: 100 },
          { id: 'sub-d2', subjectName: 'اللغة العربية', firstTermAvg: 99, midYearGrade: 99, secondTermAvg: 99, annualSaeiAvg: 99, finalExamGrade: 100, finalGrade: 100, resitGrade: null, postResitGrade: 100 },
          { id: 'sub-d3', subjectName: 'اللغة الإنجليزية', firstTermAvg: 100, midYearGrade: 100, secondTermAvg: 99, annualSaeiAvg: 100, finalExamGrade: 100, finalGrade: 100, resitGrade: null, postResitGrade: 100 },
          { id: 'sub-d4', subjectName: 'الرياضيات', firstTermAvg: 100, midYearGrade: 100, secondTermAvg: 100, annualSaeiAvg: 100, finalExamGrade: 100, finalGrade: 100, resitGrade: null, postResitGrade: 100 },
          { id: 'sub-d5', subjectName: 'الحاسوب والذكاء الاصطناعي', firstTermAvg: 100, midYearGrade: 100, secondTermAvg: 100, annualSaeiAvg: 100, finalExamGrade: 100, finalGrade: 100, resitGrade: null, postResitGrade: 100 },
          { id: 'sub-d6', subjectName: 'الفيزياء', firstTermAvg: 100, midYearGrade: 100, secondTermAvg: 99, annualSaeiAvg: 100, finalExamGrade: 100, finalGrade: 100, resitGrade: null, postResitGrade: 100 },
          { id: 'sub-d7', subjectName: 'الكيمياء', firstTermAvg: 100, midYearGrade: 100, secondTermAvg: 100, annualSaeiAvg: 100, finalExamGrade: 100, finalGrade: 100, resitGrade: null, postResitGrade: 100 },
          { id: 'sub-d8', subjectName: 'علم الأحياء', firstTermAvg: 99, midYearGrade: 100, secondTermAvg: 99, annualSaeiAvg: 99, finalExamGrade: 100, finalGrade: 100, resitGrade: null, postResitGrade: 100 },
        ]
      }];
    }

    let list: StudentCertificate[] = [];
    if (role === 'teacher') {
      // Filter student certificates matching teacher's assigned grades
      list = certificates.filter((c) =>
        teacherAssignedGrades.includes(c.gradeLevel)
      );
    } else {
      list = certificates;
    }

    // Default alphabetical sorting for all student certificates
    return [...list].sort((a, b) => a.studentName.localeCompare(b.studentName, 'ar', { sensitivity: 'base' }));
  }, [certificates, role, activeStudent, currentUser, teacherAssignedGrades]);

  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [exemptionFilter, setExemptionFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'name_asc' | 'name_desc' | 'gpa_desc' | 'gpa_asc' | 'grade_sec'>('name_asc');
  const [activePrintModel, setActivePrintModel] = useState<CertificateModelType>('model3_final_round1');
  const [currentExportModel, setCurrentExportModel] = useState<CertificateModelType | null>(null);
  const [selectedShareModel, setSelectedShareModel] = useState<CertificateModelType | undefined>(undefined);
  const [selectedCertId, setSelectedCertId] = useState<string | null>(
    userRoleCertificates[0]?.id || certificates[0]?.id || null
  );
  const [viewMode, setViewMode] = useState<'matrix' | 'official_print'>(() => {
    return role === 'student' || role === 'parent' ? 'official_print' : 'matrix';
  });
  const [printScope, setPrintScope] = useState<'selected' | 'class' | 'all'>('selected');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [expandedCertId, setExpandedCertId] = useState<string | null>(
    userRoleCertificates[0]?.id || certificates[0]?.id || null
  );
  const [editingSubject, setEditingSubject] = useState<{
    certId: string;
    subjectId: string;
  } | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkIssueModalOpen, setIsBulkIssueModalOpen] = useState(false);
  const [isBulkDownloadModalOpen, setIsBulkDownloadModalOpen] = useState(false);
  const [bulkDownloadScope, setBulkDownloadScope] = useState<'all' | 'class'>('all');
  const [isManualGradesEditorOpen, setIsManualGradesEditorOpen] = useState(false);
  const [manualEditTargetCert, setManualEditTargetCert] = useState<StudentCertificate | null>(null);
  const [isEditHeaderModalOpen, setIsEditHeaderModalOpen] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<string>('');
  const [isCreateBlankForSingle, setIsCreateBlankForSingle] = useState<boolean>(true);

  // Multi-selection & Delete Modal States
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteCertificateTarget | null>(null);
  const [deleteFeedbackToast, setDeleteFeedbackToast] = useState<string | null>(null);

  const handleRequestDeleteSingle = (cert: StudentCertificate) => {
    setDeleteTarget({
      type: 'single',
      certificate: cert,
    });
    setIsDeleteModalOpen(true);
  };

  const handleRequestDeleteSelected = () => {
    if (selectedCertIds.length === 0) return;
    setDeleteTarget({
      type: 'bulk',
      certIds: selectedCertIds,
      count: selectedCertIds.length,
    });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    let feedback = '';
    if (deleteTarget.type === 'single' && deleteTarget.certificate) {
      const cert = deleteTarget.certificate;
      deleteCertificate(cert.id);
      setSelectedCertIds((prev) => prev.filter((id) => id !== cert.id));
      if (selectedCertId === cert.id) {
        const remaining = certificates.filter((c) => c.id !== cert.id);
        setSelectedCertId(remaining[0]?.id || null);
      }
      feedback = `تم حذف شهادة الطالبة (${cert.studentName}) بنجاح.`;
    } else if (deleteTarget.type === 'bulk' && deleteTarget.certIds) {
      const ids = deleteTarget.certIds;
      deleteMultipleCertificates(ids);
      setSelectedCertIds((prev) => prev.filter((id) => !ids.includes(id)));
      if (selectedCertId && ids.includes(selectedCertId)) {
        const remaining = certificates.filter((c) => !ids.includes(c.id));
        setSelectedCertId(remaining[0]?.id || null);
      }
      feedback = `تم حذف (${ids.length}) شهادات محددة بنجاح.`;
    } else if (deleteTarget.type === 'scope') {
      clearAllCertificates();
      setSelectedCertIds([]);
      setSelectedCertId(null);
      feedback = `تم مسح وتفريغ كافة الشهادات المدرسية بنجاح.`;
    }

    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    setDeleteFeedbackToast(feedback);
    setTimeout(() => {
      setDeleteFeedbackToast(null);
    }, 4500);
  };

  const toggleSelectCert = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCertIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const currentFilteredIds = filteredCertificates.map((c) => c.id);
    const allSelected =
      currentFilteredIds.length > 0 &&
      currentFilteredIds.every((id) => selectedCertIds.includes(id));

    if (allSelected) {
      setSelectedCertIds((prev) =>
        prev.filter((id) => !currentFilteredIds.includes(id))
      );
    } else {
      setSelectedCertIds((prev) =>
        Array.from(new Set([...prev, ...currentFilteredIds]))
      );
    }
  };

  const certLogoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          updateSchoolAdminData({ schoolLogoUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtered and Alphabetically Sorted Certificates
  const filteredCertificates = useMemo(() => {
    const list = userRoleCertificates.filter((cert) => {
      const matchesSearch =
        cert.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.nationalId.includes(searchQuery);
      const matchesGrade = gradeFilter === 'all' || cert.gradeLevel === gradeFilter;
      const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
      const matchesModel =
        modelFilter === 'all' ||
        (cert.certificateModel || 'model3_final_round1') === modelFilter;
      const matchesExemption =
        exemptionFilter === 'all'
          ? true
          : exemptionFilter === 'general'
          ? cert.exemptionType === 'general'
          : exemptionFilter === 'individual'
          ? cert.exemptionType === 'individual'
          : exemptionFilter === 'exempt_any'
          ? cert.exemptionType === 'general' || cert.exemptionType === 'individual'
          : cert.exemptionType === 'none' || !cert.exemptionType;

      return matchesSearch && matchesGrade && matchesStatus && matchesExemption && matchesModel;
    });

    return [...list].sort((a, b) => {
      if (sortOrder === 'name_asc') {
        return a.studentName.localeCompare(b.studentName, 'ar', { sensitivity: 'base' });
      }
      if (sortOrder === 'name_desc') {
        return b.studentName.localeCompare(a.studentName, 'ar', { sensitivity: 'base' });
      }
      if (sortOrder === 'gpa_desc') {
        const gpaA = a.overallPostResitAvg ?? a.overallFinalGrade ?? 0;
        const gpaB = b.overallPostResitAvg ?? b.overallFinalGrade ?? 0;
        return gpaB - gpaA;
      }
      if (sortOrder === 'gpa_asc') {
        const gpaA = a.overallPostResitAvg ?? a.overallFinalGrade ?? 0;
        const gpaB = b.overallPostResitAvg ?? b.overallFinalGrade ?? 0;
        return gpaA - gpaB;
      }
      if (sortOrder === 'grade_sec') {
        const gradeComp = a.gradeLevel.localeCompare(b.gradeLevel, 'ar');
        if (gradeComp !== 0) return gradeComp;
        const secComp = a.section.localeCompare(b.section, 'ar');
        if (secComp !== 0) return secComp;
        return a.studentName.localeCompare(b.studentName, 'ar', { sensitivity: 'base' });
      }
      return a.studentName.localeCompare(b.studentName, 'ar', { sensitivity: 'base' });
    });
  }, [userRoleCertificates, searchQuery, gradeFilter, statusFilter, exemptionFilter, modelFilter, sortOrder]);

  // Selected Certificate for Printing / Detailed View
  const selectedCert = useMemo(() => {
    return userRoleCertificates.find((c) => c.id === selectedCertId) || filteredCertificates[0] || userRoleCertificates[0] || certificates[0];
  }, [certificates, userRoleCertificates, selectedCertId, filteredCertificates]);

  // KPIs
  const kpis = useMemo(() => {
    const total = userRoleCertificates.length;
    const passed = userRoleCertificates.filter((c) => c.status === 'ناجحة' || c.status === 'ناجحة بالدور الثاني').length;
    const resit = userRoleCertificates.filter((c) => c.status === 'مكملة').length;
    const failed = userRoleCertificates.filter((c) => c.status === 'راسبة').length;
    const generalExempt = userRoleCertificates.filter((c) => c.exemptionType === 'general').length;
    const individualExempt = userRoleCertificates.filter((c) => c.exemptionType === 'individual').length;
    const totalExempt = generalExempt + individualExempt;
    const avgScore = total > 0
      ? (userRoleCertificates.reduce((acc, c) => acc + (c.overallPostResitAvg ?? c.overallFinalGrade), 0) / total).toFixed(1)
      : '0.0';
    return { total, passed, resit, failed, generalExempt, individualExempt, totalExempt, avgScore };
  }, [userRoleCertificates]);

  const handlePrint = (
    targetCert?: StudentCertificate | React.SyntheticEvent,
    modelOverride?: CertificateModelType
  ) => {
    if (modelOverride) {
      setActivePrintModel(modelOverride);
      setCurrentExportModel(modelOverride);
    }
    if (targetCert && typeof targetCert === 'object' && 'id' in targetCert && typeof (targetCert as any).id === 'string') {
      setSelectedCertId((targetCert as StudentCertificate).id);
      setPrintScope('selected');
    }
    setIsPreviewModalOpen(false);
    setViewMode('official_print');

    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.warn('Print trigger warning:', e);
      }
    }, 250);
  };

  const generateCertificatePdfBlob = async (
    scope: 'selected' | 'class' | 'all' = 'selected',
    modelOverride?: CertificateModelType
  ): Promise<{ blob: Blob; fileName: string } | null> => {
    let targetCert = selectedCert;
    if (!targetCert && userRoleCertificates.length > 0) {
      targetCert = userRoleCertificates[0];
    }

    const exportCerts =
      scope === 'selected'
        ? targetCert
          ? [targetCert]
          : userRoleCertificates[0]
          ? [userRoleCertificates[0]]
          : []
        : scope === 'class'
        ? filteredCertificates.length > 0
          ? filteredCertificates
          : userRoleCertificates
        : userRoleCertificates;

    if (exportCerts.length === 0) return null;

    const activeCert = exportCerts[0];
    const activeCertName = activeCert?.studentName
      ? activeCert.studentName.replace(/\s+/g, '_')
      : 'الطالبة';

    const effectiveModel: CertificateModelType =
      modelOverride ||
      currentExportModel ||
      (modelFilter !== 'all' ? (modelFilter as CertificateModelType) : undefined) ||
      activeCert?.certificateModel ||
      activePrintModel ||
      'model3_final_round1';

    const modelNameMap: Record<CertificateModelType, string> = {
      model1_first_term: 'معدل_الفصل_الأول',
      model2_mid_year: 'الفصل_الأول_ونصف_السنة',
      model3_annual_saei: 'السعي_السنوي',
      model4_final_round1: 'الشهادة_النهائية_الدور_الأول',
      model5_makeup_post_resit: 'الشهادة_ما_بعد_الإكمال_الدور_الثاني',
      model3_final_round1: 'الشهادة_النهائية_الدور_الأول',
      model4_makeup_post_resit: 'الشهادة_ما_بعد_الإكمال_الدور_الثاني',
    };
    const modelSuffix = modelNameMap[effectiveModel] || 'الشهادة_المدرسية';

    const certTitle =
      scope === 'all'
        ? `كشف_نتائج_طالبات_ثانوية_ميسان_${modelSuffix}_A4`
        : scope === 'class'
        ? `كشف_نتائج_${gradeFilter === 'all' ? 'جميع_الصفوف' : gradeFilter.replace(/\s+/g, '_')}_${modelSuffix}_A4`
        : `شهادة_${modelSuffix}_${activeCertName}_A4`;

    const fileName = `${certTitle}.pdf`;

    await ensureFontsLoaded();

    // Wait 350ms for React DOM to render offscreen pages
    await new Promise((resolve) => setTimeout(resolve, 350));

    const exportElement = document.getElementById('a4-pdf-export-offscreen-wrapper');
    let certPages: HTMLElement[] = [];

    // Save original element styles before temporary capture
    let prevPosition = '';
    let prevLeft = '';
    let prevTop = '';
    let prevZIndex = '';
    let prevOpacity = '';

    if (exportElement) {
      prevPosition = exportElement.style.position;
      prevLeft = exportElement.style.left;
      prevTop = exportElement.style.top;
      prevZIndex = exportElement.style.zIndex;
      prevOpacity = exportElement.style.opacity;

      // Position wrapper on-screen temporarily for html2canvas
      exportElement.style.position = 'fixed';
      exportElement.style.left = '0px';
      exportElement.style.top = '0px';
      exportElement.style.zIndex = '99999';
      exportElement.style.opacity = '1';
      exportElement.style.backgroundColor = '#ffffff';

      certPages = Array.from(exportElement.querySelectorAll('.a4-cert-export-page')) as HTMLElement[];
    }

    if (certPages.length === 0) {
      const fallbackEl = document.getElementById('a4-certificates-export-container');
      if (fallbackEl) {
        certPages = Array.from(fallbackEl.querySelectorAll('.a4-cert-page')) as HTMLElement[];
      }
    }

    try {
      const jspdfModule = await import('jspdf');
      const jsPDFConstructor = (jspdfModule.jsPDF || (jspdfModule as any).default || jspdfModule) as any;
      
      let html2canvas: any;
      try {
        const html2canvasModule = await import('html2canvas-pro');
        html2canvas = html2canvasModule.default || html2canvasModule;
      } catch (importErr) {
        const html2canvasFallback = await import('html2canvas');
        html2canvas = (html2canvasFallback as any).default || html2canvasFallback;
      }

      const pdf = new jsPDFConstructor({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      if (certPages.length > 0) {
        for (let i = 0; i < certPages.length; i++) {
          const pageEl = certPages[i];
          try {
            const canvas = await html2canvas(pageEl, {
              scale: 2.5,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: '#ffffff',
              imageTimeout: 15000,
              windowWidth: 800,
              scrollX: 0,
              scrollY: 0,
              onclone: (clonedDoc: Document) => {
                applyFontAndStyleFixesToClone(clonedDoc);
              },
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            if (i > 0) {
              pdf.addPage();
            }

            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            if (imgHeight <= pdfHeight) {
              const posY = (pdfHeight - imgHeight) / 2;
              pdf.addImage(imgData, 'JPEG', 0, posY, pdfWidth, imgHeight, undefined, 'FAST');
            } else {
              pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            canvas.width = 0;
            canvas.height = 0;
          } catch (err) {
            console.warn(`Canvas render error page ${i}:`, err);
          }
        }

        const pdfBlob = pdf.output('blob');
        return { blob: pdfBlob, fileName };
      }

      // Styled PDF generation if DOM element fails
      let summaryBody = `جمهورية العراق - وزارة التربية - تربية ميسان\nثانوية ميسان للمتميزات\nالشهادة المدرسية\nالتاريخ: ${new Date().toLocaleDateString('ar-IQ')}\n\n`;
      exportCerts.forEach((c, idx) => {
        const totalMarks = (c as any).totalMarks || (c.subjects?.reduce((acc: number, s: any) => acc + (s.finalGrade || s.midYearGrade || 0), 0) || 0);
        const avg = (c as any).average || c.overallFinalGrade || c.overallMidYearGrade || 0;
        summaryBody += `${idx + 1}. الطالبة: ${c.studentName} | الصف: ${c.gradeLevel} (${c.section || 'أ'}) | النتيجة: ${c.status} | المجموع الكلي: ${totalMarks} | المعدل العام: %${avg}\n`;
      });

      // Create a styled PDF page
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 0, 210, 297, 'F');
      pdf.setFillColor(30, 41, 59);
      pdf.rect(10, 10, 190, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Maysan Secondary School For Distinguished Female Students', 105, 22, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text('Official Certificates & Results Transcript', 105, 29, { align: 'center' });
      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(10, 40, 190, 235, 3, 3, 'FD');
      pdf.setFontSize(10);
      pdf.setTextColor(51, 65, 85);
      const splitLines = pdf.splitTextToSize(summaryBody, 175);
      pdf.text(splitLines, 18, 55);
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Document ID: ${activeCert?.id || 'Maysan-2026'} | Issued by Official E-System`, 105, 285, { align: 'center' });

      const pdfBlob = pdf.output('blob');
      return { blob: pdfBlob, fileName };
    } finally {
      // Restore original offscreen wrapper styles
      if (exportElement) {
        exportElement.style.position = prevPosition || 'absolute';
        exportElement.style.left = prevLeft || '-9999px';
        exportElement.style.top = prevTop || '0px';
        exportElement.style.zIndex = prevZIndex || '-9999';
        exportElement.style.opacity = prevOpacity || '1';
      }
    }
  };

  const handleExportPdf = async (
    scope: 'selected' | 'class' | 'all',
    modelOverride?: CertificateModelType
  ) => {
    if (modelOverride) {
      setCurrentExportModel(modelOverride);
      setActivePrintModel(modelOverride);
    }
    setIsExportingPdf(true);
    setExportProgressText('جاري تحويل وتصوير الشهادات إلى ملف PDF عالي الدقة (A4)...');
    setPrintScope(scope);

    if (scope === 'selected' && !selectedCert && userRoleCertificates.length > 0) {
      setSelectedCertId(userRoleCertificates[0].id);
    }

    const originalTitle = document.title;
    try {
      const result = await generateCertificatePdfBlob(scope, modelOverride);
      if (result) {
        setExportProgressText('تمت المعالجة بنجاح! جاري تنزيل الملف وحفظه بمجلد Downloads...');
        await savePdfBlob(result.blob, result.fileName);
      }
    } catch (err) {
      console.error('Export PDF error:', err);
    } finally {
      setIsExportingPdf(false);
      setExportProgressText('');
      document.title = originalTitle;
    }
  };

  const handlePrintSingle = () => {
    const chosenModel = (modelFilter !== 'all' ? (modelFilter as CertificateModelType) : currentExportModel || selectedCert?.certificateModel) || 'model4_final_round1';
    handleExportPdf('selected', chosenModel);
  };

  const handlePrintClass = () => {
    setBulkDownloadScope('class');
    setIsBulkDownloadModalOpen(true);
  };

  const handlePrintAll = () => {
    setBulkDownloadScope('all');
    setIsBulkDownloadModalOpen(true);
  };

  const handleConfirmBulkDownload = async (
    scope: 'all' | 'class',
    selectedModel: CertificateModelType,
    order: string
  ) => {
    if (order && (order === 'name_asc' || order === 'name_desc' || order === 'gpa_desc' || order === 'gpa_asc' || order === 'grade_sec')) {
      setSortOrder(order as any);
    }
    setCurrentExportModel(selectedModel);
    setActivePrintModel(selectedModel);
    await handleExportPdf(scope, selectedModel);
    setIsBulkDownloadModalOpen(false);
  };

  const handleCreateCertificate = () => {
    if (!selectedStudentForCert) return;
    addStudentCertificate(selectedStudentForCert, isCreateBlankForSingle);
    setIsAddModalOpen(false);
    setSelectedStudentForCert('');
  };

  const handleExportCSV = () => {
    let csv = 'رقم الطالبة,اسم الطالبة,الصف,الشعبة,معدل الفصل الأول,درجة نصف السنة,معدل الفصل الثاني,معدل السعي السنوي,درجة النهائي,معدل النهائي (الدور الأول),درجة الإكمال,معدل ما بعد الإكمال,النتيجة,التقدير\n';
    certificates.forEach((c) => {
      const displayAppreciation = (c.status === 'مكملة' || c.status.includes('مكمل') || c.status === 'راسبة' || !c.appreciation) ? '-' : c.appreciation;
      csv += `"${c.nationalId}","${c.studentName}","${c.gradeLevel}","${c.section}",${c.overallFirstTermAvg},${c.overallMidYearGrade},${c.overallSecondTermAvg},${c.overallAnnualSaeiAvg},${c.overallFinalExamGrade},${c.overallFinalGrade},"${c.subjects.some(s => s.resitGrade !== null) ? 'نعم' : 'لا'}",${c.overallPostResitAvg ?? c.overallFinalGrade},"${c.status}","${displayAppreciation}"\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_درجات_طالبات_ثانوية_ميسان_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Hide controls on print view */}
      <div className="print:hidden space-y-6">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-emerald-500/20">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>نظام الشهادات والنتائج المدرسية الرسمية</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {(role === 'student' || role === 'parent') && activeStudent
                  ? `شهادة ونتائج الطالبة: ${activeStudent.name}`
                  : 'إصدار وسجل الشهادات المدرسية للطالبات'}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {(role === 'student' || role === 'parent')
                  ? 'كشف درجات ونتائج الفصول الدراسية المعتمد لثانوية ميسان للمتميزات'
                  : 'إدارة شاملة لنتائج الفصول الدراسية (معدل الفصل الأول، درجة نصف السنة، معدل الفصل الثاني، معدل السعي السنوي، درجة الامتحان النهائي، معدل الدرجة النهائية، درجة الإكمال، ومعدل ما بعد الإكمال).'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsPreviewModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer transform hover:scale-105"
                title="عرض معاينة حية وتفاعلية لورقة A4 للشهادة مع التحكم بالحجم والتبديل بين الطالبات"
              >
                <Eye className="w-4 h-4 text-slate-950" />
                <span>معاينة الشهادة الحية 👁️</span>
              </button>

              {role === 'student' || role === 'parent' ? (
                <>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-indigo-900/40 cursor-pointer transform hover:scale-105"
                    title="نشر ومشاركة الشهادة والنتيجة كملف PDF عبر واتساب وتليغرام والتطبيقات"
                  >
                    <Share2 className="w-4 h-4 text-amber-300" />
                    <span>مشاركة ونشر كـ PDF 📲</span>
                  </button>

                  <button
                    onClick={() => handleExportPdf('selected')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-emerald-900/40 cursor-pointer"
                    title="تنزيل وتخزين ملف الـ PDF مباشرة على حاسوبك مع تحديد مجلد الحفظ"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>تنزيل ملف PDF</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-bold transition backdrop-blur-md border border-white/20 cursor-pointer"
                    title="فتح معاينة الطباعة للطباعة الورقية المباشرة"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>طباعة ورقية</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-indigo-950/40 cursor-pointer"
                    title="نشر ومشاركة شهادة الطالبة المحددة عبر وسائط التواصل والتطبيقات"
                  >
                    <Share2 className="w-4 h-4 text-amber-300" />
                    <span>مشاركة ونشر كـ PDF 📲</span>
                  </button>

                  <button
                    onClick={handlePrintClass}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-emerald-950/40 cursor-pointer"
                    title="تنزيل وتصدير شهادات الصف المحدد حالياً"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>تنزيل PDF ({gradeFilter === 'all' ? 'جميع الصفوف' : gradeFilter})</span>
                  </button>

                  <button
                    onClick={handlePrintAll}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-indigo-950/40 cursor-pointer"
                    title="تصدير وحفظ ملف PDF لكافة الطالبات بكامل المدرسة"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>تنزيل كافة المدرسة ({userRoleCertificates.length} طالبة - PDF)</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-bold transition border border-slate-700 shadow-sm cursor-pointer"
                    title="فتح نافذة ومعاينة الطباعة الورقية المباشرة"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>طباعة ورقية</span>
                  </button>

                  <button
                    onClick={() => setViewMode(viewMode === 'matrix' ? 'official_print' : 'matrix')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold transition backdrop-blur-md border border-white/15 cursor-pointer"
                  >
                    {viewMode === 'matrix' ? (
                      <>
                        <Eye className="w-4 h-4 text-emerald-400" />
                        <span>معاينة ورقة A4 الرسمية</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 text-indigo-400" />
                        <span>سجل ومصفوفة تعديل الدرجات</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                    <span>تصدير Excel/CSV</span>
                  </button>

                  {(role === 'admin' || role === 'teacher') && (
                    <>
                      <button
                        onClick={() => setIsDecisionModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-amber-300 font-extrabold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-teal-950/40 border border-teal-600/50"
                        title="تعديل ضوابط وقواعد درجات القرار والمساعدات الوزارية"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>إعدادات درجات القرار المساعدة</span>
                      </button>

                      <button
                        onClick={() => setIsEditHeaderModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-amber-500/20"
                        title="تعديل الشعار الرسمي، الاسم بالإنجليزية، العام الدراسي، والجهات الموقعة"
                      >
                        <Settings className="w-4 h-4 text-slate-950" />
                        <span>تعديل الشعار والترويسة</span>
                      </button>
                    </>
                  )}

                  {role === 'admin' && (
                    <>
                      <button
                        onClick={() => setIsBulkIssueModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg shadow-amber-950/30 cursor-pointer transform hover:scale-105"
                        title="إصدار شهادات لجميع طالبات المدرسة، أو لصف معين أو شعبة معينة، ونماذج فارغة للإدخال اليدوي"
                      >
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>إصدار شهادات (شامل / صف / شعبة / نماذج فارغة) ✨</span>
                      </button>

                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-indigo-900/40"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إصدار لطالبة فردية</span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid - Hidden for Student / Parent */}
        {role !== 'student' && role !== 'parent' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                <span>إجمالي الشهادات المصدرة</span>
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{kpis.total}</div>
              <div className="text-[11px] text-slate-400 mt-1">طالبة مسجلة بالسجل</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                <span>الطالبات الناجحات</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">{kpis.passed}</div>
              <div className="text-[11px] text-emerald-600/80 mt-1">نسبة نجاح عالية</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                <span>الطالبات المعفيات</span>
                <Award className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-bold text-teal-700">{kpis.totalExempt}</div>
              <div className="text-[11px] text-teal-700/80 mt-1">({kpis.generalExempt} عام / {kpis.individualExempt} فردي)</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                <span>طالبات الإكمال (دور ثاني)</span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600">{kpis.resit}</div>
              <div className="text-[11px] text-amber-600/80 mt-1">مؤهلات للامتحان البديـل</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                <span>الطالبات الراسبات</span>
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-600">{kpis.failed}</div>
              <div className="text-[11px] text-slate-400 mt-1">إعادة السنة الدراسية</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                <span>المعدل العام للمدرسة</span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-700">{kpis.avgScore}%</div>
              <div className="text-[11px] text-purple-600 mt-1">معدل التميز الدراسي</div>
            </div>
          </div>
        )}

        {/* Filters & Search - Hidden for Student / Parent */}
        {role !== 'student' && role !== 'parent' && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الطالبة أو الرقم الوطني..."
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>الصف:</span>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none text-slate-800"
                >
                  <option value="all">جميع الصفوف الدراسية</option>
                  {ALL_GRADES_LIST.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
                <span>النتيجة:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none text-slate-800"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="ناجحة">ناجحة (دور أول)</option>
                  <option value="ناجحة بالدور الثاني">ناجحة (دور ثاني)</option>
                  <option value="مكملة">مكملة (دور ثاني)</option>
                  <option value="راسبة">راسبة</option>
                  <option value="مؤجلة">مؤجلة / نموذج فارغ للإدخال</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>الإعفاء:</span>
                <select
                  value={exemptionFilter}
                  onChange={(e) => setExemptionFilter(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none text-emerald-900"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="exempt_any">جميع المعفيات (عام + فردي)</option>
                  <option value="general">⭐ مشمولة بالإعفاء العام</option>
                  <option value="individual">✨ مشمولة بالإعفاء الفردي</option>
                  <option value="none">غير مشمولة بالإعفاء</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-semibold text-amber-950">
                <span>نموذج الشهادة:</span>
                <select
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                  className="bg-transparent font-extrabold focus:outline-none text-amber-950"
                >
                  <option value="all">جميع النماذج الـ 5 المعتمدة</option>
                  {CERTIFICATE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.icon} {m.shortTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-semibold text-indigo-950">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                <span>ترتيب الأسماء:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="bg-transparent font-extrabold focus:outline-none text-indigo-950 cursor-pointer"
                >
                  <option value="name_asc">🔤 أبجدياً (أ ⬅️ ي) [افتراضي]</option>
                  <option value="name_desc">🔤 أبجدياً (ي ⬅️ أ)</option>
                  <option value="gpa_desc">🏆 الأعلى معدلاً</option>
                  <option value="gpa_asc">📉 الأقل معدلاً</option>
                  <option value="grade_sec">🏫 حسب المرحلة والشعبة</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Teacher Subject Notice Banner */}
        {role === 'teacher' && (
          <div className="bg-indigo-900 text-white p-4.5 rounded-2xl flex items-start gap-3.5 border border-indigo-700 shadow-lg">
            <Lock className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="font-black text-amber-300 flex items-center gap-2">
                <span>👩‍🏫 لوحة إدخال درجات مادة ({teacherSubject})</span>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30">
                  سرية وخصوصية الدرجات مفرزة
                </span>
              </div>
              <p className="text-indigo-100 leading-relaxed">
                بصفتكِ مدرسة مادة <strong className="text-white">{teacherSubject}</strong>، يمكنكِ إدخال وتحديث درجات مادتكِ فقط للطالبات الموكل تدريسهن ({teacherAssignedGrades.join('، ')}). تم حجب درجات باقي المواد لحفظ الخصوصية والسرية بين المدرسات. ترتبط الدرجات تلقائياً بالشهادة الرسمية لدى إدارة المدرسة والطالبة وولي أمرها.
              </p>
            </div>
          </div>
        )}

        {/* Iraqi Exemption Rules Information Notice */}
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-emerald-950 text-xs leading-relaxed space-y-2 shadow-2xs">
          <div className="flex items-center justify-between font-extrabold text-xs sm:text-sm text-emerald-900">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>ضوابط الإعفاء العام والإعفاء الفردي (وزارة التربية العراقية)</span>
            </div>
            <span className="bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-full text-[10px] font-bold">مطبقة تلقائياً بالنظام</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>1. نظام الإعفاء الفردي (لكل مادة):</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                في حال كان معدل السعي السنوي للطالبة <strong>90% أو أعلى</strong> في مادة معينة، تُعفى من أداء الامتحان النهائي لتلك المادة وتُسجّل درجتها النهائية للدور الأول مساوية لمعدل سعيها السنوي وتُكتب بعبارة <strong>(معفو)</strong>.
              </p>
            </div>
            <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. نظام الإعفاء العام (لكافة المواد):</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                إذا كان معدل السعي السنوي العام لجميع المواد <strong>85% أو أعلى</strong> بشرط ألا يقل معدل السعي السنوي لأي مادة عن <strong>75%</strong>، تُشمل الطالبة بالإعفاء العام لكافة المواد وتُعفى من الامتحانات النهائية.
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle Bar - Hidden for Student / Parent */}
        {role !== 'student' && role !== 'parent' && (
          <div className="flex items-center justify-between bg-slate-200/60 p-1.5 rounded-2xl">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                viewMode === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>سجل الدرجات والتعديل الفوري (مصفوفة المواد)</span>
            </button>

            <button
              onClick={() => setViewMode('official_print')}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                viewMode === 'official_print'
                  ? 'bg-white text-emerald-700 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>عرض وطباعة الشهادة الرسمية المختومة (A4)</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Feedback Toast */}
      {deleteFeedbackToast && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle className="w-5 h-5 text-amber-300 shrink-0" />
            <span>{deleteFeedbackToast}</span>
          </div>
          <button
            onClick={() => setDeleteFeedbackToast(null)}
            className="text-white hover:text-amber-200 text-xs font-bold px-2 py-1 bg-emerald-700/60 rounded-lg cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* MATRIX VIEW - Hidden for Student / Parent */}
      {role !== 'student' && role !== 'parent' && viewMode === 'matrix' && (
        <div className="print:hidden space-y-4">
          {/* Multi-Select & Bulk Actions Bar (Admin) */}
          {role === 'admin' && filteredCertificates.length > 0 && (
            <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 border border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={
                      filteredCertificates.length > 0 &&
                      filteredCertificates.every((c) => selectedCertIds.includes(c.id))
                    }
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer pointer-events-none accent-indigo-500"
                  />
                  <span>
                    {filteredCertificates.every((c) => selectedCertIds.includes(c.id))
                      ? 'إلغاء تحديد الكل'
                      : `تحديد كافة المعروض (${filteredCertificates.length})`}
                  </span>
                </button>

                {selectedCertIds.length > 0 && (
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold">
                    تم تحديد: {selectedCertIds.length} شهادة
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedCertIds.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleRequestDeleteSelected}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                      title="حذف الشهادات المحددة بصورة مجمعة وآمنة"
                    >
                      <Trash2 className="w-4 h-4 text-rose-200" />
                      <span>حذف المحدد ({selectedCertIds.length}) 🗑️</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCertIds([])}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition cursor-pointer"
                    >
                      إلغاء التحديد
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setIsBulkIssueModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="خيارات حذف متقدمة (حذف صف كامل، شعبة كاملة، أو جميع الشهادات)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف حسب النطاق/الصف ⚙️</span>
                </button>
              </div>
            </div>
          )}
          {filteredCertificates.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <Award className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">لا توجد شهادات مطابقة للبحث</h3>
              <p className="text-xs text-slate-500">جرب تصفية مختلفة أو قم بإصدار شهادة جديدة لطالبة.</p>
            </div>
          ) : (
            filteredCertificates.map((cert) => {
              const isExpanded = expandedCertId === cert.id;
              const isSelected = selectedCertId === cert.id;
              const isChecked = selectedCertIds.includes(cert.id);

              return (
                <div
                  key={cert.id}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isChecked
                      ? 'border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/10'
                      : isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => {
                      setSelectedCertId(cert.id);
                      setExpandedCertId(isExpanded ? null : cert.id);
                    }}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-center gap-3.5">
                      {role === 'admin' && (
                        <div
                          onClick={(e) => toggleSelectCert(cert.id, e)}
                          className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition cursor-pointer shrink-0"
                          title="تحديد هذه الشهادة"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600 pointer-events-none"
                          />
                        </div>
                      )}

                      <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base shrink-0 border border-indigo-100">
                        {cert.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            {cert.studentName}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {cert.gradeLevel} - شعبة ({cert.section})
                          </span>
                          {/* Certificate Model Badge */}
                          {(() => {
                            const currentModelObj = CERTIFICATE_MODELS.find(
                              (m) => m.id === (cert.certificateModel || 'model3_final_round1')
                            );
                            return (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                                <span>{currentModelObj?.icon || '📜'}</span>
                                <span>{currentModelObj?.badgeTag || 'الشهادة النهائية'}</span>
                              </span>
                            );
                          })()}
                          <span className="text-xs text-slate-400 font-mono">
                            ID: {cert.nationalId}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                          <span>العام الدراسي: {cert.academicYear}</span>
                          <span>•</span>
                          <span>تاريخ الإصدار: {cert.issueDate}</span>
                          <span>•</span>
                          <span className="text-amber-800 font-medium">
                            النموذج المعتمد: {CERTIFICATE_MODELS.find((m) => m.id === (cert.certificateModel || 'model3_final_round1'))?.titleAr || 'الشهادة المدرسية النهائية'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400 font-medium">
                          {modelFilter === 'model1_first_term'
                            ? 'معدل الفصل الأول'
                            : modelFilter === 'model2_mid_year'
                            ? 'معدل نصف السنة'
                            : modelFilter === 'model3_annual_saei'
                            ? 'معدل السعي السنوي'
                            : modelFilter === 'model4_final_round1'
                            ? 'المعدل العام (دور 1)'
                            : 'المعدل النهائي (بعد الإكمال)'}
                        </div>
                        <div className="text-lg font-black text-indigo-700">
                          {modelFilter === 'model1_first_term'
                            ? getFirstTermStudentStatus(cert).status === 'ناجحة'
                              ? `${cert.overallFirstTermAvg || 0}%`
                              : '-'
                            : modelFilter === 'model2_mid_year'
                            ? getMidYearStudentStatus(cert).status === 'ناجحة'
                              ? `${cert.overallMidYearGrade || 0}%`
                              : '-'
                            : modelFilter === 'model3_annual_saei'
                            ? getAnnualSaeiStudentStatus(cert).status === 'ناجحة'
                              ? `${cert.overallAnnualSaeiAvg || 0}%`
                              : '-'
                            : modelFilter === 'model4_final_round1'
                            ? getFinalRound1StudentStatus(cert, decisionSettings).status === 'ناجحة'
                              ? `${cert.overallFinalGrade || 0}%`
                              : '-'
                            : getPostResitStudentStatus(cert, decisionSettings).status === 'ناجحة'
                            ? `${cert.overallPostResitAvg ?? cert.overallFinalGrade}%`
                            : '-'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {modelFilter === 'model1_first_term' ? (
                          (() => {
                            const term1 = getFirstTermStudentStatus(cert);
                            return (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${term1.colorClass}`}
                              >
                                {term1.badge}
                              </span>
                            );
                          })()
                        ) : modelFilter === 'model2_mid_year' ? (
                          (() => {
                            const mid = getMidYearStudentStatus(cert);
                            return (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${mid.colorClass}`}
                              >
                                {mid.badge}
                              </span>
                            );
                          })()
                        ) : modelFilter === 'model3_annual_saei' ? (
                          (() => {
                            const saei = getAnnualSaeiStudentStatus(cert);
                            return (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${saei.colorClass}`}
                              >
                                {saei.badge}
                              </span>
                            );
                          })()
                        ) : modelFilter === 'model4_final_round1' ? (
                          (() => {
                            const final1 = getFinalRound1StudentStatus(cert, decisionSettings);
                            return (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${final1.colorClass}`}
                              >
                                {final1.badge}
                              </span>
                            );
                          })()
                        ) : modelFilter === 'model5_makeup_post_resit' ? (
                          (() => {
                            const postRes = getPostResitStudentStatus(cert, decisionSettings);
                            return (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${postRes.colorClass}`}
                              >
                                {postRes.badge}
                              </span>
                            );
                          })()
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              cert.status === 'ناجحة' || cert.status === 'ناجحة بالدور الثاني'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : cert.status === 'مكملة'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : cert.status === 'مؤجلة'
                                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {cert.status === 'مؤجلة' ? 'نموذج فارغ للإدخال 📝' : cert.status} {(cert.status !== 'مكملة' && !cert.status.includes('مكمل') && cert.status !== 'راسبة' && cert.status !== 'مؤجلة' && cert.appreciation && cert.appreciation !== '-') ? `(${cert.appreciation})` : ''}
                          </span>
                        )}

                        {(role === 'admin' || role === 'teacher') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setManualEditTargetCert(cert);
                              setIsManualGradesEditorOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                            title="إدخال وتعديل كافة درجات الطالبة يدوياً في جدول سريع"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-950" />
                            <span>إدخال الدرجات ✏️</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCertId(cert.id);
                            const chosenModel = (modelFilter !== 'all' ? (modelFilter as CertificateModelType) : currentExportModel || cert.certificateModel) || 'model3_final_round1';
                            setSelectedShareModel(chosenModel);
                            setIsShareModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                          title="نشر ومشاركة شهادة الطالبة عبر وسائط النقل والاتصال"
                        >
                          <Share2 className="w-3.5 h-3.5 text-amber-300" />
                          <span>مشاركة 📲</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCertId(cert.id);
                            const chosenModel = (modelFilter !== 'all' ? (modelFilter as CertificateModelType) : currentExportModel || cert.certificateModel) || 'model3_final_round1';
                            handleExportPdf('selected', chosenModel);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                          title="تنزيل شهادة هذه الطالبة بملف PDF كحفظ على جهازك"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-300" />
                          <span>تنزيل PDF</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCertId(cert.id);
                            setIsPreviewModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-slate-900 transition cursor-pointer"
                          title="معاينة حية وتفاعلية لشهادة الطالبة (A4)"
                        >
                          <Eye className="w-4 h-4 text-amber-700" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const chosenModel = (modelFilter !== 'all' ? (modelFilter as CertificateModelType) : currentExportModel || cert.certificateModel) || 'model3_final_round1';
                            handlePrint(cert, chosenModel);
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          title="طباعة ورقية لشهادة الطالبة"
                        >
                          <Printer className="w-4 h-4 text-emerald-600" />
                        </button>

                        {role === 'admin' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestDeleteSingle(cert);
                            }}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer shadow-xs"
                            title="حذف شهادة الطالبة نهائياً من السجل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <div className="p-1 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Grade Breakdown Table */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-6 space-y-4">
                      {/* Ministry Decision Marks Toolbar */}
                      <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 font-black text-amber-950 text-sm flex-wrap">
                            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                            <span>مساعدات ودرجات القرار الوزاري للطالبة:</span>
                            <span className="bg-amber-200/90 text-amber-950 px-3 py-0.5 rounded-full font-bold text-xs border border-amber-300 shadow-2xs">
                              مستخدم ({cert.decisionMarksUsed || 0}) من أصل ({decisionSettings?.maxDecisionMarks || 10}) درجات قرار
                            </span>
                            <span className="bg-teal-900 text-teal-100 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-teal-800">
                              نطاق القرار: {decisionSettings?.decisionScopeMode === 'per_subject' ? 'لكل مادة' : 'لكافة المواد'}
                            </span>
                          </div>

                          <div className="text-slate-700 font-medium">
                            {cert.originalStatus && cert.originalStatus !== cert.status ? (
                              <p className="text-emerald-900 font-extrabold flex items-center gap-1.5 text-xs bg-emerald-100/80 px-3 py-1 rounded-xl border border-emerald-300 inline-block mt-1">
                                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 inline" />
                                <span>
                                  الحالة الأصلية: ({cert.originalStatus}) ⬅️ تحولت بقرار المساعدة الوزاري إلى: ({cert.status})
                                </span>
                              </p>
                            ) : (
                              <p className="text-slate-600 text-[11px] mt-0.5">
                                النتيجة الحالية: <span className="font-bold text-slate-900">{cert.status}</span> (دون تغيير بقرار المساعدة)
                              </p>
                            )}
                            {cert.decisionNotes && (
                              <p className="text-amber-950 font-bold mt-1.5 bg-white p-2.5 rounded-xl border border-amber-200 text-[11px] leading-relaxed shadow-2xs">
                                {cert.decisionNotes}
                              </p>
                            )}
                          </div>
                        </div>

                        {(role === 'admin' || role === 'teacher') && (
                          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                            <button
                              onClick={() => autoOptimizeDecisionMarksForCert(cert.id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition shadow-sm"
                              title="تطبيق القرار الوزاري التلقائي الذكي لمنح درجات القرار المساعدة للدروس الحافة"
                            >
                              <Zap className="w-4 h-4 text-amber-300" />
                              <span>تطبيق القرار التلقائي الذكي</span>
                            </button>

                            {cert.hasDecisionMarks && (
                              <button
                                onClick={() => resetDecisionMarksForCert(cert.id)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition border border-amber-300 shadow-2xs"
                                title="إلغاء وإعادة ضبط درجات القرار المضافة للطالبة"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                <span>إلغاء درجات القرار</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          <span>تفاصيل الدرجات وحساب المعدلات للمواد الدراسية</span>
                        </h4>

                        <div className="flex items-center gap-2">
                          {(role === 'admin' || role === 'teacher') && (
                            <button
                              onClick={() => {
                                setManualEditTargetCert(cert);
                                setIsManualGradesEditorOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition shadow-xs cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-950" />
                              <span>فتح جدول الإدخال والتعديل اليدوي الكامل</span>
                            </button>
                          )}

                          <button
                            onClick={() => recalculateCertificate(cert.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>إعادة حساب المعدلات تلقائياً</span>
                          </button>
                        </div>
                      </div>

                      {/* Grade Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-800 text-white font-semibold">
                            <tr>
                              <th className="p-3 border-b border-slate-700">اسم المادة</th>
                              <th className="p-3 border-b border-slate-700 text-center bg-indigo-900/40">
                                معدل الفصل الأول
                              </th>
                              <th className="p-3 border-b border-slate-700 text-center bg-indigo-900/40">
                                درجة نصف السنة
                              </th>
                              <th className="p-3 border-b border-slate-700 text-center bg-indigo-900/40">
                                معدل الفصل الثاني
                              </th>
                              <th className="p-3 border-b border-slate-700 text-center bg-emerald-950 font-bold">
                                معدل السعي السنوي
                              </th>
                              <th className="p-3 border-b border-slate-700 text-center bg-purple-950">
                                درجة النهائي (دور 1)
                              </th>
                              <th className="p-3 border-b border-slate-700 text-center bg-slate-900 font-bold">
                                معدل الدرجة النهائية
                              </th>
                              <th className="p-3 border-b border-slate-700 text-center bg-teal-950 font-bold text-amber-300">
                                درجة القرار (+)
                              </th>
                              <th className="p-3 border-b border-slate-700 text-center bg-amber-950">
                                درجة الإكمال (دور 2)
                              </th>
                              <th className="p-3 border-b border-slate-700 text-center bg-emerald-900 font-bold">
                                معدل ما بعد الإكمال
                              </th>
                              {(role === 'admin' || role === 'teacher') && (
                                <th className="p-3 border-b border-slate-700 text-center">إجراء</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {(role === 'teacher'
                              ? (() => {
                                  const filtered = cert.subjects.filter(
                                    (s) =>
                                      s.subjectName.toLowerCase().trim().includes(teacherSubject.toLowerCase().trim()) ||
                                      teacherSubject.toLowerCase().trim().includes(s.subjectName.toLowerCase().trim())
                                  );
                                  if (filtered.length > 0) return filtered;
                                  return [
                                    {
                                      id: `sub-virtual-${cert.id}`,
                                      subjectName: teacherSubject,
                                      firstTermAvg: 0,
                                      midYearGrade: 0,
                                      secondTermAvg: 0,
                                      annualSaeiAvg: 0,
                                      finalExamGrade: 0,
                                      finalGrade: 0,
                                      resitGrade: null,
                                      postResitGrade: 0,
                                    },
                                  ];
                                })()
                              : cert.subjects
                            ).map((sub) => {
                              const isEditing =
                                editingSubject?.certId === cert.id &&
                                editingSubject?.subjectId === sub.id;

                              return (
                                <tr key={sub.id} className="hover:bg-indigo-50/30 transition">
                                  <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{sub.subjectName}</span>
                                    {role === 'teacher' && (
                                      <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold border border-indigo-200">
                                        مادتكِ المخصصة
                                      </span>
                                    )}
                                  </td>

                                  {/* First Term Avg */}
                                  <td className="p-2 text-center">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={sub.firstTermAvg}
                                        onChange={(e) =>
                                          updateSubjectGrade(cert.id, sub.id, {
                                            firstTermAvg: Math.min(100, Math.max(0, Number(e.target.value))),
                                          })
                                        }
                                        className="w-16 px-1.5 py-1 border border-indigo-400 rounded text-center font-bold text-xs"
                                      />
                                    ) : (
                                      renderGradeValue(sub.firstTermAvg, 'font-semibold')
                                    )}
                                  </td>

                                  {/* Mid Year Grade */}
                                  <td className="p-2 text-center">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={sub.midYearGrade}
                                        onChange={(e) =>
                                          updateSubjectGrade(cert.id, sub.id, {
                                            midYearGrade: Math.min(100, Math.max(0, Number(e.target.value))),
                                          })
                                        }
                                        className="w-16 px-1.5 py-1 border border-indigo-400 rounded text-center font-bold text-xs"
                                      />
                                    ) : (
                                      renderGradeValue(sub.midYearGrade, 'font-semibold')
                                    )}
                                  </td>

                                  {/* Second Term Avg */}
                                  <td className="p-2 text-center">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={sub.secondTermAvg}
                                        onChange={(e) =>
                                          updateSubjectGrade(cert.id, sub.id, {
                                            secondTermAvg: Math.min(100, Math.max(0, Number(e.target.value))),
                                          })
                                        }
                                        className="w-16 px-1.5 py-1 border border-indigo-400 rounded text-center font-bold text-xs"
                                      />
                                    ) : (
                                      renderGradeValue(sub.secondTermAvg, 'font-semibold')
                                    )}
                                  </td>

                                  {/* Annual Saei Avg */}
                                  <td className="p-2 text-center font-bold text-slate-800">
                                    {renderGradeValue(sub.annualSaeiAvg, 'font-bold text-slate-900')}
                                  </td>

                                  {/* Final Exam Grade */}
                                  <td className="p-2 text-center">
                                    {sub.isExempt ? (
                                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300 inline-flex items-center gap-1 shadow-2xs" title="معفاة من الامتحان النهائي بناء على نظام الإعفاء الوزاري">
                                        <Award className="w-3.5 h-3.5 text-emerald-700" />
                                        معفو
                                      </span>
                                    ) : isEditing ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={sub.finalExamGrade}
                                        onChange={(e) =>
                                          updateSubjectGrade(cert.id, sub.id, {
                                            finalExamGrade: Math.min(100, Math.max(0, Number(e.target.value))),
                                          })
                                        }
                                        className="w-16 px-1.5 py-1 border border-indigo-400 rounded text-center font-bold text-xs"
                                      />
                                    ) : (
                                      renderGradeValue(sub.finalExamGrade, 'font-semibold')
                                    )}
                                  </td>

                                  {/* Final Grade */}
                                  <td className="p-2 text-center font-bold text-slate-900">
                                    {sub.isExempt ? (
                                      <span className="font-extrabold text-slate-900 inline-flex items-center gap-1">
                                        {renderGradeValue(sub.finalGrade, 'font-bold text-slate-900')}
                                        <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded font-bold border border-emerald-200">
                                          (معفو)
                                        </span>
                                      </span>
                                    ) : (
                                      renderGradeValue(sub.finalGrade, 'font-bold text-slate-900')
                                    )}
                                  </td>

                                  {/* Decision Marks */}
                                  <td className="p-2 text-center bg-teal-50/40">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        placeholder="0"
                                        value={sub.decisionMarks ?? ''}
                                        onChange={(e) =>
                                          updateSubjectGrade(cert.id, sub.id, {
                                            decisionMarks: e.target.value === '' ? 0 : Math.min(10, Math.max(0, Number(e.target.value))),
                                          })
                                        }
                                        className="w-14 px-1 py-1 border border-teal-500 bg-teal-50 text-teal-950 rounded text-center font-bold text-xs"
                                        title="درجة القرار المضافة لهذه المادة"
                                      />
                                    ) : (
                                      <span className="font-extrabold text-teal-800 text-xs">
                                        {sub.decisionMarks && sub.decisionMarks > 0 ? `+${sub.decisionMarks}` : '-'}
                                      </span>
                                    )}
                                  </td>

                                  {/* Resit Grade (Degree of completion - الدور الثاني) */}
                                  <td className="p-2 text-center bg-amber-50/50">
                                    {isEditing ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          placeholder="دور 2"
                                          value={sub.resitGrade ?? ''}
                                          onChange={(e) =>
                                            updateSubjectGrade(cert.id, sub.id, {
                                              resitGrade: e.target.value === '' ? null : Math.min(100, Math.max(0, Number(e.target.value))),
                                            })
                                          }
                                          className="w-16 px-1.5 py-1 border-2 border-amber-500 bg-amber-100/90 text-amber-950 rounded-lg text-center font-black text-xs focus:ring-2 focus:ring-amber-500"
                                          title="درجة امتحان الإكمال (الدور الثاني)"
                                        />
                                        {sub.resitGrade !== null && sub.resitGrade !== undefined && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              updateSubjectGrade(cert.id, sub.id, {
                                                resitGrade: null,
                                              })
                                            }
                                            className="text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:underline shrink-0"
                                            title="مسح درجة الإكمال"
                                          >
                                            مسح
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      renderGradeValue(sub.resitGrade, 'font-black text-xs text-amber-900')
                                    )}
                                  </td>

                                  {/* Post Resit Grade */}
                                  <td className="p-2 text-center font-black bg-emerald-50/70">
                                    {renderGradeValue(sub.postResitGrade ?? sub.finalGrade, 'font-black text-emerald-950')}
                                  </td>

                                  {/* Actions */}
                                  {(role === 'admin' || role === 'teacher') && (
                                    <td className="p-2 text-center">
                                      <button
                                        onClick={() =>
                                          setEditingSubject(
                                            isEditing ? null : { certId: cert.id, subjectId: sub.id }
                                          )
                                        }
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition shadow-xs ${
                                          isEditing
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                        }`}
                                      >
                                        {isEditing ? 'حفظ' : 'تعديل'}
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-slate-900 font-bold text-white border-t-2 border-slate-700">
                            <tr>
                              <td className="p-3 font-black text-white">المعدل العام للطالبة:</td>
                              <td className="p-3 text-center">{renderGradeValue(cert.overallFirstTermAvg, 'text-amber-300 font-black text-sm', '%')}</td>
                              <td className="p-3 text-center">{renderGradeValue(cert.overallMidYearGrade, 'text-amber-300 font-black text-sm', '%')}</td>
                              <td className="p-3 text-center">{renderGradeValue(cert.overallSecondTermAvg, 'text-amber-300 font-black text-sm', '%')}</td>
                              <td className="p-3 text-center">{renderGradeValue(cert.overallAnnualSaeiAvg, 'text-amber-300 font-black text-sm', '%')}</td>
                              <td className="p-3 text-center">{renderGradeValue(cert.overallFinalExamGrade, 'text-amber-300 font-black text-sm', '%')}</td>
                              <td className="p-3 text-center">{renderGradeValue(cert.overallFinalGrade, 'text-yellow-300 font-black text-base', '%')}</td>
                              <td className="p-3 text-center text-teal-300 font-extrabold">
                                {cert.decisionMarksUsed && cert.decisionMarksUsed > 0 ? `+${cert.decisionMarksUsed}` : '-'}
                              </td>
                              <td className="p-3 text-center text-amber-200">-</td>
                              <td className="p-3 text-center">
                                {renderGradeValue(cert.overallPostResitAvg ?? cert.overallFinalGrade, 'text-emerald-300 text-sm font-black', '%')}
                              </td>
                              {(role === 'admin' || role === 'teacher') && <td></td>}
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Notes / Remarks */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">ملاحظات الإدارة:</span>
                          <input
                            type="text"
                            value={cert.notes || ''}
                            onChange={(e) => updateCertificate(cert.id, { notes: e.target.value })}
                            placeholder="اكتب أي ملاحظة خاصة بالطالبة..."
                            className="flex-1 px-3 py-1 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCertId(cert.id);
                              handleExportPdf('selected');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition cursor-pointer shadow-xs text-xs"
                            title="تنزيل شهادة هذه الطالبة كملف PDF وحفظه على حاسوبك"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-300" />
                            <span>تنزيل PDF</span>
                          </button>

                          <button
                            onClick={() => handlePrint(cert)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition cursor-pointer text-xs"
                            title="طباعة ورقية مباشرة لشهادة هذه الطالبة"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            <span>طباعة ورقية</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCertId(cert.id);
                              setIsPreviewModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg transition cursor-pointer text-xs"
                            title="فتح المعاينة الحية والتفاعلية قبل الحفظ والطباعة"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-950" />
                            <span>معاينة حية (A4) 👁️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* OFFICIAL PRINTABLE CERTIFICATE VIEW (A4 Printable Layout) */}
      {(viewMode === 'official_print' || true) && (
        <div className={viewMode === 'official_print' ? 'block' : 'hidden print:block'}>
          {/* Toolbar Control (Hidden on Print) */}
          <div className="print:hidden mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-emerald-600" />
                  <span>معاينة وتصدير الشهادات الرسمية (ورق A4 جاهز للطباعة و PDF)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  تنسيق رسمي معتمد مطابق لضوابط وزارة التربية العراقية (كل طالبة في صفحة A4 مستقلة)
                </p>
              </div>

              {/* Scope Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 flex-wrap">
                <button
                  onClick={() => setPrintScope('selected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    printScope === 'selected'
                      ? 'bg-slate-900 text-amber-300 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  طالبة واحدة ({selectedCert?.studentName || 'المحددة'})
                </button>

                <button
                  onClick={() => setPrintScope('class')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    printScope === 'class'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الصف المحدد ({gradeFilter === 'all' ? 'جميع الصفوف' : gradeFilter}) - {filteredCertificates.length} طالبة
                </button>

                <button
                  onClick={() => setPrintScope('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    printScope === 'all'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  كامل المدرسة ({userRoleCertificates.length} طالبة)
                </button>
              </div>
            </div>

            {/* Active Model Selector for Official Print */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-700 flex items-center gap-1">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>نموذج الشهادة الرسمي:</span>
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {CERTIFICATE_MODELS.map((model) => {
                    const isCurrent = (currentExportModel || activePrintModel) === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          setActivePrintModel(model.id);
                          setCurrentExportModel(model.id);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-300'
                            : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                        }`}
                      >
                        <span>{model.icon}</span>
                        <span>{model.shortTitle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              {printScope === 'selected' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">اختيار الطالبة:</span>
                  {userRoleCertificates.length > 1 ? (
                    <select
                      value={selectedCert?.id || ''}
                      onChange={(e) => setSelectedCertId(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      {userRoleCertificates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.studentName} ({c.gradeLevel} - {c.status})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold">
                      {selectedCert?.studentName || 'الطالبة'}
                    </span>
                  )}
                </div>
              ) : printScope === 'class' ? (
                <div className="text-xs font-bold text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  تصدير كشف درجات الصف المحدد ({gradeFilter === 'all' ? 'جميع الصفوف المفلترة' : gradeFilter}) لعدد ({filteredCertificates.length}) طالبة بملف PDF واحد، صفحة A4 لكل طالبة.
                </div>
              ) : (
                <div className="text-xs font-bold text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                  تصدير كشف درجات كافة المدرسة لعدد ({userRoleCertificates.length}) طالبة بملف PDF واحد، مع فصل كل شهادة على صفحة A4 كاملة.
                </div>
              )}

              <div className="flex items-center gap-2.5 mr-auto">
                <button
                  onClick={() => handleExportPdf(printScope, currentExportModel || activePrintModel)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/30 transition cursor-pointer"
                  title="تنزيل مباشر لملف PDF وحفظه على حاسوبك"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>
                    تنزيل ملف PDF ({printScope === 'all' ? `لكافة ${userRoleCertificates.length} طالبات بالمدرسة` : printScope === 'class' ? `لعدد ${filteredCertificates.length} طالبات بالصف` : 'للطالبة الحالية'})
                  </span>
                </button>

                <button
                  onClick={() => handlePrint(undefined, currentExportModel || activePrintModel)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs sm:text-sm font-bold transition border border-slate-700 cursor-pointer"
                  title="طباعة ورقية مباشرة عبر نافذة طباعة المتصفح أو الطباعة للـ PDF"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>طباعة ورقية</span>
                </button>

                {(role === 'admin' || role === 'teacher' || role === 'supervisor') && (
                  <button
                    onClick={() => setViewMode('matrix')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition border border-slate-300 cursor-pointer"
                    title="العودة لمصفوفة وجدول تعديل درجات الطالبات"
                  >
                    <Table className="w-4 h-4 text-indigo-600" />
                    <span>العودة لسجل الدرجات</span>
                  </button>
                )}
              </div>
            </div>

            {/* Save PDF Explorer Tip Banner */}
            <div className="bg-emerald-50/90 border border-emerald-300/80 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-extrabold text-emerald-900">طريقة التنزيل والحفظ على الحاسوب: </span>
                <span className="text-slate-700">
                  عند الضغط على <strong>تنزيل ملف PDF</strong>، سيتم توليد وتجميع الشهادة بالنموذج المحدد فوراً وتفتح نافذة مستكشف الملفات (Save As) لاختيار المجلد وتحديد مكان الحفظ على حاسوبك. وعند الضغط على <strong>طباعة ورقية</strong> تفتح معاينة الطباعة للطباعة المباشرة على الورق.
                </span>
              </div>
            </div>
          </div>

          {/* Actual Printable Page(s) */}
          <div id="a4-certificates-export-container">
            {printScope === 'selected' ? (
              selectedCert && (
                <OfficialCertificateA4Template
                  cert={selectedCert}
                  modelType={
                    currentExportModel ||
                    activePrintModel ||
                    (modelFilter !== 'all' ? (modelFilter as CertificateModelType) : undefined) ||
                    selectedCert.certificateModel ||
                    'model3_final_round1'
                  }
                  schoolAdminData={schoolAdminData}
                  role={role}
                  teacherSubject={teacherSubject}
                  certLogoFileInputRef={certLogoFileInputRef}
                  onLogoUpload={handleLogoUpload}
                  isBatchPrint={false}
                />
              )
            ) : (
              <div className="space-y-10 print:space-y-0">
                {(printScope === 'class' ? filteredCertificates : userRoleCertificates).map((certItem) => (
                  <OfficialCertificateA4Template
                    key={certItem.id}
                    cert={certItem}
                    modelType={
                      currentExportModel ||
                      activePrintModel ||
                      (modelFilter !== 'all' ? (modelFilter as CertificateModelType) : undefined) ||
                      certItem.certificateModel ||
                      'model3_final_round1'
                    }
                    schoolAdminData={schoolAdminData}
                    role={role}
                    teacherSubject={teacherSubject}
                    certLogoFileInputRef={certLogoFileInputRef}
                    onLogoUpload={handleLogoUpload}
                    isBatchPrint={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PDF EXPORT LOADING OVERLAY */}
      {isExportingPdf && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-white text-center space-y-4 print:hidden">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center animate-pulse shadow-lg shadow-emerald-950/50">
            <RefreshCw className="w-8 h-8 text-amber-300 animate-spin" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl font-extrabold text-white">جاري إنشاء ملف الـ PDF عالي الدقة (A4)...</h3>
            <div className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-emerald-300 font-mono text-xs font-bold">
              {exportProgressText || 'جاري معالجة الصفحات...'}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              يتم الآن تنسيق شهادات الطالبات على قياس A4 المعتمد وتجميع كشف الدرجات. ستظهر نافذة مستكشف الملفات للحفظ تلقائياً على حاسوبك فور الاكتمال.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: ADD CERTIFICATE FOR NEW STUDENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>إصدار شهادة مدرسية جديدة</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                اختر الطالبة المضافة للنظام:
              </label>
              <select
                value={selectedStudentForCert}
                onChange={(e) => setSelectedStudentForCert(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- اختر طالبة من القائمة (مرتبة أبجدياً) --</option>
                {[...students]
                  .sort((a, b) => a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' }))
                  .map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.gradeLevel} - {st.section})
                    </option>
                  ))}
              </select>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCreateBlankForSingle}
                    onChange={(e) => setIsCreateBlankForSingle(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>إنشاء نموذج شهادة فارغ (بدون أي درجات) للإدخال اليدوي 📝</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateCertificate}
                disabled={!selectedStudentForCert}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                إنشاء وتجهيز الشهادة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BULK & SCOPE CERTIFICATES ISSUANCE */}
      <BulkIssueCertificatesModal
        isOpen={isBulkIssueModalOpen}
        onClose={() => setIsBulkIssueModalOpen(false)}
        onSuccess={(msg) => {
          // Success callback
        }}
      />

      {/* MODAL: FULL STUDENT MANUAL GRADES SPREADSHEET EDITOR */}
      <StudentManualGradesEditorModal
        isOpen={isManualGradesEditorOpen}
        onClose={() => {
          setIsManualGradesEditorOpen(false);
          setManualEditTargetCert(null);
        }}
        certificate={manualEditTargetCert}
        onSaved={(updated) => {
          setSelectedCertId(updated.id);
        }}
        onDeleteCertificate={(cert) => {
          setIsManualGradesEditorOpen(false);
          handleRequestDeleteSingle(cert);
        }}
      />

      {/* MODAL: EDIT CERTIFICATE HEADER & BRANDING */}
      <EditCertificateHeaderModal
        isOpen={isEditHeaderModalOpen}
        onClose={() => setIsEditHeaderModalOpen(false)}
      />

      {/* MODAL: MINISTRY DECISION MARKS SETTINGS */}
      <MinistryDecisionSettingsModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
      />

      {/* MODAL: LIVE CERTIFICATE PREVIEW MODAL */}
      <CertificatePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        certificate={selectedCert}
        certificatesList={userRoleCertificates}
        onSelectCertificate={(cert) => setSelectedCertId(cert.id)}
        onDownloadPdf={(scope, model) => handleExportPdf(scope, model)}
        onSharePdf={(model) => {
          setSelectedShareModel(model);
          setIsPreviewModalOpen(false);
          setIsShareModalOpen(true);
        }}
        onPrint={(targetCert, model) => handlePrint(targetCert || selectedCert || undefined, model)}
        onDeleteCertificate={(cert) => {
          setIsPreviewModalOpen(false);
          handleRequestDeleteSingle(cert);
        }}
        schoolAdminData={schoolAdminData}
        role={role}
        teacherSubject={teacherSubject}
        isExportingPdf={isExportingPdf}
        exportProgressText={exportProgressText}
      />

      {/* MODAL: DELETE CERTIFICATES CONFIRMATION */}
      <DeleteCertificateConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        target={deleteTarget}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* OFF-SCREEN HIGH-PRECISION PDF EXPORT WRAPPER (NEVER HIDDEN WITH DISPLAY:NONE) */}
      <div
        id="a4-pdf-export-offscreen-wrapper"
        className="print:hidden"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '0px',
          width: '800px',
          backgroundColor: '#ffffff',
          zIndex: -9999,
          visibility: 'visible',
          display: 'block',
          opacity: 1,
          pointerEvents: 'none',
        }}
      >
        {(printScope === 'selected'
          ? [selectedCert || userRoleCertificates[0]].filter(Boolean)
          : printScope === 'class'
          ? (filteredCertificates.length > 0 ? filteredCertificates : userRoleCertificates)
          : userRoleCertificates
        ).map((certItem) => (
          <div key={`pdf-export-item-${certItem.id}`} className="a4-cert-export-page bg-white p-0">
            <OfficialCertificateA4Template
              cert={certItem}
              modelType={
                currentExportModel ||
                activePrintModel ||
                (modelFilter !== 'all' ? (modelFilter as CertificateModelType) : undefined) ||
                certItem.certificateModel ||
                'model3_final_round1'
              }
              schoolAdminData={schoolAdminData}
              role={role}
              teacherSubject={teacherSubject}
              isBatchPrint={true}
            />
          </div>
        ))}
      </div>

      {/* MODAL: BULK DOWNLOAD CERTIFICATE MODEL SELECTOR */}
      <BulkDownloadModelSelectorModal
        isOpen={isBulkDownloadModalOpen}
        onClose={() => setIsBulkDownloadModalOpen(false)}
        onConfirmDownload={handleConfirmBulkDownload}
        totalSchoolStudentsCount={userRoleCertificates.length}
        classStudentsCount={filteredCertificates.length}
        currentGradeFilter={gradeFilter === 'all' ? 'جميع المراحل' : gradeFilter}
        initialScope={bulkDownloadScope}
        initialModel={
          (modelFilter !== 'all' ? (modelFilter as CertificateModelType) : currentExportModel || selectedCert?.certificateModel) ||
          'model4_final_round1'
        }
        isExporting={isExportingPdf}
        progressText={exportProgressText}
      />

      {/* MODAL: SHARE & PUBLISH CERTIFICATE PDF MODAL */}
      <SharePdfModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        certificate={selectedCert || userRoleCertificates[0] || null}
        initialModel={
          selectedShareModel ||
          (modelFilter !== 'all' ? (modelFilter as CertificateModelType) : currentExportModel || (selectedCert as any)?.certificateModel) ||
          'model3_final_round1'
        }
        onGeneratePdfBlob={(model) => generateCertificatePdfBlob('selected', model)}
      />
    </div>
  );
};
