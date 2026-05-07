// Zain Ventures India — Travelogue interactions
(function () {
  "use strict";

  // ---------- Year ----------
  const yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  // ---------- Live IST clock ----------
  const t1 = document.getElementById("liveTime");
  const t2 = document.getElementById("liveTime2");
  const fmtTime = () => {
    const opts = { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" };
    return new Date().toLocaleTimeString("en-IN", opts) + " IST";
  };
  const tickClock = () => {
    const s = fmtTime();
    if (t1) t1.textContent = s;
    if (t2) t2.textContent = s.replace(" IST", "");
  };
  tickClock(); setInterval(tickClock, 30 * 1000);

  // ---------- Random pass number ----------
  const passNo = document.getElementById("passNo");
  if (passNo) {
    const a = Math.floor(100 + Math.random() * 900);
    const b = Math.floor(1000 + Math.random() * 9000);
    passNo.textContent = `${a}-${b}`;
  }

  // ---------- Nav scroll state ----------
  const nav = document.getElementById("nav");
  let lastScrolled = false;
  const onScroll = () => {
    const y = window.scrollY;
    const scrolled = y > 24;
    if (scrolled !== lastScrolled && nav) {
      nav.classList.toggle("is-scrolled", scrolled);
      lastScrolled = scrolled;
    }
  };
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  const navToggle = document.getElementById("navToggle");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    if (navToggle) navToggle.setAttribute("aria-expanded", String(open));
  };
  if (navToggle) navToggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  document.querySelectorAll(".menu nav a, .menu .menu-cta a").forEach(a => a.addEventListener("click", () => setMenu(false)));

  // ---------- Smooth scroll for hash links ----------
  document.querySelectorAll('a[href^="#"]:not(.row)').forEach(a => {
    a.addEventListener("click", e => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // ---------- Route switching: bus follows the selected destination ----------
  // Map destination key → SVG path id, station-style code, name, geometry.
  const ROUTES = {
    PURI:        { id: "route-puri",        label: "PUR", name: "Puri",        km: "500 KM", dur: "9H 30M",  ms: 12000 },
    BHUBANESWAR: { id: "route-bhubaneswar", label: "BBI", name: "Bhubaneswar", km: "370 KM", dur: "7H 00M",  ms: 10000 },
    KOLKATA:     { id: "route-kolkata",     label: "CCU", name: "Kolkata",     km: "540 KM", dur: "10H 30M", ms: 13000 },
    RANCHI:      { id: "route-ranchi",      label: "IXR", name: "Ranchi",      km: "210 KM", dur: "4H 30M",  ms: 7000  },
    JAMSHEDPUR:  { id: "route-jamshedpur",  label: "IXW", name: "Jamshedpur",  km: "180 KM", dur: "3H 30M",  ms: 6500  },
    SAMBALPUR:   { id: "route-sambalpur",   label: "SBP", name: "Sambalpur",   km: "165 KM", dur: "3H 30M",  ms: 6500  },
    SIMLIPAL:    { id: "route-simlipal",    label: "SIM", name: "Simlipal",    km: "230 KM", dur: "5H 00M",  ms: 7500  },
    VARANASI:    { id: "route-varanasi",    label: "VNS", name: "Varanasi",    km: "880 KM", dur: "16H 00M", ms: 17000 },
    CUTTACK:     { id: "route-cuttack",     label: "CTC", name: "Cuttack",     km: "350 KM", dur: "7H 00M",  ms: 9500  },
  };

  const mapStateEl = document.getElementById("mapState");
  const mapDistEl  = document.getElementById("mapDist");

  // Boarding-pass refs
  const passFromCode = document.getElementById("passFromCode");
  const passFromName = document.getElementById("passFromName");
  const passToCode   = document.getElementById("passToCode");
  const passToName   = document.getElementById("passToName");
  const passR        = document.querySelector(".pass-r");

  // Derive a 3-letter station-style code from any text.
  // Prefers a curated/IATA-real code from ROUTES; falls back to first
  // 3 alphabetic chars of the input (uppercased).
  function codeFromText(text) {
    const t = (text || "").trim();
    if (!t) return null;
    const upper = t.toUpperCase();
    if (ROUTES[upper] && ROUTES[upper].label) return ROUTES[upper].label;
    // Fuzzy: starts-with match against known dests
    const startsWith = Object.keys(ROUTES).find(k => k.startsWith(upper));
    if (startsWith && ROUTES[startsWith].label) return ROUTES[startsWith].label;
    // Final fallback: first 3 alpha chars
    const stripped = upper.replace(/[^A-Z]/g, "");
    return stripped.slice(0, 3) || null;
  }

  function titleCase(s) {
    return (s || "").trim().split(/\s+/).map(w => w[0] ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(" ");
  }

  // Update the boarding pass for ANY destination text, even ones with no
  // route on our map. The pass always wins a 3-letter code.
  function updatePassFromText(text) {
    if (!passToCode) return;
    const t = (text || "").trim();
    if (!t) {
      passToCode.textContent = "—";
      passToName.textContent = "choose route";
      if (passR) passR.classList.remove("is-active");
      return;
    }
    const upper = t.toUpperCase();
    const route = ROUTES[upper] || ROUTES[Object.keys(ROUTES).find(k => k.startsWith(upper)) || ""];
    if (route) {
      passToCode.textContent = route.label;
      passToName.textContent = route.name;
    } else {
      passToCode.textContent = codeFromText(t) || "—";
      passToName.textContent = titleCase(t);
    }
    if (passR) passR.classList.add("is-active");
    passToCode.style.animation = "none";
    void passToCode.getBoundingClientRect();
    passToCode.style.animation = "";
  }
  // Backwards-compat wrapper for setActiveRoute callers
  function updatePassPanel(dest) {
    if (!dest) { updatePassFromText(""); return; }
    const r = ROUTES[dest];
    updatePassFromText(r ? r.name : dest);
  }

  // Derive an IATA-ish code from any free-text "to" value
  function codeFor(text) {
    const upper = (text || "").trim().toUpperCase();
    if (!upper) return null;
    if (ROUTES[upper]) return upper;
    // Fuzzy: starts-with match against known dests
    const keys = Object.keys(ROUTES);
    const startsWith = keys.find(k => k.startsWith(upper));
    if (startsWith) return startsWith;
    return null;
  }

  function setActiveRoute(destKey, opts) {
    const r = ROUTES[destKey];
    if (!r) return;
    const fillForm = !!(opts && opts.fillForm);

    document.querySelectorAll(".route-line").forEach(el => {
      el.classList.toggle("is-active", el.getAttribute("data-route") === r.id);
    });
    const activeEl = document.querySelector(`.route-line[data-route="${r.id}"]`);
    if (activeEl) {
      activeEl.classList.remove("is-active");
      void activeEl.getBoundingClientRect();
      activeEl.classList.add("is-active");
    }

    document.querySelectorAll(".pin").forEach(p => p.classList.remove("is-active"));
    const pin = document.getElementById("pin-" + r.id);
    if (pin) pin.classList.add("is-active");

    const oldBus = document.getElementById("busMover");
    if (oldBus) {
      const newBus = oldBus.cloneNode(true);
      const am = newBus.querySelector("#busMotion");
      const mp = newBus.querySelector("#busMpath");
      if (mp) mp.setAttribute("href", "#" + r.id);
      if (am) am.setAttribute("dur", (r.ms / 1000) + "s");
      oldBus.replaceWith(newBus);
    }

    if (mapStateEl) mapStateEl.textContent = "● LIVE ROUTE · " + r.name.toUpperCase();
    if (mapDistEl)  mapDistEl.textContent  = `RKL → ${r.label} · ${r.km} · ${r.dur}`;

    // Only overwrite the form's "to" field when explicitly asked (row CLICK).
    // Hovering or typing must never fight the user's input.
    if (fillForm) {
      const toInput = document.querySelector('.pass-form input[name="to"]');
      if (toInput) toInput.value = r.name;
    }
    updatePassPanel(destKey);
  }

  // Wire rows: click & hover preview the route on the (sticky) map alongside.
  function wireRouteRows() {
    document.querySelectorAll(".row[data-row]").forEach(row => {
      const dest = row.dataset.dest;
      if (!ROUTES[dest]) return;
      row.addEventListener("click", (e) => {
        e.preventDefault();
        setActiveRoute(dest, { fillForm: true });
      });
      if (matchMedia("(hover: hover)").matches) {
        let hoverTimer = null;
        row.addEventListener("mouseenter", () => {
          hoverTimer = setTimeout(() => setActiveRoute(dest, { fillForm: false }), 220);
        });
        row.addEventListener("mouseleave", () => clearTimeout(hoverTimer));
      }
    });
  }
  wireRouteRows();

  // Live-update the boarding pass when the form's "from"/"to" fields change
  function wireFormSync() {
    const toInput   = document.querySelector('.pass-form input[name="to"]');
    const fromInput = document.querySelector('.pass-form input[name="from"]');

    if (toInput) {
      const onTo = () => {
        // Always reflect text in the pass — even Mumbai / Delhi / unknown cities.
        updatePassFromText(toInput.value);
        // If the text matches a known route, also preview it on the map.
        const code = codeFor(toInput.value);
        if (code) setActiveRoute(code, { fillForm: false });
      };
      toInput.addEventListener("input", onTo);
      toInput.addEventListener("change", onTo);
    }

    if (fromInput && passFromCode) {
      const onFrom = () => {
        const v = (fromInput.value || "").trim();
        if (!v) {
          passFromCode.textContent = "RKL";
          passFromName.textContent = "Rourkela";
          return;
        }
        passFromCode.textContent = codeFromText(v) || "RKL";
        passFromName.textContent = titleCase(v);
      };
      fromInput.addEventListener("input", onFrom);
    }

    // Date — only show on the boarding pass when it's filled
    const dateInput = document.querySelector('.pass-form input[name="date"]');
    const passDate = document.getElementById("passDate");
    const passDateValue = document.getElementById("passDateValue");
    if (dateInput) {
      // Default the travel-date field to today (local time).
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      dateInput.value = `${yyyy}-${mm}-${dd}`;
      dateInput.min = dateInput.value;
    }
    if (dateInput && passDate && passDateValue) {
      const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
      const updateDate = () => {
        if (!dateInput.value) { passDate.hidden = true; return; }
        const [y, m, d] = dateInput.value.split("-");
        if (!y || !m || !d) { passDate.hidden = true; return; }
        passDateValue.textContent = `${d} ${MONTHS[parseInt(m, 10) - 1]} '${y.slice(-2)}`;
        passDate.hidden = false;
        // Pop animation
        passDate.style.animation = "none";
        void passDate.getBoundingClientRect();
        passDate.style.animation = "";
      };
      dateInput.addEventListener("input", updateDate);
      dateInput.addEventListener("change", updateDate);
      updateDate();
    }
  }
  wireFormSync();

  // Default: Puri
  setTimeout(() => setActiveRoute("PURI"), 500);

  // ---------- Departures board: Solari split-flap rendering ----------
  // Real flap-boards cycle each char through random letters before settling.
  const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·→/";
  function makeFlapsHTML(text) {
    if (!text) return "";
    const chars = String(text).split("");
    return `<span class="flaps">` + chars.map((c, i) => {
      const ch = c === " " ? " " : c;
      const target = ch === " " ? "&nbsp;" : ch;
      const d = (i * 0.04).toFixed(2);
      return `<span class="flap"><span class="flap-inner" data-target="${target}" style="animation-delay:${d}s">${target}</span></span>`;
    }).join("") + `</span>`;
  }
  // After a row is rendered, cycle each flap-inner through random chars before landing.
  function shuffleFlaps(scope, opts) {
    const cycles = (opts && opts.cycles) || 7;
    const interval = (opts && opts.interval) || 38;
    const stagger = (opts && opts.stagger) || 28;
    scope.querySelectorAll(".flap-inner").forEach((el, idx) => {
      const target = el.dataset.target || el.textContent;
      if (target === "&nbsp;" || target === " ") return;
      let i = 0;
      setTimeout(() => {
        const id = setInterval(() => {
          if (i >= cycles - 1) {
            el.innerHTML = target;
            clearInterval(id);
          } else {
            el.textContent = FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)];
          }
          i++;
        }, interval);
      }, idx * stagger);
    });
  }

  function buildRow(row) {
    const status = row.dataset.status || "";
    const dest   = row.dataset.dest   || "";
    const dist   = row.dataset.dist   || "";
    const dur    = row.dataset.dur    || "";
    const from   = row.dataset.from   || "";
    const tag    = row.dataset.tag    || "";
    row.innerHTML = `
      <span class="status">${status}</span>
      <span class="dest">${dest}<small>${tag}</small></span>
      <span class="dist">${makeFlapsHTML(dist)}</span>
      <span class="dur">${makeFlapsHTML(dur)}</span>
      <span class="from">${from}</span>
      <span class="arrow-cell">→</span>
    `;
    // Solari shuffle the dist/dur columns
    shuffleFlaps(row);
  }

  const boardRows = document.querySelectorAll(".row[data-row]");
  // We delay render until rows scroll into view, so the flap animation triggers visibly.
  const boardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting && !entry.target.dataset.built) {
        const idx = Array.from(boardRows).indexOf(entry.target);
        const row = entry.target;
        row.dataset.built = "1";
        // Build with a slight delay per row for cascade
        setTimeout(() => buildRow(row), idx * 80);
        boardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });
  // HTML is pre-populated for SEO/no-JS — only attach observer for animation.
  boardRows.forEach(r => boardObserver.observe(r));

  // ---------- Periodic re-flap of board (subtle "live update" feel) ----------
  setInterval(() => {
    if (document.hidden) return;
    const visible = Array.from(boardRows).filter(r => {
      const rect = r.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
    if (visible.length === 0) return;
    const r = visible[Math.floor(Math.random() * visible.length)];
    if (r.dataset.built) buildRow(r);
  }, 7000);

  // ---------- Odometer count-up ----------
  const counters = document.querySelectorAll("[data-count]");
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10) || 0;
      const dur = 1400;
      const start = performance.now();
      const from = 0;
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const v = Math.floor(from + (target - from) * ease(t));
        el.textContent = v;
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target;
      };
      requestAnimationFrame(step);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach(c => countObserver.observe(c));

  // ---------- Stamp drop-in ----------
  const stamps = document.querySelectorAll("[data-stamp]");
  const stampObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const idx = Array.from(stamps).indexOf(entry.target);
        setTimeout(() => entry.target.classList.add("in"), idx * 120);
        stampObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  stamps.forEach(s => stampObserver.observe(s));

  // ---------- Reveal-on-scroll ----------
  const reveals = document.querySelectorAll("[data-reveal]");
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach(r => revealObserver.observe(r));

  // ---------- Hero parallax (light): map card tilts with mouse ----------
  const mapCard = document.querySelector(".map-card");
  if (mapCard && matchMedia("(hover: hover)").matches) {
    const heroRight = document.querySelector(".hero-right");
    let raf = null;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = heroRight.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mapCard.style.transform = `rotate(${-1.4 + x * 2}deg) translate3d(${x * 6}px, ${y * 4}px, 0)`;
        raf = null;
      });
    };
    const onLeave = () => { mapCard.style.transform = ""; };
    if (heroRight) {
      heroRight.addEventListener("mousemove", onMove);
      heroRight.addEventListener("mouseleave", onLeave);
    }
  }

  // ---------- Pass barcode random heights for organic feel ----------
  document.querySelectorAll(".pass-barcode span").forEach(s => {
    const h = 50 + Math.random() * 50;
    s.style.height = h + "%";
  });

  // ---------- Section headline clip-path reveal ----------
  const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
        headingObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll(".section-head .display").forEach(h => headingObserver.observe(h));

  // ---------- Stub cards stagger reveal ----------
  const stubs = document.querySelectorAll(".stub");
  const stubObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        stubObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  stubs.forEach(s => stubObserver.observe(s));

  // ---------- Hero number underline shimmer ----------
  document.querySelectorAll(".hero-meta .num").forEach(n => {
    requestAnimationFrame(() => n.classList.add("in"));
  });

  // ---------- Boarding pass 3D mouse tilt ----------
  const passEl = document.querySelector(".pass");
  if (passEl && matchMedia("(hover: hover)").matches) {
    let raf = null;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = passEl.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        passEl.classList.add("tilt");
        passEl.style.setProperty("--rx", (-y * 5) + "deg");
        passEl.style.setProperty("--ry", (x * 6) + "deg");
        raf = null;
      });
    };
    const onLeave = () => {
      passEl.classList.remove("tilt");
      passEl.style.removeProperty("--rx");
      passEl.style.removeProperty("--ry");
    };
    passEl.addEventListener("mousemove", onMove);
    passEl.addEventListener("mouseleave", onLeave);
  }

  // ---------- Map: smooth viewBox pan + zoom to active route ----------
  const ROUTE_SVG = document.getElementById("routeSvg");
  const FULL_VIEW = [0, 0, 720, 720];
  function getRouteBbox(routeId) {
    // Origin (Rourkela) at 285,374; destination from #pin-<routeId> circle.
    const pin = document.querySelector(`#pin-${routeId} circle`);
    if (!pin) return null;
    const ox = 285, oy = 374;
    const dx = parseFloat(pin.getAttribute("cx"));
    const dy = parseFloat(pin.getAttribute("cy"));
    const minX = Math.min(ox, dx), maxX = Math.max(ox, dx);
    const minY = Math.min(oy, dy), maxY = Math.max(oy, dy);
    const w = maxX - minX, h = maxY - minY;
    const padX = Math.max(120, w * 0.55);
    const padY = Math.max(120, h * 0.55);
    let bw = w + 2 * padX;
    let bh = h + 2 * padY;
    // Keep square (matches SVG's 1:1 aspect)
    const side = Math.max(bw, bh);
    bw = bh = side;
    // Clamp to canvas
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    let x = cx - bw / 2;
    let y = cy - bh / 2;
    if (x < -40) x = -40;
    if (y < -40) y = -40;
    if (x + bw > 760) x = 760 - bw;
    if (y + bh > 760) y = 760 - bh;
    return [x, y, bw, bh];
  }
  let viewRaf = null;
  function animateViewBox(target, duration) {
    if (!ROUTE_SVG) return;
    duration = duration || 900;
    const cur = ROUTE_SVG.getAttribute("viewBox").split(/[ ,]+/).map(parseFloat);
    const start = performance.now();
    if (viewRaf) cancelAnimationFrame(viewRaf);
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const e = ease(t);
      const v = [
        cur[0] + (target[0] - cur[0]) * e,
        cur[1] + (target[1] - cur[1]) * e,
        cur[2] + (target[2] - cur[2]) * e,
        cur[3] + (target[3] - cur[3]) * e,
      ];
      ROUTE_SVG.setAttribute("viewBox", v.join(" "));
      if (t < 1) viewRaf = requestAnimationFrame(frame);
      else viewRaf = null;
    }
    viewRaf = requestAnimationFrame(frame);
  }
  // Hook into route activation: pan/zoom whenever setActiveRoute fires.
  const _origSetActiveRoute = setActiveRoute;
  setActiveRoute = function (destKey, opts) {
    _origSetActiveRoute(destKey, opts);
    const r = ROUTES[destKey];
    if (r) {
      const box = getRouteBbox(r.id);
      if (box) animateViewBox(box, 900);
    }
  };
  // Reset view if user hovers off the board (gentle ambient feel)
  const boardEl = document.querySelector(".board");
  if (boardEl && matchMedia("(hover: hover)").matches) {
    let resetTimer = null;
    boardEl.addEventListener("mouseleave", () => {
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => animateViewBox(FULL_VIEW, 1200), 600);
    });
    boardEl.addEventListener("mouseenter", () => clearTimeout(resetTimer));
  }

  // ---------- Magnetic primary buttons ----------
  if (matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const magnetBtns = Array.from(document.querySelectorAll(".btn-primary"));
    let magRaf = null;
    function onMagMove(e) {
      if (magRaf) return;
      magRaf = requestAnimationFrame(() => {
        magnetBtns.forEach(btn => {
          const rect = btn.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.hypot(dx, dy);
          const range = 130;
          if (dist > range) {
            if (btn.classList.contains("is-magnet")) {
              btn.classList.remove("is-magnet");
              btn.style.transform = "";
            }
            return;
          }
          btn.classList.add("is-magnet");
          const f = (1 - dist / range) * 0.28;
          btn.style.transform = `translate(${dx * f}px, ${dy * f}px)`;
        });
        magRaf = null;
      });
    }
    window.addEventListener("mousemove", onMagMove, { passive: true });
  }

  // ---------- Page-load curtain ----------
  // Full curtain (~2.4s) on first visit; skipped on repeat in same session.
  try {
    if (sessionStorage.getItem("zv:seen") === "1") {
      document.body.classList.add("curtain-skip");
    } else {
      sessionStorage.setItem("zv:seen", "1");
    }
  } catch (_) { /* sessionStorage blocked */ }
  const curtain = document.querySelector(".curtain");
  if (curtain) {
    setTimeout(() => curtain.classList.add("gone"), 2500);
  }

  // ---------- Form: decorative submit feedback ----------
  const bookForm = document.getElementById("bookForm");
  if (bookForm) {
    bookForm.addEventListener("submit", () => {
      const btn = bookForm.querySelector("button[type=submit]");
      if (btn) {
        btn.querySelector("span").textContent = "Booking…";
      }
    });
  }
})();
