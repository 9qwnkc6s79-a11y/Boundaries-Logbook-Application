import { VentureTask, VentureWorkstream, VentureStage } from '../types';

// ─── The Launch Playbook ─────────────────────────────────────────────
// Every new venture gets seeded with this checklist so nothing gets
// missed on the road from idea to launch. Tasks are grouped into
// workstreams (Legal, Finance, Market, Brand, Pitch, Operations).

export const WORKSTREAM_META: Record<VentureWorkstream, { label: string; color: string; description: string }> = {
  MARKET: {
    label: 'Market Research',
    color: '#8B5CF6',
    description: 'Prove people actually want this before spending money on it.',
  },
  LEGAL: {
    label: 'Legal & Compliance',
    color: '#3B82F6',
    description: 'Entity formation, registrations, licenses, and contracts.',
  },
  FINANCE: {
    label: 'Finance & Budget',
    color: '#10B981',
    description: 'Startup costs, projections, pricing, accounting, and funding.',
  },
  BRAND: {
    label: 'Brand & Marketing',
    color: '#F59E0B',
    description: 'Name, logo, domain, website, and how customers will find you.',
  },
  PITCH: {
    label: 'Pitch & Fundraising',
    color: '#EC4899',
    description: 'Nail the story — for investors, partners, or a bank loan.',
  },
  OPERATIONS: {
    label: 'Operations & Launch',
    color: '#6366F1',
    description: 'Suppliers, tools, people, and the actual launch plan.',
  },
};

export const WORKSTREAM_ORDER: VentureWorkstream[] = ['MARKET', 'LEGAL', 'FINANCE', 'BRAND', 'PITCH', 'OPERATIONS'];

interface PlaybookTask {
  workstream: VentureWorkstream;
  title: string;
  description?: string;
}

const PLAYBOOK: PlaybookTask[] = [
  // Market Research — validate first
  { workstream: 'MARKET', title: 'Write down the problem in one sentence', description: 'If you can\'t explain the problem simply, the idea isn\'t ready yet.' },
  { workstream: 'MARKET', title: 'Define your target customer', description: 'Who exactly buys this? Age, situation, budget, where they hang out.' },
  { workstream: 'MARKET', title: 'Talk to 5-10 potential customers', description: 'Ask about their problem, not your solution. Take notes in the Notes tab.' },
  { workstream: 'MARKET', title: 'Research 3-5 competitors', description: 'What do they charge? What do their customers complain about?' },
  { workstream: 'MARKET', title: 'Estimate the market size', description: 'Rough numbers are fine — how many potential customers, spending how much?' },
  { workstream: 'MARKET', title: 'Run a small validation test', description: 'Landing page, pre-orders, a pilot batch — the cheapest way to test real demand.' },

  // Legal & Compliance
  { workstream: 'LEGAL', title: 'Choose a business entity type', description: 'LLC is the common default for small businesses; talk to a CPA/attorney about S-corp election as revenue grows.' },
  { workstream: 'LEGAL', title: 'Check name availability', description: 'State business registry, USPTO trademark search, domain, and social handles.' },
  { workstream: 'LEGAL', title: 'Register the entity with the state', description: 'File formation documents (e.g., articles of organization for an LLC).' },
  { workstream: 'LEGAL', title: 'Get an EIN from the IRS', description: 'Free at irs.gov — needed for bank accounts, hiring, and taxes.' },
  { workstream: 'LEGAL', title: 'Draft an operating agreement', description: 'Critical if there are partners — who owns what, who decides what, what happens on exit.' },
  { workstream: 'LEGAL', title: 'Identify required licenses & permits', description: 'City, county, state, and industry-specific (health dept, resale, professional, etc.).' },
  { workstream: 'LEGAL', title: 'Get business insurance quotes', description: 'General liability at minimum; workers comp if hiring.' },
  { workstream: 'LEGAL', title: 'Set up contracts & terms', description: 'Customer terms of service, vendor agreements, employment/contractor agreements.' },

  // Finance & Budget
  { workstream: 'FINANCE', title: 'Build the startup budget', description: 'Use the Budget tab — list every one-time cost to get to launch.' },
  { workstream: 'FINANCE', title: 'Map monthly operating costs', description: 'Rent, software, payroll, supplies — know your monthly burn before you start.' },
  { workstream: 'FINANCE', title: 'Set pricing & revenue model', description: 'What do you charge, and how does that compare to competitors?' },
  { workstream: 'FINANCE', title: 'Project 12 months of revenue', description: 'Conservative / expected / optimistic. Set the monthly target in the Budget tab.' },
  { workstream: 'FINANCE', title: 'Decide how to fund it', description: 'Savings, profits from existing business, loan, investors — and how much you need.' },
  { workstream: 'FINANCE', title: 'Open a business bank account', description: 'Keep venture money completely separate from day one.' },
  { workstream: 'FINANCE', title: 'Set up bookkeeping', description: 'QuickBooks or similar, and a folder for every receipt.' },
  { workstream: 'FINANCE', title: 'Plan for taxes', description: 'Quarterly estimates, sales tax registration if applicable, and a CPA relationship.' },

  // Brand & Marketing
  { workstream: 'BRAND', title: 'Lock in the business name', description: 'Final decision after the legal availability check clears.' },
  { workstream: 'BRAND', title: 'Buy the domain', description: 'Grab the .com plus obvious variants before announcing anything.' },
  { workstream: 'BRAND', title: 'Claim social media handles', description: 'Same handle everywhere, even on platforms you won\'t use yet.' },
  { workstream: 'BRAND', title: 'Get a logo & basic brand kit', description: 'Logo, two colors, one font. Simple beats fancy at this stage.' },
  { workstream: 'BRAND', title: 'Launch a landing page', description: 'One page: what it is, who it\'s for, and an email signup or waitlist.' },
  { workstream: 'BRAND', title: 'Plan the first 90 days of marketing', description: 'Where will the first 100 customers actually come from? Be specific.' },

  // Pitch & Fundraising
  { workstream: 'PITCH', title: 'Write the one-liner', description: 'One sentence anyone can repeat. It\'s the top field on this venture.' },
  { workstream: 'PITCH', title: 'Draft the pitch deck outline', description: 'Use the Pitch tab — it walks you through every slide with prompts.' },
  { workstream: 'PITCH', title: 'Build the deck', description: 'Turn the outline into slides (Canva, PowerPoint, Google Slides).' },
  { workstream: 'PITCH', title: 'Practice the 2-minute version', description: 'Out loud, timed. If it takes more than 2 minutes, cut it down.' },
  { workstream: 'PITCH', title: 'List who you\'ll pitch', description: 'Investors, bank, partners, or key first customers — names and warm intros.' },

  // Operations & Launch
  { workstream: 'OPERATIONS', title: 'List suppliers & key vendors', description: 'Who do you buy from, backup options, and payment terms.' },
  { workstream: 'OPERATIONS', title: 'Pick your core tools', description: 'POS, scheduling, invoicing, communication — keep the stack small.' },
  { workstream: 'OPERATIONS', title: 'Decide on location / space needs', description: 'Physical space, home-based, or online-only — and what it costs.' },
  { workstream: 'OPERATIONS', title: 'Plan the first hires', description: 'What roles, when you can afford them, and what you\'ll do solo until then.' },
  { workstream: 'OPERATIONS', title: 'Write the launch checklist', description: 'Everything that must be true on day one, working backwards from launch date.' },
  { workstream: 'OPERATIONS', title: 'Set a launch date', description: 'A real date on the calendar. Deadlines create momentum.' },
];

