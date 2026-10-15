const STORAGE_KEY = "portfolio.theme";
document.documentElement.classList.add("js");

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function getPreferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}

function wireThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  const sync = () => {
    const current = document.documentElement.dataset.theme || "light";
    const next = current === "dark" ? "light" : "dark";
    btn.setAttribute("aria-pressed", String(current === "dark"));
    btn.setAttribute("aria-label", `Switch to ${next} mode`);
    btn.title = `Switch to ${next} mode`;
  };

  btn.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "light";
    setTheme(current === "dark" ? "light" : "dark");
    sync();
  });

  sync();
}

function wireMailtoComposer() {
  const subject = document.getElementById("msgSubject");
  const body = document.getElementById("msgBody");
  const link = document.getElementById("mailtoLink");
  if (!subject || !body || !link) return;

  const base = link.getAttribute("href") || "mailto:you@example.com";

  const update = () => {
    const s = encodeURIComponent(subject.value || "Hello");
    const b = encodeURIComponent(body.value || "");
    link.setAttribute("href", `${base}?subject=${s}&body=${b}`);
  };

  subject.addEventListener("input", update);
  body.addEventListener("input", update);
  update();
}

function setYear() {
  const year = document.getElementById("year");
  if (!year) return;
  year.textContent = String(new Date().getFullYear());
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
  window.matchMedia("(min-width: 1101px)").addEventListener?.("change", () => setOpen(false));
}

function rotateHeroWord() {
  const word = document.getElementById("heroWord");
  if (!word || prefersReducedMotion()) return;

  const words = ["adapts.", "remembers.", "matters."];
  let index = 0;
  let changeTimer;
  const interval = window.setInterval(() => {
    word.classList.add("is-switching");
    changeTimer = window.setTimeout(() => {
      index = (index + 1) % words.length;
      word.textContent = words[index];
      word.classList.remove("is-switching");
    }, 280);
  }, 3600);

  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", (event) => {
    if (!event.matches) return;
    window.clearInterval(interval);
    window.clearTimeout(changeTimer);
    word.textContent = words[0];
    word.classList.remove("is-switching");
  });
}

function wirePublicationCarousel() {
  const list = document.getElementById("featuredPubs");
  if (!list) return;

  document.querySelectorAll("[data-carousel-direction]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = list.querySelector("li");
      if (!card) return;
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      list.scrollBy({ left: Number(button.dataset.carouselDirection) * (card.getBoundingClientRect().width + gap), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  });
}

function wireScrollReveal() {
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;
  const targets = document.querySelectorAll(".section-head, .featured-projects .project, .research-grid .card, .publication-featured, .honor-stat");
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });

  targets.forEach((target) => {
    target.classList.add("reveal-target");
    observer.observe(target);
  });
  requestAnimationFrame(() => document.documentElement.classList.add("motion-ready"));
}

setTheme(getPreferredTheme());
wireThemeToggle();
wireMailtoComposer();
setYear();
wireMobileMenu();
rotateHeroWord();
wirePublicationCarousel();
wireScrollReveal();
