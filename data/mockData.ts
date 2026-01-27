
import { TrainingModule, ChecklistTemplate, UserRole, User, Store, Recipe, ManualSection } from '../types';

export const MOCK_STORES: Store[] = [
  { id: 'store-elm', name: 'Boundaries Little Elm' },
  { id: 'store-prosper', name: 'Boundaries Prosper' }
];

export const MOCK_USERS: User[] = [
  { id: 'u-admin-1', name: 'Daniel', email: 'Daniel@boundariescoffee.com', password: 'Baseball5', role: UserRole.ADMIN, storeId: 'store-elm' },
  { id: 'u-admin-2', name: 'Kate', email: 'Kate@BoundariesCoffee.com', password: 'Boundaries1234', role: UserRole.ADMIN, storeId: 'store-prosper' },
  { id: 'u-1', name: 'Alex Trainee', email: 'trainee@coffee.com', password: 'password', role: UserRole.TRAINEE, storeId: 'store-elm' },
];

export const BOUNDARIES_MANUAL: ManualSection[] = [
  {
    id: 's-1',
    number: 1,
    title: 'Introduction & Purpose',
    content: `### Mission
**Push the boundaries of every day coffee.**

This manual defines how every store, barista, and system operates to uphold our standards. It serves as the official operational reference for Boundaries Coffee.

### Core Values
- **Passion**: Love the craft, the coffee, and the community.
- **Hospitality**: Treat every guest like they matter — because they do.
- **Selflessness**: Put the team and the guest before yourself.

### Cultural Standards
1. **Speed**: Fast, never frantic. Efficiency is respect for a guest’s time.
2. **Quality**: Excellence in every detail—drink, service, and environment.
3. **Consistency**: Every guest, every visit, the same exceptional standard.

### Standard Coverage
Every Boundaries employee must know and perform the five key roles:
**Order Taking, Coffee Bar, Not Coffee Bar, Food, and Closing Duties.**
Team members operate as one unit. When one position falls behind, others flex until flow is restored.`
  },
  {
    id: 's-2',
    number: 2,
    title: 'Hospitality',
    content: `Hospitality is the heartbeat of Boundaries Coffee—the difference between a transaction and a relationship.

### The Value Proposition
Customers come to Boundaries for **Speed, Quality, and Consistency**. These aren’t just operational goals—they are our promise.

- **Speed**: Anticipate, move with purpose, and respect the guest’s time.
- **Quality**: Precision in every step: espresso, milk texture, recipes, and service.
- **Consistency**: Every location, every shift, identical excellence.

> “That was fast, it tasted amazing, and it’s always like that.”
> That’s the Boundaries experience.

### Hospitality in Action
1. **Welcome Well**: Every greeting sets the tone.
2. **Serve Confidently**: Know the menu and maintain composure.
3. **Recover Gracefully**: Fix issues quickly and sincerely.`
  },
  {
    id: 's-3',
    number: 3,
    title: 'Order Taking',
    content: `The Order Taker sets the tone for both speed and hospitality.

### Position Overview
- When three or more people are clocked in, the Order Taker stands outside by the menu board.
- Wears the **Boundaries satchel** with handheld POS.
- Keeps a friendly, professional presence—should be seen and heard.

### Greeting Script
1. **“Welcome to Boundaries!”**
2. Hand the mini menu: “Here’s a menu to look over.”
3. **“What can we get started for you today?”**
4. Input order.
5. Confirm Order.
6. **“Are you a rewards member?”** → If not, hand promo card for the app.
7. If yes, enter phone number.
8. End: **“Go ahead and pull forward to the window for pickup.”**

### Flow Management
- Always maintain stacking flow: if another car arrives, politely ask the first car to pull forward.
- Walk forward with them to take the next order—keep the line moving.
- Maintain awareness of the window time goal (**under 3.5 minutes total**).`
  },
  {
    id: 's-4',
    number: 4,
    title: 'Espresso',
    content: `Espresso is the foundation of everything we serve. Mastery of the espresso system defines consistency.

### Equipment
- **Espresso Machine**: La Marzocco PB3 Group Head
- **Grinder**: Mahlkönig E80 GBW (grind-by-weight)
- **Automatic Tamper**: PuqPress

### Espresso Variables
1. Dose Weight
2. Grind Size
3. Yield Weight
4. Time of Extraction
5. Temperature
6. Pressure
7. Water Quality

### Shot Procedure
1. With right hand, remove portafilter.
2. With left hand, hit single-dose rinse button.
3. Knock out puck into knock box; wipe clean and dry.
4. Place portafilter in grinder; allow it to tare and dose.
5. When screen is green (weight reached), remove and level puck with OCD distributor.
6. Insert into PuqPress for automatic tamp.
7. Wipe rim, lock into group head.
8. Press double-shot button and pull shots.
9. **Target window**: ±2 seconds of standard shot time.

### Maintenance
- **Backflush** machine daily with approved cleaner.
- **Purge** steam wand after each use.
- **Wipe** grinder burrs and adjust grind size as needed for shot timing.`
  },
  {
    id: 's-5',
    number: 2,
    title: 'Coffee Bar',
    content: `All espresso-based drinks—hot or iced—are produced here. The Coffee Bar is typically a **two-person team** but may be run solo.

### Roles
- **Person 1**: Shots & Flavors (Right side of machine)
- **Person 2**: Milks, Ice, Sweet Cream, Chai, Matcha

### Workflow Charts
**Hot Latte**
- **Person 1** → Pull shot → Label cup → Add syrup → Pour shot → Pass →
- **Person 2** → Steam milk → Pour → Lid → Send to Expo.

**Iced Latte**
- **Person 1** → Pull shot → Label cup → Prep syrup in mixing glass → Pour shot → Pass →
- **Person 2** → Add milk → Shake → Prep ice cup → Pour → Lid → Expo.
- *If sweet cream requested, Person 2 finishes with sweet cream and topping.*

**Nitro Drink**
- **Person 1** → Prep cup with ice & Nitro tap → Pass →
- **Person 2** → Add sweet cream if requested → Lid → Expo.

**Matcha & Chai**
- **Iced Matcha**: Person 1 labels cup, adds syrup to mixing glass → Person 2 whisks matcha, adds milk, shakes, pours over ice, tops with matcha.
- **Hot Matcha**: Person 1 labels cup and adds syrup → Person 2 prepares matcha, steams milk, pours matcha base and milk, lids → Expo.
- **Iced Chai**: Half chai concentrate + half milk, shaken, poured over ice.
- **Hot Chai**: Half chai + half milk, steamed together with mild aeration.

### Classics Standards
| Drink | Temp | Shots | Notes |
| :--- | :--- | :--- | :--- |
| **Americano (H)** | Hot | 2 | Espresso + hot water by Person 2 |
| **Americano (I)** | Iced | 3 | Espresso + cold water over ice |
| **Cortado** | Hot (4oz) | 2 | Equal milk & espresso |
| **Cappuccino** | Hot (6oz) | 2 | Dry foam |
| **Macchiato** | Hot (3oz) | 2 | Espresso marked with foam |
| **Flat White** | Hot (8oz) | 2 | Thin microfoam, no dry foam |

### Hot Teas / Kiddos Coffee
- **Hot Tea**: Label cup → Add syrup (if any) → Pass to Person 2 → Sachet + hot water → Lid → Expo.
- **Kiddo’s Coffee / Steamer**: Label cup → Add syrup → Steam milk → Pour → Lid → Expo.
- *Never stir after pour.*`
  },
  {
    id: 's-6',
    number: 6,
    title: 'Sweet Cream Standards',
    content: `Sweet Cream is measured and mixed for consistency.

- **Standard Batch**: 3 oz cream + 0.5 oz syrup.
- **Extra Sweet Cream**: 4 oz total.
- **Extra Sweet**: 1 oz syrup.

**Storage**: Prepared in tumblers, labeled and dated, stored cold 24 hours max.`
  },
  {
    id: 's-7',
    number: 7,
    title: 'Not Coffee Bar (Placeholder)',
    content: `This section will include detailed processes for:
- Frozen drinks
- Smoothies
- Teas (iced and tea lattes)
- Lotus energy drinks
- Lemonades

*Procedures to be finalized in next version.*`
  },
  {
    id: 's-8',
    number: 8,
    title: 'Batch Brew',
    content: `### Overview
All drip coffee is brewed on the Fetco system in 1-gallon batches.

### Steps
1. Grind beans on EK-43 (**grind 7 – 9**).
2. Form filter correctly to avoid collapse.
3. Place filter in basket, ensure lid open and pour stop closed.
4. Press **1-Gallon Batch**.
5. Label dispenser with brew time and initials.`
  },
  {
    id: 's-9',
    number: 9,
    title: 'Cold Brew',
    content: `### Process (Toddy Method)
1. Grind entire 5 lb bag of Cold Brew Roast coffee.
2. Insert paper filter and mesh filter in Toddy bucket.
3. Add grounds to filter bag.
4. Pour 7 quarts water over grounds.
5. Tie bag and pour another 7 quarts over top.
6. **Steep 10 hours**.
7. Label with name and time brewed.
8. Strain, discard grounds carefully.
9. Add 7 quarts fresh water to Toddy.
10. Fill and crimp Nitro bag, label, and store FIFO in walk-in.`
  },
  {
    id: 's-10',
    number: 10,
    title: 'Syrup Batching & Signature Mixes',
    content: `### Overview
All signature mixes are batched in 1-gallon increments and stored in three-gallon buckets on the syrup shelf. Each batch must be clearly labeled with name and date.

### Recipes
**Hill Country Latte Mix**
- 64 oz Caramel
- 64 oz Butter Pecan

**Lavender Sunrise Mix**
- 64 oz Honey
- 64 oz Lavender

**Sweet Trio Mix**
- 1/3 Dark Chocolate
- 1/3 Caramel
- 1/3 Hazelnut

*Note: All sauces should be warmed in a hot-water bath before mixing to ensure full blending. Label each batch with product name, date, and initials.*`
  },
  {
    id: 's-11',
    number: 11,
    title: 'Expo',
    content: `The **Exit Rider** position exists only when three or more staff are clocked in. It is preferably filled by a **Shift Lead** or **Store Manager**.

### Primary Responsibilities
- **Guest Greeting**: Face each guest’s car, keep the door open, remain within earshot. “Hello [Name], how are you today?” — use names from the ticket.
- **Speed Management**: Monitor total drive-thru time (< 3 1/2 minutes goal, never > 1 minute at window).
- **Quality Control**: Verify each beverage matches the label, check lids, presentation, and temperature.
- **Flow Coordination**: Ensure drinks move from Coffee Bar to Expo efficiently and in correct sequence.
- **Food Handling**: With 3 people, Exit Rider = food. With 4 or more, food passes to Food/Not Coffee.

### Metrics & Expectations
- 100% order accuracy.
- Window time ≤ 60 seconds.
- Constant communication with Coffee Bar and Order Taker.`
  },
  {
    id: 's-12',
    number: 12,
    title: 'Food Prep & Kitchen Standards',
    content: `### Responsibility by Staffing Level
| Staff Count | Responsible Role |
| :--- | :--- |
| 2 | Order Taker |
| 3 | Expo |
| 4 | Person 2 on Coffee Bar |
| 5 | Not Coffee Bar |

### Standards
- Follow **FIFO** (first in, first out) rotation.
- Label and date all prepped items.
- Maintain **TurboChef** cleanliness and run crumb tray wipe downs hourly.
- Food held only at safe temps; discard per health code.
- Expo verifies all food before handing off.`
  },
  {
    id: 's-13',
    number: 13,
    title: 'Store Flow & Responsibilities',
    content: `### Two-Person Flow
**[Guest]** → **[Order Taker / Expo / Food]** ↔ **[Drinks (Coffee + Not Coffee Bar)]**
*Summary*: Order Taker handles all guest facing tasks and Expo. Drinks runs every beverage.

### Three-Person Flow
**[Order Taker w/ Satchel]** ↔ **[Coffee Bar]** ↔ **[Expo / Food]**
*Summary*: Order Taker outside managing queue. Coffee Bar builds all drinks. Expo manages window and food.

### Four-Person Flow
**[Order Taker]** → **[Coffee Bar 1 (+ Not Coffee)]** → **[Coffee Bar 2 (Steam/Finish)]** → **[Expo / Food]**

### Five-Person Flow
**[Order Taker]** ↔ **[Coffee Bar 1]** ↔ **[Coffee Bar 2]** ↔ **[Expo (Exit Rider)]** 
↑ **[Not Coffee / Food]**
*Summary*: Full team flow. Exit Rider controls pace & quality. Not Coffee handles smoothies, frozen, teas, food.`
  }
];

export const BOUNDARIES_RECIPES: Recipe[] = [
  // 1. CORE STANDARDS
  {
    id: 'r-monarch',
    title: 'Monarch Espresso',
    category: 'Core Standards',
    type: 'ESPRESSO',
    dose: '18-20g',
    yield: '36-40g',
    time: '26-32s',
    notes: 'Equipment: La Marzocco PB3. Grinder: Mahlkönig E80 GBW.'
  },
  {
    id: 'r-shot-standards',
    title: 'Shot Standards',
    category: 'Core Standards',
    type: 'GRID',
    gridColumns: ['Drink Type', 'Espresso Amount'],
    gridRows: [
      { label: 'Hot/Iced Lattes (All Sizes)', values: ['2 oz'] },
      { label: 'Iced Americano', values: ['3 oz'] },
      { label: 'Hot Americano', values: ['2 oz'] },
      { label: 'Cortado/Capp/Macch/Flat White', values: ['2 oz'] }
    ]
  },
  {
    id: 'r-milk-standards',
    title: 'Milk Standards',
    category: 'Core Standards',
    type: 'GRID',
    gridColumns: ['Drink Type', 'Size', 'Amount/Fill'],
    gridRows: [
      { label: 'Hot Latte', values: ['12oz', '8 oz steamed'] },
      { label: 'Hot Latte', values: ['16oz', '10 oz steamed'] },
      { label: 'Iced Latte', values: ['16oz', 'Fill to 11 oz line'] },
      { label: 'Iced Latte', values: ['20oz', 'Fill to 14 oz line'] }
    ]
  },

  // 2. ORIGINALS
  {
    id: 'r-originals-build',
    title: 'Standard Original Build',
    category: 'Originals',
    type: 'STANDARD',
    steps: [
      '1 oz total syrup/sauce (regardless of size/temp)',
      '2 oz espresso (all sizes)',
      'Fill with milk to appropriate line'
    ]
  },
  {
    id: 'r-texas-delight',
    title: 'Texas Delight',
    category: 'Originals',
    type: 'STANDARD',
    ingredients: [
      { name: 'Syrup', quantity: '1 oz Texas Delight (Honey, Vanilla, Cinnamon)' }
    ]
  },
  {
    id: 'r-hill-country',
    title: 'Hill Country',
    category: 'Originals',
    type: 'STANDARD',
    ingredients: [
      { name: 'Syrup', quantity: '1 oz Hill Country Mix' },
      { name: 'Alt Build', quantity: '20g Caramel + 0.5 oz Butter Pecan' }
    ]
  },
  {
    id: 'r-lavender-sunrise',
    title: 'Lavender Sunrise',
    category: 'Originals',
    type: 'STANDARD',
    ingredients: [
      { name: 'Syrup', quantity: '1 oz Lavender Sunrise Mix (Honey & Lavender)' }
    ]
  },

  // 3. BATCHES
  {
    id: 'r-batch-hill-country',
    title: 'Hill Country Mix (Batch)',
    category: 'Batches',
    type: 'BATCH',
    ingredients: [
      { name: 'Butter Pecan', quantity: '64 oz' },
      { name: 'Caramel', quantity: '64 oz' }
    ],
    notes: 'Warm sauces in hot water bath before mixing.'
  },
  {
    id: 'r-batch-lavender',
    title: 'Lavender Sunrise Mix (Batch)',
    category: 'Batches',
    type: 'BATCH',
    ingredients: [
      { name: 'Honey', quantity: '64 oz' },
      { name: 'Lavender', quantity: '64 oz' }
    ]
  },

  // 4. MATCHAS
  {
    id: 'r-matcha-base',
    title: 'Matcha Base Prep',
    category: 'Matchas',
    type: 'STANDARD',
    ingredients: [
      { name: 'Matcha Powder', quantity: '30 grams' },
      { name: 'Water', quantity: '300 ml' }
    ]
  },
  {
    id: 'r-matcha-flavors',
    title: 'Matcha Flavor Builds',
    category: 'Matchas',
    type: 'GRID',
    gridColumns: ['Drink', 'Recipe (1oz Total)'],
    gridRows: [
      { label: 'Plain Matcha', values: ['1 oz Vanilla'] },
      { label: 'Blue Coconut', values: ['1 oz Coconut'] },
      { label: 'Strawberry Dream', values: ['0.5 oz Strawberry + 0.5 oz Vanilla'] },
      { label: 'Banana Baby', values: ['0.33 oz Banana + 0.33 oz Maple + 0.33 oz Vanilla'] }
    ]
  },

  // 5. NITRO
  {
    id: 'r-nitro-build',
    title: 'Standard Nitro Build',
    category: 'Nitro',
    type: 'STANDARD',
    steps: [
      '1 scoop ice',
      'Fill nitro to 2nd-to-last line',
      'Add 3 oz sweet cream',
      'Add flavor syrup'
    ]
  },

  // 7. ENERGY (LOTUS)
  {
    id: 'r-lotus-build',
    title: 'Lotus Energy Build',
    category: 'Energy',
    type: 'GRID',
    gridColumns: ['Size', 'Total Syrup', 'Fill Line'],
    gridRows: [
      { label: '12oz', values: ['1 oz', '9 oz line'] },
      { label: '16oz', values: ['1.5 oz', '11 oz line'] },
      { label: '20oz', values: ['2 oz', '14 oz line'] },
      { label: '24oz', values: ['2 oz', '16 oz line'] }
    ]
  },

  // 9. FROZEN
  {
    id: 'r-frozen-coffee-base',
    title: 'Frozen Coffee Base (10L)',
    category: 'Frozen',
    type: 'BATCH',
    ingredients: [
      { name: 'Espresso (Hot)', quantity: '2.0 L' },
      { name: 'Raw Sugar', quantity: '770 g' },
      { name: 'Whole Milk', quantity: '4.6 L' },
      { name: '2% Milk', quantity: '2.7 L' }
    ],
    steps: ['Dissolve sugar in HOT espresso', 'Chill espresso before adding milk', 'SLUSH mode only', 'Target temp: 30-32°F']
  },
  {
    id: 'r-frozen-lemonade',
    title: 'Frozen Lemonade Quick Build',
    category: 'Frozen',
    type: 'GRID',
    gridColumns: ['Size', 'Conc', 'Water', 'Syrup', 'Ice'],
    gridRows: [
      { label: '12oz', values: ['1.5 oz', '2.5 oz', '1 oz', '12oz scoop'] },
      { label: '16oz', values: ['3 oz', '4 oz', '1.5 oz', '24oz scoop'] },
      { label: '20oz', values: ['4.5 oz', '6 oz', '2 oz', '24oz+10oz'] },
      { label: '24oz', values: ['6 oz', '8 oz', '2.5 oz', '24oz+12oz'] }
    ]
  },
  {
    id: 'recipe-frozen-energy-base',
    title: 'Frozen Energy Base',
    category: 'Frozen',
    type: 'GRID',
    gridColumns: ['Ingredient', 'Full Batch (10L)', 'Refill (5L)'],
    gridRows: [
      { label: 'Lotus Concentrate', values: ['1.0 L', '0.5 L'] },
      { label: 'Water', values: ['8.0 L', '4.0 L'] },
      { label: 'Sugar', values: ['350 g', '175 g'] }
    ],
    notes: 'Rules: No dairy • No flavors in hopper • SLUSH mode only • Chill before loading'
  },

  // 10. LEMONADES
  {
    id: 'r-iced-lemonade',
    title: 'Iced Lemonade (Lotus Conc)',
    category: 'Lemonades',
    type: 'GRID',
    gridColumns: ['Size', 'Conc', 'Syrup', 'Water'],
    gridRows: [
      { label: '12oz', values: ['1 oz', '1 oz', 'Fill to line'] },
      { label: '16oz', values: ['1.5 oz', '1.5 oz', 'Fill to line'] },
      { label: '20oz', values: ['2 oz', '2 oz', 'Fill to line'] },
      { label: '24oz', values: ['2.5 oz', '2.5 oz', 'Fill to line'] }
    ]
  },

  // 11. SMOOTHIES
  {
    id: 'r-smoothies',
    title: '100% Fruit Puree Smoothies',
    category: 'Smoothies',
    type: 'GRID',
    gridColumns: ['Size', 'Puree', 'Water', 'Ice'],
    gridRows: [
      { label: '12oz', values: ['3 oz', '2 oz', 'Heaping scoop'] },
      { label: '16oz', values: ['4 oz', '3 oz', 'Heaping scoop'] },
      { label: '20oz', values: ['5 oz', '4 oz', 'Heaping scoop'] },
      { label: '24oz', values: ['6 oz', '5 oz', 'Heaping scoop'] }
    ]
  },

  // 14. BATCH BREW
  {
    id: 'r-fetco',
    title: 'Batch Brew (Fetco)',
    category: 'Batch Brew',
    type: 'STANDARD',
    ingredients: [
      { name: 'Coffee Weight', quantity: '240 grams' },
      { name: 'Batch Size', quantity: '1 Gallon' }
    ],
    steps: ['Grind on EK-43 (size 9)', 'Form filter correctly', 'Ensure pour stop closed', 'Press 1-Gallon Batch']
  }
];

