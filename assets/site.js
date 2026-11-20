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
      res.className = "res " + (hits.length ? "ex" : "ok");
      res.textContent = hits.length ? hits.join(" · ") : "Matched";
      return hits.length;
    }
    function summary(ex) {
      recon.querySelector('[data-n="ex"]').textContent = ex;
      recon.querySelector('[data-n="ok"]').textContent = rows.length - ex;
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
