import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Phone,
  CheckCircle2,
  Send
} from 'lucide-react';
import { Product, SiteContent, CustomerInquiry } from '../types';
import { storage } from '../services/storage';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: Product | null;
  content: SiteContent;
  onInquirySubmitted?: (inquiry: CustomerInquiry) => void;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({
  isOpen,
  onClose,
  selectedProduct,
  content,
  onInquirySubmitted
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      setFormData((prev) => ({
        ...prev,
        message: `Hello, I would like to inquire about "${selectedProduct.name}" (Article No: ${selectedProduct.articleNo}). Please let me know regarding sizing, customization, and availability.`
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        message: 'Hello, I am interested in Moonlit Jewelry bespoke creations and fine jewelry. Please get in touch with me.'
      }));
    }
    setSubmitted(false);
  }, [selectedProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    setLoading(true);
    setTimeout(() => {
      const created = storage.saveInquiry({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        productId: selectedProduct?.id,
        productName: selectedProduct?.name,
        message: formData.message
      });

      setLoading(false);
      setSubmitted(true);
      if (onInquirySubmitted) onInquirySubmitted(created);
    }, 400);
  };

  const cleanWhatsappNumber = content.whatsapp.replace(/[^0-9]/g, '');
  const directWhatsappText = encodeURIComponent(
    formData.message || `Hello Moonlit Jewelry, I am inquiring about your luxury jewelry pieces.`
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#5C4D40]/30 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FDFCF9] border border-[#EADBBD] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header in warm light gold tone */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EADBBD] bg-[#FAF6EE]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#88641C]" />
            <h3 className="font-serif text-lg font-medium text-[#44331C]">
              Jewelry Inquiry & Concierge
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7E5C1E] hover:text-[#44331C] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-[#88641C] mx-auto mb-4" />
              <h4 className="font-serif text-2xl text-[#44331C] font-medium mb-2">
                Inquiry Received With Pleasure
              </h4>
              <p className="text-sm text-[#6B5536] max-w-md mx-auto mb-6 leading-relaxed">
                Thank you, {formData.fullName}. Our jewelry specialist will review your request and contact you directly via email or WhatsApp within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/${cleanWhatsappNumber}?text=${directWhatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-[#25D366] text-white text-xs font-sans uppercase tracking-[0.16em] font-bold flex items-center gap-2 shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>Continue on WhatsApp</span>
                </a>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#7E5C1E] text-[#FAF6EE] text-xs font-sans uppercase font-bold tracking-[0.16em] hover:bg-[#684A14] transition-colors cursor-pointer shadow-xs"
                >
                  Return to Collection
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Context Banner */}
              {selectedProduct && (
                <div className="flex items-center gap-3 p-3 bg-[#FAF6EE] border border-[#DECFA9]">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-12 h-12 object-cover border border-[#DECFA9] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-xs">
                    <p className="font-serif font-semibold text-[#44331C] text-sm line-clamp-1">
                      {selectedProduct.name}
                    </p>
                    <p className="text-[#7E6649] font-sans font-medium">
                      Article No: {selectedProduct.articleNo} · {selectedProduct.material}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans tracking-[0.14em] uppercase text-[#6B5536] font-bold mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full bg-[#FAF6EE] border border-[#DECFA9] px-3 py-2 text-xs font-sans text-[#44331C] font-medium focus:outline-none focus:border-[#7E5C1E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans tracking-[0.14em] uppercase text-[#6B5536] font-bold mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. eleanor@example.com"
                    className="w-full bg-[#FAF6EE] border border-[#DECFA9] px-3 py-2 text-xs font-sans text-[#44331C] font-medium focus:outline-none focus:border-[#7E5C1E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans tracking-[0.14em] uppercase text-[#6B5536] font-bold mb-1">
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +1 716-555-0199"
                  className="w-full bg-[#FAF6EE] border border-[#DECFA9] px-3 py-2 text-xs font-sans text-[#44331C] font-medium focus:outline-none focus:border-[#7E5C1E]"
                />
              </div>

              <div>
                <label className="block text-xs font-sans tracking-[0.14em] uppercase text-[#6B5536] font-bold mb-1">
                  Inquiry Message or Customization Request *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#FAF6EE] border border-[#DECFA9] px-3 py-2 text-xs font-sans text-[#44331C] font-medium focus:outline-none focus:border-[#7E5C1E] resize-none"
                />
              </div>

              {/* Atelier contact note */}
              <div className="pt-2 border-t border-[#EADBBD] flex flex-wrap items-center justify-between text-xs text-[#7E6649] font-sans font-medium gap-2">
                <span>Atelier Concierge: {content.phone}</span>
                <span>{content.email}</span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#7E5C1E] text-[#FAF6EE] hover:bg-[#684A14] transition-all text-xs font-sans font-bold tracking-[0.18em] uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5 text-[#F5EACB]" />
                  <span>{loading ? 'Sending Request...' : 'Submit Inquiry'}</span>
                </button>

                <a
                  href={`https://wa.me/${cleanWhatsappNumber}?text=${directWhatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-5 bg-[#25D366] hover:bg-[#20BA5A] text-white transition-colors text-xs font-sans font-bold tracking-[0.16em] uppercase flex items-center justify-center gap-2 text-center cursor-pointer shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Instant WhatsApp</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
