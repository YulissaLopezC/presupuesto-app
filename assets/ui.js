// ============================================================
// assets/ui.js
// Componentes de UI reutilizables entre páginas.
// Genera HTML, maneja el nav, toast notifications, etc.
// ============================================================

import { logout, getCurrentUser } from "../modules/auth.js";
import { lastMonths, formatMonth } from "./utils.js";

// ── Topbar con email + logout ─────────────────────────────
export function renderTopbar(user) {
  const el = document.getElementById("topbar");
  if (!el) return;

  // Aplicar modo oscuro guardado
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) document.body.classList.add("dark");

  el.innerHTML = `
    <a href="../pages/dashboard.html" class="topbar-brand">🔥 Mi Presupuesto</a>
    <div class="topbar-user">
      <button class="topbar-darkbtn" id="btn-darkmode" title="Modo oscuro">${isDark ? "☀️" : "🌙"}</button>
      <span class="topbar-email">${user.email}</span>
      <button class="btn-logout" id="btn-logout">Salir</button>
    </div>
  `;
  document.getElementById("btn-logout").addEventListener("click", async () => {
    await logout();
  });
  document.getElementById("btn-darkmode").addEventListener("click", () => {
    const nowDark = document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", nowDark);
    document.getElementById("btn-darkmode").textContent = nowDark ? "☀️" : "🌙";
  });
}

