# «الاستوديو» (Studio): from verdict to designs

The creative council does not stop at a verdict. In Studio mode each creative seat produces real designs in its own style: 20 to 30+ ad statics across angles, hooks and formats, plus logo and identity explorations when the brief touches the brand. They land live on the «المعرض» wall in the room.

Run it with `/majlis studio <session folder or brief>`, or say yes when the Chair offers it after a creative verdict.

## The flow

### a. The creative matrix (the Chair)
Turn `verdict.md` (or the direct brief) into a matrix and write it into `studio/briefs.json` under `matrix`:
- **3 to 5 angles**, named in Arabic from the verdict and the customer evidence (for example «هدية تنفتح قدامها», «لنفسك», «من وين العود», «تشتري بدون ما تشم»، «الموسم»). The winning option of the verdict leads; a losing option only appears as the cheap test the verdict kept.
- **Hooks by awareness stage** (Schwartz): `unaware`, `problem-aware`, `solution-aware`, `product-aware`, `most-aware`. Every angle gets at least two stages.
- **Formats:** `1:1` feed, `4:5` feed, `9:16` story, `lp-hero` (landing page, 1600x900), and `logo` (identity, 1080x1080) when the brand, packaging or identity is in play.

Aim for 24 to 32 designs: 3 to 4 per creative seat, plus 4 to 6 identity explorations from Chris Do when relevant.

### b. Seat briefs (each seat, in its own style)
Each creative seat writes 3 to 4 design briefs from its brain. Run them as sub-agents in parallel (one message, `council-<seat>`, with the matrix, the verdict, the brand rules and this file), or yourself one seat at a time with a clear head between seats. The styles, and the layout family each one renders with:

| Seat | What its designs do | `layout` |
|---|---|---|
| Ogilvy | Research-led headline that states a fact; product demonstration; body copy that informs. Picture, headline, copy. | `editorial` |
| Bernbach | One big disarming idea, honest to the point of self-deprecation; small picture, big quiet field, one line. | `quiet` |
| Schwartz | Hook headline matched to the awareness stage; the headline comes first and big. | `hook` |
| Sutherland | A reframe, a costly signal, or a perceived-value twist; a short comparison (`facts` as `label|value`). | `reframe` |
| Rams | Less but better: one object, one word, grid and hairlines. | `swiss` |
| Jobs | Hero product, one message, extreme focus; black stage, light type. | `keynote` |
| Chris Do | Logo and identity explorations, then the system (palette, type, seal). | `logo-wordmark`, `logo-monogram`, `logo-kufi`, `logo-latin`, `logo-symbol`, `logo-system` |
| Denney | Native, thumb-stopping variants built to test against each other (story text stickers). | `sticker` |
| Customer | "What would make me stop and trust this": plain facts, price, payment, honest delivery wording. | `trust` |
| any | Landing page hero | `hero` |

Save every brief to `sessions/<id>/studio/briefs.json`:

```json
{
  "session": "<id>",
  "brand": { "name_ar": "دار المثال للعطور", "mark_ar": "دار المثال", "mark_en": "DAR AL MITHAL", "prices": [420, 310, 590] },
  "matrix": { "angles": [{ "key": "G", "ar": "هدية تنفتح قدامها" }], "awareness": ["unaware", "..."], "formats": ["1:1", "4:5", "9:16", "lp-hero", "logo"] },
  "image_tool": "gpt-image (ChatGPT subscription)",
  "briefs": [
    {
      "id": "d01", "seat": "ogilvy", "angle": "هدية تنفتح قدامها", "awareness": "product-aware",
      "hook_ar": "وش داخل طقم الهدية؟", "headline_ar": "دهن عود، وعطر، ومبخرة. / في علبة وحدة.",
      "subline_ar": "سطر أو سطرين.", "price_ar": "طقم الهدية · 590 ر.س", "cta_ar": "", "facts": [],
      "format": "4:5", "layout": "editorial", "palette": "cream-ink",
      "visual_file": "visuals/v01-gift-box-open.png",
      "visual_prompt_en": "Editorial product photograph ... Absolutely no text, no letters, no logos, no people.",
      "visual_check": { "faces": "none", "modest": true, "halal": true, "ai_person": false, "note": "منتج ومشهد بدون ناس" },
      "rationale_ar": "سطر واحد بصوت المقعد: ليش صمّمه كذا. المقعد يقوله على الطاولة لما ينزل التصميم."
    }
  ]
}
```

