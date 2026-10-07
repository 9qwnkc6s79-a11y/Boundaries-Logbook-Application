import { ManualSection } from '../types';

/** Heading used as the idempotency marker in live §12. */
export const TACO_REHEAT_HEADING = '### Breakfast Tacos (Tacos y Rocky) — TurboChef Reheat Standard';

/** Source: Google Doc "Breakfast Tacos (Tacos y Rocky) — TurboChef Reheat Standard", locked Wed Oct 7, 2026 (Daniel). */
export const TACO_REHEAT_MD = `${TACO_REHEAT_HEADING}
Locked Wed Oct 7, 2026 (Daniel). Both stores (Little Elm + Prosper).

Applies to: Tacos y Rocky breakfast tacos, about 155 g each, starting refrigerated.

**TurboChef program** (every count: 90% microwave, 30% top air, 50% bottom air)

| Count | Time |
| :--- | :--- |
| 1 taco | 0:45 |
| 2 tacos | 1:05 |
| 3 tacos | 1:30 |
| 4 tacos | 1:50 |

**Steps**
1. Remove the checkered paper wrapper.
2. Lay each taco fold/seam side down on the tray, separated.
3. Press the matching button.
4. Rewrap in foil.

Daniel sets the oven buttons. Staff never change oven settings.

Retired: microwaving tacos in the wrapper and holding them on the warming tray. Do not use the old method.`;

function isFoodPrepSection(section: ManualSection): boolean {
  return section.id === 's-12' || String(section.number) === '12';
}

/**
 * Append-only: add the taco reheat standard to the end of live §12 if it is
 * not already there. Every other section, and all existing §12 text, is left
 * exactly as managers last saved it.
 */
export function appendTacoReheatToManual(live: ManualSection[]): { next: ManualSection[]; mutated: boolean } {
  if (!Array.isArray(live) || live.length === 0) return { next: live, mutated: false };
  let mutated = false;
  const next = live.map(section => {
    if (!isFoodPrepSection(section)) return section;
    const content = section.content || '';
    if (content.includes(TACO_REHEAT_HEADING)) return section;
    mutated = true;
    return { ...section, content: `${content.replace(/\s+$/, '')}\n\n${TACO_REHEAT_MD}` };
  });
  return { next, mutated };
}
