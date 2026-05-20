import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Ad } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (ad: Ad) => void;
  removeFromCart: (adId: string) => void;
  updateQuantity: (adId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('app_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (ad: Ad) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === ad.id);
      if (existing) {
        return prev.map(item => 
          item.id === ad.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...ad, quantity: 1 }];
    });
  };

  const removeFromCart = (adId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== adId));
  };

  const updateQuantity = (adId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(adId);
      return;
    }
    setCartItems(prev => prev.map(item => 
      item.id === adId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      cartTotal, 
      cartCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
