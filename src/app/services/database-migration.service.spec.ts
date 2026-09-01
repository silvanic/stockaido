import { TestBed } from '@angular/core/testing';
import { DatabaseMigrationService } from './database-migration.service';
import { FoodRepository } from '../repositories/food.repository';
import { LocationRepository } from '../repositories/location.repository';
import { UnitRepository } from '../repositories/unit.repository';
import { ShoppingListRepository } from '../repositories/shopping-list.repository';

describe('DatabaseMigrationService', () => {
  let service: DatabaseMigrationService;
  let foodRepository: FoodRepository;
  let locationRepository: LocationRepository;
  let unitRepository: UnitRepository;
  let shoppingListRepository: ShoppingListRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DatabaseMigrationService,
        FoodRepository,
        LocationRepository,
        UnitRepository,
        ShoppingListRepository
      ]
    });
    service = TestBed.inject(DatabaseMigrationService);
    foodRepository = TestBed.inject(FoodRepository);
    locationRepository = TestBed.inject(LocationRepository);
    unitRepository = TestBed.inject(UnitRepository);
    shoppingListRepository = TestBed.inject(ShoppingListRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have init method', () => {
    expect(service.init).toBeDefined();
    expect(typeof service.init).toBe('function');
  });

  it('should handle migration gracefully when no old databases exist', async () => {
    // Arrange: Assurer qu'il n'y a pas d'anciennes bases
    console.log = jasmine.createSpy('log');

    // Act
    await service['runMigrations']();

    // Assert: La migration devrait marquer l'opération comme complétée
    const record = localStorage.getItem('migration_StockIonic_to_Stockaido_v1');
    expect(record).toBeTruthy();
  });

  it('should not run migration twice', async () => {
    // Arrange: Marquer la migration comme déjà effectuée
    localStorage.setItem('migration_StockIonic_to_Stockaido_v1', 
      JSON.stringify({ appliedAt: new Date().toISOString(), version: '1.0' })
    );

    const putFoodSpy = spyOn(foodRepository, 'putFood');

    // Act
    await service['runMigrations']();

    // Assert: putFood ne devrait pas être appelé
    expect(putFoodSpy).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    console.error = jasmine.createSpy('error');
    const errorSpy = spyOn(foodRepository, 'putFood').and.returnValue(
      Promise.reject(new Error('Test error'))
    );

    // Act & Assert: L'app ne devrait pas craquer
    await service.init();
    
    // La méthode ne devrait pas lancer d'exception
    expect(() => service.init()).not.toThrow();
  });

  afterEach(() => {
    // Nettoyer les données de test
    localStorage.removeItem('migration_StockIonic_to_Stockaido_v1');
  });
});
