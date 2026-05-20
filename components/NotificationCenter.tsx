import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../context/NotificationContext';

interface NotificationCenterProps {
  onNavigate: (page: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-brand-green transition"
      >
        <i className="fas fa-bell text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-brand-black">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[140]" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[150] overflow-hidden text-right"
              dir="rtl"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-sm">التنبيهات</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] text-brand-green hover:underline"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <i className="fas fa-bell-slash text-gray-700 text-2xl mb-2"></i>
                    <p className="text-gray-500 text-xs">لا توجد تنبيهات حالياً</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) onNavigate(n.link);
                        setIsOpen(false);
                      }}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50/50 transition cursor-pointer flex gap-3 ${!n.isRead ? 'bg-brand-green/5' : ''}`}
                    >
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-brand-green' : 'bg-transparent'}`} />
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-gray-900 text-xs font-bold">{n.title}</h4>
                          <span className="text-[9px] text-gray-400">
                            {new Date(n.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-gray-500 text-[10px] leading-relaxed line-clamp-2">{n.message}</p>
                        
                        <div className="flex items-center gap-1 mt-2 text-[9px]">
                           {n.type === 'MESSAGE' && <i className="fas fa-comment text-blue-400"></i>}
                           {n.type === 'ORDER_UPDATE' && <i className="fas fa-box text-brand-green"></i>}
                           {n.type === 'NEW_AD' && <i className="fas fa-bullhorn text-amber-400"></i>}
                           <span className="text-gray-600">
                             {n.type === 'MESSAGE' ? 'رسالة' : n.type === 'ORDER_UPDATE' ? 'تحديث طلب' : 'إعلان جديد'}
                           </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center">
                <button className="text-[10px] text-gray-400 hover:text-gray-900 transition">مشاهدة الكل</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
