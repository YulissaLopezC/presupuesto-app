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
    <a href="/pages/dashboard.html" class="topbar-brand">💰 Mi Presupuesto</a>
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
      id: "dashboard", href: "/pages/dashboard.html", label: "Inicio",
      icon: `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
    },
    {
      id: "expenses", href: "/pages/expenses.html", label: "Gastos",
      icon: `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
    },
    {
      id: "budget", href: "/pages/budget.html", label: "Presupuesto",
      icon: `<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
    },
    {
      id: "envelopes", href: "/pages/envelopes.html", label: "Cajitas",
      icon: `<svg viewBox="0 0 24 24"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>`
    },
    {
      id: "goals", href: "/pages/goals.html", label: "Metas",
      icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`
    },
    {
      id: "categories", href: "/pages/categories.html", label: "Más",
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

// ── Selector de mes ───────────────────────────────────────
// Renderiza un <select> con los últimos 12 meses
// containerId: id del elemento donde se inyecta
// currentMonth: "YYYY-MM" seleccionado
// onChange(month): callback cuando cambia
export function renderMonthSelector(containerId, currentMonth, onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const months = lastMonths(12);
  el.innerHTML = `
    <div class="month-selector">
      <select id="month-select">
        ${months.map(m => `
          <option value="${m}" ${m === currentMonth ? "selected" : ""}>${formatMonth(m)}</option>
        `).join("")}
      </select>
    </div>
  `;

  document.getElementById("month-select").addEventListener("change", e => {
    onChange(e.target.value);
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
