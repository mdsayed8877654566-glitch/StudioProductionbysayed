import fs from 'fs';
import path from 'path';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_REVIEWS, 
  INITIAL_COUPONS, 
  INITIAL_USERS, 
  INITIAL_ORDERS, 
  INITIAL_SETTINGS 
} from '../src/data/initialData';

export interface StoreDatabase {
  version: number;
  lastUpdated: string;
  categories: any[];
  products: any[];
  orders: any[];
  coupons: any[];
  reviews: any[];
  users: any[];
  settings: any;
  permissionTemplates: any[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'store_database.json');

// In-memory cache for fast read access
let inMemoryDb: StoreDatabase | null = null;

function ensureDirectories(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function getDefaultDatabase(): StoreDatabase {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    categories: INITIAL_CATEGORIES,
    products: INITIAL_PRODUCTS,
    orders: INITIAL_ORDERS,
    coupons: INITIAL_COUPONS,
    reviews: INITIAL_REVIEWS,
    users: INITIAL_USERS,
    settings: INITIAL_SETTINGS,
    permissionTemplates: [
      { id: 'tpl-1', name: 'Junior Moderator', permissions: ['manage_reviews', 'manage_customers'] },
      { id: 'tpl-2', name: 'Senior Moderator', permissions: ['manage_products', 'manage_orders', 'manage_customers', 'manage_categories', 'manage_coupons', 'manage_reviews', 'manage_cms'] }
    ]
  };
}

function saveDbToDisk(db: StoreDatabase, createSnapshot: boolean = false): void {
  try {
    ensureDirectories();
    const tempFile = path.join(DATA_DIR, `store_database.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`);
    const jsonStr = JSON.stringify(db, null, 2);
    
    fs.writeFileSync(tempFile, jsonStr, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    if (createSnapshot) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(BACKUPS_DIR, `backup-${timestamp}.json`);
      fs.writeFileSync(backupFile, jsonStr, 'utf-8');
      cleanupOldBackups();
    }
  } catch (err) {
    console.error('[StoreDB] Error writing database to disk:', err);
  }
}

function cleanupOldBackups(maxKeep: number = 20): void {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return;
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxKeep) {
      for (let i = maxKeep; i < files.length; i++) {
        fs.unlinkSync(path.join(BACKUPS_DIR, files[i].name));
      }
    }
  } catch (e) {
    // ignore cleanup errors
  }
}

export function loadStoreDatabase(): StoreDatabase {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  ensureDirectories();

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);

      if (parsed && typeof parsed === 'object') {
        const defaults = getDefaultDatabase();
        inMemoryDb = {
          version: typeof parsed.version === 'number' ? parsed.version : 1,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : defaults.categories,
          products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : defaults.products,
          orders: Array.isArray(parsed.orders) ? parsed.orders : defaults.orders,
          coupons: Array.isArray(parsed.coupons) ? parsed.coupons : defaults.coupons,
          reviews: Array.isArray(parsed.reviews) ? parsed.reviews : defaults.reviews,
          users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : defaults.users,
          settings: parsed.settings && typeof parsed.settings === 'object' ? { ...defaults.settings, ...parsed.settings } : defaults.settings,
          permissionTemplates: Array.isArray(parsed.permissionTemplates) ? parsed.permissionTemplates : defaults.permissionTemplates
        };
        return inMemoryDb;
      }
    } catch (err) {
      console.error('[StoreDB] Corrupt database file encountered, attempting backup recovery...', err);
      // Try restoring latest backup
      const restored = tryRestoreLatestBackup();
      if (restored) {
        inMemoryDb = restored;
        return inMemoryDb;
      }
    }
  }

  // If no database file or failed to load, initialize defaults and persist
  inMemoryDb = getDefaultDatabase();
  saveDbToDisk(inMemoryDb, true);
  console.log('[StoreDB] Initialized fresh store database with default catalog and settings.');
  return inMemoryDb;
}

