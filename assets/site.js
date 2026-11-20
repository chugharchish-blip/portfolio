(function () {
  var root = document.documentElement;

  // Review-mode highlighting for items awaiting confirmation
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  if (store("review-off") === "1") root.classList.add("review-off");
  document.querySelectorAll("[data-review-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      root.classList.toggle("review-off");
      store("review-off", root.classList.contains("review-off") ? "1" : "0");
    });
  });

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) { if (e.target.closest("a")) links.classList.remove("open"); });
  }

  // Active section in nav
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (navAnchors.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navAnchors.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href") === "#" + en.target.id ? "true" : "false"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navAnchors.forEach(function (a) { var s = document.querySelector(a.getAttribute("href")); if (s) io.observe(s); });
  }

  // Copy buttons
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () { var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = t; }, 1600); };
      var fallback = function () {
        var el = document.getElementById(btn.getAttribute("aria-controls"));
        if (!el) return;
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        btn.textContent = "Selected, press Ctrl+C";
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    });
  });


  // PDF links: inside the Claude artifact viewer, files can't be opened by link,
  // so hand them to the viewer's download prompt. Elsewhere they stay plain links.
  var dlReady = (window.claude && window.claude.use) ? window.claude.use("downloads").catch(function () { return null; }) : null;
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-pdf]");
    if (!a || !dlReady) return;
    e.preventDefault();
    var label = a.textContent;
    dlReady.then(function (dl) {
      if (!dl) { a.textContent = "Download not available in this viewer"; return; }
      return fetch(a.getAttribute("href")).then(function (r) { return r.blob(); }).then(function (blob) {
        return dl.save({ filename: a.getAttribute("href").split("/").pop(), data: blob });
      }).catch(function (err) {
        if (err && err.code === "declined") return;
        a.textContent = "Download failed, try again";
        setTimeout(function () { a.textContent = label; }, 2500);
      });
    });
  });


  // ---------- Reading progress bar (case studies) ----------
  if (document.querySelector(".cs-hero")) {
    var nav = document.querySelector(".nav");
    var bar = document.createElement("div"); bar.className = "progress"; bar.setAttribute("aria-hidden", "true");
    var fill = document.createElement("i"); bar.appendChild(fill); nav.appendChild(bar);
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  // ---------- Home: filter work by focus area ----------
  var chips = document.querySelectorAll("[data-filter]");
  function applyFilter(key) {
    chips.forEach(function (c) { var on = c.getAttribute("data-filter") === key; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
    var others = 0;
    document.querySelectorAll("[data-areas]").forEach(function (el) {
      var show = key === "all" || el.getAttribute("data-areas").split(" ").indexOf(key) > -1;
      el.classList.toggle("off", !show);
      if (show && el.closest(".other")) others++;
    });
    var empty = document.querySelector(".filter-empty"); if (empty) empty.hidden = others > 0;
  }
  chips.forEach(function (c) { c.addEventListener("click", function () { applyFilter(c.getAttribute("data-filter")); }); });
  document.querySelectorAll("[data-filter-link]").forEach(function (a) {
    a.addEventListener("click", function () { applyFilter(a.getAttribute("data-filter-link")); });
  });

  // ---------- Banking: step through the fund-flow map ----------
  var map = document.getElementById("fundmap");
  var trace = document.querySelector("[data-trace]");
  if (map && trace) {
    var captions = [
      "Stage 1 of 6. The consortium lends to the borrower (E1). The permitted end use of each loan was taken from the sanction letters.",
      "Stage 2 of 6. The CEO, CTO and directors drew loans. Each drawdown was tested against its sanctioned purpose.",
      "Stage 3 of 6. Money moved from the borrower to four group companies soon after disbursement. One of these was never disclosed as a related party.",
      "Stage 4 of 6. Funds passed through five conduit entities that had little actual business.",
      "Stage 5 of 6. Funds were traced to three final destinations that the lenders had not approved.",
      "Stage 6 of 6. Fake purchase and billing entries were recorded back at the borrower so the outflows looked like trade payments."
    ];
    var cur = 0, cap = trace.querySelector(".trace-cap"), count = trace.querySelector(".trace-count");
    var next = trace.querySelector("[data-trace-next]"), prev = trace.querySelector("[data-trace-prev]");
    var restCap = cap.textContent;
    function render() {
      map.classList.toggle("tracing", cur > 0);
      map.querySelectorAll("[data-step]").forEach(function (el) {
        var st = +el.getAttribute("data-step");
        el.classList.toggle("lit", st === cur);
        el.classList.toggle("seen", st < cur);
      });
      cap.textContent = cur ? captions[cur - 1] : restCap;
      count.textContent = cur ? cur + " / 6" : "";
      next.textContent = cur === 0 ? "Trace the money step by step" : cur === 6 ? "Start again" : "Next stage →";
      prev.disabled = cur <= 1;
    }
    next.addEventListener("click", function () { cur = cur === 6 ? 1 : cur + 1; render(); });
    prev.addEventListener("click", function () { if (cur > 1) { cur--; render(); } });
    trace.querySelector("[data-trace-all]").addEventListener("click", function () { cur = 0; render(); });
    render();
  }

  // ---------- Health insurance: stage details ----------
  var panel = document.getElementById("stage-panel");
  if (panel) {
    var stages = {
      1: ["Ghost patients and dummy registrations: beneficiaries who did not exist, or were not treated, were registered and claimed for.", "Registrations with no treatment trail behind them, and identity details repeated across different beneficiaries.", "Identity verification at enrolment and admission."],
      2: ["Payments to ambulance drivers for bringing patients to particular hospitals, never disclosed to the scheme.", "Clusters of admissions coming from the same referral source.", "Referral monitoring and disclosure requirements."],
      3: ["False billing traced to entities connected to the hospital's directors.", "Directors of the provider also appearing on the records of billing counterparties.", "Conflict-of-interest declarations and claim audit."],
      4: ["Scheme payouts were traced after they reached providers, linking the claims findings to the procurement side.", "Transfers to counterparties that lined up with payout dates and amounts.", "Post-payment monitoring of how provider funds were used."],
      5: ["Money was routed through intercompany deposits and counterparty accounts.", "Deposits to and from counterparties with no clear business purpose.", "Related-party and treasury monitoring."],
      6: ["Kickbacks, shell companies and a fake vendor network in procurement. The network was later shut down.", "Vendors with no real operations, and payments that returned to insiders.", "Vendor due diligence and segregation of duties in procure-to-pay."]
    };
    var f = { found: panel.querySelector('[data-f="found"]'), flag: panel.querySelector('[data-f="flag"]'), control: panel.querySelector('[data-f="control"]') };
    function pick(n) {
      f.found.textContent = stages[n][0]; f.flag.textContent = stages[n][1]; f.control.textContent = stages[n][2];
      panel.querySelectorAll("[data-stage-btn]").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-stage-btn") == n ? "true" : "false"); });
      document.querySelectorAll("g[data-stage]").forEach(function (g) { g.classList.toggle("active", g.getAttribute("data-stage") == n); });
    }
    panel.querySelectorAll("[data-stage-btn]").forEach(function (b) { b.addEventListener("click", function () { pick(b.getAttribute("data-stage-btn")); }); });
    document.querySelectorAll("g[data-stage]").forEach(function (g) {
      g.addEventListener("click", function () { pick(g.getAttribute("data-stage")); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(g.getAttribute("data-stage")); } });
    });
    pick(1);
  }

  // ---------- Analytics: reconciliation demo (sample data) ----------
  var recon = document.querySelector("[data-recon]");
  if (recon) {
    // [date (ISO), reference, books, bank]; null = missing on that side
    var rows = [
      ["2025-03-03", "Agent A collection", 48250, 48250],
      ["2025-03-04", "Agent B collection", 120000, 120000],
      ["2025-03-05", "Counter sales", 36780, 35780],
      ["2025-03-08", "Cash deposit CD-114", 25500, 25500],
      ["2025-03-10", "Agent C collection", 62410, null],
      ["2025-03-11", "Agent A collection", 51090, 51090],
      ["2025-03-12", "Agent E collection", 50000, 50000],
      ["2025-03-13", "Unidentified receipt", null, 18600],
      ["2025-03-14", "Agent D collection", 44375, 44375]
    ];
    var tbody = recon.querySelector("[data-rows]");
    var fmt = function (n) { return n == null ? "—" : n.toLocaleString("en-IN"); };
    var day = function (iso) { var d = new Date(iso + "T00:00:00"); return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }); };
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.innerHTML = "<td></td><td></td><td class=\"r\"></td><td class=\"r\"></td><td><span class=\"res\"></span></td>";
      tr.children[0].textContent = day(r[0]); tr.children[1].textContent = r[1];
      tr.children[2].textContent = fmt(r[2]); tr.children[3].textContent = fmt(r[3]);
      tbody.appendChild(tr);
    });
    var trs = tbody.querySelectorAll("tr");
    function rulesOn() { var o = {}; recon.querySelectorAll("[data-rule]").forEach(function (c) { o[c.getAttribute("data-rule")] = c.checked; }); return o; }
    function check(r, on) {
      var hits = [];
      if (on.missing && r[2] != null && r[3] == null) hits.push("Not in bank");
      if (on.unrec && r[2] == null && r[3] != null) hits.push("Not in books");
      if (on.diff && r[2] != null && r[3] != null && r[2] !== r[3]) hits.push("Differs by ₹" + fmt(Math.abs(r[2] - r[3])));
      var amt = r[2] != null ? r[2] : r[3];
      if (on.round && amt % 10000 === 0) hits.push("Round amount");
      var wd = new Date(r[0] + "T00:00:00").getDay();
      if (on.weekend && (wd === 0 || wd === 6)) hits.push("Weekend posting");
      return hits;
    }
    function paint(i, on) {
      var hits = check(rows[i], on), res = trs[i].querySelector(".res");
      var text = hits.length ? hits.join(" · ") : "Matched", was = res.textContent;
      res.className = "res " + (hits.length ? "ex" : "ok");
      res.textContent = text;
      if (was && was !== "Waiting" && was !== text) { trs[i].classList.remove("changed"); void trs[i].offsetWidth; trs[i].classList.add("changed"); }
      return hits.length;
    }
    function summary(ex) {
      [["ex", ex], ["ok", rows.length - ex]].forEach(function (p) {
        var el = recon.querySelector('[data-n="' + p[0] + '"]');
        if (el.textContent !== String(p[1])) { el.textContent = p[1]; el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
      });
    }
    function runAll() { var on = rulesOn(), ex = 0; rows.forEach(function (_, i) { ex += paint(i, on) ? 1 : 0; }); summary(ex); }
    recon.querySelectorAll("[data-rule]").forEach(function (c) { c.addEventListener("change", runAll); });
    var replayBtn = recon.querySelector("[data-replay]"), timer = null;
    replayBtn.addEventListener("click", function () {
      clearInterval(timer);
      var on = rulesOn(), i = 0, ex = 0;
      trs.forEach(function (tr) { var r = tr.querySelector(".res"); r.className = "res pending"; r.textContent = "Waiting"; });
      summary(0); replayBtn.disabled = true;
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      timer = setInterval(function () {
        trs.forEach(function (tr) { tr.classList.remove("scan"); });
        if (i >= rows.length) { clearInterval(timer); replayBtn.disabled = false; return; }
        trs[i].classList.add("scan");
        ex += paint(i, on) ? 1 : 0; summary(ex); i++;
      }, reduce ? 0 : 280);
    });
    runAll();
  }

  // Chart tooltips: any element with data-tip
  var tip = document.createElement("div");
  tip.className = "tip"; tip.setAttribute("role", "tooltip");
  document.body.appendChild(tip);
  function show(e) {
    var t = e.target.closest("[data-tip]"); if (!t) return;
    tip.textContent = t.getAttribute("data-tip"); tip.classList.add("on"); move(e);
  }
  function move(e) {
    var x = (e.clientX || 0) + 14, y = (e.clientY || 0) + 14;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    if (x + w > window.innerWidth - 8) x = window.innerWidth - w - 8;
    if (y + h > window.innerHeight - 8) y = (e.clientY || 0) - h - 10;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  document.addEventListener("mouseover", show);
  document.addEventListener("mousemove", function (e) { if (tip.classList.contains("on")) move(e); });
  document.addEventListener("mouseout", function (e) { if (e.target.closest("[data-tip]")) tip.classList.remove("on"); });
  document.addEventListener("focusin", function (e) {
    var t = e.target.closest("[data-tip]"); if (!t) return;
    var r = t.getBoundingClientRect(); show({ target: t, clientX: r.right, clientY: r.top });
  });
  document.addEventListener("focusout", function () { tip.classList.remove("on"); });
})();

