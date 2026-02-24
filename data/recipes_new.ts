import { Recipe } from '../types';

export const BOUNDARIES_RECIPES: Recipe[] = [
  // ── 1. ESPRESSO STANDARDS ──
  {
    id: 'r-monarch',
    title: 'Monarch Espresso',
    category: 'Espresso Standards',
    type: 'ESPRESSO',
    dose: '19g',
    yield: '2 oz',
    time: '24s',
    notes: 'Machine: La Marzocco PB3 Group Head. Grinder: Mahlkönig E80 GBW (grind-by-weight). Tamper: PuqPress Automatic. Shot window: ±2 seconds of standard time.'
  },
  {
    id: 'r-shot-standards',
    title: 'Shot Standards by Drink Type',
    category: 'Espresso Standards',
    type: 'GRID',
    gridColumns: ['Drink Type', 'Espresso'],
    gridRows: [
      { label: 'Hot Lattes (all sizes)', values: ['2 oz'] },
      { label: 'Iced Lattes (all sizes)', values: ['2 oz'] },
      { label: 'Hot Americano', values: ['2 oz'] },
      { label: 'Iced Americano', values: ['3 oz'] },
      { label: 'Cortado', values: ['2 oz'] },
      { label: 'Cappuccino', values: ['2 oz'] },
      { label: 'Macchiato', values: ['2 oz'] },
      { label: 'Flat White', values: ['2 oz'] }
    ]
  },

  // ── 2. LATTES (ORIGINALS) ──
  {
    id: 'r-latte-build',
    title: 'Standard Latte Build',
    category: 'Lattes',
    type: 'STANDARD',
    steps: [
      '1 oz total syrup/sauce (ALL sizes, ALL temperatures)',
      '2 oz espresso (ALL sizes)',
      'Fill with milk to appropriate line'
    ],
    notes: 'Sizes — Hot: 12oz, 16oz | Iced: 16oz, 20oz'
  },
  {
    id: 'r-latte-milk',
    title: 'Latte Milk Amounts',
    category: 'Lattes',
    type: 'GRID',
    gridColumns: ['Size / Temp', 'Milk Amount'],
    gridRows: [
      { label: 'Hot 12oz', values: ['8 oz (steamed)'] },
      { label: 'Hot 16oz', values: ['10 oz (steamed)'] },
      { label: 'Iced 16oz', values: ['Fill to 11 oz line'] },
      { label: 'Iced 20oz', values: ['Fill to 14 oz line'] }
    ]
  },
  {
    id: 'r-sig-lattes',
    title: 'Signature Lattes',
    category: 'Lattes',
    type: 'GRID',
    gridColumns: ['Drink', 'Syrup Build', 'Notes'],
    gridRows: [
      { label: 'Texas Delight', values: ['1 oz Texas Delight syrup (pre-made off-site)', 'Honey, Vanilla, Cinnamon'] },
      { label: 'Hill Country', values: ['1 oz Hill Country mix OR 20g Caramel + 0.5 oz Butter Pecan', ''] },
      { label: 'Cinnamon Dulce', values: ['1 oz Cinnamon Dulce syrup', ''] },
      { label: 'Lavender Sunrise', values: ['1 oz Lavender Sunrise mix', 'Honey & Lavender'] },
      { label: 'Harvest Moon', values: ['1 oz Harvest Moon mix OR 20g White Choc + 0.5 oz Maple + dash Cinnamon', ''] },
      { label: 'Golden Cream', values: ['1 oz Golden Cream mix OR 20g Caramel + 0.5 oz Vanilla', ''] },
      { label: 'Salted Sweetheart', values: ['1 oz Salted Sweetheart mix OR 0.5 oz Salted Caramel + 20g White Choc', ''] }
    ]
  },

  // ── 3. MATCHAS ──
  {
    id: 'r-matcha-base',
    title: 'Matcha Base Batch Recipe',
    category: 'Matchas',
    type: 'BATCH',
    ingredients: [
      { name: 'Matcha Powder', quantity: '30 grams' },
      { name: 'Water', quantity: '300 milliliters' }
    ],
    notes: 'Sizes — Hot: 12oz, 16oz | Iced: 16oz, 20oz. All matchas: 1 oz total syrup (all sizes, all temps).'
  },
  {
    id: 'r-matcha-concentrate',
    title: 'Matcha Concentrate Amounts',
    category: 'Matchas',
    type: 'GRID',
    gridColumns: ['Size', 'Concentrate'],
    gridRows: [
      { label: 'Small (12oz hot, 16oz iced)', values: ['1 oz'] },
      { label: 'Large (16oz hot, 20oz iced)', values: ['1.5 oz'] },
      { label: 'Extra Matcha', values: ['+0.5 oz additional'] }
    ]
  },
  {
    id: 'r-matcha-milk',
    title: 'Matcha Milk Amounts',
    category: 'Matchas',
    type: 'GRID',
    gridColumns: ['Size / Temp', 'Milk Amount'],
    gridRows: [
      { label: 'Hot 12oz', values: ['8 oz (steamed)'] },
      { label: 'Hot 16oz', values: ['10 oz (steamed)'] },
      { label: 'Iced 16oz', values: ['Fill to 11 oz line'] },
      { label: 'Iced 20oz', values: ['Fill to 14 oz line'] }
    ]
  },
  {
    id: 'r-matcha-flavors',
    title: 'Matcha Flavor Builds',
    category: 'Matchas',
    type: 'GRID',
    gridColumns: ['Flavor', 'Syrup Build (1 oz total)'],
    gridRows: [
      { label: 'Plain Matcha', values: ['1 oz Vanilla'] },
      { label: 'Blue Coconut', values: ['1 oz Coconut'] },
      { label: 'Strawberry Dream', values: ['0.5 oz Strawberry + 0.5 oz Vanilla'] },
      { label: 'Banana Baby', values: ['0.33 oz Banana + 0.33 oz Maple + 0.33 oz Vanilla'] }
    ]
  },

  // ── 4. NITRO COLD BREW ──
  {
    id: 'r-nitro-build',
    title: 'Standard Nitro Build',
    category: 'Nitro Cold Brew',
    type: 'STANDARD',
    steps: [
      'Cup size with 1 scoop ice',
      'Fill nitro to 2nd-to-last line',
      'Add 3 oz sweet cream',
      'Add 0.5 oz flavor syrup'
    ]
  },
  {
    id: 'r-nitro-flavors',
    title: 'Nitro Flavors',
    category: 'Nitro Cold Brew',
    type: 'GRID',
    gridColumns: ['Flavor', 'Build'],
    gridRows: [
      { label: 'Vanilla Cream', values: ['0.5 oz Vanilla'] },
      { label: 'Salted Caramel', values: ['0.5 oz Salted Caramel'] },
      { label: 'Cookie Butter', values: ['0.5 oz Biscoff syrup + 10g White Chocolate sauce'] }
    ]
  },

  // ── 5. SWEET CREAM STANDARDS ──
  {
    id: 'r-sweet-cream',
    title: 'Sweet Cream Standards',
    category: 'Sweet Cream',
    type: 'GRID',
    gridColumns: ['Type', 'Cream', 'Syrup'],
    gridRows: [
      { label: 'Standard Sweet Cream', values: ['3 oz', '0.5 oz'] },
      { label: 'Extra Sweet Cream', values: ['4 oz total', '—'] },
      { label: 'Extra Sweet', values: ['—', '1 oz'] }
    ],
    notes: 'Prepared in tumblers, labeled and dated, stored cold. 24 hours max.'
  },

  // ── 6. ENERGY DRINKS (LOTUS) ──
  {
    id: 'r-energy-syrup',
    title: 'Energy Drink Syrup Amounts',
    category: 'Energy Drinks',
    type: 'GRID',
    gridColumns: ['Size', 'Syrup', 'Fill Line'],
    gridRows: [
      { label: '12oz', values: ['0.5 oz', '9 oz'] },
      { label: '16oz', values: ['1 oz', '11 oz'] },
      { label: '20oz', values: ['1.5 oz', '14 oz'] },
      { label: '24oz', values: ['2 oz', '16 oz'] }
    ],
    notes: 'Multi-flavor: divide syrup equally (e.g. 2 flavors in 16oz = 0.75 oz each).'
  },
  {
    id: 'r-energy-flavors',
    title: 'Energy Drink Menu Flavors',
    category: 'Energy Drinks',
    type: 'GRID',
    gridColumns: ['Drink', 'Flavors'],
    gridRows: [
      { label: 'The Drift', values: ['Strawberry & Pineapple'] },
      { label: 'Electric B', values: ['Blue Raspberry & Lime'] },
      { label: 'Mystic Cherry', values: ['Cherry & Coconut'] },
      { label: 'Golden Wave', values: ['Orange & Lime'] },
      { label: 'Blue Haze', values: ['Lavender, Blue Razz, Pomegranate'] },
      { label: 'Dreamwave', values: ['Passionfruit, Strawberry, Kiwi'] },
      { label: 'Strawberry Storm', values: ['Strawberry & Lavender'] },
      { label: 'Voltage', values: ['Blackberry & Lemon Concentrate'] }
    ]
  },

  // ── 7. BUBBLY / SODA DRINKS ──
  {
    id: 'r-bubbly-build',
    title: 'Bubbly / Soda Build',
    category: 'Bubbly & Soda',
    type: 'GRID',
    gridColumns: ['Size', 'Syrup'],
    gridRows: [
      { label: '12oz', values: ['1 oz'] },
      { label: '16oz', values: ['1.5 oz'] },
      { label: '20oz', values: ['2 oz'] },
      { label: '24oz', values: ['2 oz'] }
    ],
    notes: 'Syrup + bubbly/soda water to fill line. Multi-flavor: divide syrup equally.'
  },

  // ── 8. FROZEN COFFEE ──
  {
    id: 'r-frozen-coffee-syrup',
    title: 'Frozen Coffee Syrup / Sauce',
    category: 'Frozen Coffee',
    type: 'GRID',
    gridColumns: ['Size', 'Syrup', 'Sauce'],
    gridRows: [
      { label: '16oz', values: ['1 oz', '40g'] },
      { label: '20oz', values: ['1.5 oz', '60g'] }
    ],
    notes: '16oz and 20oz ONLY (no 12oz or 24oz).'
  },
  {
    id: 'r-frozen-coffee-full',
    title: 'Frozen Coffee Base — Full Batch (10L)',
    category: 'Frozen Coffee',
    type: 'BATCH',
    ingredients: [
      { name: 'Espresso (hot)', quantity: '2.0 L' },
      { name: 'Raw Sugar', quantity: '770 g' },
      { name: 'Whole Milk', quantity: '4.6 L' },
      { name: '2% Milk', quantity: '2.7 L' }
    ],
    steps: [
      'Dissolve sugar in HOT espresso',
      'Chill espresso before adding milk',
      'SLUSH mode only',
      'Target temperature: 30-32°F'
    ]
  },
  {
    id: 'r-frozen-coffee-refill',
    title: 'Frozen Coffee Base — Refill (5L)',
    category: 'Frozen Coffee',
    type: 'BATCH',
    ingredients: [
      { name: 'Espresso', quantity: '1.0 L' },
      { name: 'Raw Sugar', quantity: '385 g' },
      { name: 'Whole Milk', quantity: '2.3 L' },
      { name: '2% Milk', quantity: '1.35 L' }
    ]
  },

  // ── 9. FROZEN ENERGY ──
  {
    id: 'r-frozen-energy-syrup',
    title: 'Frozen Energy Syrup Amounts',
    category: 'Frozen Energy',
    type: 'GRID',
    gridColumns: ['Size', 'Syrup'],
    gridRows: [
      { label: '12oz', values: ['1 oz'] },
      { label: '16oz', values: ['1.5 oz'] },
      { label: '20oz', values: ['2 oz'] },
      { label: '24oz', values: ['2.5 oz'] }
    ],
    notes: 'Multi-flavor: divide syrup equally.'
  },
  {
    id: 'r-frozen-energy-full',
    title: 'Frozen Energy Base — Full Batch (10L)',
    category: 'Frozen Energy',
    type: 'BATCH',
    ingredients: [
      { name: 'Lotus Concentrate', quantity: '1.0 L' },
      { name: 'Water', quantity: '8.0 L' },
      { name: 'Sugar', quantity: '350 g' }
    ],
    steps: [
      'No dairy',
      'No flavors in hopper',
      'SLUSH mode only',
      'Chill before loading'
    ]
  },
  {
    id: 'r-frozen-energy-refill',
    title: 'Frozen Energy Base — Refill (5L)',
    category: 'Frozen Energy',
    type: 'BATCH',
    ingredients: [
      { name: 'Lotus', quantity: '0.5 L' },
      { name: 'Water', quantity: '4.0 L' },
      { name: 'Sugar', quantity: '175 g' }
    ]
  },

  // ── 10. FROZEN LEMONADE ──
  {
    id: 'r-frozen-lemonade',
    title: 'Frozen Lemonade Build',
    category: 'Frozen Lemonade',
    type: 'GRID',
    gridColumns: ['Size', 'Concentrate', 'Water', 'Syrup', 'Ice'],
    gridRows: [
      { label: '12oz', values: ['1.5 oz', '2.5 oz', '1 oz', '12oz scoop'] },
      { label: '16oz', values: ['3 oz', '4 oz', '1.5 oz', '24oz scoop'] },
      { label: '20oz', values: ['4.5 oz', '6 oz', '2 oz', '24oz + 10oz scoop'] },
      { label: '24oz', values: ['6 oz', '8 oz', '2.5 oz', '24oz + 12oz scoop'] }
    ],
    notes: 'Level scoops only. Liquids first, ice second. No extra water. Do not top with ice after blending.'
  },

  // ── 11. REGULAR LEMONADES ──
  {
    id: 'r-lemonade-build',
    title: 'Regular Lemonade Build',
    category: 'Lemonades',
    type: 'GRID',
    gridColumns: ['Size', 'Concentrate', 'Syrup (if flavored)', 'Water Fill Line'],
    gridRows: [
      { label: '12oz', values: ['1 oz', '1 oz', '9 oz'] },
      { label: '16oz', values: ['1.5 oz', '1.5 oz', '11 oz'] },
      { label: '20oz', values: ['2 oz', '2 oz', '14 oz'] },
      { label: '24oz', values: ['2.5 oz', '2.5 oz', '17 oz'] }
    ],
    notes: 'Equal parts concentrate and syrup (if flavored), then water to fill line.'
  },
  {
    id: 'r-lemonade-flavors',
    title: 'Lemonade Menu Flavors',
    category: 'Lemonades',
    type: 'GRID',
    gridColumns: ['Flavor', 'Description'],
    gridRows: [
      { label: 'Boundaries Lagoon', values: ['Blue Raspberry, Coconut, Lime'] },
      { label: 'Cherry Limeade', values: ['Cherry, Lime, Lemon'] },
      { label: 'Pink Paradise', values: ['Strawberry & Vanilla'] },
      { label: 'Sunset', values: ['Pineapple, Mango, Strawberry'] }
    ]
  },

  // ── 12. SMOOTHIES ──
  {
    id: 'r-smoothie-build',
    title: 'Smoothie Build',
    category: 'Smoothies',
    type: 'GRID',
    gridColumns: ['Size', 'Puree', 'Water', 'Ice'],
    gridRows: [
      { label: '12oz', values: ['3 oz', '2 oz', 'Heaping scoop (cup overflowing)'] },
      { label: '16oz', values: ['4 oz', '3 oz', 'Heaping scoop (cup overflowing)'] },
      { label: '20oz', values: ['5 oz', '4 oz', 'Heaping scoop (cup overflowing)'] },
      { label: '24oz', values: ['6 oz', '5 oz', 'Heaping scoop (cup overflowing)'] }
    ],
    notes: 'Puree + Water + Heaping scoop of ice (fill cup overflowing) → Blend.'
  },
  {
    id: 'r-smoothie-flavors',
    title: 'Smoothie Flavors',
    category: 'Smoothies',
    type: 'GRID',
    gridColumns: ['Flavor', 'Puree Type'],
    gridRows: [
      { label: 'Strawberry Splash', values: ['100% Strawberry Puree'] },
      { label: 'Piña Colada', values: ['Coconut & Pineapple Puree'] },
      { label: 'Perfect Peach', values: ['100% Peach Puree'] },
      { label: 'Mellow Mango', values: ['100% Mango Puree'] }
    ]
  },

  // ── 13. TEAS ──
  {
    id: 'r-tea-concentrates',
    title: 'Iced Tea Concentrate Recipes',
    category: 'Teas',
    type: 'GRID',
    gridColumns: ['Tea', 'Grams', 'Steep Time'],
    gridRows: [
      { label: 'Citrus Oolong', values: ['40.8g', '5 minutes'] },
      { label: 'Lavender Coconut Rooibos', values: ['40.8g', '10 minutes'] },
      { label: 'Pomberry Punch', values: ['40.8g', '11 minutes'] },
      { label: 'Honey Ginger Peach', values: ['40.8g', '6 minutes'] },
      { label: 'Magical Unicorn', values: ['30g', '5 min (⅛ qt water → fill ½ qt)'] }
    ],
    notes: 'General rule: Weigh tea, steep in ½ quart hot water, strain, fill to 1 quart with cold water. Hot teas: 3.5g per sachet.'
  },
  {
    id: 'r-tea-sweetening',
    title: 'Iced Tea Sweetening Rule',
    category: 'Teas',
    type: 'GRID',
    gridColumns: ['Size', 'Simple Syrup'],
    gridRows: [
      { label: '12oz', values: ['0.5 oz'] },
      { label: '16oz', values: ['1 oz'] },
      { label: '20oz', values: ['1.5 oz'] },
      { label: '24oz', values: ['1.5 oz'] }
    ],
    notes: 'Only when ordered sweet.'
  },

  // ── 14. KIDS DRINKS ──
  {
    id: 'r-kids-unicorn',
    title: 'Unicorn Latte',
    category: 'Kids Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Magical Unicorn tea concentrate', quantity: 'Equal parts' },
      { name: 'Whole Milk', quantity: 'Equal parts' }
    ],
    notes: '12oz, Iced, Caffeine-free. Sweeten with simple syrup using tea sweetening rule.'
  },
  {
    id: 'r-kids-dino',
    title: 'Dino Juice',
    category: 'Kids Drinks',
    type: 'GRID',
    gridColumns: ['Size', 'Lemonade Conc', 'Blue Raspberry', 'Pineapple', 'Water'],
    gridRows: [
      { label: '12oz', values: ['1 oz', '0.5 oz', '0.5 oz', 'To fill line'] },
      { label: '16oz', values: ['1.5 oz', '0.75 oz', '0.75 oz', 'To fill line'] },
      { label: '20oz', values: ['2 oz', '1 oz', '1 oz', 'To fill line'] },
      { label: '24oz', values: ['2.5 oz', '1.25 oz', '1.25 oz', 'To fill line'] }
    ],
    notes: 'Blue Raspberry Pineapple Lemonade. Serve over ice.'
  },
  {
    id: 'r-kids-zebra',
    title: 'Zebra Milk',
    category: 'Kids Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Dark Chocolate sauce', quantity: '10 grams' },
      { name: 'White Chocolate sauce', quantity: '10 grams' },
      { name: 'Milk', quantity: 'Fill with cold milk' }
    ],
    notes: '12oz, Iced. Serve over ice.'
  },
  {
    id: 'r-kids-kiddos',
    title: 'Kiddos Coffee',
    category: 'Kids Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Syrup (any flavor)', quantity: '0.5 oz' },
      { name: 'Milk', quantity: 'Steamed milk (kids temp)' }
    ],
    notes: '8oz, Hot, Caffeine-free.'
  },

  // ── 15. BATCH BREW & COLD BREW ──
  {
    id: 'r-batch-brew',
    title: 'Batch Brew (Fetco)',
    category: 'Batch Brew',
    type: 'STANDARD',
    ingredients: [
      { name: 'Coffee Weight', quantity: '240 grams' },
      { name: 'Grinder', quantity: 'EK-43, Grind Size 9' },
      { name: 'Batch Size', quantity: '1 Gallon' }
    ],
    steps: [
      'Grind beans on EK-43 (grind 9)',
      'Form filter correctly to avoid collapse',
      'Place filter in basket, ensure lid open and pour stop closed',
      'Press 1-Gallon Batch',
      'Label dispenser with brew time and initials'
    ]
  },
  {
    id: 'r-cold-brew',
    title: 'Cold Brew (Toddy Method)',
    category: 'Batch Brew',
    type: 'STANDARD',
    ingredients: [
      { name: 'Cold Brew Roast Coffee', quantity: 'Entire 5 lb bag' },
      { name: 'Water (initial)', quantity: '7 quarts' },
      { name: 'Water (second pour)', quantity: '7 quarts' },
      { name: 'Fresh Water (dilution)', quantity: '7 quarts' }
    ],
    steps: [
      'Grind entire 5 lb bag of Cold Brew Roast coffee',
      'Insert paper filter and mesh filter in Toddy bucket',
      'Add grounds to filter bag',
      'Pour 7 quarts water over grounds',
      'Tie bag and pour another 7 quarts over top',
      'Steep 10 hours',
      'Label with name and time brewed',
      'Strain, discard grounds carefully',
      'Add 7 quarts fresh water to Toddy',
      'Fill and crimp Nitro bag, label, store FIFO in walk-in'
    ]
  },

  // ── 16. CLASSIC ESPRESSO DRINKS ──
  {
    id: 'r-classic-espresso',
    title: 'Classic Espresso Drinks',
    category: 'Classic Espresso',
    type: 'GRID',
    gridColumns: ['Drink', 'Temp', 'Size', 'Espresso', 'Notes'],
    gridRows: [
      { label: 'Americano', values: ['Hot', 'Standard', '2 oz', '+ hot water'] },
      { label: 'Americano', values: ['Iced', 'Standard', '3 oz', '+ cold water over ice'] },
      { label: 'Cortado', values: ['Hot', '4 oz', '2 oz', 'Equal milk & espresso'] },
      { label: 'Cappuccino', values: ['Hot', '6 oz', '2 oz', 'Dry foam'] },
      { label: 'Macchiato', values: ['Hot', '3 oz', '2 oz', 'Marked with foam'] },
      { label: 'Flat White', values: ['Hot', '8 oz', '2 oz', 'Thin microfoam, no dry foam'] }
    ]
  },

  // ── 17. PRE-BATCH RECIPES ──
  {
    id: 'r-prebatch-mixes',
    title: 'Signature Mix Recipes',
    category: 'Pre-Batch',
    type: 'GRID',
    gridColumns: ['Mix', 'Ingredient 1', 'Ingredient 2', 'Notes'],
    gridRows: [
      { label: 'Hill Country', values: ['64 oz Butter Pecan', '64 oz Caramel', ''] },
      { label: 'Lavender Sunrise', values: ['64 oz Honey', '64 oz Lavender', ''] },
      { label: 'Harvest Moon', values: ['64 oz White Chocolate', '64 oz Maple', 'Cinnamon at build'] },
      { label: 'Golden Cream', values: ['64 oz Caramel', '64 oz Vanilla', ''] },
      { label: 'Salted Sweetheart', values: ['64 oz Salted Caramel', '64 oz White Chocolate', ''] },
      { label: 'Sweet Trio', values: ['42.67 oz Dark Chocolate', '42.67 oz Caramel', '+ 42.67 oz Hazelnut'] }
    ],
    notes: 'All batches: 1-gallon increments (128 oz). Warm all sauces in hot water bath before mixing. Label with product name, date, and initials.'
  },

  // ── 18. QUICK REFERENCE TABLES ──
  {
    id: 'r-qr-syrup',
    title: 'Syrup Amounts by Size (All Categories)',
    category: 'Quick Reference',
    type: 'GRID',
    gridColumns: ['Category', '12oz', '16oz', '20oz', '24oz'],
    gridRows: [
      { label: 'Lattes', values: ['1 oz', '1 oz', '1 oz', 'N/A'] },
      { label: 'Matchas', values: ['1 oz', '1 oz', '1 oz', 'N/A'] },
      { label: 'Energy Drinks', values: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'] },
      { label: 'Frozen Energy', values: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'] },
      { label: 'Bubbly', values: ['1 oz', '1.5 oz', '2 oz', '2 oz'] },
      { label: 'Frozen Coffee', values: ['N/A', '1 oz', '1.5 oz', 'N/A'] },
      { label: 'Frozen Lemonade', values: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'] },
      { label: 'Regular Lemonade', values: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'] },
      { label: 'Tea Sweetening', values: ['0.5 oz', '1 oz', '1.5 oz', '1.5 oz'] }
    ]
  },
  {
    id: 'r-qr-matcha',
    title: 'Matcha Concentrate Amounts',
    category: 'Quick Reference',
    type: 'GRID',
    gridColumns: ['Size', 'Concentrate'],
    gridRows: [
      { label: 'Small (12oz hot, 16oz iced)', values: ['1 oz'] },
      { label: 'Large (16oz hot, 20oz iced)', values: ['1.5 oz'] },
      { label: 'Extra Matcha', values: ['+0.5 oz'] }
    ]
  },
  {
    id: 'r-qr-fill',
    title: 'Fill Lines by Size',
    category: 'Quick Reference',
    type: 'GRID',
    gridColumns: ['Size', 'Fill Line'],
    gridRows: [
      { label: '12oz', values: ['9 oz'] },
      { label: '16oz', values: ['11 oz'] },
      { label: '20oz', values: ['14 oz'] },
      { label: '24oz', values: ['17 oz'] }
    ]
  },
  {
    id: 'r-qr-flavors',
    title: 'Available Flavors',
    category: 'Quick Reference',
    type: 'STANDARD',
    ingredients: [
      { name: 'TX Delight', quantity: '' },
      { name: 'Vanilla (SF)', quantity: '' },
      { name: 'Dark Choc (SF)', quantity: '' },
      { name: 'Caramel (SF)', quantity: '' },
      { name: 'White Choc', quantity: '' },
      { name: 'Hazelnut', quantity: '' },
      { name: 'Salted Caramel', quantity: '' },
      { name: 'Lavender', quantity: '' },
      { name: 'Honey', quantity: '' },
      { name: 'Maple', quantity: '' },
      { name: 'Coconut', quantity: '' },
      { name: 'Cardamom', quantity: '' },
      { name: 'Mango', quantity: '' },
      { name: 'Peach', quantity: '' },
      { name: 'Banana', quantity: '' },
      { name: 'Blue Razz', quantity: '' },
      { name: 'Pomegranate', quantity: '' },
      { name: 'Kiwi', quantity: '' },
      { name: 'Raspberry', quantity: '' },
      { name: 'Strawberry', quantity: '' },
      { name: 'Blueberry', quantity: '' },
      { name: 'Cherry', quantity: '' },
      { name: 'Lime', quantity: '' },
      { name: 'Orange', quantity: '' },
      { name: 'Pineapple', quantity: '' },
      { name: 'Biscoff', quantity: '' },
      { name: 'Seasonal Offerings', quantity: '' }
    ],
    notes: '(SF) = Sugar-Free available. Seasonal offerings rotate.'
  }
];
