document.documentElement.classList.add("js");

const root = document.documentElement;
const body = document.body;
const navToggle = document.querySelector(".nav-toggle");
const themeToggle = document.querySelector(".theme-toggle");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const revealItems = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll("main section[id]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let activeNavRaf = null;

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
    link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
  });
};

const requestActiveNavUpdate = () => {
  if (activeNavRaf) return;
  activeNavRaf = requestAnimationFrame(() => {
    activeNavRaf = null;
    updateActiveNav();
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
  if (themeToggle) {
    const isLight = theme === "light";
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    themeToggle.setAttribute("title", isLight ? "Switch to dark mode" : "Switch to light mode");
  }
};

const storedTheme = localStorage.getItem("theme");
applyTheme(storedTheme === "light" ? "light" : "dark");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem("theme", next);
  });
}

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
// SCROLL PROGRESS BAR
// ===========================
const progressBar = document.getElementById("scroll-progress");
if (progressBar) {
  const updateProgress = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0) + "%";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
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
[".projects-bento", ".skills-panel", ".writing-grid", ".timeline"].forEach((sel) => {
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

window.addEventListener("scroll", requestActiveNavUpdate, { passive: true });
window.addEventListener("resize", requestActiveNavUpdate);
updateActiveNav();

// ===========================
// PARALLAX CARD
// ===========================
const parallaxCard = document.getElementById("parallax-card");
const cardWrap = parallaxCard ? parallaxCard.closest(".hero-card-wrap") : null;
if (parallaxCard && cardWrap) {
  window.addEventListener("scroll", () => {
    cardWrap.style.transform = `translateY(${-12 - window.scrollY * 0.12}px)`;
  }, { passive: true });

  const heroSection = document.querySelector(".hero");
  if (heroSection) {
    heroSection.addEventListener("mousemove", (e) => {
      const rect = parallaxCard.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      parallaxCard.style.transform = `perspective(900px) rotateX(${(-dy * 6).toFixed(2)}deg) rotateY(${(dx * 6).toFixed(2)}deg) scale(1.02)`;
    });
    heroSection.addEventListener("mouseleave", () => {
      parallaxCard.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    });
  }
  if (window.matchMedia("(max-width: 980px)").matches) cardWrap.style.transform = "none";
}

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
const backTopFloat = document.getElementById("back-top-float");
if (backTopFloat) {
  const hero = document.querySelector(".hero");
  window.addEventListener("scroll", () => {
    backTopFloat.classList.toggle("visible", hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 400);
  }, { passive: true });
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
    { cls: "t-output", text: "  projects  — recent work" },
    { cls: "t-output", text: "  contact   — get in touch" },
    { cls: "t-output", text: "  clear     — clear this output" },
  ],
  whoami: [
    { cls: "t-comment", text: "# Niveditha Jayakumar" },
    { cls: "t-output", text: "Information Science & Engineering student at DSCE." },
    { cls: "t-output", text: "Builder of AI systems. Writer of ideas." },
    { cls: "t-output", text: "Hackathon veteran. Human-centered tech advocate." },
    { cls: "t-output", text: "Intern @ FiniteLoop. Always building." },
  ],
  skills: [
    { cls: "t-comment", text: "# tech stack" },
    { cls: "t-output", text: "Languages    Python · JavaScript · HTML · CSS · C · SQL" },
    { cls: "t-output", text: "Frameworks   Flask · Streamlit · Gradio · Hugging Face" },
    { cls: "t-output", text: "AI / ML      NLP · LegalBERT · FAISS · XGBoost · spaCy" },
    { cls: "t-output", text: "Databases    MySQL · SQLite · MongoDB" },
    { cls: "t-output", text: "Tools        Git · GitHub · VS Code · Web3 · MetaMask" },
  ],
  projects: [
    { cls: "t-comment", text: "# recent projects" },
    { cls: "t-output", text: "01  Manasvi            AI mental wellness chatbot" },
    { cls: "t-output", text: "02  NLP Contract Analyzer  LegalBERT clause classifier" },
    { cls: "t-output", text: "03  PDF Intelligence   Local RAG with Ollama + FAISS" },
    { cls: "t-output", text: "04  SuryaVeda          AI energy analytics platform" },
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
