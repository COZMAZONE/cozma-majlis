// Viewer mode: /majlis runs in Claude Code and writes its session folder as it
// goes. This watches the sessions folder and turns those files into the same events the
// API runner emits, so the room plays a Claude Code council live without calling any API.
//
// Files the Chair writes, in order (spec: .claude/skills/majlis/references/live-room.md):
//   council.json  -> setup        round-1.md -> Round 1 cards   cruxes.json -> fault lines
//   round-2.md    -> debate cards  draft.json -> proposal       round-3.md  -> votes
//   verdict.json  -> the verdict
import fs from "node:fs";
import path from "node:path";
import { byKey, parseCard, checkQuotes, findSeat, councilKey, councilSeats, councilByKey, refreshSeats } from "./seats.mjs";
import { SESSIONS_DIR } from "./env.mjs";
import { optionScores, finalNumbers, verdictSeats, DISCLAIMER } from "./council.mjs";

const live = new Map(); // folder name -> session
const STALE_MS = 3 * 60 * 60 * 1000; // a folder untouched this long is an abandoned council

const readText = (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return null; } };
const readJson = (p) => { const t = readText(p); if (!t) return null; try { return JSON.parse(t); } catch { return null; } };

/** "Gary V", "garyvee", "GARY V (Marketing)", "Warren Buffett", "Customer", "صوت العميل" -> seat key */
export function seatKey(x, allowed) {
  return findSeat(x, allowed);
}

/** Split a round file into seat cards. A card is the text under a "## <Seat>" heading
 * (how the skill writes them); without seat headings, each "SEAT:" line starts a card.
 * Chair sections are dropped. */
