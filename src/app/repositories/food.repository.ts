import { Injectable } from '@angular/core';
import { Food, CreateFoodDTO, UpdateQuantityDTO } from '../models/food.model';

/**
 * Service de persistance des données avec IndexedDB
 * Gère le stockage local des aliments
 */
@Injectable({
  providedIn: 'root'
})
export class FoodRepository {
  private dbName = 'Stockaido';
  private storeName = 'foods';
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

  /**
   * Initialise la base de données IndexedDB
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.error('Erreur ouverture IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialisée');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          const store = this.db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('isFavorite', 'isFavorite', { unique: false });
          console.log('Object Store créé');
        }
      };
    });
  }

  /**
   * Ajoute un nouvel aliment
   */
  async addFood(data: CreateFoodDTO): Promise<Food> {
    const food: Food = {
      id: this.generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(food);

      request.onsuccess = () => {
        console.log('Aliment ajouté:', food.name);
        resolve(food);
      };

      request.onerror = () => {
        console.error('Erreur ajout aliment:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Récupère tous les aliments
   */
  async getAllFoods(): Promise<Food[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const foods = request.result.sort((a, b) => {
          // Trier par lieu de rangement puis par nom
          const locA = a.location || '';
          const locB = b.location || '';
          if (locA !== locB) {
            return locA.localeCompare(locB);
          }
          return a.name.localeCompare(b.name);
        });
        resolve(foods);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Récupère un aliment par ID
   */
  async getFoodById(id: string): Promise<Food | undefined> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Cherche des aliments par nom (recherche partiële)
   */
  async searchFoods(query: string): Promise<Food[]> {
    const allFoods = await this.getAllFoods();
    const lowerQuery = query.toLowerCase();
    return allFoods.filter(food => 
      food.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Met à jour un aliment
   */
  async updateFood(id: string, updates: Partial<CreateFoodDTO>): Promise<Food> {
    const food = await this.getFoodById(id);
    if (!food) {
      throw new Error(`Aliment avec l'ID ${id} non trouvé`);
    }

    const updated: Food = {
      ...food,
      ...updates,
      id: food.id, // Garder l'ID et les dates
      createdAt: food.createdAt,
      updatedAt: new Date()
    };

    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updated);

      request.onsuccess = () => {
        console.log('Aliment mis à jour:', updated.name);
        resolve(updated);
      };

      request.onerror = () => {
        console.error('Erreur mise à jour:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Met à jour rapidement la quantité
   */
  async updateQuantity(foodId: string, quantity: number): Promise<Food> {
    return this.updateFood(foodId, { quantity });
  }

  /**
   * Supprime un aliment
   */
  async deleteFood(id: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Aliment supprimé');
        resolve();
      };

      request.onerror = () => {
        console.error('Erreur suppression:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Récupère les favoris
   */
  async getFavorites(): Promise<Food[]> {
    const allFoods = await this.getAllFoods();
    return allFoods.filter(food => food.isFavorite);
  }

  /**
   * Vide complètement la base de données (pour tests/debug)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Base de données vidée');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Insère un aliment tel quel (id/dates préservés), utilisé pour l'import de données
   */
  async putFood(food: Food): Promise<Food> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(food);

      request.onsuccess = () => resolve(food);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
