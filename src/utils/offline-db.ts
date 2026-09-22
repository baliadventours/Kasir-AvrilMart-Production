/**
 * Offline Database Manager using IndexedDB with fallback protection.
 * Provides persistent offline storage for Products, Categories, Sales, Settings, and Auth session.
 * IndexedDB has virtually unlimited storage capacity (hundreds of MBs) compared to localStorage (5MB limit).
 */

import { Product, Sale, AppSettings } from "../app/types";

const DB_NAME = "avrilmart_offline_cache";
const DB_VERSION = 1;

const STORES = {
  PRODUCTS: "products_store",
  CATEGORIES: "categories_store",
  SALES: "sales_store",
  SETTINGS: "settings_store",
  USER: "user_store",
  QUEUE: "queue_store",
} as const;

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported in this environment"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      });
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.warn("IndexedDB open error:", (event.target as IDBOpenDBRequest).error);
      dbPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

// Generic get from store
async function getItem<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result !== undefined ? request.result : null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn(`IndexedDB read error (${storeName}):`, err);
    return null;
  }
}

// Generic set to store
async function setItem<T>(storeName: string, key: string, value: T): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => {
        console.warn(`IndexedDB write error (${storeName}):`, e);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn(`IndexedDB set error (${storeName}):`, err);
    return false;
  }
}

// Generic remove from store
async function removeItem(storeName: string, key: string): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn(`IndexedDB remove error (${storeName}):`, err);
    return false;
  }
}

// Generic clear store
async function clearStore(storeName: string): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn(`IndexedDB clear error (${storeName}):`, err);
    return false;
  }
}

export const offlineDB = {
  // ─── Products ──────────────────────────────────────────
  async saveProducts(products: Product[]): Promise<void> {
    await setItem(STORES.PRODUCTS, "all", products);
    await setItem(STORES.PRODUCTS, "timestamp", Date.now());
  },

  async loadProducts(): Promise<Product[] | null> {
    return getItem<Product[]>(STORES.PRODUCTS, "all");
  },

  // ─── Categories ────────────────────────────────────────
  async saveCategories(categories: any[]): Promise<void> {
    await setItem(STORES.CATEGORIES, "all", categories);
    await setItem(STORES.CATEGORIES, "timestamp", Date.now());
  },

  async loadCategories(): Promise<any[] | null> {
    return getItem<any[]>(STORES.CATEGORIES, "all");
  },

  // ─── Sales ─────────────────────────────────────────────
  async saveSales(sales: Sale[]): Promise<void> {
    await setItem(STORES.SALES, "all", sales);
    await setItem(STORES.SALES, "timestamp", Date.now());
  },

  async loadSales(): Promise<Sale[] | null> {
    return getItem<Sale[]>(STORES.SALES, "all");
  },

  // ─── Settings ──────────────────────────────────────────
  async saveSettings(settings: AppSettings): Promise<void> {
    await setItem(STORES.SETTINGS, "current", settings);
    await setItem(STORES.SETTINGS, "timestamp", Date.now());
  },

  async loadSettings(): Promise<AppSettings | null> {
    return getItem<AppSettings>(STORES.SETTINGS, "current");
  },

  // ─── User Profile (for offline sessions) ───────────────
  async saveUser(user: { id: string; email: string; name: string; role: "admin" | "cashier" }): Promise<void> {
    await setItem(STORES.USER, "current", user);
  },

  async loadUser(): Promise<{ id: string; email: string; name: string; role: "admin" | "cashier" } | null> {
    return getItem(STORES.USER, "current");
  },

  async clearUser(): Promise<void> {
    await removeItem(STORES.USER, "current");
  },

  // ─── Offline Queue ─────────────────────────────────────
  async saveQueue(queue: any[]): Promise<void> {
    await setItem(STORES.QUEUE, "items", queue);
  },

  async loadQueue(): Promise<any[] | null> {
    return getItem<any[]>(STORES.QUEUE, "items");
  },

  // ─── Timestamp / Metadata ──────────────────────────────
  async getLastSync(type: "products" | "sales" | "categories" | "settings"): Promise<number | null> {
    const storeMap: Record<string, string> = {
      products: STORES.PRODUCTS,
      sales: STORES.SALES,
      categories: STORES.CATEGORIES,
      settings: STORES.SETTINGS,
    };
    return getItem<number>(storeMap[type], "timestamp");
  },

  // ─── Clear All Cache ───────────────────────────────────
  async clearAll(): Promise<void> {
    await Promise.all([
      clearStore(STORES.PRODUCTS),
      clearStore(STORES.CATEGORIES),
      clearStore(STORES.SALES),
      clearStore(STORES.SETTINGS),
      clearStore(STORES.USER),
      clearStore(STORES.QUEUE),
    ]);
  },
};
