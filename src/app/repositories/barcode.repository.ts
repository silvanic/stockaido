import { Injectable } from '@angular/core';
import { CachedBarcode } from '../models/cached-barcode.model';

/**
 * Repository pour le cache de codes-barres
 * Gère la persistance en IndexedDB
 */
@Injectable({
  providedIn: 'root'
})
export class BarcodeRepository {
  private dbName = 'Stockaido';
  private storeName = 'barcodeCache';
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;
  private static readonly DB_VERSION = 2; // Version partagée avec FoodRepository

  constructor() {
    this.dbReady = this.initDatabase();
  }

  private async ensureDb(): Promise<IDBDatabase> {
    await this.dbReady;
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, BarcodeRepository.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        // Crée tous les stores partagés de la DB Stockaido (idempotent).
        // Nécessaire car FoodRepository et BarcodeRepository partagent la même DB
        // et une seule des deux requêtes déclenche onupgradeneeded.
        if (!this.db.objectStoreNames.contains('foods')) {
          this.db.createObjectStore('foods', { keyPath: 'id' });
        }
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          const store = this.db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('barcode', 'barcode', { unique: true });
          store.createIndex('lastScanned', 'lastScanned', { unique: false });
        }
      };
    });
  }

  async addOrUpdate(product: CachedBarcode): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], 'readwrite');
      const req = tx.objectStore(this.storeName).put(product);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  async getByBarcode(barcode: string): Promise<CachedBarcode | null> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], 'readonly');
      const index = tx.objectStore(this.storeName).index('barcode');
      const req = index.get(barcode);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result || null);
    });
  }

  async getAll(): Promise<CachedBarcode[]> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], 'readonly');
      const req = tx.objectStore(this.storeName).getAll();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result || []);
    });
  }

  async delete(barcode: string): Promise<void> {
    const db = await this.ensureDb();
    const product = await this.getByBarcode(barcode);
    if (product) {
      return new Promise((resolve, reject) => {
        const tx = db.transaction([this.storeName], 'readwrite');
        const req = tx.objectStore(this.storeName).delete(product.id);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      });
    }
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const all = await this.getAll();
    let count = 0;

    for (const product of all) {
      if (new Date(product.lastScanned) < cutoff) {
        await this.delete(product.barcode);
        count++;
      }
    }
    return count;
  }

  async count(): Promise<number> {
    const all = await this.getAll();
    return all.length;
  }

  async clear(): Promise<void> {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([this.storeName], 'readwrite');
      const req = tx.objectStore(this.storeName).clear();
      req.onerror = () => reject(req.error);
      // Attendre que la transaction soit complète
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
