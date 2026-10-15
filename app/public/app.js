// «المجلس» (three councils: business, creative, marketing): the room plays a council around a table, in Arabic, right to left.
// The verdict exports as an Arabic PDF through the browser's own print dialog (see printReport).

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const CMD = "/majlis";
const SIM_NOTE = "مقاعد محاكاة مبنية من أعمال كل شخص المنشورة. ليسوا هم، ولا يتكلمون باسمهم، ولا علاقة لهم بهذا المنتج.";
// sample decisions (fictional, for illustration only)
const SAMPLES = [
  ["نرفع السعر؟", "منتجنا الأكثر مبيعًا بـ 290 ريال. تكلفة الإعلان زادت والهامش انضغط. أفكر أرفعه إلى 340، أو أخلي السعر وأضيف علبة هدية بسعر أعلى، أو أخلي كل شي مثل ما هو. نصف العملاء يدفعون بالتقسيط. أميل للرفع."],
  ["قناة إعلان جديدة؟", "أغلب ميزانية الإعلان رايحة على سناب. هل نجرّب تيك توك بميزانية تجريبية لمدة شهر، أو نزيد على سناب اللي شغال، أو نحوّل جزء للمؤثرين؟ أميل لتيك توك لأن جمهورنا هناك."],
  ["أوظّف أو أستعين بشركة؟", "الطلبات زادت والرد على الواتساب متأخر. هل أوظّف موظف خدمة عملاء بدوام كامل، أو أستعين بشركة خارجية، أو أكمل أرد بنفسي لين بعد الموسم؟ أميل للتوظيف."],
  ["منتج ثاني؟", "هل نطلق منتج ثاني قريب من منتجنا الحالي، أو نركّز كل الجهد على المنتج الحالي وعروض الكميات؟ الفريق صغير والمخزون يحتاج تمويل مقدّم."],
];

const EXAMPLE = "منتجنا الأكثر مبيعًا بـ 290 ريال. أفكر أرفعه إلى 340، أو أضيف علبة هدية بسعر أعلى، أو أخلي كل شي مثل ما هو. نصف العملاء يدفعون بالتقسيط، والإعلان صار أغلى. النجاح عندي: نفس عدد الطلبات بهامش أعلى خلال شهرين. أميل للرفع.";

// the how-to, shown in the side panel while the room is empty and in «كيف يشتغل؟»
const GUIDE = `
  <div class="guide">
    <div class="guide-sec">
      <h4>كيف تستخدم المجلس</h4>
      <ol>
        <li><span>افتح Claude Code في مجلد المشروع.</span></li>
        <li><span>اكتب <code dir="ltr">${CMD}</code> ومعه قرارك، أو حدّد المجلس: <code dir="ltr">${CMD} creative</code> أو <code dir="ltr">${CMD} marketing</code>.</span></li>
        <li><span>جاوب على أسئلة رئيس المجلس، وبعدها تابع النقاش هنا مباشرة.</span></li>
        <li><span>لما ينزل الحكم، حمّله PDF بالعربي.</span></li>
      </ol>
    </div>
    <div class="guide-sec">
      <h4>وش تكتب في سؤالك</h4>
      <ul>
        <li><span><b>القرار</b> في سطر واحد.</span></li>
        <li><span><b>خياراتك.</b> اثنين أو ثلاثة. «نكمّل زي ما إحنا» يُحسب خيار.</span></li>
        <li><span><b>أرقامك.</b> المبيعات، الكاش، تكلفة الإعلان، وحجم الفريق.</span></li>
        <li><span><b>حدودك.</b> الموعد، الوقت، والميزانية.</span></li>
        <li><span><b>شكل النجاح</b>، ومتى.</span></li>
        <li><span><b>وين تميل</b> ولماذا. المجلس يختبر ميلك بدل ما يوافقك عليه.</span></li>
      </ul>
      <p class="note" style="margin-top:8px">نسيت شي؟ رئيس المجلس يسألك قبل ما تبدأ الجلسة.</p>
    </div>
    <div class="guide-sec">
      <h4>مثال</h4>
      <div class="example">
        <p><code dir="ltr">${CMD}</code> ${esc(EXAMPLE)}</p>
        <button class="ghost" type="button" data-copy-example>انسخ المثال</button>
      </div>
    </div>
    <div class="guide-sec">
      <h4>معلومة تهمّك</h4>
      <ul>
        <li><span><b>المجلس الكامل:</b> كل مقاعد المجلس (٨ أو ٩) و٣ جولات. للقرارات الكبيرة اللي صعب الرجوع عنها.</span></li>
        <li><span><b>مجلس الكريتيف:</b> الصق النص، وصف الصور أو أرفقها، والرئيس يطبّق خطوطك الحمراء من <code dir="ltr">business.md</code> على كل فكرة.</span></li>
        <li><span><b>السريع:</b> أضف <code dir="ltr">--quick</code> لأربعة مقاعد وجولتين. يستهلك أقل بكثير.</span></li>
        <li><span><b>صوت العميل</b> جالس في كل مجلس، مبني من تقييمات عملاء متجرك نفسه: هل بيصدّق ويشتري ويرجع يشتري؟</span></li>
        <li><span><b>أول مرة؟</b> اكتب <code dir="ltr">${CMD} setup</code>. رئيس المجلس يسألك عن متجرك في ٣ دفعات أسئلة، ويبني ملف متجرك ومقعد العميل.</span></li>
        <li><span><b>كل المقاعد محاكاة.</b> ${SIM_NOTE}</span></li>
        <li><span><b>كل جلسة محفوظة.</b> افتح «الجلسات السابقة» لإعادة أي جلسة أو تحميل حكمها PDF.</span></li>
      </ul>
    </div>
  </div>`;

const SHAPES = ["base", "open", "mid", "blink"];
// The server says which portrait files exist (s.portraits: {base, open, mid, blink}, or null).
// A seat with no portrait yet gets an initials avatar drawn here, with its own talking states,
// so a new seat never shows a broken image.
const portrait = (key, shape = "base") => state.byKey[key]?.portraits?.[shape] || initialsAvatar(state.byKey[key] || { key, initials: String(key || "?").slice(0, 2).toUpperCase() }, shape);
const avCache = new Map();
function shade(hex, f) {
  const h = String(hex || "#9aa7bd").replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) || 150);
  const m = c.map((v) => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)));
  return "#" + m.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}
