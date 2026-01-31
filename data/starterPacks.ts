import { TrainingModule, ChecklistTemplate, Recipe, ManualSection } from '../types';

export interface StarterPack {
  id: string;
  name: string;
  icon: string;
  description: string;
  curriculum: TrainingModule[];
  templates: ChecklistTemplate[];
  recipes: Recipe[];
  manual: ManualSection[];
}

// ── Template Blueprints (storeId set during generation) ──

function openingChecklist(storeId: string): ChecklistTemplate {
  return {
    id: `tpl-opening-${storeId}`,
    name: 'Opening Checklist',
    storeId,
    type: 'OPENING',
    deadlineHour: 7,
    unlockHour: 4,
    tasks: [
      { id: 'ot-1', title: 'Unlock doors and disarm security', requiresPhoto: false, isCritical: true },
      { id: 'ot-2', title: 'Turn on all lights', requiresPhoto: false },
      { id: 'ot-3', title: 'Power on espresso machine and grinders', requiresPhoto: false, isCritical: true },
      { id: 'ot-4', title: 'Run water through group heads (flush)', requiresPhoto: false },
      { id: 'ot-5', title: 'Wipe down all counters and surfaces', requiresPhoto: true },
      { id: 'ot-6', title: 'Stock cups, lids, sleeves, and napkins', requiresPhoto: false },
      { id: 'ot-7', title: 'Check milk and ingredient levels — restock as needed', requiresPhoto: false },
      { id: 'ot-8', title: 'Brew first batch of drip coffee', requiresPhoto: false },
      { id: 'ot-9', title: 'Set up POS system and verify till count', requiresPhoto: false, isCritical: true },
      { id: 'ot-10', title: 'Put out signage and set menu boards', requiresPhoto: false },
    ],
  };
}

function closingChecklist(storeId: string): ChecklistTemplate {
  return {
    id: `tpl-closing-${storeId}`,
    name: 'Closing Checklist',
    storeId,
    type: 'CLOSING',
    deadlineHour: 21,
    unlockHour: 14,
    tasks: [
      { id: 'ct-1', title: 'Clean and backflush espresso machine', requiresPhoto: true, isCritical: true },
      { id: 'ct-2', title: 'Empty and rinse grinder hoppers', requiresPhoto: false },
      { id: 'ct-3', title: 'Wipe down all counters and equipment', requiresPhoto: true },
      { id: 'ct-4', title: 'Empty all trash cans and replace liners', requiresPhoto: false },
      { id: 'ct-5', title: 'Sweep and mop all floors', requiresPhoto: true },
      { id: 'ct-6', title: 'Restock for tomorrow (cups, lids, syrups)', requiresPhoto: false },
      { id: 'ct-7', title: 'Close out POS and count till', requiresPhoto: false, isCritical: true },
      { id: 'ct-8', title: 'Store perishables properly — check temps', requiresPhoto: false },
      { id: 'ct-9', title: 'Turn off lights and equipment', requiresPhoto: false },
      { id: 'ct-10', title: 'Lock all doors and arm security', requiresPhoto: false, isCritical: true },
    ],
  };
}

function weeklyCleaningChecklist(storeId: string): ChecklistTemplate {
  return {
    id: `tpl-weekly-${storeId}`,
    name: 'Weekly Deep Clean',
    storeId,
    type: 'WEEKLY',
    deadlineHour: 20,
    unlockHour: 6,
    tasks: [
      { id: 'wt-1', title: 'Deep clean espresso machine drip trays and steam wands', requiresPhoto: true },
      { id: 'wt-2', title: 'Clean grinder burrs and adjust calibration', requiresPhoto: true },
      { id: 'wt-3', title: 'Scrub and sanitize all sinks', requiresPhoto: true },
      { id: 'wt-4', title: 'Clean and organize refrigerator — discard expired items', requiresPhoto: true },
      { id: 'wt-5', title: 'Wipe down walls and baseboards in service area', requiresPhoto: false },
      { id: 'wt-6', title: 'Clean behind and under equipment', requiresPhoto: false },
      { id: 'wt-7', title: 'Sanitize all blenders and brewing equipment', requiresPhoto: false },
      { id: 'wt-8', title: 'Deep clean restrooms', requiresPhoto: true },
      { id: 'wt-9', title: 'Inventory check — note items to reorder', requiresPhoto: false },
      { id: 'wt-10', title: 'Window and glass cleaning', requiresPhoto: false },
    ],
  };
}

// ── Curriculum: Coffee Shop Essentials ──

