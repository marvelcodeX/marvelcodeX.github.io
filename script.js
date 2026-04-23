document.documentElement.classList.add("js");

const root = document.documentElement;
const body = document.body;
const navToggle = document.querySelector(".nav-toggle");
const themeToggle = document.querySelector(".theme-toggle");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const revealItems = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll("main section[id]");

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

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
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
          const isMatch = link.getAttribute("href") === `#${currentId}`;
          link.classList.toggle("active", isMatch);
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
      parallaxCard.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
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
if (terminalBody) {
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
// SKILL TAGS — stagger on reveal
// ===========================
const skillGroups = document.querySelectorAll(".skill-group");
skillGroups.forEach((group) => {
  const tags = group.querySelectorAll(".skill-tags span");
  tags.forEach((tag, i) => {
    tag.style.transitionDelay = `${i * 60}ms`;
  });
});