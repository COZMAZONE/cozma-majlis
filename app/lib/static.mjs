// Static room data: the same payloads the server's /api/* routes return, written as plain JSON
// files next to the sessions, so the room also works as a static site (GitHub Pages, or a
// Claude Code on the web session where nobody can open localhost) and as an offline replay.html.
//
//   app/public/seats.json         = /api/seats   (portraits as relative paths)
//   sessions/index.json           = /api/sessions
//   sessions/<id>/room.json       = /api/sessions/<id> (the events the room plays)
//
// Written by .claude/skills/majlis/scripts/publish.mjs after every file the Chair writes.
import fs from "node:fs";
import path from "node:path";
import { APP_ROOT, SESSIONS_DIR } from "./env.mjs";
import { SEATS, COUNCILS, refreshSeats } from "./seats.mjs";
import * as watch from "./watch.mjs";

export const PUBLIC = path.join(APP_ROOT, "public");
const SHAPES = ["base", "open", "mid", "blink"];

/** Portrait files for a seat, as paths relative to app/public (works at "/" and under any sub-path). */
export function portraitsFor(key) {
  const find = (shape) => { for (const ext of ["webp", "png", "svg"]) { const f = `${key}-${shape}.${ext}`; if (fs.existsSync(path.join(PUBLIC, "portraits", f))) return `portraits/${f}`; } return null; };
  const base = find("base");
  if (!base) return null;
  return Object.fromEntries(SHAPES.map((sh) => [sh, sh === "base" ? base : find(sh) || base]));
}

export function seatsPayload() {
  refreshSeats();
  return SEATS.map((s) => { const p = portraitsFor(s.key); return { ...s, portraits: p, drawn: Boolean(p && /\.svg$/.test(p.base)) }; });
}

const lastTouched = (dir) => {
  let m = 0;
  const walk = (d) => { for (const n of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, n.name); if (n.isDirectory()) walk(p); else if (n.name !== "room.json" && n.name !== "replay.html") m = Math.max(m, fs.statSync(p).mtimeMs); } };
  try { walk(dir); } catch { /* gone */ }
  return Math.round(m);
};

/** The /api/sessions/<id> payload for a folder the skill wrote. */
export function roomFor(id) {
  const x = watch.getLive(id);
  if (!x) return null;
  return { id, title: x.title || id, mode: x.mode, council: x.council || "business", status: x.status, updated: lastTouched(path.join(SESSIONS_DIR, id)), events: x.events };
}

/** sessions/index.json: the /api/sessions shape, plus `updated` so a static viewer can tell a live council from an abandoned one. */
export function indexPayload() {
  const sessions = watch.listLive().map((s) => ({ ...s, updated: lastTouched(path.join(SESSIONS_DIR, s.id)) })).sort((a, b) => (a.id < b.id ? 1 : -1));
  return { generated: new Date().toISOString(), sessions, running: null, live: watch.runningId() };
}

const writeJson = (p, obj) => { const t = p + ".tmp"; fs.writeFileSync(t, JSON.stringify(obj)); fs.renameSync(t, p); };

/** Rewrite seats.json, index.json, and room.json for one session (or for every session when id is empty). */
export function writeStatic(id = "") {
  watch.scan();
  writeJson(path.join(PUBLIC, "seats.json"), { seats: seatsPayload(), councils: COUNCILS, models: {}, runner: "static", hasKey: false });
  const idx = indexPayload();
  const ids = id ? [id] : idx.sessions.map((s) => s.id);
  const written = [];
  for (const sid of ids) {
    const room = roomFor(sid);
    if (!room) continue;
    writeJson(path.join(SESSIONS_DIR, sid, "room.json"), room);
    written.push(sid);
  }
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  writeJson(path.join(SESSIONS_DIR, "index.json"), idx);
  return { index: idx, written };
}
