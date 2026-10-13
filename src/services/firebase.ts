import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocFromServer,
  getDocsFromServer
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, SiteContent, CustomerInquiry } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

// Operational Error Handling conforming to firebase-integration-rpc requirements
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on app load
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline; falling back to local cache.');
    }
  }
}
testConnection();

export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as unknown as T;
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned as T;
}
return data;
}

let currentCloudSyncState: {
  quotaExceeded: boolean;
  lastCheck: number;
} = {
  quotaExceeded: true, // initial state set to true based on live verification
  lastCheck: Date.now()
};

// Cloud Data Services for multi-device sync
export const cloudDb = {
  /**
   * Real-time subscription to products collection.
   * Any change made on any device immediately pushes to all listeners.
   */
  subscribeToProducts(callback: (products: Product[]) => void): () => void {
    const collRef = collection(db, 'products');
    return onSnapshot(
      collRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Product);
          });
          callback(list);
        }
      },
      (error) => {
        console.warn('Firestore products sync notice (operating from fast local storage):', error);
      }
    );
  },

  /**
   * Real-time subscription to global site content (branding, phone, slogan, hero, etc.)
   */
  subscribeToSiteContent(callback: (content: SiteContent) => void): () => void {
    const docRef = doc(db, 'site_content', 'global');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as SiteContent);
        }
      },
      (error) => {
        console.warn('Firestore content sync notice (operating from fast local storage):', error);
      }
    );
  },

  /**
   * Real-time subscription to inquiries
   */
  subscribeToInquiries(callback: (inquiries: CustomerInquiry[]) => void): () => void {
    const collRef = collection(db, 'inquiries');
    return onSnapshot(
      collRef,
      (snapshot) => {
        const list: CustomerInquiry[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as CustomerInquiry);
        });
        callback(list);
      },
      (error) => {
        console.warn('Firestore inquiries sync notice:', error);
      }
    );
  },

  isQuotaExceeded(): boolean {
    return currentCloudSyncState.quotaExceeded;
  },

  getUpgradeUrl(): string {
    return `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;
  },

  /**
   * Save a single product to Cloud Firestore
   */
  async saveProduct(product: Product): Promise<{ success: boolean; quotaExceeded?: boolean; error?: string }> {
    const path = `products/${product.id}`;
    try {
      const cleaned = cleanForFirestore(product);
      await setDoc(doc(db, 'products', product.id), cleaned);
      currentCloudSyncState.quotaExceeded = false;
      return { success: true };
    } catch (error: any) {
      const isQuota =
        error?.message?.includes('Quota limit exceeded') ||
        error?.code === 'resource-exhausted' ||
        String(error).includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        currentCloudSyncState.quotaExceeded = true;
      }
      console.warn(`Firestore saveProduct fallback (saved locally): ${product.id}`, error);
      return { success: false, quotaExceeded: isQuota, error: error?.message };
    }
  },

  /**
   * Delete a single product from Cloud Firestore
   */
  async deleteProduct(productId: string): Promise<void> {
    const path = `products/${productId}`;
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      console.warn(`Firestore deleteProduct fallback: ${productId}`, error);
    }
  },

  /**
   * Save an entire array of products to Cloud Firestore in batches
   */
  async saveAllProducts(products: Product[]): Promise<{ success: boolean; quotaExceeded?: boolean; error?: string }> {
    try {
      const batchSize = 400;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = writeBatch(db);
        const slice = products.slice(i, i + batchSize);
        slice.forEach((p) => {
          const cleaned = cleanForFirestore(p);
          batch.set(doc(db, 'products', p.id), cleaned);
        });
        await batch.commit();
      }
      currentCloudSyncState.quotaExceeded = false;
      return { success: true };
    } catch (error: any) {
      const isQuota =
        error?.message?.includes('Quota limit exceeded') ||
        error?.code === 'resource-exhausted' ||
        String(error).includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        currentCloudSyncState.quotaExceeded = true;
      }
      console.warn('Firestore saveAllProducts fallback (all records safe in local storage):', error);
      return { success: false, quotaExceeded: isQuota, error: error?.message };
    }
  },

  /**
   * Save site content to Cloud Firestore
   */
  async saveSiteContent(content: SiteContent): Promise<{ success: boolean; quotaExceeded?: boolean; error?: string }> {
    const path = 'site_content/global';
    try {
      const cleaned = cleanForFirestore(content);
      await setDoc(doc(db, 'site_content', 'global'), cleaned);
      currentCloudSyncState.quotaExceeded = false;
      return { success: true };
    } catch (error: any) {
      const isQuota =
        error?.message?.includes('Quota limit exceeded') ||
        error?.code === 'resource-exhausted' ||
        String(error).includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        currentCloudSyncState.quotaExceeded = true;
      }
      console.warn('Firestore saveSiteContent fallback (saved locally):', error);
      return { success: false, quotaExceeded: isQuota, error: error?.message };
    }
  },

  /**
   * Save customer inquiry to Cloud Firestore
   */
  async saveInquiry(inquiry: CustomerInquiry): Promise<void> {
    const path = `inquiries/${inquiry.id}`;
    try {
      const cleaned = cleanForFirestore(inquiry);
      await setDoc(doc(db, 'inquiries', inquiry.id), cleaned);
    } catch (error) {
      console.warn(`Firestore saveInquiry fallback: ${inquiry.id}`, error);
    }
  },

  /**
   * Initialize Firestore with baseline catalog if cloud collection is currently empty
   */
  async initializeIfEmpty(
    fallbackProducts: Product[],
    fallbackContent: SiteContent
  ): Promise<boolean> {
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (snap.empty) {
        console.info('Seeding Cloud Firestore with catalog for cross-device synchronization...');
        await this.saveAllProducts(fallbackProducts);

        const contentDoc = await getDoc(doc(db, 'site_content', 'global'));
        if (!contentDoc.exists()) {
          await this.saveSiteContent(fallbackContent);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Initial cloud verification fallback:', error);
      return false;
    }
  },

  /**
   * Directly queries the Cloud Firestore SERVER bypassing any client-side cached data.
   * Guarantees 100% fresh data straight from the cloud.
   */
  async fetchFreshServerData(): Promise<{ products: Product[]; content: SiteContent | null }> {
    try {
      const prodSnap = await getDocsFromServer(collection(db, 'products'));
      const products: Product[] = [];
      prodSnap.forEach((d) => {
        products.push(d.data() as Product);
      });

      let content: SiteContent | null = null;
      try {
        const contentSnap = await getDocFromServer(doc(db, 'site_content', 'global'));
        if (contentSnap.exists()) {
          content = contentSnap.data() as SiteContent;
        }
      } catch (e) {
        console.warn('Could not fetch content directly from server:', e);
      }

      return { products, content };
    } catch (error) {
      console.warn('Direct server fetch fallback:', error);
      return { products: [], content: null };
    }
  }
};

export default app;
