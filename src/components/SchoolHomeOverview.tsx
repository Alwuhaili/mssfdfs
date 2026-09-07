/**
 * Complete Interactive School Home Overview Component
 * الصفحة الرئيسية الشاملة لمدرسة ثانوية ميسان للمتميزات
 * تتضمن: الأخبار، المهرجانات، معرض الصور، لوحة الشرف لكل صف، سياسة والزي الرسمي وساعات الدوام،
 * صور وانجازات المديرة والهيئة التدريسية، والألعاب والمنافسات والتحديات.
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { EditHonorStudentModal } from './EditHonorStudentModal';
import { EditFacultyModal, FacultyMember } from './EditFacultyModal';
import { EditSchoolAdminModal } from './EditSchoolAdminModal';
import { QuickEditPrincipalModal } from './QuickEditPrincipalModal';
import { EditNewsEventsModal, NewsItem } from './EditNewsEventsModal';
import { EditGalleryModal } from './EditGalleryModal';
import {
  Trophy,
  Crown,
  Award,
  BookOpen,
  Sparkles,
  Calendar,
  Clock,
  Shirt,
  ShieldCheck,
  Users,
  CheckCircle2,
  Zap,
  Play,
  Image as ImageIcon,
  Search,
  Star,
  FileText,
  Camera,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  X,
  School,
  MapPin,
  Bookmark,
  Activity,
  Flame,
  HelpCircle,
  BarChart3,
  Lightbulb,
  Palette,
  Target,
  Medal,
  Cpu,
  GraduationCap,
  Edit3,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpZA,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';

// Honor Roll Data for ALL 6 Grades (3 Students each)
interface HonorStudent {
  rank: 1 | 2 | 3;
  name: string;
  grade: string;
  section: string;
  gpa: number;
  avatar: string;
  specialty: string;
  dream: string;
}

const HONOR_ROLL_DATA: Record<string, HonorStudent[]> = {
  'الصف الأول المتوسط': [
    {
      rank: 1,
      name: 'مريم محمد الساعدي',
      grade: 'الصف الأول المتوسط',
      section: 'أ',
      gpa: 99.8,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      specialty: 'الرياضيات والذكاء الإصطناعي',
      dream: 'مهندسة ذكاء اصطناعي وطبيبة مستقبلية',
    },
    {
      rank: 2,
      name: 'زينب أحمد الكعبي',
      grade: 'الصف الأول المتوسط',
      section: 'ب',
      gpa: 99.4,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      specialty: 'العلوم والأحياء التفاعلية',
      dream: 'باحثة في علوم الجينات والوراثة',
    },
    {
      rank: 3,
      name: 'زهراء حيدر البهادلي',
      grade: 'الصف الأول المتوسط',
      section: 'أ',
      gpa: 99.1,
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
      specialty: 'الفيزياء والابتكار الهندي',
      dream: 'مبتكرة في عالم الفيزياء الفلكية',
    },
  ],
  'الصف الثاني المتوسط': [
    {
      rank: 1,
      name: 'آية مرتضى الموسوي',
      grade: 'الصف الثاني المتوسط',
      section: 'أ',
      gpa: 99.9,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      specialty: 'أولمبياد الرياضيات والشطرنج',
      dream: 'عالمة رياضيات وبرمجيات معقدة',
    },
    {
      rank: 2,
      name: 'فاطمة جاسم العبيدي',
      grade: 'الصف الثاني المتوسط',
      section: 'ج',
      gpa: 99.5,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      specialty: 'الكيمياء الخضراء والبيئة',
      dream: 'مهندسة كيميائية تخصص طاقة نظيفة',
    },
    {
      rank: 3,
      name: 'رقية عمار الزبيدي',
      grade: 'الصف الثاني المتوسط',
      section: 'ب',
      gpa: 99.2,
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
      specialty: 'الروبوتات واللغات الأجنبية',
      dream: 'مخترعة روبوتات طبية دقيقة',
    },
  ],
  'الصف الثالث المتوسط': [
    {
      rank: 1,
      name: 'هدى صادق التميمي',
      grade: 'الصف الثالث المتوسط',
      section: 'أ',
      gpa: 99.8,
      avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&auto=format&fit=crop&q=80',
      specialty: 'البرمجة والخوارزميات',
      dream: 'مؤسسة شركة تقنية للذكاء الاصطناعي',
    },
    {
      rank: 2,
      name: 'نور الهدى كريم المحمداوي',
      grade: 'الصف الثالث المتوسط',
      section: 'ب',
      gpa: 99.6,
      avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&auto=format&fit=crop&q=80',
      specialty: 'الفيزياء والتفكير التحليلي',
      dream: 'عالمة فيزياء نووية سلمية',
    },
    {
      rank: 3,
      name: 'بنين علي الخزعلي',
      grade: 'الصف الثالث المتوسط',
      section: 'أ',
      gpa: 99.3,
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80',
      specialty: 'البلاغة والخط العربي والأحياء',
      dream: 'جراحة عصبية ودكتورة جامعية',
    },
  ],
  'الصف الرابع العلمي': [
    {
      rank: 1,
      name: 'زهراء خالد العلي',
      grade: 'الصف الرابع العلمي',
      section: 'أ',
      gpa: 99.7,
      avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&auto=format&fit=crop&q=80',
      specialty: 'الفيزياء الفلكية والتفاضل',
      dream: 'مهندسة طيران وفضاء',
    },
    {
      rank: 2,
      name: 'طيبة فاضل السعدون',
      grade: 'الصف الرابع العلمي',
      section: 'ب',
      gpa: 99.3,
      avatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&auto=format&fit=crop&q=80',
      specialty: 'الكيمياء العضوية والأبحاث',
      dream: 'دكتورة صيدلة صناعية ابتشارية',
    },
    {
      rank: 3,
      name: 'شهد ثامر السوداني',
      grade: 'الصف الرابع العلمي',
      section: 'أ',
      gpa: 99.0,
      avatar: 'https://images.unsplash.com/photo-1534751516642-a171e261f52c?w=400&auto=format&fit=crop&q=80',
      specialty: 'الأحياء الجزيئية والمختبرات',
      dream: 'طبيبة أورام وأبحاث سريرية',
    },
  ],
  'الصف الخامس العلمي': [
    {
      rank: 1,
      name: 'زينب سعد المحمداوي',
      grade: 'الصف الخامس العلمي',
      section: 'أ',
      gpa: 99.9,
      avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
      specialty: 'الذكاء الاصطناعي والكيمياء النانوية',
      dream: 'جراحة قلب ومخترعة أجهزة طبية',
    },
    {
      rank: 2,
      name: 'مريم حيدر الخزرجي',
      grade: 'الصف الخامس العلمي',
      section: 'ب',
      gpa: 99.6,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      specialty: 'الرياضيات التطبيقية والبرمجة',
      dream: 'عالمة بيانات وتشفر سيبراني',
    },
    {
      rank: 3,
      name: 'دعاء حسين البهادلي',
      grade: 'الصف الخامس العلمي',
      section: 'أ',
      gpa: 99.2,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      specialty: 'الفيزياء الكهربية والهندسة',
      dream: 'مهندسة ميكاترونكس وروبوتات',
    },
  ],
  'الصف السادس العلمي': [
    {
      rank: 1,
      name: 'نغم علي الكعبي',
      grade: 'الصف السادس العلمي',
      section: 'أ',
      gpa: 99.8,
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80',
      specialty: 'الفيزياء الحديثة والكيمياء',
      dream: 'طبيبة جراحة أعصاب متقدمة',
    },
    {
      rank: 2,
      name: 'فاطمة الزهراء عادل',
      grade: 'الصف السادس العلمي',
      section: 'ب',
      gpa: 99.4,
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      specialty: 'الرياضيات المتقدمة والإنجليزية',
      dream: 'مهندسة برمجيات وذكاء اصطناعي',
    },
    {
      rank: 3,
      name: 'روان عمار الساعدي',
      grade: 'الصف السادس العلمي',
      section: 'أ',
      gpa: 99.1,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      specialty: 'الأحياء الجزيئية وعلم الخلية',
      dream: 'طبيبة أسنان وباحثة تقنيات حيوية',
    },
  ],
};

// Faculty Members & Academic Achievements Initial Data
const FACULTY_MEMBERS: FacultyMember[] = [
  {
    id: 'f_1',
    name: 'أ. د. سناء جاسم المحمداوي',
    roleTitle: 'كبير مدرسي الفيزياء والفيزياء الفلكية',
    subject: 'الفيزياء المتقدمة والفيزياء النووية',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    degree: 'دكتوراه في فيزياء الحالة الصلبة',
    researchCount: 6,
    booksCount: 3,
    gamesCount: 4,
    achievements: [
      'تأليف كتاب "مدخل إلى الميكانيكا الكوانتية للمتميزات"',
      'ابتكار 4 ألعاب تفاعلية لمحاكاة الحركة الدائرية والمجالات المغناطيسية',
      'نشر بحث محكم حول تطبيقات أشباه الموصلات النانوية في مجلة العلوم العراقية',
    ],
  },
  {
    id: 'f_2',
    name: 'أ. م. رنا حيدر البهادلي',
    roleTitle: 'رئيس قسم الرياضيات وأولمبياد التفوق',
    subject: 'الرياضيات المتقدمة والتفاضل والتكامل',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    degree: 'ماجستير في الرياضيات التطبيقية والخوارزميات',
    researchCount: 4,
    booksCount: 2,
    gamesCount: 5,
    achievements: [
      'ابتكار حقيبة "تحدي الشطرنج والمصفوفات الرياضية"',
      'تصميم 5 ألعاب منطقية إلكترونية لحساب التكامل والتفاضل',
      'تدريب الفريق الفائز بالمركز الأول في أولمبياد الرياضيات الوطني',
    ],
  },
  {
    id: 'f_3',
    name: 'أ. زينب كاظم الخفاجي',
    roleTitle: 'مشرفة مختبر الكيمياء والبيئة النانوية',
    subject: 'الكيمياء العضوية والتحليلية',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    degree: 'ماجستير في الكيمياء التحليلية والبيئية',
    researchCount: 5,
    booksCount: 2,
    gamesCount: 3,
    achievements: [
      'تأليف دليل "تجارب الكيمياء الخضراء والمستدامة للمدارس"',
      'ابتكار لعبة تركيب المركبات والروابط التساهمية ثلاثية الأبعاد',
      'الحصول على وسام التميز في مهرجان المبتكرين لعام 2025',
    ],
  },
  {
    id: 'f_4',
    name: 'أ. هدى صباح التميمي',
    roleTitle: 'مسؤولة وحدة البرمجة والذكاء الاصطناعي',
    subject: 'الحاسوب والذكاء الاصطناعي والروبوتيكس',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    degree: 'بكالوريوس علوم حاسوب وهندسة البرمجيات',
    researchCount: 3,
    booksCount: 1,
    gamesCount: 8,
    achievements: [
      'برمجة 8 ألعاب وتحديات برمجية تعليمية تفاعلية',
      'إشراف على مشاريع الذكاء الاصطناعي الفائزة بالمعرض العلمي للمدرسة',
      'تأليف ملزمة "البرمجة بلغة بايثون ومفاهيم الآلة للطالبات"',
    ],
  },
  {
    id: 'f_5',
    name: 'أ. مريم عادل السعدي',
    roleTitle: 'مدرسة أولى للأحياء والعلوم الطبية الحيوية',
    subject: 'علم الأحياء والوراثة الخلوية',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    degree: 'ماجستير في التقنيات الحيوية والجينوم',
    researchCount: 3,
    booksCount: 1,
    gamesCount: 4,
    achievements: [
      'تصميم نموذج تفاعلي ثلاثي الأبعاد لدراسة الشيفرة الوراثية وتضاعف DNA',
      'إعداد حقيبة تدريبية للتحضير للأولمبياد البيولوجي الدولي',
      'نشر دراسة حول التنوع الحيوي في أهوار ميسان',
    ],
  },
];

// News & Events Data
const NEWS_EVENTS_DATA: NewsItem[] = [
  {
    id: 'n1',
    title: 'افتتاح مهرجان ميسان الثاني للابتكار والذكاء الاصطناعي 2026',
    category: 'مهرجانات',
    date: '01 أغسطس 2026',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    summary: 'برعاية مديرية تربية ميسان، افتتحت المدرسة المهرجان السنوي للابتكار وتطبيقات الذكاء الاصطناعي بمشاركة أكثر من 40 مشروعاً برمجياً وهندسياً للطالبات.',
    fullContent: 'شهدت ثانوية ميسان للمتميزات انطلاق المهرجان السنوي للابتكار والذكاء الاصطناعي، بحضور شخصيات أكاديمية وتربوية بارزة. وتضمن المهرجان مشاريع متقدمة تشمل روبوتات الخدمة الطبية، وأنظمة الري الذاتي بالطاقة الشمسية، وتطبيقات ذكية لم مساعدة ذوي الاحتياجات الخاصة، من إعداد طالبات الصفين الخامس والسادس العلمي تحت إشراف الهيئة التدريسية.',
    location: 'القاعة الكبرى للمؤتمرات - ثانوية ميسان للمتميزات',
    organizer: 'إدارة المدرسة ودائرة الموهوبين والابتكار الرقمي',
  },
  {
    id: 'n2',
    title: 'انطلاق المعرض العلمي السنوي للفيزياء والكيمياء والتقنيات الحيوية',
    category: 'معارض علمية',
    date: '28 يوليو 2026',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
    summary: 'عرض 30 تجربة علمية ابتكارية ونماذج نانوية لمعالجة البيئة في المعرض العلمي المميز بحضور أسر الطالبات.',
    fullContent: 'استعرضت طالبات المدرسة تجارب حية في الكيمياء الخضراء وتصنيع المستحضرات الطبيعية، إلى جانب محاكاة التفاعلات النووية السليمة ونماذج توليد الطاقة الكهربائية من الرياح والموجات الصوتية. وأشاد زوار المعرض بالدقة العملية والتفكير النظري المتقدم لطالبات المتميزات.',
    location: 'المختبرات العلمية الحديثة بالمدرسة',
    organizer: 'قسم العلوم الطبيعية والهيئة التدريسية',
  },
  {
    id: 'n3',
    title: 'تتويج طالبات الثانوية ببطولة الشطرنج واللياقة المدرسية لمحافظة ميسان',
    category: 'رياضة',
    date: '20 يوليو 2026',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=80',
    summary: 'حصدت الطالبات المراكز الثلاثة الأولى في بطولة الشطرنج ومنافسات التنس والكرة الطائرة على مستوى مدارس المحافظة.',
    fullContent: 'في إنجاز رياضي جديد، أحرزت طالبات ثانوية ميسان للمتميزات كأس البطولة المدرسية للشطرنج الاستراتيجي وبطولة الريشة الطائرة، مؤكدات أن التفوق الأكاديمي والرياضي يسيران يداً بيد لرفعة المدرسة وتنمية مهارات التفكير الذهني والبدني.',
    location: 'القاعة الرياضية المغلقة بمديرية التربية',
    organizer: 'قسم التربية الرياضية والكشوفات المدرسية',
  },
  {
    id: 'n4',
    title: 'حفل تكريم الطالبات الأوائل والمتفوقات في الامتحانات الوزارية والتجريبية',
    category: 'تكريم',
    date: '15 يوليو 2026',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    summary: 'منح أوسمة التميز وشهادات التقدير والدروع الذهبية للطالبات الحاصلات على معدل 99% فأكثر.',
    fullContent: 'أقامت إدارة المدرسة احتفالاً بهيجاً لتكريم أوائل المراحل الدراسية بحضور مديرة المدرسة الأستاذة الهام صبيح سعدون وأولياء الأمور. وتم توزيع دروع المتفوقات وأوسمة التميز الأكاديمي وسط أجواء مليئة بالافتخار والاعتزاز.',
    location: 'مسرح المدرسة الكلي',
    organizer: 'إدارة المدرسة ومجلس أولياء الأمور',
  },
];

// Photo Gallery Category Data
interface GalleryPhoto {
  id: string;
  title: string;
  category: 'المختبرات العلمية' | 'المهرجانات والفعاليات' | 'الابتكارات والهندسة' | 'الأنشطة الرياضية';
  url: string;
  date: string;
  desc: string;
}

const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'g1',
    title: 'مختبر الفيزياء والفيزياء الفلكية الذكي',
    category: 'المختبرات العلمية',
    url: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&auto=format&fit=crop&q=80',
    date: '2026',
    desc: 'طالبات الصف السادس العلمي أثناء إجراء تجارب البصريات ومطياف الليزر المتقدم.',
  },
  {
    id: 'g2',
    title: 'المعرض الهندسي وروبوتات الخدمة',
    category: 'الابتكارات والهندسة',
    url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    date: '2026',
    desc: 'عرض مشاريع الروبوتات والذكاء الاصطناعي المصممة بأيدي طالبات المتميزات.',
  },
  {
    id: 'g3',
    title: 'بطولة الشطرنج الاستراتيجي للمتميزات',
    category: 'الأنشطة الرياضية',
    url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=80',
    date: '2026',
    desc: 'جانب من منافسات الشطرنج والتفكير الاستراتيجي في القاعة المغلقة.',
  },
  {
    id: 'g4',
    title: 'مختبر الكيمياء والنانوتكنولوجي',
    category: 'المختبرات العلمية',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
    date: '2026',
    desc: 'تجارب تحليل المواد الكيميائية واكتشاف المكونات النانوية التفاعلية.',
  },
  {
    id: 'g5',
    title: 'حفل رفع العلم وافتتاح المهرجان السنوي',
    category: 'المهرجانات والفعاليات',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    date: '2026',
    desc: 'تجمع طالبات المدرسة والهيئة التدريسية في حفل افتتاح الأنشطة السنوية.',
  },
  {
    id: 'g6',
    title: 'فريق كرة السلة والياقة البدنية',
    category: 'الأنشطة الرياضية',
    url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
    date: '2026',
    desc: 'فريق ثانوية ميسان الحاصل على بطولة المدارس في كرة السلة والرياضة.',
  },
];

export const SchoolHomeOverview: React.FC = () => {
  const { lang, role, schoolAdminData, updateSchoolAdminData } = useApp();
  const [isEditSchoolAdminModalOpen, setIsEditSchoolAdminModalOpen] = useState(false);
  const principalFileInputRef = useRef<HTMLInputElement>(null);

  const handlePrincipalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          updateSchoolAdminData({ principalImageUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHonorStudentAvatarUpload = (studentRank: 1 | 2 | 3, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const newAvatar = reader.result;
        setHonorRollData((prev) => {
          const currentList = prev[selectedHonorGrade] || HONOR_ROLL_DATA[selectedHonorGrade] || [];
          const updatedList = currentList.map((st) => (st.rank === studentRank ? { ...st, avatar: newAvatar } : st));
          const nextData = { ...prev, [selectedHonorGrade]: updatedList };
          try {
            localStorage.setItem('maysan_honor_roll_v2', JSON.stringify(nextData));
          } catch (e) {
            console.error('Failed to save honor roll to storage', e);
          }
          return nextData;
        });
        setSaveToast('تم تحديث صورة الطالبة المتفوقة بنجاح 📸');
        setTimeout(() => setSaveToast(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Honor Roll Data State with localStorage persistence
  const [honorRollData, setHonorRollData] = useState<Record<string, HonorStudent[]>>(() => {
    try {
      const saved = localStorage.getItem('maysan_honor_roll_v2');
      return saved ? JSON.parse(saved) : HONOR_ROLL_DATA;
    } catch (e) {
      return HONOR_ROLL_DATA;
    }
  });

  // Honor Roll Admin Editing State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRankToEdit, setSelectedRankToEdit] = useState<1 | 2 | 3>(1);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Selected Grade for Honor Roll Tab
  const [selectedHonorGrade, setSelectedHonorGrade] = useState<string>('الصف السادس العلمي');

  const handleSaveHonorStudent = (updatedStudent: HonorStudent) => {
    setHonorRollData((prev) => {
      const list = prev[selectedHonorGrade] || HONOR_ROLL_DATA[selectedHonorGrade] || [];
      const updatedList = list.map((st) => (st.rank === updatedStudent.rank ? updatedStudent : st));
      const next = { ...prev, [selectedHonorGrade]: updatedList };
      try {
        localStorage.setItem('maysan_honor_roll_v2', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to persist honor roll data', e);
      }
      return next;
    });
    setSaveToast(`تم تحديث بيانات الطالبة "${updatedStudent.name}" في لوحة الشرف بنجاح! 🏆`);
    setTimeout(() => setSaveToast(null), 4500);
  };

  const handleResetHonorRoll = () => {
    if (window.confirm('هل أنت تأكد من إعادة تعيين لوحة الشرف إلى البيانات الافتراضية؟')) {
      setHonorRollData(HONOR_ROLL_DATA);
      try {
        localStorage.removeItem('maysan_honor_roll_v2');
      } catch (e) {}
      setSaveToast('تمت إعادة تعيين لوحة الشرف إلى البيانات الأصلية الافتراضية.');
      setTimeout(() => setSaveToast(null), 4500);
    }
  };

  // Faculty Members State with localStorage persistence
  const [facultyList, setFacultyList] = useState<FacultyMember[]>(() => {
    try {
      const saved = localStorage.getItem('maysan_faculty_members_v2');
      return saved ? JSON.parse(saved) : FACULTY_MEMBERS;
    } catch (e) {
      return FACULTY_MEMBERS;
    }
  });

  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState(false);
  const [selectedFacultyIdToEdit, setSelectedFacultyIdToEdit] = useState<string | undefined>(undefined);
  const [openFacultyInAddMode, setOpenFacultyInAddMode] = useState<boolean>(false);
  const [deleteConfirmTeacherInHome, setDeleteConfirmTeacherInHome] = useState<FacultyMember | null>(null);
  const [isNewsEventsModalOpen, setIsNewsEventsModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isQuickEditPrincipalOpen, setIsQuickEditPrincipalOpen] = useState(false);

  const handleSaveFacultyList = (newList: FacultyMember[]) => {
    setFacultyList(newList);
    try {
      localStorage.setItem('maysan_faculty_members_v2', JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to persist faculty members list', e);
    }
    setSaveToast('تم تحديث بيانات وإنجازات الهيئة التدريسية بنجاح! 🎓');
    setTimeout(() => setSaveToast(null), 4500);
  };

  const handleDirectDeleteTeacherInHome = (teacher: FacultyMember) => {
    const nextList = facultyList.filter((f) => f.id !== teacher.id);
    setFacultyList(nextList);
    try {
      localStorage.setItem('maysan_faculty_members_v2', JSON.stringify(nextList));
    } catch (e) {
      console.error('Failed to persist faculty list after deletion', e);
    }
    setDeleteConfirmTeacherInHome(null);
    setSaveToast(`تم حذف الأستاذة (${teacher.name}) من قائمة الهيئة التدريسية بنجاح 🗑️`);
    setTimeout(() => setSaveToast(null), 4500);
  };

  const handleResetFacultyList = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين قائمة الهيئة التدريسية إلى القائمة الافتراضية؟')) {
      setFacultyList(FACULTY_MEMBERS);
      try {
        localStorage.removeItem('maysan_faculty_members_v2');
      } catch (e) {}
      setSaveToast('تمت إعادة تعيين الهيئة التدريسية إلى القائمة الافتراضية.');
      setTimeout(() => setSaveToast(null), 4500);
    }
  };

  const [facultySortOrder, setFacultySortOrder] = useState<'default' | 'asc' | 'desc'>('default');

  const handleSortFacultyAlphabetically = (ascending: boolean) => {
    const sorted = [...facultyList].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'ar', { sensitivity: 'base', numeric: true });
      return ascending ? cmp : -cmp;
    });
    setFacultyList(sorted);
    setFacultySortOrder(ascending ? 'asc' : 'desc');
    try {
      localStorage.setItem('maysan_faculty_members_v2', JSON.stringify(sorted));
    } catch (e) {
      console.error('Failed to persist sorted faculty members', e);
    }
    setSaveToast(
      ascending
        ? 'تم ترتيب وحفظ أسماء الهيئة التدريسية أبجدياً (أ ← ي) بنجاح 🔤'
        : 'تم ترتيب وحفظ أسماء الهيئة التدريسية أبجدياً (ي ← أ) بنجاح 🔤'
    );
    setTimeout(() => setSaveToast(null), 4500);
  };

  const handleSaveGalleryList = (newList: GalleryPhoto[]) => {
    setGalleryList(newList);
    try {
      localStorage.setItem('maysan_gallery_photos_v2', JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to persist gallery list', e);
    }
    setSaveToast('تم تحديث وحفظ معرض الصور والأنشطة المدرسية بنجاح! 📸');
    setTimeout(() => setSaveToast(null), 4500);
  };

  const handleResetGalleryList = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين معرض الصور والأنشطة إلى المعرض الافتراضي؟')) {
      setGalleryList(GALLERY_PHOTOS);
      try {
        localStorage.removeItem('maysan_gallery_photos_v2');
      } catch (e) {}
      setSaveToast('تمت إعادة تعيين معرض الصور إلى القائمة الأساسية.');
      setTimeout(() => setSaveToast(null), 4500);
    }
  };

  const handleSaveNewsList = (newList: NewsItem[]) => {
    setNewsList(newList);
    try {
      localStorage.setItem('maysan_news_events_v2', JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to persist news list', e);
    }
    setSaveToast('تم تحديث وحفظ سجل الأخبار والمهرجانات والفعاليات بنجاح! 📣');
    setTimeout(() => setSaveToast(null), 4500);
  };

  const handleResetNewsList = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين سجل الأخبار والمهرجانات إلى القائمة الافتراضية؟')) {
      setNewsList(NEWS_EVENTS_DATA);
      try {
        localStorage.removeItem('maysan_news_events_v2');
      } catch (e) {}
      setSaveToast('تمت إعادة تعيين سجل الأخبار والمهرجانات إلى البيانات الأساسية.');
      setTimeout(() => setSaveToast(null), 4500);
    }
  };

  const handleFacultyAvatarUpload = (teacherId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const newAvatar = reader.result;
        const updatedList = facultyList.map((f) => (f.id === teacherId ? { ...f, avatar: newAvatar } : f));
        handleSaveFacultyList(updatedList);
        setSaveToast('تم تحديث صورة الأستاذة/المدرسة بنجاح 📸');
        setTimeout(() => setSaveToast(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // News & Events state with localStorage persistence
  const [newsList, setNewsList] = useState<NewsItem[]>(() => {
    try {
      const saved = localStorage.getItem('maysan_news_events_v2');
      return saved ? JSON.parse(saved) : NEWS_EVENTS_DATA;
    } catch (e) {
      return NEWS_EVENTS_DATA;
    }
  });

  // Gallery Photos state with localStorage persistence
  const [galleryList, setGalleryList] = useState<GalleryPhoto[]>(() => {
    try {
      const saved = localStorage.getItem('maysan_gallery_photos_v2');
      return saved ? JSON.parse(saved) : GALLERY_PHOTOS;
    } catch (e) {
      return GALLERY_PHOTOS;
    }
  });

  const handleNewsImageUpload = (newsId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const newImg = reader.result;
        const updated = newsList.map((n) => (n.id === newsId ? { ...n, image: newImg } : n));
        setNewsList(updated);
        try {
          localStorage.setItem('maysan_news_events_v2', JSON.stringify(updated));
        } catch (e) {}
        if (activeNewsModal && activeNewsModal.id === newsId) {
          setActiveNewsModal({ ...activeNewsModal, image: newImg });
        }
        setSaveToast('تم تحديث صورة الخبر/الفعالية بنجاح 📸');
        setTimeout(() => setSaveToast(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryImageUpload = (photoId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const newUrl = reader.result;
        const updated = galleryList.map((g) => (g.id === photoId ? { ...g, url: newUrl } : g));
        setGalleryList(updated);
        try {
          localStorage.setItem('maysan_gallery_photos_v2', JSON.stringify(updated));
        } catch (e) {}
        if (activePhotoModal && activePhotoModal.id === photoId) {
          setActivePhotoModal({ ...activePhotoModal, url: newUrl });
        }
        setSaveToast('تم تحديث صورة المعرض التوثيقي بنجاح 📸');
        setTimeout(() => setSaveToast(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Selected Category for News & Events
  const [newsFilterCategory, setNewsFilterCategory] = useState<string>('الكل');

  // News Modal Details
  const [activeNewsModal, setActiveNewsModal] = useState<NewsItem | null>(null);

  // Gallery Filter & Lightbox
  const [galleryCategory, setGalleryCategory] = useState<string>('الكل');
  const [activePhotoModal, setActivePhotoModal] = useState<GalleryPhoto | null>(null);

  // Filtered lists
  const filteredNews = newsList.filter((n) =>
    newsFilterCategory === 'الكل' ? true : n.category === newsFilterCategory
  );

  const filteredGallery = galleryList.filter((g) =>
    galleryCategory === 'الكل' ? true : g.category === galleryCategory
  );

  return (
    <div className="space-y-10 font-arabic text-slate-900 dark:text-slate-100 pb-12">
      
      {/* =========================================================
          SECTION 1: HERO BANNER & SCHOOL OFFICIAL INFORMATION BAR
          ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-indigo-950 text-white shadow-2xl border border-teal-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(13,148,136,0.25),transparent_50%)] pointer-events-none" />
        
        <div className="relative p-6 sm:p-10 space-y-6 max-w-5xl">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <School className="w-4 h-4 text-teal-300" />
              وزارة التربية - مديرية تربية ميسان
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              المركز الأول على مستوى المحافظة 🏆
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-wide">
              ثانوية ميسان للمتميزات
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
              صرح علمي وأكاديمي رائد يعنى برعاية وحضن الطالبات الموهوبات والمتميزات، وتأهيلهن لقيادة المستقبل في مجالات العلوم، الذكاء الاصطناعي، والهندسة والطب.
            </p>
          </div>

          {/* Official Hours & School Policy Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
            
            {/* Working Hours Card */}
            <div className="relative group p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between text-amber-300 font-bold text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>أوقات الدوام الرسمي ⏰</span>
                </div>
                {role === 'admin' && (
                  <button
                    onClick={() => setIsEditSchoolAdminModalOpen(true)}
                    className="p-1 px-2 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-[10px] font-bold flex items-center gap-1 transition-all"
                    title="تعديل أوقات الدوام الرسمي"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>تعديل</span>
                  </button>
                )}
              </div>
              <p className="text-sm font-extrabold text-white">
                {schoolAdminData.schoolWorkingHoursInfo || 'من 8:00 صباحاً وحتى 1:30 ظهراً'}
              </p>
              <p className="text-[11px] text-slate-300">
                {schoolAdminData.schoolWorkingHoursDetail || 'طيلة أيام الأسبوع من (الأحد إلى الخميس)'}
              </p>
            </div>

            {/* Official Uniform Card */}
            <div className="relative group p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between text-teal-300 font-bold text-xs">
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-teal-300" />
                  <span>الزي الرسمي للمتميزات 👔</span>
                </div>
                {role === 'admin' && (
                  <button
                    onClick={() => setIsEditSchoolAdminModalOpen(true)}
                    className="p-1 px-2 rounded-lg bg-teal-400/20 hover:bg-teal-400/30 text-teal-200 text-[10px] font-bold flex items-center gap-1 transition-all"
                    title="تعديل الزي الرسمي للمتميزات"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>تعديل</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-bold text-white leading-snug">
                {schoolAdminData.schoolUniformInfo || 'الصدرية الرصاصية (الرمادي) + قميص أبيض ناصع + حجاب أبيض + شعار المدرسة'}
              </p>
              <p className="text-[11px] text-slate-300">
                {schoolAdminData.schoolUniformDetail || 'مع حذاء أسود / رياضي مريح للأنشطة'}
              </p>
            </div>

            {/* School Policy Card */}
            <div className="relative group p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between text-indigo-300 font-bold text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-300" />
                  <span>سياسة ورؤية التفوق 📜</span>
                </div>
                {role === 'admin' && (
                  <button
                    onClick={() => setIsEditSchoolAdminModalOpen(true)}
                    className="p-1 px-2 rounded-lg bg-indigo-400/20 hover:bg-indigo-400/30 text-indigo-200 text-[10px] font-bold flex items-center gap-1 transition-all"
                    title="تعديل سياسة ورؤية التفوق"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>تعديل</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-bold text-white">
                {schoolAdminData.schoolPolicyInfo || 'انضباط أكاديمي عالي وحظر الهواتف'}
              </p>
              <p className="text-[11px] text-slate-300">
                {schoolAdminData.schoolPolicyDetail || 'تعزيز البحث العلمي والابتكار البرمجي ورعاية الموهوبين'}
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* =========================================================
          SECTION 2: PRINCIPAL'S SECTION & ACHIEVEMENTS
          ========================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                إدارة المدرسة ورؤية التميز
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                كلمة مديرة المدرسة والأهداف الإستراتيجية لتطوير الموهوبات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {role === 'admin' && (
              <button
                onClick={() => setIsEditSchoolAdminModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-950" />
                <span>تعديل بيانات الإدارة والرؤية</span>
              </button>
            )}
            <span className="hidden sm:inline-block text-xs font-bold px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              قيادة أكاديمية متميزة ✨
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Principal Image & Badge */}
          <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              <img
                src={schoolAdminData.principalImageUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80'}
                alt="مديرة المدرسة"
                className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl object-cover shadow-xl border-4 border-amber-500/30 group-hover:scale-105 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
              {role === 'admin' && (
                <>
                  <input
                    ref={principalFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePrincipalImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => principalFileInputRef.current?.click()}
                    className="absolute inset-0 rounded-3xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-amber-300 font-extrabold text-xs backdrop-blur-xs cursor-pointer"
                    title="تغيير صورة المديرة - فتح مستكشف الملفات"
                  >
                    <Camera className="w-7 h-7 text-amber-400 animate-bounce" />
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black shadow-md">
                      تغيير صورة المديرة
                    </span>
                  </button>
                </>
              )}
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-slate-900 text-amber-300 text-[11px] font-bold border border-amber-400/40 shadow-md whitespace-nowrap flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                {schoolAdminData.principalBadge}
              </span>
            </div>

            <div className="pt-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {schoolAdminData.principalName}
              </h3>
              <p className="text-xs text-teal-600 dark:text-teal-400 font-bold">
                {schoolAdminData.principalTitle}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {schoolAdminData.principalDegree}
              </p>
              {role === 'admin' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickEditPrincipalOpen(true)}
                    className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-sm transition-all transform hover:scale-105"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل اسم وبيانات المديرة ✍️</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Vision & Achievements text */}
          <div className="md:col-span-8 space-y-4">
            
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-slate-800/60 border border-amber-200/60 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>رسالة الإدارة المدرسية للطالبات ولأولياء الأمور:</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{schoolAdminData.visionMessage}"
              </p>
            </div>

            {/* Principal Achievements List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                أبرز إنجازات وتكريمات الإدارة المدرسية:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(schoolAdminData.achievements || []).map((ach, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span>{ach}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* School Administrative & Educational Oversight Trio */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                الهيئة الإدارية والإشرافية الأكاديمية المعتمدة:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">
                    {schoolAdminData.assistantPrincipalTitle || 'معاونة شؤون الطالبات والتسجيل'}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">
                    {schoolAdminData.assistantPrincipalName || 'زينب علي الموسوي'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                    {schoolAdminData.academicSupervisorTitle || 'المشرف الأكاديمي والتربوي المعتمد'}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">
                    {schoolAdminData.academicSupervisorName || 'أ.د. حيدر جاسم الكناني'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
                    {schoolAdminData.principalTitle || 'مديرة ثانوية ميسان للمتميزات'}
                  </span>
                  <span className="text-xs font-black text-amber-950 dark:text-amber-300 block mt-0.5">
                    {schoolAdminData.principalName || 'الهام صبيح سعدون'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* =========================================================
          SECTION 3: HONOR ROLL FOR ALL 6 GRADES (TOP 3 STUDENTS)
          ========================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>لوحة الشرف للطلبة الثلاثة الأوائل</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-extrabold border border-amber-300">
                  لوحة الأوائل 🏆
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تكريم الطالبات المتفوقات الحاصلات على أعلى النماذج والمعدلات الأكاديمية لكل صف
              </p>
            </div>
          </div>

          {/* Admin Honor Roll Edit Controls (Strictly for role === 'admin') */}
          {role === 'admin' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                الإدارة المدرسية 🔒
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedRankToEdit(1);
                  setIsEditModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل لوحة شرف {selectedHonorGrade}</span>
              </button>
            </div>
          )}
        </div>

        {/* Save Toast Feedback */}
        {saveToast && (
          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Grade Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {Object.keys(honorRollData).map((grade) => {
            const isSelected = selectedHonorGrade === grade;
            return (
              <button
                key={grade}
                type="button"
                onClick={() => setSelectedHonorGrade(grade)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-500'}`} />
                <span>{grade}</span>
              </button>
            );
          })}
        </div>

        {/* Top 3 Honor Roll Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {(honorRollData[selectedHonorGrade] || HONOR_ROLL_DATA[selectedHonorGrade])?.map((student) => {
            const isRank1 = student.rank === 1;
            const isRank2 = student.rank === 2;
            const isRank3 = student.rank === 3;

            return (
              <div
                key={student.rank}
                className={`relative p-5 rounded-3xl border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between space-y-4 ${
                  isRank1
                    ? 'bg-gradient-to-b from-amber-50/80 to-white dark:from-amber-950/30 dark:to-slate-900 border-amber-300 dark:border-amber-700/60 shadow-lg ring-2 ring-amber-400/20'
                    : isRank2
                    ? 'bg-gradient-to-b from-slate-100/80 to-white dark:from-slate-800/40 dark:to-slate-900 border-slate-300 dark:border-slate-700 shadow-md'
                    : 'bg-gradient-to-b from-amber-900/5 to-white dark:from-slate-800/20 dark:to-slate-900 border-amber-700/30 dark:border-slate-800 shadow-md'
                }`}
              >
                {/* Crown / Rank Badge Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-1">
                  {isRank1 && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1 border border-amber-400">
                      🥇 المركز الأول
                    </span>
                  )}
                  {isRank2 && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-md flex items-center gap-1 border border-slate-400">
                      🥈 المركز الثاني
                    </span>
                  )}
                  {isRank3 && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-700 text-white font-black text-xs shadow-md flex items-center gap-1 border border-amber-600">
                      🥉 المركز الثالث
                    </span>
                  )}
                </div>

                {/* Avatar & GPA */}
                <div className="flex flex-col items-center text-center pt-3 space-y-2">
                  <div className="relative group">
                    <img
                      src={student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={student.name}
                      className={`w-24 h-24 rounded-full object-cover shadow-lg border-4 transition-transform duration-300 ${
                        isRank1 ? 'border-amber-400' : isRank2 ? 'border-slate-300' : 'border-amber-700'
                      } ${role === 'admin' ? 'group-hover:scale-105' : ''}`}
                      referrerPolicy="no-referrer"
                    />
                    {role === 'admin' && (
                      <>
                        <input
                          id={`honor-file-input-${student.rank}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleHonorStudentAvatarUpload(student.rank, file);
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`honor-file-input-${student.rank}`)?.click()}
                          className="absolute inset-0 rounded-full bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-amber-300 text-[10px] font-extrabold cursor-pointer backdrop-blur-xs gap-1"
                          title="تغيير صورة الطالبة - فتح مستكشف الملفات"
                        >
                          <Camera className="w-5 h-5 text-amber-400 animate-bounce" />
                          <span>تغيير الصورة</span>
                        </button>
                      </>
                    )}
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-900 text-amber-300 font-extrabold text-xs shadow-md border border-amber-400/30 whitespace-nowrap pointer-events-none">
                      {student.gpa}%
                    </span>
                  </div>

                  <div className="pt-2">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {student.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {student.grade} - شعبة ({student.section})
                    </p>
                  </div>
                </div>

                {/* Details / Ambition */}
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1 text-teal-700 dark:text-teal-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span>التفوق الأكاديمي:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-normal">{student.specialty}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-bold">
                    <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>طموح المستقبل:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-normal">{student.dream}</span>
                  </div>
                </div>

                {/* Individual Edit Button on Card (Visible strictly for role === 'admin') */}
                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRankToEdit(student.rank);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل بيانات الطالبة ({student.name})</span>
                  </button>
                )}

              </div>
            );
          })}
        </div>

        {/* Modal for Admin to Edit Honor Roll */}
        {role === 'admin' && (
          <EditHonorStudentModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            grade={selectedHonorGrade}
            students={honorRollData[selectedHonorGrade] || HONOR_ROLL_DATA[selectedHonorGrade] || []}
            initialSelectedRank={selectedRankToEdit}
            onSaveStudent={handleSaveHonorStudent}
            onResetDefault={handleResetHonorRoll}
          />
        )}

      </section>

      {/* =========================================================
          SECTION 4: FACULTY TEACHERS & THEIR ACHIEVEMENTS
          ========================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                الهيئة التدريسية وإنجازاتها الأكاديمية
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                نشر البحوث، تأليف الكتب، الألعاب التعليمية، والابتكارات الرياضية والهندسية للهيئة التدريسية للمتميزات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Alphabetical Sort Controls */}
            {facultyList.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1.5 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                  <span>ترتيب الأسماء:</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleSortFacultyAlphabetically(true)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                    facultySortOrder === 'asc'
                      ? 'bg-teal-500 text-slate-950 shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-600'
                  }`}
                  title="ترتيب أسماء الهيئة التدريسية بالكامل أبجدياً (أ إلى ي)"
                >
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                  <span>أبجدياً (أ ← ي)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSortFacultyAlphabetically(false)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                    facultySortOrder === 'desc'
                      ? 'bg-teal-500 text-slate-950 shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-600'
                  }`}
                  title="ترتيب أسماء الهيئة التدريسية بالكامل أبجدياً (ي إلى أ)"
                >
                  <ArrowUpZA className="w-3.5 h-3.5" />
                  <span>أبجدياً (ي ← أ)</span>
                </button>
              </div>
            )}

            {/* Admin Faculty Edit Controls (Strictly for role === 'admin') */}
            {role === 'admin' && (
              <>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  مديرة المدرسة 🔒
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFacultyIdToEdit(undefined);
                    setOpenFacultyInAddMode(true);
                    setIsFacultyModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة أستاذة جديدة</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFacultyIdToEdit(undefined);
                    setOpenFacultyInAddMode(false);
                    setIsFacultyModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>إدارة وحذف الهيئة التدريسية</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Faculty Grid or Empty State */}
        {facultyList.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              لم يتم إدراج أسماء المدرسين بعد
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              يمكن لإدارة المدرسة إضافة بيانات وأعضاء الهيئة التدريسية المعتمدة وتحديث تخصصاتهم وإنجازاتهم أو استعادة القائمة النموذجية الافتراضية.
            </p>
            {role === 'admin' && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFacultyIdToEdit(undefined);
                    setOpenFacultyInAddMode(true);
                    setIsFacultyModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة أستاذة الآن</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetFacultyList}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>استعادة النماذج الافتراضية</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facultyList.map((teacher) => (
              <div
                key={teacher.id}
                className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between relative group"
              >
                <div className="space-y-3">
                  
                  {/* Header Profile */}
                  <div className="flex items-start gap-3">
                    <div className="relative group shrink-0">
                      <img
                        src={teacher.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
                        alt={teacher.name}
                        className={`w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-teal-500/30 transition-transform duration-300 ${
                          role === 'admin' ? 'group-hover:scale-105' : ''
                        }`}
                        referrerPolicy="no-referrer"
                      />
                      {role === 'admin' && (
                        <>
                          <input
                            id={`faculty-file-input-${teacher.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFacultyAvatarUpload(teacher.id, file);
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById(`faculty-file-input-${teacher.id}`)?.click()}
                            className="absolute inset-0 rounded-2xl bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-teal-300 text-[9px] font-extrabold cursor-pointer backdrop-blur-xs gap-0.5"
                            title="تغيير صورة المدرسة - فتح مستكشف الملفات"
                          >
                            <Camera className="w-4 h-4 text-teal-400 animate-bounce" />
                            <span>تغيير</span>
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {teacher.name}
                        </h3>
                        {role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmTeacherInHome(teacher)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title={`حذف الأستاذة ${teacher.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold truncate">
                        {teacher.subject}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {teacher.degree}
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats Badges */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                      🔬 {teacher.researchCount} بحوث محكمة
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                      📚 {teacher.booksCount} كتب مؤلفة
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-800">
                      🎮 {teacher.gamesCount} ألعاب تعليمية
                    </span>
                  </div>

                  {/* Achievements Bullet List */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      أبرز الإنجازات والابتكارات:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      {teacher.achievements.map((ach, i) => (
                        <li key={i} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-teal-500 font-bold">•</span>
                          <span>{ach}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Individual Action Buttons on Card (Visible strictly for role === 'admin') */}
                {role === 'admin' && (
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-200/70 dark:border-slate-700/60 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFacultyIdToEdit(teacher.id);
                        setOpenFacultyInAddMode(false);
                        setIsFacultyModalOpen(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل البيانات</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmTeacherInHome(teacher)}
                      className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all flex items-center justify-center gap-1"
                      title={`حذف الأستاذة ${teacher.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>حذف</span>
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

        {/* Modal for Admin to Edit Faculty Members */}
        {role === 'admin' && (
          <EditFacultyModal
            isOpen={isFacultyModalOpen}
            onClose={() => setIsFacultyModalOpen(false)}
            facultyList={facultyList}
            onSaveFacultyList={handleSaveFacultyList}
            onResetDefault={handleResetFacultyList}
            initialTeacherId={selectedFacultyIdToEdit}
            openInAddMode={openFacultyInAddMode}
          />
        )}

        {/* Direct Delete Confirmation Modal in Overview */}
        {deleteConfirmTeacherInHome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  تأكيد حذف الأستاذة
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  هل أنتِ متأكدة من حذف الأستاذة <strong className="text-rose-600 dark:text-rose-400">"{deleteConfirmTeacherInHome.name}"</strong> من قائمة الهيئة التدريسية وإنجازاتها في اللوحة الرئيسية؟
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTeacherInHome(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectDeleteTeacherInHome(deleteConfirmTeacherInHome)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>تأكيد الحذف النهائي</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* =========================================================
          SECTION 5: NEWS, EVENTS, FESTIVALS & ACTIVITIES
          ========================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                أهم الأخبار والمناسبات والمهرجانات والفعاليات
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                متابعة شاملة لجميع أنشطة ومهرجانات ومعارض مدرسة المتميزات
              </p>
            </div>
          </div>

          {role === 'admin' && (
            <button
              type="button"
              onClick={() => setIsNewsEventsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              <span>تعديل وإضافة الأخبار والفعاليات 📣</span>
            </button>
          )}
        </div>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['الكل', 'مهرجانات', 'معارض علمية', 'رياضة', 'تكريم'].map((cat) => {
            const isSelected = newsFilterCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setNewsFilterCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNews.map((news) => (
            <div
              key={news.id}
              className="p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div
                  className="relative overflow-hidden rounded-2xl h-44 group cursor-pointer"
                  onClick={() => document.getElementById(`news-file-input-${news.id}`)?.click()}
                  title="اضغط لتغيير صورة الخبر من جهازك"
                >
                  <img
                    src={news.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80'}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <input
                    id={`news-file-input-${news.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleNewsImageUpload(news.id, file);
                    }}
                    className="hidden"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-950/80 text-teal-300 text-xs font-bold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 border border-teal-500/30">
                    <Camera className="w-3.5 h-3.5 text-teal-400" />
                    <span>تغيير الصورة</span>
                  </div>
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-bold backdrop-blur-md">
                    {news.category}
                  </span>
                  <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-black/60 text-slate-200 text-[10px] font-medium backdrop-blur-md flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {news.date}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                    {news.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {news.summary}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  {news.location}
                </span>

                <button
                  type="button"
                  onClick={() => setActiveNewsModal(news)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <span>اقرأ الفعالية</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for Admin to Edit News & Events */}
        {role === 'admin' && (
          <EditNewsEventsModal
            isOpen={isNewsEventsModalOpen}
            onClose={() => setIsNewsEventsModalOpen(false)}
            newsList={newsList}
            onSaveNewsList={handleSaveNewsList}
            onResetDefault={handleResetNewsList}
          />
        )}

      </section>

      {/* =========================================================
          SECTION 6: PHOTO & VIDEO GALLERY (معرض الصور التوثيقي)
          ========================================================= */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                معرض الصور والأنشطة المدرسية التوثيقي
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                لقطات مصورة لمختبرات الذكاء الاصطناعي والمعارض العلمية والبطولات الرياضية
              </p>
            </div>
          </div>

          {role === 'admin' && (
            <button
              type="button"
              onClick={() => setIsGalleryModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              <span>تعديل وإدارة معرض الصور والأنشطة 📸</span>
            </button>
          )}
        </div>

        {/* Gallery Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['الكل', 'المختبرات العلمية', 'المهرجانات والفعاليات', 'الابتكارات والهندسة', 'الأنشطة الرياضية'].map((cat) => {
            const isSelected = galleryCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setGalleryCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGallery.map((photo) => (
            <div
              key={photo.id}
              className="relative rounded-2xl overflow-hidden h-52 group border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <img
                src={photo.url || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80'}
                alt={photo.title}
                onClick={() => document.getElementById(`gallery-file-input-${photo.id}`)?.click()}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                title="اضغط لتغيير هذه الصورة من جهازك"
                referrerPolicy="no-referrer"
              />
              <input
                id={`gallery-file-input-${photo.id}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleGalleryImageUpload(photo.id, file);
                }}
                className="hidden"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity pointer-events-none" />

              <div className="absolute bottom-3 right-3 left-3 space-y-1 text-white pointer-events-none">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 text-[10px] font-bold border border-teal-400/30">
                  {photo.category}
                </span>
                <h4 className="font-bold text-xs text-white leading-tight">
                  {photo.title}
                </h4>
                <p className="text-[10px] text-slate-300 line-clamp-1">
                  {photo.desc}
                </p>
              </div>

              <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={() => document.getElementById(`gallery-file-input-${photo.id}`)?.click()}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 text-teal-300 text-[11px] font-bold border border-teal-500/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 backdrop-blur-md cursor-pointer"
                  title="تغيير الصورة من جهازك"
                >
                  <Camera className="w-3.5 h-3.5 text-teal-400" />
                  <span>تغيير</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoModal(photo)}
                  className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors"
                  title="تكبير الصورة"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for Admin to Edit Photo Gallery */}
        {role === 'admin' && (
          <EditGalleryModal
            isOpen={isGalleryModalOpen}
            onClose={() => setIsGalleryModalOpen(false)}
            galleryList={galleryList}
            onSaveGalleryList={handleSaveGalleryList}
            onResetDefault={handleResetGalleryList}
          />
        )}

      </section>

      {/* =========================================================
          NEWS DETAILS MODAL POPUP
          ========================================================= */}
      {activeNewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white">
            
            <button
              onClick={() => setActiveNewsModal(null)}
              className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div
              className="relative h-64 group cursor-pointer"
              onClick={() => document.getElementById(`news-modal-file-input-${activeNewsModal.id}`)?.click()}
              title="اضغط هنا لتغيير صورة الخبر من مستكشف الملفات"
            >
              <img
                src={activeNewsModal.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80'}
                alt={activeNewsModal.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <input
                id={`news-modal-file-input-${activeNewsModal.id}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleNewsImageUpload(activeNewsModal.id, file);
                }}
                className="hidden"
              />
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 text-teal-300 font-bold text-xs flex items-center gap-1.5 border border-teal-500/40 backdrop-blur-md">
                  <Camera className="w-4 h-4 text-teal-400" />
                  <span>تغيير صورة الخبر من جهازك</span>
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-4 right-4 left-4 text-white">
                <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">
                  {activeNewsModal.category}
                </span>
                <h3 className="text-lg font-bold mt-2">
                  {activeNewsModal.title}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {activeNewsModal.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  {activeNewsModal.location}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {activeNewsModal.fullContent}
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">جهة التنظيم والإشراف: </span>
                <span>{activeNewsModal.organizer}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveNewsModal(null)}
                className="px-6 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          GALLERY LIGHTBOX MODAL
          ========================================================= */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-white">
            
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div
              className="max-h-[70vh] overflow-hidden flex items-center justify-center bg-black relative group cursor-pointer"
              onClick={() => document.getElementById(`lightbox-file-input-${activePhotoModal.id}`)?.click()}
              title="اضغط لتغيير الصورة من مستكشف الملفات"
            >
              <img
                src={activePhotoModal.url || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80'}
                alt={activePhotoModal.title}
                className="max-h-[70vh] w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <input
                id={`lightbox-file-input-${activePhotoModal.id}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleGalleryImageUpload(activePhotoModal.id, file);
                }}
                className="hidden"
              />
              <div className="absolute bottom-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 text-teal-300 text-xs font-bold flex items-center gap-1.5 border border-teal-500/40 backdrop-blur-md">
                  <Camera className="w-4 h-4 text-teal-400" />
                  <span>اضغط لتغيير هذه الصورة من جهازك</span>
                </span>
              </div>
            </div>

            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">
                  {activePhotoModal.title}
                </h3>
                <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30">
                  {activePhotoModal.category}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activePhotoModal.desc}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Quick Edit Principal Modal */}
      <QuickEditPrincipalModal
        isOpen={isQuickEditPrincipalOpen}
        onClose={() => setIsQuickEditPrincipalOpen(false)}
        onOpenFullAdminModal={() => {
          setIsQuickEditPrincipalOpen(false);
          setIsEditSchoolAdminModalOpen(true);
        }}
      />

      {/* Edit School Admin Modal */}
      <EditSchoolAdminModal
        isOpen={isEditSchoolAdminModalOpen}
        onClose={() => setIsEditSchoolAdminModalOpen(false)}
      />

    </div>
  );
};

// Helper Icon for Gamepad
const GamepadIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
    />
  </svg>
);