const CHAIR = /chair|الرئيس|رئيس المجلس|ملاحظات/i;
export function splitCards(md, allowed) {
  const heads = [...md.matchAll(/^#{2,3}[ \t]+(.+)$/gm)];
  const seatHeads = heads.filter((h) => !CHAIR.test(h[1]) && seatKey(h[1], allowed));
  if (seatHeads.length) {
    return seatHeads.map((h) => {
      const next = heads.find((n) => n.index > h.index);
      const text = md.slice(h.index + h[0].length, next ? next.index : md.length).replace(/(\n\s*(-{3,}|\*{3,}))+\s*$/g, "").trim();
      return { key: seatKey(h[1], allowed), text };
    }).filter((c) => c.text);
  }
  const body = md.split(/^#{1,4}[^\n]*(?:\bchair\b|الرئيس|رئيس المجلس|ملاحظات)[^\n]*$/im)[0];
  const marks = [...body.matchAll(/^[‎‏]*\**(?:SEAT|المقعد)\**[ \t]*:[ \t]*(.+)$/gim)];
  return marks.map((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : body.length;
    const text = body.slice(m.index, end).replace(/(\n\s*(#{1,4} [^\n]*|-{3,}|\*{3,}))+\s*$/g, "").trim();
    return { key: seatKey(m[1], allowed), text };
  }).filter((c) => c.key);
}

function emit(x, type, data = {}) {
  const ev = { type, t: Date.now() - x.started, ...data };
  x.events.push(ev);
  const line = `data: ${JSON.stringify(ev)}\n\n`;
  for (const res of x.subs) res.write(line);
}

function finish(x, status) {
  x.status = status;
  for (const res of x.subs) res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
  x.subs.clear();
}

function normalizeSetup(c) {
  const options = (c.options || []).map((o, i) => (typeof o === "string" ? { id: "ABCD"[i], label: o } : { id: String(o.id || "ABCD"[i]).toUpperCase(), label: o.label || o.text || "" }));
  // which council: the "council" field (business when missing, so older sessions still play)
  const council = councilKey(c.council || "business");
  const roster = councilSeats(council);
  const weights = Object.fromEntries(roster.map((k) => [k, { weight: 1, reason: "" }]));
  const wl = Array.isArray(c.weights) ? c.weights : Object.entries(c.weights || {}).map(([seat, w]) => (typeof w === "number" ? { seat, weight: w } : { seat, ...w }));
  for (const w of wl) { const k = seatKey(w.seat, roster) || seatKey(w.seat); if (k) weights[k] = { weight: Math.max(1, Math.min(3, Number(w.weight) || 1)), reason: w.reason || "" }; }
  const seats = (c.seats || []).map((x) => seatKey(x, roster) || seatKey(x)).filter(Boolean);
  const mode = c.mode === "quick" ? "quick" : "full";
  const out = {
    council, councilName: councilByKey[council]?.name || "",
    title: c.title || councilByKey[council]?.name || "المجلس", decision: c.decision || "", brief: c.brief || "", mode,
    options, assumptions: c.assumptions || [], weights,
    seats: seats.length ? [...new Set(seats)] : roster,
  };
  for (const k of out.seats) if (!out.weights[k]) out.weights[k] = { weight: 1, reason: "" };
  return out;
}

// `at` is when the step began (the mtime of the file that started it), so a viewer who
// opens the room halfway through a round still sees how long the room has been waiting.
const mtime = (p) => { try { return fs.statSync(p).mtimeMs; } catch { return Date.now(); } };

function startRound(x, r, label, at) {
  const st = x.st;
  st.rounds.push(r);
  x.round = r;
  emit(x, "phase", { phase: `round${r}`, label, at });
  emit(x, "round_start", { round: r, at });
  for (const k of st.seats) emit(x, "seat_start", { round: r, seat: k });
}

/** Emit the cards in a round file that have not been emitted yet. Returns true once the round is complete. */
function readRound(x, r, force) {
  const st = x.st;
  const md = readText(path.join(x.dir, `round-${r}.md`));
  if (!md) return false;
  for (const c of splitCards(md, st.seats)) {
    if (!st.seats.includes(c.key) || st.cards[r][c.key]) continue;
    const parsed = parseCard(c.text, st.options.map((o) => o.id), st.seats);
    const quotes = checkQuotes(c.key, c.text, readText(path.join(x.dir, "brief.md")) || "");
    st.cards[r][c.key] = { text: c.text, parsed, quotes };
    emit(x, "seat_done", { round: r, seat: c.key, text: c.text, parsed, quotes, name: byKey[c.key].name });
  }
  const have = st.seats.filter((k) => st.cards[r][k]).length;
  if (have === st.seats.length || (force && have > 0)) {
    st.scores[r] = optionScores(st, r);
    emit(x, "round_done", { round: r, scores: st.scores[r] });
    return true;
  }
  return false;
}

function sync(x) {
  const f = (n) => path.join(x.dir, n);
  const has = (n) => fs.existsSync(f(n));
  const st = x.st;

  if (x.step === "setup") {
    const c = readJson(f("council.json"));
    if (!c) return;
    Object.assign(st, normalizeSetup(c));
    x.title = st.title;
    x.mode = st.mode;
    x.council = st.council;
    emit(x, "phase", { phase: "setup", label: "رئيس المجلس يقرأ سؤالك", at: mtime(f("council.json")) });
    emit(x, "setup", { council: st.council, councilName: st.councilName, title: st.title, decision: st.decision, brief: st.brief, options: st.options, assumptions: st.assumptions, weights: st.weights, seats: st.seats, mode: st.mode });
    startRound(x, 1, "الجولة ١: المواقف الافتتاحية", mtime(f("council.json")));
    x.step = "r1";
  }
  if (x.step === "r1") {
    if (!readRound(x, 1, has("cruxes.json"))) return;
    emit(x, "phase", { phase: "cruxes", label: "رئيس المجلس يحدّد نقاط الخلاف", at: mtime(f("round-1.md")) });
    x.step = "cruxes";
  }
  if (x.step === "cruxes") {
    const c = readJson(f("cruxes.json"));
    if (!c) return;
    const cruxes = (c.cruxes || []).map((q) => ({ question: q.question || "", sides: (q.sides || []).map((sd) => ({ position: sd.position || "", seats: (sd.seats || []).map((k) => seatKey(k, st.seats) || seatKey(k)).filter(Boolean) })) }));
    emit(x, "cruxes", { cruxes, unanimous: Boolean(c.unanimous), note: c.note || "", pressure: {} });
    startRound(x, 2, "الجولة ٢: النقاش", mtime(f("cruxes.json")));
    x.step = "r2";
  }
  if (x.step === "r2") {
    if (!readRound(x, 2, has("draft.json") || has("verdict.json"))) return;
    emit(x, "phase", { phase: "draft", label: "رئيس المجلس يوزن النقاش", at: mtime(f("round-2.md")) });
    x.step = "draft";
  }
  if (x.step === "draft") {
    const d = readJson(f("draft.json"));
    if (d) {
      st.draft = { option: d.option || "", label: d.label || "", recommendation: d.recommendation || "", conditions: d.conditions || [], next_steps: d.next_steps || [], cheapest_test: d.cheapest_test || "", kill_criteria: d.kill_criteria || "" };
      emit(x, "draft", { draft: st.draft });
      startRound(x, 3, "الجولة ٣: التصويت", mtime(f("draft.json")));
      x.step = "r3";
    } else if (has("verdict.json")) {
      emit(x, "phase", { phase: "skip3", label: "الوضع السريع: تخطّينا جولة التصويت", at: mtime(f("round-2.md")) });
      x.step = "verdict";
    } else return;
  }
  if (x.step === "r3") {
    if (!readRound(x, 3, has("verdict.json"))) return;
    emit(x, "phase", { phase: "verdict", label: "رئيس المجلس يكتب الحكم", at: mtime(f("round-3.md")) });
    x.step = "verdict";
  }
  if (x.step === "verdict") {
    const v = readJson(f("verdict.json"));
    if (!v) return;
    const { last, finalScores, recommended, spreadF, confidence, support, votes } = finalNumbers(st);
    const verdict = {
      label: v.label || "RESHAPE", call: v.call || "", override_note: v.override_note || "",
      why: v.why || [], fights: v.fights || [], minority: v.minority || { seat: "", quote: "", would_have_to_be_true: "" },
      amendments: v.amendments || [], conditions: v.conditions || [],
      next_steps: (v.next_steps || []).map((n) => (typeof n === "string" ? { when: "", action: n } : n)),
      cheapest_test: v.cheapest_test || "", kill_criteria: v.kill_criteria || "", revisit: v.revisit || "",
      recommended: v.recommended || recommended, scores: finalScores, spread: spreadF, confidence, support, votes, disclaimer: DISCLAIMER,
    };
    emit(x, "verdict", { verdict, seats: verdictSeats(st, last) });
    x.step = "done";
    finish(x, "done");
  }
}

function lastTouched(dir) {
  try { return Math.max(...fs.readdirSync(dir).map((n) => fs.statSync(path.join(dir, n)).mtimeMs)); } catch { return 0; }
}

function load(name) {
  const dir = path.join(SESSIONS_DIR, name);
  let x = live.get(name);
  if (!x) {
    x = { id: name, dir, events: [], subs: new Set(), status: "running", started: Date.now(), step: "setup", title: "", mode: "full",
      st: { cards: { 1: {}, 2: {}, 3: {} }, scores: {}, rounds: [] } };
    live.set(name, x);
  }
  if (x.status === "running") {
    sync(x);
    if (x.status === "running" && Date.now() - lastTouched(dir) > STALE_MS) finish(x, "stopped");
  }
  return x;
}

/** Folders written by the skill (council.json, no events.json from the API runner). */
function skillFolders() {
  if (!fs.existsSync(SESSIONS_DIR)) return [];
  return fs.readdirSync(SESSIONS_DIR).filter((d) => fs.existsSync(path.join(SESSIONS_DIR, d, "council.json")) && !fs.existsSync(path.join(SESSIONS_DIR, d, "events.json")));
}

export function scan() {
  refreshSeats(); // new seat.json files land while the room runs
  const names = skillFolders();
  for (const name of [...live.keys()]) if (!names.includes(name)) { finish(live.get(name), "stopped"); live.delete(name); } // folder deleted
  for (const name of names) load(name);
}

export function getLive(id) {
  return skillFolders().includes(id) ? load(id) : null;
}

/** The council running right now in Claude Code, if any (newest first). */
const FRESH_MS = 20 * 60 * 1000; // only a folder written in the last 20 minutes counts as "live now"
export function runningId() {
  const r = [...live.values()].filter((x) => x.status === "running" && x.events.length && Date.now() - lastTouched(x.dir) < FRESH_MS).sort((a, b) => (a.id < b.id ? 1 : -1));
  return r[0]?.id || null;
}

export function listLive() {
  return skillFolders().map((n) => { const x = load(n); return { id: x.id, title: x.title || n, prompt: "", mode: x.mode, council: x.council || "business", status: x.status, source: "claude-code", studio: studioCount(n) }; });
}

export function startWatching() {
  scan();
  setInterval(scan, 1000);
}

// ------------------------------------------------------------- «الاستوديو» (studio)
// After a creative verdict, /majlis studio writes sessions/<id>/studio/designs.json and appends
// one record per finished design (spec: .claude/skills/majlis/references/studio.md). The room's
// «المعرض» wall streams them in as they land; the seat that made each one speaks its rationale.
const studios = new Map(); // folder name -> { mtime, designs, meta, seen, subs }
const studioJson = (id) => path.join(SESSIONS_DIR, id, "studio", "designs.json");
const SAFE_ID = /^[\w.-]+$/;

function publicDesign(id, d) {
  const v = Date.parse(d.created || "") || 0;
  const file = String(d.file || "").replace(/\\/g, "/").replace(/^\/+/, "");
  const link = (f) => `/studio-file/${encodeURIComponent(id)}/${f.split("/").map(encodeURIComponent).join("/")}?v=${v}`;
  const thumb = String(d.thumb || "").replace(/\\/g, "/").replace(/^\/+/, "");
  return { ...d, file, url: link(file), thumb_url: thumb ? link(thumb) : link(file) };
}

function writeEv(res, ev) { res.write(`data: ${JSON.stringify(ev)}\n\n`); }

export function syncStudio(id) {
  if (!SAFE_ID.test(id)) return null;
  const f = studioJson(id);
  let m;
  try { m = fs.statSync(f).mtimeMs; } catch {
    // designs.json removed (a fresh studio run is about to start): clear the wall
    const old = studios.get(id);
    if (old?.mtime) {
      Object.assign(old, { mtime: 0, designs: [], seen: new Map() });
      for (const res of old.subs) writeEv(res, { type: "snapshot", designs: [], ...old.meta });
    }
    return old || null;
  }
  let s = studios.get(id);
  if (!s) { s = { mtime: 0, designs: [], meta: {}, seen: new Map(), subs: new Set() }; studios.set(id, s); }
  if (m === s.mtime) return s;
  const j = readJson(f);
  if (!j) return s; // caught mid-write; the next scan reads it
  s.mtime = m;
  s.meta = { brand: j.brand || "", image_tool: j.image_tool || "" };
  const list = (Array.isArray(j.designs) ? j.designs : []).filter((d) => d && d.id && d.file);
  for (const d of list) {
    const sig = `${d.file}|${d.created || ""}|${d.status || ""}`;
    if (s.seen.get(d.id) === sig) continue;
    const isNew = !s.seen.has(d.id);
    s.seen.set(d.id, sig);
    for (const res of s.subs) writeEv(res, { type: isNew ? "design" : "design_update", design: publicDesign(id, d) });
  }
  s.designs = list.map((d) => publicDesign(id, d));
  return s;
}

export function getStudio(id) {
  const s = syncStudio(id);
  if (!s || !s.mtime) return null;
  return { id, ...s.meta, designs: s.designs };
}

/** SSE: a snapshot of the wall, then one event per design as it lands. */
export function subscribeStudio(id, res) {
  const s = syncStudio(id) || (studios.set(id, { mtime: 0, designs: [], meta: {}, seen: new Map(), subs: new Set() }), studios.get(id));
  writeEv(res, { type: "snapshot", designs: s.designs, ...s.meta });
  s.subs.add(res);
  res.on("close", () => s.subs.delete(res));
}

export function studioCount(id) { return syncStudio(id)?.designs.length || 0; }

/** Absolute path of a file inside sessions/<id>/studio/, or null if it escapes that folder. */
export function studioPath(id, rel) {
  if (!SAFE_ID.test(id)) return null;
  const root = path.join(SESSIONS_DIR, id, "studio");
  const f = path.normalize(path.join(root, rel));
  return f.startsWith(root + path.sep) ? f : null;
}

setInterval(() => { for (const id of studios.keys()) if (studios.get(id).subs.size) syncStudio(id); }, 1000);
