import { TrainingModule } from '../types';

export const NEW_TRAINING_MODULES: TrainingModule[] = [
  // ─── MODULE 17: MATCHAS ───────────────────────────────────────────────
  {
    id: 'm-matchas',
    title: 'Module 19: Matchas',
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

<h3>Syrup</h3>
<ul>
  <li>ALL matchas get 1 oz total syrup regardless of size or temperature</li>
</ul>

<h3>Flavor Builds (1 oz total)</h3>
<table>
  <thead><tr><th>Flavor</th><th>Syrup Build</th></tr></thead>
  <tbody>
    <tr><td>Plain Matcha</td><td>1 oz Vanilla</td></tr>
    <tr><td>Blue Coconut</td><td>1 oz Coconut</td></tr>
    <tr><td>Strawberry Dream</td><td>0.5 oz Strawberry + 0.5 oz Vanilla</td></tr>
    <tr><td>Banana Baby</td><td>0.33 oz Banana + 0.33 oz Maple + 0.33 oz Vanilla</td></tr>
  </tbody>
</table>

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
  <li>Syrup is ALWAYS 1 oz total (all sizes, hot or iced)</li>
  <li>Base batch: 30g matcha + 300ml water</li>
  <li>Multi-flavor matchas split the 1 oz equally</li>
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
            question: 'What syrup goes in a Plain Matcha?',
            options: ['No syrup', '1 oz Vanilla', '1 oz Honey', '0.5 oz Simple Syrup'],
            correctAnswers: ['1 oz Vanilla'],
            explanation: 'A Plain Matcha is built with 1 oz of Vanilla syrup.'
          },
          {
            id: 'ma2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the syrup build for a Banana Baby matcha?',
            options: ['1 oz Banana', '0.5 oz Banana + 0.5 oz Vanilla', '0.33 oz Banana + 0.33 oz Maple + 0.33 oz Vanilla', '1 oz Maple'],
            correctAnswers: ['0.33 oz Banana + 0.33 oz Maple + 0.33 oz Vanilla'],
            explanation: 'Banana Baby splits the 1 oz total three ways: Banana, Maple, and Vanilla.'
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
            question: 'What is the syrup build for a Blue Coconut matcha?',
            options: ['1 oz Blue Raspberry', '1 oz Coconut', '0.5 oz Coconut + 0.5 oz Vanilla', '1 oz Vanilla'],
            correctAnswers: ['1 oz Coconut'],
            explanation: 'Blue Coconut is built with 1 oz of Coconut syrup.'
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
    title: 'Module 20: Nitro Cold Brew',
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
    <tr><td>Cookie Butter</td><td>Equal parts White Chocolate and Speculoos — 0.25 oz each</td></tr>
  </tbody>
</table>

<h3>Key Points to Memorize</h3>
<ul>
  <li>Always 1 scoop ice</li>
  <li>Fill nitro to 2nd-to-last line</li>
  <li>Always 3 oz sweet cream</li>
  <li>Always 0.5 oz flavor total (Cookie Butter splits it: 0.25 oz White Chocolate + 0.25 oz Speculoos)</li>
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
            options: ['It uses 1 oz syrup instead of 0.5 oz', 'It splits the 0.5 oz equally: White Chocolate + Speculoos (0.25 oz each)', 'It doesn\'t get sweet cream', 'It gets 2 scoops of ice'],
            correctAnswers: ['It splits the 0.5 oz equally: White Chocolate + Speculoos (0.25 oz each)'],
            explanation: 'Cookie Butter is equal parts White Chocolate and Speculoos — 0.25 oz each, 0.5 oz total.'
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
    title: 'Module 21: Energy Drinks',
    description: 'Learn energy drink syrup amounts, fill lines, and multi-flavor builds.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-energy-content',
        moduleId: 'm-energy',
        title: 'Energy Drink Standards',
        type: 'CONTENT' as const,
        content: `<p>Energy drinks come in 4 sizes: 12oz, 16oz, 20oz, 24oz. They are built on a <strong>supplied ready-to-use energy drink base</strong> — there is no concentrate to mix. Pour the base to the fill line for the cup size, add syrup, and finish.</p>

<h3>Syrup Amounts by Size</h3>
<table>
  <thead><tr><th>Size</th><th>Syrup Total</th><th>Fill Line</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>1 oz</td><td>9 oz</td></tr>
    <tr><td>16 oz</td><td>1.5 oz</td><td>11 oz</td></tr>
    <tr><td>20 oz</td><td>2 oz</td><td>14 oz</td></tr>
    <tr><td>24 oz</td><td>2 oz</td><td>16 oz</td></tr>
  </tbody>
</table>

<h3>Multi-Flavor Drinks</h3>
<p>When a drink has multiple flavors, divide the total syrup equally among them.</p>
<ul>
  <li>Two-way: 0.5 oz each (12oz), 0.75 oz each (16oz), 1 oz each (20oz and 24oz)</li>
  <li>Three-way: 0.33 oz each (12oz), 0.5 oz each (16oz), 0.67 oz each (20oz and 24oz)</li>
</ul>

<h3>Pattern to Memorize</h3>
<p>12oz = 1 oz, 16oz = 1.5 oz, 20oz = 2 oz, 24oz = 2 oz — the same 1 / 1.5 / 2 / 2 pattern used by sodas, lemonades, and iced teas.</p>`
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
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: '12oz energy drinks get 1 oz of syrup.'
          },
          {
            id: 'en2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much total syrup goes in a 16oz energy drink?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '16oz energy drinks get 1.5 oz of syrup.'
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
            correctAnswers: ['1 oz each'],
            explanation: '20oz = 2 oz total syrup ÷ 2 flavors = 1 oz each.'
          },
          {
            id: 'en6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Electric B has Blue Raspberry & Lime. In a 12oz, how much of EACH syrup?',
            options: ['0.25 oz each', '0.5 oz each', '0.75 oz each', '1 oz each'],
            correctAnswers: ['0.5 oz each'],
            explanation: '12oz = 1 oz total syrup ÷ 2 flavors = 0.5 oz each.'
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
            correctAnswers: ['1 / 1.5 / 2 / 2'],
            explanation: 'The energy drink syrup pattern is 1 / 1.5 / 2 / 2 — the same pattern as sodas, lemonades, and iced teas.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 20: BUBBLY / SODA DRINKS ─────────────────────────────────
  {
    id: 'm-bubbly',
    title: 'Module 22: Sodas',
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
    title: 'Module 23: Frozen Energy',
    description: 'Learn how frozen energy syrup amounts differ from regular energy drinks.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-frozen-energy-content',
        moduleId: 'm-frozen-energy',
        title: 'Frozen Energy Standards',
        type: 'CONTENT' as const,
        content: `<p>Frozen energy drinks are <strong>blended to order individually</strong>. They are NOT pre-batched and they do NOT run in the frozen machine — frozen coffee is the only product on the Spaceman 6455-CL.</p>

<h3>Syrup Amounts by Size</h3>
<table>
  <thead><tr><th>Size</th><th>Frozen Energy Syrup</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>0.5 oz</td></tr>
    <tr><td>16 oz</td><td>1 oz</td></tr>
    <tr><td>20 oz</td><td>1.5 oz</td></tr>
    <tr><td>24 oz</td><td>2 oz</td></tr>
  </tbody>
</table>

<h3>Comparison: Regular vs. Frozen Energy</h3>
<table>
  <thead><tr><th>Size</th><th>Regular Energy</th><th>Frozen Energy</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>1 oz</td><td>0.5 oz</td></tr>
    <tr><td>16 oz</td><td>1.5 oz</td><td>1 oz</td></tr>
    <tr><td>20 oz</td><td>2 oz</td><td>1.5 oz</td></tr>
    <tr><td>24 oz</td><td>2 oz</td><td>2 oz</td></tr>
  </tbody>
</table>

<p>The Pattern: 0.5 → 1 → 1.5 → 2 (starts at 0.5 oz and increases by 0.5 oz per size)</p>

<h3>Key Points</h3>
<ul>
  <li>Frozen energy uses LESS syrup than regular energy at 12, 16, and 20 oz; the two match at 24 oz</li>
  <li>Blended to order — never pre-batched, never in the frozen machine</li>
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
            correctAnswers: ['0.5 oz'],
            explanation: '12oz frozen energy gets 0.5 oz of syrup.'
          },
          {
            id: 'fe2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 16oz frozen energy?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: '16oz frozen energy gets 1 oz of syrup.'
          },
          {
            id: 'fe3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 20oz frozen energy?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '20oz frozen energy gets 1.5 oz of syrup.'
          },
          {
            id: 'fe4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How is a frozen energy drink made?',
            options: ['Drawn from the frozen machine', 'Pre-batched in the morning', 'Blended to order individually', 'Poured over ice'],
            correctAnswers: ['Blended to order individually'],
            explanation: 'Frozen energy is blended to order — never pre-batched and never run in the frozen machine.'
          },
          {
            id: 'fe5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the pattern for frozen energy syrup amounts?',
            options: ['0.5 / 1 / 1.5 / 2', '1 / 1.5 / 2 / 2.5', '1 / 1.5 / 2 / 2', '0.5 / 0.5 / 1 / 1'],
            correctAnswers: ['0.5 / 1 / 1.5 / 2'],
            explanation: 'The frozen energy pattern is 0.5 / 1 / 1.5 / 2 — lighter than regular energy except at 24 oz where they match.'
          },
          {
            id: 'fe6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 24oz frozen energy?',
            options: ['1.5 oz', '2 oz', '2.5 oz', '3 oz'],
            correctAnswers: ['2 oz'],
            explanation: '24oz frozen energy gets 2 oz of syrup — the same as a 24oz regular energy.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 22: FROZEN COFFEE ─────────────────────────────────────────
  {
    id: 'm-frozen-coffee',
    title: 'Module 24: Frozen Coffee',
    description: 'Learn frozen coffee sizes, syrup, and sauce measurements.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-frozen-coffee-content',
        moduleId: 'm-frozen-coffee',
        title: 'Frozen Coffee Standards',
        type: 'CONTENT' as const,
        content: `<p>Frozen coffee comes in 3 sizes: 16 oz, 20 oz, and 24 oz. (Not offered in 12 oz!)</p>

<p>All frozen coffee is built as a <strong>single dairy base</strong> — whole milk, chilled espresso, and 1:1 simple syrup, nothing else — and flavored per drink at the window. The base runs in the Spaceman 6455-CL. Flavor is NEVER batched into the hopper.</p>

<h3>Per Drink</h3>
<p>Draw into cup → Add flavor syrup → Lid → Serve. Frozen coffee <strong>fills the whole cup</strong> — it does not use the iced fill lines.</p>
<table>
  <thead><tr><th>Cup Size</th><th>Frozen Coffee</th><th>Flavor Syrup</th></tr></thead>
  <tbody>
    <tr><td>16 oz</td><td>14 oz</td><td>1 oz</td></tr>
    <tr><td>20 oz</td><td>18.5 oz</td><td>1.5 oz</td></tr>
    <tr><td>24 oz</td><td>22 oz</td><td>2 oz</td></tr>
  </tbody>
</table>

<h3>Base Non-Negotiables</h3>
<ul>
  <li>Espresso is FULLY CHILLED before it goes in the hopper</li>
  <li>Viscosity stays at 1</li>
  <li>Never serve before 15 minutes after switching to FREEZE</li>
</ul>

<h3>Key Points to Memorize</h3>
<ul>
  <li>3 sizes: 16, 20, 24 oz — no 12 oz</li>
  <li>Syrup: 1 / 1.5 / 2 oz</li>
  <li>Fills the whole cup — ignores the iced fill lines</li>
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
            correctAnswers: ['16oz, 20oz, 24oz'],
            explanation: 'Frozen coffee comes in 16oz, 20oz, and 24oz — it is not offered in 12oz.'
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
            question: 'How much frozen coffee do you draw for a 20oz cup?',
            options: ['14 oz', '18.5 oz', '20 oz', '22 oz'],
            correctAnswers: ['18.5 oz'],
            explanation: 'A 20oz frozen coffee is 18.5 oz of frozen coffee plus 1.5 oz flavor syrup.'
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
            question: 'What is in the frozen coffee base?',
            options: ['Whole milk, chilled espresso, and 1:1 simple syrup', 'Milk, ice cream base, and espresso', 'Espresso, sugar, and 2% milk', 'Cold brew and sweet cream'],
            correctAnswers: ['Whole milk, chilled espresso, and 1:1 simple syrup'],
            explanation: 'The base is pure dairy: whole milk, chilled espresso, and 1:1 simple syrup — nothing else. Flavor is added per drink at the window.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 23: LEMONADES ─────────────────────────────────────────────
  {
    id: 'm-lemonades',
    title: 'Module 25: Lemonades (Regular & Frozen)',
    description: 'Master regular and frozen lemonade recipes and measurements.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-lemonades-content',
        moduleId: 'm-lemonades',
        title: 'Lemonade Standards',
        type: 'CONTENT' as const,
        content: `<h3>Regular (Iced) Lemonades</h3>
<p>Lemonade is <strong>not built anymore</strong> — the concentrate-and-water build is retired. Dispense lemonade straight from the <strong>soda gun</strong> to the fill line for the cup size, then flavor per the syrup chart.</p>
<table>
  <thead><tr><th>Size</th><th>Syrup</th><th>Fill Line</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>1 oz</td><td>9 oz</td></tr>
    <tr><td>16 oz</td><td>1.5 oz</td><td>11 oz</td></tr>
    <tr><td>20 oz</td><td>2 oz</td><td>14 oz</td></tr>
    <tr><td>24 oz</td><td>2 oz</td><td>16 oz</td></tr>
  </tbody>
</table>

<h3>Lemonade Flavors</h3>
<ul>
  <li>Boundaries Lagoon — Blue Raspberry, Coconut, Lime</li>
  <li>Cherry Limeade — Cherry, Lime, Lemon</li>
  <li>Pink Paradise — Strawberry &amp; Vanilla</li>
  <li>Sunset — Pineapple, Mango, Strawberry</li>
</ul>

<h3>Frozen Lemonades</h3>
<p>Frozen lemonades are <strong>blended to order individually</strong> — no pre-batch, and they never run in the frozen machine.</p>
<table>
  <thead><tr><th>Size</th><th>Syrup</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>1 oz</td></tr>
    <tr><td>16 oz</td><td>1.5 oz</td></tr>
    <tr><td>20 oz</td><td>2 oz</td></tr>
    <tr><td>24 oz</td><td>2 oz</td></tr>
  </tbody>
</table>`
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
            question: 'In a regular 16oz flavored lemonade, how much syrup?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '16oz lemonade gets 1.5 oz of flavor syrup.'
          },
          {
            id: 'le2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How is a regular lemonade built?',
            options: ['Concentrate + water + syrup', 'Lemonade from the soda gun to the fill line, then flavor syrup', 'Equal parts concentrate and syrup', 'Blended with ice'],
            correctAnswers: ['Lemonade from the soda gun to the fill line, then flavor syrup'],
            explanation: 'Lemonade is not built — dispense it from the soda gun to the fill line, then add flavor syrup.'
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
            question: 'In a regular 24oz flavored lemonade, how much syrup?',
            options: ['1.5 oz', '2 oz', '2.5 oz', '3 oz'],
            correctAnswers: ['2 oz'],
            explanation: '24oz lemonade gets 2 oz of flavor syrup — the same as 20oz.'
          },
          {
            id: 'le5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How are frozen lemonades made?',
            options: ['Drawn from the frozen machine', 'Pre-batched each morning', 'Blended to order individually', 'Poured over crushed ice'],
            correctAnswers: ['Blended to order individually'],
            explanation: 'Frozen lemonades are blended to order — no pre-batch, and they never run in the frozen machine.'
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
            question: 'How much syrup goes in a 16oz FROZEN lemonade?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '16oz frozen lemonade gets 1.5 oz of syrup.'
          },
          {
            id: 'le8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the fill line for a 24oz lemonade?',
            options: ['14 oz', '16 oz', '17 oz', '18 oz'],
            correctAnswers: ['16 oz'],
            explanation: 'The 24oz cup fills to the 16 oz line — the universal fill line for every iced category.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 24: SMOOTHIES ─────────────────────────────────────────────
  {
    id: 'm-smoothies',
    title: 'Module 26: Smoothies',
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
    title: 'Module 27: Teas',
    description: 'Learn tea concentrate preparation, steep times, and sweetening standards.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-teas-content',
        moduleId: 'm-teas',
        title: 'Tea Standards',
        type: 'CONTENT' as const,
        content: `<h3>Tea Lineup</h3>
<table>
  <thead><tr><th>Tea</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td>Pomberry Punch</td><td>Pomegranate &amp; Fresh Blueberry</td></tr>
    <tr><td>Lavender Breeze</td><td>Rooibos, Coconut, Lavender</td></tr>
    <tr><td>Citrus Oolong</td><td>Taiwanese Oolong &amp; Orange</td></tr>
    <tr><td>Honey Bee</td><td>Black tea, Honey, Peach &amp; Ginger</td></tr>
    <tr><td>Raspberry Hibiscus</td><td>Floral, light, refreshing</td></tr>
  </tbody>
</table>
<p><em>Steep times, temperatures, and per-flavor builds are still open in Recipe Book v1.10 — follow posted store guidance until documented.</em></p>

<h3>Hot Teas</h3>
<ul>
  <li>Use empty sachets filled with loose tea</li>
  <li>Each sachet: 3.5 grams</li>
</ul>

<h3>Iced Tea Syrup (by size)</h3>
<table>
  <thead><tr><th>Size</th><th>Syrup</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>1 oz</td></tr>
    <tr><td>16 oz</td><td>1.5 oz</td></tr>
    <tr><td>20 oz</td><td>2 oz</td></tr>
    <tr><td>24 oz</td><td>2 oz</td></tr>
  </tbody>
</table>
<p>Note: 20 oz and 24 oz use the same amount (2 oz) — the standard 1 / 1.5 / 2 / 2 pattern shared with energy drinks, sodas, and lemonades.</p>

<h3>Key Points</h3>
<ul>
  <li>Hot tea sachets = 3.5 grams</li>
  <li>Iced tea syrup pattern: 1 / 1.5 / 2 / 2 (20oz and 24oz are the same)</li>
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
            question: 'How much syrup goes in a 16oz iced tea?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: '16oz iced tea gets 1.5 oz of syrup.'
          },
          {
            id: 'te3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 24oz iced tea?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['2 oz'],
            explanation: '24oz iced tea gets 2 oz of syrup.'
          },
          {
            id: 'te4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'A 20oz and 24oz iced tea have the same syrup amount. True or False?',
            options: ['True', 'False'],
            correctAnswers: ['True'],
            explanation: 'Both 20oz and 24oz iced teas use 2 oz of syrup.'
          },
          {
            id: 'te5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Which tea is Pomegranate & Fresh Blueberry?',
            options: ['Raspberry Hibiscus', 'Pomberry Punch', 'Honey Bee', 'Lavender Breeze'],
            correctAnswers: ['Pomberry Punch'],
            explanation: 'Pomberry Punch is the pomegranate and fresh blueberry tea.'
          },
          {
            id: 'te6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Which tea contains Rooibos, Coconut, and Lavender?',
            options: ['Citrus Oolong', 'Honey Bee', 'Lavender Breeze', 'Raspberry Hibiscus'],
            correctAnswers: ['Lavender Breeze'],
            explanation: 'Lavender Breeze is the rooibos, coconut, and lavender tea.'
          },
          {
            id: 'te7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the iced tea syrup pattern (12/16/20/24)?',
            options: ['0.5 / 1 / 1.5 / 2', '0.5 / 1 / 1.5 / 1.5', '1 / 1.5 / 2 / 2', '0.5 / 0.5 / 1 / 1'],
            correctAnswers: ['1 / 1.5 / 2 / 2'],
            explanation: 'Iced teas follow the standard 1 / 1.5 / 2 / 2 pattern — the same as energy drinks, sodas, and lemonades.'
          },
          {
            id: 'te8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 12oz iced tea?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: '12oz iced tea gets 1 oz of syrup.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 26: KIDS DRINKS ───────────────────────────────────────────
  {
    id: 'm-kids-drinks',
    title: 'Module 28: Kids Drinks',
    description: 'Learn the recipes for Unicorn Latte, Dino Juice, Zebra Milk, and Kiddos Coffee.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-kids-drinks-content',
        moduleId: 'm-kids-drinks',
        title: 'Kids Drink Standards',
        type: 'CONTENT' as const,
        content: `<h3>Unicorn Tea Latte</h3>
<ul>
  <li>Half Unicorn Tea Concentrate, half milk. Caffeine-free.</li>
  <li>Sweeten with simple syrup — volume follows the Iced Teas row in Syrup by Drink Size</li>
</ul>

<h3>Dino Juice</h3>
<p>Flavored lemonade — equal parts Blue Raspberry and Pineapple over soda-gun lemonade. Syrup volume follows the Lemonade row, two-way split.</p>
<table>
  <thead><tr><th>Size</th><th>Blue Raspberry</th><th>Pineapple</th></tr></thead>
  <tbody>
    <tr><td>12 oz</td><td>0.5 oz</td><td>0.5 oz</td></tr>
    <tr><td>16 oz</td><td>0.75 oz</td><td>0.75 oz</td></tr>
    <tr><td>20 oz</td><td>1 oz</td><td>1 oz</td></tr>
    <tr><td>24 oz</td><td>1 oz</td><td>1 oz</td></tr>
  </tbody>
</table>

<h3>Zebra Milk</h3>
<ul>
  <li>Milk with dark and white chocolate sauce, split evenly</li>
  <li><strong>12 oz: 20g total sauce. All other sizes: 40g total.</strong></li>
  <li>Measured in grams because it uses sauce rather than syrup</li>
</ul>

<h3>Kiddos</h3>
<ul>
  <li>Steamed milk, 8 oz total. Kids temp, no caffeine.</li>
  <li>0.5 oz of any flavor syrup</li>
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
            question: 'How much total sauce goes in a 16oz Zebra Milk?',
            options: ['20 grams', '30 grams', '40 grams', '50 grams'],
            correctAnswers: ['40 grams'],
            explanation: 'Zebra Milk is 20g total at 12oz and 40g total at all other sizes, split evenly between dark and white chocolate.'
          },
          {
            id: 'kd2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much Dark Chocolate sauce goes in a 12oz Zebra Milk?',
            options: ['5 grams', '10 grams', '15 grams', '20 grams'],
            correctAnswers: ['10 grams'],
            explanation: 'A 12oz Zebra Milk is 20g total sauce split evenly: 10g dark + 10g white chocolate.'
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
            question: 'In a Dino Juice, the syrup volume follows which rule?',
            options: ['The Latte row (flat 1 oz)', 'The Lemonade row, split two ways', 'The Energy row, split three ways', 'Always 0.5 oz each'],
            correctAnswers: ['The Lemonade row, split two ways'],
            explanation: 'Dino Juice follows the Lemonade syrup row (1 / 1.5 / 2 / 2), split equally between Blue Raspberry and Pineapple.'
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
            question: 'How much total sauce (dark + white choc) goes in a 12oz Zebra Milk?',
            options: ['10 grams', '15 grams', '20 grams', '40 grams'],
            correctAnswers: ['20 grams'],
            explanation: 'A 12oz Zebra Milk has 20g total sauce (10g dark + 10g white). All other sizes get 40g total.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 27: BATCH BREW ────────────────────────────────────────────
  {
    id: 'm-batch-brew',
    title: 'Module 29: Batch Brew & Cold Brew',
    description: 'Fetco batch brew and the full Toddy cold brew process — grind, bag setup, steep, dilute, and package.',
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
      },
      {
        id: 'l-cold-brew-content',
        moduleId: 'm-batch-brew',
        title: 'Cold Brew — The Toddy Process',
        type: 'CONTENT' as const,
        content: `<p>Cold brew is a 10-hour commitment — a mistake at setup costs a full day of product. Every step below matters, in this exact order.</p>

<h3>The Bag Setup (where most mistakes happen)</h3>
<ol>
  <li>The <strong>paper filter bag goes INSIDE the mesh filter bag</strong>.</li>
  <li>Both go into the Toddy bucket together.</li>
  <li>ALL of the grounds go into the paper bag.</li>
</ol>

<h3>The Full Process</h3>
<ol>
  <li><strong>Grind</strong> the ENTIRE 5 lb bag of Cold Brew Roast — EK-43, <strong>grind setting 13</strong>. (Batch brew is 9 — do not mix them up.)</li>
  <li><strong>Set up the bags</strong>: paper filter bag inside the mesh filter bag, in the Toddy bucket.</li>
  <li><strong>Add all grounds</strong> to the paper bag.</li>
  <li><strong>First water</strong>: pour 7 quarts <em>inside the paper bag</em>, saturating the grounds.</li>
  <li><strong>Tie the bag.</strong></li>
  <li><strong>Second water</strong>: pour another 7 quarts <em>over the top of the tied bag</em>.</li>
  <li><strong>Steep 10 hours.</strong></li>
  <li><strong>Label</strong> with your name and the time brewed.</li>
  <li><strong>Strain</strong> and discard grounds carefully — the bag is heavy and tears easily.</li>
  <li><strong>Dilute</strong>: add 7 quarts fresh water to the Toddy.</li>
  <li><strong>Package</strong>: fill and crimp Nitro bags, label them, store <strong>FIFO</strong> in the walk-in.</li>
</ol>

<h3>The Numbers to Memorize</h3>
<table>
  <thead><tr><th>Spec</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Coffee</td><td>Entire 5 lb bag of Cold Brew Roast</td></tr>
    <tr><td>Grind</td><td>EK-43, setting 13</td></tr>
    <tr><td>Water</td><td>7 quarts inside the bag + 7 quarts on top + 7 quarts dilution after steeping (21 total)</td></tr>
    <tr><td>Steep</td><td>10 hours</td></tr>
  </tbody>
</table>

<h3>Common Mistakes That Ruin a Batch</h3>
<ul>
  <li>Wrong grind setting (using batch brew's 9 instead of 13)</li>
  <li>Skipping the mesh bag, or putting the mesh inside the paper instead of paper inside mesh</li>
  <li>Pouring all 14 quarts at once instead of 7 inside, tie, 7 on top</li>
  <li>Forgetting to tie the bag before the second pour</li>
  <li>Pulling it early or letting it sit well past 10 hours</li>
  <li>Skipping the 7-quart dilution — the concentrate is NOT ready to serve</li>
  <li>No label, or packaged bags stored out of FIFO order</li>
</ul>`
      },
      {
        id: 'l-cold-brew-quiz',
        moduleId: 'm-batch-brew',
        title: 'Cold Brew Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'cb1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much coffee goes into a cold brew batch?',
            options: ['240 grams', 'Half a 5 lb bag', 'The entire 5 lb bag of Cold Brew Roast', 'Two 5 lb bags'],
            correctAnswers: ['The entire 5 lb bag of Cold Brew Roast'],
            explanation: 'The whole 5 lb bag, ground on the EK-43 at setting 13.'
          },
          {
            id: 'cb2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What grind setting for cold brew on the EK-43?',
            options: ['9', '11', '13', '15'],
            correctAnswers: ['13'],
            explanation: 'Cold brew is setting 13. Batch brew is 9 — do not mix them up.'
          },
          {
            id: 'cb3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How do the filter bags go into the Toddy?',
            options: ['Mesh bag inside the paper bag', 'Paper bag inside the mesh bag', 'Paper bag only', 'Mesh bag only'],
            correctAnswers: ['Paper bag inside the mesh bag'],
            explanation: 'Paper inside mesh, both in the bucket — then all the grounds go into the paper bag.'
          },
          {
            id: 'cb4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How is the water added?',
            options: ['All 14 quarts at once over the bag', '7 quarts inside the paper bag, tie it, then 7 quarts over the top', '7 quarts total, tied first', '21 quarts before tying'],
            correctAnswers: ['7 quarts inside the paper bag, tie it, then 7 quarts over the top'],
            explanation: 'First 7 quarts saturate the grounds INSIDE the bag, then tie, then 7 more on top.'
          },
          {
            id: 'cb5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How long does cold brew steep?',
            options: ['4 hours', '8 hours', '10 hours', '24 hours'],
            correctAnswers: ['10 hours'],
            explanation: 'Steep 10 hours, labeled with name and time brewed.'
          },
          {
            id: 'cb6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'After straining, what happens before packaging?',
            options: ['Serve it immediately', 'Add 7 quarts fresh water to the Toddy', 'Add ice', 'Re-steep for 2 hours'],
            correctAnswers: ['Add 7 quarts fresh water to the Toddy'],
            explanation: 'The concentrate must be diluted with 7 quarts of fresh water — it is NOT ready to serve straight.'
          },
          {
            id: 'cb7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How is finished cold brew stored?',
            options: ['In the Toddy bucket on the counter', 'Nitro bags, filled and crimped, labeled, FIFO in the walk-in', 'Open pitchers in the fridge', 'Frozen'],
            correctAnswers: ['Nitro bags, filled and crimped, labeled, FIFO in the walk-in'],
            explanation: 'Fill and crimp Nitro bags, label them, and store first-in-first-out in the walk-in.'
          },
          {
            id: 'cb8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Why does a setup mistake matter more for cold brew than most drinks?',
            options: ['It doesn\'t', 'The steep takes 10 hours — a bad setup costs a full day of product', 'Cold brew is cheap to remake', 'The machine catches errors'],
            correctAnswers: ['The steep takes 10 hours — a bad setup costs a full day of product'],
            explanation: 'You will not know the batch is bad until tomorrow. Setup discipline is everything.'
          }
        ]
      },
      {
        id: 'l-cold-brew-practice',
        moduleId: 'm-batch-brew',
        title: 'Hands-On: Brew a Toddy Batch with Your Trainer',
        type: 'PRACTICE' as const,
        content: `Run a real cold brew batch start to finish with your trainer watching. The steep finishes tomorrow — your trainer checks the label and the packaging on the follow-up.`,
        checklistItems: [
          { id: 'cbp-1', title: 'Grind the full 5 lb bag at setting 13', description: 'Confirm the EK-43 is on 13 (not batch brew\'s 9) before grinding.', requiresPhoto: true },
          { id: 'cbp-2', title: 'Set up the bags correctly', description: 'Paper filter bag INSIDE the mesh filter bag, both seated in the Toddy bucket.', requiresPhoto: true },
          { id: 'cbp-3', title: 'Add all grounds to the paper bag', description: 'Every bit of the 5 lb bag goes in.' },
          { id: 'cbp-4', title: 'First 7 quarts inside the bag', description: 'Pour inside the paper bag, saturating all the grounds.' },
          { id: 'cbp-5', title: 'Tie the bag', description: 'Tie securely before the second pour.', requiresPhoto: true },
          { id: 'cbp-6', title: 'Second 7 quarts over the top', description: 'Pour over the tied bag.' },
          { id: 'cbp-7', title: 'Label with name and time', description: 'So the 10-hour steep can be tracked by whoever closes or opens.', requiresPhoto: true },
          { id: 'cbp-8', title: 'Next day: strain, dilute, package', description: 'Strain carefully, add 7 quarts fresh water, fill and crimp Nitro bags, label, store FIFO.', requiresPhoto: true }
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
  <li>Matchas — flavor builds, syrup, and milk standards</li>
  <li>Nitro Cold Brew — standard build and flavor variations</li>
  <li>Energy Drinks — syrup and fill line charts</li>
  <li>Sodas — shared syrup rules with energy drinks</li>
  <li>Frozen Energy — blended to order, lighter syrup pattern</li>
  <li>Frozen Coffee — dairy base, sizes, and per-drink pours</li>
  <li>Lemonades — base-to-fill-line builds</li>
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
            question: 'How much total syrup goes in ANY matcha, regardless of size?',
            options: ['0.5 oz', '1 oz', '1.5 oz', 'It scales with size'],
            correctAnswers: ['1 oz'],
            explanation: 'Matchas hold at 1 oz total syrup across all sizes, hot or iced.'
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
            correctAnswers: ['1.5 oz'],
            explanation: '16oz regular energy drinks get 1.5 oz of syrup.'
          },
          {
            id: 'fx4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 16oz FROZEN energy drink?',
            options: ['0.5 oz', '1 oz', '1.5 oz', '2 oz'],
            correctAnswers: ['1 oz'],
            explanation: '16oz frozen energy gets 1 oz — lighter than the 1.5 oz in a regular 16oz energy.'
          },
          {
            id: 'fx5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Frozen coffee comes in which sizes?',
            options: ['12oz and 16oz', '16oz and 20oz', '12oz, 16oz, 20oz', '16oz, 20oz, 24oz'],
            correctAnswers: ['16oz, 20oz, 24oz'],
            explanation: 'Frozen coffee comes in 16oz, 20oz, and 24oz — it is not offered in 12oz.'
          },
          {
            id: 'fx6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How is a regular lemonade built?',
            options: ['Concentrate + syrup + water', 'Lemonade from the soda gun to the fill line, then flavor syrup', 'Equal parts concentrate and syrup', 'Blended with ice'],
            correctAnswers: ['Lemonade from the soda gun to the fill line, then flavor syrup'],
            explanation: 'Lemonade is not built — dispense it from the soda gun to the fill line, then flavor per the syrup chart.'
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
            question: 'How much syrup goes in a 20oz iced tea?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['2 oz'],
            explanation: '20oz iced tea gets 2 oz of syrup.'
          },
          {
            id: 'fx9',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How many grams of chocolate sauce (each type) go in a 12oz Zebra Milk?',
            options: ['5 grams', '10 grams', '15 grams', '20 grams'],
            correctAnswers: ['10 grams'],
            explanation: 'A 12oz Zebra Milk gets 10g dark + 10g white chocolate (20g total). All other sizes get 40g total.'
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
            question: 'What is the fill line for a 24oz cup?',
            options: ['14 oz', '16 oz', '17 oz', '18 oz'],
            correctAnswers: ['16 oz'],
            explanation: 'The 24oz cup fills to the 16 oz line — the universal fill line across every iced category.'
          },
          {
            id: 'fx14',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much flavor syrup goes in a 24oz frozen coffee?',
            options: ['1 oz', '1.5 oz', '2 oz', '2.5 oz'],
            correctAnswers: ['2 oz'],
            explanation: '24oz frozen coffee gets 2 oz of flavor syrup (with 22 oz of frozen coffee).'
          },
          {
            id: 'fx15',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How are frozen lemonades and frozen energy drinks made?',
            options: ['Drawn from the frozen machine', 'Pre-batched each morning', 'Blended to order individually', 'Poured over crushed ice'],
            correctAnswers: ['Blended to order individually'],
            explanation: 'Both are blended to order — only frozen coffee runs in the Spaceman 6455-CL.'
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
            question: 'What is the matcha base batch recipe?',
            options: ['20g matcha + 200ml water', '30g matcha + 300ml water', '40g matcha + 400ml water', '50g matcha + 500ml water'],
            correctAnswers: ['30g matcha + 300ml water'],
            explanation: 'The matcha base is 30g matcha powder prepared with 300ml water.'
          }
        ]
      }
    ]
  },

  // ─── MODULE 28: KNOW YOUR ESPRESSO MACHINE ───────────────────────────
  {
    id: 'm-machine-parts',
    title: 'Module 4: Know Your Espresso Machine',
    description: 'Learn every part of the La Marzocco PB — what each piece is called and what it does.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-machine-parts-content',
        moduleId: 'm-machine-parts',
        title: 'La Marzocco PB — Parts & Functions',
        type: 'CONTENT' as const,
        videoUrl: 'https://youtube.com/shorts/ucEumO8kVYc',
        content: `<p>Our espresso machine is the <strong>La Marzocco PB, 3 group head</strong>. Every barista must know each part by name — when a trainer says "lock it into the group" or "purge the wand," you need to know exactly what they mean.</p>

<img src="/training/pb-parts.png" alt="La Marzocco PB parts diagram" style="max-width:100%;border-radius:12px;margin:12px 0;border:1px solid #e5e5e5;" />

<h3>Machine Parts</h3>
<table>
  <thead><tr><th>Part</th><th>What It Is / What It Does</th></tr></thead>
  <tbody>
    <tr><td><strong>Main Switch</strong></td><td>Powers the machine on and off.</td></tr>
    <tr><td><strong>Pressure Gauge</strong></td><td>Shows steam and brew water pressure so you can confirm the machine is at operating pressure.</td></tr>
    <tr><td><strong>Brew Groups (Group Heads)</strong></td><td>Where the portafilter locks in and hot water is forced through the coffee under pressure. Our PB has 3.</td></tr>
    <tr><td><strong>Group Keypad</strong></td><td>The buttons above each group that start and stop programmed shots (like the double-shot button).</td></tr>
    <tr><td><strong>Control Panel &amp; Digital Display</strong></td><td>Machine settings and readouts (temperature, timers).</td></tr>
    <tr><td><strong>Steam Wand</strong></td><td>The metal arm that injects steam into milk to heat and texture it. Purge after every use.</td></tr>
    <tr><td><strong>Steam Knob</strong></td><td>Opens and closes steam flow to the steam wand.</td></tr>
    <tr><td><strong>Hot Water Dispense Nozzle</strong></td><td>Dispenses hot water — used for Americanos and hot teas.</td></tr>
    <tr><td><strong>Removable Drain Tray</strong></td><td>Catches drips and purge water. Removed for cleaning.</td></tr>
    <tr><td><strong>Water Inspection Window</strong></td><td>Lets you visually check water in the machine.</td></tr>
    <tr><td><strong>Shot Timer</strong></td><td>Times the extraction so you can hit the ±2 second shot window.</td></tr>
  </tbody>
</table>

<h3>Tools That Work With the Machine</h3>
<table>
  <thead><tr><th>Tool</th><th>What It Does</th></tr></thead>
  <tbody>
    <tr><td><strong>Portafilter</strong></td><td>The handle with a metal filter basket that holds the ground coffee. It locks into the brew group.</td></tr>
    <tr><td><strong>Knock Box</strong></td><td>Where you knock the spent puck out of the portafilter.</td></tr>
    <tr><td><strong>Mahlkönig E80 GBW</strong></td><td>Our espresso grinder — grinds by weight directly into the portafilter (18g per double).</td></tr>
    <tr><td><strong>OCD Distributor</strong></td><td>Levels and evenly distributes the grounds in the basket before tamping.</td></tr>
    <tr><td><strong>PuqPress</strong></td><td>The automatic tamper — compresses the grounds with perfectly even pressure every time.</td></tr>
  </tbody>
</table>

<h3>Why Names Matter</h3>
<p>Espresso quality problems get diagnosed by part: channeling happens in the <em>basket</em>, temperature instability shows at the <em>group</em>, milk texture is made at the <em>wand tip</em>. If you know the parts, you can describe the problem — and fix it.</p>

<h3>What We Build With It — The Classics</h3>
<img src="/training/classics-poster.png" alt="Boundaries Classics: espresso, macchiato, cortado, cappuccino, latte, americano" style="max-width:100%;border-radius:12px;margin:12px 0;" />`
      },
      {
        id: 'l-machine-parts-quiz',
        moduleId: 'm-machine-parts',
        title: 'Espresso Machine Parts Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'mp1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is a portafilter?',
            options: ['The water reservoir', 'The handle with a metal filter basket that holds the ground coffee', 'The steam arm', 'The drip tray'],
            correctAnswers: ['The handle with a metal filter basket that holds the ground coffee'],
            explanation: 'The portafilter holds the dosed, tamped coffee and locks into the brew group.'
          },
          {
            id: 'mp2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the brew group (group head)?',
            options: ['The grinder attachment', 'Where the portafilter locks in and pressurized hot water is forced through the coffee', 'The milk steaming station', 'The hot water tap'],
            correctAnswers: ['Where the portafilter locks in and pressurized hot water is forced through the coffee'],
            explanation: 'The group head is where extraction happens. Our La Marzocco PB has three of them.'
          },
          {
            id: 'mp3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How many group heads does our La Marzocco PB have?',
            options: ['1', '2', '3', '4'],
            correctAnswers: ['3'],
            explanation: 'Our PB is a 3-group machine — three portafilters can brew at once.'
          },
          {
            id: 'mp4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What does the steam wand do?',
            options: ['Dispenses hot water for teas', 'Injects steam into milk to heat and texture it', 'Cleans the portafilter', 'Controls machine pressure'],
            correctAnswers: ['Injects steam into milk to heat and texture it'],
            explanation: 'The steam wand heats and textures milk. Purge it after every use.'
          },
          {
            id: 'mp5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What controls the flow of steam to the wand?',
            options: ['The group keypad', 'The main switch', 'The steam knob', 'The paddle'],
            correctAnswers: ['The steam knob'],
            explanation: 'The steam knob opens and closes steam flow to the wand.'
          },
          {
            id: 'mp6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Where does the water for an Americano come from?',
            options: ['The steam wand', 'The brew group', 'The hot water dispense nozzle', 'The drain tray'],
            correctAnswers: ['The hot water dispense nozzle'],
            explanation: 'Hot water for Americanos and hot teas comes from the dedicated hot water nozzle.'
          },
          {
            id: 'mp7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What does the pressure gauge show?',
            options: ['Shot weight', 'Steam and brew water pressure', 'Water temperature only', 'Grind size'],
            correctAnswers: ['Steam and brew water pressure'],
            explanation: 'The gauge confirms the machine is at proper steam and brew pressure.'
          },
          {
            id: 'mp8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Which tool tamps the coffee at Boundaries?',
            options: ['A hand tamper', 'The OCD distributor', 'The PuqPress automatic tamper', 'The portafilter itself'],
            correctAnswers: ['The PuqPress automatic tamper'],
            explanation: 'The PuqPress tamps with perfectly even, repeatable pressure. The OCD distributor levels the grounds BEFORE tamping.'
          },
          {
            id: 'mp9',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the knock box for?',
            options: ['Storing clean portafilters', 'Knocking the spent coffee puck out of the portafilter', 'Holding fresh grounds', 'Catching drips under the group'],
            correctAnswers: ['Knocking the spent coffee puck out of the portafilter'],
            explanation: 'After pulling a shot, the used puck gets knocked out into the knock box.'
          },
          {
            id: 'mp10',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What makes our Mahlkönig E80 GBW grinder special?',
            options: ['It grinds by time', 'It grinds by weight directly into the portafilter', 'It has no burrs', 'It tamps automatically'],
            correctAnswers: ['It grinds by weight directly into the portafilter'],
            explanation: 'GBW = grind by weight. It doses exactly 18g per double automatically.'
          }
        ]
      },
      {
        id: 'l-machine-parts-practice',
        moduleId: 'm-machine-parts',
        title: 'Hands-On: Machine Walkthrough with Your Trainer',
        type: 'PRACTICE' as const,
        content: `Stand at the machine WITH YOUR TRAINER and physically work through this checklist. Your trainer watches each item — this is about your hands knowing the machine, not just your memory.`,
        checklistItems: [
          { id: 'mw-1', title: 'Point out and name all machine parts', description: 'Main switch, pressure gauge, all 3 brew groups, group keypads, steam wands, steam knobs, hot water nozzle, drain tray, shot timer — name each out loud to your trainer.' },
          { id: 'mw-2', title: 'Remove and lock in a portafilter', description: 'Remove a portafilter from a group, then lock it back in cleanly — snug, handle centered.', requiresPhoto: true },
          { id: 'mw-3', title: 'Purge a group head', description: 'Run the single-dose rinse and explain to your trainer why we purge before brewing.' },
          { id: 'mw-4', title: 'Purge and wipe a steam wand', description: 'Open the steam knob to purge, wipe the wand with the wand cloth, purge again after.' },
          { id: 'mw-5', title: 'Dispense hot water', description: 'Use the hot water nozzle as you would for an Americano.' },
          { id: 'mw-6', title: 'Dose with the E80 GBW', description: 'Place the portafilter in the grinder cradle, let it tare and dose 18g, and show the green screen to your trainer.', requiresPhoto: true },
          { id: 'mw-7', title: 'Distribute and tamp', description: 'Level the puck with the OCD distributor, then tamp with the PuqPress.' },
          { id: 'mw-8', title: 'Knock out and clean', description: 'Knock the spent puck into the knock box, wipe the basket clean and dry.' },
          { id: 'mw-9', title: 'Remove and replace the drain tray', description: 'Pull the drain tray, rinse it, and seat it back correctly.' }
        ]
      }
    ]
  },

  // ─── MODULE 29: EXTRACTION, STEAMING & DIAL-IN STANDARDS ─────────────
  {
    id: 'm-extraction-standards',
    title: 'Module 5: Extraction, Steaming & Dial-In',
    description: 'The science of extraction, the Boundaries milk steaming standard, and the official dial-in procedure.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-extraction-content',
        moduleId: 'm-extraction-standards',
        title: 'Extraction Over Time',
        type: 'CONTENT' as const,
        content: `<p>Coffee flavors don't extract all at once — they come out in a predictable ORDER. Understanding this order is how you diagnose any brew by taste.</p>

<img src="/training/extraction-over-time.png" alt="Extraction Over Time diagram" style="max-width:100%;border-radius:12px;margin:12px 0;border:1px solid #e5e5e5;" />

<h3>The Three Stages of Extraction</h3>
<table>
  <thead><tr><th>Stage</th><th>What Extracts</th><th>What It Tastes Like</th></tr></thead>
  <tbody>
    <tr><td><strong>1. First</strong> (first 1/3 of brew)</td><td>Fruit acids &amp; organic salts</td><td>Sourness, fruitiness, vibrancy, complexity</td></tr>
    <tr><td><strong>2. Middle</strong></td><td>Simple &amp; complex sugars</td><td>Sweetness, balance, sugar-browning flavors, pleasant finish</td></tr>
    <tr><td><strong>3. Last</strong> (end of brew)</td><td>Bitter agents</td><td>Bitterness — too much creates a dry/chalky aftertaste</td></tr>
  </tbody>
</table>

<p><strong>Ideal extraction: 18–23%.</strong> The goal is to extract as many sugars as possible — enough to get past the acids, but stopping before the bitters take over.</p>

<h3>Diagnosing by Taste</h3>
<table>
  <thead><tr><th>The Brew Tastes...</th><th>The Problem</th><th>The Fix</th></tr></thead>
  <tbody>
    <tr><td>Sour, savory, salty, quick finish</td><td>UNDER-extracted (stopped in stage 1)</td><td><strong>Extract MORE</strong>: less coffee/more water, grind finer/brew longer, add a pour, higher temperature</td></tr>
    <tr><td>Sweet, bright, transparent, long pleasant finish</td><td>None — this is the best brew!</td><td>Nothing. Serve it.</td></tr>
    <tr><td>Astringent, hollow, lacks sweetness, long dry finish</td><td>OVER-extracted (went into stage 3)</td><td><strong>Extract LESS</strong>: more coffee/less water, grind coarser/brew faster, remove a pour, lower temperature</td></tr>
  </tbody>
</table>`
      },
      {
        id: 'l-extraction-quiz',
        moduleId: 'm-extraction-standards',
        title: 'Extraction Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'ex1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What extracts FIRST when brewing coffee?',
            options: ['Bitter agents', 'Sugars', 'Fruit acids and organic salts', 'Caffeine only'],
            correctAnswers: ['Fruit acids and organic salts'],
            explanation: 'Fruit acids and organic salts extract in the first 1/3 of the brew — they create sourness, fruitiness, and vibrancy.'
          },
          {
            id: 'ex2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What do the sugars (middle stage) add to the cup?',
            options: ['Sourness and vibrancy', 'Sweetness, balance, and a pleasant finish', 'Dryness and chalkiness', 'Extra caffeine'],
            correctAnswers: ['Sweetness, balance, and a pleasant finish'],
            explanation: 'Sugars add sweetness, balance, and sugar-browning flavors. The goal is to extract as many sugars as possible.'
          },
          {
            id: 'ex3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What extracts LAST, at the end of the brew?',
            options: ['Fruit acids', 'Organic salts', 'Sugars', 'Bitter agents'],
            correctAnswers: ['Bitter agents'],
            explanation: 'Bitter agents come out at the end as sugars slow down. Too many overpower the sweetness and leave a dry/chalky aftertaste.'
          },
          {
            id: 'ex4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the ideal extraction range?',
            options: ['10–15%', '18–23%', '25–30%', '30–34%'],
            correctAnswers: ['18–23%'],
            explanation: 'Ideal extraction is 18–23% — deep enough to capture the sugars, short of the heavy bitters.'
          },
          {
            id: 'ex5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'The brew tastes sour and salty with a quick finish. What do you do?',
            options: ['Extract LESS — grind coarser', 'Extract MORE — grind finer, brew longer, or raise temperature', 'Add more coffee', 'Serve it — that\'s the standard'],
            correctAnswers: ['Extract MORE — grind finer, brew longer, or raise temperature'],
            explanation: 'Sour/savory/salty means under-extracted — you stopped in the acid stage. Push extraction further to reach the sugars.'
          },
          {
            id: 'ex6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'The brew tastes astringent and hollow with a long dry finish. What do you do?',
            options: ['Extract MORE — grind finer', 'Extract LESS — grind coarser, brew faster, or lower temperature', 'Add a pour', 'Use less coffee'],
            correctAnswers: ['Extract LESS — grind coarser, brew faster, or lower temperature'],
            explanation: 'Astringent/dry means over-extracted — you went into the bitter stage. Pull extraction back.'
          },
          {
            id: 'ex7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What does the BEST brew taste like?',
            options: ['Strong and bitter', 'Sour and complex', 'Sweet, bright, and transparent with a long pleasant finish', 'Heavy and syrupy'],
            correctAnswers: ['Sweet, bright, and transparent with a long pleasant finish'],
            explanation: 'Sweet, bright, transparent, long pleasant finish — that is the target for every brew.'
          }
        ]
      },
      {
        id: 'l-steaming-standard-content',
        moduleId: 'm-extraction-standards',
        title: 'The Milk Steaming Standard',
        type: 'CONTENT' as const,
        videoUrl: 'https://youtube.com/shorts/VsX19AZE-GU',
        content: `<p>Milk steaming has two jobs — <strong>aeration</strong> (adding air for texture) and <strong>heat &amp; spin</strong> (rolling the milk to integrate that air). The Boundaries standard is defined by TEMPERATURE checkpoints you can feel on the pitcher.</p>

<img src="/training/milk-steaming.png" alt="Milk steaming temperature and aeration graph" style="max-width:100%;border-radius:12px;margin:12px 0;border:1px solid #e5e5e5;" />

<h3>The Two Controls</h3>
<table>
  <thead><tr><th>Control</th><th>How It Works</th></tr></thead>
  <tbody>
    <tr><td><strong>Aeration = steam wand DEPTH</strong></td><td>LOWER the pitcher to expose the wand tip → aerates (adds air). RAISE the pitcher to submerge the tip → stops aerating.</td></tr>
    <tr><td><strong>Spin = pitcher &amp; wand ANGLE</strong></td><td>Wand angled 40° out toward the barista, resting centered on the back wall of the pitcher, tip entering the milk in the center of quadrant 1. This rolls the milk in a whirlpool.</td></tr>
  </tbody>
</table>

<h3>The Temperature Timeline</h3>
<table>
  <thead><tr><th>Temperature</th><th>Feel</th><th>What You Do</th></tr></thead>
  <tbody>
    <tr><td>Start → 100°F</td><td>Cool → warm to the touch</td><td><strong>Aerate</strong> (tip exposed) while spinning</td></tr>
    <tr><td>100°F</td><td>Warm to the touch</td><td><strong>STOP aerating</strong> — submerge the tip</td></tr>
    <tr><td>100°F → 140–150°F</td><td>Getting hot</td><td><strong>Heat &amp; spin only</strong> — no more air</td></tr>
    <tr><td>140–150°F</td><td>Too hot to touch</td><td><strong>Shut off</strong></td></tr>
    <tr><td>160°F+</td><td>—</td><td>"Extra hot" requests only — never standard</td></tr>
  </tbody>
</table>

<h3>The Five Errors</h3>
<ol>
  <li>Over-aerating before 100°</li>
  <li>Under-aerating before 100°</li>
  <li><strong>Any</strong> aeration after 100°</li>
  <li>Burning the milk (over 160°)</li>
  <li>Insufficient spin</li>
</ol>`
      },
      {
        id: 'l-steaming-standard-quiz',
        moduleId: 'm-extraction-standards',
        title: 'Milk Steaming Standard Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'ms1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How do you control aeration while steaming?',
            options: ['Turn the steam knob higher', 'Steam wand DEPTH — lower the pitcher to expose the tip and aerate, raise it to stop', 'Tilt the pitcher side to side', 'Move the wand in circles'],
            correctAnswers: ['Steam wand DEPTH — lower the pitcher to expose the tip and aerate, raise it to stop'],
            explanation: 'Aeration = wand depth. Tip exposed adds air; tip submerged stops adding air.'
          },
          {
            id: 'ms2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'When do you STOP aerating?',
            options: ['After 5 seconds no matter what', 'At 100° — when the pitcher is warm to the touch', 'When the milk doubles in volume', 'When the pitcher is too hot to touch'],
            correctAnswers: ['At 100° — when the pitcher is warm to the touch'],
            explanation: 'All aeration happens before 100°F (warm to the touch). After that, submerge the tip — heat and spin only.'
          },
          {
            id: 'ms3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'When do you shut the steam off?',
            options: ['At 100°', 'At 120°', 'At 140–150° — when the pitcher is too hot to touch', 'At 180°'],
            correctAnswers: ['At 140–150° — when the pitcher is too hot to touch'],
            explanation: 'Shut off at 140–150°F, the point where the pitcher becomes too hot to keep your hand on.'
          },
          {
            id: 'ms4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'At what temperature is milk considered BURNED?',
            options: ['Over 120°', 'Over 140°', 'Over 160°', 'Milk cannot burn'],
            correctAnswers: ['Over 160°'],
            explanation: 'Over 160°F burns the milk. 160°+ is only for explicit "extra hot" requests — never the standard.'
          },
          {
            id: 'ms5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the correct wand position for spin?',
            options: ['Straight down the center of the pitcher', 'Angled 40° toward the barista, on the back wall, tip in the center of quadrant 1', 'Flat against the side wall', 'Anywhere, as long as it\'s deep'],
            correctAnswers: ['Angled 40° toward the barista, on the back wall, tip in the center of quadrant 1'],
            explanation: 'That position rolls the milk in a whirlpool, integrating the air into silky microfoam.'
          },
          {
            id: 'ms6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Which of these is one of the Five Errors?',
            options: ['Spinning the milk after 100°', 'ANY aeration after 100°', 'Shutting off at 145°', 'Aerating before 100°'],
            correctAnswers: ['ANY aeration after 100°'],
            explanation: 'The Five Errors: over-aerating before 100°, under-aerating before 100°, ANY aeration after 100°, burning the milk (over 160°), and insufficient spin.'
          }
        ]
      },
      {
        id: 'l-dialin-content',
        moduleId: 'm-extraction-standards',
        title: 'The Dial-In Procedure',
        type: 'CONTENT' as const,
        content: `<p>Dialing in confirms the grinder is producing shots inside our standard before we serve a single drink. Follow this exact flow:</p>

<img src="/training/dial-in-flow.png" alt="Dial-in procedure flowchart" style="max-width:100%;border-radius:12px;margin:12px 0;border:1px solid #e5e5e5;" />

<h3>The Dial-In Flow</h3>
<ol>
  <li><strong>Purge 1 shot</strong> — pull and discard one shot to clear stale grounds from the burrs.</li>
  <li><strong>Pull 2 shots</strong> and time them.</li>
  <li><strong>Are they consistent?</strong> Consistent means the two shot times are <strong>within 2 seconds of each other</strong>.
    <ul><li>NO / not sure → <strong>pull 1 more</strong> and re-check.</li></ul>
  </li>
  <li><strong>Yes → average the times.</strong></li>
  <li><strong>Is the average inside the shot-time parameter?</strong> (±2 seconds of our standard shot time)
    <ul>
      <li>NO → <strong>adjust grind size</strong>, then start over: purge 1, pull 2.</li>
      <li>YES → <strong>taste it</strong> — the final gate is always flavor.</li>
    </ul>
  </li>
</ol>

<h3>Which Way Do I Adjust?</h3>
<ul>
  <li>Shots running <strong>too fast</strong> (short times, sour) → grind <strong>finer</strong></li>
  <li>Shots running <strong>too slow</strong> (long times, bitter/dry) → grind <strong>coarser</strong></li>
</ul>

<p><em>Remember from Extraction Over Time: fast shots stop in the acid stage (sour), slow shots run into the bitter stage. The shot time window exists to land you in the sugars.</em></p>`
      },
      {
        id: 'l-dialin-quiz',
        moduleId: 'm-extraction-standards',
        title: 'Dial-In Quiz',
        type: 'QUIZ' as const,
        quizQuestions: [
          {
            id: 'di1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the FIRST step of the dial-in procedure?',
            options: ['Pull 2 shots', 'Taste a shot', 'Purge 1 shot', 'Adjust the grind'],
            correctAnswers: ['Purge 1 shot'],
            explanation: 'Always purge one shot first to clear stale grounds from the burrs.'
          },
          {
            id: 'di2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'After purging, you pull 2 shots. What makes them "consistent"?',
            options: ['They look the same', 'Their times are within 2 seconds of each other', 'They weigh exactly the same', 'They were pulled on the same group'],
            correctAnswers: ['Their times are within 2 seconds of each other'],
            explanation: 'Consistent = the two shot times land within 2 seconds of each other.'
          },
          {
            id: 'di3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'The 2 shots are NOT consistent (or you\'re not sure). What next?',
            options: ['Adjust the grind immediately', 'Pull 1 more shot and re-check', 'Serve the faster one', 'Start the machine over'],
            correctAnswers: ['Pull 1 more shot and re-check'],
            explanation: 'Inconsistent or unsure → pull one more shot before making any grind change.'
          },
          {
            id: 'di4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'The average shot time is OUTSIDE the parameter. What do you do?',
            options: ['Taste it anyway', 'Adjust grind size, then purge 1 and pull 2 again', 'Just pull harder', 'Change the dose weight'],
            correctAnswers: ['Adjust grind size, then purge 1 and pull 2 again'],
            explanation: 'Out of parameter → adjust the grind and run the whole flow again from the purge.'
          },
          {
            id: 'di5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'The average time IS in parameter. What is the final step?',
            options: ['Open the store — you\'re done', 'Taste it', 'Pull 2 more to be safe', 'Log the time'],
            correctAnswers: ['Taste it'],
            explanation: 'The final gate is always flavor — a shot can hit the time window and still taste off.'
          },
          {
            id: 'di6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Shots are running too FAST and taste sour. Which way do you adjust?',
            options: ['Grind coarser', 'Grind finer', 'Lower the temperature', 'Use less coffee'],
            correctAnswers: ['Grind finer'],
            explanation: 'Fast + sour = under-extracted. A finer grind slows the water down and extracts further into the sugars.'
          }
        ]
      },
      {
        id: 'l-extraction-practice',
        moduleId: 'm-extraction-standards',
        title: 'Hands-On: Tasting, Steaming & Dial-In with Your Trainer',
        type: 'PRACTICE' as const,
        content: `This is the hands-on session from the Trainer Guide. Your trainer pulls three shots — one balanced, one under-extracted, one over-extracted — and coaches you through tasting, steaming, and a full solo dial-in.`,
        checklistItems: [
          { id: 'ep-1', title: 'Taste the balanced shot', description: 'Taste and describe the mouthfeel and flavor out loud. Write down what you taste.' },
          { id: 'ep-2', title: 'Taste the under- and over-extracted shots', description: 'Describe how each differs in look, mouthfeel, and taste from the balanced shot.' },
          { id: 'ep-3', title: 'Blind identification', description: 'Trainer shuffles three fresh shots. Identify which is balanced, under, and over by taste alone.', requiresPhoto: true },
          { id: 'ep-4', title: 'Steam milk to the checkpoints — round 1', description: 'Aerate until warm to the touch (100°), then heat & spin, shut off when too hot to touch (140–150°). Trainer verifies no aeration after 100°.' },
          { id: 'ep-5', title: 'Steam milk to the checkpoints — round 2', description: 'Repeat with correct wand position: 40° toward you, back wall, quadrant 1. Show the finished microfoam.', requiresPhoto: true },
          { id: 'ep-6', title: 'Name the Five Errors', description: 'Recite all five steaming errors to your trainer without looking.' },
          { id: 'ep-7', title: 'Run a full dial-in SOLO', description: 'Purge 1, pull 2, check consistency (within 2s), average, verify parameter, adjust grind if needed, repeat until in spec.', requiresPhoto: true },
          { id: 'ep-8', title: 'Taste your dialed-in shot', description: 'Final gate: taste it and tell your trainer whether you would serve it — and why.' }
        ]
      }
    ]
  },

  // ─── BOUNDARIES CERTIFICATION EXAM ───────────────────────────────────
  {
    id: 'm-certification-exam',
    title: 'Boundaries Certification Exam',
    description: 'The capstone exam — a little from every section of the Operations Manual, with a heavy focus on recipes. Covers culture, service, store flow, equipment, and every drink category.',
    category: 'ONBOARDING' as const,
    lessons: [
      {
        id: 'l-cert-exam-content',
        moduleId: 'm-certification-exam',
        title: 'Certification Exam Overview',
        type: 'CONTENT' as const,
        content: `<p>This is the capstone exam for the full Boundaries Academy. It touches every section of the Operations Manual and Recipe Book:</p>

<ul>
  <li><strong>Culture &amp; Service</strong> — mission, values, hospitality, order taking</li>
  <li><strong>Store Operations</strong> — Expo, food staffing, store flow, speed goals</li>
  <li><strong>Equipment</strong> — espresso system, frozen machine care</li>
  <li><strong>Recipes (the heavy focus)</strong> — espresso standards, Originals and signature mixes, matchas, nitro, sweet cream, energy, frozen drinks, lemonades, smoothies, teas, kids drinks, brewing</li>
</ul>

<h3>What to Expect</h3>
<ul>
  <li>30 questions — roughly one third operations, two thirds recipes</li>
  <li>Everything comes straight from the Operations Manual v1.8 and Recipe Book v1.10</li>
  <li>Review the Manual and Recipe Book sections in the app before attempting</li>
</ul>`
      },
      {
        id: 'l-cert-exam-quiz',
        moduleId: 'm-certification-exam',
        title: 'Certification Exam',
        type: 'QUIZ' as const,
        quizQuestions: [
          // ── Culture & Service ──
          {
            id: 'ce1',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the Boundaries Coffee mission?',
            options: ['Serve the best coffee in Texas', 'Push the boundaries of everyday coffee', 'Coffee fast, coffee fresh', 'Quality over everything'],
            correctAnswers: ['Push the boundaries of everyday coffee'],
            explanation: 'The mission: push the boundaries of everyday coffee.'
          },
          {
            id: 'ce2',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What are the three Boundaries core values?',
            options: ['Speed, Quality, Consistency', 'Passion, Hospitality, Selflessness', 'Service, Craft, Community', 'Welcome, Serve, Recover'],
            correctAnswers: ['Passion, Hospitality, Selflessness'],
            explanation: 'Core values: Passion, Hospitality, Selflessness. (Speed, Quality, Consistency are the cultural standards.)'
          },
          {
            id: 'ce3',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the total drive-thru time goal?',
            options: ['Under 2 minutes', 'Under 3.5 minutes', 'Under 5 minutes', 'Under 60 seconds'],
            correctAnswers: ['Under 3.5 minutes'],
            explanation: 'Goal is under 3.5 minutes total, and never more than 1 minute at the window.'
          },
          {
            id: 'ce4',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'When does the Order Taker stand outside by the menu board?',
            options: ['Always', 'When 2 or more people are clocked in', 'When 3 or more people are clocked in', 'Only during rush'],
            correctAnswers: ['When 3 or more people are clocked in'],
            explanation: 'With 3+ clocked in, the Order Taker works outside with the satchel and handheld POS.'
          },
          {
            id: 'ce5',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'With exactly 3 people on staff, who carries food responsibility?',
            options: ['Order Taker', 'Coffee Bar Person 2', 'The Exit Rider (Expo)', 'Not Coffee Bar'],
            correctAnswers: ['The Exit Rider (Expo)'],
            explanation: 'With 3 people, Expo/Exit Rider handles food. With 4+, food passes to the Food / Not Coffee position.'
          },
          {
            id: 'ce6',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the window time expectation for the Exit Rider?',
            options: ['At or under 60 seconds', 'Under 2 minutes', 'Under 3.5 minutes', 'No specific goal'],
            correctAnswers: ['At or under 60 seconds'],
            explanation: 'Window time at or under 60 seconds, with 100% order accuracy.'
          },
          {
            id: 'ce7',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What food rotation standard does Boundaries follow?',
            options: ['LIFO — last in, first out', 'FIFO — first in, first out', 'Use-by-feel', 'Newest first'],
            correctAnswers: ['FIFO — first in, first out'],
            explanation: 'FIFO rotation, with all prepped items labeled and dated.'
          },
          // ── Equipment ──
          {
            id: 'ce8',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the target window for espresso shot time?',
            options: ['±1 second of standard', '±2 seconds of standard', '±5 seconds of standard', '20-30 seconds'],
            correctAnswers: ['±2 seconds of standard'],
            explanation: 'Shots must land within ±2 seconds of the standard shot time.'
          },
          {
            id: 'ce9',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'After building a fresh frozen coffee batch and switching to FREEZE, when can you serve?',
            options: ['Immediately after a test pull', 'After 5 minutes', 'After a full 15 minutes', 'After 30 minutes'],
            correctAnswers: ['After a full 15 minutes'],
            explanation: 'Never serve before 15 minutes. Draw a small test pull first.'
          },
          {
            id: 'ce10',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Frozen coffee mix held in the hopper must stay at or below what temperature?',
            options: ['33°F', '38°F', '41°F', '45°F'],
            correctAnswers: ['41°F'],
            explanation: 'The base is dairy — a temperature-controlled food. Hold at or below 41°F; when in doubt, drain it.'
          },
          // ── Recipes: Espresso & Classics ──
          {
            id: 'ce11',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the espresso dose standard?',
            options: ['17g per single shot', '18g per double shot', '19g per double shot', '20g per double shot'],
            correctAnswers: ['18g per double shot'],
            explanation: 'Dose is 18g per double. One shot means a double (2 oz) — singles are not dosed or pulled.'
          },
          {
            id: 'ce12',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much espresso goes in an ICED Americano?',
            options: ['2 oz', '3 oz', '4 oz', '1 oz'],
            correctAnswers: ['3 oz'],
            explanation: 'Iced Americano takes 3 oz — pull two doubles and split one. Hot Americano takes 2 oz.'
          },
          {
            id: 'ce13',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'A Cappuccino is served at what size, with what foam?',
            options: ['4 oz, no foam', '6 oz, dry foam', '8 oz, thin microfoam', '3 oz, marked with foam'],
            correctAnswers: ['6 oz, dry foam'],
            explanation: 'Cappuccino: 6 oz, 2 oz espresso, dry foam. (Flat White is 8 oz with thin microfoam.)'
          },
          // ── Recipes: Lattes & Mixes ──
          {
            id: 'ce14',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much total syrup goes in a latte, at any size?',
            options: ['0.5 oz', '1 oz', '1.5 oz', 'Scales with size'],
            correctAnswers: ['1 oz'],
            explanation: 'Lattes hold at 1 oz total syrup across all sizes — and they are not sold at 24 oz.'
          },
          {
            id: 'ce15',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What are the three ingredients in the Texas Delight mix?',
            options: ['Caramel, Vanilla, Cinnamon', 'Honey, 1883 Vanilla, 1883 Cinnamon', 'Honey, Maple, Vanilla', 'Brown Sugar, Cinnamon, Vanilla'],
            correctAnswers: ['Honey, 1883 Vanilla, 1883 Cinnamon'],
            explanation: 'Texas Delight is equal thirds Honey, 1883 Vanilla, and 1883 Cinnamon — batched in-house as of July 2026.'
          },
          {
            id: 'ce16',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Why must Texas Delight be batched before Cinnamon Dulce?',
            options: ['It expires faster', 'Cinnamon Dulce uses Texas Delight mix as an ingredient', 'They share a bucket', 'No particular reason'],
            correctAnswers: ['Cinnamon Dulce uses Texas Delight mix as an ingredient'],
            explanation: 'Cinnamon Dulce = Texas Delight mix + Caramel + Brown Sugar Simple (2:1).'
          },
          {
            id: 'ce17',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is in the Hill Country mix?',
            options: ['64 oz Butter Pecan + 64 oz Caramel', '64 oz Honey + 64 oz Lavender', '64 oz White Chocolate + 64 oz Maple', '64 oz Caramel + 64 oz Vanilla'],
            correctAnswers: ['64 oz Butter Pecan + 64 oz Caramel'],
            explanation: 'Hill Country is 64 oz Butter Pecan + 64 oz Caramel. (Lavender Sunrise is Honey + Lavender; Harvest Moon is White Chocolate + Maple.)'
          },
          {
            id: 'ce18',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Can you substitute simple syrup for brown sugar simple at equal volume?',
            options: ['Yes, they are interchangeable', 'No — brown sugar simple is 2:1 and changes sweetness and sugar load', 'Only in hot drinks', 'Only in frozen drinks'],
            correctAnswers: ['No — brown sugar simple is 2:1 and changes sweetness and sugar load'],
            explanation: 'Simple syrup is 1:1; brown sugar simple is 2:1. They are NOT interchangeable at equal volume.'
          },
          // ── Recipes: Matcha, Nitro, Sweet Cream ──
          {
            id: 'ce19',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the matcha base preparation?',
            options: ['30g matcha + 300ml water', '20g matcha + 200ml water', '40g matcha + 300ml water', '30g matcha + 500ml water'],
            correctAnswers: ['30g matcha + 300ml water'],
            explanation: '30 grams matcha powder to 300 milliliters water.'
          },
          {
            id: 'ce20',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the standard nitro build?',
            options: ['Ice scoop, nitro to 2nd-to-last line, 3 oz sweet cream, 0.5 oz syrup', 'No ice, nitro to top, 2 oz cream, 1 oz syrup', 'Full ice, nitro halfway, 4 oz cream', 'Ice scoop, nitro to fill line, 1 oz syrup only'],
            correctAnswers: ['Ice scoop, nitro to 2nd-to-last line, 3 oz sweet cream, 0.5 oz syrup'],
            explanation: '1 scoop ice → nitro to the 2nd-to-last line → 3 oz sweet cream → 0.5 oz flavor syrup.'
          },
          {
            id: 'ce21',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is in a Cookie Butter nitro?',
            options: ['0.5 oz Biscoff + 10g White Chocolate', 'Equal parts White Chocolate and Speculoos — 0.25 oz each', '0.5 oz Speculoos only', '1 oz White Chocolate'],
            correctAnswers: ['Equal parts White Chocolate and Speculoos — 0.25 oz each'],
            explanation: 'Cookie Butter splits the 0.5 oz total equally: 0.25 oz White Chocolate + 0.25 oz Speculoos.'
          },
          {
            id: 'ce22',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is the standard sweet cream build, and how long can it be stored?',
            options: ['3 oz cream + 0.5 oz syrup, 24 hours max', '4 oz cream + 1 oz syrup, 48 hours max', '2 oz cream + 0.5 oz syrup, 12 hours max', '3 oz cream + 1 oz syrup, 1 week'],
            correctAnswers: ['3 oz cream + 0.5 oz syrup, 24 hours max'],
            explanation: 'Standard: 3 oz cream + 0.5 oz syrup. Prepared in tumblers, labeled and dated, stored cold, 24 hours maximum.'
          },
          // ── Recipes: Energy, Frozen, Sodas ──
          {
            id: 'ce23',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much syrup goes in a 16oz energy drink?',
            options: ['1 oz', '1.5 oz', '2 oz', '0.5 oz'],
            correctAnswers: ['1.5 oz'],
            explanation: 'Energy follows 1 / 1.5 / 2 / 2 — the same pattern as sodas, lemonades, and iced teas.'
          },
          {
            id: 'ce24',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'Blue Haze is a three-way split. In a 16oz, how much of EACH flavor?',
            options: ['0.33 oz each', '0.5 oz each', '0.67 oz each', '0.75 oz each'],
            correctAnswers: ['0.5 oz each'],
            explanation: '16oz = 1.5 oz total ÷ 3 flavors = 0.5 oz each of Lavender, Blue Raspberry, and Pomegranate.'
          },
          {
            id: 'ce25',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What is in the frozen coffee base?',
            options: ['Whole milk, chilled espresso, 1:1 simple syrup — nothing else', 'Milk, ice cream base, sugar', '2% milk, hot espresso, raw sugar', 'Cold brew, cream, vanilla'],
            correctAnswers: ['Whole milk, chilled espresso, 1:1 simple syrup — nothing else'],
            explanation: 'Pure dairy base. Espresso fully chilled first, viscosity stays at 1, flavor is never batched into the hopper.'
          },
          {
            id: 'ce26',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How are frozen energy drinks and frozen lemonades made?',
            options: ['Drawn from the frozen machine', 'Pre-batched each morning', 'Blended to order individually', 'Poured over crushed ice'],
            correctAnswers: ['Blended to order individually'],
            explanation: 'Both are blended to order. Frozen coffee is the ONLY product that runs on the Spaceman 6455-CL.'
          },
          // ── Recipes: Smoothies, Fill Lines, Kids, Brewing ──
          {
            id: 'ce27',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What goes in a 16oz smoothie?',
            options: ['4 oz puree + 3 oz water + heaping scoop of ice', '3 oz puree + 2 oz water + level scoop', '5 oz puree + 4 oz water + 2 scoops', '4 oz puree + 4 oz water + fill line ice'],
            correctAnswers: ['4 oz puree + 3 oz water + heaping scoop of ice'],
            explanation: '16oz = 4 oz puree + 3 oz water + heaping scoop (cup overflowing), then blend. Smoothies use no flavor syrup.'
          },
          {
            id: 'ce28',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'What are the cup fill lines for 12 / 16 / 20 / 24 oz?',
            options: ['9 / 11 / 14 / 16 oz', '9 / 11 / 14 / 17 oz', '8 / 10 / 13 / 15 oz', '10 / 12 / 15 / 17 oz'],
            correctAnswers: ['9 / 11 / 14 / 16 oz'],
            explanation: 'Fill line is a property of the cup: 9 / 11 / 14 / 16. Frozen drinks are the exception — they fill the whole cup.'
          },
          {
            id: 'ce29',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How much total chocolate sauce goes in a 16oz Zebra Milk?',
            options: ['20g', '30g', '40g', '10g'],
            correctAnswers: ['40g'],
            explanation: 'Zebra Milk: 20g total at 12oz, 40g total at all other sizes — split evenly between dark and white chocolate.'
          },
          {
            id: 'ce30',
            type: 'MULTIPLE_CHOICE' as const,
            question: 'How long does cold brew steep, and at what grind settings do batch brew and cold brew run?',
            options: ['10 hours; batch grind 9, cold brew grind 13', '8 hours; batch grind 7, cold brew grind 9', '12 hours; both at grind 11', '10 hours; both at grind 9'],
            correctAnswers: ['10 hours; batch grind 9, cold brew grind 13'],
            explanation: 'Cold brew steeps 10 hours. EK-43 settings: batch brew at 9, cold brew at 13.'
          }
        ]
      }
    ]
  },
  {
    id: 'm-food-close',
    title: 'Closing Duties: Food Counts',
    description: 'Playbook V2 §21–22: starting qty in Toast at open, 86 at 0, leftover + waste on the logbook food list every close.',
    category: 'ONBOARDING',
    lessons: [
      {
        id: 'l-food-close',
        moduleId: 'm-food-close',
        title: 'Open, 86, leftover, and waste',
        type: 'CONTENT',
        content: `<h3>THE WRITTEN CLOSE — FOOD</h3>
<p>Playbook V2 §21 Opening and §22 Closing. Owen orders food from these numbers. Do it the same way every day.</p>
<hr>
<h3>AT OPEN — Playbook V2 §21 Step 9</h3>
<p>GMs enter <strong>starting qty in Toast inventory</strong> for every food SKU they count (Main Street Bistro, Lisa Cordero tacos, Sysco food, pastry). Those items stay on Toast QUANTITY tracking.</p>
<p>Do not put food into the syrup / coffee inventory catalog.</p>
<hr>
<h3>WHEN QTY HITS 0</h3>
<p>Toast marks the item <strong>sold out / 86</strong>. BrewShift records the 86 time. <strong>Last-sold time</strong> from orders is the check — Manager Hub shows both. Do not pick one.</p>
<hr>
<h3>AT CLOSE — Playbook V2 §22 Step 6</h3>
<p>The old rule was a Toast POS waste log on Tuesday, Thursday, and Saturday only. That is replaced.</p>
<p>Every close, on the <strong>logbook Closing Checklist</strong>, enter <strong>leftover qty</strong> and <strong>waste qty</strong> on the <strong>food list</strong> (Toast food SKUs only).</p>
<ul>
<li>Leftover = still good</li>
<li>Waste = discarded</li>
<li>If it 86’d earlier, leftover is 0 and waste is what you threw away</li>
</ul>
<p>This is not Sortly and not the 31-syrup count. Spaceman teardown stays in Process Manual v1.8 §15 — do not skip it, and do not mix it up with food counts.</p>`
      },
      {
        id: 'l-food-close-quiz',
        moduleId: 'm-food-close',
        title: 'Food counts knowledge check',
        type: 'QUIZ',
        quizQuestions: [
          {
            id: 'fc1',
            type: 'MULTIPLE_CHOICE',
            question: 'Where do GMs enter starting food qty at open?',
            options: ['Toast inventory', 'The syrup catalog in the logbook', 'Sortly', 'Owen’s text thread'],
            correctAnswers: ['Toast inventory'],
            explanation: 'GMs enter starting qty in Toast at every open.'
          },
          {
            id: 'fc2',
            type: 'MULTIPLE_CHOICE',
            question: 'What does Toast do when a counted food qty hits 0?',
            options: ['Emails Owen', 'Marks the item sold out / 86', 'Zeros the syrup catalog', 'Locks the register'],
            correctAnswers: ['Marks the item sold out / 86'],
            explanation: 'Toast 86s the item. Last-sold time from orders is the check — both times are shown.'
          },
          {
            id: 'fc3',
            type: 'MULTIPLE_CHOICE',
            question: 'At close, leftover qty and waste qty are entered where?',
            options: ['Toast sales pacing', 'The food list on the logbook Closing Checklist', 'The coffee bag par sheet', 'A paper waste log only'],
            correctAnswers: ['The food list on the logbook Closing Checklist'],
            explanation: 'Playbook V2 §22: every close, leftover and waste for Toast food SKUs go on the logbook food list — not a three-night Toast waste log.'
          },
          {
            id: 'fc4',
            type: 'TRUE_FALSE',
            question: 'Last-sold time replaces 86 time. You only need one of the two.',
            correctAnswers: ['False'],
            explanation: 'Both times are required. Last-sold is the check, not a substitute.'
          }
        ]
      }
    ]
  }
];
