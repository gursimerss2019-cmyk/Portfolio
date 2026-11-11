

gsap.registerPlugin(ScrollTrigger);

/* ---------- 1. Your photo (transparent PNG works best) ---------- */
const PHOTO = "ASSETS/IMAGES/ceo-img.png";
const placeholder = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bdbdbd"/><stop offset="1" stop-color="#e9e9e9"/></linearGradient></defs>
 <path d="M60 700 C70 520 170 470 300 460 C430 470 530 520 540 700Z" fill="url(#g)"/>
 <ellipse cx="300" cy="230" rx="112" ry="140" fill="url(#g)"/>
 <circle cx="300" cy="110" r="95" fill="#9d9d9d"/></svg>`);
document.getElementById("photo").src = PHOTO || placeholder;

/* ---------- 2. Split headline into letters ---------- */
document.querySelectorAll("[data-split]").forEach(el => {
  const text = el.textContent; el.textContent = "";
  [...text].forEach(c => {
    const s = document.createElement("span");
    if (c === " ") { s.className = "sp"; }
    else { s.className = "ch"; s.textContent = c; }
    el.appendChild(s);
  });
});

const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ff4d1c";
const hero = document.getElementById("hero");
const photo = document.getElementById("photo");
const back = document.getElementById("back");
const front = document.getElementById("front");
const backChars = [...back.querySelectorAll(".ch")];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- 3. Intro (single orchestrated moment) ---------- */
if (!reduce) {
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.from(".hello", { y: -16, opacity: 0, duration: .7 })
    .from(".back .ch", { yPercent: 60, opacity: 0, duration: .9, stagger: .03 }, "-=.4")
    .from(".front .l1 .ch", { opacity: 0, duration: .6, stagger: .03 }, "<")
    .from(".photo", { y: 60, opacity: 0, duration: 1.1 }, "-=.9")
    .from(".where,.logos,.cta", { opacity: 0, y: 14, duration: .7, stagger: .1 }, "-=.6");
  gsap.fromTo(".wave", { rotate: 0 }, { rotate: 18, duration: .25, yoyo: true, repeat: 5, ease: "sine.inOut", delay: .6 });
}

/* ---------- 4. Letter colour change on hover ---------- */
/* One pointer listener (the photo/outline layers sit on top, so we hit-test letters ourselves). */
/* Like the reference: the line under the mouse becomes solid, the other turns to outline.
   Default (mouse elsewhere): line 1 solid, line 2 outline. */
const L1 = back.querySelector(".l1"), L2 = back.querySelector(".l2"), lines = [L1, L2];
gsap.set(L1, { "--a": 1 }); gsap.set(L2, { "--a": 0 });
let active = null, curOn = false;
function setActive(a) {
  if (a === active) return; active = a;
  const solid = a || L1;
  lines.forEach(l => gsap.to(l, { "--a": l === solid ? 1 : 0, duration: .55, ease: "power2.out", overwrite: "auto" }));
}
function hit(l, x, y) {
  const cs = l.querySelectorAll(".ch"), f = cs[0].getBoundingClientRect(), t = cs[cs.length - 1].getBoundingClientRect(), r = l.getBoundingClientRect();
  return x >= f.left && x <= t.right && y >= r.top && y <= r.bottom;
}

/* circular ↗ cursor shown over the headline */
const cur = document.getElementById("cur");
gsap.set(cur, { scale: 0, opacity: 0, x: -100, y: -100 });
const cx = gsap.quickTo(cur, "x", { duration: .35, ease: "power3.out" });
const cy = gsap.quickTo(cur, "y", { duration: .35, ease: "power3.out" });
function onMove(e) {
  const x = e.clientX, y = e.clientY;
  const a = hit(L1, x, y) ? L1 : hit(L2, x, y) ? L2 : null;
  setActive(a);
  cx(x); cy(y);
  const on = !!a;
  if (on !== curOn) {
    curOn = on; document.body.classList.toggle("on-title", on);
    gsap.to(cur, { scale: on ? 1 : 0, opacity: on ? 1 : 0, duration: .3, ease: "power3.out", overwrite: "auto" });
  }
}

/* ---------- 5. Subtle mouse-follow ---------- */
const MAX_PHOTO = { x: 16, y: 10 };   // photo travel in px (kept small on purpose)
const MAX_TEXT = { x: -6, y: -4 };   // text drifts the opposite way, even less
const px = gsap.quickTo(photo, "x", { duration: 1, ease: "power3.out" });
const py = gsap.quickTo(photo, "y", { duration: 1, ease: "power3.out" });
const bx = gsap.quickTo([back, front], "x", { duration: 1.2, ease: "power3.out" });
const by = gsap.quickTo([back, front], "y", { duration: 1.2, ease: "power3.out" });

function follow(e) {
  const nx = (e.clientX / innerWidth - .5) * 2;  // -1 … 1
  const ny = (e.clientY / innerHeight - .5) * 2;
  px(nx * MAX_PHOTO.x); py(ny * MAX_PHOTO.y);
  bx(nx * MAX_TEXT.x); by(ny * MAX_TEXT.y);
}

if (fine && !reduce) {
  hero.addEventListener("pointermove", e => { onMove(e); follow(e); });
  hero.addEventListener("pointerleave", () => {
    px(0); py(0); bx(0); by(0);
    setActive(null);
    if (curOn) { curOn = false; document.body.classList.remove("on-title"); gsap.to(cur, { scale: 0, opacity: 0, duration: .25, overwrite: "auto" }); }
  });
}




if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {

  /* 1. Pinned heading: starts at the middle of the screen, slides left, then scrolls away */
  const horText = document.querySelector(".heading-for-about h2");
  let headingST = null;
  if (horText) {
    const START_AT = 0.5;   // 0.5 = text begins at the middle of the screen (0.3 = further left, 0.7 = further right)

    const startX = () => window.innerWidth * START_AT;
    // wide text: its right edge stops at the right edge of the screen
    // narrow text: it stops flush with the left edge
    const endX = () => Math.min(window.innerWidth - horText.offsetWidth, 0);

    headingST = gsap.fromTo(horText,
      { x: () => startX() },
      {
        x: () => endX(),
        ease: "none",
        scrollTrigger: {
          trigger: ".heading-for-about",
          start: "top top",
          end: () => "+=" + (startX() - endX()),
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      }
    ).scrollTrigger;
  }

  /* 2. Starts the moment the heading animation ends */
  gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".about-main-content",
      start: () => headingST ? headingST.end : "top bottom",
      end: () => "+=" + window.innerHeight * 1.5,
      scrub: true,
      invalidateOnRefresh: true
    }
  })
    .fromTo(".wrapper-for-main-content", { yPercent: 50 }, { yPercent: 0, duration: 0.5 }, 0) // rises in
    .fromTo(".right-side-main-content", { xPercent: 20 }, { xPercent: 0, duration: 0.5 }, 0) // paragraphs slide in
    .fromTo(".ceo-image h2", { yPercent: 0 }, { yPercent: 100, duration: 1 }, 0) // name drifts down
    .fromTo(".ceo-image", { yPercent: 20 }, { yPercent: -20, duration: 1 }, 0); // card parallax
}

const texttl = gsap.timeline({
  scrollTrigger: {
    trigger: ".work-section",
    start: "-=600",
    end: "bottom bottom",
    scrub: 1
  }
})

texttl.fromTo(".wrapper-for-heading-content-work .left-side-work",
  {
    yPercent: 50,
    opacity: 0
  },
  {
    yPercent: 0,
    duration: 1,
    ease: "linear",
    opacity: 1
  }, 0
)

  .fromTo(".wrapper-for-heading-content-work .right-side-work",
    {
      xPercent: 50,
      opacity: 0
    },
    {
      xPercent: 0,
      duration: 1,
      ease: "linear",
      opacity: 1
    }, 0
  )
const imgtl = gsap.timeline({
  scrollTrigger: {
    trigger: ".expertise-section",
    start: "-=600",
    end: "bottom bottom",
    scrub: 1
  }
})

imgtl.fromTo(".expertise-parent",
  {
    yPercent: 50,
    opacity: 0
  },
  {
    yPercent: 0,
    duration: 1,
    ease: "linear",
    opacity: 1
  }, 0
)

  .fromTo(".expertise-card",
    {
      xPercent: 50,
      opacity: 0
    },
    {
      xPercent: 0,
      duration: 1,
      ease: "linear",
      opacity: 1
    }, 0
  )


gsap.registerPlugin(ScrollTrigger);

const panels = gsap.utils.toArray(".expertise-panel");
const wrapper = document.querySelector(".expertise-horizontal-wrapper");

// total scroll distance = real width - viewport width
const getScrollDistance = () => wrapper.scrollWidth - window.innerWidth;

const scrollTween = gsap.to(wrapper, {
  x: () => -(getScrollDistance()),
  ease: "none",
  scrollTrigger: {
    trigger: ".expertise-horizontal-section",
    start: "top top",
    end: () => "+=" + getScrollDistance(),
    pin: true,
    scrub: 1,
    invalidateOnRefresh: true,
    anticipatePin: 1
  }
});

// animations per panel
panels.forEach((panel) => {
  gsap.from(panel.querySelector(".title"), {
    y: 80,
    opacity: 0,
    scrollTrigger: {
      trigger: panel,
      containerAnimation: scrollTween,
      start: "left center"
    }
  })

  gsap.from(panel.querySelector(".desc"), {
    y: 40,
    opacity: 0,
    delay: 0.1,
    scrollTrigger: {
      trigger: panel,
      containerAnimation: scrollTween,
      start: "left center"
    }
  })

  gsap.from(panel.querySelector(".cards"), {
    scale: 0.8,
    rotate: -10,
    opacity: 0,
    scrollTrigger: {
      trigger: panel,
      containerAnimation: scrollTween,
      start: "left center"
    }
  })
})

/* re-measure once images and fonts have loaded */
window.addEventListener("load", () => ScrollTrigger.refresh());
if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());

document.addEventListener("DOMContentLoaded", () => {
  const base = {
    type: "loop",
    perPage: 3,
    gap: 60,
    arrows: false,
    pagination: false,
    drag: false,            // pure marquee; use "free" if you want it draggable
    breakpoints: { 
       1280:{
        gap:20
       },
       991:{
        perPage:2
       },
       575:{
        perPage:1
       }
     }
  };

  // Slider A: scrolls left
  new Splide(".marquee-a", {
    ...base,
    autoScroll: { speed: 1, pauseOnHover: false, pauseOnFocus: false }
  }).mount(window.splide.Extensions);

  // Slider B: scrolls right (negative speed)
  new Splide(".marquee-b", {
    ...base,
    autoScroll: { speed: -1, pauseOnHover: false, pauseOnFocus: false }
  }).mount(window.splide.Extensions);
});


(function () {
  const sec = document.querySelector(".cta-section");
  if (!sec) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* entrance sequence, plays once when the section comes into view */
  gsap.timeline({
    defaults: { ease: "power4.out" },
    scrollTrigger: { trigger: sec, start: "top 65%", once: true }
  })
    .from(".cta-status", { y: 24, opacity: 0, duration: .7 })
    .from(".cta-line-inner", { yPercent: 110, duration: 1.1, stagger: .12 }, "-=.3")
    .from(".cta-text", { y: 24, opacity: 0, duration: .8 }, "-=.6")
    .from(".cta-actions > *", { y: 24, opacity: 0, duration: .8, stagger: .1 }, "-=.55");

  /* stats: rise in + count up, triggered by the stats row itself */
  const stats = sec.querySelector(".cta-stats");
  if (stats) {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: stats, start: "top 88%", once: true }
    });

    tl.from(stats.querySelectorAll(".cta-stat"), {
      y: 40, opacity: 0, duration: .9, stagger: .15, ease: "power4.out"
    });

    // Top Rated badge pops in
    tl.from(stats.querySelectorAll(".top-rated-icon svg"), {
      scale: 0, rotate: -60, transformOrigin: "50% 50%", duration: .7, ease: "back.out(2)"
    }, "-=.3");

    // number count-up
    stats.querySelectorAll("[data-count]").forEach((el, i) => {
      const end = +el.dataset.count, o = { v: 0 };
      // lock the width so the layout doesn't jitter while digits change
      el.style.display = "inline-block";
      el.style.minWidth = el.getBoundingClientRect().width + "px";
      el.style.textAlign = "right";
      el.textContent = "0";
      tl.to(o, {
        v: end, duration: 2.2, ease: "power2.out",
        onUpdate: () => { el.textContent = Math.round(o.v); }
      }, .15 + i * .15);
    });
  }

  /* soft background orbs drift as you scroll */
  gsap.to(".cta-orb-1", { yPercent: 40, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true } });
  gsap.to(".cta-orb-2", { yPercent: -40, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true } });

  /* magnetic button (mouse devices only) */
  const btn = sec.querySelector(".cta-btn");
  if (btn && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const mx = gsap.quickTo(btn, "x", { duration: .5, ease: "power3.out" });
    const my = gsap.quickTo(btn, "y", { duration: .5, ease: "power3.out" });
    btn.addEventListener("pointermove", e => {
      const r = btn.getBoundingClientRect();
      mx((e.clientX - (r.left + r.width / 2)) * .25);
      my((e.clientY - (r.top + r.height / 2)) * .35);
    });
    btn.addEventListener("pointerleave", () => { mx(0); my(0); });
  }
})();

(function () {
  const footer = document.querySelector("footer");
  if (!footer) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* split the headline into two masked lines (JS only, your HTML stays the same) */
  const h2 = footer.querySelector(".footer-head h2");
  const grey = h2.querySelector("span");
  const line = content => {
    const outer = document.createElement("div");
    outer.style.cssText = "overflow:hidden;padding-bottom:.08em";
    const inner = document.createElement("div");
    inner.className = "ft-line-inner";
    inner.style.willChange = "transform";
    inner.append(content);
    outer.append(inner);
    return outer;
  };
  h2.replaceChildren(line("Let’s build"), line(grey));

  // each group has its own trigger, so it plays when you can actually see it
  const at = (trigger, start) => ({ trigger, start, once: true });

  gsap.from(footer.querySelector(".eyebrow"), {
    y: 20, opacity: 0, duration: .8, ease: "power3.out",
    scrollTrigger: at(".eyebrow", "top 92%")
  });

  gsap.timeline({
    defaults: { ease: "power4.out" },
    scrollTrigger: at(".footer-head", "top 85%")
  })
    .from(".footer-head .ft-line-inner", { yPercent: 110, duration: 1.1, stagger: .12 })
    .from(".small-text-flex p", { y: 24, opacity: 0, duration: .8, stagger: .12 }, "-=.7");

  gsap.from(".mail-flex", {
    y: 40, opacity: 0, borderBottomColor: "rgba(255,255,255,0)",
    duration: 1, ease: "power3.out",
    scrollTrigger: at(".mail-flex", "top 92%")
  });

  gsap.timeline({
    defaults: { ease: "power3.out" },
    scrollTrigger: at(".quick-links", "top 98%")
  })
    .from(".quick-links p", { y: 20, opacity: 0, duration: .7 })
    .from(".quick-links li", { y: 20, opacity: 0, duration: .6, stagger: .1 }, "-=.4");
})();



(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const el = (cls, html = "") => { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; return d; };

  /* ---- effects ---- */
  function blobs(layer, { n = 3, o = .22 } = {}) {
    for (let i = 0; i < n; i++) {
      const b = el("fx-blob");
      b.style.cssText =
        `--s:${rnd(35, 60)}vmax;--o:${o};left:${rnd(-10, 75)}%;top:${rnd(-10, 65)}%;` +
        `--dx:${rnd(-18, 18)}vw;--dy:${rnd(-14, 14)}vh;--sc:${rnd(.85, 1.25)};` +
        `animation-duration:${rnd(14, 26)}s;animation-delay:${-rnd(0, 14)}s`;
      layer.append(b);
    }
  }

  function grid(layer, { dark = false } = {}, host) {
    const g = el("fx-grid" + (dark ? " dark" : ""));
    layer.append(g);
    const pos = { x: -999, y: -999 };
    const apply = () => { g.style.setProperty("--mx", pos.x + "px"); g.style.setProperty("--my", pos.y + "px"); };
    if (fine && !reduce) {
      host.addEventListener("pointermove", e => {
        const r = host.getBoundingClientRect();
        g.style.setProperty("--on", 1);
        gsap.to(pos, { x: e.clientX - r.left, y: e.clientY - r.top, duration: .45, ease: "power3.out", overwrite: true, onUpdate: apply });
      });
      host.addEventListener("pointerleave", () => g.style.setProperty("--on", 0));
    } else if (!reduce) {
      // touch screens: the light wanders by itself
      g.style.setProperty("--on", 1);
      gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut", onUpdate: apply } })
        .fromTo(pos, { x: () => host.offsetWidth * .2, y: () => host.offsetHeight * .3 },
          { x: () => host.offsetWidth * .8, y: () => host.offsetHeight * .6, duration: 7 });
    }
  }

  function rings(layer, { x = "50%", y = "50%", size = "120vmin" } = {}) {
    const d = el("fx-rings");
    d.style.cssText = `left:${x};top:${y};width:${size};height:${size}`;
    d.innerHTML = `<svg viewBox="0 0 800 800" fill="none" stroke="rgb(255,77,28)">
      <g class="r1"><circle cx="400" cy="400" r="390" stroke-opacity=".35" stroke-width="2" stroke-dasharray="2 14" stroke-linecap="round"/></g>
      <g class="r2"><circle cx="400" cy="400" r="320" stroke-opacity=".28" stroke-width="1.2" stroke-dasharray="40 24"/><circle cx="400" cy="80" r="7" fill="rgb(255,77,28)" stroke="none"/></g>
      <g class="r3"><circle cx="400" cy="400" r="250" stroke-opacity=".22" stroke-width="1.2"/><circle cx="650" cy="400" r="5" fill="rgb(255,77,28)" stroke="none"/></g>
      <g class="r4"><circle cx="400" cy="400" r="180" stroke-opacity=".3" stroke-width="1.2" stroke-dasharray="6 10"/></g>
    </svg>`;
    layer.append(d);
  }

  function sparks(layer, { n = 14 } = {}) {
    const kinds = ["plus", "dot", "ring"];
    for (let i = 0; i < n; i++) {
      const k = kinds[i % 3], s = el("fx-spark " + (k === "plus" ? "" : k), k === "plus" ? "+" : "");
      s.style.cssText =
        `left:${rnd(2, 96)}%;top:${rnd(5, 92)}%;--z:${rnd(22, 44)}px;` +
        `animation-duration:${rnd(6, 12)}s;animation-delay:${-rnd(0, 12)}s`;
      layer.append(s);
    }
  }

  function ticker(layer, { text = "Website Developer", top = "40%", reverse = false, dur = 45, so = .28 } = {}) {
    const row = `<span>${text}</span><i>✦</i>`.repeat(4);
    const t = el("fx-ticker",
      `<div class="fx-row" style="animation-duration:${dur}s;${reverse ? "animation-direction:reverse;" : ""}--so:${so}">${row}${row}</div>`);
    t.style.setProperty("--t", top);
    layer.append(t);
  }

  const FX = { blobs, grid, rings, sparks, ticker };

  /* ---- attach effects to a section ---- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    const l = e.target.querySelector(":scope > .fx");
    if (l) l.classList.toggle("off", !e.isIntersecting);
  }), { rootMargin: "100px" });

  function dress(selector, list) {
    const host = document.querySelector(selector);
    if (!host) return;
    host.classList.add("fx-host");
    const layer = el("fx");
    host.prepend(layer);
    list.forEach(item => {
      const [name, opts] = Array.isArray(item) ? item : [item, {}];
      FX[name](layer, opts, host);
    });
    io.observe(host);          // pauses animations while the section is off-screen
  }

  /* ---- recipes: edit freely ---- */
  dress("#hero", ["blobs", "grid", "sparks"]);
  dress(".heading-for-about", [["rings", { x: "70%" }], ["sparks", { n: 10 }]]);
  dress(".about-main-content", [["blobs", { n: 2, o: .14 }], "grid"]);
  dress(".work-section", [["ticker", { text: "Selected Work", top: "10%", so: .22 }], ["blobs", { n: 2 }]]);
  dress(".expertise-section", [["rings", { x: "85%", y: "30%", size: "90vmin" }], "sparks"]);
  dress(".expertise-horizontal-section", ["grid", ["blobs", { n: 2 }]]);
  dress(".cta-section", [["ticker", { text: "Let’s Talk", top: "55%", reverse: true, dur: 60 }], "sparks"]);
  dress("footer", [["grid", { dark: true }], ["blobs", { n: 2, o: .16 }]]);
})();