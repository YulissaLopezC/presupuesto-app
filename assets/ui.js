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
  el.innerHTML = `
    <a href="../pages/dashboard.html" class="topbar-brand">💰 Mi Presupuesto</a>
    <div class="topbar-user">
      <span class="topbar-email">${user.email}</span>
      <button class="btn-logout" id="btn-logout">Salir</button>
    </div>
  `;
  document.getElementById("btn-logout").addEventListener("click", async () => {
    await logout();
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
      id: "expenses", href: "../pages/expenses.html", label: "Gastos",
      icon: `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
    },
    {
      id: "budget", href: "../pages/budget.html", label: "Presupuesto",
      icon: `<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
    },
    {
      id: "envelopes", href: "../pages/envelopes.html", label: "Cajitas",
      icon: `<svg viewBox="0 0 24 24"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>`
    },
    {
      id: "goals", href: "../pages/goals.html", label: "Metas",
      icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`
    },
    {
      id: "categories", href: "../pages/categories.html", label: "Más",
      icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`
    }
  ];

  el.innerHTML = items.map(item => `
    <a href="${item.href}" class="nav-item ${item.id === activeItem ? "active" : ""}">
      ${item.icon}
      ${item.label}
    </a>
  `).join("");
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

// ── Selector de mes — calendario mini tipo picker ────────
// Muestra el mes activo con botón que abre un grid de meses
// agrupados por año. Un clic fuera lo cierra.
export function renderMonthSelector(containerId, currentMonth, onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const months = lastMonths(24); // últimos 2 años
  // Agrupar por año
  const byYear = months.reduce((acc, m) => {
    const y = m.slice(0, 4);
    (acc[y] = acc[y] || []).push(m);
    return acc;
  }, {});
  const years = Object.keys(byYear).sort().reverse();

  const id = "month-picker-" + containerId;

  el.innerHTML = `
    <div class="mp-wrap" style="position:relative;display:inline-block;">
      <button class="mp-btn" id="${id}-btn" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span id="${id}-label">${formatMonth(currentMonth)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0;opacity:0.5;">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="mp-dropdown" id="${id}-dropdown" style="display:none;">
        ${years.map(y => `
          <div class="mp-year">${y}</div>
          <div class="mp-months">
            ${byYear[y].map(m => {
              const short = new Date(m + "-01").toLocaleDateString("es-CO", { month: "short" });
              return `<button class="mp-month ${m === currentMonth ? "mp-active" : ""}" data-month="${m}" type="button">${short}</button>`;
            }).join("")}
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // Inyectar estilos si no existen
  if (!document.getElementById("mp-styles")) {
    const style = document.createElement("style");
    style.id = "mp-styles";
    style.textContent = `
      .mp-btn {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 8px 14px; border-radius: 99px;
        background: var(--surface); border: 1px solid var(--border2);
        color: var(--text); font-family: "DM Sans", sans-serif;
        font-size: 13px; font-weight: 400; cursor: pointer;
        transition: border-color 0.15s;
      }
      .mp-btn:hover { border-color: var(--accent); }
      .mp-dropdown {
        position: absolute; top: calc(100% + 8px); left: 0;
        background: var(--surface); border: 1px solid var(--border);
        border-radius: 16px; padding: 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        z-index: 200; min-width: 240px;
        animation: mp-in 0.15s ease;
      }
      @keyframes mp-in { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      .mp-year {
        font-size: 10px; font-weight: 500; color: var(--muted);
        text-transform: uppercase; letter-spacing: 0.08em;
        margin: 10px 0 6px; padding-left: 2px;
      }
      .mp-year:first-child { margin-top: 0; }
      .mp-months {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;
      }
      .mp-month {
        padding: 7px 4px; border-radius: 8px; border: none;
        background: none; color: var(--text);
        font-family: "DM Sans", sans-serif; font-size: 12px;
        cursor: pointer; text-align: center; text-transform: capitalize;
        transition: background 0.12s, color 0.12s;
      }
      .mp-month:hover { background: var(--surface2); }
      .mp-active {
        background: var(--accent) !important;
        color: #fff !important; font-weight: 500;
      }
    `;
    document.head.appendChild(style);
  }

  let selected = currentMonth;
  const btn      = document.getElementById(id + "-btn");
  const dropdown = document.getElementById(id + "-dropdown");
  const label    = document.getElementById(id + "-label");

  btn.addEventListener("click", e => {
    e.stopPropagation();
    const isOpen = dropdown.style.display !== "none";
    dropdown.style.display = isOpen ? "none" : "block";
  });

  dropdown.addEventListener("click", e => {
    const monthBtn = e.target.closest(".mp-month");
    if (!monthBtn) return;
    selected = monthBtn.dataset.month;
    label.textContent = formatMonth(selected);
    dropdown.querySelectorAll(".mp-month").forEach(b => b.classList.remove("mp-active"));
    monthBtn.classList.add("mp-active");
    dropdown.style.display = "none";
    onChange(selected);
  });

  document.addEventListener("click", () => {
    dropdown.style.display = "none";
  });
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