/* ---------- Motion ----------
   Plain JavaScript, no libraries. Everything is visible before this runs, and none
   of it runs when the visitor's device asks for reduced motion. */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;
  var root = document.documentElement;
  root.classList.add("motion");
  var vh = window.innerHeight;
  var below = function (el) { return el.getBoundingClientRect().top > vh * 0.92; };
  var once = function (els, cb, opts) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } });
    }, opts || { rootMargin: "0px 0px -10% 0px" });
    els.forEach(function (el) { io.observe(el); });
  };

  // 1. Scroll reveal with a short stagger for items that enter together
  var sel = [
    ".sec-head", ".area", ".work-list li", ".other > div", ".cv li", ".skill-cols > div", "#skills .table-scroll", ".contact-item",
    ".exec-grid > div", ".kpi", ".cs-section > .wp", ".cs-section > h2", ".cs-section > h3", ".cs-section > p", ".cs-section > ul",
    ".cs-section > .table-scroll", ".cs-section > .rag-key", ".phases li", ".steps li", ".exhibit", ".callout", ".takeaways", ".uae-box"
  ].join(",");
  var targets = Array.prototype.filter.call(document.querySelectorAll(sel), below);
  targets.forEach(function (el) { el.classList.add("reveal"); });
  var batch = [], timer = null;
  var flush = function () {
    batch.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    batch.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 70, 420) + "ms";
      el.classList.add("in");
      el.addEventListener("transitionend", function done() {
        el.removeEventListener("transitionend", done);
        el.style.transitionDelay = ""; el.classList.remove("reveal", "in");
      });
    });
    batch = []; timer = null;
  };
  once(targets, function (el) { batch.push(el); if (!timer) timer = setTimeout(flush, 16); });

  // 2. Count up headline figures such as "₹347 cr", "25%" and "13"
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var count = function (el) {
    var text = el.textContent, m = text.match(/^(\D*)(\d+)(\D*)$/);
    if (!m) return;
    var end = +m[2], start = null, dur = 1100;
    el.setAttribute("aria-label", text);
    var step = function (ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      el.textContent = m[1] + Math.round(end * ease(t)) + m[3];
      if (t < 1) requestAnimationFrame(step); else el.textContent = text;
    };
    requestAnimationFrame(step);
  };
  once(Array.prototype.slice.call(document.querySelectorAll(".facts dd, .kpi b, .work-list .fig")), function (el) {
    setTimeout(function () { count(el); }, below(el) ? 150 : 450);
  }, { threshold: 0.6 });

  // 3. Fund-flow map: lines draw themselves stage by stage the first time it scrolls into view
  var fundmap = document.getElementById("fundmap");
  if (fundmap) {
    once([fundmap], function () {
      fundmap.querySelectorAll("path[data-step]").forEach(function (p) {
        var stepNo = +p.getAttribute("data-step"), delay = (stepNo - 1) * 220;
        if (p.classList.contains("e-fake")) {
          p.style.opacity = "0"; p.style.transition = "opacity 500ms ease " + (delay + 300) + "ms";
          requestAnimationFrame(function () { requestAnimationFrame(function () { p.style.opacity = ""; }); });
          return;
        }
        var len = p.getTotalLength();
        p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
        p.getBoundingClientRect();
        p.style.transition = "stroke-dashoffset 700ms cubic-bezier(.22,.7,.2,1) " + delay + "ms";
        p.style.strokeDashoffset = "0";
        setTimeout(function () { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; p.style.transition = ""; }, delay + 800);
      });
    }, { threshold: 0.35 });
  }

  // 4. Bar chart grows when it scrolls into view
  document.querySelectorAll(".chart-sm").forEach(function (c) {
    if (!below(c)) return;
    c.classList.add("pending");
    once([c], function () { requestAnimationFrame(function () { c.classList.remove("pending"); }); }, { threshold: 0.5 });
  });

  // 5. n8n canvas: nodes appear left to right, edges follow
  var canvas = document.querySelector(".n8n-canvas");
  if (canvas && below(canvas)) {
    canvas.querySelectorAll("g[data-tip], .nn-e, .nn-o").forEach(function (el) {
      el.style.transitionDelay = Math.round(el.getBBox().x * 0.9) + "ms";
    });
    canvas.classList.add("nn-pending");
    once([canvas], function () { requestAnimationFrame(function () { canvas.classList.remove("nn-pending"); }); }, { threshold: 0.3 });
  }
})();

