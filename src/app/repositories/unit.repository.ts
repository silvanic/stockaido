import { Injectable } from '@angular/core';
import { CustomUnit } from '../models/unit.model';

/**
 * Service de persistance des unités personnalisées avec IndexedDB
 */
@Injectable({
  providedIn: 'root'
})
export class UnitRepository {
  private dbName = 'StockaidoUnits';
  private storeName = 'units';
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initDatabase();
  }

  /**
   * Attend que la base soit initialisée et retourne la connexion
   */
  private async ensureDb(): Promise<IDBDatabase> {
    await this.dbReady;
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error('Erreur ouverture IndexedDB (units):', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          this.db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async addUnit(name: string): Promise<CustomUnit> {
    const unit: CustomUnit = {
      id: this.generateId(),
      name,
      createdAt: new Date()
    };

    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(unit);

      request.onsuccess = () => resolve(unit);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUnits(): Promise<CustomUnit[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result.sort((a, b) => a.name.localeCompare(b.name)));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteUnit(id: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Insère une unité telle quelle (id préservé), utilisé pour l'import de données
   */
  async putUnit(unit: CustomUnit): Promise<CustomUnit> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(unit);

      request.onsuccess = () => resolve(unit);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Vide complètement les unités personnalisées (utilisé lors d'un import)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
