import React, { useState } from 'react';
import { Eye, MessageSquare, Sparkles, Edit3 } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  currency?: 'PKR' | 'USD';
  pkrToUsdRate?: number;
  onSelect: (product: Product) => void;
  onInquire: (product: Product) => void;
  isAdmin?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onInquire,
  isAdmin = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const secondaryImage =
    product.galleryImages && product.galleryImages.length > 1
      ? product.galleryImages[1]
      : null;

  return (
    <div
      className={`group relative flex flex-col bg-[#FDFCF9] border transition-all duration-300 hover:shadow-md hover:border-black ${
        isAdmin ? 'border-[#DECFA9]' : 'border-[#EADBBD]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame */}
      <div
        onClick={() => onSelect(product)}
        className="relative w-full aspect-square bg-[#F7F4EB] overflow-hidden cursor-pointer"
      >
        {/* Subtle Loading Placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#EDE7D8] animate-pulse flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
        )}

        {/* Primary Product Image */}
        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover object-center transition-all duration-500 ease-out ${
            isHovered && secondaryImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
        />

        {/* Secondary Image on Hover */}
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.name} alternate view`}
            referrerPolicy="no-referrer"
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ease-out ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
          />
        )}

        {/* Status tag in pure black typography */}
        {product.badge && !/^(best seller|save)/i.test(product.badge.trim()) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            <span className="text-[10px] tracking-[0.16em] uppercase font-sans font-bold bg-white text-black px-2 py-0.5 border border-black shadow-2xs">
              {product.badge}
            </span>
          </div>
        )}

        {/* Quick View / Edit Details overlay on hover */}
        <div className="absolute inset-x-0 bottom-8 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 z-20 pointer-events-none">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="pointer-events-auto w-full py-1.5 bg-white text-black hover:bg-black hover:text-white transition-colors text-[11px] font-sans font-bold tracking-[0.16em] uppercase flex items-center justify-center gap-1.5 shadow-xs cursor-pointer border border-black"
          >
            {isAdmin ? <Edit3 className="w-3.5 h-3.5 text-black" /> : <Eye className="w-3.5 h-3.5 text-black" />}
            <span className="text-black group-hover:text-white font-bold">
              {isAdmin ? 'Edit Details' : 'Quick View'}
            </span>
          </button>
        </div>

        {/* 5-digit Article No displayed at the bottom of each product image */}
        <div className="absolute inset-x-0 bottom-0 py-1 sm:py-1.5 px-2 sm:px-3 bg-white/95 backdrop-blur-xs border-t border-[#EADBBD] flex items-center justify-between text-black z-10 shadow-2xs">
          <span className="text-[9px] sm:text-[10px] tracking-wider uppercase font-bold text-black font-sans">
            Article No
          </span>
          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-black">
            {product.articleNo}
          </span>
        </div>
      </div>

      {/* Product Content Details (Clean luxury styling) */}
      <div className="p-2.5 sm:p-4 md:p-5 flex flex-col flex-1 justify-between bg-[#FDFCF9]">
        <div>
          {/* Category & Material Metadata in pure Black */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-[11px] font-sans tracking-[0.14em] sm:tracking-[0.18em] uppercase text-black font-bold mb-1 sm:mb-1.5">
            <span className="text-black font-bold truncate max-w-[50%]">{product.category}</span>
            <span aria-hidden="true" className="text-black font-bold">·</span>
            <span className="truncate text-black font-bold">{product.material}</span>
          </div>

          {/* Product Title in pure Black */}
          <h3
            onClick={() => onSelect(product)}
            className="font-serif text-xs sm:text-base md:text-lg font-bold text-black hover:underline transition-colors cursor-pointer line-clamp-2 leading-snug mb-1.5 sm:mb-2"
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* Action Footer: Article Code and Inquiry Button */}
        <div className="pt-2 sm:pt-3 border-t border-[#EADBBD] flex items-center justify-between gap-1 sm:gap-2">
          <span className="text-[10px] sm:text-xs font-mono font-bold text-black tracking-wider truncate">
            {product.articleNo}
          </span>

          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(product);
                }}
                className="px-2 py-1 bg-[#FAF6EE] hover:bg-black text-[#5A4112] hover:text-white border border-[#DECFA9] transition-colors rounded-none cursor-pointer flex items-center gap-1 text-[10px] sm:text-xs font-sans font-bold tracking-wider uppercase shadow-2xs shrink-0"
                title="Edit this piece on detail page"
              >
                <Edit3 className="w-3 h-3 text-current" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onInquire(product);
              }}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-[#FAF6EE] hover:bg-black text-black hover:text-white border border-black transition-colors rounded-none cursor-pointer flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-sans font-bold tracking-wider uppercase shadow-2xs shrink-0"
              title="Ask about this jewelry piece"
              aria-label={`Ask about ${product.name}`}
            >
              <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-current" />
              <span>Inquire</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
