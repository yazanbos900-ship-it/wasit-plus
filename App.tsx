import React, { useState } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateAd from './pages/CreateAd';
import AdminDashboard from './pages/AdminDashboard';
import AdDetails from './pages/AdDetails';
import MyChats from './pages/MyChats';
import SellerDashboard from './pages/SellerDashboard';
import MyOrders from './pages/MyOrders';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import OfflineOverlay from './components/OfflineOverlay';
import UpdateOverlay from './components/UpdateOverlay';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const { user, loading, isAdmin } = useFirebase();

  const handleLoginSuccess = () => {
    setCurrentPage('home');
  };

  const navigate = (page: string) => {
    if (page === 'create-ad' && !user) {
      setCurrentPage('login');
      return;
    }
    if (page === 'admin' && !isAdmin) {
      setCurrentPage('home');
      return;
    }
    setCurrentPage(page);
    setSelectedAdId(null);
    window.scrollTo(0, 0);
  };

  const openAdDetails = (id: string) => {
    setSelectedAdId(id);
    setCurrentPage('ad-details');
    window.scrollTo(0, 0);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <div className="h-16 w-16 border-4 border-brand-green/20 rounded-full animate-pulse"></div>
        <div className="absolute top-0 left-0 h-16 w-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xl font-black text-brand-black tracking-tighter">وسيط</span>
          <span className="text-xl font-black text-brand-green tracking-tighter">بلاس</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onAdClick={openAdDetails} />;
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />;
      case 'create-ad':
        return <CreateAd onSuccess={() => setCurrentPage('home')} />;
      case 'admin':
        return <AdminDashboard />;
      case 'ad-details':
        return selectedAdId ? (
          <AdDetails 
            adId={selectedAdId} 
            onBack={() => setCurrentPage('home')} 
            currentUser={user}
          />
        ) : <Home onAdClick={openAdDetails} />;
      case 'my-chats':
        return user ? <MyChats currentUser={user} onAdClick={openAdDetails} /> : <Login onLoginSuccess={handleLoginSuccess} />;
      case 'seller-dashboard':
        return user ? (
          <SellerDashboard 
            currentUser={user} 
            onNavigate={navigate} 
            onAdClick={openAdDetails} 
          />
        ) : <Login onLoginSuccess={handleLoginSuccess} />;
      case 'my-orders':
        return user ? <MyOrders currentUser={user} onNavigate={navigate} /> : <Login onLoginSuccess={handleLoginSuccess} />;
      default:
        return <Home onAdClick={openAdDetails} />;
    }
  };

  return (
    <>
      <OfflineOverlay />
      <UpdateOverlay />
      <Layout 
        user={user} 
        onNavigate={navigate}
      >
        {renderPage()}
      </Layout>
    </>
  );
};

const App: React.FC = () => {
  return (
    <FirebaseProvider>
      <CartProvider>
        <AppContentWrapper />
      </CartProvider>
    </FirebaseProvider>
  );
};

const AppContentWrapper: React.FC = () => {
  const { user } = useFirebase();
  return (
    <NotificationProvider currentUser={user}>
      <AppContent />
    </NotificationProvider>
  );
};

export default App;
