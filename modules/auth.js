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

// ── Guardia de sesión ─────────────────────────────────────
export function requireAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        resolve(user);
      } else {
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
