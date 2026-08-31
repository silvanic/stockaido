import { Injectable, signal } from '@angular/core';
import { ShoppingListItem } from '../models/shopping-list.model';
import { ShoppingListRepository } from '../repositories/shopping-list.repository';

/**
 * Service métier pour la liste "À acheter" manuelle, indépendante du stock (Food)
 */
@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  private itemsSignal = signal<ShoppingListItem[]>([]);
  items = this.itemsSignal.asReadonly();

  constructor(private repository: ShoppingListRepository) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const items = await this.repository.getAllItems();
    this.itemsSignal.set(items);
  }

  async addItem(name: string): Promise<ShoppingListItem> {
    const item = await this.repository.addItem(name.trim());
    this.itemsSignal.update(items => [...items, item]);
    return item;
  }

  async toggleChecked(id: string): Promise<void> {
    const item = this.itemsSignal().find(i => i.id === id);
    if (!item) return;

    const updated: ShoppingListItem = { ...item, checked: !item.checked };
    await this.repository.updateItem(updated);
    this.itemsSignal.update(items => items.map(i => (i.id === id ? updated : i)));
  }

  async deleteItem(id: string): Promise<void> {
    await this.repository.deleteItem(id);
    this.itemsSignal.update(items => items.filter(i => i.id !== id));
  }

  /**
   * Vide toute la liste manuelle
   */
  async clearAll(): Promise<void> {
    await this.repository.clearAll();
    this.itemsSignal.set([]);
  }
}
