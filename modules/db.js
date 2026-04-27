// ============================================================
// modules/db.js
// Capa de acceso a Firestore.
//
// Estructura en Firestore:
//   users/{uid}/expenses/{id}                      — gastos diarios
//   users/{uid}/incomes/{id}                       — ingresos reales registrados
//   users/{uid}/budgets/{YYYY-MM}                  — presupuesto mensual
//   users/{uid}/wallets/{id}                       — cajitas/cuentas permanentes
//   users/{uid}/categories/{id}                    — categorías de gasto
//   users/{uid}/goals/{id}                         — metas de ahorro
//   users/{uid}/debtors/{id}                       — deudores
//   users/{uid}/debtors/{id}/loans/{id}            — préstamos individuales por deudor
//   users/{uid}/debtors/{id}/payments/{id}         — abonos por deudor
// ============================================================

import {
  collection, doc,
  addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, getDoc,
  query, where, orderBy,
  serverTimestamp, increment, runTransaction, writeBatch
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
  const expenseRef  = doc(userCol(uid, "expenses"));
  const walletRef   = data.walletId   ? userDoc(uid, "wallets", data.walletId)   : null;
  const savingsRef  = data.toWalletId ? userDoc(uid, "wallets", data.toWalletId) : null;
  const amount      = Number(data.amount);
  const isCredit    = data.walletType === "credito";
  const delta       = isCredit ? amount : -amount;

  await runTransaction(db, async (tx) => {
    // Reads primero
    const toWalletSnap = savingsRef ? await tx.get(savingsRef) : null;
    const toIsCredit   = toWalletSnap?.exists() && toWalletSnap.data().type === "credito";
    // Writes después
    tx.set(expenseRef, { ...data, amount, createdAt: serverTimestamp() });
    if (walletRef)   tx.update(walletRef,  { balance: increment(delta) });
    if (savingsRef)  tx.update(savingsRef, { balance: increment(toIsCredit ? -amount : amount) });
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
    const expRef  = userDoc(uid, "expenses", expenseId);
    const amount  = Number(expenseData.amount);
    const toRef   = expenseData?.toWalletId ? userDoc(uid, "wallets", expenseData.toWalletId) : null;
    // Reads primero
    const toSnap  = toRef ? await tx.get(toRef) : null;
    const toIsCredit = toSnap?.exists() && toSnap.data().type === "credito";
    // Writes después
    if (expenseData?.walletId) {
      const isCredit = expenseData.walletType === "credito";
      tx.update(userDoc(uid, "wallets", expenseData.walletId),
        { balance: increment(isCredit ? -amount : amount) });
    }
    if (toRef) tx.update(toRef, { balance: increment(toIsCredit ? amount : -amount) });
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

export async function getWallets(uid, includeArchived = false) {
  const snap = await getDocs(userCol(uid, "wallets"));
  const all  = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return includeArchived ? all : all.filter(w => !w.archived);
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

export async function archiveWallet(uid, walletId) {
  return updateDoc(userDoc(uid, "wallets", walletId), {
    archived: true,
    updatedAt: serverTimestamp()
  });
}

export async function restoreWallet(uid, walletId) {
  return updateDoc(userDoc(uid, "wallets", walletId), {
    archived: false,
    updatedAt: serverTimestamp()
  });
}

// Solo para casos extremos — no expuesto en la UI
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
    // Crédito origen (ej. usar tarjeta para transferir): saldo sube (más deuda)
    // Ahorro/efectivo origen: saldo baja
    const fromDelta = fromWallet.type === "credito" ? amount : -amount;
    // Crédito destino (ej. pagar tarjeta): saldo baja (menos deuda)
    // Ahorro/efectivo destino: saldo sube
    const toDelta   = toWallet.type   === "credito" ? -amount : amount;

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

// ── Renombrar categoría en gastos del mes ─────────────────
export async function renameCategoryInExpenses(uid, month, oldName, newName) {
  const q    = query(
    userCol(uid, "expenses"),
    where("date", ">=", month + "-01"),
    where("date", "<=", month + "-31"),
    where("category", "==", oldName)
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { category: newName }));
  await batch.commit();
  return snap.docs.length;
}

// ── GASTOS PROPORCIONALES (solo informativo, no escribe) ──
//
// Lee las categorías marcadas como proporcionales en el presupuesto
// y calcula cuánto va devengado hasta hoy.
// También cruza con los gastos reales registrados para mostrar el pendiente.

export async function getProportionalExpensesSummary(uid, month, realExpenses = []) {
  const budget = await getBudget(uid, month);
  if (!budget?.categories) return [];

  const [y, m]  = month.split("-").map(Number);
  const today   = new Date();
  const firstDay = new Date(y, m - 1, 1);
  const lastDay  = new Date(y, m, 0);
  const daysInMonth = lastDay.getDate();

  let daysPassed;
  if (today < firstDay)     daysPassed = 0;
  else if (today > lastDay) daysPassed = daysInMonth;
  else                      daysPassed = today.getDate();

  // Necesitamos saber qué categorías tienen proportional=true
  // Eso está en categories/{id} pero también en budget.categoryMeta
  // Por simplicidad, lo guardamos en budget.categoryMeta: { "Transporte": { proportional: true } }
  const meta = budget.categoryMeta || {};

  return Object.entries(budget.categories)
    .filter(([name]) => meta[name]?.proportional)
    .map(([name, budgetedAmount]) => {
      const amount      = Number(budgetedAmount || 0);
      const dailyAmount = Math.round(amount / daysInMonth);
      const accrued     = Math.round(dailyAmount * daysPassed);

      // Sumar gastos reales de esta categoría en el mes
      const realTotal = realExpenses
        .filter(e => e.category === name)
        .reduce((s, e) => s + Number(e.amount), 0);

      const pending = Math.max(accrued - realTotal, 0);

      return {
        name,
        amount,
        dailyAmount,
        daysPassed,
        daysInMonth,
        accrued,
        realTotal,
        pending,
        pct: amount > 0 ? Math.min(accrued / amount, 1) : 0
      };
    })
    .filter(s => s.amount > 0);
}

// ── DEUDORES / PRÉSTAMOS (nueva estructura) ───────────────
//
// users/{uid}/debtors/{debtorId}
//   name, totalAmount, totalPaid, status, createdAt
// users/{uid}/debtors/{debtorId}/loans/{loanId}
//   amount, date, walletId, walletName, notes
// users/{uid}/debtors/{debtorId}/payments/{paymentId}
//   amount, date, walletId, walletName, notes

function debtorCol(uid)                        { return collection(db, "users", uid, "debtors"); }
function debtorDoc(uid, did)                   { return doc(db, "users", uid, "debtors", did); }
function loanCol(uid, did)                     { return collection(db, "users", uid, "debtors", did, "loans"); }
function loanDoc(uid, did, lid)                { return doc(db, "users", uid, "debtors", did, "loans", lid); }
function paymentCol(uid, did)                  { return collection(db, "users", uid, "debtors", did, "payments"); }
function paymentDoc(uid, did, pid)             { return doc(db, "users", uid, "debtors", did, "payments", pid); }

// Crea un deudor nuevo con su primer préstamo
export async function addDebtor(uid, name, loanData) {
  const dRef      = doc(debtorCol(uid));
  const lRef      = doc(loanCol(uid, dRef.id));
  const walletRef = loanData.walletId ? userDoc(uid, "wallets", loanData.walletId) : null;
  const amount    = Number(loanData.amount);

  await runTransaction(db, async (tx) => {
    tx.set(dRef, { name, totalAmount: amount, totalPaid: 0, status: "pendiente", createdAt: serverTimestamp() });
    tx.set(lRef, {
      amount, date: loanData.date || "", walletId: loanData.walletId || "",
      walletName: loanData.walletName || "", notes: loanData.notes || "", createdAt: serverTimestamp()
    });
    if (walletRef) tx.update(walletRef, { balance: increment(-amount) });
  });
  return dRef;
}

export async function getDebtors(uid) {
  const snap = await getDocs(debtorCol(uid));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Elimina un deudor completo revertiendo cada préstamo/abono en sus cajitas
export async function deleteDebtor(uid, debtorId) {
  const [loansSnap, paymentsSnap] = await Promise.all([
    getDocs(loanCol(uid, debtorId)),
    getDocs(paymentCol(uid, debtorId))
  ]);
  const batch = writeBatch(db);
  for (const d of loansSnap.docs) {
    const l = d.data();
    if (l.walletId) batch.update(userDoc(uid, "wallets", l.walletId), { balance: increment(Number(l.amount || 0)) });
    batch.delete(d.ref);
  }
  for (const d of paymentsSnap.docs) {
    const p = d.data();
    if (p.walletId) batch.update(userDoc(uid, "wallets", p.walletId), { balance: increment(-Number(p.amount || 0)) });
    batch.delete(d.ref);
  }
  batch.delete(debtorDoc(uid, debtorId));
  await batch.commit();
}

// Agrega un préstamo adicional a un deudor existente
export async function addLoan(uid, debtorId, loanData) {
  const lRef      = doc(loanCol(uid, debtorId));
  const dRef      = debtorDoc(uid, debtorId);
  const walletRef = loanData.walletId ? userDoc(uid, "wallets", loanData.walletId) : null;
  const amount    = Number(loanData.amount);

  await runTransaction(db, async (tx) => {
    tx.set(lRef, {
      amount, date: loanData.date || "", walletId: loanData.walletId || "",
      walletName: loanData.walletName || "", notes: loanData.notes || "", createdAt: serverTimestamp()
    });
    tx.update(dRef, { totalAmount: increment(amount), status: "pendiente" });
    if (walletRef) tx.update(walletRef, { balance: increment(-amount) });
  });
  return lRef;
}

export async function getLoans(uid, debtorId) {
  const snap = await getDocs(loanCol(uid, debtorId));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

// Elimina un préstamo individual y corrige el total del deudor
export async function deleteLoan(uid, debtorId, loanId, loanData) {
  const dRef      = debtorDoc(uid, debtorId);
  const lRef      = loanDoc(uid, debtorId, loanId);
  const amount    = Number(loanData.amount);
  const walletRef = loanData.walletId ? userDoc(uid, "wallets", loanData.walletId) : null;

  await runTransaction(db, async (tx) => {
    const dSnap = await tx.get(dRef);
    if (!dSnap.exists()) throw new Error("Deudor no encontrado");
    const d         = dSnap.data();
    const newTotal  = Math.max(Number(d.totalAmount || 0) - amount, 0);
    const newStatus = Number(d.totalPaid || 0) >= newTotal ? "pagado" : "pendiente";
    tx.delete(lRef);
    tx.update(dRef, { totalAmount: newTotal, status: newStatus });
    if (walletRef) tx.update(walletRef, { balance: increment(amount) });
  });
}

// Registra un abono: se aplica al total del deudor
export async function addLoanPayment(uid, debtorId, data) {
  const pRef      = doc(paymentCol(uid, debtorId));
  const dRef      = debtorDoc(uid, debtorId);
  const walletRef = data.walletId ? userDoc(uid, "wallets", data.walletId) : null;
  const amount    = Number(data.amount);

  await runTransaction(db, async (tx) => {
    const dSnap = await tx.get(dRef);
    if (!dSnap.exists()) throw new Error("Deudor no encontrado");
    const d         = dSnap.data();
    const newPaid   = Number(d.totalPaid || 0) + amount;
    const newStatus = newPaid >= Number(d.totalAmount || 0) ? "pagado" : "pendiente";
    tx.set(pRef, { ...data, amount, createdAt: serverTimestamp() });
    tx.update(dRef, { totalPaid: newPaid, status: newStatus });
    if (walletRef) tx.update(walletRef, { balance: increment(amount) });
  });
  return pRef;
}

export async function getLoanPayments(uid, debtorId) {
  const snap = await getDocs(paymentCol(uid, debtorId));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export async function deleteLoanPayment(uid, debtorId, paymentId, paymentData) {
  const pRef  = paymentDoc(uid, debtorId, paymentId);
  const dRef  = debtorDoc(uid, debtorId);
  const amount = Number(paymentData.amount);

  await runTransaction(db, async (tx) => {
    const dSnap = await tx.get(dRef);
    if (!dSnap.exists()) throw new Error("Deudor no encontrado");
    const d         = dSnap.data();
    const newPaid   = Math.max(Number(d.totalPaid || 0) - amount, 0);
    const newStatus = newPaid >= Number(d.totalAmount || 0) ? "pagado" : "pendiente";
    tx.delete(pRef);
    tx.update(dRef, { totalPaid: newPaid, status: newStatus });
    if (paymentData.walletId) tx.update(userDoc(uid, "wallets", paymentData.walletId), { balance: increment(-amount) });
  });
}

// Migra datos del esquema anterior (users/{uid}/loans) al nuevo esquema
// Solo corre si la colección debtors está vacía
export async function migrateOldLoans(uid) {
  const existingSnap = await getDocs(debtorCol(uid));
  if (!existingSnap.empty) return 0;
  const oldSnap = await getDocs(userCol(uid, "loans"));
  if (oldSnap.empty) return 0;

  const groups = {};
  for (const d of oldSnap.docs) {
    const l = { id: d.id, docRef: d.ref, ...d.data() };
    const key = (l.debtorName || "Sin nombre").trim();
    if (!groups[key]) groups[key] = { loans: [], payments: [] };
    groups[key].loans.push(l);
  }

  for (const g of Object.values(groups)) {
    for (const loan of g.loans) {
      const pSnap = await getDocs(collection(db, "users", uid, "loans", loan.id, "payments"));
      for (const p of pSnap.docs) g.payments.push({ ...p.data(), id: p.id });
    }
  }

  const batch = writeBatch(db);
  let count = 0;
  for (const [name, g] of Object.entries(groups)) {
    const totalAmount = g.loans.reduce((s, l) => s + Number(l.amount || 0), 0);
    const totalPaid   = g.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const dRef        = doc(debtorCol(uid));
    batch.set(dRef, {
      name, totalAmount, totalPaid,
      status: totalPaid >= totalAmount ? "pagado" : "pendiente",
      createdAt: serverTimestamp()
    });
    for (const loan of g.loans) {
      batch.set(doc(loanCol(uid, dRef.id)), {
        amount: Number(loan.amount || 0), date: loan.date || "",
        walletId: loan.walletId || "", walletName: loan.walletName || "",
        notes: loan.notes || "", createdAt: loan.createdAt || serverTimestamp()
      });
      batch.delete(loan.docRef);
    }
    for (const pay of g.payments) {
      batch.set(doc(paymentCol(uid, dRef.id)), {
        amount: Number(pay.amount || 0), date: pay.date || "",
        walletId: pay.walletId || "", walletName: pay.walletName || "",
        notes: pay.notes || "", createdAt: pay.createdAt || serverTimestamp()
      });
    }
    count++;
  }
  await batch.commit();
  return count;
}
