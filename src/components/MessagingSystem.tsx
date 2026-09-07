import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DirectMessage, MessageFolder, MessageAttachment, UserRole } from '../types';
import { downloadElementAsPdf, downloadTextOrAttachmentAsPdf } from '../utils/pdfExporter';
import {
  isMessageDeletedForUser,
  isMessageTrashForUser,
  isMessageSpamForUser,
  isMessageStarredForUser,
  isMessageReadForUser,
} from '../utils/messageUtils';
import {
  Inbox,
  Send,
  FileText,
  AlertOctagon,
  Star,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  Mail,
  CheckCircle2,
  Sparkles,
  User,
  Users,
  Reply,
  X,
  Lock,
  MessageSquare,
  Clock,
  ShieldAlert,
  Printer,
  Paperclip,
  Download,
  Award,
  FileSpreadsheet,
  AlertTriangle,
  Filter,
  CheckCheck,
  Share2,
  Tag,
  Building,
  Check,
  Upload,
  Pencil,
  Image as ImageIcon,
} from 'lucide-react';

interface MessagingSystemProps {
  embeddedMode?: boolean; // If true, renders as full section without fixed modal overlay wrapper
  onCloseModal?: () => void;
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({
  embeddedMode = false,
  onCloseModal,
}) => {
  const {
    messages,
    sendMessage,
    updateMessage,
    saveDraft,
    moveToSpam,
    restoreFromSpam,
    moveToTrash,
    restoreFromTrash,
    deleteMessage,
    markMessageRead,
    toggleStarMessage,
    emptySpamFolder,
    emptyTrashFolder,
    teachers,
    students,
    parents,
    role,
    currentUser,
    lang,
    schoolAdminData,
    updateSchoolAdminData,
  } = useApp();

  // Active view folder
  const [activeFolder, setActiveFolder] = useState<MessageFolder | 'starred' | 'official'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<'all' | 'عاجل وسري' | 'مهم' | 'عادي'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'direct' | 'official_letter' | 'parent_summons' | 'appreciation' | 'exception_request'>('all');
  
  // Selected Message state
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Print Official Letter Modal State
  const [printingMessage, setPrintingMessage] = useState<DirectMessage | null>(null);

  // Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  // Composer Form states
  const [msgCategory, setMsgCategory] = useState<'direct' | 'official_letter' | 'parent_summons' | 'appreciation' | 'exception_request'>('direct');
  const [msgPriority, setMsgPriority] = useState<'عادي' | 'مهم' | 'عاجل' | 'عاجل وسري'>('عادي');
  const [receiverId, setReceiverId] = useState('');
  const [selectedReceiverIds, setSelectedReceiverIds] = useState<string[]>([]);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');
  const [recipientRoleFilter, setRecipientRoleFilter] = useState<'all' | 'teacher' | 'student' | 'parent' | 'admin'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [broadcastTarget, setBroadcastTarget] = useState<'none' | 'all_teachers' | 'all_students' | 'all_parents'>('none');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [letterDate, setLetterDate] = useState(() => new Date().toISOString().split('T')[0].replace(/-/g, '/'));
  const [logoUrl, setLogoUrl] = useState<string>('default');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
  const [copiesTo, setCopiesTo] = useState<string[]>([]);
  const [newCopyInput, setNewCopyInput] = useState('');
  const [hasOfficialSeal, setHasOfficialSeal] = useState(true);
  const [composerAttachments, setComposerAttachments] = useState<MessageAttachment[]>([]);

  // Logo File Upload Ref & Handler
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomLogoUrl(dataUrl);
        setLogoUrl(dataUrl);
        // Persist permanently as default school logo so it never reverts
        updateSchoolAdminData({ schoolLogoUrl: dataUrl });
        if (printingMessage) {
          setPrintingMessage((prev) => (prev ? { ...prev, logoUrl: dataUrl } : null));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [composerSuccessMsg, setComposerSuccessMsg] = useState('');

  // Quick Reply state
  const [replyContent, setReplyContent] = useState('');
  const [replySuccess, setReplySuccess] = useState(false);

  // Helper parent, student, and teacher resolution for active user context
  const activeTeacherObj =
    currentUser?.teacherObj ||
    teachers.find(
      (t) =>
        (currentUser?.id && t.id === currentUser.id) ||
        (currentUser?.email && t.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.name && t.name.toLowerCase() === currentUser.name.toLowerCase())
    );

  const activeStudentObj =
    currentUser?.studentObj ||
    students.find(
      (s) =>
        (currentUser?.id && s.id === currentUser.id) ||
        (currentUser?.email && s.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.phone && (s.phone === currentUser.phone || s.parentPhone === currentUser.phone)) ||
        (currentUser?.name && (s.name.toLowerCase() === currentUser.name.toLowerCase() || currentUser.name.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(currentUser.name.toLowerCase())))
    );

  const activeParentObj =
    parents.find(
      (p) =>
        (currentUser?.id && p.id === currentUser.id) ||
        (currentUser?.email && p.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.phone && p.phone === currentUser.phone)
    ) || currentUser?.parentObj;

  const daughter =
    students.find(
      (s) =>
        (activeParentObj && s.parentEmail?.toLowerCase() === activeParentObj.email?.toLowerCase()) ||
        (activeParentObj && s.parentPhone === activeParentObj.phone) ||
        (activeParentObj && s.parentName === activeParentObj.name) ||
        (currentUser?.studentObj && s.id === currentUser.studentObj.id)
    ) || students[0];

  // Precise current user ID and Name for active session/account
  const currentUserId =
    currentUser?.id ||
    (role === 'admin'
      ? 'admin-main'
      : role === 'teacher'
      ? activeTeacherObj?.id || 'teacher-default'
      : role === 'student'
      ? activeStudentObj?.id || students[0]?.id || 'std-default'
      : role === 'parent'
      ? activeParentObj?.id || parents[0]?.id || 'prt-default'
      : 'sup-1');

  const currentUserName =
    currentUser?.name ||
    (role === 'admin'
      ? 'إدارة ثانوية ميسان للمتميزات'
      : role === 'teacher'
      ? activeTeacherObj?.name || 'أستاذ المادة / الهيئة التدريسية'
      : role === 'student'
      ? activeStudentObj?.name || students[0]?.name || 'طالبة متميزة'
      : role === 'parent'
      ? activeParentObj?.name || parents[0]?.name || 'ولي أمر الطالبة'
      : 'المشرف التربوي');

  // Rich Recipient directory with complete metadata
  const possibleRecipients = [
    {
      id: 'admin-main',
      name: `إدارة المدرسة والمديرة (${schoolAdminData?.principalName || 'الهام صبيح سعدون'})`,
      rawName: schoolAdminData?.principalName || 'الهام صبيح سعدون',
      roleStr: 'الإدارة المدرسية',
      roleBadge: 'admin' as UserRole,
      subject: 'الإدارة المدرسية العامة',
      gradeLevel: 'جميع المراحل',
    },
    ...teachers.map((t) => ({
      id: t.id,
      name: `${t.name} (أستاذة ${t.subject})`,
      rawName: t.name,
      roleStr: 'مدرسة',
      roleBadge: 'teacher' as UserRole,
      subject: t.subject,
      gradeLevel: t.assignedGrades?.join(', ') || 'جميع المراحل',
      phone: t.phone,
    })),
    ...students.map((s) => ({
      id: s.id,
      name: `${s.name} (${s.gradeLevel})`,
      rawName: s.name,
      roleStr: 'طالبة متميزة',
      roleBadge: 'student' as UserRole,
      subject: 'طالبة',
      gradeLevel: s.gradeLevel,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      parentEmail: s.parentEmail,
    })),
    ...parents.map((p) => ({
      id: p.id,
      name: `${p.name} (ولي أمر ${p.studentName})`,
      rawName: p.name,
      roleStr: 'ولي أمر',
      roleBadge: 'parent' as UserRole,
      subject: 'ولي أمر',
      gradeLevel: p.gradeLevel,
      studentId: p.studentId,
      studentName: p.studentName,
    })),
  ];

  // Dynamic Filtering for Recipient Picker
  const filteredRecipients = possibleRecipients.filter((r) => {
    // Role filter
    if (recipientRoleFilter !== 'all' && r.roleBadge !== recipientRoleFilter) return false;

    // Subject filter
    if (selectedSubjectFilter !== 'all') {
      if (!r.subject || !r.subject.toLowerCase().includes(selectedSubjectFilter.toLowerCase())) return false;
    }

    // Grade filter
    if (selectedGradeFilter !== 'all') {
      if (!r.gradeLevel || !r.gradeLevel.includes(selectedGradeFilter)) return false;
    }

    // Search query
    if (recipientSearchQuery.trim()) {
      const q = recipientSearchQuery.toLowerCase().trim();
      const matchName = r.name.toLowerCase().includes(q) || r.rawName.toLowerCase().includes(q);
      const matchSubj = r.subject ? r.subject.toLowerCase().includes(q) : false;
      const matchGrade = r.gradeLevel ? r.gradeLevel.toLowerCase().includes(q) : false;
      const matchParent = (r as any).parentName ? (r as any).parentName.toLowerCase().includes(q) : false;
      const matchStudent = (r as any).studentName ? (r as any).studentName.toLowerCase().includes(q) : false;
      if (!matchName && !matchSubj && !matchGrade && !matchParent && !matchStudent) return false;
    }

    return true;
  });

  // Toggle single recipient
  const toggleReceiverId = (id: string) => {
    setSelectedReceiverIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle Student AND Parent together
  const toggleStudentAndParent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const matchingParent = parents.find(
      (p) =>
        p.studentId === student.id ||
        p.studentName === student.name ||
        p.phone === student.parentPhone ||
        (p.email && student.parentEmail && p.email.toLowerCase() === student.parentEmail.toLowerCase())
    );

    const idsToToggle = [student.id];
    if (matchingParent) idsToToggle.push(matchingParent.id);

    setSelectedReceiverIds((prev) => {
      const allIn = idsToToggle.every((id) => prev.includes(id));
      if (allIn) {
        return prev.filter((id) => !idsToToggle.includes(id));
      } else {
        return Array.from(new Set([...prev, ...idsToToggle]));
      }
    });
  };

  // Toggle Parent AND Student together
  const toggleParentAndStudent = (parentId: string) => {
    const parent = parents.find((p) => p.id === parentId);
    if (!parent) return;

    const matchingStudent = students.find(
      (s) =>
        s.id === parent.studentId ||
        s.name === parent.studentName ||
        s.parentPhone === parent.phone
    );

    const idsToToggle = [parent.id];
    if (matchingStudent) idsToToggle.push(matchingStudent.id);

    setSelectedReceiverIds((prev) => {
      const allIn = idsToToggle.every((id) => prev.includes(id));
      if (allIn) {
        return prev.filter((id) => !idsToToggle.includes(id));
      } else {
        return Array.from(new Set([...prev, ...idsToToggle]));
      }
    });
  };

  // Select Subject Teachers Group (e.g., "مدرسي مادة اللغة العربية")
  const handleSelectSubjectGroup = (subjKeyword: string) => {
    const matchedTeachers = teachers.filter((t) =>
      t.subject.toLowerCase().includes(subjKeyword.toLowerCase()) || subjKeyword.toLowerCase().includes(t.subject.toLowerCase())
    );
    const teacherIds = matchedTeachers.map((t) => t.id);
    if (teacherIds.length === 0) return;

    setSelectedReceiverIds((prev) => {
      const allIn = teacherIds.every((id) => prev.includes(id));
      if (allIn) {
        return prev.filter((id) => !teacherIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...teacherIds]));
      }
    });
  };

