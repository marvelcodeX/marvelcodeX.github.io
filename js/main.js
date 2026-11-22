(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
  const live = $("#live");
  const clean = (s) => s.replace(/\s+/g, " ").trim();

  /* ---------- light / dark ---------- */
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => {
    const forced = root.getAttribute("data-theme");
    return forced ? forced === "dark" : darkQuery.matches;
  };
  $(".mode")?.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    window.dispatchEvent(new Event("themechange"));
  });

  /* ---------- entrances: anything the viewport has reached or passed is shown ---------- */
  let waiting = $$("[data-rise]");
  let riseTick = false;
  const reveal = () => {
    riseTick = false;
    const limit = window.innerHeight * 0.94;
    let n = 0;
    waiting = waiting.filter((el) => {
      if (reduce || el.getBoundingClientRect().top < limit) {
        el.style.setProperty("--i", String(Math.min(n++, 5)));
        el.classList.add("in");
        return false;
      }
      return true;
    });
  };
  const queueReveal = () => { if (!riseTick && waiting.length) { riseTick = true; requestAnimationFrame(reveal); } };
  window.addEventListener("scroll", queueReveal, { passive: true });
  window.addEventListener("resize", queueReveal);
  window.addEventListener("load", queueReveal);
  reveal();

  /* ---------- the pen words draw their underline once ---------- */
  const hands = $$(".hand");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.9 });
    hands.forEach((h) => io.observe(h));
  } else {
    hands.forEach((h) => h.classList.add("in"));
  }

  /* ---------- project tray: drag, snap, arrows, position, the card pulled up ---------- */
  const shelf = $("#shelf");
  const cards = $$(".card");
  if (shelf) {
    const prev = $('[data-shelf="-1"]');
    const next = $('[data-shelf="1"]');
    const num = $("#shelf-n");
    const thumb = $("#shelf-thumb");
    const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth + 18);

    const sync = () => {
      const max = shelf.scrollWidth - shelf.clientWidth;
      const pos = max > 0 ? shelf.scrollLeft / max : 0;
      const idx = Math.min(cards.length - 1, Math.round(shelf.scrollLeft / step()));
      const active = pos > 0.985 ? cards.length - 1 : idx;
      if (num) num.textContent = String(active + 1);
      cards.forEach((c, i) => c.classList.toggle("is-active", i === active));
      if (prev) prev.disabled = shelf.scrollLeft < 4;
      if (next) next.disabled = shelf.scrollLeft > max - 4;
      if (thumb) {
        const w = Math.max(0.18, shelf.clientWidth / shelf.scrollWidth);
        thumb.style.width = `${w * 100}%`;
        thumb.style.transform = `translateX(${pos * (1 / w - 1) * 100}%)`;
      }
    };
    shelf.addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
    window.addEventListener("resize", sync);
    window.addEventListener("load", sync);
    window.addEventListener("panelopen", sync);
    sync();

    [prev, next].forEach((b) => b?.addEventListener("click", () => {
      shelf.scrollBy({ left: Number(b.dataset.shelf) * step(), behavior: reduce ? "auto" : "smooth" });
    }));
    shelf.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); shelf.scrollBy({ left: step(), behavior: "smooth" }); }
      if (e.key === "ArrowLeft") { e.preventDefault(); shelf.scrollBy({ left: -step(), behavior: "smooth" }); }
    });

    // mouse drag with a little momentum; touch keeps native swiping
    let down = false, startX = 0, startLeft = 0, lastX = 0, vel = 0, moved = false, raf = 0;
    shelf.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; startX = lastX = e.clientX; startLeft = shelf.scrollLeft; vel = 0;
      cancelAnimationFrame(raf);
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; shelf.classList.add("is-drag"); }
      if (!moved) return;
      shelf.scrollLeft = startLeft - dx;
      vel = e.clientX - lastX; lastX = e.clientX;
    });
    const release = () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      const settle = () => {
        if (Math.abs(vel) < 0.6) { shelf.classList.remove("is-drag"); return; }
        shelf.scrollLeft -= vel; vel *= 0.93; raf = requestAnimationFrame(settle);
      };
      settle();
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    shelf.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  }

  /* ---------- project preview: the card's record beside a real screenshot ---------- */
  const pdlg = $("#proj-dlg");
  let pIndex = 0;
  const openProject = (i) => {
    if (!pdlg || !cards.length) return;
    pIndex = (i + cards.length) % cards.length;
    const card = cards[pIndex];
    const btn = $(".open-proj", card);
    const title = clean($("h3", card).textContent);
    const set = (id, text) => { $(`#${id}`).textContent = text; };
    set("pd-head", `Project record · ${pIndex + 1} of ${cards.length}`);
    set("pd-title", title);
    set("pd-class", clean($(".card-class", card).textContent));
    set("pd-status", clean($(".status", card).textContent));
    set("pd-stack", $$(".stack li", card).map((l) => l.textContent).join(" · "));
    const link = $('.actions a[href^="https://github.com"]', card);
    const src = $("#pd-src");
    src.href = link.href;
    src.textContent = link.href.replace("https://", "");
    set("pd-desc", `${clean($(".card-desc", card).textContent)} ${clean($(".card-more", card).textContent)}`);
    const img = $("#pd-img");
    img.src = btn.dataset.shot;
    img.alt = btn.dataset.alt;
    set("pd-cap", btn.dataset.note);
    if (!pdlg.open) pdlg.showModal();
    pdlg.scrollTo({ top: 0 });
  };
  cards.forEach((c, i) => $(".open-proj", c)?.addEventListener("click", () => openProject(i)));
  if (pdlg) {
    $(".pd-close", pdlg)?.addEventListener("click", () => pdlg.close());
    pdlg.addEventListener("click", (e) => { if (e.target === pdlg) pdlg.close(); });
    $("#pd-prev")?.addEventListener("click", () => openProject(pIndex - 1));
    $("#pd-next")?.addEventListener("click", () => openProject(pIndex + 1));
  }

  /* ---------- skills: filter the index by project ---------- */
  const toolFilter = $("#tool-filter");
  const toolNote = $("#tool-note");
  if (toolFilter) {
    const norm = (t) => t.toLowerCase().replace(/\s+/g, " ").trim();
    const projects = cards.map((c) => ({
      name: clean($("h3", c).textContent),
      stack: new Set($$(".stack li", c).map((l) => norm(l.textContent))),
    }));
    const chips = $$(".skills .spec li");
    chips.forEach((c) => {
      const used = projects.filter((p) => p.stack.has(norm(c.textContent)));
      if (used.length) c.title = `Used in ${used.map((p) => p.name).join(", ")}`;
    });
    const buttons = [{ label: "All", p: null }, ...projects.map((p) => ({ label: p.name, p }))].map(({ label, p }, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.setAttribute("aria-pressed", String(i === 0));
      b.addEventListener("click", () => {
        buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        chips.forEach((c) => {
          c.classList.remove("match", "dim");
          if (!p) return;
          c.classList.add(p.stack.has(norm(c.textContent)) ? "match" : "dim");
        });
        const n = chips.filter((c) => c.classList.contains("match")).length;
        if (toolNote) toolNote.textContent = p ? `${n} of the tools below are in ${p.name}'s stack. Its full stack is listed on its card.` : "Pick a project to see its tools.";
      });
      toolFilter.append(b);
      return b;
    });
  }

  /* ---------- journey: a zigzag path drawn between the nodes, lit as you scroll ---------- */
  const pathBox = $("#path");
  const pTrack = $("#path-track");
  const pFill = $("#path-fill");
  const pGround = $("#path-ground");
  const pSvg = $("#path-svg");
  if (pathBox && pSvg && pTrack && pFill) {
    const stops = $$(".stop", pathBox);
    let pts = [];
    const drawPath = () => {
      const r = pathBox.getBoundingClientRect();
      pSvg.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
      pts = stops.map((s) => {
        const b = $(".stop-node", s).getBoundingClientRect();
        return [b.left + b.width / 2 - r.left, b.top + b.height / 2 - r.top];
      });
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const k = (y1 - y0) * 0.55;
        const sway = Math.abs(x1 - x0) < 2 ? (i % 2 ? 22 : -22) : 0;
        d += ` C${x0 + sway} ${y0 + k} ${x1 - sway} ${y1 - k} ${x1} ${y1}`;
      }
      pTrack.setAttribute("d", d);
      pGround?.setAttribute("d", d);
      pFill.setAttribute("d", d);
    };
    let pTick = false;
    const lightPath = () => {
      pTick = false;
      const r = pathBox.getBoundingClientRect();
      const sc = pathBox.closest(".panel");
      const vh = sc ? sc.clientHeight : window.innerHeight;
      const max = sc ? sc.scrollHeight - sc.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      const at = sc ? sc.scrollTop : window.scrollY;
      const frac = max > 0 ? Math.min(1, Math.max(0, at / max)) : 1;
      const top = sc ? sc.getBoundingClientRect().top : 0;
      const y = top + vh * (0.4 + 0.6 * frac) - r.top;
      const p = reduce ? 1 : Math.max(0, Math.min(1, (y - pts[0][1]) / (pts[pts.length - 1][1] - pts[0][1])));
      pFill.style.strokeDashoffset = String(1 - p);
      stops.forEach((s, i) => s.classList.toggle("on", reduce || (pts[i] && pts[i][1] <= y)));
    };
    const queuePath = () => { if (!pTick) { pTick = true; requestAnimationFrame(lightPath); } };
    drawPath(); lightPath();
    window.addEventListener("scroll", queuePath, { passive: true });
    window.addEventListener("resize", () => { drawPath(); queuePath(); });
    window.addEventListener("load", () => { drawPath(); lightPath(); });
    window.addEventListener("panelopen", () => { drawPath(); lightPath(); });
    $$(".panel").forEach((p) => p.addEventListener("scroll", queuePath, { passive: true }));
  }

  /* ---------- copy email ---------- */
  $$(".copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.dataset.copy || "";
      try { await navigator.clipboard.writeText(value); }
      catch (e) {
        const ta = document.createElement("textarea");
        ta.value = value; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (err) {}
        ta.remove();
      }
      btn.classList.add("is-copied");
      if (live) live.textContent = "Email address copied";
      setTimeout(() => { btn.classList.remove("is-copied"); if (live) live.textContent = ""; }, 1800);
    });
  });

  /* ======================================================================
     The drawer. On wide screens the sections are cards: the landing is the
     closed drawer, a tab pulls a card forward, and the first door a visitor
     takes decides how the tabs are ordered. On phones, and without script,
     the page is an ordinary scroll.
     ====================================================================== */
  const panels = $$(".panel");
  const rail = $("#rail");
  const railTabs = $("#rail-tabs");
  const labels = { about: "About", projects: "Projects", writing: "Writing", skills: "Skills", care: "Exploring", journey: "Journey", contact: "Contact" };
  const baseTitle = document.title;
  const order = ["about", "projects", "writing", "skills", "care", "journey", "contact"];
  const firstCard = { "Resume": "journey", "GitHub": "projects" };
  let drawerOn = false;
  let current = null;
  const drawerMq = window.matchMedia("(min-width: 900px)");

  const paintRail = () => {
    if (!railTabs) return;
    railTabs.replaceChildren(...order.map((id) => {
      const a = document.createElement("a");
      a.href = `#${id}`;
      a.textContent = labels[id];
      if (id === current) a.setAttribute("aria-current", "page");
      return a;
    }));
    const p = current && document.getElementById(current);
    if (p && rail) {
      const cs = getComputedStyle(p);
      rail.style.setProperty("--active-bg", cs.backgroundColor);
      rail.style.setProperty("--active-ink", cs.color);
    }
  };

  const showPanel = (id, subId = null) => {
    const p = document.getElementById(id);
    if (!drawerOn || !p || !p.classList.contains("panel")) return;
    panels.forEach((x) => {
      x.style.zIndex = x === p ? "42" : "41";
      if (x !== p && x.classList.contains("is-open")) x.classList.add("is-leaving");
    });
    p.classList.remove("is-leaving");
    p.classList.add("is-open");
    p.scrollTop = 0;
    current = id;
    document.title = `${labels[id]} · ${baseTitle}`;
    rail?.style.setProperty("--prog", "0");
    body.classList.add("panel-open");
    paintRail();
    $$(".hand", p).forEach((h) => h.classList.add("in"));
    p.focus({ preventScroll: true });
    if (live) live.textContent = `${labels[id]} open`;
    setTimeout(() => {
      panels.forEach((x) => { if (x !== p) x.classList.remove("is-open", "is-leaving"); });
      window.dispatchEvent(new Event("panelopen"));
      if (subId) document.getElementById(subId)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, reduce ? 0 : 540);
  };
  const closePanels = () => {
    panels.forEach((x) => x.classList.remove("is-leaving", "is-open"));
    current = null;
    document.title = baseTitle;
    body.classList.remove("panel-open");
    paintRail();
    if (live) live.textContent = "Drawer closed";
  };
  const applyHash = () => {
    if (!drawerOn) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const t = id && document.getElementById(id);
    const p = t && t.closest(".panel");
    if (p) showPanel(p.id, t === p ? null : id);
    else closePanels();
  };
  const setDrawer = (on) => {
    if (on === drawerOn) return;
    drawerOn = on;
    body.classList.toggle("drawer-mode", on);
    if (on) {
      $$("[data-rise]").forEach((e) => e.classList.add("in"));
      paintRail();
      applyHash();
    } else {
      panels.forEach((x) => { x.classList.remove("is-open", "is-leaving"); x.style.zIndex = ""; });
      current = null;
      body.classList.remove("panel-open");
    }
  };
  setDrawer(drawerMq.matches);
  drawerMq.addEventListener("change", (e) => setDrawer(e.matches));
  window.addEventListener("popstate", applyHash);
  window.addEventListener("themechange", () => setTimeout(paintRail, 30));

  const open = (id, sub) => { showPanel(id, sub); history.pushState(null, "", `#${sub || id}`); };

  document.addEventListener("click", (e) => {
    if (!drawerOn || e.defaultPrevented) return;
    const tab = e.target.closest(".ftab");
    if (tab) {
      const href = tab.getAttribute("href");
      const id = href.startsWith("#") ? href.slice(1) : firstCard[tab.textContent.trim()];
      if (id) {
        if (href.startsWith("#")) e.preventDefault();
        tab.classList.add("is-pulled");
        setTimeout(() => { tab.classList.remove("is-pulled"); open(id); }, reduce ? 0 : 260);
        return;
      }
    }
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (id === "top") { e.preventDefault(); closePanels(); history.pushState(null, "", "#top"); return; }
    const t = id && document.getElementById(id);
    const p = t && t.closest(".panel");
    if (!p) return;
    e.preventDefault();
    showPanel(p.id, t === p ? null : id);
    history.pushState(null, "", `#${id}`);
  });

  /* the folder leans toward the pointer */
  const folderInner = $(".folder-inner");
  if (folderInner && !reduce && window.matchMedia("(hover: hover)").matches) {
    const front = $(".folder");
    front.addEventListener("pointermove", (e) => {
      const r = front.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      folderInner.style.setProperty("--ry", `${(x * 5).toFixed(2)}deg`);
      folderInner.style.setProperty("--rx", `${(-y * 4).toFixed(2)}deg`);
    });
    front.addEventListener("pointerleave", () => { folderInner.style.setProperty("--rx", "0deg"); folderInner.style.setProperty("--ry", "0deg"); });
  }

  panels.forEach((p) => p.addEventListener("scroll", () => {
    const max = p.scrollHeight - p.clientHeight;
    rail?.style.setProperty("--prog", max > 0 ? (p.scrollTop / max).toFixed(3) : "0");
  }, { passive: true }));
  document.addEventListener("keydown", (e) => {
    if (!drawerOn || !current || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (document.querySelector("dialog[open]") || e.target.closest("input, textarea, select, [contenteditable]")) return;
    const next = order[order.indexOf(current) + (e.key === "ArrowRight" ? 1 : -1)];
    if (next) { e.preventDefault(); open(next); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !drawerOn || !current || document.querySelector("dialog[open]")) return;
    closePanels();
    history.pushState(null, "", "#top");
  });
})();
