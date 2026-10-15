import fs from "node:fs";
import path from "node:path";
import { AGENTS_DIR, BRAINS_DIR } from "./env.mjs";

// «مجلس التاجر»: eight seats, every one a simulation (seven built from a public figure's published
// work, one composite of the store's own customers). `key`, `slug`, and `short` stay English: the skill, the agent
// files, the brains, and the round-file headings use them. `name` is the Arabic display name,
// `en` the English one; `aliases` lets the parser match headings and names in either language.
// `avatar: "svg"` marks a seat with a drawn avatar (the customer: abstract, gender-neutral).
const BUSINESS_SEATS = [
  { key: "bezos", name: "جيف بيزوس", shortAr: "بيزوس", en: "Jeff Bezos", short: "Bezos", initials: "JB", slug: "jeff-bezos",
    pillar: "الاستراتيجية والقرارات", question: "هل هذا هو الرهان الصح، وهل نقدر نرجع عنه؟", dimension: "الملاءمة الاستراتيجية وإمكانية التراجع", color: "#e8c480",
    aliases: ["بيزوس", "جيف بيزوس", "jeff"] },
  { key: "graham", name: "بول جراهام", shortAr: "جراهام", en: "Paul Graham", short: "Graham", initials: "PG", slug: "paul-graham",
    pillar: "المنتج والنمو", question: "هل الناس فعلًا تبغى هذا، وهل هو ينمو؟", dimension: "طلب حقيقي ونمو", color: "#e0a07a",
    aliases: ["جراهام", "غراهام", "بول جراهام", "بول غراهام", "pg"] },
  { key: "hormozi", name: "أليكس هورموزي", shortAr: "هورموزي", en: "Alex Hormozi", short: "Hormozi", initials: "AH", slug: "alex-hormozi",
    pillar: "العروض والتسعير والبيع", question: "هل بيدفعون، وكم، وكيف نقفل البيعة؟", dimension: "قوة العرض واقتصاديات الوحدة", color: "#d77a8f",
    aliases: ["هورموزي", "هرمزي", "أليكس هورموزي", "اليكس هورموزي"] },
  { key: "garyvee", name: "جاري ڤي", shortAr: "جاري ڤي", en: "Gary Vaynerchuk", short: "Gary V", initials: "GV", slug: "gary-vaynerchuk",
    pillar: "التسويق والانتباه", question: "من وين يجي الانتباه، وهل سعره لسه رخيص؟", dimension: "الانتباه والوصول", color: "#b48ad8",
    aliases: ["جاري ڤي", "جاري في", "غاري", "جاري فاينرتشك", "garyvee", "gary vee", "gary"] },
  { key: "martell", name: "دان مارتل", shortAr: "مارتل", en: "Dan Martell", short: "Martell", initials: "DM", slug: "dan-martell",
    pillar: "الفريق والتوظيف ووقت المؤسس", question: "مين بينفّذ هذا، وكم بياخذ من وقتك؟", dimension: "قدرة الفريق ووقت المؤسس", color: "#8fb3e0",
    aliases: ["مارتل", "دان مارتل"] },
  { key: "wickman", name: "جينو ويكمان", shortAr: "ويكمان", en: "Gino Wickman", short: "Wickman", initials: "GW", slug: "gino-wickman",
    pillar: "التشغيل والتوسّع", question: "هل الشغل يمشي بدونك وأنت مو ماسكه بيدك؟", dimension: "الجاهزية التشغيلية", color: "#7cc4a4",
    aliases: ["ويكمان", "جينو ويكمان", "جينو"] },
  { key: "buffett", name: "وارن بافيت", shortAr: "بافيت", en: "Warren Buffett", short: "Buffett", initials: "WB", slug: "warren-buffett",
    pillar: "المال ورأس المال", question: "إيش يسوي هذا بالكاش والمخاطرة والقيمة على المدى الطويل؟", dimension: "حماية الخسارة وكفاءة رأس المال", color: "#9aa7bd",
    aliases: ["بافيت", "وارن بافيت", "وارن"] },
  { key: "customer", name: "صوت العميل", shortAr: "صوت العميل", en: "The Customer", short: "Customer", initials: "ع", slug: "store-customer",
    pillar: "تجربة العميل", question: "هل بيصدّق الكلام ويشتري… ويرجع يشتري؟", dimension: "ثقة العميل ورغبته", color: "#c98bb0",
    aliases: ["صوت العميل", "صوت العميلة", "العميل", "العميلة", "العميله", "عميل", "customer", "the customer", "store customer", "customer voice"], avatar: "svg" },
];

