import type { Vendor } from "@/lib/types";

const DATABASE_NAME = "khausafe-offline";
const DATABASE_VERSION = 1;
const STORE_NAME = "app-cache";

type CacheKey = "vendors" | "discovery-preferences";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeCache(key: CacheKey, value: unknown) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function readCache<T>(key: CacheKey): Promise<T | null> {
  const database = await openDatabase();
  const result = await new Promise<T | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return result;
}

export type DiscoveryPreferences = {
  city: string;
  area: string;
  category: Vendor["category"] | "all";
  certifiedOnly: boolean;
  query: string;
};

export function cacheVendors(vendors: Vendor[]) {
  return writeCache("vendors", { updatedAt: new Date().toISOString(), vendors });
}

export function cacheDiscoveryPreferences(preferences: DiscoveryPreferences) {
  return writeCache("discovery-preferences", preferences);
}

export function getCachedDiscoveryPreferences() {
  return readCache<DiscoveryPreferences>("discovery-preferences");
}
