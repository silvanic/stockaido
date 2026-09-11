import { Injectable, computed, signal } from '@angular/core';
import { BarcodeRepository } from '../repositories/barcode.repository';
import { CachedBarcode, BarcodeCacheStats } from '../models/cached-barcode.model';
import { ExtractedProductData } from './off-food.service';

/**
 * Service pour gérer le cache LRU de codes-barres
 * Stockage automatique des produits OFF scannés
 * Limite: 500 produits, nettoyage auto à 90 jours
 */
@Injectable({
  providedIn: 'root'
})
export class BarcodeService {
  private readonly MAX_PRODUCTS = 500;
  private readonly AUTO_CLEANUP_DAYS = 90;

  private statsSignal = signal<BarcodeCacheStats>({
    totalProducts: 0,
    maxProducts: this.MAX_PRODUCTS,
    cacheSize: 0
  });

  stats = computed(() => this.statsSignal());

  constructor(private repo: BarcodeRepository) {
    this.refreshStats();
  }

  /**
   * Récupère un produit du cache
   */
  async getFromCache(barcode: string): Promise<CachedBarcode | null> {
    return this.repo.getByBarcode(barcode);
  }

  /**
   * Ajoute un produit au cache (ou met à jour s'il existe)
   */
  async addToCache(barcode: string, data: ExtractedProductData, rawOffData?: Record<string, unknown>): Promise<void> {
    const existing = await this.repo.getByBarcode(barcode);
    const now = new Date();

    const product: CachedBarcode = {
      id: barcode,
      barcode,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit?.toString(),
      brands: data.brands,
      firstScanned: existing?.firstScanned || now,
      lastScanned: now,
      scanCount: (existing?.scanCount || 0) + 1,
      rawOffData
    };

    await this.repo.addOrUpdate(product);

    // Applique la limite
    const count = await this.repo.count();
    if (count > this.MAX_PRODUCTS) {
      await this.triggerLRUCleanup();
    }

    this.refreshStats();
  }

  /**
   * Nettoie les produits LRU (garde les 90% plus récents)
   */
  private async triggerLRUCleanup(): Promise<void> {
    const all = await this.repo.getAll();
    const toRemove = Math.ceil(all.length * 0.1); // Remove 10%

    if (toRemove > 0) {
      // Sort par lastScanned (ancien -> récent)
      all.sort((a, b) => new Date(a.lastScanned).getTime() - new Date(b.lastScanned).getTime());
      
      // Supprime les plus anciens
      for (let i = 0; i < toRemove; i++) {
        await this.repo.delete(all[i].barcode);
      }
      console.log(`LRU cleanup: suppression de ${toRemove} produits`);
    }
  }

  /**
   * Nettoie les produits non scannés depuis > X jours
   */
  async cleanOldProducts(days: number = this.AUTO_CLEANUP_DAYS): Promise<number> {
    const removed = await this.repo.deleteOlderThan(days);
    this.refreshStats();
    return removed;
  }

  /**
   * Vide tout le cache
   */
  async clearCache(): Promise<void> {
    await this.repo.clear();
    this.statsSignal.set({
      totalProducts: 0,
      maxProducts: this.MAX_PRODUCTS,
      cacheSize: 0
    });
  }

  /**
   * Alias pour clearCache() - compatible avec le pattern des autres services
   */
  async clearAll(): Promise<void> {
    return this.clearCache();
  }

  /**
   * Actualise les stats
   */
  private async refreshStats(): Promise<void> {
    const all = await this.repo.getAll();
    const size = Math.round(new Blob([JSON.stringify(all)]).size / 1024);
    
    let oldestProduct = all[0];
    let mostScanned = all[0];

    for (const product of all) {
      if (new Date(product.lastScanned) < new Date(oldestProduct.lastScanned)) {
        oldestProduct = product;
      }
      if (product.scanCount > (mostScanned.scanCount || 0)) {
        mostScanned = product;
      }
    }

    this.statsSignal.set({
      totalProducts: all.length,
      maxProducts: this.MAX_PRODUCTS,
      cacheSize: size,
      oldestProduct,
      mostScanned
    });
  }
}