/* ---------- n8n "Run workflow" ----------
   Plays the workflow like an n8n execution: each node turns active, then green with a
   tick, and its outgoing connections animate. Works with reduced motion too (no dash
   animation, same states). */
(function () {
  var btn = document.querySelector("[data-n8n-run]");
  var canvas = document.querySelector(".n8n-canvas");
  if (!btn || !canvas) return;
  var status = document.querySelector(".n8n-status");
  var ns = "http://www.w3.org/2000/svg";
  var nodes = Array.prototype.slice.call(canvas.querySelectorAll("g[data-tip]"));
  var box = function (g) { return g.querySelector(".nn-n").getBBox(); };
  nodes.forEach(function (g) {
    var b = box(g), badge = document.createElementNS(ns, "g");
    badge.setAttribute("class", "nn-badge");
    badge.innerHTML = '<circle cx="' + (b.x + b.width - 4) + '" cy="' + (b.y + 4) + '" r="9"/><path d="M' + (b.x + b.width - 8) + ' ' + (b.y + 4) + ' l3 3 l5 -6"/>';
    g.appendChild(badge);
  });
  // order by column, top row first
  nodes.sort(function (a, b) { var A = box(a), B = box(b); return A.x - B.x || A.y - B.y; });
  var edges = Array.prototype.slice.call(canvas.querySelectorAll(".nn-e"));
  var startsAt = function (e) { var m = e.getAttribute("d").match(/^M([\d.]+) ([\d.]+)/); return { x: +m[1], y: +m[2] }; };
  var running = false;
  btn.addEventListener("click", function () {
    if (running) return;
    running = true; btn.disabled = true;
    nodes.forEach(function (g) { g.classList.remove("nn-active", "nn-ok"); });
    edges.forEach(function (e) { e.classList.remove("nn-flow"); });
    var cols = [];
    nodes.forEach(function (g) { var x = box(g).x; var c = cols.filter(function (k) { return k.x === x; })[0]; if (!c) { c = { x: x, nodes: [] }; cols.push(c); } c.nodes.push(g); });
    var i = 0;
    status.textContent = "Running…";
    var tick = function () {
      if (i > 0) cols[i - 1].nodes.forEach(function (g) { g.classList.remove("nn-active"); g.classList.add("nn-ok"); });
      if (i === cols.length) {
        edges.forEach(function (e) { e.classList.remove("nn-flow"); });
        status.textContent = "Run complete: 9 items checked, 6 exceptions sent to the register and Power BI refreshed (sample data, see the demo below).";
        running = false; btn.disabled = false; btn.textContent = "Run again";
        return;
      }
      var col = cols[i];
      col.nodes.forEach(function (g) { g.classList.add("nn-active"); });
      edges.forEach(function (e) {
        var s = startsAt(e), right = col.x + box(col.nodes[0]).width;
        e.classList.toggle("nn-flow", Math.abs(s.x - right) < 8);
      });
      i++;
      setTimeout(tick, 520);
    };
    tick();
  });
})();

