/**
 * Métadonnées d'un aliment du catalogue de référence (src/assets/catalog/catalog.json).
 * Les libellés sont stockés à part, par langue, et rattachés via l'id.
 */
export interface CatalogMetadata {
  id: string;
  unit?: string;
  location?: string;
}

export interface CatalogFile {
  version: number;
  entries: CatalogMetadata[];
}

/**
 * Entrée de catalogue résolue dans la langue courante
 */
export interface CatalogEntry extends CatalogMetadata {
  name: string;
  searchKey: string; // nom normalisé, pré-calculé au chargement
}

/**
 * Suggestion affichée sous le champ « nom », issue soit de l'inventaire de l'utilisateur,
 * soit du catalogue de référence
 */
export interface NameSuggestion {
  name: string;
  unit?: string;
  location?: string;
  step?: number;
  fromCatalog: boolean;
}
