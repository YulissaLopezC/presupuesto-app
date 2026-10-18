// ============================================================
// assets/ui.js
// Componentes de UI reutilizables entre páginas.
// ============================================================

import { logout, getCurrentUser } from "../modules/auth.js?v=20261018";
import { formatMonth } from "./utils.js?v=20261018";

// ── SVGs de tema y helper de toggle ──────────────────────
function _moonSvg(s = 16) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}
function _sunSvg(s = 16) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
}

function _applyThemeToggle() {
  const nowDark = document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", String(nowDark));

  const tbBtn = document.getElementById("btn-darkmode");
  if (tbBtn) tbBtn.innerHTML = nowDark ? _sunSvg() : _moonSvg();

  const sbBtn = document.getElementById("sidebar-dark-btn");
  if (sbBtn) sbBtn.innerHTML = (nowDark ? _sunSvg() : _moonSvg()) + `<span>${nowDark ? "Modo claro" : "Modo oscuro"}</span>`;

  const pdLabel = document.getElementById("nav-dark-label");
  if (pdLabel) pdLabel.textContent = nowDark ? "Modo claro" : "Modo oscuro";
  const pdIcon = document.getElementById("nav-dark-icon");
  if (pdIcon) pdIcon.innerHTML = nowDark ? _sunSvg(18) : _moonSvg(18);
}

