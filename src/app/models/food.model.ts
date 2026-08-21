/**
 * Énumération des lieux de rangement disponibles
 */
export enum StorageLocation {
  FRIDGE = 'fridge',
  FREEZER = 'freezer',
  PANTRY = 'pantry',
  OTHER = 'other'
}

/**
 * Labels pour les lieux de rangement
 */
export const STORAGE_LOCATION_LABELS: Record<StorageLocation, string> = {
  [StorageLocation.FRIDGE]: 'locations.fridge',
  [StorageLocation.FREEZER]: 'locations.freezer',
  [StorageLocation.PANTRY]: 'locations.pantry',
  [StorageLocation.OTHER]: 'locations.other'
};

/**
 * Interface pour un aliment stocké
 */
export interface Food {
  id: string;
  name: string;
  quantity: number;
  unit?: string; // Unité (valeur Unit ou id d'unité personnalisée)
  location?: string; // Lieu de rangement (valeur StorageLocation ou id de lieu personnalisé)
  minimalStock?: number; // Quantité minimale souhaitée (V1)
  isFavorite?: boolean; // Pour les favoris (V1)
  step?: number; // Pas d'incrémentation utilisé par les boutons +/-
  notes?: string;
  imageUrl?: string; // Image personnalisée (data URL) choisie par l'utilisateur
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO pour créer/modifier un aliment
 */
export interface CreateFoodDTO {
  name: string;
  quantity: number;
  unit?: string;
  location?: string;
  minimalStock?: number;
  isFavorite?: boolean;
  step?: number;
  notes?: string;
  imageUrl?: string;
}

/**
 * DTO pour mettre à jour la quantité rapidement
 */
export interface UpdateQuantityDTO {
  foodId: string;
  quantity: number;
}