/* ---------- Motion, round 2 ---------- */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Back to top (works with or without motion)
  var top = document.createElement("button");
  top.type = "button"; top.className = "to-top"; top.setAttribute("aria-label", "Back to top");
  top.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(top);
  top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  var onScroll = function () { top.classList.toggle("show", window.scrollY > window.innerHeight * 0.9); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Copy button feedback
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () { b.classList.remove("done"); void b.offsetWidth; b.classList.add("done"); });
  });

  // Sliding gold indicator under the current nav link (home page)
  var links = document.querySelector(".nav-links");
  if (links && links.querySelector('a[href^="#"]')) {
    var ink = document.createElement("span"); ink.className = "nav-ink"; ink.setAttribute("aria-hidden", "true");
    links.appendChild(ink);
    var place = function () {
      var cur = links.querySelector('a[aria-current="true"]');
      if (!cur) { ink.style.opacity = "0"; return; }
      var lr = links.getBoundingClientRect(), r = cur.getBoundingClientRect();
      ink.style.width = r.width + "px"; ink.style.transform = "translateX(" + (r.left - lr.left) + "px)"; ink.style.opacity = "1";
    };
    new MutationObserver(place).observe(links, { attributes: true, subtree: true, attributeFilter: ["aria-current"] });
    window.addEventListener("resize", place);
  }

  // Cursor spotlight on cards (hover devices only)
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".area, .skill-cols > div, .work-list a, .exec-grid > div").forEach(function (el) {
      el.classList.add("spot");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px"); el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  // Experience timeline rail fills as you scroll through it
  var cv = document.querySelector(".cv");
  if (cv) {
    var rail = document.createElement("span"); rail.className = "cv-rail"; rail.setAttribute("aria-hidden", "true");
    rail.innerHTML = "<i></i>"; cv.appendChild(rail);
    var items = cv.querySelectorAll("li");
    var fill = function () {
      if (reduce) { rail.style.setProperty("--p", 1); items.forEach(function (li) { li.classList.add("reached"); }); return; }
      var r = cv.getBoundingClientRect(), mark = window.innerHeight * 0.7;
      var p = Math.max(0, Math.min(1, (mark - r.top) / r.height));
      rail.style.setProperty("--p", p.toFixed(3));
      items.forEach(function (li) { li.classList.toggle("reached", li.getBoundingClientRect().top + 30 < mark); });
    };
    window.addEventListener("scroll", fill, { passive: true }); window.addEventListener("resize", fill); fill();
  }

  if (reduce || !("IntersectionObserver" in window)) return;

  // Focus line: each of the four areas lights up once, in turn
  var spans = document.querySelectorAll(".focus-line > span");
  spans.forEach(function (s, i) {
    setTimeout(function () { s.classList.add("lit"); setTimeout(function () { s.classList.remove("lit"); }, 650); }, 700 + i * 420);
  });

  // Hero pattern drifts slightly with scroll (scroll-linked, not a loop)
  var hero = document.querySelector(".hero, .cs-hero");
  if (hero) {
    var drift = function () { var y = Math.min(window.scrollY, 600); hero.style.backgroundPosition = "right " + Math.round(-y * 0.15) + "px top " + Math.round(y * 0.25) + "px"; };
    window.addEventListener("scroll", drift, { passive: true });
  }

  // Pop-ins: RAG pills, heat map, money-trail dots
  var pop = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; pop.unobserve(e.target);
      var kids = e.target.querySelectorAll(".sev, .pin, .cell, .dot");
      kids.forEach(function (k, i) { k.style.animationDelay = Math.min(i * 60, 900) + "ms"; });
      e.target.classList.add("popped");
    });
  }, { threshold: 0.3 });
  document.querySelectorAll(".findings, .heat, .rag-key, #trail .diagram").forEach(function (el) {
    if (el.getBoundingClientRect().top > window.innerHeight * 0.9) pop.observe(el);
  });

  // Follow the money: a coin travels along each lit line of the fund-flow map
  var map = document.getElementById("fundmap");
  if (map) {
    var svg = map.querySelector("svg"), NS = "http://www.w3.org/2000/svg";
    var send = function (paths, stagger) {
      paths.forEach(function (p, i) {
        var len = p.getTotalLength(), c = document.createElementNS(NS, "circle");
        c.setAttribute("r", "4.5"); c.setAttribute("class", "money"); svg.appendChild(c);
        var t0 = null, dur = 1100, delay = (stagger ? i * 90 : i * 60);
        var step = function (ts) {
          if (t0 === null) t0 = ts + delay;
          var t = Math.max(0, Math.min(1, (ts - t0) / dur)), pt = p.getPointAtLength(len * (1 - Math.pow(1 - t, 2)));
          c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y); c.style.opacity = ts < t0 ? 0 : (t > .85 ? (1 - t) / .15 : 1);
          if (t < 1) requestAnimationFrame(step); else c.remove();
        };
        requestAnimationFrame(step);
      });
    };
    // once after the map has drawn itself
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return; o.disconnect();
      setTimeout(function () { send(Array.prototype.slice.call(svg.querySelectorAll("path.e-ok, path.e-div, path.e-rpt")), true); }, 1500);
    }, { threshold: 0.35 }).observe(map);
    // and along the highlighted lines at each stage of "Trace the money"
    document.querySelectorAll("[data-trace-next], [data-trace-prev]").forEach(function (b) {
      b.addEventListener("click", function () {
        svg.querySelectorAll(".money").forEach(function (c) { c.remove(); });
        setTimeout(function () { send(Array.prototype.slice.call(svg.querySelectorAll("path.lit")), false); }, 120);
      });
    });
  }
})();