const essentialsCurriculum: TrainingModule[] = [
  {
    id: 'sp-m-hospitality',
    title: 'Hospitality & Customer Service',
    description: 'Learn the fundamentals of great hospitality and how to create memorable guest experiences.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'sp-l-hospitality-1',
        moduleId: 'sp-m-hospitality',
        title: 'The Art of Hospitality',
        type: 'CONTENT',
        content: `## Welcome to Your Team

Great hospitality isn't just about making drinks — it's about making people feel welcome. Every interaction is an opportunity to brighten someone's day.

### The Guest Experience

From the moment a guest approaches your shop, they're forming an impression. Your goal is to make that impression a positive one:

1. **Greet warmly** — Make eye contact, smile, and say hello within the first few seconds
2. **Be present** — Put away distractions and give your full attention
3. **Listen actively** — Repeat the order back to confirm accuracy
4. **Move with purpose** — Efficiency shows respect for your guest's time
5. **Thank sincerely** — Every guest should leave feeling appreciated

### The Greeting Script

> "Hey! Welcome to [your shop]! What can we get started for you today?"

Keep it natural, warm, and enthusiastic. Adjust your energy to match the guest — some people want a quick transaction, others want to chat.

### Reading the Room

- **Morning rush**: Fast, efficient, friendly but brief
- **Mid-day lull**: More conversational, suggest new items
- **Regulars**: Use their name, remember their order
- **First-timers**: Offer guidance, suggest popular items`
      },
      {
        id: 'sp-l-hospitality-2',
        moduleId: 'sp-m-hospitality',
        title: 'Service Recovery',
        type: 'CONTENT',
        content: `## When Things Go Wrong

Mistakes happen. What matters is how you handle them. A great recovery can actually create a MORE loyal customer than if nothing went wrong at all.

### The L.A.S.T. Method

- **L — Listen**: Let the guest explain without interrupting
- **A — Apologize**: A sincere "I'm sorry about that" goes a long way
- **S — Solve**: Fix the problem immediately — remake the drink, offer a discount
- **T — Thank**: Thank them for letting you know and for their patience

### Common Scenarios

**Wrong drink made:**
"I'm so sorry about that! Let me remake that for you right now. It'll just be a minute."

**Long wait time:**
"Thank you for your patience — I know the wait was longer than usual. We appreciate you sticking with us."

**Guest is upset:**
Stay calm, lower your voice slightly, and focus on the solution. Never argue. If you can't resolve it, get a manager.

### Key Principles

- Never make excuses — own the mistake
- Speed matters — fix it FAST
- Follow up — "Is there anything else I can do?"
- If in doubt, ask your shift lead or manager for help`
      },
      {
        id: 'sp-l-hospitality-quiz',
        moduleId: 'sp-m-hospitality',
        title: 'Customer Service Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          {
            id: 'sp-q1',
            type: 'MULTIPLE_CHOICE',
            question: 'What does the "L" in the L.A.S.T. service recovery method stand for?',
            options: ['Look', 'Listen', 'Lead', 'Learn'],
            correctAnswers: ['Listen'],
            explanation: 'Listen first — let the guest explain the issue without interrupting.'
          },
          {
            id: 'sp-q2',
            type: 'MULTIPLE_CHOICE',
            question: 'A guest says their drink tastes wrong. What should you do FIRST?',
            options: ['Explain how you made it', 'Ask them to be more specific', 'Apologize and offer to remake it', 'Tell them it was made correctly'],
            correctAnswers: ['Apologize and offer to remake it'],
            explanation: 'Always lead with empathy. Apologize and offer to fix it immediately.'
          },
          {
            id: 'sp-q3',
            type: 'MULTIPLE_CHOICE',
            question: 'When should you greet a guest?',
            options: ['After they place their order', 'Within the first few seconds of their arrival', 'Only if they greet you first', 'When their drink is ready'],
            correctAnswers: ['Within the first few seconds of their arrival'],
            explanation: 'A prompt greeting makes guests feel welcome and noticed.'
          },
        ]
      }
    ]
  },
  {
    id: 'sp-m-food-safety',
    title: 'Food Safety Basics',
    description: 'Essential food safety practices for every team member.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'sp-l-safety-1',
        moduleId: 'sp-m-food-safety',
        title: 'Handwashing & Personal Hygiene',
        type: 'CONTENT',
        content: `## Handwashing: Your #1 Defense

Proper handwashing is the single most important food safety practice. It prevents the spread of foodborne illness and keeps our guests safe.

### When to Wash Your Hands

- **Before** starting your shift
- **Before** handling any food or beverages
- **After** using the restroom
- **After** touching your face, hair, or phone
- **After** handling trash or dirty dishes
- **After** sneezing, coughing, or blowing your nose
- **When switching** between tasks

### The 20-Second Method

1. Wet hands with warm water
2. Apply soap generously
3. Scrub all surfaces — palms, backs, between fingers, under nails
4. Scrub for at least **20 seconds** (hum "Happy Birthday" twice)
5. Rinse thoroughly under running water
6. Dry with a clean paper towel
7. Use the paper towel to turn off the faucet

### Personal Hygiene Standards

- Keep nails short, clean, and unpolished
- Hair must be pulled back and secured
- Clean uniform every shift
- No strong fragrances
- Cover any cuts or wounds with bandages AND gloves`
      },
      {
        id: 'sp-l-safety-2',
        moduleId: 'sp-m-food-safety',
        title: 'Temperature Control & Allergens',
        type: 'CONTENT',
        content: `## Temperature Control

Keeping food at safe temperatures prevents bacterial growth and protects our guests.

### The Danger Zone: 41°F – 135°F (5°C – 57°C)

Food should NEVER sit in this temperature range for more than **2 hours**. Bacteria multiply rapidly in the danger zone.

### Cold Storage Rules

- Refrigerator: **41°F (5°C) or below**
- Milk must be kept cold at all times
- Check fridge temps at opening and closing
- FIFO: First In, First Out — use oldest product first
- Label everything with date opened/prepared

### Hot Holding

- Hot food: **135°F (57°C) or above**
- Never reheat food in a steam table — use proper equipment first

## Allergen Awareness

### The Big 9 Allergens

1. Milk / Dairy
2. Eggs
3. Tree Nuts (almonds, cashews, etc.)
4. Peanuts
5. Wheat / Gluten
6. Soy
7. Fish
8. Shellfish
9. Sesame

### What You Need to Do

- **Know your ingredients** — what's in every drink and food item
- **Take every allergy seriously** — even small traces can cause severe reactions
- **When in doubt, ask** — check with a manager if a guest has an allergy question
- **Clean equipment** between uses when allergens are involved
- **Never guess** — "I think it's fine" is never acceptable`
      },
      {
        id: 'sp-l-safety-quiz',
        moduleId: 'sp-m-food-safety',
        title: 'Food Safety Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          {
            id: 'sp-q4',
            type: 'MULTIPLE_CHOICE',
            question: 'What is the temperature danger zone for food?',
            options: ['0°F – 32°F', '41°F – 135°F', '100°F – 200°F', '32°F – 100°F'],
            correctAnswers: ['41°F – 135°F'],
            explanation: 'The danger zone is 41°F–135°F. Bacteria grow rapidly in this range.'
          },
          {
            id: 'sp-q5',
            type: 'MULTIPLE_CHOICE',
            question: 'How long should you wash your hands?',
            options: ['5 seconds', '10 seconds', '20 seconds', '60 seconds'],
            correctAnswers: ['20 seconds'],
            explanation: 'Scrub for at least 20 seconds to effectively remove bacteria.'
          },
          {
            id: 'sp-q6',
            type: 'TRUE_FALSE',
            question: 'FIFO stands for "First In, First Out" — meaning you use the oldest product first.',
            correctAnswers: ['True'],
            explanation: 'FIFO ensures product freshness and reduces waste.'
          },
        ]
      }
    ]
  },
  {
    id: 'sp-m-opening-closing',
    title: 'Opening & Closing Procedures',
    description: 'Learn the standard procedures for opening and closing your shop.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'sp-l-opening',
        moduleId: 'sp-m-opening-closing',
        title: 'Opening Your Shop',
        type: 'CONTENT',
        content: `## Morning Opening Routine

A consistent opening routine ensures your shop is ready for the first guest every single day.

### Before Guests Arrive

1. **Arrive on time** — the opener sets the pace for the entire day
2. **Wash hands** — first thing, every time, no exceptions
3. **Walk the floor** — quick visual check of the entire shop
4. **Power up** — espresso machine, grinders, ovens, POS, music
5. **Prep stations** — stock all positions with what they need

### Dialing In

Your espresso is the foundation. Before serving any drinks:

- Pull test shots and taste them
- Check dose, yield, and time against your shop's standards
- Adjust grind if needed — the goal is a balanced, sweet extraction
- Once dialed in, pull a few more to confirm consistency

### Stocking & Prep

- Milk (whole, oat, alternatives) — fill all pitchers
- Cups, lids, sleeves — front-facing stock full
- Syrups and sauces — check levels, refill if low
- Pastry case — stock fresh items, remove expired
- Brew first batch of drip coffee

### The Opening Checklist

Your shop will have a daily opening checklist. Complete every item before opening the doors. This ensures nothing is missed and creates accountability.

### Final Check

- Music playing? ✓
- Lights on? ✓
- Menu boards visible? ✓
- Stations stocked? ✓
- Espresso dialed in? ✓
- **Open the doors!**`
      },
      {
        id: 'sp-l-closing',
        moduleId: 'sp-m-opening-closing',
        title: 'Closing Your Shop',
        type: 'CONTENT',
        content: `## Evening Closing Routine

A thorough close means an easy open. Leave the shop better than you found it.

### Last Hour Prep

Start winding down operations 30–60 minutes before close:

- Stop brewing fresh drip coffee (serve what's left)
- Begin pre-cleaning tasks that won't affect service
- Run dishwasher loads between customers

### After Last Guest

1. **Lock doors** and flip the "Closed" sign
2. **Clean the bar** — wipe all surfaces, organize stations
3. **Espresso machine** — backflush with cleaner, wipe group heads, purge steam wands
4. **Grinders** — empty hoppers, wipe out, run brush through burrs
5. **Dishes** — wash, dry, and put away everything
6. **Restock** — prepare tomorrow's opener for success
7. **Refrigeration** — store all perishables, check dates, discard expired items
8. **Trash** — empty all bins, replace liners, take trash out
9. **Floors** — sweep thoroughly, then mop
10. **POS** — close out the register, count the till

### The Closing Checklist

Complete every item on the closing checklist before leaving. Have a second person verify if possible.

### Security

- All equipment off (except what needs to stay on overnight)
- All doors locked
- Security system armed
- Lights off (leave security lights on if applicable)
- Double-check: is the back door locked?`
      },
    ]
  },
  {
    id: 'sp-m-pos',
    title: 'POS & Order Taking',
    description: 'Master the point-of-sale system and order-taking flow.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'sp-l-pos-1',
        moduleId: 'sp-m-pos',
        title: 'Taking Orders Like a Pro',
        type: 'CONTENT',
        content: `## The Order-Taking Flow

Taking orders accurately and efficiently is one of the most important skills in the shop. A wrong order wastes time, product, and trust.

### The Flow

1. **Greet** — "Welcome! What can I get started for you?"
2. **Listen** — Let them finish before entering anything
3. **Clarify** — Size? Hot or iced? Any milk preference?
4. **Enter** — Input the order into the POS accurately
5. **Read back** — Confirm the entire order before processing
6. **Payment** — Process payment and hand off receipt
7. **Thank** — "Thanks! We'll have that right up."

### Common Clarifying Questions

- "What size would you like?"
- "Hot or iced?"
- "Any milk preference? We have whole, oat, and almond."
- "Would you like any flavor added to that?"
- "Anything else I can get for you?"

### Suggestive Selling (Optional)

- "Would you like to add a pastry with that?"
- "Have you tried our [seasonal special]? It's really popular right now."

Keep it natural — never pushy. One suggestion per transaction max.

### Common Mistakes to Avoid

- Entering the wrong size
- Forgetting to mark milk substitutions
- Not confirming the order before sending it
- Rushing through the interaction
- Forgetting to ask about rewards or loyalty`
      },
      {
        id: 'sp-l-pos-2',
        moduleId: 'sp-m-pos',
        title: 'POS System Basics',
        type: 'CONTENT',
        content: `## Your POS System

The POS (Point of Sale) is the central hub for all orders and payments. Getting comfortable with it quickly will help you serve guests faster.

### Basic Operations

- **Finding items**: Use categories (Espresso, Tea, Food, etc.) or search
- **Modifying drinks**: Size, milk, add-ons, temperature
- **Applying discounts**: Only when approved by a manager
- **Processing payments**: Card, cash, mobile pay

### Tips for Speed

- Learn the most popular items' locations by heart
- Use shortcuts and favorites if your POS supports them
- Pre-enter orders during slow moments for practice
- Don't panic during rushes — accuracy over speed

### Handling Cash

- Count back change to the guest
- Keep bills organized in the drawer (face up, sorted by denomination)
- Never leave the drawer open
- Report any discrepancies immediately

### End of Shift

- Run your shift report
- Count your drawer
- Report any voids or discrepancies to your manager
- Sign off the POS system

### When Something Goes Wrong

- **Item won't ring up**: Ask a manager for help, don't guess the price
- **Payment declined**: Discreetly let the guest know and offer alternatives
- **System frozen**: Stay calm, apologize to guests, reboot if needed`
      },
      {
        id: 'sp-l-pos-quiz',
        moduleId: 'sp-m-pos',
        title: 'Order Taking Quiz',
        type: 'QUIZ',
        quizQuestions: [
          {
            id: 'sp-q7',
            type: 'MULTIPLE_CHOICE',
            question: 'After entering an order into the POS, what should you do before processing payment?',
            options: ['Start making the drink', 'Read the order back to the guest', 'Ask if they want to add a tip', 'Move on to the next guest'],
            correctAnswers: ['Read the order back to the guest'],
            explanation: 'Always confirm the order to catch mistakes before they happen.'
          },
          {
            id: 'sp-q8',
            type: 'MULTIPLE_CHOICE',
            question: 'A guest orders a "latte." What should you ask?',
            options: ['Nothing — just make a standard latte', 'What size, hot or iced, and milk preference', 'If they want whipped cream', 'If they have a rewards account'],
            correctAnswers: ['What size, hot or iced, and milk preference'],
            explanation: 'Always clarify size, temperature, and milk to avoid remakes.'
          },
        ]
      }
    ]
  },
];

