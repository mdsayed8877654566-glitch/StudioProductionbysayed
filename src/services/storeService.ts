import { 
  Category, 
  Product, 
  Review, 
  Coupon, 
  Order, 
  UserProfile, 
  SiteSettings, 
  DownloadItem, 
  CartItem, 
  PermissionTemplate 
} from '../types';
import { 
  fetchCategoriesFromFirestore,
  upsertCategoryInFirestore,
  deleteCategoryInFirestore,
  fetchProductsFromFirestore,
  upsertProductInFirestore,
  deleteProductInFirestore,
  fetchOrdersFromFirestore,
  upsertOrderInFirestore,
  deleteOrderInFirestore,
  fetchCouponsFromFirestore,
  upsertCouponInFirestore,
  deleteCouponInFirestore,
  fetchReviewsFromFirestore,
  upsertReviewInFirestore,
  deleteReviewInFirestore,
  fetchUsersFromFirestore,
  upsertUserInFirestore,
  deleteUserInFirestore,
  fetchSettingsFromFirestore,
  upsertSettingsInFirestore,
  fetchPermissionTemplatesFromFirestore,
  upsertPermissionTemplateInFirestore,
  deletePermissionTemplateInFirestore,
  syncInitialDataToFirestore
} from '../lib/firestoreService';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_REVIEWS, 
  INITIAL_COUPONS, 
  INITIAL_USERS, 
  INITIAL_ORDERS, 
  INITIAL_SETTINGS 
} from '../data/initialData';
import { applyThemeColor, updateDynamicBrowserMeta } from '../utils/themeUtils';

const STORAGE_KEYS = {
  CATEGORIES: 'studio_collection_categories_v2',
  PRODUCTS: 'studio_collection_products_v2',
  REVIEWS: 'studio_collection_reviews_v2',
  COUPONS: 'studio_collection_coupons_v2',
  USERS: 'studio_collection_users_v2',
  ORDERS: 'studio_collection_orders_v2',
  SETTINGS: 'studio_collection_settings_v2',
  WISHLIST: 'studio_collection_wishlist_v2',
  CART: 'studio_collection_cart_v2',
  AUTH_USER: 'studio_collection_auth_user_v2',
  PERMISSION_TEMPLATES: 'studio_collection_permission_templates_v2',
  MASTER_BACKUP: 'studio_collection_master_backup_v3',
  SERVER_VERSION: 'studio_collection_server_version_v2'
};

export interface SaveResult<T> {
  success: boolean;
  data?: T;
  updatedList?: T[];
  verifiedInCloud: boolean;
  verifiedInLocalStorage: boolean;
  error?: string;
  timestamp: string;
}

export interface DeleteResult<T> {
  success: boolean;
  updatedList?: T[];
  verifiedInCloud: boolean;
  error?: string;
  timestamp: string;
}