/** An elegant initials medallion in the seat colour, as an SVG data URI (works in <img>, the PDF, everywhere). */
function initialsAvatar(s, shape = "base") {
  const id = `${s.key}|${s.color}|${s.initials}|${shape}`;
  if (avCache.has(id)) return avCache.get(id);
  const col = s.color || "#9aa7bd";
  const ini = esc(String(s.initials || "?").slice(0, 3));
  const ring = { open: [152, 0.55, 12], mid: [144, 0.32, 8], base: [0, 0, 0], blink: [0, 0, 0] }[shape] || [0, 0, 0];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 560"><defs>
<radialGradient id="g" cx="0.38" cy="0.3" r="0.85"><stop offset="0" stop-color="${shade(col, 0.42)}"/><stop offset="0.55" stop-color="${col}"/><stop offset="1" stop-color="${shade(col, -0.55)}"/></radialGradient>
<radialGradient id="h" cx="0.35" cy="0.22" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="sh" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="280" cy="388" rx="120" ry="24" fill="url(#sh)"/>
${ring[0] ? `<circle cx="280" cy="236" r="${ring[0]}" fill="none" stroke="${shade(col, 0.25)}" stroke-opacity="${ring[1]}" stroke-width="${ring[2]}"/>` : ""}
<circle cx="280" cy="236" r="128" fill="url(#g)"/>
<circle cx="280" cy="236" r="128" fill="url(#h)"/>
<circle cx="280" cy="236" r="115" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>
<text x="280" y="236" dy="0.35em" text-anchor="middle" font-family="Tajawal, Cairo, 'Segoe UI', Helvetica, Arial, sans-serif" font-weight="700" font-size="${ini.length > 2 ? 74 : 92}" letter-spacing="3" fill="#fff" fill-opacity="${shape === "blink" ? 0.86 : 0.96}">${ini}</text>
</svg>`;
  const uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  avCache.set(id, uri);
  return uri;
}
// ------------------------------------------------------------- data: server, static site, or inline replay
// "server": node app/server.mjs (live events over SSE). "static": no server (GitHub Pages or any plain
// static host); reads sessions/index.json and sessions/<id>/room.json written by publish.mjs and polls
// every 20 s. "inline": replay.html, every byte inlined (window.MAJLIS_STATIC), no fetch at all.
const INLINE = window.MAJLIS_STATIC || null;
const DATA = { mode: INLINE ? "inline" : "server", base: (document.querySelector('meta[name="majlis-sessions"]')?.content || "../../sessions/").replace(/\/?$/, "/") };
const POLL_MS = 20000;
const LIVE_MS = 30 * 60 * 1000; // on a static site a running session counts as live only if written in the last 30 minutes
const getJson = async (u) => { const r = await fetch(u, { cache: "no-store" }); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };
const sUrl = (id, f) => `${DATA.base}${id ? encodeURIComponent(id) + "/" : ""}${f}`;
const api = {
  async seats() {
    if (INLINE) return INLINE.seats;
    try { const r = await getJson("api/seats"); DATA.mode = "server"; return r; }
    catch { DATA.mode = "static"; return getJson("seats.json"); }
  },
  async sessions() {
    if (INLINE) return { sessions: INLINE.index || [], running: null, live: null };
    if (DATA.mode === "server") return getJson("api/sessions");
    const j = await getJson(sUrl("", "index.json")).catch(() => ({ sessions: [] }));
    const fresh = (j.sessions || []).filter((x) => x.status === "running" && Date.now() - (x.updated || 0) < LIVE_MS);
    return { sessions: j.sessions || [], running: null, live: fresh[0]?.id || null };
  },
  async session(id) {
    if (INLINE) return INLINE.rooms?.[id] || null;
    if (DATA.mode === "server") return getJson(`api/sessions/${encodeURIComponent(id)}`);
    return getJson(sUrl(id, "room.json"));
  },
  /** Studio wall records with url/thumb_url resolved for a static site. */
  async studio(id) {
    if (INLINE) return INLINE.studio?.[id] || null;
    const j = await getJson(sUrl(id, "studio/designs.json")).catch(() => null);
    if (!j) return null;
    const v = (d) => Date.parse(d.created || "") || 0;
    const link = (f) => sUrl(id, "studio/" + String(f).replace(/\\/g, "/").replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/"));
    const designs = (j.designs || []).filter((d) => d && d.id && d.file).map((d) => ({ ...d, url: `${link(d.file)}?v=${v(d)}`, thumb_url: `${link(d.thumb || d.file)}?v=${v(d)}` }));
    return { brand: j.brand || "", image_tool: j.image_tool || "", designs };
  },
};
/** Live events for one session: SSE on the server, polling room.json on a static site. Returns a closer. */
function subscribeSession(id, onEvent) {
  if (DATA.mode === "server") {
    const es = new EventSource(`api/stream/${encodeURIComponent(id)}`);
    es.onmessage = (m) => { const ev = JSON.parse(m.data); if (ev.type === "end") es.close(); onEvent(ev); };
    es.onerror = () => { /* the browser retries; the server replays from the start */ };
    return () => es.close();
  }
  let sent = 0, stop = false, timer;
  const tick = async () => {
    const j = await api.session(id).catch(() => null);
    if (stop) return;
    if (j) {
      for (const ev of (j.events || []).slice(sent)) onEvent(ev);
      sent = Math.max(sent, (j.events || []).length);
      if (j.status !== "running") { onEvent({ type: "end" }); return; }
    }
    if (DATA.mode === "static") timer = setTimeout(tick, POLL_MS);
  };
  tick();
  return () => { stop = true; clearTimeout(timer); };
}
/** The studio wall for one session: SSE on the server, polling designs.json on a static site. */
function subscribeStudio(id, onEvent) {
  if (DATA.mode === "server") {
    const es = new EventSource(`api/studio-stream/${encodeURIComponent(id)}`);
    es.onmessage = (m) => onEvent(JSON.parse(m.data));
    return () => es.close();
  }
  const seen = new Map();
  const sig = (d) => `${d.file}|${d.created || ""}|${d.status || ""}`;
  let first = true, stop = false, timer;
  const tick = async () => {
    const s = await api.studio(id);
    if (stop) return;
    if (first) {
      onEvent({ type: "snapshot", designs: s?.designs || [], brand: s?.brand, image_tool: s?.image_tool });
      for (const d of s?.designs || []) seen.set(d.id, sig(d));
      first = false;
    } else for (const d of s?.designs || []) {
      if (seen.get(d.id) === sig(d)) continue;
      onEvent({ type: seen.has(d.id) ? "design_update" : "design", design: d });
      seen.set(d.id, sig(d));
    }
    if (DATA.mode === "static") timer = setTimeout(tick, POLL_MS);
  };
  tick();
  return () => { stop = true; clearTimeout(timer); };
}
const isHtmlDesign = (d) => /\.html?$/i.test(String(d?.file || ""));
const dlUrl = (d) => (DATA.mode === "server" ? `${d.url}&download=1` : d.url);
const dlLabel = (d) => (isHtmlDesign(d) ? "تحميل HTML" : /\.jpe?g$/i.test(d.file || "") ? "تحميل JPG" : "تحميل PNG");
/** A design on the wall: its image, or (no browser in a cloud session) its live HTML in a scaled frame. */
function designMedia(d, big = false) {
  if (!isHtmlDesign(d)) return `<img src="${esc(big ? d.url : d.thumb_url || d.url)}" alt="${big ? esc(d.headline_ar || "") : ""}" loading="lazy" decoding="async">`;
  const W = d.width || 1080, H = d.height || 1350;
  return `<span class="sd-frame" data-w="${W}" data-h="${H}"><iframe src="${esc(d.url)}" width="${W}" height="${H}" loading="lazy" scrolling="no" tabindex="-1" title="${esc(d.headline_ar || "")}"></iframe></span>`;
}
/** Fit now and again shortly: a background tab may skip animation frames. */
const refit = (root) => { requestAnimationFrame(() => fitFrames(root)); setTimeout(() => fitFrames(root), 300); };
function fitFrames(root = document) {
  if (!root) return;
  for (const f of root.querySelectorAll(".sd-frame")) {
    const box = f.parentElement, cs = getComputedStyle(box);
    const bw = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const bh = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const W = Number(f.dataset.w), H = Number(f.dataset.h);
    const k = Math.min(bw / W, bh > 40 && !box.closest("#sdBox") ? bh / H : Infinity, box.closest("#sdBox") ? (innerHeight * 0.82) / H : Infinity);
    if (!(k > 0) || !isFinite(k)) continue;
    f.style.width = `${W * k}px`; f.style.height = `${H * k}px`;
    f.firstElementChild.style.transform = `scale(${k})`;
  }
}
const CHAIR_AV = INLINE?.chair || "brand/majlis-mark.svg";
const ROUND_NAME = ["", "الافتتاح", "النقاش", "التصويت"];
const ROUND_TITLE = ["", "الجولة 1: المواقف الافتتاحية", "الجولة 2: النقاش", "الجولة 3: التصويت"];
const PHASE_AR = {
  setup: "رئيس المجلس يقرأ سؤالك",
  round1: ROUND_TITLE[1],
  cruxes: "رئيس المجلس يحدّد نقاط الخلاف",
  round2: ROUND_TITLE[2],
  draft: "رئيس المجلس يجهّز مقترح للتصويت",
  round3: ROUND_TITLE[3],
  skip3: "الوضع السريع: ما نحتاج جولة تصويت",
  verdict: "رئيس المجلس يكتب الحكم",
};
const CHAIR_LINE = { setup: "أقرأ سؤالك", cruxes: "أحدّد نقاط الخلاف", draft: "أجهّز مقترح للتصويت", verdict: "أكتب الحكم", skip3: "الوضع السريع: ما نحتاج جولة تصويت" };
const VOTE_AR = { endorse: "تأييد", amend: "تأييد بتعديل", dissent: "اعتراض" };
const VERDICT_AR = { "GO": "نفّذ", "GO WITH CONDITIONS": "نفّذ بشروط", "RESHAPE": "أعِد التشكيل", "WAIT": "انتظر", "DON'T DO IT": "لا تنفّذ" };
const verdictAr = (l) => VERDICT_AR[String(l || "").toUpperCase().replace(/[’‘]/g, "'").trim()] || l || "";
const MODE_AR = { quick: "سريع", full: "كامل" };
const STATUS_AR = { done: "انتهى", running: "جارٍ الآن", stopped: "متوقف", error: "توقف بخطأ" };
const DISCLAIMER = `${SIM_NOTE} «صوت العميل» شخصية مركّبة من تقييمات عملاء المتجر، وليس عميلًا بعينه. الحكم نقاش تجاري، وليس استشارة مالية أو قانونية.`;
// ISO dates (2026-12-12) flip inside right-to-left text; isolate them as left-to-right runs
const ltrDates = (html) => String(html).replace(/(?<![\w"=\/-])(\d{4}-\d{2}-\d{2})(?![\w-])/g, '<bdi dir="ltr">$1</bdi>');
const SIM_TAG = '<span class="sim" title="مقعد محاكاة، ليس الشخص الحقيقي">محاكاة</span>';

// English machine labels in the cards, shown to the viewer in Arabic
const CARD_LABELS = [
  ["FINAL PILLAR SCORE", "درجة المحور النهائية"], ["PILLAR SCORE", "درجة المحور"], ["FINAL SCORE", "الدرجة النهائية"],
  ["OPTION SCORES", "تقييم الخيارات"], ["STANCE", "الموقف"], ["CONFIDENCE", "الثقة"], ["RUIN RISK", "خطر الخسارة الكبيرة"],
  ["DOOR", "نوع القرار"], ["THE CALL", "القرار"], ["WHY", "لماذا"], ["THE RISK I SEE", "الخطر اللي أشوفه"],
  ["WHAT WOULD CHANGE MY MIND", "وش يغيّر رأيي"], ["WHAT I'D DO THIS WEEK", "اللي أسويه هالأسبوع"], ["QUESTION FOR THE FOUNDER", "سؤالي لك"],
  ["I DISAGREE MOST WITH", "أكثر واحد أختلف معه"], ["I CONCEDE", "أعترف"], ["ON THE CRUXES", "عن نقاط الخلاف"], ["MOVED", "هل تغيّر الموقف"],
  ["MY CONDITIONS FOR YES", "شروط الموافقة"], ["AMENDMENT OR DISSENT", "التعديل أو الاعتراض"], ["ONE LINE FOR THE FOUNDER", "سطر واحد لك"],
  ["VOTE", "التصويت"], ["SEAT", "المقعد"],
];
const VALUE_AR = [
  [/\bnone\b/gi, "لا يوجد"], [/\bpossible\b/gi, "محتمل"], [/\blikely\b/gi, "مرجّح"],
  [/\bone-way\b/gi, "باتجاه واحد (صعب الرجوع)"], [/\btwo-way\b/gi, "باتجاهين (يمكن الرجوع)"],
  [/\bendorse with amendment\b/gi, "تأييد بتعديل"], [/\bendorse\b/gi, "تأييد"], [/\bdissent\b/gi, "اعتراض"],
  [/\bstrong yes\b/gi, "نعم بقوة"], [/\bconditional yes\b/gi, "نعم بشروط"], [/\bstrong no\b/gi, "لا قاطعة"],
];

const state = {
  seats: [], allSeats: [], byKey: {}, councils: [], council: "business", session: null, options: [], weights: {}, active: [], round: 0,
  cards: { 1: {}, 2: {}, 3: {} }, replaying: false, verdict: null, links: [], geo: {}, setup: null, wait: null,
};
const nm = (k) => state.byKey[k]?.shortAr || state.byKey[k]?.short || k;
const verb = (k, he, she) => (state.byKey[k]?.fem ? she : he);

// ------------------------------------------------------------- boot
async function boot() {
  await loadSeats();
  if (state.runner === "api" && !state.hasKey) toast("ما لقينا ANTHROPIC_API_KEY في ملف .env. أضفه وأعد تشغيل السيرفر.");
  setCouncil(state.councils[0]?.key || "business");
  renderSamples();
  bindUI();
  new ResizeObserver(() => { layoutStage(); drawLinks(); }).observe($("#stage"));
  startBlinking();
  reset();
  typeIn($("#composer h2"));
  typeIn($("#waiting h2"));
  const ss = await api.sessions();
  // Only auto-play a council that is being written right now AND is the newest session;
  // an older half-written folder (another process, or an abandoned run) leaves the home view up.
  const first = ss.running || ss.live;
  const newest = (ss.sessions || [])[0]?.id;
  // a deep link straight to a wall: /#studio=<session id>
  // a deep link straight to a wall, or to one design on it: /#studio=<session id>[/<design id>]
  const [deep, deepDesign] = decodeURIComponent((location.hash.match(/^#studio=(.+)$/) || [])[1] || "").split("/");
  const openWhenThere = (n) => (state.studio.list.some((d) => d.id === deepDesign) ? openDesign(deepDesign) : n > 0 && setTimeout(() => openWhenThere(n - 1), 250));
  if (deep) enterStudio(deep).then(() => deepDesign && openWhenThere(40));
  else if (/^#session=/.test(location.hash)) replay(decodeURIComponent(location.hash.slice(9)));
  else if (INLINE) replay(INLINE.id);
  else if (first) { seenLive.add(first); if (first === newest) attach(first); }
  refreshUsage();
  if (!INLINE) setInterval(watchForLive, DATA.mode === "server" ? 2500 : POLL_MS);
  setInterval(tickWait, 1000);
}

// seats and councils come from the server: councils.json plus every brains/<slug>/seat.json
async function loadSeats() {
  const r = await api.seats();
  state.allSeats = r.seats;
  state.byKey = Object.fromEntries(r.seats.map((s) => [s.key, s]));
  state.councils = r.councils?.length ? r.councils : [{ key: "business", name: "مجلس التاجر", command: CMD, seats: r.seats.map((s) => s.key) }];
  state.runner = r.runner;
  state.hasKey = r.hasKey;
}
const councilOf = (k) => state.councils.find((c) => c.key === k) || state.councils[0];
const cmdOf = (k) => councilOf(k)?.command || CMD;

/** Seat the table for one council (any 2 to 10 seats). Re-renders only when the council changes. */
function setCouncil(key, { force = false } = {}) {
  const c = councilOf(key);
  if (!c) return;
  const changed = force || state.council !== c.key || !state.seats.length;
  state.council = c.key;
  state.seats = c.seats.map((k) => state.byKey[k]).filter(Boolean);
  $("#councilName").textContent = c.name;
  const bn = $(".brand-name");
  if (bn) bn.innerHTML = `مجلس <em>${esc(String(c.short || c.name).replace(/^مجلس\s*/, ""))}</em>`;
  $(".brand")?.setAttribute("aria-label", c.name);
  $("#councilPill").dataset.council = c.key;
  $("#tableEtch").textContent = c.name;
  $$("[data-council-label]").forEach((el) => (el.textContent = `${c.name} · `));
  $$("#waitCmd, [data-cmd-current]").forEach((el) => (el.textContent = `${cmdOf(c.key)} …`));
  $$(".council-tabs button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.council === c.key)));
  $$(".council-card").forEach((b) => b.classList.toggle("on", b.dataset.council === c.key));
  if (changed) { renderSeats(); drawLinks(); }
}

// a council started in Claude Code shows up here on its own
const seenLive = new Set();
async function watchForLive() {
  const ss = await api.sessions().catch(() => null);
  const id = ss?.live || ss?.running;
  if (!id || seenLive.has(id) || id === state.session) return;
  seenLive.add(id);
  // never yank the viewer out of a session they are watching; offer it instead
  if (state.session && !state.verdict) return toast("بدأ مجلس جديد في Claude Code. افتحه من «الجلسات السابقة».");
  attach(id);
}

// arrival: a heading comes in a word at a time, blur to sharp. Per word, not per letter,
// so Arabic letters stay joined.
function typeIn(el) {
  if (!el) return;
  const text = el.textContent;
  el.classList.add("typein");
  el.innerHTML = text.split(" ").map((word, i) => `<span class="wd" style="animation-delay:${i * 70}ms">${esc(word)}</span>`).join(" ");
  el.setAttribute("aria-label", text);
}

function renderSamples() {
  $("#samples").innerHTML = SAMPLES.map(([t], i) => `<button type="button" data-i="${i}">${esc(t)}</button>`).join("");
  $("#samples").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $("#prompt").value = SAMPLES[b.dataset.i][1];
    $("#prompt").focus();
  });
}

function renderSeats() {
  $("#seats").innerHTML = state.seats.map((s, i) => `
    <div class="seat${s.drawn ? " drawn" : ""}${s.portraits ? "" : " initials"}" id="seat-${s.key}" data-seat="${s.key}" style="--d:-${(i * 1.7) % 6}s" tabindex="0" role="button" aria-label="${esc(s.name)}${s.pillar ? "، " + esc(s.pillar) : ""}. افتح البطاقة.">
      <div class="think" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="bust" data-shape="base">${SHAPES.map((sh) => `<img class="${sh}" src="${portrait(s.key, sh)}" alt="" draggable="false">`).join("")}</div>
    </div>`).join("");
  $("#plates").innerHTML = state.seats.map((s) => `
    <div class="nameplate" id="plate-${s.key}" data-seat="${s.key}" style="--seat:${s.color}">
      <b><span class="full">${esc(s.name)}</span><span class="brief">${esc(s.shortAr || s.name)}</span></b>${SIM_TAG}
      <small>${esc(s.pillar)}</small>
      <div class="meta"><span class="pips" title="وزن المقعد في هذا القرار"></span><span class="chip" hidden></span><span class="score" hidden></span></div>
    </div>`).join("");
  layoutStage();
}

// The table is an ellipse seen from the front. Seats sit along its far edge: the
// middle seats are farthest (higher, smaller), the end seats nearest (lower, bigger).
// Any number of seats works; in RTL the first seat sits on the right.
function layoutStage() {
  const stage = $("#stage");
  const W = stage.clientWidth;
  if (!W) return; // hidden (e.g. while printing): keep the last layout
  const narrow = matchMedia("(max-width: 820px)").matches;
  const H = narrow ? Math.round(W * 0.66) : stage.clientHeight;
  const cx = W / 2, cy = H * (narrow ? 0.98 : 0.9), rx = W * 0.48, ry = H * (narrow ? 0.46 : 0.42);
  const t = $("#table");
  Object.assign(t.style, { left: `${cx - rx}px`, top: `${cy - ry}px`, width: `${rx * 2}px`, height: `${ry * 2}px` });
  const edge = (x) => cy - ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
  const n = state.seats.length;
  const rtl = document.documentElement.dir === "rtl";
  const k = Math.min(1, 7 / Math.max(n, 1)) ** 0.6; // more seats, slightly smaller busts
  const plates = [];
  state.seats.forEach((s, i) => {
    const m = narrow ? 0.1 : 0.075, f = n === 1 ? 0.5 : m + ((1 - 2 * m) * i) / (n - 1);
    const x = W * (rtl ? 1 - f : f);
    const d = ((x - cx) / rx) ** 2;
    const size = H * (narrow ? 0.5 + 0.08 * d : 0.37 + 0.07 * d) * k;
    const bottom = edge(x) + size * 0.2;
    const el = $(`#seat-${s.key}`);
    Object.assign(el.style, { left: `${x - size / 2}px`, top: `${bottom - size}px`, width: `${size}px`, height: `${size}px`, zIndex: 10 + Math.round(d * 10) });
    const pl = $(`#plate-${s.key}`);
    // straddles the table edge, over the chest (collisions are resolved below)
    // on a phone: two tidy rows over the table (even seats, then odd seats), so names never collide
    const rows = n > 8 ? 3 : 2;
    plates.push({ pl, x, y: narrow ? H * (rows === 3 ? 0.74 : 0.8) + (i % rows) * ((pl.offsetHeight || 28) + 4) : edge(x) + H * 0.01 });
    state.geo[s.key] = { x, head: bottom - size * 0.72, top: bottom - size * 0.9, size };
  });
  const platesBottom = placePlates(plates, W);
  const c = $("#center");
  if (narrow) {
    stage.style.paddingTop = `${Math.max(H, platesBottom) + 24}px`; // the scene sits on top; captions flow below it
  } else {
    stage.style.paddingTop = "";
    // the captions start below the lowest nameplate they could collide with
    const inner = (n > 2 ? state.seats.slice(1, -1) : state.seats).map((s) => $(`#plate-${s.key}`)).filter(Boolean);
    const top = Math.max(...inner.map((p) => p.offsetTop + p.offsetHeight / 2)) + H * 0.035;
    Object.assign(c.style, { left: `${W * 0.2}px`, width: `${W * 0.6}px`, top: `${top}px`, height: `${H - top - H * 0.09}px` });
  }
  if (state.speaking && state.geo[state.speaking]) moveSpot(state.speaking);
}