  // Select Grade Level Students + Parents
  const handleSelectGradeGroup = (gradeName: string) => {
    const matchedStudents = students.filter((s) => s.gradeLevel === gradeName);
    const studentIds = matchedStudents.map((s) => s.id);
    const matchedParents = parents.filter(
      (p) =>
        p.gradeLevel === gradeName ||
        matchedStudents.some((s) => s.id === p.studentId || s.name === p.studentName)
    );
    const parentIds = matchedParents.map((p) => p.id);
    const allGradeIds = [...studentIds, ...parentIds];

    setSelectedReceiverIds((prev) => {
      const allIn = allGradeIds.every((id) => prev.includes(id));
      if (allIn) {
        return prev.filter((id) => !allGradeIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...allGradeIds]));
      }
    });
  };

  // Select all filtered items / Clear selection
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredRecipients.map((r) => r.id);
    setSelectedReceiverIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleClearAllSelected = () => {
    setSelectedReceiverIds([]);
  };

  // Strict Privacy & Ownership Checker: Sent by me
  const checkSentByMe = (m: DirectMessage) => {
    if (!m) return false;
    if (m.senderId === currentUserId) return true;
    if (currentUserName && m.senderName === currentUserName) return true;
    return false;
  };

  // Strict Privacy & Ownership Checker: Received by me
  const checkReceivedByMe = (m: DirectMessage) => {
    if (!m) return false;

    // 1. Broadcast messages for user role
    if (m.receiverId === 'broadcast-all-teachers' && role === 'teacher') return true;
    if (m.receiverId === 'broadcast-all-students' && role === 'student') return true;
    if (m.receiverId === 'broadcast-all-parents' && role === 'parent') return true;

    // 2. Receiver IDs array check
    if (m.receiverIds && Array.isArray(m.receiverIds) && m.receiverIds.includes(currentUserId)) return true;

    // 3. Recipients object list check
    if (m.recipients && Array.isArray(m.recipients) && m.recipients.some((r) => r.id === currentUserId)) return true;

    // 4. Comma-separated receiverId check
    if (m.receiverId && typeof m.receiverId === 'string' && m.receiverId.includes(',')) {
      if (m.receiverId.split(',').includes(currentUserId)) return true;
    }

    // 5. Direct Receiver ID match
    if (m.receiverId && m.receiverId === currentUserId) return true;

    // 6. Direct Receiver Name match or recipient contains name
    if (currentUserName && m.receiverName && m.receiverName.toLowerCase().includes(currentUserName.toLowerCase())) return true;

    // 7. Role-specific active entity matches
    if (role === 'teacher' && activeTeacherObj) {
      if (m.receiverIds?.includes(activeTeacherObj.id)) return true;
      if (m.recipients?.some((r) => r.id === activeTeacherObj.id)) return true;
      if (m.receiverId === activeTeacherObj.id || (m.receiverName && m.receiverName.includes(activeTeacherObj.name))) return true;
    }

    if (role === 'student' && activeStudentObj) {
      if (m.receiverIds?.includes(activeStudentObj.id)) return true;
      if (m.recipients?.some((r) => r.id === activeStudentObj.id)) return true;
      if (m.receiverId === activeStudentObj.id || (m.receiverName && m.receiverName.includes(activeStudentObj.name))) return true;
    }

    if (role === 'parent' && activeParentObj) {
      if (m.receiverIds?.includes(activeParentObj.id)) return true;
      if (m.recipients?.some((r) => r.id === activeParentObj.id)) return true;
      if (m.receiverId === activeParentObj.id || (m.receiverName && m.receiverName.includes(activeParentObj.name))) return true;
      if (activeParentObj.phone && m.receiverId?.includes(`parent-${activeParentObj.phone}`)) return true;
      if (daughter && (m.receiverId?.includes(daughter.id) || m.receiverId?.includes(`parent-${daughter.id}`))) return true;
    }

    if (role === 'admin') {
      if (m.receiverId === 'admin-main' || m.receiverId === 'admin-1' || m.receiverIds?.includes('admin-main')) return true;
    }

    if (role === 'supervisor') {
      if (m.receiverId === 'sup-1' || m.receiverIds?.includes('sup-1')) return true;
    }

    return false;
  };

  const isInboxMessage = (m: DirectMessage) => {
    if (isMessageDeletedForUser(m, currentUserId)) return false;
    if (isMessageTrashForUser(m, currentUserId)) return false;
    if (isMessageSpamForUser(m, currentUserId)) return false;
    if (m.isDraft || m.folder === 'drafts') return false;
    return checkReceivedByMe(m);
  };

  const isSentMessage = (m: DirectMessage) => {
    if (isMessageDeletedForUser(m, currentUserId)) return false;
    if (isMessageTrashForUser(m, currentUserId)) return false;
    if (isMessageSpamForUser(m, currentUserId)) return false;
    if (m.isDraft || m.folder === 'drafts') return false;
    return checkSentByMe(m);
  };

  const isOfficialMessage = (m: DirectMessage) => {
    if (isMessageDeletedForUser(m, currentUserId)) return false;
    if (isMessageTrashForUser(m, currentUserId)) return false;
    if (isMessageSpamForUser(m, currentUserId)) return false;
    if (m.isDraft || m.folder === 'drafts') return false;
    const isOfficialType =
      m.category === 'official_letter' ||
      m.category === 'parent_summons' ||
      m.category === 'appreciation' ||
      m.category === 'exception_request' ||
      m.hasOfficialSeal === true;
    if (!isOfficialType) return false;

    // Must be sent by or received by current user
    return checkSentByMe(m) || checkReceivedByMe(m);
  };

  const isDraftMessage = (m: DirectMessage) => {
    if (isMessageDeletedForUser(m, currentUserId)) return false;
    if (isMessageTrashForUser(m, currentUserId)) return false;
    return (m.folder === 'drafts' || m.isDraft === true) && checkSentByMe(m);
  };

  const isSpamMessage = (m: DirectMessage) => {
    if (isMessageDeletedForUser(m, currentUserId)) return false;
    if (isMessageTrashForUser(m, currentUserId)) return false;
    if (!isMessageSpamForUser(m, currentUserId)) return false;
    return checkReceivedByMe(m) || checkSentByMe(m);
  };

  const isStarredMessage = (m: DirectMessage) => {
    if (isMessageDeletedForUser(m, currentUserId)) return false;
    if (isMessageTrashForUser(m, currentUserId)) return false;
    if (isMessageSpamForUser(m, currentUserId)) return false;
    if (!isMessageStarredForUser(m, currentUserId)) return false;
    return checkReceivedByMe(m) || checkSentByMe(m);
  };

  const isTrashMessage = (m: DirectMessage) => {
    if (isMessageDeletedForUser(m, currentUserId)) return false;
    if (!isMessageTrashForUser(m, currentUserId)) return false;
    return checkReceivedByMe(m) || checkSentByMe(m);
  };

  // Filter messages according to selected folder
  const folderMessages = messages.filter((m) => {
    if (activeFolder === 'inbox') return isInboxMessage(m);
    if (activeFolder === 'sent') return isSentMessage(m);
    if (activeFolder === 'official') return isOfficialMessage(m);
    if (activeFolder === 'drafts') return isDraftMessage(m);
    if (activeFolder === 'spam') return isSpamMessage(m);
    if (activeFolder === 'starred') return isStarredMessage(m);
    if (activeFolder === 'trash') return isTrashMessage(m);
    return true;
  });

  // Filter by priority, category, and search query
  const filteredMessages = folderMessages.filter((m) => {
    // Priority filter
    if (selectedPriorityFilter !== 'all' && m.priority !== selectedPriorityFilter) return false;

    // Category filter
    if (selectedCategoryFilter !== 'all' && m.category !== selectedCategoryFilter) return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      m.subject.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q) ||
      m.receiverName.toLowerCase().includes(q) ||
      (m.serialNumber && m.serialNumber.toLowerCase().includes(q))
    );
  });

  // Folder Counts
  const inboxCount = messages.filter(isInboxMessage).length;
  const unreadInboxCount = messages.filter((m) => isInboxMessage(m) && !isMessageReadForUser(m, currentUserId)).length;
  const sentCount = messages.filter(isSentMessage).length;
  const officialCount = messages.filter(isOfficialMessage).length;
  const draftsCount = messages.filter(isDraftMessage).length;
  const spamCount = messages.filter(isSpamMessage).length;
  const starredCount = messages.filter(isStarredMessage).length;
  const trashCount = messages.filter(isTrashMessage).length;

  const selectedMessage = messages.find((m) => m.id === selectedMessageId);

  // Thread responses
  const threadReplies = messages.filter(
    (m) => selectedMessage && (m.replyToId === selectedMessage.id || (m.subject.includes(selectedMessage.subject) && m.id !== selectedMessage.id))
  );

  // Helper to render Official Logo Graphic based on logoUrl/customLogoUrl
  const renderOfficialLogoGraphic = (logoKey?: string, customUrl?: string, sizeClass: string = "w-16 h-16") => {
    const activeSchoolLogo = schoolAdminData?.schoolLogoUrl;
    let url = customUrl || (logoKey && (logoKey.startsWith('http') || logoKey.startsWith('data:image')) ? logoKey : undefined);
    
    // Fallback to active uploaded school logo if logoKey is 'default' or url is empty
    if (!url || logoKey === 'default') {
      url = activeSchoolLogo || 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80';
    }

    if (url) {
      return (
        <img
          src={url}
          alt="الشعار الرسمي للمدرسة"
          referrerPolicy="no-referrer"
          className={`${sizeClass} mx-auto object-contain rounded-xl shadow-md border border-amber-300 bg-white p-1`}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    return (
      <div className={`${sizeClass} mx-auto bg-amber-100/80 text-amber-900 rounded-2xl flex flex-col items-center justify-center font-bold text-xs shadow-sm border-2 border-dashed border-amber-400 p-1 text-center`}>
        <span className="text-xl">📷</span>
        <span className="text-[9px] font-bold">رفع الشعار</span>
      </div>
    );
  };

  // Standard Copies To preset list
  const PRESET_COPIES_TO = [
    'قسم الإشراف التربوي / المديرية العامة لتربية ميسان',
    'المعاونية الإدارية والتربوية',
    'شعبة الامتحانات والتقويم المدرسية',
    'ملف الطالبة / السجل الدائم',
    'أرشيف الصادر والوارد / الحفظ والترقيم',
    'وحدة الرعاية الموهوبة والنشاط المدرسي',
  ];

  // Dynamic signature & title resolver for official letter signatures (bottom-left)
  const getSenderSignatureDetails = (msg: DirectMessage | null) => {
    if (!msg) {
      if (role === 'admin') {
        return {
          name: schoolAdminData?.principalName || 'أ.د. الهام صبيح سعدون',
          title: schoolAdminData?.principalBadge || 'مديرة ثانوية ميسان للمتميزات',
          sealText: 'الختم الرسمي للمدرسة',
        };
      }
      if (role === 'teacher') {
        const subject = activeTeacherObj?.subject || currentUser?.subject || '';
        return {
          name: currentUserName || activeTeacherObj?.name || 'أستاذة المادة',
          title: subject ? `أستاذة مادة ${subject} - الهيئة التدريسية` : 'عضو الهيئة التدريسية - ثانوية ميسان للمتميزات',
          sealText: 'توقيع وختم الهيئة التدريسية',
        };
      }
      if (role === 'student') {
        const grade = activeStudentObj?.gradeLevel || currentUser?.gradeLevel || '';
        return {
          name: currentUserName || activeStudentObj?.name || 'طالبة متميزة',
          title: grade ? `طالبة متميزة - ${grade}` : 'طالبة متميزة - ثانوية ميسان للمتميزات',
          sealText: 'توقيع الطالبة المتميزة',
        };
      }
      if (role === 'parent') {
        const sName = activeParentObj?.studentName || '';
        return {
          name: currentUserName || activeParentObj?.name || 'ولي أمر طالبة',
          title: sName ? `ولي أمر الطالبة المتميزة (${sName})` : 'ولي أمر - مجلس أولياء الأمور',
          sealText: 'توقيع ولي الأمر',
        };
      }
      return {
        name: currentUserName || 'المشرف التربوي',
        title: 'المشرف التربوي - قسم الإشراف التربوي / تربية ميسان',
        sealText: 'ختم وتوقيع الإشراف التربوي',
      };
    }

    const senderRole =
      msg.senderRole ||
      (msg.senderId === 'admin-main' || msg.senderId === 'admin'
        ? 'admin'
        : msg.senderId.startsWith('tech-')
        ? 'teacher'
        : msg.senderId.startsWith('std-')
        ? 'student'
        : msg.senderId.startsWith('prt-')
        ? 'parent'
        : msg.senderId.startsWith('sup-')
        ? 'supervisor'
        : 'admin');

    // 1. Admin / Principal
    if (senderRole === 'admin' || msg.senderId === 'admin-main') {
      const pName = schoolAdminData?.principalName || 'أ.د. الهام صبيح سعدون';
      const pBadge = schoolAdminData?.principalBadge || 'مديرة ثانوية ميسان للمتميزات';
      const name = msg.senderName && !msg.senderName.includes('إدارة') ? msg.senderName : pName;
      return {
        name,
        title: pBadge,
        sealText: 'الختم الرسمي للمدرسة',
      };
    }

    // 2. Teacher
    if (senderRole === 'teacher' || msg.senderId.startsWith('tech-')) {
      const teacher = teachers.find((t) => t.id === msg.senderId || t.name === msg.senderName);
      const name = msg.senderName || teacher?.name || 'أستاذة المادة';
      const subject = teacher?.subject || (currentUser?.role === 'teacher' ? currentUser.subject : '') || '';
      const title = subject
        ? `أستاذة مادة ${subject} - الهيئة التدريسية`
        : 'عضو الهيئة التدريسية - ثانوية ميسان للمتميزات';
      return {
        name,
        title,
        sealText: 'توقيع وختم الهيئة التدريسية',
      };
    }

    // 3. Student
    if (senderRole === 'student' || msg.senderId.startsWith('std-')) {
      const student = students.find((s) => s.id === msg.senderId || s.name === msg.senderName);
      const name = msg.senderName || student?.name || 'طالبة متميزة';
      const grade = student?.gradeLevel || (currentUser?.role === 'student' ? currentUser.gradeLevel : '') || '';
      const title = grade ? `طالبة متميزة - ${grade}` : 'طالبة متميزة - ثانوية ميسان للمتميزات';
      return {
        name,
        title,
        sealText: 'توقيع الطالبة المتميزة',
      };
    }

    // 4. Parent
    if (senderRole === 'parent' || msg.senderId.startsWith('prt-')) {
      const parent = parents.find((p) => p.id === msg.senderId || p.name === msg.senderName);
      const name = msg.senderName || parent?.name || 'ولي أمر طالبة';
      const studentName = parent?.studentName || '';
      const title = studentName ? `ولي أمر الطالبة المتميزة (${studentName})` : 'ولي أمر - مجلس أولياء الأمور';
      return {
        name,
        title,
        sealText: 'توقيع ولي الأمر',
      };
    }

    // 5. Supervisor
    if (senderRole === 'supervisor' || msg.senderId.startsWith('sup-')) {
      return {
        name: msg.senderName || 'المشرف التربوي',
        title: 'المشرف التربوي - قسم الإشراف التربوي / تربية ميسان',
        sealText: 'ختم وتوقيع الإشراف التربوي',
      };
    }

    // Default fallback
    return {
      name: msg.senderName || 'مرسل الكتاب',
      title: 'ثانوية ميسان للمتميزات',
      sealText: 'التوقيع المعتمد',
    };
  };

  // Generate Serial Number
  const generateNewSerial = () => {
    const num = Math.floor(100 + Math.random() * 900);
    return `م.ت / 2026 / ${num}`;
  };

  // Role-Specific Administrative Templates Interface
  interface AdminTemplateItem {
    id: string;
    title: string;
    category: 'direct' | 'official_letter' | 'parent_summons' | 'appreciation' | 'exception_request';
    priority?: 'عادي' | 'مهم' | 'عاجل وسري';
    subject: string;
    content: string;
    copiesTo?: string[];
    suggestedRoleFilter?: 'all' | 'teacher' | 'student' | 'parent' | 'admin';
    icon?: string;
  }

  // Active role tab inside the template chooser in Composer
  const [activeTemplateRole, setActiveTemplateRole] = useState<UserRole>(role || 'admin');
  const [appliedTemplateNotice, setAppliedTemplateNotice] = useState<string>('');

  // Comprehensive Role-Specific Administrative Templates Directory
  const ROLE_ADMIN_TEMPLATES: Record<UserRole, AdminTemplateItem[]> = {
    admin: [
      {
        id: 'adm-1',
        title: '🏆 كتاب شكر وتقدير رسمي للتميز الأكاديمي',
        category: 'appreciation',
        priority: 'مهم',
        icon: '🏆',
        subject: 'كتاب شكر وتقدير رسمي للتميز العلمي والتنظيمي',
        content: `إلى الأستاذة الفاضلة / عضو الهيئة التدريسية المحترمة،\n\nنظراً لجهودكم الاستثنائية المتميزة في إنجاح العملية التربوية والتعليمية، والتزامكم العالي برعاية طالباتنا المتميزات، يطيب لإدارة ثانوية ميسان للمتميزات أن تتقدم لكم بأسمى آيات الشكر والتقدير.\n\nنتمنى لكم دوام العطاء والتألق في خدمة المسيرة التعليمية.\n\nوتفضلوا بقبول فائق الاحترام والتقدير.`,
        copiesTo: ['قسم الإشراف التربوي / المديرية العامة لتربية ميسان', 'شعبة الإدارة والذاتية', 'أرشيف الصادر والوارد / الحفظ والترقيم'],
        suggestedRoleFilter: 'teacher',
      },
      {
        id: 'adm-2',
        title: '📋 استدعاء رسمي لولي أمر طالبة',
        category: 'parent_summons',
        priority: 'مهم',
        icon: '📋',
        subject: 'تبليغ استدعاء ولي أمر لمراجعة الإدارة المدرسية',
        content: `إلى الفاضل/ة ولي أمر الطالبة المحترم/ة،\n\nتحية طيبة وبعد،\nيرجى المبادرة بالحضور إلى مقر إدارة ثانوية ميسان للمتميزات في تمام الساعة 10:00 صباحاً لمراجعة إدارة المدرسة والمرشدة التربوية بخصوص أمر دراسي وتربوي هام يخص الطالبة.\n\nشاكرين حرصكم وتعاونكم الدائم مع إدارة المدرسة لمصلحة بنتنا المتميزة.\n\nوتفضلوا بقبول فائق الاحترام.`,
        suggestedRoleFilter: 'parent',
      },
      {
        id: 'adm-3',
        title: '📜 أمر إداري: تعميم جدول الامتحانات والضوابط',
        category: 'official_letter',
        priority: 'عاجل وسري',
        icon: '📜',
        subject: 'أمر إداري: تعميم جدول والضوابط الامتحانية المعتمدة',
        content: `إلى أعضاء الهيئة التدريسية والكادر الإداري المحترمين،\n\nبناءً على التوجيهات الوزارية وتوصيات المديرية العامة لتربية ميسان، نود إعلامكم بالاعتماد النهائي لجدول الضوابط والامتحانات. يُرجى الالتزام التام بالتعليمات الآتية:\n1. التواجد في قاعات الامتحانات قبل 30 دقيقة من الموعد المحدد.\n2. إكمال تصحيح الدفاتر وتدقيق السجلات خلال 48 ساعة من نهاية الامتحان.\n3. الالتزام بالسرية التامة في تداول الأسئلة والدفاتر الامتحانية.\n\nللعمل بموجبه ولكم الشكر.`,
        copiesTo: ['قسم الإشراف التربوي / المديرية العامة لتربية ميسان', 'المعاونية الإدارية والتربوية', 'شعبة الامتحانات والتقويم المدرسية'],
        suggestedRoleFilter: 'teacher',
      },
      {
        id: 'adm-4',
        title: '📢 إشعار وتنبيه رسمي بخصوص نسبة غيابات الطالبة',
        category: 'official_letter',
        priority: 'مهم',
        icon: '📢',
        subject: 'إشعار إداري رسمي بخصوص نسبة غيابات الطالبة',
        content: `إلى ولي أمر الطالبة المحترم/ة،\n\nنحيطكم علماً بأن الطالبة قد تجاوزت نسبة الغيابات المسموح بها بدون عذر مشروع للمدة الماضية. يُرجى تقديم العذر الطبي أو الرسمي المعتمد خلال 3 أيام لتفادي اتخاذ الإجراءات الإدارية والتربوية المعتمدة حسّب الأنظمة الوزارية.\n\nتقبلوا تحيات إدارة ثانوية ميسان للمتميزات.`,
        suggestedRoleFilter: 'parent',
      },
      {
        id: 'adm-5',
        title: '🏢 كتاب رفع التقرير السنوي للمديرية العامة والإشراف',
        category: 'official_letter',
        priority: 'عادي',
        icon: '🏢',
        subject: 'كتاب رفع التقرير السنوي ونسب نجاح طالبات المتميزات',
        content: `إلى/ المديرية العامة لتربية ميسان - قسم الإشراف التربوي المحترمين\nالموضوع/ رفع السجلات ونسب النجاح الشاملة\n\nتحية طيبة وبعد،\nنرفق لحضراتكم التقرير الأكاديمي التفصيلي ونسب النجاح الشاملة لطالبات ثانوية ميسان للمتميزات لكافة المراحل الدراسية للعام الدراسي الحالي.\n\nيرجى التفضل بالاطلاع والاعتماد المعتمد، مع فائق الاحترام والتقدير.`,
        copiesTo: ['قسم الإشراف التربوي / المديرية العامة لتربية ميسان', 'أرشيف الصادر والوارد / الحفظ والترقيم'],
        suggestedRoleFilter: 'admin',
      },
    ],
    teacher: [
      {
        id: 'tch-1',
        title: '📝 طلب إجازة زمنية أو استئذان رسمي',
        category: 'exception_request',
        priority: 'عادي',
        icon: '📝',
        subject: 'طلب إجازة زمنية / استئذان رسمي عن الحصص الدراسية',
        content: `إلى الأستاذة الفاضلة مديرة المدرسة المحترمة،\n\nأرجو التفضل بالموافقة على منحي إجازة زمنية لليوم الدراسي لظرف شخصي/طبي طارئ، مع التعهّد بتعويض الحصص والمنهج المتبقي للطالبات في الموعد البديل.\n\nشاكرة كريم لطفكم وتفهمكم المعهود.`,
        suggestedRoleFilter: 'admin',
      },
      {
        id: 'tch-2',
        title: '📊 مذكرة رفع نسب النجاح والتقييم الشهري',
        category: 'official_letter',
        priority: 'مهم',
        icon: '📊',
        subject: 'مذكرة رفع جدول درجات ونسب النجاح للمادة العلمية',
        content: `إلى إدارة ثانوية ميسان للمتميزات المحترمة،\nالموضوع/ رفع نسب النجاح الشاملة للمادة\n\nنرفق لحضراتكم القوائم الرسمية لدرجات التقييم والامتحانات الشهرية لطالباتنا، مع تحليل بياني لنسب النجاح والتفوق وملاحظات الدعم العلمي للطالبات اللاتي يحتاجون إلى تقوية مركزة.\n\nيرجى التفضل بالاطلاع والاعتماد.`,
        suggestedRoleFilter: 'admin',
      },
      {
        id: 'tch-3',
        title: '💡 طلب توفير تجهيزات ومستلزمات المختبر',
        category: 'direct',
        priority: 'عادي',
        icon: '💡',
        subject: 'طلب توفير الوسائل التعليمية ومستلزمات التجارب المختبرية',
        content: `إلى المعاونية الإدارية وإدارة المدرسة المحترمة،\n\nنرجو التفضل بالتوجيه لتوفير الوسائل والمواد المختبرية والقرطاسية الخاصة بتطبيق الدروس العملية للجدول القادم، لضمان استمرار التجارب التفاعلية لطالباتنا المتميزات بنجاح.\n\nولكم منا فائق الشكر والتقدير.`,
        suggestedRoleFilter: 'admin',
      },
      {
        id: 'tch-4',
        title: '📣 تبليغ مهم لأولياء الأمور بموعد الامتحان الشهري',
        category: 'direct',
        priority: 'مهم',
        icon: '📣',
        subject: 'تبليغ مهم بشأن مادة الامتحان الشهري والمراجعة المركزية',
        content: `إلى عزيزاتي طالباتنا المتميزات وأولياء أمورهم المحترمين،\n\nنود إعلامكم بأن موعد الامتحان الشهري القادم للمادة سيكون في اليوم المحدد ضمن مفردات الفصل، ويرجى التركيز على التمارين والأسئلة الإثرائية وملاحظات الدفتر المدرسية.\n\nتمنياتي للجميع بالنجاح والتألق الدائم.`,
        suggestedRoleFilter: 'student',
      },
      {
        id: 'tch-5',
        title: '🎖️ ترشيح طالبة متميزة للحصول على الوسام الأكاديمي',
        category: 'appreciation',
        priority: 'عادي',
        icon: '🎖️',
        subject: 'ترشيح طالبة متفوقة للحصول على وسام التميز العلمي',
        content: `إلى إدارة ثانوية ميسان للمتميزات المحترمة،\n\nأرفع لحضراتكم ترشيح الطالبة المتميزة نظراً لالتزامها الاستثنائي وإجاباتها النموذجية والابتكار في الأنشطة الصفية واللاصفية، لنيل وسام التميز الشهري.\n\nدمتم سنداً ورعاةً للإبداع والتميز.`,
        suggestedRoleFilter: 'admin',
      },
    ],
    student: [
      {
        id: 'std-1',
        title: '🏥 طلب إجازة مرضية رسمية بعذر مشروع',
        category: 'exception_request',
        priority: 'عادي',
        icon: '🏥',
        subject: 'طلب إجازة مرضية رسمية مع التقرير الطبي',
        content: `إلى الأستاذة الفاضلة مديرة المدرسة والأستاذة مدرسة المادة المحترمة،\n\nأرجو التفضل بالموافقة على قبول عذري الطبي المرفق عن عدم التواجد في الدوام المدرسي لليوم، وأتعهد بمتابعة الواجبات والدروس الفائتة مع زميلاتي الأستاذات والطالبات.\n\nشاكرة لكم حسن التعاطف والرعاية التربوية.`,
        suggestedRoleFilter: 'admin',
      },
      {
        id: 'std-2',
        title: '🔄 طلب إعادة امتحان شهر بعذر طارئ',
        category: 'exception_request',
        priority: 'مهم',
        icon: '🔄',
        subject: 'طلب مؤرخ لإعادة الامتحان الشهري المكتوب',
        content: `إلى الأستاذة الفاضلة أستاذة المادة وإدارة المدرسة المحترمة،\n\nأرجو التفضل بالنظر في طلبي لإعادة الامتحان الشهري لمادة العلمية، حيث تغيبت بعذر رسمي طارئ ومقنع، وأرجو من سيادتكم تحديد موعد بديل لأداء الامتحان.\n\nدمتم عوناً وسنداً لنا في مسيرتنا الدراسية.`,
        suggestedRoleFilter: 'teacher',
      },
      {
        id: 'std-3',
        title: '🌸 رسالة شكر وعرفان لأستاذة المادة',
        category: 'appreciation',
        priority: 'عادي',
        icon: '🌸',
        subject: 'رسالة شكر وامتنان وأسمى آيات التقدير لأستاذتنا الفاضلة',
        content: `إلى أستاذتنا العظيمة وفخر ثانوية ميسان للمتميزات،\n\nنعرب لكِ عن عميق امتنانا وتقديرنا الكبير لجهودكِ المبذولة وشرحكِ الممتع والراقي الذي يزرع في نفوسنا الشغف وحب العلم يومياً.\n\nشكراً لكِ من القلب، ودمتِ منارة علم وهداية تنير درب المتميزات.`,
        suggestedRoleFilter: 'teacher',
      },
      {
        id: 'std-4',
        title: '🎨 طلب مشاركة في المعرض العلمي والموهوبات',
        category: 'direct',
        priority: 'عادي',
        icon: '🎨',
        subject: 'طلب تقديم مشروع وبحث علمي للمعرض السنوي',
        content: `إلى إدارة ثانوية ميسان للمتميزات ومسؤولة شعبة الموهوبات،\n\nأود تقديم نتاج مشروعي العلمي / البرمجي للمشاركة في المعرض الأكاديمي والمسابقة الوطنية للموهوبين باسم ثانوية ميسان للمتميزات.\n\nيرجى التفضل بالاطلاع والتوجيه المعتمد، ولكم منا جزيل الشكر.`,
        suggestedRoleFilter: 'admin',
      },
    ],
    parent: [
      {
        id: 'prt-1',
        title: '📜 طلب إجازة رسمية ومبرر غياب للطالبة',
        category: 'exception_request',
        priority: 'عادي',
        icon: '📜',
        subject: 'طلب إجازة رسمية ومبرر غياب للطالبة',
        content: `إلى الفاضلة مديرة ثانوية ميسان للمتميزات والهيئة التدريسية والإدارية المحترمة،\n\nنرجو من حضراتكم الموافقة على منح ابنتنا الطالبة المتميزة إجازة رسمية لليوم بسبب ظرف صحي / عائلي طارئ، ونؤكد حرصنا الكامل على متابعة دروسها وواجباتها المنزلية فور عودتها.\n\nشاكرين تعاونكم التربوي المستمر معنا.`,
        suggestedRoleFilter: 'admin',
      },
      {
        id: 'prt-2',
        title: '❓ استفسار ومتابعة المستوى الأكاديمي للطالبة',
        category: 'direct',
        priority: 'عادي',
        icon: '❓',
        subject: 'استفسار ومتابعة المستوى الأكاديمي والانتظام لإنشطة الطالبة',
        content: `إلى الأستاذة الفاضلة مدرسة المادة والمرشدة التربوية المحترمة،\n\nتحية طيبة وبعد،\nأرجو إعلامي بآخر مستجدات المستوى الأكاديمي ونتائج التقييمات الشفهية والتحريرية لابنتنا، وأي ملاحظات تربوية تساهم في تعزيز تفوقها الدراسي.\n\nدمتم بعون الله ورعايته.`,
        suggestedRoleFilter: 'teacher',
      },
      {
        id: 'prt-3',
        title: '🤝 طلب تحديد موعد مقابلة الإدارة / المرشدة',
        category: 'direct',
        priority: 'مهم',
        icon: '🤝',
        subject: 'طلب تحديد موعد لقاء ومقابلة مع إدارة المدرسة',
        content: `إلى إدارة ثانوية ميسان للمتميزات المحترمة،\n\nأود طلب تحديد موعد مناسب لمقابلة مديرة المدرسة أو المرشدة التربوية لمناقشة موضوع تربوي خاص بمسار ابنتنا المتميزة وتطوير مهاراتها العلمية.\n\nشاكرين حسن الاستجابة والاهتمام.`,
        suggestedRoleFilter: 'admin',
      },
      {
        id: 'prt-4',
        title: '🌹 كلمة شكر وعرفان لإدارة المدرسة والمدرسات',
        category: 'appreciation',
        priority: 'عادي',
        icon: '🌹',
        subject: 'رسالة شكر وعرفان لإدارة المدرسة والهيئة التدريسية',
        content: `إلى الأستاذة الفاضلة مديرة المدرسة وكافة أستاذاتنا المبدعات،\n\nنيابة عن مجلس أولياء الأمور، نتقدم لكم بخالص الشكر والتقدير على الجهود الجبارة والرعاية الاستثنائية التي تبذلونها يومياً لبناء جيل الواعدات والمتميزات.\n\nبارك الله في عطائكم وجزاكم الله كل خير.`,
        suggestedRoleFilter: 'admin',
      },
    ],
    supervisor: [
      {
        id: 'sup-1',
        title: '📝 كتاب تقييم زيارة إشرافية ميدانية وتوصيات التطوير',
        category: 'official_letter',
        priority: 'مهم',
        icon: '📝',
        subject: 'تقرير زيارة إشرافية وتوصيات التطوير الأكاديمي',
        content: `إلى إدارة ثانوية ميسان للمتميزات والهيئة التدريسية المحترمين،\nالموضوع/ تقرير الزيارة الإشرافية الميدانية\n\nنود إشادتنا بالمستوى العلمي الرفيع والتنظيم الإداري العالي الذي لمسناه خلال زيارتنا الميدانية اليوم. نرفق لكم التوصيات الإشرافية المعتمدة لتعزيز استخدام التقنيات المختبرية وصقل المهارات التحليلية للطالبات.\n\nمع فائق الشكر والتقدير لجهودكم القيمة.`,
        copiesTo: ['قسم الإشراف التربوي / المديرية العامة لتربية ميسان', 'شعبة الإدارة والذاتية'],
        suggestedRoleFilter: 'admin',
      },
      {
        id: 'sup-2',
        title: '📢 تعميم توجيهات وزارية وقرارات المديرية العامة',
        category: 'official_letter',
        priority: 'عاجل وسري',
        icon: '📢',
        subject: 'تبليغ رسمي: تعميم التوجيهات الوزارية الحديثة',
        content: `إلى إدارة ثانوية ميسان للمتميزات المحترمة،\n\nنحيطكم علماً بالتعليمات الوزارية الصادرة حديثاً بخصوص تنظيم امتحانات الموهوبين والمتميزات واعتماد السجلات الإلكترونية. يُرجى التوجيه بالعمل بموجبها وإعلامنا باستكمال الإجراءات.\n\nولكم منا فائق الاحترام.`,
        copiesTo: ['قسم الإشراف التربوي / المديرية العامة لتربية ميسان', 'أرشيف الصادر والوارد / الحفظ والترقيم'],
        suggestedRoleFilter: 'admin',
      },
      {
        id: 'sup-3',
        title: '🤝 دعوة للمشاركة في ورشة العمل الإشرافية لتطوير المناهج',
        category: 'official_letter',
        priority: 'عادي',
        icon: '🤝',
        subject: 'دعوة للمشاركة في ورشة العمل الإشرافية لتطوير المناهج',
        content: `إلى إدارة المدرسة ومدرسات المواد العلمية المحترمات،\n\nيسر قسم الإشراف التربوي دعوة الهيئة التدريسية للمشاركة في ورشة العمل المقامة في المديرية العامة لتربية ميسان حول الأساليب الحديثة في تدريس المناهج التخصصية للمتميزات.\n\nنتطلع لحضوركم ومشاركتكم الفاعلة.`,
        suggestedRoleFilter: 'teacher',
      },
    ],
  };

  // Open Composer for new message
  const handleOpenComposer = (type: 'direct' | 'official_letter' | 'parent_summons' | 'appreciation' | 'exception_request' = 'direct') => {
    setEditingDraftId(null);
    setMsgCategory(type);
    setMsgPriority(type === 'parent_summons' || type === 'official_letter' ? 'مهم' : 'عادي');
    setActiveTemplateRole(role || 'admin');
    setAppliedTemplateNotice('');
    setReceiverId('');
    setSelectedReceiverIds([]);
    setRecipientSearchQuery('');
    setRecipientRoleFilter('all');
    setSelectedSubjectFilter('all');
    setSelectedGradeFilter('all');
    setBroadcastTarget('none');
    setSubject('');
    setContent('');
    setSerialNumber(generateNewSerial());
    setLetterDate(new Date().toISOString().split('T')[0].replace(/-/g, '/'));
    const activeSchoolLogo = schoolAdminData?.schoolLogoUrl || '';
    setLogoUrl(activeSchoolLogo || 'default');
    setCustomLogoUrl(activeSchoolLogo);
    setCopiesTo([]);
    setHasOfficialSeal(role === 'admin');
    setComposerAttachments([]);
    setIsComposerOpen(true);
  };

  // Apply Role Template with 1-click
  const handleApplyRoleTemplate = (tmpl: AdminTemplateItem) => {
    setMsgCategory(tmpl.category);
    setMsgPriority(tmpl.priority || 'عادي');
    setSubject(tmpl.subject);
    setContent(tmpl.content);
    if (tmpl.copiesTo && tmpl.copiesTo.length > 0) {
      setCopiesTo(tmpl.copiesTo);
    } else {
      setCopiesTo([]);
    }
    if (tmpl.suggestedRoleFilter) {
      setRecipientRoleFilter(tmpl.suggestedRoleFilter);
    }
    setAppliedTemplateNotice(`✨ تم تعبئة القالب بنجاح: "${tmpl.title}"`);
    setTimeout(() => setAppliedTemplateNotice(''), 4000);
  };

  // Add sample attachment to composer
  const handleAddSampleAttachment = (type: 'pdf' | 'image' | 'doc' | 'sheet') => {
    const attachNames: Record<string, string> = {
      pdf: 'وثيقة_كتاب_رسمي_مختوم.pdf',
      image: 'صورة_الشهادة_التقديرية.png',
      doc: 'تقرير_التقييم_الأكاديمي.docx',
      sheet: 'جدول_الدرجات_والحضور.xlsx',
    };
    const attachSizes: Record<string, string> = {
      pdf: '1.4 MB',
      image: '850 KB',
      doc: '420 KB',
      sheet: '610 KB',
    };

    const newAttach: MessageAttachment = {
      id: `att-${Date.now()}`,
      fileName: attachNames[type],
      fileSize: attachSizes[type],
      fileType: type,
    };
    setComposerAttachments((prev) => [...prev, newAttach]);
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      let fileType: MessageAttachment['fileType'] = 'doc';
      if (file.type.includes('pdf')) fileType = 'pdf';
      else if (file.type.includes('image')) fileType = 'image';
      else if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) fileType = 'sheet';
      else if (file.name.endsWith('.zip') || file.name.endsWith('.rar')) fileType = 'archive';

      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = file.size > 1024 * 1024 ? `${fileSizeMb} MB` : `${Math.round(file.size / 1024)} KB`;

      const fileUrl = file.type.includes('image') ? URL.createObjectURL(file) : undefined;

      const newAttach: MessageAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        fileName: file.name,
        fileSize: sizeStr,
        fileType,
        url: fileUrl,
      };

      setComposerAttachments((prev) => [...prev, newAttach]);
    });
  };

  // Remove attachment from composer
  const handleRemoveAttachment = (id: string) => {
    setComposerAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Toggle or add copy-to recipient
  const handleToggleCopyTo = (destination: string) => {
    setCopiesTo((prev) =>
      prev.includes(destination)
        ? prev.filter((item) => item !== destination)
        : [...prev, destination]
    );
  };

  // Add custom copy destination
  const handleAddCustomCopy = () => {
    if (!newCopyInput.trim()) return;
    const clean = newCopyInput.trim();
    if (!copiesTo.includes(clean)) {
      setCopiesTo((prev) => [...prev, clean]);
    }
    setNewCopyInput('');
  };

  // Open Composer to edit ANY message
  const handleEditMessage = (msg: DirectMessage) => {
    setEditingDraftId(msg.id);
    setMsgCategory(msg.category || 'direct');
    setMsgPriority(msg.priority || 'عادي');
    setReceiverId(msg.receiverId || '');
    if (msg.receiverIds && msg.receiverIds.length > 0) {
      setSelectedReceiverIds(msg.receiverIds);
    } else if (msg.receiverId) {
      const ids = msg.receiverId.includes(',') ? msg.receiverId.split(',') : [msg.receiverId];
      setSelectedReceiverIds(ids);
    } else {
      setSelectedReceiverIds([]);
    }
    setSubject(msg.subject || '');
    setContent(msg.content || '');
    setSerialNumber(msg.serialNumber || generateNewSerial());
    setLetterDate(msg.letterDate || msg.timestamp.split(' ')[0]);
    const activeSchoolLogo = schoolAdminData?.schoolLogoUrl || '';
    const activeMsgLogo = msg.logoUrl && msg.logoUrl !== 'default' ? msg.logoUrl : activeSchoolLogo;
    setLogoUrl(activeMsgLogo || 'default');
    setCustomLogoUrl(
      activeMsgLogo && (activeMsgLogo.startsWith('http') || activeMsgLogo.startsWith('data:image'))
        ? activeMsgLogo
        : activeSchoolLogo
    );
    setCopiesTo(msg.copiesTo || []);
    setHasOfficialSeal(msg.hasOfficialSeal ?? true);
    setComposerAttachments(msg.attachments || []);
    setIsComposerOpen(true);
  };

  const handleEditDraft = handleEditMessage;

  // Handle deleting a message
  const handleDeleteMessage = (id: string) => {
    const msgToDelete = messages.find((m) => m.id === id);
    if (!msgToDelete) return;

    if (activeFolder === 'trash' || isMessageTrashForUser(msgToDelete, currentUserId)) {
      deleteMessage(id, currentUserId);
    } else {
      moveToTrash(id, currentUserId);
    }

    if (selectedMessageId === id) {
      setSelectedMessageId(null);
    }
    if (printingMessage?.id === id) {
      setPrintingMessage(null);
    }
  };

  // Submit Send or Edit Message
  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReceiverIds.length === 0 && broadcastTarget === 'none') return;
    if (!subject.trim() || !content.trim()) return;

    const finalLogoUrl = logoUrl === 'custom' ? customLogoUrl : logoUrl;
    const existingMsg = messages.find((m) => m.id === editingDraftId);

    if (broadcastTarget !== 'none') {
      let targetId = 'broadcast-all-teachers';
      let targetName = 'جميع المدرسات وأعضاء الهيئة التدريسية (إرسال جماعي)';

      if (broadcastTarget === 'all_students') {
        targetId = 'broadcast-all-students';
        targetName = 'جميع طالبات ثانوية ميسان للمتميزات (إرسال جماعي)';
      } else if (broadcastTarget === 'all_parents') {
        targetId = 'broadcast-all-parents';
        targetName = 'جميع أولياء الأمور (إرسال جماعي)';
      }

      if (existingMsg && !existingMsg.isDraft) {
        const updated: DirectMessage = {
          ...existingMsg,
          receiverId: targetId,
          receiverName: targetName,
          subject,
          content,
          category: msgCategory,
          priority: msgPriority,
          serialNumber: msgCategory !== 'direct' ? serialNumber : undefined,
          letterDate: msgCategory !== 'direct' ? letterDate : undefined,
          logoUrl: finalLogoUrl,
          copiesTo,
          hasOfficialSeal,
          attachments: composerAttachments,
        };
        updateMessage(updated);
        if (printingMessage?.id === updated.id) {
          setPrintingMessage(updated);
        }
      } else {
        sendMessage({
          id: editingDraftId || undefined,
          senderId: currentUserId,
          senderName: currentUserName,
          senderRole: role,
          receiverId: targetId,
          receiverName: targetName,
          subject,
          content,
          category: msgCategory,
          priority: msgPriority,
          serialNumber: msgCategory !== 'direct' ? serialNumber : undefined,
          letterDate: msgCategory !== 'direct' ? letterDate : undefined,
          logoUrl: finalLogoUrl,
          copiesTo,
          hasOfficialSeal,
          attachments: composerAttachments,
        });
      }

      setComposerSuccessMsg('🚀 تم إرسال المراسلة بنجاح إلى الفئة الجماعية المحددة!');
    } else {
      // Direct sending to selectedReceiverIds
      const selectedRecs = possibleRecipients.filter((r) => selectedReceiverIds.includes(r.id));
      const combinedNames = selectedRecs.length > 0
        ? selectedRecs.map((r) => r.rawName || r.name).join('، ')
        : 'مستلم المدرسة';
      const targetIdStr = selectedReceiverIds.join(',');
      const recipientObjects = selectedRecs.map((r) => ({
        id: r.id,
        name: r.rawName || r.name,
        role: r.roleBadge,
      }));

      if (existingMsg && !existingMsg.isDraft) {
        const updated: DirectMessage = {
          ...existingMsg,
          receiverId: targetIdStr,
          receiverName: combinedNames,
          receiverIds: selectedReceiverIds,
          recipients: recipientObjects,
          subject,
          content,
          category: msgCategory,
          priority: msgPriority,
          serialNumber: msgCategory !== 'direct' ? serialNumber : undefined,
          letterDate: msgCategory !== 'direct' ? letterDate : undefined,
          logoUrl: finalLogoUrl,
          copiesTo,
          hasOfficialSeal,
          attachments: composerAttachments,
        };
        updateMessage(updated);
        if (printingMessage?.id === updated.id) {
          setPrintingMessage(updated);
        }
      } else {
        // Send a single message containing all recipients
        sendMessage({
          id: editingDraftId || undefined,
          senderId: currentUserId,
          senderName: currentUserName,
          senderRole: role,
          receiverId: targetIdStr,
          receiverName: combinedNames,
          receiverIds: selectedReceiverIds,
          recipients: recipientObjects,
          subject,
          content,
          category: msgCategory,
          priority: msgPriority,
          serialNumber: msgCategory !== 'direct' ? serialNumber : undefined,
          letterDate: msgCategory !== 'direct' ? letterDate : undefined,
          logoUrl: finalLogoUrl,
          copiesTo,
          hasOfficialSeal,
          attachments: composerAttachments,
        });
      }

      const countText = selectedReceiverIds.length === 1
        ? 'المستلم المحدد'
        : `المستلمين المحددين (${combinedNames})`;
      setComposerSuccessMsg(`🚀 تم إرسال المراسلة الرسمية بنجاح إلى ${countText} ونقلها إلى سجل البريد الصادر!`);
    }

    setTimeout(() => {
      setComposerSuccessMsg('');
      setIsComposerOpen(false);
      setEditingDraftId(null);
      setSubject('');
      setContent('');
      setSelectedReceiverIds([]);
      setActiveFolder('sent');
    }, 1200);
  };

  // Handle Save Draft
  const handleSaveDraftSubmit = () => {
    if (!subject && !content) return;

    const selectedRecs = possibleRecipients.filter((r) => selectedReceiverIds.includes(r.id));
    const combinedNames = selectedRecs.length > 0
      ? selectedRecs.map((r) => r.rawName || r.name).join('، ')
      : 'مستلم المدرسة';
    const finalLogoUrl = logoUrl === 'custom' ? customLogoUrl : logoUrl;

    const recId = selectedReceiverIds.join(',') || 'admin-main';
    const recipientObjects = selectedRecs.map((r) => ({
      id: r.id,
      name: r.rawName || r.name,
      role: r.roleBadge,
    }));

    saveDraft({
      id: editingDraftId || undefined,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: role,
      receiverId: recId,
      receiverName: combinedNames,
      receiverIds: selectedReceiverIds,
      recipients: recipientObjects,
      subject: subject || 'مسودة مراسلة بدون عنوان',
      content,
      category: msgCategory,
      priority: msgPriority,
      serialNumber: msgCategory !== 'direct' ? serialNumber : undefined,
      letterDate: msgCategory !== 'direct' ? letterDate : undefined,
      logoUrl: finalLogoUrl,
      copiesTo,
      hasOfficialSeal,
      attachments: composerAttachments,
    });

    setComposerSuccessMsg('💾 تم حفظ المراسلة كمسودة بنجاح في مجلد المسودات!');
    setTimeout(() => {
      setComposerSuccessMsg('');
      setIsComposerOpen(false);
      setEditingDraftId(null);
      setSelectedReceiverIds([]);
      setActiveFolder('drafts');
    }, 1000);
  };

  // Handle Preview Message before sending
  const handlePreviewMessage = () => {
    if (!subject.trim() && !content.trim()) {
      alert('يرجى كتابة عنوان أو محتوى للرسالة/الكتاب أولاً لمعاينته.');
      return;
    }

    let targetName = 'مستلم المراسلة';
    let targetId = receiverId;

    if (broadcastTarget === 'all_teachers') {
      targetId = 'broadcast-all-teachers';
      targetName = 'جميع المدرسات وأعضاء الهيئة التدريسية (إرسال جماعي)';
    } else if (broadcastTarget === 'all_students') {
      targetId = 'broadcast-all-students';
      targetName = 'جميع طالبات ثانوية ميسان للمتميزات (إرسال جماعي)';
    } else if (broadcastTarget === 'all_parents') {
      targetId = 'broadcast-all-parents';
      targetName = 'جميع أولياء الأمور (إرسال جماعي)';
    } else if (selectedReceiverIds.length > 0) {
      const selectedRecs = possibleRecipients.filter((r) => selectedReceiverIds.includes(r.id));
      targetName = selectedRecs.map((r) => r.rawName || r.name).join('، ');
      targetId = selectedReceiverIds.join(',');
    } else {
      const rec = possibleRecipients.find((r) => r.id === receiverId);
      if (rec) targetName = rec.rawName || rec.name;
    }

    const finalLogoUrl = logoUrl === 'custom' ? customLogoUrl : logoUrl;

    const previewMsg: DirectMessage = {
      id: editingDraftId || `preview-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: role,
      receiverId: targetId || 'unspecified',
      receiverName: targetName,
      subject: subject || 'عنوان كتاب/مراسلة بدون عنوان',
      content: content || 'محتوى الرسالة...',
      category: msgCategory,
      priority: msgPriority,
      serialNumber: serialNumber || `م/ ${Math.floor(1000 + Math.random() * 9000)}`,
      letterDate: letterDate || new Date().toISOString().split('T')[0].replace(/-/g, '/'),
      logoUrl: finalLogoUrl,
      copiesTo,
      hasOfficialSeal,
      attachments: composerAttachments,
      timestamp: new Date().toISOString(),
      isRead: true,
    };

    setPrintingMessage(previewMsg);
  };

  // Quick Reply Submit
  const handleQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyContent.trim()) return;

    sendMessage({
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: role,
      receiverId: selectedMessage.senderId,
      receiverName: selectedMessage.senderName,
      subject: selectedMessage.subject.startsWith('رد:')
        ? selectedMessage.subject
        : `رد: ${selectedMessage.subject}`,
      content: replyContent,
      category: 'direct',
      replyToId: selectedMessage.id,
    });

    setReplySuccess(true);
    setReplyContent('');
    setTimeout(() => setReplySuccess(false), 2500);
  };

  return (
    <div
      className={`font-arabic text-slate-900 bg-slate-50 border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xl transition-all ${
        embeddedMode ? 'w-full' : 'max-w-7xl w-full mx-auto my-4'
      }`}
    >
      {/* Executive Top Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-indigo-500/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                منظومة البريد المباشر والمراسلات الرسمية
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>مؤمن بالأختام الرقمية الرسمية</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              ثانوية ميسان للمتميزات — المراسلات المباشرة والكتب الإدارية واستدعاءات أولياء الأمور
            </p>
          </div>
        </div>

        {/* Top Executive Actions & Live Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden md:flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl text-[11px] font-bold border border-white/10 text-slate-200">
            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/30 text-indigo-200">
              📥 الوارد: {inboxCount}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/30 text-amber-200">
              📜 الكتب الرسمية: {officialCount}
            </span>
          </div>

          <button
            onClick={() => handleOpenComposer('official_letter')}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">كتاب رسمي جديد</span>
          </button>

          <button
            onClick={() => handleOpenComposer('direct')}
            className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>رسالة مباشرة</span>
          </button>

          {!embeddedMode && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Mail Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* Sidebar Nav Folders (3 Cols) */}
        <div className="lg:col-span-3 p-4 bg-white border-b lg:border-b-0 lg:border-l border-slate-200/80 space-y-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center justify-between">
            <span>مجلدات البريد والأرشيف</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>

          <nav className="space-y-1">
            {/* 1. البريد الوارد (Inbox) */}
            <button
              onClick={() => {
                setActiveFolder('inbox');
                setSelectedMessageId(null);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                activeFolder === 'inbox'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>البريد الوارد</span>
              </div>
              <div className="flex items-center gap-1">
                {unreadInboxCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black animate-pulse">
                    {unreadInboxCount} جديد
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-xl text-[10px] ${
                    activeFolder === 'inbox' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {inboxCount}
                </span>
              </div>
            </button>

            {/* 2. الصادر والمراسلات (Sent Mail) */}
            <button
              onClick={() => {
                setActiveFolder('sent');
                setSelectedMessageId(null);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                activeFolder === 'sent'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4" />
                <span>الرسائل المرسلة (الصادر)</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-xl text-[10px] ${
                  activeFolder === 'sent' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {sentCount}
              </span>
            </button>

            {/* 3. الكتب والمراسلات الرسمية (Official Letters Filter) */}
            <button
              onClick={() => {
                setActiveFolder('official');
                setSelectedMessageId(null);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                activeFolder === 'official'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>الكتب والمراسلات الرسمية</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-xl text-[10px] ${
                  activeFolder === 'official' ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {officialCount}
              </span>
            </button>

            {/* 4. المسودات (Drafts) */}
            <button
              onClick={() => {
                setActiveFolder('drafts');
                setSelectedMessageId(null);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                activeFolder === 'drafts'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>المسودات</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-xl text-[10px] ${
                  activeFolder === 'drafts' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {draftsCount}
              </span>
            </button>

            {/* 5. المميزة بنجمة (Starred) */}
            <button
              onClick={() => {
                setActiveFolder('starred');
                setSelectedMessageId(null);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                activeFolder === 'starred'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-700 hover:bg-amber-50 hover:text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>المميزة بنجمة</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-xl text-[10px] ${
                  activeFolder === 'starred' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {starredCount}
              </span>
            </button>

            {/* 6. البريد المزعج (Spam) */}
            <button
              onClick={() => {
                setActiveFolder('spam');
                setSelectedMessageId(null);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                activeFolder === 'spam'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-700 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                <span>البريد المزعج (Spam)</span>
              </div>
              {spamCount > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-xl text-[10px] ${
                    activeFolder === 'spam' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {spamCount}
                </span>
              )}
            </button>

            {/* 7. سلة المهملات (Trash) */}
            <button
              onClick={() => {
                setActiveFolder('trash');
                setSelectedMessageId(null);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                activeFolder === 'trash'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-slate-400" />
                <span>سلة المهملات</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-xl text-[10px] ${
                  activeFolder === 'trash' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {trashCount}
              </span>
            </button>
          </nav>

          {/* Empty Spam Box Option */}
          {activeFolder === 'spam' && spamCount > 0 && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>الرسائل المحظورة والسبام</span>
              </div>
              <button
                onClick={() => emptySpamFolder(currentUserId)}
                className="w-full py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all shadow-sm"
              >
                <Trash2 className="w-3 h-3" />
                <span>تفريغ مجلد السخام الآن</span>
              </button>
            </div>
          )}

          {/* Empty Trash Box Option */}
          {activeFolder === 'trash' && trashCount > 0 && (
            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
                <Trash2 className="w-4 h-4 shrink-0 text-rose-600" />
                <span>سلة المهملات والمحذوفات</span>
              </div>
              <button
                onClick={() => emptyTrashFolder(currentUserId)}
                className="w-full py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all shadow-sm"
              >
                <Trash2 className="w-3 h-3" />
                <span>تفريغ سلة المهملات بالكامل</span>
              </button>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[11px]">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>خصوصية المراسلات الأكاديمية</span>
            </div>
            <p className="text-[10px] text-indigo-800 leading-relaxed">
              تضمن هذه المنظومة التوثيق الرقمي الرسمي وتوليد الأرقام التسلسلية المعتمدة لكافة الكتب المدرسية الصادرة والواردة.
            </p>
          </div>
        </div>

        {/* Middle Column: Message Stream List (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-50/60 border-b lg:border-b-0 lg:border-l border-slate-200/80 p-3.5 space-y-3 flex flex-col max-h-[620px]">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="بحث بالموضوع، النص، المستلم، أو رقم الصادر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2.5 rounded-2xl bg-white border border-slate-200 font-medium text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          {/* Priority & Category Filter Strip */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-[10px] font-bold no-scrollbar">
            <button
              onClick={() => setSelectedPriorityFilter('all')}
              className={`px-2.5 py-1 rounded-xl transition-all shrink-0 ${
                selectedPriorityFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              الكل ({folderMessages.length})
            </button>
            <button
              onClick={() => setSelectedPriorityFilter('عاجل وسري')}
              className={`px-2 py-1 rounded-xl transition-all shrink-0 flex items-center gap-1 ${
                selectedPriorityFilter === 'عاجل وسري'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>عاجل وسري</span>
            </button>
            <button
              onClick={() => setSelectedPriorityFilter('مهم')}
              className={`px-2 py-1 rounded-xl transition-all shrink-0 flex items-center gap-1 ${
                selectedPriorityFilter === 'مهم'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>مهم</span>
            </button>
          </div>

          {/* Messages Stream Item Cards */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredMessages.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <Mail className="w-12 h-12 mx-auto stroke-1 opacity-40 text-slate-400" />
                <p className="text-xs font-bold text-slate-600">لا توجد مراسلات في هذا المجلد حالياً</p>
                <p className="text-[10px] text-slate-400">يمكنك إنشاء كتاب جديد أو تغيير خيارات التصفية والبحث</p>
              </div>
            ) : (
              filteredMessages.map((m) => {
                const isSelected = m.id === selectedMessageId;
                const isRead = isMessageReadForUser(m, currentUserId);
                const isStarred = isMessageStarredForUser(m, currentUserId);
                const isTrash = isMessageTrashForUser(m, currentUserId);

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMessageId(m.id);
                      if (!isRead) markMessageRead(m.id, currentUserId);
                    }}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all space-y-2 relative group ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                        : !isRead
                        ? 'bg-white border-indigo-200 shadow-sm font-bold'
                        : 'bg-white/90 hover:bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!isRead && activeFolder === 'inbox' && (
                      <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    )}

                    {/* Top Row: Sender/Receiver & Timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 truncate max-w-[70%]">
                        {activeFolder === 'sent' ? `إلى: ${m.receiverName}` : m.senderName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {m.timestamp.split(' ')[0]}
                      </span>
                    </div>

                    {/* Category & Priority Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      {m.priority === 'عاجل وسري' && (
                        <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200">
                          🔴 عاجل وسري
                        </span>
                      )}
                      {m.priority === 'مهم' && (
                        <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                          🟠 مهم رسمياً
                        </span>
                      )}

                      {m.category === 'official_letter' && (
                        <span className="px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-900 font-bold">
                          📜 كتاب رسمي
                        </span>
                      )}
                      {m.category === 'parent_summons' && (
                        <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-900 font-bold">
                          📋 استدعاء ولي أمر
                        </span>
                      )}
                      {m.category === 'appreciation' && (
                        <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                          🎖️ كتاب شكر
                        </span>
                      )}

                      {m.hasOfficialSeal && (
                        <span className="text-[10px] text-indigo-700 font-bold flex items-center gap-0.5">
                          <span>🏛️</span>
                          <span>مختوم</span>
                        </span>
                      )}

                      {m.attachments && m.attachments.length > 0 && (
                        <span className="text-slate-500 font-bold flex items-center gap-0.5">
                          <Paperclip className="w-3 h-3 text-slate-400" />
                          <span>{m.attachments.length} مرفق</span>
                        </span>
                      )}
                    </div>

                    {/* Subject */}
                    <p className={`text-xs truncate ${!isRead ? 'font-bold text-slate-900' : 'text-slate-800'}`}>
                      {m.subject}
                    </p>

                    {/* Excerpt */}
                    <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
                      {m.content}
                    </p>

                    {/* Bottom Quick Toolbar */}
                    <div className="flex items-center justify-between pt-1.5 text-[10px] border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarMessage(m.id, currentUserId);
                        }}
                        className="p-1 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500"
                        title="تمييز بنجمة"
                      >
                        <Star className={`w-3.5 h-3.5 ${isStarred ? 'text-amber-500 fill-amber-400' : ''}`} />
                      </button>

                      <div className="flex items-center gap-1">
                        {/* Edit Button for any message */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMessage(m);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 transition-all border border-amber-200"
                          title="تعديل المراسلة"
                        >
                          <Pencil className="w-3 h-3 text-amber-600" />
                          <span>تعديل</span>
                        </button>

                        {/* Restore or Spam Button */}
                        {activeFolder === 'trash' || isTrash ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              restoreFromTrash(m.id, currentUserId);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200 text-[10px]"
                            title="إستعادة إلى صندوق البريد"
                          >
                            استعادة
                          </button>
                        ) : activeFolder !== 'spam' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveToSpam(m.id, currentUserId);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="إرسال للبريد المزعج"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              restoreFromSpam(m.id, currentUserId);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200 text-[10px]"
                          >
                            إعادة للوارد
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(m.id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={activeFolder === 'trash' || m.isTrash ? "حذف نهائي" : "حذف ونقل لسلة المهملات"}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Letter Reader & Printable View Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 flex flex-col justify-between max-h-[620px] overflow-y-auto">
          {selectedMessage ? (
            <div className="space-y-4">
              
              {/* Message Header Bar */}
              <div className="pb-4 border-b border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {selectedMessage.subject}
                      </h3>
                      {selectedMessage.serialNumber && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                          العدد: {selectedMessage.serialNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      {selectedMessage.priority === 'عاجل وسري' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                          🔴 عاجل وسري جداً
                        </span>
                      )}
                      {selectedMessage.priority === 'مهم' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          🟠 مهم رسمياً
                        </span>
                      )}
                      {selectedMessage.category === 'official_letter' && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold">
                          📜 كتاب رسمي معنون
                        </span>
                      )}
                      {selectedMessage.category === 'parent_summons' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold">
                          📋 استدعاء ولي أمر
                        </span>
                      )}
                      {selectedMessage.category === 'appreciation' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                          🎖️ كتاب شكر وتقدير
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Message Button */}
                    <button
                      onClick={() => handleEditMessage(selectedMessage)}
                      className="p-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1 font-bold text-xs"
                      title="تعديل المراسلة أو الكتاب الرسمي"
                    >
                      <Pencil className="w-4 h-4 text-amber-600" />
                      <span className="hidden sm:inline">تعديل</span>
                    </button>

                    {/* Print Button */}
                    <button
                      onClick={() => setPrintingMessage(selectedMessage)}
                      className="p-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1 font-bold text-xs"
                      title="معاينة وطباعة الكتاب الرسمي"
                    >
                      <Printer className="w-4 h-4" />
                      <span className="hidden sm:inline">طباعة</span>
                    </button>

                    {/* Star Button */}
                    <button
                      onClick={() => toggleStarMessage(selectedMessage.id, currentUserId)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-amber-50 transition-colors"
                      title="تميز بنجمة"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isMessageStarredForUser(selectedMessage, currentUserId) ? 'text-amber-500 fill-amber-400' : 'text-slate-400'
                        }`}
                      />
                    </button>

                    {/* Delete Message Button */}
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1 font-bold text-xs"
                      title={selectedMessage.isTrash ? "حذف نهائي للمراسلة" : "حذف المراسلة ونقلها لسلة المهملات"}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span className="hidden sm:inline">حذف</span>
                    </button>
                  </div>
                </div>

                {/* Sender & Receiver Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>من: {selectedMessage.senderName}</span>
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      {selectedMessage.letterDate && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200/80 font-bold">
                          تاريخ الكتاب: {selectedMessage.letterDate}
                        </span>
                      )}
                      <span>{selectedMessage.timestamp}</span>
                    </div>
                  </div>

                  <div className="text-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-900">إلى:</span>
                      <span>{selectedMessage.receiverName}</span>
                    </div>

                    {selectedMessage.hasOfficialSeal && (
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 font-bold text-[10px] border border-indigo-200 flex items-center gap-1">
                        <span>🏛️ ختم الإدارة والمديرة</span>
                      </span>
                    )}
                  </div>

                  {/* Copies To List if exists */}
                  {selectedMessage.copiesTo && selectedMessage.copiesTo.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                      <span className="font-bold text-slate-800">نسخة منه إلى:</span>
                      <ul className="list-disc list-inside text-slate-600 space-y-0.5 font-medium">
                        {selectedMessage.copiesTo.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content Body */}
              <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-arabic min-h-[120px]">
                {selectedMessage.content}
              </div>

              {/* Attachments Section */}
              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <span>المرفقات المنسقة ({selectedMessage.attachments.length}):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedMessage.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-xl bg-white border border-indigo-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold text-slate-900 truncate">{att.fileName}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{att.fileSize}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => downloadTextOrAttachmentAsPdf(att.fileName, `المرفق الرسمي: ${att.fileName}`, `محتوى ووثيقة المرفق المعتمد لـ (${att.fileName}):\n\nتاريخ التنزيل: ${new Date().toLocaleDateString('ar-IQ')}\nاسم الملف: ${att.fileName}\nالحجم: ${att.fileSize}\n\nتم التصدير بنجاح من منظومة البريد المباشر والمراسلات الرسمية - ثانوية ميسان للمتميزات.`)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors shrink-0 cursor-pointer"
                          title="تنزيل المرفق كملف PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thread History Chain if any */}
              {threadReplies.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>الردود السابقة ذات الصلة ({threadReplies.length}):</span>
                  </span>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {threadReplies.map((reply) => (
                      <div key={reply.id} className="p-3 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{reply.senderName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{reply.timestamp}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Inline Reply Form */}
              {!selectedMessage.isDraft && selectedMessage.folder !== 'spam' && (
                <div className="pt-4 border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 text-indigo-950">
                      <Reply className="w-4 h-4 text-indigo-600" />
                      <span>الرد المباشر السريع:</span>
                    </span>
                    {replySuccess && (
                      <span className="text-emerald-600 font-bold text-[11px] animate-pulse flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>تم إرسال الرد المباشر بنجاح!</span>
                      </span>
                    )}
                  </div>

                  {/* Preset Quick Statements */}
                  <div className="flex flex-wrap gap-1.5">
                    {['تمت المتابعة والاستلام', 'سيتم إجراء اللازم فوراً', 'شكراً جزيلاً لحضرتكم'].map((txt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReplyContent((prev) => (prev ? `${prev} ${txt}` : txt))}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200 text-[10px] font-semibold transition-all"
                      >
                        + {txt}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleQuickReply} className="space-y-2">
                    <textarea
                      rows={3}
                      placeholder={`اكتبي الرد المباشر الموجه لـ ${selectedMessage.senderName}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-300 font-medium text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setPrintingMessage(selectedMessage)}
                        className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>معاينة الطباعة الرسمية</span>
                      </button>

                      <button
                        type="submit"
                        disabled={!replyContent.trim()}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال الرد الآن</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          ) : (
            <div className="my-auto text-center py-24 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-400 border border-indigo-100">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">حدد مراسلة من القائمة لقراءتها وطباعتها</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  يمكنك النقر على أي كتاب رسمية أو رسالة مباشرة لعرض تفاصيل المرفقات والرد المباشر والتصدير.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Advanced Composer Modal */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start sm:items-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto font-arabic">
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            
            {/* Modal Top Bar (Sticky/Fixed Header) */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-indigo-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                    {editingDraftId
                      ? messages.find((m) => m.id === editingDraftId && !m.isDraft)
                        ? 'تعديل وتحديث الكتاب/المراسلة الرسمية'
                        : 'تعديل المسودة وإرسال المراسلة الرسمية'
                      : 'إنشاء مراسلة أو كتاب رسمي جديد'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                    ثانوية ميسان للمتميزات — التوثيق الإداري والمراسلات المباشرة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
                title="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              
              {composerSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 font-bold animate-pulse">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{composerSuccessMsg}</span>
                </div>
              )}

              {/* Message Type Selector Tabs */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">نوع المراسلة المطلوبة:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMsgCategory('direct')}
                    className={`p-2.5 rounded-2xl font-bold text-center transition-all ${
                      msgCategory === 'direct'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ✉️ بريد مباشر
                  </button>
                  <button
                    type="button"
                    onClick={() => setMsgCategory('official_letter')}
                    className={`p-2.5 rounded-2xl font-bold text-center transition-all ${
                      msgCategory === 'official_letter'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    📜 كتاب رسمي
                  </button>
                  <button
                    type="button"
                    onClick={() => setMsgCategory('parent_summons')}
                    className={`p-2.5 rounded-2xl font-bold text-center transition-all ${
                      msgCategory === 'parent_summons'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    📋 استدعاء ولي أمر
                  </button>
                  <button
                    type="button"
                    onClick={() => setMsgCategory('appreciation')}
                    className={`p-2.5 rounded-2xl font-bold text-center transition-all ${
                      msgCategory === 'appreciation'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🎖️ كتاب شكر
                  </button>
                  <button
                    type="button"
                    onClick={() => setMsgCategory('exception_request')}
                    className={`p-2.5 rounded-2xl font-bold text-center transition-all ${
                      msgCategory === 'exception_request'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    📄 طلب / استرحام
                  </button>
                </div>
              </div>

              {/* Role-Specific Preset One-Click Administrative Templates Box */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/80 border border-indigo-200/90 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                        <span>قوالب إدارية جاهزة بنقرة واحدة للتعبئة</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                          حسب دور المستخدم
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        تتغير القوالب والنصوص المعتمدة تلقائياً بناءً على الدور الحالي في النظام
                      </p>
                    </div>
                  </div>

                  {appliedTemplateNotice && (
                    <span className="px-3 py-1 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[11px] animate-bounce shadow-xs">
                      {appliedTemplateNotice}
                    </span>
                  )}
                </div>

                {/* Role Switcher Filter Tabs for Templates */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-600">اختر دور القوالب المطلوبة:</span>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setActiveTemplateRole('admin')}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all flex items-center gap-1 ${
                        activeTemplateRole === 'admin'
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>🏫</span>
                      <span>إدارة مدرسية / مديرة</span>
                      {role === 'admin' && <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">دورك</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTemplateRole('teacher')}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all flex items-center gap-1 ${
                        activeTemplateRole === 'teacher'
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>👩‍🏫</span>
                      <span>هيئة تدريسية</span>
                      {role === 'teacher' && <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">دورك</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTemplateRole('student')}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all flex items-center gap-1 ${
                        activeTemplateRole === 'student'
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>👩‍🎓</span>
                      <span>طالبات متميزات</span>
                      {role === 'student' && <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">دورك</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTemplateRole('parent')}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all flex items-center gap-1 ${
                        activeTemplateRole === 'parent'
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>👨‍👩‍👧</span>
                      <span>أولياء الأمور</span>
                      {role === 'parent' && <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">دورك</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTemplateRole('supervisor')}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all flex items-center gap-1 ${
                        activeTemplateRole === 'supervisor'
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>🏛️</span>
                      <span>مشرف تربوي</span>
                      {role === 'supervisor' && <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded font-black">دورك</span>}
                    </button>
                  </div>
                </div>

                {/* Templates Grid for Active Selected Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {(ROLE_ADMIN_TEMPLATES[activeTemplateRole] || ROLE_ADMIN_TEMPLATES.admin).map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleApplyRoleTemplate(tmpl)}
                      className="p-2.5 rounded-xl bg-white hover:bg-indigo-50/90 text-right border border-indigo-200/80 hover:border-indigo-400 transition-all shadow-xs hover:shadow-md group flex flex-col justify-between gap-1.5 active:scale-98"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-extrabold text-indigo-950 text-[11px] group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {tmpl.title}
                        </span>
                        {tmpl.priority && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-black shrink-0 ${
                              tmpl.priority === 'عاجل وسري'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : tmpl.priority === 'مهم'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {tmpl.priority}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold border-t border-slate-100 pt-1">
                        <span className="text-slate-600">
                          {tmpl.category === 'official_letter'
                            ? '📜 كتاب رسمي'
                            : tmpl.category === 'parent_summons'
                            ? '📋 استدعاء ولي أمر'
                            : tmpl.category === 'appreciation'
                            ? '🏆 كتاب شكر'
                            : tmpl.category === 'exception_request'
                            ? '📄 طلب إجازة / استراحام'
                            : '✉️ مراسلة مباشرة'}
                        </span>
                        <span className="text-indigo-600 group-hover:translate-x-[-2px] transition-transform font-bold">
                          تعبئة بنقرة 👈
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendSubmit} className="space-y-4">
                
                {/* Priority, Serial, and Issue Date Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  {/* Priority */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">درجة الأهمية والسرية:</label>
                    <select
                      value={msgPriority}
                      onChange={(e) => setMsgPriority(e.target.value as any)}
                      className="w-full p-2.5 rounded-2xl bg-white border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 text-xs"
                    >
                      <option value="عادي">🔵 عادي (مراسلة قياسية)</option>
                      <option value="مهم">🟠 مهم رسمياً (أولوية إدارية)</option>
                      <option value="عاجل وسري">🔴 عاجل وسري جداً (متابعة فورية)</option>
                    </select>
                  </div>

                  {/* Serial Number */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">رقم الصادر والعدد الرسمي:</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="م.ت / 2026 / 842"
                        className="w-full p-2.5 rounded-2xl bg-white border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 text-xs dir-ltr text-right"
                      />
                      <button
                        type="button"
                        onClick={() => setSerialNumber(generateNewSerial())}
                        className="px-2.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-[10px] shrink-0 border border-indigo-200"
                        title="توليد رقم صادر تلقائي"
                      >
                        تلقائي
                      </button>
                    </div>
                  </div>

                  {/* Issue Date */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">تاريخ الصادر الرسمي:</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={letterDate}
                        onChange={(e) => setLetterDate(e.target.value)}
                        placeholder="2026/08/06"
                        className="w-full p-2.5 rounded-2xl bg-white border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 text-xs dir-ltr text-right"
                      />
                      <button
                        type="button"
                        onClick={() => setLetterDate(new Date().toISOString().split('T')[0].replace(/-/g, '/'))}
                        className="px-2.5 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-[10px] shrink-0 border border-indigo-200"
                        title="تعيين تاريخ اليوم"
                      >
                        اليوم
                      </button>
                    </div>
                  </div>
                </div>

                {/* Official Letter Logo Selector (تغيير الشعار للكتب الرسمية) */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <span>🖼️</span>
                      <span>اختيار وتثبيت الشعار للكتب والمراسلات الرسمية:</span>
                    </label>

                    {Boolean(schoolAdminData?.schoolLogoUrl) && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] flex items-center gap-1">
                        <span>📌</span>
                        <span>تم تثبيت الشعار المرفوع كشعار افتراضي دائم</span>
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-amber-300 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          {renderOfficialLogoGraphic(logoUrl, customLogoUrl, "w-14 h-14")}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>الشعار المعتمد في المراسلة</span>
                            {customLogoUrl === schoolAdminData?.schoolLogoUrl && (
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                (افتراضي دائم)
                              </span>
                            )}
                          </h5>
                          <p className="text-[10px] text-slate-500 font-medium">
                            سيتم استخدام هذا الشعار تلقائياً في كافة الكتب المطبوعة والمراسلات القادمة
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl('custom');
                            logoFileInputRef.current?.click();
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center justify-center gap-2 shadow-sm transition-all"
                          title="فتح المستكشف لرفع صورة الشعار من الجهاز وتثبيته افتراضياً"
                        >
                          <Upload className="w-4 h-4" />
                          <span>رفع صورة شعار من الجهاز 📁</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-amber-100 space-y-2">
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="url"
                          placeholder="أو أدخلي رابط صورة الشعار المباشر (https://...)"
                          value={customLogoUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomLogoUrl(val);
                            setLogoUrl(val || 'custom');
                            if (val) {
                              updateSchoolAdminData({ schoolLogoUrl: val });
                            }
                          }}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                        {customLogoUrl && (
                          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                updateSchoolAdminData({ schoolLogoUrl: customLogoUrl });
                                setLogoUrl(customLogoUrl);
                              }}
                              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-xs transition-colors shrink-0"
                              title="تثبيت هذا الشعار كافتراضي دائم لكافة الكتب والرائل"
                            >
                              📌 تثبيت كشعار دائم
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setCustomLogoUrl('');
                                setLogoUrl('');
                              }}
                              className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs shrink-0 transition-colors"
                            >
                              مسح
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-Recipient Selection Section */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>المستلمون المستهدفون (يمكن تحديد شخص واحد أو مجموعة أشخاص) *</span>
                      </label>
                      {selectedReceiverIds.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-black text-[10px]">
                          {selectedReceiverIds.length} محدد
                        </span>
                      )}
                    </div>

                    {role === 'admin' && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500 font-medium">أو توجيه جماعي عام:</span>
                        <select
                          value={broadcastTarget}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setBroadcastTarget(val);
                            if (val !== 'none') setSelectedReceiverIds([]);
                          }}
                          className="p-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 font-bold text-[11px]"
                        >
                          <option value="none">مستلمون محددون</option>
                          <option value="all_teachers">📢 كافة الهيئة التدريسية</option>
                          <option value="all_students">📢 كافة الطالبـات</option>
                          <option value="all_parents">📢 كافة أولياء الأمور</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {broadcastTarget !== 'none' ? (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 font-bold text-xs flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>
                          توجيه جماعي شامل: {broadcastTarget === 'all_teachers' ? 'كافة المدرسات وأعضاء الهيئة التدريسية' : broadcastTarget === 'all_students' ? 'كافة الطالبات' : 'كافة أولياء الأمور'}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setBroadcastTarget('none')}
                        className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-[11px] hover:bg-amber-100 transition-colors"
                      >
                        إلغاء التوجيه الجماعي
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Selected Recipients Chips Summary */}
                      {selectedReceiverIds.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950">
                            <span>القائمة الحالية للمستلمين المحددِين ({selectedReceiverIds.length}):</span>
                            <button
                              type="button"
                              onClick={handleClearAllSelected}
                              className="text-rose-600 hover:text-rose-700 hover:underline text-[10px]"
                            >
                              مسح الكل ❌
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                            {selectedReceiverIds.map((id) => {
                              const rec = possibleRecipients.find((r) => r.id === id);
                              if (!rec) return null;
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-indigo-300 text-indigo-950 text-[11px] font-bold shadow-xs"
                                >
                                  <span className="text-[10px] opacity-75">
                                    {rec.roleBadge === 'teacher' ? '👩‍🏫' : rec.roleBadge === 'student' ? '👩‍🎓' : rec.roleBadge === 'parent' ? '👨‍👩‍👧' : '🏫'}
                                  </span>
                                  <span>{rec.rawName || rec.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleReceiverId(id)}
                                    className="p-0.5 rounded-full hover:bg-rose-100 hover:text-rose-600 text-slate-400 transition-colors"
                                    title="إزالة من قائمة المستلمين"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Quick Group Presets & Shortcuts */}
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                        <span className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>اختصارات التحديد السريع لمجموعات التخصص والمراحل:</span>
                        </span>

                        {/* Preset Subjects & Grades Quick Select Buttons */}
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {/* Quick Subject Teacher Pickers */}
                          <button
                            type="button"
                            onClick={() => handleSelectSubjectGroup('اللغة العربية')}
                            className="px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold transition-all"
                          >
                            📖 مدرسات اللغة العربية
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectSubjectGroup('الفيزياء')}
                            className="px-2 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold transition-all"
                          >
                            ⚡ مدرسات الفيزياء
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectSubjectGroup('الكيمياء')}
                            className="px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold transition-all"
                          >
                            🧪 مدرسات الكيمياء
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectSubjectGroup('الرياضيات')}
                            className="px-2 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold transition-all"
                          >
                            📐 مدرسات الرياضيات
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectSubjectGroup('الأحياء')}
                            className="px-2 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 font-bold transition-all"
                          >
                            🧬 مدرسات الأحياء
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectSubjectGroup('الإنجليزية')}
                            className="px-2 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold transition-all"
                          >
                            🔤 مدرسات الإنجليزية
                          </button>

                          {/* Quick Grade + Parent Pickers */}
                          <button
                            type="button"
                            onClick={() => handleSelectGradeGroup('الصف السادس العلمي')}
                            className="px-2 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold transition-all"
                          >
                            🎓 طالبات وأولياء أمور السادس العلمي
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectGradeGroup('الصف الخامس العلمي')}
                            className="px-2 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold transition-all"
                          >
                            🎓 طالبات وأولياء أمور الخامس العلمي
                          </button>
                        </div>
                      </div>

                      {/* Directory Filter Bar & Search */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Search */}
                        <div className="relative col-span-1 sm:col-span-1">
                          <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="بحث بالاسم أو المادة..."
                            value={recipientSearchQuery}
                            onChange={(e) => setRecipientSearchQuery(e.target.value)}
                            className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-white border border-slate-300 text-[11px] font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Role Filter Tabs */}
                        <div className="col-span-1 sm:col-span-2 flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                          <button
                            type="button"
                            onClick={() => setRecipientRoleFilter('all')}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
                              recipientRoleFilter === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            الكل ({possibleRecipients.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecipientRoleFilter('teacher')}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
                              recipientRoleFilter === 'teacher'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            👩‍🏫 المدرسات ({teachers.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecipientRoleFilter('student')}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
                              recipientRoleFilter === 'student'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            👩‍🎓 الطالبات ({students.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecipientRoleFilter('parent')}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
                              recipientRoleFilter === 'parent'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            👨‍👩‍👧 أولياء الأمور ({parents.length})
                          </button>
                        </div>
                      </div>

                      {/* Scrollable Recipient Checklist */}
                      <div className="max-h-52 overflow-y-auto rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 shadow-inner">
                        {filteredRecipients.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 font-bold text-[11px]">
                            لا يوجد مستلمون يطابقون شروط البحث والتصفية
                          </div>
                        ) : (
                          filteredRecipients.map((rec) => {
                            const isSelected = selectedReceiverIds.includes(rec.id);
                            return (
                              <div
                                key={rec.id}
                                onClick={() => toggleReceiverId(rec.id)}
                                className={`p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-indigo-50/90' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleReceiverId(rec.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 shrink-0 cursor-pointer"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-slate-900 text-[11px] truncate">
                                        {rec.rawName || rec.name}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] shrink-0 ${
                                        rec.roleBadge === 'teacher'
                                          ? 'bg-sky-100 text-sky-800'
                                          : rec.roleBadge === 'student'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : rec.roleBadge === 'parent'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-purple-100 text-purple-800'
                                      }`}>
                                        {rec.roleStr}
                                      </span>
                                    </div>

                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                      {rec.roleBadge === 'teacher' && `مدرسة ${rec.subject}`}
                                      {rec.roleBadge === 'student' && `${rec.gradeLevel} — ولي الأمر: ${(rec as any).parentName || 'غير مسجل'}`}
                                      {rec.roleBadge === 'parent' && `${rec.gradeLevel} — الطالبة: ${(rec as any).studentName || 'غير مسجل'}`}
                                      {rec.roleBadge === 'admin' && 'إدارة المدرسة والمديرة العامة'}
                                    </p>
                                  </div>
                                </div>

                                {/* Direct Pair Action (e.g. + ولي الأمر / + الطالبة) */}
                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  {rec.roleBadge === 'student' && (
                                    <button
                                      type="button"
                                      onClick={() => toggleStudentAndParent(rec.id)}
                                      className="px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-[10px] transition-all flex items-center gap-1"
                                      title="تحديد الطالبة وولي أمرها سوية"
                                    >
                                      <span>👨‍👩‍👧</span>
                                      <span>+ ولي الأمر</span>
                                    </button>
                                  )}
                                  {rec.roleBadge === 'parent' && (
                                    <button
                                      type="button"
                                      onClick={() => toggleParentAndStudent(rec.id)}
                                      className="px-2 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-[10px] transition-all flex items-center gap-1"
                                      title="تحديد ولي الأمر والطالبة سوية"
                                    >
                                      <span>👩‍🎓</span>
                                      <span>+ الطالبة</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Select All Filtered / Deselect Buttons */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>تظهر {filteredRecipients.length} من أصل {possibleRecipients.length} مستلم</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAllFiltered}
                            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                          >
                            تحديد الكل في هذه القائمة
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={handleClearAllSelected}
                            className="text-rose-600 hover:text-rose-800 font-bold hover:underline"
                          >
                            إلغاء التحديد
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">عنوان موضوع المراسلة *</label>
                  <input
                    type="text"
                    required
                    placeholder="أدخلي موضوع الكتاب أو الرسالة..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>

                {/* Content Body */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نص المراسلة التفصيلي *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="اكتبي نص الرسالة أو القرار الإداري هنا مع كافة التفاصيل..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 text-xs resize-none"
                  />
                </div>

                {/* Copies To Section (نسخة منه إلى) */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                      <span>📑</span>
                      <span>نسخة منه إلى (قائمة التوجيه الرسمية):</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {copiesTo.length === 0
                          ? 'بدون نسخة إلى (فارغة - لن تظهر في الكتاب الرسمي)'
                          : `${copiesTo.length} جهة محددة`}
                      </span>
                      {copiesTo.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCopiesTo([])}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline"
                          title="مسح جميع الجهات من قائمة نسخة منه إلى"
                        >
                          مسح الكل
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preset Quick Toggle Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COPIES_TO.map((preset, idx) => {
                      const isSelected = copiesTo.includes(preset);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleToggleCopyTo(preset)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {preset.split('/')[0]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Add Copy Input */}
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="إضافة جهة أو قسم آخر (مثال: وحدة النشاط المدرسي)..."
                      value={newCopyInput}
                      onChange={(e) => setNewCopyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomCopy();
                        }
                      }}
                      className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCopy}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0"
                    >
                      إضافة
                    </button>
                  </div>

                  {/* Active Selected Copies List Tags */}
                  {copiesTo.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {copiesTo.map((c, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-900 font-bold text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          <span>• {c}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleCopyTo(c)}
                            className="p-0.5 hover:text-rose-600 text-slate-400 mr-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attachments Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                      <Paperclip className="w-4 h-4 text-indigo-600" />
                      <span>المرفقات والملفات الرسمية ({composerAttachments.length}):</span>
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Real Local File Picker */}
                      <label className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-sm transition-all">
                        <span>📁 اختيار ملف من الجهاز</span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleAddSampleAttachment('pdf')}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 text-indigo-900 font-bold text-[10px] border border-slate-200"
                      >
                        + إرفاق PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSampleAttachment('image')}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 text-indigo-900 font-bold text-[10px] border border-slate-200"
                      >
                        + إرفاق صورة
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSampleAttachment('doc')}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 text-indigo-900 font-bold text-[10px] border border-slate-200"
                      >
                        + إرفاق مستند
                      </button>
                    </div>
                  </div>

                  {composerAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {composerAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-2 text-xs font-bold text-indigo-950 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{att.fileName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({att.fileSize})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-0.5 hover:text-rose-600 text-slate-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Actions Toolbar */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDraftSubmit}
                      className="px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <FileText className="w-4 h-4 text-amber-700" />
                      <span>حفظ كمسودة</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePreviewMessage}
                      className="px-4 py-2.5 rounded-2xl bg-indigo-100 hover:bg-indigo-200 text-indigo-950 font-bold text-xs border border-indigo-300/80 flex items-center gap-1.5 transition-all shadow-sm hover:scale-105"
                      title="معاينة المراسلة أو الكتاب الرسمية بالهيدر والختم والتنسيق النهائي قبل الإرسال"
                    >
                      <Eye className="w-4 h-4 text-indigo-700" />
                      <span>معاينة قبل الإرسال 👁️</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsComposerOpen(false)}
                      className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                    >
                      إلغاء
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {editingDraftId && messages.find((m) => m.id === editingDraftId && !m.isDraft)
                          ? 'حفظ التعديلات وتحديث الكتاب'
                          : 'إرسال وتوثيق المراسلة'}
                      </span>
                    </button>
                  </div>
                </div>

              </form>

            </div>

          </div>
        </div>
      )}

      {/* Printable Official Document Modal */}
      {printingMessage && (
        <div className="fixed inset-0 z-[100] flex justify-center items-start sm:items-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn font-arabic print:p-0 print:bg-white">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-300 p-4 sm:p-6 space-y-4 my-auto text-slate-900 print:max-h-none print:my-0 print:p-0 print:border-none print:shadow-none">
            
            {/* Top Modal Close & Print Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 shrink-0 print:hidden">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>
                  {isComposerOpen
                    ? '👁️ معاينة شكل الكتاب الرسمي والرسالة المطبوعة قبل الإرسال النهائي'
                    : 'معاينة الطباعة الرسمية وتخصيص الكتاب المعتمد قبل التصدير'}
                </span>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {isComposerOpen && (
                  <button
                    type="button"
                    onClick={(e) => {
                      setPrintingMessage(null);
                      handleSendSubmit(e as any);
                    }}
                    className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                    title="تأكيد المراسلة وإرسالها فوراً"
                  >
                    <Send className="w-4 h-4" />
                    <span>تأكيد الإرسال والتوثيق 🚀</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    const letterEl = document.getElementById('official-letter-print-frame');
                    if (letterEl) {
                      const serial = (printingMessage.serialNumber || 'كتاب_رسمي').replace(/[/\\?%*:|"<>]/g, '_');
                      await downloadElementAsPdf(letterEl, {
                        fileName: `كتاب_رسمي_${serial}.pdf`,
                        scale: 2,
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                  title="تنزيل وتخزين كتاب PDF مباشرة على جهازك"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل كملف PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة (A4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintingMessage(null)}
                  className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-all cursor-pointer"
                  title="إغلاق المعاينة والعودة لصفحة الإنشاء"
                >
                  <X className="w-4 h-4" />
                  <span>{isComposerOpen ? 'العودة للتعديل ✏️' : 'إغلاق المعاينة'}</span>
                </button>
              </div>
            </div>

            {/* Quick Live Editing Bar before Printing (print:hidden) */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 shrink-0 print:hidden text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>أدوات التعديل الفوري للكتاب المطبوع (الشعار، التاريخ، العدد، والموجه إليهم):</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  التعديلات هنا تطبق فورياً على المعاينة المطبوعة
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {/* Switch Logo */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">رفع صورة الشعار الرسمي:</label>
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="w-full p-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    title="فتح المستكشف لاختيار صورة الشعار من جهازك"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع / تغيير صورة الشعار 📁</span>
                  </button>
                </div>

                {/* Edit Serial Number */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">تعديل رقم الصادر (العدد):</label>
                  <input
                    type="text"
                    value={printingMessage.serialNumber || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrintingMessage((prev) => prev ? { ...prev, serialNumber: val } : null);
                    }}
                    placeholder="م.ت/2026/842"
                    className="w-full p-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-[11px] text-slate-900 dir-ltr text-right"
                  />
                </div>

                {/* Edit Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">تعديل تاريخ الكتاب:</label>
                  <input
                    type="text"
                    value={printingMessage.letterDate || printingMessage.timestamp.split(' ')[0]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrintingMessage((prev) => prev ? { ...prev, letterDate: val } : null);
                    }}
                    placeholder="2026/08/06"
                    className="w-full p-2 rounded-xl bg-white border border-slate-300 font-mono font-bold text-[11px] text-slate-900 dir-ltr text-right"
                  />
                </div>

                {/* Edit Sender Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">اسم مرسل الكتاب (التوقيع):</label>
                  <input
                    type="text"
                    value={printingMessage.senderName || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrintingMessage((prev) => prev ? { ...prev, senderName: val } : null);
                    }}
                    placeholder="اسم المرسل"
                    className="w-full p-2 rounded-xl bg-white border border-slate-300 font-bold text-[11px] text-slate-900"
                  />
                </div>

                {/* Add Quick CC Destination */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">إضافة نسخة منه إلى:</label>
                  <button
                    type="button"
                    onClick={() => {
                      const customCopy = prompt('أدخلي اسم الجهة التي يراد إضافة نسخة الكتاب إليها:', 'قسم الإشراف التربوي / تربية ميسان');
                      if (customCopy && customCopy.trim()) {
                        setPrintingMessage((prev) => {
                          if (!prev) return null;
                          const currentCopies = prev.copiesTo || [];
                          return { ...prev, copiesTo: [...currentCopies, customCopy.trim()] };
                        });
                      }
                    }}
                    className="w-full p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-[11px] border border-indigo-200 transition-colors"
                  >
                    + إضافة جهة توجيه
                  </button>
                </div>
              </div>
            </div>

            {/* Authentic Ministry Letterhead Frame (Scrollable Container) */}
            <div id="official-letter-print-frame" className="border-4 border-double border-slate-800 p-5 sm:p-7 space-y-5 bg-amber-50/10 relative overflow-y-auto flex-1 rounded-xl print:border-4 print:overflow-visible print:bg-transparent">
              
              {/* Ministry Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 text-xs font-bold text-slate-900 leading-tight">
                <div className="space-y-1 text-right">
                  <p className="text-sm font-black">جمهورية العراق</p>
                  <p>وزارة التربية</p>
                  <p>المديرية العامة لتربية ميسان</p>
                  <p className="text-indigo-900 font-extrabold">ثانوية ميسان للمتميزات</p>
                </div>

                <div 
                  onClick={() => logoFileInputRef.current?.click()}
                  className="text-center space-y-1 cursor-pointer group hover:scale-105 transition-all"
                  title="اضغطي هنا لاختيار وتغيير صورة الشعار الرسمية من مستكشف الجهاز"
                >
                  <div className="relative inline-block">
                    {renderOfficialLogoGraphic(printingMessage.logoUrl, customLogoUrl, "w-16 h-16")}
                  </div>
                  <p className="text-[10px] text-slate-600 font-mono pt-1 group-hover:text-amber-800 underline decoration-dashed print:no-underline">
                    جمهورية العراق — وزارة التربية
                  </p>
                </div>

                <div className="space-y-1 text-left font-mono dir-ltr">
                  <p>العدد: {printingMessage.serialNumber || 'م.ت / 2026 / 842'}</p>
                  <p>التاريخ: {printingMessage.letterDate || printingMessage.timestamp.split(' ')[0]}</p>
                  <p>المرفقات: {printingMessage.attachments?.length || 0}</p>
                </div>
              </div>

              {/* Subject Title */}
              <div className="text-center py-2 space-y-1">
                <h2 className="text-lg font-black text-slate-950 underline decoration-indigo-600 decoration-2 underline-offset-8">
                  م / {printingMessage.subject}
                </h2>
                {printingMessage.priority === 'عاجل وسري' && (
                  <span className="text-xs font-bold text-rose-700 font-mono block">(عاجل وسري جداً)</span>
                )}
              </div>

              {/* Recipient Line */}
              <div className="text-sm font-bold text-slate-900">
                إلى / <span className="font-extrabold text-indigo-950">{printingMessage.receiverName}</span> المحترم/ة ...
              </div>

              {/* Body Text */}
              <div className="text-sm leading-loose text-slate-900 font-medium whitespace-pre-wrap py-4 min-h-[160px]">
                {printingMessage.content}
              </div>

              {/* Attachments list if any */}
              {printingMessage.attachments && printingMessage.attachments.length > 0 && (
                <div className="py-2 border-t border-slate-200 text-xs">
                  <span className="font-bold text-slate-800">المرفقات الرسمية ({printingMessage.attachments.length}):</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {printingMessage.attachments.map((att) => (
                      <span key={att.id} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-300">
                        📎 {att.fileName} ({att.fileSize})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Closing Remark */}
              <div className="text-center font-bold text-sm text-slate-900 py-2">
                وتفضلوا بقبول فائق الاحترام والتقدير ...
              </div>

              {/* Signatures & Seal Block */}
              <div className="pt-8 flex items-end justify-between border-t border-slate-300">
                {/* Copies To Block (نسخة منه إلى) - only displayed when copies are explicitly present */}
                {printingMessage.copiesTo && printingMessage.copiesTo.length > 0 ? (
                  <div className="text-right space-y-1 text-xs max-w-xs">
                    <p className="font-bold text-slate-900 underline">نسخة منه إلى:</p>
                    {printingMessage.copiesTo.map((c, idx) => (
                      <p key={idx} className="text-slate-700 text-[11px] font-medium">• {c}</p>
                    ))}
                  </div>
                ) : (
                  <div />
                )}

                {/* Official Stamp & Sender Signature (Dynamic per sender) */}
                {(() => {
                  const senderDetails = getSenderSignatureDetails(printingMessage);
                  return (
                    <div className="text-center space-y-1 relative min-w-[200px]">
                      <p className="font-black text-sm text-slate-950">{senderDetails.name}</p>
                      <p className="text-xs font-bold text-indigo-900">{senderDetails.title}</p>

                      {/* Stamp Graphic */}
                      <div className="absolute -top-6 right-1/2 translate-x-1/2 w-28 h-28 border-4 border-dashed border-rose-600/40 rounded-full flex items-center justify-center rotate-12 pointer-events-none opacity-80">
                        <div className="text-[9px] font-black text-rose-800 text-center leading-tight">
                          <p>جمهورية العراق</p>
                          <p className="font-bold">ثانوية ميسان للمتميزات</p>
                          <p>{senderDetails.sealText}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Bottom Modal Action Toolbar (Hidden during actual print) */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <span className="text-xs text-slate-500 font-medium">
                💡 نصيحة: يمكنك الاستفادة من خيارات الطباعة المتاحة في المتصفح للحفظ بصيغة PDF مباشرة.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const letterEl = document.getElementById('official-letter-print-frame');
                    if (letterEl) {
                      const serial = (printingMessage.serialNumber || 'كتاب_رسمي').replace(/[/\\?%*:|"<>]/g, '_');
                      await downloadElementAsPdf(letterEl, {
                        fileName: `كتاب_رسمي_${serial}.pdf`,
                        scale: 2,
                      });
                    }
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل وحفظ كـ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة ورقية (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingMessage(null)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-300" />
                  <span>إغلاق نافذة المعاينة</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Hidden File Input for Official Logo Picker */}
      <input
        type="file"
        ref={logoFileInputRef}
        accept="image/*"
        onChange={handleLogoFileChange}
        className="hidden"
      />

    </div>
  );
};
