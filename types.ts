
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  password?: string;
  role: UserRole;
  createdAt: string;
  storeName?: string;
  storeImage?: string;
  storeDescription?: string;
}

export interface Order {
  id: string;
  adId: string;
  adTitle: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPING' | 'ARRIVED' | 'DELIVERED' | 'CANCELLED' | 'COMPLETED';
  deliveryCode: string;
  paymentMethod: 'ONLINE' | 'COD';
  paymentProvider?: 'SYRIATEL' | 'MTN' | 'SHAM';
  shippingAddress?: {
    city: string;
    street: string;
    phone: string;
  };
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  images?: string[];
  userId: string;
  userName: string;
  isFeatured: boolean;
  createdAt: string;
  condition: 'new' | 'used';
  location: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  active: boolean;
}

export interface FeaturedAd extends Ad {
  expiryDate: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ChatRoom {
  id: string; // Typically adId + buyerId
  adId: string;
  adTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  messages: ChatMessage[];
  lastUpdated: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface Comment {
  id: string;
  adId: string;
  userId: string;
  userName: string;
  text: string;
  image?: string;
  timestamp: string;
}

export interface AdReport {
  id: string;
  adId: string;
  adTitle: string;
  reporterId: string;
  reporterName: string;
  reason: 'INAPPROPRIATE' | 'SCAM' | 'OUTDATED' | 'OTHER';
  details?: string;
  timestamp: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

export interface CartItem extends Ad {
  quantity: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'MESSAGE' | 'ORDER_UPDATE' | 'NEW_AD' | 'SYSTEM';
  link?: string;
  isRead: boolean;
  timestamp: string;
}