// ── Additional Espresso Bar Curriculum ──

const espressoBarAdditionalCurriculum: TrainingModule[] = [
  {
    id: 'sp-m-espresso',
    title: 'Espresso Fundamentals',
    description: 'Master the science and art of pulling the perfect espresso shot.',
    category: 'BARISTA_SKILLS',
    lessons: [
      {
        id: 'sp-l-espresso-1',
        moduleId: 'sp-m-espresso',
        title: 'Understanding Extraction',
        type: 'CONTENT',
        content: `## The Science of Espresso

Espresso is the foundation of almost every drink you'll make. Understanding extraction is what separates a good barista from a great one.

### The Key Variables

1. **Dose** — The weight of ground coffee in the portafilter (typically 18–20g)
2. **Yield** — The weight of liquid espresso in the cup (typically 36–40g for a double)
3. **Time** — How long the extraction takes (typically 25–32 seconds)
4. **Grind Size** — Finer = slower extraction, coarser = faster
5. **Temperature** — Water temperature affects extraction rate

### The Extraction Spectrum

- **Under-extracted** (too fast/coarse): Sour, thin, weak, lacking sweetness
- **Well-extracted** (just right): Sweet, balanced, complex, pleasant finish
- **Over-extracted** (too slow/fine): Bitter, harsh, dry, astringent

### Dialing In

"Dialing in" is the process of adjusting your grind to achieve the target dose, yield, and time:

1. Dose your coffee (18–20g) — this stays consistent
2. Pull a shot and measure the yield and time
3. **Too fast?** → Make the grind FINER (smaller particles, more resistance)
4. **Too slow?** → Make the grind COARSER (larger particles, less resistance)
5. Taste the shot — does it taste balanced and sweet?
6. Repeat until you hit your target window

### The Routine

1. Purge the group head (brief water flush)
2. Dose coffee into portafilter
3. Distribute grounds evenly (use a distribution tool)
4. Tamp firmly and level
5. Lock in, start extraction immediately
6. Time the shot and weigh the output
7. Evaluate: Does it look right? Does it taste right?

### Pro Tips

- Always taste your shots — your palate is the final judge
- Grind fresh for every shot — stale grounds = bad espresso
- Keep your equipment clean — dirty machines make dirty coffee
- Log your settings — especially when you find the sweet spot`
      },
      {
        id: 'sp-l-espresso-2',
        moduleId: 'sp-m-espresso',
        title: 'Troubleshooting Espresso',
        type: 'CONTENT',
        content: `## Fixing Common Espresso Problems

Even experienced baristas need to troubleshoot. Here's how to diagnose and fix the most common issues.

### Shot Runs Too Fast (Under-Extracted)

**Symptoms**: Watery, sour, thin, blonde color
**Fix**: 
- Grind FINER (most common fix)
- Check dose — might be too low
- Check distribution — uneven puck causes channeling

### Shot Runs Too Slow (Over-Extracted)

**Symptoms**: Bitter, harsh, very dark, thin/watery at the end
**Fix**:
- Grind COARSER
- Check dose — might be too high
- Check for clumps in the grounds

### Channeling

**Symptoms**: Uneven flow, spurting, one side flows faster
**What's happening**: Water finds weak spots in the coffee puck and rushes through
**Fix**:
- Improve distribution technique
- Level the tamp
- Check for damage to the portafilter basket

### Inconsistent Shots

**Possible causes**:
- Inconsistent dose (weigh every time!)
- Stale coffee (check roast date)
- Dirty equipment
- Temperature fluctuations

### Daily Maintenance Checklist

- Backflush with cleaner at end of day
- Wipe group heads after every shot
- Purge steam wand after every use
- Clean drip tray when full
- Wipe portafilter basket clean between shots`
      },
      {
        id: 'sp-l-espresso-quiz',
        moduleId: 'sp-m-espresso',
        title: 'Espresso Knowledge Check',
        type: 'QUIZ',
        quizQuestions: [
          {
            id: 'sp-q9',
            type: 'MULTIPLE_CHOICE',
            question: 'Your shot pulls too fast and tastes sour. What should you do?',
            options: ['Grind coarser', 'Grind finer', 'Use less coffee', 'Increase water temperature'],
            correctAnswers: ['Grind finer'],
            explanation: 'A finer grind slows the extraction, allowing more flavor to be extracted.'
          },
          {
            id: 'sp-q10',
            type: 'MULTIPLE_CHOICE',
            question: 'What is the typical dose for a double espresso shot?',
            options: ['8–10g', '14–16g', '18–20g', '24–26g'],
            correctAnswers: ['18–20g'],
            explanation: 'Most specialty shops use 18–20g as a standard double dose.'
          },
          {
            id: 'sp-q11',
            type: 'MULTIPLE_CHOICE',
            question: 'What are the three key variables when dialing in espresso?',
            options: ['Color, speed, taste', 'Dose, yield, time', 'Grind, temperature, pressure', 'Water, milk, syrup'],
            correctAnswers: ['Dose, yield, time'],
            explanation: 'Dose (input), yield (output), and time are the primary variables you control.'
          },
        ]
      }
    ]
  },
  {
    id: 'sp-m-milk',
    title: 'Milk Steaming & Latte Art',
    description: 'Learn proper milk steaming techniques and the basics of latte art.',
    category: 'BARISTA_SKILLS',
    lessons: [
      {
        id: 'sp-l-milk-1',
        moduleId: 'sp-m-milk',
        title: 'Milk Steaming Technique',
        type: 'CONTENT',
        content: `## Steaming Perfect Milk

Properly steamed milk is silky, sweet, and velvety. Bad milk is scorched, foamy, or thin. The difference is technique.

### Temperature Targets

- **Ideal serving temp**: 140–150°F (60–65°C)
- **Maximum**: 160°F (71°C) — beyond this, milk burns and tastes bitter
- **"Extra hot" request**: 160°F max, no higher
- **Kids' temp**: 120°F (49°C) — safe for children

### The Two Phases

**Phase 1: Stretching (Aerating)**
- Position the steam tip just below the surface
- You should hear a gentle "tsss tsss" — paper-tearing sound
- This introduces air and creates microfoam
- Duration: 2–4 seconds for lattes, longer for cappuccinos

**Phase 2: Spinning (Texturing)**
- Submerge the tip deeper
- Create a whirlpool motion
- This breaks up large bubbles and creates smooth, glossy texture
- Continue until target temperature is reached

### Milk Types

| Milk | Steaming Notes |
|------|---------------|
| **Whole** | Most forgiving, creamy texture, sweet |
| **2%** | Slightly thinner, still steams well |
| **Oat** | Steams great, watch temp (burns easier) |
| **Almond** | Harder to foam, best results with barista blends |
| **Coconut** | Thin, less foam, sweet flavor |

### Common Mistakes

- **Too much air** = big bubbles, dry foam (cappuccino texture for a latte)
- **Too little air** = flat, no texture, just hot milk
- **Too hot** = burnt, scalded, bitter taste
- **Dirty wand** = old milk contamination, gross

### After Every Use

1. Wipe the steam wand with a clean cloth immediately
2. Purge steam for 2 seconds to clear residual milk
3. Never let milk dry on the wand`
      },
      {
        id: 'sp-l-milk-2',
        moduleId: 'sp-m-milk',
        title: 'Introduction to Latte Art',
        type: 'CONTENT',
        content: `## Latte Art Basics

Latte art is the visual finish on your drink. It shows the guest that care and skill went into their beverage. 

### Prerequisites

Before attempting latte art, you need:
- Properly steamed microfoam (glossy, no visible bubbles)
- A well-extracted espresso with good crema
- A steady hand and patience

### The Heart (Your First Pattern)

1. Pour from about 3 inches above the cup (thin stream)
2. When the cup is about 60% full, bring the pitcher closer to the surface
3. Increase flow rate — the white foam will start to appear on the surface
4. When the cup is nearly full, lift the pitcher and slice through the center
5. The foam will fold into a heart shape

### The Rosetta (Next Level)

1. Start the same as the heart
2. When the foam starts to appear, gently wiggle the pitcher side to side
3. Slowly pull the pitcher toward you while wiggling
4. The foam creates leaf-like layers
5. Finish by slicing through the center from base to tip

### Practice Tips

- Practice with water and dish soap first (creates similar foam)
- Speed up when pouring through, slow down when creating the pattern
- Consistency comes from repetition — aim for 100 pours to see improvement
- Watch videos of professional baristas for visual reference

### Remember

Latte art is a bonus — a beautiful presentation on a great-tasting drink. Never sacrifice speed or quality for art. A perfectly steamed, delicious latte without art is always better than a pretty one that tastes bad.`
      },
    ]
  },
  {
    id: 'sp-m-drink-building',
    title: 'Drink Building',
    description: 'Learn how to construct hot, iced, and blended beverages consistently.',
    category: 'BARISTA_SKILLS',
    lessons: [
      {
        id: 'sp-l-drinks-1',
        moduleId: 'sp-m-drink-building',
        title: 'Hot & Iced Drink Construction',
        type: 'CONTENT',
        content: `## Building Drinks Consistently

Every drink follows a pattern. Once you learn the patterns, you can make any drink on the menu.

### Hot Drink Pattern

1. **Cup** — Select correct size
2. **Syrup/Sauce** — Add flavor to the cup first
3. **Espresso** — Pull shot directly into the cup (dissolves syrup)
4. **Milk** — Steam and pour
5. **Finish** — Lid, stir stick if needed, to the handoff

### Iced Drink Pattern

1. **Mixing vessel** — Add syrup + espresso to a shaker or mixing glass
2. **Milk** — Add cold milk to the line
3. **Shake/Stir** — Mix thoroughly
4. **Ice cup** — Fill a cup with ice
5. **Pour** — Pour the mixed drink over ice
6. **Finish** — Lid, straw, to the handoff

### Classic Drink Builds

**Latte (Hot)**
- 2 shots espresso + steamed milk + optional flavor

**Latte (Iced)**
- 2 shots espresso + cold milk + ice + optional flavor

**Americano (Hot)**
- 2 shots espresso + hot water

**Americano (Iced)**
- 3 shots espresso + cold water + ice

**Cappuccino**
- 2 shots espresso + steamed milk with EXTRA foam (dry texture)

**Cortado**
- 2 shots espresso + equal part steamed milk (small, 4oz)

### Workflow Tips

- Always label your cups (especially during rushes)
- Make drinks in ticket order — first in, first out
- Communicate with your team — "I need steam!" or "Two shots pulling!"
- Keep your station clean as you go — don't let it pile up`
      },
      {
        id: 'sp-l-drinks-2',
        moduleId: 'sp-m-drink-building',
        title: 'Blended & Specialty Drinks',
        type: 'CONTENT',
        content: `## Beyond the Basics

Some drinks require special techniques or equipment. Here's how to handle them.

### Blended/Frozen Drinks

1. Add liquid ingredients first (milk, coffee base)
2. Add syrups/sauces
3. Add ice last
4. Blend until smooth — no chunks
5. Pour and serve immediately

**Pro tip**: Don't over-blend. It melts the ice and makes the drink watery.

### Matcha Drinks

1. Measure matcha powder carefully (too much = bitter, too little = weak)
2. Whisk or blend matcha with a small amount of water first to prevent clumps
3. Add milk and sweetener
4. For iced: shake with ice for a frothy texture

### Chai Drinks

- **Iced Chai**: Chai concentrate + milk (typically 1:1 ratio), shaken with ice
- **Hot Chai**: Chai concentrate + steamed milk (typically 1:1 ratio)
- Always check your shop's specific ratios

### Tea

- Use the correct water temperature for the tea type
- Steep for the recommended time (typically 3–5 minutes)
- Never squeeze the tea bag — it releases bitter tannins

### Quality Check Before Handoff

Before every drink leaves your hands:
- ✓ Correct size?
- ✓ Correct temperature (hot/iced)?
- ✓ Correct milk?
- ✓ Label matches the drink?
- ✓ Lid secure?
- ✓ Looks appetizing?`
      },
    ]
  },
  {
    id: 'sp-m-menu',
    title: 'Menu Knowledge',
    description: 'Know every drink on the menu and how to guide guests.',
    category: 'BARISTA_SKILLS',
    lessons: [
      {
        id: 'sp-l-menu-1',
        moduleId: 'sp-m-menu',
        title: 'Common Drinks & Customizations',
        type: 'CONTENT',
        content: `## Know Your Menu

Every barista should be able to explain any drink on the menu and suggest alternatives based on a guest's preferences.

### The Espresso Family

| Drink | Description | Size |
|-------|------------|------|
| **Espresso** | Straight shots, no additions | 2oz |
| **Macchiato** | Espresso "marked" with a dollop of foam | 3oz |
| **Cortado** | Equal parts espresso and steamed milk | 4oz |
| **Flat White** | Espresso with thin microfoam, no dry foam | 8oz |
| **Cappuccino** | Espresso with thick, airy foam | 6oz |
| **Latte** | Espresso with steamed milk, thin foam | 12–20oz |
| **Americano** | Espresso diluted with hot water | 12–16oz |
| **Mocha** | Latte + chocolate sauce | 12–20oz |

### Common Customizations

- **Extra shot**: Additional espresso shot
- **Decaf**: Use decaf beans (some shops do half-caf)
- **Alt milk**: Oat, almond, coconut, soy
- **Vanilla / Caramel / Hazelnut**: Most popular flavor add-ons
- **Light ice**: Less ice in iced drinks
- **Extra hot**: Steam milk to 160°F
- **Sweet cream**: Cold foam made with cream and vanilla

### Helping Guests Choose

When a guest says "I don't know what to get," ask:
1. "Do you prefer hot or iced?"
2. "Do you like it sweet or more coffee-forward?"
3. "Milk-based or black coffee?"

Based on their answers, you can point them to the right drink. Be the expert!

### Seasonal & Signature Drinks

- Learn your shop's current specials
- Know what's in them and how to describe the flavor
- Suggest seasonals to guests who want to try something new`
      },
      {
        id: 'sp-l-menu-quiz',
        moduleId: 'sp-m-menu',
        title: 'Menu Knowledge Quiz',
        type: 'QUIZ',
        quizQuestions: [
          {
            id: 'sp-q12',
            type: 'MULTIPLE_CHOICE',
            question: 'What is a cortado?',
            options: ['Espresso with extra foam', 'Equal parts espresso and steamed milk', 'Espresso with chocolate', 'Espresso diluted with water'],
            correctAnswers: ['Equal parts espresso and steamed milk'],
            explanation: 'A cortado is a balanced 4oz drink with equal espresso and milk.'
          },
          {
            id: 'sp-q13',
            type: 'MULTIPLE_CHOICE',
            question: 'What is the key difference between a latte and a cappuccino?',
            options: ['Different espresso dose', 'Cappuccino has more foam and less liquid milk', 'Latte is always iced', 'Cappuccino uses decaf'],
            correctAnswers: ['Cappuccino has more foam and less liquid milk'],
            explanation: 'Cappuccinos have a thick, airy foam layer. Lattes have mostly steamed milk with thin foam.'
          },
        ]
      }
    ]
  }
];

