
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Ad, User, ChatRoom, Comment, Order } from '../types';
import CheckoutModal from '../components/CheckoutModal';
import ReportModal from '../components/ReportModal';
import EmailModal from '../components/EmailModal';
import { useCart } from '../context/CartContext';
import { useFirebase } from '../context/FirebaseContext';

interface AdDetailsProps {
  adId: string;
  onBack: () => void;
  currentUser: User | null;
}

const AdDetails: React.FC<AdDetailsProps> = ({ adId, onBack, currentUser }) => {
  const { addToCart } = useCart();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [sellerEmail, setSellerEmail] = useState<string | null>(null);
  const [isFetchingEmail, setIsFetchingEmail] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchSellerEmail = async () => {
    if (!ad || sellerEmail || isFetchingEmail) return;
    setIsFetchingEmail(true);
    try {
      const profile = await api.getUserProfile(ad.userId);
      if (profile?.email) {
        setSellerEmail(profile.email);
      }
    } finally {
      setIsFetchingEmail(false);
    }
  };

  const handleContactGmail = () => {
    if (!currentUser) {
      alert('يرجى تسجيل الدخول أولاً');
      return;
    }
    alert('هذه الميزة مخصصة للربط مع Google Workspace. يمكنك التواصل حالياً عبر المحادثة المباشرة.');
  };

  const shareUrl = window.location.href;
  const shareText = `تحقق من هذا الإعلان على منصة الإعلانات: ${ad?.title}`;

  const handleShare = async (platform: 'Native' | 'WhatsApp' | 'Telegram' | 'Copy') => {
    if (platform === 'Native' && navigator.share) {
      try {
        await navigator.share({
          title: ad?.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else if (platform === 'WhatsApp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    } else if (platform === 'Telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'Copy') {
      navigator.clipboard.writeText(shareUrl);
      alert('تم نسخ الرابط بنجاح!');
    }
    setShowShare(false);
  };

  const fetchComments = async () => {
    const data = await api.getComments(adId);
    setComments(data);
  };

  useEffect(() => {
    const fetchAd = async () => {
      setLoading(true);
      const allAds = await api.getAds();
      const found = allAds.find(a => a.id === adId);
      setAd(found || null);
      if (found) setActiveImage(found.image);
      setLoading(false);

      if (found && currentUser && found.userId !== currentUser.id) {
        const room = await api.getChatsForAd(found.id, currentUser.id);
        setChatRoom(room);
      }
      fetchComments();
    };
    fetchAd();
  }, [adId, currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatRoom?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !ad || !currentUser) return;

    const roomId = `${ad.id}_${currentUser.id}`;
    const updatedRoom = await api.sendMessage(roomId, ad, currentUser, message);
    setChatRoom(updatedRoom);
    setMessage('');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setIsSubmittingComment(true);
    try {
      await api.addComment(adId, newComment, commentImage);
      setNewComment('');
      setCommentImage('');
      await fetchComments();
    } catch (error) {
      alert('حدث خطأ أثناء إضافة التعليق');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCheckoutConfirm = async (paymentMethod: 'ONLINE' | 'COD', shippingAddress: { city: string, street: string, phone: string }, paymentProvider?: 'SYRIATEL' | 'MTN' | 'SHAM') => {
    if (!currentUser || !ad) return;

    try {
      await api.createOrder(ad, currentUser, paymentMethod, shippingAddress, paymentProvider);
    } catch (e) {
      alert('حدث خطأ أثناء الشراء');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">الإعلان غير موجود</h2>
        <button onClick={onBack} className="text-brand-green font-bold">العودة للرئيسية</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" dir="rtl">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500">
        <button onClick={onBack} className="hover:text-brand-green">الرئيسية</button>
        <span className="mx-2">/</span>
        <span className="text-gray-400">{ad.category}</span>
        <span className="mx-2">/</span>
        <span className="text-gray-800 truncate">{ad.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm aspect-square sm:aspect-video lg:aspect-square mb-4 lg:sticky lg:top-24">
            <img 
              src={activeImage} 
              alt={ad.title} 
              className="w-full h-full object-contain p-2 sm:p-4 transition-all duration-300"
            />
          </div>
          
          {ad.images && ad.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {ad.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 sm:w-24 shrink-0 aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-brand-green ring-2 ring-brand-green/20' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <img src={img} alt={`${ad.title} view ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Actions */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl border p-5 sm:p-8 shadow-sm mb-6 relative">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                {ad.title}
              </h1>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (!currentUser) {
                      alert('يرجى تسجيل الدخول أولاً للتبليغ عن إعلان');
                      return;
                    }
                    setIsReportOpen(true);
                  }}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-gray-100"
                  title="بلاغ"
                >
                  <i className="fas fa-flag text-sm"></i>
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setShowShare(!showShare)}
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-brand-green hover:bg-brand-green/10 transition-all border border-gray-100"
                  >
                    <i className="fas fa-share-alt text-sm"></i>
                  </button>

                <AnimatePresence>
                  {showShare && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute left-0 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 overflow-hidden"
                    >
                      <button 
                        onClick={() => handleShare('Copy')}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition text-sm font-bold text-gray-700"
                      >
                        <i className="fas fa-link text-blue-500 w-5"></i>
                        نسخ الرابط
                      </button>
                      <button 
                        onClick={() => handleShare('WhatsApp')}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition text-sm font-bold text-gray-700"
                      >
                        <i className="fab fa-whatsapp text-green-500 w-5 text-lg"></i>
                        واتساب
                      </button>
                      <button 
                        onClick={() => handleShare('Telegram')}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition text-sm font-bold text-gray-700"
                      >
                        <i className="fab fa-telegram text-sky-500 w-5 text-lg"></i>
                        تيليجرام
                      </button>
                      {navigator.share && (
                        <button 
                          onClick={() => handleShare('Native')}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition text-sm font-bold text-gray-700 border-t mt-1 pt-3"
                        >
                          <i className="fas fa-external-link-alt text-gray-400 w-5"></i>
                          خيارات أخرى
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <span className="bg-gray-100 px-2 py-1 rounded">الحالة: جديد</span>
              <span>رقم الإعلان: #{ad.id.slice(-6).toUpperCase()}</span>
            </div>

            <hr className="mb-6 border-gray-100" />

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 mb-8">
              <div>
                <p className="text-[10px] sm:text-sm text-gray-500 mb-1 uppercase tracking-wider font-bold">السعر:</p>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-brand-green">{ad.price.toLocaleString()}</span>
                    <span className="text-lg sm:text-xl font-bold text-gray-800">ر.س</span>
                  </div>
                  {ad.originalPrice && ad.originalPrice > ad.price && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-400 line-through text-xs sm:text-sm font-bold">
                        {ad.originalPrice.toLocaleString()} ر.س
                      </span>
                      <span className="bg-red-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                        وفر {Math.round(((ad.originalPrice - ad.price) / ad.originalPrice) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:flex sm:flex-col gap-3 w-full sm:w-64">
                <button 
                  onClick={() => {
                    if (!currentUser) {
                      alert('يرجى تسجيل الدخول أولاً');
                      return;
                    }
                    setIsCheckoutOpen(true);
                  }}
                  className="bg-brand-green text-black font-black py-3 sm:py-3.5 rounded-xl text-sm sm:text-base hover:bg-brand-greenDark shadow-lg shadow-brand-green/10 transition active:scale-95"
                >
                  شراء الآن
                </button>
                <button 
                  onClick={() => ad && addToCart(ad)}
                  className="bg-brand-black text-white font-black py-3 sm:py-3.5 rounded-xl text-sm sm:text-base hover:bg-gray-900 transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <i className="fas fa-cart-plus text-xs"></i>
                  <span>السلة</span>
                </button>
              </div>
            </div>

            {/* Seller Info Card */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-green border shadow-sm font-bold text-xl">
                  {ad.userName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{ad.userName}</p>
                  <p className="text-xs text-gray-500">بـائع موثوق • تقييم 4.9/5</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setShowChat(!showChat)}
                  className="text-brand-green font-bold text-sm hover:underline"
                >
                  {showChat ? 'إغلاق الدردشة' : 'تواصل عبر المحادثة'}
                </button>
                  <button 
                    onClick={handleContactGmail}
                    className="text-gray-600 font-bold text-sm hover:text-brand-green flex items-center gap-1"
                  >
                    <i className="fas fa-envelope text-xs"></i>
                    تواصل عبر البريد (قريباً)
                  </button>
              </div>
            </div>

            {/* Chat Section */}
            {showChat && currentUser && ad.userId !== currentUser.id && (
              <div className="mt-4 border rounded-xl overflow-hidden flex flex-col h-80 bg-white shadow-inner">
                <div className="bg-gray-100 p-3 border-b text-sm font-bold flex justify-between">
                  <span>دردشة مع {ad.userName}</span>
                  <button onClick={() => setShowChat(false)} className="text-gray-400"><i className="fas fa-times"></i></button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-3">
                  {chatRoom?.messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-brand-green text-black rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                  {(!chatRoom || chatRoom.messages.length === 0) && (
                    <p className="text-center text-gray-400 text-xs py-10">ابدأ المحادثة الآن مع البائع</p>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2">
                  <input 
                    type="text" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب رسالتك..."
                    className="flex-grow px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-green outline-none"
                  />
                  <button type="submit" className="bg-brand-green text-black px-4 py-2 rounded-lg text-sm font-bold">
                    إرسال
                  </button>
                </form>
              </div>
            )}

            {showChat && !currentUser && (
                <div className="mt-4 p-4 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-center text-sm font-bold">
                    يرجى تسجيل الدخول لتتمكن من مراسلة البائع
                </div>
            )}
            
            {showChat && currentUser && ad.userId === currentUser.id && (
                <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-center text-sm font-bold">
                    هذا إعلانك الخاص. يمكنك متابعة الدردشات من لوحة التحكم (قريباً)
                </div>
            )}
          </div>

          {/* Item Specifics (eBay Table) */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-list-ul text-brand-green"></i>
              مواصفات السلعة
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-y-4 gap-x-12 border-t pt-6">
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400 text-xs sm:text-sm">القسم:</span>
                <span className="font-bold text-gray-800 text-sm">{ad.category}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400 text-xs sm:text-sm">تاريخ النشر:</span>
                <span className="font-bold text-gray-800 text-sm">{new Date(ad.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400 text-xs sm:text-sm">الحالة:</span>
                <span className="font-bold text-gray-800 text-sm">ممتاز</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-400 text-xs sm:text-sm">المنطقة:</span>
                <span className="font-bold text-gray-800 text-sm">{ad.location}</span>
              </div>
            </div>

            <h2 className="text-lg font-bold mt-8 mb-4 flex items-center gap-2">
              <i className="fas fa-align-right text-brand-green"></i>
              وصف الإعلان
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-dashed">
              {ad.description}
            </p>
          </div>

        </div>
      </div>

      {/* Comments Section - Moved outside grid for better visibility */}
      <div className="max-w-7xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 border-b pb-4">
              <i className="fas fa-comments text-brand-green text-2xl"></i>
              التعليقات والمناقشات ({comments.length})
            </h2>

            {currentUser ? (
              <div className="mb-10 bg-gray-50 p-6 rounded-2xl border border-dashed">
                <h3 className="font-bold text-sm mb-4 text-gray-700">أضف تعليقك أو استفسارك:</h3>
                <form onSubmit={handleAddComment}>
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="اكتب استفسارك هنا بكل صراحة..."
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none h-32 mb-4 bg-white transition-all shadow-sm"
                  ></textarea>

                  {commentImage && (
                    <div className="mb-4 relative w-32 h-32 group">
                      <img src={commentImage} alt="Comment Preview" className="w-full h-full object-cover rounded-xl border shadow-sm" />
                      <button 
                        type="button" 
                        onClick={() => setCommentImage('')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const base64 = await api.fileToBase64(file);
                            setCommentImage(base64);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <button 
                        type="button"
                        className="flex items-center gap-2 text-gray-600 hover:text-brand-green transition-colors font-bold text-sm border-2 border-dashed border-gray-300 px-4 py-2 rounded-xl bg-white"
                      >
                        <i className="fas fa-camera text-lg"></i>
                        إرفاق صورة
                      </button>
                    </div>

                    <button 
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="bg-brand-black text-white px-10 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition shadow-lg flex items-center gap-2"
                    >
                      {isSubmittingComment ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          جاري الإرسال...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane"></i>
                          إرسال التعليق
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-8 bg-amber-50 rounded-2xl border border-amber-100 text-center mb-10 shadow-sm">
                 <i className="fas fa-lock text-amber-400 text-3xl mb-3"></i>
                 <p className="text-amber-800 font-bold">يرجى تسجيل الدخول للتمكن من إضافة تعليق أو طرح استفساراتك</p>
              </div>
            )}

            <div className="space-y-8">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-5 items-start border-b border-gray-50 pb-8 last:border-0 last:pb-0 group">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-green/20 to-brand-green/5 text-brand-green font-black flex items-center justify-center shrink-0 text-2xl border border-brand-green/20 shadow-sm">
                      {comment.userName.charAt(0)}
                   </div>
                   <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 text-lg">{comment.userName}</span>
                          {ad.userName === comment.userName && (
                            <span className="bg-brand-green text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">صاحب الإعلان</span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">{new Date(comment.timestamp).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-base bg-gray-50/50 p-4 rounded-xl border border-gray-100 group-hover:border-brand-green/20 transition-all">
                        {comment.text}
                      </p>
                      {comment.image && (
                        <div className="mt-3 max-w-sm rounded-xl overflow-hidden border shadow-sm">
                           <img src={comment.image} alt="User feedback" className="w-full h-auto cursor-zoom-in hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                   </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center text-gray-400 italic py-20 bg-gray-50 rounded-2xl border border-dashed">
                  <i className="fas fa-comment-slash text-4xl mb-4 block opacity-20"></i>
                  لا توجد تعليقات بعد لهذا المنتج. كن أول من يسأل!
                </div>
              )}
            </div>
          </div>
      </div>
      {ad && currentUser && (
        <CheckoutModal 
          isOpen={isCheckoutOpen}
          items={[{ ...ad, quantity: 1 }]}
          currentUser={currentUser}
          onClose={() => setIsCheckoutOpen(false)}
          onConfirm={handleCheckoutConfirm}
        />
      )}
      {ad && sellerEmail && (
        <EmailModal 
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          sellerEmail={sellerEmail}
          sellerName={ad.userName}
          adTitle={ad.title}
        />
      )}
      {ad && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          ad={ad}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default AdDetails;
