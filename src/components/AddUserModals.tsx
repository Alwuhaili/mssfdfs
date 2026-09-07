/**
 * Add Teacher & Add Student Modals
 * مدرسة ثانوية ميسان للمتميزات
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GradeLevel, ALL_GRADES_LIST } from '../types';
import { X, UserPlus, GraduationCap, CheckCircle } from 'lucide-react';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTeacherModal: React.FC<AddTeacherModalProps> = ({ isOpen, onClose }) => {
  const { addTeacher, lang, t } = useApp();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedGrades, setAssignedGrades] = useState<GradeLevel[]>(['الصف السادس العلمي']);
  const [availableDays, setAvailableDays] = useState<string[]>([
    'الأحد',
    'الإثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject || !phone) return;

    addTeacher({
      name,
      subject,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@maysan-gifted.edu.iq`,
      phone,
      assignedGrades,
      availableDays,
    });

    onClose();
    setName('');
    setSubject('');
    setEmail('');
    setPhone('');
    setAvailableDays(['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']);
  };

  const allGrades: GradeLevel[] = ALL_GRADES_LIST;
  const weekdaysList = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  const toggleGrade = (g: GradeLevel) => {
    if (assignedGrades.includes(g)) {
      setAssignedGrades(assignedGrades.filter((item) => item !== g));
    } else {
      setAssignedGrades([...assignedGrades, g]);
    }
  };

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      if (availableDays.length > 1) {
        setAvailableDays(availableDays.filter((d) => d !== day));
      }
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-arabic">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-slate-900 border-b border-indigo-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 text-amber-300 rounded-xl border border-indigo-500/40">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'ar' ? 'إضافة مدرس أو مدرسة جديدة للهيئة التدريسية' : 'Add New Faculty Teacher'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === 'ar' ? 'اسم المدرس أو المدرسة الثلاثي واللقب *' : 'Teacher Full Name *'}
            </label>
            <input
              type="text"
              required
              placeholder={lang === 'ar' ? 'أ. زينب علي الحسان' : 'Prof. Zainab Ali'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'ar' ? 'المادة الدراسية *' : 'Subject *'}
              </label>
              <input
                type="text"
                required
                placeholder={lang === 'ar' ? 'الفيزياء المتقدمة' : 'Advanced Physics'}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'ar' ? 'رقم الهاتف (الواتساب) *' : 'Phone Number *'}
              </label>
              <input
                type="text"
                required
                placeholder="0770xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === 'ar' ? 'البريد الإلكتروني الرسمي' : 'Official Email'}
            </label>
            <input
              type="email"
              placeholder="teacher@maysan-gifted.edu.iq"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {lang === 'ar' ? 'الصفوف المكلفة بتدريسها:' : 'Assigned Grade Levels:'}
            </label>
            <div className="flex flex-wrap gap-2">
              {allGrades.map((g) => {
                const isSelected = assignedGrades.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGrade(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-indigo-950 font-bold border border-amber-300'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                    <span>{g}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              {lang === 'ar' ? 'أيام الدوام والحصص الدراسية المحددة:' : 'Teaching Days Schedule:'}
            </label>
            <div className="flex flex-wrap gap-2">
              {weekdaysList.map((day) => {
                const isSelected = availableDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-teal-500 text-slate-950 border border-teal-300 shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700/80 line-through'
                    }`}
                  >
                    {isSelected ? '✓ ' + day : '✕ ' + day}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'ar'
                ? 'ملاحظة: المدرس لن يكون لديه حصص تدريسية في الأيام غير المحددة عند توليد الجدول الأسبوعي.'
                : 'Note: Unselected days will be excluded from timetable slot assignments.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-indigo-950 bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-500/20"
            >
              {lang === 'ar' ? 'إضافة وتثبيت السجل' : 'Add Faculty Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose }) => {
  const { addStudent, lang, t } = useApp();

  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('الصف السادس العلمي');
  const [section, setSection] = useState('أ');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [gpa, setGpa] = useState('98.5');
  const [enrollmentYear, setEnrollmentYear] = useState('2026');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !parentName || !parentPhone) return;

    addStudent({
      name,
      nationalId: nationalId || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      phone: studentPhone || undefined,
      email: studentEmail || undefined,
      gradeLevel,
      section,
      parentName,
      parentPhone,
      parentEmail: parentEmail || `${parentName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      gpa: parseFloat(gpa) || 98.0,
      enrollmentYear: enrollmentYear.trim() || '2026',
    });

    onClose();
    setName('');
    setNationalId('');
    setStudentPhone('');
    setStudentEmail('');
    setParentName('');
    setParentPhone('');
    setParentEmail('');
    setEnrollmentYear('2026');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-arabic">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-slate-900 border-b border-indigo-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/30 text-emerald-300 rounded-xl border border-emerald-500/40">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {lang === 'ar' ? 'إضافة طالبة متميزة جديدة' : 'Register New Gifted Student'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === 'ar' ? 'اسم الطالبة الرباعي الكامل *' : 'Student Full Name *'}
            </label>
            <input
              type="text"
              required
              placeholder={lang === 'ar' ? 'زهراء محمد جاسم الكعبي' : 'Zahra Mohammed Al-Kaabi'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'ar' ? 'الصف الدراسي *' : 'Grade Level *'}
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {ALL_GRADES_LIST.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'ar' ? 'الشعبة' : 'Section'}
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="أ">الشعبة (أ)</option>
                <option value="ب">الشعبة (ب)</option>
                <option value="ج">الشعبة (ج)</option>
                <option value="د">الشعبة (د)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'ar' ? 'الرقم الوطني / الهوية' : 'National ID'}
              </label>
              <input
                type="text"
                placeholder="1092837465"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'ar' ? 'المعدل الحالي (%)' : 'GPA Average (%)'}
              </label>
              <input
                type="number"
                step="0.1"
                min="50"
                max="100"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>{lang === 'ar' ? 'سنة القبول 🎓' : 'Enrollment Year 🎓'}</span>
                <span className="text-[9px] text-amber-300 bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">
                  في البطاقة
                </span>
              </label>
              <input
                type="text"
                placeholder="2026"
                value={enrollmentYear}
                onChange={(e) => setEnrollmentYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-amber-500/50 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {['2026', '2025', '2024', '2023', '2022'].map((yr) => (
                  <button
                    type="button"
                    key={yr}
                    onClick={() => setEnrollmentYear(yr)}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-all ${
                      enrollmentYear === yr
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>{lang === 'ar' ? 'رقم هاتف الطالبة' : 'Student Phone'}</span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">اختياري</span>
              </label>
              <input
                type="text"
                placeholder="0770xxxxxxx (اختياري)"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>{lang === 'ar' ? 'البريد الإلكتروني للطالبة' : 'Student Email'}</span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">اختياري</span>
              </label>
              <input
                type="email"
                placeholder="student@maysan-gifted.edu.iq (اختياري)"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-4 bg-indigo-950/50 rounded-2xl border border-indigo-800/40 space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              {lang === 'ar' ? 'بيانات ولي الأمر للتواصل والتنبيهات:' : 'Parent / Guardian Contact Info:'}
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'ar' ? 'اسم ولي الأمر *' : 'Parent Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={lang === 'ar' ? 'محمد جاسم الكعبي' : 'Mohammed Al-Kaabi'}
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ar' ? 'هاتف ولي الأمر *' : 'Parent Phone *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="0780xxxxxxx"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ar' ? 'بريد ولي الأمر' : 'Parent Email'}
                </label>
                <input
                  type="email"
                  placeholder="parent@gmail.com"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-indigo-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20"
            >
              {lang === 'ar' ? 'إضافة الطالبة وإنشاء الحسابات' : 'Register Student & Link Parent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