// ---------- councils + dynamic seats ----------
// Councils live in .claude/skills/majlis/councils.json (the single source of truth the skill and
// the app share). The business seats above are hardcoded; every other seat is merged from
// brains/<slug>/seat.json as soon as its brain lands, so new seats show up without a code change.
// A seat listed in a council but not built yet gets a stub (initials avatar, no brain) and never crashes.
const COUNCILS_FILE = path.join(BRAINS_DIR, "..", "councils.json");
const FALLBACK_COUNCILS = [{ key: "business", name: "مجلس التاجر", short: "التاجر", tagline: "", command: "/majlis", for: "", seats: BUSINESS_SEATS.map((s) => s.key) }];
// display hints for registry seats whose seat.json has not landed yet (names only, no brain content)
const STUB_HINTS = {
  ogilvy: ["David Ogilvy", "Ogilvy", "ديفيد أوجيلفي"], bernbach: ["Bill Bernbach", "Bernbach", "بيل برنباك"],
  schwartz: ["Eugene Schwartz", "Schwartz", "يوجين شوارتز"], sutherland: ["Rory Sutherland", "Sutherland", "روري ساذرلاند"],
  rams: ["Dieter Rams", "Rams", "ديتر رامز"], jobs: ["Steve Jobs", "Jobs", "ستيف جوبز"], chrisdo: ["Chris Do", "Chris Do", "كريس دو"],
  denney: ["Dara Denney", "Denney", "دارا ديني"],
  godin: ["Seth Godin", "Godin", "سيث جودين"], kotler: ["Philip Kotler", "Kotler", "فيليب كوتلر"], sharp: ["Byron Sharp", "Sharp", "بايرون شارب"],
  ritson: ["Mark Ritson", "Ritson", "مارك ريتسون"], brunson: ["Russell Brunson", "Brunson", "راسل برنسون"], miller: ["Donald Miller", "Miller", "دونالد ميلر"],
  dunford: ["April Dunford", "Dunford", "أبريل دنفورد"],
};
// spellings people (and older sessions) use that are not in a seat.json: matched, never displayed
const EXTRA_ALIASES = { bernbach: ["برنباخ", "بيل برنباخ", "برنباك", "بيل برنباك"] };
const PALETTE = ["#e8c480", "#e0a07a", "#d77a8f", "#b48ad8", "#8fb3e0", "#7cc4a4", "#9aa7bd", "#c9a27a", "#86c1c9"];
const titleCase = (slug) => String(slug || "").split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const initialsOf = (en) => String(en || "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

export const SEATS = [];   // every known seat, all councils (live array: refreshed in place)
export const byKey = {};   // key -> seat (live object)
export const COUNCILS = []; // the registry (live array)
export const councilByKey = {};
let lastSig = "";

function readJsonSafe(p) { try { return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, "")); } catch { return null; } }

function seatFromJson(j, dirSlug) {
  if (!j || typeof j !== "object" || !j.key) return null;
  const key = String(j.key).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!key) return null;
  const slug = j.slug || dirSlug;
  const en = j.en || j.english || titleCase(slug);
  const short = j.short || en.split(" ").pop();
  const name = j.name || short;
  const shortAr = j.shortAr || (/[؀-ۿ]/.test(name) ? name.split(/\s+/).pop() : name);
  const lastEn = en.split(" ").pop();
  return {
    key, slug, name, shortAr, en, short, initials: j.initials || initialsOf(en),
    pillar: j.pillarAr || j.pillar || "", pillarEn: j.pillar || "",
    question: j.question || "", dimension: j.dimensionAr || j.dimension || "", dimensionEn: j.dimension || "",
    color: /^#[0-9a-f]{3,8}$/i.test(j.color || "") ? j.color : "",
    council: j.council || "", fem: Boolean(j.fem),
    aliases: [...new Set([name, shortAr, short, en, key, ...(lastEn.length >= 4 ? [lastEn] : []), ...(Array.isArray(j.aliases) ? j.aliases : []), ...(EXTRA_ALIASES[key] || [])]
      .filter(Boolean).map((a) => (/[؀-ۿ]/.test(a) ? a : a.toLowerCase())))],
  };
}

