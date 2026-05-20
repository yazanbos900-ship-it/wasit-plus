
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Ad, User, Category, ChatRoom, AdReport, Order } from '../types';
import AdCard from '../components/AdCard';
import ConfirmationModal from '../components/ConfirmationModal';
import PasswordResetModal from '../components/PasswordResetModal';

const AdminDashboard: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<{ id: string; title: string; subtitle?: string; image: string; active: boolean }[]>([]);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adReports, setAdReports] = useState<AdReport[]>([]);
  const [view, setView] = useState<'ads' | 'users' | 'categories' | 'chats' | 'banners' | 'sales' | 'ad-reports'>('ads');
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('fas fa-tag');
  
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'ad' | 'user' | 'category' | 'banner'; id: string | null; name?: string }>({ 
    isOpen: false, 
    type: 'ad', 
    id: null 
  });

  const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean; userId: string | null; userName: string }>({
    isOpen: false,
    userId: null,
    userName: ''
  });
 
  const fetchBasicData = async () => {
    try {
      const [categoriesData, bannersData] = await Promise.all([
        api.getCategories(),
        api.getBanners()
      ]);
      setCategories(categoriesData);
      setBanners(bannersData);
    } catch (e) {
      console.error('Error fetching basic admin data:', e);
    }
  };

  const fetchViewData = async () => {
    setLoading(true);
    try {
      if (view === 'ads') {
        const adsData = await api.getAds(100);
        setAds(adsData);
      } else if (view === 'users') {
        const usersData = await api.getAllUsers();
        setUsers(usersData);
      } else if (view === 'chats') {
        const chatsData = await api.getAdminChats();
        setChats(chatsData);
      } else if (view === 'sales') {
        const ordersData = await api.getOrders();
        setOrders(ordersData);
      } else if (view === 'ad-reports') {
        const reportsData = await api.getAdminReports();
        setAdReports(reportsData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBasicData();
  }, []);

  useEffect(() => {
    fetchViewData();
  }, [view]);

  const handleToggleFeatured = async (id: string) => {
    await api.toggleFeatured(id);
    fetchViewData();
  };

  const handleDeleteAd = async (id: string) => {
    setDeleteModal({ isOpen: true, type: 'ad', id });
  };

  const handleDeleteUser = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (user?.role === 'ADMIN') {
      alert('لا يمكن حذف حساب مدير النظام');
      return;
    }
    setDeleteModal({ isOpen: true, type: 'user', id, name: user?.name });
  };

  const handleResetPassword = (id: string) => {
    alert('ميزة استعادة كلمة المرور تعمل حالياً عبر البريد الإلكتروني للمستخدم.');
  };

  const confirmResetPassword = async (newPass: string) => {
    // Mock
  };

  const handleUpdateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;
    await api.adminUpdateAd(editingAd.id, editingAd);
    setEditingAd(null);
    fetchViewData();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await api.addCategory(newCatName, newCatIcon);
    setNewCatName('');
    setNewCatIcon('fas fa-tag');
    fetchBasicData();
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle.trim() || !newBannerImage.trim()) return;
    await api.addBanner(newBannerTitle, newBannerImage, newBannerSubtitle);
    setNewBannerTitle('');
    setNewBannerSubtitle('');
    setNewBannerImage('');
    fetchBasicData();
  };

  const handleDeleteBanner = async (id: string) => {
    setDeleteModal({ isOpen: true, type: 'banner', id });
  };

  const handleToggleBanner = async (id: string) => {
    await api.toggleBannerStatus(id);
    fetchBasicData();
  };

  const handleDeleteCategory = async (id: string) => {
    setDeleteModal({ isOpen: true, type: 'category', id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    
    if (deleteModal.type === 'ad') {
      await api.adminDeleteAd(deleteModal.id);
    } else if (deleteModal.type === 'user') {
      await api.deleteUser(deleteModal.id);
    } else if (deleteModal.type === 'category') {
      await api.deleteCategory(deleteModal.id);
    } else if (deleteModal.type === 'banner') {
      await api.deleteBanner(deleteModal.id);
    }
    
    setDeleteModal({ isOpen: false, type: 'ad', id: null });
    fetchViewData();
    fetchBasicData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">وسيط بلاس لوحة الإدارة</h1>
          <p className="text-gray-500">إدارة المحتوى والمستخدمين عبر المنصة</p>
        </div>

        <div className="bg-gray-100 p-1.5 rounded-xl flex overflow-x-auto max-w-full">
          <button 
            onClick={() => setView('ads')}
            className={`px-4 md:px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${view === 'ads' ? 'bg-white shadow text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
          >
            الإعلانات ({ads.length})
          </button>
          <button 
            onClick={() => setView('users')}
            className={`px-4 md:px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${view === 'users' ? 'bg-white shadow text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
          >
            المستخدمين ({users.length})
          </button>
          <button 
            onClick={() => setView('categories')}
            className={`px-4 md:px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${view === 'categories' ? 'bg-white shadow text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
          >
            التصنيفات ({categories.length})
          </button>
          <button 
            onClick={() => setView('chats')}
            className={`px-4 md:px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${view === 'chats' ? 'bg-white shadow text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
          >
            الدردشات ({chats.length})
          </button>
          <button 
            onClick={() => setView('banners')}
            className={`px-4 md:px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${view === 'banners' ? 'bg-white shadow text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
          >
            البانرات ({banners.length})
          </button>
          <button 
            onClick={() => setView('sales')}
            className={`px-4 md:px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${view === 'sales' ? 'bg-white shadow text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
          >
            المبيعات ({orders.length})
          </button>
          <button 
            onClick={() => setView('ad-reports')}
            className={`px-4 md:px-6 py-2 rounded-lg font-bold transition whitespace-nowrap ${view === 'ad-reports' ? 'bg-white shadow text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
          >
            البلاغات ({adReports.length})
          </button>
        </div>
      </div>
 
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
        </div>
      ) : view === 'ads' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-right" dir="rtl">
          {ads.map(ad => (
            <AdCard 
              key={ad.id} 
              ad={ad} 
              isAdmin 
              onToggleFeatured={handleToggleFeatured}
              onDelete={handleDeleteAd}
              onEdit={(ad) => setEditingAd(ad)}
            />
          ))}
        </div>
      ) : view === 'users' ? (
        <div className="bg-white rounded-2xl border overflow-hidden shadow-sm overflow-x-auto text-right" dir="rtl">
          <table className="w-full text-right border-collapse min-w-[600px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-bold text-gray-600">المستخدم</th>
                <th className="p-4 font-bold text-gray-600">رقم الهاتف</th>
                <th className="p-4 font-bold text-gray-600">تاريخ الانضمام</th>
                <th className="p-4 font-bold text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${user.role === 'ADMIN' ? 'bg-brand-black text-brand-green' : 'bg-brand-green bg-opacity-10 text-brand-green'} rounded-full flex items-center justify-center font-bold`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className={`text-[10px] uppercase font-bold ${user.role === 'ADMIN' ? 'text-brand-green' : 'text-gray-400'}`}>
                          {user.role === 'ADMIN' ? 'مدير النظام' : 'مستخدم'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-gray-500">{user.phone}</td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleResetPassword(user.id)}
                        className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 transition"
                      >
                        إرسال رابط إعادة التعيين
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 bg-red-50 p-2 rounded-lg hover:bg-red-100 transition"
                      >
                        <i className="fas fa-user-minus"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : view === 'categories' ? (
        <div className="space-y-6" dir="rtl">
          <div className="bg-white p-6 rounded-2xl border shadow-sm text-right">
            <h3 className="font-bold text-lg mb-4">إضافة تصنيف جديد</h3>
            <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-4">
              <input 
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="اسم التصنيف"
                className="flex-grow px-4 py-3 rounded-xl border focus:ring-2 focus:ring-brand-green outline-none"
              />
              <input 
                type="text"
                value={newCatIcon}
                onChange={e => setNewCatIcon(e.target.value)}
                placeholder="أيقونة (FontAwesome class)"
                className="flex-grow px-4 py-3 rounded-xl border focus:ring-2 focus:ring-brand-green outline-none"
              />
              <button 
                type="submit"
                className="bg-brand-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-900 transition"
              >
                إضافة
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-green bg-opacity-10 text-brand-green rounded-full flex items-center justify-center">
                    <i className={cat.icon || 'fas fa-tag'}></i>
                  </div>
                  <span className="font-bold text-gray-800">{cat.name}</span>
                </div>
                <button 
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : view === 'banners' ? (
        <div className="space-y-8" dir="rtl">
           <div className="bg-white p-8 rounded-3xl border shadow-sm text-right">
              <h3 className="font-bold text-xl mb-6">إضافة بانر (سلايدر) جديد</h3>
              <form onSubmit={handleAddBanner} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">عنوان البانر</label>
                        <input 
                          type="text"
                          value={newBannerTitle}
                          onChange={e => setNewBannerTitle(e.target.value)}
                          placeholder="مثلاً: عروض العيد"
                          className="w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-brand-green outline-none bg-gray-50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">عنوان فرعي (اختياري)</label>
                        <input 
                          type="text"
                          value={newBannerSubtitle}
                          onChange={e => setNewBannerSubtitle(e.target.value)}
                          placeholder="مثلاً: خصم يصل إلى 50%"
                          className="w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-brand-green outline-none bg-gray-50"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">رابط الصورة (URL)</label>
                        <div className="flex gap-2">
                           <input 
                              type="text"
                              value={newBannerImage}
                              onChange={e => setNewBannerImage(e.target.value)}
                              placeholder="https://example.com/image.jpg"
                              className="flex-grow px-5 py-3 rounded-xl border focus:ring-2 focus:ring-brand-green outline-none bg-gray-50"
                           />
                           <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const base64 = await api.fileToBase64(file);
                                    setNewBannerImage(base64);
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <button 
                                type="button"
                                className="bg-gray-100 p-3 rounded-xl text-gray-600 hover:bg-gray-200 transition"
                              >
                                <i className="fas fa-camera"></i>
                              </button>
                           </div>
                        </div>
                    </div>
                 </div>
                 {newBannerImage && (
                    <div className="mt-4 rounded-2xl overflow-hidden border-2 border-brand-green/20 max-w-xl mx-auto shadow-inner">
                        <img src={newBannerImage} alt="Preview" className="w-full h-40 object-cover" />
                    </div>
                 )}
                 <div className="flex justify-end pt-2">
                    <button 
                      type="submit"
                      disabled={!newBannerTitle || !newBannerImage}
                      className="bg-brand-black text-white px-12 py-3 rounded-xl font-bold hover:bg-gray-900 transition shadow-lg disabled:opacity-50"
                    >
                      إضافة البانر
                    </button>
                 </div>
              </form>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map(banner => (
                <div key={banner.id} className="bg-white rounded-3xl border overflow-hidden shadow-sm group">
                   <div className="relative h-48">
                      <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-6">
                         <div>
                            <h4 className="text-white font-bold text-lg">{banner.title}</h4>
                            {banner.subtitle && <p className="text-gray-300 text-xs mt-1">{banner.subtitle}</p>}
                         </div>
                      </div>
                      <div className="absolute top-4 left-4 flex gap-2">
                         <button 
                            onClick={() => handleToggleBanner(banner.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-lg ${banner.active ? 'bg-brand-green text-black' : 'bg-red-500 text-white'}`}
                         >
                            {banner.active ? 'نشط' : 'معطل'}
                         </button>
                         <button 
                           onClick={() => handleDeleteBanner(banner.id)}
                           className="bg-white/90 text-red-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition shadow-lg"
                         >
                           <i className="fas fa-trash-alt text-xs"></i>
                         </button>
                      </div>
                   </div>
                </div>
              ))}
              {banners.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed">
                    <i className="fas fa-images text-4xl mb-4 block opacity-20"></i>
                    لا توجد بانرات مضافة حالياً
                </div>
              )}
           </div>
        </div>
      ) : view === 'sales' ? (
        <div className="space-y-8" dir="rtl">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-right">
                <div className="text-gray-400 text-xs font-bold mb-1">إجمالي المبيعات</div>
                <div className="text-3xl font-black text-brand-green">{orders.reduce((s,o) => s+o.amount, 0).toLocaleString()} <span className="text-sm">ر.س</span></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-right">
                <div className="text-gray-400 text-xs font-bold mb-1">عدد الطلبات</div>
                <div className="text-3xl font-black text-gray-900">{orders.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm text-right">
                <div className="text-gray-400 text-xs font-bold mb-1">متوسط العمليات</div>
                <div className="text-3xl font-black text-blue-600">
                  {orders.length > 0 ? (orders.reduce((s,o) => s+o.amount, 0)/orders.length).toFixed(0) : 0} <span className="text-sm">ر.س</span>
                </div>
              </div>
           </div>

           <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-right">
              <div className="p-6 border-b bg-gray-50">
                <h3 className="font-bold text-lg">سجل المبيعات الكلي</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-4 font-bold text-gray-600">رقم الطلب</th>
                      <th className="p-4 font-bold text-gray-600">المنتج</th>
                      <th className="p-4 font-bold text-gray-600">البائع</th>
                      <th className="p-4 font-bold text-gray-600">المشتري</th>
                      <th className="p-4 font-bold text-gray-600">الدفع</th>
                      <th className="p-4 font-bold text-gray-600">المدينة</th>
                      <th className="p-4 font-bold text-gray-600">القيمة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="p-4 font-mono text-[10px]">{order.id}</td>
                        <td className="p-4 font-bold text-sm">{order.adTitle}</td>
                        <td className="p-2 text-xs truncate max-w-[100px] text-gray-500">{order.sellerId}</td>
                        <td className="p-4 text-sm">{order.buyerName}</td>
                        <td className="p-4 text-xs">
                           {order.paymentMethod === 'ONLINE' ? (
                             <span className="flex flex-col">
                               <span>إلكتروني</span>
                               <span className="text-[10px] text-brand-green font-bold">
                                 {order.paymentProvider === 'SYRIATEL' ? 'سيريتل كاش' : order.paymentProvider === 'MTN' ? 'MTN كاش' : order.paymentProvider === 'SHAM' ? 'شام كاش' : ''}
                               </span>
                             </span>
                           ) : 'عند الاستلام'}
                        </td>
                        <td className="p-4 text-sm text-gray-600">{order.shippingAddress?.city || '-'}</td>
                        <td className="p-4 font-black">{order.amount.toLocaleString()} ر.س</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      ) : view === 'ad-reports' ? (
        <div className="space-y-6" dir="rtl">
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden text-right">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">بلاغات المستخدمين</h3>
                <p className="text-xs text-gray-500">متابعة البلاغات ضد الإعلانات المخالفة</p>
              </div>
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
                {adReports.filter(r => r.status === 'PENDING').length} معلق
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-4 font-bold text-gray-600 whitespace-nowrap">رقم البلاغ</th>
                    <th className="p-4 font-bold text-gray-600">الإعلان</th>
                    <th className="p-4 font-bold text-gray-600">المبلغ</th>
                    <th className="p-4 font-bold text-gray-600">السبب</th>
                    <th className="p-4 font-bold text-gray-600">التاريخ</th>
                    <th className="p-4 font-bold text-gray-600">الحالة</th>
                    <th className="p-4 font-bold text-gray-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {adReports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="p-4 font-mono text-[10px]">{report.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-sm">{report.adTitle}</div>
                        <div className="text-[10px] text-gray-400"># {report.adId}</div>
                      </td>
                      <td className="p-4 text-xs">
                        <div className="font-bold">{report.reporterName}</div>
                        <div className="text-[10px] text-gray-400">ID: {report.reporterId}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          report.reason === 'SCAM' ? 'bg-red-50 text-red-600' :
                          report.reason === 'INAPPROPRIATE' ? 'bg-amber-50 text-amber-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {report.reason === 'SCAM' ? 'احتيال' :
                           report.reason === 'INAPPROPRIATE' ? 'محتوى غير لائق' :
                           report.reason === 'OUTDATED' ? 'قديم' : 'آخر'}
                        </span>
                        {report.details && <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{report.details}</p>}
                      </td>
                      <td className="p-4 text-[10px] text-gray-500">
                        {new Date(report.timestamp).toLocaleString('ar-SA')}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          report.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {report.status === 'PENDING' ? 'معلق' :
                           report.status === 'RESOLVED' ? 'تم الحل' : 'مرفوض'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={async () => {
                              await api.updateReportStatus(report.id, 'RESOLVED');
                              fetchViewData();
                            }}
                            className="text-[10px] bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition"
                          >
                            حل
                          </button>
                          <button 
                            onClick={async () => {
                              await api.updateReportStatus(report.id, 'DISMISSED');
                              fetchViewData();
                            }}
                            className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-300 transition"
                          >
                            رفض
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {adReports.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400">لا توجد بلاغات حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden shadow-sm text-right" dir="rtl">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="font-bold text-lg">مراقبة الدردشات</h2>
            <p className="text-xs text-gray-500 mt-1">يمكنك الاطلاع على كافة المحادثات الجارية بين البائعين والمشترين</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[700px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-bold text-gray-600">الإعلان</th>
                  <th className="p-4 font-bold text-gray-600">المشتري</th>
                  <th className="p-4 font-bold text-gray-600">البائع</th>
                  <th className="p-4 font-bold text-gray-600">آخر رسالة</th>
                  <th className="p-4 font-bold text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {chats.map(chat => (
                  <tr key={chat.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="font-semibold text-sm truncate max-w-[150px]">{chat.adTitle}</div>
                      <div className="text-[10px] text-gray-400">ID: {chat.adId}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-sm">{chat.buyerName}</div>
                      <div className="text-[10px] text-gray-400">ID: {chat.buyerId}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-sm">{chat.sellerName}</div>
                      <div className="text-[10px] text-gray-400">ID: {chat.sellerId}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">
                        {chat.messages[chat.messages.length - 1]?.text}
                      </div>
                      <div className="text-[9px] text-gray-400">
                        {new Date(chat.lastUpdated).toLocaleString('ar-SA')}
                      </div>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={async () => {
                          const messages = await api.getChatRoomMessages(chat.id);
                          setSelectedChat({ ...chat, messages });
                        }}
                        className="bg-brand-green text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-opacity-90 shadow-sm"
                      >
                        عرض المحادثة
                      </button>
                    </td>
                  </tr>
                ))}
                {chats.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400 font-medium">لا توجد محادثات نشطة حالياً</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chat View Modal for Admin */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl text-right" dir="rtl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <div>
                   <h2 className="text-lg font-bold">{selectedChat.adTitle}</h2>
                   <p className="text-xs text-gray-500">تم التحديث: {new Date(selectedChat.lastUpdated).toLocaleString('ar-SA')}</p>
                </div>
              <button onClick={() => setSelectedChat(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
                  <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {selectedChat.messages.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.senderName === selectedChat.buyerName ? 'items-start' : 'items-end'}`}>
                        <div className="text-[10px] text-gray-400 mb-1 px-2">{msg.senderName} ({msg.senderId})</div>
                        <div className={`p-4 rounded-2xl text-sm max-w-[85%] ${msg.senderName === selectedChat.buyerName ? 'bg-white text-gray-800 rounded-tl-none' : 'bg-brand-green text-black rounded-tr-none'}`}>
                          {msg.text}
                          <div className="text-[9px] mt-2 opacity-50">{new Date(msg.timestamp).toLocaleTimeString('ar-SA')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
            <div className="p-4 border-t text-center text-xs text-gray-400 py-4 italic">
                هذه المعاينة للقراءة فقط لمدراء النظام.
            </div>
          </div>
        </div>
      )}

      {/* Edit Ad Modal */}
      {editingAd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-right" dir="rtl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">تعديل الإعلان</h2>
              <button onClick={() => setEditingAd(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleUpdateAd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">العنوان</label>
                <input 
                  type="text" 
                  value={editingAd.title}
                  onChange={e => setEditingAd({...editingAd, title: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-brand-green outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">السعر</label>
                  <input 
                    type="number" 
                    value={editingAd.price}
                    onChange={e => setEditingAd({...editingAd, price: Number(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-brand-green outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الفئة</label>
                  <input 
                    type="text" 
                    value={editingAd.category}
                    onChange={e => setEditingAd({...editingAd, category: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-brand-green outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <textarea 
                  rows={3}
                  value={editingAd.description}
                  onChange={e => setEditingAd({...editingAd, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-brand-green outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-brand-black text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition"
                >
                  حفظ التعديلات
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingAd(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        title={
          deleteModal.type === 'ad' ? 'حذف الإعلان' : 
          deleteModal.type === 'user' ? 'حذف المستخدم' : 
          deleteModal.type === 'banner' ? 'حذف البانر' :
          'حذف التصنيف'
        }
        message={
          deleteModal.type === 'ad' ? 'هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟' : 
          deleteModal.type === 'user' ? `هل أنت متأكد من رغبتك في حذف حساب ${deleteModal.name} وكافة بياناته؟` : 
          deleteModal.type === 'banner' ? 'هل أنت متأكد من رغبتك في حذف هذا البانر من الواجهة الرئيسية؟' :
          'هل أنت متأكد من رغبتك في حذف هذا التصنيف؟ قد يؤدي ذلك لإزالة المنتجات المرتبطة به.'
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, type: 'ad', id: null })}
        confirmText="تأكيد الحذف"
        cancelText="تراجع"
      />

      <PasswordResetModal 
        isOpen={passwordModal.isOpen}
        userName={passwordModal.userName}
        onClose={() => setPasswordModal({ ...passwordModal, isOpen: false })}
        onConfirm={confirmResetPassword}
      />
    </div>
  );
};

export default AdminDashboard;
