// ============================================================
// modules/db.js
// Capa de acceso a Firestore. Toda operación con la base de
// datos pasa por aquí. Nunca llames a Firestore directamente
// desde las páginas — usa siempre este módulo.
//
// Estructura en Firestore:
//   users/{uid}/expenses/{id}
//   users/{uid}/budgets/{YYYY-MM}      (uno por mes)
//   users/{uid}/envelopes/{id}
//   users/{uid}/categories/{id}
//   users/{uid}/income_sources/{id}
//   users/{uid}/goals/{id}
// ============================================================

import {
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, getDoc,
  query, where, orderBy, limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "../firebase-config.js";

// ── Helpers ───────────────────────────────────────────────

function userCol(uid, colName) {
  return collection(db, "users", uid, colName);
}

function userDoc(uid, colName, docId) {
  return doc(db, "users", uid, colName, docId);
}

// ── GASTOS (expenses) ─────────────────────────────────────

// Agregar gasto
// data: { date: "2026-03-19", category: "Gatos", amount: 70000, description: "Comida" }
export async function addExpense(uid, data) {
  return addDoc(userCol(uid, "expenses"), {
    ...data,
    amount: Number(data.amount),
    createdAt: serverTimestamp()
  });
}

// Obtener gastos con filtros opcionales
// filters: { month: "2026-03", category: "Gatos" }
export async function getExpenses(uid, filters = {}) {
  let q = query(userCol(uid, "expenses"), orderBy("date", "desc"));

  if (filters.month) {
    // Filtra por prefijo YYYY-MM en el campo date
    q = query(
      userCol(uid, "expenses"),
      where("date", ">=", filters.month + "-01"),
      where("date", "<=", filters.month + "-31"),
      orderBy("date", "desc")
    );
  }

  if (filters.category) {
    q = query(q, where("category", "==", filters.category));
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Actualizar gasto
export async function updateExpense(uid, expenseId, data) {
  return updateDoc(userDoc(uid, "expenses", expenseId), {
    ...data,
    amount: Number(data.amount)
  });
}

// Eliminar gasto
export async function deleteExpense(uid, expenseId) {
  return deleteDoc(userDoc(uid, "expenses", expenseId));
}

// ── PRESUPUESTO MENSUAL (budgets) ─────────────────────────

// El docId es el mes: "2026-03"
// data: { categories: { Gatos: 180000, Transporte: 0, ... }, income: { Guillo: 600000, ... } }
export async function setBudget(uid, month, data) {
  return setDoc(userDoc(uid, "budgets", month), {
    ...data,
    month,
    updatedAt: serverTimestamp()
  });
}

export async function getBudget(uid, month) {
  const snap = await getDoc(userDoc(uid, "budgets", month));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Obtener todos los meses que tienen presupuesto (para el historial)
export async function getBudgetMonths(uid) {
  const snap = await getDocs(userCol(uid, "budgets"));
  return snap.docs.map(d => d.id).sort().reverse();
}

// ── CAJITAS / SOBRES (envelopes) ──────────────────────────

// data: { name: "Ahorro", month: "2026-03", budgeted: 1753416, actual: 1108326 }
export async function setEnvelope(uid, envelopeId, data) {
  return setDoc(userDoc(uid, "envelopes", envelopeId), {
    ...data,
    budgeted: Number(data.budgeted),
    actual: Number(data.actual),
    updatedAt: serverTimestamp()
  });
}

export async function getEnvelopes(uid, month) {
  const q = query(userCol(uid, "envelopes"), where("month", "==", month));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteEnvelope(uid, envelopeId) {
  return deleteDoc(userDoc(uid, "envelopes", envelopeId));
}

// ── CATEGORÍAS (categories) ───────────────────────────────

// data: { name: "Gatos", type: "GASTO BÁSICO" }
// type: "GASTO BÁSICO" | "GASTO NO ESENCIAL" | "AHORRO O INVERSIÓN"
export async function addCategory(uid, data) {
  return addDoc(userCol(uid, "categories"), data);
}

export async function getCategories(uid) {
  const snap = await getDocs(userCol(uid, "categories"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateCategory(uid, categoryId, data) {
  return updateDoc(userDoc(uid, "categories", categoryId), data);
}

export async function deleteCategory(uid, categoryId) {
  return deleteDoc(userDoc(uid, "categories", categoryId));
}

// ── FUENTES DE INGRESO (income_sources) ───────────────────

// data: { name: "Guillo", month: "2026-03", budgeted: 600000, actual: 0 }
export async function setIncomeSource(uid, sourceId, data) {
  return setDoc(userDoc(uid, "income_sources", sourceId), {
    ...data,
    budgeted: Number(data.budgeted),
    actual: Number(data.actual || 0),
    updatedAt: serverTimestamp()
  });
}

export async function getIncomeSources(uid, month) {
  const q = query(userCol(uid, "income_sources"), where("month", "==", month));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteIncomeSource(uid, sourceId) {
  return deleteDoc(userDoc(uid, "income_sources", sourceId));
}

// ── METAS DE AHORRO (goals) ───────────────────────────────
//
// data: {
//   name:       "Viaje a Japón",
//   goalAmount: 5000000,
//   savedAmount: 800000,
//   targetDate: "2027-06",    (YYYY-MM, mes en que quieres lograrlo)
//   emoji:      "✈️",
//   notes:      "texto libre opcional"
// }

export async function addGoal(uid, data) {
  return addDoc(userCol(uid, "goals"), {
    ...data,
    goalAmount:  Number(data.goalAmount),
    savedAmount: Number(data.savedAmount || 0),
    createdAt: serverTimestamp()
  });
}

export async function getGoals(uid) {
  const snap = await getDocs(userCol(uid, "goals"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateGoal(uid, goalId, data) {
  return updateDoc(userDoc(uid, "goals", goalId), {
    ...data,
    goalAmount:  Number(data.goalAmount),
    savedAmount: Number(data.savedAmount || 0)
  });
}

export async function deleteGoal(uid, goalId) {
  return deleteDoc(userDoc(uid, "goals", goalId));
}
