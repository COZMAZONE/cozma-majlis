#!/usr/bin/env node
// Writes sessions/<id>/replay.html: the whole room (styles, script, seats, portraits, every event,
// the studio wall) in ONE file with all data inlined, so it opens offline by double-click, with no
// server and no fetch. Studio images stay as relative links (studio/thumbs/..., studio/designs/...),
// so keep replay.html inside its session folder (download the folder, or the repo as a ZIP).
// Node only, zero dependencies.
//
//   node .claude/skills/majlis/scripts/export-replay.mjs sessions/<id> [sessions/<id2> ...]
//   node .claude/skills/majlis/scripts/export-replay.mjs --all
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const PUBLIC = path.join(REPO, "app", "public");
const SESSIONS = path.join(REPO, "sessions");
const MIME = { ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };
const dataUri = (f) => `data:${MIME[path.extname(f).toLowerCase()] || "application/octet-stream"};base64,${fs.readFileSync(f).toString("base64")}`;
// JSON and JS go inside <script>: never let them close the tag early
const safe = (s) => String(s).replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");

export async function exportReplay(id) {
  const st = await import(pathToFileURL(path.join(REPO, "app", "lib", "static.mjs")).href);
  const room = st.roomFor(id);
  if (!room) throw new Error(`${id}: not a council folder (no council.json)`);
  const council = room.council || "business";
  const seatsAll = st.seatsPayload();
  // only the seats this session needs: its council, plus anyone named in its events
  const { COUNCILS } = await import(pathToFileURL(path.join(REPO, "app", "lib", "seats.mjs")).href);
  const c = COUNCILS.find((x) => x.key === council);
  const want = new Set(c?.seats || []);
  for (const ev of room.events) { if (ev.seat) want.add(ev.seat); for (const k of ev.seats || []) if (typeof k === "string") want.add(k); }
  const portraitCache = new Map();
  const inlineP = (rel) => { if (!rel) return rel; if (!portraitCache.has(rel)) portraitCache.set(rel, dataUri(path.join(PUBLIC, rel))); return portraitCache.get(rel); };
  const seats = seatsAll.map((s) => (want.has(s.key) && s.portraits ? { ...s, portraits: Object.fromEntries(Object.entries(s.portraits).map(([k, v]) => [k, inlineP(v)])) } : { ...s, portraits: want.has(s.key) ? s.portraits : null }));

  // the studio wall, with links relative to this folder
  let studio = null;
  const dj = path.join(SESSIONS, id, "studio", "designs.json");
  if (fs.existsSync(dj)) {
    const j = JSON.parse(fs.readFileSync(dj, "utf8"));
    const rel = (f) => "studio/" + String(f).replace(/\\/g, "/").replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
    studio = { brand: j.brand || "", image_tool: j.image_tool || "", designs: (j.designs || []).filter((d) => d && d.id && d.file).map((d) => ({ ...d, url: rel(d.file), thumb_url: rel(d.thumb || d.file) })) };
  }
  const summary = { id, title: room.title, mode: room.mode, council, status: room.status, studio: studio?.designs.length || 0, source: "replay" };
  const data = {
    id, chair: dataUri(path.join(PUBLIC, "brand", "majlis-mark.svg")),
    seats: { seats, councils: COUNCILS, models: {}, runner: "inline", hasKey: false },
    index: [summary], rooms: { [id]: room }, studio: studio ? { [id]: studio } : {},
  };

  let html = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(PUBLIC, "styles.css"), "utf8");
  const js = fs.readFileSync(path.join(PUBLIC, "app.js"), "utf8");
  const chair = data.chair;
  html = html
    .replace(/<link rel="stylesheet" href="styles\.css">/, () => `<style>\n${css.replace(/<\/style/gi, "<\\/style")}\n</style>`)
    .replace(/<script src="app\.js" type="module"><\/script>/, () => `<script>window.MAJLIS_STATIC = ${safe(JSON.stringify(data))};</script>\n<script type="module">\n${safe(js)}\n</script>`)
    .replace(/href="brand\/majlis-mark\.svg"/g, () => `href="${chair}"`)
    .replace(/src="brand\/majlis-mark\.svg"/g, () => `src="${chair}"`)
    .replace(/<a class="brand" href="\.\/"/, '<a class="brand" href="#"')
    .replace(/<title>[^<]*<\/title>/, () => `<title>المجلس: ${room.title.replace(/[<&]/g, "")}</title>`);
  if (!html.includes("window.MAJLIS_STATIC")) throw new Error("index.html layout changed: could not inline app.js");
  const out = path.join(SESSIONS, id, "replay.html");
  fs.writeFileSync(out, html);
  return { file: out, bytes: Buffer.byteLength(html) };
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const ids = args.includes("--all")
    ? fs.readdirSync(SESSIONS).filter((d) => fs.existsSync(path.join(SESSIONS, d, "council.json")))
    : args.filter((a) => !a.startsWith("--")).map((a) => path.basename(path.resolve(a)));
  if (!ids.length) { console.log("usage: node export-replay.mjs sessions/<id> [...] | --all"); process.exit(2); }
  let bad = 0;
  for (const id of ids) {
    try { const r = await exportReplay(id); console.log(`replay: ${path.relative(REPO, r.file).replace(/\\/g, "/")} (${(r.bytes / 1024).toFixed(0)} KB)`); }
    catch (e) { bad++; console.error(`${id}: ${e.message}`); }
  }
  process.exit(bad ? 1 : 0);
}
