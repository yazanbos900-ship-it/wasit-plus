
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { gmailService, GmailMessage } from '../services/gmail';
import { Ad, User, ChatRoom, Order } from '../types';
import AdCard from '../components/AdCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { useFirebase } from '../context/FirebaseContext';

interface SellerDashboardProps {
  currentUser: User;
  onNavigate: (page: string) => void;
  onAdClick: (id: string) => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ currentUser, onNavigate, onAdClick }) => {
  const [myAds, setMyAds] = useState<Ad[]>([]);
  const [myChats, setMyChats] = useState<ChatRoom[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [recentEmails, setRecentEmails] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [view, setView] = useState<'ads' | 'reports' | 'settings'>('ads');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; adId: string | null }>({ isOpen: false, adId: null });
  
  // Store settings state
  const [storeName, setStoreName] = useState(currentUser.storeName || currentUser.name);
  const [storeImage, setStoreImage] = useState(currentUser.storeImage || 'https://picsum.photos/seed/shop/200');
  const [storeDesc, setStoreDesc] = useState(currentUser.storeDescription || '');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filteredAds, filteredChats, filteredOrders] = await Promise.all([
        api.getUserAds(currentUser.id),
        api.getUserChats(currentUser.id),
        api.getUserOrders(currentUser.id, 'seller')
      ]);

      setMyAds(filteredAds);
      setMyChats(filteredChats);
      setMyOrders(filteredOrders);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = async () => {
    if (!gmailToken) return;
    setEmailsLoading(true);
    try {
      const messages = await gmailService.listMessages(3);
      setRecentEmails(messages);
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setEmailsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const handleDeleteAd = async (id: string) => {
    setDeleteModal({ isOpen: true, adId: id });
  };

  const confirmDelete = async () => {
    if (deleteModal.adId) {
      await api.deleteAd(deleteModal.adId);
      setDeleteModal({ isOpen: false, adId: null });
      fetchData();
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateStoreInfo(currentUser.id, {
        storeName,
        storeImage,
        storeDescription: storeDesc
      });
      alert('تم تحديث إعدادات المتجر بنجاح');
    } catch (e) {
      alert('فشل التحديث');
    }
  };

  const handleResetPassword = async () => {
    alert('رابط إعادة تعيين كلمة المرور سيصلك عبر البريد الخاص بك');
  };

  const totalRevenue = myOrders.reduce((sum, order) => sum + order.amount, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 text-right">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border bg-white overflow-hidden shadow-sm">
            <img src={currentUser.storeImage || 'https://picsum.photos/seed/shop/200'} alt="Store" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 font-cairo">لوحة تحكم {currentUser.storeName || 'المتجر'}</h1>
            <p className="text-gray-500 text-sm mt-1">مرحباً بك مجدداً، {currentUser.name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate('create-ad')}
            className="bg-brand-green text-black px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-green/20 hover:bg-opacity-90 transition"
          >
            <i className="fas fa-plus ml-2"></i>
            إضافة إعلان جديد
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8 w-fit mx-auto lg:mx-0">
        <button 
          onClick={() => setView('ads')}
          className={`px-8 py-2 md:py-2.5 rounded-xl font-bold transition-all text-sm md:text-base ${view === 'ads' ? 'bg-white shadow-md text-brand-green' : 'text-gray-500 hover:text-gray-900'}`}
        >
          إعلاناتي
        </button>
        <button 
          onClick={() => setView('reports')}
          className={`px-8 py-2 md:py-2.5 rounded-xl font-bold transition-all text-sm md:text-base ${view === 'reports' ? 'bg-white shadow-md text-brand-green' : 'text-gray-500 hover:text-gray-900'}`}
        >
          التقارير المالية
        </button>
        <button 
          onClick={() => setView('settings')}
          className={`px-8 py-2 md:py-2.5 rounded-xl font-bold transition-all text-sm md:text-base ${view === 'settings' ? 'bg-white shadow-md text-brand-green' : 'text-gray-500 hover:text-gray-900'}`}
        >
          إعدادات المتجر
        </button>
      </div>

      {view === 'ads' ? (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: My Ads */}
          <div className="lg:col-span-2 flex-grow">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-right">
              <i className="fas fa-list text-brand-green"></i>
              إعلاناتي النشطة ({myAds.length})
            </h2>
            {myAds.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border text-center shadow-sm">
                <p className="text-gray-400 font-medium">ليس لديك أي إعلانات حالياً</p>
                <button 
                  onClick={() => onNavigate('create-ad')}
                  className="text-brand-green font-bold mt-4 hover:underline"
                >
                  ابدأ بنشر أول إعلان لك الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {myAds.map(ad => (
                  <div key={ad.id} className="relative group">
                     <div className="absolute top-2 left-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteAd(ad.id); }}
                          className="bg-white/90 backdrop-blur-sm p-2 rounded-lg text-red-500 hover:text-red-700 shadow border"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                     </div>
                     <AdCard ad={ad} onClick={onAdClick} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:w-80 shrink-0">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-right">
              <i className="fas fa-history text-brand-green"></i>
              نشاطات حديثة
            </h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                 <h3 className="text-sm font-bold mb-3 border-b pb-2 text-right">آخر المحادثات</h3>
                 {myChats.slice(0, 3).map(chat => (
                   <div key={chat.id} className="flex flex-col mb-3 pb-3 border-b last:border-0 text-right text-sm">
                     <span className="font-bold text-gray-800 truncate">{chat.adTitle}</span>
                     <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-gray-400">{new Date(chat.lastUpdated).toLocaleDateString('ar-SA')}</span>
                        <button 
                          onClick={() => onNavigate('my-chats')}
                          className="text-[10px] text-brand-green font-bold"
                        >
                          عرض
                        </button>
                     </div>
                   </div>
                 ))}
                 <button 
                    onClick={() => onNavigate('my-chats')}
                    className="w-full text-center text-xs text-gray-500 mt-2 py-2 hover:bg-gray-50 rounded-lg transition"
                  >
                    عرض جميع الرسائل
                  </button>
              </div>

              {gmailToken && (
                <div className="bg-white p-4 rounded-xl border shadow-sm mt-4 text-right">
                  <h3 className="text-sm font-bold mb-3 border-b pb-2 flex items-center justify-between">
                    <i className="fab fa-google text-red-500"></i>
                    آخر رسائل البريد
                  </h3>
                  {emailsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin h-5 w-5 border-2 border-brand-green border-t-transparent rounded-full"></div>
                    </div>
                  ) : recentEmails.length === 0 ? (
                    <p className="text-[10px] text-gray-400 text-center py-4">لا توجد رسائل بريد مؤخراً</p>
                  ) : (
                    recentEmails.map(msg => (
                      <div key={msg.id} className="flex flex-col mb-3 pb-3 border-b last:border-0 text-right text-[10px]">
                        <span className="font-bold text-gray-800 truncate">
                          {msg.payload.headers.find(h => h.name === 'Subject')?.value || '(بدون عنوان)'}
                        </span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-400">
                             {msg.payload.headers.find(h => h.name === 'From')?.value.split('<')[0]}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <button 
                    onClick={() => window.open('https://mail.google.com', '_blank')}
                    className="w-full text-center text-[10px] text-blue-500 hover:underline mt-1 font-bold"
                  >
                    فتح Gmail
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : view === 'reports' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm text-right">
              <div className="text-gray-400 text-xs font-bold mb-1 uppercase">إجمالي المبيعات</div>
              <div className="text-3xl font-black text-brand-green">{totalRevenue.toLocaleString()} <span className="text-sm">ر.س</span></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm text-right">
              <div className="text-gray-400 text-xs font-bold mb-1 uppercase">عدد الطلبات</div>
              <div className="text-3xl font-black text-gray-900">{myOrders.length}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm text-right">
              <div className="text-gray-400 text-xs font-bold mb-1 uppercase">متوسط الطلب</div>
              <div className="text-3xl font-black text-blue-600">
                {myOrders.length > 0 ? (totalRevenue / myOrders.length).toFixed(0) : 0} <span className="text-sm">ر.س</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm text-right">
              <div className="text-gray-400 text-xs font-bold mb-1 uppercase">النمو</div>
              <div className="text-3xl font-black text-amber-500 flex items-center justify-end gap-1">
                <span>100%</span>
                <i className="fas fa-arrow-up text-sm"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h3 className="font-bold text-lg text-right">سجل العمليات المالية</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-4 font-bold text-gray-600">رقم الطلب</th>
                    <th className="p-4 font-bold text-gray-600">المنتج</th>
                    <th className="p-4 font-bold text-gray-600">المشتري</th>
                    <th className="p-4 font-bold text-gray-600">طريقة الدفع</th>
                    <th className="p-4 font-bold text-gray-600">المدينة</th>
                    <th className="p-4 font-bold text-gray-600">القيمة</th>
                    <th className="p-4 font-bold text-gray-600">التاريخ</th>
                    <th className="p-4 font-bold text-gray-600">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {myOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono text-xs">{order.id}</td>
                      <td className="p-4 font-bold text-sm">{order.adTitle}</td>
                      <td className="p-4 text-sm">{order.buyerName}</td>
                      <td className="p-4 text-xs font-bold">
                        {order.paymentMethod === 'ONLINE' ? (
                          <span className="flex flex-col text-blue-600">
                             <span><i className="fas fa-credit-card ml-1"></i> إلكتروني</span>
                             <span className="text-[10px] text-brand-green">
                                {order.paymentProvider === 'SYRIATEL' ? 'سيريتل كاش' : order.paymentProvider === 'MTN' ? 'MTN كاش' : order.paymentProvider === 'SHAM' ? 'شام كاش' : ''}
                             </span>
                          </span>
                        ) : (
                          <span className="text-amber-600"><i className="fas fa-truck ml-1"></i> عند الاستلام</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">{order.shippingAddress?.city || '-'}</td>
                      <td className="p-4 font-black">
                        {order.amount.toLocaleString()} <span className="text-[10px] text-gray-400">ر.س</span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">
                        {new Date(order.date).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="p-4">
                        <select 
                          value={order.status}
                          onChange={async (e) => {
                            await api.updateOrderStatus(order.id, e.target.value as any);
                            fetchData();
                          }}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold outline-none border-0 cursor-pointer ${
                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <option value="PENDING">قيد المراجعة</option>
                          <option value="PROCESSING">قيد التجهيز</option>
                          <option value="SHIPPING">قيد التسليم للكابتن</option>
                          <option value="ARRIVED">وصل الكابتن</option>
                          <option value="DELIVERED">تم التسليم</option>
                          <option value="COMPLETED">مكتمل</option>
                          <option value="CANCELLED">ملغي</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {myOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-20 text-center text-gray-400 italic">لا توجد عمليات بيع مسجلة حتى الآن</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-2xl border shadow-sm p-8 text-right">
             <h2 className="text-xl font-bold mb-6">تخصيص متجري</h2>
             <form onSubmit={handleUpdateStore} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">اسم المتجر</label>
                  <input 
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
                    placeholder="مثال: متجر الإلكترونيات الحديث"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">شعار المتجر</label>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-xl border bg-gray-50 overflow-hidden shrink-0 shadow-inner">
                       <img src={storeImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="relative flex-grow h-20">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const base64 = await api.fileToBase64(file);
                            setStoreImage(base64);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
                         <div className="flex flex-col items-center">
                           <i className="fas fa-camera text-gray-400 mb-1"></i>
                           <span className="text-[10px] font-bold text-gray-500">اختر صورة الشعار</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">وصف المتجر</label>
                  <textarea 
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none"
                    placeholder="تحدث للعملاء عن متجرك وما تقدمه..."
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-brand-black text-white py-4 rounded-xl font-bold hover:bg-gray-900 transition shadow-lg"
                  >
                    حفظ التغييرات
                  </button>
                </div>
             </form>

             <div className="mt-8 pt-8 border-t">
                <h3 className="font-bold text-gray-700 mb-4">الأمان والحساب</h3>
                <button 
                  onClick={handleResetPassword}
                  className="w-full bg-white text-red-500 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-50 transition"
                >
                  <i className="fas fa-lock ml-2"></i>
                  إرسال رابط إعادة تعيين كلمة المرور
                </button>
             </div>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        title="حذف الإعلان"
        message="هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, adId: null })}
        confirmText="نعم، حذف الإعلان"
        cancelText="تراجع"
      />

    </div>
  );
};

export default SellerDashboard;
