/**
 * Produit mise en cache depuis Open Food Facts
 * Structure minimale pour économiser l'espace disque
 */
export interface CachedBarcode {
  id: string; // barcode unique
  barcode: string;
  name: string;
  quantity?: number;
  unit?: string;
  brands?: string;
  firstScanned: Date;
  lastScanned: Date;
  scanCount: number;
  rawOffData?: Record<string, unknown>; // Données brutes OFF pour ré-extraction
}

/**
 * Stats du cache pour l'UI
 */
export interface BarcodeCacheStats {
  totalProducts: number;
  maxProducts: number;
  cacheSize: number; // en KB
  oldestProduct?: CachedBarcode;
  mostScanned?: CachedBarcode;
}
