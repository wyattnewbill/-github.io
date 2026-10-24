/* ============================================================
   EDIT YOUR DETAILS HERE (used on every page)
   ============================================================ */
const SITE = {
  name: "Wyatt Newbill",
  email: "bibliophile775@gmail.com",
  instagram: "https://www.instagram.com/wnewbill/",
  linkedin: "https://www.linkedin.com/in/wyatt-newbill-6039052ab/",
  medium: "https://medium.com/@bibliophile775",
  tagline: "Dream beyond. Wonder here."
};
// What the menu shows beside each link as you turn the wheel: [picture, one line]
const PEEK = {
  "index.html": ["hero.jpg", "The front door. Dream beyond. Wonder here."],
  "fiction.html": ["images/the-lighthouse.jpg", "Short stories, flash fiction, a novella and a novel."],
  "screenplays.html": ["images/spar.jpg", "Short films and a first feature. Spar and Thannitus were filmed in July 2026."],
  "essays.html": ["images/the-question-of-us.jpg", "Essays, and a research paper on science fiction and awe."],
  "about.html": ["portrait.jpg?v=3", "Who's writing all this, and what happens off the page."],
  "blog.html": ["images/life/pier.jpg", "Notes and short pieces."],
  "#contact": ["images/life/lake.jpg", "Say hello, or ask about a full text."]
};
// Navigation links: [label, address]
const NAV = [["Home","index.html"],["Fiction","fiction.html"],["Screenplays","screenplays.html"],["Essays","essays.html"],["About","about.html"],["Blog","blog.html"],["Contact","#contact"]];

/* ---------- helpers ---------- */
const byId = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const fmt = d => new Date(d + "T12:00:00").toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});

