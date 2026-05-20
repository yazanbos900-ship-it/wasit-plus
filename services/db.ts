
import { User, Ad, Banner, Category, ChatRoom, Order, Comment, AdReport, Notification } from '../types';

const KEYS = {
  USERS: 'app_users',
  ADS: 'app_ads',
  BANNERS: 'app_banners',
  CATEGORIES: 'app_categories',
  CHATS: 'app_chats',
  ORDERS: 'app_orders',
  COMMENTS: 'app_comments',
  REPORTS: 'app_reports',
  NOTIFICATIONS: 'app_notifications',
  CURRENT_USER: 'app_current_session'
};

export const db = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
  saveUsers: (users: User[]) => localStorage.setItem(KEYS.USERS, JSON.stringify(users)),
  
  getAds: (): Ad[] => JSON.parse(localStorage.getItem(KEYS.ADS) || '[]'),
  saveAds: (ads: Ad[]) => localStorage.setItem(KEYS.ADS, JSON.stringify(ads)),
  
  getBanners: (): Banner[] => JSON.parse(localStorage.getItem(KEYS.BANNERS) || '[]'),
  saveBanners: (banners: Banner[]) => localStorage.setItem(KEYS.BANNERS, JSON.stringify(banners)),

  getCategories: (): Category[] => JSON.parse(localStorage.getItem(KEYS.CATEGORIES) || '[]'),
  saveCategories: (categories: Category[]) => localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories)),

  getChats: (): ChatRoom[] => JSON.parse(localStorage.getItem(KEYS.CHATS) || '[]'),
  saveChats: (chats: ChatRoom[]) => localStorage.setItem(KEYS.CHATS, JSON.stringify(chats)),

  getOrders: (): Order[] => JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]'),
  saveOrders: (orders: Order[]) => localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders)),

  getComments: (): Comment[] => JSON.parse(localStorage.getItem(KEYS.COMMENTS) || '[]'),
  saveComments: (comments: Comment[]) => localStorage.setItem(KEYS.COMMENTS, JSON.stringify(comments)),

  getReports: (): AdReport[] => JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]'),
  saveReports: (reports: AdReport[]) => localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports)),

  getNotifications: (): Notification[] => JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]'),
  saveNotifications: (notifications: Notification[]) => localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications)),

  deleteCategory: (id: string) => {
    const categories = db.getCategories().filter(c => c.id !== id);
    db.saveCategories(categories);
  },

  getCurrentUser: (): User | null => JSON.parse(localStorage.getItem(KEYS.CURRENT_USER) || 'null'),
  setCurrentUser: (user: User | null) => localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user)),

  deleteUser: (id: string) => {
    const users = db.getUsers().filter(u => u.id !== id);
    db.saveUsers(users);
  },

  updateUser: (id: string, updates: Partial<User>) => {
    const users = db.getUsers().map(u => u.id === id ? { ...u, ...updates } : u);
    db.saveUsers(users);
  },

  deleteAd: (id: string) => {
    const ads = db.getAds().filter(a => a.id !== id);
    db.saveAds(ads);
  },

  updateAd: (id: string, updates: Partial<Ad>) => {
    const ads = db.getAds().map(a => a.id === id ? { ...a, ...updates } : a);
    db.saveAds(ads);
  },

  init: () => {
    if (!localStorage.getItem(KEYS.CATEGORIES)) {
      const initialCategories: Category[] = [
        { id: '1', name: 'إلكترونيات', icon: 'fas fa-laptop' },
        { id: '2', name: 'سيارات', icon: 'fas fa-car' },
        { id: '3', name: 'عقارات', icon: 'fas fa-home' },
        { id: '4', name: 'خدمات', icon: 'fas fa-tools' }
      ];
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(initialCategories));
    }

    if (!localStorage.getItem(KEYS.USERS)) {
      // Seed initial data
      const initialAdmin: User = {
        id: 'admin-1',
        name: 'مدير النظام',
        phone: '0500000000',
        password: 'admin',
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(KEYS.USERS, JSON.stringify([initialAdmin]));
    }
    
    if (!localStorage.getItem(KEYS.ADS)) {
      const initialAds: Ad[] = [
        {
          id: 'ad-1',
          title: 'آيفون 15 برو ماكس جديد',
          description: 'جهاز جديد لم يفتح، لون تايتنيوم طبيعي.',
          price: 4500,
          category: 'إلكترونيات',
          image: 'https://picsum.photos/seed/iphone/800/600',
          userId: 'admin-1',
          userName: 'مدير النظام',
          isFeatured: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'ad-2',
          title: 'سيارة تويوتا كامري 2024',
          description: 'فل كامل، ممشى بسيط جداً، صيانة دورية بالوكالة.',
          price: 110000,
          category: 'سيارات',
          image: 'https://picsum.photos/seed/car/800/600',
          userId: 'admin-1',
          userName: 'مدير النظام',
          isFeatured: false,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(KEYS.ADS, JSON.stringify(initialAds));
    }

    if (!localStorage.getItem(KEYS.BANNERS)) {
      const initialBanners: Banner[] = [
        { id: 'b1', title: 'عروض الصيف', image: 'https://picsum.photos/seed/summer/1200/400', active: true },
        { id: 'b2', title: 'العودة للمدارس', image: 'https://picsum.photos/seed/school/1200/400', active: true }
      ];
      localStorage.setItem(KEYS.BANNERS, JSON.stringify(initialBanners));
    }
  }
};