// ── Nav inferior con ítem activo ──────────────────────────
// activeItem: "dashboard" | "expenses" | "budget" | "envelopes" | "categories"
export function renderBottomNav(activeItem) {
  const el = document.getElementById("bottom-nav");
  if (!el) return;

  const items = [
    {
      id: "dashboard", href: "../pages/dashboard.html", label: "Inicio",
      icon: `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
    },
    {
      id: "expenses", href: "../pages/expenses.html", label: "Movimientos",
      icon: `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
    },
    {
      id: "budget", href: "../pages/budget.html", label: "Presupuesto",
      icon: `<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
    },
    {
      id: "wallets", href: "../pages/wallets.html", label: "Cajitas",
      icon: `<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`
    },
    {
      id: "goals", href: "../pages/goals.html", label: "Metas",
      icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`
    },
    {
      id: "loans", href: "../pages/loans.html", label: "Préstamos",
      icon: `<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`
    },
    {
      id: "more", href: "#", label: "Más",
      icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`
    }
  ];

  // En móvil: primeros 4 fijos + botón "Más" que abre popup con el resto
  // En desktop: todos visibles
  const mainItems = items.slice(0, 4);
  const moreItems = items.slice(4);
  const isMoreActive = moreItems.some(i => i.id === activeItem);

  el.innerHTML = mainItems.map(item => `
    <a href="${item.href}" class="nav-item ${item.id === activeItem ? "active" : ""}">
      ${item.icon}
      ${item.label}
    </a>
  `).join("") + `
    <div class="nav-item nav-more-btn ${isMoreActive ? "active" : ""}" id="nav-more-btn">
      <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
      Más
    </div>
  `;

  // Inject all items for desktop (hidden on mobile via CSS)
  const desktopExtra = document.createElement("div");
  desktopExtra.id = "nav-desktop-extra";
  desktopExtra.innerHTML = moreItems.map(item => `
    <a href="${item.href}" class="nav-item ${item.id === activeItem ? "active" : ""}">
      ${item.icon}
      ${item.label}
    </a>
  `).join("");
  el.appendChild(desktopExtra);

  // Popup menu
  const popup = document.createElement("div");
  popup.id = "nav-more-popup";
  popup.innerHTML = moreItems.map(item => `
    <a href="${item.href}" class="nav-more-item ${item.id === activeItem ? "active" : ""}">
      ${item.icon}
      <span>${item.label}</span>
    </a>
  `).join("");
  document.body.appendChild(popup);

  // Inject styles if not present
  if (!document.getElementById("nav-more-styles")) {
    const style = document.createElement("style");
    style.id = "nav-more-styles";
    style.textContent = `
      /* Mobile: hide desktop extra, show more btn */
      @media (max-width: 600px) {
        #nav-desktop-extra { display: none !important; }
        .nav-more-btn { display: flex; cursor: pointer; }
      }
      /* Desktop: hide more btn, show all items inline */
      @media (min-width: 601px) {
        .nav-more-btn { display: none !important; }
        #nav-desktop-extra { display: contents; }
        #nav-more-popup { display: none !important; }
      }
      /* Popup */
      #nav-more-popup {
        position: fixed;
        bottom: calc(var(--nav-h) + 8px);
        right: 12px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 8px;
        z-index: 200;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        min-width: 160px;
        display: none;
        flex-direction: column;
        gap: 2px;
        animation: popup-in 0.15s ease;
      }
      #nav-more-popup.open { display: flex; }
      @keyframes popup-in {
        from { opacity: 0; transform: translateY(8px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .nav-more-item {
        display: flex; align-items: center; gap: 12px;
        padding: 11px 14px; border-radius: 10px;
        text-decoration: none; color: var(--muted);
        font-size: 13px; font-weight: 400;
        transition: background 0.15s, color 0.15s;
      }
      .nav-more-item svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
      .nav-more-item:hover { background: var(--surface2); color: var(--text); }
      .nav-more-item.active { color: var(--accent); }
    `;
    document.head.appendChild(style);
  }

  // Toggle popup
  document.getElementById("nav-more-btn").addEventListener("click", e => {
    e.stopPropagation();
    popup.classList.toggle("open");
  });
  document.addEventListener("click", () => popup.classList.remove("open"));
}

// ── Toast notification ────────────────────────────────────
// type: "success" | "error" | ""
export function showToast(message, type = "", duration = 2800) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type}`;
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => toast.classList.remove("show"), duration);
}

// ── Selector de mes — navegación con flechas ─────────────
export function renderMonthSelector(containerId, currentMonth, onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;

  let selected = currentMonth;

  el.innerHTML = `
    <div class="ms-wrap">
      <button class="ms-arrow" id="ms-prev" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="ms-label" id="ms-label">${formatMonth(selected)}</span>
      <button class="ms-arrow" id="ms-next" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
  `;

  if (!document.getElementById("ms-styles")) {
    const style = document.createElement("style");
    style.id = "ms-styles";
    style.textContent = `
      .ms-wrap {
        display: inline-flex; align-items: center; gap: 4px;
        background: var(--surface); border: 1px solid var(--border2);
        border-radius: 99px; padding: 4px 6px;
      }
      .ms-arrow {
        width: 30px; height: 30px; border-radius: 50%;
        border: none; background: none;
        color: var(--muted); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.15s, color 0.15s;
        flex-shrink: 0;
      }
      .ms-arrow:hover { background: var(--surface2); color: var(--accent); }
      .ms-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
      .ms-label {
        font-size: 13px; font-weight: 500; color: var(--text);
        min-width: 130px; text-align: center;
        text-transform: capitalize;
      }
    `;
    document.head.appendChild(style);
  }

  const prevBtn  = document.getElementById("ms-prev");
  const nextBtn  = document.getElementById("ms-next");
  const labelEl  = document.getElementById("ms-label");

  // Permitir navegar al mes siguiente si estamos en los últimos 5 días del mes
  const today       = new Date();
  const dayOfMonth  = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const canPlanNext = (daysInMonth - dayOfMonth) < 5; // últimos 5 días

  const [cy, cm] = currentMonth.split("-").map(Number);
  // Mes máximo permitido: mes actual o siguiente si aplica
  const maxYear  = canPlanNext ? (cm === 12 ? cy + 1 : cy) : cy;
  const maxMonth = canPlanNext ? (cm === 12 ? 1 : cm + 1) : cm;

  function updateButtons() {
    const [sy, sm] = selected.split("-").map(Number);
    nextBtn.disabled = (sy === maxYear && sm === maxMonth);
  }

  function shiftMonth(delta) {
    const [y, m] = selected.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    selected = d.getFullYear() + "-" + mm;
    labelEl.textContent = formatMonth(selected);
    updateButtons();
    onChange(selected);
  }

  prevBtn.addEventListener("click", () => shiftMonth(-1));
  nextBtn.addEventListener("click", () => shiftMonth(1));
  updateButtons();
}


// ── Badge de tipo de categoría ────────────────────────────
export function categoryBadge(type) {
  const map = {
    "GASTO BÁSICO":       { cls: "basico",      label: "Básico" },
    "GASTO NO ESENCIAL":  { cls: "no-esencial", label: "No esencial" },
    "AHORRO O INVERSIÓN": { cls: "ahorro",       label: "Ahorro" }
  };
  const { cls, label } = map[type] || { cls: "basico", label: type };
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Loader de página ──────────────────────────────────────
export function showPageLoader(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;padding:8px 0">
      <div class="skeleton" style="height:100px;border-radius:18px;"></div>
      <div class="skeleton" style="height:80px;border-radius:18px;"></div>
      <div class="skeleton" style="height:160px;border-radius:18px;"></div>
    </div>
  `;
}