// ── Recipes ──

const essentialsRecipes: Recipe[] = [
  {
    id: 'sp-r-latte',
    title: 'Latte',
    category: 'Espresso Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Espresso', quantity: '2 shots' },
      { name: 'Steamed Milk', quantity: 'Fill to size' },
    ],
    steps: [
      'Pull double shot into cup',
      'Add syrup/flavor if requested',
      'Steam milk to 140–150°F with thin microfoam',
      'Pour milk over espresso',
      'Lid and serve',
    ],
    notes: 'Hot: 12oz or 16oz. Iced: shake espresso + milk + ice.'
  },
  {
    id: 'sp-r-cappuccino',
    title: 'Cappuccino',
    category: 'Espresso Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Espresso', quantity: '2 shots' },
      { name: 'Steamed Milk', quantity: '~4oz with extra foam' },
    ],
    steps: [
      'Pull double shot into 6oz cup',
      'Steam milk with extra aeration (thick, dry foam)',
      'Pour, holding back foam, then spoon foam on top',
    ],
    notes: 'Traditional cappuccino is 6oz. Equal parts espresso, milk, foam.'
  },
  {
    id: 'sp-r-americano',
    title: 'Americano',
    category: 'Espresso Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Espresso', quantity: '2 shots (hot) / 3 shots (iced)' },
      { name: 'Water', quantity: 'Fill to size' },
    ],
    steps: [
      'Pull shots',
      'Hot: Add hot water to espresso',
      'Iced: Add cold water and ice',
    ],
    notes: 'Simple and clean. A good test of your espresso quality.'
  },
  {
    id: 'sp-r-drip',
    title: 'Drip Coffee',
    category: 'Brewed Coffee',
    type: 'BATCH',
    ingredients: [
      { name: 'Ground Coffee', quantity: 'Per your brewer\'s ratio' },
      { name: 'Filtered Water', quantity: 'Per batch size' },
    ],
    steps: [
      'Grind fresh coffee to medium grind',
      'Place filter in brew basket',
      'Add grounds evenly',
      'Start brew cycle',
      'Label with brew time — discard after 1 hour',
    ],
    notes: 'Always taste before serving. Brew fresh batches regularly.'
  },
  {
    id: 'sp-r-cold-brew',
    title: 'Cold Brew',
    category: 'Brewed Coffee',
    type: 'BATCH',
    ingredients: [
      { name: 'Coarse Ground Coffee', quantity: '1 lb (454g)' },
      { name: 'Cold Filtered Water', quantity: '1 gallon' },
    ],
    steps: [
      'Grind coffee coarse (like raw sugar)',
      'Combine coffee and water in brewing vessel',
      'Stir gently to saturate all grounds',
      'Steep for 12–18 hours at room temp or in fridge',
      'Strain through fine mesh filter',
      'Store concentrate in fridge — dilute 1:1 with water to serve',
    ],
    notes: 'Cold brew concentrate lasts 7–10 days refrigerated. Smooth, low acidity.'
  },
];

