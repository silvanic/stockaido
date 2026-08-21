import { Injectable, signal, computed } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Food, CreateFoodDTO, StorageLocation, STORAGE_LOCATION_LABELS } from '../models/food.model';
import { FoodRepository } from '../repositories/food.repository';
import { LocationService } from './location.service';

/**
 * Service métier pour la gestion des aliments
 * Utilise Angular Signals pour la réactivité
 */
@Injectable({
  providedIn: 'root'
})
export class FoodService {
  // État réactif
  private foods = signal<Food[]>([]);
  private loading = signal<boolean>(true);
  private error = signal<string | null>(null);
  private searchQuery = signal<string>('');

  // Données calculées
  foods$ = this.foods.asReadonly();
  loading$ = this.loading.asReadonly();
  error$ = this.error.asReadonly();
  searchQuery$ = this.searchQuery.asReadonly();

  // Aliments filtrés par la recherche (nom de l'aliment ou lieu de rangement)
  filteredFoods = computed(() => {
    const allFoods = this.foods();
    const query = this.searchQuery().toLowerCase();

    if (!query) return allFoods;

    return allFoods.filter(food =>
      food.name.toLowerCase().includes(query) ||
      (food.location !== undefined && this.translate.instant(this.getLocationLabel(food.location)).toLowerCase().includes(query))
    );
  });

  // Grouper les aliments par localisation
  foodsByLocation = computed(() => {
    const foods = this.filteredFoods();
    const grouped: Record<string, Food[]> = {};

    // Initialiser tous les emplacements
    Object.values(StorageLocation).forEach(location => {
      grouped[location] = [];
    });
    grouped['no-location'] = [];

    // Grouper les aliments (un seul lieu par aliment)
    foods.forEach(food => {
      if (food.location) {
        grouped[food.location] = grouped[food.location] ?? [];
        grouped[food.location].push(food);
      } else {
        grouped['no-location'].push(food);
      }
    });

    return grouped;
  });

  // Les favoris
  favorites = computed(() => {
    return this.foods().filter(food => food.isFavorite);
  });

  // Aliments en dessous du stock minimal (V1)
  toBuyList = computed(() => {
    return this.foods().filter(food => 
      food.minimalStock !== undefined && 
      food.quantity < food.minimalStock
    );
  });

  constructor(
    private repository: FoodRepository,
    private locationService: LocationService,
    private translate: TranslateService
  ) {
    this.initialize();
  }

  /**
   * Initialise le service en chargeant les aliments
   */
  private async initialize(): Promise<void> {
    try {
      this.loading.set(true);
      await this.loadFoods();
    } catch (err) {
      this.error.set(this.translate.instant('home.loadError'));
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Charge tous les aliments depuis le repository
   */
  private async loadFoods(): Promise<void> {
    const allFoods = await this.repository.getAllFoods();
    this.foods.set(allFoods);
  }

  /**
   * Ajoute un nouvel aliment
   */
  async addFood(data: CreateFoodDTO): Promise<Food> {
    try {
      this.error.set(null);
      const newFood = await this.repository.addFood(data);
      this.foods.update(foods => [...foods, newFood]);
      return newFood;
    } catch (err) {
      this.error.set(this.translate.instant('foodModal.addError'));
      throw err;
    }
  }

  /**
   * Met à jour un aliment
   */
  async updateFood(id: string, updates: Partial<CreateFoodDTO>): Promise<Food> {
    try {
      this.error.set(null);
      const updated = await this.repository.updateFood(id, updates);
      this.foods.update(foods =>
        foods.map(f => f.id === id ? updated : f)
      );
      return updated;
    } catch (err) {
      this.error.set(this.translate.instant('foodModal.editError'));
      throw err;
    }
  }

  /**
   * Met à jour rapidement la quantité
   */
  async incrementQuantity(foodId: string): Promise<void> {
    const food = this.foods().find(f => f.id === foodId);
    if (food) {
      const step = food.step ?? 1;
      await this.updateFood(foodId, { quantity: food.quantity + step });
    }
  }

  /**
   * Décrémente rapidement la quantité
   */
  async decrementQuantity(foodId: string): Promise<void> {
    const food = this.foods().find(f => f.id === foodId);
    if (food && food.quantity > 0) {
      const step = food.step ?? 1;
      await this.updateFood(foodId, { quantity: Math.max(0, food.quantity - step) });
    }
  }

  /**
   * Supprime un aliment
   */
  async deleteFood(id: string): Promise<void> {
    try {
      this.error.set(null);
      await this.repository.deleteFood(id);
      this.foods.update(foods => foods.filter(f => f.id !== id));
    } catch (err) {
      this.error.set(this.translate.instant('foodModal.deleteError'));
      throw err;
    }
  }

  /**
   * Définit la requête de recherche
   */
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  /**
   * Récupère un aliment par ID
   */
  getFoodById(id: string): Food | undefined {
    return this.foods().find(f => f.id === id);
  }

  /**
   * Récupère les aliments par localisation (lieu par défaut ou personnalisé)
   */
  getFoodsByLocation(location: string | undefined): Food[] {
    if (!location) {
      return this.filteredFoods().filter(food => !food.location);
    }
    return this.filteredFoods().filter(food => food.location === location);
  }

  /**
   * Obtient le label d'une localisation (par défaut ou personnalisée)
   */
  getLocationLabel(location: string | undefined): string {
    if (!location) return 'locations.none';
    return STORAGE_LOCATION_LABELS[location as StorageLocation]
      ?? this.locationService.getLocationName(location)
      ?? location;
  }

  /**
   * Toggle favorite d'un aliment
   */
  async toggleFavorite(id: string): Promise<void> {
    const food = this.getFoodById(id);
    if (food) {
      await this.updateFood(id, { isFavorite: !food.isFavorite });
    }
  }

  /**
   * Récupère le nombre total d'aliments
   */
  getTotalCount = computed(() => this.foods().length);

  /**
   * Vide la base de données (dev/debug)
   */
  async clearAll(): Promise<void> {
    await this.repository.clearAll();
    this.foods.set([]);
  }

  /**
   * Remplace toutes les données par celles fournies (utilisé lors d'un import)
   */
  async replaceAll(foods: Food[]): Promise<void> {
    await this.repository.clearAll();
    for (const food of foods) {
      await this.repository.putFood(food);
    }
    await this.loadFoods();
  }
}
