import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  Camera,
  MapPin,
  Clock,
  Tag,
  FileText,
  Building,
  Upload,
  Search,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';

export interface NewsItem {
  id: string;
  title: string;
  category: 'أخبار عاجلة' | 'مهرجانات' | 'معارض علمية' | 'رياضة' | 'تكريم';
  date: string;
  image: string;
  summary: string;
  fullContent: string;
  location: string;
  organizer: string;
}

interface EditNewsEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsList: NewsItem[];
  onSaveNewsList: (list: NewsItem[]) => void;
  onResetDefault?: () => void;
}

const PRESET_NEWS_IMAGES = [
  { label: 'مهرجان الابتكار', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80' },
  { label: 'المعرض العلمي', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80' },
  { label: 'البطولة الرياضية', url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=80' },
  { label: 'حفل التكريم', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80' },
  { label: 'المختبرات الذكية', url: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&auto=format&fit=crop&q=80' },
  { label: 'الأنشطة المدرسية', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80' },
];

export const EditNewsEventsModal: React.FC<EditNewsEventsModalProps> = ({
  isOpen,
  onClose,
  newsList,
  onSaveNewsList,
  onResetDefault,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localList, setLocalList] = useState<NewsItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('الكل');
  const [savedToast, setSavedToast] = useState(false);

  // Active item form data
  const [formData, setFormData] = useState<NewsItem>({
    id: '',
    title: '',
    category: 'مهرجانات',
    date: '',
    image: PRESET_NEWS_IMAGES[0].url,
    summary: '',
    fullContent: '',
    location: '',
    organizer: '',
  });

  useEffect(() => {
    if (isOpen) {
      setLocalList(newsList);
      if (newsList.length > 0) {
        setSelectedId(newsList[0].id);
        setFormData({ ...newsList[0] });
      } else {
        createNewNewsItem();
      }
    }
  }, [isOpen, newsList]);

  const handleSelectNews = (id: string) => {
    setSelectedId(id);
    const target = localList.find((n) => n.id === id);
    if (target) {
      setFormData({ ...target });
    }
  };

  const createNewNewsItem = () => {
    const newId = `news_${Date.now()}`;
    const newItem: NewsItem = {
      id: newId,
      title: 'عنوان الفعالية أو الخبر الجديد 2026',
      category: 'مهرجانات',
      date: '15 أغسطس 2026',
      image: PRESET_NEWS_IMAGES[0].url,
      summary: 'ملخص موجز لأبرز الفعاليات والأنشطة التي تمت إقامتها في المدرسة...',
      fullContent: 'تفاصيل التقرير الكامل حول المناسبة أو المهرجان والمشاركات الفعالة لطالبات ثانوية ميسان للمتميزات...',
      location: 'القاعة الكبرى للمؤتمرات - ثانوية ميسان للمتميزات',
      organizer: 'إدارة المدرسة ودائرة الموهوبين والابتكار الرقمي',
    };
    const updated = [newItem, ...localList];
    setLocalList(updated);
    setSelectedId(newId);
    setFormData(newItem);
  };

  const handleDeleteCurrent = () => {
    if (localList.length <= 1) {
      alert('يجب الإبقاء على خبر أو فعالية واحدة على الأقل في السجل.');
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف الفعالية/الخبر "${formData.title}"؟`)) {
      const updated = localList.filter((n) => n.id !== selectedId);
      setLocalList(updated);
      if (updated.length > 0) {
        setSelectedId(updated[0].id);
        setFormData({ ...updated[0] });
      }
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, image: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (field: keyof NewsItem, value: any) => {
    const updatedForm = { ...formData, [field]: value };
    setFormData(updatedForm);
    // Sync with local list automatically
    setLocalList((prev) => prev.map((item) => (item.id === selectedId ? updatedForm : item)));
  };

  const handleSaveAll = () => {
    // Ensure active item is synced
    const updatedList = localList.map((item) => (item.id === selectedId ? formData : item));
    onSaveNewsList(updatedList);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  const filteredLocalList = localList.filter((item) => {
    const matchesCategory = selectedCategoryFilter === 'الكل' || item.category === selectedCategoryFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-arabic dir-rtl">
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
        
        {/* Toast Notification */}
        {savedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-teal-500 text-slate-950 font-extrabold text-xs shadow-xl flex items-center gap-2 border border-teal-300 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>تم حفظ ونشر جميع الأخبار والفعاليات والمهرجانات بنجاح! 🎉</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
              <Megaphone className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>تعديل وإدارة الأخبار والمناسبات والمهرجانات</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  لوحة المديرة والبرمجيات
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                إضافة، تعديل، وحذف الأخبار والفعاليات والمهرجانات المدرسية المعروضة في اللوحة الرئيسية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onResetDefault && (
              <button
                type="button"
                onClick={onResetDefault}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all border border-slate-700"
                title="إعادة تعيين للأخبار الافتراضية"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">افتراضي</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-800">
          
          {/* Sidebar: News Items Navigation & Filters (md:col-span-4) */}
          <div className="md:col-span-4 p-4 bg-slate-950/60 flex flex-col gap-3 overflow-y-auto">
            
            {/* Create New Button */}
            <button
              type="button"
              onClick={createNewNewsItem}
              className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>إضافة خبر أو مهرجان جديد +</span>
            </button>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute top-3 right-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الأخبار..."
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {['الكل', 'مهرجانات', 'معارض علمية', 'رياضة', 'تكريم', 'أخبار عاجلة'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategoryFilter === cat
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* News List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {filteredLocalList.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectNews(item.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/80 border-indigo-500 shadow-md'
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={item.image || PRESET_NEWS_IMAGES[0].url}
                      alt={item.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="overflow-hidden space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 font-bold border border-slate-700">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.date}</span>
                      </div>
                      <h4 className="font-bold text-xs text-white truncate">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{item.summary}</p>
                    </div>
                  </div>
                );
              })}

              {filteredLocalList.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا توجد أخبار مطابقة للبحث
                </div>
              )}
            </div>

          </div>

          {/* Form Editor Panel (md:col-span-8) */}
          <div className="md:col-span-8 p-5 space-y-4 overflow-y-auto">
            
            {/* Header / Actions Row */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  تحرير بيانات الخبر: ({formData.title || 'جديد'})
                </span>
              </div>

              <button
                type="button"
                onClick={handleDeleteCurrent}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1 transition-all border border-rose-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الخبر</span>
              </button>
            </div>

            {/* Input Grid */}
            <div className="space-y-4">
              
              {/* News Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    عنوان الفعالية / الخبر الرئيسي:
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="عنوان الفعالية..."
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    التصنيف:
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="مهرجانات">مهرجانات 🎭</option>
                    <option value="معارض علمية">معارض علمية 🔬</option>
                    <option value="رياضة">رياضة 🏆</option>
                    <option value="تكريم">تكريم 🎖️</option>
                    <option value="أخبار عاجلة">أخبار عاجلة 🚨</option>
                  </select>
                </div>
              </div>

              {/* Date, Location, Organizer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>التاريخ:</span>
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                    placeholder="مثال: 01 أغسطس 2026"
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span>مكان الفعالية:</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="مثال: القاعة الكبرى"
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-teal-400" />
                    <span>جهة التنظيم والإشراف:</span>
                  </label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => handleFormChange('organizer', e.target.value)}
                    placeholder="جهة التنظيم..."
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* News Image Selection & Upload */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-teal-400" />
                  <span>الصورة البارزة للفعالية / الخبر:</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={formData.image || PRESET_NEWS_IMAGES[0].url}
                    alt="معاينة صورة الخبر"
                    className="w-32 h-20 rounded-xl object-cover border-2 border-teal-500/40 shadow-md shrink-0"
                    referrerPolicy="no-referrer"
                  />

                  <div className="space-y-2 w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-teal-500/30 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع صورة جديدة من جهازك 📸</span>
                    </button>

                    <div className="text-[11px] text-slate-400">أو اختر صورة من المكتبة السريعة:</div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {PRESET_NEWS_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleFormChange('image', img.url)}
                          className={`relative rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                            formData.image === img.url ? 'border-teal-400 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img.url} alt={img.label} className="w-12 h-9 object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الملخص الموجز (يظهر في الكارت بالرئيسية):
                </label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => handleFormChange('summary', e.target.value)}
                  placeholder="ملخص موجز حول الخبر أو المهرجان..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  التقرير الكامل والالتزامات التفصيلية للفعالية:
                </label>
                <textarea
                  rows={4}
                  value={formData.fullContent}
                  onChange={(e) => handleFormChange('fullContent', e.target.value)}
                  placeholder="أدخل تفاصيل التقرير الكامل الذي سيظهر عند الضغط على زر (اقرأ الفعالية)..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>سيتم نشر السجل المحدث تلقائياً وإتاحته لجميع زوار المنصة</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتطبيق جميع الأخبار 💾</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
