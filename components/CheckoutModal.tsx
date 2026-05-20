import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ad, User, CartItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: 'ONLINE' | 'COD', shippingAddress: { city: string, street: string, phone: string }, paymentProvider?: 'SYRIATEL' | 'MTN' | 'SHAM') => void;
  items: CartItem[];
  currentUser: User;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onConfirm, items, currentUser }) => {
  const [step, setStep] = useState<'SUMMARY' | 'SHIPPING' | 'PAYMENT' | 'VERIFICATION' | 'SUCCESS'>('SUMMARY');
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [paymentProvider, setPaymentProvider] = useState<'SYRIATEL' | 'MTN' | 'SHAM'>('SYRIATEL');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!isOpen) return null;

  const handleNextFromSummary = () => {
    setStep('SHIPPING');
  };

  const handleNextFromShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city || !street || !phone) {
      setError('يرجى إكمال جميع بيانات الشحن');
      return;
    }
    setError('');
    setStep('PAYMENT');
  };

  const handlePaymentConfirm = () => {
    if (paymentMethod === 'ONLINE') {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setStep('VERIFICATION');
      }, 1000);
    } else {
      handleFinalConfirm();
    }
  };

  const handleFinalConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onConfirm(paymentMethod, { city, street, phone }, paymentMethod === 'ONLINE' ? paymentProvider : undefined);
      setIsProcessing(false);
      setVerificationCode('');
      setStep('SUCCESS');
    }, 1500);
  };

  const VALID_CODES = ['563243', '128843', '992011', '445566', '778899', '102030', '554433', '887766', '990011'];

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (VALID_CODES.includes(verificationCode)) {
      handleFinalConfirm();
    } else {
      setError('رمز التحقق غير صحيح! يرجى التأكد من الرمز المرسل وإعادة المحاولة.');
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[120] sm:p-4 text-right" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-t-[2.5rem] sm:rounded-[2rem] w-full max-w-xl h-[90vh] sm:h-auto overflow-y-auto shadow-2xl"
      >
        <div className="p-6 sm:p-8 pb-32 sm:pb-8">
          {step !== 'SUCCESS' && (
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-cairo">إتمام الطلب</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                <i className="fas fa-times text-gray-400"></i>
              </button>
            </div>
          )}

          {step !== 'SUCCESS' && step !== 'VERIFICATION' && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {[
                { id: 'SUMMARY', label: 'الملخص' },
                { id: 'SHIPPING', label: 'الشحن' },
                { id: 'PAYMENT', label: 'الدفع' },
              ].map((s, idx) => (
                <React.Fragment key={s.id}>
                  <div className={`flex items-center gap-1.5 ${step === s.id ? 'text-brand-green' : 'text-gray-300'}`}>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black border-2 ${step === s.id ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 bg-white text-gray-400'}`}>
                      {idx + 1}
                    </div>
                    <span className="text-[10px] font-bold hidden sm:inline">{s.label}</span>
                  </div>
                  {idx < 2 && (
                    <div className={`w-4 sm:w-8 h-[2px] ${idx === 0 && (step === 'SHIPPING' || step === 'PAYMENT') ? 'bg-brand-green' : idx === 1 && step === 'PAYMENT' ? 'bg-brand-green' : 'bg-gray-100'}`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'SUMMARY' ? (
              <motion.div 
                key="summary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="max-h-60 overflow-y-auto space-y-4 pr-1">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-lg text-[10px] font-black">
                             الكمية: {item.quantity}
                          </span>
                          <span className="text-gray-800 font-black text-sm">{(item.price * item.quantity).toLocaleString()} ر.س</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl space-y-3">
                  <div className="flex justify-between text-gray-500 text-sm">
                    <span>عدد السلع</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between text-xl font-black pt-2 border-t border-gray-200">
                    <span>الإجمالي النهائي</span>
                    <span className="text-brand-green">{totalAmount.toLocaleString()} ر.س</span>
                  </div>
                </div>

                <button 
                  onClick={handleNextFromSummary}
                  className="w-full bg-brand-green text-brand-black py-4 rounded-2xl font-black text-lg hover:bg-brand-greenDark transition shadow-xl shadow-brand-green/10 flex items-center justify-center gap-3"
                >
                  الاستمرار لبيانات الشحن
                  <i className="fas fa-truck text-sm"></i>
                </button>
              </motion.div>
            ) : step === 'SHIPPING' ? (
              <motion.form 
                key="shipping"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleNextFromShipping}
                className="space-y-6"
              >
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-700 text-xs font-bold flex gap-3 items-center">
                  <i className="fas fa-info-circle text-lg"></i>
                  تأكد من إدخال عنوان دقيق لضمان سرعة التوصيل.
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">المدينة</label>
                    <input 
                      type="text"
                      placeholder="مثال: الرياض"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none bg-gray-50 font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">رقم الجوال</label>
                    <input 
                      type="text"
                      placeholder="05xxxxxxx"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none bg-gray-50 font-bold"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">العنوان التفصيلي</label>
                    <input 
                      type="text"
                      placeholder="الحي، اسم الشارع، رقم البناية"
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-green outline-none bg-gray-50 font-bold"
                      required
                    />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit"
                    className="flex-[2] bg-brand-black text-white py-4 rounded-2xl font-black text-lg hover:bg-black transition shadow-xl flex items-center justify-center gap-3"
                  >
                    اختيار طريقة الدفع
                    <i className="fas fa-credit-card text-sm"></i>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStep('SUMMARY')}
                    className="flex-1 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition"
                  >
                    تراجع
                  </button>
                </div>
              </motion.form>
            ) : step === 'PAYMENT' ? (
              <motion.div 
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`p-6 rounded-3xl border-4 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'ONLINE' ? 'border-brand-green bg-brand-green/5' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${paymentMethod === 'ONLINE' ? 'bg-brand-green text-black' : 'bg-gray-200 text-gray-400'}`}>
                      <i className="fas fa-mobile-alt"></i>
                    </div>
                    <span className={`font-black ${paymentMethod === 'ONLINE' ? 'text-gray-900' : 'text-gray-500'}`}>دفع إلكتروني</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-6 rounded-3xl border-4 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'COD' ? 'border-brand-green bg-brand-green/5' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${paymentMethod === 'COD' ? 'bg-brand-green text-black' : 'bg-gray-200 text-gray-400'}`}>
                      <i className="fas fa-hand-holding-usd"></i>
                    </div>
                    <span className={`font-black ${paymentMethod === 'COD' ? 'text-gray-900' : 'text-gray-500'}`}>عند الاستلام</span>
                  </button>
                </div>

                {paymentMethod === 'ONLINE' && (
                  <div className="bg-gray-50 p-6 rounded-3xl border space-y-4">
                    <p className="text-xs font-black text-gray-400 text-center uppercase tracking-widest">اختر المحفظة الإلكترونية</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'SYRIATEL', label: 'سيريتل كاش', icon: '📞' },
                        { id: 'MTN', label: 'MTN كاش', icon: '📱' },
                        { id: 'SHAM', label: 'شام كاش', icon: '🏦' }
                      ].map(p => (
                        <button 
                          key={p.id}
                          onClick={() => setPaymentProvider(p.id as any)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${paymentProvider === p.id ? 'border-brand-green bg-white shadow-md' : 'border-transparent text-gray-400 opacity-60'}`}
                        >
                          <span className="text-xl">{p.icon}</span>
                          <span className="text-[10px] font-black">{p.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Transaction Reference Input */}
                    <div className="mt-4 space-y-2">
                      <label className="block text-[10px] font-bold text-gray-500 mr-1">رقم عملية التحويل (من رسالة التأكيد):</label>
                      <input 
                        type="text"
                        placeholder="مثال: 123456789"
                        className="w-full bg-white border-2 border-brand-green/20 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-green outline-none transition-all placeholder:text-gray-300"
                        required
                      />
                    </div>

                    {/* Instructions for Payment Codes */}
                    <div className="mt-4 p-4 bg-white/50 border border-brand-green/20 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-brand-green text-[10px] font-black">
                        <i className="fas fa-info-circle"></i>
                        <span>تعليمات إتمام الدفع:</span>
                      </div>
                      <div className="text-[11px] font-bold text-gray-700 leading-relaxed">
                        {paymentProvider === 'SYRIATEL' && (
                          <p>اطلب <span className="text-brand-green bg-gray-100 px-2 py-0.5 rounded text-gray-900 font-mono">*150#</span> للمباشرة بعملية التحويل إلى حساب التاجر.</p>
                        )}
                        {paymentProvider === 'MTN' && (
                          <p>اطلب <span className="text-brand-green bg-gray-100 px-2 py-0.5 rounded text-gray-900 font-mono">*2020#</span> واتبع التعليمات لاختيار كاش MTN للموافقة.</p>
                        )}
                        {paymentProvider === 'SHAM' && (
                          <p>استخدم تطبيق <span className="text-brand-green">شام كاش</span> أو عبر الصراف لإتمام عملية التحويل المباشر.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={handlePaymentConfirm}
                    disabled={isProcessing}
                    className="flex-[2] bg-brand-green text-brand-black py-4 rounded-2xl font-black text-lg hover:bg-brand-greenDark shadow-xl shadow-brand-green/20 transition flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-shield-alt text-sm"></i>}
                    تأكيد الطلب والدفع
                  </button>
                  <button 
                    onClick={() => setStep('SHIPPING')}
                    className="flex-1 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition"
                  >
                    تراجع
                  </button>
                </div>
              </motion.div>
            ) : step === 'VERIFICATION' ? (
              <motion.form 
                key="verification"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleVerify} 
                className="space-y-8 py-4"
              >
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
                    <i className="fas fa-lock-open"></i>
                  </div>
                  <h3 className="text-xl font-black text-gray-900">أمان عالي</h3>
                  <p className="text-gray-500 text-xs">لقد أرسلنا رمزاً سرياً إلى رقمك {phone} لتأكيد العملية.</p>
                </div>

                <div className="space-y-4">
                  <input 
                    type="text"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value)}
                    placeholder="• • • • • •"
                    autoFocus
                    className="w-full px-4 py-5 rounded-3xl border-4 border-gray-100 focus:border-brand-green focus:ring-0 outline-none text-center font-mono text-4xl tracking-[0.2em] bg-gray-50 shadow-inner"
                  />
                  
                  {error && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-exclamation-triangle"></i>
                      {error}
                    </motion.div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-brand-black text-white py-5 rounded-3xl font-black text-xl hover:bg-black transition shadow-2xl flex items-center justify-center gap-3"
                >
                  {isProcessing ? <i className="fas fa-circle-notch fa-spin text-2xl"></i> : 'تأكيد الرمز والدفع'}
                </button>

                <p className="text-center text-sm font-bold text-gray-400">
                  هل واجهت مشكلة؟ <button type="button" className="text-brand-green">إعادة الإرسال</button>
                </p>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-12 flex flex-col items-center text-center"
              >
                <div className="relative mb-8">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                    className="w-32 h-32 bg-brand-green rounded-full flex items-center justify-center text-black text-5xl shadow-2xl shadow-brand-green/30"
                  >
                    <i className="fas fa-check"></i>
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-6 border-4 border-brand-green rounded-full opacity-30"
                  ></motion.div>
                </div>
                
                <h3 className="text-3xl font-black text-gray-900 mb-4">مبروك! تم طلبك بنجاح</h3>
                <p className="text-gray-500 mb-10 max-w-sm mx-auto font-bold leading-relaxed">
                  سيصلك إشعار قريباً بتفاصيل التتبع. شكراً لاختيارك <span className="text-brand-green">وسيط بلاس</span>.
                </p>

                <button 
                  onClick={onClose}
                  className="bg-brand-black text-white px-12 py-4 rounded-2xl font-black text-lg hover:bg-gray-800 transition shadow-2xl"
                >
                  العودة للتسوق
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutModal;
