# Live room files

The room (a local web app on http://localhost:4730, or the same page as a static site on GitHub Pages) watches the sessions folder and plays a council as its files appear: portraits talk one at a time, rebuttal arrows fly, votes land, and the verdict comes up. It reads the round files you already write, plus four small JSON files. Write each one at the moment listed, as plain JSON (no comments, no trailing commas). Seat names can be keys (`garyvee`) or display names (`Gary V`).

The room is optional. Write these files anyway; they cost a few lines and the council runs the same without the room.

**Council.** `council.json` carries `"council"`: the council key from `councils.json` (`business`, `creative`, or `marketing`). The room seats that council's table, shows its name in the header and on the table, and badges the session in «الجلسات السابقة». A missing `council` means `business` (older sessions keep working). Round-file headings and seat names in every JSON file use that council's seats.

**Language.** JSON keys, seat keys, option ids (A, B, C), and the verdict `label` stay in English exactly as shown. Every human-readable string value is Arabic: `title`, `decision`, option `label`s, weight `reason`s, `brief`, `assumptions`, crux `question`s and `position`s, `note`, and every text field in `draft.json` and `verdict.json`. `title` and each option `label` stay under 50 characters. Write numbers with Western digits.

**Without a server.** On Claude Code on the web nobody can open localhost. After every file below, run `node .claude/skills/majlis/scripts/publish.mjs sessions/<id>` (add `--push "المجلس: <id> الجولة n"` in web mode). It writes `sessions/index.json` (every session: id, title, council, mode, status, studio count, updated), `sessions/<id>/room.json` (the events the room plays, the same as the server's `/api/sessions/<id>`), and `app/public/seats.json`. The room at `app/public/index.html` uses the server when `/api/*` answers and otherwise reads those files and polls every 20 seconds (`#session=<id>` replays one session, `#studio=<id>` opens its wall). Add `--replay` after `verdict.json` for `sessions/<id>/replay.html`: the whole council in one file with every byte inlined (no fetch), which opens offline; studio images stay as relative links, so it lives in its session folder.

## Order

| When | File |
|---|---|
| Step 2, with `brief.md` | `council.json` |
| Round 1 cards back | `round-1.md` (one `## <Seat>` heading per card, cards verbatim, `## Chair notes` last) |
| After the Round 1 Chair notes | `cruxes.json` |
| Round 2 cards back | `round-2.md` |
| With `draft-resolution.md` | `draft.json` (skip in quick mode when Round 3 is skipped) |
| Round 3 cards back | `round-3.md` |
| Last, after `verdict.md` | `verdict.json` |

## council.json

```json
{
  "council": "business",
  "title": "شحن مجاني فوق 199 أو 299؟",
  "decision": "هل ننزّل حد الشحن المجاني من 299 إلى 199، أو نخليه، أو نلغيه ونرفع الأسعار شوي؟",
  "mode": "full",
  "options": [
    { "id": "A", "label": "شحن مجاني فوق 199" },
    { "id": "B", "label": "نخليه فوق 299" },
    { "id": "C", "label": "نلغيه ونرفع الأسعار 10 ر.س" }
  ],
  "weights": {
    "hormozi": { "weight": 3, "reason": "التسعير والعروض ركيزته" },
    "customer": { "weight": 3, "reason": "قرار سعر وعرض يشوفه العميل مباشرة" },
    "buffett": { "weight": 2, "reason": "أثر على الهامش والكاش" }
  },
  "seats": ["bezos", "graham", "hormozi", "garyvee", "martell", "wickman", "buffett", "customer"],
  "brief": "جملتين أو ثلاث.",
  "assumptions": ["تكلفة الشحن 22 ر.س للطلب (افتراض)"]
}
```

`council` is the council key. `mode` is `full` or `quick`. `seats` lists only the seats at the table, by key, from that council's roster (`customer` is the Customer seat, «صوت العميل», on every council). Leave `seats` out to seat the whole council. Give every seat at the table a weight (1 to 3) with a short Arabic reason. Title and option labels are Arabic and stay short: under 50 characters.

## cruxes.json

```json
{
  "cruxes": [
    {
      "question": "هل الشحن جاهز يتحمل زيادة الطلبات قبل الجمعة البيضاء؟",
      "sides": [
        { "position": "نعم، شركة الشحن جاهزة", "seats": ["Hormozi", "Gary V"] },
        { "position": "لا، التأخير ما انحل بعد", "seats": ["Customer", "Wickman"] }
      ]
    }
  ],
  "unanimous": false,
  "note": "جملة وحدة بسيطة عن وش يختلف عليه المجلس."
}
```

One to three cruxes, in Arabic. Questions under 90 characters, positions under 50. Seat names in `seats` use the English heading names of this council's seats (e.g. Ogilvy, Chris Do, Customer) or keys.

## draft.json

```json
{
  "option": "B",
  "label": "GO WITH CONDITIONS",
  "recommendation": "جملة أو جملتين.",
  "conditions": ["شرط قابل للفحص"],
  "next_steps": ["خطوة مع تاريخ"],
  "cheapest_test": "سطر واحد.",
  "kill_criteria": "سطر واحد."
}
```

## verdict.json

```json
{
  "label": "GO WITH CONDITIONS",
  "call": "One or two sentences the merchant can act on, naming the option.",
  "recommended": "B",
  "why": [
    { "point": "One line.", "seat": "Graham", "framework": "Startup = Growth" }
  ],
  "minority": { "seat": "Martell", "quote": "The seat's own words, copied from a card.", "would_have_to_be_true": "One line." },
  "next_steps": [ { "when": "This week", "action": "One line." } ],
  "kill_criteria": "One line.",
  "conditions": ["Checkable condition"],
  "fights": [ { "crux": "The question", "story": "Who was on each side, who moved, how it resolved." } ],
  "amendments": [ { "seat": "Buffett", "amendment": "One line.", "adopted": true, "reason": "One line." } ],
  "cheapest_test": "One line.",
  "revisit": "When and with what numbers.",
  "override_note": ""
}
```

`label` is one of GO, GO WITH CONDITIONS, RESHAPE, WAIT, DON'T DO IT, in English exactly (the room reads it); every other text value in `verdict.json` is Arabic. `seat` values use the English display names or keys. Put the three strongest arguments first in `why` and at most three `next_steps`; the room shows those up front and folds the rest under "Full detail". The room computes the option scores, confidence, and votes itself from the cards, so they are not in this file.

## Studio (optional, after a creative verdict)

`studio/designs.json` (spec: `studio.md`) drives the room's «المعرض» wall. Append one record per design the moment its PNG lands (the renderer `scripts/studio.mjs` does this atomically); the room streams each new record onto the wall and the seat in `seat` speaks its `rationale_ar` at the table. Deleting or moving `designs.json` clears the wall for a fresh run. Deep link: `http://localhost:4730/#studio=<session id>` (or the GitHub Pages link with the same hash).
