
import React, { useState, useEffect } from 'react';
import { Banner } from '../types';

interface BannerSliderProps {
  banners: Banner[];
}

const BannerSlider: React.FC<BannerSliderProps> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full aspect-[2/1] sm:aspect-[2.5/1] overflow-hidden rounded-2xl sm:rounded-[2rem] shadow-lg bg-gray-200">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
            index === currentIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
          }`}
        >
          <img
            src={banner.image}
            alt={banner.title}
            loading="lazy"
            className="w-full h-full object-cover shadow-inner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4 sm:p-8">
            <div className="text-white">
              <h2 className="text-lg sm:text-2xl md:text-4xl font-black mb-1 sm:mb-2 leading-tight">{banner.title}</h2>
              <p className="text-white/80 text-[10px] sm:text-sm md:text-base line-clamp-1">
                {banner.subtitle || 'اكتشف أفضل العروض اليومية وحصرياً على منصتنا'}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-reverse space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentIndex ? 'bg-brand-green w-8' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;