/* ---------- Motion, round 3: text, background, template ---------- */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nav = document.querySelector(".nav");
  var onScroll = function () { if (nav) nav.classList.toggle("scrolled", window.scrollY > 40); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Reading progress on every page (case studies already have one)
  if (nav && !nav.querySelector(".progress")) {
    var bar = document.createElement("div"); bar.className = "progress"; bar.setAttribute("aria-hidden", "true");
    var fill = document.createElement("i"); bar.appendChild(fill); nav.appendChild(bar);
    var prog = function () { var h = document.documentElement.scrollHeight - window.innerHeight; fill.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + "%"; };
    window.addEventListener("scroll", prog, { passive: true }); prog();
  }
  if (reduce || !("IntersectionObserver" in window)) return;

  // Masked text reveal. Only the visible text is split; screen readers get the original via aria-label.
  var split = function (el, byChar) {
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 1) { walk(n); return; }
        if (n.nodeType !== 3 || !n.textContent.trim()) return;
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
          var parts = byChar ? tok.split("") : [tok];
          var word = document.createElement("span"); word.style.whiteSpace = "nowrap";
          parts.forEach(function (p) {
            var w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
            var inner = document.createElement("span"); inner.textContent = p;
            inner.style.transitionDelay = (i++ * (byChar ? 35 : 55)) + "ms";
            w.appendChild(inner); word.appendChild(w);
          });
          frag.appendChild(word);
        });
        n.parentNode.replaceChild(frag, n);
      });
    };
    walk(el);
    el.classList.add("split", "ready");
  };
  var play = function (el) { requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("play"); }); }); };
  var heroName = document.querySelector(".hero h1");
  if (heroName) { split(heroName, true); setTimeout(function () { play(heroName); }, 120); }
  var csTitle = document.querySelector(".cs-hero h1");
  if (csTitle) { split(csTitle, false); setTimeout(function () { play(csTitle); }, 160); }
  var heads = Array.prototype.filter.call(document.querySelectorAll(".sec-head h2, .cs-section > h2"), function (h) {
    return h.textContent.trim().split(/\s+/).length <= 9 && h.getBoundingClientRect().top > window.innerHeight * 0.9;
  });
  heads.forEach(function (h) { split(h, false); });
  var hio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { hio.unobserve(e.target); play(e.target); } }); }, { rootMargin: "0px 0px -12% 0px" });
  heads.forEach(function (h) { hio.observe(h); });

  // Table rows rise in one after another
  var rows = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; rows.unobserve(e.target);
      e.target.querySelectorAll("tbody tr").forEach(function (tr, i) { tr.style.animationDelay = Math.min(i * 70, 700) + "ms"; });
      e.target.classList.add("popped");
    });
  }, { threshold: 0.2 });
  document.querySelectorAll(".map-table, .findings").forEach(function (t) { if (t.getBoundingClientRect().top > window.innerHeight * 0.9) rows.observe(t); });

  // Tilt on capability and skill cards
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".area, .skill-cols > div").forEach(function (el) {
      el.classList.add("tilt");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty("--ry", (x * 3).toFixed(2) + "deg"); el.style.setProperty("--rx", (-y * 3).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }

  // Drifting gold glow in sand sections, only while on screen
  var live = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("live", e.isIntersecting); }); });
  document.querySelectorAll(".section.alt").forEach(function (s) { live.observe(s); });

  // Living network of connected points behind the dark bands (pauses off screen and in background tabs)
  document.querySelectorAll(".hero, .cs-hero, .contact").forEach(function (band) {
    var c = document.createElement("canvas"); c.className = "net"; c.setAttribute("aria-hidden", "true");
    band.insertBefore(c, band.firstChild);
    var ctx = c.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, pts = [], mouse = null, visible = false, raf = null;
    var size = function () {
      var r = band.getBoundingClientRect(); W = r.width; H = r.height;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, Math.max(22, W * H / 16000)));
      pts = []; for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22, r: Math.random() * 1.6 + .8 });
    };
    var LINK = 130;
    var frame = function () {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) { ctx.strokeStyle = "rgba(201,164,92," + (0.22 * (1 - d / LINK)).toFixed(3) + ")"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        if (mouse) {
          var mx = p.x - mouse.x, my = p.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
          if (md < 170) { ctx.strokeStyle = "rgba(224,192,127," + (0.45 * (1 - md / 170)).toFixed(3) + ")"; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
        }
        ctx.fillStyle = "rgba(224,192,127,.7)"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = visible && !document.hidden ? requestAnimationFrame(frame) : null;
    };
    var start = function () { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    size(); frame(); c.classList.add("on");
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; start(); }).observe(band);
    document.addEventListener("visibilitychange", start);
    window.addEventListener("resize", function () { size(); });
    band.addEventListener("pointermove", function (e) { var r = band.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    band.addEventListener("pointerleave", function () { mouse = null; });
  });
})();
