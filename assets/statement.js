// ============================================================
// assets/statement.js
// Extracto de cajita: une gastos, ingresos, transferencias, ajustes,
// préstamos y abonos en una sola lista con el saldo después de cada
// movimiento. Funciones puras, sin Firestore.
//
// Cada movimiento se modela como un evento con sus efectos sobre el
// número guardado en cada cajita (`balance`), replicando exactamente lo
// que hace modules/db.js al escribir. En crédito ese número es deuda.
// ============================================================

import { formatName } from "./utils.js";

export const ALL_WALLETS = "all";

// "YYYY-MM-DD" local a partir de un Timestamp de Firestore o Date
function dateFromTs(ts) {
  const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function tsMillis(ts) {
  if (ts?.toMillis) return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

// ── Eventos ───────────────────────────────────────────────
// { key, date, order, kind, effects: [{ walletId, delta }], ...datos para la etiqueta }
// kind: ingreso | gasto | ahorro | pago | transfer | ajuste | prestamo | abono

export function buildEvents(sources, wallets) {
  const byId   = Object.fromEntries(wallets.map(w => [w.id, w]));
  const credit = id => byId[id]?.type === "credito";
  const events = [];
  const push   = (src, prefix, ev) => events.push({
    key: `${prefix}:${src.id}`,
    date: src.date || dateFromTs(src.createdAt),
    order: tsMillis(src.createdAt),
    ...ev
  });

  for (const e of sources.expenses || []) {
    const amt = Number(e.amount || 0);
    const effects = [];
    // addExpense usa el walletType guardado en el gasto, no el tipo actual
    if (e.walletId)   effects.push({ walletId: e.walletId,   delta: e.walletType === "credito" ? amt : -amt });
    if (e.toWalletId) effects.push({ walletId: e.toWalletId, delta: credit(e.toWalletId) ? -amt : amt });
    if (!effects.length) continue;
    const kind = !e.toWalletId ? "gasto" : credit(e.toWalletId) ? "pago" : "ahorro";
    push(e, "exp", {
      kind, effects, amount: amt,
      fromId: e.walletId, toId: e.toWalletId,
      fromName: e.walletName, toName: e.toWalletName,
      label: e.description || "", category: e.category || ""
    });
  }
  for (const i of sources.incomes || []) {
    if (!i.walletId) continue; // los proporcionales no tocan cajitas
    const amt = Number(i.amount || 0);
    push(i, "inc", {
      kind: "ingreso", amount: amt, effects: [{ walletId: i.walletId, delta: amt }],
      label: i.source || "Ingreso", note: i.description || ""
    });
  }
  for (const t of sources.transfers || []) {
    const amt = Number(t.amount || 0);
    push(t, "trf", {
      kind: "transfer", amount: amt,
      effects: [
        { walletId: t.fromWalletId, delta: credit(t.fromWalletId) ? amt : -amt },
        { walletId: t.toWalletId,   delta: credit(t.toWalletId)   ? -amt : amt }
      ],
      fromId: t.fromWalletId, toId: t.toWalletId,
      fromName: t.fromWalletName, toName: t.toWalletName
    });
  }
  for (const a of sources.adjustments || []) {
    push(a, "adj", {
      kind: "ajuste", amount: Math.abs(Number(a.amount || 0)),
      effects: [{ walletId: a.walletId, delta: Number(a.amount || 0) }]
    });
  }
  for (const l of sources.loans || []) {
    if (!l.walletId) continue;
    const amt = Number(l.amount || 0);
    push(l, "loan", { kind: "prestamo", amount: amt, effects: [{ walletId: l.walletId, delta: -amt }], label: l.debtorName || "" });
  }
  for (const p of sources.payments || []) {
    if (!p.walletId) continue;
    const amt = Number(p.amount || 0);
    push(p, "pay", { kind: "abono", amount: amt, effects: [{ walletId: p.walletId, delta: amt }], label: p.debtorName || "" });
  }
  return events;
}

// ── Etiquetas ─────────────────────────────────────────────

export const KIND_LABEL = {
  ingreso: "Ingreso", gasto: "Gasto", ahorro: "Ahorro", pago: "Pago de tarjeta",
  transfer: "Transferencia", ajuste: "Ajuste", prestamo: "Préstamo", abono: "Abono"
};

function walletLabel(byId, id, storedName) {
  return formatName(byId[id]?.name || storedName || "Cajita");
}

// Desde el punto de vista de una cajita (o de todas):
//   desc   → texto principal
//   sub    → línea de tipo en la lista del celular ("Gasto · Mercado")
//   detail → complemento en la tabla ("Droguería · Salud")
function describe(ev, walletId, byId) {
  const from = walletLabel(byId, ev.fromId, ev.fromName);
  const to   = walletLabel(byId, ev.toId, ev.toName);
  const fromTo = (verb) => walletId === ALL_WALLETS ? `${from} → ${to}`
    : walletId === ev.toId ? `${verb} desde ${from}` : `${verb} a ${to}`;
  switch (ev.kind) {
    case "gasto": {
      const cat = formatName(ev.category);
      // Sin descripción, la categoría hace de descripción (como en Movimientos)
      return { desc: formatName(ev.label) || cat || "Gasto", sub: cat ? `Gasto · ${cat}` : "Gasto", detail: ev.label ? cat : "" };
    }
    case "ahorro":
    case "pago": {
      const note = formatName(ev.label);
      return { desc: fromTo(ev.kind === "ahorro" ? "Ahorro" : "Pago"), sub: [KIND_LABEL[ev.kind], note].filter(Boolean).join(" · "), detail: note };
    }
    case "transfer":
      return { desc: fromTo("Transferencia"), sub: "Entre cajitas", detail: "" };
    case "ingreso": {
      const note = formatName(ev.note);
      return { desc: formatName(ev.label), sub: note ? `Ingreso · ${note}` : "Ingreso", detail: note };
    }
    case "ajuste":
      return { desc: "Ajuste de saldo", sub: "Corrección manual", detail: "corrección manual" };
    case "prestamo":
      return { desc: `Préstamo a ${formatName(ev.label)}`, sub: "Préstamo", detail: "" };
    case "abono":
      return { desc: `Abono de ${formatName(ev.label)}`, sub: "Abono de préstamo", detail: "" };
    default:
      return { desc: "", sub: "", detail: "" };
  }
}

// ── Extracto ──────────────────────────────────────────────
// walletId: id de una cajita o ALL_WALLETS
// month:    "YYYY-MM"
// Para "todas": el saldo es el disponible (cajitas activas que no son crédito).
//
// Devuelve { rows (cronológico), initial, final, totalIn, totalOut,
//            countIn, countOut, isCredit, unexplained }
// Cada fila: { ...evento, desc, sub, walletNames, value, dir, balance }
//   value: efecto sobre el saldo mostrado (+ entra, − sale; en crédito + = la deuda baja)
//   dir:   "in" | "out" | "none" (no cambia el disponible, solo en "todas")

export function buildStatement(events, wallets, walletId, month) {
  const byId     = Object.fromEntries(wallets.map(w => [w.id, w]));
  const isAll    = walletId === ALL_WALLETS;
  const scope    = isAll
    ? wallets.filter(w => !w.archived && w.type !== "credito").map(w => w.id)
    : [walletId];
  const visible  = isAll ? new Set(wallets.filter(w => !w.archived).map(w => w.id)) : new Set(scope);
  const inScope  = new Set(scope);
  const isCredit = !isAll && byId[walletId]?.type === "credito";
  // En crédito el número es deuda: lo que la sube es una salida
  const sign     = isCredit ? -1 : 1;

  const balanceNow = scope.reduce((s, id) => s + Number(byId[id]?.balance || 0), 0);
  const effectOf   = ev => ev.effects.filter(f => inScope.has(f.walletId)).reduce((s, f) => s + f.delta, 0);
  const touches    = ev => ev.effects.some(f => visible.has(f.walletId));

  const relevant = events.filter(touches);
  const after    = relevant.filter(ev => ev.date.slice(0, 7) > month);
  const inMonth  = relevant
    .filter(ev => ev.date.slice(0, 7) === month)
    .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);

  // Saldo final del mes: saldo actual menos lo que pasó después
  const final   = balanceNow - after.reduce((s, ev) => s + effectOf(ev), 0);
  const net     = inMonth.reduce((s, ev) => s + effectOf(ev), 0);
  const initial = final - net;

  let running = initial, totalIn = 0, totalOut = 0, countIn = 0, countOut = 0;
  const rows = inMonth.map(ev => {
    const delta = effectOf(ev);
    running += delta;
    const value = delta * sign;
    const dir   = value > 0 ? "in" : value < 0 ? "out" : "none";
    if (dir === "in")  { totalIn  += value;  countIn++;  }
    if (dir === "out") { totalOut += -value; countOut++; }
    const walletNames = ev.effects.filter(f => visible.has(f.walletId)).map(f => formatName(byId[f.walletId]?.name || ""));
    return { ...ev, ...describe(ev, walletId, byId), walletNames, value, dir, balance: running };
  });

  // Control: el acumulado debe terminar en el saldo final
  const unexplained = final - running;
  return { rows, initial, final, totalIn, totalOut, countIn, countOut, isCredit, unexplained };
}

// ── Exportar ──────────────────────────────────────────────
// CSV para Excel: separador ";" y números sin formato
export function statementToCSV(st, { walletName, month, showWallet }) {
  const esc = v => {
    const s = String(v ?? "");
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const saldoLbl = st.isCredit ? "Deuda" : showWallet ? "Disponible" : "Saldo";
  const head = ["Fecha", "Descripción", "Tipo", ...(showWallet ? ["Cajita"] : []), "Entrada", "Salida", saldoLbl];
  const blank = showWallet ? ["", "", ""] : ["", ""];
  const lines = [
    [`Extracto ${walletName}`, month],
    head,
    [`${month}-01`, `${saldoLbl} inicial`, ...blank, "", st.initial],
    ...st.rows.map(r => [
      r.date,
      // En "todas" algunas filas no cambian el disponible (p. ej. compra con tarjeta): se anota el valor
      [r.desc, r.detail, r.dir === "none" ? `$${r.amount} sin efecto en el disponible` : ""].filter(Boolean).join(" · "),
      KIND_LABEL[r.kind],
      ...(showWallet ? [r.walletNames.join(" → ")] : []),
      r.dir === "in" ? r.value : "",
      r.dir === "out" ? -r.value : "",
      r.balance
    ]),
    ["", `${saldoLbl} final`, ...blank.slice(1), st.totalIn, st.totalOut, st.final]
  ];
  return "﻿" + lines.map(l => l.map(esc).join(";")).join("\r\n");
}
