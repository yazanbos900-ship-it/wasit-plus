import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const UpdateOverlay: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setShowUpdate(true);
    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-4 right-4 z-[1000] bg-brand-black text-white p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3 border border-brand-green/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center text-black">
              <i className="fas fa-sync-alt animate-spin"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-black text-sm font-cairo">يتوفر تحديث جديد</h3>
              <p className="text-[10px] text-gray-400 font-cairo">تم تحسين التطبيق، يرجى التحديث للحصول على النسخة الأحدث.</p>
            </div>
          </div>
          
          <button 
            onClick={handleReload}
            className="w-full bg-brand-green text-black font-black py-3 rounded-xl text-xs hover:bg-brand-green-dark transition-all active:scale-95 font-cairo"
          >
            تحديث الآن
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateOverlay;
