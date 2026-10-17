// ============================================================
// modules/auth.js
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { auth, db } from "../firebase-config.js";

// ── Categorías por defecto ────────────────────────────────
const DEFAULT_CATEGORIES = [
  // Gasto básico
  { name: "Aseo Hogar",        type: "GASTO BÁSICO" },
  { name: "Transporte",        type: "GASTO BÁSICO" },
  { name: "Funeraria",         type: "GASTO BÁSICO" },
  { name: "Educación",         type: "GASTO BÁSICO" },
  { name: "Deudas",            type: "GASTO BÁSICO" },
  { name: "Cuidado personal",  type: "GASTO BÁSICO" },
  // Gasto no esencial
  { name: "Suscripciones",     type: "GASTO NO ESENCIAL" },
  { name: "Rumba",             type: "GASTO NO ESENCIAL" },
  { name: "Comidas por fuera", type: "GASTO NO ESENCIAL" },
  { name: "Otro",              type: "GASTO NO ESENCIAL" },
  // Ahorro o inversión
  { name: "Ahorro Familiar",   type: "AHORRO O INVERSIÓN" },
  { name: "Ahorro/Inversión",  type: "AHORRO O INVERSIÓN" },
];

async function createDefaultCategories(uid) {
  try {
    const col = collection(db, "users", uid, "categories");
    await Promise.all(DEFAULT_CATEGORIES.map(cat => addDoc(col, cat)));
    console.log("Categorías por defecto creadas para:", uid);
  } catch (err) {
    console.error("Error creando categorías por defecto:", err);
    // No lanzamos el error — el registro sigue aunque falle esto
  }
}

// ── Registro ──────────────────────────────────────────────
export async function register(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Crear categorías por defecto para el nuevo usuario
  await createDefaultCategories(cred.user.uid);
  return cred.user;
}

// ── Login ─────────────────────────────────────────────────
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ── Logout ────────────────────────────────────────────────
export async function logout() {
  await signOut(auth);
  const BASE = window.location.pathname.replace(/\/pages\/.*$/, "");
  window.location.href = BASE + "/pages/login.html";
}

// ── UID del usuario actual ────────────────────────────────
export function getCurrentUser() {
  return auth.currentUser;
}

// ── Loading overlay ───────────────────────────────────────
// Inyectado en cuanto requireAuth() corre, antes de que resuelva Firebase.
// Da feedback inmediato al usuario en vez de pantalla blanca.

function _injectLoader() {
  if (document.getElementById("_auth-loader")) return;

  const isDark = localStorage.getItem("darkMode") === "true";
  const bg     = isDark ? "#111"    : "#f0f4f8";
  const ring   = isDark ? "#7ab8e8" : "#0f3460";
  const ringBg = isDark ? "rgba(122,184,232,0.12)" : "rgba(15,52,96,0.1)";
  const muted  = isDark ? "#555"    : "#bbb";

  const style = document.createElement("style");
  style.id    = "_auth-loader-css";
  style.textContent = `
    @keyframes _aspin { to { transform: rotate(360deg); } }
    #_auth-loader {
      position: fixed; inset: 0; z-index: 9999;
      background: ${bg};
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 16px;
      padding: 32px;
      font-family: "DM Sans", system-ui, sans-serif;
    }
    #_auth-loader ._spinner {
      width: 30px; height: 30px; border-radius: 50%;
      border: 3px solid ${ringBg};
      border-top-color: ${ring};
      animation: _aspin 0.7s linear infinite;
    }
    #_auth-loader ._lbl { font-size: 13px; color: ${muted}; margin: 0; }
    #_auth-loader ._err-ico  { font-size: 40px; }
    #_auth-loader ._err-ttl  { font-size: 16px; font-weight: 500; color: ${isDark?"#e8e8e8":"#1a1a2e"}; text-align: center; margin: 0; }
    #_auth-loader ._err-sub  { font-size: 13px; color: #888; text-align: center; max-width: 280px; margin: 0; line-height: 1.5; }
    #_auth-loader ._err-btn  {
      background: #0f3460; color: #fff; border: none; border-radius: 10px;
      padding: 13px 28px; font-size: 14px; font-weight: 500; cursor: pointer;
      font-family: inherit; margin-top: 4px;
    }
    #_auth-loader ._err-btn:hover { background: #1a4a7a; }
  `;
  document.head.appendChild(style);

  const el = document.createElement("div");
  el.id = "_auth-loader";
  el.innerHTML = `
    <div style="font-size:38px; line-height:1;">🔥</div>
    <div class="_spinner"></div>
    <p class="_lbl">Cargando...</p>
  `;
  document.body.appendChild(el);
}

function _removeLoader() {
  document.getElementById("_auth-loader")?.remove();
  document.getElementById("_auth-loader-css")?.remove();
}

function _showConnectionError() {
  const el = document.getElementById("_auth-loader");
  if (!el) return;
  el.innerHTML = `
    <div class="_err-ico">📶</div>
    <p class="_err-ttl">Problemas de conexión</p>
    <p class="_err-sub">No se pudo conectar con el servidor.<br>Verifica tu internet e intenta de nuevo.</p>
    <button class="_err-btn" onclick="sessionStorage.removeItem('_authReloads');location.reload()">
      Reintentar
    </button>
  `;
}

// ── Guardia de sesión ─────────────────────────────────────
// Safari iOS puede dejar IndexedDB bloqueado tras background o memory pressure.
// Estrategia:
//   1. Mostrar overlay de carga inmediatamente (sin pantalla blanca).
//   2. Si onAuthStateChanged no resuelve en 7 s, recargar (libera el lock).
//   3. Contar reloads en sessionStorage — máximo 2 automáticos.
//   4. Al tercer fallo mostrar error con botón "Reintentar" en vez de bucle infinito.
export function requireAuth() {
  return new Promise((resolve, reject) => {
    _injectLoader();

    let settled = false;

    const RELOAD_KEY  = "_authReloads";
    const reloadCount = Number(sessionStorage.getItem(RELOAD_KEY) || "0");

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (reloadCount < 2) {
        console.warn(`[auth] timeout (intento ${reloadCount + 1}/2) — recargando`);
        sessionStorage.setItem(RELOAD_KEY, String(reloadCount + 1));
        window.location.reload();
      } else {
        console.warn("[auth] timeout tras 2 recargas — mostrando error de conexión");
        sessionStorage.removeItem(RELOAD_KEY);
        _showConnectionError();
        reject(new Error("requireAuth timeout"));
      }
    }, 7000);

    const unsub = onAuthStateChanged(auth, (user) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsub();
      sessionStorage.removeItem(RELOAD_KEY); // Resetear contador en éxito
      if (user) {
        _removeLoader();
        resolve(user);
      } else {
        _removeLoader();
        const BASE = window.location.pathname.replace(/\/pages\/.*$/, "");
        window.location.href = BASE + "/pages/login.html";
        reject(new Error("No autenticado"));
      }
    });
  });
}

// ── Escuchar cambios de sesión ────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
