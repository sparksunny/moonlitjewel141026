import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CollectionGrid } from './components/CollectionGrid';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { InquiryModal } from './components/InquiryModal';
import { SearchModal } from './components/SearchModal';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { storage } from './services/storage';
import { authService, ADMIN_PASSWORD } from './services/auth';
import { cloudDb } from './services/firebase';
import { apiClient } from './services/api';
import { Product, SiteContent, CustomerInquiry } from './types';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [content, setContent] = useState<SiteContent>(() => storage.getContent());
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>(() => storage.getInquiries());
  const [selectedCategory, setSelectedCategory] = useState<string>('All Jewelry');

  // Currency selection
  const [currency, setCurrency] = useState<'PKR' | 'USD'>(() => content.currency || 'PKR');

  // Modals & Admin state (persists on device in localStorage until explicit Logout)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => authService.isAuthenticated());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryProductContext, setInquiryProductContext] = useState<Product | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-device real-time sync & fresh load guarantee across all devices
  useEffect(() => {
    // 1. Purge any outdated versioned localStorage to prevent stale cache contamination, protecting admin device token
    try {
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith('moonlit_') &&
          !key.includes('_v12') &&
          key !== 'moonlit_admin_device_auth_token'
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}

    // 2. Fetch fresh server catalog immediately (bypassing any device cache)
    apiClient.getCatalog().then((fresh) => {
      if (fresh && fresh.products && fresh.products.length > 0) {
        setProducts(fresh.products);
        storage.saveProducts(fresh.products);
        if (fresh.content) {
          setContent(fresh.content);
          storage.saveContent(fresh.content);
        }
      }
    });

    // 3. Connect real-time Server-Sent Events (SSE) & polling subscription for instant multi-device updates
    const unsubApi = apiClient.subscribe((fresh) => {
      if (fresh && fresh.products && fresh.products.length > 0) {
        setProducts(fresh.products);
        storage.saveProducts(fresh.products);
        if (fresh.content) {
          setContent(fresh.content);
          storage.saveContent(fresh.content);
        }
      }
    });

    // 4. Also listen to Cloud Firestore subscriptions when available as secondary mirror
    const unsubProducts = cloudDb.subscribeToProducts((cloudProducts) => {
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts((prev) => {
          const merged = storage.mergeProducts(prev, cloudProducts);
          storage.saveProducts(merged);
          return merged;
        });
      }
    });

    const unsubContent = cloudDb.subscribeToSiteContent((cloudContent) => {
      if (cloudContent) {
        setContent(cloudContent);
        storage.saveContent(cloudContent);
      }
    });

    const unsubInquiries = cloudDb.subscribeToInquiries((cloudInquiries) => {
      if (cloudInquiries) {
        setInquiries(cloudInquiries);
      }
    });

    return () => {
      unsubApi();
      unsubProducts();
      unsubContent();
      unsubInquiries();
    };
  }, []);

  // Sync state changes with document title
  useEffect(() => {
    document.title = content.seoTitle || `${content.brandName} — Real Jewelry. Timeless Beauty.`;
  }, [content.seoTitle, content.brandName]);

  const handleToggleCurrency = () => {
    setCurrency((prev) => (prev === 'PKR' ? 'USD' : 'PKR'));
  };

  const handleOpenInquiry = (product?: Product | string) => {
    if (typeof product === 'string') {
      const found = products.find((p) => p.id === product);
      setInquiryProductContext(found || null);
    } else if (product) {
      setInquiryProductContext(product);
    } else {
      setInquiryProductContext(null);
    }
    setInquiryModalOpen(true);
  };

  const handleOpenAdmin = () => {
    if (isAdmin) {
      scrollToCollection();
    } else {
      setAdminLoginOpen(true);
    }
  };

  // Direct Website Entry on Admin Login: Immediately close login modal and scroll straight to live catalog with active edit controls
  const handleAdminLoginSuccess = () => {
    authService.login(ADMIN_PASSWORD);
    setIsAdmin(true);
    setAdminLoginOpen(false);
    setAdminDashboardOpen(false); // Do not open intrusive pop-up dashboard

    // Scroll directly to the live catalog with active edit controls
    setTimeout(() => {
      const el = document.getElementById('collection-grid');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);

    setToastMessage('Admin Access Active: Direct live website edit controls enabled.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Action 4: Logout handler - removes authentication from this device and vanishes Logout button
  const handleAdminLogout = () => {
    authService.logout();
    setIsAdmin(false);
    setAdminDashboardOpen(false);
    setToastMessage('Logged out from admin access.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Action 2 & 3: Save single record and check update
  const handleSaveSingleProduct = async (updatedProduct: Product): Promise<boolean> => {
    try {
      const nextProducts = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      setProducts(nextProducts);
      storage.saveProducts(nextProducts);
      if (selectedProduct && selectedProduct.id === updatedProduct.id) {
        setSelectedProduct(updatedProduct);
      }

      // Persist to server API (multi-device sync)
      const res = await apiClient.saveProduct(updatedProduct);

      // Secondary Firestore mirror
      cloudDb.saveProduct(updatedProduct).catch((e) => console.warn('Cloud save notice:', e));

      setToastMessage(`Record "${updatedProduct.name}" saved successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
      return Boolean(res !== null);
    } catch (err) {
      console.error('Failed to save record:', err);
      return false;
    }
  };

  // Add single record and check update
  const handleAddSingleProduct = async (newProduct: Product): Promise<boolean> => {
    try {
      const nextProducts = [newProduct, ...products];
      setProducts(nextProducts);
      storage.saveProducts(nextProducts);

      // Persist to server API
      const res = await apiClient.saveProduct(newProduct);

      // Secondary Firestore mirror
      cloudDb.saveProduct(newProduct).catch((e) => console.warn('Cloud add notice:', e));

      setToastMessage(`Record "${newProduct.name}" saved successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
      return Boolean(res !== null);
    } catch (err) {
      console.error('Failed to add record:', err);
      return false;
    }
  };

  // Delete single record
  const handleDeleteSingleProduct = async (productId: string): Promise<boolean> => {
    try {
      const nextProducts = products.filter((p) => p.id !== productId);
      setProducts(nextProducts);
      storage.saveProducts(nextProducts);

      await apiClient.deleteProduct(productId);
      cloudDb.deleteProduct(productId).catch((e) => console.warn('Cloud delete notice:', e));

      setToastMessage('Record removed successfully.');
      setTimeout(() => setToastMessage(null), 3000);
      return true;
    } catch (err) {
      console.error('Failed to delete product:', err);
      return false;
    }
  };

  // Category management handlers
  const handleAddCategory = async (catName: string): Promise<boolean> => {
    const trimmed = catName.trim();
    if (!trimmed) return false;
    if (activeCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setToastMessage(`Category "${trimmed}" already exists.`);
      setTimeout(() => setToastMessage(null), 3000);
      return false;
    }
    const updatedCustom = [...(content.customCategories || []), trimmed];
    const updatedContent = { ...content, customCategories: updatedCustom };
    setContent(updatedContent);
    storage.saveContent(updatedContent);
    apiClient.saveContent(updatedContent).catch((e) => console.error(e));
    cloudDb.saveSiteContent(updatedContent).catch((e) => console.warn(e));
    setSelectedCategory(trimmed);
    setToastMessage(`Category "${trimmed}" created successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
    return true;
  };

  const handleEditCategory = async (oldName: string, newName: string): Promise<boolean> => {
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew.toLowerCase() === oldName.toLowerCase()) return false;

    let count = 0;
    const updatedProducts = products.map((p) => {
      if ((p.category || '').toLowerCase() === oldName.toLowerCase()) {
        count++;
        return { ...p, category: trimmedNew, updatedAt: Date.now() };
      }
      return p;
    });

    const existingCustom = content.customCategories || [];
    const updatedCustom = existingCustom.map((c) =>
      c.toLowerCase() === oldName.toLowerCase() ? trimmedNew : c
    );
    if (!updatedCustom.some((c) => c.toLowerCase() === trimmedNew.toLowerCase())) {
      updatedCustom.push(trimmedNew);
    }
    const updatedContent = { ...content, customCategories: updatedCustom };

    setProducts(updatedProducts);
    setContent(updatedContent);
    storage.saveProducts(updatedProducts);
    storage.saveContent(updatedContent);
    apiClient.saveProducts(updatedProducts).catch((e) => console.error(e));
    apiClient.saveContent(updatedContent).catch((e) => console.error(e));
    cloudDb.saveAllProducts(updatedProducts).catch((e) => console.warn(e));
    cloudDb.saveSiteContent(updatedContent).catch((e) => console.warn(e));

    if (selectedCategory.toLowerCase() === oldName.toLowerCase()) {
      setSelectedCategory(trimmedNew);
    }

    setToastMessage(`Renamed category to "${trimmedNew}" (${count} products updated).`);
    setTimeout(() => setToastMessage(null), 4000);
    return true;
  };

  const handleDeleteCategory = async (catName: string): Promise<boolean> => {
    const prodsInCat = products.filter(
      (p) => (p.category || '').toLowerCase() === catName.toLowerCase()
    );
    let updatedProducts = products;
    if (prodsInCat.length > 0) {
      updatedProducts = products.map((p) =>
        (p.category || '').toLowerCase() === catName.toLowerCase()
          ? { ...p, category: 'Wedding Bands & Rings', updatedAt: Date.now() }
          : p
      );
      setProducts(updatedProducts);
      storage.saveProducts(updatedProducts);
      apiClient.saveProducts(updatedProducts).catch((e) => console.error(e));
      cloudDb.saveAllProducts(updatedProducts).catch((e) => console.warn(e));
    }

    const updatedCustom = (content.customCategories || []).filter(
      (c) => c.toLowerCase() !== catName.toLowerCase()
    );
    const updatedContent = { ...content, customCategories: updatedCustom };
    setContent(updatedContent);
    storage.saveContent(updatedContent);
    apiClient.saveContent(updatedContent).catch((e) => console.error(e));
    cloudDb.saveSiteContent(updatedContent).catch((e) => console.warn(e));

    if (selectedCategory.toLowerCase() === catName.toLowerCase()) {
      setSelectedCategory('All Jewelry');
    }

    setToastMessage(`Category "${catName}" removed successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
    return true;
  };

  // Bulk save products
  const handleSaveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    storage.saveProducts(newProducts);
    apiClient.saveProducts(newProducts).catch((err) => {
      console.error('Failed to sync products to API:', err);
    });
    cloudDb.saveAllProducts(newProducts).catch((err) => {
      console.warn('Failed to sync products to Firestore:', err);
    });
  };

  // Save content
  const handleSaveContent = (newContent: SiteContent) => {
    setContent(newContent);
    storage.saveContent(newContent);
    apiClient.saveContent(newContent).catch((err) => {
      console.error('Failed to sync content to API:', err);
    });
    cloudDb.saveSiteContent(newContent).catch((err) => {
      console.warn('Failed to sync content to Firestore:', err);
    });
  };

  const handleInquirySubmitted = (newInquiry: CustomerInquiry) => {
    setInquiries((prev) => [newInquiry, ...prev]);
    storage.saveInquiry(newInquiry);
    apiClient.saveInquiry(newInquiry).catch((err) => {
      console.error('Failed to sync inquiry to API:', err);
    });
    cloudDb.saveInquiry(newInquiry).catch((err) => {
      console.warn('Failed to sync inquiry to Firestore:', err);
    });
  };

  const handleForceRefresh = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith('moonlit_') &&
          !key.includes('_v12') &&
          key !== 'moonlit_admin_device_auth_token'
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}

    apiClient.getCatalog().then((fresh) => {
      if (fresh && fresh.products && fresh.products.length > 0) {
        setProducts(fresh.products);
        storage.saveProducts(fresh.products);
      }
      if (fresh && fresh.content) {
        setContent(fresh.content);
        storage.saveContent(fresh.content);
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCollection = () => {
    const el = document.getElementById('collection-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const activeCategories = React.useMemo(() => {
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

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#fffbe8] text-black flex flex-col font-sans selection:bg-[#E8DFC8]">
      {/* Primary Header with Logout button at top of header when logged in */}
      <Header
        content={content}
        activeCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        onOpenAdmin={handleOpenAdmin}
        onOpenInquiry={() => handleOpenInquiry()}
        onOpenSearch={() => setSearchModalOpen(true)}
        onRefresh={handleForceRefresh}
        inquiryCount={inquiries.filter((i) => i.status === 'new').length}
        currency={currency}
        onToggleCurrency={handleToggleCurrency}
        categories={activeCategories}
        isAdmin={isAdmin}
        onLogout={handleAdminLogout}
        onOpenDashboard={() => setAdminDashboardOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          content={content}
          onExplore={scrollToCollection}
          onContact={() => handleOpenInquiry()}
        />

        {/* Collection & Catalog Filter Grid: with direct editing & Save button after each record */}
        <CollectionGrid
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          currency={currency}
          pkrToUsdRate={content.pkrToUsdRate || 278}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onInquireProduct={(p) => handleOpenInquiry(p)}
          categories={activeCategories}
          isAdmin={isAdmin}
          onSaveProduct={handleSaveSingleProduct}
          onAddProduct={handleAddSingleProduct}
          onDeleteProduct={handleDeleteSingleProduct}
          onAddCategory={handleAddCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
          onOpenAdminConsole={() => setAdminDashboardOpen(true)}
        />
      </main>

      {/* Footer */}
      <Footer
        content={content}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          scrollToCollection();
        }}
        onOpenAdmin={handleOpenAdmin}
        onOpenInquiry={() => handleOpenInquiry()}
        categories={activeCategories}
      />

      {/* Global Confirmation Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A150D] text-white border-2 border-[#88641C] py-3 px-5 shadow-2xl flex items-center gap-3 animate-fadeIn font-sans text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Product Detail Modal: allows editing product record with Save button on detail page */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onInquire={(p) => handleOpenInquiry(p)}
          currency={currency}
          pkrToUsdRate={content.pkrToUsdRate || 278}
          content={content}
          isAdmin={isAdmin}
          onSaveProduct={handleSaveSingleProduct}
          onDeleteProduct={handleDeleteSingleProduct}
          categories={activeCategories}
        />
      )}

      {/* Inquiry / Bespoke Modal */}
      <InquiryModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        selectedProduct={inquiryProductContext}
        content={content}
        onInquirySubmitted={handleInquirySubmitted}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        products={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
        currency={currency}
        pkrToUsdRate={content.pkrToUsdRate || 278}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Optional Admin Dashboard Console (Accessible if desired for advanced tools) */}
      {adminDashboardOpen && (
        <AdminDashboard
          products={products}
          content={content}
          onSaveProducts={handleSaveProducts}
          onSaveContent={handleSaveContent}
          onClose={() => setAdminDashboardOpen(false)}
          onLogout={handleAdminLogout}
        />
      )}
    </div>
  );
}
