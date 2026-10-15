# Round prompts

Paste these into each seat's Agent call. Replace the bracketed parts. Seats read the brief and earlier rounds from the session folder, so the cards stay verbatim without being pasted into every prompt.

Agent type: `council-<seat>`, for the seats on the chosen council only (`councils.json`; e.g. business: bezos ... customer; creative: ogilvy, bernbach, schwartz, sutherland, rams, jobs, chrisdo, denney, customer; marketing: godin, kotler, sharp, ritson, brunson, miller, dunford, customer).

**Council name in the prompts.** Every prompt below starts with `[COUNCIL]`: the Arabic council name from `councils.json` plus the English key, e.g. `مجلس الكريتيف والتصميم (CREATIVE COUNCIL)`. `[SEAT]` is the seat's `short` heading name (Ogilvy, Chris Do, Customer...), and `[pillar]` / `[dimension]` come from `seats.md` or the seat's `seat.json`. If that type is not registered in this session (agent files load at session start), spawn `general-purpose` and put these lines first: `Read .claude/agents/council-<seat>.md and follow it as your instructions for this whole task. Only read files; do not write anything.`

Paths in prompts are relative to the repo root; give the absolute repo root once at the top of each prompt.

**Options.** When the brief lists options (A, B, C, including "don't do it"), every card scores every option. When it is a single yes or no decision, the options are "do it as proposed" and "don't".

**Pillar score.** The seat's score of the option it recommends, judged on its own pillar alone.

## Language rules (every round, every seat)

These are in every prompt below as the `LANGUAGE` block. Do not drop it.