const espressoBarAdditionalRecipes: Recipe[] = [
  {
    id: 'sp-r-mocha',
    title: 'Mocha',
    category: 'Espresso Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Espresso', quantity: '2 shots' },
      { name: 'Chocolate Sauce', quantity: '1–2 pumps' },
      { name: 'Steamed Milk', quantity: 'Fill to size' },
    ],
    steps: [
      'Add chocolate sauce to cup',
      'Pull double shot over chocolate — stir to dissolve',
      'Steam milk and pour',
      'Optional: top with whipped cream',
    ],
    notes: 'A classic crowd-pleaser. Great for guests who love chocolate.'
  },
  {
    id: 'sp-r-vanilla-latte',
    title: 'Vanilla Latte',
    category: 'Espresso Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Espresso', quantity: '2 shots' },
      { name: 'Vanilla Syrup', quantity: '1oz' },
      { name: 'Steamed Milk', quantity: 'Fill to size' },
    ],
    steps: [
      'Add vanilla syrup to cup',
      'Pull double shot',
      'Steam milk and pour',
    ],
  },
  {
    id: 'sp-r-caramel-macchiato',
    title: 'Caramel Macchiato',
    category: 'Espresso Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Vanilla Syrup', quantity: '1oz' },
      { name: 'Steamed Milk', quantity: 'Fill to size' },
      { name: 'Espresso', quantity: '2 shots (poured on top)' },
      { name: 'Caramel Drizzle', quantity: 'Crosshatch on top' },
    ],
    steps: [
      'Add vanilla syrup to cup',
      'Steam milk and pour into cup',
      'Gently pour espresso shots on top (they sit on the foam)',
      'Drizzle caramel sauce in crosshatch pattern',
    ],
    notes: 'Espresso goes on TOP — that\'s what makes it a "macchiato" (marked).'
  },
  {
    id: 'sp-r-matcha-latte',
    title: 'Matcha Latte',
    category: 'Specialty',
    type: 'STANDARD',
    ingredients: [
      { name: 'Matcha Powder', quantity: '2 scoops (or per shop standard)' },
      { name: 'Hot Water', quantity: '1–2oz (to dissolve)' },
      { name: 'Milk', quantity: 'Fill to size' },
      { name: 'Sweetener', quantity: 'Optional — vanilla or honey' },
    ],
    steps: [
      'Add matcha powder and a splash of hot water',
      'Whisk vigorously until smooth (no clumps)',
      'Hot: steam milk and pour over matcha',
      'Iced: add cold milk, shake, pour over ice',
    ],
    notes: 'Matcha settles quickly — always whisk/blend before serving.'
  },
  {
    id: 'sp-r-chai-latte',
    title: 'Chai Latte',
    category: 'Specialty',
    type: 'STANDARD',
    ingredients: [
      { name: 'Chai Concentrate', quantity: 'Half the cup' },
      { name: 'Milk', quantity: 'Half the cup' },
    ],
    steps: [
      'Hot: Combine chai and milk, steam together with mild aeration',
      'Iced: Add chai and milk to shaker, shake with ice, pour',
    ],
    notes: 'Typically a 1:1 ratio. Adjust sweetness by varying the concentrate amount.'
  },
  {
    id: 'sp-r-iced-coffee',
    title: 'Iced Coffee',
    category: 'Brewed Coffee',
    type: 'STANDARD',
    ingredients: [
      { name: 'Brewed Coffee (double-strength or flash-brewed)', quantity: 'Fill to size' },
      { name: 'Ice', quantity: 'Full cup' },
    ],
    steps: [
      'Brew coffee at double strength or flash brew over ice',
      'Fill cup with ice',
      'Pour coffee over ice',
      'Add milk/cream/sweetener as requested',
    ],
  },
  {
    id: 'sp-r-iced-vanilla-latte',
    title: 'Iced Vanilla Latte',
    category: 'Espresso Drinks',
    type: 'STANDARD',
    ingredients: [
      { name: 'Espresso', quantity: '2 shots' },
      { name: 'Vanilla Syrup', quantity: '1oz' },
      { name: 'Cold Milk', quantity: 'Fill to line' },
      { name: 'Ice', quantity: 'Full cup' },
    ],
    steps: [
      'Add vanilla syrup and espresso to mixing glass',
      'Add cold milk',
      'Shake or stir well',
      'Pour over fresh ice',
    ],
  },
];

