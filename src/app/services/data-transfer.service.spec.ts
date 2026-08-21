import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { DataTransferService } from './data-transfer.service';
import { FoodService } from './food.service';
import { LocationService } from './location.service';
import { UnitService } from './unit.service';
import { Food } from '../models/food.model';
import { CustomLocation } from '../models/location.model';
import { CustomUnit } from '../models/unit.model';

describe('DataTransferService', () => {
  const createdAt = new Date('2026-08-01T10:00:00.000Z');
  const updatedAt = new Date('2026-08-02T10:00:00.000Z');

  const foods: Food[] = [
    {
      id: 'food-1',
      name: 'Lentilles',
      quantity: 7,
      unit: 'unit-1',
      location: 'loc-1',
      step: 1,
      isFavorite: true,
      minimalStock: 2,
      notes: 'sur l\u2019\u00e9tag\u00e8re du haut',
      createdAt,
      updatedAt
    }
  ];
  const locations: CustomLocation[] = [{ id: 'loc-1', name: 'Garage', createdAt }];
  const units: CustomUnit[] = [{ id: 'unit-1', name: 'sachet', createdAt }];
  const locationOrder = ['loc-1', 'fridge'];

  let service: DataTransferService;
  let foodService: jasmine.SpyObj<FoodService>;
  let locationService: jasmine.SpyObj<LocationService>;
  let unitService: jasmine.SpyObj<UnitService>;

  beforeEach(() => {
    foodService = jasmine.createSpyObj<FoodService>('FoodService', ['replaceAll', 'clearAll'], { foods$: signal(foods) });
    locationService = jasmine.createSpyObj<LocationService>('LocationService', ['replaceAll', 'clearAll'], {
      locations: signal(locations),
      locationOrder: signal(locationOrder)
    });
    unitService = jasmine.createSpyObj<UnitService>('UnitService', ['replaceAll', 'clearAll'], { units: signal(units) });

    foodService.replaceAll.and.resolveTo();
    locationService.replaceAll.and.resolveTo();
    unitService.replaceAll.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        DataTransferService,
        { provide: FoodService, useValue: foodService },
        { provide: LocationService, useValue: locationService },
        { provide: UnitService, useValue: unitService }
      ]
    });

    service = TestBed.inject(DataTransferService);
  });

  it('exporte les aliments, lieux et unités avec un numéro de version', () => {
    const payload = JSON.parse(service.exportToJson());

    expect(payload.version).toBe(1);
    expect(payload.exportedAt).toBeTruthy();
    expect(payload.data.foods.length).toBe(1);
    expect(payload.data.locations).toEqual(jasmine.arrayContaining([jasmine.objectContaining({ name: 'Garage' })]));
    expect(payload.data.units).toEqual(jasmine.arrayContaining([jasmine.objectContaining({ name: 'sachet' })]));
    expect(payload.data.locationOrder).toEqual(locationOrder);
  });

  it('réimporte sans perte un export qu\'il vient de produire', async () => {
    await service.importFromJson(service.exportToJson());

    const [importedFoods] = foodService.replaceAll.calls.mostRecent().args;
    const [importedLocations, importedOrder] = locationService.replaceAll.calls.mostRecent().args;
    const [importedUnits] = unitService.replaceAll.calls.mostRecent().args;

    expect(importedFoods).toEqual(foods);
    expect(importedLocations).toEqual(locations);
    expect(importedOrder).toEqual(locationOrder);
    expect(importedUnits).toEqual(units);
  });

  it('restaure les dates comme objets Date et non comme chaînes', async () => {
    await service.importFromJson(service.exportToJson());

    const [importedFoods] = foodService.replaceAll.calls.mostRecent().args;
    expect(importedFoods[0].createdAt instanceof Date).toBeTrue();
    expect(importedFoods[0].updatedAt.getTime()).toBe(updatedAt.getTime());
  });

  it('remplace les lieux et unités avant les aliments', async () => {
    await service.importFromJson(service.exportToJson());

    expect(locationService.replaceAll).toHaveBeenCalledBefore(foodService.replaceAll);
    expect(unitService.replaceAll).toHaveBeenCalledBefore(foodService.replaceAll);
  });

  it('rejette un fichier qui n\'est pas du JSON', async () => {
    await expectAsync(service.importFromJson('pas du json')).toBeRejectedWithError(/JSON illisible/);
    expect(foodService.replaceAll).not.toHaveBeenCalled();
  });

  it('rejette un JSON valide dont la structure est inattendue', async () => {
    await expectAsync(service.importFromJson('{"version":1}')).toBeRejectedWithError(/structure inattendue/);
    expect(foodService.replaceAll).not.toHaveBeenCalled();
  });
});
