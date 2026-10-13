import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  currency: 'PKR' | 'USD';
  pkrToUsdRate: number;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  currency,
  pkrToUsdRate
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const [loadedDateTime] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} (${hours}:${minutes})`;
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const results = query.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase()) ||
            (p.gemstone ? p.gemstone.toLowerCase().includes(query.toLowerCase()) : false) ||
            p.material.toLowerCase().includes(query.toLowerCase()) ||
            p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 8)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#5C4D40]/30 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FDFCF9] border border-[#EADBBD] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar in light warm gold background */}
        <div className="relative border-b border-[#EADBBD] p-4 bg-[#FAF6EE] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#88641C] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search rings, necklaces, earrings, silver, gold, bridal..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-sans text-[#44331C] placeholder:text-[#9E8A72] focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#88641C] hover:text-[#44331C] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs uppercase font-sans tracking-widest text-[#7E5C1E] hover:text-[#44331C] ml-2 cursor-pointer font-bold"
          >
            Esc
          </button>
        </div>

        {/* Results / Suggestions */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {query.trim() === '' ? (
            <div className="py-6 px-2 text-xs font-sans text-[#7E6649] space-y-3">
              <span className="uppercase tracking-[0.16em] text-[#88641C] block font-bold">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {['Emerald', 'Halo Ring', 'Diamond Cut', 'Necklace Set', '925 Silver', 'Sapphire', 'Teardrop'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1 bg-[#FAF6EE] hover:bg-[#EBDCB4] text-[#5A4112] border border-[#DECFA9] rounded-none transition-colors cursor-pointer font-semibold"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-widest text-[#88641C] mb-2 px-1 font-bold">
                Found {results.length} Pieces
              </div>
              {results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="flex items-center gap-4 p-2.5 hover:bg-[#FAF6EE] transition-colors cursor-pointer border-b border-[#EADBBD]/60 last:border-0"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 object-cover bg-stone-100 shrink-0 border border-[#DECFA9]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wider text-[#886F4E] font-sans font-medium">
                      {product.category} · {product.material}
                    </p>
                    <h4 className="font-serif text-sm font-semibold text-[#44331C] truncate">
                      {product.name}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-sans text-[11px] font-bold text-black">
                      Loaded: {loadedDateTime}
                    </p>
                    <span className="text-[11px] text-[#88641C] flex items-center justify-end gap-1 font-bold">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[#7E6649] font-sans font-medium">
              No matching pieces found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
