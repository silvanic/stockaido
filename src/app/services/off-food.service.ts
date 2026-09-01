import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Unit } from '../models/unit.model';

/**
 * Interface pour le produit retourné par l'API Open Food Facts (structure V3)
 */
export interface OffProduct {
  code: string;
  product_name?: string;
  product_name_en?: string;
  product_name_de?: string;
  product_name_fr?: string;
  product_name_it?: string;
  product_name_ro?: string;
  [key: `product_name_${string}`]: string | undefined; // Autres langues
  quantity?: string; // Ex: "400.0 g"
  product_quantity?: number; // Ex: 400
  product_quantity_unit?: string; // Ex: "g"
  brands?: string; // Ex: "Ferrero"
  brands_tags?: string[]; // Ex: ["Ferrero"]
  nutriments?: {
    energy?: number;
    [key: string]: number | undefined;
  };
  [key: string]: unknown;
}

/**
 * Données extraites du produit OFF à utiliser pour pré-remplir le formulaire
 */
export interface ExtractedProductData {
  name: string;
  quantity?: number;
  unit?: Unit;
  brands?: string;
}

/**
 * Service pour rechercher des produits via l'API Open Food Facts
 * API libre, sans authentification requise
 * Documentation: https://wiki.openfoodfacts.org/API
 */
@Injectable({
  providedIn: 'root'
})
export class OffFoodService {
  // V3 is the recommended version for new integrations
  private readonly API_BASE_URL = 'https://world.openfoodfacts.org/api/v3';
  private readonly USER_AGENT = 'StockIonic/1.0 (+https://stockaido.netlify.app)';

  // Mapper les codes OFF (avec variantes de casse) vers les clés enum Unit
  private readonly OFF_TO_UNIT_MAP: { [key: string]: Unit } = {
    // Weights
    'g': Unit.GRAM,
    'G': Unit.GRAM,
    'kg': Unit.KILOGRAM,
    'KG': Unit.KILOGRAM,
    'Kg': Unit.KILOGRAM,
    'oz': Unit.GRAM,       // Approximation: oz -> g
    'OZ': Unit.GRAM,
    'lb': Unit.KILOGRAM,   // Approximation: lb -> kg
    'LB': Unit.KILOGRAM,
    'Lb': Unit.KILOGRAM,
    // Volumes
    'ml': Unit.MILLILITER,
    'ML': Unit.MILLILITER,
    'l': Unit.LITER,
    'L': Unit.LITER,
    'cl': Unit.DECILITER,
    'CL': Unit.DECILITER,
    'Cl': Unit.DECILITER,
    'dl': Unit.DECILITER,
    'DL': Unit.DECILITER,
    'Dl': Unit.DECILITER,
    // Spoon measures
    'tsp': Unit.TEASPOON,
    'TSP': Unit.TEASPOON,
    'tbsp': Unit.TABLESPOON,
    'TBSP': Unit.TABLESPOON,
    'Tbsp': Unit.TABLESPOON,
    // Cup
    'cup': Unit.CUP,
    'CUP': Unit.CUP,
    'Cup': Unit.CUP
  };

  constructor(private http: HttpClient) {}

  /**
   * Recherche un produit par code-barres via l'API Open Food Facts
   * @param barcode Code-barres (ex: 3017620425035)
   * @returns Observable<OffProduct> Produit trouvé ou erreur
   */
  searchByBarcode(barcode: string): Observable<OffProduct> {
    // Validation basique
    if (!barcode || barcode.trim().length === 0) {
      return throwError(() => new Error('Barcode cannot be empty'));
    }

    const cleanBarcode = barcode.trim();
    // V3 endpoint: /api/v3/product/{barcode} (no .json extension needed, defaults to JSON)
    const url = `${this.API_BASE_URL}/product/${cleanBarcode}`;

    return this.http.get<any>(url, {
      headers: {
        'User-Agent': this.USER_AGENT
      }
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return throwError(() => new Error('Product not found'));
        }
        if (error.status === 400) {
          return throwError(() => new Error('Invalid barcode format'));
        }
        if (error.status === 0) {
          // Network error / offline
          return throwError(() => new Error('Network error - Check your connection'));
        }
        if (error.status === 500 || error.status === 502 || error.status === 503) {
          // Server error - API temporarily unavailable
          return throwError(() => new Error('Open Food Facts API temporarily unavailable. Please try manual entry.'));
        }
        return throwError(() => new Error('Failed to fetch product data'));
      }),
      map(response => {
        // V3 wraps product in response.product
        if (response.product) {
          return response.product;
        }
        throw new Error('Invalid response format from API');
      })
    );
  }

  /**
   * Extrait les données pertinentes d'un produit OFF
   * pour pré-remplir le formulaire d'ajout d'aliment
   * @param product Produit retourné par l'API OFF
   * @returns ExtractedProductData Données à utiliser pour le formulaire
   */
  extractProductData(product: OffProduct): ExtractedProductData {
    // Essayer d'obtenir le nom du produit - peut être product_name ou product_name_XX
    let name = product.product_name?.trim() || '';
    
    if (!name) {
      // Fallback: chercher product_name_en, product_name_de, etc.
      const nameKeys = Object.keys(product).filter(k => k.startsWith('product_name_') && k.length === 14);
      if (nameKeys.length > 0) {
        name = (product[nameKeys[0]] as string)?.trim() || '';
      }
    }
    
    // Essayer d'extraire la quantité et l'unité
    // V3 peut fournir: quantity (chaîne "400.0 g"), product_quantity (nombre), product_quantity_unit (string)
    let { quantity, unit } = this.parseQuantity(product.quantity);
    
    // Fallback: si quantity vient du champ quantity (chaîne), sinon utiliser product_quantity + product_quantity_unit
    if (!quantity && product.product_quantity) {
      quantity = product.product_quantity as unknown as number;
      const rawUnit = (product.product_quantity_unit as string)?.trim() || '';
      // Utiliser la map OFF_TO_UNIT_MAP pour traduire vers les clés enum Unit
      unit = this.OFF_TO_UNIT_MAP[rawUnit] || Unit.PIECE;
    }

    return {
      name,
      quantity: quantity || 1,
      unit: unit || Unit.PIECE,
      brands: product.brands?.trim() || (product.brands_tags ? (product.brands_tags as string[])[0] : undefined)
    };
  }

  /**
   * Parse une chaîne de quantité (ex: "200g", "1.5L", "6 pieces")
   * pour extraire la valeur numérique et l'unité
   * @param quantityStr Chaîne de quantité (ex: "200 g", "1.5L")
   * @returns { quantity: number | undefined, unit: Unit | undefined }
   */
  private parseQuantity(quantityStr?: string): { quantity?: number; unit?: Unit } {
    if (!quantityStr) {
      return {};
    }

    // Regex: nombre (entier ou décimal) + unité optionnelle
    const match = quantityStr.trim().match(/^([\d.,]+)\s*([a-zA-Z%]*)$/);
    
    if (!match) {
      return {};
    }

    const quantityValue = parseFloat(match[1].replace(',', '.'));
    const rawUnit = match[2]?.trim() || ''; // Préserver la casse originale

    if (isNaN(quantityValue)) {
      return {};
    }

    // Utiliser la map OFF_TO_UNIT_MAP pour traduire vers les clés enum Unit
    // Si pas trouvée, utiliser Unit.PIECE par défaut (pas de valeur brute inconnue)
    const unit = this.OFF_TO_UNIT_MAP[rawUnit] || Unit.PIECE;

    return {
      quantity: isNaN(quantityValue) ? undefined : quantityValue,
      unit
    };
  }
}
