#!/usr/bin/env node
// «الاستوديو»: turns sessions/<id>/studio/briefs.json into finished designs.
// Two layers: the VISUAL comes from an image model with no text in it (studio/visuals/*);
// the TYPE is real HTML/CSS (Arabic web fonts, right to left, one layout family per seat),
// rendered with headless Edge, Chrome or Chromium. Zero dependencies (Node 18+).
//
//   node studio.mjs doctor                       which browser renders, and where
//   node studio.mjs fetch  <session-dir>         download every brief's visual_url into studio/visuals/
//   node studio.mjs shrink <session-dir>         visuals over 300 KB -> JPEG (original kept in studio/raw/, not committed)
//   node studio.mjs render <session-dir>         render every brief not rendered yet
//   node studio.mjs render <session-dir> --ids d01,d07 --force [--png]
//
// Output stays light enough to commit (a Claude Code on the web session pushes it to GitHub):
// designs/<nn>-<seat>-<slug>.jpg (Chrome JPEG), thumbs/*.jpg, html/*.html. --png also writes a
// full-quality PNG to studio/raw/ (git-ignored). NO browser at all (a cloud VM where Chromium did
// not install): every design is still written as its HTML page (visual + real Arabic type), and the
// room's «المعرض» shows that page live in the card. Each design is appended to studio/designs.json
// the moment it lands, so the wall animates it in. Spec: ../references/studio.md
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

const FORMATS = {
  "1:1": [1080, 1080], "4:5": [1080, 1350], "9:16": [1080, 1920],
  "lp-hero": [1600, 900], "logo": [1080, 1080], "16:9": [1600, 900],
};
const MAX_BYTES = 300 * 1024; // a wall image or a committed visual

// ------------------------------------------------------------- browser
/** Chromium builds Playwright or Puppeteer left in their caches (cloud setup script). */
function cachedChromes() {
  const homes = [...new Set([os.homedir(), "/root", "/home/user", process.env.PLAYWRIGHT_BROWSERS_PATH && path.dirname(process.env.PLAYWRIGHT_BROWSERS_PATH)].filter(Boolean))];
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/ms-playwright", ...homes.flatMap((h) => [path.join(h, ".cache", "ms-playwright"), path.join(h, ".cache", "puppeteer")])].filter(Boolean);
  const out = [];
  for (const r of roots) {
    let dirs = [];
    try { dirs = fs.readdirSync(r); } catch { continue; }
    for (const d of dirs.sort().reverse()) {
      for (const rel of ["chrome-linux/chrome", "chrome-linux64/chrome", "chrome-linux/headless_shell", "chrome-headless-shell-linux64/chrome-headless-shell"]) out.push(path.join(r, d, rel));
      // puppeteer: <root>/chrome/linux-<ver>/chrome-linux64/chrome
      try { for (const v of fs.readdirSync(path.join(r, d))) for (const rel of ["chrome-linux64/chrome", "chrome-headless-shell-linux64/chrome-headless-shell"]) out.push(path.join(r, d, v, rel)); } catch { /* not a dir */ }
    }
  }
  return out;
}
export function findBrowsers() {
  if (process.env.STUDIO_BROWSER === "none") return []; // force HTML designs (testing, or no browser wanted)
  const pf = process.env["PROGRAMFILES"] || "C:\\Program Files", pf86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", local = process.env.LOCALAPPDATA || "";
  const c = [
    process.env.STUDIO_BROWSER, process.env.CHROME_PATH, process.env.PUPPETEER_EXECUTABLE_PATH,
    "/usr/local/bin/majlis-chromium", // the cloud setup script links whatever it installed here
    path.join(pf86, "Microsoft", "Edge", "Application", "msedge.exe"), path.join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(pf, "Google", "Chrome", "Application", "chrome.exe"), path.join(pf86, "Google", "Chrome", "Application", "chrome.exe"), path.join(local, "Google", "Chrome", "Application", "chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/lib/chromium/chromium", "/usr/bin/microsoft-edge", "/opt/google/chrome/chrome",
    ...cachedChromes(),
  ].filter(Boolean);
  return [...new Set(c)].filter((p) => { try { return fs.statSync(p).isFile(); } catch { return false; } });
}
export const findBrowser = () => findBrowsers()[0] || null;
// Edge sometimes exits silently (a pending update, an enterprise policy). Try each browser once,
// then stick with the first one that actually writes the file.
let working = null;
function shootAny(htmlFile, outFile, size, scale = 1) {
  const list = working ? [working, ...findBrowsers().filter((b) => b !== working)] : findBrowsers();
  let last;
  for (const b of list) { try { shoot(b, htmlFile, outFile, size, scale); working = b; return b; } catch (e) { last = e; } }
  throw last || new Error("no Edge, Chrome or Chromium found (set STUDIO_BROWSER)");
}

/** Screenshot one HTML file (Chrome writes JPEG for a .jpg name). A private profile dir lets it run while the user's own browser is open. */
function shoot(browser, htmlFile, outFile, [w, h], scale = 1) {
  // a fresh profile per run: a stuck headless process from an earlier run can lock a shared one
  const profile = `${PROFILE}-${path.basename(browser, ".exe").replace(/\W+/g, "")}`;
  const linux = process.platform === "linux";
  const args = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", "--mute-audio",
    ...(linux ? ["--no-sandbox", "--disable-dev-shm-usage"] : []),
    `--user-data-dir=${profile}`, `--force-device-scale-factor=${scale}`, `--window-size=${w},${h}`,
    "--virtual-time-budget=12000", `--screenshot=${outFile}`, pathToFileURL(htmlFile).href];
  try { fs.rmSync(outFile, { force: true }); } catch { /* ignore */ }
  const r = spawnSync(browser, args, { encoding: "utf8", timeout: 90000 });
  if (!fs.existsSync(outFile)) throw new Error(`screenshot failed (${r.status}) ${String(r.stderr || r.error || "").slice(-300)}`);
}

