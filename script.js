document.documentElement.classList.add("js");

const root = document.documentElement;
const body = document.body;
const navToggle = document.querySelector(".nav-toggle");
const themeToggles = Array.from(document.querySelectorAll(".theme-toggle"));
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const revealItems = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll("main section[id]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const progressBar = document.getElementById("scroll-progress");
const parallaxCard = document.getElementById("parallax-card");
const cardWrap = parallaxCard ? parallaxCard.closest(".hero-card-wrap") : null;
const backTopFloat = document.getElementById("back-top-float");
const hero = document.querySelector(".hero");
const cardOffsetMedia = window.matchMedia("(max-width: 980px)");
let scrollRaf = null;

const updateActiveNav = () => {
  const marker = Math.min(window.innerHeight * 0.35, 260);
  let activeId = "";

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= marker && rect.bottom > marker) activeId = section.id;
  });

  if (!activeId) {
    const passedSections = Array.from(sections).filter((section) => section.getBoundingClientRect().top <= marker);
    activeId = passedSections.length ? passedSections[passedSections.length - 1].id : "";
  }

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (window.scrollY >= maxScroll - 2) activeId = sections[sections.length - 1]?.id || activeId;

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
};

const updateProgress = () => {
  if (!progressBar) return;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0) + "%";
};

const updateHeroCardOffset = () => {
  if (!cardWrap) return;
  cardWrap.style.transform = cardOffsetMedia.matches ? "none" : `translateY(${-12 - window.scrollY * 0.12}px)`;
};

const updateBackTop = () => {
  if (!backTopFloat) return;
  backTopFloat.classList.toggle("visible", hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 400);
};

const updateScrollEffects = () => {
  updateProgress();
  updateActiveNav();
  updateHeroCardOffset();
  updateBackTop();
};

const requestScrollEffectsUpdate = () => {
  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = null;
    updateScrollEffects();
  });
};

// ===========================
// THEME
// ===========================
const applyTheme = (theme) => {
  if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }
  const isLight = theme === "light";
  themeToggles.forEach((t) => {
    t.setAttribute("aria-pressed", String(isLight));
    t.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    t.setAttribute("title", isLight ? "Switch to dark mode" : "Switch to light mode");
  });
};

const storedTheme = localStorage.getItem("theme");
applyTheme(storedTheme === "light" ? "light" : "dark");

themeToggles.forEach((t) => {
  t.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem("theme", next);
  });
});

// ===========================
// MOBILE NAV
// ===========================
if (navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation menu");
    });
  });
}

// ===========================
// CURSOR SPOTLIGHT
// ===========================
const spotlight = document.querySelector(".cursor-spotlight");
if (spotlight && !prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
  let visible = false, rafId = null, curX = 0, curY = 0;
  const moveSpotlight = () => {
    spotlight.style.transform = `translate(${curX - 300}px, ${curY - 300}px)`;
    rafId = null;
  };
  document.addEventListener("mousemove", (e) => {
    curX = e.clientX; curY = e.clientY;
    if (!rafId) rafId = requestAnimationFrame(moveSpotlight);
    if (!visible) { spotlight.style.opacity = "1"; visible = true; }
  });
  document.addEventListener("mouseleave", () => { spotlight.style.opacity = "0"; visible = false; });
}

// ===========================
// STAGGER SETUP
// ===========================
Array.from(document.querySelectorAll(".hero .reveal")).forEach((el, i) => {
  if (!el.dataset.staggerDelay) el.dataset.staggerDelay = String(i * 80);
});
[".projects-log", ".cap-matrix", ".writing-grid", ".trace"].forEach((sel) => {
  const container = document.querySelector(sel);
  if (!container) return;
  container.querySelectorAll(".reveal").forEach((el, i) => {
    el.dataset.staggerDelay = String(i * 120);
  });
});

