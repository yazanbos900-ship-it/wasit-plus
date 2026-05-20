
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Category } from '../types';

interface CreateAdProps {
  onSuccess: () => void;
}

const CreateAd: React.FC<CreateAdProps> = ({ onSuccess }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    condition: 'new' as 'new' | 'used',
    location: 'الرياض',
    images: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCategories().then(data => {
      setCategories(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, category: data[0].name }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title || !formData.price || formData.images.length === 0) {
      setError('يرجى ملء الحقول الأساسية ورفع صورة واحدة على الأقل');
      return;
    }

    setLoading(true);
    try {
      await api.createAd({
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-12">
      <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex items-center gap-3 mb-8 border-b pb-4">
           <div className="w-10 h-10 bg-brand-green/10 text-brand-green rounded-xl flex items-center justify-center">
              <i className="fas fa-plus-circle text-xl"></i>
           </div>
           <h2 className="text-xl sm:text-2xl font-black text-gray-900">إضافة إعلان جديد</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">عنوان الإعلان</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 outline-none transition-all"
                placeholder="ماذا تبيع؟"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">السعر الحالي (ر.س)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">السعر قبل الخصم (اختياري)</label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 outline-none transition-all"
                placeholder="اختياري"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">التصنيف</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 outline-none transition-all bg-white"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">حالة السلعة</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({...formData, condition: e.target.value as 'new' | 'used'})}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 outline-none transition-all bg-white"
              >
                <option value="new">جديد</option>
                <option value="used">مستعمل</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">المدينة / الموقع</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 outline-none transition-all bg-white"
              >
                {[
                  "الرياض",
                  "جدة",
                  "الدمام",
                  "مكة المكرمة",
                  "المدينة المنورة",
                  "القصيم",
                  "عسير",
                  "تبوك",
                  "حائل",
                  "الحدود الشمالية",
                  "جازان",
                  "نجران",
                  "الباحة",
                  "الجوف",
                  "أخرى"
                ].map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">وصف الإعلان</label>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 outline-none transition-all"
              placeholder="اكتب مواصفات السلعة وحالتها بدقة..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">صور الإعلان (بحد أقصى 5 صور)</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 mb-4">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden border group shadow-sm">
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <i className="fas fa-times text-[8px]"></i>
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-brand-black/80 backdrop-blur-sm text-brand-green text-[6px] sm:text-[8px] font-black text-center py-0.5 sm:py-1 uppercase tracking-tighter">
                      الأساسية
                    </div>
                  )}
                </div>
              ))}
              {formData.images.length < 5 && (
                <div className="relative group aspect-square">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        const newImages = await Promise.all(
                          files.slice(0, 5 - formData.images.length).map(file => api.fileToBase64(file))
                        );
                        setFormData(prev => ({
                          ...prev,
                          images: [...prev.images, ...newImages]
                        }));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center bg-gray-50 group-hover:bg-gray-100 group-hover:border-brand-green/30 transition-all">
                    <i className="fas fa-camera text-base sm:text-xl text-gray-300 mb-0.5 sm:mb-1 group-hover:text-brand-green transition-colors"></i>
                    <span className="text-[7px] sm:text-[8px] text-gray-400 font-bold">رفع</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-100">
               <i className="fas fa-exclamation-circle text-sm"></i>
               {error}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-black text-brand-green py-4 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-brand-green border-t-transparent rounded-full"></div>
                  جاري النشر...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  <span>نشر الإعلان الآن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAd;