function tryRestoreLatestBackup(): StoreDatabase | null {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return null;
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => ({
        path: path.join(BACKUPS_DIR, f),
        time: fs.statSync(path.join(BACKUPS_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 0) {
      const content = fs.readFileSync(files[0].path, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.products)) {
        console.log(`[StoreDB] Successfully recovered database from backup: ${files[0].path}`);
        saveDbToDisk(parsed, false);
        return parsed;
      }
    }
  } catch (e) {
    console.error('[StoreDB] Failed to restore from backup:', e);
  }
  return null;
}

export function getStoreDb(): StoreDatabase {
  return loadStoreDatabase();
}

export function getStoreVersion(): { version: number; lastUpdated: string } {
  const db = loadStoreDatabase();
  return {
    version: db.version,
    lastUpdated: db.lastUpdated
  };
}

export function syncStoreDb(updates: Partial<StoreDatabase>): StoreDatabase {
  const db = loadStoreDatabase();
  let modified = false;

  if (Array.isArray(updates.categories)) {
    db.categories = updates.categories;
    modified = true;
  }
  if (Array.isArray(updates.products)) {
    db.products = updates.products;
    modified = true;
  }
  if (Array.isArray(updates.orders)) {
    db.orders = updates.orders;
    modified = true;
  }
  if (Array.isArray(updates.coupons)) {
    db.coupons = updates.coupons;
    modified = true;
  }
  if (Array.isArray(updates.reviews)) {
    db.reviews = updates.reviews;
    modified = true;
  }
  if (Array.isArray(updates.users)) {
    db.users = updates.users;
    modified = true;
  }
  if (updates.settings && typeof updates.settings === 'object') {
    db.settings = { ...db.settings, ...updates.settings };
    modified = true;
  }
  if (Array.isArray(updates.permissionTemplates)) {
    db.permissionTemplates = updates.permissionTemplates;
    modified = true;
  }

  if (modified) {
    db.version = (db.version || 0) + 1;
    db.lastUpdated = new Date().toISOString();
    inMemoryDb = db;
    saveDbToDisk(db, true);
  }

  return db;
}

export function updateStoreEntity(entityType: string, entityData: any): StoreDatabase {
  const db = loadStoreDatabase();
  let modified = false;

  switch (entityType) {
    case 'category':
    case 'categories': {
      const list = [...db.categories];
      const idx = list.findIndex(c => c.id === entityData.id || c.slug === entityData.slug);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...entityData };
      } else {
        list.push(entityData);
      }
      db.categories = list;
      modified = true;
      break;
    }

    case 'product':
    case 'products': {
      const list = [...db.products];
      const idx = list.findIndex(p => p.id === entityData.id || (entityData.slug && p.slug === entityData.slug));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...entityData };
      } else {
        list.unshift(entityData);
      }
      db.products = list;
      modified = true;
      break;
    }

    case 'order':
    case 'orders': {
      const list = [...db.orders];
      const idx = list.findIndex(o => o.id === entityData.id || o.orderNumber === entityData.orderNumber);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...entityData };
      } else {
        list.unshift(entityData);
      }
      db.orders = list;
      modified = true;
      break;
    }

    case 'coupon':
    case 'coupons': {
      const list = [...db.coupons];
      const idx = list.findIndex(c => c.id === entityData.id || c.code.toUpperCase() === entityData.code.toUpperCase());
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...entityData };
      } else {
        list.unshift(entityData);
      }
      db.coupons = list;
      modified = true;
      break;
    }

    case 'review':
    case 'reviews': {
      const list = [...db.reviews];
      const idx = list.findIndex(r => r.id === entityData.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...entityData };
      } else {
        list.unshift(entityData);
      }
      db.reviews = list;
      modified = true;
      break;
    }

    case 'user':
    case 'users': {
      const list = [...db.users];
      const idx = list.findIndex(u => u.id === entityData.id || (entityData.email && u.email.toLowerCase() === entityData.email.toLowerCase()));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...entityData };
      } else {
        list.push(entityData);
      }
      db.users = list;
      modified = true;
      break;
    }

    case 'settings': {
      db.settings = { ...db.settings, ...entityData };
      modified = true;
      break;
    }

    case 'permissionTemplate':
    case 'permissionTemplates': {
      const list = [...db.permissionTemplates];
      const idx = list.findIndex(t => t.id === entityData.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...entityData };
      } else {
        list.push(entityData);
      }
      db.permissionTemplates = list;
      modified = true;
      break;
    }
  }

  if (modified) {
    db.version = (db.version || 0) + 1;
    db.lastUpdated = new Date().toISOString();
    inMemoryDb = db;
    saveDbToDisk(db, false);
  }

  return db;
}

export function deleteStoreEntity(entityType: string, id: string): StoreDatabase {
  const db = loadStoreDatabase();
  let modified = false;

  switch (entityType) {
    case 'category':
    case 'categories':
      db.categories = db.categories.filter(c => c.id !== id && c.slug !== id);
      modified = true;
      break;

    case 'product':
    case 'products':
      db.products = db.products.filter(p => p.id !== id && p.slug !== id);
      modified = true;
      break;

    case 'order':
    case 'orders':
      db.orders = db.orders.filter(o => o.id !== id && o.orderNumber !== id);
      modified = true;
      break;

    case 'coupon':
    case 'coupons':
      db.coupons = db.coupons.filter(c => c.id !== id && c.code !== id);
      modified = true;
      break;

    case 'review':
    case 'reviews':
      db.reviews = db.reviews.filter(r => r.id !== id);
      modified = true;
      break;

    case 'user':
    case 'users':
      db.users = db.users.filter(u => u.id !== id);
      modified = true;
      break;

    case 'permissionTemplate':
    case 'permissionTemplates':
      db.permissionTemplates = db.permissionTemplates.filter(t => t.id !== id);
      modified = true;
      break;
  }

  if (modified) {
    db.version = (db.version || 0) + 1;
    db.lastUpdated = new Date().toISOString();
    inMemoryDb = db;
    saveDbToDisk(db, false);
  }

  return db;
}

export function getBackupsList(): Array<{ filename: string; size: number; createdAt: string }> {
  try {
    ensureDirectories();
    if (!fs.existsSync(BACKUPS_DIR)) return [];
    return fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => {
        const fullPath = path.join(BACKUPS_DIR, f);
        const stats = fs.statSync(fullPath);
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    return [];
  }
}

export function restoreBackupFile(filename: string): StoreDatabase | null {
  try {
    const fullPath = path.join(BACKUPS_DIR, path.basename(filename));
    if (!fs.existsSync(fullPath)) return null;

    const content = fs.readFileSync(fullPath, 'utf-8');
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      parsed.version = ((parsed.version || 0) + 1);
      parsed.lastUpdated = new Date().toISOString();
      inMemoryDb = parsed;
      saveDbToDisk(parsed, true);
      return parsed;
    }
  } catch (e) {
    console.error('[StoreDB] Error restoring backup:', e);
  }
  return null;
}

export function resetStoreDbToDefaults(): StoreDatabase {
  const defaults = getDefaultDatabase();
  defaults.version = ((inMemoryDb?.version || 1) + 1);
  defaults.lastUpdated = new Date().toISOString();
  inMemoryDb = defaults;
  saveDbToDisk(defaults, true);
  return defaults;
}
