import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => void;
  mockLogin: (role: 'USER' | 'ADMIN') => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('waseet_plus_auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const mockLogin = (role: 'USER' | 'ADMIN' = 'USER') => {
    const mockUser: User = {
      id: role === 'ADMIN' ? 'admin_zakour' : 'user_1',
      name: role === 'ADMIN' ? 'المدير زكور' : 'مستخدم تجريبي',
      email: role === 'ADMIN' ? 'admin@waseet.com' : 'user@example.com',
      image: 'https://ui-avatars.com/api/?name=' + (role === 'ADMIN' ? 'Admin+Zakour' : 'User'),
      role: role,
      createdAt: new Date().toISOString(),
      storeName: role === 'ADMIN' ? 'الإدارة العامة' : 'متجري الشخصي',
      storeImage: 'https://picsum.photos/seed/store/200'
    };
    setUser(mockUser);
    localStorage.setItem('waseet_plus_auth_user', JSON.stringify(mockUser));
    
    // Also save to "all users" for api simulation and server
    const allUsers = JSON.parse(localStorage.getItem('waseet_plus_users') || '[]');
    if (!allUsers.find((u: any) => u.id === mockUser.id)) {
      localStorage.setItem('waseet_plus_users', JSON.stringify([...allUsers, mockUser]));
    }

    // Sync to backend real database
    fetch('/api/users/login-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUser)
    }).catch(err => console.error('Error syncing user on mockLogin:', err));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('waseet_plus_auth_user');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      loading, 
      isAdmin, 
      logout,
      mockLogin
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
