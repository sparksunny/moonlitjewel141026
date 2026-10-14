import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Save,
  Trash2,
  Copy,
  Edit,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Type,
  List,
  MessageSquare,
  RotateCcw,
  LogOut,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Search,
  Sparkles,
  ExternalLink,
  Layers,
  FolderPlus,
  Tag,
  RefreshCw,
  Download
} from 'lucide-react';
import { Product, SiteContent, CustomerInquiry } from '../../types';
import { storage } from '../../services/storage';
import { authService } from '../../services/auth';
import { cloudDb } from '../../services/firebase';
import { apiClient } from '../../services/api';

interface AdminDashboardProps {
  products: Product[];
  content: SiteContent;
  onSaveProducts: (products: Product[]) => void;
  onSaveContent: (content: SiteContent) => void;
  onClose: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products: initialProducts,
  content: initialContent,
  onSaveProducts,
  onSaveContent,
  onClose,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'inquiries'>('products');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>(() => storage.getInquiries());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  // Editing single product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Category creation in Category Tab
  const [newCategoryName, setNewCategoryName] = useState('');

  // Status banners
  const [notification, setNotification] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Comprehensive catalog categories list derived dynamically
  const allCategories = useMemo(() => {
    const defaultList = [
      'Wedding Bands & Rings',
      'Pendants & Necklace',
      'Bridal Jewelry',
      'Bangles & Bracelets',
      'Earrings & Studs',
      'Pearl & Polki Jewelry'
    ];
    const set = new Set<string>(defaultList);
    (content.customCategories || []).forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    products.forEach((p) => {
      if (p.category && p.category.trim() && p.category !== 'Complimentary Services') {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [products, content.customCategories]);

  // --- SAVE & SERVER SYNC SYSTEM ---
  const handleSaveChanges = () => {
    storage.saveProducts(products);
    storage.saveContent(content);
    onSaveProducts(products);
    onSaveContent(content);
    apiClient.saveProducts(products).catch((e) => console.error(e));
    apiClient.saveContent(content).catch((e) => console.error(e));
    cloudDb.saveAllProducts(products).catch((e) => console.warn(e));
    cloudDb.saveSiteContent(content).catch((e) => console.warn(e));
    showNotice('All catalog changes saved & synced live across devices.');
  };

  const handlePullFreshFromServer = async () => {
    try {
      const fresh = await apiClient.getCatalog();
      if (fresh && fresh.products && fresh.products.length > 0) {
        setProducts(fresh.products);
        storage.saveProducts(fresh.products);
        onSaveProducts(fresh.products);
        if (fresh.content) {
          setContent(fresh.content);
          storage.saveContent(fresh.content);
          onSaveContent(fresh.content);
        }
        showNotice(`Synchronized ${fresh.products.length} products live from server!`);
      } else {
        showNotice('Server is synchronized. No new external changes.');
      }
    } catch {
      showNotice('Sync checked. Operating from current state.');
    }
  };

  const handleExportCatalog = () => {
    const data = {
      version: 'moonlit-v12',
      exportedAt: new Date().toISOString(),
      products,
      content
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moonlit-jewelry-catalog-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice('Catalog backup downloaded as JSON.');
  };

  const handleImportCatalog = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.products && Array.isArray(parsed.products)) {
          setProducts(parsed.products);
          storage.saveProducts(parsed.products);
          onSaveProducts(parsed.products);
          apiClient.saveProducts(parsed.products);
          if (parsed.content) {
            setContent(parsed.content);
            storage.saveContent(parsed.content);
            onSaveContent(parsed.content);
            apiClient.saveContent(parsed.content);
          }
          showNotice(`Successfully restored ${parsed.products.length} products!`);
        } else {
          showNotice('Invalid catalog file format.');
        }
      } catch {
        showNotice('Failed to parse catalog JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all products and content back to the original demonstration catalog? Any custom edits will be reverted.')) {
      storage.resetAll();
      const resetProds = storage.getProducts();
      const resetCont = storage.getContent();
      setProducts(resetProds);
      setContent(resetCont);
      onSaveProducts(resetProds);
      onSaveContent(resetCont);
      apiClient.saveProducts(resetProds).catch((e) => console.error(e));
      apiClient.saveContent(resetCont).catch((e) => console.error(e));
      cloudDb.saveAllProducts(resetProds).catch((e) => console.warn(e));
      cloudDb.saveSiteContent(resetCont).catch((e) => console.warn(e));
      showNotice('All catalog data reset to default demo collection.');
    }
  };

  // --- CATEGORY RECORD MANAGEMENT ---
  const handleCreateCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (allCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      showNotice(`Category "${trimmed}" already exists.`);
      return;
    }
    const updatedCustom = [...(content.customCategories || []), trimmed];
    const updatedContent = { ...content, customCategories: updatedCustom };
    setContent(updatedContent);
    onSaveContent(updatedContent);
    storage.saveContent(updatedContent);
    cloudDb.saveSiteContent(updatedContent).catch((e) => console.error(e));
    setNewCategoryName('');
    showNotice(`Category "${trimmed}" created & ready for products!`);
  };

  const handleRenameCategory = (oldName: string) => {
    const newName = window.prompt(`Enter new name for category "${oldName}":`, oldName);
    if (!newName || !newName.trim() || newName.trim().toLowerCase() === oldName.toLowerCase()) return;
    const trimmedNew = newName.trim();

    let count = 0;
    const updatedProducts = products.map((p) => {
      if ((p.category || '').toLowerCase() === oldName.toLowerCase()) {
        count++;
        return { ...p, category: trimmedNew };
      }
      return p;
    });

    const existingCustom = content.customCategories || [];
    const updatedCustom = existingCustom.map((c) => (c.toLowerCase() === oldName.toLowerCase() ? trimmedNew : c));
    if (!updatedCustom.some((c) => c.toLowerCase() === trimmedNew.toLowerCase())) {
      updatedCustom.push(trimmedNew);
    }
    const updatedContent = { ...content, customCategories: updatedCustom };

    setProducts(updatedProducts);
    setContent(updatedContent);
    onSaveProducts(updatedProducts);
    onSaveContent(updatedContent);
    storage.saveProducts(updatedProducts);
    storage.saveContent(updatedContent);
    cloudDb.saveAllProducts(updatedProducts).catch((e) => console.error(e));
    cloudDb.saveSiteContent(updatedContent).catch((e) => console.error(e));

    showNotice(`Renamed category to "${trimmedNew}". Updated ${count} products.`);
  };

  const handleDeleteCategory = (catName: string) => {
    const prodsInCat = products.filter((p) => (p.category || '').toLowerCase() === catName.toLowerCase());
    let promptMsg = `Are you sure you want to delete category "${catName}"?`;
    if (prodsInCat.length > 0) {
      promptMsg = `Category "${catName}" contains ${prodsInCat.length} product(s). Deleting it will move these products to "Wedding Bands & Rings". Proceed?`;
    }
    if (window.confirm(promptMsg)) {
      let updatedProducts = products;
      if (prodsInCat.length > 0) {
        updatedProducts = products.map((p) =>
          (p.category || '').toLowerCase() === catName.toLowerCase()
            ? { ...p, category: 'Wedding Bands & Rings', updatedAt: Date.now() }
            : p
        );
        setProducts(updatedProducts);
        onSaveProducts(updatedProducts);
        storage.saveProducts(updatedProducts);
        apiClient.saveProducts(updatedProducts).catch((e) => console.error(e));
        cloudDb.saveAllProducts(updatedProducts).catch((e) => console.error(e));
      }

      const updatedCustom = (content.customCategories || []).filter(
        (c) => c.toLowerCase() !== catName.toLowerCase()
      );
      const updatedContent = { ...content, customCategories: updatedCustom };
      setContent(updatedContent);
      onSaveContent(updatedContent);
      storage.saveContent(updatedContent);
      apiClient.saveContent(updatedContent).catch((e) => console.error(e));
      cloudDb.saveSiteContent(updatedContent).catch((e) => console.error(e));
      showNotice(`Category "${catName}" removed successfully.`);
    }
  };

  // --- PRODUCT MANAGEMENT ---
  const handleAddNewProduct = (defaultCategory?: string) => {
    const chosenCat =
      defaultCategory ||
      (categoryFilter !== 'all' ? categoryFilter : 'Wedding Bands & Rings');

    const newProd: Product = {
      id: `moonlit-${Date.now()}`,
      articleNo: String(Math.floor(10000 + Math.random() * 90000)),
      name: 'New Moonlit Jewelry Piece',
      handle: `moonlit-piece-${Date.now()}`,
      category: chosenCat,
      price: 2999,
      originalPrice: 3499,
      currency: 'PKR',
      image: 'https://cdn.shopify.com/s/files/1/0772/0288/2607/files/SilverTonering1.png?v=1787589399',
      galleryImages: [
        'https://cdn.shopify.com/s/files/1/0772/0288/2607/files/SilverTonering1.png?v=1787589399'
      ],
      shortDescription: 'Handcrafted luxury jewelry piece made with precious metals and fine details.',
      description: '<p>Exquisite fine jewelry piece handcrafted with exceptional precision and attention to detail.</p>',
      badge: 'New Arrival',
      availability: 'in_stock',
      featured: false,
      isNew: true,
      material: '925 Sterling Silver / Rhodium Tone',
      gemstone: 'Fine Cut Brilliant Accents',
      tags: ['handcrafted', 'luxury jewelry'],
      visible: true,
      careInstructions: 'Store in Moonlit velvet pouch. Avoid direct perfumes.'
    };
    setEditingProduct(newProd);
    setIsAddingNew(true);
    setIsAddingCustomCategory(false);
    setCustomCategoryName('');
  };

  const handleDuplicateProduct = (prod: Product) => {
    const duplicated: Product = {
      ...prod,
      id: `moonlit-${Date.now()}`,
      articleNo: String(Math.floor(10000 + Math.random() * 90000)),
      name: `${prod.name} (Copy)`,
      handle: `${prod.handle}-copy-${Date.now()}`,
      updatedAt: Date.now()
    };
    const updated = [duplicated, ...products];
    setProducts(updated);
    onSaveProducts(updated);
    storage.saveProducts(updated);
    apiClient.saveProduct(duplicated).catch((e) => console.error(e));
    cloudDb.saveProduct(duplicated).catch((e) => console.error(e));
    showNotice(`Duplicated "${prod.name}" and saved to category "${prod.category}".`);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      onSaveProducts(updated);
      storage.saveProducts(updated);
      apiClient.deleteProduct(id).catch((e) => console.error(e));
      cloudDb.deleteProduct(id).catch((e) => console.error(e));
      showNotice(`Deleted "${name}".`);
    }
  };

