
import React from 'react';
import { Ad } from '../types';
import { useCart } from '../context/CartContext';

interface AdCardProps {
  ad: Ad;
  isAdmin?: boolean;
  onToggleFeatured?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (ad: Ad) => void;
  onClick?: (id: string) => void;
}

const AdCard: React.FC<AdCardProps> = ({ ad, isAdmin, onToggleFeatured, onDelete, onEdit, onClick }) => {
  const { addToCart } = useCart();
  
  return (
    <div 
      onClick={() => onClick?.(ad.id)}
      className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer h-full ${ad.isFeatured ? 'border-brand-green ring-1 ring-brand-green/20' : 'border-gray-200'}`}
    >
      {ad.isFeatured && (
        <div className="absolute top-3 right-3 z-10 bg-brand-green text-black px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm uppercase tracking-wider">
          <i className="fas fa-bolt ml-1"></i>
          إعلان مميز
        </div>
      )}

      {ad.originalPrice && ad.originalPrice > ad.price && (
        <div className="absolute top-3 left-3 z-10 bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-black shadow-sm flex items-center gap-1.5 animate-pulse">
          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          عرض خاص
        </div>
      )}
      
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-50 border-b">
        <img 
          src={ad.image} 
          alt={ad.title} 
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm text-gray-800 px-2.5 py-1 rounded-lg text-[10px] font-bold border shadow-sm">
          {ad.category}
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-grow bg-white">
        <div className="mb-1.5 sm:mb-2">
          <h3 className="font-bold text-gray-900 text-[11px] sm:text-sm md:text-base leading-snug line-clamp-2 min-h-[2.2em] group-hover:text-brand-green transition-colors font-cairo">
            {ad.title}
          </h3>
        </div>

        <div className="mt-auto">
          <div className="mb-2 sm:mb-3 p-1.5 sm:p-2 bg-gray-50 rounded-xl border border-gray-100/50">
            <div className="flex flex-col">
              <span className="text-sm sm:text-lg font-black text-gray-900">
                {ad.price.toLocaleString()} <span className="text-[9px] font-bold text-gray-400 mr-0.5">ر.س</span>
              </span>
              {ad.originalPrice && ad.originalPrice > ad.price ? (
                <span className="text-[8px] text-red-500 font-bold line-through">
                   {ad.originalPrice.toLocaleString()} ر.س
                </span>
              ) : (
                <span className="text-[8px] text-gray-400 font-medium font-cairo">أو أفضل عرض</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                addToCart(ad);
              }}
              className="flex-grow bg-brand-green text-black py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-black shadow-sm shadow-brand-green/20 hover:bg-brand-greenDark transition-all active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <i className="fas fa-cart-plus"></i>
              <span>السلة</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); }}
              className="h-8 w-8 sm:h-11 sm:w-11 shrink-0 rounded-lg sm:rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
            >
              <i className="far fa-heart px-1 sm:px-2"></i>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-gray-50 text-[8px] sm:text-[10px] text-gray-400">
            <span className="flex items-center gap-1.5 font-cairo truncate max-w-[50%]">
              <i className="far fa-user opacity-60"></i>
              <span className="truncate">{ad.userName}</span>
            </span>
            <span className="flex items-center gap-1.5 font-cairo">
              <i className="far fa-clock opacity-60"></i>
              {new Date(ad.createdAt).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        {isAdmin && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex gap-2 mt-4 pt-4 border-t border-gray-100"
          >
            <button 
              onClick={() => onToggleFeatured?.(ad.id)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${ad.isFeatured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {ad.isFeatured ? 'إلغاء التمييز' : 'تمييز الإعلان'}
            </button>
            <button 
              onClick={() => onEdit?.(ad)}
              className="p-1.5 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors border"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button 
              onClick={() => onDelete?.(ad.id)}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdCard;