/** Re-read councils.json and every brains/<slug>/seat.json. Cheap (stat-based); called by the watcher and /api/seats. */
export function refreshSeats(force = false) {
  let sig = "";
  const dirs = fs.existsSync(BRAINS_DIR) ? fs.readdirSync(BRAINS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];
  const files = [COUNCILS_FILE, ...dirs.map((d) => path.join(BRAINS_DIR, d, "seat.json"))];
  for (const f of files) { try { sig += f + fs.statSync(f).mtimeMs + "|"; } catch { /* missing is fine */ } }
  if (!force && sig === lastSig && SEATS.length) return;
  lastSig = sig;

  const reg = readJsonSafe(COUNCILS_FILE);
  const councils = Array.isArray(reg?.councils) && reg.councils.length ? reg.councils : FALLBACK_COUNCILS;
  const list = BUSINESS_SEATS.map((s) => ({ ...s, council: s.key === "customer" ? "*" : "business" }));
  const have = new Set(list.map((s) => s.key));
  for (const d of dirs) {
    const s = seatFromJson(readJsonSafe(path.join(BRAINS_DIR, d, "seat.json")), d);
    if (!s || have.has(s.key)) continue; // the hardcoded business seats win
    have.add(s.key);
    list.push(s);
  }
  // stubs for registry seats whose files have not landed yet
  for (const c of councils) for (const k of c.seats || []) {
    if (have.has(k)) continue;
    have.add(k);
    const [en, short, name] = STUB_HINTS[k] || [titleCase(k), titleCase(k), titleCase(k)];
    list.push({ ...seatFromJson({ key: k, slug: en.toLowerCase().replace(/\s+/g, "-"), en, short, name, council: c.key }, ""), stub: true });
  }
  // which councils each seat sits on; default colours for seats that brought none
  list.forEach((s, i) => {
    s.councils = councils.filter((c) => (c.seats || []).includes(s.key)).map((c) => c.key);
    if (!s.councils.length && s.council && s.council !== "*") s.councils = [s.council];
    if (!s.color) s.color = PALETTE[i % PALETTE.length];
  });
  SEATS.splice(0, SEATS.length, ...list);
  for (const k of Object.keys(byKey)) delete byKey[k];
  for (const s of list) byKey[s.key] = s;
  COUNCILS.splice(0, COUNCILS.length, ...councils.map((c) => ({ ...c, seats: (c.seats || []).filter((k) => byKey[k]) })));
  for (const k of Object.keys(councilByKey)) delete councilByKey[k];
  for (const c of COUNCILS) councilByKey[c.key] = c;
  systemCache.clear();
  brainText.clear();
}

/** The council key for a value ("creative", "مجلس الكريتيف والتصميم", ...), or the default. */
export function councilKey(x) {
  refreshSeats();
  const t = String(x ?? "").trim().toLowerCase();
  if (councilByKey[t]) return t;
  const a = arFold(t);
  const hit = a && COUNCILS.find((c) => arFold(c.name) === a || (c.short && a.includes(arFold(c.short))));
  return hit ? hit.key : (COUNCILS[0]?.key || "business");
}
/** Seat keys of a council, in table order. */
export const councilSeats = (key) => { refreshSeats(); return [...(councilByKey[councilKey(key)]?.seats || [])]; };

/** Pick a council from the decision text (the Chair does this in the skill; the app mirrors it). */
export function guessCouncil(text) {
  refreshSeats();
  const t = arFold(String(text || "").toLowerCase());
  let best = COUNCILS[0]?.key || "business", hits = 0;
  for (const c of COUNCILS) {
    const n = (c.keywords || []).filter((w) => t.includes(arFold(String(w).toLowerCase()))).length;
    if (n > hits) { hits = n; best = c.key; }
  }
  return best;
}