// ===========================
// REVEAL ANIMATIONS
// ===========================
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = prefersReducedMotion ? 0 : parseInt(el.dataset.staggerDelay || "0");
        if (delay > 0) setTimeout(() => el.classList.add("is-visible"), delay);
        else el.classList.add("is-visible");
        observer.unobserve(el);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
  );
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

window.addEventListener("scroll", requestScrollEffectsUpdate, { passive: true });
window.addEventListener("resize", requestScrollEffectsUpdate);
updateScrollEffects();

// ===========================
// TERMINAL TYPING ANIMATION
// ===========================
const terminalBody = document.querySelector(".terminal-body");
if (terminalBody && !prefersReducedMotion) {
  const lines = Array.from(terminalBody.children).filter(
    (el) => !el.classList.contains("terminal-output") && !el.classList.contains("terminal-input-line")
  );
  lines.forEach((line, i) => {
    line.style.opacity = "0";
    setTimeout(() => {
      line.style.transition = "opacity 0.3s ease";
      line.style.opacity = "1";
    }, 400 + i * 90);
  });
}

// ===========================
// HERO EYEBROW TYPEWRITER
// ===========================
const eyebrowType = document.querySelector("#hero-eyebrow .eyebrow-type");
const eyebrowFull = " Engineering Student · Builder · Writer";
if (eyebrowType) {
  if (prefersReducedMotion) {
    eyebrowType.textContent = eyebrowFull;
  } else {
    eyebrowType.textContent = "";
    setTimeout(() => {
      let i = 0;
      const tick = () => {
        if (i < eyebrowFull.length) { eyebrowType.textContent += eyebrowFull[i++]; setTimeout(tick, 38); }
      };
      tick();
    }, 650);
  }
}

// ===========================
// SKILL TAGS — stagger
// ===========================
document.querySelectorAll(".skill-group").forEach((group) => {
  group.querySelectorAll(".skill-tags span").forEach((tag, i) => {
    tag.style.transitionDelay = `${i * 60}ms`;
  });
});

// ===========================
// FLOATING BACK TO TOP
// ===========================
if (backTopFloat) {
  backTopFloat.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// ===========================
// COPY TO CLIPBOARD
// ===========================
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const text = btn.dataset.copy;
    const original = btn.innerHTML;
    const showCopied = () => {
      btn.classList.add("copied");
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(() => { btn.classList.remove("copied"); btn.innerHTML = original; }, 2000);
    };
    try {
      await navigator.clipboard.writeText(text);
      showCopied();
    } catch {
      try {
        const ta = Object.assign(document.createElement("textarea"), { value: text });
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
        showCopied();
      } catch { /* silently fail */ }
    }
  });
});

// ===========================
// INTERACTIVE TERMINAL
// ===========================
const terminalInput = document.getElementById("terminal-input");
const terminalOutput = document.getElementById("terminal-output");
const terminalContainer = document.querySelector(".about-terminal");

