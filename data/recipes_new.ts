import { Recipe } from '../types';

// Aligned to Boundaries Recipe Book v1.10 (July 2026) — the source of truth.
// Where the book marks a build "Recipe needed" or "not yet documented", the
// recipe below says so rather than carrying retired specs.
export const BOUNDARIES_RECIPES: Recipe[] = [
  // ── 1. CORE STANDARDS ──
  {
    id: 'r-monarch',
    title: 'Espresso Standards',
    category: 'Espresso Standards',
    type: 'ESPRESSO',
    dose: '18g',
    yield: '2 oz',
    time: '±2s of standard',
    notes: 'Machine: La Marzocco PB, 3 group head. Grinder: Mahlkönig E80 GBW (grind-by-weight). Tamper: PuqPress Automatic. One shot means a DOUBLE (2 oz) — singles are not dosed or pulled. Dose: 18g per double shot.'
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
  {
    id: 'r-size-standards',
    title: 'Drink Size Standards',
    category: 'Espresso Standards',
    type: 'GRID',
    gridColumns: ['Category', 'Hot Sizes', 'Iced Sizes'],
    gridRows: [
      { label: 'Lattes', values: ['12 oz, 16 oz', '16 oz, 20 oz'] },
      { label: 'Matchas', values: ['12 oz, 16 oz', '16 oz, 20 oz'] },
      { label: 'Energy Drinks', values: ['N/A', '12, 16, 20, 24 oz'] },
      { label: 'Smoothies', values: ['N/A', '12, 16, 20, 24 oz'] },
      { label: 'Lemonades', values: ['N/A', '12, 16, 20, 24 oz'] }
    ],
    notes: 'All hot and iced lattes and matchas use 2 oz espresso regardless of size.'
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
    notes: 'Sizes — Hot: 12oz, 16oz | Iced: 16oz, 20oz. Lattes are not sold at 24oz.'
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
    title: 'Originals — Signature Lattes',
    category: 'Lattes',
    type: 'GRID',
    gridColumns: ['Drink', 'Syrup Build', 'Notes'],
    gridRows: [
      { label: 'Texas Delight', values: ['1 oz Texas Delight mix', 'Honey, Vanilla, Cinnamon. Batched in-house.'] },
      { label: 'Hill Country', values: ['1 oz Hill Country mix OR 20g Caramel + 0.5 oz Butter Pecan', 'Alternate build when not pre-batched'] },
      { label: 'Cinnamon Dulce', values: ['1 oz Cinnamon Dulce mix', 'Batched in-house. Contains Texas Delight mix.'] },
      { label: 'Lavender Sunrise', values: ['1 oz Lavender Sunrise mix', 'Honey & Lavender'] },
      { label: 'Harvest Moon', values: ['1 oz Harvest Moon mix OR 20g White Choc + 0.5 oz Maple + dash Cinnamon', 'Cinnamon added at build'] },
      { label: 'Golden Cream', values: ['1 oz Golden Cream mix OR 20g Caramel + 0.5 oz Vanilla', 'Alternate build when not pre-batched'] },
      { label: 'Salted Sweetheart', values: ['1 oz Salted Sweetheart mix OR 0.5 oz Salted Caramel + 20g White Choc', 'Alternate build when not pre-batched'] }
    ],
    notes: 'All Originals: 1 oz total syrup/sauce, 2 oz espresso, fill with milk to line.'
  },

  // ── 3. MATCHAS ──
  {
    id: 'r-matcha-base',
    title: 'Matcha Base Preparation',
    category: 'Matchas',
    type: 'BATCH',
    ingredients: [
      { name: 'Matcha Powder', quantity: '30 grams' },
      { name: 'Water', quantity: '300 milliliters' }
    ],
    notes: 'Sizes — Hot: 12oz, 16oz | Iced: 16oz, 20oz. All matchas hold at 1 oz total syrup across all sizes, hot or iced.'
  },
  {
    id: 'r-matcha-milk',
    title: 'Matcha Milk Fill Amounts',
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
    ],
    notes: 'Nitro holds at 0.5 oz syrup — it is not on the syrup-by-size table.'
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
      { label: 'Cookie Butter', values: ['Equal parts White Chocolate and Speculoos — 0.25 oz each'] }
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

  // ── 6. ENERGY DRINKS ──
  {
    id: 'r-energy-syrup',
    title: 'Energy Drink Build & Syrup Amounts',
    category: 'Energy Drinks',
    type: 'GRID',
    gridColumns: ['Size', 'Syrup Total', 'Fill Line'],
    gridRows: [
      { label: '12oz', values: ['1 oz', '9 oz'] },
      { label: '16oz', values: ['1.5 oz', '11 oz'] },
      { label: '20oz', values: ['2 oz', '14 oz'] },
      { label: '24oz', values: ['2 oz', '16 oz'] }
    ],
    notes: 'Built on a supplied ready-to-use energy drink base — there is no concentrate to mix. Pour base to fill line, add syrup, finish. Multi-flavor drinks divide the total equally.'
  },
  {
    id: 'r-energy-flavors',
    title: 'Energy Drink Menu Flavors',
    category: 'Energy Drinks',
    type: 'GRID',
    gridColumns: ['Drink', 'Flavors', 'Split'],
    gridRows: [
      { label: 'The Drift', values: ['Strawberry, Pineapple', 'Two-way'] },
      { label: 'Electric B', values: ['Blue Raspberry, Lime', 'Two-way'] },
      { label: 'Mystic Cherry', values: ['Cherry, Coconut', 'Two-way'] },
      { label: 'Golden Wave', values: ['Orange, Lime', 'Two-way'] },
      { label: 'Strawberry Storm', values: ['Strawberry, Lavender', 'Two-way'] },
      { label: 'Voltage', values: ['Blackberry, Lemon Concentrate', 'Two-way'] },
      { label: 'Blue Haze', values: ['Lavender, Blue Raspberry, Pomegranate', 'Three-way'] },
      { label: 'Dreamwave', values: ['Passionfruit, Strawberry, Kiwi', 'Three-way'] }
    ]
  },
  {
    id: 'r-energy-split',
    title: 'Energy Syrup Split by Size',
    category: 'Energy Drinks',
    type: 'GRID',
    gridColumns: ['Split', '12oz', '16oz', '20oz', '24oz'],
    gridRows: [
      { label: 'Two-way', values: ['0.5 oz each', '0.75 oz each', '1 oz each', '1 oz each'] },
      { label: 'Three-way', values: ['0.33 oz each', '0.5 oz each', '0.67 oz each', '0.67 oz each'] }
    ],
    notes: 'Divide the size total equally among the flavors in the drink.'
  },

  // ── 7. SODAS ──
  {
    id: 'r-bubbly-build',
    title: 'Soda Syrup Amounts',
    category: 'Sodas',
    type: 'GRID',
    gridColumns: ['Size', 'Syrup'],
    gridRows: [
      { label: '12oz', values: ['1 oz'] },
      { label: '16oz', values: ['1.5 oz'] },
      { label: '20oz', values: ['2 oz'] },
      { label: '24oz', values: ['2 oz'] }
    ],
    notes: 'Multi-flavor sodas divide the total equally. Base build, carbonation method, ice standard, and flavor lineup are not yet documented in Recipe Book v1.10.'
  },

  // ── 8. FROZEN COFFEE ──
  {
    id: 'r-frozen-coffee-full',
    title: 'Frozen Coffee Base — Batch Chart',
    category: 'Frozen Coffee',
    type: 'GRID',
    gridColumns: ['Ingredient', 'Small (3/4 gal)', 'Medium (1 gal)', 'Large (1.5 gal)'],
    gridRows: [
      { label: 'Whole Milk', values: ['96 oz', '128 oz', '192 oz'] },
      { label: 'Espresso, chilled', values: ['24 oz', '32 oz', '48 oz'] },
      { label: 'Double shots', values: ['12', '16', '24'] },
      { label: 'Simple Syrup 1:1', values: ['14.5 oz', '19 oz', '29 oz'] },
      { label: 'Total Yield', values: ['~134 oz', '~180 oz', '~270 oz'] }
    ],
    notes: 'The base is whole milk, chilled espresso, and 1:1 simple syrup — nothing else. Espresso dosed at 18g per double shot, pulled to standard time, chilled COMPLETELY before the hopper. Runs in the Spaceman 6455-CL. Flavor is never batched into the hopper.'
  },
  {
    id: 'r-frozen-coffee-build',
    title: 'Frozen Coffee — Build Process & Machine',
    category: 'Frozen Coffee',
    type: 'STANDARD',
    steps: [
      'Pull espresso and chill completely',
      'Combine milk, espresso, and simple syrup in a bucket',
      'Whisk 30 seconds',
      'Pour into hopper',
      'Prime until the cylinder fills past 75%, then close the screw',
      'Switch to FREEZE',
      'Wait a full 15 minutes',
      'Draw a small test pull before serving'
    ],
    notes: 'Machine settings: Viscosity 1. No air tube (machine not equipped). Hopper temp: default refrigerated. Cylinder fill: 75% minimum. NON-NEGOTIABLE: espresso fully chilled before the hopper, viscosity stays at 1, never serve before 15 minutes.'
  },
  {
    id: 'r-frozen-coffee-syrup',
    title: 'Frozen Coffee — Per Drink',
    category: 'Frozen Coffee',
    type: 'GRID',
    gridColumns: ['Cup Size', 'Frozen Coffee', 'Flavor Syrup', 'Total'],
    gridRows: [
      { label: '16oz', values: ['14 oz', '1 oz', '15 oz'] },
      { label: '20oz', values: ['18.5 oz', '1.5 oz', '20 oz'] },
      { label: '24oz', values: ['22 oz', '2 oz', '24 oz'] }
    ],
    notes: 'Draw into cup → add flavor syrup → lid → serve. Frozen coffee FILLS THE WHOLE CUP — it does not use the iced fill lines. Not offered in 12oz.'
  },

  // ── 9. FROZEN ENERGY & FROZEN LEMONADE ──
  {
    id: 'r-frozen-energy-syrup',
    title: 'Frozen Energy — Blended to Order',
    category: 'Frozen Energy',
    type: 'GRID',
    gridColumns: ['Size', 'Syrup'],
    gridRows: [
      { label: '12oz', values: ['0.5 oz'] },
      { label: '16oz', values: ['1 oz'] },
      { label: '20oz', values: ['1.5 oz'] },
      { label: '24oz', values: ['2 oz'] }
    ],
    notes: 'Frozen energy drinks are blended to order individually — the pre-batch is RETIRED and nothing but frozen coffee runs in the 6455-CL. Per-drink blend spec not yet documented in Recipe Book v1.10.'
  },
  {
    id: 'r-frozen-lemonade',
    title: 'Frozen Lemonade — Blended to Order',
    category: 'Frozen Lemonade',
    type: 'GRID',
    gridColumns: ['Size', 'Syrup'],
    gridRows: [
      { label: '12oz', values: ['1 oz'] },
      { label: '16oz', values: ['1.5 oz'] },
      { label: '20oz', values: ['2 oz'] },
      { label: '24oz', values: ['2 oz'] }
    ],
    notes: 'Blended to order, same as frozen energy. Does not run in the frozen machine. Blend spec still to be documented in Recipe Book v1.10.'
  },

  // ── 10. LEMONADES ──
  {
    id: 'r-lemonade-build',
    title: 'Lemonade Build',
    category: 'Lemonades',
    type: 'GRID',
    gridColumns: ['Size', 'Syrup', 'Fill Line'],
    gridRows: [
      { label: '12oz', values: ['1 oz', '9 oz'] },
      { label: '16oz', values: ['1.5 oz', '11 oz'] },
      { label: '20oz', values: ['2 oz', '14 oz'] },
      { label: '24oz', values: ['2 oz', '16 oz'] }
    ],
    notes: 'Dispense lemonade from the SODA GUN to the fill line for the cup size, then flavor per the syrup column. Lemonade is no longer built — the concentrate-and-water build is retired.'
  },
  {
    id: 'r-lemonade-flavors',
    title: 'Lemonade Menu Flavors',
    category: 'Lemonades',
    type: 'GRID',
    gridColumns: ['Flavor', 'Description', 'Build'],
    gridRows: [
      { label: 'Boundaries Lagoon', values: ['Blue Raspberry, Coconut, Lime', 'Recipe needed'] },
      { label: 'Cherry Limeade', values: ['Cherry, Lime, Lemon', 'Recipe needed'] },
      { label: 'Pink Paradise', values: ['Strawberry & Vanilla', 'Recipe needed'] },
      { label: 'Sunset', values: ['Pineapple, Mango, Strawberry', 'Recipe needed'] }
    ]
  },

  // ── 11. SMOOTHIES ──
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
    notes: '100% fruit puree smoothies. Puree + Water + Heaping scoop of ice (fill cup overflowing) → Blend. Smoothies use NO flavor syrup.'
  },
  {
    id: 'r-smoothie-flavors',
    title: 'Smoothie Flavors',
    category: 'Smoothies',
    type: 'GRID',
    gridColumns: ['Flavor', 'Puree Type'],
    gridRows: [
      { label: 'Strawberry Splash', values: ['100% Strawberry Puree'] },
      { label: 'Piña Colada', values: ['Coconut & Pineapple'] },
      { label: 'Perfect Peach', values: ['100% Peach Puree'] },
      { label: 'Mellow Mango', values: ['100% Mango Puree'] }
    ]
  },

  // ── 12. TEAS ──
  {
    id: 'r-tea-concentrates',
    title: 'Tea Lineup',
    category: 'Teas',
    type: 'GRID',
    gridColumns: ['Tea', 'Description', 'Status'],
    gridRows: [
      { label: 'Pomberry Punch', values: ['Pomegranate & Fresh Blueberry', 'Recipe needed'] },
      { label: 'Lavender Breeze', values: ['Rooibos, Coconut, Lavender', 'Recipe needed'] },
      { label: 'Citrus Oolong', values: ['Taiwanese Oolong & Orange', 'Recipe needed'] },
      { label: 'Honey Bee', values: ['Black tea, Honey, Peach & Ginger', 'Recipe needed'] },
      { label: 'Raspberry Hibiscus', values: ['Floral, light, refreshing', 'Recipe needed'] }
    ],
    notes: 'Steep times, temperatures, and per-flavor builds are still open in Recipe Book v1.10.'
  },
  {
    id: 'r-tea-sweetening',
    title: 'Iced Tea Syrup Amounts',
    category: 'Teas',
    type: 'GRID',
    gridColumns: ['Size', 'Syrup'],
    gridRows: [
      { label: '12oz', values: ['1 oz'] },
      { label: '16oz', values: ['1.5 oz'] },
      { label: '20oz', values: ['2 oz'] },
      { label: '24oz', values: ['2 oz'] }
    ],
    notes: 'Iced tea syrup scales by size per the master Syrup by Drink Size table.'
  },

  // ── 13. KIDS DRINKS ──
  {
    id: 'r-kids-unicorn',
    title: 'Unicorn Tea Latte',
    category: 'Kids Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Unicorn Tea Concentrate', quantity: 'Half' },
      { name: 'Milk', quantity: 'Half' }
    ],
    notes: 'Caffeine-free. Sweeten with simple syrup — volume follows the Iced Teas row in Syrup by Drink Size.'
  },
  {
    id: 'r-kids-dino',
    title: 'Dino Juice',
    category: 'Kids Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Blue Raspberry syrup', quantity: 'Equal split' },
      { name: 'Pineapple syrup', quantity: 'Equal split' },
      { name: 'Lemonade (soda gun)', quantity: 'To fill line' }
    ],
    notes: 'Flavored lemonade. Syrup volume follows the Lemonade row, two-way split. Lemonade dispensed from the soda gun.'
  },
  {
    id: 'r-kids-zebra',
    title: 'Zebra Milk',
    category: 'Kids Drinks',
    type: 'GRID',
    gridColumns: ['Size', 'Sauce Total (dark + white choc, split evenly)'],
    gridRows: [
      { label: '12oz', values: ['20 g total'] },
      { label: 'All other sizes', values: ['40 g total'] }
    ],
    notes: 'Milk with dark and white chocolate sauce, split evenly. Measured in grams because it uses sauce rather than syrup.'
  },
  {
    id: 'r-kids-kiddos',
    title: 'Kiddos',
    category: 'Kids Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Syrup (any flavor)', quantity: '0.5 oz' },
      { name: 'Steamed Milk', quantity: '8 oz total' }
    ],
    notes: 'Kids temp, no caffeine.'
  },

  // ── 14. BATCH BREW & COLD BREW ──
  {
    id: 'r-batch-brew',
    title: 'Batch Brew (Fetco)',
    category: 'Batch Brew',
    type: 'STANDARD',
    ingredients: [
      { name: 'Grinder', quantity: 'EK-43, grind setting 9' },
      { name: 'Batch Size', quantity: '1 Gallon' }
    ],
    steps: [
      'Grind on EK-43 at setting 9',
      'Form filter correctly to avoid collapse',
      'Place filter in basket, ensure lid open and pour stop closed',
      'Press the 1-Gallon Batch button',
      'Label dispenser with brew time and initials'
    ]
  },
  {
    id: 'r-cold-brew',
    title: 'Cold Brew (Toddy Method)',
    category: 'Batch Brew',
    type: 'STANDARD',
    ingredients: [
      { name: 'Cold Brew Roast Coffee', quantity: 'Entire 5 lb bag — EK-43, grind setting 13' },
      { name: 'Water (initial)', quantity: '7 quarts' },
      { name: 'Water (second pour)', quantity: '7 quarts' },
      { name: 'Fresh Water (dilution)', quantity: '7 quarts' }
    ],
    steps: [
      'Grind entire 5 lb bag of Cold Brew Roast coffee (EK-43, setting 13)',
      'Set up bags: paper filter bag INSIDE the mesh filter bag, both in the Toddy bucket',
      'Add all grounds to the paper bag',
      'Pour 7 quarts water INSIDE the paper bag, saturating the grounds',
      'Tie the bag, then pour another 7 quarts over the top',
      'Steep 10 hours',
      'Label with name and time brewed',
      'Strain, discard grounds carefully',
      'Add 7 quarts fresh water to Toddy',
      'Fill and crimp Nitro bag, label, store FIFO in walk-in'
    ]
  },

  // ── 15. CLASSIC ESPRESSO DRINKS ──
  {
    id: 'r-classic-espresso',
    title: 'Classic Espresso Drinks',
    category: 'Classic Espresso',
    type: 'GRID',
    gridColumns: ['Drink', 'Temp', 'Size', 'Espresso', 'Notes'],
    gridRows: [
      { label: 'Americano', values: ['Hot', 'Standard', '2 oz', 'Espresso plus hot water by Person 2'] },
      { label: 'Americano', values: ['Iced', 'Standard', '3 oz', 'Espresso plus cold water over ice'] },
      { label: 'Cortado', values: ['Hot', '4 oz', '2 oz', 'Equal milk & espresso'] },
      { label: 'Cappuccino', values: ['Hot', '6 oz', '2 oz', 'Dry foam'] },
      { label: 'Macchiato', values: ['Hot', '3 oz', '2 oz', 'Espresso marked with foam'] },
      { label: 'Flat White', values: ['Hot', '8 oz', '2 oz', 'Thin microfoam, no dry foam'] }
    ]
  },

  // ── 16. PRE-BATCH SIGNATURE MIXES ──
  {
    id: 'r-syrup-base-standards',
    title: 'Syrup Base Standards',
    category: 'Pre-Batch',
    type: 'GRID',
    gridColumns: ['Syrup', 'Ratio', 'Notes'],
    gridRows: [
      { label: 'Simple Syrup', values: ['1:1', 'Equal parts sugar and water. Used in the frozen coffee base.'] },
      { label: 'Brown Sugar Simple', values: ['2:1', 'Two parts brown sugar to one part water. Used in the Cinnamon Dulce mix.'] }
    ],
    notes: 'NOT interchangeable — substituting one for the other at equal volume changes both the sweetness and the sugar load of the finished drink.'
  },
  {
    id: 'r-prebatch-mixes',
    title: 'Signature Mix Recipes',
    category: 'Pre-Batch',
    type: 'GRID',
    gridColumns: ['Mix', 'Composition', 'Status'],
    gridRows: [
      { label: 'Hill Country', values: ['64 oz Butter Pecan + 64 oz Caramel', 'Currently batching'] },
      { label: 'Lavender Sunrise', values: ['64 oz Honey + 64 oz Lavender', 'Currently batching'] },
      { label: 'Texas Delight', values: ['42.67 oz Honey + 42.67 oz 1883 Vanilla + 42.67 oz 1883 Cinnamon', 'Currently batching — in-house as of July 2026'] },
      { label: 'Sweet Trio', values: ['42.67 oz Dark Chocolate + 42.67 oz Caramel + 42.67 oz Hazelnut', 'Batched — not a menu drink'] },
      { label: 'Cinnamon Dulce', values: ['42.67 oz Texas Delight mix + 42.67 oz Caramel + 42.67 oz Brown Sugar Simple (2:1)', 'Batched — uses Texas Delight as an ingredient'] },
      { label: 'Harvest Moon', values: ['64 oz White Chocolate + 64 oz Maple', 'Cinnamon added at build, not in batch'] },
      { label: 'Golden Cream', values: ['64 oz Caramel + 64 oz Vanilla', 'Not currently batching'] },
      { label: 'Salted Sweetheart', values: ['64 oz Salted Caramel + 64 oz White Chocolate', 'Not currently batching'] }
    ],
    notes: 'All batches: 1-gallon increments (128 oz). Warm all sauces in a hot water bath before mixing. Label with product name, date, and initials. Texas Delight is batched IN-HOUSE — no longer purchased pre-made. Batch Texas Delight BEFORE Cinnamon Dulce, which uses it as an ingredient.'
  },

  // ── 17. QUICK REFERENCE ──
  {
    id: 'r-qr-syrup',
    title: 'Syrup by Drink Size (Master Table)',
    category: 'Quick Reference',
    type: 'GRID',
    gridColumns: ['Category', '12oz', '16oz', '20oz', '24oz'],
    gridRows: [
      { label: 'Lattes', values: ['1 oz', '1 oz', '1 oz', '—'] },
      { label: 'Matchas', values: ['1 oz', '1 oz', '1 oz', '—'] },
      { label: 'Energy', values: ['1 oz', '1.5 oz', '2 oz', '2 oz'] },
      { label: 'Frozen Energy', values: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'] },
      { label: 'Sodas', values: ['1 oz', '1.5 oz', '2 oz', '2 oz'] },
      { label: 'Frozen Coffee', values: ['—', '1 oz', '1.5 oz', '2 oz'] },
      { label: 'Frozen Lemonade', values: ['1 oz', '1.5 oz', '2 oz', '2 oz'] },
      { label: 'Lemonade', values: ['1 oz', '1.5 oz', '2 oz', '2 oz'] },
      { label: 'Iced Teas', values: ['1 oz', '1.5 oz', '2 oz', '2 oz'] }
    ],
    notes: 'The single source for syrup volume across every category. Multi-flavor drinks divide the total equally. A dash means the size is not offered. Nitro is not on this table — it holds at 0.5 oz. Smoothies use no flavor syrup. Five categories share 1 / 1.5 / 2 / 2 — learn that one and you have most of the menu.'
  },
  {
    id: 'r-qr-fill',
    title: 'Cup Fill Lines',
    category: 'Quick Reference',
    type: 'GRID',
    gridColumns: ['Cup Size', 'Fill To'],
    gridRows: [
      { label: '12oz', values: ['9 oz'] },
      { label: '16oz', values: ['11 oz'] },
      { label: '20oz', values: ['14 oz'] },
      { label: '24oz', values: ['16 oz'] }
    ],
    notes: 'Fill line is a property of the cup, not the drink — standard across every iced category. Frozen drinks are the exception: they fill the whole cup.'
  },
  {
    id: 'r-qr-flavors',
    title: 'Available Flavors',
    category: 'Quick Reference',
    type: 'STANDARD',
    ingredients: [
      { name: 'TX Delight (in-house mix)', quantity: '' },
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
      { name: 'Speculoos', quantity: '' },
      { name: 'Seasonal Offerings', quantity: '' }
    ],
    notes: '(SF) = Sugar-Free available. Seasonal offerings rotate.'
  }
];
