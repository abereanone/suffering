// Theme toggle behaviour. The initial theme is applied by a tiny inline script in
// Main.astro's <head> so there is no flash before paint; this module only wires up
// the toggle buttons and keeps their labels in sync.
const STORAGE_KEY = "site-theme";
const root = document.documentElement;

const supportsStorage = (() => {
  try {
    const testKey = "__theme_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
})();

const readStoredTheme = () => {
  if (!supportsStorage) {
    return null;
  }
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch (error) {
    return null;
  }
};

const writeStoredTheme = (theme) => {
  if (!supportsStorage) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch (error) {
    // ignore
  }
};

const prefersDark = () => {
  if (typeof window.matchMedia !== "function") {
    return null;
  }
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch (error) {
    return null;
  }
};

const updateButtons = (theme) => {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    const label = button.querySelector("[data-theme-toggle-label]");
    if (label) {
      label.textContent = theme === "dark" ? "Light" : "Dark";
    }
    const icon = button.querySelector("[data-theme-toggle-icon]");
    if (icon) {
      icon.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  });
};

const applyTheme = (theme, persist = true) => {
  const next = theme === "dark" ? "dark" : "light";
  root.dataset.theme = next;
  if (persist) {
    writeStoredTheme(next);
  }
  updateButtons(next);
  return next;
};

const toggleTheme = () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
};

const init = () => {
  const stored = readStoredTheme();
  const initial = stored || (prefersDark() === "dark" ? "dark" : "light");
  applyTheme(initial, false);

  document.addEventListener("click", (event) => {
    const element =
      event.target instanceof Element ? event.target.closest("[data-theme-toggle]") : null;
    if (!element) {
      return;
    }
    event.preventDefault();
    toggleTheme();
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