// Nameplates are centred on their seat. On a narrow screen neighbours collide, so each plate is
// kept inside the stage and pushed down below any earlier plate it would overlap.
function placePlates(plates, W) {
  const gap = 3, placed = [];
  for (const p of plates) {
    const w = p.pl.offsetWidth || 80, h = p.pl.offsetHeight || 24;
    const x = Math.min(Math.max(p.x, w / 2 + 4), W - w / 2 - 4);
    let y = p.y;
    for (let moved = true, guard = 0; moved && guard < 20; guard++) {
      moved = false;
      for (const q of placed) {
        const overlapX = Math.abs(x - q.x) < (w + q.w) / 2 + gap;
        const overlapY = Math.abs(y - q.y) < (h + q.h) / 2 + gap;
        if (overlapX && overlapY) { y = q.y + (h + q.h) / 2 + gap; moved = true; }
      }
    }
    p.pl.style.left = `${x}px`;
    p.pl.style.top = `${y}px`;
    placed.push({ x, y, w, h });
  }
  return Math.max(0, ...placed.map((q) => q.y + q.h / 2));
}

function moveSpot(key) {
  const g = state.geo[key]; const spot = $("#spot");
  if (!g) { spot.classList.remove("on"); return; }
  spot.style.left = `${g.x}px`;
  spot.style.top = `${g.head}px`;
  spot.style.width = spot.style.height = `${g.size * 1.9}px`;
  spot.classList.add("on");
}

