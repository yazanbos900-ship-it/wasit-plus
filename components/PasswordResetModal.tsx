
import React, { useState } from 'react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newPassword: string) => void;
  userName?: string;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose, onConfirm, userName }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    onConfirm(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 text-right" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center mb-6 mx-auto text-2xl">
            <i className="fas fa-key"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 text-center mb-3 font-cairo">إعادة تعيين كلمة المرور</h2>
          <p className="text-gray-500 text-center leading-relaxed font-medium mb-6">
            {userName ? `تغيير كلمة المرور للمستخدم: ${userName}` : 'أدخل كلمة المرور الجديدة أدناه'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور الجديدة</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none bg-gray-50"
                placeholder="أدخل 4 أحرف على الأقل"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">تأكيد كلمة المرور</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none bg-gray-50"
                placeholder="أعد كتابة كلمة المرور"
              />
            </div>

            {error && (
              <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg flex items-center gap-2 animate-pulse">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button 
                type="submit"
                className="flex-1 py-4 rounded-xl font-bold bg-brand-black text-white hover:bg-gray-800 transition shadow-lg shadow-black/10"
              >
                تحديث الآن
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 rounded-xl font-bold bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition"
              >
                تراجع
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;
