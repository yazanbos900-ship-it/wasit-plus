
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import NotificationCenter from './NotificationCenter';
import { PWADiagnostics, DiagnosticResult } from '../services/pwaDiagnostics';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onNavigate: (page: string) => void;
}

import { useFirebase } from '../context/FirebaseContext';

const Layout: React.FC<LayoutProps> = ({ children, user, onNavigate }) => {
  const { cartCount, cartItems, clearCart } = useCart();
  const { logout } = useFirebase();

  const handleLogout = async () => {
    try {
      logout();
      onNavigate('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>((window as any).deferredPrompt || null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showLocalBanner, setShowLocalBanner] = useState(() => {
    return localStorage.getItem('pwa_banner_dismissed') !== 'true';
  });

  // Delayed engagement & soft CTA states
  const [engagementPassed, setEngagementPassed] = useState(false);
  const [interactionRegistered, setInteractionRegistered] = useState(false);
  const [showDelayedBannerNow, setShowDelayedBannerNow] = useState(false);

  // Diagnostic states
  const [isDevMode, setIsDevMode] = useState(false);
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);
  const [swActiveState, setSwActiveState] = useState('Checking...');

  const isInstallable = isStandalone ? false : (isIOS || !!deferredPrompt || !!(window as any).deferredPrompt);

  const handleDismissBanner = () => {
    localStorage.setItem('pwa_banner_dismissed', 'true');
    setShowLocalBanner(false);
    setShowDelayedBannerNow(false);
  };

  React.useEffect(() => {
    // Detect environment (Dev / preview / local) to show Debug Floating Button
    const hostname = window.location.hostname;
    const isLocalOrDev = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('ais-dev') || hostname.includes('-dev-') || hostname.includes('run.app');
    setIsDevMode(isLocalOrDev);

    // Initial check standalone
    const checkStandalone = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isPWA);
    };
    
    checkStandalone();

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Fetch and save initial sw state
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          setSwActiveState(reg.active ? 'Active' : (reg.waiting ? 'Waiting (Update Available)' : 'Installing'));
        } else {
          setSwActiveState('Not Registered');
        }
      });
    } else {
      setSwActiveState('Not Supported');
    }

    // Check if prompt is already cached globally
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      PWADiagnostics.markPromptFired();
    }

    // Delayed CTA: delay timer for 5 seconds
    const delayTimer = setTimeout(() => {
      setEngagementPassed(true);
    }, 4000);

    // Scroll and interaction tracking function
    const handleUserActivity = () => {
      PWADiagnostics.trackEngagement();
      setInteractionRegistered(true);
    };

    window.addEventListener('scroll', handleUserActivity, { passive: true });
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    // Listen for prompt available custom event (fired from index.html)
    const handlePromptEvent = (e: Event) => {
      const promptEvent = (e as CustomEvent).detail;
      setDeferredPrompt(promptEvent);
      PWADiagnostics.markPromptFired();
      PWADiagnostics.runFullDiagnostics().then(setDiagnosticResults);
    };

    window.addEventListener('pwa-prompt-available', handlePromptEvent);

    // Normal beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setDeferredPrompt(e);
      PWADiagnostics.markPromptFired();
      PWADiagnostics.runFullDiagnostics().then(setDiagnosticResults);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener 1: appinstalled
    const handleAppInstalled = (e: Event) => {
      console.log('🎉 PWA successfully installed on this device!');
      setInstalledSuccessfully(true);
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
      PWADiagnostics.runFullDiagnostics().then(setDiagnosticResults);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listener 2: controllerchange (Active service worker changed)
    const handleControllerChange = () => {
      console.log('🔄 Active Service Worker updated.');
      setSwActiveState('Active (Updated)');
    };
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    // Listener 3: visibilitychange (Run diagnostics again on visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        PWADiagnostics.runFullDiagnostics().then(setDiagnosticResults);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Launch initial diagnostics table
    PWADiagnostics.runFullDiagnostics().then(setDiagnosticResults);

    return () => {
      clearTimeout(delayTimer);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('pwa-prompt-available', handlePromptEvent);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
    };
  }, []);

  // Monitor delayed CTA display requirements
  React.useEffect(() => {
    if (engagementPassed && interactionRegistered && showLocalBanner) {
      const renderTimer = setTimeout(() => {
        setShowDelayedBannerNow(true);
      }, 500);
      return () => clearTimeout(renderTimer);
    }
  }, [engagementPassed, interactionRegistered, showLocalBanner]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setIsDownloadModalOpen(true);
      return;
    }

    // Prioritize global window cache as well
    const activePrompt = deferredPrompt || (window as any).deferredPrompt;
    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const { outcome } = await activePrompt.userChoice;
        console.log('User installation choice outcome:', outcome);
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          (window as any).deferredPrompt = null;
          setInstalledSuccessfully(true);
        }
      } catch (err) {
        console.error('Error triggering PWA install prompt:', err);
        setIsDownloadModalOpen(true);
      }
    } else {
      // Fallback: Show manual instructions modal
      setIsDownloadModalOpen(true);
    }
  };

  const handleCheckoutConfirm = async (paymentMethod: 'ONLINE' | 'COD', shippingAddress: { city: string, street: string, phone: string }, paymentProvider?: 'SYRIATEL' | 'MTN' | 'SHAM') => {
    if (!user) return;
    try {
      // Create orders for all items in cart
      await Promise.all(cartItems.map(item => 
        api.createOrder(item, user, paymentMethod, shippingAddress, paymentProvider)
      ));
      clearCart();
    } catch (e) {
      alert('حدث خطأ أثناء معالجة الطلب');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-surface">
      {/* Navbar */}
      <nav className="bg-white sticky top-0 z-50 text-brand-black shadow-sm border-b border-gray-100 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 sm:h-16 items-center">
            <div className="flex items-center gap-8">
              <h1 
                onClick={() => onNavigate('home')}
                className="text-2xl font-bold cursor-pointer flex items-center gap-2"
              >
                <div className="flex items-center gap-1">
                  <span className="text-brand-black font-black font-cairo">وسيط</span>
                  <span className="text-brand-green font-black font-cairo">بلاس</span>
                </div>
              </h1>
              
              <div className="hidden md:flex items-center space-x-reverse space-x-6">
                <button onClick={() => onNavigate('home')} className="text-gray-600 hover:text-brand-green font-bold text-sm transition-colors font-cairo">الرئيسية</button>
                {user && (
                   <button onClick={() => onNavigate('my-orders')} className="text-gray-600 hover:text-brand-green font-bold text-sm transition-colors font-cairo">طلباتي</button>
                )}
                <button className="text-gray-600 hover:text-brand-green font-bold text-sm transition-colors font-cairo">التصنيفات</button>
                {user?.role === 'ADMIN' && (
                  <button onClick={() => onNavigate('admin')} className="text-brand-green font-black hover:text-brand-green-dark underline font-cairo">لوحة التحكم</button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isInstallable && (
                <button 
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 bg-brand-green/10 border border-brand-green/20 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black text-brand-green hover:bg-brand-green/20 transition-all cursor-pointer shadow-sm shadow-brand-green/5"
                >
                  <i className="fas fa-download animate-pulse"></i>
                  <span>تثبيت التطبيق</span>
                </button>
              )}

              {user && <NotificationCenter onNavigate={onNavigate} />}
              
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-400 hover:text-brand-green transition"
                title="السلة"
              >
                <i className="fas fa-shopping-cart text-xl"></i>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-green text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => onNavigate('create-ad')}
                    className="hidden sm:block bg-brand-green text-black px-4 py-2 rounded-lg font-black text-sm hover:bg-brand-green-dark transition shadow-sm font-cairo"
                  >
                    أضف إعلان
                  </button>
                  <button 
                    onClick={() => onNavigate('my-chats')}
                    className="hidden sm:block relative p-2 text-gray-400 hover:text-brand-green transition"
                    title="رسائلي"
                  >
                    <i className="fas fa-comment-dots text-xl"></i>
                  </button>
                  <button 
                    onClick={() => onNavigate('seller-dashboard')}
                    className="hidden sm:block p-2 text-gray-400 hover:text-brand-green transition"
                    title="لوحة تحكم البائع"
                  >
                    <i className="fas fa-store text-xl"></i>
                  </button>
                  <div className="hidden sm:block h-8 w-[1px] bg-gray-100 mx-2"></div>
                  <span className="text-gray-700 font-bold hidden lg:inline font-cairo text-sm">أهلاً، {user.name}</span>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 transition"
                  >
                    <i className="fas fa-sign-out-alt text-lg"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onNavigate('login')}
                  className="bg-brand-green text-black px-6 py-2 rounded-lg font-black hover:bg-brand-green-dark transition font-cairo text-sm"
                >
                  دخول
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Smart PWA Install Prompt Banner */}
      {showDelayedBannerNow && isInstallable && (
        <div className="bg-brand-black text-white px-4 py-3.5 border-b border-brand-green/20 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center shrink-0 border border-brand-green/20">
              <i className="fas fa-mobile-screen-button text-lg animate-bounce duration-1000"></i>
            </div>
            <div>
              <p className="text-xs font-black font-cairo text-right">تثبيت تطبيق وسيط بلاس على هاتفك بنقرة واحدة</p>
              <p className="text-[10px] text-gray-400 font-cairo text-right mt-0.5">استمتع بتصفح سريع وموثوق للبيع والشراء في أي وقت!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleInstallClick}
              className="bg-brand-green text-black px-5 py-2 rounded-xl text-xs font-black transition-all active:scale-95 font-cairo shadow-lg shadow-brand-green/20 hover:bg-brand-green-dark"
            >
              تثبيت الآن بنقرة واحدة
            </button>
            <button 
              onClick={handleDismissBanner}
              className="text-gray-400 hover:text-white p-2 text-sm transition-colors"
              title="إغلاق التنبيه"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow pb-28 sm:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-4 right-4 z-[100]">
        <div className="bg-white/95 backdrop-blur-xl border border-gray-100 px-2 py-2 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.1)] flex justify-around items-center h-16">
          <button 
            onClick={() => onNavigate('home')}
            className="flex-1 flex flex-col items-center gap-1 transition-all active:scale-90"
          >
            <div className={`flex flex-col items-center ${true ? 'text-brand-green' : 'text-gray-400'}`}>
              <i className="fas fa-home text-lg"></i>
              <span className="text-[7px] font-black mt-0.5 uppercase tracking-tighter">الرئيسية</span>
            </div>
          </button>
          
          <button 
            onClick={() => user ? onNavigate('my-orders') : onNavigate('login')}
            className="flex-1 flex flex-col items-center gap-1 text-gray-400 active:scale-90"
          >
            <i className="fas fa-box text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-tighter">طلباتي</span>
          </button>

          <button 
            onClick={() => user ? onNavigate('create-ad') : onNavigate('login')}
            className="flex-1 flex flex-col items-center justify-center -mt-10 active:scale-90 transition-transform"
          >
            <div className="bg-brand-green text-black w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-brand-green/20 border-4 border-white">
              <i className="fas fa-plus text-lg"></i>
            </div>
          </button>

          <button 
            onClick={() => user ? onNavigate('seller-dashboard') : onNavigate('login')}
            className="flex-1 flex flex-col items-center gap-1 text-gray-400 active:scale-90"
          >
            <i className="fas fa-store text-lg"></i>
            <span className="text-[7px] font-black uppercase tracking-tighter">نشاطي</span>
          </button>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex-1 flex flex-col items-center gap-1 text-gray-400 relative active:scale-90"
          >
            <i className="fas fa-shopping-cart text-lg"></i>
            {cartCount > 0 && (
              <span className="absolute top-0 right-1/4 bg-brand-green text-white text-[7px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white">
                {cartCount}
              </span>
            )}
            <span className="text-[7px] font-black uppercase tracking-tighter">السلة</span>
          </button>
        </div>
      </div>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={() => {
          if (!user) {
            onNavigate('login');
            setIsCartOpen(false);
            return;
          }
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {user && (
        <CheckoutModal 
          isOpen={isCheckoutOpen}
          items={cartItems}
          currentUser={user}
          onClose={() => setIsCheckoutOpen(false)}
          onConfirm={handleCheckoutConfirm}
        />
      )}

      {/* Download App Modal */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDownloadModalOpen(false)}></div>
          
          {isIOS ? (
            /* iOS Specific Guide - Styled to look like a system instruction */
            <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-sm relative z-10 overflow-hidden animate-in slide-in-from-bottom duration-500 shadow-2xl">
              <div className="p-8 text-center border-b border-gray-100">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                  <i className="fab fa-apple text-3xl"></i>
                </div>
                <h3 className="text-xl font-black text-gray-900 font-cairo">تثبيت على الآيفون</h3>
                <p className="text-gray-500 text-[10px] mt-2 font-medium leading-relaxed px-4">
                  نظام Apple يمنع التثبيت التلقائي بضغطة واحدة. يرجى اتباع هذه الخطوات يدوياً لإضافة التطبيق لشاشتك:
                </p>
              </div>

              <div className="p-8 space-y-8 text-right" dir="rtl">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <i className="fas fa-arrow-up-from-bracket text-blue-500"></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 font-cairo">1. اضغط زر المشاركة (Share)</p>
                      <p className="text-[10px] text-gray-400 mt-1">الموجود في شريط متصفح Safari بالأسفل</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <i className="fas fa-plus-square text-gray-700"></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 font-cairo">2. اسحب للأعلى واختر "Add to Home Screen"</p>
                      <p className="text-[10px] text-gray-400 mt-1">أو "إضافة إلى الشاشة الرئيسية"</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                      <i className="fas fa-check"></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 font-cairo">3. اضغط "إضافة" (Add)</p>
                      <p className="text-[10px] text-gray-400 mt-1">وسيظهر التطبيق في قائمتك كأنه تطبيق رسمي</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setIsDownloadModalOpen(false)}
                    className="w-full bg-brand-black text-brand-green py-4 rounded-xl font-black text-sm transition-all"
                  >
                    فهمت، سأقوم بذلك الآن
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Android/Other Guide */
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300 shadow-2xl">
              <div className="bg-brand-black p-8 text-center relative">
                <button 
                  onClick={() => setIsDownloadModalOpen(false)}
                  className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
                <div className="w-20 h-20 bg-brand-green text-black rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-xl shadow-brand-green/20">
                  <i className="fas fa-mobile-screen text-4xl"></i>
                </div>
                <h3 className="text-white text-xl font-black font-cairo">تثبيت وسيط بلاس</h3>
                <p className="text-gray-400 text-xs mt-2 font-medium">استمتع بتجربة أسرع للبيع والشراء</p>
              </div>
              
              <div className="p-8 space-y-6 text-right" dir="rtl">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-black shrink-0 text-xs">1</div>
                    <p className="text-sm font-bold text-gray-700 leading-relaxed font-cairo">
                      اضغط على أيقونة النقاط الثلاث <i className="fas fa-ellipsis-v text-brand-green mx-1"></i> في أعلى المتصفح.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-black shrink-0 text-xs">2</div>
                    <p className="text-sm font-bold text-gray-700 leading-relaxed font-cairo">
                      ابحث عن خيار <span className="text-brand-green font-black">"Install App"</span> أو <span className="text-brand-green font-black">"إضافة للشاشة الرئيسية"</span>.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsDownloadModalOpen(false)}
                  className="w-full bg-brand-black text-brand-green py-4 rounded-2xl font-black text-sm hover:translate-y-[-2px] transition-all shadow-xl shadow-brand-green/5 font-cairo"
                >
                  فهمت، سأقوم بالتثبيت الآن
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Debug Button and Diagnostics Drawer - Allowed ONLY in dev/preview environments */}
      {isDevMode && (
        <>
          {/* Circular Sticky Button */}
          <div className="fixed bottom-24 left-6 z-[999] animate-bounce hover:animate-none">
            <button
              id="pwa-debug-trigger"
              onClick={() => {
                setIsDebugPanelOpen(true);
                PWADiagnostics.runFullDiagnostics().then(setDiagnosticResults);
              }}
              className="bg-brand-black hover:bg-zinc-800 text-brand-green border-2 border-brand-green/30 px-4 py-3 rounded-full shadow-[0_10px_30px_rgba(34,197,94,0.3)] flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 text-xs font-black font-cairo"
            >
              <i className="fas fa-bug text-sm"></i>
              <span>مصحح الـ PWA</span>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${deferredPrompt ? 'bg-brand-green' : 'bg-amber-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${deferredPrompt ? 'bg-brand-green' : 'bg-amber-500'}`}></span>
              </span>
            </button>
          </div>

          {/* Diagnostic Sidebar Panel */}
          {isDebugPanelOpen && (
            <div className="fixed inset-0 z-[1000] flex justify-start animate-fade-in">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
                onClick={() => setIsDebugPanelOpen(false)}
              ></div>
              
              {/* Content Panel */}
              <div className="relative bg-zinc-950 text-white w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden border-r border-zinc-800 animate-in slide-in-from-left duration-300" dir="rtl">
                
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-green/10 border border-brand-green/20 rounded-xl flex items-center justify-center text-brand-green">
                      <i className="fas fa-stethoscope text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-base font-black font-cairo">أداة فحص واختبار الـ PWA الاحترافية</h3>
                      <p className="text-[10px] text-zinc-400 font-cairo mt-0.5">لوحة تحليل المطورين - وسيط بلاس</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDebugPanelOpen(false)}
                    className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors hover:bg-zinc-700"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                {/* Live Badges Grid */}
                <div className="p-6 bg-zinc-900/50 border-b border-zinc-800 grid grid-cols-2 gap-3 text-right">
                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <p className="text-[9px] text-zinc-400 font-bold font-cairo">PWA Ready (الحدث)</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${deferredPrompt ? 'bg-brand-green animate-pulse' : 'bg-amber-500'}`}></span>
                      <span className="text-xs font-black font-cairo">{deferredPrompt ? 'تم الإطلاق والتقاطه' : 'قيد الانتظار'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <p className="text-[9px] text-zinc-400 font-bold font-cairo">قابلية التثبيت (Installable)</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${isInstallable ? 'bg-brand-green' : 'bg-red-500'}`}></span>
                      <span className="text-xs font-black font-cairo">{isInstallable ? 'متاح للتثبيت' : 'غير مهيأ'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <p className="text-[9px] text-zinc-400 font-bold font-cairo">حالة الـ Standalone</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${isStandalone ? 'bg-brand-green' : 'bg-zinc-500'}`}></span>
                      <span className="text-xs font-black font-cairo">{isStandalone ? 'تعمل داخل التطبيق' : 'تصفح تقليدي'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <p className="text-[9px] text-zinc-400 font-bold font-cairo">حالة الـ Service Worker</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                      <span className="text-xs font-black font-cairo truncate">{swActiveState}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <p className="text-[9px] text-zinc-400 font-bold font-cairo">هاتف Apple (iOS)</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${isIOS ? 'bg-blue-500' : 'bg-zinc-600'}`}></span>
                      <span className="text-xs font-black font-cairo">{isIOS ? 'نعم (دليل مخصص)' : 'لا'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                    <p className="text-[9px] text-zinc-400 font-bold font-cairo">نقاط تفاعل المستخدم</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-black text-brand-green font-mono">{PWADiagnostics.getEngagementScore()} نقرة/حركة</span>
                    </div>
                  </div>
                </div>

                {/* Middle Diagnostic Results & Controls */}
                <div className="flex-grow p-6 overflow-y-auto space-y-6 custom-scrollbar text-right">
                  
                  {/* Automated Cause Analyzer */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <h4 className="text-xs font-black text-amber-500 font-cairo flex items-center gap-2">
                      <i className="fas fa-circle-exclamation"></i>
                      <span>تحليل السبب المحتمل لعدم ظهور نافذة التثبيت حالياً:</span>
                    </h4>
                    <p className="text-[11px] text-amber-200 mt-2 font-cairo leading-relaxed font-bold">
                      {PWADiagnostics.analyzeUninstallabilityReason()}
                    </p>
                  </div>

                  {/* Hot Controls */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-zinc-300 font-cairo">إجراءات سريعة للمطور:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={async () => {
                          const results = await PWADiagnostics.runFullDiagnostics();
                          setDiagnosticResults(results);
                          alert('تم إعادة تشغيل الفحص وطباعة التقرير في console.table بنجاح!');
                        }}
                        className="bg-brand-green text-black hover:bg-brand-green-dark p-2.5 rounded-xl text-[10px] font-black font-cairo flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fas fa-rotate"></i>
                        <span>تحديث وتقارير Console</span>
                      </button>

                      <button
                        onClick={() => {
                          localStorage.removeItem('pwa_banner_dismissed');
                          setShowLocalBanner(true);
                          setEngagementPassed(true);
                          setInteractionRegistered(true);
                          setShowDelayedBannerNow(true);
                          alert('تم مسح الحظر الكاش! سيظهر بانر التثبيت بوضوح الآن.');
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-2.5 rounded-xl text-[10px] font-black font-cairo flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fas fa-trash-can"></i>
                        <span>إعادة تفعيل البانر الذكي</span>
                      </button>

                      <button
                        onClick={() => {
                          // Force mock a deferredPrompt trigger
                          const fakeEvent = {
                            preventDefault: () => {},
                            prompt: async () => {
                              alert('محاكاة: تم النقر على زر التثبيت الافتراضي!');
                            },
                            userChoice: Promise.resolve({ outcome: 'accepted' })
                          };
                          (window as any).deferredPrompt = fakeEvent;
                          setDeferredPrompt(fakeEvent);
                          PWADiagnostics.markPromptFired();
                          alert('تم محاكاة حدث beforeinstallprompt بنجاح! سيظهر زر تثبيت التطبيق الآن.');
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-2.5 rounded-xl text-[10px] font-black font-cairo flex items-center justify-center gap-2 cursor-pointer col-span-2"
                      >
                        <i className="fas fa-wand-magic-sparkles text-brand-green animate-pulse"></i>
                        <span>محاكاة إطلاق قبلية التثبيت (Force prompt)</span>
                      </button>
                    </div>
                  </div>

                  {/* Criteria Audit Logs */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-zinc-300 font-cairo">تفاصيل الفحص الحالي ({diagnosticResults.length}):</h4>
                    <div className="space-y-2.5">
                      {diagnosticResults.map((res, idx) => (
                        <div key={idx} className="p-3.5 bg-zinc-900 border border-zinc-800/80 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black font-cairo text-zinc-100">{res.condition}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                              res.status === 'PASSED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                              res.status === 'WARNING' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 
                              'bg-red-500/25 text-red-400 border border-red-500/35'
                            }`}>
                              {res.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono mt-1">القيمة: {res.value}</p>
                          <p className="text-[10px] text-brand-green/80 font-cairo mt-0.5 leading-relaxed">توصية: {res.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Footer status bar */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-950 text-center">
                  <span className="text-[9px] text-zinc-500 font-bold font-mono">PWA Diagnostics v4.0.0 • Verified Cloud Run Node</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <footer className="bg-white text-gray-600 py-16 mt-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="text-3xl font-bold flex items-center gap-2">
              <span className="text-brand-black font-black font-cairo">وسيط</span>
              <span className="text-brand-green font-black font-cairo">بلاس</span>
            </div>
          </div>
          <p className="mb-8 max-w-md mx-auto text-sm text-gray-500 leading-relaxed font-cairo">وسيط بلاس هي منصتك الموثوقة لبيع وشراء كل ما تحتاجه في مكان واحد بكل سهولة وأمان.</p>
          <div className="flex justify-center gap-8 text-xl mb-10">
            <a href="#" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-brand-green hover:text-black hover:border-brand-green transition-all"><i className="fab fa-twitter"></i></a>
            <a href="#" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-brand-green hover:text-black hover:border-brand-green transition-all"><i className="fab fa-instagram"></i></a>
            <a href="#" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-brand-green hover:text-black hover:border-brand-green transition-all"><i className="fab fa-whatsapp"></i></a>
          </div>
          <div className="border-t border-gray-50 pt-10 text-[10px] font-bold tracking-widest uppercase text-gray-400">
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} وسيط بلاس
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