const TERMINAL_COMMANDS = {
  help: [
    { cls: "t-comment", text: "# available commands" },
    { cls: "t-output", text: "  whoami    — who is Niveditha?" },
    { cls: "t-output", text: "  skills    — tech stack & tools" },
    { cls: "t-output", text: "  projects  — featured work" },
    { cls: "t-output", text: "  contact   — get in touch" },
    { cls: "t-output", text: "  clear     — clear this output" },
  ],

  whoami: [
    { cls: "t-comment", text: "# Niveditha Jayakumar" },
    { cls: "t-output", text: "Information Science & Engineering student at DSCE." },
    { cls: "t-output", text: "Interested in AI, cybersecurity, and software engineering." },
    { cls: "t-output", text: "Building intelligent tools for developers and security teams." },
    { cls: "t-output", text: "Writer. Hackathon enthusiast. Always learning." },
  ],

  skills: [
    { cls: "t-comment", text: "# tech stack" },
    { cls: "t-output", text: "Languages    Python · JavaScript · C · SQL · HTML · CSS" },
    { cls: "t-output", text: "Backend      FastAPI · Flask · PostgreSQL · SQLite" },
    { cls: "t-output", text: "AI / ML      Ollama · FAISS · Transformers · scikit-learn" },
    { cls: "t-output", text: "Cloud/Sec    AWS · Docker · AST Analysis · JWT" },
    { cls: "t-output", text: "Tools        Git · GitHub · VS Code · Linux" },
  ],

  projects: [
    { cls: "t-comment", text: "# featured projects" },
    { cls: "t-output", text: "01  Soteria-AI          AI dependency risk analyzer" },
    { cls: "t-output", text: "02  Log Forensics       Desktop threat analysis tool" },
    { cls: "t-output", text: "03  PDF Intelligence    Local RAG with Ollama + FAISS" },
    { cls: "t-output", text: "04  CSPM Platform       Cloud security posture manager" },
  ],

  contact: [
    { cls: "t-comment", text: "# reach me at" },
    { cls: "t-cmd", text: "email     nivedithaja@gmail.com" },
    { cls: "t-cmd", text: "github    github.com/marvelcodeX" },
    { cls: "t-cmd", text: "linkedin  linkedin.com/in/niveditha-jayakumar" },
  ],
};

const TERMINAL_ALIASES = { hi: "whoami", hello: "whoami", about: "whoami", ls: "help", "?": "help" };

if (terminalInput && terminalOutput && terminalContainer) {
  const history = [];
  let historyIndex = -1;

  const appendLine = (text, cls) => {
    const el = document.createElement("div");
    el.className = "terminal-line";
    const span = document.createElement("span");
    span.className = cls;
    span.textContent = text;
    el.appendChild(span);
    return el;
  };

  const appendBlank = () => {
    const el = document.createElement("span");
    el.className = "t-blank";
    return el;
  };

  const runCommand = (raw) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    history.unshift(raw.trim());
    historyIndex = -1;

    // Echo the command
    const echo = document.createElement("div");
    echo.className = "terminal-line";
    echo.innerHTML = `<span class="t-prompt">→</span><span style="margin-left:0.6rem"><span class="t-cmd">${raw.trim()}</span></span>`;
    terminalOutput.appendChild(echo);

    if (cmd === "clear") {
      terminalOutput.innerHTML = "";
      return;
    }

    const resolved = TERMINAL_ALIASES[cmd] || cmd;
    const lines = TERMINAL_COMMANDS[resolved];

    if (lines) {
      terminalOutput.appendChild(appendBlank());
      lines.forEach((l) => terminalOutput.appendChild(appendLine(l.text, l.cls)));
    } else {
      terminalOutput.appendChild(appendBlank());
      terminalOutput.appendChild(appendLine(`command not found: ${raw.trim()} — try 'help'`, "t-comment"));
    }

    terminalOutput.appendChild(appendBlank());
    terminalInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  terminalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      runCommand(terminalInput.value);
      terminalInput.value = "";
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        historyIndex++;
        terminalInput.value = history[historyIndex] || "";
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = history[historyIndex] || "";
      } else {
        historyIndex = -1;
        terminalInput.value = "";
      }
    }
  });

  // Click anywhere on terminal to focus input
  terminalContainer.addEventListener("click", () => terminalInput.focus());
}

// ===========================
// MAGNETIC CURSOR
// ===========================
if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
  const setupMagnetic = (selector, strength) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transition = "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        el.style.transform = "";
        setTimeout(() => { el.style.transition = ""; }, 500);
      });
    });
  };

  setupMagnetic(".theme-toggle", 0.45);
  setupMagnetic(".back-top-float", 0.45);
  setupMagnetic(".hero-actions .button", 0.3);
  setupMagnetic(".site-nav a", 0.22);
}

