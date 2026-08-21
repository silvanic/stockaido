/**
 * Énumération des unités disponibles
 */
export enum Unit {
  PIECE = 'piece',
  GRAM = 'g',
  KILOGRAM = 'kg',
  MILLILITER = 'ml',
  LITER = 'l',
  DECILITER = 'dl',
  TABLESPOON = 'cuillère à soupe',
  TEASPOON = 'cuillère à café',
  CUP = 'tasse',
  BOTTLE = 'bouteille',
  PACKAGE = 'paquet',
  BOX = 'boîte',
  JAR = 'pot',
  CARTON = 'carton'
}

/**
 * Labels pour les unités
 */
export const UNIT_LABELS: Record<Unit, string> = {
  [Unit.PIECE]: 'units.piece',
  [Unit.GRAM]: 'units.g',
  [Unit.KILOGRAM]: 'units.kg',
  [Unit.MILLILITER]: 'units.ml',
  [Unit.LITER]: 'units.l',
  [Unit.DECILITER]: 'units.dl',
  [Unit.TABLESPOON]: 'units.tablespoon',
  [Unit.TEASPOON]: 'units.teaspoon',
  [Unit.CUP]: 'units.cup',
  [Unit.BOTTLE]: 'units.bottle',
  [Unit.PACKAGE]: 'units.package',
  [Unit.BOX]: 'units.box',
  [Unit.JAR]: 'units.jar',
  [Unit.CARTON]: 'units.carton'
};

/**
 * Unité personnalisée, créée librement par l'utilisateur
 */
export interface CustomUnit {
  id: string;
  name: string;
  createdAt: Date;
}