export const TRAINING_CURRICULUM: TrainingModule[] = [
  {
    id: 'm-onboarding',
    title: 'Module 1: Onboarding Checklist',
    description: 'Complete core logistics and administrative setup before training.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-handbook-review',
        moduleId: 'm-onboarding',
        title: 'Company Handbook Review',
        type: 'CONTENT',
        content: `Welcome to Boundaries Coffee! Before beginning your training, please review our company handbook thoroughly.

The handbook covers important policies including:

• Employment policies and expectations
• Pay, scheduling, and time off
• Dress code and appearance standards
• Food safety and hygiene requirements
• Customer service standards
• Workplace conduct and ethics
• Safety procedures and emergency protocols

DOWNLOAD THE HANDBOOK:

📄 [Boundaries Coffee Employee Handbook (2024)](https://firebasestorage.googleapis.com/v0/b/boundaries-logbook-app.firebasestorage.app/o/documents%2Femployee-handbook.pdf?alt=media&token=43aeabd5-9ee1-42c1-8d6b-10255c405b71)

Take your time to read through the entire handbook. You'll verify that you've reviewed it in the next lesson.

If you have any questions about policies in the handbook, please ask your trainer or manager before proceeding.`
      },
      {
        id: 'l-logistics-quiz',
        moduleId: 'm-onboarding',
        title: 'System & Logistics Verification',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q1', type: 'TRUE_FALSE', question: 'I have been added to Sling and have downloaded and logged into the app.', correctAnswers: ['True'] },
          { id: 'q2', type: 'TRUE_FALSE', question: 'I have received my Toast Payroll Onboarding Email and completed the required steps to create my account.', correctAnswers: ['True'] },
          { id: 'q3', type: 'TRUE_FALSE', question: 'I have set up my direct deposit.', correctAnswers: ['True'] },
          { id: 'q4', type: 'TRUE_FALSE', question: 'I have reviewed the company handbook.', correctAnswers: ['True'] },
          { id: 'q5', type: 'TRUE_FALSE', question: 'I have completed my Texas Food Handler certification.', correctAnswers: ['True'] }
        ]
      },
      {
        id: 'l-certification',
        moduleId: 'm-onboarding',
        title: 'Food Handlers License',
        type: 'FILE_UPLOAD',
        content: `All food service employees in Texas are required to complete a Texas Food Handler Certification within 60 days of hire.

APPROVED WEBSITES TO GET YOUR CERTIFICATION:

1. TABC (Texas Alcoholic Beverage Commission) - FREE
   https://www.tabc.texas.gov/food-handler-training/

2. StateFoodSafety.com - $10
   https://www.statefoodsafety.com/food-handler/texas

3. Learn2Serve - $10
   https://www.learn2serve.com/texas-food-handlers-card

4. 360training.com - $10
   https://www.360training.com/food-manager-training/texas

The certification typically takes 2 hours to complete and is valid for 2 years. Once you finish, you'll receive a certificate that you need to upload below.

If you have any questions about which site to use or need help with the process, ask your trainer or manager.`,
        fileLabel: 'Upload your Texas Food Handler Certificate (PDF, JPG, or PNG)'
      }
    ]
  },
  {
    id: 'm-values',
    title: 'Module 2: Company Values & Policies',
    description: 'Master the standards that define the Boundaries culture.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-culture-quiz',
        moduleId: 'm-values',
        title: 'The Boundaries Core Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q7', type: 'MULTIPLE_CHOICE', question: 'What are the three core company values at Boundaries Coffee?', options: ['Humble, Focused, Fun', 'Hungry, Happy, Hardworking', 'Humble, Consistent, Quality', 'Excellence, Innovation, Integrity'], correctAnswers: ['Humble, Focused, Fun'] },
          { id: 'q8', type: 'MULTIPLE_CHOICE', question: 'What does it mean to be "humble" at Boundaries Coffee?', options: ['Always acting like you\'re the best on the team', 'Being teachable, admitting mistakes, and putting others before yourself', 'Ignoring feedback from managers and teammates', 'Doing things your own way, even if it affects others negatively'], correctAnswers: ['Being teachable, admitting mistakes, and putting others before yourself'] },
          { id: 'q9', type: 'MULTIPLE_CHOICE', question: 'Which of the following best reflects being "focused" at Boundaries Coffee?', options: ['Checking your phone between orders', 'Prioritizing personal conversations over customer service', 'Staying attentive to responsibilities and customer needs', 'Finishing half your tasks and leaving the rest'], correctAnswers: ['Staying attentive to responsibilities and customer needs'] },
          { id: 'q10', type: 'MULTIPLE_CHOICE', question: 'Having "fun" at Boundaries Coffee primarily means:', options: ['Acting silly no matter what happens', 'Creating a positive, joyful environment for customers and teammates', 'Ignoring customer needs to enjoy yourself', 'Playing pranks during the busiest hours'], correctAnswers: ['Creating a positive, joyful environment for customers and teammates'] },
          { id: 'q11', type: 'MULTIPLE_CHOICE', question: 'What attitude shows humility?', options: ['Apologizing when you make a mistake', 'Blaming teammates when something goes wrong', 'Ignoring team goals to focus on your own ideas', 'Always insisting your way is the right way'], correctAnswers: ['Apologizing when you make a mistake'] },
          { id: 'q12', type: 'MULTIPLE_CHOICE', question: 'Which situation best demonstrates being focused?', options: ['You clean a messy counter without being asked because you notice it\'s needed.', 'You wait for your shift lead to tell you every small task.', 'You leave early without finishing your checklist.', 'You spend time chatting with friends while customers wait.'], correctAnswers: ['You clean a messy counter without being asked because you notice it\'s needed.'] },
          { id: 'q13', type: 'MULTIPLE_CHOICE', question: 'Which behavior would NOT be considered humble?', options: ['Asking for advice on how to improve', 'Blaming others when something goes wrong', 'Taking responsibility when you make a mistake', 'Celebrating team wins together'], correctAnswers: ['Blaming others when something goes wrong'] },
          { id: 'q14', type: 'MULTIPLE_CHOICE', question: 'Which of the following best captures the spirit of "fun" at Boundaries Coffee?', options: ['Making customers and coworkers feel welcomed and positive', 'Being loud and disruptive, even during rushes', 'Doing whatever you want, even if it causes confusion', 'Ignoring customers to joke around with coworkers'], correctAnswers: ['Making customers and coworkers feel welcomed and positive'] },
          { id: 'q15', type: 'MULTIPLE_CHOICE', question: 'What are the three organizational values emphasized in the handbook?', options: ['Humble, Focused, Fun', 'Passion, Hospitality, Selflessness', 'Professionalism, Respect, Cleanliness', 'Skill, Communication, Joy'], correctAnswers: ['Humble, Focused, Fun'] },
          { id: 'q16', type: 'MULTIPLE_CHOICE', question: 'What is the expected attitude when resolving staff conflicts?', options: ['Avoid confrontation and involve others immediately', 'Handle it publicly so everyone is aware', 'Attempt to resolve it directly with the other person first', 'Escalate to HR before speaking to the other party'], correctAnswers: ['Attempt to resolve it directly with the other person first'] },
          { id: 'q17', type: 'MULTIPLE_CHOICE', question: 'Which of the following is not appropriate workplace attire?', options: ['Clean black jeans', 'Boundaries-branded t-shirt', 'Water-resistant jacket in navy', 'Fleece hoodie in gray'], correctAnswers: ['Fleece hoodie in gray'] },
          { id: 'q18', type: 'MULTIPLE_CHOICE', question: 'What should an employee do if they feel unsafe during a conflict with a guest?', options: ['Argue calmly but firmly', 'Continue serving until a manager steps in', 'Immediately walk away and get help from a team lead or manager', 'Ask another employee to intervene'], correctAnswers: ['Immediately walk away and get help from a team lead or manager'] },
          { id: 'q19', type: 'MULTIPLE_CHOICE', question: 'Which of the following actions may result in immediate termination?', options: ['Wearing an unapproved hat', 'Forgetting to restock items', 'Using illicit drugs on the premises', 'Arriving 5 minutes late'], correctAnswers: ['Using illicit drugs on the premises'] },
          { id: 'q20', type: 'MULTIPLE_CHOICE', question: 'What is Boundaries\' cell phone policy during work hours?', options: ['Phones can be used freely as long as it doesn\'t interfere with work', 'Phones must be left in a locker at all times', 'Cell phone use is only allowed for emergencies or job-related tasks', 'Texting is fine if it\'s quick'], correctAnswers: ['Cell phone use is only allowed for emergencies or job-related tasks'] },
          { id: 'q21', type: 'MULTIPLE_CHOICE', question: 'What happens on a team member\'s third strike under the conduct policy?', options: ['A final warning is issued', 'The employee is suspended', 'Termination of employment', 'Pay is withheld for the next shift'], correctAnswers: ['Termination of employment'] },
          { id: 'q22', type: 'MULTIPLE_CHOICE', question: 'What is required of employees before consuming a meal during a shift?', options: ['Get verbal permission from a teammate', 'Eat at the front counter quickly', 'Eat only in the designated area behind the walk-in cooler', 'Log their meal break in the POS system'], correctAnswers: ['Eat only in the designated area behind the walk-in cooler'] },
          { id: 'q23', type: 'MULTIPLE_CHOICE', question: 'How many "no shows" within 12 months will result in potential termination?', options: ['1', '2', '3', '4'], correctAnswers: ['2'] },
          { id: 'q24', type: 'MULTIPLE_CHOICE', question: 'What is the definition of a no-show at Boundaries Coffee?', options: ['Being over 10 minutes late for your shift', 'Giving less than 24 hours\' notice for time off', 'Being more than 20 minutes late or missing a shift without notice or medical emergency', 'Forgetting to clock in for a shift'], correctAnswers: ['Being more than 20 minutes late or missing a shift without notice or medical emergency'] },
          { id: 'q25', type: 'MULTIPLE_CHOICE', question: 'An employee finds out they cannot make their shift five days before it starts. What are they expected to do?', options: ['Nothing, since it\'s more than 24 hours in advance', 'Call in sick and assume it\'s excused', 'Find a replacement and notify the manager', 'Just let the manager know the day before'], correctAnswers: ['Find a replacement and notify the manager'] },
          { id: 'q26', type: 'MULTIPLE_CHOICE', question: 'How should you go about finding a replacement if you realize you can\'t make your shift?', options: ['Call everyone available on Sling and ask if they can cover', 'Send a group message in the Sling messaging center', 'Post in the team group chat and wait for replies', 'Text a few friends and hope someone picks it up'], correctAnswers: ['Send a group message in the Sling messaging center'] },
          { id: 'q27', type: 'MULTIPLE_CHOICE', question: 'What should an employee do if they are feeling ill 24 hours before their shift?', options: ['Wait to see if they feel better and decide in the morning', 'Notify their manager and begin calling team members to find a shift cover', 'Text a coworker and assume it\'s handled', 'Message the group chat and hope someone takes the shift'], correctAnswers: ['Notify their manager and begin calling team members to find a shift cover'] },
          { id: 'q28', type: 'MULTIPLE_CHOICE', question: 'Which of the following is part of Boundaries Coffee\'s required dress code?', options: ['Clean, branded Boundaries attire for the base layer', 'Any shirt or hoodie as long as it is comfortable', 'Political or graphic logo clothing', 'Brightly colored sneakers and open-toed shoes'], correctAnswers: ['Clean, branded Boundaries attire for the base layer'] },
          { id: 'q29', type: 'MULTIPLE_CHOICE', question: 'Which of the following is not allowed under Boundaries Coffee\'s dress code?', options: ['Closed-toed shoes appropriate for the weather', 'Water-resistant jackets in Boundaries colors', 'Fleece jackets for outerwear', 'Clean black or navy pants'], correctAnswers: ['Fleece jackets for outerwear'] },
          { id: 'q30', type: 'MULTIPLE_CHOICE', question: 'Which of the following hygiene practices is required for all employees at Boundaries Coffee?', options: ['Hair must be well kept and put up off the shoulders if long', 'Employees may wear strong perfumes or colognes', 'Nails and hands must be clean but gloves are optional', 'Hats can be dirty as long as they match Boundaries colors'], correctAnswers: ['Hair must be well kept and put up off the shoulders if long'] },
          { id: 'q31', type: 'MULTIPLE_CHOICE', question: 'What hygiene standard must employees follow when working a shift?', options: ['Only wash hands once at the start of the shift', 'Keep nails and hands clean and well kept', 'Use hand sanitizer instead of hand washing', 'Wear excessive jewelry to appear professional'], correctAnswers: ['Keep nails and hands clean and well kept'] }
        ]
      }
    ]
  },
  {
    id: 'm-morning',
    title: 'Module 3: A Barista\'s Morning',
    description: 'Learn the first steps in the cafe and the art of dialing in.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-morning-video',
        moduleId: 'm-morning',
        title: 'Video: A Barista\'s Morning Routine',
        type: 'CONTENT',
        videoUrl: 'https://youtube.com/watch?v=qiSpThw_S-o',
        content: 'Watch the full routine of opening the cafe, from sanitation to initial brew tests.'
      },
      {
        id: 'l-morning-quiz',
        moduleId: 'm-morning',
        title: 'Morning Protocols Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q32', type: 'MULTIPLE_CHOICE', question: 'What is one of the first things the barista does when starting a morning shift?', options: ['Brew espresso', 'Wash hands', 'Fill syrups', 'Clean the pastry case'], correctAnswers: ['Wash hands'] },
          { id: 'q33', type: 'MULTIPLE_CHOICE', question: 'Why does the barista taste the batch brew after it finishes brewing?', options: ['To practice cupping techniques', 'To calibrate with other baristas', 'To confirm the flavor is correct before serving customers', 'To determine the caffeine level'], correctAnswers: ['To confirm the flavor is correct before serving customers'] },
          { id: 'q34', type: 'MULTIPLE_CHOICE', question: 'What does "dialing in" espresso involve?', options: ['Cleaning the espresso machine', 'Measuring and adjusting espresso shots for ideal yield and taste', 'Warming up the portafilters', 'Scheduling baristas for the day'], correctAnswers: ['Measuring and adjusting espresso shots for ideal yield and taste'] },
          { id: 'q35', type: 'MULTIPLE_CHOICE', question: 'Which of the following tasks is part of restocking before opening the café?', options: ['Scrubbing the espresso machine', 'Counting the till', 'Preparing latte art pitchers', 'Refilling lids, syrups, stir sticks, and stocking tea bags'], correctAnswers: ['Refilling lids, syrups, stir sticks, and stocking tea bags'] },
          { id: 'q36', type: 'MULTIPLE_CHOICE', question: 'Why is it important to taste the brewed coffee before serving it to customers?', options: ['To check if the coffee grinder is clean', 'To ensure the coffee tastes correct and meets company standards', 'To compare different types of milk options', 'To practice for latte art competitions'], correctAnswers: ['To ensure the coffee tastes correct and meets company standards'] },
          { id: 'q37', type: 'MULTIPLE_CHOICE', question: 'What does "dialing in" espresso mean?', options: ['Measuring how many lattes are sold each day', 'Adjusting the coffee grind and espresso settings to meet the correct weight and taste standards', 'Practicing latte art during free time', 'Brewing coffee without measuring the grounds'], correctAnswers: ['Adjusting the coffee grind and espresso settings to meet the correct weight and taste standards'] },
          { id: 'q38', type: 'MULTIPLE_CHOICE', question: 'What is the first thing employees are expected to do at the beginning of a shift?', options: ['Pull shots for practice drinks', 'Taste the drip coffee', 'Turn on the grinders', 'Wash their hands vigorously'], correctAnswers: ['Wash their hands vigorously'] },
          { id: 'q39', type: 'MULTIPLE_CHOICE', question: 'Why is hand washing emphasized as the very first task of the shift?', options: ['It\'s a Texas health code requirement before handling any food or beverage items', 'It helps wake you up in the morning', 'It\'s only necessary if you touched something dirty', 'It\'s optional but recommended'], correctAnswers: ['It\'s a Texas health code requirement before handling any food or beverage items'] },
          { id: 'q40', type: 'MULTIPLE_CHOICE', question: 'When dialing in espresso, what two key measurements are you trying to achieve?', options: ['Temperature and pressure', 'Dose (input weight) and yield (output weight)', 'Grind size and water volume', 'Brew time and cup size'], correctAnswers: ['Dose (input weight) and yield (output weight)'] },
          { id: 'q41', type: 'MULTIPLE_CHOICE', question: 'If the espresso tastes sour during the dial-in process, what adjustment should typically be made?', options: ['Use a coarser grind to speed up extraction', 'Use a finer grind to slow down extraction and increase sweetness', 'Add more water to the shot', 'Reduce the dose amount'], correctAnswers: ['Use a finer grind to slow down extraction and increase sweetness'] },
          { id: 'q42', type: 'MULTIPLE_CHOICE', question: 'Why is restocking supplies before opening important for the flow of service?', options: ['It gives baristas something to do while waiting for customers', 'It ensures you won\'t run out of essential items during the rush, which would slow down service', 'It\'s not important - you can restock during slow periods', 'It\'s mainly for appearance when the manager arrives'], correctAnswers: ['It ensures you won\'t run out of essential items during the rush, which would slow down service'] },
          { id: 'q43', type: 'MULTIPLE_CHOICE', question: 'What is the purpose of purging the espresso group head before pulling a shot?', options: ['To cool down the machine', 'To flush out old grounds and ensure fresh, clean water for extraction', 'To make a noise that signals you\'re ready', 'It\'s not necessary if the machine is already on'], correctAnswers: ['To flush out old grounds and ensure fresh, clean water for extraction'] }
        ]
      }
    ]
  },
  {
    id: 'm-ordering',
    title: 'Module 4: Ordering at a Coffee Shop',
    description: 'Understand the menu standards and drink definitions.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-ordering-video',
        moduleId: 'm-ordering',
        title: 'Video: How to Order at a Coffee Shop',
        type: 'CONTENT',
        videoUrl: 'https://youtube.com/watch?v=uv4d3qpbd80',
        content: 'Learn how to accurately take orders and the science behind our standard drink builds.'
      },
      {
        id: 'l-ordering-quiz',
        moduleId: 'm-ordering',
        title: 'Drink Standards Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q44', type: 'MULTIPLE_CHOICE', question: 'What is the main difference between cold brew and iced coffee?', options: ['Cold brew is brewed hot and then chilled quickly', 'Cold brew is brewed cold over a long period of time, usually 18–24 hours', 'Cold brew has milk added automatically during brewing', 'Cold brew has less caffeine than iced coffee'], correctAnswers: ['Cold brew is brewed cold over a long period of time, usually 18–24 hours'] },
          { id: 'q45', type: 'MULTIPLE_CHOICE', question: 'What is a cortado made of?', options: ['Two ounces of espresso and three and a half ounces of steamed milk', 'Two ounces of espresso and two ounces of steamed milk', 'One ounce of espresso and one ounce of hot water', 'Two shots of espresso topped with foam only'], correctAnswers: ['Two ounces of espresso and two ounces of steamed milk'] },
          { id: 'q46', type: 'MULTIPLE_CHOICE', question: 'What is an Americano made of?', options: ['Two shots of espresso combined with hot or cold water', 'Two shots of espresso mixed with steamed milk', 'Brewed coffee poured over ice', 'Cold brew mixed with sparkling water'], correctAnswers: ['Two shots of espresso combined with hot or cold water'] },
          { id: 'q47', type: 'MULTIPLE_CHOICE', question: 'What is a mocha?', options: ['An Americano with chocolate added', 'A latte with chocolate sauce and sometimes cocoa powder', 'A cold brew topped with whipped cream', 'A cappuccino with extra foam and cinnamon'], correctAnswers: ['A latte with chocolate sauce and sometimes cocoa powder'] },
          { id: 'q48', type: 'MULTIPLE_CHOICE', question: 'What is the key difference between a latte and a cappuccino?', options: ['A cappuccino uses decaf espresso', 'A latte has more steamed milk, while a cappuccino has more foam and less liquid milk', 'A cappuccino is always iced', 'There is no difference - they are the same drink'], correctAnswers: ['A latte has more steamed milk, while a cappuccino has more foam and less liquid milk'] },
          { id: 'q49', type: 'MULTIPLE_CHOICE', question: 'What makes a macchiato different from other espresso drinks?', options: ['It uses a different type of coffee bean', 'It\'s espresso "marked" or "stained" with just a small amount of milk or foam', 'It\'s the same as an Americano', 'It always includes flavored syrup'], correctAnswers: ['It\'s espresso "marked" or "stained" with just a small amount of milk or foam'] },
          { id: 'q50', type: 'MULTIPLE_CHOICE', question: 'Why might a customer choose cold brew over iced coffee?', options: ['Cold brew is always cheaper', 'Cold brew typically has a smoother, less acidic flavor due to the cold extraction process', 'Iced coffee has more caffeine', 'Cold brew is made fresh while iced coffee is pre-made'], correctAnswers: ['Cold brew typically has a smoother, less acidic flavor due to the cold extraction process'] },
          { id: 'q51', type: 'MULTIPLE_CHOICE', question: 'If a customer wants a strong coffee flavor but doesn\'t like milk, which drink would you recommend?', options: ['Latte', 'Cappuccino', 'Americano', 'Mocha'], correctAnswers: ['Americano'] },
          { id: 'q52', type: 'MULTIPLE_CHOICE', question: 'What is a flat white, and how does it differ from a latte?', options: ['A flat white uses oat milk only', 'A flat white has a higher ratio of espresso to milk and features microfoam rather than frothy foam', 'A flat white is served cold', 'There is no difference - it\'s a regional name for a latte'], correctAnswers: ['A flat white has a higher ratio of espresso to milk and features microfoam rather than frothy foam'] },
          { id: 'q53', type: 'MULTIPLE_CHOICE', question: 'A customer orders a "dry" cappuccino. What does this mean?', options: ['They want it with no espresso', 'They want extra foam and less steamed milk', 'They want it at room temperature', 'They want no foam at all'], correctAnswers: ['They want extra foam and less steamed milk'] }
        ]
      }
    ]
  },
  {
    id: 'm-specialty',
    title: 'Module 5: What is Specialty Coffee?',
    description: 'Learn the technical definitions and Jon\'s long-term goal for the industry.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-specialty-video',
        moduleId: 'm-specialty',
        title: 'Video: What is Specialty Coffee?',
        type: 'CONTENT',
        videoUrl: 'https://youtube.com/watch?v=kM_UlQ9fr2c',
        content: 'Understand the technical 100-point scoring system and the mission of SCA.'
      },
      {
        id: 'l-specialty-quiz',
        moduleId: 'm-specialty',
        title: 'Specialty Coffee Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q54', type: 'MULTIPLE_CHOICE', question: 'What is the technical definition of specialty coffee?', options: ['Coffee with a sensory score of 80 or above based on quality measures like acidity, sweetness, and aroma', 'Coffee that is brewed with added syrups and flavors', 'Coffee that is roasted darker than normal', 'Coffee that is only served cold or iced'], correctAnswers: ['Coffee with a sensory score of 80 or above based on quality measures like acidity, sweetness, and aroma'] },
          { id: 'q55', type: 'MULTIPLE_CHOICE', question: 'Why does specialty coffee often cost more than commodity coffee?', options: ['It is grown closer to the United States', 'Specialty coffee requires more labor, higher quality farming practices, and careful defect removal', 'It is roasted with more expensive equipment', 'It is taxed at a higher rate'], correctAnswers: ['Specialty coffee requires more labor, higher quality farming practices, and careful defect removal'] },
          { id: 'q56', type: 'MULTIPLE_CHOICE', question: 'What is Jon\'s long-term goal for the coffee industry?', options: ['To make baristas more famous than chefs', 'To turn farms and producers into recognized brands for consumers', 'To create more syrup-based drinks for cafes', 'To replace wine as the most prestigious beverage'], correctAnswers: ['To turn farms and producers into recognized brands for consumers'] },
          { id: 'q57', type: 'MULTIPLE_CHOICE', question: 'What organization developed the 100-point scoring system used to grade specialty coffee?', options: ['The National Coffee Association', 'The Specialty Coffee Association (SCA)', 'The USDA', 'Starbucks Corporation'], correctAnswers: ['The Specialty Coffee Association (SCA)'] },
          { id: 'q58', type: 'MULTIPLE_CHOICE', question: 'What sensory attributes are evaluated when scoring specialty coffee?', options: ['Only the caffeine content and color', 'Aroma, flavor, aftertaste, acidity, body, balance, uniformity, clean cup, sweetness, and overall impression', 'Just the bitterness and temperature', 'Only the packaging and brand name'], correctAnswers: ['Aroma, flavor, aftertaste, acidity, body, balance, uniformity, clean cup, sweetness, and overall impression'] },
          { id: 'q59', type: 'MULTIPLE_CHOICE', question: 'Why is traceability important in specialty coffee?', options: ['It\'s only important for marketing purposes', 'It allows consumers to know exactly where their coffee came from and ensures farmers are fairly compensated', 'It makes the coffee taste better', 'It\'s a government requirement'], correctAnswers: ['It allows consumers to know exactly where their coffee came from and ensures farmers are fairly compensated'] },
          { id: 'q60', type: 'MULTIPLE_CHOICE', question: 'What is the difference between "commodity" coffee and "specialty" coffee?', options: ['Commodity coffee is always organic', 'Commodity coffee is mass-produced with less focus on quality, while specialty coffee is carefully sourced and graded for exceptional taste', 'There is no difference - they are marketing terms', 'Specialty coffee is always decaffeinated'], correctAnswers: ['Commodity coffee is mass-produced with less focus on quality, while specialty coffee is carefully sourced and graded for exceptional taste'] },
          { id: 'q61', type: 'MULTIPLE_CHOICE', question: 'How does the specialty coffee movement benefit coffee farmers?', options: ['It doesn\'t - farmers receive the same payment regardless', 'Farmers can earn premium prices for higher quality beans, and direct trade relationships provide more income than commodity markets', 'It only benefits roasters and cafes', 'Farmers are required to work longer hours'], correctAnswers: ['Farmers can earn premium prices for higher quality beans, and direct trade relationships provide more income than commodity markets'] }
        ]
      }
    ]
  },
  {
    id: 'm-seed',
    title: 'Module 6: Coffee Seed to Cup',
    description: 'Trace the journey of coffee from the plant to the green bean.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-seed-video',
        moduleId: 'm-seed',
        title: 'Video: Coffee Seed to Cup',
        type: 'CONTENT',
        videoUrl: 'https://youtube.com/watch?v=Dmpnrtey3YU',
        content: 'Understand altitude, processing methods (washed vs natural), and the stages of coffee maturation.'
      },
      {
        id: 'l-seed-quiz',
        moduleId: 'm-seed',
        title: 'Agricultural Standards Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q62', type: 'MULTIPLE_CHOICE', question: 'What factors contribute to the high quality of coffee grown at higher altitudes?', options: ['Faster growth, more sunlight, more machine harvesting', 'Slow growth, rich volcanic soil, and cooler climates', 'Fast harvesting, flat terrain, and larger bean size', 'Hotter temperatures and quicker ripening'], correctAnswers: ['Slow growth, rich volcanic soil, and cooler climates'] },
          { id: 'q63', type: 'MULTIPLE_CHOICE', question: 'What is one major reason specialty coffee costs more than commodity coffee?', options: ['It is picked and processed by machines', 'It grows faster and produces more beans', 'It requires more labor-intensive harvesting and sorting by hand', 'It is mixed with different flavored syrups'], correctAnswers: ['It requires more labor-intensive harvesting and sorting by hand'] },
          { id: 'q64', type: 'MULTIPLE_CHOICE', question: 'What is the washed process used for in coffee production?', options: ['To mix different coffee varieties', 'To ferment coffee cherries to remove mucilage and improve flavor', 'To dry coffee cherries directly in the sun without processing', 'To roast coffee immediately after harvesting'], correctAnswers: ['To ferment coffee cherries to remove mucilage and improve flavor'] },
          { id: 'q65', type: 'MULTIPLE_CHOICE', question: 'What is the final stage before coffee is exported and roasted?', options: ['Green coffee', 'Red cherries', 'Dry parchment', 'Wet parchment'], correctAnswers: ['Green coffee'] },
          { id: 'q66', type: 'MULTIPLE_CHOICE', question: 'What is the name of the coffee plant species that produces both commodity and specialty coffee?', options: ['Coffea robusta', 'Coffea liberica', 'Coffea arabica', 'Coffea excelsa'], correctAnswers: ['Coffea arabica'] },
          { id: 'q67', type: 'MULTIPLE_CHOICE', question: 'Which of the following correctly lists the five main stages of coffee processing?', options: ['Green coffee, roasted coffee, wet parchment, dry parchment, red cherry', 'Red cherry, wet parchment, dry parchment, green coffee, roasted coffee', 'Dry parchment, red cherry, green coffee, roasted coffee, wet parchment', 'Wet parchment, red cherry, roasted coffee, green coffee, dry parchment'], correctAnswers: ['Red cherry, wet parchment, dry parchment, green coffee, roasted coffee'] },
          { id: 'q68', type: 'MULTIPLE_CHOICE', question: 'Coffee is best described as what part of the plant?', options: ['The seed inside a cherry', 'The root of a small bush', 'The leaf of the coffee tree', 'The outer skin of the fruit'], correctAnswers: ['The seed inside a cherry'] },
          { id: 'q69', type: 'MULTIPLE_CHOICE', question: 'What is the "natural" or "dry" processing method?', options: ['Coffee cherries are washed immediately after picking', 'Coffee cherries are dried whole with the fruit still on the seed, creating fruity flavor notes', 'Coffee is processed using chemicals', 'Coffee is frozen before processing'], correctAnswers: ['Coffee cherries are dried whole with the fruit still on the seed, creating fruity flavor notes'] },
          { id: 'q70', type: 'MULTIPLE_CHOICE', question: 'What is the "Coffee Belt" or "Bean Belt"?', options: ['A brand of coffee equipment', 'The region between the Tropics of Cancer and Capricorn where coffee grows best', 'A type of coffee storage container', 'A measurement tool for coffee beans'], correctAnswers: ['The region between the Tropics of Cancer and Capricorn where coffee grows best'] },
          { id: 'q71', type: 'MULTIPLE_CHOICE', question: 'Why is selective hand-picking preferred for specialty coffee harvesting?', options: ['It\'s faster than machine harvesting', 'It allows pickers to choose only ripe cherries, ensuring consistent quality', 'It\'s required by law in all countries', 'It doesn\'t matter how coffee is harvested'], correctAnswers: ['It allows pickers to choose only ripe cherries, ensuring consistent quality'] },
          { id: 'q72', type: 'MULTIPLE_CHOICE', question: 'What is "mucilage" in coffee processing?', options: ['A type of coffee roast', 'The sticky, sugary layer surrounding the coffee seed inside the cherry', 'A coffee brewing method', 'A disease that affects coffee plants'], correctAnswers: ['The sticky, sugary layer surrounding the coffee seed inside the cherry'] },
          { id: 'q73', type: 'MULTIPLE_CHOICE', question: 'How does altitude affect coffee flavor development?', options: ['Higher altitude means faster ripening and milder flavors', 'Higher altitude slows cherry maturation, allowing sugars and acids to develop more complex flavors', 'Altitude has no effect on coffee flavor', 'Lower altitude produces more complex flavors'], correctAnswers: ['Higher altitude slows cherry maturation, allowing sugars and acids to develop more complex flavors'] },
          { id: 'q74', type: 'MULTIPLE_CHOICE', question: 'What happens during the "hulling" stage of coffee processing?', options: ['The coffee is roasted', 'The parchment layer is removed from the dried coffee to reveal the green bean', 'The coffee cherries are picked', 'The coffee is brewed for testing'], correctAnswers: ['The parchment layer is removed from the dried coffee to reveal the green bean'] }
        ]
      }
    ]
  },
  {
    id: 'm-onyx',
    title: 'Module 7: Onyx Coffee Lab',
    description: 'Learn from the quality standards of an industry-leading roastery.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-onyx-video',
        moduleId: 'm-onyx',
        title: 'Video: Onyx Coffee Lab Quality Standards',
        type: 'CONTENT',
        videoUrl: 'https://youtube.com/watch?v=WYZQGE6M4Tc',
        content: 'Observe the "Never Settle" philosophy in action through color-sorting and precision roasting.'
      },
      {
        id: 'l-onyx-quiz',
        moduleId: 'm-onyx',
        title: 'Onyx Standards Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q75', type: 'MULTIPLE_CHOICE', question: 'What is the meaning of Onyx\'s tagline "Never Settle for Good Enough"?', options: ['Always offer fast service over quality', 'Strive for excellence and constantly push for better quality', 'Focus on lowering costs by cutting corners', 'Create as many new coffee drinks as possible each season'], correctAnswers: ['Strive for excellence and constantly push for better quality'] },
          { id: 'q76', type: 'MULTIPLE_CHOICE', question: 'What quality control steps are mentioned for processing coffee at Onyx?', options: ['Roast the coffee and ship it immediately without checking', 'Sort green coffee only by weight, not quality', 'Roast, color sort to remove defects, cup for quality, then bag and ship', 'Only roast large batches without checking flavor'], correctAnswers: ['Roast, color sort to remove defects, cup for quality, then bag and ship'] },
          { id: 'q77', type: 'MULTIPLE_CHOICE', question: 'What was the original goal behind founding Onyx Coffee Lab?', options: ['To open the largest chain of drive-thru coffee shops', 'To create flavored coffee syrups for mass distribution', 'To build a coffee company geared toward coffee professionals', 'To focus exclusively on selling equipment and merchandise'], correctAnswers: ['To build a coffee company geared toward coffee professionals'] },
          { id: 'q78', type: 'MULTIPLE_CHOICE', question: 'What is "color sorting" in coffee roasting and why is it important?', options: ['It\'s a marketing technique to make bags look attractive', 'It uses optical sensors to identify and remove defective beans that would negatively impact flavor', 'It determines what color bag the coffee will be sold in', 'It\'s the same as grading coffee by size'], correctAnswers: ['It uses optical sensors to identify and remove defective beans that would negatively impact flavor'] },
          { id: 'q79', type: 'MULTIPLE_CHOICE', question: 'What is "cupping" in the context of coffee quality control?', options: ['A method of measuring how much coffee fits in a cup', 'A standardized tasting protocol used to evaluate coffee\'s aroma, flavor, and quality', 'A way to package coffee for shipping', 'A technique for brewing espresso'], correctAnswers: ['A standardized tasting protocol used to evaluate coffee\'s aroma, flavor, and quality'] },
          { id: 'q80', type: 'MULTIPLE_CHOICE', question: 'Why would a roaster cup every batch of coffee before shipping?', options: ['To delay the shipping process', 'To ensure consistent quality and catch any defects before the coffee reaches customers', 'It\'s not necessary - tasting is optional', 'To add extra caffeine to the beans'], correctAnswers: ['To ensure consistent quality and catch any defects before the coffee reaches customers'] },
          { id: 'q81', type: 'MULTIPLE_CHOICE', question: 'How does Onyx\'s approach to quality reflect the "Never Settle" philosophy?', options: ['They accept whatever quality beans are available', 'They implement multiple quality checkpoints throughout the process and reject anything that doesn\'t meet their standards', 'They focus only on speed of production', 'They outsource all quality control'], correctAnswers: ['They implement multiple quality checkpoints throughout the process and reject anything that doesn\'t meet their standards'] }
        ]
      }
    ]
  },
  {
    id: 'm-ideal',
    title: 'Module 8: The Ideal Team Player',
    description: 'Master the soft skills required for a high-performing team.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-ideal-video',
        moduleId: 'm-ideal',
        title: 'Video: The Ideal Team Player (Lencioni)',
        type: 'CONTENT',
        videoUrl: 'https://youtube.com/watch?v=PRh80RyT74I',
        content: 'Understand the three virtues that make a Boundaries team member successful.'
      },
      {
        id: 'l-ideal-quiz',
        moduleId: 'm-ideal',
        title: 'Teamwork Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q82', type: 'MULTIPLE_CHOICE', question: 'What are the three virtues of an ideal team player, according to Patrick Lencioni?', options: ['Humble, Hungry, Smart', 'Helpful, Honest, Strategic', 'Hardworking, Empathetic, Logical', 'Happy, Healthy, Structured'], correctAnswers: ['Humble, Hungry, Smart'] },
          { id: 'q83', type: 'MULTIPLE_CHOICE', question: 'What does Lencioni say is the most important of the three virtues?', options: ['Smart', 'Hungry', 'Humble', 'Hardworking'], correctAnswers: ['Humble'] },
          { id: 'q84', type: 'MULTIPLE_CHOICE', question: 'What does it mean to be "hungry" in the context of being a team player?', options: ['Wanting promotions and recognition', 'Having a strong internal drive to do more than the minimum', 'Working long hours for approval', 'Being competitive with teammates'], correctAnswers: ['Having a strong internal drive to do more than the minimum'] },
          { id: 'q85', type: 'MULTIPLE_CHOICE', question: 'What type of team member is described as smart and hungry but not humble?', options: ['Accidental mess maker', 'Lovable slacker', 'Skillful politician', 'Silent contributor'], correctAnswers: ['Skillful politician'] },
          { id: 'q86', type: 'MULTIPLE_CHOICE', question: 'Which of the following best describes someone who is humble and smart but not hungry?', options: ['Skillful politician', 'Lovable slacker', 'Silent overachiever', 'Unintentional leader'], correctAnswers: ['Lovable slacker'] },
          { id: 'q87', type: 'MULTIPLE_CHOICE', question: 'What does "smart" mean in Lencioni\'s framework (it\'s not about intelligence)?', options: ['Having a high IQ', 'Being good at solving math problems', 'Having common sense about people - understanding how words and actions affect others', 'Being the smartest person in the room'], correctAnswers: ['Having common sense about people - understanding how words and actions affect others'] },
          { id: 'q88', type: 'MULTIPLE_CHOICE', question: 'What type of team member is described as humble and hungry but not smart?', options: ['The Skillful Politician', 'The Accidental Mess Maker - they mean well but unintentionally create interpersonal problems', 'The Lovable Slacker', 'The Perfect Employee'], correctAnswers: ['The Accidental Mess Maker - they mean well but unintentionally create interpersonal problems'] },
          { id: 'q89', type: 'MULTIPLE_CHOICE', question: 'Why is humility considered the most important virtue for team players?', options: ['Because humble people don\'t ask for raises', 'Because without humility, a person\'s hunger and smarts can be used for selfish purposes that harm the team', 'Because humble people work faster', 'Humility isn\'t actually that important'], correctAnswers: ['Because without humility, a person\'s hunger and smarts can be used for selfish purposes that harm the team'] },
          { id: 'q90', type: 'MULTIPLE_CHOICE', question: 'A coworker always does the minimum required and leaves exactly on time, but is pleasant and well-liked. Which virtue are they likely missing?', options: ['Humble', 'Smart', 'Hungry', 'None - they\'re an ideal team player'], correctAnswers: ['Hungry'] },
          { id: 'q91', type: 'MULTIPLE_CHOICE', question: 'How can you demonstrate being "hungry" during a shift at Boundaries Coffee?', options: ['Complaining that you\'re not being given enough hours', 'Doing only what\'s on your assigned checklist', 'Looking for additional tasks to help the team, even when your own work is done', 'Asking for a promotion every week'], correctAnswers: ['Looking for additional tasks to help the team, even when your own work is done'] },
          { id: 'q92', type: 'MULTIPLE_CHOICE', question: 'A team member is talented and driven but takes credit for others\' work and manipulates situations. What type are they?', options: ['The Ideal Team Player', 'The Lovable Slacker', 'The Skillful Politician - they lack humility', 'The Accidental Mess Maker'], correctAnswers: ['The Skillful Politician - they lack humility'] },
          { id: 'q93', type: 'MULTIPLE_CHOICE', question: 'According to Lencioni, which combination of missing virtues is the most dangerous for a team?', options: ['Missing humble only', 'Missing hungry only', 'Missing smart only', 'Having none of the three virtues'], correctAnswers: ['Having none of the three virtues'] }
        ]
      }
    ]
  },
  {
    id: 'm-espresso-fundamentals',
    title: 'Module 9: Espresso Fundamentals',
    description: 'Learn the basics of espresso extraction, dosing, tamping, and equipment.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-espresso-video',
        moduleId: 'm-espresso-fundamentals',
        title: 'Espresso Crash Course',
        type: 'CONTENT',
        videoUrl: 'https://www.youtube.com/watch?v=ZuQu12vMQZM',
        content: 'Watch this Prima Coffee video to learn espresso fundamentals before taking the quiz.'
      },
      {
        id: 'l-espresso-quiz',
        moduleId: 'm-espresso-fundamentals',
        title: 'Espresso Fundamentals Quiz',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'eq1', type: 'MULTIPLE_CHOICE', question: 'What makes espresso different from other brewing methods like French press or pour-over?', options: ['It uses a special type of coffee bean', 'It uses high pressurized water to shorten brew time and dissolve more solids', 'It requires a darker roast than other methods', 'It brews at a lower temperature than other methods'], correctAnswers: ['It uses high pressurized water to shorten brew time and dissolve more solids'] },
          { id: 'eq2', type: 'MULTIPLE_CHOICE', question: 'What is espresso best described as?', options: ['A special blend of coffee beans', 'A very concentrated means of making coffee', 'Coffee brewed with extra hot water', 'A specific roast level of coffee'], correctAnswers: ['A very concentrated means of making coffee'] },
          { id: 'eq3', type: 'MULTIPLE_CHOICE', question: 'What creates the distinctive layer of crema at the top of an espresso shot?', options: ['Adding milk to the espresso', 'Using dark roasted beans', 'The emulsification of oils under high pressure', 'Brewing at very high temperatures'], correctAnswers: ['The emulsification of oils under high pressure'] },
          { id: 'eq4', type: 'MULTIPLE_CHOICE', question: 'How fine should espresso be ground compared to other brewing methods?', options: ['About the same as drip coffee', 'Coarser than French press', 'Very fine - finer than almost any other method except Turkish', 'Medium grind like pour-over'], correctAnswers: ['Very fine - finer than almost any other method except Turkish'] },
          { id: 'eq5', type: 'MULTIPLE_CHOICE', question: 'What does "dose" refer to in espresso making?', options: ['The temperature of the water', 'The amount of ground coffee used (the brewing ratio)', 'The pressure of the machine', 'The speed of extraction'], correctAnswers: ['The amount of ground coffee used (the brewing ratio)'] },
          { id: 'eq6', type: 'MULTIPLE_CHOICE', question: 'What is the recommended dose for a double shot of espresso?', options: ['10 to 14 grams', '18 to 21 grams', '25 to 30 grams', '35 to 40 grams'], correctAnswers: ['18 to 21 grams'] },
          { id: 'eq7', type: 'MULTIPLE_CHOICE', question: 'What does "yield" refer to in espresso making?', options: ['The amount of water that goes into the machine', 'The temperature of the espresso', 'The amount of espresso that comes out of the machine', 'The pressure used during extraction'], correctAnswers: ['The amount of espresso that comes out of the machine'] },
          { id: 'eq8', type: 'MULTIPLE_CHOICE', question: 'Why do we measure espresso out instead of water in?', options: ['It\'s faster to measure', 'We\'re not able to measure the exact water going into the puck in an espresso machine', 'The water amount doesn\'t matter', 'Espresso machines don\'t use water'], correctAnswers: ['We\'re not able to measure the exact water going into the puck in an espresso machine'] },
          { id: 'eq9', type: 'MULTIPLE_CHOICE', question: 'What is the approximate weight of a 2oz espresso shot?', options: ['About 15 grams', 'About 30 grams', 'About 45 grams', 'About 60 grams'], correctAnswers: ['About 30 grams'] },
          { id: 'eq10', type: 'MULTIPLE_CHOICE', question: 'Why is tamping important when making espresso?', options: ['It heats up the coffee grounds', 'It creates restriction so water and coffee are forced to interact under pressure', 'It adds flavor to the espresso', 'It cools down the portafilter'], correctAnswers: ['It creates restriction so water and coffee are forced to interact under pressure'] },
          { id: 'eq11', type: 'MULTIPLE_CHOICE', question: 'What would happen if you didn\'t tamp the coffee at all?', options: ['The shot would taste the same', 'The water would fly right through, producing a weak, underdeveloped shot', 'The shot would be too strong', 'The machine would not turn on'], correctAnswers: ['The water would fly right through, producing a weak, underdeveloped shot'] },
          { id: 'eq12', type: 'MULTIPLE_CHOICE', question: 'What is the recommended temperature range for brewing espresso?', options: ['175°F to 185°F', '185°F to 195°F', '195°F to 205°F', '210°F to 220°F'], correctAnswers: ['195°F to 205°F'] },
          { id: 'eq13', type: 'MULTIPLE_CHOICE', question: 'What type of grinder should you use for espresso?', options: ['A blade grinder for quick results', 'A burr grinder that can grind very fine with precise adjustments', 'Any coffee grinder will work the same', 'A coarse grinder designed for French press'], correctAnswers: ['A burr grinder that can grind very fine with precise adjustments'] },
          { id: 'eq14', type: 'MULTIPLE_CHOICE', question: 'Why is it important that an espresso grinder offers very fine adjustment?', options: ['So you can make large changes quickly', 'So you can make minute adjustments within the fine range without wide swings', 'Fine adjustment doesn\'t matter for espresso', 'To grind faster'], correctAnswers: ['So you can make minute adjustments within the fine range without wide swings'] },
          { id: 'eq15', type: 'MULTIPLE_CHOICE', question: 'What is a portafilter?', options: ['The water reservoir', 'A metal filter basket attached to a handle where you put the ground coffee', 'The steam wand', 'The drip tray'], correctAnswers: ['A metal filter basket attached to a handle where you put the ground coffee'] },
          { id: 'eq16', type: 'MULTIPLE_CHOICE', question: 'Why should you run water through the group and portafilter before brewing?', options: ['To clean out old coffee grounds', 'To bring fresh water to the front and ensure everything is hot for temperature stability', 'To test the water pressure', 'To soften the filter basket'], correctAnswers: ['To bring fresh water to the front and ensure everything is hot for temperature stability'] },
          { id: 'eq17', type: 'MULTIPLE_CHOICE', question: 'Why is it important to wipe the portafilter dry before grinding?', options: ['To prevent rust', 'To prevent coffee from sticking and clumping, which affects even extraction', 'To make the portafilter lighter', 'It\'s not important to dry it'], correctAnswers: ['To prevent coffee from sticking and clumping, which affects even extraction'] },
          { id: 'eq18', type: 'MULTIPLE_CHOICE', question: 'Why is distribution important before tamping?', options: ['It makes the coffee look nicer', 'Even packing starts at distribution; uneven distribution leads to uneven pressure when tamping', 'Distribution doesn\'t affect the shot', 'It removes excess coffee'], correctAnswers: ['Even packing starts at distribution; uneven distribution leads to uneven pressure when tamping'] },
          { id: 'eq19', type: 'MULTIPLE_CHOICE', question: 'What is a "bottomless" or "naked" portafilter used for?', options: ['To make the espresso hotter', 'To check if your tamp is even by watching the stream during extraction', 'To make double shots', 'To reduce cleanup time'], correctAnswers: ['To check if your tamp is even by watching the stream during extraction'] },
          { id: 'eq20', type: 'MULTIPLE_CHOICE', question: 'What does the "polish" or twist at the end of tamping do?', options: ['It adds shine to the puck', 'It helps put loose grounds in their place and ensures everything is smooth for water penetration', 'It removes the tamper more easily', 'It has no purpose'], correctAnswers: ['It helps put loose grounds in their place and ensures everything is smooth for water penetration'] }
        ]
      }
    ]
  },
  {
    id: 'm-espresso-troubleshooting',
    title: 'Module 10: Espresso Troubleshooting',
    description: 'Learn how to diagnose and fix common espresso problems.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-troubleshooting-video',
        moduleId: 'm-espresso-troubleshooting',
        title: 'Espresso Troubleshooting',
        type: 'CONTENT',
        videoUrl: 'https://www.youtube.com/watch?v=441CyJjIM9o',
        content: 'Watch this Prima Coffee video on troubleshooting espresso before taking the quiz.'
      },
      {
        id: 'l-troubleshooting-quiz',
        moduleId: 'm-espresso-troubleshooting',
        title: 'Espresso Troubleshooting Quiz',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'tq1', type: 'MULTIPLE_CHOICE', question: 'What is the ideal shot time range for espresso?', options: ['15 to 20 seconds', '25 to 35 seconds, closest to 30', '45 to 60 seconds', '10 to 15 seconds'], correctAnswers: ['25 to 35 seconds, closest to 30'] },
          { id: 'tq2', type: 'MULTIPLE_CHOICE', question: 'If your shot took too long (35-40+ seconds), what is the underlying problem?', options: ['The water is too hot', 'Something is preventing the water from going through at the rate it should', 'The coffee is too fresh', 'The portafilter is too cold'], correctAnswers: ['Something is preventing the water from going through at the rate it should'] },
          { id: 'tq3', type: 'MULTIPLE_CHOICE', question: 'Which of the following will make water flow through the puck FASTER?', options: ['Grind finer', 'Dose more coffee', 'Tamp harder', 'Coarsen your grind'], correctAnswers: ['Coarsen your grind'] },
          { id: 'tq4', type: 'MULTIPLE_CHOICE', question: 'If your shot is running too fast, which adjustment would help slow it down?', options: ['Tamp lighter', 'Dose less coffee', 'Grind finer', 'Coarsen your grind'], correctAnswers: ['Grind finer'] },
          { id: 'tq5', type: 'MULTIPLE_CHOICE', question: 'What does a bitter-tasting shot indicate?', options: ['Under-extraction', 'Over-extraction', 'Channeling', 'Old coffee'], correctAnswers: ['Over-extraction'] },
          { id: 'tq6', type: 'MULTIPLE_CHOICE', question: 'Over-extraction is compared to what in the video?', options: ['Baking something for too short a time', 'Steeping a tea bag for 10 minutes instead of four', 'Using cold water to brew', 'Grinding coffee too coarse'], correctAnswers: ['Steeping a tea bag for 10 minutes instead of four'] },
          { id: 'tq7', type: 'MULTIPLE_CHOICE', question: 'What is the first recommended fix for a bitter (over-extracted) shot?', options: ['Grind coarser', 'Dose less coffee', 'Lower the water temperature', 'Tamp lighter'], correctAnswers: ['Lower the water temperature'] },
          { id: 'tq8', type: 'MULTIPLE_CHOICE', question: 'Why is adjusting water temperature recommended as a first fix for extraction issues?', options: ['It\'s the easiest to change', 'It doesn\'t have a direct effect on other variables like grind and dose', 'Temperature is the most important variable', 'It\'s the cheapest adjustment to make'], correctAnswers: ['It doesn\'t have a direct effect on other variables like grind and dose'] },
          { id: 'tq9', type: 'MULTIPLE_CHOICE', question: 'What does a sour-tasting shot indicate?', options: ['Over-extraction', 'Under-extraction', 'Too much crema', 'Stale coffee'], correctAnswers: ['Under-extraction'] },
          { id: 'tq10', type: 'MULTIPLE_CHOICE', question: 'What is the recommended fix for a sour (under-extracted) shot?', options: ['Lower the water temperature', 'Increase the water temperature', 'Use older coffee', 'Tamp lighter'], correctAnswers: ['Increase the water temperature'] },
          { id: 'tq11', type: 'MULTIPLE_CHOICE', question: 'What is channeling?', options: ['When water flows evenly through the entire puck', 'When water finds weak points in the puck and blasts through unevenly', 'When the shot takes too long', 'When there is too much crema'], correctAnswers: ['When water finds weak points in the puck and blasts through unevenly'] },
          { id: 'tq12', type: 'MULTIPLE_CHOICE', question: 'How can you identify channeling in a wet puck?', options: ['The puck will be completely dry', 'You\'ll see little holes in the puck afterwards', 'The puck will be perfectly smooth', 'The puck will have no coffee left'], correctAnswers: ['You\'ll see little holes in the puck afterwards'] },
          { id: 'tq13', type: 'MULTIPLE_CHOICE', question: 'What does channeling cause in terms of extraction?', options: ['Even extraction throughout', 'Over-extracts where the channel comes through and under-extracts everywhere else', 'Under-extraction everywhere', 'Over-extraction everywhere'], correctAnswers: ['Over-extracts where the channel comes through and under-extracts everywhere else'] },
          { id: 'tq14', type: 'MULTIPLE_CHOICE', question: 'Which of the following helps prevent channeling?', options: ['Tamping unevenly', 'Letting coffee blast against one wall of the portafilter', 'Distributing coffee evenly and tamping evenly', 'Using stale coffee'], correctAnswers: ['Distributing coffee evenly and tamping evenly'] },
          { id: 'tq15', type: 'MULTIPLE_CHOICE', question: 'What happens if you have a tilted tamp/puck?', options: ['The shot will be perfectly balanced', 'Water will channel toward the lower part of the puck', 'The shot will take longer', 'More crema will form'], correctAnswers: ['Water will channel toward the lower part of the puck'] },
          { id: 'tq16', type: 'MULTIPLE_CHOICE', question: 'If your shot tastes watery and thin, what could you adjust?', options: ['Use older coffee', 'Adjust your brewing ratio (dose or yield) and use fresh coffee', 'Increase water temperature dramatically', 'Tamp lighter'], correctAnswers: ['Adjust your brewing ratio (dose or yield) and use fresh coffee'] },
          { id: 'tq17', type: 'MULTIPLE_CHOICE', question: 'What two factors can cause a watery shot according to the video?', options: ['Too much pressure and too fine a grind', 'Brewing ratio issues and stale/pre-ground coffee', 'Water that is too hot and tamping too hard', 'Using too much coffee and grinding too fine'], correctAnswers: ['Brewing ratio issues and stale/pre-ground coffee'] },
          { id: 'tq18', type: 'MULTIPLE_CHOICE', question: 'If your shot has little to no crema, what is one possible cause?', options: ['The coffee is too fresh', 'The shot is extracting too fast or the coffee is old', 'The water temperature is too high', 'You tamped too evenly'], correctAnswers: ['The shot is extracting too fast or the coffee is old'] },
          { id: 'tq19', type: 'MULTIPLE_CHOICE', question: 'What is the correct pump pressure for extracting espresso?', options: ['Around 5 bars', 'Around 9 bars', 'Around 15 bars', 'Around 2 bars'], correctAnswers: ['Around 9 bars'] },
          { id: 'tq20', type: 'MULTIPLE_CHOICE', question: 'If your shot is ALL crema (thick blonde mass), what does this indicate and how do you fix it?', options: ['The coffee is stale; buy new coffee', 'The coffee is too gassy/fresh; let it rest for 1-3 days', 'The grind is too coarse; grind finer', 'The water is too cold; increase temperature'], correctAnswers: ['The coffee is too gassy/fresh; let it rest for 1-3 days'] }
        ]
      }
    ]
  },
  {
    id: 'm-milk-steaming',
    title: 'Module 11: Milk Steaming Fundamentals',
    description: 'Learn proper milk steaming technique for silky microfoam.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-milk-steaming-video',
        moduleId: 'm-milk-steaming',
        title: 'How to Steam Milk',
        type: 'CONTENT',
        videoUrl: 'https://www.youtube.com/watch?v=wJnMXLG_qR4',
        content: 'Watch this Lance Hedrick video on milk steaming before taking the quiz.'
      },
      {
        id: 'l-milk-steaming-quiz',
        moduleId: 'm-milk-steaming',
        title: 'Milk Steaming Fundamentals Quiz',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'mq1', type: 'MULTIPLE_CHOICE', question: 'What are the two important things you need to understand when steaming milk?', options: ['Temperature and pressure', 'Pitcher position and movement up and down the wand', 'Milk type and pitcher size', 'Steam pressure and timing'], correctAnswers: ['Pitcher position and movement up and down the wand'] },
          { id: 'mq2', type: 'MULTIPLE_CHOICE', question: 'What should you do first when positioning the steam wand?', options: ['Put it in the center of the pitcher', 'Line the steam wand along the back of the pitcher', 'Submerge it as deep as possible', 'Point it toward the spout'], correctAnswers: ['Line the steam wand along the back of the pitcher'] },
          { id: 'mq3', type: 'MULTIPLE_CHOICE', question: 'What should always stay connected during the steaming process?', options: ['The pitcher and the drip tray', 'The steam wand and the spout of the pitcher', 'Your hand and the steam knob', 'The pitcher and the group head'], correctAnswers: ['The steam wand and the spout of the pitcher'] },
          { id: 'mq4', type: 'MULTIPLE_CHOICE', question: 'After lining the wand against the back, where do you tilt the pitcher to (front to back)?', options: ['All the way to the front', 'Halfway from front to back', 'One quarter from the back', 'Three quarters to the front'], correctAnswers: ['Halfway from front to back'] },
          { id: 'mq5', type: 'MULTIPLE_CHOICE', question: 'After the halfway tilt, where do you position the wand from side to side?', options: ['Dead center', 'All the way to one side', 'A quarter to either side', 'Three quarters to one side'], correctAnswers: ['A quarter to either side'] },
          { id: 'mq6', type: 'MULTIPLE_CHOICE', question: 'What is the correct pitcher position formula to remember?', options: ['Center and center', 'Halfway and a quarter', 'Quarter and halfway', 'Full tilt and centered'], correctAnswers: ['Halfway and a quarter'] },
          { id: 'mq7', type: 'MULTIPLE_CHOICE', question: 'How deep should the steam tip be submerged to start?', options: ['Completely submerged to the bottom', 'Just barely submerged', 'Halfway up the pitcher', 'Above the surface of the milk'], correctAnswers: ['Just barely submerged'] },
          { id: 'mq8', type: 'MULTIPLE_CHOICE', question: 'What do you do after achieving the correct starting depth?', options: ['Immediately plunge deeper', 'Start the steam and slowly pull down until you hear a ripping paper noise', 'Keep the position static the entire time', 'Move the pitcher in circles'], correctAnswers: ['Start the steam and slowly pull down until you hear a ripping paper noise'] },
          { id: 'mq9', type: 'MULTIPLE_CHOICE', question: 'What sound indicates you are injecting air into the milk?', options: ['A loud hissing sound', 'A ripping paper noise', 'Complete silence', 'A bubbling sound'], correctAnswers: ['A ripping paper noise'] },
          { id: 'mq10', type: 'MULTIPLE_CHOICE', question: 'What does "stretching" mean in milk steaming?', options: ['Making the pitcher taller', 'Injecting air into the milk', 'Heating the milk faster', 'Pulling the wand out of the milk'], correctAnswers: ['Injecting air into the milk'] },
          { id: 'mq11', type: 'MULTIPLE_CHOICE', question: 'When should you stop stretching (injecting air) and resubmerge the tip?', options: ['After exactly 5 seconds', 'When the pitcher temperature matches your hand temperature (90-100°F)', 'When the milk starts boiling', 'When you see large bubbles'], correctAnswers: ['When the pitcher temperature matches your hand temperature (90-100°F)'] },
          { id: 'mq12', type: 'MULTIPLE_CHOICE', question: 'Why might you not need to move the pitcher back up as far after stretching?', options: ['The milk gets lighter', 'The foam volume has increased, so the tip gets covered naturally', 'The steam pressure decreases', 'The pitcher shrinks from heat'], correctAnswers: ['The foam volume has increased, so the tip gets covered naturally'] },
          { id: 'mq13', type: 'MULTIPLE_CHOICE', question: 'What does the "whirling" motion accomplish?', options: ['It cools down the milk', 'It incorporates the air you\'ve injected to create silky texture', 'It removes foam from the milk', 'It heats the milk faster'], correctAnswers: ['It incorporates the air you\'ve injected to create silky texture'] },
          { id: 'mq14', type: 'MULTIPLE_CHOICE', question: 'What does the "halfway and a quarter" position create in the milk?', options: ['Large bubbles', 'A rapid whirl', 'No movement', 'Separation of foam and milk'], correctAnswers: ['A rapid whirl'] },
          { id: 'mq15', type: 'MULTIPLE_CHOICE', question: 'Why does milk heat up slower than water?', options: ['Milk is colder to start', 'Milk has more fats in it', 'Milk has less volume', 'The steam wand works differently with milk'], correctAnswers: ['Milk has more fats in it'] },
          { id: 'mq16', type: 'MULTIPLE_CHOICE', question: 'What is your cue to end the steaming process?', options: ['When you see foam on top', 'When the pitcher becomes too hot to touch', 'After exactly 30 seconds', 'When the milk turns brown'], correctAnswers: ['When the pitcher becomes too hot to touch'] },
          { id: 'mq17', type: 'MULTIPLE_CHOICE', question: 'If you have a machine with limited wand movement (like a Gaggia Classic Pro), what does the video recommend?', options: ['Buy a new machine', 'Take the drip tray out for more room to tilt the pitcher', 'Use a smaller pitcher', 'Steam at a lower pressure'], correctAnswers: ['Take the drip tray out for more room to tilt the pitcher'] },
          { id: 'mq18', type: 'MULTIPLE_CHOICE', question: 'For a longer steam tip, how much should you submerge?', options: ['The entire tip', 'About a third of it', 'None of it', 'The full length plus more'], correctAnswers: ['About a third of it'] },
          { id: 'mq19', type: 'MULTIPLE_CHOICE', question: 'What happens when the steam tip is above the surface vs. just below?', options: ['Above: no air injection / Below: air injection', 'Above: air injection (stretching) / Below: no air injection (whirling)', 'Both produce the same result', 'Above: faster heating / Below: slower heating'], correctAnswers: ['Above: air injection (stretching) / Below: no air injection (whirling)'] },
          { id: 'mq20', type: 'MULTIPLE_CHOICE', question: 'What is the end goal of proper milk steaming technique?', options: ['Very hot milk with large bubbles', 'Silky, smooth microfoam milk', 'Milk that separates into layers', 'Cold frothy milk'], correctAnswers: ['Silky, smooth microfoam milk'] }
        ]
      }
    ]
  },
  {
    id: 'm-drink-making-basics',
    title: 'Module 12: Drink Making Basics - Day 1 Hot Drinks',
    description: 'Learn espresso extraction, drink making process, milk steaming, dialing in, and cleaning procedures.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-drink-basics-overview',
        moduleId: 'm-drink-making-basics',
        title: 'Module Overview',
        type: 'CONTENT',
        content: `This module teaches you to make espresso-based hot drinks at Boundaries Coffee. You'll learn espresso extraction, milk steaming, dialing in, and cleaning procedures.

HOW TO COMPLETE THIS MODULE:

1. Read this overview with your trainer
2. Click "Required Practice Drinks" below to access the 21-item practice checklist
3. Submit photos of each drink you make (18 photos required)
4. Pass the Knowledge Quiz with 80% or higher

Your trainer will work with you through each drink. You'll take photos of your work to track your progress and improvement over time.

Once you're ready, complete the lesson below and move on to the practice checklist.`
      },
      {
        id: 'l-drink-basics-practice',
        moduleId: 'm-drink-making-basics',
        title: 'Required Practice Drinks',
        type: 'PRACTICE',
        content: `Work through this checklist with your trainer. Make each drink, take a photo, and check it off when complete.

WHAT YOU NEED TO DO:
- Complete all 21 items with your trainer
- Take photos of the 18 drinks that require them (camera icon shown)
- Check off each item as you finish
- Submit when all items are complete

Your photos will be saved in your Progress Gallery so you can see your improvement over time. Let's get started!`,
        checklistItems: [
          // Espresso Shots (5)
          { id: 'esp-1', title: 'Espresso Shot #1 (Dialed In)', description: 'Pull a properly dialed-in shot. Target: 19g dose, 24s brew time.', requiresPhoto: true },
          { id: 'esp-2', title: 'Espresso Shot #2 (Dialed In)', description: 'Pull another dialed-in shot. Demonstrate consistency.', requiresPhoto: true },
          { id: 'esp-3', title: 'Espresso Shot #3 (Dialed In)', description: 'Pull a third shot with minimal guidance.', requiresPhoto: true },
          { id: 'esp-under', title: 'Espresso Shot (Under-extracted)', description: 'Pull an under-extracted shot. Identify the sour, acidic taste.', requiresPhoto: true },
          { id: 'esp-over', title: 'Espresso Shot (Over-extracted)', description: 'Pull an over-extracted shot. Identify the bitter, harsh taste.', requiresPhoto: true },
          // Lattes (5)
          { id: 'latte-12-1', title: 'Latte 12oz #1', description: 'Make a 12oz latte from start to finish.', requiresPhoto: true },
          { id: 'latte-12-2', title: 'Latte 12oz #2', description: 'Focus on workflow efficiency and timing.', requiresPhoto: true },
          { id: 'latte-12-3', title: 'Latte 12oz #3', description: 'Make independently with minimal guidance.', requiresPhoto: true },
          { id: 'latte-16-1', title: 'Latte 16oz #1', description: 'Note the different milk quantity for larger size.', requiresPhoto: true },
          { id: 'latte-16-2', title: 'Latte 16oz #2', description: 'Demonstrate consistent technique across sizes.', requiresPhoto: true },
          // Flavored Drinks (4)
          { id: 'vanilla-1', title: 'Vanilla Latte #1', description: 'Add vanilla sauce and ensure proper stirring.', requiresPhoto: true },
          { id: 'vanilla-2', title: 'Vanilla Latte #2', description: 'Focus on consistent sauce portions.', requiresPhoto: true },
          { id: 'mocha-1', title: 'Mocha #1', description: 'Integrate chocolate sauce properly with espresso.', requiresPhoto: true },
          { id: 'mocha-2', title: 'Mocha #2', description: 'Demonstrate consistent chocolate portioning.', requiresPhoto: true },
          // Other Drinks (4)
          { id: 'capp-1', title: 'Cappuccino #1', description: 'Steam milk with more foam than a latte.', requiresPhoto: true },
          { id: 'capp-2', title: 'Cappuccino #2', description: 'Demonstrate consistent foam texture.', requiresPhoto: true },
          { id: 'amer-1', title: 'Americano #1', description: 'Hot water first, then espresso shots.', requiresPhoto: true },
          { id: 'amer-2', title: 'Americano #2', description: 'Demonstrate consistent water-to-espresso ratio.', requiresPhoto: true },
          // Dial-In & Cleaning (3) - no photos required
          { id: 'dialin', title: 'Dial-In Exercise', description: 'Adjust grinder using 2-5-10 rule to hit target.' },
          { id: 'backflush-water', title: 'Backflush (Water Only)', description: 'Afternoon cleaning procedure.' },
          { id: 'backflush-cleaner', title: 'Backflush (With Cleaner)', description: 'Closing procedure with Cafiza.' }
        ]
      },
      {
        id: 'l-drink-basics-quiz',
        moduleId: 'm-drink-making-basics',
        title: 'Drink Making Basics Quiz',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'db1', type: 'MULTIPLE_CHOICE', question: 'What is espresso?', options: ['A type of coffee bean', 'A brew method requiring ground coffee, water, heat, pressure, filter, and time', 'A dark roast coffee', 'Coffee with milk added'], correctAnswers: ['A brew method requiring ground coffee, water, heat, pressure, filter, and time'] },
          { id: 'db2', type: 'MULTIPLE_CHOICE', question: 'What are the 6 things required for espresso?', options: ['Beans, grinder, machine, cup, water, milk', 'Ground coffee, water, heat, pressure (9 bar), filter, time', 'Steam, pressure, heat, beans, filter, cup', 'Coffee, cream, sugar, water, heat, time'], correctAnswers: ['Ground coffee, water, heat, pressure (9 bar), filter, time'] },
          { id: 'db3', type: 'MULTIPLE_CHOICE', question: 'What is the standard espresso yield and shot time range?', options: ['1oz, 10-15 seconds', '2oz, 20-30 seconds', '3oz, 40-50 seconds', '4oz, 60-90 seconds'], correctAnswers: ['2oz, 20-30 seconds'] },
          { id: 'db4', type: 'MULTIPLE_CHOICE', question: 'What is the Monarch espresso recipe at Boundaries Coffee?', options: ['18g dose at 20s brew time', '19g dose at 24s brew time', '21g dose at 30s brew time', '17g dose at 22s brew time'], correctAnswers: ['19g dose at 24s brew time'] },
          { id: 'db5', type: 'MULTIPLE_CHOICE', question: 'What is the acceptable range for dose and brew time variation?', options: ['+/- 1g, +/- 5s', '+/- 0.2g, +/- 2s', '+/- 0.5g, +/- 3s', '+/- 2g, +/- 10s'], correctAnswers: ['+/- 0.2g, +/- 2s'] },
          { id: 'db6', type: 'MULTIPLE_CHOICE', question: 'What does an under-extracted shot taste like?', options: ['Bitter and harsh', 'Sour and acidic', 'Sweet and balanced', 'Burnt and smoky'], correctAnswers: ['Sour and acidic'] },
          { id: 'db7', type: 'MULTIPLE_CHOICE', question: 'What does an over-extracted shot taste like?', options: ['Sour and bright', 'Bitter and harsh', 'Fruity and light', 'Watery and thin'], correctAnswers: ['Bitter and harsh'] },
          { id: 'db8', type: 'MULTIPLE_CHOICE', question: 'What is the correct order for the drink making process?', options: ['Pull shot, steam milk, prepare cup, pour', 'Prepare cup, portion milk, pull shot, steam milk, add shots, stir, pour, serve', 'Steam milk, pull shot, add sauce, serve', 'Portion milk, prepare cup, steam, pull shot, serve'], correctAnswers: ['Prepare cup, portion milk, pull shot, steam milk, add shots, stir, pour, serve'] },
          { id: 'db9', type: 'MULTIPLE_CHOICE', question: 'What are the steps for pulling a shot? (In order)', options: ['Dose, tamp, insert, brew', 'Remove portafilter, rinse group, wipe dry, dose, settle, distribute, tamp, wipe, insert, brew', 'Grind, tamp, insert, wait, brew', 'Wipe, dose, distribute, insert, brew'], correctAnswers: ['Remove portafilter, rinse group, wipe dry, dose, settle, distribute, tamp, wipe, insert, brew'] },
          { id: 'db10', type: 'MULTIPLE_CHOICE', question: 'After inserting the portafilter, what should you do?', options: ['Wait 30 seconds then brew', 'Brew immediately and set cup underneath', 'Check the pressure gauge first', 'Wipe the group head again'], correctAnswers: ['Brew immediately and set cup underneath'] },
          { id: 'db11', type: 'MULTIPLE_CHOICE', question: 'What do you do after adding shots to the cup?', options: ['Immediately pour milk', 'Rinse shot catchers and set back on machine, then stir sauce/espresso', 'Let it cool for 30 seconds', 'Add more espresso'], correctAnswers: ['Rinse shot catchers and set back on machine, then stir sauce/espresso'] },
          { id: 'db12', type: 'MULTIPLE_CHOICE', question: 'What is the correct pitcher position for steaming milk?', options: ['Center and center', 'Halfway (front to back) and a quarter (side to side)', 'All the way to one side', 'At the very front of the pitcher'], correctAnswers: ['Halfway (front to back) and a quarter (side to side)'] },
          { id: 'db13', type: 'MULTIPLE_CHOICE', question: 'What does "stretching" mean in milk steaming?', options: ['Making the pitcher taller', 'Injecting air into the milk', 'Heating the milk faster', 'Pouring the milk slowly'], correctAnswers: ['Injecting air into the milk'] },
          { id: 'db14', type: 'MULTIPLE_CHOICE', question: 'When should you stop stretching and resubmerge the steam tip?', options: ['After 10 seconds', 'When the pitcher matches your hand temperature (90-100°F)', 'When you see large bubbles', 'When the milk starts boiling'], correctAnswers: ['When the pitcher matches your hand temperature (90-100°F)'] },
          { id: 'db15', type: 'MULTIPLE_CHOICE', question: 'What is the fundamental rule for grind adjustment?', options: ['Finer grind = shorter shot time', 'Finer grind = longer shot time; Coarser grind = shorter shot time', 'Grind doesn\'t affect shot time', 'Coarser grind = longer shot time'], correctAnswers: ['Finer grind = longer shot time; Coarser grind = shorter shot time'] },
          { id: 'db16', type: 'MULTIPLE_CHOICE', question: 'According to the 2-5-10 rule, what does 1 tic on the grind collar equal?', options: ['1 second change', '2 seconds change', '5 seconds change', '10 seconds change'], correctAnswers: ['2 seconds change'] },
          { id: 'db17', type: 'MULTIPLE_CHOICE', question: 'What defines consistent shots when dialing in?', options: ['Shots within 5 seconds of each other', 'Shots within 2 seconds of each other', 'Shots that look the same', 'Shots that taste identical'], correctAnswers: ['Shots within 2 seconds of each other'] },
          { id: 'db18', type: 'MULTIPLE_CHOICE', question: 'When do you backflush with just water (no cleaner)?', options: ['At closing only', 'In the afternoon', 'Every hour', 'Only on Mondays'], correctAnswers: ['In the afternoon'] },
          { id: 'db19', type: 'MULTIPLE_CHOICE', question: 'When do you backflush with cleaning powder?', options: ['In the morning', 'At closing', 'Every other day', 'Weekly only'], correctAnswers: ['At closing'] },
          { id: 'db20', type: 'MULTIPLE_CHOICE', question: 'What items go in the weekly Puro soak?', options: ['Steam wand tips and milk pitchers', 'Portafilter baskets, shot catchers, screens/screws, and portafilters', 'Only the portafilters', 'Cups and saucers'], correctAnswers: ['Portafilter baskets, shot catchers, screens/screws, and portafilters'] }
        ]
      }
    ]
  },
  {
    id: 'm-menu-knowledge',
    title: 'Module 13: Menu Knowledge',
    description: 'Master the complete Boundaries Coffee menu including all drink categories, flavor combinations, and customization options.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-menu-reference',
        moduleId: 'm-menu-knowledge',
        title: 'Complete Menu Reference',
        type: 'CONTENT',
        content: `BOUNDARIES COFFEE COMPLETE MENU

═══════════════════════════════════════
ORIGINALS (Signature Lattes)
═══════════════════════════════════════
Available Hot, Iced, or Frozen

• Texas Delight - Honey, Vanilla, Cinnamon (Our flagship drink)
• Hill Country - Butter Pecan & Caramel (Rich, nutty)
• Cinnamon Dulce - TX Delight Caramel & Brown Sugar (Sweet, warm spice)
• Lavender Sunrise - Lavender & Honey (Floral, light)
• Harvest Moon - White Chocolate, Maple, Cinnamon (Fall favorite)
• Golden Cream - Caramel & Vanilla (Classic combo)
• Salted Sweetheart - Salted Caramel & White Chocolate (Sweet & salty)

═══════════════════════════════════════
CUSTOMIZATION OPTIONS
═══════════════════════════════════════
• Add Drizzle: +$0.25
• Sweetness: ½ or Extra (no charge)
• Extra Shot: +$1.00
• Sweet Cream: +$0.75
• Health Adds: Fairlife Protein Milk, Collagen
• Alt Milks: Almond, Oat, Coconut, Fairlife (+2%)

═══════════════════════════════════════
MATCHAS
═══════════════════════════════════════
• Blue Coconut - Coconut (Matcha base) (Tropical, vibrant blue)
• Strawberry Dream - Strawberry & Vanilla (Fruity, creamy)
• White Pom. Matcha - White Chocolate & Pomegranate (Tart & sweet)

═══════════════════════════════════════
NITROS
═══════════════════════════════════════
Cold brew infused with nitrogen for creamy, smooth texture

• Vanilla Cream - Cold Brew + Vanilla Sweet Cream (Classic nitro)
• Salted Caramel - Salted Caramel (Sweet & salty)
• Cookie Butter - White Chocolate & Biscoff (Dessert-like)

═══════════════════════════════════════
ENERGY | BUBBLY | FREEZE
═══════════════════════════════════════
Available as Energy (caffeinated), Bubbly (sparkling), or Frozen

• The Drift - Strawberry & Pineapple (Tropical)
• Electric B - Blue Raspberry & Lime (Tart, vibrant)
• Mystic Cherry - Cherry & Coconut (Sweet, tropical)
• Golden Wave - Orange & Lime (Citrus forward)
• Blue Haze - Lavender, Blue Razz, Pomegranate (Floral & fruity)
• Shockwave - Passionfruit, Strawberry, Kiwi (Tropical blend)
• Strawberry Storm - Strawberry & Lavender (Floral berry)
• Voltage - Blackberry & Lemon Concentrate (Bold, tart)

═══════════════════════════════════════
LEMONADES
═══════════════════════════════════════
Available Iced or Frozen

• Boundaries Lagoon - Blue Raspberry, Coconut, Lime (Signature lemonade)
• Cherry Limeade - Cherry, Lime, Lemon (Classic combo)
• Pink Paradise - Strawberry & Vanilla (Creamy, fruity)
• Sunset - Pineapple, Mango, Strawberry (Tropical layers)

═══════════════════════════════════════
KIDS DRINKS (Caffeine-Free)
═══════════════════════════════════════
• Unicorn Latte - Cotton Candy Tea Latte (Iced 12oz)
• Dino Juice - Blue Raspberry Pineapple Lemonade (Iced 12oz)
• Zebra Milk - Chocolate & Vanilla Milk (Iced 12oz)
• Kiddos Coffee - Any Flavor, No Caffeine, Kids Temp (Hot 8oz)

═══════════════════════════════════════
TEAS
═══════════════════════════════════════
• Pomberry Punch - Pomegranate & Fresh Blueberry (Fruit tea)
• Lavender Breeze - Rooibos, Coconut, Lavender (Caffeine-free)
• Citrus Oolong - Taiwanese Oolong & Orange (Oolong)
• Honey Bee - Black Tea, Honey, Peach & Ginger (Black tea)
• Raspberry Hibiscus - Floral, Light, Refreshing (Hibiscus)

═══════════════════════════════════════
SMOOTHIES
═══════════════════════════════════════
• Strawberry Splash - 100% Strawberry Puree
• Piña Colada - Coconut & Pineapple
• Perfect Peach - 100% Peach Puree
• Mellow Mango - 100% Mango Puree

═══════════════════════════════════════
FOOD ITEMS
═══════════════════════════════════════
• Breakfast Taco - Bacon OR Beef Chorizo
• Blueberry Muffin
• Croissant - Almond OR Chocolate
• Kolache - Sausage, Cheese & Jalapeño

═══════════════════════════════════════
AVAILABLE FLAVORS
═══════════════════════════════════════
TX Delight, Vanilla (SF), Dark Choc (SF), Caramel (SF), White Choc, Hazelnut, Salted Caramel, Lavender, Honey, Maple, Coconut, Cardamom, Mango, Peach, Banana, Blue Razz, Pomegranate, Kiwi, Raspberry, Strawberry, Blueberry, Cherry, Lime, Orange, Pineapple, Seasonal

Sugar-Free Options: Vanilla, Dark Chocolate, Caramel`
      },
      {
        id: 'l-menu-quiz',
        moduleId: 'm-menu-knowledge',
        title: 'Menu Knowledge Quiz',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'mk1', type: 'MULTIPLE_CHOICE', question: 'What are the three flavors in the Texas Delight?', options: ['Caramel, Vanilla, Cinnamon', 'Honey, Vanilla, Cinnamon', 'Honey, Maple, Vanilla', 'Brown Sugar, Cinnamon, Vanilla'], correctAnswers: ['Honey, Vanilla, Cinnamon'] },
          { id: 'mk2', type: 'MULTIPLE_CHOICE', question: 'What flavors are in the Hill Country latte?', options: ['Honey & Caramel', 'Butter Pecan & Caramel', 'Maple & Brown Sugar', 'Hazelnut & Vanilla'], correctAnswers: ['Butter Pecan & Caramel'] },
          { id: 'mk3', type: 'MULTIPLE_CHOICE', question: 'The Harvest Moon contains which combination?', options: ['Pumpkin, Cinnamon, Nutmeg', 'White Chocolate, Maple, Cinnamon', 'Caramel, Apple, Cinnamon', 'Brown Sugar, Maple, Vanilla'], correctAnswers: ['White Chocolate, Maple, Cinnamon'] },
          { id: 'mk4', type: 'MULTIPLE_CHOICE', question: 'What makes the Salted Sweetheart unique?', options: ['It has espresso and sea salt', 'Salted Caramel & White Chocolate combination', 'It\'s made with salted butter', 'Brown Sugar & Salt'], correctAnswers: ['Salted Caramel & White Chocolate combination'] },
          { id: 'mk5', type: 'MULTIPLE_CHOICE', question: 'The Lavender Sunrise pairs lavender with what other flavor?', options: ['Vanilla', 'Lemon', 'Honey', 'Rose'], correctAnswers: ['Honey'] },
          { id: 'mk6', type: 'MULTIPLE_CHOICE', question: 'What flavor is paired with matcha in the Blue Coconut?', options: ['Blueberry', 'Blue Raspberry', 'Coconut', 'Vanilla'], correctAnswers: ['Coconut'] },
          { id: 'mk7', type: 'MULTIPLE_CHOICE', question: 'The Cookie Butter Nitro contains which two flavors?', options: ['Chocolate Chip & Vanilla', 'White Chocolate & Biscoff', 'Caramel & Cookie', 'Brown Sugar & Cinnamon'], correctAnswers: ['White Chocolate & Biscoff'] },
          { id: 'mk8', type: 'MULTIPLE_CHOICE', question: 'What is the White Pom. Matcha flavor combination?', options: ['White Tea & Pomegranate', 'White Chocolate & Pomegranate', 'Vanilla & Pomegranate', 'Coconut & Pomegranate'], correctAnswers: ['White Chocolate & Pomegranate'] },
          { id: 'mk9', type: 'MULTIPLE_CHOICE', question: 'What are the flavors in The Drift?', options: ['Mango & Pineapple', 'Strawberry & Pineapple', 'Peach & Pineapple', 'Orange & Pineapple'], correctAnswers: ['Strawberry & Pineapple'] },
          { id: 'mk10', type: 'MULTIPLE_CHOICE', question: 'The Shockwave contains which three fruits?', options: ['Strawberry, Mango, Kiwi', 'Passionfruit, Strawberry, Kiwi', 'Pineapple, Strawberry, Lime', 'Blueberry, Strawberry, Pomegranate'], correctAnswers: ['Passionfruit, Strawberry, Kiwi'] },
          { id: 'mk11', type: 'MULTIPLE_CHOICE', question: 'What makes Blue Haze unique among the energy drinks?', options: ['It has three citrus flavors', 'It combines Lavender, Blue Razz, and Pomegranate', 'It\'s the only sugar-free option', 'It has coconut milk'], correctAnswers: ['It combines Lavender, Blue Razz, and Pomegranate'] },
          { id: 'mk12', type: 'MULTIPLE_CHOICE', question: 'Voltage is made with which flavor combination?', options: ['Grape & Lemon', 'Blackberry & Lemon Concentrate', 'Blueberry & Lime', 'Raspberry & Orange'], correctAnswers: ['Blackberry & Lemon Concentrate'] },
          { id: 'mk13', type: 'MULTIPLE_CHOICE', question: 'What three flavors are in the Boundaries Lagoon lemonade?', options: ['Strawberry, Lemon, Lime', 'Blue Raspberry, Coconut, Lime', 'Mango, Pineapple, Lemon', 'Peach, Raspberry, Lime'], correctAnswers: ['Blue Raspberry, Coconut, Lime'] },
          { id: 'mk14', type: 'MULTIPLE_CHOICE', question: 'The Sunset lemonade layers which three fruits?', options: ['Orange, Mango, Strawberry', 'Pineapple, Mango, Strawberry', 'Peach, Mango, Raspberry', 'Lemon, Lime, Strawberry'], correctAnswers: ['Pineapple, Mango, Strawberry'] },
          { id: 'mk15', type: 'MULTIPLE_CHOICE', question: 'What are the flavors in the Honey Bee tea?', options: ['Black Tea, Honey, Lemon & Mint', 'Black Tea, Honey, Peach & Ginger', 'Green Tea, Honey, Orange & Cinnamon', 'Rooibos, Honey, Apple & Cinnamon'], correctAnswers: ['Black Tea, Honey, Peach & Ginger'] },
          { id: 'mk16', type: 'MULTIPLE_CHOICE', question: 'What is the Dino Juice made of?', options: ['Green Apple Lemonade', 'Blue Raspberry Pineapple Lemonade', 'Grape Lemonade', 'Orange Mango Lemonade'], correctAnswers: ['Blue Raspberry Pineapple Lemonade'] },
          { id: 'mk17', type: 'MULTIPLE_CHOICE', question: 'What two flavors make up the Zebra Milk?', options: ['Strawberry & Vanilla', 'Chocolate & Vanilla', 'Caramel & Chocolate', 'Cookies & Cream'], correctAnswers: ['Chocolate & Vanilla'] },
          { id: 'mk18', type: 'MULTIPLE_CHOICE', question: 'Which three flavors are available in Sugar-Free?', options: ['Vanilla, Caramel, Hazelnut', 'Vanilla, Dark Chocolate, Caramel', 'Vanilla, White Chocolate, Mocha', 'Caramel, Mocha, Hazelnut'], correctAnswers: ['Vanilla, Dark Chocolate, Caramel'] },
          { id: 'mk19', type: 'MULTIPLE_CHOICE', question: 'What is the upcharge for Sweet Cream?', options: ['$0.25', '$0.50', '$0.75', '$1.00'], correctAnswers: ['$0.75'] },
          { id: 'mk20', type: 'MULTIPLE_CHOICE', question: 'What Alt Milks does Boundaries offer?', options: ['Soy, Almond, Oat', 'Almond, Oat, Coconut, Fairlife', 'Oat, Coconut, Cashew', 'Almond, Soy, Rice, Oat'], correctAnswers: ['Almond, Oat, Coconut, Fairlife'] }
        ]
      }
    ]
  },
  {
    id: 'm-hospitality-ritz',
    title: 'Module 14: Hospitality Training',
    description: 'Learn the Ritz Carlton service philosophy and Boundaries core values for exceptional guest experiences.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-hospitality-ritz-video',
        moduleId: 'm-hospitality-ritz',
        title: 'Ritz Carlton Service Philosophy',
        type: 'VIDEO',
        videoUrl: 'https://www.youtube.com/watch?v=MOm7Gr-1BUc',
        content: `Watch this video to understand world-class hospitality and how it applies to Boundaries Coffee.

**REFLECTION QUESTIONS:**

After watching the video, think about:

1. What surprised you about their approach?
2. How can you apply these principles at Boundaries Coffee?
3. What does "anticipating needs" look like in a coffee shop setting?
4. How do small gestures create big impacts?

**KEY TAKEAWAY:**

Hospitality isn't about the size of the building or the price point—it's about the heart behind the service. Whether it's a luxury hotel or a drive-thru coffee shop, the principles of genuine care, attention to detail, and going above and beyond remain the same.

**At Boundaries, we bring Ritz Carlton-level hospitality to every cup, every order, every day.**`
      },
      {
        id: 'l-hospitality-ritz-values',
        moduleId: 'm-hospitality-ritz',
        title: 'Boundaries Core Values',
        type: 'CONTENT',
        content: `**BOUNDARIES COFFEE CORE VALUES**

These three values define who we are and how we serve:

═══════════════════════════════════════

**1. PASSION**

We are passionate about:
• Exceptional coffee and quality ingredients
• Creating experiences, not just transactions
• Continuous improvement and learning
• Our community and the people we serve

**In Action:**
✓ Knowing the menu inside and out
✓ Taking pride in every drink you make
✓ Recommending drinks with genuine enthusiasm
✓ Caring about the little details that matter

═══════════════════════════════════════

**2. HOSPITALITY**

We believe hospitality is:
• Treating every guest like a friend
• Anticipating needs before they're expressed
• Genuine warmth and authentic connection
• Making people feel valued and welcomed

**In Action:**
✓ Smiling and making eye contact
✓ Remembering regulars' names and orders
✓ Going the extra mile to make things right
✓ Creating a welcoming environment for everyone

═══════════════════════════════════════

**3. SELFLESSNESS**

We serve others by:
• Putting the team and guests first
• Helping without being asked
• Staying humble and coachable
• Contributing to something bigger than ourselves

**In Action:**
✓ Jumping in to help a teammate during a rush
✓ Staying late to finish closing tasks
✓ Owning mistakes and fixing them quickly
✓ Celebrating others' successes

═══════════════════════════════════════

**REMEMBER:**

Values aren't just words on a wall—they're actions we take every single day. When you embody Passion, Hospitality, and Selflessness, you're not just serving coffee—you're building a culture and a community.`
      },
      {
        id: 'l-hospitality-ritz-experience',
        moduleId: 'm-hospitality-ritz',
        title: 'The Boundaries Experience',
        type: 'CONTENT',
        content: `**THE BOUNDARIES VALUE PROPOSITION**

We promise three things to every guest:

**1. SPEED**
We respect your time. From order to hand-off, we're fast—without cutting corners.

**2. QUALITY**
We use specialty-grade coffee, real ingredients, and never compromise on taste.

**3. CONSISTENCY**
Every visit should feel the same: fast, delicious, and welcoming.

═══════════════════════════════════════

**THE BOUNDARIES EXPERIENCE:**

When a guest leaves Boundaries, they should think:

> *"That was fast, it tasted amazing, and it's always like that."*

This is what sets us apart from every other coffee shop.

═══════════════════════════════════════

**THREE STEPS OF SERVICE**

Adapted from the Ritz Carlton philosophy, here's how we deliver world-class service:

**STEP 1: WARM, SINCERE GREETING**
Use the guest's name when possible. A genuine smile and friendly tone set the stage for the entire interaction.

**STEP 2: ANTICIPATE AND FULFILL NEEDS**
Listen actively, ask clarifying questions, and offer thoughtful recommendations. Make their experience effortless.

**STEP 3: FOND FAREWELL**
Thank them by name, wish them well, and leave them with a positive final impression. The last 10 seconds matter.

═══════════════════════════════════════

**EVERY INTERACTION COUNTS**

You might serve 100+ customers in a shift. For you, it's one of many interactions. For them, it might be the highlight of their morning—or the moment that turns a bad day around.

**Treat every guest like they're the only one that matters.**`
      },
      {
        id: 'l-hospitality-ritz-skills',
        moduleId: 'm-hospitality-ritz',
        title: 'Key Hospitality Skills',
        type: 'CONTENT',
        content: `**KEY HOSPITALITY SKILLS**

Master these four skills to deliver exceptional service every time:

═══════════════════════════════════════

**1. WARM WELCOME**

**What It Looks Like:**
✓ Greet guests within 3 seconds of eye contact
✓ Smile genuinely (it shows in your voice, even on the phone)
✓ Use their name when you know it
✓ Make them feel like you're happy they're here

**Avoid:**
✗ Looking at your phone or away when a guest approaches
✗ Monotone, scripted greetings
✗ Ignoring guests while finishing another task

═══════════════════════════════════════

**2. ATTENTIVE LISTENING**

**What It Looks Like:**
✓ Maintain eye contact while they order
✓ Nod and acknowledge as they speak
✓ Repeat the order back for confirmation
✓ Ask clarifying questions if needed

**Avoid:**
✗ Interrupting or finishing their sentences
✗ Rushing them through their order
✗ Typing while they're talking without acknowledgment

═══════════════════════════════════════

**3. PERSONALIZATION**

**What It Looks Like:**
✓ Remember regulars' names and favorite orders
✓ Make recommendations based on their preferences
✓ Adjust your approach (fast for rushed guests, thorough for first-timers)
✓ Add thoughtful touches (extra napkins for kids, a kind note on the cup)

**Avoid:**
✗ Treating every guest the same without reading the room
✗ Generic, robotic interactions
✗ Forgetting details about regulars

═══════════════════════════════════════

**4. POSITIVE, SOLUTION-FOCUSED COMMUNICATION**

**What It Looks Like:**
✓ Say "I can" instead of "I can't"
✓ Offer alternatives when something isn't available
✓ Stay calm and professional, even under pressure
✓ Turn problems into opportunities to exceed expectations

**Avoid:**
✗ Saying "We're out of that" without offering an alternative
✗ Using negative language or making excuses
✗ Blaming others for mistakes

═══════════════════════════════════════

**PRACTICE DAILY:**

Hospitality is a skill, not a talent. The more you practice these behaviors, the more natural they become. Challenge yourself to improve 1% every shift—over time, those small improvements create exceptional service.`
      },
      {
        id: 'l-hospitality-ritz-quiz',
        moduleId: 'm-hospitality-ritz',
        title: 'Hospitality Training Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'hr1', type: 'MULTIPLE_CHOICE', question: 'What are the three Boundaries Coffee core values?', options: ['Quality, Service, Speed', 'Passion, Hospitality, Selflessness', 'Excellence, Integrity, Community', 'Speed, Quality, Consistency'], correctAnswers: ['Passion, Hospitality, Selflessness'] },
          { id: 'hr2', type: 'MULTIPLE_CHOICE', question: 'What is the Boundaries value proposition?', options: ['Best coffee in town', 'Speed, Quality, Consistency', 'Lowest prices, fastest service', 'Premium drinks, premium experience'], correctAnswers: ['Speed, Quality, Consistency'] },
          { id: 'hr3', type: 'MULTIPLE_CHOICE', question: 'What should guests think after leaving Boundaries?', options: ['"That was expensive but worth it"', '"That was fast, it tasted amazing, and it\'s always like that"', '"That was the best coffee I\'ve ever had"', '"That was a nice experience"'], correctAnswers: ['"That was fast, it tasted amazing, and it\'s always like that"'] },
          { id: 'hr4', type: 'MULTIPLE_CHOICE', question: 'What is Step 1 of the Three Steps of Service?', options: ['Anticipate needs', 'Warm, sincere greeting using name', 'Fond farewell', 'Take the order'], correctAnswers: ['Warm, sincere greeting using name'] },
          { id: 'hr5', type: 'MULTIPLE_CHOICE', question: 'What is Step 2 of the Three Steps of Service?', options: ['Take payment', 'Anticipate and fulfill needs', 'Make the drink', 'Confirm the order'], correctAnswers: ['Anticipate and fulfill needs'] },
          { id: 'hr6', type: 'MULTIPLE_CHOICE', question: 'What is Step 3 of the Three Steps of Service?', options: ['Hand off the drink', 'Fond farewell using name', 'Ask for feedback', 'Clean the counter'], correctAnswers: ['Fond farewell using name'] },
          { id: 'hr7', type: 'TRUE_FALSE', question: 'Hospitality principles from the Ritz Carlton can be applied in a drive-thru coffee shop setting.', correctAnswers: ['True'] },
          { id: 'hr8', type: 'MULTIPLE_CHOICE', question: 'Which core value is demonstrated by helping a teammate during a rush without being asked?', options: ['Passion', 'Hospitality', 'Selflessness', 'Consistency'], correctAnswers: ['Selflessness'] },
          { id: 'hr9', type: 'MULTIPLE_CHOICE', question: 'Which core value is demonstrated by remembering a regular customer\'s name and favorite order?', options: ['Passion', 'Hospitality', 'Selflessness', 'Speed'], correctAnswers: ['Hospitality'] },
          { id: 'hr10', type: 'MULTIPLE_CHOICE', question: 'Which core value is demonstrated by knowing the menu inside and out and recommending drinks enthusiastically?', options: ['Passion', 'Hospitality', 'Selflessness', 'Quality'], correctAnswers: ['Passion'] },
          { id: 'hr11', type: 'MULTIPLE_CHOICE', question: 'How quickly should you greet a guest after making eye contact?', options: ['Within 1 second', 'Within 3 seconds', 'Within 5 seconds', 'Within 10 seconds'], correctAnswers: ['Within 3 seconds'] },
          { id: 'hr12', type: 'TRUE_FALSE', question: 'Smiling shows in your voice, even when guests can\'t see you.', correctAnswers: ['True'] },
          { id: 'hr13', type: 'MULTIPLE_CHOICE', question: 'What is attentive listening?', options: ['Listening while multitasking', 'Maintaining eye contact, nodding, and repeating orders back', 'Hearing the order and typing it in', 'Listening to the guest while helping another customer'], correctAnswers: ['Maintaining eye contact, nodding, and repeating orders back'] },
          { id: 'hr14', type: 'TRUE_FALSE', question: 'You should treat every guest exactly the same to ensure consistency.', correctAnswers: ['False'] },
          { id: 'hr15', type: 'MULTIPLE_CHOICE', question: 'What should you do when an item is out of stock?', options: ['Tell them we\'re out and move on', 'Offer an alternative recommendation', 'Apologize repeatedly', 'Blame the inventory team'], correctAnswers: ['Offer an alternative recommendation'] },
          { id: 'hr16', type: 'MULTIPLE_CHOICE', question: 'What is an example of personalization in hospitality?', options: ['Using a script for every guest', 'Remembering regulars\' names and favorite orders', 'Making drinks as fast as possible', 'Offering discounts to everyone'], correctAnswers: ['Remembering regulars\' names and favorite orders'] },
          { id: 'hr17', type: 'TRUE_FALSE', question: 'The last 10 seconds of an interaction (the farewell) are just as important as the greeting.', correctAnswers: ['True'] },
          { id: 'hr18', type: 'MULTIPLE_CHOICE', question: 'What does "anticipate needs" mean?', options: ['Guess what guests want without asking', 'Read body language and context to offer proactive help', 'Always upsell add-ons', 'Prepare drinks before they order'], correctAnswers: ['Read body language and context to offer proactive help'] },
          { id: 'hr19', type: 'TRUE_FALSE', question: 'Hospitality is a skill that can be practiced and improved over time.', correctAnswers: ['True'] },
          { id: 'hr20', type: 'MULTIPLE_CHOICE', question: 'What should you say instead of "I can\'t" when facing a limitation?', options: ['"That\'s not possible"', '"I can" and offer an alternative solution', '"We don\'t do that"', '"Ask the manager"'], correctAnswers: ['"I can" and offer an alternative solution'] }
        ]
      }
    ]
  },
  {
    id: 'm-order-taking',
    title: 'Module 15: Order Taking',
    description: 'Master the 8-step greeting script, flow management, and efficient order-taking techniques.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-order-taking-intro',
        moduleId: 'm-order-taking',
        title: 'Order Taking Position Overview',
        type: 'CONTENT',
        content: `**THE ORDER TAKER'S ROLE**

The Order Taker is the first point of contact for many guests—you set the tone for both speed and hospitality.

**WHEN IS AN ORDER TAKER DEPLOYED?**

When 3 or more people are clocked in, the Order Taker stands outside by the menu board with:
• Boundaries satchel (with Toast Go 2 handheld POS inside)
• Professional, welcoming presence
• High energy and readiness to engage

**YOUR IMPACT:**

✓ Reduce window wait times dramatically
✓ Create personal connections before guests reach the window
✓ Increase accuracy by taking orders without distractions
✓ Set the tone for exceptional hospitality

**POSITION PRIORITIES:**

1. **SPEED** - Keep the line moving efficiently
2. **ACCURACY** - Get every order right the first time
3. **HOSPITALITY** - Make every guest feel welcomed and valued

The Order Taker role is about balancing efficiency with genuine connection—smile, be present, and keep things moving!`
      },
      {
        id: 'l-order-taking-script',
        moduleId: 'm-order-taking',
        title: '8-Step Greeting Script',
        type: 'CONTENT',
        content: `**THE 8-STEP GREETING SCRIPT**

Memorize this script—it's the foundation of excellent order-taking:

**STEP 1: Warm Greeting**
"Good [morning/afternoon/evening]! Welcome to Boundaries!"

**STEP 2: Acknowledge Wait (if applicable)**
"Thank you for your patience!"

**STEP 3: Ask for Name**
"Can I get a name for your order?"

**STEP 4: Take Order**
"What can I get started for you today?"

**STEP 5: Confirm & Upsell**
"Did you want to add [pastry/food item] to your order?"

**STEP 6: Repeat Order**
"So I have [repeat full order]. Does that sound correct?"

**STEP 7: Total & Payment Prompt**
"Your total is $X.XX. How would you like to pay today?"

**STEP 8: Thank You & Instructions**
"Thank you! Pull forward to the window, and we'll have that ready for you!"

═══════════════════════════════════════

**IMPORTANT NOTES:**

• Use the guest's name when possible ("Thanks, Sarah!")
• Maintain eye contact and smile genuinely
• Speak clearly and at a moderate pace
• Be flexible—adapt the script to the situation, but hit all 8 steps

**PRACTICE TIP:** Repeat this script 10 times out loud until it feels natural.`
      },
      {
        id: 'l-order-taking-flow',
        moduleId: 'm-order-taking',
        title: 'Flow Management & Time Goals',
        type: 'CONTENT',
        content: `**FLOW MANAGEMENT**

Keeping the line moving efficiently without sacrificing hospitality is an art. Here's how to master it:

**TIME GOALS:**

• **Total Visit Time:** <3.5 minutes (from arrival to departure)
• **Window Time:** ≤60 seconds (at the pickup window)
• **Order-Taking Time:** ~60-90 seconds per car

**EFFICIENCY TECHNIQUES:**

**1. MULTI-TASKING**
While greeting one car, glance at the next to gauge their readiness.

**2. PRE-QUALIFYING QUESTIONS**
"Are we doing hot, iced, or frozen today?" narrows down options quickly.

**3. QUICK CLARIFICATIONS**
"Did you want that with our house 2% milk or an alt milk?"

**4. READING THE SITUATION**
• Rushed customer? Skip the upsell, get them through fast.
• Relaxed regular? Engage, build rapport, suggest new items.

**5. COMMUNICATING WITH THE TEAM**
Use the Toast POS notes field to add special instructions: "Extra hot," "No ice," "Light sweet cream."

**WHEN THE LINE GETS LONG:**

• Stay calm and confident
• Acknowledge waiting guests: "We'll be with you shortly!"
• Focus on accuracy over speed—mistakes slow everyone down
• Call for backup if needed

═══════════════════════════════════════

**THE BALANCE:**

Fast service doesn't mean rushed service. Efficiency comes from:
✓ Knowing the menu inside and out
✓ Using the POS confidently
✓ Communicating clearly
✓ Staying organized and focused

**REMEMBER:** Every second saved adds up—but never at the cost of making a guest feel rushed or undervalued.`
      },
      {
        id: 'l-order-taking-practice',
        moduleId: 'm-order-taking',
        title: 'Hands-On Practice Scenarios',
        type: 'CONTENT',
        content: `**PRACTICE ORDER SCENARIOS**

Work with your trainer to practice these real-world orders. Focus on speed, accuracy, and using the full 8-step script.

**SCENARIO 1: Simple Single Order**
Guest: "I'll take a large iced Texas Delight with oat milk and half sweet."

*Practice: Enter the order, confirm, and suggest a pastry pairing.*

**SCENARIO 2: Hot Drink with Add-On**
Guest: "Medium hot Hill Country, and can you add an extra shot?"

*Practice: Navigate to the correct drink, add the size, add the $1 upcharge for the extra shot.*

**SCENARIO 3: Frozen Specialty**
Guest: "I want a large frozen Salted Sweetheart with sweet cream on top."

*Practice: Enter frozen modifier, size, and sweet cream (+$0.75).*

**SCENARIO 4: Multiple Drinks**
Guest: "I need an Electric B energy drink and a Unicorn Latte."

*Practice: Add both items to the same order, confirm each.*

**SCENARIO 5: Food + Drink**
Guest: "Cookie Butter Nitro and a bacon breakfast taco."

*Practice: Navigate between drink and food menus efficiently.*

**SCENARIO 6: Complex Modifications**
Guest: "Strawberry Dream Matcha, iced, almond milk, extra sweet."

*Practice: Apply all modifiers correctly in order.*

**SCENARIO 7: Tea + Food**
Guest: "Hot Honey Bee tea and a chocolate croissant."

*Practice: Find tea category, add food item, upsell gently.*

**SCENARIO 8: Large Multi-Item Order**
Guest: "Two large iced drinks—one Lavender Sunrise and one Harvest Moon."

*Practice: Manage multiple items, confirm each, ensure accuracy.*

═══════════════════════════════════════

**TRAINER NOTES:**

Work through each scenario until the trainee can:
✓ Navigate the POS confidently
✓ Apply modifiers correctly
✓ Complete orders in under 90 seconds
✓ Use the 8-step script naturally
✓ Maintain friendly, professional energy throughout`
      },
      {
        id: 'l-order-taking-quiz',
        moduleId: 'm-order-taking',
        title: 'Order Taking Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'ot1', type: 'MULTIPLE_CHOICE', question: 'When is an Order Taker deployed?', options: ['When 2 or more people are clocked in', 'When 3 or more people are clocked in', 'Only during rush hours', 'Whenever a manager decides'], correctAnswers: ['When 3 or more people are clocked in'] },
          { id: 'ot2', type: 'MULTIPLE_CHOICE', question: 'What is Step 3 of the 8-step greeting script?', options: ['Take order', 'Ask for name', 'Warm greeting', 'Confirm order'], correctAnswers: ['Ask for name'] },
          { id: 'ot3', type: 'MULTIPLE_CHOICE', question: 'What is Step 6 of the 8-step greeting script?', options: ['Thank you & instructions', 'Repeat order', 'Total & payment prompt', 'Confirm & upsell'], correctAnswers: ['Repeat order'] },
          { id: 'ot4', type: 'MULTIPLE_CHOICE', question: 'What is the target total visit time?', options: ['Less than 2 minutes', 'Less than 3 minutes', 'Less than 3.5 minutes', 'Less than 5 minutes'], correctAnswers: ['Less than 3.5 minutes'] },
          { id: 'ot5', type: 'MULTIPLE_CHOICE', question: 'What is the target window time?', options: ['30 seconds or less', '45 seconds or less', '60 seconds or less', '90 seconds or less'], correctAnswers: ['60 seconds or less'] },
          { id: 'ot6', type: 'MULTIPLE_CHOICE', question: 'Where is the Toast Go 2 handheld stored when taking orders outside?', options: ['In your pocket', 'In the Boundaries satchel', 'On the counter', 'In the register drawer'], correctAnswers: ['In the Boundaries satchel'] },
          { id: 'ot7', type: 'TRUE_FALSE', question: 'When the line is long, you should prioritize speed over accuracy to move customers through faster.', correctAnswers: ['False'] },
          { id: 'ot8', type: 'MULTIPLE_CHOICE', question: 'What should you do if a customer appears rushed?', options: ['Take extra time to explain menu options', 'Skip the upsell and get them through efficiently', 'Suggest multiple add-ons', 'Ask them to wait'], correctAnswers: ['Skip the upsell and get them through efficiently'] },
          { id: 'ot9', type: 'MULTIPLE_CHOICE', question: 'What is the Order Taker\'s primary role?', options: ['Make drinks quickly', 'Set the tone for speed and hospitality', 'Collect payment only', 'Clean the drive-thru area'], correctAnswers: ['Set the tone for speed and hospitality'] },
          { id: 'ot10', type: 'TRUE_FALSE', question: 'The Order Taker should maintain eye contact and smile genuinely with guests.', correctAnswers: ['True'] },
          { id: 'ot11', type: 'MULTIPLE_CHOICE', question: 'What are the three position priorities for Order Takers?', options: ['Speed, Accuracy, Hospitality', 'Speed, Sales, Service', 'Efficiency, Quality, Profit', 'Greeting, Selling, Closing'], correctAnswers: ['Speed, Accuracy, Hospitality'] },
          { id: 'ot12', type: 'MULTIPLE_CHOICE', question: 'What is Step 1 of the 8-step greeting script?', options: ['Ask for name', 'Take order', 'Warm greeting', 'Acknowledge wait'], correctAnswers: ['Warm greeting'] },
          { id: 'ot13', type: 'MULTIPLE_CHOICE', question: 'What should you say in Step 8 (Thank you & instructions)?', options: ['"Have a nice day!"', '"Thank you! Pull forward to the window."', '"Your order is ready."', '"Come back soon!"'], correctAnswers: ['"Thank you! Pull forward to the window."'] },
          { id: 'ot14', type: 'MULTIPLE_CHOICE', question: 'What is a good pre-qualifying question to speed up orders?', options: ['"What\'s your favorite drink?"', '"Are we doing hot, iced, or frozen today?"', '"Do you want coffee or tea?"', '"What size do you prefer?"'], correctAnswers: ['"Are we doing hot, iced, or frozen today?"'] },
          { id: 'ot15', type: 'TRUE_FALSE', question: 'You should use the guest\'s name when possible during the interaction.', correctAnswers: ['True'] },
          { id: 'ot16', type: 'MULTIPLE_CHOICE', question: 'How long should order-taking time be per car?', options: ['30-45 seconds', '60-90 seconds', '2-3 minutes', 'As long as it takes'], correctAnswers: ['60-90 seconds'] },
          { id: 'ot17', type: 'TRUE_FALSE', question: 'If a regular customer is relaxed, it\'s okay to engage more and suggest new menu items.', correctAnswers: ['True'] },
          { id: 'ot18', type: 'MULTIPLE_CHOICE', question: 'Where can you add special instructions like "extra hot" or "light ice"?', options: ['On a sticky note', 'In the Toast POS notes field', 'Verbally tell the barista', 'Write on the cup'], correctAnswers: ['In the Toast POS notes field'] },
          { id: 'ot19', type: 'MULTIPLE_CHOICE', question: 'What should you do when waiting guests are in line?', options: ['Ignore them and focus on current order', 'Acknowledge them: "We\'ll be with you shortly!"', 'Rush through the current order', 'Tell them to go somewhere else'], correctAnswers: ['Acknowledge them: "We\'ll be with you shortly!"'] },
          { id: 'ot20', type: 'MULTIPLE_CHOICE', question: 'What is Step 5 of the 8-step greeting script?', options: ['Repeat order', 'Take order', 'Confirm & upsell', 'Total & payment'], correctAnswers: ['Confirm & upsell'] }
        ]
      }
    ]
  },
  {
    id: 'm-toast-pos',
    title: 'Module 16: Toast POS Navigation',
    description: 'Learn to navigate the Toast POS system, process orders, handle payments, and manage common scenarios.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-toast-intro',
        moduleId: 'm-toast-pos',
        title: 'Toast POS System Overview',
        type: 'CONTENT',
        content: `**TOAST POS SYSTEM OVERVIEW**

Boundaries Coffee uses the **Toast Point of Sale (POS)** system to take orders, process payments, and manage customer transactions.

═══════════════════════════════════════

**TRAINING VIDEOS**

Before hands-on practice, complete these Toast Central training modules:

**1. Toast Classroom – Front of House**
🔗 [central.toasttab.com/s/toast-classroom](https://central.toasttab.com/s/toast-classroom)

**2. Front of House Skills 101**
🔗 [central.toasttab.com/s/front-of-house-skills-101](https://central.toasttab.com/s/front-of-house-skills-101)

**3. POS Practice Sandbox**
Navigate to: Toast Classroom → Getting Started with POS Functionality

*Note: Toast Central requires login. Ask your manager for access credentials.*

═══════════════════════════════════════

**HARDWARE OVERVIEW**

**Toast Go 2 Handheld Device:**
• Touchscreen interface for order entry
• Built-in card reader (swipe, chip, contactless tap)
• Portable and wireless
• Stored in the **Boundaries satchel** when taking orders outside

**Key Features:**
✓ Fast, intuitive menu navigation
✓ Integrated payment processing
✓ Real-time order transmission to kitchen
✓ Customer-facing display for order confirmation

═══════════════════════════════════════

**WHY TOAST MATTERS**

Mastering the Toast POS allows you to:
• Take orders quickly and accurately
• Process payments efficiently
• Minimize errors and remakes
• Provide a seamless customer experience
• Focus on hospitality instead of struggling with technology

**Next lessons will cover order entry, payment processing, and troubleshooting common scenarios.**`
      },
      {
        id: 'l-toast-order-flow',
        moduleId: 'm-toast-pos',
        title: 'Order Entry Flow',
        type: 'CONTENT',
        content: `**ORDER ENTRY FLOW**

Follow these 6 steps every time you take an order:

═══════════════════════════════════════

**STEP 1: TAB NAME**
Enter the guest's name to identify the order.

**STEP 2: ADD ITEM**
Select the drink or food category, then tap the specific item.

**STEP 3: SELECT SIZE**
Choose the size: Small, Medium, Large (varies by drink type).

**STEP 4: SELECT MODIFIERS**
Add customizations:
• Milk type
• Sweetness level
• Extras (shots, cream, drizzle)
• Temperature (Hot, Iced, Frozen)

**STEP 5: DONE**
Confirm the item to add it to the order.

**STEP 6: SEND TO KITCHEN**
Fire the order to transmit it to the bar for preparation.

═══════════════════════════════════════

**COMMON MODIFIERS**

**Milk Options:**
• Whole
• 2%
• Oat
• Almond
• Coconut
• Fairlife

**Sweetness Options:**
• Regular (standard)
• Half Sweet
• Extra Sweet

**Extras (with upcharges):**
• Extra Shot: **+$1.00**
• Sweet Cream: **+$0.75**
• Drizzle: **+$0.25**

**Temperature Options:**
• Hot
• Iced
• Frozen

═══════════════════════════════════════

**PRO TIPS:**

✓ **Navigate efficiently** - Know where each drink category is located
✓ **Confirm modifiers** - Repeat customizations back to the guest
✓ **Use the Done button** - Don't skip this step or the item won't save
✓ **Send orders promptly** - Don't wait too long or drinks will be delayed

**REMEMBER:** Accuracy is more important than speed. A correct order the first time is always faster than remaking a mistake.`
      },
      {
        id: 'l-toast-payment',
        moduleId: 'm-toast-pos',
        title: 'Payment Processing',
        type: 'CONTENT',
        content: `**PAYMENT PROCESSING**

Once the order is complete, process payment using one of these methods:

═══════════════════════════════════════

**CREDIT / DEBIT CARD**

1. Tap **Pay**
2. Select **Lane** (credit/debit)
3. Guest can:
   - **Tap** (contactless/NFC)
   - **Insert** (chip card)
   - **Swipe** (magnetic stripe)
4. Wait for approval confirmation

═══════════════════════════════════════

**CASH**

1. Tap **Pay**
2. Select **Cash**
3. Enter the **amount tendered** by the guest (e.g., if total is $8.50 and they give you $10, enter $10)
4. The system will calculate and display the change due
5. Give change to the guest

═══════════════════════════════════════

**GIFT CARD**

1. Tap **Pay**
2. Select **Gift Card**
3. **Scan** the gift card barcode or **manually enter** the card number
4. System will deduct from the card balance

═══════════════════════════════════════

**BOUNDARIES APP (DIGITAL GIFT CARD)**

⚠️ **IMPORTANT:** When a guest pays with the Boundaries App, select **Gift Card** as the payment method.

**Why?**
The Boundaries App generates a **digital gift card QR code** for payment. This is NOT the same as a credit card payment.

**Process:**
1. Tap **Pay**
2. Select **Gift Card**
3. Scan the QR code from the guest's phone
4. Payment complete

**DO NOT select "Credit Card" for Boundaries App payments.**

═══════════════════════════════════════

**MOBILE WALLET (Apple Pay / Google Pay)**

1. Tap **Pay**
2. Select **Lane**
3. Guest taps their phone or watch on the card reader
4. Wait for approval confirmation

═══════════════════════════════════════

**APPLYING REWARDS**

To apply rewards to an order:
1. Before payment, tap **Rewards** or **Phone Number**
2. Enter the guest's phone number
3. Available rewards will automatically apply to the order
4. Proceed with payment

═══════════════════════════════════════

**COMMON PAYMENT ISSUES**

**Card Declined:**
• Politely inform the guest
• Offer alternative payment method

**Gift Card Insufficient Balance:**
• System will show remaining balance
• Offer to split payment (use gift card first, then another payment method for the remainder)

**App Not Scanning:**
• Increase screen brightness
• Try manual gift card entry if QR won't scan`
      },
      {
        id: 'l-toast-editing',
        moduleId: 'm-toast-pos',
        title: 'Editing Orders & Troubleshooting',
        type: 'CONTENT',
        content: `**EDITING ORDERS**

Mistakes happen. Here's how to fix them:

═══════════════════════════════════════

**MODIFY AN ITEM**

If you need to change a modifier (milk, size, etc.):
1. **Tap the item** on the order screen
2. Make the needed changes
3. Tap **Done** to save changes

═══════════════════════════════════════

**REMOVE AN ITEM**

If you need to delete an item from the order:
1. **Swipe left** on the item
2. Tap **Delete** to confirm removal

═══════════════════════════════════════

**VOID vs. REFUND**

**VOID (Before Payment):**
Use this to remove an item or cancel an order **before** payment is processed.

• Tap the item
• Swipe left and delete
• No manager approval needed (usually)

**REFUND (After Payment):**
Use this if the guest has already paid and needs money back.

• Requires **manager approval** (depending on settings)
• Process through the Toast refund menu
• Document the reason for the refund

⚠️ **Important:** Void before payment whenever possible. Refunds create more paperwork and require manager sign-off.

═══════════════════════════════════════

**COMMON SCENARIOS**

**Guest Changes Their Mind Mid-Order:**
• Tap the item to modify or swipe left to delete
• Add the new item
• Confirm with the guest before proceeding

**Wrong Size Selected:**
• Tap the item
• Change the size modifier
• Tap Done

**Forgot to Add Extra Shot:**
• Tap the item
• Add the extra shot modifier (+$1)
• Tap Done

**Guest Paid But Wants a Refund:**
• Call your manager or shift lead
• Explain the situation
• Manager will process the refund through the POS

═══════════════════════════════════════

**TROUBLESHOOTING TIPS**

**POS is Frozen or Slow:**
• Restart the Toast device
• Check Wi-Fi connection
• Alert your manager if the issue persists

**Payment Won't Process:**
• Check card reader connection
• Try a different payment method
• Use backup payment terminal if available

**Order Didn't Fire to Kitchen:**
• Check if "Send to Kitchen" was pressed
• Manually communicate the order to the bar
• Resend if needed

═══════════════════════════════════════

**BEST PRACTICES:**

✓ Always double-check orders before sending
✓ Confirm payment method with the guest
✓ Keep the POS screen clean and responsive
✓ Communicate with your team if issues arise
✓ Ask for help—don't guess if you're unsure`
      },
      {
        id: 'l-toast-practice',
        moduleId: 'm-toast-pos',
        title: 'Hands-On Practice Checklist',
        type: 'CONTENT',
        content: `**HANDS-ON PRACTICE CHECKLIST**

Work with your trainer to complete these practice tasks. Initial each task once you've successfully completed it.

═══════════════════════════════════════

**PART A: TOAST NAVIGATION**

Complete each task multiple times until you feel confident:

☐ Enter a tab name (3 times)
☐ Navigate to Originals category (3 times)
☐ Navigate to Energy/Bubbly category (3 times)
☐ Navigate to Kids Drinks category (3 times)
☐ Add size modifier (5 times)
☐ Add each milk type - all 6 options (Whole, 2%, Oat, Almond, Coconut, Fairlife)
☐ Add sweetness modifier (Half Sweet, Extra Sweet) (3 times)
☐ Remove an item using swipe left (3 times)
☐ Edit item modifiers after adding (3 times)

═══════════════════════════════════════

**PART B: ORDER SCENARIOS**

Practice entering these real-world orders:

☐ Large Iced Texas Delight, oat milk, half sweet
☐ Medium Hot Hill Country with extra shot (+$1)
☐ Frozen Salted Sweetheart, large, sweet cream (+$0.75)
☐ Electric B Energy + Unicorn Latte (two items)
☐ Cookie Butter Nitro + Bacon Taco (drink + food)
☐ Strawberry Dream Matcha, iced, almond milk, extra sweet
☐ Hot Honey Bee Tea + Chocolate Croissant
☐ 2 Large Iced: Lavender Sunrise + Harvest Moon

═══════════════════════════════════════

**PART C: PAYMENT PROCESSING**

Complete each payment type multiple times:

☐ Card payment using **tap** (contactless) (3 times)
☐ Card payment using **chip** insert (2 times)
☐ Cash payment with change calculation (3 times)
☐ Apply rewards using phone number (3 times)
☐ Gift card payment - scan or enter (2 times)
☐ **Boundaries App payment** (use Gift Card method!) (2 times)
☐ Sell a new gift card (1 time)
☐ Void an item before payment (2 times)
☐ Process a refund with trainer supervision (1 time)

═══════════════════════════════════════

**TRAINER SIGN-OFF**

Once the trainee has completed all tasks and demonstrated proficiency, the trainer should sign and date below:

**Trainer Name:** _________________________

**Signature:** _________________________

**Date:** _________________________

**Notes:**`
      },
      {
        id: 'l-toast-quiz',
        moduleId: 'm-toast-pos',
        title: 'Toast POS Navigation Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'tp1', type: 'MULTIPLE_CHOICE', question: 'What is the correct order entry flow?', options: ['Add Item → Size → Tab Name → Modifiers', 'Tab Name → Add Item → Size → Modifiers → Done → Send', 'Size → Item → Modifiers → Name', 'Item → Modifiers → Size → Pay'], correctAnswers: ['Tab Name → Add Item → Size → Modifiers → Done → Send'] },
          { id: 'tp2', type: 'MULTIPLE_CHOICE', question: 'How do you remove an item from an order?', options: ['Press the delete button', 'Swipe left on the item', 'Long press the item', 'Tap the trash icon'], correctAnswers: ['Swipe left on the item'] },
          { id: 'tp3', type: 'MULTIPLE_CHOICE', question: 'What is the upcharge for an extra shot?', options: ['$0.50', '$0.75', '$1.00', '$1.25'], correctAnswers: ['$1.00'] },
          { id: 'tp4', type: 'MULTIPLE_CHOICE', question: 'What is the upcharge for sweet cream?', options: ['$0.25', '$0.50', '$0.75', '$1.00'], correctAnswers: ['$0.75'] },
          { id: 'tp5', type: 'MULTIPLE_CHOICE', question: 'How do you process a Boundaries App payment?', options: ['Select Credit Card and scan', 'Select Gift Card and scan the QR code', 'Select Mobile Wallet', 'Select Boundaries App button'], correctAnswers: ['Select Gift Card and scan the QR code'] },
          { id: 'tp6', type: 'MULTIPLE_CHOICE', question: 'What milk options are available?', options: ['Whole, Skim, 2%', 'Whole, 2%, Oat, Almond, Coconut, Fairlife', 'Whole, Oat, Soy', '2%, Almond, Cashew'], correctAnswers: ['Whole, 2%, Oat, Almond, Coconut, Fairlife'] },
          { id: 'tp7', type: 'MULTIPLE_CHOICE', question: 'What are the sweetness modifier options?', options: ['Light, Regular, Extra', 'Half Sweet, Extra Sweet', 'Less Sugar, More Sugar', '25%, 50%, 100%'], correctAnswers: ['Half Sweet, Extra Sweet'] },
          { id: 'tp8', type: 'MULTIPLE_CHOICE', question: 'How do you apply rewards to an order?', options: ['Scan the app QR code', 'Enter the guest\'s phone number', 'Ask for their email', 'Look up their name'], correctAnswers: ['Enter the guest\'s phone number'] },
          { id: 'tp9', type: 'MULTIPLE_CHOICE', question: 'What handheld device does Boundaries use?', options: ['Toast Go 1', 'Toast Go 2', 'Toast Flex', 'Toast Kiosk'], correctAnswers: ['Toast Go 2'] },
          { id: 'tp10', type: 'MULTIPLE_CHOICE', question: 'What is Step 1 of the order entry flow?', options: ['Add Item', 'Tab Name', 'Select Size', 'Send to Kitchen'], correctAnswers: ['Tab Name'] },
          { id: 'tp11', type: 'MULTIPLE_CHOICE', question: 'How do you edit an item\'s modifiers after adding it?', options: ['Delete and re-add', 'Tap the item to modify', 'Press the edit button', 'Cannot be edited'], correctAnswers: ['Tap the item to modify'] },
          { id: 'tp12', type: 'MULTIPLE_CHOICE', question: 'What is the upcharge for adding a drizzle?', options: ['$0.25', '$0.50', '$0.75', '$1.00'], correctAnswers: ['$0.25'] },
          { id: 'tp13', type: 'MULTIPLE_CHOICE', question: 'When processing a cash payment, what do you enter?', options: ['The total amount due', 'The amount tendered by the guest', 'The change amount', 'The tip amount'], correctAnswers: ['The amount tendered by the guest'] },
          { id: 'tp14', type: 'MULTIPLE_CHOICE', question: 'What does "Void" mean?', options: ['Complete the order', 'Remove an item before payment', 'Process a refund', 'Close the register'], correctAnswers: ['Remove an item before payment'] },
          { id: 'tp15', type: 'MULTIPLE_CHOICE', question: 'When might manager approval be required?', options: ['Adding modifiers', 'Processing refunds', 'Entering tab names', 'Selecting sizes'], correctAnswers: ['Processing refunds'] },
          { id: 'tp16', type: 'MULTIPLE_CHOICE', question: 'How do you sell a new gift card?', options: ['Select Gift Card payment', 'Add Gift Card item → Select amount → Process payment → Activate', 'Scan an existing card', 'Enter the card number manually'], correctAnswers: ['Add Gift Card item → Select amount → Process payment → Activate'] },
          { id: 'tp17', type: 'MULTIPLE_CHOICE', question: 'What should you do if a guest changes their order?', options: ['Start over completely', 'Tap to edit or swipe left to delete items', 'Ask them to order again at the window', 'Call a manager'], correctAnswers: ['Tap to edit or swipe left to delete items'] },
          { id: 'tp18', type: 'MULTIPLE_CHOICE', question: 'Where is the Toast handheld stored when taking orders outside?', options: ['In your pocket', 'In the Boundaries satchel', 'On a lanyard', 'At the register'], correctAnswers: ['In the Boundaries satchel'] },
          { id: 'tp19', type: 'MULTIPLE_CHOICE', question: 'What temperature options are available for drinks?', options: ['Warm, Room Temp, Cold', 'Hot, Iced, Frozen', 'Hot, Cold', 'Steaming, Lukewarm, Chilled'], correctAnswers: ['Hot, Iced, Frozen'] },
          { id: 'tp20', type: 'MULTIPLE_CHOICE', question: 'Why is it important to use Gift Card for Boundaries App payments?', options: ['It\'s faster', 'The app generates a digital gift card QR code', 'Credit Card doesn\'t work', 'It gives bonus points'], correctAnswers: ['The app generates a digital gift card QR code'] }
        ]
      }
    ]
  }
];

