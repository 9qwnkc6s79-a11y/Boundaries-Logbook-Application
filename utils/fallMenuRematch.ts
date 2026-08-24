import { Recipe } from '../types';

/** Fall 2026 names appended to Available Flavors. Never replace the card. */
export const FALL_AVAILABLE_FLAVORS: { name: string; quantity: string }[] = [
  { name: 'Pumpkin Spice (SF)', quantity: '' },
  { name: 'Pumpkin Pie', quantity: '' },
];

function flavorKey(name: string): 'pumpkin spice' | 'pumpkin pie' | null {
  const lower = name.toLowerCase();
  if (lower.includes('pumpkin pie')) return 'pumpkin pie';
  if (lower.includes('pumpkin spice')) return 'pumpkin spice';
  return null;
}

/** Append pumpkin spice / pumpkin pie to r-qr-flavors if missing. Other fields stay as-is. */
export function appendFallAvailableFlavors(recipes: Recipe[]): { recipes: Recipe[]; mutated: boolean } {
  const idx = recipes.findIndex(r => r.id === 'r-qr-flavors');
  if (idx === -1) return { recipes, mutated: false };

  const card = recipes[idx];
  const existing = card.ingredients ? [...card.ingredients] : [];
  const have = new Set(
    existing.map(i => flavorKey(i.name)).filter((k): k is 'pumpkin spice' | 'pumpkin pie' => k !== null)
  );

  const missing = FALL_AVAILABLE_FLAVORS.filter(f => {
    const key = flavorKey(f.name);
    return key !== null && !have.has(key);
  });
  if (missing.length === 0) return { recipes, mutated: false };

  const next = recipes.slice();
  next[idx] = { ...card, ingredients: [...existing, ...missing] };
  return { recipes: next, mutated: true };
}
