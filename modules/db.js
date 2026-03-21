// ============================================================
// modules/db.js
// Capa de acceso a Firestore.
//
// Estructura en Firestore:
//   users/{uid}/expenses/{id}       — gastos diarios
//   users/{uid}/incomes/{id}        — ingresos reales registrados
//   users/{uid}/budgets/{YYYY-MM}   — presupuesto mensual
//   users/{uid}/wallets/{id}        — cajitas/cuentas permanentes
//   users/{uid}/categories/{id}     — categorías de gasto
//   users/{uid}/goals/{id}          — metas de ahorro
// ============================================================

import {
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, getDoc,
  query, where, orderBy,
  serverTimestamp, increment, runTransaction
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
// data: { date, category, amount, description, walletId, walletName }
// Al agregar un gasto, descuenta el monto de la cajita en una transacción atómica

export async function addExpense(uid, data) {
  const expenseRef = doc(userCol(uid, "expenses"));
  const walletRef  = data.walletId ? userDoc(uid, "wallets", data.walletId) : null;

  await runTransaction(db, async (tx) => {
    tx.set(expenseRef, {
      ...data,
      amount: Number(data.amount),
      createdAt: serverTimestamp()
    });
    if (walletRef) {
      tx.update(walletRef, { balance: increment(-Number(data.amount)) });
    }
  });
  return expenseRef;
}

export async function getExpenses(uid, filters = {}) {
  let q = query(userCol(uid, "expenses"), orderBy("date", "desc"));

  if (filters.month) {
    q = query(
      userCol(uid, "expenses"),
      where("date", ">=", filters.month + "-01"),
      where("date", "<=", filters.month + "-31"),
      orderBy("date", "desc")
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateExpense(uid, expenseId, oldData, newData) {
  // Revierte el efecto del gasto viejo en la cajita y aplica el nuevo
  await runTransaction(db, async (tx) => {
    const expRef = userDoc(uid, "expenses", expenseId);

    // Revertir cajita anterior si existía
    if (oldData.walletId) {
      const oldWalletRef = userDoc(uid, "wallets", oldData.walletId);
      tx.update(oldWalletRef, { balance: increment(Number(oldData.amount)) });
    }
    // Aplicar cajita nueva
    if (newData.walletId) {
      const newWalletRef = userDoc(uid, "wallets", newData.walletId);
      tx.update(newWalletRef, { balance: increment(-Number(newData.amount)) });
    }
    tx.update(expRef, { ...newData, amount: Number(newData.amount) });
  });
}

export async function deleteExpense(uid, expenseId, expenseData) {
  await runTransaction(db, async (tx) => {
    const expRef = userDoc(uid, "expenses", expenseId);
    // Revertir el descuento en la cajita
    if (expenseData?.walletId) {
      const walletRef = userDoc(uid, "wallets", expenseData.walletId);
      tx.update(walletRef, { balance: increment(Number(expenseData.amount)) });
    }
    tx.delete(expRef);
  });
}

// ── INGRESOS REALES (incomes) ─────────────────────────────
// data: { date, source, amount, description, walletId, walletName }
// Al registrar un ingreso, suma el monto a la cajita

export async function addIncome(uid, data) {
  const incomeRef = doc(userCol(uid, "incomes"));
  const walletRef = data.walletId ? userDoc(uid, "wallets", data.walletId) : null;

  await runTransaction(db, async (tx) => {
    tx.set(incomeRef, {
      ...data,
      amount: Number(data.amount),
      createdAt: serverTimestamp()
    });
    if (walletRef) {
      tx.update(walletRef, { balance: increment(Number(data.amount)) });
    }
  });
  return incomeRef;
}

export async function getIncomes(uid, filters = {}) {
  let q = query(userCol(uid, "incomes"), orderBy("date", "desc"));

  if (filters.month) {
    q = query(
      userCol(uid, "incomes"),
      where("date", ">=", filters.month + "-01"),
      where("date", "<=", filters.month + "-31"),
      orderBy("date", "desc")
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateIncome(uid, incomeId, oldData, newData) {
  await runTransaction(db, async (tx) => {
    const incRef = userDoc(uid, "incomes", incomeId);
    if (oldData.walletId) {
      tx.update(userDoc(uid, "wallets", oldData.walletId), { balance: increment(-Number(oldData.amount)) });
    }
    if (newData.walletId) {
      tx.update(userDoc(uid, "wallets", newData.walletId), { balance: increment(Number(newData.amount)) });
    }
    tx.update(incRef, { ...newData, amount: Number(newData.amount) });
  });
}

export async function deleteIncome(uid, incomeId, incomeData) {
  await runTransaction(db, async (tx) => {
    const incRef = userDoc(uid, "incomes", incomeId);
    if (incomeData?.walletId) {
      tx.update(userDoc(uid, "wallets", incomeData.walletId), { balance: increment(-Number(incomeData.amount)) });
    }
    tx.delete(incRef);
  });
}

// ── CAJITAS / CUENTAS (wallets) ───────────────────────────
// data: { name, balance, icon, notes }
// Permanentes — no tienen mes, el saldo se actualiza con cada movimiento

export async function addWallet(uid, data) {
  return addDoc(userCol(uid, "wallets"), {
    ...data,
    balance: Number(data.balance || 0),
    createdAt: serverTimestamp()
  });
}

export async function getWallets(uid) {
  const snap = await getDocs(userCol(uid, "wallets"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateWallet(uid, walletId, data) {
  return updateDoc(userDoc(uid, "wallets", walletId), {
    ...data,
    balance: Number(data.balance)
  });
}

export async function deleteWallet(uid, walletId) {
  return deleteDoc(userDoc(uid, "wallets", walletId));
}

// Ajuste manual de saldo (para correcciones)
export async function adjustWalletBalance(uid, walletId, newBalance) {
  return updateDoc(userDoc(uid, "wallets", walletId), {
    balance: Number(newBalance),
    updatedAt: serverTimestamp()
  });
}

// ── PRESUPUESTO MENSUAL (budgets) ─────────────────────────

export async function setBudget(uid, month, data) {
  return setDoc(userDoc(uid, "budgets", month), {
    ...data, month, updatedAt: serverTimestamp()
  });
}

export async function getBudget(uid, month) {
  const snap = await getDoc(userDoc(uid, "budgets", month));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getBudgetMonths(uid) {
  const snap = await getDocs(userCol(uid, "budgets"));
  return snap.docs.map(d => d.id).sort().reverse();
}

// ── CATEGORÍAS (categories) ───────────────────────────────

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

// ── METAS DE AHORRO (goals) ───────────────────────────────

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
