import { Injectable } from '@angular/core';
import { FoodRepository } from '../repositories/food.repository';
import { LocationRepository } from '../repositories/location.repository';
import { UnitRepository } from '../repositories/unit.repository';
import { ShoppingListRepository } from '../repositories/shopping-list.repository';

/**
 * Service de migration de base de données
 * Migre les données depuis les anciennes tables (StockIonic) vers les nouvelles (Stockaido)
 * Complètement transparent pour l'utilisateur
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseMigrationService {
  private migrationsApplied = new Set<string>();

  constructor(
    private foodRepository: FoodRepository,
    private locationRepository: LocationRepository,
    private unitRepository: UnitRepository,
    private shoppingListRepository: ShoppingListRepository
  ) {}

  /**
   * Initialise et lance les migrations
   * Appelé au démarrage de l'application
   */
  init(): void {
    this.runMigrations().catch(err => {
      console.error('Erreur critique lors des migrations:', err);
    });
  }

  /**
   * Exécute toutes les migrations nécessaires
   * Appelé au démarrage de l'application
   */
  async runMigrations(): Promise<void> {
    await this.migrateFromStockIonicToStockaido();
    // Ajouter d'autres migrations futures ici si nécessaire
  }

  /**
   * Migre les données de "StockIonic" (ancienne base) vers "Stockaido" (nouvelle base)
   * Cette migration est appliquée une seule fois
   */
  private async migrateFromStockIonicToStockaido(): Promise<void> {
    const migrationKey = 'StockIonic_to_Stockaido_v1';

    // Vérifier si la migration a déjà été effectuée
    const migrationRecord = await this.getMigrationRecord(migrationKey);
    if (migrationRecord) {
      console.log('Migration "StockIonic → Stockaido" déjà effectuée');
      return;
    }

    console.log('Vérification de migration "StockIonic → Stockaido"...');

    try {
      // Vérifier si la base "StockIonic" existe
      const databases = await this.getIndexedDBDatabaseNames();
      const hasOldDatabase = databases.some(name =>
        name === 'StockIonic' || 
        name === 'StockIonicLocations' || 
        name === 'StockIonicShoppingList' || 
        name === 'StockIonicUnits'
      );

      if (!hasOldDatabase) {
        // Aucune ancienne base détectée, marquer la migration comme complétée
        await this.recordMigration(migrationKey);
        console.log('Aucune ancienne base "StockIonic" trouvée. Migration ignorée.');
        return;
      }

      console.log('Migration détectée: anciennes données "StockIonic" trouvées. Migration en cours...');

      // Effectuer les migrations pour chaque type de donnée
      await this.migrateFoods();
      await this.migrateLocations();
      await this.migrateUnits();
      await this.migrateShoppingList();

      // Nettoyer les anciennes bases
      await this.deleteOldDatabases();

      // Enregistrer la migration comme complétée
      await this.recordMigration(migrationKey);

      console.log('✅ Migration "StockIonic → Stockaido" complétée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      // Ne pas échouer complètement, l'app peut continuer sans les données
    }
  }

  /**
   * Migre les aliments
   */
  private async migrateFoods(): Promise<void> {
    const oldData = await this.readIndexedDB('StockIonic', 'foods');
    if (oldData && oldData.length > 0) {
      console.log(`  Migration: ${oldData.length} aliments...`);
      for (const food of oldData) {
        try {
          await this.foodRepository.putFood(food);
        } catch (e) {
          console.warn(`  ⚠️  Erreur lors de la migration d'un aliment:`, e);
        }
      }
    }
  }

  /**
   * Migre les lieux de rangement
   */
  private async migrateLocations(): Promise<void> {
    const oldData = await this.readIndexedDB('StockIonicLocations', 'locations');
    if (oldData && oldData.length > 0) {
      console.log(`  Migration: ${oldData.length} lieux...`);
      for (const location of oldData) {
        try {
          await this.locationRepository.putLocation(location);
        } catch (e) {
          console.warn(`  ⚠️  Erreur lors de la migration d'un lieu:`, e);
        }
      }
    }
  }

  /**
   * Migre les unités personnalisées
   */
  private async migrateUnits(): Promise<void> {
    const oldData = await this.readIndexedDB('StockIonicUnits', 'units');
    if (oldData && oldData.length > 0) {
      console.log(`  Migration: ${oldData.length} unités...`);
      for (const unit of oldData) {
        try {
          await this.unitRepository.putUnit(unit);
        } catch (e) {
          console.warn(`  ⚠️  Erreur lors de la migration d'une unité:`, e);
        }
      }
    }
  }

  /**
   * Migre la liste de courses
   */
  private async migrateShoppingList(): Promise<void> {
    const oldData = await this.readIndexedDB('StockIonicShoppingList', 'items');
    if (oldData && oldData.length > 0) {
      console.log(`  Migration: ${oldData.length} articles liste...`);
      for (const item of oldData) {
        try {
          await this.shoppingListRepository.putItem(item);
        } catch (e) {
          console.warn(`  ⚠️  Erreur lors de la migration d'un article:`, e);
        }
      }
    }
  }

  /**
   * Lit les données d'une base IndexedDB
   */
  private readIndexedDB(dbName: string, storeName: string): Promise<any[]> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(dbName);
        
        request.onerror = () => resolve([]);
        
        request.onsuccess = () => {
          const db = request.result;
          
          if (!db.objectStoreNames.contains(storeName)) {
            resolve([]);
            return;
          }
          
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            resolve(getAllRequest.result || []);
          };
          
          getAllRequest.onerror = () => resolve([]);
        };
      } catch (e) {
        console.warn(`Erreur lors de la lecture de ${dbName}:`, e);
        resolve([]);
      }
    });
  }

  /**
   * Supprime les anciennes bases de données
   */
  private async deleteOldDatabases(): Promise<void> {
    const oldDatabaseNames = [
      'StockIonic',
      'StockIonicLocations',
      'StockIonicShoppingList',
      'StockIonicUnits'
    ];

    for (const dbName of oldDatabaseNames) {
      try {
        await new Promise<void>((resolve) => {
          const request = indexedDB.deleteDatabase(dbName);
          request.onsuccess = () => {
            console.log(`  🗑️  Base supprimée: ${dbName}`);
            resolve();
          };
          request.onerror = () => resolve();
        });
      } catch (e) {
        console.warn(`  ⚠️  Erreur lors de la suppression de ${dbName}:`, e);
      }
    }
  }

  /**
   * Récupère la liste des bases IndexedDB existantes
   */
  private async getIndexedDBDatabaseNames(): Promise<string[]> {
    try {
      // Note: indexedDB.databases() est une API récente
      // Fallback: vérifier manuellement les bases connues
      const knownDatabases = [
        'Stockaido',
        'StockaidoLocations',
        'StockaidoShoppingList',
        'StockaidoUnits',
        'StockIonic',
        'StockIonicLocations',
        'StockIonicShoppingList',
        'StockIonicUnits'
      ];

      const existing: string[] = [];
      for (const dbName of knownDatabases) {
        const exists = await this.databaseExists(dbName);
        if (exists) {
          existing.push(dbName);
        }
      }
      return existing;
    } catch (e) {
      console.warn('Erreur lors de la récupération des bases:', e);
      return [];
    }
  }

  /**
   * Vérifie si une base de données existe
   */
  private databaseExists(dbName: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(dbName);
        let exists = false;

        request.onsuccess = () => {
          exists = true;
          request.result.close();
          resolve(exists);
        };

        request.onerror = () => {
          resolve(false);
        };
      } catch (e) {
        resolve(false);
      }
    });
  }

  /**
   * Récupère l'enregistrement de migration du localStorage
   */
  private getMigrationRecord(key: string): any {
    try {
      const record = localStorage.getItem(`migration_${key}`);
      return record ? JSON.parse(record) : null;
    } catch {
      return null;
    }
  }

  /**
   * Enregistre une migration comme complétée
   */
  private async recordMigration(key: string): Promise<void> {
    try {
      localStorage.setItem(`migration_${key}`, JSON.stringify({
        appliedAt: new Date().toISOString(),
        version: '1.0'
      }));
    } catch (e) {
      console.warn('Erreur lors de l\'enregistrement de la migration:', e);
    }
  }
}
