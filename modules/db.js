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
  const amount     = Number(data.amount);
  // walletType debe venir en data desde el frontend
  const isCredit   = data.walletType === "credito";
  // Crédito: gasto SUBE saldo (más deuda) → +amount
  // Ahorro/efectivo: gasto BAJA saldo → -amount
  const delta      = isCredit ? amount : -amount;

  await runTransaction(db, async (tx) => {
    tx.set(expenseRef, { ...data, amount, createdAt: serverTimestamp() });
    if (walletRef) tx.update(walletRef, { balance: increment(delta) });
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
  await runTransaction(db, async (tx) => {
    const expRef = userDoc(uid, "expenses", expenseId);
    // Revertir cajita anterior (operación inversa)
    if (oldData.walletId) {
      const oldIsCredit = oldData.walletType === "credito";
      tx.update(userDoc(uid, "wallets", oldData.walletId),
        { balance: increment(oldIsCredit ? -Number(oldData.amount) : Number(oldData.amount)) });
    }
    // Aplicar cajita nueva
    if (newData.walletId) {
      const newIsCredit = newData.walletType === "credito";
      tx.update(userDoc(uid, "wallets", newData.walletId),
        { balance: increment(newIsCredit ? Number(newData.amount) : -Number(newData.amount)) });
    }
    tx.update(expRef, { ...newData, amount: Number(newData.amount) });
  });
}

export async function deleteExpense(uid, expenseId, expenseData) {
  await runTransaction(db, async (tx) => {
    const expRef = userDoc(uid, "expenses", expenseId);
    if (expenseData?.walletId) {
      const isCredit = expenseData.walletType === "credito";
      // Revertir = operación inversa al gasto original
      tx.update(userDoc(uid, "wallets", expenseData.walletId),
        { balance: increment(isCredit ? -Number(expenseData.amount) : Number(expenseData.amount)) });
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
//
// data: {
//   name:        "Banco Davivienda",
//   icon:        "🏦",
//   type:        "ahorro" | "efectivo" | "credito"
//   balance:     saldo actual
//                · ahorro/efectivo: saldo positivo disponible
//                · credito:         saldo usado (deuda acumulada), arranca en 0
//   creditLimit: cupo total (solo para type="credito")
//   notes:       texto libre
// }

export async function addWallet(uid, data) {
  const isCredit = data.type === "credito";
  return addDoc(userCol(uid, "wallets"), {
    ...data,
    balance:     isCredit ? 0 : Number(data.balance || 0),
    creditLimit: isCredit ? Number(data.creditLimit || 0) : null,
    createdAt:   serverTimestamp()
  });
}

export async function getWallets(uid) {
  const snap = await getDocs(userCol(uid, "wallets"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateWallet(uid, walletId, data) {
  const isCredit = data.type === "credito";
  const updates  = { ...data, updatedAt: serverTimestamp() };
  if (isCredit) {
    updates.creditLimit = Number(data.creditLimit || 0);
  } else {
    updates.balance = Number(data.balance || 0);
  }
  return updateDoc(userDoc(uid, "wallets", walletId), updates);
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

// ── TRANSFERENCIAS ENTRE CAJITAS (transfers) ──────────────
//
// data: { date, fromWalletId, fromWalletName, toWalletId, toWalletName, amount, description }
// Atómica: descuenta de origen y suma en destino en una sola operación

export async function addTransfer(uid, data) {
  const transferRef  = doc(userCol(uid, "transfers"));
  const fromRef      = userDoc(uid, "wallets", data.fromWalletId);
  const toRef        = userDoc(uid, "wallets", data.toWalletId);
  const amount       = Number(data.amount);

  await runTransaction(db, async (tx) => {
    const fromSnap = await tx.get(fromRef);
    const toSnap   = await tx.get(toRef);

    if (!fromSnap.exists() || !toSnap.exists()) throw new Error("Cajita no encontrada");

    const fromWallet = fromSnap.data();
    const toWallet   = toSnap.data();

    // Para crédito origen: el pago reduce la deuda (balance baja)
    // Para crédito destino: la transferencia aumenta la deuda (balance sube)
    // Para ahorro/efectivo: balance normal
    const fromDelta = fromWallet.type === "credito" ? -amount : -amount;
    const toDelta   = toWallet.type   === "credito" ?  amount :  amount;

    tx.update(fromRef, { balance: increment(fromDelta) });
    tx.update(toRef,   { balance: increment(toDelta) });
    tx.set(transferRef, {
      ...data,
      amount,
      createdAt: serverTimestamp()
    });
  });
  return transferRef;
}

export async function getTransfers(uid, filters = {}) {
  let q = query(userCol(uid, "transfers"), orderBy("date", "desc"));
  if (filters.month) {
    q = query(
      userCol(uid, "transfers"),
      where("date", ">=", filters.month + "-01"),
      where("date", "<=", filters.month + "-31"),
      orderBy("date", "desc")
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteTransfer(uid, transferId, transferData) {
  await runTransaction(db, async (tx) => {
    const amount  = Number(transferData.amount);
    const fromRef = userDoc(uid, "wallets", transferData.fromWalletId);
    const toRef   = userDoc(uid, "wallets", transferData.toWalletId);
    tx.update(fromRef, { balance: increment(amount) });
    tx.update(toRef,   { balance: increment(-amount) });
    tx.delete(userDoc(uid, "transfers", transferId));
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

// ── INGRESOS PROPORCIONALES (devengado día a día) ─────────
//
// Estructura de income en budgets:
// income: [
//   {
//     name: "Sueldo",
//     amount: 900000,
//     type: "fijo",              // fijo | no_operacional | extraordinario
//     proportional: true,        // se devenga día a día
//     dailyAmount: 30000         // calculado: amount / días del mes
//   }
// ]
//
// Cuando proportional=true, esta función calcula el acumulado
// hasta hoy y actualiza/crea un registro especial en incomes
// con source = "📅 {name} (proporcional)" y proportionalKey para identificarlo

export async function syncProportionalIncomes(uid, month) {
  const budget = await getBudget(uid, month);
  if (!budget?.income || typeof budget.income !== "object") return [];

  // Normalizar income — objeto {name: {amount, proportional, ...}}
  const incomeEntries = Array.isArray(budget.income)
    ? budget.income.filter(i => i?.name)
    : Object.entries(budget.income)
        .filter(([k, v]) => isNaN(Number(k)) && typeof v === "object" && v !== null)
        .map(([name, val]) => ({ name, ...val }));

  const proportionals = incomeEntries.filter(i => i.proportional && Number(i.amount) > 0);
  if (!proportionals.length) return [];

  // Días transcurridos del mes hasta hoy
  const [y, m] = month.split("-").map(Number);
  const today  = new Date();
  const firstDay = new Date(y, m - 1, 1);
  const lastDay  = new Date(y, m, 0); // último día del mes
  const daysInMonth = lastDay.getDate();

  // Si el mes ya pasó, usar días completos del mes
  // Si es el mes actual, usar días hasta hoy
  // Si es un mes futuro, usar 0
  let daysPassed;
  if (today < firstDay) {
    daysPassed = 0;
  } else if (today > lastDay) {
    daysPassed = daysInMonth;
  } else {
    daysPassed = today.getDate();
  }

  const results = [];

  for (const inc of proportionals) {
    const dailyAmount  = inc.amount / daysInMonth;
    const accruedAmount = Math.round(dailyAmount * daysPassed);
    const propKey      = `prop_${uid}_${month}_${inc.name.replace(/\s+/g, "_")}`;

    // Buscar si ya existe un registro proporcional para esta fuente/mes
    const q    = query(userCol(uid, "incomes"), where("proportionalKey", "==", propKey));
    const snap = await getDocs(q);

    const incomeData = {
      date:           today.toISOString().slice(0, 10),
      source:         inc.name,
      amount:         accruedAmount,
      description:    `Proporcional: ${daysPassed} de ${daysInMonth} días`,
      walletId:       "",
      walletName:     "",
      proportionalKey: propKey,
      isProportional: true,
      dailyAmount:    Math.round(dailyAmount),
      daysInMonth,
      daysPassed,
      totalAmount:    inc.amount,
      autoGenerated:  true
    };

    if (snap.empty) {
      // Crear nuevo registro proporcional
      if (accruedAmount > 0) {
        await addDoc(userCol(uid, "incomes"), {
          ...incomeData,
          createdAt: serverTimestamp()
        });
      }
    } else {
      // Actualizar el existente con el nuevo acumulado
      const existingDoc = snap.docs[0];
      await updateDoc(
        userDoc(uid, "incomes", existingDoc.id),
        { ...incomeData, updatedAt: serverTimestamp() }
      );
    }

    results.push({ ...incomeData, daysPasssed: daysPassed });
  }

  return results;
}

// Obtener solo los ingresos proporcionales del presupuesto de un mes
export async function getProportionalSummary(uid, month) {
  const budget = await getBudget(uid, month);
  if (!budget?.income || typeof budget.income !== "object") return [];

  const [y, m] = month.split("-").map(Number);
  const today   = new Date();
  const lastDay = new Date(y, m, 0);
  const daysInMonth = lastDay.getDate();

  let daysPassed;
  const firstDay = new Date(y, m - 1, 1);
  if (today < firstDay)      daysPassed = 0;
  else if (today > lastDay)  daysPassed = daysInMonth;
  else                       daysPassed = today.getDate();

  // Normalizar income para getProportionalSummary
  const incomeEntries2 = Array.isArray(budget.income)
    ? budget.income.filter(i => i?.name)
    : Object.entries(budget.income)
        .filter(([k, v]) => isNaN(Number(k)) && typeof v === "object" && v !== null)
        .map(([name, val]) => ({ name, ...val }));

  return incomeEntries2
    .filter(i => i.proportional && Number(i.amount) > 0)
    .map(i => ({
      name:          i.name,
      type:          i.type,
      totalAmount:   i.amount,
      dailyAmount:   Math.round(i.amount / daysInMonth),
      daysPassed,
      daysInMonth,
      accruedAmount: Math.round((i.amount / daysInMonth) * daysPassed),
      pct:           daysPassed / daysInMonth
    }));
}
