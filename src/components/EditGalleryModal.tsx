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
  Upload,
  Search,
  ShieldCheck,
  Tag,
  FileText,
  Maximize2,
  FolderOpen,
} from 'lucide-react';

export interface GalleryPhoto {
  id: string;
  title: string;
  category: 'المختبرات العلمية' | 'المهرجانات والفعاليات' | 'الابتكارات والهندسة' | 'الأنشطة الرياضية';
  url: string;
  date: string;
  desc: string;
}

interface EditGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryList: GalleryPhoto[];
  onSaveGalleryList: (list: GalleryPhoto[]) => void;
  onResetDefault?: () => void;
}

const PRESET_GALLERY_IMAGES = [
  { label: 'مختبر الفيزياء', url: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&auto=format&fit=crop&q=80' },
  { label: 'معرض الروبوتات', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80' },
  { label: 'بطولة الشطرنج', url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=80' },
  { label: 'مختبر الكيمياء', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80' },
  { label: 'حفل تكريم المتفوقات', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80' },
  { label: 'الأنشطة المدرسية', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80' },
  { label: 'المكتبة الإلكترونية', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80' },
  { label: 'مختبر الحاسوب', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80' },
];

export const EditGalleryModal: React.FC<EditGalleryModalProps> = ({
  isOpen,
  onClose,
  galleryList,
  onSaveGalleryList,
  onResetDefault,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localList, setLocalList] = useState<GalleryPhoto[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('الكل');
  const [savedToast, setSavedToast] = useState(false);

  // Active photo form state
  const [formData, setFormData] = useState<GalleryPhoto>({
    id: '',
    title: '',
    category: 'المختبرات العلمية',
    url: PRESET_GALLERY_IMAGES[0].url,
    date: '2026',
    desc: '',
  });

  useEffect(() => {
    if (isOpen) {
      setLocalList(galleryList);
      if (galleryList.length > 0) {
        setSelectedId(galleryList[0].id);
        setFormData({ ...galleryList[0] });
      } else {
        createNewPhotoItem();
      }
    }
  }, [isOpen, galleryList]);

  const handleSelectPhoto = (id: string) => {
    setSelectedId(id);
    const target = localList.find((g) => g.id === id);
    if (target) {
      setFormData({ ...target });
    }
  };

  const createNewPhotoItem = () => {
    const newId = `gallery_${Date.now()}`;
    const newPhoto: GalleryPhoto = {
      id: newId,
      title: 'عنوان النشاط أو الصورة التوثيقية الجديدة',
      category: 'المختبرات العلمية',
      url: PRESET_GALLERY_IMAGES[0].url,
      date: '2026',
      desc: 'وصف توثيقي مختصر للنشاط أو الفعالية المصورة في ثانوية ميسان للمتميزات...',
    };
    const updated = [newPhoto, ...localList];
    setLocalList(updated);
    setSelectedId(newId);
    setFormData(newPhoto);
  };

  const handleDeleteCurrent = () => {
    if (localList.length <= 1) {
      alert('يجب الإبقاء على صورة واحدة على الأقل في معرض الصور التوثيقي.');
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف الصورة "${formData.title}" من معرض الصور؟`)) {
      const updated = localList.filter((g) => g.id !== selectedId);
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
          handleFormChange('url', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (field: keyof GalleryPhoto, value: any) => {
    const updatedForm = { ...formData, [field]: value };
    setFormData(updatedForm);
    // Sync with local list automatically
    setLocalList((prev) => prev.map((item) => (item.id === selectedId ? updatedForm : item)));
  };

  const handleSaveAll = () => {
    const updatedList = localList.map((item) => (item.id === selectedId ? formData : item));
    onSaveGalleryList(updatedList);
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
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-arabic dir-rtl">
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
        
        {/* Toast Notification */}
        {savedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-teal-500 text-slate-950 font-extrabold text-xs shadow-xl flex items-center gap-2 border border-teal-300 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>تم حفظ وتحديث معرض الصور والأنشطة التوثيقي بنجاح! 📸</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold">
              <ImageIcon className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>تعديل وإدارة معرض الصور والأنشطة التوثيقي</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  لوحة الإدارة والتوثيق
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                إضافة صور جديدة، رفع الصور من الجهاز، وتحديث العناوين والتصنيفات في معرض الأنشطة المدرسية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onResetDefault && (
              <button
                type="button"
                onClick={onResetDefault}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all border border-slate-700"
                title="إعادة تعيين للمعرض الافتراضي"
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
          
          {/* Sidebar: Gallery List & Filters (md:col-span-4) */}
          <div className="md:col-span-4 p-4 bg-slate-950/60 flex flex-col gap-3 overflow-y-auto">
            
            {/* Add New Photo Button */}
            <button
              type="button"
              onClick={createNewPhotoItem}
              className="w-full py-2.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30 transition-all"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>إضافة صورة / نشاط توثيقي جديد +</span>
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute top-3 right-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الصور والأنشطة..."
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {['الكل', 'المختبرات العلمية', 'المهرجانات والفعاليات', 'الابتكارات والهندسة', 'الأنشطة الرياضية'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategoryFilter === cat
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Gallery Items List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {filteredLocalList.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectPhoto(item.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-teal-950/80 border-teal-500 shadow-md'
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={item.url || PRESET_GALLERY_IMAGES[0].url}
                      alt={item.title}
                      className="w-14 h-12 rounded-xl object-cover shrink-0 border border-slate-700"
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
                      <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
                    </div>
                  </div>
                );
              })}

              {filteredLocalList.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا توجد صور مطابقة للبحث
                </div>
              )}
            </div>

          </div>

          {/* Editor Form Panel (md:col-span-8) */}
          <div className="md:col-span-8 p-5 space-y-4 overflow-y-auto">
            
            {/* Header Action Row */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-teal-400" />
                  تعديل بيانات الصورة: ({formData.title || 'جديد'})
                </span>
              </div>

              <button
                type="button"
                onClick={handleDeleteCurrent}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1 transition-all border border-rose-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الصورة</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    عنوان الصورة أو النشاط التوثيقي:
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="مثال: تجارب مادة الفيزياء بالمطياف الذكي..."
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    التصنيف الرئيسية:
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value="المختبرات العلمية">المختبرات العلمية 🔬</option>
                    <option value="المهرجانات والفعاليات">المهرجانات والفعاليات 🎭</option>
                    <option value="الابتكارات والهندسة">الابتكارات والهندسة 🤖</option>
                    <option value="الأنشطة الرياضية">الأنشطة الرياضية 🏆</option>
                  </select>
                </div>
              </div>

              {/* Date & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>سنة أو تاريخ التقاط الصورة:</span>
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                    placeholder="مثال: 2026"
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-8">
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>رابط الصورة المباشر (URL):</span>
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => handleFormChange('url', e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Image Preview & Upload Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-teal-400" />
                  <span>الصورة الحالية وخيارات الرفع والتغيير:</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={formData.url || PRESET_GALLERY_IMAGES[0].url}
                    alt="معاينة صورة المعرض"
                    className="w-40 h-24 rounded-2xl object-cover border-2 border-teal-500/40 shadow-md shrink-0"
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
                      className="w-full py-2.5 px-4 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs flex items-center justify-center gap-2 border border-teal-500/30 transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      <span>رفع صورة جديدة من جهازك الكمبيوتر/الموبايل 📸</span>
                    </button>

                    <div className="text-[11px] text-slate-400">أو اختر صورة توثيقية جاهزة من المكتبة:</div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {PRESET_GALLERY_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleFormChange('url', img.url)}
                          className={`relative rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                            formData.url === img.url ? 'border-teal-400 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          title={img.label}
                        >
                          <img src={img.url} alt={img.label} className="w-12 h-9 object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  الوصف التوثيقي المختصر للنشاط:
                </label>
                <textarea
                  rows={3}
                  value={formData.desc}
                  onChange={(e) => handleFormChange('desc', e.target.value)}
                  placeholder="وصف مختصر للتجربة أو الفعالية المصورة..."
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>سيتم تحديث المعرض التوثيقي فوراً وحفظ البيانات في المنصة</span>
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
              className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-lg shadow-teal-600/30 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتطبيق المعرض التوثيقي 💾</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
