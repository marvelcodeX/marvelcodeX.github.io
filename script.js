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