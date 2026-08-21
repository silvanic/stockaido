import { Injectable, signal } from '@angular/core';
import { CustomLocation } from '../models/location.model';
import { LocationRepository } from '../repositories/location.repository';
import { StorageLocation } from '../models/food.model';

const ORDER_STORAGE_KEY = 'stockionic-location-order';

/**
 * Service métier pour la gestion des lieux de rangement personnalisés
 */
@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private customLocations = signal<CustomLocation[]>([]);
  locations = this.customLocations.asReadonly();

  // Ordre d'affichage (ids des lieux par défaut + personnalisés), persisté en local storage
  private order = signal<string[]>([]);
  locationOrder = this.order.asReadonly();

  constructor(private repository: LocationRepository) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const locations = await this.repository.getAllLocations();
    this.customLocations.set(locations);
    this.order.set(this.buildOrder(locations));
  }

  // Fusionne l'ordre fourni (ou stocké) avec les ids existants, en ajoutant les nouveaux à la fin
  private buildOrder(locations: CustomLocation[], preferredOrder?: string[]): string[] {
    const allIds = [...Object.values(StorageLocation), ...locations.map(l => l.id)];
    const source = preferredOrder ?? this.getStoredOrder();
    const known = source.filter(id => allIds.includes(id));
    const missing = allIds.filter(id => !known.includes(id));
    return [...known, ...missing];
  }

  private getStoredOrder(): string[] {
    try {
      const raw = localStorage.getItem(ORDER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private persistOrder(order: string[]): void {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  }

  getOrderIndex(id: string): number {
    const index = this.order().indexOf(id);
    return index === -1 ? this.order().length : index;
  }

  moveUp(id: string): void {
    this.swap(id, -1);
  }

  moveDown(id: string): void {
    this.swap(id, 1);
  }

  private swap(id: string, offset: number): void {
    const order = [...this.order()];
    const index = order.indexOf(id);
    const targetIndex = index + offset;
    if (index === -1 || targetIndex < 0 || targetIndex >= order.length) return;

    [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
    this.order.set(order);
    this.persistOrder(order);
  }

  async addLocation(name: string): Promise<CustomLocation> {
    const trimmed = name.trim();
    const newLocation = await this.repository.addLocation(trimmed);
    this.customLocations.update(locations => [...locations, newLocation]
      .sort((a, b) => a.name.localeCompare(b.name)));
    this.order.update(order => {
      const updated = [...order, newLocation.id];
      this.persistOrder(updated);
      return updated;
    });
    return newLocation;
  }

  async deleteLocation(id: string): Promise<void> {
    await this.repository.deleteLocation(id);
    this.customLocations.update(locations => locations.filter(l => l.id !== id));
    this.order.update(order => {
      const updated = order.filter(orderId => orderId !== id);
      this.persistOrder(updated);
      return updated;
    });
  }

  getLocationName(id: string): string | undefined {
    return this.customLocations().find(l => l.id === id)?.name;
  }

  /**
   * Vide tous les lieux personnalisés et réinitialise l'ordre d'affichage
   */
  async clearAll(): Promise<void> {
    await this.repository.clearAll();
    this.customLocations.set([]);
    localStorage.removeItem(ORDER_STORAGE_KEY);
    this.order.set(this.buildOrder([]));
  }

  /**
   * Remplace tous les lieux personnalisés par ceux fournis (utilisé lors d'un import)
   * @param order Ordre d'affichage à restaurer (issu d'un export), sinon celui déjà stocké est conservé
   */
  async replaceAll(locations: CustomLocation[], order?: string[]): Promise<void> {
    await this.repository.clearAll();
    for (const location of locations) {
      await this.repository.putLocation(location);
    }
    this.customLocations.set([...locations].sort((a, b) => a.name.localeCompare(b.name)));
    this.order.set(this.buildOrder(locations, order));
    this.persistOrder(this.order());
  }
}
