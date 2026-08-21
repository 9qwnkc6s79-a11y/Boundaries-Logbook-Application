# Food close — file into Current Playbook

**Amy:** this PR is the filing copy. Paste the blocks below into Drive. Do **not** treat Nov 2025 V1 manuals as source of truth. Do **not** overwrite Process Manual v1.8 §15 (Spaceman 6455-CL nightly close / teardown).

**Current Playbook folder:** https://drive.google.com/drive/folders/1URbYaJBQcD9OCFVB1Y_2VyUc-JcyROI4

| Document | Drive id | Modified | Role |
| :--- | :--- | :--- | :--- |
| `Boundaries_Operations_Manual_V2_Final.docx` | `10poXqTB2iCUEltoj4KX5s63lXN6VtNX0` | March 2026 | **Playbook — source of truth for open / close.** Update §21 Opening, §22 Closing, §19 Food Prep. Also clean the old Tue/Thu/Sat Toast waste-log lines in §4 and §23 so the book does not contradict itself. |
| `Boundaries_Operations_Manual_v1.8.docx` | `1m8XpZC-z3AGHv80oIy587CzSbhdHrAHF` | July 2026 | **Newest process manual.** Logbook already claims alignment to v1.8. **Leave §15 as-is.** §16 is still “to be completed.” §12 Food Prep gets the short Toast-counts paragraph. |

---

## The procedure (one block)

**At open:** the GM (or Shift Lead) enters **starting qty in Toast inventory** for every food SKU they count (Main Street Bistro, Lisa Cordero tacos, Sysco food, pastry). Those items stay on Toast QUANTITY tracking. Do not put food into the logbook syrup / coffee catalog.

**86:** when qty hits **0**, Toast marks the item sold out / 86. Last-sold time from that day’s tickets is the check. Owen sees **both** times. Do not pick one.

**At close:** enter **leftover qty** and **waste qty** on the **food list in the logbook** Closing Checklist (Toast food SKUs). Leftover = still good. Waste = discarded. Every close — not Tuesday / Thursday / Saturday only, and not the old Toast POS waste log. If the item 86’d earlier, leftover is 0 and waste is what you threw away.

---

## Paste into V2 Final — Section 21 Opening Procedures

**Today’s Step 9 (replace this sentence):**

> Set up pastry case. Record opening inventory counts in Toast POS.

**Replacement Step 9:**

| Step | Task | Responsibility |
| :--- | :--- | :--- |
| 9 | Set up pastry case. GM / Shift Lead enters **starting qty in Toast inventory** for every food SKU they count. Those items stay on Toast QUANTITY. When qty hits 0, Toast 86s. Do not put food into the logbook syrup catalog. | Shift Lead / Manager |

Add this bullet to the **MANAGER REMINDER** box (keep the existing three):

- Starting food qty must be in Toast before the open sign goes on.

---

## Paste into V2 Final — Section 22 Closing Procedures

**Today’s Step 6 (replace this sentence):**

> Complete waste log in Toast POS (Tuesday, Thursday, Saturday nights only).

**Replacement Step 6 — every close:**

| Step | Task | Responsibility |
| :--- | :--- | :--- |
| 6 | Enter **leftover qty** and **waste qty** on the **food list in the logbook** Closing Checklist (Toast food SKUs). Leftover = still good. Waste = discarded. If Toast 86’d the item when qty hit 0, leftover is 0 and waste is what you threw away. Not the syrup catalog. Not Sortly. | Manager / Shift Lead / closer |

Add these bullets to the **CLOSING CHECKLIST RULE** box (keep lock-up / logbook logging):

- Leftover + waste on the logbook food list is **every night**, not Tue/Thu/Sat only.
- Do not invent numbers if Toast stock is unavailable — the logbook will say so.

Keep the rest of §22 (backflush, pastry case, cash, lock-up, log the checklist in the app). Food leftover/waste is a logbook step. Spaceman teardown is **not** this step — that stays in Process Manual v1.8 §15.

---

## Paste into V2 Final — Section 19 Food Prep & Kitchen Standards

Add after Kitchen Standards (Texas Food Handler’s License stays):

**Toast food counts**

- **Open:** GM enters starting qty in Toast inventory for counted food SKUs.
- **86:** when qty hits 0, Toast marks sold out / 86.
- **Close:** leftover qty + waste qty on the food list in the logbook.

---

## Also fix in V2 so the old three-night waste log does not linger

**§4 Weekly Manager Responsibilities** — today’s row:

> Tuesday, Thursday, Saturday — Complete waste log in Toast POS at close of business.

Replace that row with:

> Every close — Confirm leftover qty and waste qty are on the logbook food list (Toast food SKUs). Use those numbers with 86 time and last-sold time to order food.

**§23 Weekly Cleaning Schedule** — drop “(Waste log tonight)” from Tuesday, Thursday, and Saturday. Waste is every close on the logbook food list, not a weekly-clean add-on.

---

## v1.8 process manual (do not overwrite §15)

- **§15** nightly close / Spaceman 6455-CL teardown stays as written. Food leftover/waste is a logbook step, not a machine step.
- **§12 Food Prep** — add the same three-line Toast food counts block as V2 §19.
- **§16 Opening / Shift Change / Closing** — still “to be completed.” When it is written, use the same open / 86 / leftover+waste close as V2 §21–22.

---

## Already live in BrewShift (this PR — no deploy)

| Place | What staff see |
| :--- | :--- |
| Logbook → Closing Checklist | Help text + leftover qty / waste qty on the food list |
| Logbook → Opening Checklist | GM: enter starting food qty in Toast inventory |
| Manager Hub → Food 86 | Name, remaining, 86 at, last sold at, leftover, waste |
| Academy → Closing Duties: Food Counts | Same written close + quiz |
| In-app Ops Manual §12 / §16 | Same open → 86 → leftover + waste (aligned to v1.8) |
