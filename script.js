document.documentElement.classList.add("js");

const root = document.documentElement;
const body = document.body;
const navToggle = document.querySelector(".nav-toggle");
const themeToggle = document.querySelector(".theme-toggle");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const revealItems = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll("main section[id]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    themeToggle.setAttribute(
      "aria-label",
      isLight ? "Switch to dark mode" : "Switch to light mode"
    );
    themeToggle.setAttribute(
      "title",
      isLight ? "Switch to dark mode" : "Switch to light mode"
    );
  }
};

const storedTheme = localStorage.getItem("theme");
applyTheme(storedTheme === "light" ? "light" : "dark");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme =
      root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  });
}

// ===========================
// MOBILE NAV
// ===========================
if (navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
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
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    progressBar.style.width = pct + "%";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
}

// ===========================
// CURSOR SPOTLIGHT
// ===========================
const spotlight = document.querySelector(".cursor-spotlight");
if (spotlight && !prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
  let visible = false;
  let rafId = null;
  let curX = 0, curY = 0;

  const moveSpotlight = () => {
    spotlight.style.transform = `translate(${curX - 300}px, ${curY - 300}px)`;
    rafId = null;
  };

  document.addEventListener("mousemove", (e) => {
    curX = e.clientX;
    curY = e.clientY;
    if (!rafId) rafId = requestAnimationFrame(moveSpotlight);
    if (!visible) {
      spotlight.style.opacity = "1";
      visible = true;
    }
  });

  document.addEventListener("mouseleave", () => {
    spotlight.style.opacity = "0";
    visible = false;
  });
}

// ===========================
// STAGGER SETUP
// ===========================

// Hero elements cascade in one by one
const heroReveals = Array.from(document.querySelectorAll(".hero .reveal"));
heroReveals.forEach((el, i) => {
  if (!el.dataset.staggerDelay) {
    el.dataset.staggerDelay = String(i * 80);
  }
});

// Grid sections stagger children
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
        const delay = prefersReducedMotion
          ? 0
          : parseInt(el.dataset.staggerDelay || "0");
        if (delay > 0) {
          setTimeout(() => el.classList.add("is-visible"), delay);
        } else {
          el.classList.add("is-visible");
        }
        observer.unobserve(el);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const currentId = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${currentId}`
          );
        });
      });
    },
    { threshold: 0.35, rootMargin: "-15% 0px -45% 0px" }
  );

  sections.forEach((section) => sectionObserver.observe(section));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

// ===========================
// PARALLAX CARD on scroll + mouse tilt
// ===========================
const parallaxCard = document.getElementById("parallax-card");
const cardWrap = parallaxCard ? parallaxCard.closest(".hero-card-wrap") : null;

if (parallaxCard && cardWrap) {
  const onScroll = () => {
    const scrollY = window.scrollY;
    const shift = scrollY * 0.12;
    cardWrap.style.transform = `translateY(${-12 - shift}px)`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  const heroSection = document.querySelector(".hero");
  if (heroSection) {
    heroSection.addEventListener("mousemove", (e) => {
      const rect = parallaxCard.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotX = (-dy * 6).toFixed(2);
      const rotY = (dx * 6).toFixed(2);
      parallaxCard.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
    });

    heroSection.addEventListener("mouseleave", () => {
      parallaxCard.style.transform =
        "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    });
  }

  if (window.matchMedia("(max-width: 980px)").matches) {
    cardWrap.style.transform = "none";
  }
}

// ===========================
// TERMINAL TYPING ANIMATION
// ===========================
const terminalBody = document.querySelector(".terminal-body");
if (terminalBody && !prefersReducedMotion) {
  const lines = Array.from(terminalBody.children);
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
        if (i < eyebrowFull.length) {
          eyebrowType.textContent += eyebrowFull[i];
          i++;
          setTimeout(tick, 38);
        }
      };
      tick();
    }, 650);
  }
}

// ===========================
// SKILL TAGS — stagger on reveal
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
  const updateFloat = () => {
    const heroBottom = hero ? hero.getBoundingClientRect().bottom : 400;
    backTopFloat.classList.toggle("visible", heroBottom < 0);
  };
  window.addEventListener("scroll", updateFloat, { passive: true });
  backTopFloat.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
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
      btn.innerHTML =
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML = original;
      }, 2000);
    };

    try {
      await navigator.clipboard.writeText(text);
      showCopied();
    } catch {
      try {
        const ta = Object.assign(document.createElement("textarea"), {
          value: text,
        });
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showCopied();
      } catch {
        // silently fail
      }
    }
  });
});
