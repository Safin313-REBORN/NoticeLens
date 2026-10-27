import { ProcessedNotice, SavedNotice } from '../../types/notice';

const DB_NAME = 'NoticeLensDB';
const DB_VERSION = 1;
const NOTICES_STORE = 'saved_notices';
const SETTINGS_STORE = 'settings';
const LOCAL_STORAGE_KEY = 'noticelens_saved_notices_fallback';

let dbInstance: IDBDatabase | null = null;

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB is not available in this environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(NOTICES_STORE)) {
        db.createObjectStore(NOTICES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open NoticeLens IndexedDB'));
    };
  });
}

/**
 * Saves a processed notice into local persistent storage
 */
export async function saveNotice(notice: ProcessedNotice): Promise<SavedNotice> {
  const hasDeadline = notice.fields.deadline.status !== 'not_found';
  const deadlineDate = hasDeadline ? notice.fields.deadline.value : undefined;

  const record: SavedNotice = {
    id: notice.id,
    title: notice.title || 'Untitled Notice',
    createdAt: new Date().toISOString(),
    notice,
    hasDeadline,
    deadlineDate,
    category: notice.fields.category.value || 'General',
  };

  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(NOTICES_STORE, 'readwrite');
      const store = tx.objectStore(NOTICES_STORE);
      const req = store.put(record);

      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('NoticeLens: IndexedDB unavailable, falling back to localStorage', err);
    saveToLocalStorage(record);
    return record;
  }
}

/**
 * Retrieves all saved notices sorted by newest first
 */
export async function getAllSavedNotices(): Promise<SavedNotice[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(NOTICES_STORE, 'readonly');
      const store = tx.objectStore(NOTICES_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result as SavedNotice[]) || [];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('NoticeLens: Reading from localStorage fallback', err);
    return getFromLocalStorage();
  }
}

/**
 * Gets a specific notice by ID
 */
export async function getSavedNoticeById(id: string): Promise<SavedNotice | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(NOTICES_STORE, 'readonly');
      const store = tx.objectStore(NOTICES_STORE);
      const req = store.get(id);

      req.onsuccess = () => resolve((req.result as SavedNotice) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const all = getFromLocalStorage();
    return all.find((n) => n.id === id) || null;
  }
}

/**
 * Deletes a saved notice permanently
 */
export async function deleteSavedNotice(id: string): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(NOTICES_STORE, 'readwrite');
      const store = tx.objectStore(NOTICES_STORE);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const all = getFromLocalStorage().filter((n) => n.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    return true;
  }
}

/**
 * Updates notice title
 */
export async function updateSavedNoticeTitle(id: string, newTitle: string): Promise<boolean> {
  const existing = await getSavedNoticeById(id);
  if (!existing) return false;

  existing.title = newTitle;
  existing.notice.title = newTitle;
  existing.notice.updatedAt = new Date().toISOString();

  await saveNotice(existing.notice);
  return true;
}

/**
 * Clears all saved notices
 */
export async function clearAllSavedNotices(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(NOTICES_STORE, 'readwrite');
      const store = tx.objectStore(NOTICES_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

// Fallback localStorage helpers
function getFromLocalStorage(): SavedNotice[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as SavedNotice[];
  } catch {
    return [];
  }
}

function saveToLocalStorage(record: SavedNotice): void {
  try {
    const list = getFromLocalStorage().filter((n) => n.id !== record.id);
    list.unshift(record);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to write to localStorage', err);
  }
}
