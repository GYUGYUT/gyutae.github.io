const STORAGE_KEY = "portfolio.theme";

function getPreferredTheme() {
  return "light";
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}

function wireThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "dark";
    setTheme(current === "dark" ? "light" : "dark");
  });
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

// Force light theme to ensure a white-based background.
try {
  localStorage.removeItem(STORAGE_KEY);
} catch {}
setTheme(getPreferredTheme());
wireThemeToggle();
setYear();
setLastUpdated();

