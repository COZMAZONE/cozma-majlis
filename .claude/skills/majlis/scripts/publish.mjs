#!/usr/bin/env node
// Keeps the room watchable without a server. Run it after every file the Chair writes.
//
//   node .claude/skills/majlis/scripts/publish.mjs env
//       runtime (web | local), the studio browser, the git branch, and the GitHub Pages link
//   node .claude/skills/majlis/scripts/publish.mjs sessions/<id> [--replay] [--push "message"]
//       rewrites sessions/index.json, sessions/<id>/room.json and app/public/seats.json
//       (the static room reads these), optionally sessions/<id>/replay.html, and with --push
//       commits the session folder and pushes the current branch (web mode).
//   node .claude/skills/majlis/scripts/publish.mjs --all [--replay]
//
// Never fails the council: a git or network problem is printed and the exit code stays 0.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const git = (...a) => { const r = spawnSync("git", a, { cwd: REPO, encoding: "utf8", timeout: 120000 }); return { ok: r.status === 0, out: String(r.stdout || "").trim(), err: String(r.stderr || r.error || "").trim() }; };

/** web = Claude Code on the web (cloud VM; nobody can open its localhost). */
export function runtime() {
  if (process.env.CLAUDE_CODE_REMOTE === "true") return "web";
  try { const m = fs.readFileSync(path.join(REPO, "business.md"), "utf8").match(/^\s*[-*]?\s*runtime\s*:\s*(web|local)\b/im); if (m) return m[1].toLowerCase(); } catch { /* no profile yet */ }
  return "local";
}

/** https://<owner>.github.io/<repo>/ from the origin remote (any URL ending in /<owner>/<repo>), or a pages_url: line in business.md. */
export function pagesUrl() {
  try { const m = fs.readFileSync(path.join(REPO, "business.md"), "utf8").match(/^\s*[-*]?\s*pages_url\s*:\s*(https?:\/\/\S+)/im); if (m) return m[1].replace(/\/?$/, "/"); } catch { /* none */ }
  const u = git("remote", "get-url", "origin").out;
  const m = u.match(/[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  return m ? `https://${m[1].toLowerCase()}.github.io/${m[2]}/` : "";
}

function repoSlug() {
  const m = git("remote", "get-url", "origin").out.match(/[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  return m ? `${m[1]}/${m[2]}` : "";
}

function push(id, message) {
  const paths = ["sessions/index.json", "app/public/seats.json", ...(id ? [`sessions/${id}`] : [])].filter((p) => fs.existsSync(path.join(REPO, p)));
  const add = git("add", "-A", "--", ...paths);
  if (!add.ok) return console.log(`git add: ${add.err.slice(-300)}`);
  if (git("diff", "--cached", "--quiet").ok) return console.log("git: nothing new to commit");
  const c = git("commit", "-m", message || `المجلس: ${id || "تحديث"}`);
  if (!c.ok) return console.log(`git commit failed: ${c.err.slice(-300)}`);
  const branch = git("rev-parse", "--abbrev-ref", "HEAD").out;
  for (let i = 0; i < 3; i++) {
    const p = git("push", "-u", "origin", "HEAD");
    if (p.ok) return console.log(`pushed: ${branch}`);
    console.log(`git push (try ${i + 1}): ${p.err.slice(-300)}`);
    spawnSync(process.execPath, ["-e", "setTimeout(()=>{},4000)"]);
  }
}

const args = process.argv.slice(2);
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };

if (args[0] === "env") {
  const branch = git("rev-parse", "--abbrev-ref", "HEAD").out || "-";
  const st = await import(pathToFileURL(path.join(REPO, ".claude", "skills", "majlis", "scripts", "studio.mjs")).href).catch(() => null);
  const browser = st?.findBrowser?.() || "";
  console.log(`runtime: ${runtime()}`);
  console.log(`branch: ${branch}`);
  console.log(`repo: ${repoSlug() || "-"}`);
  console.log(`pages: ${pagesUrl() || "-"}`);
  console.log(`studio browser: ${browser || "none (designs stay as HTML)"}`);
  process.exit(0);
}

const all = args.includes("--all");
const target = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--push");
const id = target ? path.basename(path.resolve(target)) : "";
if (!all && !id) { console.log('usage: node publish.mjs env | sessions/<id> [--replay] [--push "message"] | --all [--replay]'); process.exit(2); }

try {
  const st = await import(pathToFileURL(path.join(REPO, "app", "lib", "static.mjs")).href);
  const r = st.writeStatic(all ? "" : id);
  console.log(`static: sessions/index.json (${r.index.sessions.length} sessions) · room.json for ${r.written.join(", ") || "none"}`);
  if (args.includes("--replay")) {
    const { exportReplay } = await import(pathToFileURL(path.join(REPO, ".claude", "skills", "majlis", "scripts", "export-replay.mjs")).href);
    for (const sid of r.written) { try { const x = await exportReplay(sid); console.log(`replay: sessions/${sid}/replay.html (${(x.bytes / 1024).toFixed(0)} KB)`); } catch (e) { console.log(`replay ${sid}: ${e.message}`); } }
  }
} catch (e) { console.log(`static build failed: ${e.message}`); }

if (args.includes("--push")) push(id, flag("--push"));
const pu = pagesUrl();
if (id && pu) console.log(`viewer: ${pu}#session=${id}`);
const slug = repoSlug(), br = git("rev-parse", "--abbrev-ref", "HEAD").out;
if (id && slug && br && fs.existsSync(path.join(REPO, "sessions", id, "replay.html"))) console.log(`replay on GitHub: https://github.com/${slug}/blob/${br}/sessions/${id}/replay.html (Download raw file, keep it in its folder for the studio images)`);
if (id && br && br !== "main" && br !== "master" && runtime() === "web") console.log(`note: this session is on branch ${br}; GitHub Pages (main) shows it after the branch is merged`);
process.exit(0); // the watcher's timers would keep node alive