const baseTemplates = [
  {
    id: 'ct-opening',
    name: 'Opening Checklist',
    type: 'OPENING',
    deadlineHour: 7,
    unlockHour: 0,
    tasks: [
      { id: 'o-1', title: 'Unlock doors, turn on lights, and start music', requiresPhoto: false, isCritical: true },
      { id: 'o-2', title: 'Dial in Monarch Espresso (Check yield & time)', requiresValue: 'Grind Setting', requiresPhoto: false },
      { id: 'o-3', title: 'Dial in Geometry & Decaf Espresso', requiresValue: 'Grind Settings', requiresPhoto: false },
      { id: 'o-4', title: 'Brew first 1-gallon batch of coffee', requiresPhoto: false },
      { id: 'o-5', title: 'Prepare Matcha base (30g powder + 300ml water)', requiresPhoto: false },
      { id: 'o-6', title: 'Stock milk fridges and rotate FIFO', requiresPhoto: false },
      { id: 'o-7', title: 'Set up pastry case and record inventory', requiresPhoto: true },
      { id: 'o-8', title: 'Prepare Sweet Cream batches (labeled and dated)', requiresPhoto: false },
      { id: 'o-10', title: 'Final shop walk-through & wipe down', requiresPhoto: true },
      { id: 'o-11', title: 'Turn on OPEN sign', requiresPhoto: false, isCritical: true }
    ]
  },
  {
    id: 'ct-closing',
    name: 'Closing Checklist',
    type: 'CLOSING',
    deadlineHour: 21,
    unlockHour: 10,
    tasks: [
      { id: 'c-1', title: 'Backflush La Marzocco with Cafiza', requiresPhoto: false },
      { id: 'c-2', title: 'Soak portafilters & baskets in Cafiza', requiresPhoto: false },
      { id: 'c-3', title: 'Clean & purge steam wands (no residue)', requiresPhoto: false, isCritical: true },
      { id: 'c-4', title: 'Empty and wipe out grinder hoppers', requiresPhoto: false },
      { id: 'c-7', title: 'Empty and clean pastry case', requiresPhoto: true },
      { id: 'c-8', title: 'Take out all trash and reline bins', requiresPhoto: false },
      { id: 'c-9', title: 'Sweep and mop FOH and BOH floors', requiresPhoto: true },
      { id: 'c-10', title: 'Ensure all doors and windows are locked', requiresPhoto: false, isCritical: true },
      { id: 'c-11', title: 'Photo of the clean bar', requiresPhoto: true }
    ]
  },
  {
    id: 'ct-mon',
    name: 'Monday Deep Clean',
    type: 'WEEKLY',
    deadlineHour: 23,
    unlockHour: 0,
    tasks: [
      { id: 'mon-1', title: 'Wipe out all fridges & rotate milk', requiresPhoto: true },
      { id: 'mon-2', title: 'Clean out trash cans & knock box', requiresPhoto: false }
    ]
  },
  {
    id: 'ct-tue',
    name: 'Tuesday Deep Clean',
    type: 'WEEKLY',
    deadlineHour: 23,
    unlockHour: 0,
    tasks: [
      { id: 'tue-1', title: 'Sweep & mop the walk in fridge', requiresPhoto: true },
      { id: 'tue-2', title: 'Clean out pastry case', requiresPhoto: true }
    ]
  },
  {
    id: 'ct-wed',
    name: 'Wednesday Deep Clean',
    type: 'WEEKLY',
    deadlineHour: 23,
    unlockHour: 0,
    tasks: [
      { id: 'wed-1', title: 'Clean the walls & windows in FOH', requiresPhoto: true },
      { id: 'wed-3', title: 'Flush nitro lines with cafiza', requiresPhoto: true, isCritical: true }
    ]
  },
  {
    id: 'ct-thu',
    name: 'Thursday Deep Clean',
    type: 'WEEKLY',
    deadlineHour: 23,
    unlockHour: 0,
    tasks: [
      { id: 'thu-1', title: 'Wipe out all fridges & rotate milk', requiresPhoto: true },
      { id: 'thu-4', title: 'Deep clean sinks', requiresPhoto: true }
    ]
  },
  {
    id: 'ct-fri',
    name: 'Friday Deep Clean',
    type: 'WEEKLY',
    deadlineHour: 23,
    unlockHour: 0,
    tasks: [
      { id: 'fri-3', title: 'Pull fridges out & clean the floors behind (x3)', requiresPhoto: true, isCritical: true }
    ]
  },
  {
    id: 'ct-sat',
    name: 'Saturday Deep Clean',
    type: 'WEEKLY',
    deadlineHour: 23,
    unlockHour: 0,
    tasks: [
      { id: 'sat-3', title: 'Deep clean the TurboChef oven', requiresPhoto: true, isCritical: true }
    ]
  },
  {
    id: 'ct-sun',
    name: 'Sunday Deep Clean',
    type: 'WEEKLY',
    deadlineHour: 23,
    unlockHour: 0,
    tasks: [
      { id: 'sun-1', title: 'Deep clean the bathroom', requiresPhoto: true, isCritical: true }
    ]
  }
];

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = MOCK_STORES.flatMap(store => 
  baseTemplates.map(tpl => ({
    ...tpl,
    id: `${tpl.id}-${store.id}`,
    storeId: store.id
  })) as ChecklistTemplate[]
);