// ── Manual Sections ──

const essentialsManual: ManualSection[] = [
  {
    id: 'sp-s-welcome',
    number: 1,
    title: 'Welcome',
    content: `### Welcome to the Team!

Welcome to our operations manual. This guide covers everything you need to know about how we run our shop — from daily procedures to quality standards.

### Our Mission

We're here to serve great coffee and create an environment where people feel welcome. Every team member plays a vital role in making that happen.

### How to Use This Manual

- Read through each section during your first week
- Reference it whenever you have questions
- If something isn't covered here, ask your manager
- This is a living document — it will be updated as we grow

### Your Success

Your success is our success. Ask questions, stay curious, and take pride in your craft. Let's make great coffee together.`
  },
  {
    id: 'sp-s-standards',
    number: 2,
    title: 'Quality Standards',
    content: `### Our Standards

Everything we do comes back to three things:

1. **Speed** — Efficient service that respects our guests' time
2. **Quality** — Excellence in every drink, every interaction
3. **Consistency** — The same great experience, every visit

### Drink Quality

- Follow recipes exactly — don't freestyle
- Taste your espresso daily during dial-in
- Use fresh ingredients — check dates
- If a drink doesn't look or taste right, remake it

### Cleanliness

- Clean as you go — never let messes pile up
- Every surface should be wiped down regularly
- Equipment maintenance is everyone's job
- End-of-day deep clean is non-negotiable

### Guest Experience

- Greet every guest warmly
- Know the menu — be the expert
- Handle complaints with empathy and speed
- Say thank you — genuinely`
  },
  {
    id: 'sp-s-procedures',
    number: 3,
    title: 'Daily Procedures',
    content: `### Opening Procedures

The opener arrives early to prepare the shop for the day. Key tasks:
- Power up all equipment
- Dial in espresso
- Stock all stations
- Brew first batch of drip coffee
- Complete the opening checklist

### Mid-Day Operations

- Keep stations stocked between rushes
- Rotate product (FIFO)
- Brew fresh batches of drip as needed
- Communicate with your team about needs

### Closing Procedures

The closer is responsible for leaving the shop ready for tomorrow:
- Clean all equipment thoroughly
- Restock for the morning opener
- Complete the closing checklist
- Secure the building

### Shift Changes

- Brief the next shift on anything important
- Note any equipment issues
- Communicate inventory needs
- Don't leave without completing your tasks`
  },
  {
    id: 'sp-s-recipes',
    number: 4,
    title: 'Recipe Standards',
    content: `### Recipe Standards

Consistency is king. Every drink should taste the same regardless of who makes it or when it's made.

### Following Recipes

- Measure ingredients — don't eyeball
- Follow the build order specified in each recipe
- Use the correct cup size
- Steam milk to the correct temperature

### Espresso Standards

- Dose: Follow your shop's standard (typically 18–20g)
- Yield: Double the dose (typically 36–40g)
- Time: 25–32 seconds for a double shot
- Taste: Balanced, sweet, no sour or bitter notes

### Customizations

When guests request modifications:
- Note changes on the cup
- Charge accordingly per your POS
- Common mods: extra shot, alt milk, add flavor, adjust sweetness, temperature preferences

### New Drinks

When a new menu item is introduced:
- Attend the training session or review the recipe card
- Make the drink for yourself first to learn the build
- Ask questions if anything is unclear
- Practice before the launch date`
  },
];

