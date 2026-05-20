
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Ad, Banner, Category } from '../types';
import BannerSlider from '../components/BannerSlider';
import AdCard from '../components/AdCard';

interface HomeProps {
  onAdClick: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ onAdClick }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<string[]>(['الكل']);
  const [adsLoading, setAdsLoading] = useState(true);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    condition: 'الكل',
    location: 'الكل'
  });
  
  useEffect(() => {
    // Progressive independent loading
    const fetchAds = async () => {
      try {
        const data = await api.getAds(30); // Load latest 30 ads initially
        setAds(data);
      } finally {
        setAdsLoading(false);
      }
    };

    const fetchBanners = async () => {
      try {
        const data = await api.getBanners();
        setBanners(data.filter(b => b.active));
      } finally {
        setBannersLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const data = await api.getCategories();
        setCategories(['الكل', ...data.map(c => c.name)]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchAds();
    fetchBanners();
    fetchCategories();
  }, []);

  const filteredAds = ads.filter(ad => {
    // Category filter
    if (activeCategory !== 'الكل' && ad.category !== activeCategory) return false;
    
    // Price range
    if (filters.minPrice && ad.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && ad.price > Number(filters.maxPrice)) return false;
    
    // Condition
    if (filters.condition !== 'الكل') {
      const cond = filters.condition === 'جديد' ? 'new' : 'used';
      if (ad.condition !== cond) return false;
    }
    
    // Location
    if (filters.location !== 'الكل' && ad.location !== filters.location) return false;
    
    return true;
  });

  const featuredAds = filteredAds.filter(ad => ad.isFeatured);
  const normalAds = filteredAds.filter(ad => !ad.isFeatured);

  if (false && adsLoading) { // Removed global loading block
    return null; 
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Banner Section */}
      <div className="mb-12">
        {bannersLoading ? (
          <div className="w-full aspect-[21/9] bg-gray-100 rounded-[2rem] animate-pulse"></div>
        ) : (
          <BannerSlider banners={banners} />
        )}
      </div>

      {/* Categories Bar */}
      <div className="flex flex-col gap-4 mb-4 sm:mb-8">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">التصنيفات</h3>
           <button 
             onClick={() => setShowFilters(!showFilters)}
             className={`shrink-0 px-3 py-1.5 rounded-lg border flex items-center gap-2 font-bold text-[10px] transition ${showFilters ? 'bg-brand-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
           >
             <i className="fas fa-filter text-[10px]"></i>
             <span>تصفية الإعلانات</span>
           </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {categoriesLoading ? (
            [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="w-24 h-8 bg-gray-100 rounded-xl shrink-0 animate-pulse"></div>
            ))
          ) : (
            categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-xl whitespace-nowrap text-xs font-bold transition-all border ${
                  activeCategory === cat 
                    ? 'bg-brand-black text-white border-brand-black shadow-lg shadow-black/10' 
                    : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-100'
                }`}
              >
                {cat}
              </button>
            ))
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl p-6 border shadow-sm mb-8 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">نطاق السعر (ر.س)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="من"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-brand-green/30 text-sm"
                />
                <input 
                  type="number" 
                  placeholder="إلى"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-brand-green/30 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">حالة المنتج</label>
              <select 
                value={filters.condition}
                onChange={(e) => setFilters({...filters, condition: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-brand-green/30 text-sm bg-white"
              >
                <option value="الكل">الكل</option>
                <option value="جديد">جديد</option>
                <option value="مستعمل">مستعمل</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">المدينة</label>
              <select 
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-brand-green/30 text-sm bg-white"
              >
                <option value="الكل">الكل</option>
                <option value="الرياض">الرياض</option>
                <option value="جدة">جدة</option>
                <option value="الدمام">الدمام</option>
                <option value="مكة">مكة</option>
                <option value="المدينة">المدينة المنورة</option>
              </select>
            </div>

            <div className="flex items-end">
              <button 
                onClick={() => setFilters({ minPrice: '', maxPrice: '', condition: 'الكل', location: 'الكل' })}
                className="w-full py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                إعادة ضبط 
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Featured Ads Section */}
        {adsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-64 flex flex-col animate-pulse">
                <div className="w-full aspect-square bg-gray-100"></div>
                <div className="p-4 space-y-3">
                  <div className="w-full h-4 bg-gray-100 rounded"></div>
                  <div className="w-2/3 h-4 bg-gray-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : featuredAds.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <i className="fas fa-crown text-brand-green text-xl"></i>
              <h2 className="text-xl font-bold text-gray-800">إعلانات مميزة</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {featuredAds.map(ad => (
                <AdCard key={ad.id} ad={ad} onClick={onAdClick} />
              ))}
            </div>
          </section>
        )}

      {/* All Ads Grid */}
      <section>
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <i className="fas fa-layer-group text-brand-black text-xl"></i>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">أحدث الإعلانات</h2>
        </div>
        
        {adsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-64 flex flex-col animate-pulse">
                <div className="w-full aspect-square bg-gray-100"></div>
                <div className="p-4 space-y-3">
                  <div className="w-full h-4 bg-gray-100 rounded"></div>
                  <div className="w-2/3 h-4 bg-gray-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : normalAds.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border">
            <div className="text-5xl sm:text-6xl text-gray-200 mb-4">
              <i className="fas fa-search"></i>
            </div>
            <p className="text-gray-500 font-medium text-sm">لا توجد إعلانات في هذا القسم حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {normalAds.map(ad => (
              <AdCard key={ad.id} ad={ad} onClick={onAdClick} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
