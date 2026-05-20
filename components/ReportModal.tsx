import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ad, User, AdReport } from '../types';
import { api } from '../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: Ad;
  currentUser: User | null;
}

const REASONS: { value: AdReport['reason']; label: string }[] = [
  { value: 'INAPPROPRIATE', label: 'محتوى غير لائق' },
  { value: 'SCAM', label: 'عملية احتيال' },
  { value: 'OUTDATED', label: 'إعلان قديم / تم البيع' },
  { value: 'OTHER', label: 'سبب آخر' },
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, ad, currentUser }) => {
  const [reason, setReason] = useState<AdReport['reason']>('INAPPROPRIATE');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('يجب تسجيل الدخول أولاً للتبليغ عن إعلان');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.reportAd(ad, currentUser, reason, details);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setReason('INAPPROPRIATE');
        setDetails('');
      }, 2000);
    } catch (error) {
      alert('حدث خطأ أثناء إرسال البلاغ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4 text-right" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 font-cairo">التبليغ عن إعلان</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-8 text-center"
              >
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  <i className="fas fa-check"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">تم إرسال البلاغ</h3>
                <p className="text-gray-500 text-sm">شكراً لمساعدتنا في الحفاظ على أمان المنصة</p>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                  <img src={ad.image} alt={ad.title} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{ad.title}</h4>
                    <p className="text-xs text-gray-500">رقم الإعلان: {ad.id}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700">سبب التبليغ:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {REASONS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setReason(r.value)}
                        className={`p-3 rounded-xl border-2 text-right transition-all text-sm font-bold ${reason === r.value ? 'border-brand-green bg-brand-green/5 text-brand-green' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">تفاصيل إضافية (اختياري):</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="اشرح لنا المزيد عن المشكلة..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none h-24 resize-none text-sm bg-gray-50"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><i className="fas fa-circle-notch fa-spin"></i> جاري الإرسال...</>
                  ) : (
                    <><i className="fas fa-flag"></i> إرسال البلاغ</>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportModal;
