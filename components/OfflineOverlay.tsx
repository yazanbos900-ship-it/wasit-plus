import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const OfflineOverlay: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-4xl mb-6 animate-pulse">
            <i className="fas fa-wifi"></i>
            <div className="absolute inset-0 rounded-full border-4 border-red-500/20 animate-ping"></div>
          </div>
          
          <h2 className="text-2xl font-black text-brand-black mb-2 font-cairo">أنت غير متصل بالإنترنت</h2>
          <p className="text-gray-500 mb-8 max-w-xs font-cairo text-sm leading-relaxed">
            يتطلب وسيط بلاس اتصالاً بالإنترنت لضمان الحصول على أحدث الإعلانات والأسعار الحقيقية.
          </p>
          
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={() => window.location.reload()}
              className="bg-brand-green text-black font-black py-4 rounded-2xl shadow-xl shadow-brand-green/20 active:scale-95 transition-all font-cairo"
            >
              إعادة التحميل
            </button>
            
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <span className="w-8 h-[1px] bg-gray-200"></span>
              <span>محاولة الاتصال تلقائياً</span>
              <span className="w-8 h-[1px] bg-gray-200"></span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineOverlay;
