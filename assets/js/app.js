/* ============================================================
   VELIVANCE X — experience engine
   Lenis (smooth scroll) + GSAP/ScrollTrigger + Three.js (UMD)
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePtr = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Hard fallback: no GSAP → static but complete page ---------- */
  if (!window.gsap) {
    var L = $("#loader"); if (L) L.style.display = "none";
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Split helpers ---------- */
  function splitChars(el) {
    var out = [];
    el.textContent.split("").forEach(function (ch) {
      var s = document.createElement("span");
      s.textContent = ch === " " ? " " : ch;
      s.style.display = "inline-block";
      out.push(s);
    });
    el.textContent = "";
    out.forEach(function (s) { el.appendChild(s); });
    return out;
  }
  function splitWords(el) {
    var parts = [];
    $$(".w", el); // no-op guard
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { parts.push(document.createTextNode(" ")); return; }
          var s = document.createElement("span"); s.className = "w"; s.textContent = w; parts.push(s);
        });
      } else if (n.nodeType === 1) {
        var s = document.createElement("span"); s.className = "w";
        s.appendChild(n.cloneNode(true)); parts.push(s);
      }
    });
    el.innerHTML = "";
    parts.forEach(function (p) { el.appendChild(p); });
    return $$(".w", el);
  }
  function wrapLines(sel) {
    $$(sel).forEach(function (line) {
      line.innerHTML = '<span class="inner">' + line.innerHTML + "</span>";
    });
    return $$(sel + " .inner");
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Header: solid after hero, hide on scroll down ---------- */
  var hdr = $("#hdr"), lastY = 0;
  function onScrollPos(y) {
    hdr.classList.toggle("is-solid", y > 40);
    hdr.classList.toggle("is-hidden", y > 500 && y > lastY + 2);
    if (y < lastY - 2 || y <= 500) hdr.classList.remove("is-hidden");
    lastY = y;
  }
  if (lenis) lenis.on("scroll", function (e) { onScrollPos(e.scroll); });
  else window.addEventListener("scroll", function () { onScrollPos(window.scrollY); }, { passive: true });

  /* ---------- Mobile nav (hamburger overlay) ---------- */
  (function mobileNav() {
    var toggle = $("#navToggle"), menu = $("#mnav");
    if (!toggle || !menu) return;
    function set(open) {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    }
    toggle.addEventListener("click", function () {
      set(!document.body.classList.contains("menu-open"));
    });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { set(false); }); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
    // Crossing to desktop hides .mnav via media query — close it too, or the
    // lingering body.menu-open (overflow:hidden + stopped Lenis) freezes the page.
    window.addEventListener("resize", function () {
      if (window.innerWidth > 980 && document.body.classList.contains("menu-open")) set(false);
    });
  })();

  /* ---------- Custom cursor ---------- */
  if (finePtr && !reduced) {
    document.body.classList.add("cursor-on");
    var cur = $(".cursor"), dot = $("#cDot"), ring = $("#cRing"), label = $("#cLabel");
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    gsap.ticker.add(function () {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
    });
    document.addEventListener("pointerover", function (e) {
      var v = e.target.closest("[data-cursor='view']");
      var a = e.target.closest("a,button,.btn");
      cur.classList.toggle("is-view", !!v);
      cur.classList.toggle("is-link", !v && !!a);
      label.textContent = v ? "VIEW" : "";
    });
  }

  /* ---------- Magnetic elements ---------- */
  if (finePtr && !reduced) {
    $$("[data-magnetic]").forEach(function (el) {
      var str = 0.35;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * str, y: (e.clientY - r.top - r.height / 2) * str, duration: 0.4, ease: "power3.out" });
      });
      el.addEventListener("pointerleave", function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,.45)" });
      });
    });
  }

  /* ---------- THREE.JS — particle data-field hero ---------- */
  var glIntro = function () {};
  (function initGL() {
    var canvas = $("#gl");
    if (!canvas || !window.THREE) { if (canvas) canvas.style.display = "none"; return; }
    try {
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      var scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x070b14, 0.05);
      var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      camera.position.set(0, 2.6, 9);

      // round glow sprite
      var c = document.createElement("canvas"); c.width = c.height = 64;
      var g = c.getContext("2d");
      var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.4, "rgba(255,255,255,.55)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
      var sprite = new THREE.CanvasTexture(c);

      var COLS = 150, ROWS = 85, COUNT = COLS * ROWS;
      var pos = new Float32Array(COUNT * 3);
      var col = new Float32Array(COUNT * 3);
      var base = new THREE.Color(0x6ea8dc), acc = new THREE.Color(0xff8a5c), blu = new THREE.Color(0x5b8def);
      var i, x, z, k = 0;
      for (i = 0; i < COUNT; i++) {
        x = (i % COLS) / (COLS - 1); z = Math.floor(i / COLS) / (ROWS - 1);
        pos[k] = (x - 0.5) * 62; pos[k + 1] = 0; pos[k + 2] = (z - 0.5) * 34;
        var cc = Math.random() < 0.06 ? acc : (Math.random() < 0.12 ? blu : base);
        col[k] = cc.r; col[k + 1] = cc.g; col[k + 2] = cc.b;
        k += 3;
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      var mat = new THREE.PointsMaterial({
        size: 0.09, map: sprite, vertexColors: true, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
      });
      var points = new THREE.Points(geo, mat);
      var group = new THREE.Group(); group.add(points); scene.add(group);

      var pmx = 0, pmy = 0;
      if (finePtr) window.addEventListener("pointermove", function (e) {
        pmx = (e.clientX / innerWidth - 0.5); pmy = (e.clientY / innerHeight - 0.5);
      }, { passive: true });

      var prog = 0; // hero scroll progress 0→1
      ScrollTrigger.create({
        trigger: "#hero", start: "top top", end: "bottom top", scrub: true,
        onUpdate: function (self) { prog = self.progress; }
      });

      function wave(t) {
        var p = geo.attributes.position.array;
        var idx = 1, xx, zz;
        for (var n = 0; n < COUNT; n++) {
          xx = p[idx - 1]; zz = p[idx + 1];
          p[idx] = Math.sin(xx * 0.26 + t * 0.9) * 0.62 +
                   Math.cos(zz * 0.32 + t * 0.65) * 0.5 +
                   Math.sin((xx + zz) * 0.11 + t * 0.38) * 0.85;
          idx += 3;
        }
        geo.attributes.position.needsUpdate = true;
      }
      function resize() {
        var w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
      }
      window.addEventListener("resize", resize); resize();

      var T = 0;
      function render() {
        T += 0.0085;
        wave(T);
        group.rotation.y += ((pmx * 0.22) - group.rotation.y) * 0.04;
        group.rotation.x += ((pmy * 0.1) - group.rotation.x) * 0.04;
        camera.position.y = 2.6 + prog * 3.4;
        camera.lookAt(0, 0, 0);
        mat.opacity = Math.max(0, (mat.userData.base || 0) * (1 - prog * 0.95));
        renderer.render(scene, camera);
      }
      mat.userData.base = 0;

      glIntro = function () {
        gsap.to(mat.userData, { base: 0.95, duration: 2, ease: "power2.out" });
        gsap.from(camera.position, { z: 13, duration: 2.2, ease: "power3.out" });
      };

      if (reduced) {
        mat.userData.base = 0.85; T = 2.2; wave(T);
        camera.position.set(0, 2.6, 9); camera.lookAt(0, 0, 0);
        mat.opacity = 0.85;
        renderer.render(scene, camera);
        glIntro = function () {};
      } else {
        gsap.ticker.add(render);
      }
    } catch (err) {
      canvas.style.display = "none";
    }
  })();

  /* ---------- Inner-page hero: per-page entrance variants ---------- */
  // Char splitter that preserves inline accents (<em class="serif">) and keeps
  // words intact for wrapping. Returns the array of per-character spans.
  function splitWordsChars(el) {
    var words = splitWords(el), chars = [];
    words.forEach(function (w) {
      w.style.display = "inline-block";
      var kids = Array.prototype.slice.call(w.childNodes);
      w.innerHTML = "";
      kids.forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split("").forEach(function (ch) {
            var s = document.createElement("span"); s.style.display = "inline-block"; s.textContent = ch;
            w.appendChild(s); chars.push(s);
          });
        } else {
          var wrap = n.cloneNode(false); w.appendChild(wrap);
          (n.textContent || "").split("").forEach(function (ch) {
            var s = document.createElement("span"); s.style.display = "inline-block"; s.textContent = ch;
            wrap.appendChild(s); chars.push(s);
          });
        }
      });
    });
    return chars;
  }
  function maskWrap(el) {
    el.style.overflow = "hidden";
    el.innerHTML = '<span class="inner" style="display:block;will-change:transform">' + el.innerHTML + "</span>";
    return el.firstChild;
  }

  // s: heading treatment — line | clip | plain | word | char
  var HV = {
    linemask:    { s: "line",  d: 1.1,  e: "power4.out",    st: 0.12,  from: { yPercent: 115 } },
    clipwipe:    { s: "clip",  d: 1.05, e: "power3.inOut",  clip: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"] },
    curtain:     { s: "clip",  d: 1.05, e: "power3.inOut",  clip: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] },
    blurfocus:   { s: "plain", d: 1.1,  e: "power2.out",    from: { opacity: 0, scale: 1.06, filter: "blur(14px)" } },
    softrise:    { s: "plain", d: 1.0,  e: "power2.out",    from: { opacity: 0, y: 26 } },
    charcascade: { s: "char",  d: 0.7,  e: "power3.out",    st: 0.025, from: { yPercent: 120, opacity: 0 } },
    charfall:    { s: "char",  d: 0.7,  e: "power3.out",    st: 0.025, from: { yPercent: -120, opacity: 0 } },
    charflip:    { s: "char",  d: 0.7,  e: "power3.out",    st: 0.02,  from: { rotationX: -90, opacity: 0, transformOrigin: "50% 100%", transformPerspective: 400 } },
    typeline:    { s: "char",  d: 0.16, e: "none",          st: 0.022, from: { opacity: 0 } },
    splitcenter: { s: "char",  d: 0.7,  e: "back.out(1.7)", st: 0.02,  fromEach: "center", from: { opacity: 0, scale: 0.4 } },
    wordleft:    { s: "word",  d: 0.8,  e: "power3.out",    st: 0.06,  from: { x: -44, opacity: 0 } },
    wordup:      { s: "word",  d: 0.85, e: "power4.out",    st: 0.06,  from: { yPercent: 120, opacity: 0 } },
    scalepop:    { s: "word",  d: 0.7,  e: "back.out(1.6)", st: 0.05,  from: { scale: 0.5, opacity: 0, transformOrigin: "50% 100%" } },
    fadescale:   { s: "word",  d: 0.9,  e: "power2.out",    st: 0.05,  from: { opacity: 0, scale: 1.14 } },
    blurwords:   { s: "word",  d: 0.8,  e: "power2.out",    st: 0.06,  from: { opacity: 0, filter: "blur(10px)", y: 18 } },
    accentdraw:  { s: "word",  d: 0.9,  e: "power4.out",    st: 0.07,  from: { yPercent: 115 }, underline: true },
    updown:      { s: "word",  d: 0.8,  e: "power3.out",    st: 0.05,  ud: true, from: { opacity: 0 } },
    skewrise:    { s: "word",  d: 0.9,  e: "power4.out",    st: 0.05,  from: { yPercent: 110, opacity: 0, skewY: 7 } }
  };
  // Background drift-in (animates the .px-bg container, leaving the img's CSS
  // ken-burns intact). Scale stays >1 so directional offsets never reveal edges.
  var HV_BG = {
    linemask: { scale: 1.14 }, clipwipe: { scale: 1.12, xPercent: -5 }, curtain: { scale: 1.12, yPercent: -4 },
    blurfocus: { scale: 1.1, filter: "blur(12px)" }, softrise: { scale: 1.07 },
    charcascade: { scale: 1.12, xPercent: -5 }, charfall: { scale: 1.12, yPercent: -5 }, charflip: { scale: 1.12, yPercent: 5 },
    typeline: { scale: 1.12, xPercent: 5 }, splitcenter: { scale: 1.14 },
    wordleft: { scale: 1.12, xPercent: 5 }, wordup: { scale: 1.12 }, scalepop: { scale: 1.16 },
    fadescale: { scale: 1.15 }, blurwords: { scale: 1.08, filter: "blur(9px)" }, accentdraw: { scale: 1.12 },
    updown: { scale: 1.12, yPercent: -5 }, skewrise: { scale: 1.12, yPercent: -5 }
  };

  function initPxHero(px) {
    var cfg = HV[px.getAttribute("data-hero")] || HV.softrise;
    var h1 = $("h1", px), bg = $(".px-bg", px);
    var chrome = [$(".crumb", px), $(".tag", px), $(".sub", px)].filter(Boolean);

    if (reduced) return; // leave fully visible, static

    if (chrome.length) gsap.set(chrome, { opacity: 0, y: 16 });
    var tl = gsap.timeline({ delay: 0.12 });

    if (bg) {
      gsap.set(bg, HV_BG[px.getAttribute("data-hero")] || { scale: 1.08 });
      tl.to(bg, { scale: 1, xPercent: 0, yPercent: 0, filter: "blur(0px)", duration: 1.9, ease: "power2.out" }, 0);
    }

    if (h1) {
      if (cfg.s === "clip") {
        gsap.set(h1, { clipPath: cfg.clip[0], webkitClipPath: cfg.clip[0] });
        tl.to(h1, { clipPath: cfg.clip[1], webkitClipPath: cfg.clip[1], duration: cfg.d, ease: cfg.e }, 0.1);
      } else if (cfg.s === "plain") {
        gsap.set(h1, cfg.from);
        tl.to(h1, { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: cfg.d, ease: cfg.e }, 0.1);
      } else if (cfg.s === "line") {
        var inner = maskWrap(h1);
        gsap.set(inner, cfg.from);
        tl.to(inner, { yPercent: 0, opacity: 1, duration: cfg.d, ease: cfg.e }, 0.1);
      } else {
        var pieces = cfg.s === "char" ? splitWordsChars(h1) : splitWords(h1);
        pieces.forEach(function (p) { p.style.display = "inline-block"; });
        var to = { opacity: 1, x: 0, y: 0, yPercent: 0, scale: 1, rotationX: 0, skewY: 0, filter: "blur(0px)", duration: cfg.d, ease: cfg.e };
        if (cfg.ud) {
          pieces.forEach(function (p, i) { gsap.set(p, { opacity: 0, yPercent: i % 2 ? 120 : -120 }); });
        } else {
          gsap.set(pieces, cfg.from);
          to.stagger = cfg.fromEach ? { each: cfg.st, from: cfg.fromEach } : cfg.st;
        }
        if (cfg.ud) to.stagger = cfg.st;
        tl.to(pieces, to, 0.1);
        if (cfg.underline) {
          var em = $(".serif", h1);
          if (em) {
            em.style.position = "relative";
            var u = document.createElement("span");
            u.style.cssText = "position:absolute;left:0;right:0;bottom:-.06em;height:2px;background:var(--accent-2);transform:scaleX(0);transform-origin:left center";
            em.appendChild(u);
            tl.to(u, { scaleX: 1, duration: 0.55, ease: "power2.out" }, ">-0.1");
          }
        }
      }
    }

    if (chrome.length) tl.to(chrome, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, 0.32);
  }

  /* ---------- Hero + loader choreography ---------- */
  var pxHero = $(".px-hero[data-hero]");
  if (pxHero) {
    initPxHero(pxHero);
  } else {
    var heroInners = wrapLines(".hero-title .line");
    var heroFades = $$("[data-hero-fade]");
    if (heroInners.length) gsap.set(heroInners, { yPercent: 115 });
    if (heroFades.length) gsap.set(heroFades, { opacity: 0, y: 18 });

    var heroIntro = function () {
      glIntro();
      var tl = gsap.timeline();
      if (heroInners.length) tl.to(heroInners, { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.1 }, 0.05);
      if (heroFades.length) tl.to(heroFades, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 }, heroInners.length ? 0.5 : 0.1);
    };

    (function loader() {
      var el = $("#loader");
      if (!el) { heroIntro(); return; }
      if (reduced) { el.style.display = "none"; heroIntro(); return; }
      var letters = splitChars($(".loader-word"));
      gsap.set(letters, { yPercent: 120 });
      var num = $("#loadNum"), obj = { v: 0 };
      var tl = gsap.timeline({
        onComplete: function () { el.style.display = "none"; heroIntro(); }
      });
      tl.to(letters, { yPercent: 0, duration: 0.7, ease: "power3.out", stagger: 0.04 }, 0)
        .to(obj, {
          v: 100, duration: 1.15, ease: "power2.inOut",
          onUpdate: function () { num.textContent = String(Math.round(obj.v)).padStart(3, "0"); }
        }, 0)
        .to(".loader-core,.loader-count", { opacity: 0, duration: 0.35, ease: "power1.in" }, 1.25)
        .to(".loader-panel", { yPercent: function (i) { return i === 0 ? -101 : 101; }, duration: 0.85, ease: "power4.inOut" }, 1.4);
    })();
  }

  /* ---------- Marquee + scroll velocity ---------- */
  if ($("#marqTrack")) {
    var marqTween = gsap.to("#marqTrack", { xPercent: -50, repeat: -1, duration: 26, ease: "none" });
    if (lenis) {
      lenis.on("scroll", function (e) {
        var ts = gsap.utils.clamp(0.7, 4, 1 + Math.abs(e.velocity) / 14);
        gsap.to(marqTween, { timeScale: ts, duration: 0.3, overwrite: true });
      });
    }
    if (reduced) marqTween.pause();
  }

  /* ---------- Manifesto scrub fill ---------- */
  if ($("#fillText")) {
    var fillWords = splitWords($("#fillText"));
    if (!reduced) {
      gsap.to(fillWords, {
        opacity: 1, stagger: 0.06, ease: "none",
        scrollTrigger: { trigger: "#manifesto", start: "top 72%", end: "center 38%", scrub: 1 }
      });
    }
  }

  /* ---------- Services horizontal journey ---------- */
  var mm = gsap.matchMedia();
  mm.add("(min-width: 980px)", function () {
    if (reduced || !$("#svcTrack")) return;
    var track = $("#svcTrack"), bar = $("#svcBar");
    var amt = function () { return track.scrollWidth - innerWidth; };
    gsap.to(track, {
      x: function () { return -amt(); },
      ease: "none",
      scrollTrigger: {
        trigger: "#svcPin", start: "top top",
        end: function () { return "+=" + amt(); },
        scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (self) { bar.style.transform = "scaleX(" + self.progress + ")"; }
      }
    });
    // inner image drift
    $$(".panel .p-media img").forEach(function (img) {
      gsap.fromTo(img, { xPercent: -5 }, {
        xPercent: 5, ease: "none",
        scrollTrigger: { trigger: "#svcPin", start: "top top", end: function () { return "+=" + amt(); }, scrub: 1 }
      });
    });
  });
  mm.add("(max-width: 979px)", function () {
    var track = $("#svcTrack");
    if (!track) return;
    track.style.width = "auto"; track.style.flexWrap = "wrap";
    $$(".panel", track).forEach(function (p) { p.style.width = "100%"; });
  });

  /* ---------- Counters ---------- */
  $$("[data-count]").forEach(function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var fmt = function (n) { return n >= 1000 ? n.toLocaleString("en-US") : String(n); };
    if (reduced) { el.textContent = fmt(target); return; }
    ScrollTrigger.create({
      trigger: el, start: "top 85%", once: true,
      onEnter: function () {
        var o = { v: 0 };
        gsap.to(o, {
          v: target, duration: 1.6, ease: "power3.out",
          onUpdate: function () { el.textContent = fmt(Math.round(o.v)); }
        });
      }
    });
  });

  /* ---------- Parallax images ---------- */
  if (!reduced) {
    $$("[data-speed]").forEach(function (el) {
      var sp = parseFloat(el.getAttribute("data-speed")) || 0;
      gsap.to(el, {
        yPercent: sp, ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 1 }
      });
    });
  }

  /* ---------- Stacked approach cards ---------- */
  if (!reduced) {
    var cards = $$(".s-card");
    cards.forEach(function (card, i) {
      if (i === cards.length - 1) return;
      gsap.to(card, {
        scale: 0.94, filter: "brightness(.5)", transformOrigin: "center top", ease: "none",
        scrollTrigger: { trigger: cards[i + 1], start: "top bottom-=120", end: "top top+=160", scrub: true }
      });
    });
  }

  /* ---------- Outro title reveal ---------- */
  var outInners = wrapLines(".outro-title .line");
  if (!reduced && outInners.length) {
    gsap.set(outInners, { yPercent: 115 });
    gsap.to(outInners, {
      yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.12,
      scrollTrigger: { trigger: ".outro", start: "top 70%", once: true }
    });
  }

  /* ---------- Contact form → composes email (no backend needed) ---------- */
  $$("form[data-mailto-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (n) { var el = form.querySelector("[name=" + n + "]"); return el ? el.value.trim() : ""; };
      if (!v("name") || !/.+@.+\..+/.test(v("email"))) {
        (v("name") ? form.querySelector("[name=email]") : form.querySelector("[name=name]")).focus();
        return;
      }
      var subject = "Project inquiry — " + (v("company") || v("name"));
      var body = "Name: " + v("name") + "\nEmail: " + v("email") + "\nCompany: " + v("company") +
                 "\nInterest: " + v("interest") + "\n\n" + v("msg");
      location.href = "mailto:vik@avanciers.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var note = form.querySelector(".form-note");
      if (note) note.textContent = "Your email app should open with the message pre-filled. If not, write to vik@avanciers.com.";
    });
  });

  /* ---------- Generic reveals ---------- */
  // Generic reveals via IntersectionObserver. ScrollTrigger-driven gsap.from
  // could leave sections near the bottom of short pages stuck hidden (the
  // trigger scrubbed instead of playing once); IO fires reliably on enter.
  if (!reduced) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        gsap.to(e.target.children, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 });
        revObs.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    $$("[data-reveal]").forEach(function (el) {
      gsap.set(el.children, { opacity: 0, y: 26 });
      revObs.observe(el);
    });
  }

  /* Recompute remaining (scrub) trigger positions once images + web fonts have
     settled the layout. */
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
