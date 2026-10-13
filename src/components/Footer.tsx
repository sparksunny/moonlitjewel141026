import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Instagram,
  Lock,
  ArrowUp
} from 'lucide-react';
import { MoonlitLogo } from './MoonlitLogo';
import { SiteContent } from '../types';

interface FooterProps {
  content: SiteContent;
  onSelectCategory: (category: string) => void;
  onOpenAdmin: () => void;
  onOpenInquiry: () => void;
  categories?: string[];
}

export const Footer: React.FC<FooterProps> = ({
  content,
  onSelectCategory,
  onOpenAdmin,
  onOpenInquiry,
  categories
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cleanWhatsappNumber = content.whatsapp.replace(/[^0-9]/g, '');

  return (
    <footer className="bg-[#eee9d9] text-black pt-16 pb-12 border-t border-[#d8d1bc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid on #eee9d9 with Black Bold Typography */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#d8d1bc]">
          {/* Column 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={scrollToTop}
              className="text-left focus:outline-none cursor-pointer"
              aria-label="Moonlit Jewelry"
            >
              <MoonlitLogo customUrl={content.logoUrl} size="md" showWordmark={true} theme="black" />
            </button>

            <p className="text-sm font-serif italic text-black font-bold">
              “{content.slogan}”
            </p>

            <p className="text-xs text-black font-bold font-sans leading-relaxed max-w-sm">
              {content.footerText}
            </p>

            <div className="pt-2 flex items-center gap-3">
              {/* Instagram */}
              <a
                href={`https://instagram.com/${content.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-black font-bold hover:bg-black hover:text-[#eee9d9] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 stroke-[2.5]" />
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${cleanWhatsappNumber}?text=Hello%20Moonlit%20Jewelry`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-black font-bold hover:bg-black hover:text-[#eee9d9] transition-colors"
                aria-label="WhatsApp"
              >
                <Phone className="w-4 h-4 stroke-[2.5]" />
              </a>

              {/* Email */}
              <a
                href={`mailto:${content.email}`}
                className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-black font-bold hover:bg-black hover:text-[#eee9d9] transition-colors"
                aria-label="Email Atelier"
              >
                <Mail className="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>
          </div>

          {/* Column 2: Shop Categories */}
          <div>
            <h4 className="text-xs font-sans tracking-[0.2em] uppercase text-black font-bold mb-4">
              Shop Categories
            </h4>
            <ul className="space-y-2.5 text-xs font-sans text-black font-bold">
              {(categories && categories.length > 0
                ? ['All Jewelry', ...categories.filter(c => c !== 'All Jewelry' && c !== 'Complimentary Services')]
                : [
                    'All Jewelry',
                    'Wedding Bands & Rings',
                    'Pendants & Necklace',
                    'Bridal Jewelry',
                    'Bangles & Bracelets',
                    'Earrings & Studs',
                    'Pearl & Polki Jewelry'
                  ]
              ).map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onSelectCategory(cat)}
                    className="text-black font-bold hover:underline transition-all cursor-pointer"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Featured Sets */}
          <div>
            <h4 className="text-xs font-sans tracking-[0.2em] uppercase text-black font-bold mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs font-sans text-black font-bold">
              {[
                { label: 'Wedding Bands & Rings', cat: 'Wedding Bands & Rings' },
                { label: 'Royal Bridal Sets', cat: 'Bridal Jewelry' },
                { label: 'Bangles & Bracelets', cat: 'Bangles & Bracelets' },
                { label: 'Earrings & Studs', cat: 'Earrings & Studs' },
                { label: 'Pearl & Polki Jewelry', cat: 'Pearl & Polki Jewelry' }
              ].map(({ label, cat }) => (
                <li key={label}>
                  <button
                    onClick={() => onSelectCategory(cat)}
                    className="text-black font-bold hover:underline transition-all cursor-pointer"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Atelier Details */}
          <div>
            <h4 className="text-xs font-sans tracking-[0.2em] uppercase text-black font-bold mb-4">
              Moonlit Atelier
            </h4>
            <div className="space-y-3 text-xs font-sans text-black font-bold">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-black shrink-0 mt-0.5 stroke-[2.5]" />
                <span>
                  {content.companyName}
                  <br />
                  {content.address}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-black shrink-0 stroke-[2.5]" />
                <a
                  href={`tel:${content.phone}`}
                  className="text-black font-bold hover:underline transition-all"
                >
                  {content.phone}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-black shrink-0 stroke-[2.5]" />
                <a
                  href={`mailto:${content.email}`}
                  className="text-black font-bold hover:underline transition-all truncate"
                >
                  {content.email}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-black shrink-0 stroke-[2.5]" />
                <span>{content.website}</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenInquiry}
                  className="px-4 py-2 bg-black text-[#eee9d9] font-bold uppercase tracking-wider text-[10px] hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                >
                  Book Bespoke Consultation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Black Bold Fonts */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-black font-bold">
          <p>
            © {new Date().getFullYear()} {content.companyName}. All rights reserved. Real Jewelry · Timeless Beauty.
          </p>

          <div className="flex items-center gap-6">
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 text-black font-bold hover:underline transition-all text-[11px] uppercase tracking-wider cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Admin Access</span>
            </button>

            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-black font-bold hover:underline transition-all text-[11px] uppercase tracking-wider cursor-pointer"
              aria-label="Back to top"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
