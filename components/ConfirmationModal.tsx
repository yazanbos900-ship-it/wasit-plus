
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  isDanger = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-right" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className={`w-16 h-16 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-brand-green/10 text-brand-green'} rounded-2xl flex items-center justify-center mb-6 mx-auto text-2xl`}>
            <i className={`fas ${isDanger ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}></i>
          </div>
          <h2 className="text-2xl font-black text-gray-900 text-center mb-3 font-cairo">{title}</h2>
          <p className="text-gray-500 text-center leading-relaxed font-medium">
            {message}
          </p>
        </div>
        <div className="p-6 bg-gray-50 flex gap-4">
          <button 
            onClick={onConfirm}
            className={`flex-1 py-4 rounded-xl font-bold transition-all shadow-lg text-white ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-brand-black hover:bg-gray-800 shadow-black/20'}`}
          >
            {confirmText}
          </button>
          <button 
            onClick={onCancel}
            className="flex-1 py-4 rounded-xl font-bold bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all font-cairo"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
