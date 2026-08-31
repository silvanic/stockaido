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
  expiresAt?: string; // Date de péremption imprimée sur l'emballage (`YYYY-MM-DD`)
  openedAt?: string; // Date d'ouverture (`YYYY-MM-DD`)
  daysAfterOpening?: number; // « À consommer dans les X jours suivant l'ouverture »
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
  expiresAt?: string;
  openedAt?: string;
  daysAfterOpening?: number;
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

/** Formate une date au format calendrier local `YYYY-MM-DD` */
function toIsoDay(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Décale une date `YYYY-MM-DD` de `days` jours, en restant sur le calendrier local */
function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  date.setDate(date.getDate() + days);
  return toIsoDay(date);
}

/**
 * Échéance réelle d'un aliment : la plus proche entre la date imprimée et
 * la limite de consommation après ouverture.
 */
export function getFoodExpiry(food: Pick<Food, 'expiresAt' | 'openedAt' | 'daysAfterOpening'>): string | undefined {
  const candidates: string[] = [];
  if (food.expiresAt) candidates.push(food.expiresAt);
  if (food.openedAt && food.daysAfterOpening !== undefined && food.daysAfterOpening >= 0) {
    candidates.push(addDays(food.openedAt, food.daysAfterOpening));
  }
  // Les dates ISO se comparent lexicographiquement
  return candidates.length > 0 ? candidates.sort()[0] : undefined;
}

export type ExpiryStatus = 'expired' | 'soon';

/** Nombre de jours avant l'échéance à partir duquel on alerte l'utilisateur */
export const EXPIRY_WARNING_DAYS = 3;

/** `expired` si l'échéance est passée, `soon` à partir de J-3, sinon rien */
export function getExpiryStatus(
  food: Pick<Food, 'expiresAt' | 'openedAt' | 'daysAfterOpening'>
): ExpiryStatus | undefined {
  const expiry = getFoodExpiry(food);
  if (!expiry) return undefined;
  const today = toIsoDay(new Date());
  if (expiry < today) return 'expired';
  if (expiry <= addDays(today, EXPIRY_WARNING_DAYS)) return 'soon';
  return undefined;
}
