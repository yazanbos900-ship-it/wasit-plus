import { User, Ad, Banner, Category, ChatRoom, ChatMessage, Order, Comment, AdReport, Notification } from '../types';

const KEY_PREFIX = 'waseet_plus_';

// Client cache storage
const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    const item = localStorage.getItem(KEY_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  },
  set: (key: string, value: any) => {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  }
};

// Request wrapper with local cache fallback
const apiRequest = async <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  cacheKey?: string,
  defaultValue?: T
): Promise<T> => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  // Prevent browser & service worker caching of API calls by attaching a timestamp query param
  let requestUrl = url;
  if (method === 'GET') {
    const separator = url.includes('?') ? '&' : '?';
    requestUrl = `${url}${separator}_t=${Date.now()}`;
  }

  try {
    const res = await fetch(requestUrl, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    // Cache the successful response
    if (cacheKey) {
      storage.set(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.warn(`Request to ${url} failed. using local cache. Error:`, error);
    if (cacheKey) {
      return storage.get<T>(cacheKey, defaultValue as T);
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw error;
  }
};

export const api = {
  // Notifications
  getNotifications: async (userId: string): Promise<Notification[]> => {
    return apiRequest<Notification[]>(
      `/api/notifications/${userId}`,
      'GET',
      undefined,
      `notifications_${userId}`,
      []
    );
  },

  markAsRead: async (notificationId: string) => {
    await fetch(`/api/notifications/read/${notificationId}`, { method: 'POST' });
  },

  markAllAsRead: async (userId: string) => {
    await fetch(`/api/notifications/read-all/${userId}`, { method: 'POST' });
  },

  createNotification: async (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Promise<Notification> => {
    return apiRequest<Notification>(
      '/api/notifications',
      'POST',
      notification
    );
  },

  reportAd: async (ad: Ad, reporter: User, reason: AdReport['reason'], details?: string): Promise<AdReport> => {
    const reportData = {
      adId: ad.id,
      adTitle: ad.title,
      reporterId: reporter.id,
      reporterName: reporter.name,
      reason,
      details
    };
    return apiRequest<AdReport>(
      '/api/reports',
      'POST',
      reportData
    );
  },

  getAdminReports: async (): Promise<AdReport[]> => {
    return apiRequest<AdReport[]>(
      '/api/reports',
      'GET',
      undefined,
      'reports',
      []
    );
  },

  updateReportStatus: async (reportId: string, status: AdReport['status']) => {
    await fetch(`/api/reports/${reportId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  // Profile
  getUserProfile: async (userId: string): Promise<User | null> => {
    return apiRequest<User | null>(
      `/api/users/${userId}`,
      'GET',
      undefined,
      `profile_${userId}`,
      null
    );
  },

  updateStoreInfo: async (userId: string, data: { storeName: string, storeImage: string, storeDescription?: string }): Promise<void> => {
    await apiRequest<void>(
      `/api/users/store/${userId}`,
      'PUT',
      data
    );
  },

  // Ads
  getAds: async (limitCount: number = 50): Promise<Ad[]> => {
    return apiRequest<Ad[]>(
      `/api/ads?limit=${limitCount}`,
      'GET',
      undefined,
      'ads',
      []
    );
  },

  getUserAds: async (userId: string): Promise<Ad[]> => {
    return apiRequest<Ad[]>(
      `/api/ads/user/${userId}`,
      'GET',
      undefined,
      `user_ads_${userId}`,
      []
    );
  },

  createAd: async (adData: Partial<Ad> | any): Promise<Ad> => {
    const authUser = JSON.parse(localStorage.getItem('waseet_plus_auth_user') || 'null');
    if (!authUser) throw new Error("يجب تسجيل الدخول أولاً");

    const newAdData = {
      ...adData,
      userId: authUser.id,
      userName: authUser.name || 'مستخدم'
    };

    return apiRequest<Ad>(
      '/api/ads',
      'POST',
      newAdData
    );
  },

  deleteAd: async (adId: string) => {
    await fetch(`/api/ads/${adId}`, { method: 'DELETE' });
  },

  getAd: async (adId: string): Promise<Ad | null> => {
    return apiRequest<Ad | null>(
      `/api/ads/${adId}`,
      'GET',
      undefined,
      `ad_${adId}`,
      null
    );
  },

  toggleFeatured: async (adId: string) => {
    await fetch(`/api/ads/${adId}/toggle-featured`, { method: 'PUT' });
  },

  // Orders
  createOrder: async (ad: Ad, buyer: User, paymentMethod: 'ONLINE' | 'COD', shippingAddress?: { city: string, street: string, phone: string }, paymentProvider?: 'SYRIATEL' | 'MTN' | 'SHAM'): Promise<Order> => {
    const deliveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    const orderData = {
      adId: ad.id,
      adTitle: ad.title,
      sellerId: ad.userId,
      buyerId: buyer.id,
      buyerName: buyer.name,
      amount: ad.price,
      deliveryCode,
      paymentMethod,
      paymentProvider,
      shippingAddress
    };

    const order = await apiRequest<Order>(
      '/api/orders',
      'POST',
      orderData
    );

    await api.createNotification({
      userId: ad.userId,
      title: 'طلب جديد!',
      message: `لديك طلب جديد لـ ${ad.title} من ${buyer.name}`,
      type: 'ORDER_UPDATE',
      link: 'seller-dashboard'
    });

    return order;
  },

  getOrders: async (): Promise<Order[]> => {
    return apiRequest<Order[]>(
      '/api/orders',
      'GET',
      undefined,
      'orders',
      []
    );
  },

  getUserOrders: async (userId: string, role: 'buyer' | 'seller'): Promise<Order[]> => {
    const orders = await api.getOrders();
    return orders.filter(o => role === 'buyer' ? o.buyerId === userId : o.sellerId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    const orders = await api.getOrders();
    const currentOrder = orders.find(o => o.id === orderId);
    if (currentOrder) {
      await api.createNotification({
        userId: currentOrder.buyerId,
        title: 'تحديث حالة الطلب',
        message: `تم تحديث حالة طلبك ${orderId} إلى ${status}`,
        type: 'ORDER_UPDATE',
        link: 'my-orders'
      });
    }
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    return apiRequest<Category[]>(
      '/api/categories',
      'GET',
      undefined,
      'categories',
      []
    );
  },

  // Banners
  getBanners: async (): Promise<Banner[]> => {
    return apiRequest<Banner[]>(
      '/api/banners',
      'GET',
      undefined,
      'banners',
      []
    );
  },

  addBanner: async (title: string, image: string, subtitle?: string): Promise<Banner> => {
    const newBanner = await apiRequest<Banner>(
      '/api/banners',
      'POST',
      { title, image, subtitle }
    );
    return newBanner;
  },

  deleteBanner: async (id: string) => {
    await fetch(`/api/banners/${id}`, { method: 'DELETE' });
  },

  toggleBannerStatus: async (id: string) => {
    await fetch(`/api/banners/${id}/status`, { method: 'PUT' });
  },

  addCategory: async (name: string, icon?: string): Promise<Category> => {
    return apiRequest<Category>(
      '/api/categories',
      'POST',
      { name, icon }
    );
  },

  deleteCategory: async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
  },

  // Chats
  getChatRoomMessages: async (roomId: string): Promise<ChatMessage[]> => {
    return apiRequest<ChatMessage[]>(
      `/api/chats/${roomId}/messages`,
      'GET',
      undefined,
      `messages_${roomId}`,
      []
    );
  },

  getChatsForAd: async (adId: string, buyerId: string): Promise<ChatRoom | null> => {
    const roomId = `${adId}_${buyerId}`;
    const chats = await apiRequest<ChatRoom[]>(
      '/api/chats',
      'GET',
      undefined,
      'chats',
      []
    );
    const room = chats.find(c => c.id === roomId);
    if (room) {
      const messages = await api.getChatRoomMessages(roomId);
      return { ...room, messages };
    }
    return null;
  },

  sendMessage: async (roomId: string, ad: Ad, buyer: User, text: string): Promise<ChatRoom> => {
    const authUser = JSON.parse(localStorage.getItem('waseet_plus_auth_user') || 'null');
    if (!authUser) throw new Error("Not authenticated");

    const response = await apiRequest<{ room: ChatRoom, messages: ChatMessage[] }>(
      '/api/chats/message',
      'POST',
      {
        roomId,
        ad,
        buyer,
        text,
        senderId: authUser.id,
        senderName: authUser.name || 'مستخدم'
      }
    );

    const recipientId = (authUser.id === response.room.buyerId) ? response.room.sellerId : response.room.buyerId;
    await api.createNotification({
      userId: recipientId,
      title: 'رسالة جديدة',
      message: `أرسل لك ${authUser.name || 'مستخدم'} رسالة بخصوص ${response.room.adTitle}`,
      type: 'MESSAGE',
      link: 'my-chats'
    });

    return { ...response.room, messages: response.messages };
  },

  getAdminChats: async (): Promise<ChatRoom[]> => {
    return apiRequest<ChatRoom[]>(
      '/api/chats',
      'GET',
      undefined,
      'chats',
      []
    );
  },

  getUserChats: async (userId: string): Promise<ChatRoom[]> => {
    const chats = await api.getAdminChats();
    return chats.filter(c => c.buyerId === userId || c.sellerId === userId)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  },

  // Comments
  getComments: async (adId: string): Promise<Comment[]> => {
    return apiRequest<Comment[]>(
      `/api/comments/${adId}`,
      'GET',
      undefined,
      `comments_${adId}`,
      []
    );
  },

  addComment: async (adId: string, text: string, image?: string): Promise<Comment> => {
    const authUser = JSON.parse(localStorage.getItem('waseet_plus_auth_user') || 'null');
    if (!authUser) throw new Error("يجب تسجيل الدخول أولاً");

    return apiRequest<Comment>(
      `/api/comments/${adId}`,
      'POST',
      {
        userId: authUser.id,
        userName: authUser.name || 'مستخدم',
        text,
        image
      }
    );
  },

  fileToBase64: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },

  // Admin Only
  getAllUsers: async (): Promise<User[]> => {
    return apiRequest<User[]>(
      '/api/users',
      'GET',
      undefined,
      'users',
      []
    );
  },

  deleteUser: async (userId: string) => {
    await fetch(`/api/users/${userId}`, { method: 'DELETE' });
  },

  adminUpdateAd: async (adId: string, updates: Partial<Ad>) => {
    await fetch(`/api/ads/${adId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  },

  adminDeleteAd: async (adId: string) => {
    await fetch(`/api/ads/${adId}`, { method: 'DELETE' });
  }
};