// ── Topbar con email + logout ─────────────────────────────
export function renderTopbar(user) {
  const el = document.getElementById("topbar");
  if (!el) return;

  const isDark  = localStorage.getItem("darkMode") === "true";
  if (isDark) document.body.classList.add("dark");

  const initial = user.email ? user.email[0].toUpperCase() : "U";
  const email   = user.email || "";

  el.innerHTML = `
    <a href="../pages/dashboard.html" class="topbar-brand">Mi Presupuesto</a>
    <div class="topbar-user">
      <button class="topbar-darkbtn" id="btn-darkmode" aria-label="Cambiar tema">
        ${isDark ? _sunSvg() : _moonSvg()}
      </button>
      <div class="topbar-avatar-wrap">
        <button class="topbar-avatar" id="btn-avatar" aria-label="Menú de usuario">${initial}</button>
        <div class="topbar-avatar-menu" id="avatar-menu" role="menu">
          <div class="avatar-menu-email">${email}</div>
          <div class="avatar-menu-divider"></div>
          <button class="avatar-menu-logout" id="btn-logout" role="menuitem">Cerrar sesión</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-darkmode").addEventListener("click", _applyThemeToggle);

  document.getElementById("btn-avatar").addEventListener("click", e => {
    e.stopPropagation();
    document.getElementById("avatar-menu").classList.toggle("open");
  });
  document.addEventListener("click", () => {
    document.getElementById("avatar-menu")?.classList.remove("open");
  });

  document.getElementById("btn-logout").addEventListener("click", async () => {
    await logout();
  });

  if (!document.getElementById("topbar-avatar-styles")) {
    const st = document.createElement("style");
    st.id = "topbar-avatar-styles";
    st.textContent = `
      .topbar-darkbtn svg { stroke: var(--muted); }
      .topbar-darkbtn:hover svg { stroke: var(--text); }
      .topbar-avatar-wrap { position: relative; }
      .topbar-avatar {
        width: 34px; height: 34px; border-radius: 50%;
        background: var(--accent); color: #fff;
        border: none; cursor: pointer;
        font-size: 14px; font-weight: 600;
        font-family: "Public Sans", sans-serif;
        display: flex; align-items: center; justify-content: center;
        transition: opacity 0.15s;
      }
      .topbar-avatar:hover { opacity: 0.85; }
      .topbar-avatar-menu {
        position: absolute; top: calc(100% + 8px); right: 0;
        background: var(--surface); border: 1px solid var(--border);
        border-radius: 12px; padding: 10px;
        min-width: 200px; z-index: 300;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        display: none; flex-direction: column; gap: 4px;
      }
      .topbar-avatar-menu.open { display: flex; }
      .avatar-menu-email {
        font-size: 12px; color: var(--muted); padding: 4px 6px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .avatar-menu-divider { height: 1px; background: var(--border-soft); margin: 4px 0; }
      .avatar-menu-logout {
        background: none; border: none; text-align: left;
        padding: 8px; border-radius: 8px;
        font-size: 13px; color: var(--danger); cursor: pointer;
        font-family: "Public Sans", sans-serif; width: 100%;
        transition: background 0.15s;
      }
      .avatar-menu-logout:hover { background: rgba(217,63,63,0.08); }
    `;
    document.head.appendChild(st);
  }
}

// ── Nav inferior + sidebar ────────────────────────────────
// activeItem: "dashboard" | "expenses" | "wallets" | "budget" |
//             "comparativo" | "goals" | "loans" | "inventario" |
//             "asistente" | "categories"
export function renderBottomNav(activeItem) {
  const el = document.getElementById("bottom-nav");
  if (!el) return;

  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) document.body.classList.add("dark");

  const inventarioActivo = localStorage.getItem("inventarioActivo") === "true";

  // Ocultos del menú por el momento (las páginas siguen existiendo)
  const hiddenItems = ["goals", "asistente"];

  // Items secundarios — aparecen en "Más" (móvil) y en el sidebar (escritorio)
  const secondaryItems = [
    {
      id: "budget", href: "../pages/budget.html", label: "Presupuesto",
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
    },
    {
      id: "comparativo", href: "../pages/comparison.html", label: "Comparativo",
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
    },
    {
      id: "goals", href: "../pages/goals.html", label: "Metas",
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`
    },
    {
      id: "loans", href: "../pages/loans.html", label: "Préstamos",
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`
    },
    ...(inventarioActivo ? [{
      id: "inventario", href: "../pages/inventario.html", label: "Inventario",
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`
    }] : []),
    {
      id: "asistente", href: "../pages/asistente.html", label: "Asistente",
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/></svg>`
    },
    {
      id: "categories", href: "../pages/categories.html", label: "Categorías",
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>`
    }
  ].filter(item => !hiddenItems.includes(item.id));

  const isSecondaryActive = secondaryItems.some(i => i.id === activeItem);

  // ── Nav inferior móvil (5 posiciones) ─────────────────
  el.innerHTML = `
    <a href="../pages/dashboard.html"
       class="nav-item ${activeItem === "dashboard" ? "active" : ""}"
       aria-label="Inicio">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>
    </a>
    <a href="../pages/expenses.html"
       class="nav-item ${activeItem === "expenses" ? "active" : ""}"
       aria-label="Movimientos">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M3 8l4-4 4 4M17 20V4M21 16l-4 4-4-4"/></svg>
    </a>
    <a href="../pages/expenses.html" class="nav-fab" id="nav-fab" aria-label="Nuevo movimiento">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
    </a>
    <a href="../pages/wallets.html"
       class="nav-item ${activeItem === "wallets" ? "active" : ""}"
       aria-label="Cajitas">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>
    </a>
    <button class="nav-item nav-more-btn ${isSecondaryActive ? "active" : ""}"
            id="nav-more-btn" type="button" aria-label="Más" aria-haspopup="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  `;

  // ── Panel "Más" (aparece encima del nav en móvil) ──────
  const popup = document.createElement("div");
  popup.id = "nav-more-popup";
  popup.innerHTML = `
    <div class="nav-more-grid">
      ${secondaryItems.map(item => `
        <a href="${item.href}" class="nav-more-item ${item.id === activeItem ? "active" : ""}">
          ${item.icon}
          <span>${item.label}</span>
        </a>
      `).join("")}
    </div>
    <div class="nav-more-footer">
      <button class="nav-more-action" id="nav-dark-btn" type="button">
        <span id="nav-dark-icon">${isDark ? _sunSvg(18) : _moonSvg(18)}</span>
        <span id="nav-dark-label">${isDark ? "Modo claro" : "Modo oscuro"}</span>
      </button>
      <button class="nav-more-action nav-more-logout" id="nav-more-logout" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>Cerrar sesión</span>
      </button>
    </div>
  `;
  document.body.appendChild(popup);

  document.getElementById("nav-more-btn").addEventListener("click", e => {
    e.stopPropagation();
    popup.classList.toggle("open");
  });
  document.addEventListener("click", () => popup.classList.remove("open"));
  document.getElementById("nav-dark-btn").addEventListener("click", _applyThemeToggle);
  document.getElementById("nav-more-logout").addEventListener("click", async () => await logout());

  // ── Estilos del panel "Más" ────────────────────────────
  if (!document.getElementById("nav-more-styles")) {
    const style = document.createElement("style");
    style.id = "nav-more-styles";
    style.textContent = `
      .nav-fab {
        width: 52px; height: 52px;
        border-radius: 16px;
        background: var(--accent); color: #FFFFFF;
        display: flex; align-items: center; justify-content: center;
        justify-self: center; align-self: center;
        text-decoration: none; flex-shrink: 0;
        transition: background 0.2s, transform 0.1s;
      }
      .nav-fab:hover  { background: var(--accent-strong); }
      .nav-fab:active { transform: scale(0.94); }
      .nav-more-btn   { background: none; border: none; cursor: pointer; }
      #nav-more-popup {
        position: fixed; bottom: 100px; left: 16px; right: 16px;
        background: var(--navy); border-radius: 22px;
        padding: 12px 8px 8px; z-index: 200;
        display: none; flex-direction: column; gap: 4px;
        box-shadow: 0 -4px 40px rgba(0,0,0,0.3);
      }
      #nav-more-popup.open { display: flex; animation: _popup-up 0.18s ease; }
      @keyframes _popup-up {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .nav-more-grid {
        display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 0 4px;
      }
      .nav-more-item {
        display: flex; flex-direction: column; align-items: center; gap: 5px;
        padding: 10px 4px; border-radius: 14px;
        text-decoration: none; color: var(--navy-muted);
        font-size: 11px; font-weight: 600; font-family: "Public Sans", sans-serif;
        text-align: center; transition: background 0.15s, color 0.15s;
      }
      .nav-more-item svg { stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      .nav-more-item:hover  { background: var(--navy-2); color: #FFFFFF; }
      .nav-more-item.active { color: var(--accent); }
      .nav-more-footer {
        display: flex; gap: 6px; padding: 8px 4px 4px;
        border-top: 1px solid rgba(255,255,255,0.08); margin-top: 4px;
      }
      .nav-more-action {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
        padding: 10px 8px; border-radius: 12px;
        border: none; background: transparent; color: var(--navy-muted);
        font-size: 13px; font-weight: 600; font-family: "Public Sans", sans-serif; cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }
      .nav-more-action svg { stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
      .nav-more-action:hover { background: var(--navy-2); color: #FFFFFF; }
      .nav-more-logout       { color: #FF8A8A; }
      .nav-more-logout:hover { background: rgba(255,80,80,0.15) !important; color: #FF8A8A !important; }
      @media (min-width: 900px) { #nav-more-popup { display: none !important; } }
    `;
    document.head.appendChild(style);
  }

  // ── Sidebar escritorio (≥ 900px) ───────────────────────
  const allItems = [
    {
      id: "dashboard", href: "../pages/dashboard.html", label: "Inicio",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>`
    },
    {
      id: "expenses", href: "../pages/expenses.html", label: "Movimientos",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M3 8l4-4 4 4M17 20V4M21 16l-4 4-4-4"/></svg>`
    },
    ...secondaryItems.map(i => ({ ...i, icon: i.icon.replace(/width="20" height="20"/g, 'width="18" height="18"') })).flatMap(item =>
      item.id === "budget"
        ? [item, { id: "wallets", href: "../pages/wallets.html", label: "Cajitas", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>` }]
        : [item]
    )
  ];

  let sidebar = document.getElementById("sidebar");
  if (!sidebar) {
    sidebar = document.createElement("div");
    sidebar.id = "sidebar";
    document.body.appendChild(sidebar);
  }

  const userEmail = getCurrentUser()?.email || document.querySelector(".topbar-email")?.textContent || "";
  const initial   = userEmail ? userEmail[0].toUpperCase() : "U";
  const nowDark   = localStorage.getItem("darkMode") === "true";

  sidebar.innerHTML = `
    <div class="sb-brand">
      <span class="sb-brand-name">Mi Presupuesto</span>
    </div>
    <nav class="sb-nav" aria-label="Navegación principal">
      ${allItems.map(item => `
        <a href="${item.href}" class="sb-item ${item.id === activeItem ? "active" : ""}">
          ${item.icon}<span>${item.label}</span>
        </a>
      `).join("")}
    </nav>
    <div class="sb-footer">
      <button class="sb-dark-btn" id="sidebar-dark-btn" type="button">
        ${nowDark ? _sunSvg() : _moonSvg()}
        <span>${nowDark ? "Modo claro" : "Modo oscuro"}</span>
      </button>
      <div class="sb-user">
        <div class="sb-avatar">${initial}</div>
        <div class="sb-email">${userEmail}</div>
        <button class="sb-logout" id="sidebar-logout" type="button">Salir</button>
      </div>
    </div>
  `;

  document.getElementById("sidebar-dark-btn").addEventListener("click", _applyThemeToggle);
  document.getElementById("sidebar-logout").addEventListener("click", async () => await logout());

  if (!document.getElementById("sidebar-styles")) {
    const st = document.createElement("style");
    st.id = "sidebar-styles";
    st.textContent = `
      @media (min-width: 900px) {
        #sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; width: 220px;
          background: var(--navy); z-index: 100;
          display: flex; flex-direction: column;
          padding: 28px 12px; box-sizing: border-box;
        }
        body          { padding-left: 220px !important; padding-bottom: 0 !important; }
        .bottom-nav   { display: none !important; }
        #topbar       { display: none !important; }
        .topbar       { display: none !important; }
      }
      @media (max-width: 899px) { #sidebar { display: none !important; } }

      .sb-brand {
        padding: 0 12px 24px; flex-shrink: 0;
        border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 8px;
      }
      .sb-brand-name {
        font-family: "Sora", sans-serif; font-size: 20px; font-weight: 700;
        color: #FFFFFF; letter-spacing: -0.02em;
      }
      .sb-nav { flex: 1; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; padding-bottom: 8px; }
      .sb-item {
        display: flex; align-items: center; gap: 10px;
        height: 44px; padding: 0 12px; border-radius: 12px;
        text-decoration: none; color: var(--navy-muted);
        font-size: 15px; font-weight: 500; font-family: "Public Sans", sans-serif;
        transition: background 0.15s, color 0.15s; white-space: nowrap;
      }
      .sb-item svg { stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
      .sb-item:hover  { background: var(--navy-2); color: #FFFFFF; }
      .sb-item.active { background: var(--navy-2); color: #FFFFFF; font-weight: 600; }
      .sb-footer {
        border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; flex-shrink: 0;
        display: flex; flex-direction: column; gap: 8px;
      }
      .sb-dark-btn {
        display: flex; align-items: center; gap: 8px;
        height: 40px; padding: 0 12px; border-radius: 10px;
        border: none; background: transparent; color: var(--navy-muted);
        font-size: 13px; font-weight: 500; font-family: "Public Sans", sans-serif;
        cursor: pointer; text-align: left; width: 100%;
        transition: background 0.15s, color 0.15s;
      }
      .sb-dark-btn svg { stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; flex-shrink: 0; }
      .sb-dark-btn:hover { background: var(--navy-2); color: #FFFFFF; }
      .sb-user { display: flex; align-items: center; gap: 8px; padding: 0 4px; }
      .sb-avatar {
        width: 32px; height: 32px; border-radius: 50%;
        background: var(--navy-2); color: #FFFFFF;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 600; flex-shrink: 0;
        border: 1px solid rgba(255,255,255,0.15);
      }
      .sb-email {
        flex: 1; min-width: 0; font-size: 11px; color: var(--navy-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        font-family: "Public Sans", sans-serif;
      }
      .sb-logout {
        background: none; border: none; color: var(--navy-muted); font-size: 11px;
        cursor: pointer; font-family: "Public Sans", sans-serif;
        padding: 4px 6px; border-radius: 6px; flex-shrink: 0;
        transition: color 0.15s;
      }
      .sb-logout:hover { color: #FF8A8A; }
    `;
    document.head.appendChild(st);
  }
}

// ── Toast notification ────────────────────────────────────
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
      <button class="ms-arrow" id="ms-prev" type="button" aria-label="Mes anterior">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="ms-label" id="ms-label">${formatMonth(selected)}</span>
      <button class="ms-arrow" id="ms-next" type="button" aria-label="Mes siguiente">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  `;

  if (!document.getElementById("ms-styles")) {
    const style = document.createElement("style");
    style.id = "ms-styles";
    style.textContent = `
      .ms-wrap {
        display: inline-flex; align-items: center; gap: 4px;
        background: var(--surface); border: 1px solid var(--border);
        border-radius: 999px; padding: 4px 6px;
      }
      .ms-arrow {
        width: 30px; height: 30px; border-radius: 50%;
        border: none; background: none; color: var(--muted); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.15s, color 0.15s; flex-shrink: 0;
      }
      .ms-arrow:hover    { background: var(--surface2); color: var(--accent); }
      .ms-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
      .ms-label {
        font-size: 14px; font-weight: 600; color: var(--text);
        min-width: 130px; text-align: center; text-transform: capitalize;
        font-family: "Public Sans", sans-serif;
      }
    `;
    document.head.appendChild(style);
  }

  const prevBtn = document.getElementById("ms-prev");
  const nextBtn = document.getElementById("ms-next");
  const labelEl = document.getElementById("ms-label");

  const today       = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const canPlanNext = (daysInMonth - today.getDate()) <= 10;
  const [cy, cm]    = currentMonth.split("-").map(Number);
  const maxYear     = canPlanNext ? (cm === 12 ? cy + 1 : cy) : cy;
  const maxMonth    = canPlanNext ? (cm === 12 ? 1    : cm + 1) : cm;

  function updateButtons() {
    const [sy, sm] = selected.split("-").map(Number);
    nextBtn.disabled = (sy === maxYear && sm === maxMonth);
  }

  function shiftMonth(delta) {
    const [y, m] = selected.split("-").map(Number);
    const d  = new Date(y, m - 1 + delta, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    selected = `${d.getFullYear()}-${mm}`;
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