  const handleToggleVisibility = (id: string) => {
    const updated = products.map((p) => (p.id === id ? { ...p, visible: !p.visible, updatedAt: Date.now() } : p));
    setProducts(updated);
    onSaveProducts(updated);
    storage.saveProducts(updated);
    const target = updated.find((p) => p.id === id);
    if (target) {
      apiClient.saveProduct(target).catch((e) => console.error(e));
      cloudDb.saveProduct(target).catch((e) => console.error(e));
    }
  };

  const handleSaveProductModal = (prod: Product) => {
    let finalCat = (prod.category || '').trim();
    if (isAddingCustomCategory && customCategoryName.trim()) {
      finalCat = customCategoryName.trim();
    }
    if (!finalCat) {
      finalCat = 'Wedding Bands & Rings';
    }
    const sanitizedProd: Product = {
      ...prod,
      category: finalCat,
      updatedAt: Date.now()
    };

    let updatedList: Product[];
    if (isAddingNew) {
      updatedList = [sanitizedProd, ...products];
      setProducts(updatedList);
      showNotice(`Added record to category "${sanitizedProd.category}" successfully!`);
    } else {
      updatedList = products.map((p) => (p.id === sanitizedProd.id ? sanitizedProd : p));
      setProducts(updatedList);
      showNotice(`Updated record in category "${sanitizedProd.category}" successfully!`);
    }

    // Immediately persist to parent state, local storage, API server, and Cloud Firestore!
    onSaveProducts(updatedList);
    storage.saveProducts(updatedList);
    apiClient.saveProduct(sanitizedProd).catch((e) => console.warn('API save notice:', e));
    cloudDb.saveProduct(sanitizedProd).catch((e) => console.warn('Cloud save notice:', e));

    // Also register category if it's new
    if (
      finalCat &&
      !allCategories.some((c) => c.toLowerCase() === finalCat.toLowerCase())
    ) {
      const updatedCustom = [...(content.customCategories || []), finalCat];
      const updatedContent = { ...content, customCategories: updatedCustom };
      setContent(updatedContent);
      onSaveContent(updatedContent);
      storage.saveContent(updatedContent);
      apiClient.saveContent(updatedContent).catch((e) => console.warn('API content save notice:', e));
      cloudDb.saveSiteContent(updatedContent).catch((e) => console.warn('Cloud content save notice:', e));
    }

    setEditingProduct(null);
    setIsAddingNew(false);
    setIsAddingCustomCategory(false);
    setCustomCategoryName('');
  };