// ===========================
// NETWORK TOPOLOGY BACKGROUND
// ===========================
(() => {
  const canvas = document.getElementById("net-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  // Palette pulled from CSS tokens so it tracks the active theme.
  const palette = { accent: "#b57aff", accent2: "#e0aaff", alert: "#f472b6" };
  const refreshPalette = () => {
    const cs = getComputedStyle(root);
    const read = (name, fallback) => (cs.getPropertyValue(name).trim() || fallback);
    palette.accent = read("--accent", palette.accent);
    palette.accent2 = read("--accent-2", palette.accent2);
    palette.alert = read("--alert", palette.alert);
  };
  refreshPalette();
  // Re-read colors whenever the theme attribute flips.
  new MutationObserver(refreshPalette).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  const LINK_DIST = 150;      // px within which two nodes link
  const MOUSE_DIST = 190;     // px within which the cursor links to nodes
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0, height = 0;
  let nodes = [];
  const mouse = { x: -9999, y: -9999, active: false };

  const buildNodes = () => {
    const area = width * height;
    const coarse = window.matchMedia("(max-width: 720px)").matches;
    const target = Math.min(Math.round(area / (coarse ? 60000 : 42000)), coarse ? 16 : 36);
    nodes = Array.from({ length: target }, () => {
      const r = Math.random();
      const type = r > 0.9 ? "alert" : r > 0.62 ? "accent2" : "accent";
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        radius: type === "alert" ? 2.4 : 1.3 + Math.random() * 1.1,
        type,
        phase: Math.random() * Math.PI * 2,
        pulse: 0.6 + Math.random() * 1.4,
      };
    });
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildNodes();
  };

  const colorFor = (t) => (t === "alert" ? palette.alert : t === "accent2" ? palette.accent2 : palette.accent);

  const draw = (animate) => {
    ctx.clearRect(0, 0, width, height);

    // Edges between nearby nodes.
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > LINK_DIST) continue;
        const alpha = (1 - dist / LINK_DIST) * 0.32;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = a.type === "alert" || b.type === "alert" ? palette.alert : palette.accent;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Edges to the cursor — the live "probe" node.
      if (mouse.active) {
        const dxm = a.x - mouse.x, dym = a.y - mouse.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < MOUSE_DIST) {
          ctx.globalAlpha = (1 - dm / MOUSE_DIST) * 0.6;
          ctx.strokeStyle = palette.accent2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    // Nodes (with a soft pulse glow).
    for (const n of nodes) {
      const glow = animate ? 0.55 + 0.45 * Math.sin(n.phase) : 0.8;
      const c = colorFor(n.type);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.14 * glow;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius + 5 + glow * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const step = () => {
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      n.phase += 0.02 * n.pulse;
      if (n.x < -20) n.x = width + 20; else if (n.x > width + 20) n.x = -20;
      if (n.y < -20) n.y = height + 20; else if (n.y > height + 20) n.y = -20;

      // Gentle drift toward the cursor for a subtle "reaching" feel.
      if (mouse.active) {
        const dx = mouse.x - n.x, dy = mouse.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < MOUSE_DIST && d > 1) {
          n.x += (dx / d) * 0.25;
          n.y += (dy / d) * 0.25;
        }
      }
    }
  };

  let rafId = null, running = false;
  const loop = () => {
    step();
    draw(true);
    rafId = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running) return;
    running = true;
    loop();
  };
  const stop = () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  window.addEventListener("resize", () => {
    resize();
    if (!running && prefersReducedMotion) draw(false);
  });

  if (window.matchMedia("(hover: hover)").matches) {
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    }, { passive: true });
    window.addEventListener("mouseout", (e) => { if (!e.relatedTarget) mouse.active = false; });
  }

  resize();
  if (prefersReducedMotion) {
    draw(false);
  } else {
    start();
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  }
})();