const PROFILE = path.join(os.tmpdir(), `majlis-studio-${process.pid}`);
process.on("exit", () => { try { for (const d of fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith(path.basename(PROFILE)))) { try { fs.rmSync(path.join(os.tmpdir(), d), { recursive: true, force: true }); } catch { /* the browser may still hold it */ } } } catch { /* ignore */ } });

// ------------------------------------------------------------- image size (no dependencies)
/** [width, height] of a PNG, JPEG or WebP, or null. */
function imageSize(file) {
  let b;
  try { b = fs.readFileSync(file); } catch { return null; }
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + len;
    }
  }
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const t = b.toString("ascii", 12, 16);
    if (t === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (t === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (t === "VP8L") { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
  }
  return null;
}

/** Re-encode one image as a JPEG at most `max` px on its long edge: Python Pillow if present, else the headless browser. */
function toJpeg(src, out, max = 1600) {
  const py = ["python3", "python"].find((p) => spawnSync(p, ["-c", "import PIL"], { encoding: "utf8" }).status === 0);
  if (py) {
    const code = "import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert('RGB')\nm=int(sys.argv[3])\nim.thumbnail((m,m))\nfor q in (84,78,70,62):\n    im.save(sys.argv[2],'JPEG',quality=q,optimize=True,progressive=True)\n    import os\n    if os.path.getsize(sys.argv[2])<=int(sys.argv[4]): break\n";
    const r = spawnSync(py, ["-c", code, src, out, String(max), String(MAX_BYTES)], { encoding: "utf8" });
    if (r.status === 0 && fs.existsSync(out)) return "pillow";
  }
  const dim = imageSize(src);
  if (!dim || !findBrowser()) return null;
  let k = Math.min(1, max / Math.max(...dim));
  const tmp = path.join(os.tmpdir(), `majlis-shrink-${process.pid}.html`);
  for (let i = 0; i < 4; i++) {
    const [w, h] = dim.map((x) => Math.max(1, Math.round(x * k)));
    fs.writeFileSync(tmp, `<!doctype html><html><body style="margin:0;background:#000"><img src="${pathToFileURL(src).href}" style="display:block;width:${w}px;height:${h}px"></body></html>`);
    try { shootAny(tmp, out, [w, h]); } catch { return null; }
    if (fs.statSync(out).size <= MAX_BYTES) break;
    k *= 0.8;
  }
  try { fs.rmSync(tmp, { force: true }); } catch { /* ignore */ }
  return "browser";
}

// ------------------------------------------------------------- red lines (text side)
// The visual side (faces, modesty, halal) is checked by the Chair by looking at each visual;
// the brief records that in `visual_check`. This catches what text can break.
const RED = [
  [/\d+\s*[%٪]|خصم\s*\d|وفّ?ر\s*\d/, "رقم خصم أو نسبة (تأكد إنه عرض حقيقي ومعتمد)"],
  [/باقي\s*\d|آخر\s*(قطعة|حبة|كمية)|الكمية\s*محدودة|لفترة\s*محدودة|ينتهي\s*(خلال|بعد)|لا\s*يفوت/, "ندرة أو استعجال مزيف"],
  [/الأفضل|الأقوى|رقم\s*(1|١|واحد)|الأول\s*في|مذهل|خرافي|أسطوري|لا\s*مثيل|حصري/, "كلمة مبالغة"],
  [/★|⭐|تقييم|عميلة?\s*قالت?|\d+\s*(طلب|عميل|مبيع)/, "تقييم أو رقم مبيعات"],
  [/يثبت\s*\d|\d+\s*ساعة|يدوم\s*\d/, "وعد ثبات بالساعات"],
  [/يوصل(ك)?\s*قبل|توصل(ك)?\s*قبل|التوصيل\s*خلال\s*\d/, "وعد موعد وصول (يحتاج تأكيد شحن مكتوب)"],
];
function redlines(b, brand) {
  const text = [b.hook_ar, b.headline_ar, b.subline_ar, b.cta_ar, ...(b.facts || []), b.price_ar].filter(Boolean).join(" ");
  const flags = RED.filter(([re]) => re.test(text)).map(([, why]) => why);
  // prices are fine when they are the store's real prices
  const prices = (text.match(/\d[\d,]*(?=\s*ر\.س)/g) || []).map((p) => p.replace(/,/g, ""));
  const known = (brand.prices || []).map(String);
  for (const p of prices) if (known.length && !known.includes(p)) flags.push(`سعر ${p} غير موجود في أسعار المتجر`);
  const vc = b.visual_check || {};
  if (vc.faces === "ai") flags.push("وجه بشري مولّد");
  if (vc.modest === false) flags.push("لقطة غير محتشمة");
  if (vc.halal === false) flags.push("عنصر غير حلال في الصورة");
  if (vc.ai_person) flags.push("يدين أو جسم مولّد: مسودة تخطيط، تتصوّر بناس حقيقيين قبل النشر");
  return { pass: flags.length === 0, flags, visual: vc };
}

// ------------------------------------------------------------- design system
const FONTS = "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Aref+Ruqaa:wght@400;700&family=Reem+Kufi:wght@400;500;600;700&family=El+Messiri:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@200;300;400;500;600&family=Tajawal:wght@200;300;400;500;700;800&family=Noto+Naskh+Arabic:wght@400;500;600&family=Lalezar&family=Readex+Pro:wght@300;400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Marcellus&display=block";
const PALETTES = {
  "noir-gold": { bg: "#0d0b09", ink: "#efe2c4", mute: "#a8987a", accent: "#c9a05a", panel: "#16120e" },
  "cream-ink": { bg: "#f3ece0", ink: "#1d1712", mute: "#6f6253", accent: "#8a5a2b", panel: "#ebe2d2" },
  "oxblood": { bg: "#3a1013", ink: "#f3e6d2", mute: "#c9ad95", accent: "#d9b06a", panel: "#2c0b0e" },
  "sand": { bg: "#e7dac4", ink: "#2a1f16", mute: "#7a6a58", accent: "#8b5a2b", panel: "#dccdb3" },
  "night": { bg: "#0e1521", ink: "#ece2cc", mute: "#9aa3b2", accent: "#cfab6a", panel: "#141d2c" },
  "paper": { bg: "#f7f5f0", ink: "#151412", mute: "#77736b", accent: "#151412", panel: "#efece5" },
  "ugc": { bg: "#ffffff", ink: "#111111", mute: "#555", accent: "#111", panel: "#fff" },
};
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// line breaks: the brief may use " / " or "\n" to set its own breaks; type is set, not wrapped by chance
const lines = (s) => esc(s).split(/\s*(?:\/|\n)\s*/).join("<br>");

function page({ w, h, pal, css, body, visual }) {
  const p = PALETTES[pal] || PALETTES["noir-gold"];
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTS}">
<style>
:root{--bg:${p.bg};--ink:${p.ink};--mute:${p.mute};--accent:${p.accent};--panel:${p.panel};--W:${w}px;--H:${h}px}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
body{position:relative;font-family:'IBM Plex Sans Arabic',sans-serif;font-feature-settings:"kern","liga","calt"}
.vis{position:absolute;background-size:cover;background-position:center;${visual ? `background-image:url('${visual}')` : "background:radial-gradient(60% 50% at 50% 42%,color-mix(in srgb,var(--accent) 55%,transparent),transparent 70%),radial-gradient(120% 80% at 50% 120%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 60%),var(--panel)"}}
.mark{font-family:'Reem Kufi',sans-serif;font-weight:600;letter-spacing:0;display:inline-flex;align-items:baseline;gap:.45em;white-space:nowrap}
.mark small{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:.5em;letter-spacing:.32em;text-transform:uppercase;opacity:.75;direction:ltr}
.num{font-family:'Readex Pro',sans-serif;font-feature-settings:"tnum";direction:ltr;unicode-bidi:isolate}
${css}
</style></head><body>${body}</body></html>`;
}

const brandMark = (brand) => `<span class="mark">${esc(brand.mark_ar || brand.name_ar)}<small>${esc(brand.mark_en || "")}</small></span>`;
const priceTag = (b) => (b.price_ar ? `<span class="price">${esc(b.price_ar).replace(/(\d[\d,]*)/g, '<span class="num">$1</span>')}</span>` : "");

// One family per seat. Each takes the brief, the brand, the visual URL and the canvas size.
const LAYOUTS = {
  // Ogilvy: picture, headline, copy. A research-led headline that sells, body copy that demonstrates.
  editorial(b, brand, v, [w, h]) {
    const tall = h / w > 1.5, imgH = tall ? 0.56 : h / w > 1.1 ? 0.6 : 0.52;
    return page({ w, h, pal: b.palette || "cream-ink", visual: v, css: `
.vis{inset:0 0 auto 0;height:${Math.round(h * imgH)}px}
.copy{position:absolute;inset:${Math.round(h * imgH)}px 0 0 0;padding:${tall ? 70 : 46}px 76px 0}
h1{font:700 ${tall ? 80 : 70}px/1.28 'Amiri',serif;color:var(--ink);margin-bottom:${tall ? 26 : 16}px}
p.sub{font:400 ${tall ? 34 : 30}px/1.75 'Noto Naskh Arabic',serif;color:var(--mute);max-width:92%}
.foot{position:absolute;left:76px;right:76px;bottom:${tall ? 80 : 44}px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid color-mix(in srgb,var(--ink) 22%,transparent);padding-top:22px;font:500 24px 'IBM Plex Sans Arabic'}
.foot .mark{font-size:30px}.price{color:var(--accent);font-weight:600}
.cap{position:absolute;top:${Math.round(h * imgH) - 52}px;right:76px;font:500 20px 'IBM Plex Sans Arabic';color:#fff;opacity:.9;text-shadow:0 1px 8px rgba(0,0,0,.5)}`,
      body: `<div class="vis"></div>${b.caption_ar ? `<div class="cap">${esc(b.caption_ar)}</div>` : ""}<div class="copy"><h1>${lines(b.headline_ar)}</h1>${b.subline_ar ? `<p class="sub">${lines(b.subline_ar)}</p>` : ""}</div><div class="foot">${brandMark(brand)}${priceTag(b)}</div>` });
  },
  // Bernbach: one disarming idea. A small picture in a big quiet field; the line does the work.
  quiet(b, brand, v, [w, h]) {
    const s = Math.round(Math.min(w, h) * (h > w * 1.4 ? 0.62 : 0.5));
    return page({ w, h, pal: b.palette || "paper", visual: v, css: `
.vis{width:${s}px;height:${s}px;left:50%;top:${Math.round(h * (h > w * 1.4 ? 0.16 : 0.1))}px;transform:translateX(-50%)}
.line{position:absolute;right:90px;left:90px;top:${Math.round(h * (h > w * 1.4 ? 0.16 : 0.1)) + s + (h > w * 1.4 ? 120 : 70)}px;font:600 ${h > w * 1.4 ? 64 : 54}px/1.35 'IBM Plex Sans Arabic';color:var(--ink);letter-spacing:-.005em}
.sub{position:absolute;right:90px;left:90px;top:auto;bottom:${h > w * 1.4 ? 170 : 110}px;font:400 26px/1.7 'IBM Plex Sans Arabic';color:var(--mute);max-width:720px}
.mk{position:absolute;left:90px;bottom:${h > w * 1.4 ? 90 : 52}px;font-size:28px;color:var(--ink)}`,
      body: `<div class="vis"></div><div class="line">${lines(b.headline_ar)}</div>${b.subline_ar ? `<div class="sub">${lines(b.subline_ar)}</div>` : ""}<div class="mk">${brandMark(brand)}</div>` });
  },
  // Schwartz: the hook meets the reader where their awareness is. Headline first, big, then proof.
  hook(b, brand, v, [w, h]) {
    const top = Math.round(h * (h > w * 1.4 ? 0.4 : 0.44));
    return page({ w, h, pal: b.palette || "oxblood", visual: v, css: `
.head{position:absolute;inset:0 0 auto 0;height:${top}px;padding:${h > w * 1.4 ? 150 : 70}px 80px 0;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:44px}
.kick{font:500 26px 'IBM Plex Sans Arabic';color:var(--accent);margin-bottom:18px}
h1{font:700 ${h > w * 1.4 ? 96 : 80}px/1.18 'Reem Kufi',sans-serif;color:var(--ink)}
.vis{inset:${top}px 44px 0 44px;border-radius:28px 28px 0 0}
.sub{position:absolute;right:80px;left:80px;bottom:${h > w * 1.4 ? 120 : 64}px;font:500 30px/1.6 'IBM Plex Sans Arabic';color:#fff;text-shadow:0 2px 18px rgba(0,0,0,.65)}
.mk{position:absolute;left:80px;top:${h > w * 1.4 ? 70 : 40}px;font-size:26px;color:var(--mute)}`,
      body: `<div class="mk">${brandMark(brand)}</div><div class="head">${b.hook_ar && b.hook_ar !== b.headline_ar ? `<div class="kick">${esc(b.hook_ar)}</div>` : ""}<h1>${lines(b.headline_ar)}</h1></div><div class="vis"></div>${b.subline_ar ? `<div class="sub">${lines(b.subline_ar)}</div>` : ""}` });
  },
  // Sutherland: the reframe. Same product, different frame; a quiet comparison does the persuading.
  reframe(b, brand, v, [w, h]) {
    const tall = h > w * 1.4;
    return page({ w, h, pal: b.palette || "sand", visual: v, css: `
.vis{${tall ? `inset:0 0 auto 0;height:${Math.round(h * 0.5)}px` : `inset:0 0 0 auto;width:${Math.round(w * 0.5)}px`}}
.side{position:absolute;${tall ? `inset:${Math.round(h * 0.5)}px 0 0 0;padding:70px 80px` : `inset:0 ${Math.round(w * 0.5)}px 0 0;padding:84px 64px`};display:flex;flex-direction:column;gap:26px}
.q{font:700 150px/0.6 'Amiri',serif;color:var(--accent);height:62px}
h1{font:600 ${tall ? 72 : 50}px/1.4 'El Messiri',sans-serif;color:var(--ink)}
.cmp{display:grid;gap:12px;margin-top:auto;border-top:1px solid color-mix(in srgb,var(--ink) 25%,transparent);padding-top:24px}
.cmp div{display:flex;justify-content:space-between;font:400 26px/1.4 'IBM Plex Sans Arabic';color:var(--mute)}
.cmp b{font-weight:600;color:var(--ink)}
.mk{font-size:26px;color:var(--ink)}`,
      body: `<div class="vis"></div><div class="side"><div class="q">«</div><h1>${lines(b.headline_ar)}</h1>${(b.facts || []).length ? `<div class="cmp">${b.facts.map((f) => { const [a, c] = String(f).split("|"); return `<div><span>${esc(a)}</span><b>${esc(c || "")}</b></div>`; }).join("")}</div>` : ""}<div class="mk">${brandMark(brand)}</div></div>` });
  },
  // Rams: less, but better. Grid, hairlines, one object, one word.
  swiss(b, brand, v, [w, h]) {
    const g = 80, tall = h > w * 1.4, s = w - g * 2;
    return page({ w, h, pal: b.palette || "paper", visual: v, css: `
body::before{content:"";position:absolute;inset:${g}px;border:1px solid color-mix(in srgb,var(--ink) 14%,transparent)}
.vis{left:${g}px;top:${g + 90}px;width:${s}px;height:${Math.round(s * (tall ? 1.05 : h > w ? 0.74 : 0.6))}px}
.top{position:absolute;top:${g + 24}px;right:${g + 24}px;left:${g + 24}px;display:flex;justify-content:space-between;font:400 22px 'IBM Plex Sans Arabic';color:var(--mute)}
h1{position:absolute;right:${g + 24}px;bottom:${g + (tall ? 190 : 110)}px;font:300 ${tall ? 92 : 74}px/1.15 'IBM Plex Sans Arabic';color:var(--ink);letter-spacing:-.01em}
.sub{position:absolute;right:${g + 24}px;bottom:${g + (tall ? 120 : 52)}px;font:400 24px 'IBM Plex Sans Arabic';color:var(--mute)}
.mk{position:absolute;left:${g + 24}px;bottom:${g + (tall ? 120 : 52)}px;font-size:22px;color:var(--ink)}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--ink);margin-inline-start:10px}`,
      body: `<div class="top"><span>${esc(b.kicker_ar || "")}</span><span class="num">${esc(b.index || "")}</span></div><div class="vis"></div><h1>${lines(b.headline_ar)}</h1>${b.subline_ar ? `<div class="sub">${lines(b.subline_ar)}${b.price_ar ? ` · ${priceTag(b)}` : ""}</div>` : ""}<div class="mk">${brandMark(brand)}</div>` });
  },
  // Jobs: hero product, one message, nothing else.
  keynote(b, brand, v, [w, h]) {
    const tall = h > w * 1.4;
    return page({ w, h, pal: b.palette || "noir-gold", visual: v, css: `
body{background:#000}
.vis{inset:${tall ? 380 : 250}px 0 ${tall ? 300 : 120}px 0;background-size:contain;background-repeat:no-repeat;background-color:#000;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 14%,#000 86%,transparent 100%),linear-gradient(90deg,transparent 0,#000 10%,#000 90%,transparent 100%);-webkit-mask-composite:source-in;mask-image:linear-gradient(180deg,transparent 0,#000 14%,#000 86%,transparent 100%),linear-gradient(90deg,transparent 0,#000 10%,#000 90%,transparent 100%);mask-composite:intersect}
h1{position:absolute;top:${tall ? 170 : 92}px;left:0;right:0;text-align:center;font:200 ${tall ? 104 : 86}px/1.1 'Tajawal',sans-serif;color:var(--ink);letter-spacing:-.01em}
.sub{position:absolute;top:${tall ? 300 : 196}px;left:0;right:0;text-align:center;font:400 30px 'Tajawal';color:var(--mute)}
.bot{position:absolute;bottom:${tall ? 120 : 50}px;left:0;right:0;text-align:center;font:400 26px 'Tajawal';color:var(--mute)}
.bot .mark{font-size:24px;color:var(--ink);display:block;margin-top:14px}.price{color:var(--ink)}`,
      body: `<div class="vis"></div><h1>${lines(b.headline_ar)}</h1>${b.subline_ar ? `<div class="sub">${lines(b.subline_ar)}</div>` : ""}<div class="bot">${priceTag(b)}${brandMark(brand)}</div>` });
  },
  // Denney: native, thumb-stopping, built for testing. Looks like a story, not an ad.
  sticker(b, brand, v, [w, h]) {
    const tall = h > w * 1.4;
    return page({ w, h, pal: "ugc", visual: v, css: `
.vis{inset:0}
.s1{position:absolute;top:${tall ? 300 : 120}px;right:70px;left:70px;display:flex;justify-content:center}
.s1 span{background:#fff;color:#111;font:700 ${tall ? 58 : 50}px/1.45 'Tajawal',sans-serif;padding:10px 26px 14px;border-radius:18px;box-decoration-break:clone;-webkit-box-decoration-break:clone;text-align:center;transform:rotate(${b.tilt ?? -2}deg);display:inline;box-shadow:0 8px 30px rgba(0,0,0,.18)}
.s2{position:absolute;bottom:${tall ? 330 : 120}px;right:70px;left:70px;text-align:center}
.s2 span{background:rgba(0,0,0,.72);color:#fff;font:500 34px/1.6 'Tajawal';padding:8px 22px 12px;border-radius:14px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.mk{position:absolute;bottom:${tall ? 230 : 46}px;left:0;right:0;text-align:center;color:#fff;font-size:24px;text-shadow:0 1px 10px rgba(0,0,0,.6)}`,
      body: `<div class="vis"></div><div class="s1"><span>${lines(b.headline_ar)}</span></div>${b.subline_ar ? `<div class="s2"><span>${lines(b.subline_ar)}</span></div>` : ""}<div class="mk">${brandMark(brand)}</div>` });
  },
  // Customer: what would make me stop and trust this. Plain facts, clearly set, nothing hidden.
  trust(b, brand, v, [w, h]) {
    const tall = h > w * 1.4, imgH = Math.round(h * (tall ? 0.5 : 0.48));
    return page({ w, h, pal: b.palette || "cream-ink", visual: v, css: `
.vis{inset:0}
.vis::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.35))}
.card{position:absolute;right:60px;left:60px;bottom:${tall ? 150 : 56}px;background:var(--bg);border-radius:28px;padding:${tall ? 64 : 46}px 56px;box-shadow:0 30px 60px -30px rgba(0,0,0,.35);display:flex;flex-direction:column}
h1{font:700 ${tall ? 66 : 52}px/1.3 'El Messiri',sans-serif;color:var(--ink);margin-bottom:${tall ? 34 : 22}px}
ul{list-style:none;display:grid;gap:${tall ? 24 : 18}px}
li{display:flex;gap:18px;align-items:baseline;font:500 ${tall ? 33 : 30}px/1.5 'IBM Plex Sans Arabic';color:var(--ink)}
li::before{content:"";flex:0 0 14px;height:14px;border-radius:50%;border:2px solid var(--accent);transform:translateY(-2px)}
.mk{margin-top:${tall ? 44 : 30}px;padding-top:22px;border-top:1px solid color-mix(in srgb,var(--ink) 14%,transparent);font-size:26px;color:var(--mute);display:flex;justify-content:space-between;align-items:center}`,
      body: `<div class="vis"></div><div class="card"><h1>${lines(b.headline_ar)}</h1><ul>${(b.facts || []).map((f) => `<li><span>${esc(f).replace(/(\d[\d,]*)/g, '<span class="num">$1</span>')}</span></li>`).join("")}</ul><div class="mk">${brandMark(brand)}${b.cta_ar ? `<span style="font:600 24px 'IBM Plex Sans Arabic';color:var(--accent)">${esc(b.cta_ar)}</span>` : ""}</div></div>` });
  },
  // A landing-page hero, desktop.
  hero(b, brand, v, [w, h]) {
    return page({ w, h, pal: b.palette || "night", visual: v, css: `
.vis{inset:0 0 0 0}
.vis::after{content:"";position:absolute;inset:0;background:linear-gradient(270deg,var(--bg) 0%,color-mix(in srgb,var(--bg) 88%,transparent) 36%,transparent 70%)}
nav{position:absolute;top:0;right:0;left:0;height:92px;display:flex;align-items:center;justify-content:space-between;padding:0 80px;border-bottom:1px solid color-mix(in srgb,var(--ink) 12%,transparent);font:400 20px 'IBM Plex Sans Arabic';color:var(--mute);z-index:2}
nav .mark{font-size:30px;color:var(--ink)} nav .links{display:flex;gap:40px}
.txt{position:absolute;right:80px;top:230px;width:640px;z-index:2}
.kick{font:500 22px 'IBM Plex Sans Arabic';color:var(--accent);margin-bottom:20px}
h1{font:700 76px/1.22 'El Messiri',sans-serif;color:var(--ink);margin-bottom:24px}
p{font:400 27px/1.7 'IBM Plex Sans Arabic';color:var(--mute);margin-bottom:40px}
.cta{display:inline-flex;gap:24px;align-items:center}
.btn{background:var(--accent);color:var(--bg);font:600 24px 'IBM Plex Sans Arabic';padding:18px 40px;border-radius:999px}
.price{font:500 24px 'IBM Plex Sans Arabic';color:var(--ink)}`,
      body: `<div class="vis"></div><nav>${brandMark(brand)}<div class="links"><span>العود</span><span>العطور</span><span>الهدايا</span><span>قصتنا</span></div></nav><div class="txt">${b.hook_ar ? `<div class="kick">${esc(b.hook_ar)}</div>` : ""}<h1>${lines(b.headline_ar)}</h1>${b.subline_ar ? `<p>${lines(b.subline_ar)}</p>` : ""}<div class="cta"><span class="btn">${esc(b.cta_ar || "تسوّق الهدايا")}</span>${priceTag(b)}</div></div>` });
  },

  // ---------------- identity (Chris Do): marks are type, built in code, so they stay sharp and editable
  "logo-wordmark"(b, brand, v, [w, h]) {
    return page({ w, h, pal: b.palette || "cream-ink", css: `
.c{position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:34px;text-align:center}
.ar{font:700 200px/1 'Aref Ruqaa',serif;color:var(--ink)}
.rule{width:420px;height:1px;background:var(--accent);position:relative}.rule::after{content:"";position:absolute;left:50%;top:-6px;width:12px;height:12px;background:var(--accent);transform:translateX(-50%) rotate(45deg)}
.en{font:500 34px 'Cormorant Garamond',serif;letter-spacing:.5em;color:var(--ink);direction:ltr;padding-left:.5em}
.sub{font:400 24px 'IBM Plex Sans Arabic';color:var(--mute);letter-spacing:.2em}
.note{position:absolute;bottom:50px;right:60px;left:60px;display:flex;justify-content:space-between;font:400 20px 'IBM Plex Sans Arabic';color:var(--mute)}`,
      body: `<div class="c"><div class="ar">${esc(brand.mark_ar)}</div><div class="rule"></div><div class="en">${esc(brand.mark_en)}</div><div class="sub">للعطور والعود</div></div><div class="note"><span>${esc(b.headline_ar)}</span><span>Aref Ruqaa · Cormorant</span></div>` });
  },
  "logo-monogram"(b, brand, v, [w, h]) {
    return page({ w, h, pal: b.palette || "noir-gold", css: `
.c{position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:56px}
svg{width:440px;height:520px}
.ar{font:600 64px 'Reem Kufi';color:var(--ink);text-align:center}
.en{font:500 26px 'Marcellus',serif;letter-spacing:.42em;color:var(--mute);direction:ltr;text-align:center;margin-top:-30px}
.note{position:absolute;bottom:50px;right:60px;font:400 20px 'IBM Plex Sans Arabic';color:var(--mute)}`,
      body: `<div class="c"><svg viewBox="0 0 440 520"><path d="M30 510V220A190 190 0 0 1 410 220V510" fill="none" stroke="${PALETTES[b.palette || "noir-gold"].accent}" stroke-width="6"/><path d="M62 510V226A158 158 0 0 1 378 226V510" fill="none" stroke="${PALETTES[b.palette || "noir-gold"].accent}" stroke-width="1.5" opacity=".6"/><text x="220" y="380" text-anchor="middle" font-family="Aref Ruqaa" font-weight="700" font-size="250" fill="${PALETTES[b.palette || "noir-gold"].ink}">م</text><path d="M220 150c-18 22 14 34 0 58s16 30 2 52" fill="none" stroke="${PALETTES[b.palette || "noir-gold"].accent}" stroke-width="4" stroke-linecap="round"/></svg><div class="ar">${esc(brand.mark_ar)}</div><div class="en">${esc(brand.mark_en)}</div></div><div class="note">${esc(b.headline_ar)}</div>` });
  },
  "logo-kufi"(b, brand, v, [w, h]) {
    return page({ w, h, pal: b.palette || "oxblood", css: `
.c{position:absolute;inset:0;display:grid;place-items:center}
.seal{width:640px;height:640px;border:3px solid var(--accent);display:grid;place-items:center;position:relative}
.seal::before{content:"";position:absolute;inset:18px;border:1px solid color-mix(in srgb,var(--accent) 60%,transparent)}
.stack{text-align:center;font:700 150px/1.05 'Reem Kufi';color:var(--ink)}
.stack span{display:block}.stack .s2{font-size:84px;color:var(--accent);font-weight:500;margin-top:16px}
.corner{position:absolute;width:30px;height:30px;background:var(--accent);transform:rotate(45deg)}
.note{position:absolute;bottom:50px;right:60px;font:400 20px 'IBM Plex Sans Arabic';color:var(--mute)}`,
      body: `<div class="c"><div class="seal"><span class="corner" style="top:-16px;left:50%;margin-left:-15px"></span><span class="corner" style="bottom:-16px;left:50%;margin-left:-15px"></span><div class="stack"><span>دار</span><span>المثال</span><span class="s2">للعطور</span></div></div></div><div class="note">${esc(b.headline_ar)}</div>` });
  },
  "logo-latin"(b, brand, v, [w, h]) {
    return page({ w, h, pal: b.palette || "sand", css: `
.c{position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:22px;text-align:center}
.en{font:500 168px/1 'Cormorant Garamond',serif;letter-spacing:.06em;color:var(--ink);direction:ltr}
.en i{font-style:italic;font-weight:400;font-size:.42em;letter-spacing:.1em;display:block;color:var(--accent);margin-bottom:6px}
.ar{font:500 46px 'El Messiri';color:var(--ink)}
.est{font:400 22px 'Cormorant Garamond';letter-spacing:.4em;color:var(--mute);direction:ltr}
.note{position:absolute;bottom:50px;right:60px;font:400 20px 'IBM Plex Sans Arabic';color:var(--mute)}`,
      body: `<div class="c"><div class="en"><i>Dar al</i>MITHAL</div><div class="ar">${esc(brand.name_ar)}</div><div class="est">OUD · PARFUMS</div></div><div class="note">${esc(b.headline_ar)}</div>` });
  },
  "logo-symbol"(b, brand, v, [w, h]) {
    return page({ w, h, pal: b.palette || "noir-gold", visual: v, css: `
.vis{left:0;right:0;top:0;height:${Math.round(h * 0.7)}px}
.vis::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,var(--bg))}
.lock{position:absolute;left:0;right:0;bottom:120px;display:flex;justify-content:center;align-items:center;gap:36px}
.lock .bar{width:1px;height:90px;background:var(--accent)}
.ar{font:700 84px 'Aref Ruqaa';color:var(--ink)}
.en{font:500 28px/1.5 'Marcellus';letter-spacing:.34em;color:var(--mute);direction:ltr;text-align:left}
.note{position:absolute;bottom:44px;right:60px;font:400 20px 'IBM Plex Sans Arabic';color:var(--mute)}`,
      body: `<div class="vis"></div><div class="lock"><div class="ar">${esc(brand.mark_ar)}</div><span class="bar"></span><div class="en">DAR AL<br>MITHAL</div></div><div class="note">${esc(b.headline_ar)}</div>` });
  },
  "logo-system"(b, brand, v, [w, h]) {
    const sw = ["#0d0b09", "#c9a05a", "#3a1013", "#efe2c4", "#7a4e2d"];
    return page({ w, h, pal: b.palette || "cream-ink", visual: v, css: `
.grid{position:absolute;inset:60px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1.15fr 1fr .5fr;gap:20px}
.cell{border-radius:18px;overflow:hidden;position:relative;background:var(--panel)}
.a{grid-column:1/3;background:#0d0b09;display:grid;place-items:center;gap:8px;align-content:center}
.a .ar{font:700 150px/1 'Aref Ruqaa';color:#efe2c4}.a .en{font:500 26px 'Cormorant Garamond';letter-spacing:.5em;color:#c9a05a;direction:ltr}
.b .vis{inset:0}
.c2{display:grid;place-items:center;align-content:center;gap:10px;padding:26px;text-align:center}
.c2 .t1{font:700 54px/1.2 'El Messiri';color:var(--ink)}.c2 .t2{font:400 24px/1.6 'IBM Plex Sans Arabic';color:var(--mute)}
.c2 .t3{font:500 18px 'IBM Plex Sans Arabic';color:var(--accent);letter-spacing:.08em}
.sw{grid-column:1/3;display:flex;gap:12px;background:none}
.sw i{flex:1;border-radius:14px;position:relative}.sw i b{position:absolute;bottom:8px;right:12px;font:500 15px 'Readex Pro';color:#fff;mix-blend-mode:difference;direction:ltr}`,
      body: `<div class="grid"><div class="cell a"><div class="ar">${esc(brand.mark_ar)}</div><div class="en">${esc(brand.mark_en)}</div></div><div class="cell b"><div class="vis"></div></div><div class="cell c2"><div class="t1">ريحة تنعاد</div><div class="t2">الخط: El Messiri للعناوين<br>IBM Plex Sans Arabic للنص</div><div class="t3">${esc(b.headline_ar)}</div></div><div class="cell sw">${sw.map((c) => `<i style="background:${c}"><b>${c}</b></i>`).join("")}</div></div>` });
  },
};

