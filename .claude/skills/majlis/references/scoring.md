# Scoring

All numbers come from the seats' cards. The Chair computes, never invents. The math and the English verdict labels stay as below; the Chair explains them in Arabic in `verdict.md`. Use the last round that ran (Round 3 if it ran, else Round 2).

## Option scores (the main number)

Every card scores every option 0 to 10. For each option:

`option score = sum(weight x seat's score for that option) / sum(weight)`, one decimal.

The **recommended option** is the one with the highest option score, unless an override below removes it. Show every option's math in one line each, for example: `B (3x6 + 2x7 + 2x8 + 2x6) / 9 = 6.7`.

## Verdict bands (on the recommended option's score)

| Option score | Verdict |
|---|---|
| 7.5 to 10 | GO |
| 6.0 to 7.4 | GO WITH CONDITIONS |
| 4.5 to 5.9 | RESHAPE |
| below 4.5 | DON'T DO IT |

Two labels replace the band when they fit better, and the report says why:

- **WAIT**: the recommended option is good but depends on a prerequisite that is not met yet (a test result, cash, a hire). WAIT always names the trigger and the date that turn it into GO, and what happens if the trigger fails.
- **DON'T DO IT** also applies when "don't do it" is itself the top-scoring option.

## Resolution support

Round 3's FINAL SCORE is each seat's support for the draft resolution as written. Report its weighted average as "Support for the resolution". It measures how well the Chair's plan captured the room, not whether the idea is good.

## Overrides (applied after the band, and stated in the report)

1. **Ruin cap.** Any seat that ends at `RUIN RISK: likely` on the recommended option caps the verdict at RESHAPE until the resolution names a mitigation that seat endorsed. One seat at ruin risk outweighs seven enthusiastic seats. For the Customer seat, `likely` means brand-trust damage (a broken shipping, result, or guarantee promise, anything un-halal, fake faces or numbers, hidden offer conditions); it triggers the same cap.
2. **One-way door cap.** If the recommended option is a one-way door (Bezos's call, or a majority of seats) and the spread on it is 4 or more, cap at GO WITH CONDITIONS and make the cheapest test a precondition.
3. **Unanimity check.** If every seat's top option is the same and their scores for it sit within 1 point in Round 1, the Chair names the strongest unargued alternative as a crux in Round 2 and asks the seats whose pillars are most at risk to argue it at full strength.

## Spread and confidence

- `spread` = highest minus lowest seat score on the recommended option.
- `council confidence` = average seat confidence x 2, rounded, minus 1 if the spread is 5 or more. Scale 1 to 10.
- Report both. A 7.0 with spread 1 is a different answer from a 7.0 with spread 6.

## Pillar scorecard

One column per seat at the table: its final PILLAR SCORE, which is that seat's judgment of the recommended option on its own pillar alone. Any pillar at 4 or below gets a named fix in "What to do next", even when the verdict is GO. The tables below are per council; a seat's `seat.json` (`dimension` / `dimensionAr`) is the authority for its label when it differs.

### Business («مجلس التاجر»)

| Pillar | Dimension label |
|---|---|
| Strategy and decisions (Bezos) | Strategic fit and reversibility |
| Product and startups (Graham) | Real demand and growth |
| Offers, pricing, and sales (Hormozi) | Offer strength and unit economics |
| Marketing and attention (Gary V) | Attention and distribution |
| People, hiring, and founder time (Martell) | Team capacity and founder time |
| Operations and scaling (Wickman) | Operational readiness |
| Money and capital (Buffett) | Downside and capital efficiency |
| Customer experience (Customer) | Customer trust and desire (ثقة العميل ورغبته): will they believe it, buy, and buy again |

### Creative («مجلس الكريتيف والتصميم»)

| Pillar | Dimension label |
|---|---|
| Research-led advertising and copy (Ogilvy) | Selling power (قوة البيع) |
| The creative idea and craft (Bernbach) | Freshness and honesty of the idea (أصالة الفكرة وصدقها) |
| Awareness, desire, and the headline (Schwartz) | Match to the market's awareness and desire (مطابقة وعي السوق ورغبته) |
| Behavioural science and perceived value (Sutherland) | Perceived value and psychological fit (القيمة المدركة) |
| Design discipline (Rams) | Clarity and restraint (الوضوح والاختزال) |
| Product taste and the whole experience (Jobs) | Simplicity and taste end to end (البساطة والذوق) |
| Brand strategy and design value (Chris Do) | Brand consistency and value (اتساق البراند وقيمته) |
| Performance creative and hooks (Denney) | Thumb-stop and testability (إيقاف التمرير وقابلية الاختبار) |
| Customer experience (Customer) | Would they stop, believe, and buy (يوقف، يصدّق، يشتري) |

### Marketing («مجلس الماركتينج»)

| Pillar | Dimension label |
|---|---|
| Smallest viable audience and permission (Godin) | Remarkability to the right few (لافت للجمهور الصح) |
| Marketing management and STP (Kotler) | Strategic fit of segment, target, and mix (ملاءمة الشريحة والمزيج) |
| Evidence-based growth (Sharp) | Reach and mental and physical availability (الوصول والحضور الذهني) |
| Strategy before tactics (Ritson) | Strategic soundness and brand/performance balance (سلامة الاستراتيجية والتوازن) |
| Funnels and offers (Brunson) | Funnel conversion and value ladder (تحويل الفانل وسلّم القيمة) |
| Clear messaging (Miller) | Message clarity (وضوح الرسالة) |
| Positioning (Dunford) | Positioning strength against alternatives (قوة التموضع أمام البدائل) |
| Customer experience (Customer) | Does the message land and the promise hold (هل الرسالة توصل والوعد ينحفظ) |

## New brand (`STATUS: NEW_BRAND` in `business.md`)

The math is the same. Two differences: every number in the brief, the cards, and `verdict.md` is a range or carries `(افتراض)`, and the report's «أرخص اختبار» line is mandatory and tests the riskiest assumption before money is spent. A recommended option that only works if an untested assumption holds is capped at GO WITH CONDITIONS, or becomes WAIT with that test as the trigger. Customer-seat quotes are labelled «فرضية من بحث عام» in the verdict.