` / ` inside a headline sets a line break. Palettes: `noir-gold`, `cream-ink`, `oxblood`, `sand`, `night`, `paper`, `ugc`. Keep `brand.prices` to the store's real prices; the renderer flags any other price.

### c. Two layers: the visual, then the type
Arabic type from image models is unreliable, so the two never mix:
1. **The visual, with no text in it.** Every `visual_prompt_en` ends with "Absolutely no text, no letters, no logos". Product, hands with modest sleeves, scenes, textures, still lifes. Save to `studio/visuals/vNN-<slug>.png` (or put the connector's result link in the brief's `visual_url` and run `studio.mjs fetch`). Several briefs can share one visual in different layouts and formats. `studio.mjs render` first shrinks every visual over 300 KB to a JPEG (max 1600 px; Pillow if present, else the headless browser) and moves the original to `studio/raw/visuals/`, which is git-ignored, so a pushed session stays light.
2. **The design, in HTML and CSS.** `node .claude/skills/majlis/scripts/studio.mjs render sessions/<id>` builds each brief into real Arabic typography (Google Fonts: Amiri, Aref Ruqaa, Reem Kufi, El Messiri, IBM Plex Sans Arabic, Tajawal, Noto Naskh; right to left; one layout family per seat, not one template) over the visual, and screenshots it with headless Edge, Chrome or Chromium to `studio/designs/<nn>-<seat>-<slug>.jpg` (usually 100 to 250 KB), plus a small JPEG in `studio/thumbs/` for the wall; `--png` also writes a full-size PNG to `studio/raw/designs/` (git-ignored). The HTML links its visual relatively (`../visuals/...`), so it renders the same on disk, in the room, on GitHub Pages and in a downloaded folder. It tries every installed browser (Windows, macOS, Linux, Playwright and Puppeteer caches, `/usr/local/bin/majlis-chromium` from the cloud setup script) and keeps the first that writes a file (set `STUDIO_BROWSER` to force one, or `STUDIO_BROWSER=none` to skip). `node studio.mjs doctor` says which browser it found. Rendering needs internet for the fonts (Google Fonts are on the cloud's default Trusted network).
4. **No browser at all** (a Claude Code on the web VM where `.claude/setup-cloud.sh` could not install Chromium): the renderer still writes every design as its HTML page and records it in `designs.json` with `file: html/<name>.html` and `render: "html"`. The wall shows that page live inside the card, scaled, with real Arabic type over the visual. Tell the merchant once that the designs are live HTML (they can screenshot or open them full size), and that a PNG/JPEG export needs a browser (locally, or after the setup script installs one).
5. **Logos** are type built in code (Arabic and Latin wordmarks, a monogram, a Kufi seal), so they stay sharp and editable; `logo-symbol` and `logo-system` may also use an AI symbol exploration as the visual. A generated symbol is an exploration for a designer to redraw as vector, never a final mark.

### d. Which image tool
Detect what this session has and say in one Arabic line which one you used. The order depends on the runtime (`publish.mjs env`):

**Web (Claude Code on the web):** claude.ai connectors the merchant enabled work in the cloud session; plugins and the Codex CLI do not.
1. **The merchant's image connectors:** KIE.ai (`kie_post /api/v1/jobs/createTask`, poll `recordInfo`), Higgsfield, Arcads, or any image MCP. Read the model's docs tool first; save the task id before polling. Put each result URL in the brief's `visual_url` and run `node .claude/skills/majlis/scripts/studio.mjs fetch sessions/<id>`; a connector's own "download" tool saves on the connector's server, not in this VM, so do not rely on it. If the VM's network blocks the result host (the default Trusted network allows package registries, GitHub and Google Fonts, not arbitrary image CDNs), `fetch` says which host; the design keeps the remote link (it shows in the merchant's browser, and links can expire after a few days), and the merchant can add that host under Custom network access.
2. **The host's own image generation** (a native `image_gen` tool), if the runtime has one.
3. **None:** typographic designs on CSS light (below).

Never try the `gpt-image` skill in a web session: it needs the Codex CLI signed in to ChatGPT on the merchant's machine.

**Local:**
1. **The host's own image generation** (a native `image_gen` tool), if the runtime has one.
2. **The `gpt-image` skill** (the buyer's ChatGPT subscription through the Codex CLI). Write one manifest for all visuals and run `batch --concurrency 4`. Known Windows quirk: the bridge can report "did not write the requested image" while the files sit in `~/.codex/generated_images/<run>/`. Then copy the newest files from there (match each by looking at it) into `studio/visuals/`.
3. **Any connected image MCP:** KIE.ai (`kie_post /api/v1/jobs/createTask`, poll `recordInfo`, `kie_download`), Higgsfield, Arcads, or similar. Read the model's docs tool first; save the task id before polling.
4. **None:** still render every design. The renderer draws a CSS light-and-gradient stage in the brand palette where the visual would be, and the designs are typographic. Say so plainly.

Generation spends the buyer's credits. Use only accounts the merchant connected, never buy or upgrade anything, and keep the count to what the matrix needs.

### e. Red lines on every design
Before rendering, read the brand rules (`business.md` red lines, and «قواعد البراند» in the brief). The renderer checks the text of every design and marks it `flagged` with the reason when it finds: a discount number or percent, fake scarcity or urgency, hype words («الأفضل»، «حصري»…), stars or review or sales numbers, a longevity promise in hours, a delivery-date promise, or a price that is not one of the store's prices. You check the visual: look at every generated visual before using it and record `visual_check`:
- halal: no alcohol, nothing a Saudi family would find inappropriate;
- modest imagery: covered arms, no bodies;
- **no AI human faces** when the merchant requires real people. Use product, hands, scenes, textures. Generated hands are a layout draft only: set `"ai_person": true` and the design is flagged «مسودة» until it is reshot with real hands;
- no fake numbers, no fake reviews (example reviews in a demo brief are never quoted in an ad).

A flagged design stays on the wall with its reason. Never present a flagged design as ready to publish.

### f. Files the room reads
```
sessions/<id>/studio/
  briefs.json          the matrix and every brief (step b)
  visuals/             text-free images (step c1)
  html/                the composed HTML of each design (editable)
  designs/<nn>-<seat>-<slug>.jpg   the finished designs (light JPEGs, committed)
  thumbs/              small JPEGs for the wall
  raw/                 originals and --png full-size files (git-ignored, never pushed)
  designs.json         one record per design, appended the moment its PNG lands
```
`designs.json` records: `id, seat, angle, awareness, hook_ar, headline_ar, subline_ar, format, kind (ad|logo), layout, file, thumb, html, visual_file, prompt, rationale_ar, status (ready|flagged), redlines {pass, flags, visual}, width, height, created, render (image|html)`. Keep a session's studio under about 15 MB: JPEG designs and visuals, nothing from `raw/`. The renderer writes it atomically after every design, so the wall animates each one in and its seat speaks the `rationale_ar` at the table.

## In the room
«المعرض» opens from the gold button in the top bar (it appears with the first design), from «الجلسات السابقة», or straight at `http://localhost:4730/#studio=<session id>` (local) or `<GitHub Pages link>#studio=<session id>` (web, after `publish.mjs --push`). `replay.html` carries the wall too. It filters by seat, angle and format, opens a lightbox (seat, angle, awareness stage, rationale, red-line result, the visual prompt, PNG download), and «تحميل الكل» opens a page that lists every file with its own download link (no zip without a dependency). «شغّل العرض» replays the wall with each seat presenting its design.

## After the studio
Show the merchant, in Arabic and under 150 words: how many designs and identity explorations, by seat; which are flagged and why; the image tool used; the folder path; and the three designs the Chair would test first, tied to the verdict's cheapest test. Nothing is published, uploaded to an ad account, or sent anywhere without the merchant's explicit approval.
