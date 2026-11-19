/*
 * AI SDLC guide: the interactive pipeline map, the labs and the audit walk.
 * Ported from the Multiplatform course site; plain DOM code, no framework.
 *
 * Map:
 *  - draws right-angled arrows between stages, the feedback loops and the
 *    knowledge flows (straight vertical lines wherever two stages overlap);
 *  - "Walk through" moves a work item (the ball) along the arrows with a
 *    narration; it slides along a card's edge to the outgoing arrow, leaves a
 *    trail, and lands with a ripple;
 *  - layers: feedback loops, knowledge flows, audit trail (records + trace back);
 *  - clicking a document in the project knowledge shows which stages read it;
 *  - actor buttons highlight one actor's stages; arrow keys step the walk.
 * Audit walk: steps back from a line of code to the goal; links can be broken.
 *
 * Without JavaScript, stages and documents are plain links to their sections
 * and the audit walk shows every step.
 */
(function () {
  "use strict";

  var SVG = "http://www.w3.org/2000/svg";
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVG, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(node);
    return node;
  }

  function marker(defs, id, cls) {
    var m = el("marker", { id: id, "class": cls, viewBox: "0 0 10 10", refX: "9", refY: "5",
      markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z" }, m);
  }

  function n(v) { return Math.round(v * 10) / 10; }

  /* Text from the widget's data-i18n JSON (for the Polish pages), with the
     English text as the fallback; {name} placeholders are filled from vars. */
  function T(root, key, fallback, vars) {
    var d = root.__i18n;
    if (d === undefined) {
      try { d = JSON.parse(root.getAttribute("data-i18n") || "{}"); } catch (e) { d = {}; }
      root.__i18n = d;
    }
    var out = d[key] || fallback;
    Object.keys(vars || {}).forEach(function (k) { out = out.split("{" + k + "}").join(vars[k]); });
    return out;
  }
  function pt(x, y) { return { x: x, y: y }; }
  function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

  /* A polyline through `points` with rounded corners of radius `r`. */
  function ortho(points, r) {
    r = r === undefined ? 7 : r;
    var d = "M" + n(points[0].x) + "," + n(points[0].y);
    for (var i = 1; i < points.length - 1; i++) {
      var p0 = points[i - 1];
      var p1 = points[i];
      var p2 = points[i + 1];
      var l1 = dist(p0, p1);
      var l2 = dist(p1, p2);
      if (l1 < 0.5 || l2 < 0.5) continue;
      var rr = Math.min(r, l1 / 2, l2 / 2);
      var a = pt(p1.x + (p0.x - p1.x) / l1 * rr, p1.y + (p0.y - p1.y) / l1 * rr);
      var b = pt(p1.x + (p2.x - p1.x) / l2 * rr, p1.y + (p2.y - p1.y) / l2 * rr);
      d += " L" + n(a.x) + "," + n(a.y) + " Q" + n(p1.x) + "," + n(p1.y) + " " + n(b.x) + "," + n(b.y);
    }
    var last = points[points.length - 1];
    return d + " L" + n(last.x) + "," + n(last.y);
  }

  /* Downward connector from box a to box b: one straight line when they
     overlap horizontally, otherwise down, across and down. */
  function connect(a, b) {
    var inset = 10;
    var y1 = a.b;
    var y2 = b.y - 1;
    var lo = Math.max(a.x, b.x) + inset;
    var hi = Math.min(a.r, b.r) - inset;
    if (lo <= hi) {
      var x;
      if (a.cx >= b.x + inset && a.cx <= b.r - inset) x = a.cx;
      else if (b.cx >= a.x + inset && b.cx <= a.r - inset) x = b.cx;
      else x = (lo + hi) / 2;
      return ortho([pt(x, y1), pt(x, y2)]);
    }
    var my = (y1 + y2) / 2;
    return ortho([pt(a.cx, y1), pt(a.cx, my), pt(b.cx, my), pt(b.cx, y2)], 6);
  }

  /* ---- walking along a card's border ---- */

  function perimT(b, p) {
    var x = Math.min(Math.max(p.x, b.x), b.r);
    var y = Math.min(Math.max(p.y, b.y), b.b);
    var dt = Math.abs(y - b.y), db = Math.abs(y - b.b), dl = Math.abs(x - b.x), dr = Math.abs(x - b.r);
    var m = Math.min(dt, db, dl, dr);
    if (m === dt) return x - b.x;
    if (m === dr) return b.w + (y - b.y);
    if (m === db) return b.w + b.h + (b.r - x);
    return 2 * b.w + b.h + (b.b - y);
  }

  function perimPoint(b, t) {
    var P = 2 * (b.w + b.h);
    t = ((t % P) + P) % P;
    if (t <= b.w) return pt(b.x + t, b.y);
    if (t <= b.w + b.h) return pt(b.r, b.y + (t - b.w));
    if (t <= 2 * b.w + b.h) return pt(b.r - (t - b.w - b.h), b.b);
    return pt(b.x, b.b - (t - 2 * b.w - b.h));
  }

  /* Points from p1 to p2 along the border of b, the shorter way round. */
  function perimWalk(b, p1, p2) {
    var P = 2 * (b.w + b.h);
    var t1 = perimT(b, p1);
    var t2 = perimT(b, p2);
    var d = t2 - t1;
    if (d > P / 2) d -= P;
    if (d < -P / 2) d += P;
    var corners = [0, b.w, b.w + b.h, 2 * b.w + b.h];
    var points = [perimPoint(b, t1)];
    var crossed = [];
    corners.forEach(function (c) {
      [c - P, c, c + P].forEach(function (cc) {
        if (d > 0 && cc > t1 && cc < t1 + d) crossed.push(cc);
        if (d < 0 && cc < t1 && cc > t1 + d) crossed.push(cc);
      });
    });
    crossed.sort(function (x, y) { return d > 0 ? x - y : y - x; });
    crossed.forEach(function (c) { points.push(perimPoint(b, c)); });
    points.push(perimPoint(b, t1 + d));
    return points;
  }

  function startOf(d) {
    var m = /^M\s*([-\d.]+)[ ,]([-\d.]+)/.exec(d);
    return m ? pt(+m[1], +m[2]) : null;
  }

  /* ------------------------------------------------------------------ */
  /* Pipeline map                                                        */
  /* ------------------------------------------------------------------ */

  function initMap(root) {
    var map = root.querySelector(".sdlc-map");
    if (!map || map.dataset.ready) return;
    map.dataset.ready = "1";
    root.classList.add("is-js");

    var panel = root.querySelector(".sdlc-panel");
    var kbBox = map.querySelector(".sdlc-kb");
    var rail = map.querySelector(".sdlc-rail");
    var railFill = map.querySelector(".sdlc-rail__fill");
    var status = root.querySelector(".sdlc-toolbar__status");
    var playBtn = root.querySelector('[data-action="play"]');
    var prevBtn = root.querySelector('[data-action="prev"]');
    var nextBtn = root.querySelector('[data-action="next"]');

    var stages = {};
    var ordered = [];
    map.querySelectorAll("a.sdlc-stage").forEach(function (s) {
      stages[s.dataset.stage] = s;
      ordered.push(s);
    });
    ordered.sort(function (a, b) { return (+a.dataset.order) - (+b.dataset.order); });

    var steps = Array.prototype.map.call(root.querySelectorAll("ol.sdlc-walk > li"), function (li) {
      return { stage: li.dataset.stage, result: li.dataset.result || "", html: li.innerHTML };
    });

    var wires = el("svg", { "class": "sdlc-wires", "aria-hidden": "true" });
    var tokens = el("svg", { "class": "sdlc-wires sdlc-tokens", "aria-hidden": "true" });
    map.appendChild(wires);
    map.appendChild(tokens);

    var TRAIL = reducedMotion ? 0 : 7;
    var trail = [];
    for (var t = 0; t < TRAIL; t++) {
      trail.push(el("circle", { r: String(5.5 - t * 0.6), "class": "sdlc-trail", opacity: "0" }, tokens));
    }
    var ball = el("g", { "class": "sdlc-ball", visibility: "hidden" }, tokens);
    el("circle", { r: "12", "class": "sdlc-ball__halo" }, ball);
    el("circle", { r: "7", "class": "sdlc-ball__core" }, ball);

    var state = { step: -1, doc: null, audit: false, selected: null, timer: null, raf: null,
      at: null, pos: null, travel: null };
    var paths = {};
    var dynLayer = null;

    function html(container, attr, key) {
      var node = root.querySelector(container + " [data-" + attr + '="' + key + '"]');
      return node ? node.innerHTML : "";
    }

    function box(node) {
      var b = map.getBoundingClientRect();
      var r = node.getBoundingClientRect();
      var x = r.left - b.left;
      var y = r.top - b.top;
      return { x: x, y: y, w: r.width, h: r.height, r: x + r.width, b: y + r.height,
        cx: x + r.width / 2, cy: y + r.height / 2 };
    }

    function nodeOf(key) { return key === "kb" ? kbBox : stages[key]; }
    function chipOf(node) { return node ? getComputedStyle(node).getPropertyValue("--chip") : ""; }
    function cssVar(name) { return getComputedStyle(map).getPropertyValue(name); }

    /* ----- drawing ----- */

    /* What to draw besides the forward flow comes from the map's data-flows
       JSON: feedback loops and the flows to and from the knowledge column.
       { loops: [{from, to, label, kind: "fail"|"loop", layer: "base"|"loops",
                  lane: 0..1 (share of the space right of the lanes) | "near",
                  dy, labelAt: "from"|"mid", labelDy, wideOnly}],
         kb:    [{to | from, layer: "base"|"knowledge", label}] } */
    var flows = {};
    try { flows = JSON.parse(map.dataset.flows || "{}"); } catch (e) { flows = {}; }
    var lanes = Array.prototype.slice.call(map.querySelectorAll(".sdlc-lane"));

    function draw() {
      while (wires.firstChild) wires.removeChild(wires.firstChild);
      paths = {};
      var defs = el("defs", {}, wires);
      marker(defs, "sdlc-m-grey", "m-grey");
      marker(defs, "sdlc-m-loop", "m-loop");
      marker(defs, "sdlc-m-fail", "m-fail");
      marker(defs, "sdlc-m-kb", "m-kb");
      var base = el("g", {}, wires);
      var loops = el("g", { "class": "layer-loops" }, wires);
      var know = el("g", { "class": "layer-knowledge" }, wires);
      dynLayer = el("g", {}, wires);

      function add(g, key, d, cls, mk) {
        paths[key] = el("path", { d: d, "class": cls || "", "marker-end": "url(#" + mk + ")" }, g);
      }
      function label(g, text, x, y, cls, rotate) {
        var tx = el("text", { x: String(n(x)), y: String(n(y)), "class": cls,
          "text-anchor": rotate ? "middle" : "start" }, g);
        if (rotate) tx.setAttribute("transform", "rotate(-90 " + n(x) + " " + n(y) + ")");
        tx.textContent = text;
      }

      // Forward flow.
      for (var i = 0; i < ordered.length - 1; i++) {
        add(base, ordered[i].dataset.stage + ">" + ordered[i + 1].dataset.stage,
          connect(box(ordered[i]), box(ordered[i + 1])), "", "sdlc-m-grey");
      }

      var lanesRight = Math.max.apply(null, lanes.map(function (l) { return box(l).r; }));
      var room = map.clientWidth - lanesRight;
      var wide = room >= 30;
      var kb = box(kbBox);

      (flows.loops || []).forEach(function (L) {
        if (!stages[L.from] || !stages[L.to]) return;
        var a = box(stages[L.from]);
        var b = box(stages[L.to]);
        var g = L.layer === "base" ? base : loops;
        var fail = L.kind === "fail";
        var cls = fail ? "is-gate-loop" : "is-loop";
        var mk = fail ? "sdlc-m-fail" : "sdlc-m-loop";
        var tcls = fail ? "t-fail" : "t-loop";
        var ty = b.cy + (L.dy || 0);
        var key = L.from + ">" + L.to;
        if (L.lane === "near") {
          var xp = Math.max(a.r, b.r) + 16;
          add(g, key, ortho([pt(a.r, a.cy), pt(xp, a.cy), pt(xp, ty), pt(b.r + 2, ty)]), cls, mk);
          if (L.label) label(g, L.label, xp + 5, (a.cy + ty) / 2 + 3, tcls);
          return;
        }
        var x = lanesRight + room * (L.lane || 0.5);
        add(g, key, ortho([pt(a.r, a.cy), pt(x, a.cy), pt(x, ty), pt(b.r + 2, ty)]), cls, mk);
        if (!L.label || (L.wideOnly && !wide)) return;
        if (L.labelAt === "from") label(g, L.label, a.r + 8, a.cy - 5, tcls);
        else label(g, L.label, x - 4, (ty + a.cy) / 2 + (L.labelDy || 0), tcls, true);
      });

      (flows.kb || []).forEach(function (F) {
        var key = F.to ? "kb>" + F.to : F.from + ">kb";
        var st = stages[F.to || F.from];
        if (!st) return;
        var s0 = box(st);
        var g = F.layer === "knowledge" ? know : base;
        var cls = F.layer === "knowledge" ? "is-kb-extra" : "is-kb";
        var inside = s0.cy >= kb.y + 8 && s0.cy <= kb.b - 8;
        var above = s0.cy < kb.y + 8;
        var pts;
        if (F.to) {
          if (inside) pts = [pt(kb.r, s0.cy), pt(s0.x - 1, s0.cy)];
          else pts = [pt(kb.cx, above ? kb.y : kb.b), pt(kb.cx, s0.cy), pt(s0.x - 1, s0.cy)];
        } else {
          if (inside) pts = [pt(s0.x, s0.cy), pt(kb.r + 1, s0.cy)];
          else pts = [pt(s0.x, s0.cy), pt(kb.cx, s0.cy), pt(kb.cx, above ? kb.y - 1 : kb.b + 1)];
        }
        add(g, key, ortho(pts, inside ? 7 : 10), cls, "sdlc-m-kb");
        if (F.label && !inside) {
          if (above) label(g, F.label, kb.cx + 5, s0.cy - 5, "t-kb");
          else label(g, F.label, kb.cx + 5, F.to ? s0.cy - 5 : kb.b + 14, "t-kb");
        }
      });

      if (state.doc) drawDoc(state.doc);
      if (state.at) { stopTravel(); setBall(home(state.at)); }
      if (state.audit && state.selected) trace(state.selected);
    }

    /* ----- the ball ----- */

    function home(key) {
      var b = box(nodeOf(key));
      return pt(b.cx, b.y);
    }

    function setBall(p) {
      state.pos = p;
      ball.setAttribute("transform", "translate(" + n(p.x) + " " + n(p.y) + ")");
      ball.setAttribute("visibility", "visible");
    }

    function ripple(p, cls) {
      if (reducedMotion) return;
      var c = el("circle", { cx: String(n(p.x)), cy: String(n(p.y)), r: "7", "class": "sdlc-ripple " + (cls || "") }, tokens);
      c.addEventListener("animationend", function () { c.remove(); });
      setTimeout(function () { if (c.parentNode) c.remove(); }, 1200);
    }

    function bump(node) {
      if (reducedMotion || !node) return;
      node.classList.remove("is-arrive");
      void node.offsetWidth;
      node.classList.add("is-arrive");
    }

    function setMood(result) {
      ball.classList.remove("is-fail", "is-pass");
      if (result) {
        void ball.getBoundingClientRect();
        ball.classList.add(result === "fail" ? "is-fail" : "is-pass");
      }
    }

    function stopTravel() {
      if (state.raf) cancelAnimationFrame(state.raf);
      // An interrupted move leaves its guide path behind: remove it.
      tokens.querySelectorAll(".sdlc-probe").forEach(function (p) { p.remove(); });
      state.raf = null;
      if (state.travel) state.travel.classList.remove("is-travel");
      state.travel = null;
      trail.forEach(function (c) { c.setAttribute("opacity", "0"); });
      ball.classList.remove("is-moving");
    }

    /* Move the ball from where it is now to stage `to`, following the arrow
       from `from` when there is one. */
    function moveBall(from, to, opts) {
      opts = opts || {};
      stopTravel();
      var target = nodeOf(to);
      state.at = to;
      if (!state.pos || reducedMotion || opts.jump) {
        setBall(home(to));
        if (!reducedMotion) { ripple(state.pos); bump(target); }
        if (opts.done) opts.done();
        return;
      }

      var stored = from ? paths[from + ">" + to] : null;
      var d;
      var endPoint;
      if (stored) {
        var arrow = stored.getAttribute("d");
        var start = startOf(arrow);
        // Slide along the current card's edge to where the arrow leaves it.
        var walk = perimWalk(box(nodeOf(from)), state.pos, start);
        d = ortho(walk.length > 1 ? walk : [state.pos, start], 4) + " " + arrow.replace(/^M/, "L");
        var probeArrow = el("path", { d: arrow }, tokens);
        endPoint = probeArrow.getPointAtLength(probeArrow.getTotalLength());
        probeArrow.remove();
        state.travel = stored;
        stored.classList.add("is-travel");
      } else {
        // No arrow between these two: an arc from here to there.
        var to0 = home(to);
        var mx = (state.pos.x + to0.x) / 2;
        var my = (state.pos.y + to0.y) / 2;
        var dx = to0.x - state.pos.x;
        var dy = to0.y - state.pos.y;
        var len0 = Math.hypot(dx, dy) || 1;
        var bend = Math.min(90, len0 * 0.35);
        var cx = mx + (-dy / len0) * bend;
        var cy = my + (dx / len0) * bend;
        d = "M" + n(state.pos.x) + "," + n(state.pos.y) + " Q" + n(cx) + "," + n(cy) + " " + n(to0.x) + "," + n(to0.y);
        endPoint = to0;
      }

      var probe = el("path", { d: d, fill: "none", stroke: "none", "class": "sdlc-probe" }, tokens);
      var len = probe.getTotalLength();
      var dur = Math.max(550, Math.min(1700, len / 0.38));
      var t0 = null;
      ball.classList.add("is-moving");
      ball.classList.remove("is-fail", "is-pass");

      function frame(ts) {
        if (t0 === null) t0 = ts;
        var f = Math.min(1, (ts - t0) / dur);
        var e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
        var at = e * len;
        setBall(probe.getPointAtLength(at));
        for (var k = 0; k < trail.length; k++) {
          var back = at - (k + 1) * 7;
          if (back <= 0 || f >= 1) { trail[k].setAttribute("opacity", "0"); continue; }
          var p = probe.getPointAtLength(back);
          trail[k].setAttribute("cx", String(n(p.x)));
          trail[k].setAttribute("cy", String(n(p.y)));
          trail[k].setAttribute("opacity", String(n(0.5 * (1 - k / trail.length))));
        }
        if (f < 1) {
          state.raf = requestAnimationFrame(frame);
          return;
        }
        probe.remove();
        setBall(pt(endPoint.x, endPoint.y));
        stopTravel();
        ripple(state.pos, opts.result ? "is-" + opts.result : "");
        bump(target);
        if (opts.done) opts.done();
      }
      state.raf = requestAnimationFrame(frame);
    }

    /* ----- selection helpers ----- */

    function clearMarks() {
      ordered.forEach(function (s) { s.classList.remove("is-active", "is-fail", "is-pass"); });
    }

    function clearFilter() {
      map.classList.remove("has-filter");
      ordered.forEach(function (s) { s.classList.remove("is-match"); });
      root.querySelectorAll("button.sdlc-chip[data-actor]").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      kbBox.querySelectorAll("a.sdlc-kb__doc").forEach(function (d) { d.classList.remove("is-active"); });
      state.doc = null;
      if (dynLayer) while (dynLayer.firstChild) dynLayer.removeChild(dynLayer.firstChild);
    }

    function setPanel(inner, colour) {
      panel.style.setProperty("--chip", colour || "");
      panel.innerHTML = inner;
    }

    function sectionLink(node) {
      return '<p><a href="' + node.getAttribute("href") + '">' + T(root, "readSection", "Read the full section →") + '</a></p>';
    }

    function trace(key) {
      var upTo = +stages[key].dataset.order;
      ordered.forEach(function (s) { s.classList.toggle("is-traced", +s.dataset.order <= upTo); });
      var rb = box(rail);
      var sb = box(stages[key]);
      railFill.style.height = Math.max(0, sb.cy - rb.y) + "px";
    }

    function untrace() {
      ordered.forEach(function (s) { s.classList.remove("is-traced"); });
      railFill.style.height = "0";
    }

    function selectStage(key) {
      stop();
      clearMarks();
      var s = stages[key];
      s.classList.add("is-active");
      state.selected = key;
      for (var i = 0; i < steps.length; i++) {
        if (steps[i].stage === key) { state.step = i; break; }
      }
      setMood("");
      moveBall(state.at, key);
      updateStatus();
      if (state.audit) {
        trace(key);
        setPanel(html(".sdlc-audits", "audit", key) +
          "<p>" + T(root, "traced", "Highlighted: every stage this record can be traced back through, up to the idea.") + "</p>" + sectionLink(s),
          cssVar("--sdlc-audit"));
      } else {
        setPanel(html(".sdlc-details", "detail", key) + sectionLink(s), chipOf(s));
      }
    }

    function drawDoc(key) {
      while (dynLayer.firstChild) dynLayer.removeChild(dynLayer.firstChild);
      var doc = kbBox.querySelector('a.sdlc-kb__doc[data-doc="' + key + '"]');
      if (!doc) return;
      var d = box(doc);
      var kb = box(kbBox);
      var firstLane = Math.min.apply(null, lanes.map(function (l) { return box(l).x; }));
      var trunk = (kb.r + firstLane) / 2;
      (doc.dataset.feeds || "").split(" ").forEach(function (k) {
        if (!stages[k]) return;
        var s = box(stages[k]);
        el("path", { d: ortho([pt(d.r, d.cy), pt(trunk, d.cy), pt(trunk, s.cy), pt(s.x - 1, s.cy)], 6),
          "class": "is-dyn", "marker-end": "url(#sdlc-m-kb)" }, dynLayer);
      });
    }

    function selectDoc(key, link) {
      stop();
      var again = state.doc === key;
      clearFilter();
      clearMarks();
      if (again) {
        setPanel(html(".sdlc-details", "detail", "kb"), chipOf(kbBox));
        return;
      }
      state.doc = key;
      link.classList.add("is-active");
      map.classList.add("has-filter");
      (link.dataset.feeds || "").split(" ").forEach(function (k) {
        if (stages[k]) stages[k].classList.add("is-match");
      });
      drawDoc(key);
      setPanel(html(".sdlc-kb-details", "kb", key) +
        '<p><a href="' + link.getAttribute("href") + '">' + T(root, "readKb", "Read about project knowledge →") + '</a></p>', chipOf(kbBox));
    }

    /* ----- walk-through ----- */

    function updateStatus() {
      status.textContent = state.step >= 0 ? T(root, "step", "Step {n} of {total}", { n: state.step + 1, total: steps.length }) : "";
      prevBtn.disabled = state.step <= 0;
      nextBtn.disabled = state.step >= steps.length - 1;
    }

    function go(i, forward) {
      if (i < 0 || i >= steps.length) return;
      var prev = state.step >= 0 ? steps[state.step].stage : state.at;
      state.step = i;
      var st = steps[i];
      clearMarks();
      clearFilter();
      var node = nodeOf(st.stage);
      if (st.stage === "kb") {
        kbBox.classList.remove("is-pulse");
        void kbBox.offsetWidth;
        kbBox.classList.add("is-pulse");
      } else {
        node.classList.add("is-active");
        state.selected = st.stage;
        if (state.audit) trace(st.stage);
      }
      var detail = html(".sdlc-details", "detail", st.stage);
      setPanel('<span class="sdlc-panel__step">' + T(root, "step", "Step {n} of {total}", { n: i + 1, total: steps.length }) + "</span>" +
        '<p class="sdlc-panel__narr">' + st.html + "</p>" + detail, chipOf(node));
      updateStatus();
      moveBall(forward ? prev : null, st.stage, {
        result: st.result,
        done: function () {
          if (st.result === "fail") node.classList.add("is-fail");
          if (st.result === "pass") node.classList.add("is-pass");
          setMood(st.result);
        }
      });
    }

    function stop() {
      if (state.timer) clearInterval(state.timer);
      state.timer = null;
      playBtn.textContent = T(root, "play", "▶ Walk through");
    }

    function play() {
      if (state.timer) { stop(); return; }
      if (state.step >= steps.length - 1) state.step = -1;
      playBtn.textContent = T(root, "pause", "❚❚ Pause");
      go(state.step + 1, true);
      state.timer = setInterval(function () {
        if (state.step >= steps.length - 1) { stop(); return; }
        go(state.step + 1, true);
      }, 4000);
    }

    playBtn.addEventListener("click", play);
    nextBtn.addEventListener("click", function () { stop(); go(state.step + 1, true); });
    prevBtn.addEventListener("click", function () { stop(); go(state.step - 1, false); });

    root.addEventListener("keydown", function (e) {
      if (e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); stop(); go(state.step + 1, true); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stop(); go(state.step - 1, false); }
      else if (e.key === "Escape") { stop(); clearFilter(); clearMarks(); }
    });

    /* ----- clicks on the map ----- */

    map.addEventListener("click", function (event) {
      var doc = event.target.closest("a.sdlc-kb__doc");
      if (doc) { event.preventDefault(); selectDoc(doc.dataset.doc, doc); return; }
      var kbTitle = event.target.closest("a.sdlc-kb__title");
      if (kbTitle) {
        event.preventDefault();
        stop();
        clearFilter();
        setPanel(html(".sdlc-details", "detail", "kb") +
          '<p><a href="' + kbTitle.getAttribute("href") + '">' + T(root, "readKb", "Read about project knowledge →") + '</a></p>', chipOf(kbBox));
        return;
      }
      var stage = event.target.closest("a.sdlc-stage");
      if (stage) { event.preventDefault(); clearFilter(); selectStage(stage.dataset.stage); }
    });

    /* ----- actor filter ----- */

    root.querySelectorAll("button.sdlc-chip[data-actor]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var on = chip.getAttribute("aria-pressed") !== "true";
        clearFilter();
        if (!on) return;
        chip.setAttribute("aria-pressed", "true");
        map.classList.add("has-filter");
        ordered.forEach(function (s) {
          if ((s.dataset.actors || "").split(" ").indexOf(chip.dataset.actor) >= 0) s.classList.add("is-match");
        });
      });
    });

    /* ----- layers ----- */

    root.querySelectorAll("button.sdlc-chip[data-layer]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var layer = chip.dataset.layer;
        var on = chip.getAttribute("aria-pressed") !== "true";
        chip.setAttribute("aria-pressed", on ? "true" : "false");
        map.classList.toggle("show-" + layer, on);
        if (layer === "audit") {
          state.audit = on;
          if (on) {
            if (state.selected) selectStage(state.selected);
            else setPanel(html(".sdlc-layer-info", "layer-info", "audit"), cssVar("--sdlc-audit"));
          } else {
            untrace();
            if (state.selected) selectStage(state.selected);
          }
        }
        if (layer === "loops" && on) {
          setPanel(html(".sdlc-layer-info", "layer-info", "loops"), cssVar("--sdlc-loop"));
        }
        if (layer === "knowledge" && on) {
          setPanel(html(".sdlc-layer-info", "layer-info", "knowledge"), chipOf(kbBox));
        }
      });
    });

    /* ----- layout ----- */

    draw();
    updateStatus();
    var pending = null;
    function redraw() {
      if (pending) cancelAnimationFrame(pending);
      pending = requestAnimationFrame(function () { pending = null; draw(); });
    }
    if (window.ResizeObserver) new ResizeObserver(redraw).observe(map);
    else window.addEventListener("resize", redraw);
  }

  /* ------------------------------------------------------------------ */
  /* Audit walk                                                          */
  /* ------------------------------------------------------------------ */

  function initWalk(w) {
    if (w.dataset.ready) return;
    w.dataset.ready = "1";
    w.classList.add("is-js");

    var steps = Array.prototype.slice.call(w.querySelectorAll("li.audit-walk__step"));
    var end = w.querySelector("li.audit-walk__end");
    var breaks = {};
    w.querySelectorAll("li.audit-walk__break").forEach(function (b) { breaks[b.dataset.break] = b; });
    var back = w.querySelector('[data-walk="back"]');
    var reset = w.querySelector('[data-walk="reset"]');
    var count = w.querySelector(".audit-walk__count");
    var pos = 0;

    function broken(name) {
      var cb = w.querySelector('input[data-break="' + name + '"]');
      return !!(cb && cb.checked);
    }

    function show(li) {
      w.querySelectorAll("li.is-current").forEach(function (c) { c.classList.remove("is-current"); });
      li.classList.add("is-shown", "is-current");
      li.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
    }

    function start() {
      w.querySelectorAll("ol.audit-walk__steps > li").forEach(function (li) { li.classList.remove("is-shown", "is-current"); });
      pos = 0;
      steps[0].classList.add("is-shown", "is-current");
      back.disabled = false;
      count.textContent = T(w, "step", "Step {n} of {total}", { n: 1, total: steps.length });
    }

    function step() {
      var next = pos + 1;
      if (next >= steps.length) {
        show(end);
        back.disabled = true;
        count.textContent = T(w, "complete", "Trail complete");
        return;
      }
      var need = steps[next].dataset.needs;
      if (need && broken(need) && breaks[need]) {
        show(breaks[need]);
        back.disabled = true;
        count.textContent = T(w, "lost", "Trail lost after {n} of {total} steps", { n: pos + 1, total: steps.length });
        return;
      }
      pos = next;
      show(steps[pos]);
      count.textContent = T(w, "step", "Step {n} of {total}", { n: pos + 1, total: steps.length });
    }

    back.addEventListener("click", step);
    reset.addEventListener("click", start);
    w.querySelectorAll("input[data-break]").forEach(function (cb) { cb.addEventListener("change", start); });
    start();
  }

  /* ------------------------------------------------------------------ */
  /* Section 1: take parts away from the harness                         */
  /* ------------------------------------------------------------------ */

  function initHarnessLab(lab) {
    if (lab.dataset.ready) return;
    lab.dataset.ready = "1";
    lab.classList.add("is-js");
    var harness = lab.querySelector(".harness");
    var result = lab.querySelector(".harness-lab__result");
    var parts = lab.querySelectorAll("button.harness__part");

    function text(key) {
      var node = lab.querySelector('.harness-lab__data [data-missing="' + key + '"]');
      return node ? node.innerHTML : "";
    }

    function render() {
      var missing = [];
      parts.forEach(function (p) { if (p.getAttribute("aria-pressed") === "false") missing.push(p.dataset.part); });
      harness.classList.toggle("is-broken", missing.length > 0);
      result.classList.toggle("is-broken", missing.length > 0);
      result.innerHTML = missing.length ? missing.map(text).join("") : text("none");
    }

    parts.forEach(function (p) {
      p.addEventListener("click", function () {
        p.setAttribute("aria-pressed", p.getAttribute("aria-pressed") === "false" ? "true" : "false");
        render();
      });
    });
    render();
  }

  /* ------------------------------------------------------------------ */
  /* Section 1: same task, two ways                                      */
  /* ------------------------------------------------------------------ */

  function initRace(race) {
    if (race.dataset.ready) return;
    race.dataset.ready = "1";
    race.classList.add("is-js");
    var cols = Array.prototype.map.call(race.querySelectorAll(".race__col"), function (col) {
      return { items: col.querySelectorAll("ol.race__steps > li"), count: col.querySelector(".race__count b") };
    });
    var total = Math.max.apply(null, cols.map(function (c) { return c.items.length; }));
    var status = race.querySelector(".race__status");
    var nextBtn = race.querySelector('[data-race="next"]');
    var shown = 0;

    function render() {
      cols.forEach(function (c) {
        var handoffs = 0;
        c.items.forEach(function (li, i) {
          li.classList.toggle("is-shown", i < shown);
          li.classList.toggle("is-current", i === shown - 1);
          if (i < shown && li.dataset.handoff) handoffs++;
        });
        if (c.count) c.count.textContent = String(handoffs);
      });
      status.textContent = shown ? T(race, "step", "Step {n} of {total}", { n: shown, total: total }) : "";
      nextBtn.disabled = shown >= total;
      nextBtn.textContent = shown === 0 ? T(race, "start", "▶ Start") : T(race, "next", "▶ Next step");
    }

    nextBtn.addEventListener("click", function () { if (shown < total) { shown++; render(); } });
    race.querySelector('[data-race="reset"]').addEventListener("click", function () { shown = 0; render(); });
    render();
  }

  /* ------------------------------------------------------------------ */
  /* Section 2: build a context                                          */
  /* ------------------------------------------------------------------ */

  function initCtxLab(lab) {
    if (lab.dataset.ready) return;
    lab.dataset.ready = "1";
    lab.classList.add("is-js");
    var WINDOW = 200000;
    var boxes = Array.prototype.slice.call(lab.querySelectorAll(".ctx-item input"));
    var bar = lab.querySelector(".ctx-lab__bar");
    var used = lab.querySelector(".ctx-lab__used");
    var verdict = lab.querySelector(".ctx-lab__verdict");
    var essential = boxes.filter(function (b) { return b.dataset.need; });
    var lean = essential.reduce(function (s, b) { return s + (+b.dataset.tokens); }, 0);

    function meter(name, value, pct, colour) {
      var m = lab.querySelector('.meter[data-meter="' + name + '"]');
      m.querySelector(".meter__value").textContent = value;
      var i = m.querySelector(".meter__bar i");
      i.style.width = Math.max(0, Math.min(100, pct)) + "%";
      i.style.setProperty("--m", colour);
    }

    function k(tokens) { return tokens >= 1000 ? Math.round(tokens / 1000) + "k" : String(tokens); }

    function render() {
      var css = getComputedStyle(lab);
      var fail = css.getPropertyValue("--sdlc-fail");
      var ok = css.getPropertyValue("--sdlc-tool");
      var warn = "#D97706";
      while (bar.firstChild) bar.removeChild(bar.firstChild);
      var total = 0;
      var relevant = 0;
      var dangers = [];
      boxes.forEach(function (b) {
        if (!b.checked) return;
        var t = +b.dataset.tokens;
        total += t;
        if (b.dataset.need) relevant += t;
        if (b.dataset.danger) dangers.push(b.dataset.danger);
        var seg = document.createElement("span");
        seg.className = "ctx-lab__seg";
        seg.style.setProperty("--k", getComputedStyle(b.closest(".ctx-item")).getPropertyValue("--k"));
        seg.style.width = (t / Math.max(total, WINDOW) * 100) + "%";
        seg.title = b.closest(".ctx-item").textContent.trim() + T(lab, "segTitle", ": about {k} tokens", { k: k(t) });
        bar.appendChild(seg);
      });
      // Re-scale the segments once the total is known, so an overflowing context fills the bar.
      var scale = Math.max(total, WINDOW);
      var segs = bar.querySelectorAll(".ctx-lab__seg");
      var j = 0;
      boxes.forEach(function (b) {
        if (!b.checked) return;
        segs[j++].style.width = (+b.dataset.tokens / scale * 100) + "%";
      });
      var over = total > WINDOW;
      bar.classList.toggle("is-over", over);
      used.textContent = T(lab, "used", "used: about {k}", { k: k(total) }) + (over ? T(lab, "over", " (does not fit)") : "");

      var missing = essential.filter(function (b) { return !b.checked; }).map(function (b) { return b.dataset.need; });
      var cost = total / lean;
      var focus = total ? relevant / total : 0;

      meter("cost", total ? (cost < 1 ? T(lab, "belowLean", "below the lean context") : T(lab, "xLean", "≈ {x}× lean", { x: Math.round(cost * 10) / 10 })) : "–",
        total / WINDOW * 100, cost > 3 ? fail : cost > 1.5 ? warn : ok);
      meter("focus", total ? T(lab, "relevant", "{p}% relevant", { p: Math.round(focus * 100) }) : "–", focus * 100,
        focus < 0.3 ? fail : focus < 0.7 ? warn : ok);
      meter("gaps", missing.length ? T(lab, "nOf", "{n} of {total}", { n: missing.length, total: essential.length }) : T(lab, "none", "none"),
        missing.length / essential.length * 100, missing.length ? fail : ok);

      var msg;
      var colour;
      if (dangers.length) {
        msg = T(lab, "stop", "<b>Stop.</b> This context contains {what}. Everything in the context is sent to the model's provider. Secrets and real health data never go in, whatever the task.", { what: dangers.join(T(lab, "and", " and ")) });
        colour = fail;
      } else if (over) {
        msg = T(lab, "notFit", "<b>It does not fit.</b> The harness will have to drop or summarise something, and you do not control what. The facts that matter may be the ones that go.");
        colour = fail;
      } else if (missing.length) {
        msg = T(lab, "missing", "<b>Missing facts:</b> {what}. The agent will not stop; it will fill these gaps with plausible guesses.", { what: missing.join(", ") });
        colour = warn;
      } else if (focus < 0.5) {
        msg = T(lab, "noise", "<b>Complete, but mostly noise.</b> Every fact is there, buried in {k} tokens of unrelated text, paid for again on every step of the loop.", { k: k(total - relevant) });
        colour = warn;
      } else {
        msg = T(lab, "lean", "<b>Lean and complete.</b> Everything this task needs and little else: cheap per step, and nothing for the agent to guess.");
        colour = ok;
      }
      verdict.innerHTML = msg;
      verdict.style.setProperty("--v", colour);
    }

    function preset(name) {
      boxes.forEach(function (b) {
        if (name === "lean") b.checked = !!b.dataset.need;
        else if (name === "all") b.checked = !b.dataset.danger;
        else b.checked = b.hasAttribute("data-bare");
      });
      render();
    }

    boxes.forEach(function (b) { b.addEventListener("change", render); });
    lab.querySelectorAll("[data-preset]").forEach(function (btn) {
      btn.addEventListener("click", function () { preset(btn.dataset.preset); });
    });
    preset("lean");
  }

  /* ------------------------------------------------------------------ */
  /* 5.6: drop a defect through the layers                               */
  /* ------------------------------------------------------------------ */

  function initGateLab(lab) {
    if (lab.dataset.ready) return;
    lab.dataset.ready = "1";
    lab.classList.add("is-js");
    var layers = Array.prototype.slice.call(lab.querySelectorAll(".gate-layer"));
    var track = lab.querySelector(".gate-lab__track");
    var drop = lab.querySelector(".gate-lab__drop");
    var result = lab.querySelector(".gate-lab__result");
    var now = lab.querySelector(".gate-lab__now b");
    var buttons = lab.querySelectorAll("button.gate-defect");
    var timers = [];

    function status(layer, text) { layer.querySelector(".gate-layer__status").textContent = text; }

    function clear() {
      timers.forEach(clearTimeout);
      timers = [];
      layers.forEach(function (l) {
        l.classList.remove("is-through", "is-caught", "is-unreached");
        status(l, "");
      });
      drop.classList.remove("is-on", "is-hit");
    }

    function yOf(layer) {
      var t = track.getBoundingClientRect();
      var r = layer.getBoundingClientRect();
      return r.top - t.top + r.height / 2 - drop.offsetHeight / 2;
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        clear();
        buttons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        now.textContent = btn.textContent;
        var target = btn.dataset.caught;
        var stopAt = layers.findIndex(function (l) { return l.dataset.layer === target; });
        var text = lab.querySelector('.gate-lab__data [data-defect="' + target + '"]');
        result.innerHTML = "<p>" + T(lab, "following", "Following the defect down through the layers…") + "</p>";
        var stepMs = reducedMotion ? 0 : 420;
        drop.style.transition = "none";
        drop.style.top = "-0.6rem";
        void drop.offsetWidth;
        drop.style.transition = "";
        drop.classList.add("is-on");
        layers.forEach(function (layer, i) {
          if (i > stopAt) return;
          timers.push(setTimeout(function () {
            drop.style.top = yOf(layer) + "px";
            if (i < stopAt) {
              layer.classList.add("is-through");
              status(layer, T(lab, "passes", "↓ passes"));
              return;
            }
            layer.classList.add("is-caught");
            status(layer, T(lab, "stopped", "✋ stopped here"));
            drop.classList.add("is-hit");
            layers.forEach(function (rest, k) {
              if (k > stopAt) { rest.classList.add("is-unreached"); status(rest, T(lab, "unreached", "not reached")); }
            });
            result.innerHTML = text ? text.innerHTML : "";
          }, stepMs * (i + 1)));
        });
      });
    });
  }

  function init() {
    document.querySelectorAll(".sdlc").forEach(initMap);
    document.querySelectorAll(".audit-walk").forEach(initWalk);
    document.querySelectorAll(".harness-lab").forEach(initHarnessLab);
    document.querySelectorAll(".race").forEach(initRace);
    document.querySelectorAll(".ctx-lab").forEach(initCtxLab);
    document.querySelectorAll(".gate-lab").forEach(initGateLab);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
