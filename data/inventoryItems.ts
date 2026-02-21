import { InventoryItem } from '../types';

// Seed definitions with Prosper par values.
// Both stores get seeded with the same items; Elm gets par=0 for all.
interface SeedDef {
  id: string; name: string; category: string; storageLocation: string;
  vendor: string; parProsper: number; brand?: string; unit?: string;
}

const DEFS: SeedDef[] = [
  // Coffee
  { id: 'inv-coffee-monarch', name: 'Monarch', category: 'Coffee', storageLocation: 'Back Stock', vendor: 'Coffee', parProsper: 14, unit: 'bags' },
  { id: 'inv-coffee-southern', name: 'Southern Weather', category: 'Coffee', storageLocation: 'Back Stock', vendor: 'Coffee', parProsper: 5, unit: 'bags' },
  { id: 'inv-coffee-decaf', name: 'Decaf', category: 'Coffee', storageLocation: 'Back Stock', vendor: 'Coffee', parProsper: 1, unit: 'bags' },
  { id: 'inv-coffee-coldbrew', name: 'Cold Brew', category: 'Coffee', storageLocation: 'Back Stock', vendor: 'Coffee', parProsper: 5, unit: 'bags' },

  // Tea - Onyx
  { id: 'inv-tea-rasp-hibiscus', name: 'Raspberry Hibiscus', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Onyx', parProsper: 2, brand: 'Onyx' },
  { id: 'inv-tea-lav-chamomile', name: 'Lavender Chamomile', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Onyx', parProsper: 2, brand: 'Onyx' },
  { id: 'inv-tea-earl-grey', name: 'Earl Grey', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Onyx', parProsper: 2, brand: 'Onyx' },
  { id: 'inv-tea-hot-black', name: 'Hot Black Tea', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Onyx', parProsper: 1, brand: 'Onyx' },

  // Tea - Savoy
  { id: 'inv-tea-hot-green', name: 'Hot Green Tea', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Savoy', parProsper: 1, brand: 'Savoy' },
  { id: 'inv-tea-citrus-oolong', name: 'Citrus Oolong', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Savoy', parProsper: 2, brand: 'Savoy' },
  { id: 'inv-tea-lav-coconut', name: 'Lavender Coconut', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Savoy', parProsper: 2, brand: 'Savoy' },
  { id: 'inv-tea-honey-peach', name: 'Honey Peach Ginger', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Savoy', parProsper: 2, brand: 'Savoy' },
  { id: 'inv-tea-pomberry', name: 'Pomberry Punch', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Savoy', parProsper: 2, brand: 'Savoy' },
  { id: 'inv-tea-unicorn', name: 'Magical Unicorn (Sachet Box)', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Savoy', parProsper: 12, brand: 'Savoy' },
  { id: 'inv-tea-gesundheit', name: 'Gesundheit', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Savoy', parProsper: 2, brand: 'Savoy' },
  { id: 'inv-tea-iced-black', name: 'Iced Black Tea', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Savoy', parProsper: 2, brand: 'Savoy' },
  { id: 'inv-tea-iced-green', name: 'Iced Green Tea', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Savoy', parProsper: 2, brand: 'Savoy' },
  { id: 'inv-tea-matcha', name: 'Kagoshima Matcha', category: 'Tea', storageLocation: 'Dry Storage', vendor: 'Savoy', parProsper: 2, brand: 'Savoy' },

  // Smoothie Purees
  { id: 'inv-puree-strawberry', name: 'Strawberry Smoothie Puree', category: 'Smoothie Purees', storageLocation: 'Walk-In Cooler', vendor: 'TSB', parProsper: 5 },
  { id: 'inv-puree-peach', name: 'Peach Smoothie Puree', category: 'Smoothie Purees', storageLocation: 'Walk-In Cooler', vendor: 'TSB', parProsper: 5 },
  { id: 'inv-puree-pineapple', name: 'Pineapple Puree', category: 'Smoothie Purees', storageLocation: 'Walk-In Cooler', vendor: 'TSB', parProsper: 5 },
  { id: 'inv-puree-coconut', name: 'Coconut Puree', category: 'Smoothie Purees', storageLocation: 'Walk-In Cooler', vendor: 'TSB', parProsper: 5 },
  { id: 'inv-puree-mango', name: 'Mellow Mango Puree', category: 'Smoothie Purees', storageLocation: 'Walk-In Cooler', vendor: 'TSB', parProsper: 5 },

  // Energy Drinks
  { id: 'inv-energy-redbull', name: 'Red Bull (24 Case)', category: 'Energy Drinks', storageLocation: 'Back Stock', vendor: 'Costco', parProsper: 6, brand: 'Red Bull', unit: 'cases' },
  { id: 'inv-energy-redbull-sf', name: 'Sugar Free Red Bull (24 Case)', category: 'Energy Drinks', storageLocation: 'Back Stock', vendor: 'Costco', parProsper: 4, brand: 'Red Bull', unit: 'cases' },

  // Sparkling Water
  { id: 'inv-sparkling-lacroix', name: 'La Croix', category: 'Sparkling Water', storageLocation: 'Back Stock', vendor: 'InstaCart', parProsper: 0, brand: 'La Croix', unit: 'cases' },

  // Dairy - Oak Farms
  { id: 'inv-dairy-whole', name: 'Whole Milk', category: 'Dairy', storageLocation: 'Walk-In Cooler', vendor: 'Oak Farms', parProsper: 0, brand: 'Oak Farms', unit: 'gallons' },
  { id: 'inv-dairy-2pct', name: '2% Milk', category: 'Dairy', storageLocation: 'Walk-In Cooler', vendor: 'Oak Farms', parProsper: 0, brand: 'Oak Farms', unit: 'gallons' },
  { id: 'inv-dairy-halfhalf', name: 'Half & Half', category: 'Dairy', storageLocation: 'Walk-In Cooler', vendor: 'Oak Farms', parProsper: 0, brand: 'Oak Farms', unit: 'gallons' },
  { id: 'inv-dairy-heavy', name: 'Heavy Cream', category: 'Dairy', storageLocation: 'Walk-In Cooler', vendor: 'Oak Farms', parProsper: 0, brand: 'Oak Farms', unit: 'gallons' },
  { id: 'inv-dairy-icecream', name: 'Ice Cream Base', category: 'Dairy', storageLocation: 'Walk-In Cooler', vendor: 'Oak Farms', parProsper: 0, brand: 'Oak Farms', unit: 'gallons' },

  // Dairy - InstaCart
  { id: 'inv-dairy-fairlife', name: 'FairLife', category: 'Dairy', storageLocation: 'Walk-In Cooler', vendor: 'InstaCart', parProsper: 15, brand: 'FairLife' },

  // Alt Milk
  { id: 'inv-altmilk-oat', name: 'Oat Milk', category: 'Alt Milk', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 8 },
  { id: 'inv-altmilk-almond', name: 'Almond Milk (Califia)', category: 'Alt Milk', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Califia' },
  { id: 'inv-altmilk-coconut', name: 'Coconut Milk', category: 'Alt Milk', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 2 },

  // Tea/Concentrate
  { id: 'inv-chai-concentrate', name: 'Chai Concentrate', category: 'Concentrate', storageLocation: 'Walk-In Cooler', vendor: 'TSB', parProsper: 2 },

  // Syrups
  { id: 'inv-syrup-almond', name: 'Almond (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 2, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-banana', name: 'Banana (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 3, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-speculoos', name: 'Speculoos (1883)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 3, brand: '1883', unit: 'bottles' },
  { id: 'inv-syrup-blackberry', name: 'Blackberry (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-bluerasp', name: 'Blue Raspberry (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 6, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-saltcaramel', name: 'Salted Caramel (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 6, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-butterpecan', name: 'Butter Pecan (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 14, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-blueberry', name: 'Blueberry (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 2, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-cherry', name: 'Cherry (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 6, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-coconut', name: 'Coconut Syrup (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-kiwi', name: 'Kiwi (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 2, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-vanilla', name: 'Vanilla (1883)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 14, brand: '1883', unit: 'bottles' },
  { id: 'inv-syrup-lavender', name: 'Lavender (1883)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 14, brand: '1883', unit: 'bottles' },
  { id: 'inv-syrup-lime', name: 'Lime (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 2, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-hazelnut', name: 'Hazelnut (1883)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 14, brand: '1883', unit: 'bottles' },
  { id: 'inv-syrup-mango', name: 'Mango (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 2, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-raspberry', name: 'Raspberry (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-orange', name: 'Orange (1883)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 2, brand: '1883', unit: 'bottles' },
  { id: 'inv-syrup-peach', name: 'Peach (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 2, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-passionfruit', name: 'Passionfruit (1883)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: '1883', unit: 'bottles' },
  { id: 'inv-syrup-pineapple', name: 'Pineapple (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-pomegranate', name: 'Pomegranate (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-strawberry', name: 'Strawberry (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-maple', name: 'Maple (1883)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 8, brand: '1883', unit: 'bottles' },
  { id: 'inv-syrup-cardamom', name: 'Cardamom (1883)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 3, brand: '1883', unit: 'bottles' },
  { id: 'inv-syrup-watermelon', name: 'Watermelon (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-zero-caramel', name: 'Zero Caramel (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-sf-chocolate', name: 'Sugar Free Chocolate (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-syrup-zero-vanilla', name: 'Zero Vanilla (Monin)', category: 'Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Monin', unit: 'bottles' },

  // Seasonal Syrups
  { id: 'inv-seasonal-gingerbread', name: 'Gingerbread (Monin)', category: 'Seasonal Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 6, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-seasonal-peanutbutter', name: 'Peanut Butter (Monin)', category: 'Seasonal Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 6, brand: 'Monin', unit: 'bottles' },
  { id: 'inv-seasonal-peppermint', name: 'Peppermint (1883)', category: 'Seasonal Syrups', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 6, brand: '1883', unit: 'bottles' },

  // Sauces
  { id: 'inv-sauce-caramel', name: 'Caramel (Hollinder)', category: 'Sauces', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 8, brand: 'Hollinder', unit: 'bottles' },
  { id: 'inv-sauce-chocolate', name: 'Chocolate (Hollinder)', category: 'Sauces', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 8, brand: 'Hollinder', unit: 'bottles' },
  { id: 'inv-sauce-whitechoc', name: 'White Chocolate (Hollinder)', category: 'Sauces', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 8, brand: 'Hollinder', unit: 'bottles' },

  // Lotus
  { id: 'inv-lotus-gold', name: 'Gold Concentrate', category: 'Lotus', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 8, brand: 'Lotus', unit: 'bottles' },
  { id: 'inv-lotus-lemonade', name: 'Lemonade Concentrate', category: 'Lotus', storageLocation: 'Dry Storage', vendor: 'TSB', parProsper: 4, brand: 'Lotus', unit: 'bottles' },

  // House Syrup
  { id: 'inv-house-txd', name: 'Gallon of TXD', category: 'House Syrup', storageLocation: 'Walk-In Cooler', vendor: 'Boundaries Order', parProsper: 4, brand: 'Boundaries', unit: 'gallons' },

  // Honey
  { id: 'inv-honey', name: 'Honey', category: 'Honey', storageLocation: 'Dry Storage', vendor: 'Sysco', parProsper: 4 },

  // Cups
  { id: 'inv-cup-8oz-hot', name: '8oz Hot', category: 'Cups', storageLocation: 'Back Stock', vendor: 'TSB', parProsper: 1, unit: 'sleeves' },
  { id: 'inv-cup-12oz-hot', name: '12oz Hot', category: 'Cups', storageLocation: 'Back Stock', vendor: 'Boundaries Order', parProsper: 2, unit: 'sleeves' },
  { id: 'inv-cup-16oz-hot', name: '16oz Hot', category: 'Cups', storageLocation: 'Back Stock', vendor: 'Boundaries Order', parProsper: 2, unit: 'sleeves' },
  { id: 'inv-cup-12oz-iced', name: '12oz Iced', category: 'Cups', storageLocation: 'Back Stock', vendor: 'Boundaries Order', parProsper: 2, unit: 'sleeves' },
  { id: 'inv-cup-16oz-iced', name: '16oz Iced', category: 'Cups', storageLocation: 'Back Stock', vendor: 'Boundaries Order', parProsper: 2, unit: 'sleeves' },
  { id: 'inv-cup-20oz-iced', name: '20oz Iced', category: 'Cups', storageLocation: 'Back Stock', vendor: 'Boundaries Order', parProsper: 2, unit: 'sleeves' },

  // Lids
  { id: 'inv-lid-98mm-straw', name: '98mm Straw Lids', category: 'Lids', storageLocation: 'Back Stock', vendor: 'TSB', parProsper: 2, unit: 'sleeves' },
  { id: 'inv-lid-98mm-sip', name: '98mm Sip Lids', category: 'Lids', storageLocation: 'Back Stock', vendor: 'TSB', parProsper: 2, unit: 'sleeves' },
  { id: 'inv-lid-98mm-nitro', name: '98mm To-Go Nitro Lids', category: 'Lids', storageLocation: 'Back Stock', vendor: 'TSB', parProsper: 1, unit: 'sleeves' },
  { id: 'inv-lid-8oz-hot', name: '8oz Hot Lids', category: 'Lids', storageLocation: 'Back Stock', vendor: 'TSB', parProsper: 1, unit: 'sleeves' },
];

/** Build a store-specific inventory from the shared definitions. */
function buildForStore(storeId: string): InventoryItem[] {
  const isProsper = storeId === 'store-prosper';
  return DEFS.map((d, idx) => ({
    id: d.id,
    name: d.name,
    brand: d.brand,
    category: d.category,
    storageLocation: d.storageLocation,
    vendor: d.vendor,
    par: isProsper ? d.parProsper : 0,
    unit: d.unit,
    active: true,
    sortOrder: idx,
  }));
}

/** Seed items keyed by storeId. */
export const SEED_INVENTORY: Record<string, InventoryItem[]> = {
  'store-prosper': buildForStore('store-prosper'),
  'store-elm': buildForStore('store-elm'),
};
