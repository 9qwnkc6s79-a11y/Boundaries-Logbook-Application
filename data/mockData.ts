
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
    number: 5,
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
    title: 'Pre-Arrival: Onboarding Logistics',
    description: 'Ensure your administrative and payroll setup is complete.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-logistics',
        moduleId: 'm-onboarding',
        title: 'System Confirmation',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q2', type: 'TRUE_FALSE', question: 'I have been added to Sling and have downloaded and logged into the app.', correctAnswers: ['True'] },
          { id: 'q3', type: 'TRUE_FALSE', question: 'I have received my Toast Payroll Onboarding Email and completed the required steps to create my account.', correctAnswers: ['True'] },
          { id: 'q4', type: 'TRUE_FALSE', question: 'I have set up my direct deposit.', correctAnswers: ['True'] },
          { id: 'q5', type: 'TRUE_FALSE', question: 'I have reviewed the company handbook.', correctAnswers: ['True'] },
          { id: 'q6', type: 'TRUE_FALSE', question: 'I have completed my Texas Food Handler certification.', correctAnswers: ['True'] }
        ]
      },
      {
        id: 'l-certification',
        moduleId: 'm-onboarding',
        title: 'Certification Verification',
        type: 'FILE_UPLOAD',
        fileLabel: 'Upload Texas Food Handler Certificate'
      }
    ]
  },
  {
    id: 'm-culture',
    title: 'Culture & Conflict Resolution',
    description: 'Master the spirit of Humble, Focused, and Fun.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-values-quiz',
        moduleId: 'm-culture',
        title: 'The Boundaries Core',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q8', type: 'MULTIPLE_CHOICE', question: 'What are the three core company values at Boundaries Coffee?', options: ['Humble, Focused, Fun', 'Hungry, Happy, Hardworking', 'Humble, Consistent, Quality', 'Excellence, Innovation, Integrity'], correctAnswers: ['Humble, Focused, Fun'] },
          { id: 'q9', type: 'MULTIPLE_CHOICE', question: 'What does it mean to be “humble” at Boundaries Coffee?', options: ['Always acting like you’re the best on the team', 'Being teachable, admitting mistakes, and putting others before yourself', 'Ignoring feedback from managers and teammates', 'Doing things your own way'], correctAnswers: ['Being teachable, admitting mistakes, and putting others before yourself'] },
          { id: 'q10', type: 'MULTIPLE_CHOICE', question: 'Which of the following best reflects being “focused” at Boundaries Coffee?', options: ['Checking your phone', 'Prioritizing personal conversations', 'Staying attentive to responsibilities and customer needs', 'Finishing half your tasks'], correctAnswers: ['Staying attentive to responsibilities and customer needs'] },
          { id: 'q11', type: 'MULTIPLE_CHOICE', question: 'Having “fun” at Boundaries Coffee primarily means:', options: ['Acting silly', 'Creating a positive, joyful environment for customers and teammates', 'Ignoring customer needs', 'Playing pranks'], correctAnswers: ['Creating a positive, joyful environment for customers and teammates'] },
          { id: 'q12', type: 'MULTIPLE_CHOICE', question: 'What attitude shows humility?', options: ['Apologizing when you make a mistake', 'Blaming teammates', 'Ignoring team goals', 'Always insisting your way is right'], correctAnswers: ['Apologizing when you make a mistake'] },
          { id: 'q13', type: 'MULTIPLE_CHOICE', question: 'Which situation best demonstrates being focused?', options: ['You clean a messy counter without being asked because you notice it’s needed.', 'You wait for your shift lead to tell you every task.', 'You leave early', 'You spend time chatting'], correctAnswers: ['You clean a messy counter without being asked because you notice it’s needed.'] },
          { id: 'q14', type: 'MULTIPLE_CHOICE', question: 'Which behavior would NOT be considered humble?', options: ['Asking for advice', 'Blaming others when something goes wrong', 'Taking responsibility', 'Celebrating team wins'], correctAnswers: ['Blaming others when something goes wrong'] },
          { id: 'q15', type: 'MULTIPLE_CHOICE', question: 'Which of the following best captures the spirit of “fun” at Boundaries Coffee?', options: ['Making customers and coworkers feel welcomed and positive', 'Being loud and disruptive', 'Doing whatever you want', 'Ignoring customers'], correctAnswers: ['Making customers and coworkers feel welcomed and positive'] },
          { id: 'q16', type: 'MULTIPLE_CHOICE', question: 'What are the three organizational values emphasized in the handbook?', options: ['Humble, Focused, Fun', 'Passion, Hospitality, Selflessness', 'Professionalism, Respect', 'Skill, Communication'], correctAnswers: ['Passion, Hospitality, Selflessness'] },
          { id: 'q17', type: 'MULTIPLE_CHOICE', question: 'What is the expected attitude when resolving staff conflicts?', options: ['Avoid confrontation', 'Handle it publicly', 'Attempt to resolve it directly with the other person first', 'Escalate to HR immediately'], correctAnswers: ['Attempt to resolve it directly with the other person first'] },
          { id: 'q19', type: 'MULTIPLE_CHOICE', question: 'What should an employee do if they feel unsafe during a conflict with a guest?', options: ['Argue calmly', 'Continue serving', 'Immediately walk away and get help from a team lead or manager', 'Ask another employee to intervene'], correctAnswers: ['Immediately walk away and get help from a team lead or manager'] }
        ]
      }
    ]
  },
  {
    id: 'm-policies',
    title: 'Policies & Uniform Standards',
    description: 'Conduct, cell phones, and the Boundaries look.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-policy-quiz',
        moduleId: 'm-policies',
        title: 'Conduct & Professionalism',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q18', type: 'MULTIPLE_CHOICE', question: 'Which of the following is not appropriate workplace attire?', options: ['Clean black jeans', 'Boundaries-branded t-shirt', 'Water-resistant jacket in navy', 'Fleece hoodie in gray'], correctAnswers: ['Fleece hoodie in gray'] },
          { id: 'q20', type: 'MULTIPLE_CHOICE', question: 'Which of the following actions may result in immediate termination?', options: ['Wearing an unapproved hat', 'Forgetting to restock', 'Using illicit drugs on the premises', 'Arriving 5 minutes late'], correctAnswers: ['Using illicit drugs on the premises'] },
          { id: 'q21', type: 'MULTIPLE_CHOICE', question: 'What is Boundaries’ cell phone policy during work hours?', options: ['Used freely', 'Left in a locker at all times', 'Cell phone use is only allowed for emergencies or job-related tasks', 'Texting is fine if quick'], correctAnswers: ['Cell phone use is only allowed for emergencies or job-related tasks'] },
          { id: 'q22', type: 'MULTIPLE_CHOICE', question: 'What happens on a team member’s third strike under the conduct policy?', options: ['A final warning', 'Suspension', 'Termination of employment', 'Pay is withheld'], correctAnswers: ['Termination of employment'] },
          { id: 'q23', type: 'MULTIPLE_CHOICE', question: 'What is required of employees before consuming a meal during a shift?', options: ['Verbal permission', 'Eat at front counter', 'Eat only in the designated area behind the walk-in cooler', 'Log in POS'], correctAnswers: ['Eat only in the designated area behind the walk-in cooler'] },
          { id: 'q24', type: 'MULTIPLE_CHOICE', question: 'How many “no shows” within 12 months will result in potential termination?', options: ['1', '2', '3', '4'], correctAnswers: ['2'] },
          { id: 'q25', type: 'MULTIPLE_CHOICE', question: 'What is the definition of a no-show at Boundaries Coffee?', options: ['10 mins late', 'Less than 24h notice', 'Being more than 20 minutes late or missing a shift without notice', 'Forgetting to clock in'], correctAnswers: ['Being more than 20 minutes late or missing a shift without notice'] },
          { id: 'q26', type: 'MULTIPLE_CHOICE', question: 'An employee finds out they cannot make their shift five days before it starts. What are they expected to do?', options: ['Nothing', 'Call in sick', 'Find a replacement and notify the manager', 'Just let the manager know'], correctAnswers: ['Find a replacement and notify the manager'] },
          { id: 'q27', type: 'MULTIPLE_CHOICE', question: 'How should you go about finding a replacement if you realize you can’t make your shift?', options: ['Call everyone on Sling', 'Send a group message in the Sling messaging center', 'Post in team group chat', 'Text friends'], correctAnswers: ['Send a group message in the Sling messaging center'] },
          { id: 'q28', type: 'MULTIPLE_CHOICE', question: 'What should an employee do if they are feeling ill 24 hours before their shift?', options: ['Wait to see', 'Notify their manager and begin calling team members', 'Text a coworker', 'Message group chat'], correctAnswers: ['Notify their manager and begin calling team members'] },
          { id: 'q29', type: 'MULTIPLE_CHOICE', question: 'Which of the following is part of Boundaries Coffee’s required dress code?', options: ['Clean, branded Boundaries attire for the base layer', 'Any comfortable shirt', 'Political clothing', 'Brightly colored sneakers'], correctAnswers: ['Clean, branded Boundaries attire for the base layer'] },
          { id: 'q30', type: 'MULTIPLE_CHOICE', question: 'Which of the following is not allowed under Boundaries Coffee’s dress code?', options: ['Closed-toed shoes', 'Water-resistant jackets', 'Fleece jackets for outerwear', 'Clean black or navy pants'], correctAnswers: ['Fleece jackets for outerwear'] },
          { id: 'q31', type: 'MULTIPLE_CHOICE', question: 'Which of the following hygiene practices is required?', options: ['Hair must be well kept and put up off the shoulders if long', 'Strong perfumes', 'Gloves are optional', 'Hats can be dirty'], correctAnswers: ['Hair must be well kept and put up off the shoulders if long'] },
          { id: 'q32', type: 'MULTIPLE_CHOICE', question: 'What hygiene standard must employees follow when working a shift?', options: ['Hand wash once', 'Keep nails and hands clean and well kept', 'Hand sanitizer instead of washing', 'Excessive jewelry'], correctAnswers: ['Keep nails and hands clean and well kept'] }
        ]
      }
    ]
  },
  {
    id: 'm-barista-basics',
    title: 'A Barista\'s Morning',
    description: 'The first steps in the cafe and the art of dialing in.',
    category: 'CONTINUED',
    lessons: [
      {
        id: 'l-morning-quiz',
        moduleId: 'm-barista-basics',
        title: 'Morning Protocols',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q33', type: 'MULTIPLE_CHOICE', question: 'What is one of the first things the barista does when starting a morning shift?', options: ['Brew espresso', 'Wash hands', 'Fill syrups', 'Clean pastry case'], correctAnswers: ['Wash hands'] },
          { id: 'q34', type: 'MULTIPLE_CHOICE', question: 'Why does the barista taste the batch brew after it finishes brewing?', options: ['Practice cupping', 'Calibrate with baristas', 'To confirm the flavor is correct before serving customers', 'Determine caffeine level'], correctAnswers: ['To confirm the flavor is correct before serving customers'] },
          { id: 'q35', type: 'MULTIPLE_CHOICE', question: 'What does “dialing in” espresso involve?', options: ['Cleaning the machine', 'Measuring and adjusting espresso shots for ideal yield and taste', 'Warming portafilters', 'Scheduling baristas'], correctAnswers: ['Measuring and adjusting espresso shots for ideal yield and taste'] },
          { id: 'q36', type: 'MULTIPLE_CHOICE', question: 'Which of the following tasks is part of restocking before opening the café?', options: ['Scrubbing machine', 'Counting till', 'Preparing pitchers', 'Refilling lids, syrups, stir sticks, and stocking tea bags'], correctAnswers: ['Refilling lids, syrups, stir sticks, and stocking tea bags'] }
        ]
      },
      {
        id: 'l-morning-video',
        moduleId: 'm-barista-basics',
        title: 'Visual: Morning Routine',
        type: 'QUIZ',
        videoUrl: 'http://youtube.com/watch?v=qiSpThw_S-o',
        quizQuestions: [
          { id: 'q37', type: 'MULTIPLE_CHOICE', question: 'Why is it important to taste the brewed coffee before serving it to customers?', options: ['Check grinder', 'To ensure the coffee tastes correct and meets company standards', 'Compare milk', 'Practice latte art'], correctAnswers: ['To ensure the coffee tastes correct and meets company standards'] },
          { id: 'q38', type: 'MULTIPLE_CHOICE', question: 'What does “dialing in” espresso mean?', options: ['Measuring sales', 'Adjusting the coffee grind and espresso settings to meet the correct weight and taste standards', 'Practice during free time', 'Brewing without measuring'], correctAnswers: ['Adjusting the coffee grind and espresso settings to meet the correct weight and taste standards'] },
          { id: 'q39', type: 'MULTIPLE_CHOICE', question: 'What is the first thing employees are expected to do at the beginning of a shift?', options: ['Pull shots', 'Taste drip coffee', 'Turn on grinders', 'Wash their hands vigorously'], correctAnswers: ['Wash their hands vigorously'] }
        ]
      }
    ]
  },
  {
    id: 'm-ordering',
    title: 'Ordering & Drink Standards',
    description: 'Understanding the menu from Americanos to Mochas.',
    category: 'CONTINUED',
    lessons: [
      {
        id: 'l-ordering-video',
        moduleId: 'm-ordering',
        title: 'How to Order',
        type: 'QUIZ',
        videoUrl: 'http://youtube.com/watch?v=uv4d3qpbd80',
        quizQuestions: [
          { id: 'q40', type: 'MULTIPLE_CHOICE', question: 'What is the main difference between cold brew and iced coffee?', options: ['Cold brew is hot then chilled', 'Cold brew is brewed cold over a long period of time, usually 18–24 hours', 'Cold brew adds milk automatically', 'Cold brew has less caffeine'], correctAnswers: ['Cold brew is brewed cold over a long period of time, usually 18–24 hours'] },
          { id: 'q41', type: 'MULTIPLE_CHOICE', question: 'What is a cortado made of?', options: ['2oz espresso + 3.5oz milk', 'Two ounces of espresso and two ounces of steamed milk', '1oz espresso + 1oz water', 'Two shots topped with foam'], correctAnswers: ['Two ounces of espresso and two ounces of steamed milk'] },
          { id: 'q42', type: 'MULTIPLE_CHOICE', question: 'What is an Americano made of?', options: ['Two shots of espresso combined with hot or cold water', 'Shots mixed with steamed milk', 'Brewed coffee over ice', 'Cold brew mixed with sparkling water'], correctAnswers: ['Two shots of espresso combined with hot or cold water'] },
          { id: 'q43', type: 'MULTIPLE_CHOICE', question: 'What is a mocha?', options: ['Americano + chocolate', 'A latte with chocolate sauce and sometimes cocoa powder', 'Cold brew + whipped cream', 'Cappuccino + cinnamon'], correctAnswers: ['A latte with chocolate sauce and sometimes cocoa powder'] }
        ]
      }
    ]
  },
  {
    id: 'm-science',
    title: 'Coffee Science & Processing',
    description: 'From Seed to Cup: The technical side of specialty coffee.',
    category: 'CONTINUED',
    lessons: [
      {
        id: 'l-specialty-video',
        moduleId: 'm-science',
        title: 'What is Specialty Coffee?',
        type: 'QUIZ',
        videoUrl: 'http://youtube.com/watch?v=kM_UlQ9fr2c',
        quizQuestions: [
          { id: 'q44', type: 'MULTIPLE_CHOICE', question: 'What is the technical definition of specialty coffee?', options: ['Sensory score of 80 or above...', 'Brewed with syrups', 'Roasted darker', 'Only served cold'], correctAnswers: ['Sensory score of 80 or above based on quality measures like acidity, sweetness, and aroma'] },
          { id: 'q45', type: 'MULTIPLE_CHOICE', question: 'Why does specialty coffee often cost more than commodity coffee?', options: ['Grown closer to US', 'Specialty coffee requires more labor, higher quality farming practices, and careful defect removal', 'Roasted with expensive equipment', 'Higher tax'], correctAnswers: ['Specialty coffee requires more labor, higher quality farming practices, and careful defect removal'] },
          { id: 'q46', type: 'MULTIPLE_CHOICE', question: 'What is Jon’s long-term goal for the coffee industry?', options: ['Baristas more famous than chefs', 'To turn farms and producers into recognized brands for consumers', 'More syrup-based drinks', 'Replace wine'], correctAnswers: ['To turn farms and producers into recognized brands for consumers'] }
        ]
      },
      {
        id: 'l-seed-to-cup',
        moduleId: 'm-science',
        title: 'Seed to Cup Journey',
        type: 'QUIZ',
        videoUrl: 'http://youtube.com/watch?v=Dmpnrtey3YU',
        quizQuestions: [
          { id: 'q47', type: 'MULTIPLE_CHOICE', question: 'What factors contribute to the high quality of coffee grown at higher altitudes?', options: ['Faster growth', 'Slow growth, rich volcanic soil, and cooler climates', 'Fast harvesting', 'Hotter temperatures'], correctAnswers: ['Slow growth, rich volcanic soil, and cooler climates'] },
          { id: 'q48', type: 'MULTIPLE_CHOICE', question: 'What is one major reason specialty coffee costs more than commodity coffee?', options: ['Machine picked', 'Grows faster', 'It requires more labor-intensive harvesting and sorting by hand', 'Mixed with syrups'], correctAnswers: ['It requires more labor-intensive harvesting and sorting by hand'] },
          { id: 'q49', type: 'MULTIPLE_CHOICE', question: 'What is the washed process used for in coffee production?', options: ['Mix varieties', 'To ferment coffee cherries to remove mucilage and improve flavor', 'Dry directly in sun', 'Roast immediately'], correctAnswers: ['To ferment coffee cherries to remove mucilage and improve flavor'] },
          { id: 'q50', type: 'MULTIPLE_CHOICE', question: 'What is the final stage before coffee is exported and roasted?', options: ['Green coffee', 'Red cherries', 'Dry parchment', 'Wet parchment'], correctAnswers: ['Green coffee'] },
          { id: 'q51', type: 'MULTIPLE_CHOICE', question: 'What is the name of the coffee plant species that produces both commodity and specialty coffee?', options: ['Coffea robusta', 'Coffea liberica', 'Coffea arabica', 'Coffea excelsa'], correctAnswers: ['Coffea arabica'] }
        ]
      },
      {
        id: 'l-processing-logic',
        moduleId: 'm-science',
        title: 'Plant & Process',
        type: 'QUIZ',
        quizQuestions: [
          { id: 'q52', type: 'MULTIPLE_CHOICE', question: 'Which of the following correctly lists the five main stages of coffee processing?', options: ['Green, roasted, wet, dry, red', 'Red cherry, wet parchment, dry parchment, green coffee, roasted coffee', 'Dry, red, green, roasted, wet', 'Wet, red, roasted, green, dry'], correctAnswers: ['Red cherry, wet parchment, dry parchment, green coffee, roasted coffee'] },
          { id: 'q53', type: 'MULTIPLE_CHOICE', question: 'Coffee is best described as what part of the plant?', options: ['The seed inside a cherry', 'The root', 'The leaf', 'The outer skin'], correctAnswers: ['The seed inside a cherry'] }
        ]
      }
    ]
  },
  {
    id: 'm-advanced',
    title: 'Excellence: Onyx & The Ideal Player',
    description: 'Learning from the best in the industry.',
    category: 'CONTINUED',
    lessons: [
      {
        id: 'l-onyx-video',
        moduleId: 'm-advanced',
        title: 'Onyx: Never Settle',
        type: 'QUIZ',
        videoUrl: 'http://youtube.com/watch?v=WYZQGE6M4Tc',
        quizQuestions: [
          { id: 'q54', type: 'MULTIPLE_CHOICE', question: 'What is the meaning of Onyx’s tagline “Never Settle for Good Enough”?', options: ['Fast service over quality', 'Strive for excellence and constantly push for better quality', 'Lowering costs', 'Create many new drinks'], correctAnswers: ['Strive for excellence and constantly push for better quality'] },
          { id: 'q55', type: 'MULTIPLE_CHOICE', question: 'What quality control steps are mentioned for processing coffee at Onyx?', options: ['Roast and ship immediately', 'Sort only by weight', 'Roast, color sort to remove defects, cup for quality, then bag and ship', 'Large batches without checking'], correctAnswers: ['Roast, color sort to remove defects, cup for quality, then bag and ship'] },
          { id: 'q56', type: 'MULTIPLE_CHOICE', question: 'What was the original goal behind founding Onyx Coffee Lab?', options: ['Largest chain of drive-thrus', 'Create flavored syrups', 'To build a coffee company geared toward coffee professionals', 'Focus on selling equipment'], correctAnswers: ['To build a coffee company geared toward coffee professionals'] }
        ]
      },
      {
        id: 'l-lencioni-video',
        moduleId: 'm-advanced',
        title: 'The Ideal Team Player',
        type: 'QUIZ',
        videoUrl: 'http://youtube.com/watch?v=PRh80RyT74I',
        quizQuestions: [
          { id: 'q57', type: 'MULTIPLE_CHOICE', question: 'What are the three virtues of an ideal team player, according to Patrick Lencioni?', options: ['Humble, Hungry, Smart', 'Helpful, Honest, Strategic', 'Hardworking, Empathetic', 'Happy, Healthy, Structured'], correctAnswers: ['Humble, Hungry, Smart'] },
          { id: 'q58', type: 'MULTIPLE_CHOICE', question: 'What does Lencioni say is the most important of the three virtues?', options: ['Smart', 'Hungry', 'Humble', 'Hardworking'], correctAnswers: ['Humble'] },
          { id: 'q59', type: 'MULTIPLE_CHOICE', question: 'What does it mean to be “hungry” in the context of being a team player?', options: ['Wanting promotions', 'Having a strong internal drive to do more than the minimum', 'Working long hours for approval', 'Being competitive'], correctAnswers: ['Having a strong internal drive to do more than the minimum'] },
          { id: 'q60', type: 'MULTIPLE_CHOICE', question: 'What type of team member is described as smart and hungry but not humble?', options: ['Accidental mess maker', 'Lovable slacker', 'Skillful politician', 'Silent contributor'], correctAnswers: ['Skillful politician'] },
          { id: 'q61', type: 'MULTIPLE_CHOICE', question: 'Which of the following best describes someone who is humble and smart but not hungry?', options: ['Skillful politician', 'Lovable slacker', 'Silent overachiever', 'Unintentional leader'], correctAnswers: ['Lovable slacker'] }
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
    tasks: [
      { id: 'fri-3', title: 'Pull fridges out & clean the floors behind (x3)', requiresPhoto: true, isCritical: true }
    ]
  },
  {
    id: 'ct-sat',
    name: 'Saturday Deep Clean',
    type: 'WEEKLY',
    deadlineHour: 23,
    tasks: [
      { id: 'sat-3', title: 'Deep clean the TurboChef oven', requiresPhoto: true, isCritical: true }
    ]
  },
  {
    id: 'ct-sun',
    name: 'Sunday Deep Clean',
    type: 'WEEKLY',
    deadlineHour: 23,
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
