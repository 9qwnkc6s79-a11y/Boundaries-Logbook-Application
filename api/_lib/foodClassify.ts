import type { FoodCategoryHint } from '../../types';

/**
 * Tag QUANTITY / OUT_OF_STOCK items as likely-food vs likely-drink.
 * Never silently drop — unknown stays in the Owen food view.
 */

const FOOD_MENU_PHRASES = [
  'main street',
  'bistro',
  'lisa cordero',
  'sysco',
  'food',
  'pastry',
  'bakery',
  'taco',
  'sandwich',
  'breakfast',
  'lunch',
  'dinner',
  'entree',
  'entrée',
  'snack',
  'grab and go',
  'grab n go',
  'kitchen',
];

const FOOD_ITEM_KEYWORDS = [
  'taco', 'sandwich', 'pastry', 'croissant', 'muffin', 'bagel', 'cookie',
  'brownie', 'cake', 'cupcake', 'quiche', 'wrap', 'burrito', 'salad', 'soup',
  'empanada', 'quesadilla', 'nacho', 'pizza', 'panini', 'scone', 'donut',
  'doughnut', 'kolache', 'biscuit', 'bread', 'pretzel', 'chip', 'fruit',
  'yogurt', 'parfait', 'granola', 'slider', 'burger', 'hot dog', 'danish',
  'turnover', 'strudel', 'churro', 'flauta', 'tostada', 'tortilla', 'chicken',
  'beef', 'pork', 'bacon', 'sausage', 'avocado toast', 'acai', 'waffle',
  'pancake', 'french toast', 'hummus', 'pita', 'falafel', 'protein', 'platter',
  'entree', 'entrée', 'appetizer', 'queso', 'guacamole', 'rice bowl',
];

const DRINK_MENU_PHRASES = [
  'syrup', 'espresso bar', 'coffee drinks', 'beverages', 'hot drinks',
  'cold drinks', 'specialty drinks', 'tea menu',
];

const DRINK_ITEM_KEYWORDS = [
  'latte', 'mocha', 'cappuccino', 'espresso', 'americano', 'macchiato',
  'cold brew', 'nitro', 'cortado', 'flat white', 'affogato', 'pour over',
  'drip coffee', 'brewed coffee', 'matcha', 'chai', 'lemonade', 'refresher',
  'frappe', 'frappuccino', 'smoothie', 'milkshake', 'red bull', 'energy drink',
  'sparkling', 'syrup', 'hot chocolate', 'cocoa', 'kombucha', 'horchata',
  'steamer', 'breve',
];

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some(n => haystack.includes(n));
}

export function classifyFoodItem(meta: {
  name?: string;
  menuName?: string;
  menuGroup?: string;
}): { categoryHint: FoodCategoryHint; includeInFoodView: boolean } {
  const name = (meta.name || '').trim();
  const menuName = (meta.menuName || '').trim();
  const menuGroup = (meta.menuGroup || '').trim();

  if (!name && !menuName && !menuGroup) {
    return { categoryHint: 'unknown', includeInFoodView: true };
  }

  const menuText = `${menuName} ${menuGroup}`.toLowerCase();
  const itemText = name.toLowerCase();

  const menuIsFood = includesAny(menuText, FOOD_MENU_PHRASES);
  const menuIsDrink = includesAny(menuText, DRINK_MENU_PHRASES);
  const itemIsFood = includesAny(itemText, FOOD_ITEM_KEYWORDS);
  const itemIsDrink = includesAny(itemText, DRINK_ITEM_KEYWORDS);

  if (menuIsFood && itemIsFood) {
    return { categoryHint: 'food', includeInFoodView: true };
  }
  if (menuIsFood && !itemIsDrink) {
    return { categoryHint: 'food', includeInFoodView: true };
  }
  if (itemIsFood && !itemIsDrink) {
    return { categoryHint: 'food', includeInFoodView: true };
  }
  if (itemIsDrink && !itemIsFood && !menuIsFood) {
    return { categoryHint: 'drink', includeInFoodView: false };
  }
  if (menuIsDrink && !itemIsFood) {
    return { categoryHint: 'drink', includeInFoodView: false };
  }
  if (itemIsFood && itemIsDrink) {
    if (menuIsFood) return { categoryHint: 'food', includeInFoodView: true };
    return { categoryHint: 'unknown', includeInFoodView: true };
  }

  return { categoryHint: 'unknown', includeInFoodView: true };
}
