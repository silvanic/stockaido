import { Injectable } from '@angular/core';
import { Food } from '../models/food.model';
import { CustomLocation } from '../models/location.model';
import { CustomUnit } from '../models/unit.model';
import { FoodService } from './food.service';
import { LocationService } from './location.service';
import { UnitService } from './unit.service';

const EXPORT_VERSION = 1;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeDate(value: unknown): string | undefined {
  return typeof value === 'string' && ISO_DATE.test(value) ? value : undefined;
}

function sanitizeDaysAfterOpening(value: unknown): number | undefined {
  const days = Number(value);
  return Number.isFinite(days) && days >= 0 ? days : undefined;
}

// Nettoie les dates d'un aliment importé sans ajouter de clé si elle était absente à l'origine
function sanitizeFoodDates(food: Food): Food {
  const result: Food = { ...food };

  if ('expiresAt' in food) {
    const cleaned = sanitizeDate(food.expiresAt);
    if (cleaned === undefined) delete result.expiresAt; else result.expiresAt = cleaned;
  }
  if ('openedAt' in food) {
    const cleaned = sanitizeDate(food.openedAt);
    if (cleaned === undefined) delete result.openedAt; else result.openedAt = cleaned;
  }
  if ('daysAfterOpening' in food) {
    const cleaned = sanitizeDaysAfterOpening(food.daysAfterOpening);
    if (cleaned === undefined) delete result.daysAfterOpening; else result.daysAfterOpening = cleaned;
  }

  return result;
}

interface ExportPayload {
  version: number;
  exportedAt: string;
  data: {
    foods: Food[];
    locations: CustomLocation[];
    locationOrder?: string[];
    units: CustomUnit[];
  };
}

/**
 * Service d'export/import de l'ensemble des données locales (aliments, lieux, unités) au format JSON
 */
@Injectable({
  providedIn: 'root'
})
export class DataTransferService {
  constructor(
    private foodService: FoodService,
    private locationService: LocationService,
    private unitService: UnitService
  ) {}

  /**
   * Sérialise toutes les données en JSON
   */
  exportToJson(): string {
    const payload: ExportPayload = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        foods: this.foodService.foods$(),
        locations: this.locationService.locations(),
        locationOrder: this.locationService.locationOrder(),
        units: this.unitService.units()
      }
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Déclenche le téléchargement du fichier d'export dans le navigateur
   */
  downloadExport(): void {
    const json = this.exportToJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `stockaido-export-${date}.json`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Remplace toutes les données locales par celles contenues dans le JSON fourni
   */
  async importFromJson(json: string): Promise<void> {
    let parsed: ExportPayload;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('Fichier invalide : JSON illisible');
    }

    if (!parsed?.data || !Array.isArray(parsed.data.foods)) {
      throw new Error('Fichier invalide : structure inattendue');
    }

    const foods = parsed.data.foods.map(food => ({
      ...sanitizeFoodDates(food),
      createdAt: new Date(food.createdAt),
      updatedAt: new Date(food.updatedAt)
    }));
    const locations = (parsed.data.locations ?? []).map(loc => ({
      ...loc,
      createdAt: new Date(loc.createdAt)
    }));
    const units = (parsed.data.units ?? []).map(unit => ({
      ...unit,
      createdAt: new Date(unit.createdAt)
    }));

    await this.locationService.replaceAll(locations, parsed.data.locationOrder);
    await this.unitService.replaceAll(units);
    await this.foodService.replaceAll(foods);
  }

  /**
   * Vide toutes les données locales (aliments, lieux, unités)
   */
  async clearAllData(): Promise<void> {
    await this.foodService.clearAll();
    await this.locationService.clearAll();
    await this.unitService.clearAll();
  }
}
