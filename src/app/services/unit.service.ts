import { Injectable, signal } from '@angular/core';
import { CustomUnit } from '../models/unit.model';
import { UnitRepository } from '../repositories/unit.repository';

/**
 * Service métier pour la gestion des unités personnalisées
 */
@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private customUnits = signal<CustomUnit[]>([]);
  units = this.customUnits.asReadonly();

  constructor(private repository: UnitRepository) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const units = await this.repository.getAllUnits();
    this.customUnits.set(units);
  }

  async addUnit(name: string): Promise<CustomUnit> {
    const trimmed = name.trim();
    const newUnit = await this.repository.addUnit(trimmed);
    this.customUnits.update(units => [...units, newUnit]
      .sort((a, b) => a.name.localeCompare(b.name)));
    return newUnit;
  }

  async deleteUnit(id: string): Promise<void> {
    await this.repository.deleteUnit(id);
    this.customUnits.update(units => units.filter(u => u.id !== id));
  }

  getUnitName(id: string): string | undefined {
    return this.customUnits().find(u => u.id === id)?.name;
  }

  /**
   * Vide toutes les unités personnalisées
   */
  async clearAll(): Promise<void> {
    await this.repository.clearAll();
    this.customUnits.set([]);
  }

  /**
   * Remplace toutes les unités personnalisées par celles fournies (utilisé lors d'un import)
   */
  async replaceAll(units: CustomUnit[]): Promise<void> {
    await this.repository.clearAll();
    for (const unit of units) {
      await this.repository.putUnit(unit);
    }
    this.customUnits.set([...units].sort((a, b) => a.name.localeCompare(b.name)));
  }
}
