// ============================================================
// modules/auth.js
// Maneja todo lo relacionado con autenticación:
//   - Registro de nuevo usuario
//   - Login con email/contraseña
//   - Logout
//   - Guardia de sesión (redirige si no hay usuario)
//   - Obtener uid del usuario actual
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { auth } from "../firebase-config.js";

// ── Registro ──────────────────────────────────────────────
export async function register(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
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
  window.location.href = "/pages/login.html";
}

// ── UID del usuario actual (sincrónico tras carga) ────────
export function getCurrentUser() {
  return auth.currentUser;
}

// ── Guardia de sesión ─────────────────────────────────────
// Llama esto al inicio de cada página protegida.
// Si no hay sesión activa, redirige al login.
// Devuelve una promesa que resuelve con el usuario.
export function requireAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        resolve(user);
      } else {
        window.location.href = "/pages/login.html";
        reject(new Error("No autenticado"));
      }
    });
  });
}

// ── Escuchar cambios de sesión (para el login/register) ───
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