// ---------- text normalisation (Arabic digits, bidi marks, letter variants) ----------
const BIDI = /[\u200e\u200f\u202a-\u202e\u2066-\u2069\u061c]/g;
/** Western digits, no bidi marks, "٫" as a decimal point: what the number parsers expect. */
export function normText(t) {
  return String(t ?? "")
    .replace(BIDI, "")
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\u066b/g, ".")
    .replace(/\uff1a/g, ":");
}
/** Arabic letters folded so spelling variants match (أ/إ/آ → ا, ى → ي, ة → ه, ڤ → ف, no harakat). */
export const arFold = (s) => String(s ?? "")
  .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, "")
  .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
  .replace(/[\u0649\u0626\u06cc]/g, "\u064a")
  .replace(/[\u0629\u06be]/g, "\u0647")
  .replace(/\u0624/g, "\u0648")
  .replace(/\u06a9/g, "\u0643")
  .replace(/\u06a4/g, "\u0641")
  .replace(/\s+/g, " ").trim();
const AR = /[\u0600-\u06ff]/;

/** "Gary V", "garyvee", "GARY V (Marketing)", "Warren Buffett", "صوت العميل (الوزن ٢)" -> seat key */
export function findSeat(x, allowed) {
  refreshSeats();
  const pool = allowed && allowed.length ? SEATS.filter((s) => allowed.includes(s.key)) : SEATS;
  const raw = normText(x).replace(/[*_#`]/g, "").replace(/[(\uff08][\s\S]*$/, "").replace(/\s[-\u2013\u2014:|\u00b7][\s\S]*$/, "").trim();
  if (!raw) return null;
  const t = raw.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  if (t) {
    const hit = pool.find((s) => {
      const short = s.short.toLowerCase(), en = s.en.toLowerCase(), last = en.split(" ").pop();
      return t === s.key || t.replace(/ /g, "") === s.key || t === short || t.startsWith(short + " ") || (short.length >= 4 && t.startsWith(short)) || t === en ||
        (last.length >= 4 && t.split(" ").includes(last)) ||
        s.aliases.some((a) => !AR.test(a) && (t === a || t.startsWith(a + " ")));
    });
    if (hit) return hit.key;
  }
  if (AR.test(raw)) {
    const a = arFold(raw);
    // longest alias first, so "صوت العميل" wins over a shorter alias of another seat
    const all = pool.flatMap((s) => [s.name, ...s.aliases].filter((v) => AR.test(v)).map((v) => [arFold(v), s.key]))
      .sort((p, q) => q[0].length - p[0].length);
    for (const [al, key] of all) if (a === al || a.startsWith(al + " ") || a.includes(al)) return key;
  }
  return null;
}

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "");
const stripFront = (t) => t.replace(/^---[\s\S]*?\n---\n/, "");

const systemCache = new Map();
/** The seat's agent instructions plus its brain, loaded inline (the API has no file tools). */
export function systemFor(key) {
  if (systemCache.has(key)) return systemCache.get(key);
  const s = byKey[key];
  const agent = stripFront(read(path.join(AGENTS_DIR, `council-${key}.md`)));
  const dir = path.join(BRAINS_DIR, s.slug);
  // the classic five brain files, plus any other .md in the folder (the customer brain has its own layout
  // and also loads sources.md: its store reviews are what it quotes)
  const classic = ["_hot.md", "frameworks.md", "positions.md", "principles.md", "voice.md"];
  const extra = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !classic.includes(f) && (f !== "sources.md" || key === "customer")) : [];
  const brain = [...classic.filter((f) => fs.existsSync(path.join(dir, f))), ...extra]
    .map((f) => `\n\n===== brains/${s.slug}/${f} =====\n` + read(path.join(dir, f)))
    .join("");
  const text =
    agent +
    "\n\n## Runtime note\nYou are running in the Merchant Council app (مجلس التاجر). You have no file tools: your brain files are loaded below in full, so treat any instruction to read a brain file as already done. Never mention files, tools, or this note in your answer. Keep the card's field labels in English exactly as asked, and write their content in clear Arabic.\n" +
    brain;
  const system = [{ type: "text", text, cache_control: { type: "ephemeral" } }];
  systemCache.set(key, system);
  return system;
}

