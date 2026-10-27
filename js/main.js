(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const live = document.getElementById("live");

  /* ---------- light / dark ---------- */
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => {
    const forced = root.getAttribute("data-theme");
    return forced ? forced === "dark" : darkQuery.matches;
  };
  const modeBtn = document.querySelector(".mode");
  modeBtn?.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  /* ---------- menu on small screens ---------- */
  const menuBtn = document.querySelector(".menu");
  const setMenu = (open) => {
    body.classList.toggle("menu-open", open);
    menuBtn?.setAttribute("aria-expanded", String(open));
    if (menuBtn) menuBtn.textContent = open ? "Close" : "Menu";
  };
  menuBtn?.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  document.querySelectorAll("#links a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.matchMedia("(min-width: 900px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  /* ---------- stamps press onto the page as they scroll in ---------- */
  const stamps = [...document.querySelectorAll(".stamp")];
  if ("IntersectionObserver" in window && !reduce) {
    const press = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        press.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    stamps.forEach((el, i) => { el.style.transitionDelay = el.closest(".hero") ? `${i * 120}ms` : "0ms"; press.observe(el); });
  } else {
    stamps.forEach((el) => el.classList.add("in"));
  }

  /* ---------- the hand-lettered words draw their underline once ---------- */
  const hands = [...document.querySelectorAll(".hand")];
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

  /* ---------- projects shelf: drag, snap, arrows, position ---------- */
  const shelf = document.getElementById("shelf");
  if (shelf) {
    const sheets = [...shelf.querySelectorAll(".sheet")];
    const prev = document.querySelector('[data-shelf="-1"]');
    const next = document.querySelector('[data-shelf="1"]');
    const num = document.getElementById("shelf-n");
    const thumb = document.getElementById("shelf-thumb");
    const step = () => (sheets[1] ? sheets[1].offsetLeft - sheets[0].offsetLeft : sheets[0].offsetWidth + 18);

    const sync = () => {
      const max = shelf.scrollWidth - shelf.clientWidth;
      const pos = max > 0 ? shelf.scrollLeft / max : 0;
      const idx = Math.min(sheets.length, Math.round(shelf.scrollLeft / step()) + 1);
      if (num) num.textContent = String(pos > 0.985 ? sheets.length : idx);
      const active = Math.min(sheets.length - 1, Math.round(shelf.scrollLeft / step()));
      sheets.forEach((sh, i) => sh.classList.toggle("is-active", i === (pos > 0.985 ? sheets.length - 1 : active)));
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
    sync();

    [prev, next].forEach((b) => b?.addEventListener("click", () => {
      shelf.scrollBy({ left: Number(b.dataset.shelf) * step(), behavior: reduce ? "auto" : "smooth" });
    }));
    shelf.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); shelf.scrollBy({ left: step(), behavior: "smooth" }); }
      if (e.key === "ArrowLeft") { e.preventDefault(); shelf.scrollBy({ left: -step(), behavior: "smooth" }); }
    });

    // a few degrees of tilt toward the pointer
    if (window.matchMedia("(hover: hover)").matches && !reduce) {
      sheets.forEach((sh) => {
        sh.addEventListener("pointermove", (e) => {
          if (e.pointerType !== "mouse" || shelf.classList.contains("is-drag")) return;
          const r = sh.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          sh.classList.add("is-tilt");
          sh.style.setProperty("--ry", `${(x * 4).toFixed(2)}deg`);
          sh.style.setProperty("--rx", `${(-y * 3).toFixed(2)}deg`);
        });
        sh.addEventListener("pointerleave", () => { sh.classList.remove("is-tilt"); sh.style.setProperty("--ry", "0deg"); sh.style.setProperty("--rx", "0deg"); });
      });
    }

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

  /* ---------- big type drifts slower than the page ---------- */
  if (!reduce) {
    const drifters = [...document.querySelectorAll(".hero h1, .field h2")].filter((el) => !el.closest(".ask"));
    let tick = false;
    const drift = () => {
      tick = false;
      const mid = window.innerHeight / 2;
      drifters.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
        const d = (r.top + r.height / 2 - mid) * -0.07;
        el.style.setProperty("--drift", `${Math.max(-28, Math.min(28, d)).toFixed(1)}px`);
      });
    };
    window.addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }

  /* ---------- a trace runs down the page and lights up as you read ---------- */
  const trace = document.getElementById("trace");
  const traceFill = document.getElementById("trace-fill");
  const mainEl = document.getElementById("main");
  if (trace && traceFill && mainEl) {
    const secs = [...mainEl.querySelectorAll(":scope > .field")];
    const nodes = secs.map((s) => {
      const n = document.createElement("span");
      n.className = "trace-node" + (s.classList.contains("f-cream") ? " on-cream" : "");
      trace.append(n);
      return n;
    });
    let tops = [];
    // across the pink section the line turns green, so it doesn't vanish into the colour
    const rasp = secs.findIndex((s) => s.classList.contains("f-rasp"));
    let gTop = 0, gH = 0;
    if (rasp > -1) {
      nodes[rasp].classList.add("on-rasp");
      const g = document.createElement("span");
      g.className = "trace-g";
      g.innerHTML = '<span class="trace-g-fill"></span>';
      trace.prepend(g);
    }
    const place = () => {
      const mt = mainEl.getBoundingClientRect().top + window.scrollY;
      tops = secs.map((s, i) => s.getBoundingClientRect().top + window.scrollY - mt + (i ? 48 : 28));
      nodes.forEach((n, i) => { n.style.top = `${tops[i]}px`; });
      if (rasp > -1) {
        gTop = secs[rasp].getBoundingClientRect().top + window.scrollY - mt;
        gH = secs[rasp].offsetHeight;
        trace.style.setProperty("--g-top", `${gTop}px`);
        trace.style.setProperty("--g-h", `${gH}px`);
      }
    };
    let ticking = false;
    const update = () => {
      ticking = false;
      const mt = mainEl.getBoundingClientRect().top + window.scrollY;
      const y = Math.max(0, Math.min(mainEl.offsetHeight, window.scrollY + window.innerHeight * 0.6 - mt));
      traceFill.style.setProperty("--trace", `${y}px`);
      if (rasp > -1) trace.style.setProperty("--g-fill", `${Math.max(0, Math.min(gH, y - gTop))}px`);
      nodes.forEach((n, i) => n.classList.toggle("on", tops[i] <= y));
    };
    const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    place(); update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", () => { place(); queue(); });
    window.addEventListener("load", () => { place(); update(); });
  }

  /* ---------- a print pass sweeps the top edge of each sheet as it arrives ---------- */
  const passFields = [...document.querySelectorAll("main > .field + .field")];
  if ("IntersectionObserver" in window && !reduce) {
    const passIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("pass");
        passIo.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -35% 0px" });
    passFields.forEach((f) => passIo.observe(f));
  }

  /* ---------- project preview: a terminal that cats the record next to a real screenshot ---------- */
  const pdlg = document.getElementById("proj-dlg");
  const allSheets = [...document.querySelectorAll(".sheet")];
  let pIndex = 0;
  const openProject = (i) => {
    if (!pdlg || !allSheets.length) return;
    pIndex = (i + allSheets.length) % allSheets.length;
    const sh = allSheets[pIndex];
    const btn = sh.querySelector(".open-proj");
    const title = sh.querySelector("h3").textContent.trim();
    const set = (id, text) => { document.getElementById(id).textContent = text; };
    set("pd-path", `niveditha@portfolio ~ projects/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`);
    set("pd-file", "project.md");
    set("pd-title", `# ${title}`);
    set("pd-class", `# ${sh.querySelector(".sheet-class").textContent.trim()}`);
    set("pd-status", sh.querySelector(".chip").textContent.trim());
    set("pd-stack", [...sh.querySelectorAll(".stack li")].map((l) => l.textContent).join(" · "));
    const link = sh.querySelector(".kv a");
    const src = document.getElementById("pd-src");
    src.href = link.href; src.textContent = link.href.replace("https://", "");
    set("pd-desc", `${sh.querySelector(".sheet-desc").textContent.trim()} ${sh.querySelector(".sheet-more").textContent.trim()}`);
    const img = document.getElementById("pd-img");
    img.src = btn.dataset.shot; img.alt = btn.dataset.alt;
    set("pd-cap", btn.dataset.note);
    if (!pdlg.open) pdlg.showModal();
    pdlg.scrollTo({ top: 0 });
  };
  allSheets.forEach((sh, i) => sh.querySelector(".open-proj")?.addEventListener("click", () => openProject(i)));
  if (pdlg) {
    pdlg.querySelector(".pd-close")?.addEventListener("click", () => pdlg.close());
    pdlg.addEventListener("click", (e) => { if (e.target === pdlg) pdlg.close(); });
    document.getElementById("pd-prev")?.addEventListener("click", () => openProject(pIndex - 1));
    document.getElementById("pd-next")?.addEventListener("click", () => openProject(pIndex + 1));
  }

  /* ---------- journey: a zigzag path drawn between the nodes, lit as you scroll ---------- */
  const pathBox = document.getElementById("path");
  const pathSvg = document.getElementById("path-svg");
  const pTrack = document.getElementById("path-track");
  const pFill = document.getElementById("path-fill");
  if (pathBox && pathSvg && pTrack && pFill) {
    const stops = [...pathBox.querySelectorAll(".stop")];
    let pts = [];
    const drawPath = () => {
      const r = pathBox.getBoundingClientRect();
      pathSvg.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
      pts = stops.map((s) => {
        const b = s.querySelector(".stop-node").getBoundingClientRect();
        return [b.left + b.width / 2 - r.left, b.top + b.height / 2 - r.top];
      });
      // on wide screens the side scroll line feeds into the path and picks up again after it
      const wide = trace && getComputedStyle(trace).display !== "none";
      const last = pts[pts.length - 1];
      let d;
      if (wide) {
        const tr = trace.getBoundingClientRect();
        const tx = tr.left + tr.width / 2 - r.left;
        const sy = pts[0][1] - 70;
        const ey = last[1] + 64;
        d = `M${tx} ${sy} H${pts[0][0]} V${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) d += ` V${pts[i][1] - 34} H${pts[i][0]} V${pts[i][1]}`;
        d += ` V${ey} H${tx}`;
        const mt = mainEl ? mainEl.getBoundingClientRect().top + window.scrollY : 0;
        const pt = r.top + window.scrollY - mt;
        trace.style.setProperty("--j-a", `${pt + sy}px`);
        trace.style.setProperty("--j-b", `${pt + ey}px`);
      } else {
        d = `M${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) d += ` V${pts[i][1] - 34} H${pts[i][0]} V${pts[i][1]}`;
      }
      pTrack.setAttribute("d", d);
      pFill.setAttribute("d", d);
    };
    let pTick = false;
    const lightPath = () => {
      pTick = false;
      const r = pathBox.getBoundingClientRect();
      const y = window.innerHeight * 0.62 - r.top;
      const p = reduce ? 1 : Math.max(0, Math.min(1, y / r.height));
      pFill.style.strokeDashoffset = String(1 - p);
      stops.forEach((s, i) => s.classList.toggle("on", reduce || (pts[i] && pts[i][1] <= y)));
    };
    const queuePath = () => { if (!pTick) { pTick = true; requestAnimationFrame(lightPath); } };
    drawPath(); lightPath();
    window.addEventListener("scroll", queuePath, { passive: true });
    window.addEventListener("resize", () => { drawPath(); queuePath(); });
    window.addEventListener("load", () => { drawPath(); lightPath(); });
  }

  /* ---------- tools: a stack board you can filter by project ---------- */
  const toolFilter = document.getElementById("tool-filter");
  const stackboard = document.getElementById("stackboard");
  const toolNote = document.getElementById("tool-note");
  if (toolFilter && stackboard) {
    const norm = (t) => t.toLowerCase().replace(/\s+/g, " ").trim();
    const projects = [...document.querySelectorAll(".sheet")].map((sh) => ({
      name: sh.querySelector("h3").textContent.trim(),
      stack: new Set([...sh.querySelectorAll(".stack li")].map((l) => norm(l.textContent))),
    }));
    const chips = [...document.querySelectorAll(".skills .spec li")];
    const usedBy = (chip) => projects.filter((p) => p.stack.has(norm(chip.textContent)));
    chips.forEach((c) => {
      const u = usedBy(c);
      if (u.length) c.title = `Used in ${u.map((p) => p.name).join(", ")}`;
    });
    const buttons = [{ label: "All", p: null }, ...projects.map((p) => ({ label: p.name, p }))].map(({ label, p }, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label; b.setAttribute("aria-pressed", String(i === 0));
      b.addEventListener("click", () => {
        buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        chips.forEach((c) => {
          c.classList.remove("match", "dim");
          if (!p) return;
          if (p.stack.has(norm(c.textContent))) c.classList.add("match"); else c.classList.add("dim");
        });
        if (toolNote) toolNote.textContent = p ? `${chips.filter((c) => c.classList.contains("match")).length} of the tools below are in ${p.name}'s stack. Its full stack is listed on its sheet.` : "Pick a project to see its tools.";
      });
      toolFilter.append(b);
      return b;
    });
  }

  /* ---------- copy email ---------- */
  document.querySelectorAll(".copy").forEach((btn) => {
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
     Ask this page. Same idea as the PDF Intelligence System: retrieve the
     passages that match the question, show them as written, and say where
     each one came from. Nothing is generated.
     ====================================================================== */
  const ask = document.getElementById("ask");
  const form = document.getElementById("ask-form");
  const input = document.getElementById("ask-input");
  const out = document.getElementById("ask-out");
  const openBtn = document.querySelector(".ask-open");
  if (!ask || !form || !input || !out || typeof ask.showModal !== "function") return;
  if (openBtn) openBtn.hidden = false;
  const openAsk = () => { if (!ask.open) ask.showModal(); input.focus(); };
  const closeAsk = () => { if (ask.open) ask.close(); };
  openBtn?.addEventListener("click", openAsk);
  ask.querySelector(".ask-close")?.addEventListener("click", closeAsk);
  ask.addEventListener("click", (e) => { if (e.target === ask) closeAsk(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName || "") && !ask.open) { e.preventDefault(); openAsk(); }
  });

  const clean = (s) => s.replace(/\s+/g, " ").trim();
  const sectionOf = (el) => {
    const s = el.closest("section, footer");
    if (!s) return "this page";
    if (s.id === "top") return "the top of the page";
    return s.dataset.name || "this page";
  };
  const passages = [];
  const add = (el, display, context = "") => {
    const text = clean(display);
    if (!el || text.length < 12) return;
    passages.push({ el, text, section: sectionOf(el), hay: (context + " " + text).toLowerCase() });
  };
  const sentences = (el) => clean(el.textContent).split(/(?<=[.!?])\s+(?=[A-Z])/);

  document.querySelectorAll(".hero-lead").forEach((p) => add(p, p.textContent));
  document.querySelectorAll(".record-row").forEach((r) => add(r, `${r.querySelector("dt").textContent}: ${clean(r.querySelector("dd").textContent)}`));
  document.querySelectorAll(".about-body p").forEach((p) => sentences(p).forEach((s) => add(p, s)));
  document.querySelectorAll(".sheet").forEach((s) => {
    const title = clean(s.querySelector("h3").textContent);
    const meta = clean(s.querySelector(".sheet-class").textContent);
    const stack = [...s.querySelectorAll(".stack li")].map((l) => l.textContent).join(", ");
    add(s.querySelector(".sheet-desc"), `${title}: ${s.querySelector(".sheet-desc").textContent}`, `${meta} ${stack}`);
    add(s.querySelector(".sheet-more"), `${title}: ${s.querySelector(".sheet-more").textContent}`, `${meta} ${stack}`);
  });
  document.querySelectorAll(".spec").forEach((d) => add(d, `${d.querySelector("dt").textContent}: ${[...d.querySelectorAll("li")].map((l) => l.textContent).join(", ")}`));
  document.querySelectorAll(".now-text p").forEach((p) => sentences(p).forEach((s) => add(p, s)));
  document.querySelectorAll(".live li").forEach((li) => add(li, [...li.querySelectorAll("p")].map((p) => p.textContent).join(". ")));
  document.querySelectorAll(".outlet").forEach((o) => add(o, `${o.querySelector(".logo").getAttribute("aria-label")}: ${o.querySelector("h3").textContent}. ${o.querySelector("p").textContent}`));
  document.querySelectorAll(".stop").forEach((s) => {
    const w = s.querySelector(".where");
    const where = w.matches("ul") ? [...w.children].map((l) => l.textContent).join(" · ") : w.textContent;
    add(s, `${s.querySelector("h3").textContent}. ${where}. ${s.querySelector(".entry p").textContent}`);
  });
  const topics = document.querySelector(".topics");
  if (topics) add(topics, `Topics: ${[...topics.children].map((c) => c.textContent).join(", ")}.`);
  document.querySelectorAll(".row").forEach((r) => add(r, `${r.querySelector(".row-k").textContent}: ${r.querySelector(".row-v").textContent}`));
  document.querySelectorAll(".contact-text .lead").forEach((p) => add(p, p.textContent));

  const STOP = new Set("a an and are as at be by can do does did for from has have how i in is it its of on or she her he his me my the to was what when where which who whom why will with you your this that these those about tell".split(" "));
  const stem = (w) => w.replace(/(ing|ed|es|s)$/, "").replace(/e$/, "");
  const SYN = { reach: ["contact", "email"], contact: ["email", "linkedin"], hire: ["contact", "email", "resume"], touch: ["contact", "email"], message: ["contact", "email"], mail: ["email"], talk: ["contact"], built: ["build"], tools: ["tool"], tech: ["technology"], languages: ["language"], study: ["student"], college: ["dayananda", "student"], school: ["dayananda"], experience: ["intern", "hackathon"], job: ["intern"], work: ["project"], cv: ["resume"] };
  const SYNS = Object.fromEntries(Object.entries(SYN).map(([k, v]) => [stem(k), v]));
  const tokens = (s) => (s.toLowerCase().match(/[a-z0-9+#]+/g) || []).filter((w) => !STOP.has(w) && w.length > 1).map(stem);
  passages.forEach((p) => { p.tok = new Set(tokens(p.hay)); });
  const df = new Map();
  passages.forEach((p) => p.tok.forEach((t) => df.set(t, (df.get(t) || 0) + 1)));
  const idf = (t) => Math.log(1 + passages.length / (1 + (df.get(t) || 0)));

  const run = (qText) => {
    const q0 = tokens(qText);
    const q = [...new Set([...q0, ...q0.flatMap((t) => (SYNS[t] || []).map(stem))])];
    out.replaceChildren();
    if (!q.length) return;
    const scored = passages.map((p) => {
      let s = 0;
      q.forEach((t) => {
        if (p.tok.has(t)) s += 3 * idf(t);
        else if (t.length >= 4 && [...p.tok].some((pt) => pt.length >= 4 && (pt.startsWith(t) || t.startsWith(pt)))) s += 1.5 * idf(t);
      });
      if (qText.length > 4 && p.hay.includes(qText.toLowerCase().replace(/[?!.]/g, ""))) s += 4;
      return { p, s: s / (1 + p.text.length / 400) };
    }).filter((x) => x.s > 0.9).sort((a, b) => b.s - a.s);

    const seen = new Set();
    const top = [];
    for (const x of scored) { if (seen.has(x.p.text)) continue; seen.add(x.p.text); top.push(x); if (top.length === 3) break; }

    if (!top.length) {
      const none = document.createElement("div");
      none.className = "hit";
      none.innerHTML = "<p>Nothing on this page answers that. Try asking about a project, a skill, the writing or how to get in touch.</p>";
      out.append(none);
      if (live) live.textContent = "No passage found";
      return;
    }
    const qset = new Set(q);
    top.forEach(({ p }) => {
      const box = document.createElement("div");
      box.className = "hit";
      const para = document.createElement("p");
      para.append(...p.text.split(/(\s+)/).map((w) => {
        if (qset.has(stem(w.toLowerCase().replace(/[^a-z0-9+#]/g, "")))) { const m = document.createElement("mark"); m.textContent = w; return m; }
        return document.createTextNode(w);
      }));
      const from = document.createElement("div");
      from.className = "from";
      from.append(`From ${p.section}`);
      const go = document.createElement("button");
      go.type = "button";
      go.textContent = "Show me where";
      go.addEventListener("click", () => jump(p.el));
      from.append(go);
      box.append(para, from);
      out.append(box);
    });
    if (live) live.textContent = `${top.length} passage${top.length > 1 ? "s" : ""} found`;
  };

  const jump = (el) => {
    closeAsk();
    const sheet = el.closest(".sheet");
    if (sheet && shelf) {
      shelf.scrollTo({ left: sheet.offsetLeft - parseFloat(getComputedStyle(shelf).paddingLeft), behavior: reduce ? "auto" : "smooth" });
      document.getElementById("projects").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    } else {
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }
    const target = sheet || el;
    setTimeout(() => { target.classList.add("flash"); setTimeout(() => target.classList.remove("flash"), 2200); }, reduce ? 0 : 700);
  };

  form.addEventListener("submit", (e) => { e.preventDefault(); run(input.value); });
  ask.querySelectorAll("[data-q]").forEach((b) => b.addEventListener("click", () => { input.value = b.dataset.q; run(b.dataset.q); }));

  /* ---------- command palette: jump to a section, a project, or the resume ---------- */
  const goBox = document.getElementById("ask-go");
  if (goBox) {
    const goto = (id) => { closeAsk(); document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); };
    const items = [
      ["Projects", () => goto("projects")], ["Writing", () => goto("writing")], ["Contact", () => goto("contact")],
      ["Open resume", () => { closeAsk(); window.open("Niveditha_Resume.pdf", "_blank", "noopener"); }],
    ];    const buttons = items.map(([label, fn]) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label; b.dataset.label = label.toLowerCase();
      b.addEventListener("click", fn);
      goBox.append(b);
      return b;
    });
    const filter = () => {
      const q = input.value.toLowerCase().replace(/^(>|go\s+)/, "").trim();
      buttons.forEach((b) => { b.hidden = !!q && !b.dataset.label.includes(q); });
    };
    input.addEventListener("input", filter);
    ask.addEventListener("close", () => { input.value = ""; filter(); });
    form.addEventListener("submit", () => {
      if (/^(>|go\s)/i.test(input.value.trim())) { filter(); buttons.find((b) => !b.hidden)?.click(); }
    }, true);
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (ask.open) closeAsk(); else openAsk(); }
    });
  }
})();