// ------------------------------------------------------------- run
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return d; } };
function writeJsonAtomic(p, obj) { const t = p + ".tmp"; fs.writeFileSync(t, JSON.stringify(obj, null, 2)); fs.renameSync(t, p); }
const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "design";
const rel = (from, to) => path.relative(from, to).split(path.sep).map(encodeURIComponent).join("/");

/** Download each brief's visual_url (an image connector's result link) into studio/visuals/. */
async function fetchVisuals(sessionDir) {
  const studio = path.join(sessionDir, "studio");
  const bp = path.join(studio, "briefs.json");
  const spec = readJson(bp);
  if (!spec) throw new Error(`no ${bp}`);
  fs.mkdirSync(path.join(studio, "visuals"), { recursive: true });
  const done = new Map();
  let n = 0;
  for (const b of spec.briefs || []) {
    if (!/^https?:\/\//.test(b.visual_url || "") || (b.visual_file && fs.existsSync(path.join(studio, b.visual_file)))) continue;
    if (done.has(b.visual_url)) { b.visual_file = done.get(b.visual_url); continue; }
    try {
      const r = await fetch(b.visual_url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      const ext = buf[0] === 0x89 ? "png" : buf[0] === 0xff ? "jpg" : buf.toString("ascii", 8, 12) === "WEBP" ? "webp" : "png";
      const f = `visuals/v${String(++n).padStart(2, "0")}-${slugify(b.slug || b.angle || b.id)}.${ext}`;
      fs.writeFileSync(path.join(studio, f), buf);
      b.visual_file = f;
      done.set(b.visual_url, f);
      console.log(`OK   ${f}`);
    } catch (e) {
      console.log(`FAIL ${b.id}: ${e.message} (${new URL(b.visual_url).host}: the cloud network may block this host; add it under Custom network access, or the design keeps the remote link)`);
    }
  }
  writeJsonAtomic(bp, spec);
}

/** Visuals over 300 KB become a JPEG (max 1600 px); the original moves to studio/raw/ (git-ignored). Updates briefs.json and designs.json. */
function shrinkVisuals(sessionDir) {
  const studio = path.join(sessionDir, "studio");
  const vdir = path.join(studio, "visuals");
  if (!fs.existsSync(vdir)) return 0;
  const renames = {};
  for (const f of fs.readdirSync(vdir)) {
    const src = path.join(vdir, f);
    if (!/\.(png|jpe?g|webp)$/i.test(f) || fs.statSync(src).size <= MAX_BYTES) continue;
    const raw = path.join(studio, "raw", "visuals", f);
    fs.mkdirSync(path.dirname(raw), { recursive: true });
    fs.renameSync(src, raw);
    const outName = f.replace(/\.(png|jpe?g|webp)$/i, ".jpg");
    const how = toJpeg(raw, path.join(vdir, outName));
    if (!how) { fs.renameSync(raw, src); console.log(`keep ${f}: no Pillow and no browser to shrink it`); continue; }
    renames[`visuals/${f}`] = `visuals/${outName}`;
    console.log(`shrink visuals/${f} -> visuals/${outName} (${(fs.statSync(path.join(vdir, outName)).size / 1024).toFixed(0)} KB, ${how})`);
  }
  if (Object.keys(renames).length) {
    for (const name of ["briefs.json", "designs.json"]) {
      const p = path.join(studio, name);
      const j = readJson(p);
      if (!j) continue;
      for (const b of j.briefs || j.designs || []) if (renames[b.visual_file]) b.visual_file = renames[b.visual_file];
      writeJsonAtomic(p, j);
    }
  }
  return Object.keys(renames).length;
}

function render(sessionDir, { ids, force, png }) {
  const studio = path.join(sessionDir, "studio");
  if (!readJson(path.join(studio, "briefs.json"))) throw new Error(`no ${path.join(studio, "briefs.json")}`);
  const browser = findBrowser();
  if (browser) shrinkVisuals(sessionDir); // keep committed visuals light before the HTML points at them
  else console.log("no Edge/Chrome/Chromium: designs are written as HTML pages; the room shows them live (set STUDIO_BROWSER, or run .claude/setup-cloud.sh)");
  const spec = readJson(path.join(studio, "briefs.json"));
  const brand = spec.brand || {};
  for (const d of ["designs", "html", "thumbs"]) fs.mkdirSync(path.join(studio, d), { recursive: true });
  const dpath = path.join(studio, "designs.json");
  const out = readJson(dpath, null) || { session: path.basename(sessionDir), designs: [] };
  out.brand = brand.name_ar || out.brand;
  out.image_tool = spec.image_tool || out.image_tool || "";
  let n = 0;
  for (const b of spec.briefs || []) {
    if (ids && !ids.includes(b.id)) continue;
    const have = out.designs.find((d) => d.id === b.id);
    if (have && have.status === "ready" && !force && !(browser && /\.html$/.test(have.file))) continue;
    const fmt = FORMATS[b.format] || FORMATS["4:5"];
    const layout = LAYOUTS[b.layout];
    if (!layout) { console.error(`${b.id}: unknown layout ${b.layout}`); continue; }
    const nn = String(b.id).replace(/\D/g, "").padStart(2, "0");
    const base = `${nn}-${b.seat}-${slugify(b.slug || b.angle)}`;
    const hf = path.join(studio, "html", `${base}.html`);
    // the visual is linked RELATIVE to the HTML file, so the page renders the same on this disk,
    // in the room, on GitHub Pages and inside a downloaded session folder
    const vf = b.visual_file ? path.join(studio, b.visual_file) : null;
    const visual = vf && fs.existsSync(vf) ? rel(path.dirname(hf), vf) : /^https?:\/\//.test(b.visual_url || "") ? b.visual_url : null;
    fs.writeFileSync(hf, layout(b, brand, visual, fmt));
    let file = `html/${base}.html`, thumb = "";
    if (browser) {
      try {
        shootAny(hf, path.join(studio, "designs", `${base}.jpg`), fmt);
        file = `designs/${base}.jpg`;
        if (png) { fs.mkdirSync(path.join(studio, "raw", "designs"), { recursive: true }); try { shootAny(hf, path.join(studio, "raw", "designs", `${base}.png`), fmt); } catch { /* the JPEG is enough */ } }
        try { shootAny(hf, path.join(studio, "thumbs", `${base}.jpg`), fmt, 0.36); thumb = `thumbs/${base}.jpg`; } catch { /* the wall falls back to the full image */ }
      } catch (e) { console.error(`${b.id}: ${e.message} (kept as HTML)`); }
    }
    const rl = redlines(b, brand);
    const rec = {
      id: b.id, seat: b.seat, angle: b.angle, awareness: b.awareness || "", hook_ar: b.hook_ar || "", headline_ar: b.headline_ar || "",
      subline_ar: b.subline_ar || "", format: b.format, kind: b.kind || (String(b.layout).startsWith("logo") ? "logo" : "ad"), layout: b.layout,
      file, thumb, html: `html/${base}.html`, visual_file: b.visual_file || "", prompt: b.visual_prompt_en || "",
      rationale_ar: b.rationale_ar || "", status: rl.pass ? "ready" : "flagged", redlines: rl, width: fmt[0], height: fmt[1], created: new Date().toISOString(),
      visual_mode: visual ? "image" : "css", render: file.endsWith(".html") ? "html" : "image",
    };
    if (have) Object.assign(have, rec); else out.designs.push(rec);
    writeJsonAtomic(dpath, out); // append as each lands: the room animates it in
    n++;
    console.log(`${rec.status === "ready" ? "OK " : "FLAG"} ${rec.file}${rl.flags.length ? "  " + rl.flags.join("، ") : ""}`);
  }
  console.log(`${n} rendered · ${out.designs.length} in designs.json${working ? ` · ${path.basename(working)}` : " · HTML only"}`);
}

// CLI (skipped when another script imports findBrowser from here)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, dir, ...rest] = process.argv.slice(2);
  const flag = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
  try {
    if (cmd === "doctor") {
      const b = findBrowser();
      console.log(b ? `browser: ${b}` : "no Edge/Chrome/Chromium found: designs will be HTML pages (set STUDIO_BROWSER, or run .claude/setup-cloud.sh in a cloud session)");
      process.exit(b ? 0 : 1);
    } else if (cmd === "render" && dir) render(path.resolve(dir), { ids: flag("--ids")?.split(","), force: rest.includes("--force"), png: rest.includes("--png") });
    else if (cmd === "shrink" && dir) console.log(`${shrinkVisuals(path.resolve(dir))} visuals shrunk`);
    else if (cmd === "fetch" && dir) await fetchVisuals(path.resolve(dir));
    else { console.log("usage: node studio.mjs doctor | fetch <session-dir> | shrink <session-dir> | render <session-dir> [--ids a,b] [--force] [--png]"); process.exit(2); }
  } catch (e) { console.error(e.message); process.exit(1); }
}