function bindUI() {
  $("#composer").addEventListener("submit", async (e) => {
    e.preventDefault();
    const prompt = $("#prompt").value.trim();
    if (prompt.length < 10) return toast("اكتب قرار حقيقي، جملة على الأقل.");
    const mode = $('input[name="mode"]:checked').value;
    $("#convene").disabled = true;
    const r = await fetch("api/council", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt, mode, council: state.council }) });
    const j = await r.json();
    $("#convene").disabled = false;
    if (!r.ok) return toast(j.error || "ما قدرنا نعقد المجلس.");
    attach(j.id);
  });
  const openFrom = (e) => { const b = e.target.closest("[data-seat]"); if (b) openCard(b.dataset.seat); };
  $("#seats").addEventListener("click", openFrom);
  $("#plates").addEventListener("click", openFrom);
  $("#seats").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFrom(e); } });
  $("#feed").addEventListener("click", (e) => { const c = e.target.closest(".feed-card"); if (c) openCard(c.dataset.seat, Number(c.dataset.round)); });
  $("#waitHistory").addEventListener("click", openHistory);
  $("#waitGuide").addEventListener("click", openGuide);
  $("#guideBtn").addEventListener("click", openGuide);
  document.addEventListener("click", async (e) => {
    if (e.target.closest("[data-copy-example]")) {
      try { await navigator.clipboard.writeText(`${CMD} ${EXAMPLE}`); toast("انتسخ. الصقه في Claude Code."); }
      catch { toast("النسخ ما اشتغل هنا. ظلّل النص وانسخه."); }
    }
    if (e.target.closest("[data-pdf]")) savePdf(e.target.closest("[data-pdf]"));
    const pick = e.target.closest("[data-pick-council]");
    if (pick && !state.session) setCouncil(pick.dataset.pickCouncil);
    const cp = e.target.closest("[data-copy-cmd]");
    if (cp) {
      try { await navigator.clipboard.writeText(`${cp.dataset.copyCmd} `); toast("انتسخ الأمر. الصقه في Claude Code واكتب قرارك بعده."); }
      catch { toast("النسخ ما اشتغل هنا. ظلّل الأمر وانسخه."); }
    }
  });
  $("#historyBtn").addEventListener("click", openHistory);
  $("#newBtn").addEventListener("click", reset);
  $("#verdictSheet").addEventListener("click", (e) => { if (e.target.id === "verdictSheet" || e.target.closest("[data-close]")) $("#verdictSheet").hidden = true; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#verdictSheet").hidden = true; });
  $$(".speed button").forEach((b) => b.addEventListener("click", () => {
    player.speed = Number(b.dataset.speed);
    $$(".speed button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
  $("#skipBtn").addEventListener("click", () => player.skip());
  bindStudio();
}

// ------------------------------------------------------------- the player
// Every event goes through one ordered queue. Seats speak one at a time, at a
// readable pace, even though they answer in parallel. Skip ahead drains whatever
// is queued instantly; new events after that animate again.
const player = {
  q: [], busy: false, epoch: 0, speed: 1, fast: false, timers: new Set(),
  push(ev) { this.q.push(ev); this.info(); this.pump(); },
  async pump() {
    if (this.busy) return;
    this.busy = true;
    const my = this.epoch;
    while (this.q.length && my === this.epoch) {
      const ev = this.q.shift();
      this.info();
      hideWait();
      try { await handle(ev); } catch (e) { console.error(e); }
    }
    if (my === this.epoch) { this.busy = false; this.fast = false; this.info(); }
  },
  sleep(ms) {
    if (this.fast || ms <= 0) return Promise.resolve();
    return new Promise((res) => { const t = setTimeout(() => { this.timers.delete(o); res(); }, ms / this.speed); const o = { t, res }; this.timers.add(o); });
  },
  flushTimers() { for (const o of this.timers) { clearTimeout(o.t); o.res(); } this.timers.clear(); },
  skip() { this.fast = true; this.flushTimers(); },
  reset() { this.epoch++; this.q.length = 0; this.fast = true; this.flushTimers(); this.busy = false; this.fast = false; this.info(); },
  info() {
    const waiting = this.q.filter((e) => e.type === "seat_done").length;
    $("#queueInfo").textContent = waiting ? `${waiting} في الانتظار` : "";
  },
};

// ------------------------------------------------------------- session wiring
function reset() {
  state.es?.close();
  state.unsub?.(); state.unsub = null;
  player.reset();
  Object.assign(state, { session: null, options: [], weights: {}, active: [], round: 0, cards: { 1: {}, 2: {}, 3: {} }, replaying: false, verdict: null, links: [], speaking: null, setup: null, wait: null });
  hideWait();
  studioReset();
  $("#stage").classList.remove("live");
  $("#topic").hidden = true;
  $("#composer").hidden = state.runner !== "api";
  $("#waiting").hidden = state.runner === "api";
  $("#caption").hidden = true;
  $("#cruxes").hidden = true;
  $("#plate").hidden = true;
  $("#playbar").hidden = true;
  $("#newBtn").hidden = true;
  $("#verdictSheet").hidden = true;
  $("#panelHead").textContent = "البداية";
  $("#feed").innerHTML = councilsHtml() + GUIDE;
  renderCouncilTabs();
  setCouncil(state.council);
  $$(".vote").forEach((b) => b.remove());
  $$(".seat").forEach((el) => { el.classList.remove("absent", "speaking", "thinking", "addressed"); el.style.transform = ""; $(".bust", el).dataset.shape = "base"; });
  $$(".nameplate").forEach((el) => { el.classList.remove("absent", "speaking"); $(".chip", el).hidden = true; $(".score", el).hidden = true; $(".pips", el).innerHTML = ""; });
  $("#spot").classList.remove("on");
  $$(".stepper li").forEach((li) => li.classList.remove("active", "done"));
  drawLinks();
}

function begin(id) {
  reset();
  state.session = id;
  $("#composer").hidden = true;
  $("#waiting").hidden = true;
  $("#newBtn").hidden = false;
  $("#playbar").hidden = false;
  $("#panelHead").textContent = "أهم النقاط";
  $("#feed").innerHTML = '<div class="empty">سطر من كل مقعد وهو يتكلم. اضغط على أي مقعد لقراءة بطاقته كاملة.</div>';
  $("#stage").classList.add("live");
  chairSays("المجلس يأخذ أماكنه", { dots: true });
}

function attach(id) {
  begin(id);
  connectStudio(id);
  state.unsub?.();
  state.unsub = subscribeSession(id, (ev) => {
    if (state.session !== id) return;
    if (ev.type === "end") { refreshUsage(); return; }
    if (ev.type === "delta") return; // seats speak from their finished cards
    if (ev.type === "usage") return refreshUsage();
    if (ev.type === "seat_error") return toast(`${nm(ev.seat)}: صار خطأ (${ev.error})`);
    player.push(ev);
  });
}

// ------------------------------------------------------------- event handling
const STEP_OF = { setup: "setup", round1: "round1", cruxes: "cruxes", round2: "round2", draft: "round3", round3: "round3", skip3: "round3", verdict: "verdict" };
const ORDER = ["setup", "round1", "cruxes", "round2", "round3", "verdict"];

function setStep(step) {
  const idx = ORDER.indexOf(step);
  $$(".stepper li").forEach((li) => {
    const i = ORDER.indexOf(li.dataset.step);
    li.classList.toggle("done", i < idx);
    li.classList.toggle("active", i === idx);
  });
}

async function handle(ev) {
  switch (ev.type) {
    case "phase": {
      state.wait = { phase: ev.phase, at: ev.at || Date.now() };
      setStep(STEP_OF[ev.phase] || "setup");
      feedPhase(PHASE_AR[ev.phase] || ev.label);
      const thinking = ["setup", "cruxes", "draft", "verdict"].includes(ev.phase);
      if (thinking || ev.phase === "skip3") {
        chairSays(CHAIR_LINE[ev.phase] || PHASE_AR[ev.phase] || ev.label, { dots: thinking });
        await player.sleep(1400);
      }
      break;
    }
    case "setup": state.setup = ev; onSetup(ev); await player.sleep(1800); break;
    case "round_start": onRoundStart(ev.round); break;
    case "seat_start": $(`#seat-${ev.seat}`)?.classList.add("thinking"); break;
    case "seat_done": await onSeatDone(ev); break;
    case "round_done": state.wait = null; updateOptions(ev.scores); break;
    case "cruxes": await onCruxes(ev); break;
    case "draft": await onDraft(ev.draft); break;
    case "verdict": state.wait = null; onVerdict(ev); break;
    case "studio_design": await onStudioDesign(ev.design); break;
    case "error": state.wait = null; toast(`المجلس توقف: ${ev.error}`); chairSays(`المجلس توقف: ${ev.error}`); break;
  }
}

function onSetup(ev) {
  setCouncil(ev.council || "business");
  state.options = ev.options;
  state.weights = ev.weights;
  state.active = ev.seats;
  $("#topic").hidden = false;
  $("#topicTitle").textContent = ev.title;
  typeIn($("#topicTitle"));
  $("#options").innerHTML = ev.options.map((o) => `
    <div class="opt" data-opt="${o.id}"><span class="id">${o.id}</span><span class="label">${esc(o.label)}</span><span class="val">-</span><span class="bar"><i></i></span></div>`).join("");
  for (const s of state.seats) {
    const absent = !ev.seats.includes(s.key);
    $(`#seat-${s.key}`).classList.toggle("absent", absent);
    const pl = $(`#plate-${s.key}`);
    pl.classList.toggle("absent", absent);
    const w = ev.weights[s.key]?.weight || 1;
    pl.title = `الوزن ${w} من 3${ev.weights[s.key]?.reason ? `: ${ev.weights[s.key].reason}` : ""}`;
  }
  chairSays(ev.title, { tag: `${councilOf(state.council)?.short || ""}${ev.mode === "quick" ? " · مجلس سريع" : " · المجلس الكامل"}` });
}

function updateOptions(scores) {
  const best = Object.entries(scores).sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0))[0]?.[0];
  for (const [id, v] of Object.entries(scores)) {
    const el = $(`.opt[data-opt="${id}"]`); if (!el) continue;
    $(".val", el).textContent = v.score ?? "-";
    $(".bar i", el).style.width = `${(v.score || 0) * 10}%`;
    el.classList.toggle("lead", id === best);
    el.title = v.math;
  }
}

function onRoundStart(round) {
  state.round = round;
  state.links = [];
  drawLinks();
  $("#cruxes").hidden = true;
  chairSays(ROUND_TITLE[round] || "", { dots: true, tag: "الكلمة للمجلس" });
}

// ------------------------------------------------------------- talking
const clean = (t) => String(t || "").replace(/\s*\((?:S\d+|source[^)]*)[^)]*\)/gi, "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

// Dots that do not end a sentence: «ر.س»، «د.»، «إلخ.»، «م.»، «ص.»، decimals (1.4)، and initials (D.O.)
const DOT = "․"; // one-dot leader stands in for a protected dot, restored after splitting
const ABBR = /(ر\.س\.?|د\.ك|د\.إ|ج\.م|إلخ\.|الخ\.|(?<![؀-ۿ])[دمصهـج]\.(?=\s*[؀-ۿ\d])|\d\.\d|\b[A-Z]\.(?=[A-Z]))/g;
const protectDots = (t) => String(t).replace(ABBR, (m) => m.replace(/\./g, DOT));
const restoreDots = (t) => String(t).split(DOT).join(".");
function firstSentences(t, max) {
  const safe = protectDots(t);
  const parts = safe.match(/[^.!?؟]+[.!?؟]+["”»)]?\s*|[^.!?؟]+$/g) || [safe];
  let out = "";
  for (const p of parts) { if (out && (out + p).length > max) break; out += p; }
  return restoreDots(shorten(out.trim(), max + 40));
}

/** The line a seat says out loud: the headline of its card, not the whole card. */
function lineFor(round, p, max = 170) {
  if (round === 1) return firstSentences(clean(p.call || p.stance), max);
  if (round === 2) {
    let t = clean(p.disagreeLine || p.stance);
    // "Graham. His argument..." / "هورموزي: يقول..." reads as talking to them: "هورموزي، ..."
    t = t.replace(/^([A-Za-z][\w.' ]{0,24})[.:,]\s+(\S+)/, (m, name, next) => !seatKey(name) ? m : `${nm(seatKey(name))}، ${next}`);
    t = t.replace(/^([؀-ۿ]+(?: [؀-ۿ]+)?)\s*[.:،]\s+/, (m, name) => !seatKey(name) ? m : `${nm(seatKey(name))}، `);
    return firstSentences(t, max);
  }
  return firstSentences(clean(p.oneLine || p.amendment), max);
}

// rough mouth shapes from letters (Latin and Arabic)
function shapesFor(word) {
  const out = [];
  for (const ch of word.toLowerCase()) {
    const s = "aeiاأإآىيهة".includes(ch) ? "open" : "ouwyوعغ".includes(ch) ? "mid" : "mbpfمبف".includes(ch) ? "base" : null;
    if (s && s !== out[out.length - 1]) out.push(s);
  }
  return out.length ? out : ["mid"];
}

function setShape(key, shape) { const b = $(`#seat-${key} .bust`); if (b) b.dataset.shape = shape; }

function setSpeaker(key, target) {
  state.speaking = key;
  $$(".seat").forEach((el) => { el.classList.toggle("speaking", el.dataset.seat === key); el.classList.toggle("addressed", el.dataset.seat === target); });
  $$(".nameplate").forEach((el) => el.classList.toggle("speaking", el.dataset.seat === key));
  const el = key && $(`#seat-${key}`);
  if (el) {
    el.classList.remove("thinking");
    // lean toward whoever they're answering (physical direction, works in either text direction)
    const g = state.geo[key], tg = target && state.geo[target];
    el.style.transform = tg ? `translateX(${Math.sign(tg.x - g.x) * g.size * 0.04}px) rotate(${Math.sign(tg.x - g.x) * 2.5}deg) scale(1.05)` : "scale(1.05)";
    moveSpot(key);
  } else $("#spot").classList.remove("on");
  $$(".seat").forEach((s) => { if (s.dataset.seat !== key) s.style.transform = ""; });
}

function captionFor(who) {
  $("#cruxes").hidden = true;
  $("#plate").hidden = true;
  const c = $("#caption");
  c.hidden = false;
  c.style.animation = "none"; void c.offsetWidth; c.style.animation = "";
  const s = state.byKey[who];
  $("#capAv").className = `cap-av${s ? "" : " chair"}`;
  $("#capAv").innerHTML = `<img src="${s ? portrait(who) : CHAIR_AV}" alt="">`;
  $("#capWho").innerHTML = s ? `${esc(s.name)} ${SIM_TAG}` : "رئيس المجلس";
}

function chairSays(text, { dots = false, tag = "" } = {}) {
  setSpeaker(null);
  captionFor(null);
  $("#capTag").textContent = tag;
  const p = $("#capText");
  p.className = "cap-text chair";
  p.innerHTML = esc(text) + (dots ? '<span class="dots"><i></i><i></i><i></i></span>' : "");
  $("#capSub").textContent = "";
}

async function speak(key, text, { tag = "", target = null, sub = "", subNow = false } = {}) {
  setSpeaker(key, target);
  captionFor(key);
  $("#capTag").textContent = tag;
  $("#capSub").innerHTML = subNow ? sub : "";
  const p = $("#capText");
  p.className = "cap-text";
  p.dir = "rtl";
  const words = text.split(" ").filter(Boolean);
  p.innerHTML = words.map((w) => `<span class="w">${esc(w)}</span> `).join("");
  const spans = $$(".w", p);
  for (let i = 0; i < words.length; i++) {
    if (player.fast) break;
    const w = words[i];
    spans[i].classList.add("on");
    const shapes = shapesFor(w.replace(/[^a-z؀-ۿ]/gi, ""));
    const dur = Math.max(170, w.length * 52);
    const per = dur / (shapes.length + 1);
    for (const sh of shapes) { setShape(key, sh); await player.sleep(per); }
    setShape(key, "base");
    await player.sleep(per + (/[.!?؟]["”»)]?$/.test(w) ? 340 : /[,;:،؛]$/.test(w) ? 170 : 25));
  }
  spans.forEach((s) => s.classList.add("on"));
  setShape(key, "base");
  $("#capSub").innerHTML = sub;
  await player.sleep(1300);
}

// idle blinking for everyone, so the room feels alive between lines
function startBlinking() {
  const tick = () => {
    const s = state.seats[Math.floor(Math.random() * state.seats.length)];
    const b = s && $(`#seat-${s.key} .bust`);
    if (b && b.dataset.shape === "base") {
      b.dataset.shape = "blink";
      setTimeout(() => { if (b.dataset.shape === "blink") b.dataset.shape = "base"; }, 130);
    }
    setTimeout(tick, 3600 / Math.max(state.seats.length, 1) + Math.random() * 500);
  };
  setTimeout(tick, 600);
}

async function onSeatDone(ev) {
  const { round, seat, text, parsed, quotes } = ev;
  state.cards[round][seat] = { text, parsed, quotes };
  const top = topOption(parsed.optionScores);
  const line = lineFor(round, parsed);
  let tag = ROUND_NAME[round], sub = "", target = null;
  if (round === 1) {
    tag = `${stanceWord(parsed.stance)}${top ? ` · الأفضل: ${top.id} (${top.v}/10)` : ""}`;
  } else if (round === 2) {
    const tgt = parsed.disagreeWith ? state.byKey[parsed.disagreeWith] : null;
    if (tgt) {
      target = tgt.key;
      tag = `${verb(seat, "يرد على", "ترد على")} ${nm(tgt.key)}`;
      state.links = state.links.filter((l) => l.from !== seat);
      state.links.push({ from: seat, to: tgt.key });
      drawLinks();
    }
    sub = /^(yes|نعم|ايوه|أيوه)/i.test(parsed.moved || "") ? verb(seat, "غيّر موقفه", "غيّرت موقفها") : "";
  } else {
    tag = `التصويت: ${VOTE_AR[parsed.vote || "endorse"]}`;
  }
  const session = state.session;
  feedCard(round, seat, parsed);
  await speak(seat, line || "التفاصيل في بطاقتي.", { tag, target, sub });

  // the viewer may have switched sessions (or councils) while this seat was talking
  const pl = $(`#plate-${seat}`);
  if (state.session !== session || !pl || !$(`#seat-${seat}`)) { setSpeaker(null); return; }
  const chip = $(".chip", pl);
  chip.hidden = round === 3; // the vote stamp says it
  chip.className = "chip";
  if (round === 3) {
    const v = parsed.vote || "endorse";
    chip.textContent = VOTE_AR[v];
    chip.classList.add(v);
    $(`#seat-${seat} .vote`)?.remove();
    const stamp = document.createElement("div");
    stamp.className = `vote ${v}`;
    stamp.textContent = VOTE_AR[v];
    $(`#seat-${seat}`).appendChild(stamp);
  } else chip.textContent = stanceWord(parsed.stance);
  if (top) { const sc = $(".score", pl); sc.hidden = false; sc.textContent = `${top.id} ${top.v}`; sc.title = `أعلى درجة: الخيار ${top.id}`; }
  setSpeaker(null);
}

const NOT_AR = "(?<![\\u0600-\\u06ff])";
const END_AR = "(?![\\u0600-\\u06ff])";
function stanceWord(t = "") {
  const s = String(t).toLowerCase();
  if (/strong yes|نعم بقوة|نعم قوية|بقوة/.test(s)) return "نعم بقوة";
  if (/conditional yes|نعم بشرط|نعم بشروط|مشروط/.test(s)) return "نعم بشروط";
  if (/strong no|لا قاطع|رفض قاطع|لا بقوة/.test(s)) return "لا قاطعة";
  if (/\byes\b|نعم|موافق/.test(s)) return "نعم";
  if (new RegExp(`\\bno\\b|${NOT_AR}لا${END_AR}|أرفض|ارفض`).test(s)) return "لا";
  return "تكلّم";
}

function topOption(scores = {}) {
  const e = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return e ? { id: e[0], v: e[1] } : null;
}
const shorten = (t, n) => (t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t);
const face = (k) => `<img src="${portrait(k)}" alt="${esc(nm(k))}" title="${esc(nm(k))}">`;

async function onCruxes(ev) {
  setSpeaker(null);
  $("#caption").hidden = true;
  const c = $("#cruxes");
  c.hidden = false;
  c.innerHTML = `<div class="head">${ev.unanimous ? "اتفاق زيادة عن اللزوم. رئيس المجلس يضغط عليهم." : "على وش يختلفون"}</div>` +
    ev.cruxes.map((x, i) => `<div class="crux" style="animation-delay:${i * 0.18}s"><b dir="rtl">${esc(x.question)}</b><div class="sides">${x.sides.map((sd) => `<span class="side"><span class="faces">${sd.seats.filter((k) => state.byKey[k]).map(face).join("")}</span><span dir="rtl">${esc(shorten(sd.position, 48))}</span></span>`).join("")}</div></div>`).join("");
  const f = document.createElement("div");
  f.className = "feed-note";
  f.innerHTML = `<b>نقطة الخلاف:</b> <span dir="rtl">${ev.cruxes.map((x) => esc(x.question)).join(" ")}</span>`;
  feedAppend(f);
  await player.sleep(3500 + 1800 * ev.cruxes.length);
}

async function onDraft(d) {
  chairSays(`المقترح: ${verdictAr(d.label)} على الخيار ${d.option}. ${firstSentences(clean(d.recommendation), 140)}`, { tag: "للتصويت" });
  const f = document.createElement("div");
  f.className = "feed-note";
  f.innerHTML = `<b>للتصويت:</b> ${esc(verdictAr(d.label))} على الخيار ${esc(d.option)}.`;
  feedAppend(f);
  await player.sleep(4200);
}

// ------------------------------------------------------------- rebuttal arcs
function drawLinks() {
  const svg = $("#links");
  const stage = $("#stage");
  const w = stage.clientWidth, h = stage.clientHeight;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const links = state.links || [];
  const col = "#e8c480";
  svg.innerHTML = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${col}"/></marker></defs>` +
    links.map(({ from, to }, i) => {
      const a = state.geo[from], b = state.geo[to];
      if (!a || !b || ![a.x, a.top, b.x, b.top].every(Number.isFinite)) return "";
      const y1 = a.top - 6, y2 = b.top - 6;
      const mx = (a.x + b.x) / 2, my = Math.min(y1, y2) - Math.min(90, Math.abs(a.x - b.x) * 0.22) - 10;
      return `<path class="${i < links.length - 1 ? "old" : ""}" d="M${a.x},${y1} Q${mx},${my} ${b.x},${y2}" stroke="${col}" marker-end="url(#arrow)"/>`;
    }).join("");
}

// ------------------------------------------------------------- feed + cards
function feedAppend(node) {
  const feed = $("#feed");
  $(".empty", feed)?.remove();
  feed.appendChild(node);
  feed.scrollTop = feed.scrollHeight;
}
function feedPhase(label) {
  const d = document.createElement("div");
  d.className = "feed-phase";
  d.textContent = label;
  feedAppend(d);
}
function feedCard(round, seat, parsed) {
  const d = document.createElement("div");
  d.className = "feed-card";
  d.dataset.seat = seat;
  d.dataset.round = round;
  const top = topOption(parsed.optionScores);
  const tgt = parsed.disagreeWith ? nm(parsed.disagreeWith) : "";
  const what = round === 1 ? `${stanceWord(parsed.stance)}${top ? `، الأفضل ${top.id}` : ""}` : round === 2 ? (tgt ? `ضد ${tgt}` : "النقاش") : VOTE_AR[parsed.vote || "endorse"];
  d.innerHTML = `<img class="av" src="${portrait(seat)}" alt=""><div><div class="h">${esc(nm(seat))} ${SIM_TAG}<span class="r">${esc(what)}</span></div><p dir="rtl">${esc(lineFor(round, parsed, 105))}</p></div>`;
  feedAppend(d);
}

/** A card's raw text with its English machine labels shown in Arabic. */
function cardHtml(text) {
  let h = esc(String(text || "").replace(/\*\*/g, ""));
  for (const [en, ar] of CARD_LABELS) {
    const re = new RegExp(`(^|[·|]\\s*|^[\\s\\-•*>\\d.)]*)${en.replace(/'/g, "(?:'|&#39;|’)")}(\\s*(?:\\([^)\\n]{0,40}\\))?\\s*:)`, "gim");
    h = h.replace(re, (m, pre, post) => `${pre}<b class="lbl" title="${en}">${ar}</b>${post}`);
  }
  // translate the fixed English values that follow some labels
  h = h.replace(/(<b class="lbl"[^>]*>(?:الموقف|خطر الخسارة الكبيرة|نوع القرار|التصويت)<\/b>\s*:)([^\n·]*)/g, (m, lbl, val) => {
    let v = val;
    for (const [re, ar] of VALUE_AR) v = v.replace(re, ar);
    return lbl + v;
  });
  return h;
}

function openCard(seat, round) {
  const s = state.byKey[seat];
  const rounds = [3, 2, 1].filter((r) => state.cards[r][seat]);
  const r = round || rounds[0];
  const c = state.cards[r]?.[seat];
  const note = seat === "customer" ? "«صوت العميل» محاكاة مركّبة من تقييمات عملاء المتجر وكلامهم الحقيقي. ليس عميلًا بعينه." : `مقعد محاكاة مبني من أعمال ${esc(s.name)} المنشورة. ليس هو، ولا يتكلم باسمه، ولا علاقة له بهذا المنتج.`;
  $("#cardBody").innerHTML = `
    <div class="card-head"><img src="${portrait(seat)}" alt=""><div><div class="label">${esc(s.pillar || councilOf(state.council)?.name || "")}</div><h3>${esc(s.name)} ${SIM_TAG}</h3>${s.question ? `<p class="muted" style="margin:0">سؤال هذا المقعد: ${esc(s.question)}</p>` : ""}</div></div>
    ${rounds.length > 1 ? `<p class="round-tabs">${rounds.slice().reverse().map((x) => `<button class="ghost${x === r ? " on" : ""}" data-r="${x}">${ROUND_NAME[x]}</button>`).join("")}</p>` : ""}
    ${c ? `<pre class="card-text" dir="rtl">${cardHtml(c.text)}</pre>${c.quotes.length ? `<ul class="qcheck">${c.quotes.map((q) => `<li class="${q.verified ? "" : "bad"}"><span dir="auto">"${esc(shorten(q.quote, 110))}"</span> (${q.source}) ${q.verified ? "موجود في المصادر" : "غير موجود في المصادر"}</li>`).join("")}</ul>` : ""}` : `<p class="muted">هذا المقعد ما تكلّم للحين.</p>`}
    <p class="muted" style="font-size:12px">${note}</p>`;
  $$("#cardBody [data-r]").forEach((b) => b.addEventListener("click", () => openCard(seat, Number(b.dataset.r))));
  const dlg = $("#cardDialog");
  if (!dlg.open) dlg.showModal();
}

// ------------------------------------------------------------- verdict
// the Chair should write display names; map keys, English names, or Arabic names
const arFold = (s) => String(s ?? "").replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ڤ/g, "ف").replace(/\s+/g, " ").trim();
function seatKey(x) {
  const raw = String(x ?? "").replace(/[(（][\s\S]*$/, "").trim();
  const t = raw.toLowerCase();
  if (!t) return undefined;
  const k = t.replace(/\s+/g, "");
  if (state.byKey[k]) return k;
  const pool = [...state.seats, ...state.allSeats.filter((s) => !state.seats.includes(s))];
  const hit = pool.find((s) => s.short.toLowerCase() === t || s.en?.toLowerCase() === t || t.split(" ").includes((s.en || "").toLowerCase().split(" ").pop()) || (s.aliases || []).some((a) => a.toLowerCase() === t));
  if (hit) return hit.key;
  const a = arFold(raw);
  const all = pool.flatMap((s) => [s.name, ...(s.aliases || [])].map((v) => [arFold(v), s.key])).filter(([v]) => /[؀-ۿ]/.test(v)).sort((p, q) => q[0].length - p[0].length);
  return all.find(([v]) => a === v || a.includes(v))?.[1];
}
const seatName = (x) => { const k = seatKey(x); return k ? state.byKey[k].name : x; };

function labelClass(l) {
  const u = String(l || "").toUpperCase().replace(/[’‘]/g, "'");
  return /DON'T|لا تنف/.test(u) ? "dont" : /RESHAPE|التشكيل|اعد|أعد/.test(u) ? "reshape" : /WAIT|انتظر/.test(u) ? "wait" : "go";
}
const votesLine = (v) => v ? `${v.endorse || 0} تأييد، ${v.amend || 0} تعديل، ${v.dissent || 0} اعتراض` : "";

function onVerdict(ev) {
  const v = ev.verdict;
  state.verdict = ev;
  setStep("verdict");
  setSpeaker(null);
  $("#caption").hidden = true;
  $("#cruxes").hidden = true;
  state.links = [];
  drawLinks();
  $("#stage").classList.remove("live");
  updateOptions(v.scores);
  const seats = ev.seats;
  const mk = seatKey(v.minority.seat);
  const short = (t, n) => esc(shorten(clean(t || ""), n));
  const html = `
    <div class="v-top">
      <div><div class="label">حكم المجلس</div><span class="v-label ${labelClass(v.label)}">${esc(verdictAr(v.label))}</span></div>
      <div class="actions"><button class="pill" type="button" data-pdf title="يفتح نافذة الطباعة: اختر «حفظ بصيغة PDF»">تحميل PDF</button><button class="ghost" data-close>رجوع للطاولة</button></div>
    </div>
    <p class="v-call" dir="rtl">${esc(v.call)}</p>
    <div class="v-grid">
      <div class="v-sec"><h3>الدرجات</h3><div class="v-opts">${state.options.map((o) => `
        <div class="opt ${o.id === v.recommended ? "lead" : ""}"><span class="id">${o.id}</span><span class="label" dir="rtl">${esc(o.label)}</span><span class="val">${v.scores[o.id]?.score ?? "-"}</span><span class="bar"><i style="width:${(v.scores[o.id]?.score || 0) * 10}%"></i></span></div>`).join("")}</div>
        <p class="v-meta">الثقة ${v.confidence ?? "-"}/10${v.votes ? ` · ${votesLine(v.votes)}` : ""}</p>
      </div>
      <div class="v-sec"><h3>لماذا</h3><ul class="v-why">${v.why.slice(0, 3).map((w) => { const k = seatKey(w.seat); return `<li>${k ? `<img class="av" src="${portrait(k)}" alt="">` : ""}<span dir="rtl">${short(w.point, 150)}</span></li>`; }).join("")}</ul></div>
      <div class="v-sec"><h3>انتبه</h3><div class="minority"><div class="who">${mk ? `<img class="av" src="${portrait(mk)}" alt="">` : ""}${esc(seatName(v.minority.seat))} ${seatKey(v.minority.seat) ? SIM_TAG : ""}</div><q dir="rtl">${short(v.minority.quote, 170)}</q></div></div>
      <div class="v-sec"><h3>الخطوات الجاية</h3><ul class="v-steps">${v.next_steps.slice(0, 3).map((n) => `<li dir="rtl"><b>${esc(n.when)}</b> ${short(n.action, 120)}</li>`).join("")}</ul>
        <p class="v-meta"><b>أوقفه إذا:</b> <span dir="rtl">${short(v.kill_criteria, 140)}</span></p></div>
    </div>
    <details class="v-more"><summary>التفاصيل كاملة</summary>
      <div class="v-grid">
        <div class="v-sec"><h3>وين اختلفوا</h3><ul>${v.fights.map((f) => `<li dir="rtl"><b>${esc(f.crux)}</b> ${esc(f.story)}</li>`).join("")}</ul></div>
        <div class="v-sec"><h3>الشروط</h3><ol>${v.conditions.map((c) => `<li dir="rtl">${esc(c)}</li>`).join("")}</ol></div>
        <div class="v-sec v-wide"><h3>بطاقة الدرجات</h3>
          <div class="table-scroll"><table class="scorecard"><thead><tr><th>المقعد</th><th>الوزن</th>${state.options.map((o) => `<th>${o.id}</th>`).join("")}<th>سطره الأخير</th></tr></thead><tbody>
          ${seats.map((x) => `<tr><td><span class="who"><img class="av" src="${portrait(x.key)}" alt="">${esc(nm(x.key))}</span></td><td class="n">${x.weight}</td>${state.options.map((o) => `<td class="n">${x.optionScores?.[o.id] ?? "-"}</td>`).join("")}<td class="line" dir="rtl">${short(x.oneLine, 150)}</td></tr>`).join("")}
          </tbody></table></div>
          <p class="muted" style="font-size:11.5px;margin-top:8px">موزونة حسب أهمية محور كل مقعد في هذا القرار. <bdi dir="ltr">${state.options.map((o) => `${o.id}: ${esc(v.scores[o.id]?.math || "")}`).join(" · ")}</bdi></p></div>
        <div class="v-sec"><h3>أرخص تجربة</h3><p dir="rtl">${esc(v.cheapest_test)}</p><h3>متى نراجع</h3><p dir="rtl">${esc(v.revisit)}</p></div>
        <div class="v-sec"><h3>أقوى اعتراض كاملًا</h3><p dir="rtl">${esc(v.minority.quote)}</p><p class="muted" dir="rtl">عشان يكون صح: ${esc(v.minority.would_have_to_be_true)}</p></div>
        ${v.amendments?.length ? `<div class="v-sec v-wide"><h3>التعديلات</h3><ul>${v.amendments.map((a) => `<li dir="rtl"><b>${esc(seatName(a.seat))}:</b> ${esc(a.amendment)} <span class="tag">${a.adopted ? "اعتُمد" : "ما اعتُمد"}: ${esc(a.reason)}</span></li>`).join("")}</ul></div>` : ""}
      </div>
    </details>
    <div class="v-foot"><span class="muted">${DISCLAIMER}</span><button class="ghost" data-close>رجوع للطاولة</button></div>`;
  $("#verdictBody").innerHTML = ltrDates(html);
  const plate = $("#plate");
  plate.hidden = false;
  plate.innerHTML = `<div class="label">حكم المجلس</div><span class="v-label ${labelClass(v.label)}">${esc(verdictAr(v.label))}</span><p dir="rtl">${esc(firstSentences(clean(v.call), 150))}</p><div class="row"><button type="button" id="plateOpen">اقرأ الحكم</button><button type="button" data-pdf>تحميل PDF</button><button type="button" class="alt" id="plateReplay">أعد الجلسة</button></div>`;
  $("#plateOpen").addEventListener("click", () => ($("#verdictSheet").hidden = false));
  $("#plateReplay").addEventListener("click", () => replay(state.session));
  $("#playbar").hidden = true;
  const f = document.createElement("div");
  f.className = "feed-note";
  f.innerHTML = `<b>الحكم: ${esc(verdictAr(v.label))}.</b> <span dir="rtl">${esc(firstSentences(clean(v.call), 160))}</span>`;
  feedAppend(f);
  setTimeout(() => { if (state.verdict === ev) $("#verdictSheet").hidden = false; }, 1600);
}

// ------------------------------------------------------------- history + replay
const isExample = (s) => /example/i.test(`${s.id} ${s.file || ""}`);
async function openHistory() {
  const { sessions } = await api.sessions();
  $("#historyList").innerHTML = sessions.length
    ? sessions.map((s) => `<li><button data-id="${esc(s.id)}"><b dir="rtl">${esc(s.title)}</b><small><span class="tag-council" data-council="${esc(s.council || "business")}">${esc(councilOf(s.council || "business")?.name || "")}</span>${isExample(s) ? '<span class="tag-ex">مثال لمتجر وهمي</span>' : ""}<bdi dir="ltr">${esc(s.id.slice(0, 10))}</bdi> · ${esc(MODE_AR[s.mode] || s.mode)} · ${esc(STATUS_AR[s.status] || s.status)}</small></button>${s.studio ? `<button class="pdf sd-hist" type="button" data-studio="${esc(s.id)}" title="افتح المعرض">المعرض <span class="num">${s.studio}</span></button>` : ""}${s.status === "done" ? `<button class="pdf" type="button" data-pdf="${esc(s.id)}" title="تحميل الحكم PDF">PDF</button>` : ""}</li>`).join("")
    : '<li class="muted">ما فيه جلسات للحين. اعقد المجلس مرة وبتظهر هنا.</li>';
  $$("#historyList button[data-studio]").forEach((b) => b.addEventListener("click", () => { $("#historyDialog").close(); enterStudio(b.dataset.studio); }));
  $$("#historyList button[data-id]").forEach((b) => b.addEventListener("click", () => { $("#historyDialog").close(); replay(b.dataset.id); }));
  $("#historyDialog").showModal();
}

async function replay(id) {
  const j = await api.session(id).catch(() => null);
  if (!j) return toast("ما لقينا ملفات هذي الجلسة.");
  state.unsub?.(); state.unsub = null;
  begin(id);
  connectStudio(id);
  state.replaying = true;
  for (const ev of j.events) {
    if (["delta", "usage", "seat_error", "end"].includes(ev.type)) continue;
    player.push(ev);
  }
}

// ------------------------------------------------------------- waiting on Claude Code
// A live council goes quiet for minutes while the seats write in parallel. Instead of a
// frozen table, say what is happening, how long it has been, and what each seat is weighing.
const SAME_TIME = "المستشارون يكتبون كلهم في نفس الوقت داخل Claude Code. كلامهم يظهر هنا أول ما تكتمل الجولة.";
function waitCopy(phase) {
  const n = state.setup?.mode === "quick" ? 2 : 3;
  return {
    setup: ["تجهيز الطاولة", "رئيس المجلس يجلّس المستشارين.", ""],
    round1: [`الجولة 1 من ${n}`, "المستشارون يكتبون مواقفهم الافتتاحية.", SAME_TIME],
    round2: [`الجولة 2 من ${n}`, "كل مستشار يقرأ كلام الباقين ويرد عليهم.", SAME_TIME],
    round3: [`الجولة 3 من ${n}`, "المستشارون يصوّتون على مقترح رئيس المجلس.", SAME_TIME],
    cruxes: ["بين الجولات", "رئيس المجلس يقرأ المواقف ويحدّد وين يختلفون.", "نقاط الخلاف تظهر هنا، وبعدها يبدأ النقاش."],
    draft: ["بين الجولات", "رئيس المجلس يحوّل النقاش لمقترح للتصويت.", "بعدها كل مستشار يصوّت عليه."],
    skip3: ["الخطوة الأخيرة", "رئيس المجلس يحسب الدرجات ويكتب الحكم.", "لما ينزل الحكم تقدر تحمّله PDF."],
    verdict: ["الخطوة الأخيرة", "رئيس المجلس يحسب الدرجات ويكتب الحكم.", "لما ينزل الحكم تقدر تحمّله PDF."],
  }[phase] || ["شغّالين", "المجلس شغّال.", ""];
}
const clock = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

function hideWait() {
  const w = $("#waitcard");
  if (w.hidden) return;
  w.hidden = true;
  $$(".seat.musing").forEach((e) => e.classList.remove("musing"));
  if (state.capWasShown) $("#caption").hidden = false;
  if (state.playbarWasShown) $("#playbar").hidden = false;
}

function tickWait() {
  const w = state.wait;
  const idle = !player.busy && !player.q.length;
  if (!w || !idle || state.replaying || !state.session || state.verdict) return hideWait();
  const card = $("#waitcard");
  if (card.hidden) {
    state.capWasShown = !$("#caption").hidden;
    $("#caption").hidden = true;
    $("#cruxes").hidden = true;
    // speed controls do nothing while the room waits, and they would cover the card
    state.playbarWasShown = !$("#playbar").hidden;
    $("#playbar").hidden = true;
    card.hidden = false;
    state.museAt = 0;
  }
  const [step, head, sub] = waitCopy(w.phase);
  const elapsed = Date.now() - w.at;
  $("#wcStep").textContent = step;
  $("#wcTime").textContent = clock(elapsed);
  $("#wcHead").textContent = head;
  $("#wcSub").textContent = sub;
  $("#wcNudge").hidden = elapsed < 4 * 60 * 1000;
  const round = Number((w.phase.match(/^round(\d)$/) || [])[1]) || 0;
  const bar = $("#wcBar").parentElement;
  const muse = $("#wcMuse");
  if (round) {
    const seats = state.active.length ? state.active : state.seats.map((s) => s.key);
    const done = seats.filter((k) => state.cards[round][k]).length;
    bar.classList.toggle("indeterminate", done === 0);
    $("#wcBar").style.width = done ? Math.round((done / seats.length) * 100) + "%" : "";
    // every few seconds, show what one of the still-thinking seats is weighing
    const pending = seats.filter((k) => !state.cards[round][k]);
    if (pending.length && Date.now() - (state.museAt || 0) > 5200) {
      state.museAt = Date.now();
      state.museIdx = ((state.museIdx ?? -1) + 1) % pending.length;
      const s = state.byKey[pending[state.museIdx]];
      muse.classList.add("fade");
      setTimeout(() => {
        muse.innerHTML = "<b>" + esc(s.name) + "</b> " + verb(s.key, "يفكّر:", "تفكّر:") + " " + esc(s.question || s.pillar || "") + (done ? " · وصل " + done + " من " + seats.length : "");
        muse.classList.remove("fade");
        $$(".seat").forEach((el) => el.classList.toggle("musing", el.dataset.seat === s.key));
      }, 300);
    }
  } else {
    bar.classList.add("indeterminate");
    $("#wcBar").style.width = "";
    muse.textContent = "";
    $$(".seat.musing").forEach((e) => e.classList.remove("musing"));
  }
}

// the three councils on the home screen: roster faces, what each is for, and its command
function councilsHtml() {
  return `<div class="councils"><h4 class="councils-h">المجالس</h4>${state.councils.map((c) => `
    <div class="council-card${c.key === state.council ? " on" : ""}" data-council="${esc(c.key)}">
      <button type="button" class="cc-main" data-pick-council="${esc(c.key)}" aria-label="اعرض ${esc(c.name)} على الطاولة">
        <span class="cc-name">${esc(c.name)}</span>
        <span class="cc-tag">${esc(c.tagline || "")}</span>
        <span class="cc-faces">${c.seats.map((k) => state.byKey[k]).filter(Boolean).map((s) => `<img src="${portrait(s.key)}" alt="" title="${esc(s.name)}">`).join("")}</span>
        <span class="cc-roster">${c.seats.map((k) => esc(state.byKey[k]?.shortAr || state.byKey[k]?.name || k)).join(" · ")}</span>
      </button>
      <div class="cc-cmd"><code dir="ltr">${esc(c.command || CMD)} …</code><button type="button" class="ghost" data-copy-cmd="${esc(c.command || CMD)}">انسخ</button></div>
    </div>`).join("")}
    <p class="note">بدون تحديد، رئيس المجلس يختار المجلس المناسب من قرارك ويقولك أي واحد. تقدر تحدده بنفسك: <code dir="ltr">--council creative</code></p></div>`;
}
function renderCouncilTabs() {
  const el = $("#councilTabs");
  if (!el) return;
  el.innerHTML = state.councils.map((c) => `<button type="button" data-pick-council="${esc(c.key)}" data-council="${esc(c.key)}" aria-pressed="${c.key === state.council}">${esc(c.short || c.name)}</button>`).join("");
}

function openGuide() {
  $("#guideBody").innerHTML = GUIDE;
  const d = $("#guideDialog");
  if (!d.open) d.showModal();
}

// ------------------------------------------------------------- PDF (Arabic, via print)
// jsPDF can't shape Arabic, so the report is real HTML: an A4, right-to-left print view
// styled for paper. The browser's print dialog saves it as a PDF with correct Arabic.
async function savePdf(btn) {
  const id = btn.dataset.pdf;
  btn.disabled = true;
  try {
    let setup = state.setup, verdict = state.verdict;
    if (id) { // a past session from the history list
      const j = await api.session(id);
      setup = j.events.find((e) => e.type === "setup");
      verdict = [...j.events].reverse().find((e) => e.type === "verdict");
    }
    if (!setup || !verdict) throw new Error("هذي الجلسة ما لها حكم للحين.");
    if ($("#historyDialog").open) $("#historyDialog").close();
    await printReport({ setup, verdict, id: id || state.session });
  } catch (e) {
    console.error(e);
    toast("ما قدرنا نجهّز الـPDF: " + (e.message || e));
  } finally {
    btn.disabled = false;
  }
}

const dateLine = (id) => {
  const m = String(id || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date();
  try { return d.toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "long", year: "numeric" }); } catch { return d.toISOString().slice(0, 10); }
};

function reportHtml({ setup, verdict: ev, id }) {
  const v = ev.verdict;
  const seats = ev.seats || [];
  const options = setup.options || [];
  const T = (t) => esc(clean(t));
  const n = seats.length || (setup.seats || []).length;
  const rounds = v.votes ? 3 : 2;
  const av = (k) => (k && state.byKey[k] ? `<img class="r-av" src="${portrait(k)}" alt="">` : "");
  const sec = (title, body) => (body ? `<section class="r-sec"><h2>${title}</h2>${body}</section>` : "");
  const li = (label, text) => `<li dir="rtl">${label ? `<b>${esc(label)}</b> ` : ""}${T(text)}</li>`;
  return `
  <article class="report">
    <header class="r-head">
      <div class="r-brand"><img src="${CHAIR_AV}" alt=""><div><b>${esc(councilOf(setup.council || "business")?.name || "المجلس")}</b><span>${esc(councilOf(setup.council || "business")?.tagline || "")}</span></div></div>
      <div class="r-date">تقرير الحكم<br><span>${esc(dateLine(id))}</span></div>
    </header>
    <div class="r-kicker">القرار</div>
    <h1 dir="rtl">${esc(setup.title || "قرار بدون عنوان")}</h1>
    <p class="r-meta">${setup.mode === "quick" ? "مجلس سريع" : "المجلس الكامل"} · ${n} مقاعد · ${rounds} جولات</p>
    ${setup.decision ? `<p class="r-decision" dir="rtl">${T(setup.decision)}</p>` : ""}

    <div class="r-verdict">
      <div class="r-vtop"><span class="r-badge ${labelClass(v.label)}">${esc(verdictAr(v.label))}</span><span class="r-en">${esc(v.label || "")}</span><span class="r-kicker">قرار المجلس</span></div>
      <p class="r-call" dir="rtl">${T(v.call)}</p>
      <p class="r-meta">الثقة ${v.confidence ?? "-"}/10${v.votes ? ` · ${votesLine(v.votes)}` : ""}</p>
    </div>

    ${sec("الدرجات", `<div class="r-opts">${options.map((o) => { const sc = v.scores?.[o.id]?.score; const best = o.id === v.recommended; return `<div class="r-opt${best ? " best" : ""}"><span class="id">${o.id}</span><span class="lab" dir="rtl">${esc(o.label)}${best ? ' <em>الموصى به</em>' : ""}</span><span class="bar"><i style="width:${(sc || 0) * 10}%"></i></span><span class="val">${sc ?? "-"}</span></div>`; }).join("")}</div><p class="r-note">كل مستشار يقيّم كل خيار من 1 إلى 10، موزونة حسب أهمية محوره في هذا القرار.</p>`)}

    ${sec("لماذا وصل المجلس لهذا", v.why?.length ? `<ul class="r-list">${v.why.slice(0, 4).map((w) => `<li dir="rtl">${av(seatKey(w.seat))}<span><b>${esc(seatName(w.seat))}</b> ${seatKey(w.seat) ? '<span class="r-sim">محاكاة</span>' : ""}<b>:</b> ${T(w.point)}</span></li>`).join("")}</ul>` : "")}

    ${sec("كيف قيّم كل مقعد", seats.length ? `<table class="r-table"><thead><tr><th>المقعد</th><th>الوزن</th>${options.map((o) => `<th>${o.id}</th>`).join("")}${v.votes ? "<th>التصويت</th>" : ""}</tr></thead><tbody>${seats.map((s) => `<tr><td class="who">${av(s.key)}${esc(state.byKey[s.key]?.name || s.key)} <span class="r-sim">محاكاة</span></td><td class="n">${s.weight ?? "-"}</td>${options.map((o) => `<td class="n">${s.optionScores?.[o.id] ?? "-"}</td>`).join("")}${v.votes ? `<td>${esc(VOTE_AR[s.stance] || stanceWord(s.stance))}</td>` : ""}</tr>`).join("")}</tbody></table>` : "")}

    ${sec("انتبه", v.minority?.quote ? `<blockquote dir="rtl"><b>${esc(seatName(v.minority.seat))}</b> <span class="r-sim">محاكاة</span><b>:</b> «${T(v.minority.quote)}»</blockquote>${v.minority.would_have_to_be_true ? `<p class="r-note" dir="rtl">عشان يكون هذا الرأي صح: ${T(v.minority.would_have_to_be_true)}</p>` : ""}` : "")}

    ${sec("وش تسوي بعدها", (v.next_steps?.length || v.cheapest_test || v.kill_criteria) ? `<ul class="r-steps">${(v.next_steps || []).slice(0, 3).map((s) => li(s.when, s.action)).join("")}${v.cheapest_test ? li("أرخص تجربة:", v.cheapest_test) : ""}${v.kill_criteria ? li("أوقفه إذا:", v.kill_criteria) : ""}</ul>` : "")}

    ${sec("الشروط", v.conditions?.length ? `<ol class="r-steps">${v.conditions.map((c) => `<li dir="rtl">${T(c)}</li>`).join("")}</ol>` : "")}

    ${sec("وين اختلفوا", v.fights?.length ? `<ul class="r-steps">${v.fights.slice(0, 3).map((f) => li(f.crux, f.story)).join("")}</ul>` : "")}

    <footer class="r-foot"><span>${DISCLAIMER}</span><span>${esc(councilOf(setup.council || "business")?.name || "المجلس")} · مشتق من <bdi>Roast Room (MIT)</bdi></span></footer>
  </article>`;
}

async function printReport(args) {
  const pv = $("#printView");
  pv.innerHTML = ltrDates(reportHtml(args));
  // wait for the avatars and the Arabic fonts so the PDF never prints half-loaded
  await Promise.all($$("img", pv).map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
  try { await document.fonts.ready; } catch { /* ignore */ }
  const oldTitle = document.title;
  // the browser suggests the page title as the PDF file name
  document.title = `${councilOf(args.setup.council || "business")?.name || "المجلس"} - ${String(args.setup.title || args.id || "الحكم").replace(/[\\/:*?"<>|]+/g, "").slice(0, 80)}`;
  document.body.classList.add("printing");
  const done = () => { document.body.classList.remove("printing"); document.title = oldTitle; window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  toast("من نافذة الطباعة اختر «حفظ بصيغة PDF».");
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.print();
  setTimeout(done, 1500); // some browsers never fire afterprint
}

// ------------------------------------------------------------- misc
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 6000);
}
async function refreshUsage() {
  const u = DATA.mode === "server" ? await fetch("api/usage").then((x) => x.json()).catch(() => null) : null;
  if (!u || !u.calls) { $("#usage").textContent = ""; return; }
  const k = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1000)}k`);
  $("#usage").textContent = `${u.calls} طلب · ${k(u.input + u.cacheRead + u.cacheWrite)} دخل · ${k(u.output)} خرج`;
}

// ------------------------------------------------------------- «المعرض» (the studio wall)
// After a creative verdict, /majlis studio renders 20-30+ designs into sessions/<id>/studio/.
// The wall streams them in as designs.json grows; the seat that made each one says why, at the table.
const FORMAT_AR = { "1:1": "مربع 1:1", "4:5": "فيد 4:5", "9:16": "ستوري 9:16", "lp-hero": "واجهة صفحة هبوط", "16:9": "عريض 16:9", "logo": "هوية وشعار" };
const AWARE_AR = { "unaware": "غير واعي", "problem-aware": "واعي بالمشكلة", "solution-aware": "واعي بالحل", "product-aware": "يعرف المنتج", "most-aware": "الأكثر وعيًا" };
const fmtAr = (f) => FORMAT_AR[f] || f || "";
state.studio = { id: null, es: null, list: [], filter: { seat: "", angle: "", format: "" }, open: false };

function studioReset() {
  state.studio.es?.close();
  Object.assign(state.studio, { id: null, es: null, list: [], filter: { seat: "", angle: "", format: "" } });
  closeStudio();
  $("#studioBtn").hidden = true;
  $("#sdWall").innerHTML = "";
}

/** Listen to a session's studio. Quiet when there is none; the «المعرض» button appears with the first design. */
function connectStudio(id) {
  const st = state.studio;
  if (st.id === id && st.es) return;
  st.es?.close();
  Object.assign(st, { id, list: [], filter: { seat: "", angle: "", format: "" } });
  $("#sdWall").innerHTML = "";
  let close = null;
  const es = { close: () => close?.() };
  st.es = es;
  close = subscribeStudio(id, (ev) => {
    if (state.studio.id !== id) return es.close();
    if (ev.type === "snapshot") {
      st.list = ev.designs || [];
      st.meta = { brand: ev.brand, image_tool: ev.image_tool };
      renderStudio({ stagger: true });
    } else if (ev.type === "design") {
      st.list.push(ev.design);
      addStudioCard(ev.design);
      if (!st.list.some((d) => d.id !== ev.design.id) && !st.open) toast("الاستوديو بدأ: أول تصميم وصل للمعرض.");
      player.push({ type: "studio_design", design: ev.design });
    } else if (ev.type === "design_update") {
      const i = st.list.findIndex((d) => d.id === ev.design.id);
      if (i >= 0) st.list[i] = ev.design; else st.list.push(ev.design);
      renderStudio({ landed: ev.design.id });
    }
  });
}

function studioCounts() {
  const n = state.studio.list.length;
  $("#studioBtn").hidden = !n;
  $("#studioCount").textContent = n ? String(n) : "";
  const logos = state.studio.list.filter((d) => d.kind === "logo").length;
  const seats = new Set(state.studio.list.map((d) => d.seat)).size;
  const flagged = state.studio.list.filter((d) => d.status === "flagged").length;
  $("#sdSub").innerHTML = n
    ? `<b class="num">${n - logos}</b> تصميم إعلاني · <b class="num">${logos}</b> استكشاف هوية · من <b class="num">${seats}</b> مقاعد${flagged ? ` · <span class="sd-warn"><b class="num">${flagged}</b> تحتاج مراجعة</span>` : ""}${state.studio.meta?.brand ? ` · ${esc(state.studio.meta.brand)}` : ""}`
    : "بانتظار أول تصميم.";
  $("#sdEmpty").hidden = Boolean(n);
  $("#sdAll").href = DATA.mode === "server" ? `studio-list/${encodeURIComponent(state.studio.id || "")}` : "#";
}

const sdMatch = (d) => { const f = state.studio.filter; return (!f.seat || d.seat === f.seat) && (!f.angle || d.angle === f.angle) && (!f.format || d.format === f.format); };

function renderFilters() {
  const L = state.studio.list, f = state.studio.filter;
  const uniq = (k) => [...new Set(L.map((d) => d[k]).filter(Boolean))];
  const chip = (k, v, label, extra = "") => `<button type="button" class="sd-chip${f[k] === v ? " on" : ""}" data-f="${k}" data-v="${esc(v)}" aria-pressed="${f[k] === v}">${extra}${label}</button>`;
  const seats = uniq("seat").sort((a, b) => state.seats.findIndex((s) => s.key === a) - state.seats.findIndex((s) => s.key === b));
  $("#sdFilters").innerHTML = `
    <div class="sd-row"><span class="sd-lab">المقعد</span>${chip("seat", "", "الكل")}${seats.map((k) => chip("seat", k, esc(nm(k)), `<img src="${portrait(k)}" alt="">`)).join("")}</div>
    <div class="sd-row"><span class="sd-lab">الزاوية</span>${chip("angle", "", "الكل")}${uniq("angle").map((a) => chip("angle", a, esc(a))).join("")}</div>
    <div class="sd-row"><span class="sd-lab">المقاس</span>${chip("format", "", "الكل")}${uniq("format").map((x) => chip("format", x, esc(fmtAr(x)))).join("")}</div>`;
}

function cardHtmlFor(d, i, { stagger, landed }) {
  const cls = ["sd-card", d.kind === "logo" ? "logo" : "", d.status === "flagged" ? "flagged" : "", landed === d.id ? "landed" : ""].filter(Boolean).join(" ");
  return `<figure class="${cls}" data-id="${esc(d.id)}" style="--i:${stagger ? Math.min(i, 24) : 0}">
    <button type="button" class="sd-img" aria-label="افتح التصميم: ${esc(d.headline_ar || d.hook_ar)}">${designMedia(d)}</button>
    <figcaption>
      <div class="sd-meta"><span class="sd-who"><img src="${portrait(d.seat)}" alt="">${esc(nm(d.seat))}${SIM_TAG}</span><span class="sd-fmt">${esc(fmtAr(d.format))}</span></div>
      <p class="sd-hook" dir="rtl">${esc(String(d.hook_ar || d.headline_ar || "").replace(/\s*\/\s*/g, " "))}</p>
      <div class="sd-tags"><span>${esc(d.angle || "")}</span>${d.awareness && AWARE_AR[d.awareness] ? `<span>${esc(AWARE_AR[d.awareness])}</span>` : ""}${d.status === "flagged" ? '<span class="warn">يحتاج مراجعة</span>' : ""}</div>
    </figcaption>
  </figure>`;
}

function renderStudio({ stagger = false, landed = null } = {}) {
  studioCounts();
  renderFilters();
  const L = state.studio.list.filter(sdMatch).slice().reverse(); // newest first: the wall grows from the top
  $("#sdWall").innerHTML = L.map((d, i) => cardHtmlFor(d, i, { stagger, landed })).join("");
  $("#sdWall").classList.toggle("stagger", stagger);
  refit(($("#sdWall")));
}

/** A live design: put it at the top of the wall without rebuilding (no flicker for the others). */
function addStudioCard(d) {
  studioCounts();
  renderFilters();
  if (!sdMatch(d)) return;
  $("#sdWall").classList.remove("stagger");
  $("#sdWall").insertAdjacentHTML("afterbegin", cardHtmlFor(d, 0, { landed: d.id }));
  refit(($("#sdWall")));
}

function openStudio() {
  state.studio.open = true;
  document.body.classList.add("studio-open");
  $("#studio").hidden = false;
  $("#studioBtn").setAttribute("aria-pressed", "true");
  // the table stays in view above the wall, so a seat can talk while its design lands
  requestAnimationFrame(() => { layoutStage(); drawLinks(); window.scrollTo({ top: Math.max(0, $("#stage").getBoundingClientRect().top + scrollY - 70), behavior: "smooth" }); });
}
function closeStudio() {
  state.studio.open = false;
  document.body.classList.remove("studio-open");
  $("#studio").hidden = true;
  $("#studioBtn")?.setAttribute("aria-pressed", "false");
  requestAnimationFrame(() => { layoutStage(); drawLinks(); });
}

/** Open a session straight on its wall (from «الجلسات السابقة»): seat the table, skip the debate. */
async function enterStudio(id) {
  const j = await api.session(id).catch(() => null);
  const setup = j?.events?.find((e) => e.type === "setup");
  begin(id);
  state.replaying = true;
  $("#playbar").hidden = true;
  if (setup) { state.setup = setup; onSetup(setup); }
  const v = [...(j?.events || [])].reverse().find((e) => e.type === "verdict");
  if (v?.verdict?.scores) updateOptions(v.verdict.scores);
  setStep("verdict");
  chairSays("الاستوديو مفتوح. كل مقعد يعلّق تصاميمه على الجدار.", { tag: "المعرض" });
  connectStudio(id);
  openStudio();
}

async function onStudioDesign(d) {
  if (state.studio.id !== state.session) return;
  const card = $(`.sd-card[data-id="${CSS.escape(d.id)}"]`);
  card?.classList.add("hot");
  const atTable = state.seats.some((s) => s.key === d.seat);
  if (atTable) {
    const line = firstSentences(clean(d.rationale_ar || d.headline_ar || ""), 150) || "هذا تصميمي.";
    await speak(d.seat, line, { tag: `${verb(d.seat, "يعرض", "تعرض")} تصميم · ${fmtAr(d.format)}`, subNow: true, sub: `<span class="cap-design">${isHtmlDesign(d) ? "" : `<img src="${esc(d.thumb_url || d.url)}" alt="">`}<span dir="rtl">${esc(String(d.headline_ar || "").replace(/\s*\/\s*/g, " "))}</span></span>` });
    setSpeaker(null);
  } else await player.sleep(600);
  card?.classList.remove("hot");
}

function playStudioShow() {
  if (!state.studio.list.length) return;
  player.reset();
  for (const d of state.studio.list.filter(sdMatch)) player.push({ type: "studio_design", design: d });
  $("#stage").scrollIntoView({ behavior: "smooth", block: "start" });
}

// lightbox
function openDesign(id) {
  const L = state.studio.list.filter(sdMatch);
  const i = L.findIndex((d) => d.id === id);
  const d = L[i];
  if (!d) return;
  const rl = d.redlines || {};
  const s = state.byKey[d.seat];
  $("#sdBoxBody").innerHTML = `
    <div class="sd-box-in">
      <div class="sd-box-img">${designMedia(d, true)}</div>
      <div class="sd-box-info">
        <div class="sd-who big"><img src="${portrait(d.seat)}" alt="">${esc(s?.name || d.seat)}${SIM_TAG}</div>
        <h3 dir="rtl">${esc(String(d.headline_ar || "").replace(/\s*\/\s*/g, " "))}</h3>
        ${d.subline_ar ? `<p class="muted" dir="rtl">${esc(String(d.subline_ar).replace(/\s*\/\s*/g, " "))}</p>` : ""}
        <dl class="sd-dl">
          <div><dt>الزاوية</dt><dd>${esc(d.angle || "-")}</dd></div>
          ${d.awareness ? `<div><dt>مرحلة الوعي</dt><dd>${esc(AWARE_AR[d.awareness] || d.awareness)}</dd></div>` : ""}
          <div><dt>المقاس</dt><dd>${esc(fmtAr(d.format))} <bdi dir="ltr" class="muted">${d.width || ""}×${d.height || ""}</bdi></dd></div>
          ${d.hook_ar ? `<div><dt>الهوك</dt><dd dir="rtl">${esc(d.hook_ar)}</dd></div>` : ""}
        </dl>
        ${d.rationale_ar ? `<p class="sd-why" dir="rtl"><b>${verb(d.seat, "ليش صممه كذا", "ليش صممته كذا")}:</b> ${esc(d.rationale_ar)}</p>` : ""}
        <div class="sd-rl ${rl.pass === false || d.status === "flagged" ? "bad" : "ok"}"><b>الخطوط الحمراء:</b> ${rl.pass === false ? (rl.flags || []).map(esc).join("، ") : "سليم في النص، والصورة بدون وجوه مولّدة."}</div>
        ${d.prompt ? `<details class="sd-prompt"><summary>وصف الصورة للمولّد (بدون نص)</summary><p dir="ltr">${esc(d.prompt)}</p></details>` : ""}
        <div class="sd-box-actions">
          <a class="pill" href="${esc(dlUrl(d))}" download>${dlLabel(d)}</a>
          <button class="ghost" type="button" data-sd-nav="1" ${i + 1 >= L.length ? "disabled" : ""}>التالي</button>
          <button class="ghost" type="button" data-sd-nav="-1" ${i <= 0 ? "disabled" : ""}>السابق</button>
          <button class="ghost" type="button" data-sd-close>إغلاق</button>
        </div>
      </div>
    </div>`;
  $("#sdBoxBody").dataset.id = d.id;
  const dlg = $("#sdBox");
  if (!dlg.open) dlg.showModal();
  refit(($("#sdBoxBody")));
}

/** «تحميل الكل» without a server: the same list page, built here from the wall's records. */
function openStudioList() {
  const abs = (u) => new URL(u, location.href).href;
  const L = state.studio.list;
  const rows = L.map((d) => `<li><a href="${esc(abs(d.url))}" target="_blank">${isHtmlDesign(d) ? '<span class="h">HTML</span>' : `<img src="${esc(abs(d.thumb_url || d.url))}" alt="" loading="lazy">`}</a><div><b>${esc(String(d.headline_ar || d.hook_ar || "").replace(/\s*\/\s*/g, " "))}</b><small>${esc(d.seat)} · ${esc(d.format)} · ${esc(d.angle || "")}${d.status === "flagged" ? " · يحتاج مراجعة" : ""}</small><a class="dl" href="${esc(abs(d.url))}" download>${esc(String(d.file).split("/").pop())}</a></div></li>`).join("");
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>المعرض: كل التصاميم</title><style>body{margin:0;background:#0b0f12;color:#e8ecec;font:15px/1.6 Cairo,Tahoma,sans-serif;padding:24px 16px}p{color:#98a6ab}ul{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}li{background:#12181c;border:1px solid rgba(220,235,240,.1);border-radius:14px;overflow:hidden}li img{width:100%;display:block;aspect-ratio:1;object-fit:contain;background:#000}.h{display:grid;place-items:center;aspect-ratio:1;background:#000;color:#d9b878}li div{padding:10px 12px;display:grid;gap:2px}small{color:#98a6ab}.dl{color:#d9b878;font-weight:600;text-decoration:none;direction:ltr;text-align:right;overflow-wrap:anywhere}</style></head><body><h1>المعرض: ${L.length} تصميم</h1><p>${esc(state.studio.meta?.brand || "")} · مقترحات من مقاعد محاكاة. راجعها قبل أي نشر.</p><ul>${rows}</ul></body></html>`;
  const w = window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
  if (!w) toast("المتصفح منع النافذة. اسمح بالنوافذ المنبثقة وجرّب مرة ثانية.");
}

function bindStudio() {
  $("#studioBtn").addEventListener("click", () => (state.studio.open ? closeStudio() : openStudio()));
  $("#sdAll").addEventListener("click", (e) => { if (DATA.mode !== "server") { e.preventDefault(); openStudioList(); } });
  new ResizeObserver(() => fitFrames($("#sdWall"))).observe($("#sdWall"));
  $("#sdClose").addEventListener("click", () => { closeStudio(); $("#stage").scrollIntoView({ behavior: "smooth" }); });
  $("#sdPlay").addEventListener("click", playStudioShow);
  $("#sdFilters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]"); if (!b) return;
    state.studio.filter[b.dataset.f] = b.dataset.v;
    renderStudio();
  });
  $("#sdWall").addEventListener("click", (e) => { const c = e.target.closest(".sd-card"); if (c) openDesign(c.dataset.id); });
  $("#sdBox").addEventListener("click", (e) => {
    if (e.target.id === "sdBox" || e.target.closest("[data-sd-close]")) return $("#sdBox").close();
    const nav = e.target.closest("[data-sd-nav]");
    if (nav) step(Number(nav.dataset.sdNav));
  });
  const step = (dir) => {
    const L = state.studio.list.filter(sdMatch), i = L.findIndex((d) => d.id === $("#sdBoxBody").dataset.id);
    const n = L[i + dir]; if (n) openDesign(n.id);
  };
  // in right-to-left reading, the left arrow is "next"
  $("#sdBox").addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") step(1); if (e.key === "ArrowRight") step(-1); });
}

boot();
