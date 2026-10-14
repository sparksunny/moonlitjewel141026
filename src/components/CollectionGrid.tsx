import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Plus,
  Save,
  CheckCircle2,
  X,
  Upload,
  Settings,
  RefreshCw,
  FolderPlus,
  Edit3,
  Trash2
} from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface CollectionGridProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  currency: 'PKR' | 'USD';
  pkrToUsdRate: number;
  onSelectProduct: (product: Product) => void;
  onInquireProduct: (product: Product) => void;
  categories?: string[];
  isAdmin?: boolean;
  onSaveProduct?: (product: Product) => Promise<boolean>;
  onAddProduct?: (product: Product) => Promise<boolean>;
  onDeleteProduct?: (productId: string) => Promise<boolean>;
  onAddCategory?: (category: string) => Promise<boolean>;
  onEditCategory?: (oldCategory: string, newCategory: string) => Promise<boolean>;
  onDeleteCategory?: (category: string) => Promise<boolean>;
  onOpenAdminConsole?: () => void;
}

export const CollectionGrid: React.FC<CollectionGridProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  currency,
  pkrToUsdRate,
  onSelectProduct,
  onInquireProduct,
  categories,
  isAdmin = false,
  onSaveProduct,
  onAddProduct,
  onDeleteProduct,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onOpenAdminConsole
}) => {
  // Category management modals state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addCategoryName, setAddCategoryName] = useState('');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Add new product record form state in admin mode
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArticleNo, setNewArticleNo] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newMaterial, setNewMaterial] = useState('18K Yellow Gold');
  const [newGemstone, setNewGemstone] = useState('');
  const [newAvailability, setNewAvailability] = useState<'in_stock' | 'made_to_order' | 'low_stock' | 'out_of_stock'>('in_stock');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [newRecordNotice, setNewRecordNotice] = useState<string | null>(null);
  const [newRecordSuccess, setNewRecordSuccess] = useState(false);

  // Compute next 5-digit article number
  const nextArticleNo = useMemo(() => {
    let max = 10000;
    products.forEach((p) => {
      const parsed = parseInt(p.articleNo || '', 10);
      if (!isNaN(parsed) && parsed > max) {
        max = parsed;
      }
    });
    return String(max + 1);
  }, [products]);

  // Open Add Record Form with defaults
  const handleOpenAddRecord = () => {
    const targetCategory =
      selectedCategory && selectedCategory !== 'All Jewelry' && selectedCategory !== 'Home'
        ? selectedCategory
        : 'Wedding Bands & Rings';
    setNewCategory(targetCategory);
    setNewArticleNo(nextArticleNo);
    setNewTitle('');
    setNewMaterial('18K Yellow Gold');
    setNewGemstone('');
    setNewAvailability('in_stock');
    setNewImageUrl('https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85');
    setNewRecordNotice(null);
    setNewRecordSuccess(false);
    setIsAddingRecord(true);
  };

  // Image upload helper for Add form
  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setNewImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save new record action
  const handleSaveNewRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddProduct) return;
    if (!newTitle.trim()) {
      setNewRecordNotice('Please enter a piece title.');
      setNewRecordSuccess(false);
      return;
    }

    setIsSavingNew(true);
    setNewRecordNotice(null);

    const artNo = (newArticleNo.trim() || nextArticleNo).padStart(5, '0');
    const created: Product = {
      id: `piece-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      articleNo: artNo,
      name: newTitle.trim(),
      handle: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: newCategory.trim() || 'Wedding Bands & Rings',
      image: newImageUrl.trim() || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85',
      galleryImages: [newImageUrl.trim() || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=85'],
      shortDescription: `${newMaterial.trim()} luxury jewelry piece.`,
      description: `<p>Handcrafted ${newMaterial.trim()} fine jewelry by Moonlit Jewelry Atelier.</p>`,
      availability: newAvailability,
      featured: true,
      isNew: true,
      material: newMaterial.trim() || '18K Gold',
      gemstone: newGemstone.trim() || undefined,
      tags: [newCategory.toLowerCase(), 'fine jewelry', 'bespoke'],
      visible: true,
      updatedAt: Date.now()
    };

    const isAdded = await onAddProduct(created);
    setIsSavingNew(false);

    if (isAdded) {
      setNewRecordSuccess(true);
      setNewRecordNotice('Record saved successfully!');
      setTimeout(() => {
        setIsAddingRecord(false);
        setNewRecordNotice(null);
        setNewRecordSuccess(false);
      }, 1600);
    } else {
      setNewRecordNotice('Failed to verify record update. Please check server connection.');
      setNewRecordSuccess(false);
    }
  };

  // Category Actions
  const handleSaveAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddCategory || !addCategoryName.trim()) return;
    setIsSavingCategory(true);
    const ok = await onAddCategory(addCategoryName.trim());
    setIsSavingCategory(false);
    if (ok) {
      setAddCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onEditCategory || !editCategoryName.trim()) return;
    setIsSavingCategory(true);
    const ok = await onEditCategory(selectedCategory, editCategoryName.trim());
    setIsSavingCategory(false);
    if (ok) {
      setIsEditingCategory(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!onDeleteCategory) return;
    const count = products.filter(
      (p) => (p.category || '').toLowerCase() === selectedCategory.toLowerCase()
    ).length;
    const msg =
      count > 0
        ? `Are you sure you want to delete category "${selectedCategory}"? ${count} product(s) in this category will be moved to "Wedding Bands & Rings".`
        : `Are you sure you want to delete category "${selectedCategory}"?`;
    if (window.confirm(msg)) {
      setIsSavingCategory(true);
      const ok = await onDeleteCategory(selectedCategory);
      setIsSavingCategory(false);
      if (ok) {
        onSelectCategory('All Jewelry');
      }
    }
  };

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    let result = products.filter(
      (p) => (isAdmin || p.visible !== false) && p.category !== 'Complimentary Services'
    );

    // Strict & authoritative Category filter (preventing cross-category leakage)
    if (selectedCategory && selectedCategory !== 'All Jewelry' && selectedCategory !== 'Home') {
      const selected = selectedCategory.trim().toLowerCase();
      result = result.filter((p) => {
        const prodCat = (p.category || '').trim().toLowerCase();

        // 1. Direct match
        if (prodCat === selected) return true;

        // 2. Normalized category aliases
        if (
          (selected === 'pendants & necklace' || selected === 'endants & necklace') &&
          (prodCat === 'pendants & necklace' || prodCat === 'endants & necklace' || prodCat === 'necklaces' || prodCat === 'necklace')
        ) {
          return true;
        }

        if (
          (selected === 'wedding bands & rings' || selected === 'rings') &&
          (prodCat === 'wedding bands & rings' || prodCat === 'rings')
        ) {
          return true;
        }

        if (
          (selected === 'bangles & bracelets' || selected === 'bracelets') &&
          (prodCat === 'bangles & bracelets' || prodCat === 'bracelets')
        ) {
          return true;
        }

        if (
          (selected === 'earrings & studs' || selected === 'earrings') &&
          (prodCat === 'earrings & studs' || prodCat === 'earrings')
        ) {
          return true;
        }

        if (
          selected === 'pearl & polki jewelry' &&
          prodCat === 'pearl & polki jewelry'
        ) {
          return true;
        }

        if (
          selected === 'bridal jewelry' &&
          prodCat === 'bridal jewelry'
        ) {
          return true;
        }

        return false;
      });
    }

    // Default catalog display: Featured pieces first
    return [...result].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [products, selectedCategory, isAdmin]);

  const categoriesList = useMemo(() => {
    const defaultList = [
      'All Jewelry',
      'Wedding Bands & Rings',
      'Pendants & Necklace',
      'Bridal Jewelry',
      'Bangles & Bracelets',
      'Earrings & Studs',
      'Pearl & Polki Jewelry'
    ];
    const custom = new Set<string>();
    if (categories && categories.length > 0) {
      categories.forEach((c) => {
        if (c && c.trim() && c !== 'All Jewelry' && c !== 'Complimentary Services') {
          custom.add(c.trim());
        }
      });
    }
    products.forEach((p) => {
      if (
        p.category &&
        p.category.trim() !== '' &&
        p.category !== 'Complimentary Services'
      ) {
        custom.add(p.category.trim());
      }
    });
    const nonDefault = Array.from(custom).filter(
      (c) => !defaultList.some((d) => d.toLowerCase() === c.toLowerCase())
    );
    return [...defaultList, ...nonDefault];
  }, [products, categories]);

  return (
    <section id="collection-grid" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Admin Mode Control Bar on Website */}
      {isAdmin && (
        <div className="mb-6 bg-[#FAF6EE] border-2 border-[#88641C] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-[#44331C]">
                Admin Catalog Mode Active
              </span>
              <p className="text-[11px] text-[#7E6649] font-sans">
                Manage Categories & Products with Add, Edit, and Delete options. Click any piece to edit details with Save button.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleOpenAddRecord}
              className="flex-1 sm:flex-initial px-4 py-2 bg-black hover:bg-[#88641C] text-white text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Add Product</span>
            </button>

            {onOpenAdminConsole && (
              <button
                onClick={onOpenAdminConsole}
                className="px-3 py-2 bg-[#FAF6EE] hover:bg-[#EBDCB4] text-[#5A4112] border border-[#DECFA9] text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="Open Admin Console for full catalog management"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Catalog Admin</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add New Record Inline Panel */}
      {isAdmin && isAddingRecord && (
        <div className="mb-8 p-5 bg-[#FAF6EE] border-2 border-black shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#EADBBD] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#88641C]" />
              <h3 className="font-serif text-base font-bold text-black uppercase tracking-wider">
                Add New Jewelry Record to "{newCategory}"
              </h3>
            </div>
            <button
              onClick={() => setIsAddingRecord(false)}
              className="p-1 text-stone-500 hover:text-black transition-colors cursor-pointer"
              aria-label="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveNewRecord} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Piece Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Royal Heritage Diamond Ring"
                  className="w-full bg-white border border-black px-3 py-2 text-xs font-sans text-black font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Article No (5-Digit) *
                </label>
                <input
                  type="text"
                  required
                  value={newArticleNo}
                  onChange={(e) => setNewArticleNo(e.target.value)}
                  placeholder="e.g. 10044"
                  className="w-full bg-white border border-black px-3 py-2 text-xs font-mono text-black font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-white border border-black px-3 py-2 text-xs font-sans text-black font-medium focus:outline-none"
                >
                  {categoriesList
                    .filter((c) => c !== 'All Jewelry')
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Precious Metal / Material
                </label>
                <input
                  type="text"
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  placeholder="e.g. 18K Yellow Gold"
                  className="w-full bg-white border border-black px-3 py-2 text-xs font-sans text-black font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Gemstone
                </label>
                <input
                  type="text"
                  value={newGemstone}
                  onChange={(e) => setNewGemstone(e.target.value)}
                  placeholder="e.g. Natural Diamonds, Ruby..."
                  className="w-full bg-white border border-black px-3 py-2 text-xs font-sans text-black font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Availability
                </label>
                <select
                  value={newAvailability}
                  onChange={(e) => setNewAvailability(e.target.value as any)}
                  className="w-full bg-white border border-black px-3 py-2 text-xs font-sans text-black font-medium focus:outline-none"
                >
                  <option value="in_stock">In Stock · Ready for Delivery</option>
                  <option value="made_to_order">Bespoke · Made to Order</option>
                  <option value="low_stock">Limited Pieces Available</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Image URL or Photo Upload
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-white border border-black px-3 py-2 text-xs font-mono text-black focus:outline-none"
                />
                <label className="px-3 py-2 bg-black text-white hover:bg-stone-800 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Success or error message */}
            {newRecordNotice && (
              <div
                className={`p-3 border text-xs font-bold flex items-center gap-2 ${
                  newRecordSuccess
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    : 'bg-red-50 border-red-400 text-red-900'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${newRecordSuccess ? 'text-emerald-600' : 'text-red-600'}`} />
                <span>{newRecordNotice}</span>
              </div>
            )}

            {/* Actions: Save button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSavingNew}
                className="px-6 py-2.5 bg-black hover:bg-[#88641C] text-white font-sans text-xs uppercase font-bold tracking-[0.18em] flex items-center gap-2 shadow-sm transition-colors cursor-pointer border border-black disabled:opacity-60"
              >
                {isSavingNew ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save New Record</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsAddingRecord(false)}
                className="px-4 py-2.5 bg-[#FAF6EE] hover:bg-stone-200 text-black border border-black font-sans text-xs uppercase font-bold tracking-wider cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Title & Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#EADBBD] pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-sans text-[#7E6649] mb-2 font-semibold">
            <span>Catalogue</span>
            <span>/</span>
            <span className="text-[#88641C] font-bold">{selectedCategory}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#44331C] tracking-tight">
            {selectedCategory === 'All Jewelry' ? 'Complete Collection' : selectedCategory}
          </h2>
        </div>

        {/* Count */}
        <div className="flex items-center gap-4 text-xs font-sans tracking-wide text-[#7E6649]">
          <span className="tabular-nums font-bold text-[#44331C]">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Piece' : 'Pieces'} Available
          </span>
        </div>
      </div>

      {/* Category Management Controls in Admin Mode */}
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-3 bg-[#FAF6EE] border border-[#DECFA9] text-xs font-sans shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#44331C] uppercase tracking-wider text-[11px]">Active Category:</span>
            <span className="font-bold px-2.5 py-1 bg-white border border-[#DECFA9] text-[#7E5C1E] shadow-2xs">
              {selectedCategory}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                setAddCategoryName('');
                setIsAddingCategory(true);
              }}
              className="px-3 py-1.5 bg-[#7E5C1E] hover:bg-[#684A14] text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Add a new category"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#F5EACB]" />
              <span>+ Add Category</span>
            </button>

            {selectedCategory !== 'All Jewelry' && (
              <>
                <button
                  onClick={() => {
                    setEditCategoryName(selectedCategory);
                    setIsEditingCategory(true);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-black text-[#5A4112] hover:text-white border border-[#DECFA9] hover:border-black text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title={`Edit or rename category "${selectedCategory}"`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-current" />
                  <span>Edit Category</span>
                </button>

                <button
                  onClick={handleConfirmDeleteCategory}
                  disabled={isSavingCategory}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-700 text-red-700 hover:text-white border border-red-300 hover:border-red-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  title={`Delete category "${selectedCategory}"`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-current" />
                  <span>Delete Category</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Category */}
      {isAdmin && isAddingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF6EE] border-2 border-black p-6 w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#EADBBD] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#88641C]" />
                <h3 className="font-serif text-base font-bold text-black uppercase tracking-wider">
                  Add New Category
                </h3>
              </div>
              <button
                onClick={() => setIsAddingCategory(false)}
                className="text-stone-500 hover:text-black cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={addCategoryName}
                  onChange={(e) => setAddCategoryName(e.target.value)}
                  placeholder="e.g. Royal Chokers, Solitaires, Nose Pins..."
                  className="w-full bg-white border border-black px-3 py-2 text-xs font-sans text-black font-semibold focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-2 bg-white hover:bg-stone-200 text-black border border-black text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="px-5 py-2 bg-black hover:bg-[#88641C] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Category */}
      {isAdmin && isEditingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF6EE] border-2 border-black p-6 w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#EADBBD] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#88641C]" />
                <h3 className="font-serif text-base font-bold text-black uppercase tracking-wider">
                  Edit / Rename Category
                </h3>
              </div>
              <button
                onClick={() => setIsEditingCategory(false)}
                className="text-stone-500 hover:text-black cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  New Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="Enter new category name..."
                  className="w-full bg-white border border-black px-3 py-2 text-xs font-sans text-black font-semibold focus:outline-none"
                />
                <p className="text-[10px] text-stone-600 mt-1">
                  All products currently under "{selectedCategory}" will be updated to the new name.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCategory(false)}
                  className="px-4 py-2 bg-white hover:bg-stone-200 text-black border border-black text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="px-5 py-2 bg-black hover:bg-[#88641C] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Quick Tabs Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 mb-8 bg-[#FAF6EE] p-3 sm:p-4 border border-[#EADBBD]">
        {categoriesList.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 text-xs font-sans tracking-[0.12em] uppercase whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-[#7E5C1E] text-[#FAF6EE] font-bold shadow-xs'
                  : 'bg-[#FDFCF9] hover:bg-[#EBDCB4] text-[#5A4112] border border-[#DECFA9] font-semibold'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              pkrToUsdRate={pkrToUsdRate}
              onSelect={onSelectProduct}
              onInquire={onInquireProduct}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-20 text-center bg-[#FAF6EE] border border-[#DECFA9] p-8">
          <Sparkles className="w-8 h-8 text-[#C2AB72] mx-auto mb-3" />
          <h3 className="font-serif text-2xl text-[#44331C] font-medium mb-2">
            No Jewelry in This Category Yet
          </h3>
          <p className="text-sm text-[#7E6649] max-w-md mx-auto mb-6">
            Explore our complete collection or browse our other handcrafted fine jewelry categories.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onSelectCategory('All Jewelry')}
              className="px-6 py-2.5 bg-[#7E5C1E] text-[#FAF6EE] text-xs font-sans uppercase font-bold tracking-[0.16em] hover:bg-[#684A14] transition-colors cursor-pointer shadow-xs"
            >
              View All Jewelry
            </button>
            {isAdmin && (
              <button
                onClick={handleOpenAddRecord}
                className="px-6 py-2.5 bg-black text-white text-xs font-sans uppercase font-bold tracking-[0.16em] hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
              >
                + Add Record Here
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
