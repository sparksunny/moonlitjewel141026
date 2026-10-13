import { Product, SiteContent, CustomerInquiry } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import { INITIAL_SITE_CONTENT } from '../data/initialContent';

const STORAGE_KEYS = {
  PRODUCTS: 'moonlit_products_v12',
  CONTENT: 'moonlit_site_content_v12',
  INQUIRIES: 'moonlit_inquiries_v12',
  CATEGORIES: 'moonlit_categories_v12'
};

const sanitizeProducts = (list: Product[]): Product[] => {
  return list.map((p, idx) => {
    let artNo = p.articleNo;
    if (!artNo || !/^\d{5}$/.test(String(artNo).trim())) {
      artNo = String(10001 + (idx % 90000));
    }
    let cat = (p.category || '').trim();
    if (
      cat === 'Necklaces' ||
      cat === 'Necklace' ||
      cat === 'endants & Necklace'
    ) {
      cat = 'Pendants & Necklace';
    }
    return {
      ...p,
      articleNo: String(artNo),
      category: cat
    };
  });
};

export const storage = {
  getProducts(): Product[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeProducts(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading products from localStorage', e);
    }
    return sanitizeProducts(INITIAL_PRODUCTS);
  },

  saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products to localStorage', e);
    }
  },

  mergeProducts(localList: Product[], serverList: Product[]): Product[] {
    if (!serverList || serverList.length === 0) return localList;
    if (!localList || localList.length === 0) return sanitizeProducts(serverList);

    const mergedMap = new Map<string, Product>();

    // Seed with server list
    serverList.forEach((sp) => {
      if (sp && sp.id) {
        mergedMap.set(sp.id, sp);
      }
    });

    // Merge local: preserve user-created or user-modified records
    localList.forEach((lp) => {
      if (!lp || !lp.id) return;
      const serverProd = mergedMap.get(lp.id);
      if (!serverProd) {
        // Newly added local product not yet in cloud or cloud was out of quota
        mergedMap.set(lp.id, lp);
      } else {
        const localTime = lp.updatedAt || 0;
        const serverTime = serverProd.updatedAt || 0;
        if (localTime >= serverTime) {
          mergedMap.set(lp.id, lp);
        }
      }
    });

    return sanitizeProducts(Array.from(mergedMap.values()));
  },

  getContent(): SiteContent {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONTENT);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_SITE_CONTENT, ...parsed };
      }
    } catch (e) {
      console.error('Error loading content from localStorage', e);
    }
    return INITIAL_SITE_CONTENT;
  },

  saveContent(content: SiteContent): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(content));
    } catch (e) {
      console.error('Error saving content to localStorage', e);
    }
  },

  getCategories(): string[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading categories from localStorage', e);
    }
    return [
      'Wedding Bands & Rings',
      'Pendants & Necklace',
      'Bridal Jewelry',
      'Bangles & Bracelets',
      'Earrings & Studs',
      'Pearl & Polki Jewelry'
    ];
  },

  saveCategories(categories: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Error saving categories to localStorage', e);
    }
  },

  getInquiries(): CustomerInquiry[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading inquiries', e);
    }
    return [
      {
        id: 'inq-default-1',
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        fullName: 'Ayesha Rahman',
        email: 'ayesha.r@example.com',
        phone: '+1 716-555-0192',
        productId: 'moonlit-8433578836015',
        productName: 'Moonlit Jewelry Elegant Pear Cut Halo Ring',
        message: 'Interested in bespoke sizing (US 6.5) in 925 sterling silver with custom engraving.',
        status: 'new'
      }
    ];
  },

  saveInquiry(inquiry: Omit<CustomerInquiry, 'id' | 'date' | 'status'>): CustomerInquiry {
    const list = this.getInquiries();
    const newInquiry: CustomerInquiry = {
      ...inquiry,
      id: `inq-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      status: 'new'
    };
    const updated = [newInquiry, ...list];
    try {
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving inquiry', e);
    }
    return newInquiry;
  },

  updateInquiryStatus(id: string, status: CustomerInquiry['status']): void {
    const list = this.getInquiries().map((item) =>
      item.id === id ? { ...item, status } : item
    );
    try {
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(list));
    } catch (e) {
      console.error('Error updating inquiry status', e);
    }
  },

  resetAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.CONTENT);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    } catch (e) {
      console.error('Error resetting storage', e);
    }
  }
};