class StoreService {
  private memoryCache: Map<string, any> = new Map();
  private isSyncingWithCloud: boolean = false;
  private isSyncingWithServer: boolean = false;
  private serverVersion: number = 0;
  private broadcastChannel: BroadcastChannel | null = null;
  private pollingTimer: any = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initStore();
  }

  private initStore(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    try {
      // 1. Initial optimistic memoryCache hydration from localStorage
      const cachedCategories = this.getLocalStorageItem<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
      const cachedProducts = this.getLocalStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
      const cachedSettings = this.getLocalStorageItem<SiteSettings>(STORAGE_KEYS.SETTINGS);

      this.memoryCache.set(STORAGE_KEYS.CATEGORIES, cachedCategories);
      this.memoryCache.set(STORAGE_KEYS.PRODUCTS, cachedProducts);
      
      if (cachedSettings) {
        this.memoryCache.set(STORAGE_KEYS.SETTINGS, cachedSettings);
        applyThemeColor(cachedSettings.primaryColor);
        updateDynamicBrowserMeta(cachedSettings);
      } else {
        // Fallback for initial load only if no cache exists
        this.memoryCache.set(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
      }

      // 2. Start asynchronous cloud synchronization
      this.syncWithCloud();

      // 3. Setup BroadcastChannel for instant cross-tab live synchronization
      if ('BroadcastChannel' in window) {
        try {
          this.broadcastChannel = new BroadcastChannel('studio_collection_live_sync');
          this.broadcastChannel.onmessage = (event) => {
            if (event.data === 'STORE_UPDATED' || event.data?.type === 'STORE_UPDATED') {
              this.memoryCache.clear();
              window.dispatchEvent(new Event('studio_collection_store_change'));
            }
          };
        } catch (e) {
          // BroadcastChannel unavailable
        }
      }

      // 3. Connect to Firestore as authoritative online source
      this.syncWithCloud().catch(err => {
        console.warn('[StoreService] Firestore initial sync notice:', err);
      });

      // 4. Connect to local Express server if present & start server polling
      this.syncWithServer().catch(() => {});
      this.startLiveServerPolling();

    } catch (e) {
      console.warn('[StoreService] Init store exception:', e);
    }
  }

  public async syncWithCloud(): Promise<boolean> {
    if (this.isSyncingWithCloud) return false;
    this.isSyncingWithCloud = true;

    try {
      const dbSettings = await fetchSettingsFromFirestore();
      if (dbSettings) {
        this.set(STORAGE_KEYS.SETTINGS, dbSettings, false);
        applyThemeColor(dbSettings.primaryColor);
        updateDynamicBrowserMeta(dbSettings);
      } else {
        // First time initialization - push initial data to Firestore
        await syncInitialDataToFirestore({
          categories: INITIAL_CATEGORIES,
          products: INITIAL_PRODUCTS,
          settings: INITIAL_SETTINGS
        });
      }

      const [cats, prods, ords, cups, revs, usrs, tpls] = await Promise.all([
        fetchCategoriesFromFirestore().catch(() => []),
        fetchProductsFromFirestore().catch(() => []),
        fetchOrdersFromFirestore().catch(() => []),
        fetchCouponsFromFirestore().catch(() => []),
        fetchReviewsFromFirestore().catch(() => []),
        fetchUsersFromFirestore().catch(() => []),
        fetchPermissionTemplatesFromFirestore().catch(() => [])
      ]);

      let hasChanges = false;
      if (cats.length > 0) {
        this.set(STORAGE_KEYS.CATEGORIES, cats, false);
        hasChanges = true;
      }
      if (prods.length > 0) {
        this.set(STORAGE_KEYS.PRODUCTS, prods, false);
        hasChanges = true;
      }
      if (ords.length > 0) {
        this.set(STORAGE_KEYS.ORDERS, ords, false);
        hasChanges = true;
      }
      if (cups.length > 0) {
        this.set(STORAGE_KEYS.COUPONS, cups, false);
        hasChanges = true;
      }
      if (revs.length > 0) {
        this.set(STORAGE_KEYS.REVIEWS, revs, false);
        hasChanges = true;
      }
      if (usrs.length > 0) {
        this.set(STORAGE_KEYS.USERS, usrs, false);
        hasChanges = true;
      }
      if (tpls.length > 0) {
        this.set(STORAGE_KEYS.PERMISSION_TEMPLATES, tpls, false);
        hasChanges = true;
      }

      if (hasChanges) {
        window.dispatchEvent(new Event('studio_collection_store_change'));
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({ type: 'STORE_UPDATED', timestamp: Date.now() });
        }
      }

      return true;
    } catch (err) {
      console.warn('[StoreService] Cloud sync error:', err);
      return false;
    } finally {
      this.isSyncingWithCloud = false;
    }
  }

  // --- REALTIME DATABASE HANDLER ---
  private handleRealtimeDatabaseEvent(table: string, eventType: string, newRecord: any, oldRecord: any): void {
    // This was previously for Supabase. For Firestore, we could use onSnapshot if needed.
  }

  // --- SERVER PERSISTENCE & LIVE MULTI-DEVICE SYNCHRONIZATION ---
  public async syncWithServer(): Promise<boolean> {
    if (this.isSyncingWithServer || typeof window === 'undefined') return false;
    this.isSyncingWithServer = true;

    try {
      const res = await fetch('/api/store', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return false;

      const result = await res.json();
      if (!result || !result.success || !result.data) return false;

      const db = result.data;
      this.serverVersion = result.version || db.version || this.serverVersion;
      localStorage.setItem(STORAGE_KEYS.SERVER_VERSION, String(this.serverVersion));

      let hasChanges = false;

      if (Array.isArray(db.categories) && db.categories.length > 0) {
        this.memoryCache.set(STORAGE_KEYS.CATEGORIES, db.categories);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(db.categories));
        hasChanges = true;
      }

      if (Array.isArray(db.products) && db.products.length > 0) {
        this.memoryCache.set(STORAGE_KEYS.PRODUCTS, db.products);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(db.products));
        hasChanges = true;
      }

      if (Array.isArray(db.orders)) {
        this.memoryCache.set(STORAGE_KEYS.ORDERS, db.orders);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(db.orders));
        hasChanges = true;
      }

      if (Array.isArray(db.coupons)) {
        this.memoryCache.set(STORAGE_KEYS.COUPONS, db.coupons);
        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(db.coupons));
        hasChanges = true;
      }

      if (Array.isArray(db.reviews)) {
        this.memoryCache.set(STORAGE_KEYS.REVIEWS, db.reviews);
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(db.reviews));
        hasChanges = true;
      }

      if (Array.isArray(db.users) && db.users.length > 0) {
        this.memoryCache.set(STORAGE_KEYS.USERS, db.users);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(db.users));
        hasChanges = true;
      }

      if (db.settings && typeof db.settings === 'object') {
        const currentSettings = this.getSettings();
        const mergedSettings = { ...currentSettings, ...db.settings };
        this.memoryCache.set(STORAGE_KEYS.SETTINGS, mergedSettings);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(mergedSettings));
        applyThemeColor(mergedSettings.primaryColor);
        updateDynamicBrowserMeta(mergedSettings);
        hasChanges = true;
      }

      if (Array.isArray(db.permissionTemplates)) {
        this.memoryCache.set(STORAGE_KEYS.PERMISSION_TEMPLATES, db.permissionTemplates);
        localStorage.setItem(STORAGE_KEYS.PERMISSION_TEMPLATES, JSON.stringify(db.permissionTemplates));
      }

      this.updateMasterBackup();

      if (hasChanges) {
        window.dispatchEvent(new Event('studio_collection_store_change'));
      }

      return true;
    } catch (e) {
      return false;
    } finally {
      this.isSyncingWithServer = false;
    }
  }

  private startLiveServerPolling(): void {
    if (typeof window === 'undefined') return;

    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }

    const checkVersion = async () => {
      try {
        if (typeof document !== 'undefined' && document.hidden) return;
        const res = await fetch('/api/store/version', {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.success && typeof data.version === 'number') {
          if (data.version > this.serverVersion) {
            await this.syncWithServer();
          }
        }
      } catch (e) {
        // quiet fail
      }
    };

    this.pollingTimer = setInterval(checkVersion, 4000);

    window.addEventListener('focus', checkVersion);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    });
  }

  private async postEntityToServer(type: string, entityData: any): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      const res = await fetch(`/api/store/entity/${encodeURIComponent(type)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entityData)
      });
      if (res.ok) {
        const result = await res.json();
        if (result && result.version) {
          this.serverVersion = result.version;
          localStorage.setItem(STORAGE_KEYS.SERVER_VERSION, String(this.serverVersion));
        }
      }
    } catch (e) {
      // quiet server notification
    }
  }

  private async deleteEntityOnServer(type: string, id: string): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      const res = await fetch(`/api/store/entity/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const result = await res.json();
        if (result && result.version) {
          this.serverVersion = result.version;
          localStorage.setItem(STORAGE_KEYS.SERVER_VERSION, String(this.serverVersion));
        }
      }
    } catch (e) {
      // quiet server notification
    }
  }

  private async postFullSyncToServer(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      const payload = {
        categories: this.getCategories(),
        products: this.getProducts(),
        orders: this.getOrders(),
        coupons: this.getCoupons(),
        reviews: this.getReviews(),
        users: this.getUsers(),
        settings: this.getSettings(),
        permissionTemplates: this.getPermissionTemplates()
      };
      const res = await fetch('/api/store/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const result = await res.json();
        if (result && result.version) {
          this.serverVersion = result.version;
          localStorage.setItem(STORAGE_KEYS.SERVER_VERSION, String(this.serverVersion));
        }
      }
    } catch (e) {
      // quiet server notification
    }
  }

  private getLocalStorageItem<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (e) {
      return null;
    }
  }

  private get<T>(key: string, fallback: T): T {
    try {
      if (this.memoryCache.has(key)) {
        return this.memoryCache.get(key) as T;
      }
      if (typeof window === 'undefined') return fallback;
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        this.memoryCache.set(key, parsed);
        return parsed;
      }
      return fallback;
    } catch (e) {
      return fallback;
    }
  }

  private set<T>(key: string, value: T, silent: boolean = false): void {
    try {
      this.memoryCache.set(key, value);
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
        this.updateMasterBackup();
        if (!silent) {
          window.dispatchEvent(new Event('studio_collection_store_change'));
          if (this.broadcastChannel) {
            this.broadcastChannel.postMessage('STORE_UPDATED');
          }
        }
      }
    } catch (e) {
      console.error(`[StoreService] Error writing storage key ${key}:`, e);
    }
  }

  private updateMasterBackup(): void {
    try {
      if (typeof window === 'undefined') return;
      const payload = {
        timestamp: new Date().toISOString(),
        categories: this.get<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
        products: this.get<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
        orders: this.get<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS),
        coupons: this.get<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_COUPONS),
        reviews: this.get<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS),
        users: this.get<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS),
        settings: this.get<SiteSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
        permissionTemplates: this.get<PermissionTemplate[]>(STORAGE_KEYS.PERMISSION_TEMPLATES, [])
      };
      localStorage.setItem(STORAGE_KEYS.MASTER_BACKUP, JSON.stringify(payload));
    } catch (e) {
      // ignore
    }
  }

  // --- CATEGORIES ---
  getCategories(): Category[] {
    const list = this.get<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const rawProds = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return [...list]
      .map(cat => ({
        ...cat,
        productCount: rawProds.filter(p => p.published !== false && (p.categorySlug === cat.slug || (cat.slug === 'websites' && (p.productType === 'Website' || p.productType === 'App')))).length
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  setCategories(categories: Category[]): void {
    this.set(STORAGE_KEYS.CATEGORIES, categories);
    this.postEntityToServer('categories', categories);
  }

  saveCategory(category: Category): Category[] {
    const list = this.getCategories();
    const index = list.findIndex(c => c.id === category.id || c.slug === category.slug);
    if (index >= 0) {
      list[index] = { ...list[index], ...category };
    } else {
      list.push(category);
    }
    this.set(STORAGE_KEYS.CATEGORIES, list);
    
    // Background persistence
    this.postEntityToServer('category', category);
    upsertCategoryInFirestore(category).catch(err => {
      console.warn('[StoreService] Category background sync notice:', err);
    });
    return list;
  }

  async saveCategoryVerified(category: Category): Promise<SaveResult<Category>> {
    let verifiedInCloud = false;

    try {
      await upsertCategoryInFirestore(category);
      verifiedInCloud = true;
    } catch (err: any) {
      console.warn('Firestore category upsert error:', err);
    }

    const list = this.getCategories();
    const index = list.findIndex(c => c.id === category.id || c.slug === category.slug);
    if (index >= 0) {
      list[index] = { ...list[index], ...category };
    } else {
      list.push(category);
    }
    this.set(STORAGE_KEYS.CATEGORIES, list);
    this.postEntityToServer('category', category);

    return {
      success: true,
      data: category,
      updatedList: list,
      verifiedInCloud: verifiedInCloud,
      verifiedInLocalStorage: true,
      timestamp: new Date().toISOString()
    };
  }

  deleteCategory(id: string): Category[] {
    const list = this.getCategories().filter(c => c.id !== id);
    this.set(STORAGE_KEYS.CATEGORIES, list);
    this.deleteEntityOnServer('category', id);
    deleteCategoryInFirestore(id).catch(err => console.warn('Firestore category delete warning:', err));
    return list;
  }

  async deleteCategoryVerified(id: string): Promise<DeleteResult<Category>> {
    let verifiedInCloud = false;
    
    try {
      await deleteCategoryInFirestore(id);
      verifiedInCloud = true;
    } catch (err: any) {
      console.warn('Firestore category delete error:', err);
    }

    const list = this.getCategories().filter(c => c.id !== id);
    this.set(STORAGE_KEYS.CATEGORIES, list);
    this.deleteEntityOnServer('category', id);

    return {
      success: true,
      updatedList: list,
      verifiedInCloud: verifiedInCloud,
      timestamp: new Date().toISOString()
    };
  }

  // --- PRODUCTS ---
  getProducts(): Product[] {
    const products = this.get<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const categories = this.getCategories();
    
    return products.map(product => {
      if (!product.thumbnail) {
        const category = categories.find(c => c.slug === product.categorySlug);
        if (category && category.image) {
          product.thumbnail = category.image;
        } else {
          product.thumbnail = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80';
        }
      }
      return product;
    });
  }

  setProducts(products: Product[]): void {
    this.set(STORAGE_KEYS.PRODUCTS, products);
    this.postEntityToServer('products', products);
  }

  getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  }

  getProductBySlug(slug: string): Product | undefined {
    return this.getProducts().find(p => p.slug === slug);
  }

  saveProduct(product: Product): Product[] {
    const list = this.getProducts();
    const index = list.findIndex(p => p.id === product.id || (product.slug && p.slug === product.slug));
    if (index >= 0) {
      list[index] = { ...list[index], ...product };
    } else {
      list.unshift(product);
    }
    this.set(STORAGE_KEYS.PRODUCTS, list);
    
    // Background persistence
    this.postEntityToServer('product', product);
    upsertProductInFirestore(product).catch(err => {
      console.warn('[StoreService] Product background sync notice:', err);
    });
    return list;
  }

  async saveProductVerified(product: Product): Promise<SaveResult<Product>> {
    let verifiedInCloud = false;

    try {
      await upsertProductInFirestore(product);
      verifiedInCloud = true;
    } catch (err: any) {
      console.warn('Firestore product upsert error:', err);
    }

    const list = this.getProducts();
    const index = list.findIndex(p => p.id === product.id || (product.slug && p.slug === product.slug));
    if (index >= 0) {
      list[index] = { ...list[index], ...product };
    } else {
      list.unshift(product);
    }
    this.set(STORAGE_KEYS.PRODUCTS, list);
    this.postEntityToServer('product', product);

    return {
      success: true,
      data: product,
      updatedList: list,
      verifiedInCloud: verifiedInCloud,
      verifiedInLocalStorage: true,
      timestamp: new Date().toISOString()
    };
  }

  deleteProduct(id: string): Product[] {
    const list = this.getProducts().filter(p => p.id !== id);
    this.set(STORAGE_KEYS.PRODUCTS, list);
    this.deleteEntityOnServer('product', id);
    deleteProductInFirestore(id).catch(err => console.warn('Firestore product delete warning:', err));
    return list;
  }

  async deleteProductVerified(id: string): Promise<DeleteResult<Product>> {
    let verifiedInCloud = false;

    try {
      await deleteProductInFirestore(id);
      verifiedInCloud = true;
    } catch (err: any) {
      console.warn('Firestore product delete error:', err);
    }

    const list = this.getProducts().filter(p => p.id !== id);
    this.set(STORAGE_KEYS.PRODUCTS, list);
    this.deleteEntityOnServer('product', id);

    return {
      success: true,
      updatedList: list,
      verifiedInCloud: verifiedInCloud,
      timestamp: new Date().toISOString()
    };
  }

  duplicateProduct(id: string): Product | undefined {
    const original = this.getProductById(id);
    if (!original) return undefined;

    const dup: Product = {
      ...original,
      id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Math.floor(Math.random() * 1000)}`,
      salesCount: 0,
      reviewCount: 0,
      rating: 5.0,
      published: false,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    this.saveProduct(dup);
    return dup;
  }

  // --- REVIEWS ---
  setReviews(reviews: Review[]): void { 
    this.set(STORAGE_KEYS.REVIEWS, reviews);
    this.postEntityToServer('reviews', reviews);
  }

  getReviews(): Review[] {
    const reviews = this.get<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    const demoIds = ['rev-1', 'rev-2', 'rev-3'];
    return reviews.filter(r => !demoIds.includes(r.id));
  }

  getProductReviews(productId: string): Review[] {
    return this.getReviews().filter(r => r.productId === productId && r.status === 'approved');
  }

  hasUserPurchasedProduct(userId?: string, userEmail?: string, productId?: string): boolean {
    if (!productId) return false;
    const orders = this.getOrders();
    return orders.some(o => {
      const matchesUser = (userId && o.userId === userId) || (userEmail && o.customerEmail?.toLowerCase() === userEmail.toLowerCase());
      if (!matchesUser) return false;
      return o.items.some(item => item.productId === productId);
    });
  }

  hasUserReviewedProduct(userId?: string, userEmail?: string, productId?: string): boolean {
    if (!productId) return false;
    const reviews = this.getReviews();
    return reviews.some(r => {
      const matchesUser = (userId && r.userId === userId) || (userEmail && r.userEmail?.toLowerCase() === userEmail.toLowerCase());
      return matchesUser && r.productId === productId;
    });
  }

  addReview(review: Omit<Review, 'id' | 'date' | 'status'>): Review {
    const isPurchased = this.hasUserPurchasedProduct(review.userId, review.userEmail, review.productId);
    const newRev: Review = {
      ...review,
      id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      date: new Date().toISOString().split('T')[0],
      status: 'approved',
      verifiedPurchase: isPurchased
    };

    const list = this.getReviews();
    list.unshift(newRev);
    this.set(STORAGE_KEYS.REVIEWS, list);

    const prodReviews = list.filter(r => r.productId === review.productId && r.status === 'approved');
    const totalRating = prodReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = prodReviews.length > 0 ? Number((totalRating / prodReviews.length).toFixed(1)) : 5.0;

    const prod = this.getProductById(review.productId);
    if (prod) {
      prod.rating = avgRating;
      prod.reviewCount = prodReviews.length;
      this.saveProduct(prod);
    }

    this.postEntityToServer('review', newRev);
    upsertReviewInFirestore(newRev).catch(err => console.warn('Firestore review upsert warning:', err));
    return newRev;
  }

  updateReviewStatus(id: string, status: 'approved' | 'pending' | 'hidden'): Review[] {
    const list = this.getReviews();
    const rev = list.find(r => r.id === id);
    if (rev) {
      rev.status = status;
      this.set(STORAGE_KEYS.REVIEWS, list);
      this.postEntityToServer('review', rev);
      upsertReviewInFirestore(rev).catch(err => console.warn('Firestore review status update warning:', err));
    }
    return list;
  }

  deleteReview(id: string): Review[] {
    const list = this.getReviews().filter(r => r.id !== id);
    this.set(STORAGE_KEYS.REVIEWS, list);
    this.deleteEntityOnServer('review', id);
    deleteReviewInFirestore(id).catch(err => console.warn('Firestore review delete warning:', err));
    return list;
  }

  // --- COUPONS ---
  setCoupons(coupons: Coupon[]): void { 
    this.set(STORAGE_KEYS.COUPONS, coupons);
    this.postEntityToServer('coupons', coupons);
  }

  getCoupons(): Coupon[] {
    return this.get<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
  }

  saveCoupon(coupon: Coupon): Coupon[] {
    const list = this.getCoupons();
    const idx = list.findIndex(c => c.id === coupon.id || c.code.toUpperCase() === coupon.code.toUpperCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...coupon };
    } else {
      list.unshift(coupon);
    }
    this.set(STORAGE_KEYS.COUPONS, list);
    this.postEntityToServer('coupon', coupon);
    upsertCouponInFirestore(coupon).catch(err => console.warn('Firestore coupon upsert warning:', err));
    return list;
  }

  async saveCouponVerified(coupon: Coupon): Promise<SaveResult<Coupon>> {
    let verifiedInCloud = false;
    try {
      await upsertCouponInFirestore(coupon);
      verifiedInCloud = true;
    } catch (err: any) {
      console.warn('Firestore coupon upsert error:', err);
    }
    
    const list = this.getCoupons();
    const idx = list.findIndex(c => c.id === coupon.id || c.code.toUpperCase() === coupon.code.toUpperCase());
    if (idx >= 0) list[idx] = { ...list[idx], ...coupon };
    else list.unshift(coupon);
    this.set(STORAGE_KEYS.COUPONS, list);
    this.postEntityToServer('coupon', coupon);

    return {
      success: true,
      data: coupon,
      updatedList: list,
      verifiedInCloud: verifiedInCloud,
      verifiedInLocalStorage: true,
      timestamp: new Date().toISOString()
    };
  }

  deleteCoupon(id: string): Coupon[] {
    const list = this.getCoupons().filter(c => c.id !== id);
    this.set(STORAGE_KEYS.COUPONS, list);
    this.deleteEntityOnServer('coupon', id);
    deleteCouponInFirestore(id).catch(err => console.warn('Firestore coupon delete warning:', err));
    return list;
  }

  async deleteCouponVerified(id: string): Promise<DeleteResult<Coupon>> {
    const list = this.getCoupons().filter(c => c.id !== id);
    this.set(STORAGE_KEYS.COUPONS, list);
    this.deleteEntityOnServer('coupon', id);
    await deleteCouponInFirestore(id).catch(err => console.warn('Firestore coupon delete warning:', err));

    return {
      success: true,
      updatedList: list,
      verifiedInCloud: true,
      timestamp: new Date().toISOString()
    };
  }

  verifyCoupon(code: string, subtotal: number): { valid: boolean; coupon?: Coupon; error?: string } {
    const coupon = this.getCoupons().find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);
    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code.' };
    }
    if (subtotal < coupon.minPurchase) {
      const currencySymbol = this.getSettings().currencySymbol || '$';
      return { valid: false, error: `Minimum purchase of ${currencySymbol}${coupon.minPurchase} required for this coupon.` };
    }
    if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
      return { valid: false, error: 'Coupon code has expired.' };
    }
    if (coupon.timesUsed >= coupon.usageLimit) {
      return { valid: false, error: 'Coupon usage limit reached.' };
    }
    return { valid: true, coupon };
  }

  // --- ORDERS & PURCHASES ---
  setOrders(orders: Order[]): void { 
    this.set(STORAGE_KEYS.ORDERS, orders);
    this.postEntityToServer('orders', orders);
  }

  getOrders(): Order[] {
    return this.get<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }

  getCustomerOrders(userId: string): Order[] {
    return this.getOrders().filter(o => o.userId === userId);
  }

  getOrderById(id: string): Order | undefined {
    return this.getOrders().find(o => o.id === id);
  }

  findOrderByQuery(query: string, userId?: string): Order | undefined {
    if (!query || !query.trim()) return undefined;
    const cleanQuery = query.trim().replace(/^#/, '').toLowerCase();
    const orders = this.getOrders();

    return orders.find(o => {
      const oId = (o.id || '').toLowerCase();
      const oNum = (o.orderNumber || '').replace(/^#/, '').toLowerCase();
      const oTrx = (o.transactionId || '').toLowerCase();
      const oToken = (o.downloadToken || '').toLowerCase();
      
      const isMatch = oId === cleanQuery || 
                      oNum === cleanQuery || 
                      oId.includes(cleanQuery) || 
                      oNum.includes(cleanQuery) || 
                      (oTrx && oTrx === cleanQuery) || 
                      (oToken && oToken === cleanQuery);
      
      if (!isMatch) return false;
      return true;
    });
  }

  async fetchOrderRealtime(query: string): Promise<{ success: boolean; order?: Order; error?: string; timestamp: string }> {
    if (!query || !query.trim()) {
      return { success: false, error: 'Please provide an Order ID or Order Number.', timestamp: new Date().toISOString() };
    }

    try {
      // First check Firestore directly for fresh data
      const dbOrders = await fetchOrdersFromFirestore().catch(() => []);
      if (dbOrders && dbOrders.length > 0) {
        this.setOrders(dbOrders);
      }

      // Query server tracking endpoint if available
      try {
        const cleanParam = encodeURIComponent(query.trim());
        const res = await fetch(`/api/store/order/track/${cleanParam}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.data) {
            return {
              success: true,
              order: json.data,
              timestamp: json.timestamp || new Date().toISOString()
            };
          }
        }
      } catch (e) {
        // Fall back to memory
      }

      const localMatch = this.findOrderByQuery(query);
      if (localMatch) {
        return {
          success: true,
          order: localMatch,
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: false,
        error: `Order '${query.trim()}' was not found. Please double-check your Order ID or Order Number.`,
        timestamp: new Date().toISOString()
      };
    } catch (e: any) {
      const localMatch = this.findOrderByQuery(query);
      if (localMatch) {
        return {
          success: true,
          order: localMatch,
          timestamp: new Date().toISOString()
        };
      }
      return {
        success: false,
        error: e.message || 'Failed to fetch real-time order status.',
        timestamp: new Date().toISOString()
      };
    }
  }

  async createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'downloadToken'>): Promise<Order> {
    const timestamp = Date.now();
    const orderNumber = `SC-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${timestamp}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      downloadToken: `dl-${Math.random().toString(36).substring(2, 12)}`
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.set(STORAGE_KEYS.ORDERS, orders);

    // Increment sales count for each product
    const products = this.getProducts();
    orderData.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        prod.salesCount = (prod.salesCount || 0) + 1;
      }
    });
    this.set(STORAGE_KEYS.PRODUCTS, products);

    // Update user stats
    const users = this.getUsers();
    const user = users.find(u => u.id === orderData.userId || (u.email && u.email.toLowerCase() === orderData.customerEmail.toLowerCase()));
    if (user) {
      user.totalOrders = (user.totalOrders || 0) + 1;
      user.totalSpent = (user.totalSpent || 0) + newOrder.total;
      this.set(STORAGE_KEYS.USERS, users);
    }

    // Update coupon usage if used
    if (orderData.couponCode) {
      const coupons = this.getCoupons();
      const c = coupons.find(cp => cp.code.toUpperCase() === orderData.couponCode?.toUpperCase());
      if (c) {
        c.timesUsed += 1;
        this.set(STORAGE_KEYS.COUPONS, coupons);
        this.postEntityToServer('coupon', c);
        upsertCouponInFirestore(c).catch(err => console.warn('Firestore coupon usage update warning:', err));
      }
    }

    this.postEntityToServer('order', newOrder);
    await upsertOrderInFirestore(newOrder).catch(err => console.warn('Firestore order upsert error:', err));
    return newOrder;
  }

  async updateOrder(order: Order): Promise<Order> {
    const list = this.getOrders();
    const index = list.findIndex(o => o.id === order.id);
    if (index !== -1) {
      list[index] = order;
    } else {
      list.unshift(order);
    }
    this.set(STORAGE_KEYS.ORDERS, list);
    this.postEntityToServer('order', order);
    await upsertOrderInFirestore(order).catch(err => console.warn('Firestore order update error:', err));
    return order;
  }

  async updateOrderStatus(orderId: string, status: Order['orderStatus']): Promise<Order[]> {
    const list = this.getOrders();
    const order = list.find(o => o.id === orderId);
    if (order) {
      order.orderStatus = status;
      order.paymentStatus = status === 'Paid' || status === 'Completed' || status === 'Approved' ? 'Paid' : status;
      this.set(STORAGE_KEYS.ORDERS, list);
      this.postEntityToServer('order', order);
      await upsertOrderInFirestore(order).catch(err => console.warn('Firestore order status update error:', err));
    }
    return list;
  }

  async deleteOrder(orderId: string): Promise<Order[]> {
    const list = this.getOrders().filter(o => o.id !== orderId);
    this.set(STORAGE_KEYS.ORDERS, list);
    this.deleteEntityOnServer('order', orderId);
    await deleteOrderInFirestore(orderId).catch(err => console.warn('Firestore order delete error:', err));
    return list;
  }

  // --- DOWNLOADS LIBRARY ---
  getCustomerDownloads(userId: string): DownloadItem[] {
    const userOrders = this.getCustomerOrders(userId).filter(o => o.orderStatus === 'Completed' || o.orderStatus === 'Approved' || o.paymentStatus === 'Paid');
    const downloads: DownloadItem[] = [];

    userOrders.forEach(order => {
      order.items.forEach(item => {
        const product = this.getProductById(item.productId);
        downloads.push({
          id: `dl-${order.id}-${item.productId}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          productId: item.productId,
          productName: item.productName,
          categoryName: item.categoryName,
          thumbnail: item.thumbnail,
          fileFormat: product?.fileFormat || 'ZIP Archive',
          fileSize: item.fileSize || product?.fileSize || '25 MB',
          version: item.version || product?.version || 'v1.0.0',
          purchaseDate: order.createdAt,
          downloadCount: 1,
          maxDownloads: 10,
          downloadUrl: item.downloadUrl || product?.downloadFileUrl || '#',
          downloadFileName: product?.downloadFileName || `${item.productName.toLowerCase().replace(/\s+/g, '-')}.zip`
        });
      });
    });

    return downloads;
  }

  // --- USERS & ADMINS ---
  getUsers(): UserProfile[] {
    const list = this.get<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    let modified = false;
    const cleaned = list.map(u => {
      if (u.id === 'user-admin-1' && u.email !== 'mdsayed8877654566@gmail.com') {
        modified = true;
        return { ...u, email: 'mdsayed8877654566@gmail.com' };
      }
      if (u.email.toLowerCase() !== 'mdsayed8877654566@gmail.com' && (u.role === 'super_admin' || u.role === 'admin' || u.role === 'editor')) {
        modified = true;
        return { ...u, role: 'customer' as const };
      }
      return u;
    });
    if (modified) {
      this.set(STORAGE_KEYS.USERS, cleaned, true);
    }
    return cleaned;
  }

  setUsers(users: UserProfile[]): void {
    this.set(STORAGE_KEYS.USERS, users);
    this.postEntityToServer('users', users);
  }

  saveUser(user: UserProfile): UserProfile[] {
    const list = this.getUsers();
    const idx = list.findIndex(u => u.id === user.id || (user.email && u.email.toLowerCase() === user.email.toLowerCase()));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    this.set(STORAGE_KEYS.USERS, list);
    this.postEntityToServer('user', user);
    upsertUserInFirestore(user).catch(err => console.warn('Firestore user upsert error:', err));
    return list;
  }

  async saveUserVerified(user: UserProfile): Promise<SaveResult<UserProfile>> {
    let verifiedInCloud = false;

    try {
      await upsertUserInFirestore(user);
      verifiedInCloud = true;
    } catch (err: any) {
      console.warn('Firestore user upsert error:', err);
    }
    
    const list = this.getUsers();
    const idx = list.findIndex(u => u.id === user.id || (user.email && u.email.toLowerCase() === user.email.toLowerCase()));
    if (idx >= 0) list[idx] = { ...list[idx], ...user };
    else list.push(user);
    this.set(STORAGE_KEYS.USERS, list);
    this.postEntityToServer('user', user);

    return {
      success: true,
      data: user,
      updatedList: list,
      verifiedInCloud: verifiedInCloud,
      verifiedInLocalStorage: true,
      timestamp: new Date().toISOString()
    };
  }

  toggleUserStatus(userId: string): UserProfile[] {
    const list = this.getUsers();
    const user = list.find(u => u.id === userId);
    if (user) {
      user.status = user.status === 'active' ? 'disabled' : 'active';
      this.set(STORAGE_KEYS.USERS, list);
      this.postEntityToServer('user', user);
      upsertUserInFirestore(user).catch(err => console.warn('Firestore user toggle error:', err));
    }
    return list;
  }

  deleteUser(userId: string): UserProfile[] {
    const list = this.getUsers().filter(u => u.id !== userId);
    this.set(STORAGE_KEYS.USERS, list);
    this.deleteEntityOnServer('user', userId);
    deleteUserInFirestore(userId).catch(err => console.warn('Firestore user delete error:', err));
    return list;
  }

  async deleteUserVerified(userId: string): Promise<DeleteResult<UserProfile>> {
    const list = this.getUsers().filter(u => u.id !== userId);
    this.set(STORAGE_KEYS.USERS, list);
    this.deleteEntityOnServer('user', userId);
    try {
      await deleteUserInFirestore(userId);
    } catch (err) {
      console.warn('Firestore user delete error:', err);
    }
    return { success: true, updatedList: list, verifiedInCloud: true, timestamp: new Date().toISOString() };
  }

  // --- PERMISSION TEMPLATES ---
  getPermissionTemplates(): PermissionTemplate[] {
    const list = this.get<PermissionTemplate[]>(STORAGE_KEYS.PERMISSION_TEMPLATES, []);
    if (list.length === 0) {
      const defaults: PermissionTemplate[] = [
        { id: 'tpl-1', name: 'Junior Moderator', permissions: ['manage_reviews', 'manage_customers'] },
        { id: 'tpl-2', name: 'Senior Moderator', permissions: ['manage_products', 'manage_orders', 'manage_customers', 'manage_categories', 'manage_coupons', 'manage_reviews', 'manage_cms'] }
      ];
      this.set(STORAGE_KEYS.PERMISSION_TEMPLATES, defaults, true);
      return defaults;
    }
    return list;
  }

  savePermissionTemplate(template: PermissionTemplate): PermissionTemplate[] {
    const list = this.getPermissionTemplates();
    const idx = list.findIndex(t => t.id === template.id);
    if (idx >= 0) {
      list[idx] = template;
    } else {
      list.push(template);
    }
    this.set(STORAGE_KEYS.PERMISSION_TEMPLATES, list);
    this.postEntityToServer('permissionTemplate', template);
    upsertPermissionTemplateInFirestore(template).catch(err => console.warn('Firestore template upsert error:', err));
    return list;
  }

  deletePermissionTemplate(id: string): PermissionTemplate[] {
    const list = this.getPermissionTemplates().filter(t => t.id !== id);
    this.set(STORAGE_KEYS.PERMISSION_TEMPLATES, list);
    this.deleteEntityOnServer('permissionTemplate', id);
    deletePermissionTemplateInFirestore(id).catch(err => console.warn('Firestore template delete error:', err));
    return list;
  }

  // --- SITE SETTINGS ---
  getSettings(): SiteSettings {
    const s = this.get<SiteSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    return {
      ...INITIAL_SETTINGS,
      ...s,
      primaryColor: s.primaryColor || INITIAL_SETTINGS.primaryColor || '#ea580c',
      themePreset: s.themePreset || INITIAL_SETTINGS.themePreset || 'orange'
    };
  }

  saveSettings(settings: SiteSettings): SiteSettings {
    const updated: SiteSettings = {
      ...this.getSettings(),
      ...settings,
      primaryColor: settings.primaryColor || '#ea580c'
    };
    this.set(STORAGE_KEYS.SETTINGS, updated);
    
    if (typeof window !== 'undefined') {
      applyThemeColor(updated.primaryColor);
      updateDynamicBrowserMeta(updated);
    }
    
    // Background persistence
    this.postEntityToServer('settings', updated);
    upsertSettingsInFirestore(updated).catch(err => console.warn('Firestore settings upsert error:', err));
    return updated;
  }

  async saveSettingsVerified(settings: SiteSettings): Promise<SaveResult<SiteSettings>> {
    const updated: SiteSettings = {
      ...this.getSettings(),
      ...settings,
      primaryColor: settings.primaryColor || '#ea580c'
    };
    
    let verifiedInCloud = false;

    try {
      await upsertSettingsInFirestore(updated);
      verifiedInCloud = true;
    } catch (err: any) {
      console.warn('Firestore settings upsert error:', err);
    }

    this.set(STORAGE_KEYS.SETTINGS, updated);
    if (typeof window !== 'undefined') {
      applyThemeColor(updated.primaryColor);
      updateDynamicBrowserMeta(updated);
      window.dispatchEvent(new Event('studio_collection_store_change'));
    }

    this.postEntityToServer('settings', updated);
    
    return {
      success: true,
      data: updated,
      verifiedInCloud: verifiedInCloud,
      verifiedInLocalStorage: true,
      timestamp: new Date().toISOString()
    };
  }

  // --- WISHLIST ---
  getWishlist(userId: string = 'guest'): string[] {
    return this.get<string[]>(STORAGE_KEYS.WISHLIST + '_guest', []);
  }

  toggleWishlist(productId: string, userId: string = 'guest'): string[] {
    const list = this.getWishlist('guest');
    const exists = list.includes(productId);
    const updated = exists ? list.filter(id => id !== productId) : [...list, productId];
    this.set(STORAGE_KEYS.WISHLIST + '_guest', updated);
    return updated;
  }

  // --- CART ---
  getCart(userId: string = 'guest'): CartItem[] {
    return this.get<CartItem[]>(STORAGE_KEYS.CART + '_guest', []);
  }

  saveCart(cart: CartItem[], userId: string = 'guest'): void {
    this.set(STORAGE_KEYS.CART + '_guest', cart);
  }

  // --- SERVER BACKUP UTILITIES ---
  async getServerBackups(): Promise<Array<{ filename: string; size: number; createdAt: string }>> {
    try {
      const res = await fetch('/api/store/backups');
      if (!res.ok) return [];
      const data = await res.json();
      return data.success && Array.isArray(data.data) ? data.data : [];
    } catch (e) {
      return [];
    }
  }

  async restoreServerBackup(filename: string): Promise<boolean> {
    try {
      const res = await fetch('/api/store/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.success) {
        await this.syncWithServer();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // --- FULL DATABASE BACKUP EXPORT & RESTORE ---
  exportFullDatabaseJson(): string {
    const payload = {
      app: 'Studio Collection',
      version: '3.0',
      exportedAt: new Date().toISOString(),
      data: {
        categories: this.getCategories(),
        products: this.getProducts(),
        orders: this.getOrders(),
        coupons: this.getCoupons(),
        reviews: this.getReviews(),
        users: this.getUsers(),
        settings: this.getSettings(),
        permissionTemplates: this.getPermissionTemplates()
      }
    };
    return JSON.stringify(payload, null, 2);
  }

  async importFullDatabaseJson(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      const data = parsed.data || parsed;
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON format for database restore.');
      }

      if (Array.isArray(data.categories) && data.categories.length > 0) {
        this.setCategories(data.categories);
        for (const c of data.categories) {
          await upsertCategoryInFirestore(c).catch(() => {});
        }
      }

      if (Array.isArray(data.products) && data.products.length > 0) {
        this.setProducts(data.products);
        for (const p of data.products) {
          await upsertProductInFirestore(p).catch(() => {});
        }
      }

      if (Array.isArray(data.orders) && data.orders.length > 0) {
        this.setOrders(data.orders);
        for (const o of data.orders) {
          await upsertOrderInFirestore(o).catch(() => {});
        }
      }

      if (Array.isArray(data.coupons) && data.coupons.length > 0) {
        this.setCoupons(data.coupons);
        for (const cp of data.coupons) {
          await upsertCouponInFirestore(cp).catch(() => {});
        }
      }

      if (Array.isArray(data.reviews) && data.reviews.length > 0) {
        this.setReviews(data.reviews);
        for (const r of data.reviews) {
          await upsertReviewInFirestore(r).catch(() => {});
        }
      }

      if (Array.isArray(data.users) && data.users.length > 0) {
        this.setUsers(data.users);
      }

      if (data.settings && typeof data.settings === 'object') {
        await this.saveSettingsVerified(data.settings);
      }

      if (Array.isArray(data.permissionTemplates) && data.permissionTemplates.length > 0) {
        this.set(STORAGE_KEYS.PERMISSION_TEMPLATES, data.permissionTemplates);
      }

      this.updateMasterBackup();
      await this.postFullSyncToServer();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('studio_collection_store_change'));
      }

      return { success: true, message: 'Database backup imported and synchronized successfully!' };
    } catch (e: any) {
      console.error('Import database error:', e);
      return { success: false, message: e.message || 'Failed to parse database backup file.' };
    }
  }

  async forcePushAllToFirestore(): Promise<{
    categoriesCount: number;
    productsCount: number;
    ordersCount: number;
    couponsCount: number;
    reviewsCount: number;
    usersCount: number;
    settingsSaved: boolean;
  }> {
    const cats = this.getCategories();
    for (const c of cats) {
      await upsertCategoryInFirestore(c).catch(() => {});
    }

    const prods = this.getProducts();
    for (const p of prods) {
      await upsertProductInFirestore(p).catch(() => {});
    }

    const ords = this.getOrders();
    for (const o of ords) {
      await upsertOrderInFirestore(o).catch(() => {});
    }

    const coups = this.getCoupons();
    for (const cp of coups) {
      await upsertCouponInFirestore(cp).catch(() => {});
    }

    const revs = this.getReviews();
    for (const r of revs) {
      await upsertReviewInFirestore(r).catch(() => {});
    }

    const users = this.getUsers();
    for (const u of users) {
      await upsertUserInFirestore(u).catch(() => {});
    }

    await upsertSettingsInFirestore(this.getSettings()).catch(() => {});

    return {
      categoriesCount: cats.length,
      productsCount: prods.length,
      ordersCount: ords.length,
      couponsCount: coups.length,
      reviewsCount: revs.length,
      usersCount: users.length,
      settingsSaved: true
    };
  }

  // --- RESET ONLY SITE THEME/SETTINGS (NEVER WIPES PRODUCTS OR DATA) ---
  resetSettingsToDefault(): SiteSettings {
    const defaults = { ...INITIAL_SETTINGS };
    this.set(STORAGE_KEYS.SETTINGS, defaults);
    if (typeof window !== 'undefined') {
      applyThemeColor(defaults.primaryColor);
      updateDynamicBrowserMeta(defaults);
    }
    this.postEntityToServer('settings', defaults);
    upsertSettingsInFirestore(defaults).catch(() => {});
    return defaults;
  }
}

export const storeService = new StoreService();
