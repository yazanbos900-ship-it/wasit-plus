import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gmailService } from '../services/gmail';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerEmail: string;
  sellerName: string;
  adTitle: string;
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, sellerEmail, sellerName, adTitle }) => {
  const [subject, setSubject] = useState(`بخصوص إعلانك: ${adTitle}`);
  const [message, setMessage] = useState(`مرحباً ${sellerName}،\n\nأنا مهتم بإعلانك "${adTitle}" وأود معرفة المزيد من التفاصيل.\n\nبانتظار ردك.`);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);

    try {
      if (!window.confirm('هل أنت متأكد من رغبتك في إرسال هذا البريد الإلكتروني؟')) {
        setIsSending(false);
        return;
      }
      await gmailService.sendEmail(sellerEmail, subject, message);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'فشل إرسال البريد الإلكتروني');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10"
            dir="rtl"
          >
            <div className="p-6 bg-brand-green text-black">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black tracking-tight">إرسال بريد إلكتروني للبائع</h2>
                <button onClick={onClose} className="hover:bg-black/10 p-2 rounded-full transition">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <p className="text-sm font-bold opacity-70 mt-1">المستلم: {sellerName}</p>
            </div>

            <div className="p-6">
              {success ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    <i className="fas fa-check"></i>
                  </div>
                  <h3 className="text-lg font-black text-gray-900">تم الإرسال بنجاح!</h3>
                  <p className="text-gray-500 text-sm mt-2">تم إرسال بريدك الإلكتروني بنجاح للبائع.</p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">الموضوع</label>
                    <input 
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-brand-green outline-none font-bold text-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">الرسالة</label>
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-brand-green outline-none h-40 font-bold text-gray-800 resize-none"
                      required
                    ></textarea>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                      <i className="fas fa-exclamation-circle"></i>
                      {error}
                    </div>
                  )}

                  <button 
                    disabled={isSending}
                    type="submit"
                    className="w-full bg-brand-green text-black font-black py-4 rounded-xl shadow-lg shadow-brand-green/20 hover:bg-brand-green/90 transition flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i>
                        إرسال الآن
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EmailModal;
