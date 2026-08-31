/**
 * Article ajouté librement à la liste "À acheter", indépendant du stock (Food)
 */
export interface ShoppingListItem {
  id: string;
  name: string;
  checked: boolean;
  createdAt: Date;
}