export function buildPlaybookTasks(ventureId: string): VentureTask[] {
  return PLAYBOOK.map((t, i) => ({
    id: `${ventureId}-pb-${i}`,
    workstream: t.workstream,
    title: t.title,
    description: t.description,
    done: false,
  }));
}

// ─── Pitch Deck Outline ──────────────────────────────────────────────

export interface PitchSlide {
  id: string;
  title: string;
  prompt: string;
  placeholder: string;
}

export const PITCH_SLIDES: PitchSlide[] = [
  { id: 'hook', title: 'The Hook', prompt: 'Open with the one-liner. What is this, in a sentence anyone can repeat?', placeholder: 'e.g., "We deliver fresh-roasted coffee subscriptions to offices in under 24 hours."' },
  { id: 'problem', title: 'The Problem', prompt: 'What painful, expensive, or annoying problem exists today? Make it real with a story or number.', placeholder: 'Who feels this pain, how often, and what does it cost them?' },
  { id: 'solution', title: 'The Solution', prompt: 'How do you solve it? Focus on the outcome for the customer, not features.', placeholder: 'What changes for the customer once they use this?' },
  { id: 'market', title: 'Market Size', prompt: 'How many people have this problem and what do they spend? Bottom-up beats top-down.', placeholder: 'e.g., "12,000 offices in the metro × $200/mo average = $2.4M/mo addressable."' },
  { id: 'model', title: 'Business Model', prompt: 'How do you make money? Price, margin, and how often customers pay.', placeholder: 'What do you charge, what does it cost you, what\'s left over?' },
  { id: 'competition', title: 'Competition', prompt: 'Who else solves this and why do customers pick you? "No competition" is a red flag.', placeholder: 'Name real alternatives (including "do nothing") and your edge over each.' },
  { id: 'traction', title: 'Traction', prompt: 'What proof exists so far? Sales, waitlist, pilots, letters of intent — anything real.', placeholder: 'Even small numbers beat big promises.' },
  { id: 'team', title: 'Team', prompt: 'Why are YOU the one to build this? Relevant experience and unfair advantages.', placeholder: 'What have you already built or run that proves you can do this?' },
  { id: 'financials', title: 'Financials', prompt: 'The 12-month picture: startup cost, monthly burn, revenue ramp, and break-even point.', placeholder: 'Pull numbers from the Budget tab — when does this pay for itself?' },
  { id: 'ask', title: 'The Ask', prompt: 'What do you need and what does it buy? Be specific about amount and use of funds.', placeholder: 'e.g., "$50K for equipment and 6 months runway → profitable by month 8."' },
];

// ─── Stages ──────────────────────────────────────────────────────────

export const STAGE_META: Record<VentureStage, { label: string; color: string; hint: string }> = {
  IDEA:      { label: 'Idea',      color: '#94A3B8', hint: 'Captured — not yet validated' },
  RESEARCH:  { label: 'Research',  color: '#8B5CF6', hint: 'Validating the market' },
  PLANNING:  { label: 'Planning',  color: '#3B82F6', hint: 'Legal, budget & pitch prep' },
  BUILDING:  { label: 'Building',  color: '#F59E0B', hint: 'Setting up to launch' },
  LAUNCHED:  { label: 'Launched',  color: '#10B981', hint: 'Open for business' },
  PARKED:    { label: 'Parked',    color: '#64748B', hint: 'On the shelf for later' },
};

export const STAGE_ORDER: VentureStage[] = ['IDEA', 'RESEARCH', 'PLANNING', 'BUILDING', 'LAUNCHED', 'PARKED'];
export const PIPELINE_STAGES: VentureStage[] = ['IDEA', 'RESEARCH', 'PLANNING', 'BUILDING', 'LAUNCHED'];