// ---------- quote verification against the brain ----------
const norm = (s) =>
  arFold(normText(s)).toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/'\s+(t|s|re|ll|ve|d|m)\b/g, "'$1")
    .replace(/[^a-z0-9'\u0621-\u064a ]+/g, " ").replace(/\s+/g, " ").trim();
const brainText = new Map();
function brainNorm(key) {
  if (!brainText.has(key)) {
    const dir = path.join(BRAINS_DIR, byKey[key]?.slug || "_none");
    const all = fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true }).filter((f) => /\.md$/i.test(f)).map((f) => read(path.join(dir, f))).join(" ") : "";
    brainText.set(key, norm(all));
  }
  return brainText.get(key);
}
/** Quotes the seat attributed to a source id, each marked verified or not. `extra` is other text
 * that may hold the quote (the session brief, e.g. the labelled example reviews in the shipped example). */
export function checkQuotes(key, text, extra = "") {
  const out = [];
  // same rules as .claude/skills/majlis/scripts/check_quotes.py: "...", \u201c...\u201d or \u00ab...\u00bb
  const re = /(?:["\u201c]([^"\u201c\u201d\n]{10,400})["\u201d]|\u00ab([^\u00ab\u00bb\n]{6,400})\u00bb)[^\n"\u00ab]{0,40}?[(\[](S\d{3})/g;
  let m;
  const hay = brainNorm(key) + (extra ? " " + norm(extra) : "");
  const src = normText(text);
  while ((m = re.exec(src))) {
    const raw = m[1] || m[2];
    const q = norm(raw);
    // Arabic customer quotes are short; three words is enough there (English: five)
    if (q.split(" ").length < (/[\u0621-\u064a]/.test(q) ? 3 : 5)) continue;
    out.push({ quote: raw, source: m[3], verified: hay.includes(q) || hay.replace(/ /g, "").includes(q.replace(/ /g, "")) });
  }
  return out;
}

// ---------- card parsing ----------
// The skill writes English machine labels (STANCE:, OPTION SCORES:, ...) with Arabic content.
// A label may sit at a line start (after list marks, bold, numbering, or bidi marks) or after a
// "·" / "|" when several share a line. Each label also accepts its Arabic name.
export const LABELS_AR = {
  "SEAT": "المقعد",
  "STANCE": "الموقف",
  "OPTION SCORES": "تقييم الخيارات",
  "FINAL PILLAR SCORE": "درجة المحور النهائية",
  "PILLAR SCORE": "درجة المحور",
  "FINAL SCORE": "الدرجة النهائية",
  "CONFIDENCE": "الثقة",
  "RUIN RISK": "خطر الخسارة الكبيرة",
  "DOOR": "نوع القرار",
  "THE CALL": "القرار",
  "WHY": "لماذا",
  "THE RISK I SEE": "الخطر اللي أشوفه",
  "WHAT WOULD CHANGE MY MIND": "وش يغيّر رأيي",
  "WHAT I'D DO THIS WEEK": "اللي أسويه هالأسبوع",
  "QUESTION FOR THE FOUNDER": "سؤالي لك",
  "I DISAGREE MOST WITH": "أكثر واحد أختلف معه",
  "I CONCEDE": "أعترف",
  "ON THE CRUXES": "عن نقاط الخلاف",
  "MOVED": "هل غيّرت موقفي",
  "MY CONDITIONS FOR YES": "شروطي للموافقة",
  "VOTE": "التصويت",
  "AMENDMENT OR DISSENT": "التعديل أو الاعتراض",
  "ONE LINE FOR THE FOUNDER": "سطر واحد لك",
};
// other Arabic spellings the skill might use instead of the English label
const AR_ALT = {
  "RUIN RISK": ["خطر الإفلاس", "خطر الخسارة"],
  "DOOR": ["الباب"],
  "CONFIDENCE": ["درجة الثقة"],
  "OPTION SCORES": ["درجات الخيارات"],
};
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['\u2019]");
const LEAD = "(?:^|[\u00b7|])[ \\t>*\u2022\\-\u2013]*(?:\\d+[.)][ \\t]*)?";
const labelAlt = (label) => [label, LABELS_AR[label], ...(AR_ALT[label] || [])].filter(Boolean).map(reEsc).join("|");
const field = (text, label) => {
  const re = new RegExp(`${LEAD}\\**[ \\t]*(?:${labelAlt(label)})[ \\t]*(?:\\([^)\\n]{0,40}\\))?[ \\t]*\\**[ \\t]*:[ \\t]*\\**[ \\t]*([^\\n\u00b7]+)`, "im");
  const m = text.match(re);
  return m ? m[1].replace(/\*+/g, "").trim() : "";
};
const num = (s) => { const m = (s || "").match(/(\d+(?:\.\d+)?)/); return m ? Number(m[1]) : null; };
const AL = "\\u0600-\\u06ff";
const arWord = (w) => new RegExp(`(?<![${AL}])${w}(?![${AL}])`);
/** The keyword group that appears first in s, by position. */
function firstOf(s, groups) {
  let best = "", at = Infinity;
  for (const [val, re] of groups) { const m = re.exec(s); if (m && m.index < at) { at = m.index; best = val; } }
  return best;
}

export function parseOptionScores(text, optionIds) {
  text = normText(text);
  // the option line itself uses "·" between options, so read to end of line
  const lm = text.match(new RegExp(`(?:${labelAlt("OPTION SCORES")})\\**[ \\t]*:[ \\t]*([^\\n]+)`, "i"));
  const line = (lm ? lm[1] : "").split(/PILLAR SCORE|CONFIDENCE|FINAL SCORE|درجة المحور|الثقة|الدرجة النهائية/i)[0];
  const scores = {};
  for (const id of optionIds) {
    const m = line.match(new RegExp(`(?<![A-Za-z])${id}(?![A-Za-z])\\s*\\**\\s*[:=]?\\s*(\\d+(?:\\.\\d+)?)`));
    if (m) scores[id] = Math.max(0, Math.min(10, Number(m[1])));
  }
  return scores;
}

export function parseCard(raw, optionIds, allowed) {
  const text = normText(raw);
  const stance = field(text, "STANCE");
  const ruin = firstOf(field(text, "RUIN RISK").toLowerCase(), [
    ["none", /none|no risk|لا يوجد|معدوم|منعدم|منخفض|ضعيف|صفر/], ["none", arWord("لا")],
    ["possible", /possible|محتمل|ممكن|وارد|متوسط/],
    ["likely", /likely|مرجح|مرجّح|مرتفع|عال|كبير/],
  ]);
  const disagree = field(text, "I DISAGREE MOST WITH");
  const head = disagree.slice(0, 40);
  // only seats at this council's table can be the target ("Jobs", "Sharp", "Do" are also plain words)
  const pool = allowed && allowed.length ? SEATS.filter((s) => allowed.includes(s.key)) : SEATS;
  const lastOf = (s) => s.en.split(" ").pop();
  const target = pool.find((s) => new RegExp(`\\b(${reEsc(s.short)}${lastOf(s).length >= 4 ? "|" + reEsc(lastOf(s)) : ""})\\b`, "i").test(head))?.key || findSeat(head, allowed);
  const voteRaw = field(text, "VOTE");
  const vote = (/dissent|أعارض|اعارض|اعتراض|معارض|أرفض|ارفض|رفض/i.test(voteRaw) ? "dissent"
    : /amend|تعديل/i.test(voteRaw) ? "amend"
    : /endorse|أؤيد|اؤيد|أويد|تأييد|تاييد|موافق|أوافق|اوافق/i.test(voteRaw) ? "endorse" : "");
  const door = firstOf(field(text, "DOOR").toLowerCase(), [
    ["one-way", /one-way|one way|اتجاه واحد|لا رجعة|ما ينرد|نهائي/],
    ["two-way", /two-way|two way|اتجاهين|قابل للرجوع|ينرد/],
  ]);
  return {
    stance,
    call: field(text, "THE CALL"),
    optionScores: parseOptionScores(text, optionIds),
    pillar: num(field(text, "PILLAR SCORE")) ?? num(field(text, "FINAL PILLAR SCORE")),
    finalScore: num(field(text, "FINAL SCORE")),
    confidence: num(field(text, "CONFIDENCE")),
    ruin,
    door,
    disagreeWith: target || null,
    disagreeLine: disagree,
    concede: field(text, "I CONCEDE"),
    moved: field(text, "MOVED"),
    vote,
    amendment: field(text, "AMENDMENT OR DISSENT"),
    oneLine: field(text, "ONE LINE FOR THE FOUNDER"),
    question: field(text, "QUESTION FOR THE FOUNDER"),
    risk: field(text, "THE RISK I SEE"),
    thisWeek: field(text, "WHAT I'D DO THIS WEEK"),
  };
}

// load the registry and the seats once at startup (after every helper above is defined)
refreshSeats(true);
