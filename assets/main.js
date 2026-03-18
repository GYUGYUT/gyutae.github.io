const STORAGE_KEY = "portfolio.theme";

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

function setLastUpdated() {
  const el = document.getElementById("lastUpdated");
  if (!el) return;
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  el.textContent = `${y}-${m}-${day}`;
}

setTheme(getPreferredTheme());
wireThemeToggle();
wireMailtoComposer();
setYear();
setLastUpdated();