// ===========================
// NODE-GRAPH EXPLORER
// ===========================
(() => {
  const explorer = document.getElementById("explorer");
  const world = document.getElementById("graph-world");
  const edgesSvg = document.getElementById("graph-edges");
  const viewport = document.getElementById("graph-viewport");
  const panel = document.getElementById("panel");
  const panelHost = document.getElementById("panel-host");
  if (!explorer || !world || !viewport || !panel) return;

  // ---- graph data ----
  // Section nodes laid out as a hexagon so 01→06 reads CLOCKWISE from the top.
  const NODES = [
    { id: "me", type: "core", label: "NIVEDITHA", sub: "Engineer · Builder · Writer", target: "hero", x: 800, y: 500 },
    { id: "about",    type: "section", label: "ABOUT  ",    sub: "who I am",          idx: "01", target: "about",    x: 800,  y: 190 },
    { id: "projects", type: "section", label: "PROJECTS", sub: "my work",      idx: "02", target: "projects", x: 1160, y: 350 },
    { id: "skills",   type: "section", label: "SKILLS",   sub: "capability matrix",  idx: "03", target: "skills",   x: 1160, y: 655 },
    { id: "writing",  type: "section", label: "WRITING",  sub: "essays",             idx: "04", target: "writing",  x: 800,  y: 815 },
    { id: "timeline", type: "section", label: "JOURNEY",  sub: "the path so far",    idx: "05", target: "timeline", x: 440,  y: 655 },
    { id: "contact",  type: "section", label: "CONTACT",  sub: "get in touch",       idx: "06", target: "contact",  x: 440,  y: 350 },
    { id: "resume",   type: "leaf", label: "Résumé",   href: "Niveditha_Resume.pdf", x: 960,  y: 150 },
    { id: "github",   type: "leaf", label: "GitHub",   href: "https://github.com/marvelcodeX", x: 1330, y: 760 },
    { id: "substack", type: "leaf", label: "Substack", href: "https://substack.com/@nivedithajayakumar", x: 620, y: 910 },
    { id: "linkedin", type: "leaf", label: "LinkedIn", href: "https://www.linkedin.com/in/niveditha-jayakumar/", x: 290, y: 470 },
  ];
  const EDGES = [
    // hub spokes
    ["me","about"],["me","projects"],["me","skills"],["me","writing"],["me","timeline"],["me","contact"],
    // sequence ring (01→02→03→04→05→06) so the order is visible
    ["about","projects"],["projects","skills"],["skills","writing"],["writing","timeline"],["timeline","contact"],
    // leaves near their related section
    ["about","resume"],["projects","github"],["skills","github"],["writing","substack"],["contact","linkedin"],
  ];
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

  // ---- build edges ----
  const NS = "http://www.w3.org/2000/svg";
  EDGES.forEach(([a, b]) => {
    const na = byId[a], nb = byId[b];
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", na.x); line.setAttribute("y1", na.y);
    line.setAttribute("x2", nb.x); line.setAttribute("y2", nb.y);
    line.dataset.from = a; line.dataset.to = b;
    edgesSvg.appendChild(line);
  });
  const litEdges = (id) => edgesSvg.querySelectorAll(`line[data-from="${id}"], line[data-to="${id}"]`);

  // ---- build nodes ----
  NODES.forEach((n) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `gnode gnode-${n.type}`;
    btn.style.left = n.x + "px";
    btn.style.top = n.y + "px";
    btn.dataset.id = n.id;
    const aria = n.href ? `${n.label} (opens in new tab)` : n.type === "core" ? "Open the home page" : `Open ${n.label}`;
    btn.setAttribute("aria-label", aria);
    btn.innerHTML =
      `<span class="gnode-dot">${n.idx ? `<span class="gnode-index">${n.idx}</span>` : ""}</span>` +
      `<span class="gnode-label">${n.label}</span>` +
      (n.sub ? `<span class="gnode-sub">${n.sub}</span>` : "");
    btn.addEventListener("mouseenter", () => litEdges(n.id).forEach((l) => l.classList.add("edge-lit")));
    btn.addEventListener("mouseleave", () => litEdges(n.id).forEach((l) => l.classList.remove("edge-lit")));
    btn.addEventListener("focus", () => litEdges(n.id).forEach((l) => l.classList.add("edge-lit")));
    btn.addEventListener("blur", () => litEdges(n.id).forEach((l) => l.classList.remove("edge-lit")));
    btn.addEventListener("click", (e) => { e.stopPropagation(); activate(n, btn); });
    world.appendChild(btn);
  });

  // ---- brand recenters the map (map is the only view) ----
  const explorerBrand = explorer.querySelector(".brand");
  if (explorerBrand) explorerBrand.addEventListener("click", (e) => { e.preventDefault(); resetView(); });

  // ---- section panel (move real section in/out; no cloning) ----
  let openSection = null, openAnchor = null, lastNode = null;
  const revealAll = (scope) => scope.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));

  const restoreSection = () => {
    if (openSection && openAnchor && openAnchor.parentNode) {
      openAnchor.parentNode.insertBefore(openSection, openAnchor);
      openAnchor.remove();
    }
    openSection = null; openAnchor = null;
  };

  const openPanel = (sectionId, node) => {
    const sec = document.getElementById(sectionId);
    if (!sec) return;
    restoreSection();
    openAnchor = document.createComment("panel-anchor");
    sec.parentNode.insertBefore(openAnchor, sec);
    openSection = sec;
    panelHost.appendChild(sec);
    revealAll(sec);
    panelHost.scrollTop = 0;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    lastNode = node || null;
    // deep link: reflect the open section in the URL so it can be shared
    try { history.replaceState(null, "", "#" + sectionId); } catch (_) {}
    const closeBtn = panel.querySelector(".panel-close");
    if (closeBtn) closeBtn.focus();
  };
  const closePanel = () => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    restoreSection();
    try { history.replaceState(null, "", location.pathname + location.search); } catch (_) {}
    if (lastNode) lastNode.focus();
  };
  panel.querySelectorAll(".panel-close").forEach((b) => b.addEventListener("click", closePanel));
  panel.addEventListener("click", (e) => { if (e.target === panel) closePanel(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("is-open")) closePanel(); });

  // In-panel links to another section (e.g. the hero's "View Projects") open that panel.
  panelHost.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const sec = document.getElementById(id);
    if (sec && sec.tagName === "SECTION") { e.preventDefault(); openPanel(id, null); }
  });

  const activate = (n, btn) => {
    if (n.href) { window.open(n.href, "_blank", "noopener"); return; }
    if (n.target) openPanel(n.target, btn);
  };

  // Deep link: open the panel named in the URL hash (e.g. #projects) on load / hashchange.
  const openFromHash = () => {
    const id = decodeURIComponent((location.hash || "").slice(1));
    if (!id) { if (panel.classList.contains("is-open")) closePanel(); return; }
    const node = NODES.find((n) => n.target === id);
    if (!node) return;
    const btn = world.querySelector(`.gnode[data-id="${node.id}"]`);
    openPanel(id, btn || null);
  };
  window.addEventListener("hashchange", openFromHash);

  // ---- pan & zoom ----
  let panX = 0, panY = 0, k = 0.85;
  const MIN_K = 0.4, MAX_K = 2.2;
  const clampK = (v) => Math.min(MAX_K, Math.max(MIN_K, v));
  const apply = () => { world.style.transform = `translate(${panX}px, ${panY}px) scale(${k})`; };
  // fit to the actual content box (nodes cluster in the middle of the world),
  // so we land zoomed-in instead of showing the empty world margins.
  const CONTENT = { w: 1200, h: 900, cx: 800, cy: 520 };
  const fit = () => {
    const r = viewport.getBoundingClientRect();
    k = Math.max(MIN_K, Math.min(1.6, r.width / CONTENT.w, r.height / CONTENT.h));
    panX = r.width / 2 - CONTENT.cx * k;
    panY = r.height / 2 - CONTENT.cy * k;
    apply();
  };
  const resetView = () => fit();

  // multi-pointer: one finger pans, two fingers pinch-zoom (+ pan)
  const rel = (e) => { const r = viewport.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const pointers = new Map();
  let dragging = false, sx = 0, sy = 0, spx = 0, spy = 0, pinch = null;
  const startPan = (p) => { dragging = true; viewport.classList.add("grabbing"); sx = p.x; sy = p.y; spx = panX; spy = panY; };
  const startPinch = () => {
    const [a, b] = [...pointers.values()];
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, k, wx: (cx - panX) / k, wy: (cy - panY) / k };
  };
  viewport.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".gnode") || e.target.closest(".graph-controls")) return;
    pointers.set(e.pointerId, rel(e));
    try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
    if (pointers.size === 1) startPan(pointers.get(e.pointerId));
    else if (pointers.size === 2) { dragging = false; startPinch(); }
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, rel(e));
    if (pointers.size >= 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      k = clampK(pinch.k * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.dist));
      panX = cx - pinch.wx * k; panY = cy - pinch.wy * k; apply();
    } else if (dragging && pointers.size === 1) {
      const p = pointers.get(e.pointerId);
      panX = spx + (p.x - sx); panY = spy + (p.y - sy); apply();
    }
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 1) startPan([...pointers.values()][0]);
    else if (pointers.size === 0) { dragging = false; viewport.classList.remove("grabbing"); }
  };
  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = viewport.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const wx = (mx - panX) / k, wy = (my - panY) / k;
    const nk = Math.min(MAX_K, Math.max(MIN_K, k * (e.deltaY < 0 ? 1.12 : 0.89)));
    k = nk; panX = mx - wx * k; panY = my - wy * k; apply();
  }, { passive: false });

  document.querySelectorAll(".graph-controls [data-zoom]").forEach((b) => {
    b.addEventListener("click", () => {
      const mode = b.dataset.zoom;
      if (mode === "reset") return resetView();
      const r = viewport.getBoundingClientRect();
      const cx = r.width / 2, cy = r.height / 2;
      const wx = (cx - panX) / k, wy = (cy - panY) / k;
      k = Math.min(MAX_K, Math.max(MIN_K, k * (mode === "in" ? 1.2 : 0.83)));
      panX = cx - wx * k; panY = cy - wy * k; apply();
    });
  });

  window.addEventListener("resize", fit);

  // ---- mobile fallback: a tappable list of the same nodes (shown ≤560px via CSS) ----
  const nodeList = document.createElement("div");
  nodeList.id = "node-list";
  nodeList.setAttribute("aria-label", "Portfolio sections");
  NODES.forEach((n) => {
    const isLeaf = n.type === "leaf";
    const isCore = n.type === "core";
    const el = document.createElement(isLeaf ? "a" : "button");
    el.className = "nlist-item" + (isCore ? " nlist-core" : "") + (isLeaf ? " nlist-leaf" : "");
    if (isLeaf) { el.href = n.href; el.target = "_blank"; el.rel = "noreferrer"; }
    else { el.type = "button"; }
    const idx = isCore ? "⌂" : (n.idx || "•");
    const label = isCore ? "Home" : n.label;
    el.innerHTML =
      `<span class="nlist-idx">${idx}</span>` +
      `<span class="nlist-body"><span class="nlist-label">${label}</span>` +
      (n.sub ? `<span class="nlist-sub">${n.sub}</span>` : "") + `</span>` +
      `<span class="nlist-arrow" aria-hidden="true">${isLeaf ? "↗" : "→"}</span>`;
    if (!isLeaf) el.addEventListener("click", () => openPanel(n.target, el));
    nodeList.appendChild(el);
  });
  explorer.insertBefore(nodeList, explorer.querySelector(".graph-controls"));

  // ---- init: the map is the whole site ----
  document.body.classList.add("graph-ready", "map-view");
  fit();
  openFromHash();
})();
