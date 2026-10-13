import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Sparkles,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Clock,
  Edit3,
  Save,
  Upload,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Product, SiteContent } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onInquire: (product: Product) => void;
  currency?: 'PKR' | 'USD';
  pkrToUsdRate?: number;
  content: SiteContent;
  isAdmin?: boolean;
  onSaveProduct?: (product: Product) => Promise<boolean>;
  categories?: string[];
}

// Requirement 6: Back page description of each product: remove a) Key feature b) Product Detail
const cleanBackpageDescription = (rawHtml?: string, fallbackDesc?: string): string => {
  if (!rawHtml && !fallbackDesc) return '';
  let text = rawHtml || fallbackDesc || '';

  // 1. Remove sections with "Product Detail" or "Product Details" or "Key feature" or "Key features"
  text = text.replace(/<h[1-6][^>]*>[\s\S]*?(?:Product\s*Details?|Key\s*Features?)[\s\S]*?<\/h[1-6]>[\s\S]*?(?:<ul[\s\S]*?<\/ul>|<ol[\s\S]*?<\/ol>|<p[\s\S]*?<\/p>)?/gi, '');
  text = text.replace(/<(?:strong|b)[^>]*>[\s\S]*?(?:Product\s*Details?|Key\s*Features?)[\s\S]*?<\/(?:strong|b)>[\s\S]*?(?:<ul[\s\S]*?<\/ul>|<ol[\s\S]*?<\/ol>|<br\s*\/?>[\s\S]*?<\/p>)?/gi, '');
  text = text.replace(/(?:Product\s*Details?|Key\s*Features?):?[\s\S]*?(?:Brand|Style|Color|Stone|Setting|Ring Type|Band Finish|Marking|For|Occasions?)[\s\S]*?(?:<\/p>|$)/gi, '');
  text = text.replace(/<ul>[\s\S]*?<\/ul>/gi, '');
  text = text.replace(/<ol>[\s\S]*?<\/ol>/gi, '');

  // 2. Remove any lingering Item code mentions
  text = text.replace(/(?:Item\s*Code|ItemCode|Code):\s*[^\s<]+/gi, '');

  // 3. Strip empty paragraphs
  text = text.replace(/<p>\s*(?:&nbsp;|\s)*<\/p>/gi, '');
  text = text.trim();

  // If text became empty after removing Product Details / Key Features, fallback to refined narrative
  if (!text || text.replace(/<[^>]*>/g, '').trim().length < 5) {
    return `<p>An authentic handcrafted fine jewelry creation from Moonlit Jewelry, designed with exquisite precious metals and timeless elegance.</p>`;
  }

  return text;
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onInquire,
  content,
  isAdmin = false,
  onSaveProduct,
  categories
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loadedDateTime, setLoadedDateTime] = useState('');

  // Editing state on product detail page
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSelectedImageIndex(0);
    setIsEditing(false);
    setSaveMessage(null);
    setSaveSuccess(false);
    if (product) {
      setEditForm({ ...product });
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  useEffect(() => {
    if (product) {
      const d = new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setLoadedDateTime(`${day} ${month} ${year} (${hours}:${minutes})`);
    }
  }, [product?.id]);

  if (!product || !editForm) return null;

  const currentProduct = isEditing ? editForm : product;

  const images = currentProduct.galleryImages && currentProduct.galleryImages.length > 0
    ? currentProduct.galleryImages
    : [currentProduct.image];

  const whatsappMessage = encodeURIComponent(
    `Hello Moonlit Jewelry, I am interested in inquiring about "${currentProduct.name}" (Article No: ${currentProduct.articleNo}). Is this piece available for immediate purchase or custom order?`
  );

  const cleanWhatsappNumber = content.whatsapp.replace(/[^0-9]/g, '');

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditForm((prev) => (prev ? {
          ...prev,
          image: result,
          galleryImages: [result, ...(prev.galleryImages?.slice(1) || [])]
        } : null));
      }
    };
    reader.readAsDataURL(file);
  };

  // Save product record handler on detail page
  const handleSaveRecord = async () => {
    if (!onSaveProduct || !editForm) return;

    setIsSaving(true);
    setSaveMessage(null);
    setSaveSuccess(false);

    let finalCategory = (editForm.category || '').trim();
    if (isAddingNewCat && newCatName.trim()) {
      finalCategory = newCatName.trim();
    }
    if (!finalCategory) {
      finalCategory = 'Wedding Bands & Rings';
    }

    const payload: Product = {
      ...editForm,
      name: editForm.name.trim() || product.name,
      articleNo: (editForm.articleNo || product.articleNo).replace(/\D/g, '').slice(0, 5).padStart(5, '0'),
      category: finalCategory,
      material: editForm.material.trim() || product.material,
      gemstone: editForm.gemstone?.trim() || undefined,
      shortDescription: editForm.shortDescription || `${editForm.material} fine jewelry.`,
      description: editForm.description || `<p>Handcrafted fine jewelry piece by Moonlit Jewelry.</p>`,
      updatedAt: Date.now()
    };

    const success = await onSaveProduct(payload);
    setIsSaving(false);

    if (success) {
      setSaveSuccess(true);
      setSaveMessage('Record saved successfully!');
      setEditForm(payload);
      setIsAddingNewCat(false);
      setNewCatName('');
      setTimeout(() => {
        setSaveMessage(null);
        setSaveSuccess(false);
      }, 3500);
    } else {
      setSaveSuccess(false);
      setSaveMessage('Failed to save record. Please check server connection.');
    }
  };

  const allCategoriesList = categories && categories.length > 0
    ? categories.filter((c) => c !== 'All Jewelry' && c !== 'Complimentary Services')
    : [
        'Wedding Bands & Rings',
        'Pendants & Necklace',
        'Bridal Jewelry',
        'Bangles & Bracelets',
        'Earrings & Studs',
        'Pearl & Polki Jewelry'
      ];

  const sanitizedDescription = cleanBackpageDescription(currentProduct.description, currentProduct.shortDescription);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#FDFCF9] border-2 border-black shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with close button in pure Black typography */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black bg-[#FAF6EE]">
          <div className="flex items-center gap-2 text-xs font-sans tracking-[0.18em] uppercase text-black font-bold">
            <span className="text-black font-bold">{content.brandName}</span>
            <span className="text-black font-bold">·</span>
            <span className="text-black font-bold">{currentProduct.category}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Admin toggle between preview and edit mode on detail page */}
            {isAdmin && (
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setSaveMessage(null);
                }}
                className={`px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isEditing
                    ? 'bg-black text-white border-black'
                    : 'bg-[#FDFCF9] hover:bg-black hover:text-white text-black border-black'
                }`}
                title="Toggle Edit Mode on detail page"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Editing Mode' : 'Edit This Record'}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-1.5 text-black hover:bg-black/10 transition-colors text-xs flex items-center gap-1 cursor-pointer font-bold"
              title="Share piece"
            >
              <Share2 className="w-4 h-4 text-black" />
              <span className="hidden sm:inline font-sans uppercase tracking-wider text-[11px] text-black font-bold">
                {copiedLink ? 'Link Copied!' : 'Share'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-black hover:bg-black/10 rounded transition-colors cursor-pointer"
              aria-label="Close details"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>

        {/* Admin Edit Notification Strip if editing */}
        {isAdmin && isEditing && (
          <div className="bg-[#88641C] text-white px-6 py-2 flex items-center justify-between text-xs font-sans font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Editing Product Record · Change Category or Specs & Click Save</span>
            </div>
            <button
              onClick={handleSaveRecord}
              disabled={isSaving}
              className="px-3 py-1 bg-white text-black hover:bg-black hover:text-white transition-colors text-[11px] font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              <span>{isSaving ? 'Saving...' : 'Save Record'}</span>
            </button>
          </div>
        )}

        {/* Success or error notification banner */}
        {saveMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-bold font-sans flex items-center gap-2 border-b ${
              saveSuccess
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                : 'bg-red-50 border-red-500 text-red-900'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${saveSuccess ? 'text-emerald-600' : 'text-red-600'}`} />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 text-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Gallery Column */}
            <div className="flex flex-col gap-4">
              {/* Main Image Display */}
              <div className="relative aspect-square w-full bg-[#F7F4EB] overflow-hidden border border-black">
                <img
                  src={images[selectedImageIndex] || currentProduct.image}
                  alt={currentProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transition-all duration-300"
                />

                {/* Article No badge at bottom of modal image */}
                <div className="absolute inset-x-0 bottom-0 py-1.5 px-3 bg-white/95 backdrop-blur-xs border-t border-black flex items-center justify-between text-black z-10">
                  <span className="text-[10px] tracking-wider uppercase font-bold text-black font-sans">
                    Article No
                  </span>
                  <span className="text-xs font-mono font-bold tracking-widest text-black">
                    {currentProduct.articleNo}
                  </span>
                </div>
              </div>

              {/* In Edit mode: Change image option */}
              {isAdmin && isEditing && (
                <div className="p-3 bg-[#FAF6EE] border border-black space-y-2 text-xs">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-black">
                    Change Main Image Photo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.image}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          image: e.target.value,
                          galleryImages: [e.target.value, ...(editForm.galleryImages?.slice(1) || [])]
                        })
                      }
                      placeholder="Image URL..."
                      className="flex-1 bg-white border border-black px-2 py-1 text-xs font-mono"
                    />
                    <label className="px-3 py-1 bg-black text-white hover:bg-stone-800 text-[10px] uppercase font-bold cursor-pointer flex items-center gap-1 shrink-0">
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Thumbnails Row */}
              {images.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-16 shrink-0 border-2 overflow-hidden bg-[#FAF6EE] transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-black shadow-xs'
                          : 'border-stone-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Guarantee markers in pure Black */}
              <div className="pt-4 border-t border-black/20 grid grid-cols-2 gap-3 text-xs text-black font-sans font-bold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                  <span className="font-bold text-black">100% Certified Authentic</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-black shrink-0" />
                  <span className="font-bold text-black">Handcrafted Quality</span>
                </div>
              </div>
            </div>

            {/* Product Purchase & Spec Column */}
            <div className="flex flex-col justify-between text-black">
              <div>
                {/* Availability status */}
                {!isEditing ? (
                  <div className="flex items-center gap-2 text-xs font-sans font-bold text-black uppercase tracking-widest mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span className="text-black font-bold">
                      {currentProduct.availability === 'in_stock'
                        ? 'In Stock · Ready for Delivery'
                        : currentProduct.availability === 'made_to_order'
                        ? 'Bespoke · Made to Order'
                        : 'Limited Pieces Available'}
                    </span>
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-black mb-1">
                      Availability Status
                    </label>
                    <select
                      value={editForm.availability}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          availability: e.target.value as Product['availability']
                        })
                      }
                      className="w-full bg-white border border-black px-2 py-1 text-xs font-sans font-bold text-black"
                    >
                      <option value="in_stock">In Stock · Ready for Delivery</option>
                      <option value="made_to_order">Bespoke · Made to Order</option>
                      <option value="low_stock">Limited Pieces Available</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>
                )}

                {/* Product Title */}
                {!isEditing ? (
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-black leading-tight mb-4">
                    {currentProduct.name}
                  </h2>
                ) : (
                  <div className="mb-4">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-black mb-1">
                      Product Title
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-white border-2 border-black px-3 py-2 text-base font-serif font-bold text-black focus:outline-none"
                    />
                  </div>
                )}

                {/* Customer Action Buttons: Inquiry + WhatsApp (shown in customer view) */}
                {!isEditing && (
                  <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <button
                      onClick={() => {
                        onClose();
                        onInquire(currentProduct);
                      }}
                      className="flex-1 py-3.5 bg-black text-white hover:bg-stone-800 transition-all text-xs font-sans font-bold tracking-[0.18em] uppercase flex items-center justify-center gap-2 shadow-xs cursor-pointer border border-black"
                    >
                      <MessageSquare className="w-4 h-4 text-white" />
                      <span className="text-white font-bold">Ask About This Piece</span>
                    </button>

                    <a
                      href={`https://wa.me/${cleanWhatsappNumber}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3.5 px-5 bg-white hover:bg-black text-black hover:text-white border-2 border-black transition-colors text-xs font-sans font-bold tracking-[0.16em] uppercase flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-current" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}

                {/* Jewelry Specifications section with Category & Save button */}
                <div className="space-y-4 mb-6 text-xs sm:text-sm font-sans text-black">
                  <div className="flex items-center justify-between border-b border-black pb-1">
                    <h4 className="font-serif text-base font-bold text-black">
                      Jewelry Information
                    </h4>
                    {isAdmin && (
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-[11px] font-bold text-[#88641C] hover:text-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditing ? 'Cancel Edit' : 'Edit Specs'}</span>
                      </button>
                    )}
                  </div>

                  {!isEditing ? (
                    /* Customer Read View: Exact requirement */
                    <div className="grid grid-cols-2 gap-y-2.5 text-black">
                      <span className="text-black uppercase text-[11px] tracking-wider font-bold">Article No:</span>
                      <span className="font-mono text-black text-sm font-bold tracking-widest">{currentProduct.articleNo}</span>

                      <span className="text-black uppercase text-[11px] tracking-wider font-bold">Precious Metal:</span>
                      <span className="font-bold text-black">{currentProduct.material}</span>

                      <span className="text-black uppercase text-[11px] tracking-wider font-bold">Category:</span>
                      <span className="font-bold text-black">{currentProduct.category}</span>

                      {currentProduct.gemstone && (
                        <>
                          <span className="text-black uppercase text-[11px] tracking-wider font-bold">Gemstone:</span>
                          <span className="font-bold text-black">{currentProduct.gemstone}</span>
                        </>
                      )}

                      <span className="text-black uppercase text-[11px] tracking-wider font-bold">Loaded Date & Time:</span>
                      <span className="font-mono text-black text-xs sm:text-sm font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-black shrink-0" />
                        <span>{loadedDateTime}</span>
                      </span>
                    </div>
                  ) : (
                    /* Admin Edit View: Category field with Save button on the detail page */
                    <div className="space-y-3 bg-[#FAF6EE] p-4 border border-black">
                      {/* Category field with Save button */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-black uppercase text-[11px] tracking-wider font-bold">
                            Category *
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                            className="text-[10px] font-bold text-[#88641C] hover:underline cursor-pointer uppercase tracking-wider"
                          >
                            {isAddingNewCat ? '← Choose Existing' : '+ Custom Category'}
                          </button>
                        </div>

                        {isAddingNewCat ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCatName}
                              onChange={(e) => {
                                setNewCatName(e.target.value);
                                setEditForm({ ...editForm, category: e.target.value });
                              }}
                              placeholder="Type new category..."
                              className="flex-1 bg-white border border-black px-2 py-1.5 text-xs font-bold text-black focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveRecord}
                              disabled={isSaving}
                              className="px-3 py-1.5 bg-black text-white hover:bg-[#88641C] text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Save Category immediately"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Category</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <select
                              value={editForm.category}
                              onChange={(e) => {
                                if (e.target.value === '__NEW__') {
                                  setIsAddingNewCat(true);
                                  setNewCatName('');
                                } else {
                                  setEditForm({ ...editForm, category: e.target.value });
                                }
                              }}
                              className="flex-1 bg-white border border-black px-2 py-1.5 text-xs font-bold text-black focus:outline-none"
                            >
                              {allCategoriesList.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                              <option value="__NEW__">+ Add Custom Category...</option>
                            </select>
                            <button
                              type="button"
                              onClick={handleSaveRecord}
                              disabled={isSaving}
                              className="px-3 py-1.5 bg-black text-white hover:bg-[#88641C] text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Save Category update"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Category</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Article No & Material */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-black uppercase text-[10px] tracking-wider font-bold mb-1">
                            Article No (5 Digits)
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            value={editForm.articleNo}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
                              setEditForm({ ...editForm, articleNo: digits });
                            }}
                            className="w-full bg-white border border-black px-2 py-1.5 text-xs font-mono font-bold text-black"
                          />
                        </div>
                        <div>
                          <label className="block text-black uppercase text-[10px] tracking-wider font-bold mb-1">
                            Precious Metal
                          </label>
                          <input
                            type="text"
                            value={editForm.material}
                            onChange={(e) => setEditForm({ ...editForm, material: e.target.value })}
                            className="w-full bg-white border border-black px-2 py-1.5 text-xs font-bold text-black"
                          />
                        </div>
                      </div>

                      {/* Gemstone */}
                      <div>
                        <label className="block text-black uppercase text-[10px] tracking-wider font-bold mb-1">
                          Gemstone
                        </label>
                        <input
                          type="text"
                          value={editForm.gemstone || ''}
                          onChange={(e) => setEditForm({ ...editForm, gemstone: e.target.value })}
                          placeholder="e.g. Natural Diamonds, Colombian Emerald..."
                          className="w-full bg-white border border-black px-2 py-1.5 text-xs font-bold text-black"
                        />
                      </div>

                      {/* Loaded Date & Time Display */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#EADBBD] text-xs">
                        <span className="text-black uppercase text-[10px] tracking-wider font-bold">Loaded Date & Time:</span>
                        <span className="font-mono text-black text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-black" />
                          <span>{loadedDateTime}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Narrative Description */}
                <div className="mb-6 text-black">
                  <h4 className="font-serif text-base font-bold text-black border-b border-black pb-1 mb-2">
                    Description
                  </h4>
                  {!isEditing ? (
                    <div
                      className="text-xs sm:text-sm text-black font-sans leading-relaxed prose prose-stone max-w-none font-medium [&_*]:text-black"
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                    />
                  ) : (
                    <div>
                      <textarea
                        rows={3}
                        value={editForm.shortDescription || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            shortDescription: e.target.value,
                            description: `<p>${e.target.value}</p>`
                          })
                        }
                        className="w-full bg-white border border-black p-2 text-xs font-sans text-black"
                        placeholder="Description..."
                      />
                    </div>
                  )}
                </div>

                {/* Action Save Button on detail page if in edit mode */}
                {isAdmin && isEditing && (
                  <div className="pt-4 border-t-2 border-black flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveRecord}
                      disabled={isSaving}
                      className="flex-1 py-3 bg-black hover:bg-[#88641C] text-white text-xs font-sans font-bold tracking-[0.18em] uppercase flex items-center justify-center gap-2 shadow-sm cursor-pointer border border-black transition-colors disabled:opacity-60"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving Record...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Record</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-3 bg-[#FAF6EE] hover:bg-stone-200 text-black border border-black text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Close Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
