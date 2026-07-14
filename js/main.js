const SETTINGS_URL =
  "https://raw.githubusercontent.com/johnyvino/Python/main/settings.json";
const SETTINGS_CACHE_KEY = "jv_settings_cache";
const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const DEFAULT_SECTION_ORDER = [
  "hero",
  "origin",
  "apple-work",
  "past-work",
  "interaction-design",
  "talks",
  "kind-words",
  "the-human",
  "contact",
];

const DEFAULT_SITE_SETTINGS = {
  requirePassword: true,
  order: [...DEFAULT_SECTION_ORDER],
  sections: {
    hero: true,
    origin: true,
    "apple-work": true,
    "past-work": true,
    "interaction-design": true,
    talks: true,
    "kind-words": false,
    "the-human": true,
    contact: true,
  },
};

function normalizeSettings(parsed) {
  // Start from default order, then move ids to match user-specified order, then
  // append any unknown ids (defensive — keeps the site rendering even if a stale
  // settings.json references removed sections).
  const incomingOrder = Array.isArray(parsed.order) ? parsed.order : null;
  let order = [...DEFAULT_SECTION_ORDER];
  if (incomingOrder) {
    const known = new Set(DEFAULT_SECTION_ORDER);
    const filtered = incomingOrder.filter((id) => known.has(id));
    const missing = DEFAULT_SECTION_ORDER.filter(
      (id) => !filtered.includes(id),
    );
    order = [...filtered, ...missing];
  }
  return {
    requirePassword: parsed.requirePassword !== false,
    order,
    sections: { ...DEFAULT_SITE_SETTINGS.sections, ...(parsed.sections || {}) },
  };
}

function loadCachedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    if (Date.now() - t > SETTINGS_CACHE_TTL) return null;
    return normalizeSettings(data);
  } catch {
    return null;
  }
}

async function fetchFreshSettings() {
  try {
    const res = await fetch(`${SETTINGS_URL}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`settings fetch ${res.status}`);
    const parsed = await res.json();
    localStorage.setItem(
      SETTINGS_CACHE_KEY,
      JSON.stringify({ t: Date.now(), data: parsed }),
    );
    return normalizeSettings(parsed);
  } catch {
    return null;
  }
}

async function readSiteSettings() {
  const cached = loadCachedSettings();
  if (cached) {
    // Refresh in background; re-apply if changed
    fetchFreshSettings().then((fresh) => {
      if (fresh && JSON.stringify(fresh) !== JSON.stringify(cached)) {
        applySectionVisibility(fresh);
        applySectionOrder(fresh);
        applyGateState(fresh);
      }
    });
    return cached;
  }
  const fresh = await fetchFreshSettings();
  return fresh || DEFAULT_SITE_SETTINGS;
}

function applySectionVisibility(settings) {
  Object.entries(settings.sections).forEach(([id, visible]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? "" : "none";
  });
}

/**
 * Reorder sections inside their shared parent so they appear in `settings.order`.
 * All listed sections are assumed to share a single parent (typically <body>).
 * Any DOM siblings that aren't in the order array stay where they are.
 */
function applySectionOrder(settings) {
  if (!Array.isArray(settings.order) || !settings.order.length) return;
  const els = settings.order
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (els.length < 2) return;
  const parent = els[0].parentNode;
  if (!parent || !els.every((el) => el.parentNode === parent)) return;
  // Insert each in turn after the previous one. Re-appending a node moves it,
  // it doesn't clone, so this is a stable in-place reorder.
  let prev = els[0];
  for (let i = 1; i < els.length; i++) {
    prev.after(els[i]);
    prev = els[i];
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await readSiteSettings();
  applySectionVisibility(settings);
  applySectionOrder(settings);
  initPasswordGate(settings);
  initGateMeta();
  initHeader();
  initMenu();
  initThemeToggle();
  initCopyEmail();
});

// ── Password gate ──────────────────────────────────────────────────────────

const PASSWORD_HASH =
  "5d0297147237d6a6b36d08a83fa12e1e068ff11f28b09ed29e24f1316131d48d";

let unlockGate = null;

async function sha256(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str),
  );
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

function applyGateState(settings) {
  // Bg refresh path: if settings now say no-password, drop the gate.
  // We don't relock once unlocked — the user is already in.
  if (!settings.requirePassword && unlockGate) unlockGate();
}

function initPasswordGate(settings) {
  const gate = document.getElementById("passwordGate");
  const input = document.getElementById("passwordInput");
  const error = document.getElementById("passwordError");
  if (!gate || !input) return;

  const setMainInert = (locked) => {
    Array.from(document.body.children).forEach((el) => {
      if (el === gate) return;
      if (locked) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
  };

  const unlock = () => {
    gate.classList.add("unlocked");
    document.body.style.overflow = "";
    setMainInert(false);
    sessionStorage.setItem("unlocked", "1");
  };
  unlockGate = unlock;

  if (!settings.requirePassword) {
    unlock();
    return;
  }

  gate.hidden = false;

  if (sessionStorage.getItem("unlocked") === "1") {
    unlock();
  } else {
    document.body.style.overflow = "hidden";
    setMainInert(true);
  }

  input.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    const check = await sha256(input.value.trim());
    if (check === PASSWORD_HASH) {
      unlock();
      return;
    }
    if (error) {
      error.textContent = "INCORRECT";
      error.classList.add("visible");
      setTimeout(() => error.classList.remove("visible"), 2000);
    }
    input.value = "";
  });
}

function initGateMeta() {
  const gateTime = document.getElementById("gateTime");
  if (gateTime) {
    const digits = gateTime.querySelector(".gate-time-digits");
    const period = gateTime.querySelector(".gate-time-period");
    const render = () => {
      const now = new Date();
      const hours = now.getHours();
      const h12 = ((hours + 11) % 12) + 1;
      if (digits)
        digits.textContent = `${h12}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (period) period.textContent = hours >= 12 ? "PM" : "AM";
    };
    render();
    let interval = setInterval(render, 15000);
    document.addEventListener("visibilitychange", () => {
      clearInterval(interval);
      if (!document.hidden) {
        render();
        interval = setInterval(render, 15000);
      }
    });
  }

  const gateLocation = document.getElementById("gateLocation");
  if (gateLocation) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    gateLocation.textContent = tz.split("/").pop().replace(/_/g, " ") || "";
  }
}