- The card's content is in Arabic: clear, direct, short sentences, in the seat's own personality and frameworks. Framework names may stay in English in parentheses.
- The field labels stay in English uppercase exactly as written (SEAT, STANCE, OPTION SCORES, PILLAR SCORE, CONFIDENCE, RUIN RISK, DOOR, THE CALL, WHY, THE RISK I SEE, WHAT WOULD CHANGE MY MIND, WHAT I'D DO THIS WEEK, QUESTION FOR THE FOUNDER, I DISAGREE MOST WITH, I CONCEDE, ON THE CRUXES, MOVED, MY CONDITIONS FOR YES, VOTE, FINAL SCORE, FINAL PILLAR SCORE, AMENDMENT OR DISSENT, ONE LINE FOR THE FOUNDER). The room parses them.
- The enumerated values stay in English: Strong yes | Yes | Conditional yes | No | Strong no; none | possible | likely; one-way | two-way; Endorse | Endorse with amendment | Dissent; MOVED starts with no or yes. Option letters stay A, B, C. Scores use Western digits (7/10, not ٧/١٠).
- Verbatim brain quotes stay in their original language inside quotes with the source id, then an Arabic translation in plain parentheses after the id: "verbatim line" (S014) (بالعربي: ...). Never put the translation inside quotes or «». The Customer seat quotes only the store's reviews from its brain (or a labelled example block in the brief) inside «» with the source id, e.g. «وصلني بعد أسبوعين وما أحد رد علي» (S007), and quotes nothing while its brain is NOT_BUILT.
- The Customer seat speaks the store customers' dialect as «احنا البنات», «احنا الشباب», or «احنا العملاء», following the store's audience. The other seats speak clear Arabic (white Gulf or simple MSA), not translated English.
- Business context for every seat: `business.md` at the repo root (read it in Round 1; numbers in the brief override it). On the creative council the brief also carries a «قواعد البراند» block (the merchant's red lines) and the creative itself (pasted copy, described or attached images); seats judge exactly that material.

```
LANGUAGE: Write the card in Arabic, in your seat's voice. Keep every field label and every enumerated value (Strong yes, none, one-way, Endorse...) in English exactly as shown. Scores in Western digits. Verbatim brain quotes stay in the original language in quotes with the source id, then (بالعربي: ...) after the id.
```

---

## Round 1: opening position

```
[COUNCIL], ROUND 1 OF 3: OPENING POSITION

Repo root: [absolute path]. You hold the [SEAT] seat ([pillar]). Read business.md at the repo root (the store profile; if it is missing or says STATUS: TEMPLATE, work from the brief and mark assumptions), then your brain's _hot.md, then at most three more brain files that fit this decision (frameworks.md and positions.md are usually the right ones).

Read the brief: [session folder]/brief.md

Your weight on this decision: [w]/3 ([one-line reason]).

LANGUAGE: Write the card in Arabic, in your seat's voice. Keep every field label and every enumerated value (Strong yes, none, one-way, Endorse...) in English exactly as shown. Scores in Western digits. Verbatim brain quotes stay in the original language in quotes with the source id, then (بالعربي: ...) after the id.

Answer in your seat's voice, plain text, under 350 words, in exactly this shape:

SEAT: [SEAT] ([pillar])
STANCE: Strong yes | Yes | Conditional yes | No | Strong no   (on the option you recommend)
OPTION SCORES: [A] n/10 · [B] n/10 · [C] n/10   (how strongly you back each option)
PILLAR SCORE: n/10   ([dimension]: the option you recommend, judged on your pillar alone)
CONFIDENCE: n/5
RUIN RISK: none | possible | likely   (an irreversible downside that could sink the company or the founder, for the option you recommend; for Customer: brand-trust damage)
DOOR: one-way | two-way   (how reversible is the option you recommend?)

THE CALL: one sentence in Arabic, naming the option or a variant.
WHY:
1. argument in Arabic, naming the framework or principle you used and its source id, e.g. (معادلة القيمة / Value Equation, S014)
2. ...
3. ...
THE RISK I SEE: the single biggest thing that goes wrong.
WHAT WOULD CHANGE MY MIND: a concrete fact or number.
WHAT I'D DO THIS WEEK: one action.
QUESTION FOR THE FOUNDER: the one question you would ask the merchant before signing off.

New brand: if business.md says STATUS: NEW_BRAND, there are no sales and no real customers yet. Reason in ranges, mark every number you use (افتراض), and treat anything the Customer seat quotes as a hypothesis from public research, not this brand's buyers. Name the cheapest test that would prove or kill your view.

Rules: argue from your pillar first. Use real numbers when the brief has them, and say which numbers you are assuming when it does not. Quote only verbatim lines from your brain, with the source id. Respect the red lines in business.md and any «قواعد البراند» block in the brief (claims, halal, no fake reviews, fake numbers or fake urgency, real people only). Do not hedge to sound balanced; the Chair balances the council, you bring your lens at full strength.
```

---

## Round 2: debate

```
[COUNCIL], ROUND 2 OF 3: DEBATE

Repo root: [absolute path]. You hold the [SEAT] seat. Read your brain's _hot.md again and any brain file you need to answer the others (at most three).

Read: [session folder]/brief.md and [session folder]/round-1.md (every seat's card and the Chair's cruxes).

THE CRUXES THE CHAIR SEES
1. [crux, in Arabic]: [seats on each side]. [If this seat is on one side, name the argument it must answer.]
2. ...

LANGUAGE: Write the card in Arabic, in your seat's voice. Keep every field label and every enumerated value (Strong yes, none, one-way, Endorse...) in English exactly as shown. Scores in Western digits. Verbatim brain quotes stay in the original language in quotes with the source id, then (بالعربي: ...) after the id.

Answer in your seat's voice, plain text, under 300 words, in exactly this shape:

SEAT: [SEAT]
I DISAGREE MOST WITH: [seat at this table, by its English heading name, e.g. Ogilvy, Chris Do, Customer]. Their argument, in one line, then your rebuttal using your frameworks.
I CONCEDE: the strongest point another seat made against you, and what it changes. "لا شيء" only if you can say why their best point fails.
ON THE CRUXES: your answer to each crux, one or two lines each.
STANCE: ...
OPTION SCORES: [A] n/10 · [B] n/10 · [C] n/10
PILLAR SCORE: n/10
CONFIDENCE: n/5
RUIN RISK: none | possible | likely
MOVED: no | yes, from X to Y, because ...
MY CONDITIONS FOR YES: up to three, concrete and checkable (a number, a date, a test result).

Rules: engage the actual arguments on the table. Move only for a better argument, never to be agreeable. If everyone agrees with you, find the weakest part of your own case and say it.
```

---

## Round 3: ratification

```
[COUNCIL], ROUND 3 OF 3: VOTE ON THE DRAFT RESOLUTION

Repo root: [absolute path]. You hold the [SEAT] seat. You already argued this in two rounds; read only your _hot.md if you need it.

Read: [session folder]/brief.md, your own section of [session folder]/round-2.md, and [session folder]/draft-resolution.md.

LANGUAGE: Write the card in Arabic, in your seat's voice. Keep every field label and every enumerated value (Strong yes, none, one-way, Endorse...) in English exactly as shown. Scores in Western digits. Verbatim brain quotes stay in the original language in quotes with the source id, then (بالعربي: ...) after the id.

Answer in your seat's voice, under 150 words, in exactly this shape:

SEAT: [SEAT]
VOTE: Endorse | Endorse with amendment | Dissent
OPTION SCORES: [A] n/10 · [B] n/10 · [C] n/10   (given the resolution's conditions)
FINAL SCORE: n/10   (your support for the draft resolution as written)
FINAL PILLAR SCORE: n/10
AMENDMENT OR DISSENT: one or two sentences (what to change, or why you dissent). Blank if you endorse.
ONE LINE FOR THE FOUNDER: the thing from your pillar the merchant must not forget.
```

---

## Single-seat consult

```
[COUNCIL], SINGLE-SEAT CONSULT

Repo root: [absolute path]. You hold the [SEAT] seat. Read business.md at the repo root, then your brain's _hot.md, then at most four more brain files that fit the question.

THE QUESTION
[question, plus any context]

Answer in Arabic, in your seat's voice, first person, under 500 words: your call, your reasoning with named frameworks and source ids, what you would do this week, and the question you would ask back. Verbatim brain quotes stay in the original language in quotes with the source id, then (بالعربي: ...). Do not narrate the expert in the third person. End with "Sources:" and the source ids you used.
```
