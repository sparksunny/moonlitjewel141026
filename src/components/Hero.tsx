import React from 'react';
import { Sparkles, Gem, ShieldCheck, Clock } from 'lucide-react';
import { SiteContent } from '../types';

interface HeroProps {
  content: SiteContent;
  onExplore?: () => void;
  onContact?: () => void;
  isAdmin?: boolean;
  onEditContent?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  content,
  isAdmin = false,
  onEditContent
}) => {
  return (
    <section className="relative bg-[#fffbe8] text-black border-b border-[#e2d9bc] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20 lg:py-24 flex flex-col items-start justify-center">
        {/* Editorial Subtitle in black text */}
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm tracking-[0.24em] uppercase text-black font-sans font-bold mb-3 sm:mb-5 bg-white/90 px-3.5 py-1.5 rounded-full border border-black/20 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>Luxury Jewelry, Timeless Elegance</span>
        </div>

        {/* Main Headline - Bold Black Text */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-black max-w-3xl leading-[1.15] mb-4 sm:mb-6 text-balance">
          {content.heroHeading}
        </h1>

        {/* Supporting description - Bold Black Text */}
        <p className="text-sm sm:text-base md:text-lg text-black font-sans font-medium max-w-2xl leading-relaxed text-pretty">
          {content.heroSubheading}
        </p>

        {isAdmin && onEditContent && (
          <div className="mt-4">
            <button
              onClick={onEditContent}
              className="px-4 py-2 bg-[#7E5C1E] text-[#FAF6EE] hover:bg-[#684A14] text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer border border-[#DECFA9]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F5EACB]" />
              <span>Edit Hero & Brand Text</span>
            </button>
          </div>
        )}

        {/* Trust Badges Bar */}
        <div className="mt-8 sm:mt-12 md:mt-16 pt-6 sm:pt-8 border-t border-black/15 w-full grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-black text-xs sm:text-sm font-sans">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Gem className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-black shrink-0" />
            <div>
              <p className="font-bold text-black tracking-wide uppercase text-[10.5px] sm:text-[11px]">100% Real Metals</p>
              <p className="text-[10px] sm:text-[11px] text-stone-800 font-semibold">925 Silver & Solid Gold</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ShieldCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-black shrink-0" />
            <div>
              <p className="font-bold text-black tracking-wide uppercase text-[10.5px] sm:text-[11px]">Authentic Pedigree</p>
              <p className="text-[10px] sm:text-[11px] text-stone-800 font-semibold">Pure Precious Metals</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-black shrink-0" />
            <div>
              <p className="font-bold text-black tracking-wide uppercase text-[10.5px] sm:text-[11px]">Bespoke Sizing</p>
              <p className="text-[10px] sm:text-[11px] text-stone-800 font-semibold">Custom Atelier Commissions</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Clock className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-black shrink-0" />
            <div>
              <p className="font-bold text-black tracking-wide uppercase text-[10.5px] sm:text-[11px]">Personal Concierge</p>
              <p className="text-[10px] sm:text-[11px] text-stone-800 font-semibold">Direct WhatsApp Assistance</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
