import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[110] shadow-2xl flex flex-col text-right"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <i className="fas fa-shopping-basket text-brand-green text-xl"></i>
                <h2 className="text-xl font-black text-gray-900 font-cairo">سلة المشتريات</h2>
                <span className="bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full text-xs font-bold">
                  {cartCount} منتجات
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                <i className="fas fa-times text-gray-500 text-lg"></i>
              </button>
            </div>

            {/* Items List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-shopping-cart text-3xl text-gray-300"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">سلتك فارغة</h3>
                    <p className="text-gray-400 text-sm">ابدأ بإضافة بعض المنتجات الرائعة!</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="bg-brand-green text-black px-6 py-2 rounded-xl font-bold hover:bg-brand-greenDark transition"
                  >
                    تصفح الإعلانات
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-20 h-20 rounded-xl object-cover shadow-sm"
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-900 truncate pl-2">{item.title}</h4>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-300 hover:text-red-500 transition"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                      <p className="text-brand-green font-black text-sm mt-1">
                        {item.price.toLocaleString()} ر.س
                      </p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-white rounded transition"
                          >
                            <i className="fas fa-minus text-[10px]"></i>
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-white rounded transition"
                          >
                            <i className="fas fa-plus text-[10px]"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t bg-gray-50 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-500 text-sm">
                    <span>المجموع الفرعي</span>
                    <span>{cartTotal.toLocaleString()} ر.س</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-sm">
                    <span>رسوم الخدمة</span>
                    <span>مجاناً</span>
                  </div>
                  <div className="flex justify-between font-black text-xl text-gray-900 border-t pt-2 mt-2">
                    <span>الإجمالي</span>
                    <span className="text-brand-green">{cartTotal.toLocaleString()} ر.س</span>
                  </div>
                </div>

                <button 
                   onClick={onCheckout}
                   className="w-full bg-brand-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition shadow-xl font-cairo"
                >
                  <i className="fas fa-credit-card"></i>
                  إتمام الشراء
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