function initHeader() {
  const siteHeader = document.getElementById("siteHeader");
  if (!siteHeader) return;
  const update = () =>
    siteHeader.classList.toggle("scrolled", window.scrollY > 50);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initMenu() {
  const menuBtn = document.getElementById("menuBtn");
  const dropdown = document.getElementById("headerDropdown");
  const header = document.getElementById("siteHeader");
  if (!menuBtn || !dropdown || !header) return;

  const close = () => {
    dropdown.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  };

  menuBtn.addEventListener("click", () => {
    const isOpen = dropdown.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  dropdown.addEventListener("click", (e) => {
    if (e.target.closest(".header-dropdown-item")) close();
  });

  document.addEventListener("click", (e) => {
    if (!header.contains(e.target)) close();
  });
}

function initThemeToggle() {
  const toggles = document.querySelectorAll(".theme-toggle");
  if (!toggles.length) return;

  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
  }

  const apply = () => {
    document.body.classList.toggle("light-mode");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("light-mode") ? "light" : "dark",
    );
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      if (!document.startViewTransition) {
        apply();
        return;
      }
      const { left, top, width, height } = toggle.getBoundingClientRect();
      const x = left + width / 2;
      const y = top + height / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      document.startViewTransition(apply).ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 800,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
    });
  });
}

function initCopyEmail() {
  const copyBtn = document.getElementById("copyEmail");
  const copyHint = document.getElementById("copyHint");
  if (!copyBtn) return;

  let resetTimer = null;
  const copy = async () => {
    const email = copyBtn.getAttribute("data-email");
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      return;
    }
    if (!copyHint) return;
    copyHint.textContent = "COPIED";
    copyHint.classList.add("copied");
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      copyHint.textContent = "CLICK TO COPY";
      copyHint.classList.remove("copied");
    }, 2000);
  };

  copyBtn.addEventListener("click", copy);
  if (copyHint) {
    copyHint.style.cursor = "pointer";
    copyHint.addEventListener("click", copy);
  }
}
