/**
 * Academic Calendar Widget Component
 * التقويم الأكاديمي والأحداث المدرسية - مدرسة ثانوية ميسان للمتميزات
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarEvent, CalendarEventType, ALL_GRADES_LIST, GradeLevel } from '../types';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Star,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Filter,
  GraduationCap,
} from 'lucide-react';

export const AcademicCalendarWidget: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { role, calendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent, lang } = useApp();

  const [activeTab, setActiveTab] = useState<'agenda' | 'month'>('agenda');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<CalendarEventType | 'all'>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1)); // Default August 2026

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    date: string;
    endDate: string;
    type: CalendarEventType;
    targetGrade: GradeLevel | 'الكل';
    location: string;
    isImportant: boolean;
  }>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    type: 'event',
    targetGrade: 'الكل',
    location: '',
    isImportant: false,
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isAdmin = role === 'admin';

  // Filter events
  const filteredEvents = calendarEvents.filter((evt) => {
    const matchesType = selectedTypeFilter === 'all' || evt.type === selectedTypeFilter;
    const matchesGrade =
      selectedGradeFilter === 'all' || evt.targetGrade === 'الكل' || evt.targetGrade === selectedGradeFilter;
    return matchesType && matchesGrade;
  });

  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Type Color Badges
  const getTypeBadge = (type: CalendarEventType) => {
    switch (type) {
      case 'exam':
        return {
          label: lang === 'ar' ? 'امتحان' : 'Exam',
          color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-900',
          icon: '📝',
        };
      case 'holiday':
        return {
          label: lang === 'ar' ? 'عطلة رسمية' : 'Holiday',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
          icon: '🌴',
        };
      case 'activity':
        return {
          label: lang === 'ar' ? 'نشاط مدرسي' : 'Activity',
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
          icon: '🎨',
        };
      case 'meeting':
        return {
          label: lang === 'ar' ? 'اجتماع' : 'Meeting',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-900',
          icon: '👥',
        };
      case 'event':
      default:
        return {
          label: lang === 'ar' ? 'حدث عام' : 'Event',
          color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-900',
          icon: '🎯',
        };
    }
  };

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      endDate: '',
      type: 'event',
      targetGrade: 'الكل',
      location: '',
      isImportant: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      description: evt.description || '',
      date: evt.date,
      endDate: evt.endDate || '',
      type: evt.type,
      targetGrade: evt.targetGrade || 'الكل',
      location: evt.location || '',
      isImportant: !!evt.isImportant,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) return;

    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        endDate: formData.endDate || undefined,
        type: formData.type,
        targetGrade: formData.targetGrade,
        location: formData.location.trim(),
        isImportant: formData.isImportant,
      });
    } else {
      addCalendarEvent({
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        endDate: formData.endDate || undefined,
        type: formData.type,
        targetGrade: formData.targetGrade,
        location: formData.location.trim(),
        isImportant: formData.isImportant,
      });
    }

    setIsModalOpen(false);
  };

  // Month Grid Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString(lang === 'ar' ? 'ar-IQ' : 'en-US', { month: 'long', year: 'numeric' });

  const getEventsForDay = (dayNum: number) => {
    const formattedDay = String(dayNum).padStart(2, '0');
    const formattedMonth = String(month + 1).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return calendarEvents.filter((evt) => {
      if (evt.date === dateStr) return true;
      if (evt.endDate && evt.date <= dateStr && evt.endDate >= dateStr) return true;
      return false;
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm transition-all">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-arabic">
                {lang === 'ar' ? 'التقويم الأكاديمي والفعاليات' : 'Academic Calendar'}
              </h2>
              <span className="text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                {calendarEvents.length} {lang === 'ar' ? 'أحداث' : 'events'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'جدول مواعيد الامتحانات والعطل والمناشط المدرسة' : 'Upcoming school events, exams, and holidays'}
            </p>
          </div>
        </div>

        {/* Action & View Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'agenda'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'قائمة الفعاليات' : 'Agenda'}
            </button>
            <button
              onClick={() => setActiveTab('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'month'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'العرض الشهري' : 'Month View'}
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة حدث جديد' : 'Add Event'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 my-4">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'all', label: lang === 'ar' ? 'الكل' : 'All', icon: '✨' },
            { id: 'exam', label: lang === 'ar' ? 'امتحانات' : 'Exams', icon: '📝' },
            { id: 'holiday', label: lang === 'ar' ? 'عطل ورسميات' : 'Holidays', icon: '🌴' },
            { id: 'activity', label: lang === 'ar' ? 'أنشطة مدرسة' : 'Activities', icon: '🎨' },
            { id: 'meeting', label: lang === 'ar' ? 'اجتماعات' : 'Meetings', icon: '👥' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTypeFilter(item.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedTypeFilter === item.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Grade Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedGradeFilter}
            onChange={(e) => setSelectedGradeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-arabic"
          >
            <option value="all">{lang === 'ar' ? 'جميع الصفوف والمراحل' : 'All Grades'}</option>
            {ALL_GRADES_LIST.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Agenda View */}
      {activeTab === 'agenda' && (
        <div className="space-y-3">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {lang === 'ar' ? 'لا توجد أحداث مطابقة للفلتر المحدد' : 'No events match the selected filter'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ar' ? 'قم بتغيير الفلاتر أو إضافة أحداث جديدة' : 'Try changing filters or adding a new event'}
              </p>
            </div>
          ) : (
            sortedEvents.map((evt) => {
              const badge = getTypeBadge(evt.type);
              return (
                <div
                  key={evt.id}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                    evt.isImportant
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Date Badge */}
                    <div className="flex flex-col items-center justify-center min-w-[56px] h-14 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-1">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        {new Date(evt.date).toLocaleDateString(lang === 'ar' ? 'ar-IQ' : 'en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                        {new Date(evt.date).getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                          {badge.icon} {badge.label}
                        </span>

                        {evt.isImportant && (
                          <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {lang === 'ar' ? 'هام جداً' : 'Important'}
                          </span>
                        )}

                        {evt.targetGrade && (
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-slate-400" />
                            {evt.targetGrade}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white font-arabic">
                        {evt.title}
                      </h3>

                      {evt.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-arabic line-clamp-2">
                          {evt.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {evt.date}
                            {evt.endDate ? ` ➔ ${evt.endDate}` : ''}
                          </span>
                        </div>
                        {evt.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{evt.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="flex items-center gap-2 border-t sm:border-t-0 border-slate-200 dark:border-slate-700 pt-2 sm:pt-0 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(evt)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all"
                        title={lang === 'ar' ? 'تعديل Event' : 'Edit Event'}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span className="hidden md:inline">{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(evt.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-900/60 transition-all"
                        title={lang === 'ar' ? 'حذف Event' : 'Delete Event'}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span className="hidden md:inline">{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Month View */}
      {activeTab === 'month' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white font-arabic">
              {monthName}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
            {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((d) => (
              <div key={d} className="text-xs font-bold text-slate-500 dark:text-slate-400 py-1">
                {d}
              </div>
            ))}

            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 rounded-xl bg-slate-50/30 dark:bg-slate-900/30" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayEvents = getEventsForDay(dayNum);
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[64px] p-1.5 rounded-xl border flex flex-col justify-between transition-all ${
                    isToday
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {dayNum}
                  </span>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((evt) => {
                      const badge = getTypeBadge(evt.type);
                      return (
                        <div
                          key={evt.id}
                          className={`text-[9px] font-bold truncate px-1 rounded text-right ${badge.color}`}
                          title={`${evt.title} (${evt.date})`}
                        >
                          {badge.icon} {evt.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                        +{dayEvents.length - 2} المزيد
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-arabic">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingEvent
                    ? lang === 'ar'
                      ? 'تعديل حدث في التقويم'
                      : 'Edit Event'
                    : lang === 'ar'
                    ? 'إضافة حدث جديد للتقويم'
                    : 'Add New Event'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? 'حدد تفاصيل الموعد أو الامتحان أو العطلة الرسمية' : 'Enter details for exam, holiday or event'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'عنوان الحدث / المناسبة' : 'Event Title'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={lang === 'ar' ? 'مثال: امتحانات نصف السنة الدراسية' : 'Event title...'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-arabic"
                />
              </div>

              {/* Event Type & Target Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'نوع الحدث' : 'Event Type'}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CalendarEventType })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-arabic"
                  >
                    <option value="exam">📝 امتحان / اختبار</option>
                    <option value="holiday">🌴 عطلة رسمية / إجازة</option>
                    <option value="activity">🎨 نشاط مدرسي / معرض</option>
                    <option value="meeting">👥 اجتماع الهيئة التدريسية أو أولياء الأمور</option>
                    <option value="event">🎯 حدث عام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'المرحلة / الصف المستهدف' : 'Target Grade'}
                  </label>
                  <select
                    value={formData.targetGrade}
                    onChange={(e) => setFormData({ ...formData, targetGrade: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-arabic"
                  >
                    <option value="الكل">الجميع (كافة المراحل)</option>
                    {ALL_GRADES_LIST.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'تاريخ البداية' : 'Start Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-arabic"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'تاريخ النهاية (اختياري)' : 'End Date (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-arabic"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'مكان الحدث (اختياري)' : 'Location'}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={lang === 'ar' ? 'مثال: القاعة الكبرى / المسرح المدرسي' : 'Location...'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-arabic"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'تفاصيل إضافية / ملاحظات' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={lang === 'ar' ? 'أضف وصفاً شاملاً للحدث أو التعليمات' : 'Description details...'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-arabic"
                />
              </div>

              {/* Is Important Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isImportant"
                  checked={formData.isImportant}
                  onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="isImportant" className="text-xs font-bold text-amber-900 dark:text-amber-300 cursor-pointer flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {lang === 'ar' ? 'علامة حدث هام عاجل (تثبيت وترويسة)' : 'Mark as Important Event'}
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingEvent ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (lang === 'ar' ? 'إضافة الحدث' : 'Add Event')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-arabic">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {lang === 'ar' ? 'تأكيد حذف الحدث' : 'Confirm Delete'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              {lang === 'ar' ? 'هل أنت تأكد من إزالة هذا الحدث من التقويم الأكاديمي؟' : 'Are you sure you want to remove this event?'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  deleteCalendarEvent(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                {lang === 'ar' ? 'نعم، حذف' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
