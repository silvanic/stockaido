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
 * Labels pour les unités (pointe vers units.piece.label, units.g.label, etc.)
 */
export const UNIT_LABELS: Record<Unit, string> = {
  [Unit.PIECE]: 'units.piece.label',
  [Unit.GRAM]: 'units.g.label',
  [Unit.KILOGRAM]: 'units.kg.label',
  [Unit.MILLILITER]: 'units.ml.label',
  [Unit.LITER]: 'units.l.label',
  [Unit.DECILITER]: 'units.dl.label',
  [Unit.TABLESPOON]: 'units.tablespoon.label',
  [Unit.TEASPOON]: 'units.teaspoon.label',
  [Unit.CUP]: 'units.cup.label',
  [Unit.BOTTLE]: 'units.bottle.label',
  [Unit.PACKAGE]: 'units.package.label',
  [Unit.BOX]: 'units.box.label',
  [Unit.JAR]: 'units.jar.label',
  [Unit.CARTON]: 'units.carton.label'
};

/**
 * Diminutifs pour les unités (pointe vers units.piece.short, units.g.short, etc.)
 */
export const UNIT_SHORTS: Record<Unit, string> = {
  [Unit.PIECE]: 'units.piece.short',
  [Unit.GRAM]: 'units.g.short',
  [Unit.KILOGRAM]: 'units.kg.short',
  [Unit.MILLILITER]: 'units.ml.short',
  [Unit.LITER]: 'units.l.short',
  [Unit.DECILITER]: 'units.dl.short',
  [Unit.TABLESPOON]: 'units.tablespoon.short',
  [Unit.TEASPOON]: 'units.teaspoon.short',
  [Unit.CUP]: 'units.cup.short',
  [Unit.BOTTLE]: 'units.bottle.short',
  [Unit.PACKAGE]: 'units.package.short',
  [Unit.BOX]: 'units.box.short',
  [Unit.JAR]: 'units.jar.short',
  [Unit.CARTON]: 'units.carton.short'
};

/**
 * Unité personnalisée, créée librement par l'utilisateur
 */
export interface CustomUnit {
  id: string;
  name: string;
  short?: string; // Diminutif optionnel (ex: "c.à.s." pour "cuillère à soupe")
  createdAt: Date;
}

