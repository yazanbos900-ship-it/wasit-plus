
import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: () => void;
}

import { useFirebase } from '../context/FirebaseContext';

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { mockLogin } = useFirebase();
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhone = (p: string) => p === 'zakour' || /^09[3-9]\d{7}$/.test(p);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    if (phone === 'zakour' && password === 'zakour441') {
      mockLogin('ADMIN');
    } else {
      mockLogin(phone.includes('999') ? 'ADMIN' : 'USER');
    }
    onLoginSuccess();
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phone === 'zakour' && password !== 'zakour441') {
      setError('كلمة المرور غير صحيحة للحساب الإداري');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    
    if (phone === 'zakour' && password === 'zakour441') {
      mockLogin('ADMIN');
    } else {
      mockLogin(phone.includes('999') ? 'ADMIN' : 'USER');
    }
    
    onLoginSuccess();
    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-cairo">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex bg-gray-50 border-b">
          <button 
            onClick={() => { setActiveTab('LOGIN'); setError(''); }}
            className={`flex-1 py-5 text-sm font-bold transition-all ${activeTab === 'LOGIN' ? 'bg-white text-brand-green border-b-2 border-brand-green' : 'text-gray-400 hover:text-gray-600'}`}
          >
            تسجيل الدخول
          </button>
          <button 
            onClick={() => { setActiveTab('REGISTER'); setError(''); }}
            className={`flex-1 py-5 text-sm font-bold transition-all ${activeTab === 'REGISTER' ? 'bg-white text-brand-green border-b-2 border-brand-green' : 'text-gray-400 hover:text-gray-600'}`}
          >
            حساب جديد
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
              <i className={`fas ${activeTab === 'LOGIN' ? 'fa-fingerprint' : 'fa-user-plus'} text-2xl`}></i>
            </div>
            <h2 className="text-xl font-black text-gray-900">
              {activeTab === 'LOGIN' ? 'مرحباً بك مجدداً' : 'انضم إلى وسيط بلاس'}
            </h2>
            <p className="text-gray-500 text-xs mt-2 leading-relaxed px-4">
              {activeTab === 'LOGIN' 
                ? 'أدخل بياناتك للوصول إلى لوحة التحكم الخاصة بك' 
                : 'أنشئ حسابك الآن لتبدأ البيع والشراء بأمان وسهولة'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'REGISTER' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 mr-1 uppercase">الاسم الكامل</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-4 pr-11 py-3.5 bg-gray-50/50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-brand-green focus:shadow-sm outline-none transition-all text-sm font-bold"
                    placeholder="الاسم الأول والأخير"
                  />
                  <i className="fas fa-user absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 mr-1 uppercase">رقم الهاتف</label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full pl-4 pr-11 py-3.5 bg-gray-50/50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-brand-green focus:shadow-sm outline-none transition-all text-sm font-bold ${phone ? 'font-mono tracking-wider' : ''} ${phone && !validatePhone(phone) ? 'border-red-100' : ''}`}
                  placeholder="09xxxxxxxx"
                  dir="ltr"
                />
                <i className="fas fa-phone absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
              {phone && !validatePhone(phone) && (
                <p className="text-[10px] text-red-500 mr-2">يرجى إدخال رقم سوري صحيح</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400 mr-1 uppercase">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-11 py-3.5 bg-gray-50/50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-brand-green focus:shadow-sm outline-none transition-all text-sm font-bold"
                  placeholder="••••••••"
                />
                <i className="fas fa-lock absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-green transition"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Admin toggle hidden */}

            {activeTab === 'REGISTER' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 mr-1 uppercase">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-4 pr-11 py-3.5 bg-gray-50/50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-brand-green focus:shadow-sm outline-none transition-all text-sm font-bold ${confirmPassword && password !== confirmPassword ? 'border-red-100' : ''}`}
                    placeholder="••••••••"
                  />
                  <i className="fas fa-shield-alt absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[11px] font-bold flex items-center gap-3 animate-head-shake">
                <i className="fas fa-exclamation-circle text-lg"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-black text-brand-green py-4 rounded-[1.25rem] font-black text-sm hover:translate-y-[-2px] active:translate-y-[0] transition-all shadow-xl shadow-brand-green/5 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{activeTab === 'LOGIN' ? 'دخول آمن' : 'إنشاء حسابي'}</span>
                  <i className="fas fa-arrow-left text-xs"></i>
                </>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-gray-300">
                <span className="bg-white px-4">أو عبر التواصل</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 border-2 border-gray-100 rounded-2xl text-gray-700 hover:bg-gray-50 hover:border-brand-green/20 transition-all font-bold text-sm"
            >
              <i className="fab fa-google text-red-500 text-lg"></i>
              <span>متابعة بواسطة Google</span>
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
             <p className="text-[10px] text-gray-400 font-medium text-center leading-relaxed">
               بالمتابعة، أنت توافق على <span className="text-brand-green font-bold cursor-pointer">شروط الخدمة</span> و <span className="text-brand-green font-bold cursor-pointer">سياسة الخصوصية</span>
             </p>
             <div className="flex items-center gap-2 text-[9px] font-black text-gray-300 uppercase tracking-widest">
               <div className="w-12 h-[1px] bg-gray-100"></div>
               <span>محمي بواسطة وسيط بلاس</span>
               <div className="w-12 h-[1px] bg-gray-100"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

