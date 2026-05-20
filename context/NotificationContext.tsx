import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { Notification, User } from '../types';
import { useFirebase } from './FirebaseContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useFirebase();

  const refreshNotifications = async () => {
    if (user) {
      const data = await api.getNotifications(user.id);
      setNotifications(data);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    refreshNotifications();
    // Poll every 5 seconds for simulation
    const interval = setInterval(refreshNotifications, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    await api.markAsRead(id);
    refreshNotifications();
  };

  const markAllAsRead = async () => {
    if (user) {
      await api.markAllAsRead(user.id);
      refreshNotifications();
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
