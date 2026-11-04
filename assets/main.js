const STORAGE_KEY = "portfolio.theme";
const root = document.documentElement;
root.classList.add("js");

const reducedMotionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
const prefersReducedMotion = () => reducedMotionQuery?.matches ?? false;

function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme, persist = false) {
  root.dataset.theme = theme;
  if (!persist) return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

function wireThemeToggle() {
  const button = document.getElementById("themeToggle");
  if (!button) return;

  const sync = () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    button.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
    button.setAttribute("aria-label", `Switch to ${next} mode`);
    button.title = `Switch to ${next} mode`;
  };

  button.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    sync();
  });
  sync();
}

function setYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function wireHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  update();
  window.addEventListener("scroll", update, { passive: true });
}

function wireMobileMenu() {
  const button = document.getElementById("menuToggle");
  const nav = document.getElementById("primaryNav");
  if (!button || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  };

  button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      button.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !button.contains(event.target)) setOpen(false);
  });
  window.matchMedia("(min-width: 1041px)").addEventListener?.("change", () => setOpen(false));
}

function rotateHeroWord() {
  const word = document.getElementById("heroWord");
  if (!word || prefersReducedMotion()) return;

  const words = ["adapts.", "remembers.", "generalizes.", "matters."];
  let index = 0;
  let changeTimer;
  const interval = window.setInterval(() => {
    word.classList.add("is-switching");
    changeTimer = window.setTimeout(() => {
      index = (index + 1) % words.length;
      word.textContent = words[index];
      word.classList.remove("is-switching");
    }, 300);
  }, 3200);

  reducedMotionQuery?.addEventListener?.("change", (event) => {
    if (!event.matches) return;
    window.clearInterval(interval);
    window.clearTimeout(changeTimer);
    word.textContent = words[0];
    word.classList.remove("is-switching");
  });
}

function wireActiveNav() {
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  if (!links.length || !("IntersectionObserver" in window)) return;
  const byId = new Map(links.map((link) => [link.getAttribute("href").slice(1), link]));
  const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.remove("is-active");
          link.removeAttribute("aria-current");
        });
        const active = byId.get(entry.target.id);
        active?.classList.add("is-active");
        active?.setAttribute("aria-current", "true");
      });
    },
    { rootMargin: "-35% 0px -60% 0px" }
  );
  sections.forEach((section) => observer.observe(section));
}

function wireScrollReveal() {
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;
  const targets = document.querySelectorAll(".stats, .section-label, .section-body > *, .contact .container > *");
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.06, rootMargin: "0px 0px -6% 0px" }
  );

  targets.forEach((target) => {
    target.classList.add("reveal");
    observer.observe(target);
  });
  requestAnimationFrame(() => root.classList.add("motion-ready"));
}

applyTheme(getPreferredTheme());
wireThemeToggle();
setYear();
wireHeader();
wireMobileMenu();
rotateHeroWord();
wireActiveNav();
wireScrollReveal();
