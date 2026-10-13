import { Product, SiteContent, CustomerInquiry } from '../types';

export interface CatalogResponse {
  lastUpdated: number;
  products: Product[];
  content: SiteContent;
}

let lastKnownUpdated = 0;

export const apiClient = {
  /**
   * Fetch the full catalog directly from the application backend
   */
  async getCatalog(): Promise<CatalogResponse | null> {
    try {
      const res = await fetch('/api/catalog', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data && Array.isArray(data.products)) {
        lastKnownUpdated = data.lastUpdated || Date.now();
        return data;
      }
      return null;
    } catch (err) {
      console.warn('API getCatalog notice (operating offline/fallback):', err);
      return null;
    }
  },

  /**
   * Lightweight version check to detect changes on other devices
   */
  async getVersion(): Promise<{ lastUpdated: number; productsCount: number } | null> {
    try {
      const res = await fetch('/api/catalog/version', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Save a single product to the server (broadcasts instantly to other devices)
   */
  async saveProduct(product: Product): Promise<boolean> {
    try {
      const res = await fetch('/api/catalog/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.lastUpdated) lastKnownUpdated = data.lastUpdated;
      return true;
    } catch (err) {
      console.warn('API saveProduct error:', err);
      return false;
    }
  },

  /**
   * Save the entire products catalog to the server
   */
  async saveProducts(products: Product[]): Promise<boolean> {
    try {
      const res = await fetch('/api/catalog/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.lastUpdated) lastKnownUpdated = data.lastUpdated;
      return true;
    } catch (err) {
      console.warn('API saveProducts error:', err);
      return false;
    }
  },

  /**
   * Delete a product on the server
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/catalog/product/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.lastUpdated) lastKnownUpdated = data.lastUpdated;
      return true;
    } catch (err) {
      console.warn('API deleteProduct error:', err);
      return false;
    }
  },

  /**
   * Save global site branding and content
   */
  async saveContent(content: SiteContent): Promise<boolean> {
    try {
      const res = await fetch('/api/catalog/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.lastUpdated) lastKnownUpdated = data.lastUpdated;
      return true;
    } catch (err) {
      console.warn('API saveContent error:', err);
      return false;
    }
  },

  /**
   * Submit an inquiry to the server
   */
  async saveInquiry(inquiry: CustomerInquiry): Promise<boolean> {
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiry)
      });
      return res.ok;
    } catch (err) {
      console.warn('API saveInquiry error:', err);
      return false;
    }
  },

  /**
   * Retrieve inquiries from the server
   */
  async getInquiries(): Promise<CustomerInquiry[]> {
    try {
      const res = await fetch('/api/inquiries', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.inquiries) ? data.inquiries : [];
    } catch {
      return [];
    }
  },

  /**
   * Real-time subscription to multi-device updates using Server-Sent Events (SSE)
   * plus periodic polling fallback to guarantee immediate cross-device sync.
   */
  subscribe(
    onUpdate: (data: { products: Product[]; content: SiteContent; lastUpdated: number }) => void
  ): () => void {
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isDisposed = false;

    const pullFresh = async () => {
      if (isDisposed) return;
      const catalog = await apiClient.getCatalog();
      if (catalog && catalog.products) {
        onUpdate({
          products: catalog.products,
          content: catalog.content,
          lastUpdated: catalog.lastUpdated
        });
      }
    };

    // 1. Establish SSE Connection
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        eventSource = new EventSource('/api/catalog/events');

        eventSource.onmessage = async (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type && data.type !== 'connected') {
              if (data.lastUpdated && data.lastUpdated > lastKnownUpdated) {
                lastKnownUpdated = data.lastUpdated;
                await pullFresh();
              }
            }
          } catch (err) {
            console.warn('SSE message parse error:', err);
          }
        };

        eventSource.onerror = () => {
          // EventSource will automatically retry; keep polling as safety net
        };
      }
    } catch (err) {
      console.warn('EventSource connection error:', err);
    }

    // 2. Polling safety net: check version every 5 seconds to catch changes across devices
    pollInterval = setInterval(async () => {
      if (isDisposed) return;
      const version = await apiClient.getVersion();
      if (version && version.lastUpdated && version.lastUpdated > lastKnownUpdated) {
        lastKnownUpdated = version.lastUpdated;
        await pullFresh();
      }
    }, 5000);

    // 3. Check immediately when window regains focus (e.g. user switches tabs or unlocks phone)
    const handleFocus = async () => {
      const version = await apiClient.getVersion();
      if (version && version.lastUpdated && version.lastUpdated > lastKnownUpdated) {
        lastKnownUpdated = version.lastUpdated;
        await pullFresh();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      isDisposed = true;
      if (eventSource) {
        eventSource.close();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }
};
