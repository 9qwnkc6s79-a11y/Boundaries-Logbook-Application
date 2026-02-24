import { TrainingModule } from '../types';

export const NEW_TRAINING_MODULES: TrainingModule[] = [
  // ─── MODULE 17: MATCHAS ───────────────────────────────────────────────
  {
    id: 'm-matchas',
    title: 'Module 17: Matchas',
    description: 'Master matcha drink recipes and measurement standards.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-matchas-content',
        moduleId: 'm-matchas',
        title: 'Matcha Recipe Standards',
        type: 'CONTENT' as const,
        content: `<p>Matcha drinks come in 4 size/temperature combinations. The key is understanding that "small" and "large" mean different things for hot vs. iced.</p>

<h3>Sizes &amp; Temperatures</h3>
<table>
  <thead><tr><th>Temp</th><th>Small</th><th>Large</th></tr></thead>
  <tbody>
    <tr><td>Hot</td><td>12 oz</td><td>16 oz</td></tr>
    <tr><td>Iced</td><td>16 oz</td><td>20 oz</td></tr>
  </tbody>
</table>

<h3>Matcha Concentrate</h3>
<ul>
  <li>Small sizes (Hot 12 oz / Iced 16 oz) → 1 oz concentrate</li>
  <li>Large sizes (Hot 16 oz / Iced 20 oz) → 1.5 oz concentrate</li>
  <li>Extra matcha → +0.5 oz added to base amount</li>
</ul>

<h3>Syrup</h3>
<ul>
  <li>ALL matchas get 1 oz total syrup regardless of size or temperature</li>
</ul>

<h3>Milk Amounts</h3>
<table>
  <thead><tr><th>Drink</th><th>Milk</th></tr></thead>
  <tbody>
    <tr><td>Hot 12 oz</td><td>8 oz steamed milk</td></tr>
    <tr><td>Hot 16 oz</td><td>10 oz steamed milk</td></tr>
    <tr><td>Iced 16 oz</td><td>Fill to 11 oz line</td></tr>
    <tr><td>Iced 20 oz</td><td>Fill to 14 oz line</td></tr>
  </tbody>
</table>

<h3>Matcha Base Batch Recipe</h3>
<ul>
  <li>30g matcha powder + 300ml water</li>
  <li>Mix thoroughly before use</li>
</ul>

<h3>Key Points to Memorize</h3>
<ol>
  <li>Small = 1 oz concentrate, Large = 1.5 oz concentrate</li>
  <li>Syrup is ALWAYS 1 oz total (all sizes)</li>
  <li>Extra matcha = +0.5 oz</li>
</ol>`
      },
      {
        id: 'l-matchas-quiz',
        moduleId: 'm-matchas',
        title: 'Matchas Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'ma1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much matcha concentrate goes in a 16oz ICED matcha?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: '16oz iced is the "small" iced size, so it gets 1 oz of matcha concentrate.'
          },
          {
            id: 'ma2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much matcha concentrate goes in a 16oz HOT matcha?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '16oz hot is the "large" hot size, so it gets 1.5 oz of matcha concentrate.'
          },
          {
            id: 'ma3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much total syrup goes in a 20oz iced matcha?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: 'ALL matchas get 1 oz total syrup regardless of size.'
          },
          {
            id: 'ma4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'A customer orders a 12oz hot matcha with extra matcha. How much concentrate total?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '12oz hot is small (1 oz base) + 0.5 oz extra matcha = 1.5 oz total.'
          },
          {
            id: 'ma5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the milk fill line for a 20oz iced matcha?',
            options: ['9 oz', '11 oz', '14 oz', '17 oz'],
            correctAnswers: ['14 oz'],
            explanation: 'Iced 20oz matchas get milk filled to the 14 oz line.'
          },
          {
            id: 'ma6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much steamed milk goes in a 12oz hot matcha pitcher?',
            options: ['6 oz', '8 oz', '10 oz', '12 oz'],
            correctAnswers: ['8 oz'],
            explanation: 'A 12oz hot matcha gets 8 oz of steamed milk.'
          },
          {
            id: 'ma7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the matcha base batch recipe?',
            options: ['20g matcha + 200ml water', '30g matcha + 300ml water', '40g matcha + 400ml water', '50g matcha + 500ml water'],
            correctAnswers: ['30g matcha + 300ml water'],
            explanation: 'The standard matcha base batch is 30g matcha powder mixed with 300ml water.'
          },
          {
            id: 'ma8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'A Strawberry Dream matcha has 0.5 oz strawberry + 0.5 oz vanilla. Does this change based on size?',
            options: ['Yes, double it for large sizes', 'Yes, add 0.5 oz more for large', 'No, it\'s always 1 oz total syrup', 'No, but add extra for iced'],
            correctAnswers: ['No, it\'s always 1 oz total syrup'],
            explanation: 'All matchas get 1 oz total syrup regardless of size. Multi-flavor matchas divide that 1 oz among flavors.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 18: NITRO COLD BREW ──────────────────────────────────────
  {
    id: 'm-nitro',
    title: 'Module 18: Nitro Cold Brew',
    description: 'Learn nitro cold brew builds and flavor variations.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-nitro-content',
        moduleId: 'm-nitro',
        title: 'Nitro Cold Brew Standards',
        type: 'CONTENT' as const,
        content: `<p>Nitro cold brew has a simple, consistent build that stays the same across all sizes.</p>

<h3>Standard Build (All Sizes)</h3>
<ol>
  <li>Cup size with 1 scoop ice</li>
  <li>Fill nitro from tap to the 2nd-to-last line</li>
  <li>3 oz sweet cream</li>
  <li>0.5 oz flavor syrup</li>
</ol>

<h3>Flavor Options</h3>
<table>
  <thead><tr><th>Flavor</th><th>Syrup / Sauce</th></tr></thead>
  <tbody>
    <tr><td>Vanilla Cream</td><td>0.5 oz Vanilla syrup</td></tr>
    <tr><td>Salted Caramel</td><td>0.5 oz Salted Caramel syrup</td></tr>
    <tr><td>Cookie Butter</td><td>0.5 oz Biscoff syrup + 10g White Chocolate sauce</td></tr>
  </tbody>
</table>

<h3>Key Points to Memorize</h3>
<ul>
  <li>Always 1 scoop ice</li>
  <li>Fill nitro to 2nd-to-last line</li>
  <li>Always 3 oz sweet cream</li>
  <li>Always 0.5 oz flavor (except Cookie Butter which adds 10g white choc)</li>
</ul>`
      },
      {
        id: 'l-nitro-quiz',
        moduleId: 'm-nitro',
        title: 'Nitro Cold Brew Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'ni1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much ice goes in a nitro?',
            options: ['Fill cup with ice', '2 scoops', '1 scoop', 'No ice'],
            correctAnswers: ['1 scoop'],
            explanation: 'All nitro cold brews get exactly 1 scoop of ice.'
          },
          {
            id: 'ni2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Where do you fill the nitro to?',
            options: ['Top line', '2nd-to-last line', 'Halfway', '3rd line from bottom'],
            correctAnswers: ['2nd-to-last line'],
            explanation: 'Fill nitro from the tap to the 2nd-to-last line on the cup.'
          },
          {
            id: 'ni3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much sweet cream goes in a nitro?',
            options: ['1 oz', '2 oz', '3 oz', '4 oz'],
            correctAnswers: ['3 oz'],
            explanation: 'All nitro cold brews get 3 oz of sweet cream.'
          },
          {
            id: 'ni4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much vanilla syrup goes in a Vanilla Cream nitro?',
            options: ['0.25 oz', '0.5 oz', '1 oz', '1.5 oz'],
            correctAnswers: ['0.5 oz'],
            explanation: 'Vanilla Cream nitro gets 0.5 oz of Vanilla syrup.'
          },
          {
            id: 'ni5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What makes Cookie Butter different from other nitro flavors?',
            options: ['It uses 1 oz syrup instead of 0.5 oz', 'It uses Biscoff syrup + 10g White Chocolate sauce', 'It doesn\'t get sweet cream', 'It gets 2 scoops of ice'],
            correctAnswers: ['It uses Biscoff syrup + 10g White Chocolate sauce'],
            explanation: 'Cookie Butter is unique — it combines 0.5 oz Biscoff syrup with 10g White Chocolate sauce.'
          },
          {
            id: 'ni6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'A customer orders a large nitro vs a small nitro. What changes?',
            options: ['More sweet cream for large', 'More syrup for large', 'More ice for large', 'Cup size changes, but build stays the same'],
            correctAnswers: ['Cup size changes, but build stays the same'],
            explanation: 'The build is identical across all sizes. Only the cup size changes.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 19: ENERGY DRINKS (LOTUS) ────────────────────────────────
  {
    id: 'm-energy',
    title: 'Module 19: Energy Drinks (Lotus)',
    description: 'Learn energy drink syrup amounts, fill lines, and multi-flavor builds.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-energy-content',
        moduleId: 'm-energy',
        title: 'Energy Drink Standards',
        type: 'CONTENT' as const,
        content: `<p>Energy drinks come in 4 sizes: 12oz, 16oz, 20oz, 24oz.</p>

<h3>Syrup Amounts by Size</h3>
<table>
  <thead><tr><th>Size</th><th>Syrup</th><th>Fill Line</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>0.5 oz</td><td>9 oz</td></tr>
    <tr><td>16 oz</td><td>1 oz</td><td>11 oz</td></tr>
    <tr><td>20 oz</td><td>1.5 oz</td><td>14 oz</td></tr>
    <tr><td>24 oz</td><td>2 oz</td><td>16 oz</td></tr>
  </tbody>
</table>

<h3>Multi-Flavor Drinks</h3>
<p>When a drink has multiple flavors, divide the total syrup equally among them.</p>
<ul>
  <li>The Drift (Strawberry &amp; Pineapple) in 16 oz = 1 oz total ÷ 2 flavors = 0.5 oz each</li>
</ul>

<h3>Pattern to Memorize</h3>
<p>12oz = 0.5 oz, 16oz = 1 oz, 20oz = 1.5 oz, 24oz = 2 oz</p>`
      },
      {
        id: 'l-energy-quiz',
        moduleId: 'm-energy',
        title: 'Energy Drinks Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'en1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much total syrup goes in a 12oz energy drink?',
            options: ['0.25 oz', '0.5 oz', '1 oz', '1.5 oz'],
            correctAnswers: ['0.5 oz'],
            explanation: '12oz energy drinks get 0.5 oz of syrup.'
          },
          {
            id: 'en2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much total syrup goes in a 16oz energy drink?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: '16oz energy drinks get 1 oz of syrup.'
          },
          {
            id: 'en3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much total syrup goes in a 24oz energy drink?',
            options: ['1.5 oz', '2 oz', '2.5 oz', '3 oz'],
            correctAnswers: ['2 oz'],
            explanation: '24oz energy drinks get 2 oz of syrup.'
          },
          {
            id: 'en4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the fill line for a 20oz energy drink?',
            options: ['11 oz', '14 oz', '16 oz', '17 oz'],
            correctAnswers: ['14 oz'],
            explanation: 'The 20oz energy drink fill line is 14 oz.'
          },
          {
            id: 'en5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'The Drift has Strawberry & Pineapple. In a 20oz, how much of EACH syrup?',
            options: ['0.5 oz each', '0.75 oz each', '1 oz each', '1.5 oz each'],
            correctAnswers: ['0.75 oz each'],
            explanation: '20oz = 1.5 oz total syrup ÷ 2 flavors = 0.75 oz each.'
          },
          {
            id: 'en6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Electric B has Blue Raspberry & Lime. In a 12oz, how much of EACH syrup?',
            options: ['0.25 oz each', '0.5 oz each', '0.75 oz each', '1 oz each'],
            correctAnswers: ['0.25 oz each'],
            explanation: '12oz = 0.5 oz total syrup ÷ 2 flavors = 0.25 oz each.'
          },
          {
            id: 'en7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the fill line for a 12oz energy drink?',
            options: ['7 oz', '9 oz', '11 oz', '14 oz'],
            correctAnswers: ['9 oz'],
            explanation: 'The 12oz energy drink fill line is 9 oz.'
          },
          {
            id: 'en8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the syrup pattern for energy drinks (12/16/20/24)?',
            options: ['0.5 / 1 / 1.5 / 2', '1 / 1.5 / 2 / 2', '1 / 1 / 1.5 / 1.5', '0.5 / 0.5 / 1 / 1'],
            correctAnswers: ['0.5 / 1 / 1.5 / 2'],
            explanation: 'The energy drink syrup pattern is 0.5 / 1 / 1.5 / 2, increasing by 0.5 oz per size.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 20: BUBBLY / SODA DRINKS ─────────────────────────────────
  {
    id: 'm-bubbly',
    title: 'Module 20: Bubbly / Soda Drinks',
    description: 'Learn bubbly and soda water drink builds.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-bubbly-content',
        moduleId: 'm-bubbly',
        title: 'Bubbly / Soda Drink Standards',
        type: 'CONTENT' as const,
        content: `<p>Bubbly drinks follow the SAME syrup rules as regular energy drinks.</p>

<h3>Sizes &amp; Syrup Amounts</h3>
<table>
  <thead><tr><th>Size</th><th>Syrup</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>1 oz</td></tr>
    <tr><td>16 oz</td><td>1.5 oz</td></tr>
    <tr><td>20 oz</td><td>2 oz</td></tr>
    <tr><td>24 oz</td><td>2 oz</td></tr>
  </tbody>
</table>

<h3>Build</h3>
<ol>
  <li>Add syrup to cup</li>
  <li>Fill with bubbly/soda water to the fill line</li>
</ol>

<h3>Multi-Flavor Bubbly Drinks</h3>
<p>Same rule as energy — divide total syrup equally among flavors.</p>

<h3>Key Point</h3>
<p>Bubbly syrup amounts = Energy drink syrup amounts</p>`
      },
      {
        id: 'l-bubbly-quiz',
        moduleId: 'm-bubbly',
        title: 'Bubbly / Soda Drinks Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'bu1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 16oz Bubbly?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '16oz bubbly drinks get 1.5 oz of syrup — same as energy drinks.'
          },
          {
            id: 'bu2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Bubbly syrup amounts are the same as which other category?',
            options: ['Lattes', 'Matchas', 'Energy drinks', 'Smoothies'],
            correctAnswers: ['Energy drinks'],
            explanation: 'Bubbly drinks use the exact same syrup chart as energy drinks.'
          },
          {
            id: 'bu3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 24oz Bubbly?',
            options: ['1.5 oz', '2 oz', '2.5 oz', '3 oz'],
            correctAnswers: ['2 oz'],
            explanation: '24oz bubbly drinks get 2 oz of syrup.'
          },
          {
            id: 'bu4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'A 2-flavor Bubbly in 12oz would have how much of each syrup?',
            options: ['0.25 oz each', '0.5 oz each', '0.75 oz each', '1 oz each'],
            correctAnswers: ['0.5 oz each'],
            explanation: '12oz = 1 oz total ÷ 2 flavors = 0.5 oz each.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 21: FROZEN ENERGY ─────────────────────────────────────────
  {
    id: 'm-frozen-energy',
    title: 'Module 21: Frozen Energy',
    description: 'Learn how frozen energy syrup amounts differ from regular energy drinks.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-frozen-energy-content',
        moduleId: 'm-frozen-energy',
        title: 'Frozen Energy Standards',
        type: 'CONTENT' as const,
        content: `<p>Frozen energy has DIFFERENT syrup amounts than regular energy drinks.</p>

<h3>Syrup Amounts by Size</h3>
<table>
  <thead><tr><th>Size</th><th>Frozen Energy Syrup</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>1 oz</td></tr>
    <tr><td>16 oz</td><td>1.5 oz</td></tr>
    <tr><td>20 oz</td><td>2 oz</td></tr>
    <tr><td>24 oz</td><td>2.5 oz</td></tr>
  </tbody>
</table>

<h3>Comparison: Regular vs. Frozen Energy</h3>
<table>
  <thead><tr><th>Size</th><th>Regular Energy</th><th>Frozen Energy</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>0.5 oz</td><td>1 oz</td></tr>
    <tr><td>16 oz</td><td>1 oz</td><td>1.5 oz</td></tr>
    <tr><td>20 oz</td><td>1.5 oz</td><td>2 oz</td></tr>
    <tr><td>24 oz</td><td>2 oz</td><td>2.5 oz</td></tr>
  </tbody>
</table>

<p>The Pattern: 1 → 1.5 → 2 → 2.5 (starts at 1 oz and increases by 0.5 oz per size)</p>

<h3>Key Points</h3>
<ul>
  <li>Frozen energy uses MORE syrup than regular energy (0.5 oz more at each size)</li>
  <li>Remember the pattern: starts at 1 and goes up by 0.5 each size</li>
</ul>`
      },
      {
        id: 'l-frozen-energy-quiz',
        moduleId: 'm-frozen-energy',
        title: 'Frozen Energy Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'fe1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 12oz frozen energy?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: '12oz frozen energy gets 1 oz of syrup.'
          },
          {
            id: 'fe2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 16oz frozen energy?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '16oz frozen energy gets 1.5 oz of syrup.'
          },
          {
            id: 'fe3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 20oz frozen energy?',
            options: ['1.5 oz', '2 oz', '2.5 oz', '3 oz'],
            correctAnswers: ['2 oz'],
            explanation: '20oz frozen energy gets 2 oz of syrup.'
          },
          {
            id: 'fe4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'A 12oz regular energy has 0.5 oz syrup. A 12oz frozen energy has:',
            options: ['0.5 oz (same)', '1 oz (more)', '1.5 oz (more)', '0.25 oz (less)'],
            correctAnswers: ['1 oz (more)'],
            explanation: 'Frozen energy uses more syrup than regular — 12oz frozen gets 1 oz vs. 0.5 oz regular.'
          },
          {
            id: 'fe5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the pattern for frozen energy syrup amounts?',
            options: ['0.5 / 1 / 1.5 / 2', '1 / 1.5 / 2 / 2.5', '1 / 1 / 1.5 / 1.5', '0.5 / 0.5 / 1 / 1'],
            correctAnswers: ['1 / 1.5 / 2 / 2.5'],
            explanation: 'The frozen energy pattern is 1 / 1.5 / 2 / 2.5 — starting at 1 oz and increasing by 0.5 oz per size.'
          },
          {
            id: 'fe6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 24oz frozen energy?',
            options: ['2 oz', '2.5 oz', '3 oz', '1.5 oz'],
            correctAnswers: ['2.5 oz'],
            explanation: '24oz frozen energy gets 2.5 oz of syrup.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 22: FROZEN COFFEE ─────────────────────────────────────────
  {
    id: 'm-frozen-coffee',
    title: 'Module 22: Frozen Coffee',
    description: 'Learn frozen coffee sizes, syrup, and sauce measurements.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-frozen-coffee-content',
        moduleId: 'm-frozen-coffee',
        title: 'Frozen Coffee Standards',
        type: 'CONTENT' as const,
        content: `<p>Frozen coffee ONLY comes in 2 sizes: 16 oz and 20 oz. (No 12 oz or 24 oz!)</p>

<h3>Syrup &amp; Sauce Amounts</h3>
<table>
  <thead><tr><th>Size</th><th>Syrup</th><th>Sauce</th></tr></thead>
  <tbody>
    <tr><td>16 oz</td><td>1 oz</td><td>40g</td></tr>
    <tr><td>20 oz</td><td>1.5 oz</td><td>60g</td></tr>
  </tbody>
</table>

<h3>Key Points to Memorize</h3>
<ul>
  <li>Only 2 sizes: 16 oz and 20 oz</li>
  <li>16 oz = 1 oz syrup or 40g sauce</li>
  <li>20 oz = 1.5 oz syrup or 60g sauce</li>
</ul>`
      },
      {
        id: 'l-frozen-coffee-quiz',
        moduleId: 'm-frozen-coffee',
        title: 'Frozen Coffee Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'fc1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What sizes does frozen coffee come in?',
            options: ['12oz and 16oz', '16oz and 20oz', '12oz, 16oz, 20oz', '16oz, 20oz, 24oz'],
            correctAnswers: ['16oz and 20oz'],
            explanation: 'Frozen coffee only comes in 16oz and 20oz.'
          },
          {
            id: 'fc2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 16oz frozen coffee?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: '16oz frozen coffee gets 1 oz of syrup.'
          },
          {
            id: 'fc3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much sauce goes in a 20oz frozen coffee?',
            options: ['20g', '40g', '60g', '80g'],
            correctAnswers: ['60g'],
            explanation: '20oz frozen coffee gets 60g of sauce.'
          },
          {
            id: 'fc4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Can you make a 12oz frozen coffee?',
            options: ['Yes, use 0.5 oz syrup', 'Yes, use 1 oz syrup', 'No, we don\'t offer 12oz frozen coffee', 'No, we don\'t offer any frozen coffee'],
            correctAnswers: ['No, we don\'t offer 12oz frozen coffee'],
            explanation: 'Frozen coffee is only available in 16oz and 20oz. There is no 12oz option.'
          },
          {
            id: 'fc5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 20oz frozen coffee?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '20oz frozen coffee gets 1.5 oz of syrup.'
          },
          {
            id: 'fc6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'If using sauce in a 16oz frozen coffee, how many grams?',
            options: ['20g', '40g', '60g', '80g'],
            correctAnswers: ['40g'],
            explanation: '16oz frozen coffee gets 40g of sauce.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 23: LEMONADES ─────────────────────────────────────────────
  {
    id: 'm-lemonades',
    title: 'Module 23: Lemonades (Regular & Frozen)',
    description: 'Master regular and frozen lemonade recipes and measurements.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-lemonades-content',
        moduleId: 'm-lemonades',
        title: 'Lemonade Standards',
        type: 'CONTENT' as const,
        content: `<h3>Regular (Iced) Lemonades</h3>
<p>Key rule: Concentrate = Syrup (always equal parts, if flavored), then water to fill line.</p>
<table>
  <thead><tr><th>Size</th><th>Concentrate</th><th>Syrup (if flavored)</th><th>Water Fill Line</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>1 oz</td><td>1 oz</td><td>9 oz</td></tr>
    <tr><td>16 oz</td><td>1.5 oz</td><td>1.5 oz</td><td>11 oz</td></tr>
    <tr><td>20 oz</td><td>2 oz</td><td>2 oz</td><td>14 oz</td></tr>
    <tr><td>24 oz</td><td>2.5 oz</td><td>2.5 oz</td><td>17 oz</td></tr>
  </tbody>
</table>

<h3>Frozen Lemonades</h3>
<p>Frozen lemonades have a more complex build.</p>
<table>
  <thead><tr><th>Size</th><th>Concentrate</th><th>Water</th><th>Syrup</th><th>Ice</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>1.5 oz</td><td>2.5 oz</td><td>1 oz</td><td>12 oz scoop</td></tr>
    <tr><td>16 oz</td><td>3 oz</td><td>4 oz</td><td>1.5 oz</td><td>24 oz scoop</td></tr>
    <tr><td>20 oz</td><td>4.5 oz</td><td>6 oz</td><td>2 oz</td><td>24 oz + 10 oz scoop</td></tr>
    <tr><td>24 oz</td><td>6 oz</td><td>8 oz</td><td>2.5 oz</td><td>24 oz + 12 oz scoop</td></tr>
  </tbody>
</table>

<h3>Frozen Lemonade Build Rules</h3>
<ul>
  <li>Level scoops only</li>
  <li>Liquids first, ice second</li>
  <li>No extra water</li>
  <li>Do not top with ice after blending</li>
</ul>`
      },
      {
        id: 'l-lemonades-quiz',
        moduleId: 'm-lemonades',
        title: 'Lemonades Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'le1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'In a regular 16oz lemonade, how much concentrate?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '16oz regular lemonade gets 1.5 oz of concentrate.'
          },
          {
            id: 'le2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'In a regular lemonade, the syrup amount equals the:',
            options: ['Water amount', 'Concentrate amount', 'Ice amount', 'Cup size'],
            correctAnswers: ['Concentrate amount'],
            explanation: 'In regular lemonades, syrup always equals the concentrate amount (equal parts).'
          },
          {
            id: 'le3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the water fill line for a 20oz regular lemonade?',
            options: ['11 oz', '14 oz', '16 oz', '17 oz'],
            correctAnswers: ['14 oz'],
            explanation: 'The fill line for 20oz regular lemonade is 14 oz.'
          },
          {
            id: 'le4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'In a regular 24oz lemonade, how much concentrate AND syrup each?',
            options: ['2 oz each', '2.5 oz each', '3 oz each', '3.5 oz each'],
            correctAnswers: ['2.5 oz each'],
            explanation: '24oz regular lemonade gets 2.5 oz concentrate and 2.5 oz syrup (equal parts).'
          },
          {
            id: 'le5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'For frozen lemonades, what goes in FIRST?',
            options: ['Ice', 'Liquids', 'Syrup only', 'Concentrate only'],
            correctAnswers: ['Liquids'],
            explanation: 'For frozen lemonades, liquids go in first, then ice.'
          },
          {
            id: 'le6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 12oz FROZEN lemonade?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: '12oz frozen lemonade gets 1 oz of syrup.'
          },
          {
            id: 'le7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much concentrate goes in a 16oz FROZEN lemonade?',
            options: ['1.5 oz', '2 oz', '3 oz', '4 oz'],
            correctAnswers: ['3 oz'],
            explanation: '16oz frozen lemonade gets 3 oz of concentrate.'
          },
          {
            id: 'le8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What ice scoop do you use for a 20oz frozen lemonade?',
            options: ['12 oz scoop', '24 oz scoop', '24 oz + 10 oz scoop', '24 oz + 12 oz scoop'],
            correctAnswers: ['24 oz + 10 oz scoop'],
            explanation: '20oz frozen lemonade uses a 24 oz scoop plus a 10 oz scoop of ice.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 24: SMOOTHIES ─────────────────────────────────────────────
  {
    id: 'm-smoothies',
    title: 'Module 24: Smoothies',
    description: 'Learn smoothie puree, water, and ice ratios.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-smoothies-content',
        moduleId: 'm-smoothies',
        title: 'Smoothie Standards',
        type: 'CONTENT' as const,
        content: `<h3>Sizes &amp; Measurements</h3>
<table>
  <thead><tr><th>Size</th><th>Puree</th><th>Water</th><th>Ice</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>3 oz</td><td>2 oz</td><td>Heaping scoop (cup overflowing)</td></tr>
    <tr><td>16 oz</td><td>4 oz</td><td>3 oz</td><td>Heaping scoop (cup overflowing)</td></tr>
    <tr><td>20 oz</td><td>5 oz</td><td>4 oz</td><td>Heaping scoop (cup overflowing)</td></tr>
    <tr><td>24 oz</td><td>6 oz</td><td>5 oz</td><td>Heaping scoop (cup overflowing)</td></tr>
  </tbody>
</table>

<h3>Patterns to Memorize</h3>
<ul>
  <li>Puree: 3 / 4 / 5 / 6 oz (goes up by 1 oz each size)</li>
  <li>Water: 2 / 3 / 4 / 5 oz (goes up by 1 oz each size)</li>
  <li>Water is always 1 oz LESS than puree</li>
  <li>Ice: Always a heaping scoop (cup overflowing) — same for all sizes</li>
</ul>

<h3>Build Order</h3>
<ol>
  <li>Puree + water into the blender</li>
  <li>Add heaping scoop of ice (fill cup overflowing)</li>
  <li>Blend</li>
</ol>`
      },
      {
        id: 'l-smoothies-quiz',
        moduleId: 'm-smoothies',
        title: 'Smoothies Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'sm1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much puree goes in a 12oz smoothie?',
            options: ['2 oz', '3 oz', '4 oz', '5 oz'],
            correctAnswers: ['3 oz'],
            explanation: '12oz smoothie gets 3 oz of puree.'
          },
          {
            id: 'sm2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much water goes in a 16oz smoothie?',
            options: ['2 oz', '3 oz', '4 oz', '5 oz'],
            correctAnswers: ['3 oz'],
            explanation: '16oz smoothie gets 3 oz of water (1 oz less than the 4 oz puree).'
          },
          {
            id: 'sm3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much puree goes in a 24oz smoothie?',
            options: ['4 oz', '5 oz', '6 oz', '7 oz'],
            correctAnswers: ['6 oz'],
            explanation: '24oz smoothie gets 6 oz of puree.'
          },
          {
            id: 'sm4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Water is always how much less than puree?',
            options: ['0.5 oz less', '1 oz less', '1.5 oz less', 'Same amount'],
            correctAnswers: ['1 oz less'],
            explanation: 'Water is always exactly 1 oz less than puree in smoothies.'
          },
          {
            id: 'sm5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much ice goes in a smoothie?',
            options: ['1 scoop level', '2 scoops level', 'Heaping scoop (cup overflowing)', 'Fill to the line'],
            correctAnswers: ['Heaping scoop (cup overflowing)'],
            explanation: 'All smoothies get a heaping scoop of ice (cup overflowing), regardless of size.'
          },
          {
            id: 'sm6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'A 20oz smoothie has how much puree and water?',
            options: ['4 oz puree, 3 oz water', '5 oz puree, 4 oz water', '6 oz puree, 5 oz water', '5 oz puree, 5 oz water'],
            correctAnswers: ['5 oz puree, 4 oz water'],
            explanation: '20oz smoothie = 5 oz puree and 4 oz water.'
          },
          {
            id: 'sm7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the pattern for puree amounts (12/16/20/24)?',
            options: ['2 / 3 / 4 / 5', '3 / 4 / 5 / 6', '4 / 5 / 6 / 7', '3 / 3.5 / 4 / 4.5'],
            correctAnswers: ['3 / 4 / 5 / 6'],
            explanation: 'Puree increases by 1 oz per size: 3 / 4 / 5 / 6.'
          },
          {
            id: 'sm8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What goes in the blender first?',
            options: ['Ice', 'Puree and water', 'Just puree', 'Just water'],
            correctAnswers: ['Puree and water'],
            explanation: 'Puree and water go into the blender first, then ice is added on top.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 25: TEAS ──────────────────────────────────────────────────
  {
    id: 'm-teas',
    title: 'Module 25: Teas',
    description: 'Learn tea concentrate preparation, steep times, and sweetening standards.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-teas-content',
        moduleId: 'm-teas',
        title: 'Tea Standards',
        type: 'CONTENT' as const,
        content: `<h3>Iced Tea Concentrates (Batch Recipes)</h3>
<table>
  <thead><tr><th>Tea</th><th>Grams</th><th>Hot Water</th><th>Steep Time</th><th>Fill To</th></tr></thead>
  <tbody>
    <tr><td>Citrus Oolong</td><td>40.8g</td><td>&frac12; quart</td><td>5 minutes</td><td>1 quart</td></tr>
    <tr><td>Lavender Coconut Rooibos</td><td>40.8g</td><td>&frac12; quart</td><td>10 minutes</td><td>1 quart</td></tr>
    <tr><td>Pomberry Punch</td><td>40.8g</td><td>&frac12; quart</td><td>11 minutes</td><td>1 quart</td></tr>
    <tr><td>Honey Ginger Peach</td><td>40.8g</td><td>&frac12; quart</td><td>6 minutes</td><td>1 quart</td></tr>
  </tbody>
</table>

<h3>Hot Teas</h3>
<ul>
  <li>Use empty sachets filled with loose tea</li>
  <li>Each sachet: 3.5 grams</li>
</ul>

<h3>Iced Tea Sweetening (Simple Syrup)</h3>
<table>
  <thead><tr><th>Size</th><th>Simple Syrup</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>0.5 oz</td></tr>
    <tr><td>16 oz</td><td>1 oz</td></tr>
    <tr><td>20 oz</td><td>1.5 oz</td></tr>
    <tr><td>24 oz</td><td>1.5 oz</td></tr>
  </tbody>
</table>
<p>Note: 20 oz and 24 oz use the same amount of simple syrup (1.5 oz).</p>

<h3>Key Points</h3>
<ul>
  <li>Most teas use 40.8 grams</li>
  <li>Hot tea sachets = 3.5 grams</li>
  <li>Sweetening pattern: 0.5 / 1 / 1.5 / 1.5 (20oz and 24oz are the same)</li>
</ul>`
      },
      {
        id: 'l-teas-quiz',
        moduleId: 'm-teas',
        title: 'Teas Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'te1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How many grams of tea go in a hot tea sachet?',
            options: ['2.5 grams', '3.5 grams', '4.5 grams', '5 grams'],
            correctAnswers: ['3.5 grams'],
            explanation: 'Hot tea sachets get 3.5 grams of loose tea.'
          },
          {
            id: 'te2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much simple syrup goes in a sweetened 16oz iced tea?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: '16oz sweet tea gets 1 oz of simple syrup.'
          },
          {
            id: 'te3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much simple syrup goes in a sweetened 24oz iced tea?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '24oz sweet tea gets 1.5 oz of simple syrup.'
          },
          {
            id: 'te4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'A 20oz and 24oz sweetened iced tea have the same syrup amount. True or False?',
            options: ['True', 'False'],
            correctAnswers: ['True'],
            explanation: 'Both 20oz and 24oz sweet teas use 1.5 oz of simple syrup.'
          },
          {
            id: 'te5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How long do you steep Pomberry Punch?',
            options: ['5 minutes', '6 minutes', '10 minutes', '11 minutes'],
            correctAnswers: ['11 minutes'],
            explanation: 'Pomberry Punch steeps for 11 minutes — the longest of all teas.'
          },
          {
            id: 'te6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How long do you steep Lavender Coconut Rooibos?',
            options: ['5 minutes', '6 minutes', '10 minutes', '11 minutes'],
            correctAnswers: ['10 minutes'],
            explanation: 'Lavender Coconut Rooibos steeps for 10 minutes.'
          },
          {
            id: 'te7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the tea sweetening pattern (12/16/20/24)?',
            options: ['0.5 / 1 / 1.5 / 2', '0.5 / 1 / 1.5 / 1.5', '1 / 1.5 / 2 / 2', '0.5 / 0.5 / 1 / 1'],
            correctAnswers: ['0.5 / 1 / 1.5 / 1.5'],
            explanation: 'The sweetening pattern is 0.5 / 1 / 1.5 / 1.5 — note 20oz and 24oz are the same.'
          },
          {
            id: 'te8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much simple syrup goes in a sweetened 12oz iced tea?',
            options: ['0.25 oz', '0.5 oz', '1 oz', '1.5 oz'],
            correctAnswers: ['0.5 oz'],
            explanation: '12oz sweet tea gets 0.5 oz of simple syrup.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 26: KIDS DRINKS ───────────────────────────────────────────
  {
    id: 'm-kids-drinks',
    title: 'Module 26: Kids Drinks',
    description: 'Learn the recipes for Unicorn Latte, Dino Juice, Zebra Milk, and Kiddos Coffee.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-kids-drinks-content',
        moduleId: 'm-kids-drinks',
        title: 'Kids Drink Standards',
        type: 'CONTENT' as const,
        content: `<h3>Unicorn Latte</h3>
<ul>
  <li>12 oz, Iced, Caffeine-free</li>
  <li>Equal parts Magical Unicorn tea concentrate + whole milk</li>
  <li>Sweeten with simple syrup using the tea sweetening rule</li>
</ul>

<h3>Dino Juice</h3>
<p>Blue Raspberry Pineapple Lemonade — follows regular lemonade rules with syrup split between Blue Raspberry &amp; Pineapple.</p>
<table>
  <thead><tr><th>Size</th><th>Lemonade Conc</th><th>Blue Raspberry</th><th>Pineapple</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>1 oz</td><td>0.5 oz</td><td>0.5 oz</td></tr>
    <tr><td>16 oz</td><td>1.5 oz</td><td>0.75 oz</td><td>0.75 oz</td></tr>
    <tr><td>20 oz</td><td>2 oz</td><td>1 oz</td><td>1 oz</td></tr>
    <tr><td>24 oz</td><td>2.5 oz</td><td>1.25 oz</td><td>1.25 oz</td></tr>
  </tbody>
</table>
<p>Key: Lemonade concentrate follows regular lemonade rules. Syrup is split equally between Blue Raspberry and Pineapple (and equals the concentrate amount). Fill with water to line, serve over ice.</p>

<h3>Zebra Milk</h3>
<ul>
  <li>12 oz, Iced</li>
  <li>10g Dark Chocolate sauce + 10g White Chocolate sauce</li>
  <li>Fill with cold milk, serve over ice</li>
  <li>Total sauce: 20g</li>
</ul>

<h3>Kiddos Coffee</h3>
<ul>
  <li>8 oz, Hot, Caffeine-free</li>
  <li>0.5 oz syrup (any flavor)</li>
  <li>Steamed milk at kids temp</li>
</ul>`
      },
      {
        id: 'l-kids-drinks-quiz',
        moduleId: 'm-kids-drinks',
        title: 'Kids Drinks Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'kd1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What size is a Zebra Milk?',
            options: ['8oz', '12oz', '16oz', '20oz'],
            correctAnswers: ['12oz'],
            explanation: 'Zebra Milk is served as a 12oz iced drink.'
          },
          {
            id: 'kd2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much Dark Chocolate sauce goes in a Zebra Milk?',
            options: ['5 grams', '10 grams', '15 grams', '20 grams'],
            correctAnswers: ['10 grams'],
            explanation: 'Zebra Milk gets 10g of Dark Chocolate sauce (plus 10g White Chocolate).'
          },
          {
            id: 'kd3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a Kiddos Coffee?',
            options: ['0.25 oz', '0.5 oz', '1 oz', '1.5 oz'],
            correctAnswers: ['0.5 oz'],
            explanation: 'Kiddos Coffee gets 0.5 oz of syrup.'
          },
          {
            id: 'kd4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What size is a Kiddos Coffee?',
            options: ['6oz', '8oz', '10oz', '12oz'],
            correctAnswers: ['8oz'],
            explanation: 'Kiddos Coffee is an 8oz hot drink.'
          },
          {
            id: 'kd5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'In a 16oz Dino Juice, how much Blue Raspberry syrup?',
            options: ['0.5 oz', '0.75 oz', '1 oz', '1.5 oz'],
            correctAnswers: ['0.75 oz'],
            explanation: '16oz Dino Juice has 1.5 oz total syrup split into 0.75 oz Blue Rasp + 0.75 oz Pineapple.'
          },
          {
            id: 'kd6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'In a Dino Juice, the total syrup (Blue Rasp + Pineapple) equals what?',
            options: ['Half the concentrate amount', 'The concentrate amount', 'Double the concentrate amount', 'Always 1 oz'],
            correctAnswers: ['The concentrate amount'],
            explanation: 'Dino Juice follows lemonade rules — total syrup equals the concentrate amount.'
          },
          {
            id: 'kd7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'A Unicorn Latte is made with equal parts concentrate and:',
            options: ['Water', 'Whole milk', '2% milk', 'Oat milk'],
            correctAnswers: ['Whole milk'],
            explanation: 'Unicorn Latte is made with equal parts Magical Unicorn tea concentrate and whole milk.'
          },
          {
            id: 'kd8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much total sauce (dark + white choc) goes in a Zebra Milk?',
            options: ['10 grams', '15 grams', '20 grams', '25 grams'],
            correctAnswers: ['20 grams'],
            explanation: 'Zebra Milk has 10g dark chocolate + 10g white chocolate = 20g total sauce.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 27: BATCH BREW ────────────────────────────────────────────
  {
    id: 'm-batch-brew',
    title: 'Module 27: Batch Brew',
    description: 'Learn Fetco batch brew system setup and process.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-batch-brew-content',
        moduleId: 'm-batch-brew',
        title: 'Batch Brew Standards',
        type: 'CONTENT' as const,
        content: `<h3>Equipment &amp; Settings</h3>
<table>
  <thead><tr><th>Setting</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Grinder</td><td>EK-43</td></tr>
    <tr><td>Grind Size</td><td>9</td></tr>
    <tr><td>Coffee Weight</td><td>240g</td></tr>
    <tr><td>Batch Size</td><td>1 gallon</td></tr>
  </tbody>
</table>

<h3>Process</h3>
<ol>
  <li>Grind beans on EK-43 (grind 9)</li>
  <li>Form filter correctly to avoid collapse</li>
  <li>Place filter in basket, ensure lid open and pour stop closed</li>
  <li>Press 1-Gallon Batch</li>
  <li>Label dispenser with brew time and initials</li>
</ol>

<h3>Key Points to Memorize</h3>
<ul>
  <li>Grind size: 9</li>
  <li>Coffee weight: 240 grams</li>
  <li>Always label with time and initials</li>
</ul>`
      },
      {
        id: 'l-batch-brew-quiz',
        moduleId: 'm-batch-brew',
        title: 'Batch Brew Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'bb1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What grind size do you use for batch brew?',
            options: ['7', '8', '9', '10'],
            correctAnswers: ['9'],
            explanation: 'Batch brew uses grind size 9 on the EK-43.'
          },
          {
            id: 'bb2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How many grams of coffee for a batch brew?',
            options: ['200 grams', '220 grams', '240 grams', '260 grams'],
            correctAnswers: ['240 grams'],
            explanation: 'Batch brew uses 240 grams of coffee.'
          },
          {
            id: 'bb3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What size batch does the Fetco make?',
            options: ['Half gallon', '1 gallon', '2 gallons', '3 gallons'],
            correctAnswers: ['1 gallon'],
            explanation: 'Each batch brew makes 1 gallon.'
          },
          {
            id: 'bb4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What grinder do you use for batch brew?',
            options: ['Mahlk\u00F6nig E80', 'EK-43', 'PuqPress', 'Fetco grinder'],
            correctAnswers: ['EK-43'],
            explanation: 'The EK-43 grinder is used for batch brew.'
          },
          {
            id: 'bb5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'After brewing, what do you label on the dispenser?',
            options: ['Coffee type only', 'Brew time and initials', 'Date only', 'Nothing'],
            correctAnswers: ['Brew time and initials'],
            explanation: 'Every batch must be labeled with the brew time and the barista\'s initials.'
          },
          {
            id: 'bb6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Before placing the filter, you should ensure the lid is:',
            options: ['Closed', 'Open', 'Removed', 'Locked'],
            correctAnswers: ['Open'],
            explanation: 'The lid should be open when placing the filter in the basket.'
          }
        ]
      }
    ]
  },

  // ─── FINAL EXAM: ALL CATEGORIES ───────────────────────────────────────
  {
    id: 'm-final-exam',
    title: 'Final Exam: All Drink Categories',
    description: 'Comprehensive exam covering all drink categories and preparation standards. Score 90% or higher to pass.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-final-exam-content',
        moduleId: 'm-final-exam',
        title: 'Final Exam Overview',
        type: 'CONTENT' as const,
        content: `<p>This is a comprehensive exam covering everything you have learned across all drink modules:</p>

<ul>
  <li>Matchas — concentrate, syrup, and milk standards</li>
  <li>Nitro Cold Brew — standard build and flavor variations</li>
  <li>Energy Drinks — syrup and fill line charts</li>
  <li>Bubbly/Soda Drinks — shared syrup rules with energy drinks</li>
  <li>Frozen Energy — different syrup pattern from regular energy</li>
  <li>Frozen Coffee — limited sizes, syrup vs. sauce</li>
  <li>Lemonades — regular and frozen builds</li>
  <li>Smoothies — puree, water, and ice ratios</li>
  <li>Teas — steep times, sweetening, and hot tea prep</li>
  <li>Kids Drinks — Unicorn Latte, Dino Juice, Zebra Milk, Kiddos Coffee</li>
  <li>Batch Brew — Fetco system and process</li>
</ul>

<h3>What to Expect</h3>
<ul>
  <li>20 questions drawn from all modules</li>
  <li>You must score 90% or higher to pass</li>
  <li>Review your notes from each module before attempting</li>
</ul>

<p>Good luck!</p>`
      },
      {
        id: 'l-final-exam-quiz',
        moduleId: 'm-final-exam',
        title: 'Final Exam',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'fx1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much matcha concentrate goes in a 20oz iced matcha?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '20oz iced is the "large" iced size, which gets 1.5 oz matcha concentrate.'
          },
          {
            id: 'fx2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much sweet cream goes in a nitro?',
            options: ['1 oz', '2 oz', '3 oz', '4 oz'],
            correctAnswers: ['3 oz'],
            explanation: 'All nitro cold brews get 3 oz of sweet cream.'
          },
          {
            id: 'fx3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 16oz regular energy drink?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: '16oz regular energy drinks get 1 oz of syrup.'
          },
          {
            id: 'fx4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 16oz FROZEN energy drink?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '16oz frozen energy gets 1.5 oz — more than the 1 oz in a regular 16oz energy.'
          },
          {
            id: 'fx5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Frozen coffee comes in which sizes?',
            options: ['12oz and 16oz', '16oz and 20oz', '12oz, 16oz, 20oz', '16oz, 20oz, 24oz'],
            correctAnswers: ['16oz and 20oz'],
            explanation: 'Frozen coffee only comes in 16oz and 20oz.'
          },
          {
            id: 'fx6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'In a regular lemonade, concentrate equals:',
            options: ['Water amount', 'Syrup amount', 'Ice amount', 'Half the cup size'],
            correctAnswers: ['Syrup amount'],
            explanation: 'In regular lemonades, concentrate always equals the syrup amount (equal parts).'
          },
          {
            id: 'fx7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much puree goes in a 16oz smoothie?',
            options: ['3 oz', '4 oz', '5 oz', '6 oz'],
            correctAnswers: ['4 oz'],
            explanation: '16oz smoothie gets 4 oz of puree.'
          },
          {
            id: 'fx8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much simple syrup goes in a sweetened 20oz iced tea?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '20oz sweet tea gets 1.5 oz of simple syrup.'
          },
          {
            id: 'fx9',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How many grams of chocolate sauce (each type) go in a Zebra Milk?',
            options: ['5 grams', '10 grams', '15 grams', '20 grams'],
            correctAnswers: ['10 grams'],
            explanation: 'Zebra Milk gets 10g Dark Chocolate sauce and 10g White Chocolate sauce.'
          },
          {
            id: 'fx10',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the grind size for batch brew?',
            options: ['7', '8', '9', '10'],
            correctAnswers: ['9'],
            explanation: 'Batch brew uses grind size 9 on the EK-43.'
          },
          {
            id: 'fx11',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Bubbly syrup amounts are the same as:',
            options: ['Lattes', 'Energy drinks', 'Frozen energy', 'Smoothies'],
            correctAnswers: ['Energy drinks'],
            explanation: 'Bubbly drinks use the exact same syrup chart as energy drinks.'
          },
          {
            id: 'fx12',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in an 8oz Kiddos Coffee?',
            options: ['0.25 oz', '0.5 oz', '1 oz', '1.5 oz'],
            correctAnswers: ['0.5 oz'],
            explanation: 'Kiddos Coffee gets 0.5 oz of syrup.'
          },
          {
            id: 'fx13',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the fill line for a 24oz lemonade?',
            options: ['14 oz', '16 oz', '17 oz', '18 oz'],
            correctAnswers: ['17 oz'],
            explanation: 'The fill line for 24oz regular lemonade is 17 oz.'
          },
          {
            id: 'fx14',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much sauce goes in a 16oz frozen coffee?',
            options: ['20g', '40g', '60g', '80g'],
            correctAnswers: ['40g'],
            explanation: '16oz frozen coffee gets 40g of sauce.'
          },
          {
            id: 'fx15',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'For frozen lemonade, what goes in first?',
            options: ['Ice', 'Liquids', 'Blend everything together', 'Syrup only'],
            correctAnswers: ['Liquids'],
            explanation: 'For frozen lemonades, liquids go in first, then ice.'
          },
          {
            id: 'fx16',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much water goes in a 24oz smoothie?',
            options: ['4 oz', '5 oz', '6 oz', '7 oz'],
            correctAnswers: ['5 oz'],
            explanation: '24oz smoothie gets 5 oz of water (1 oz less than the 6 oz puree).'
          },
          {
            id: 'fx17',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Hot tea sachets should weigh:',
            options: ['2.5 grams', '3.5 grams', '4.5 grams', '5 grams'],
            correctAnswers: ['3.5 grams'],
            explanation: 'Hot tea sachets get 3.5 grams of loose tea.'
          },
          {
            id: 'fx18',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How many grams of coffee for batch brew?',
            options: ['200 grams', '220 grams', '240 grams', '260 grams'],
            correctAnswers: ['240 grams'],
            explanation: 'Batch brew uses 240 grams of coffee.'
          },
          {
            id: 'fx19',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much flavor syrup goes in a nitro?',
            options: ['0.25 oz', '0.5 oz', '1 oz', '1.5 oz'],
            correctAnswers: ['0.5 oz'],
            explanation: 'All nitro cold brews get 0.5 oz of flavor syrup.'
          },
          {
            id: 'fx20',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Extra matcha adds how much more concentrate?',
            options: ['0.25 oz', '0.5 oz', '1 oz', '1.5 oz'],
            correctAnswers: ['0.5 oz'],
            explanation: 'Extra matcha adds +0.5 oz to the base matcha concentrate amount.'
          }
        ]
      }
    ]
  }
];