// Tiny markdown renderer: headings, paragraphs, bold, italics, links, blockquotes, hr.
function md(src){
  // a backslash before an asterisk (\*) shows a literal asterisk instead of starting italics
  const inline = s => esc(s).replace(/\\\*/g,"\u0001").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2">$1</a>').replace(/\u0001/g,"*");
  return src.trim().split(/\n{2,}/).map(b => {
    b = b.trim();
    if (/^---+$/.test(b)) return "<hr>";
    const h = b.match(/^(#{1,3})\s+(.*)/);
    if (h) return `<h${h[1].length+1}>${inline(h[2])}</h${h[1].length+1}>`;
    if (b.startsWith(">")) return `<blockquote>${inline(b.replace(/^>\s?/gm,""))}</blockquote>`;
    return `<p>${inline(b).replace(/\n/g,"<br>")}</p>`;
  }).join("\n");
}
// Short plain-text preview of a post (the admin page uses this when you publish).
function excerptOf(s){
  const t = s.replace(/^#+\s.*$/gm,"").replace(/\[(.*?)\]\(.*?\)/g,"$1").replace(/[>*_`]/g,"").replace(/\s+/g," ").trim();
  return t.length > 170 ? t.slice(0,170).replace(/\s\S*$/,"") + "…" : t;
}

/* ---------- blog ---------- */
async function posts(){
  const r = await fetch("posts/posts.json", {cache: "no-cache"});
  return (await r.json()).sort((a,b) => b.date.localeCompare(a.date));
}
async function renderList(el, limit){
  try{
    let list = await posts(); if (limit) list = list.slice(0,limit);
    el.innerHTML = list.map((p,i) => `<li class="reveal" style="--d:${i*.06}s"><time>${fmt(p.date)}</time><div><a href="post.html?p=${encodeURIComponent(p.slug)}">${esc(p.title)}</a>${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ""}</div></li>`).join("");
  }catch(e){ el.innerHTML = "<li>Posts will appear here once the site is served from a web host.</li>"; }
  refreshFX();
}
async function renderPost(){
  const slug = new URLSearchParams(location.search).get("p"), body = byId("post");
  try{
    const list = await posts(), i = list.findIndex(p => p.slug === slug);
    if (i < 0) throw new Error("missing");
    const p = list[i], text = await (await fetch(`posts/${encodeURIComponent(slug)}.md`, {cache: "no-cache"})).text();
    const link = q => `<a href="post.html?p=${encodeURIComponent(q.slug)}">${esc(q.title)}</a>`;
    document.title = `${p.title} — ${SITE.name}`;
    byId("post-title").textContent = p.title; byId("post-date").textContent = fmt(p.date);
    body.innerHTML = `<div class="pbody">${md(text)}</div><nav class="pn"><span>${list[i+1] ? "← " + link(list[i+1]) : ""}</span><span>${list[i-1] ? link(list[i-1]) + " →" : ""}</span></nav>`;
  }catch(e){ byId("post-title").textContent = "Not found"; body.innerHTML = '<p>That piece couldn\'t be found. <a href="blog.html">All posts</a></p>'; }
  refreshFX();
}

/* ---------- portfolio (reads works.json) ---------- */
const SECTIONS = {fiction:"Fiction", screenplays:"Screenplays", essays:"Essays"};
let _works; const loadWorks = () => _works || (_works = fetch("works.json", {cache: "no-cache"}).then(r => r.json()));
const workLink = w => `work.html?w=${encodeURIComponent(w.slug)}`;
const reqLink = (w, subj) => `mailto:${SITE.email}?subject=${encodeURIComponent(subj + ": " + w.title)}`;
// images fade in once loaded instead of popping in
const pic = w => `<img src="${esc(w.image)}" alt="" loading="lazy" onload="this.classList.add('ok')" style="object-position:${esc(w.focus || "50% 50%")}">`;
// "Short story · In progress" — "Finished" is the default, so it isn't shown
const meta = w => [w.format, w.status !== "Finished" && w.status].filter(Boolean).map(esc).join(" · ");
const tag = w => w.access === "excerpt" ? "Excerpt" : w.access === "none" ? "On request" : "";

// Homepage: a big numbered opener, then a horizontal film strip of that section's work
async function renderShelves(){
  try{
    const ws = await loadWorks();
    document.querySelectorAll(".shelf").forEach(el => {
      const sec = el.dataset.section, all = ws.filter(w => w.section === sec);
      const pick = [...all.filter(w => w.featured), ...all.filter(w => !w.featured)].slice(0, 6);
      const sc = sec === "screenplays" ? " script-font" : "";
      el.innerHTML = `<span class="ring" aria-hidden="true"></span><div class="opener reveal"><span class="num">${el.dataset.num}</span><h2 class="${sc}">${SECTIONS[sec]}</h2><a href="${sec}.html">All ${all.length} &rarr;</a></div>
        <div class="strip" tabindex="0" aria-label="${SECTIONS[sec]}">${pick.map(w => `<a class="still tone" href="${workLink(w)}" style="--ac:${w.accent}">${pic(w)}<span class="st${sc}">${esc(w.title)}</span><span class="sl">${meta(w)}</span>${w.date ? `<span class="sr">${esc(w.date)}</span>` : ""}</a>`).join("")}</div>
        <div class="strip-nav"><button aria-label="Previous" data-d="-1">&larr;</button><button aria-label="Next" data-d="1">&rarr;</button></div>`;
      const strip = el.querySelector(".strip");
      el.querySelectorAll(".strip-nav button").forEach(b => b.onclick = () => strip.scrollBy({left: b.dataset.d * strip.querySelector(".still").offsetWidth, behavior: "smooth"}));
    });
  }catch(e){ document.querySelectorAll(".shelf").forEach(el => el.innerHTML = "<p class='sec'>Work appears here once the site is served from a web host.</p>"); }
  refreshFX();
}
// Fiction / Screenplays / Essays pages: a reel of large frames that scrolls sideways.
// A mouse wheel moves it sideways too; once you reach either end the page scrolls as usual.
// The frame in the middle tints the page with its colour.
async function renderSection(){
  const el = byId("list"), sec = el.dataset.section;
  try{
    const ws = (await loadWorks()).filter(w => w.section === sec);
    const sc = sec === "screenplays" ? " script-font" : "";
    document.body.dataset.section = sec;
    const order = [...ws.filter(w => w.status !== "In progress"), ...ws.filter(w => w.status === "In progress")];
    el.innerHTML = `<section class="reel"><div class="reel-pin" tabindex="0" aria-label="${SECTIONS[sec]}, scroll sideways"><div class="reel-track">
      <div class="reel-card"><h1 class="pagetitle${sc}">${SECTIONS[sec]}</h1><p class="tm">${ws.length} works &rarr;</p></div>
      ${order.map((w, i) => `<a class="frame16 tone" href="${workLink(w)}" style="--ac:${w.accent}">${pic(w)}<span class="fcap"><span class="fn">${String(i + 1).padStart(2, "0")}</span><span class="ft${sc}">${esc(w.title)}${w.subtitle ? ` <small>${esc(w.subtitle)}</small>` : ""}</span><span class="sl">${meta(w)}${tag(w) ? ` · ${tag(w)}` : ""}</span></span>${w.date ? `<span class="sr">${esc(w.date)}</span>` : ""}</a>`).join("")}
    </div></div><div class="reel-foot" aria-hidden="true"><span class="reel-count"><b>01</b> / ${String(order.length).padStart(2, "0")}</span><span class="reel-bar"><i></i></span></div></section>`;
    const reel = el.querySelector(".reel"), pin = el.querySelector(".reel-pin"), track = el.querySelector(".reel-track"), frames = [...el.querySelectorAll(".frame16")];
    const count = el.querySelector(".reel-count b"), bar = el.querySelector(".reel-bar i");
    const move = () => {
      const max = pin.scrollWidth - pin.clientWidth, x = pin.scrollLeft;
      bar.style.transform = `scaleX(${max > 0 ? x / max : 0})`;
      reel.style.setProperty("--sx", -x + "px");
      // whichever frame is nearest the middle of the screen is the active one
      let best = 0, d = 1e9;
      frames.forEach((f, i) => { const r = f.getBoundingClientRect(), dx = Math.abs(r.left + r.width / 2 - innerWidth / 2); if (dx < d){ d = dx; best = i; } });
      frames.forEach((f, i) => f.classList.toggle("on", i === best));
      count.textContent = String(best + 1).padStart(2, "0");
      document.body.style.setProperty("--tint", order[best].accent);
      // As on CORE-A, a frame's title holds at the left edge while its picture slides away,
      // fading out gradually so it never gets cut off mid-word.
      const edge = parseFloat(getComputedStyle(track).paddingLeft);
      frames.forEach(f => {
        const cap = f.querySelector(".fcap"), ft = cap.querySelector(".ft"), r = f.getBoundingClientRect();
        const shift = Math.max(0, edge - r.left), tw = ft.offsetWidth + parseFloat(getComputedStyle(ft).left);
        cap.style.transform = `translate3d(${shift}px,0,0)`;
        cap.style.opacity = Math.min(1, Math.max(0, 1 - shift / Math.max(120, f.offsetWidth - tw - 16)));
      });
    };
    pin.addEventListener("scroll", () => requestAnimationFrame(move), {passive: true});
    pin.addEventListener("wheel", e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;  // a sideways swipe already scrolls sideways
      const max = pin.scrollWidth - pin.clientWidth;
      if ((e.deltaY > 0 && pin.scrollLeft >= max - 1) || (e.deltaY < 0 && pin.scrollLeft <= 0)) return;  // at an end: let the page scroll
      e.preventDefault();
      pin.scrollLeft += e.deltaY;
    }, {passive: false});
    addEventListener("resize", move);
    el.querySelectorAll("img").forEach(im => im.addEventListener("load", move));
    move();
  }catch(e){ el.innerHTML = "<p class='sec'>Work appears here once the site is served from a web host.</p>"; }
  refreshFX();
}
async function renderWork(){
  const slug = new URLSearchParams(location.search).get("w");
  try{
    const ws = await loadWorks(), w = ws.find(x => x.slug === slug); if (!w) throw 0;
    document.title = `${w.title} — ${SITE.name}`;
    document.body.style.setProperty("--ac", w.accent);
    if (w.section === "screenplays") document.body.classList.add("isscript");
    const cur = document.querySelector(`.wheel a[href="${w.section}.html"]`); if (cur) cur.setAttribute("aria-current", "page");
    const hi = byId("wimg"); hi.src = w.image; hi.alt = w.photo ? w.alt : ""; hi.style.objectPosition = w.focus || "50% 50%";
    if (w.photo){ const c = byId("wcap"); c.hidden = false; c.textContent = w.photo; }
    byId("wkicker").innerHTML = `<a class="back-btn" href="${w.section}.html"><span class="arr" aria-hidden="true">&larr;</span>Back to <span${w.section === "screenplays" ? ' class="script-font"' : ""}>${SECTIONS[w.section]}</span></a>`;
    byId("wtitle").textContent = w.title; byId("wsub").textContent = w.subtitle || "";
    const m = [w.format, w.status, w.date, w.length].filter(Boolean).map(esc).join(" · ");
    byId("wintro").innerHTML = `<p class="tm">${m}</p><p class="wdesc">${esc(w.desc)}</p>` + (w.notes.length ? `<ul class="wnotes">${w.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : "") + (w.warning ? `<p class="warning">${esc(w.warning)}</p>` : "");
    if (w.access !== "none"){
      const t = await (await fetch(`works/${encodeURIComponent(w.slug)}.html`, {cache: "no-cache"})).text();
      byId("wtext").innerHTML = w.section === "screenplays" ? `<div class="paper">${t}</div>` : `<div class="reader">${t}</div>`;
    }
    let acc = "";
    if (w.access === "excerpt"){
      const n = (w.total && w.slug !== "the-sublime-and-the-scientific") ? `Excerpt · ${w.shown.toLocaleString()} of about ${w.total.toLocaleString()} words` : "Excerpt";
      acc = `<div class="request"><p class="tm">${n}</p><a class="btn-link" href="${reqLink(w, "Full text request")}">Request the full text</a></div>`;
    } else if (w.access === "none"){
      acc = `<div class="request"><p class="tm">${w.status === "In progress" ? "In progress · no public text yet" : "No public text yet"}</p><a class="btn-link" href="${reqLink(w, "About")}">Ask about this work</a></div>`;
    }
    byId("waccess").innerHTML = acc;
    const sib = ws.filter(x => x.section === w.section), i = sib.indexOf(w), L = (q, d) => `<a href="${workLink(q)}"><small>${d}</small>${esc(q.title)}</a>`;
    byId("wnav").innerHTML = `<span>${sib[i-1] ? L(sib[i-1], "&larr; Previous") : ""}</span><span>${sib[i+1] ? L(sib[i+1], "Next &rarr;") : ""}</span>`;
  }catch(e){ byId("wtitle").textContent = "Not found"; byId("wtext").innerHTML = '<p>That work could not be found. <a href="index.html">Back to the homepage</a></p>'; }
  refreshFX();
}
/* ---------- shared header / footer (the footer is the contact section) ---------- */
function buildChrome(){
  const h = byId("site-header");
  if (h){
    const page = location.pathname.split("/").pop() || "index.html";
    const here = document.body.classList.contains("workpage") ? (document.body.dataset.section || "") + ".html" : page === "post.html" ? "blog.html" : page;
    h.innerHTML = `<a class="brand" href="index.html">${esc(SITE.name)}</a><button class="menu-btn" aria-expanded="false" aria-controls="wheel">Menu</button>`;
    // The menu: a wheel of links around a monogram. Scrolling or the arrow keys turn it.
    const wheel = document.createElement("nav");
    wheel.className = "wheel"; wheel.id = "wheel"; wheel.setAttribute("aria-label", "Site");
    wheel.innerHTML = `<span class="wheel-hub" aria-hidden="true">WN</span><ol>${NAV.map(([t,l]) => `<li><a href="${l}"${t === "Screenplays" ? ' class="script-font"' : ""}${l === here ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")}</ol><aside class="peek" aria-hidden="true"><span class="peek-fig tone"><img alt=""></span><span class="peek-n"></span><span class="peek-t"></span><span class="peek-s"></span></aside><div class="spin"><button class="turn up" aria-label="Turn the menu up">&uarr;</button><button class="turn down" aria-label="Turn the menu down">&darr;</button></div><div class="wheel-foot"><span>${esc(SITE.tagline)}</span><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></div>`;
    h.after(wheel);
    const items = [...wheel.querySelectorAll("li")], btn = h.querySelector(".menu-btn");
    let c = Math.max(0, NAV.findIndex(n => n[1] === here));
    const turn = i => {
      c = Math.max(0, Math.min(items.length - 1, i));
      items.forEach((li, j) => { li.style.transform = `rotate(${(j - c) * 15}deg)`; li.style.opacity = Math.max(.12, 1 - Math.abs(j - c) * .26); li.classList.toggle("cur", j === c); });
      // the preview beside the wheel follows whatever the wheel has landed on
      const [t, l] = NAV[c], pk = PEEK[l] || ["", ""], peek = wheel.querySelector(".peek");
      peek.classList.remove("show"); void peek.offsetWidth; peek.classList.add("show");
      peek.querySelector("img").src = pk[0];
      peek.querySelector(".peek-n").textContent = ["I","II","III","IV","V","VI","VII","VIII"][c];
      const pt = peek.querySelector(".peek-t"); pt.textContent = t; pt.classList.toggle("script-font", t === "Screenplays");
      peek.querySelector(".peek-s").textContent = pk[1];
    };
    const open = o => { wheel.classList.toggle("open", o); btn.setAttribute("aria-expanded", o); btn.textContent = o ? "Close" : "Menu"; if (o) items[c].querySelector("a").focus({preventScroll: true}); };
    turn(c);
    btn.onclick = () => open(!wheel.classList.contains("open"));
    items.forEach((li, j) => { const a = li.querySelector("a"); a.addEventListener("focus", () => turn(j)); a.addEventListener("click", () => open(false)); });
    wheel.querySelector(".turn.up").onclick = () => turn(c - 1);
    wheel.querySelector(".turn.down").onclick = () => turn(c + 1);
    // Scrolling: each scroll gesture turns the wheel one step. Keep scrolling and it takes another
    // step about every third of a second. The momentum a trackpad keeps sending after a flick is
    // ignored, so a flick can't spin it away.
    let acc = 0, last = 0, next = 0, stepped = false, peak = 0;
    wheel.addEventListener("wheel", e => {
      e.preventDefault();
      const now = Date.now(), d = Math.abs(e.deltaY);
      if (now - last > 220){ acc = 0; stepped = false; next = 0; peak = 0; }  // a pause means a new gesture
      last = now;
      peak = Math.max(peak, d);
      if (stepped && d < peak * .5) return;  // coasting to a stop: momentum, not a new push
      acc += e.deltaY;
      const need = stepped ? 200 : 40;
      if (Math.abs(acc) < need || now < next) return;
      turn(c + Math.sign(acc)); acc = 0; stepped = true; next = now + 340;
    }, {passive: false});
    addEventListener("keydown", e => {
      if (!wheel.classList.contains("open")) return;
      if (e.key === "Escape"){ open(false); btn.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp"){ e.preventDefault(); turn(c + (e.key === "ArrowDown" ? 1 : -1)); items[c].querySelector("a").focus({preventScroll: true}); }
    });
  }
  const f = byId("site-footer");
  if (f){
    f.id = "contact";
    const handle = u => "@" + u.replace(/\/+$/, "").split("/").pop().replace(/^@/, "");
    const field = (label, href, text, wide) => `<div class="field${wide ? " wide" : ""}"><a href="${esc(href)}"${href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(text)}</a><span>${label}</span></div>`;
    f.innerHTML = `<div class="foot-in"><h2 class="contact-t">Get in touch</h2><p class="contact-s">Ask about a full text, or just say hello.</p>
      <div class="fields">${field("Contact email", "mailto:" + SITE.email, SITE.email, true)}${field("Instagram", SITE.instagram, handle(SITE.instagram))}${field("Medium", SITE.medium, handle(SITE.medium))}${field("LinkedIn", SITE.linkedin, SITE.name)}</div>
      <div class="foot-row"><span>&copy; ${new Date().getFullYear()} ${esc(SITE.name)} · ${esc(SITE.tagline)}</span><nav class="foot-nav" aria-label="Footer">${NAV.slice(1, -1).map(([t,l]) => `<a href="${l}">${t}</a>`).join("")}</nav></div></div>`;
  }
}

/* ---------- motion: reveals, header, reading progress, hero drift ---------- */
let io, refreshFX = () => {};
(function(){
  buildChrome();
  // a thin line of lamplight along the top shows how far down the page you are (the browser's own scrollbar is hidden)
  const bar = document.body.appendChild(Object.assign(document.createElement("div"), {id: "progress"}));
  const hdr = document.querySelector("header"), img = document.querySelector(".hero-img"), copy = document.querySelector(".hero-panel");
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  // Put the orbit and crosshair on the lamp of the lighthouse in hero.jpg (2400 x 1350; the
  // lamp is 68.75% across and 64.5% down). The photo is drawn "cover", positioned 68% 50%.
  const placeLamp = () => {
    if (!img) return;
    const w = img.offsetWidth, h = img.offsetHeight, k = Math.max(w / 2400, h / 1350), W = 2400 * k, H = 1350 * k;
    img.style.setProperty("--lx", (w - W) * .68 + .6875 * W + "px");
    img.style.setProperty("--ly", (h - H) * .5 + .645 * H + "px");
  };
  placeLamp(); addEventListener("resize", placeLamp);
  let tick = false;
  function frame(){
    tick = false;
    const y = scrollY, h = innerHeight, max = document.documentElement.scrollHeight - h;
    if (bar) bar.style.width = (max > 0 ? y / max * 100 : 0) + "%";
    if (hdr) hdr.classList.toggle("solid", y > 40);
        if (calm || !img || y > h * 1.2) return;
    img.style.transform = `translate3d(0,${y * .25}px,0)`;
    copy.style.opacity = Math.max(0, 1 - y / (h * .6));
  }
  addEventListener("scroll", () => { if (!tick){ tick = true; requestAnimationFrame(frame); } }, {passive:true});
  addEventListener("resize", frame);
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }), {threshold:.1, rootMargin:"0px 0px -5% 0px"});
  refreshFX = () => { document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el)); frame(); };
  refreshFX();
})();

/* ---------- page transitions ---------- */
document.addEventListener("click", e => {
  const a = e.target.closest("a[href]");
  if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const u = new URL(a.href, location);
  if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash)) return;
  e.preventDefault(); document.body.classList.add("leaving"); setTimeout(() => location.href = a.href, 300);
});
addEventListener("pageshow", e => { if (e.persisted) document.body.classList.remove("leaving"); });