  // Image file upload helper (converts to base64)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        callback(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered products list for table
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      categoryFilter === 'all' ||
      (p.category || '').trim().toLowerCase() === categoryFilter.trim().toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.articleNo && p.articleNo.includes(searchQuery)) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#5C4D40]/30 backdrop-blur-md backdrop-blur-xs flex flex-col">
      {/* Top Header */}
      <div className="bg-[#F5EACB] text-[#5A4112] border-b border-[#EADBBD] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#88641C] flex items-center justify-center font-serif font-bold text-white text-sm">
            M
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium leading-none">
              Moonlit Jewelry Atelier Admin
            </h2>
            <p className="text-[10px] text-stone-400 font-sans tracking-widest uppercase mt-1">
              Storefront & Catalog Management Console
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/90 border border-emerald-300 text-emerald-800 text-[11px] font-sans font-medium rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Multi-Device Sync Live</span>
          </div>

          {notification && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-sans animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{notification}</span>
            </div>
          )}

          <button
            onClick={handlePullFreshFromServer}
            className="px-2.5 sm:px-3 py-2 bg-[#FAF6EE] hover:bg-[#EBDCB4] text-[#5A4112] border border-[#DECFA9] font-sans text-xs tracking-wider uppercase flex items-center gap-1 transition-colors cursor-pointer font-bold"
            title="Fetch latest updates from server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync Server</span>
          </button>

          <button
            onClick={handleExportCatalog}
            className="px-2.5 sm:px-3 py-2 bg-[#FAF6EE] hover:bg-[#EBDCB4] text-[#5A4112] border border-[#DECFA9] font-sans text-xs tracking-wider uppercase flex items-center gap-1 transition-colors cursor-pointer font-bold"
            title="Download full catalog as JSON backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Backup</span>
          </button>

          <label
            className="px-2.5 sm:px-3 py-2 bg-[#FAF6EE] hover:bg-[#EBDCB4] text-[#5A4112] border border-[#DECFA9] font-sans text-xs tracking-wider uppercase flex items-center gap-1 transition-colors cursor-pointer font-bold"
            title="Restore catalog from JSON file"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Restore</span>
            <input type="file" accept=".json" onChange={handleImportCatalog} className="hidden" />
          </label>

          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 bg-[#FAF6EE] hover:bg-[#EBDCB4] text-[#5A4112] border border-[#DECFA9] font-sans font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Switch to viewing & editing on the website storefront"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Storefront Edit Mode</span>
          </button>

          <button
            onClick={handleSaveChanges}
            className="px-3 sm:px-4 py-2 bg-[#7E5C1E] hover:bg-[#684A14] text-[#FAF6EE] font-sans font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>

          <button
            onClick={handleResetToDefaults}
            className="px-2.5 sm:px-3 py-2 bg-[#FAF6EE] hover:bg-[#EBDCB4] text-[#5A4112] border border-[#DECFA9] font-sans text-xs tracking-wider uppercase flex items-center gap-1 transition-colors cursor-pointer font-bold"
            title="Reset to default demo products and settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          <button
            onClick={() => {
              authService.logout();
              onLogout();
            }}
            className="px-3 py-2 bg-[#FAF6EE] hover:bg-red-50 hover:text-red-700 text-[#7E6649] border border-[#DECFA9] font-sans text-xs tracking-wider uppercase flex items-center gap-1 transition-colors cursor-pointer font-bold"
            title="Log out of admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Logout</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white transition-colors"
            aria-label="Close Admin"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="bg-[#EDE1BD] text-[#7E5C1E] border-b border-[#DECFA9] px-6 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'products', label: 'Products Catalog', icon: List, count: products.length },
          { id: 'categories', label: 'Categories', icon: Layers, count: allCategories.length },
          { id: 'inquiries', label: 'Customer Inquiries', icon: MessageSquare, count: inquiries.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-sans uppercase tracking-[0.14em] font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                active
                  ? 'border-[#7E5C1E] text-[#5A4112] bg-[#FAF6EE] font-bold shadow-xs'
                  : 'border-transparent text-[#7E6649] hover:text-[#44331C]'
              }`}
            >
              <Icon className="w-4 h-4 text-[#88641C]" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#DECFA9] text-[#44331C] font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF9F5] text-[#44331C]">
        {/* ============================================================ */}
        {/* TAB 1: PRODUCTS CATALOG */}
        {/* ============================================================ */}
        {activeTab === 'products' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 border border-stone-200">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[240px]">
                  <input
                    type="text"
                    placeholder="Search by name, article # or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-300 px-3 py-1.5 pl-8 text-xs font-sans focus:outline-none focus:border-[#7E5C1E]"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Category filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#FAF8F5] border border-stone-300 px-3 py-1.5 text-xs font-sans focus:outline-none focus:border-[#7E5C1E] font-medium"
                >
                  <option value="all">All Categories ({products.length})</option>
                  {allCategories.map((cat) => {
                    const count = products.filter(
                      (p) => (p.category || '').trim().toLowerCase() === cat.trim().toLowerCase()
                    ).length;
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                onClick={() => handleAddNewProduct()}
                className="px-4 py-2 bg-[#7E5C1E] text-[#FAF6EE] hover:bg-[#684A14] text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#C29B38]" />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Product Table */}
            <div className="bg-white border border-stone-200 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px]">
                    <th className="p-3 w-14">Image</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Material & Details</th>
                    <th className="p-3">Availability</th>
                    <th className="p-3 text-center">Featured</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 object-cover bg-stone-100 border border-stone-200"
                          referrerPolicy="no-referrer"
                        />
                      </td>
                      <td className="p-3 max-w-[260px]">
                        <p className="font-serif font-medium text-[#44331C] text-sm truncate">
                          {p.name}
                        </p>
                        <span className="text-[10px] text-stone-400 font-mono">
                          ID: {p.id}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3 tabular-nums font-semibold text-[#44331C]">
                        {p.currency || 'PKR'} {(p.price ?? 0).toLocaleString()}
                        {p.originalPrice && p.price !== undefined && p.originalPrice > p.price && (
                          <span className="block text-[10px] text-stone-400 line-through">
                            {p.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-stone-600 max-w-[200px]">
                        <p className="truncate">{p.material}</p>
                        <p className="text-[10px] text-stone-400 truncate">{p.gemstone}</p>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] uppercase font-semibold px-2 py-0.5 ${
                            p.availability === 'in_stock'
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          {p.availability.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {p.featured ? (
                          <Sparkles className="w-4 h-4 text-[#88641C] mx-auto" />
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleVisibility(p.id)}
                          className="p-1 hover:bg-stone-200 rounded"
                          title={p.visible ? 'Hide from store' : 'Show on store'}
                        >
                          {p.visible ? (
                            <Eye className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-stone-400" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsAddingNew(false);
                            }}
                            className="p-1 text-stone-600 hover:text-[#44331C] hover:bg-stone-200 rounded"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(p)}
                            className="p-1 text-stone-600 hover:text-[#44331C] hover:bg-stone-200 rounded"
                            title="Duplicate product"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: CATEGORIES & CATALOG ORGANIZATION */}
        {/* ============================================================ */}
        {activeTab === 'categories' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Bar with Add Category */}
            <div className="bg-white p-6 border border-stone-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#44331C] mb-1">
                    Atelier Categories & Product Records
                  </h3>
                  <p className="text-xs text-stone-500 font-sans">
                    Create new categories, add products to categories, and manage how collections are organized across navigation, quick tabs, and footers.
                  </p>
                </div>

                {/* Add Category Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateCategory(newCategoryName);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    required
                    placeholder="New category name (e.g. Nose Pins, Anklets)..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="bg-[#FAF9F5] border border-stone-300 px-3 py-2 text-xs font-sans min-w-[260px] focus:outline-none focus:border-[#7E5C1E]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#7E5C1E] text-[#FAF6EE] hover:bg-[#684A14] text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <FolderPlus className="w-4 h-4 text-[#C29B38]" />
                    <span>Create Category</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCategories.map((cat) => {
                const prodsInCat = products.filter(
                  (p) => (p.category || '').trim().toLowerCase() === cat.trim().toLowerCase()
                );
                const visibleCount = prodsInCat.filter((p) => p.visible !== false).length;
                const isCore = [
                  'Wedding Bands & Rings',
                  'Pendants & Necklace',
                  'Bridal Jewelry',
                  'Bangles & Bracelets',
                  'Earrings & Studs',
                  'Pearl & Polki Jewelry'
                ].includes(cat);

                return (
                  <div
                    key={cat}
                    className="bg-white border border-stone-200 p-5 flex flex-col justify-between hover:border-[#7E5C1E] transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-[#88641C]" />
                          <h4 className="font-serif text-base font-medium text-[#44331C]">
                            {cat}
                          </h4>
                        </div>
                        {isCore && (
                          <span className="text-[10px] font-sans uppercase tracking-wider px-2 py-0.5 bg-[#FAF6EE] text-[#7E5C1E] border border-[#DECFA9] font-bold">
                            Core
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-sans text-stone-500 mb-4">
                        <span className="font-semibold text-stone-800">
                          {prodsInCat.length} {prodsInCat.length === 1 ? 'Product Record' : 'Product Records'}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          {visibleCount} Live in Store
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter(cat);
                          setActiveTab('products');
                        }}
                        className="px-2.5 py-1.5 bg-[#FAF6EE] hover:bg-[#EBDCB4] text-[#5A4112] border border-[#DECFA9] text-[11px] font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        View Records ({prodsInCat.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddNewProduct(cat)}
                        className="px-2.5 py-1.5 bg-[#7E5C1E] hover:bg-[#684A14] text-white text-[11px] font-sans font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3 h-3 text-[#C29B38]" />
                        <span>Add Product</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRenameCategory(cat)}
                        className="px-2 py-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-[11px] font-sans transition-colors cursor-pointer"
                        title="Rename category across all products"
                      >
                        Rename
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="px-2 py-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 text-[11px] font-sans transition-colors cursor-pointer ml-auto"
                        title={`Delete category "${cat}"`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {/* ============================================================ */}
        {/* TAB 3: CUSTOMER INQUIRIES */}
        {/* ============================================================ */}
        {activeTab === 'inquiries' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white p-6 border border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#44331C]">
                    Customer Inquiries & Concierge Requests
                  </h3>
                  <p className="text-xs text-stone-500 font-sans mt-0.5">
                    Requests submitted via “Ask About This Jewelry” and bespoke commission forms.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 rounded text-stone-700">
                  {inquiries.length} Requests
                </span>
              </div>

              {inquiries.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  No inquiries received yet.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-base font-semibold text-[#44331C]">
                            {inq.fullName}
                          </span>
                          <span className="text-xs text-stone-400">({inq.date})</span>
                          <span
                            className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                              inq.status === 'new'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {inq.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const nextStatus = inq.status === 'new' ? 'contacted' : 'completed';
                              storage.updateInquiryStatus(inq.id, nextStatus);
                              setInquiries(storage.getInquiries());
                              showNotice(`Marked inquiry as ${nextStatus}.`);
                            }}
                            className="px-2.5 py-1 border border-stone-200 hover:bg-stone-50 text-[11px] font-sans"
                          >
                            Mark {inq.status === 'new' ? 'Contacted' : 'Completed'}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-stone-600 font-sans">
                        <span>Email: {inq.email}</span>
                        {inq.phone && <span>Phone: {inq.phone}</span>}
                        {inq.productName && (
                          <span className="font-medium text-[#44331C]">
                            Piece: {inq.productName} (Code: {inq.productId})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-700 bg-[#FAF8F5] p-3 border border-stone-100 leading-relaxed font-sans">
                        "{inq.message}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* EDIT PRODUCT MODAL */}
      {/* ============================================================ */}
      {editingProduct && (
        <div className="fixed inset-0 z-60 bg-[#5C4D40]/30 backdrop-blur-md backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white border border-stone-200 shadow-2xl max-h-[92vh] flex flex-col my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#F5EACB] text-[#5A4112]">
              <h3 className="font-serif text-lg font-medium">
                {isAddingNew ? 'Add New Jewelry Piece' : `Edit: ${editingProduct.name}`}
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block tracking-wider uppercase font-semibold text-stone-600 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="w-full bg-[#FAF9F5] border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block tracking-wider uppercase font-semibold text-stone-600">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomCategory(!isAddingCustomCategory);
                        if (!isAddingCustomCategory) {
                          setCustomCategoryName('');
                        }
                      }}
                      className="text-[11px] text-[#7E5C1E] hover:underline font-bold cursor-pointer"
                    >
                      {isAddingCustomCategory ? '← Choose Existing' : '+ Add New Category'}
                    </button>
                  </div>

                  {isAddingCustomCategory ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Type new category (e.g. Nose Pins, Anklets, Brooches)..."
                        value={customCategoryName}
                        onChange={(e) => {
                          setCustomCategoryName(e.target.value);
                          setEditingProduct({ ...editingProduct, category: e.target.value });
                        }}
                        className="w-full bg-[#FAF9F5] border border-[#7E5C1E] px-3 py-2 text-xs font-semibold focus:outline-none"
                        autoFocus
                      />
                      <p className="text-[10px] text-stone-500">
                        This category record will be automatically created upon saving.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={editingProduct.category}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsAddingCustomCategory(true);
                          setCustomCategoryName('');
                        } else {
                          setEditingProduct({ ...editingProduct, category: e.target.value });
                        }
                      }}
                      className="w-full bg-[#FAF9F5] border border-stone-300 px-3 py-2 text-xs font-medium"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__NEW__">+ Create New Category...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block tracking-wider uppercase font-semibold text-stone-600 mb-1">
                    Article No (5 Digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="e.g. 10025"
                    value={editingProduct.articleNo || ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setEditingProduct({ ...editingProduct, articleNo: digits });
                    }}
                    className="w-full bg-[#FAF9F5] border border-stone-300 px-3 py-2 text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">Displayed at the bottom of the product image</p>
                </div>
              </div>

              {/* Price & Original Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block tracking-wider uppercase font-semibold text-stone-600 mb-1">
                    Price ({editingProduct.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full bg-[#FAF9F5] border border-stone-300 px-3 py-2 text-xs tabular-nums"
                  />
                </div>

                <div>
                  <label className="block tracking-wider uppercase font-semibold text-stone-600 mb-1">
                    Original Price (for Sale badge)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        originalPrice: e.target.value ? parseFloat(e.target.value) : null
                      })
                    }
                    placeholder="e.g. 3499"
                    className="w-full bg-[#FAF9F5] border border-stone-300 px-3 py-2 text-xs tabular-nums"
                  />
                </div>

                <div>
                  <label className="block tracking-wider uppercase font-semibold text-stone-600 mb-1">
                    Availability
                  </label>
                  <select
                    value={editingProduct.availability}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        availability: e.target.value as any
                      })
                    }
                    className="w-full bg-[#FAF9F5] border border-stone-300 px-3 py-2 text-xs"
                  >
                    <option value="in_stock">In Stock (Ready to Ship)</option>
                    <option value="made_to_order">Made to Order / Bespoke</option>
                    <option value="low_stock">Limited Pieces</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Material & Stone Accent Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block tracking-wider uppercase font-semibold text-stone-600 mb-1">
                    Precious Material
                  </label>
                  <input
                    type="text"
                    value={editingProduct.material}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, material: e.target.value })
                    }
                    placeholder="e.g. 925 Sterling Silver / Rhodium Tone"
                    className="w-full bg-[#FAF9F5] border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block tracking-wider uppercase font-semibold text-stone-600 mb-1">
                    Stone & Accent Details
                  </label>
                  <input
                    type="text"
                    value={editingProduct.gemstone}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, gemstone: e.target.value })
                    }
                    placeholder="e.g. Brilliant Cut Crystals & Pavé Accents"
                    className="w-full bg-[#FAF9F5] border border-stone-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Images Section */}
              <div className="p-4 bg-[#FAF8F5] border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-semibold text-[#44331C]">
                    Product Images ({editingProduct.galleryImages?.length || 1})
                  </h4>
                  <label className="px-3 py-1 bg-[#7E5C1E] text-[#FAF6EE] text-[11px] uppercase tracking-wider font-bold cursor-pointer hover:bg-[#684A14] flex items-center gap-1 shadow-xs">
                    <Upload className="w-3 h-3" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImageFileUpload(e, (url) => {
                          const current = editingProduct.galleryImages || [editingProduct.image];
                          setEditingProduct({
                            ...editingProduct,
                            image: current.length === 0 ? url : editingProduct.image,
                            galleryImages: [...current, url]
                          });
                        })
                      }
                    />
                  </label>
                </div>

                {/* Main image URL input */}
                <div>
                  <label className="block tracking-wider uppercase text-[10px] text-stone-500 mb-1">
                    Main Display Image URL
                  </label>
                  <input
                    type="text"
                    value={editingProduct.image}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      const gal = [...(editingProduct.galleryImages || [])];
                      gal[0] = newUrl;
                      setEditingProduct({
                        ...editingProduct,
                        image: newUrl,
                        galleryImages: gal
                      });
                    }}
                    className="w-full bg-white border border-stone-300 px-3 py-1.5 text-xs font-mono"
                  />
                </div>

                {/* Thumbnails Gallery Management */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                  {(editingProduct.galleryImages || [editingProduct.image]).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative border border-stone-300 bg-white p-1 group flex flex-col items-center"
                    >
                      <img
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        className="w-full aspect-square object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex items-center justify-between w-full mt-1 px-1">
                        <span className="text-[10px] text-stone-400 font-mono">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          {idx > 0 && (
                            <button
                              onClick={() => {
                                const list = [...editingProduct.galleryImages];
                                const temp = list[idx - 1];
                                list[idx - 1] = list[idx];
                                list[idx] = temp;
                                setEditingProduct({
                                  ...editingProduct,
                                  image: list[0],
                                  galleryImages: list
                                });
                              }}
                              className="text-stone-500 hover:text-[#44331C]"
                              title="Move left"
                            >
                              <ArrowUp className="w-3 h-3 rotate-[-90deg]" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const list = editingProduct.galleryImages.filter((_, i) => i !== idx);
                              setEditingProduct({
                                ...editingProduct,
                                image: list[0] || '',
                                galleryImages: list
                              });
                            }}
                            className="text-red-500 hover:text-red-700"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Short & Long Description */}
              <div>
                <label className="block tracking-wider uppercase font-semibold text-stone-600 mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.shortDescription}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, shortDescription: e.target.value })
                  }
                  className="w-full bg-[#FAF9F5] border border-stone-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block tracking-wider uppercase font-semibold text-stone-600 mb-1">
                  Full Description & Specifications (HTML or Text)
                </label>
                <textarea
                  rows={4}
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full bg-[#FAF9F5] border border-stone-300 px-3 py-2 text-xs font-mono"
                />
              </div>

              {/* Feature Flags */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.featured}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, featured: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#88641C]"
                  />
                  <span className="font-semibold text-stone-800">Featured on Homepage</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isNew}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isNew: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#88641C]"
                  />
                  <span className="font-semibold text-stone-800">Mark as New Arrival</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.visible}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, visible: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#88641C]"
                  />
                  <span className="font-semibold text-stone-800">Visible on Storefront</span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-stone-200 bg-[#FAF9F5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="text-[11px] text-[#7E6649] font-sans flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#88641C]" />
                <span>
                  Target Category:{' '}
                  <strong className="text-[#44331C]">
                    {isAddingCustomCategory && customCategoryName.trim()
                      ? customCategoryName.trim()
                      : editingProduct.category || 'Wedding Bands & Rings'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-sans uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveProductModal(editingProduct)}
                  className="px-6 py-2 bg-[#7E5C1E] text-[#FAF6EE] hover:bg-[#684A14] hover:text-white text-xs font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4 text-[#C29B38]" />
                  <span>
                    {isAddingNew ? 'Add Record to Category' : 'Save Record & Category Changes'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