// ── Pack Generator ──

export function getStarterPack(packId: string, storeIds: string[]): StarterPack {
  switch (packId) {
    case 'essentials':
      return {
        id: 'essentials',
        name: 'Coffee Shop Essentials',
        icon: '☕',
        description: 'Basic hospitality, food safety, customer service training + standard opening/closing checklists.',
        curriculum: essentialsCurriculum,
        templates: storeIds.flatMap(sid => [openingChecklist(sid), closingChecklist(sid)]),
        recipes: essentialsRecipes,
        manual: essentialsManual,
      };

    case 'espresso-bar':
      return {
        id: 'espresso-bar',
        name: 'Espresso Bar',
        icon: '🎯',
        description: 'Everything in Essentials PLUS espresso training, milk steaming, drink recipes, and weekly cleaning.',
        curriculum: [...essentialsCurriculum, ...espressoBarAdditionalCurriculum],
        templates: storeIds.flatMap(sid => [openingChecklist(sid), closingChecklist(sid), weeklyCleaningChecklist(sid)]),
        recipes: [...essentialsRecipes, ...espressoBarAdditionalRecipes],
        manual: essentialsManual,
      };

    case 'checklists-only':
      return {
        id: 'checklists-only',
        name: 'Checklists Only',
        icon: '📋',
        description: 'Just opening/closing/weekly checklists. No training curriculum or recipes — build from scratch.',
        curriculum: [],
        templates: storeIds.flatMap(sid => [openingChecklist(sid), closingChecklist(sid), weeklyCleaningChecklist(sid)]),
        recipes: [],
        manual: [],
      };

    case 'blank':
      return {
        id: 'blank',
        name: 'Blank Slate',
        icon: '📝',
        description: 'Start completely fresh. Empty everything — build your own curriculum, checklists, and recipes.',
        curriculum: [],
        templates: [],
        recipes: [],
        manual: [],
      };

    default:
      return {
        id: 'blank',
        name: 'Blank Slate',
        icon: '📝',
        description: 'Start fresh.',
        curriculum: [],
        templates: [],
        recipes: [],
        manual: [],
      };
  }
}

export const STARTER_PACK_OPTIONS = [
  {
    id: 'essentials',
    name: 'Coffee Shop Essentials',
    icon: '☕',
    description: 'Basic hospitality, food safety, customer service training + standard opening/closing checklists.',
    details: '4 training modules • 2 checklists per store • 5 recipes • Operations manual',
  },
  {
    id: 'espresso-bar',
    name: 'Espresso Bar',
    icon: '🎯',
    description: 'Everything in Essentials PLUS espresso training, milk steaming, drink building, and menu knowledge.',
    details: '8 training modules • 3 checklists per store • 12 recipes • Operations manual',
  },
  {
    id: 'checklists-only',
    name: 'Checklists Only',
    icon: '📋',
    description: 'Just opening, closing, and weekly cleaning checklists. No training curriculum or recipes.',
    details: '0 training modules • 3 checklists per store • 0 recipes • No manual',
  },
  {
    id: 'blank',
    name: 'Blank Slate',
    icon: '📝',
    description: 'Start completely from scratch. Build everything yourself in the Manager Hub.',
    details: 'Empty — full creative control',
  },
];
