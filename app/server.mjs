import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { APP_ROOT, env } from "./lib/env.mjs";
import { COUNCILS } from "./lib/seats.mjs";
import { startCouncil, getSession, subscribe, listSaved, loadSaved, MODELS } from "./lib/council.mjs";
import { usage } from "./lib/anthropic.mjs";
import * as watch from "./lib/watch.mjs";
import { seatsPayload } from "./lib/static.mjs";

const PORT = Number(process.env.PORT) || 4730;
const PUBLIC = path.join(APP_ROOT, "public");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon", ".json": "application/json", ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8" };

// Portraits and the seats payload live in lib/static.mjs (shared with the static build and replay.html).

let running = null; // one council at a time (API runner)

// "viewer" (default): the room plays councils that /majlis runs in Claude Code.
// "api": the room can also run councils itself on ANTHROPIC_API_KEY (COUNCIL_RUNNER=api in .env).
const RUNNER = (process.env.COUNCIL_RUNNER || env("COUNCIL_RUNNER") || "viewer").toLowerCase() === "api" ? "api" : "viewer";
watch.startWatching();

function send(res, code, body, type = "application/json") {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

async function readJson(req) {
  let raw = "";
  for await (const c of req) { raw += c; if (raw.length > 1e5) throw new Error("body too large"); }
  return raw ? JSON.parse(raw) : {};
}

// "Download all": no zip without a dependency, so a plain page that lists every design with its
// own download link, plus one button that saves them one after another.
const escH = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function studioListPage(id, s) {
  const rows = s.designs.map((d) => `<li><a href="${escH(d.url)}" target="_blank"><img src="${escH(d.url)}" alt="" loading="lazy"></a><div><b>${escH(d.headline_ar || d.hook_ar)}</b><small>${escH(d.seat)} · ${escH(d.format)} · ${escH(d.angle)}${d.status === "flagged" ? " · يحتاج مراجعة" : ""}</small><a class="dl" href="${escH(d.url)}&download=1" download>${escH(d.file.split("/").pop())}</a></div></li>`).join("");
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>المعرض: كل التصاميم</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
<style>body{margin:0;background:#0b0f12;color:#e8ecec;font:15px/1.6 Cairo,sans-serif;padding:24px 16px}h1{font-size:22px;margin:0 0 4px}p{color:#98a6ab;margin:0 0 16px}
button{background:#d9b878;color:#14110c;border:0;border-radius:999px;padding:9px 18px;font:700 14px Cairo;cursor:pointer}
ul{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-top:18px}
li{background:#12181c;border:1px solid rgba(220,235,240,.1);border-radius:14px;overflow:hidden}li img{width:100%;display:block;aspect-ratio:1;object-fit:contain;background:#000}
li div{padding:10px 12px;display:grid;gap:2px}small{color:#98a6ab}.dl{color:#d9b878;font-weight:600;text-decoration:none;direction:ltr;text-align:right;overflow-wrap:anywhere}</style></head>
<body><h1>المعرض: ${s.designs.length} تصميم</h1><p>${escH(s.brand || "")} · مقترحات من مقاعد محاكاة. راجعها قبل أي نشر.</p>
<button id="all" type="button">حمّل الكل واحد واحد</button><ul>${rows}</ul>
<script>document.getElementById("all").onclick=async()=>{for(const a of document.querySelectorAll("a.dl")){a.click();await new Promise(r=>setTimeout(r,450));}};</script></body></html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  try {
    if (p === "/api/seats") return send(res, 200, { seats: seatsPayload(), councils: COUNCILS, models: MODELS, runner: RUNNER, hasKey: Boolean(env("ANTHROPIC_API_KEY")) });
    if (p === "/api/usage") return send(res, 200, usage);
    if (p === "/api/council" && req.method === "POST") {
      if (RUNNER !== "api") return send(res, 403, { error: "المجلس هنا للمشاهدة فقط. شغّل الأمر في Claude Code، أو اضبط COUNCIL_RUNNER=api في ملف .env." });
      if (running && getSession(running)?.status === "running") return send(res, 409, { error: "فيه مجلس منعقد الحين. انتظر حكمه." });
      const { prompt, mode, council } = await readJson(req);
      if (!prompt || prompt.trim().length < 10) return send(res, 400, { error: "اكتب قرار حقيقي (جملة على الأقل)." });
      const s = startCouncil(prompt.trim().slice(0, 4000), mode === "quick" ? "quick" : "full", council);
      running = s.id;
      return send(res, 200, { id: s.id });
    }
    if (p.startsWith("/api/stream/")) {
      const id = decodeURIComponent(p.split("/").pop());
      const s = getSession(id) || watch.getLive(id);
      if (!s) return send(res, 404, { error: "no such session" });
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
      res.write(": connected\n\n");
      const ping = setInterval(() => res.write(": ping\n\n"), 15000);
      res.on("close", () => clearInterval(ping));
      return subscribe(s, res);
    }
    if (p === "/api/sessions") {
      const all = [...listSaved(), ...watch.listLive()].sort((a, b) => (a.id < b.id ? 1 : -1));
      const apiRunning = running && getSession(running)?.status === "running" ? running : null;
      return send(res, 200, { sessions: all, running: apiRunning, live: watch.runningId() });
    }
    if (p.startsWith("/api/sessions/")) {
      const id = decodeURIComponent(p.split("/").pop());
      const x = watch.getLive(id);
      const j = loadSaved(id) || (x && { id, title: x.title, mode: x.mode, status: x.status, events: x.events });
      return j ? send(res, 200, j) : send(res, 404, { error: "not found" });
    }
    // «الاستوديو»: the gallery wall for a session's studio/designs.json
    if (p.startsWith("/api/studio-stream/")) {
      const id = decodeURIComponent(p.split("/").pop());
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
      res.write(": connected\n\n");
      const ping = setInterval(() => res.write(": ping\n\n"), 15000);
      res.on("close", () => clearInterval(ping));
      return watch.subscribeStudio(id, res);
    }
    if (p.startsWith("/api/studio/")) {
      const id = decodeURIComponent(p.split("/").pop());
      const s = watch.getStudio(id);
      return s ? send(res, 200, s) : send(res, 404, { error: "no studio for this session" });
    }
    if (p.startsWith("/studio-file/")) {
      const [, , id, ...rest] = p.split("/");
      const f = watch.studioPath(decodeURIComponent(id || ""), rest.map(decodeURIComponent).join("/"));
      if (!f || !/\.(png|jpe?g|webp|svg|html)$/i.test(f) || !fs.existsSync(f)) return send(res, 404, "Not found", "text/plain");
      const headers = { "content-type": TYPES[path.extname(f).toLowerCase()] || (/\.jpe?g$/i.test(f) ? "image/jpeg" : "application/octet-stream"), "cache-control": "no-store" };
      if (url.searchParams.has("download")) headers["content-disposition"] = `attachment; filename="${path.basename(f)}"`;
      res.writeHead(200, headers);
      return fs.createReadStream(f).pipe(res);
    }
    if (p.startsWith("/studio-list/")) {
      const id = decodeURIComponent(p.split("/").pop());
      const s = watch.getStudio(id);
      if (!s) return send(res, 404, "Not found", "text/plain");
      return send(res, 200, studioListPage(id, s), "text/html; charset=utf-8");
    }
    // static
    const file = path.normalize(path.join(PUBLIC, p === "/" ? "index.html" : p));
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, "Not found", "text/plain");
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, "127.0.0.1", () => console.log(`المجلس (${COUNCILS.map((c) => c.key).join(", ")}) on http://localhost:${PORT} (${RUNNER === "api" ? "viewer + API runner" : "viewer: run /majlis in Claude Code"})`));
