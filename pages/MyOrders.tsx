
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Order, User } from '../types';

interface MyOrdersProps {
  currentUser: User;
  onNavigate: (page: string) => void;
}

const MyOrders: React.FC<MyOrdersProps> = ({ currentUser, onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const myOrders = await api.getUserOrders(currentUser.id, 'buyer');
        setOrders(myOrders);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser.id]);

  const getStatusInfo = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return { text: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700', step: 1 };
      case 'PROCESSING': return { text: 'قيد التجهيز', color: 'bg-blue-100 text-blue-700', step: 2 };
      case 'SHIPPING': return { text: 'قيد التسليم للكابتن', color: 'bg-indigo-100 text-indigo-700', step: 3 };
      case 'ARRIVED': return { text: 'وصل الكابتن', color: 'bg-purple-100 text-purple-700', step: 4 };
      case 'DELIVERED': return { text: 'تم التسليم', color: 'bg-brand-green/20 text-brand-green', step: 5 };
      case 'COMPLETED': return { text: 'مكتمل', color: 'bg-green-100 text-green-700', step: 5 };
      case 'CANCELLED': return { text: 'ملغي', color: 'bg-red-100 text-red-700', step: 0 };
      default: return { text: status, color: 'bg-gray-100 text-gray-700', step: 0 };
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-cairo">طلباتي</h1>
          <p className="text-gray-500 text-sm mt-1">تتبع حالة مشترياتك ورموز التسليم</p>
        </div>
        <button 
          onClick={() => onNavigate('home')}
          className="text-gray-400 hover:text-brand-green transition"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border shadow-sm">
          <div className="text-6xl text-gray-100 mb-6 font-blue">
            <i className="fas fa-shopping-bag"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">لا توجد طلبات بعد</h2>
          <p className="text-gray-500 mb-8">ابدأ بالتسوق الآن واستكشف أفضل العروض</p>
          <button 
            onClick={() => onNavigate('home')}
            className="bg-brand-green text-black px-8 py-3 rounded-2xl font-bold hover:bg-brand-greenDark transition"
          >
            تصفح الإعلانات
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <div key={order.id} className="bg-white rounded-3xl border shadow-sm overflow-hidden border-brand-green/5">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border shrink-0">
                        <i className="fas fa-box text-xl"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{order.adTitle}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-gray-400">{order.id}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-[10px] text-gray-400">{new Date(order.date).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${statusInfo.color}`}>
                      {statusInfo.text}
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  {order.status !== 'CANCELLED' && (
                    <div className="mb-8 px-2">
                       <div className="relative flex justify-between">
                          {[1, 2, 3, 4, 5].map((step) => (
                            <div key={step} className="flex flex-col items-center relative z-10">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${statusInfo.step >= step ? 'bg-brand-green border-brand-green text-black' : 'bg-white border-gray-200 text-gray-300'}`}>
                                  {statusInfo.step > step ? <i className="fas fa-check text-xs"></i> : <span className="text-[10px] font-bold">{step}</span>}
                               </div>
                               <span className={`text-[8px] mt-2 font-bold ${statusInfo.step >= step ? 'text-brand-green' : 'text-gray-300'}`}>
                                  {step === 1 ? 'مراجعة' : step === 2 ? 'تجهيز' : step === 3 ? 'تسليم' : step === 4 ? 'وصول' : 'تم'}
                               </span>
                            </div>
                          ))}
                          {/* Background Progress Line */}
                          <div className="absolute top-4 left-4 right-4 h-[2px] bg-gray-100 -z-0"></div>
                          <div 
                             className="absolute top-4 right-4 h-[2px] bg-brand-green transition-all duration-700 -z-0"
                             style={{ width: `${Math.min((statusInfo.step - 1) * 25, 100)}%`, left: 'auto' }}
                          ></div>
                       </div>
                    </div>
                  )}

                  {/* Delivery Code Section */}
                  {['SHIPPING', 'ARRIVED'].includes(order.status) && (
                    <div className="bg-brand-black text-white p-6 rounded-2xl mb-6 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-brand-green"></div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-brand-green text-[10px] font-black mb-1 uppercase tracking-wider">رمز التسليم (للكابتن)</h4>
                          <div className="text-3xl font-mono tracking-[12px] font-black">{order.deliveryCode}</div>
                        </div>
                        <div className="text-3xl text-white/10 opacity-50 group-hover:opacity-100 transition-opacity">
                          <i className="fas fa-shield-alt"></i>
                        </div>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-3 font-medium flex items-center gap-1">
                        <i className="fas fa-exclamation-triangle text-amber-500"></i>
                         يرجى عدم مشاركة هذا الرمز مع أي شخص باستثناء كابتن التوصيل عند استلام الطلب.
                      </p>
                    </div>
                  )}

                  {/* Order Details Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-dashed">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">القيمة الإجمالية</div>
                        <div className="text-lg font-black text-gray-900">{order.amount.toLocaleString()} <span className="text-[10px]">ر.س</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">طريقة الدفع</div>
                        <div className="text-sm font-bold text-gray-700">
                          {order.paymentMethod === 'ONLINE' ? 'إلكتروني' : 'عند الاستلام'}
                        </div>
                      </div>
                    </div>
                    {order.status === 'PENDING' && (
                      <button 
                        onClick={() => api.updateOrderStatus(order.id, 'CANCELLED').then(() => window.location.reload())}
                        className="text-xs font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition"
                      >
                        إلغاء الطلب
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
