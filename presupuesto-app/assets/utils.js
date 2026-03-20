// ============================================================
// assets/utils.js
// Funciones puras de utilidad: formateo, fechas, cálculos.
// Sin dependencias externas. Sin efectos secundarios.
// ============================================================

// ── Formato de moneda (COP) ───────────────────────────────

export function formatCOP(amount) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// "1180000" → "$ 1.180.000"
export function parseCOP(str) {
  return parseInt(String(str).replace(/[^0-9]/g, ""), 10) || 0;
}

// ── Fechas ────────────────────────────────────────────────

// Hoy como "YYYY-MM-DD"
export function today() {
  return new Date().toISOString().slice(0, 10);
}

// Mes actual como "YYYY-MM"
export function currentMonth() {
  return today().slice(0, 7);
}

// "2026-03" → "Marzo 2026"
export function formatMonth(yyyyMM) {
  const [year, month] = yyyyMM.split("-");
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

// "2026-03-19" → "19 mar 2026"
export function formatDate(yyyyMMdd) {
  const [y, m, d] = yyyyMMdd.split("-");
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

// Lista de los últimos N meses como ["2026-03", "2026-02", ...]
export function lastMonths(n = 12) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${d.getFullYear()}-${mm}`);
  }
  return months;
}

// ── Cálculos de presupuesto ───────────────────────────────

// Dado un array de gastos, agrupa y suma por categoría
// expenses: [{ category, amount }]
// Devuelve: { "Gatos": 70650, "Transporte": 0, ... }
export function sumByCategory(expenses) {
  return expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});
}

// Comparativo presupuestado vs real
// budgetCategories: { Gatos: 180000, ... }
// actualByCategory: { Gatos: 70650, ... }
// Devuelve array con diferencia y porcentaje
export function buildComparison(budgetCategories, actualByCategory) {
  return Object.entries(budgetCategories).map(([category, budgeted]) => {
    const actual = actualByCategory[category] || 0;
    const diff   = budgeted - actual;
    const pct    = budgeted > 0 ? (actual / budgeted) : null;
    return { category, budgeted, actual, diff, pct };
  });
}

// Porcentaje del presupuesto total consumido
export function totalUsedPct(comparison) {
  const totalBudgeted = comparison.reduce((s, r) => s + r.budgeted, 0);
  const totalActual   = comparison.reduce((s, r) => s + r.actual,   0);
  return totalBudgeted > 0 ? totalActual / totalBudgeted : 0;
}

// ── Módulo de metas de ahorro (base) ─────────────────────
// Calcula cuánto hay que ahorrar por mes para llegar a una meta.
// goal:      monto objetivo
// current:   lo que ya tienes ahorrado
// months:    en cuántos meses quieres lograrlo
export function monthlySavingsNeeded(goal, current, months) {
  if (months <= 0) return goal - current;
  return Math.max(0, (goal - current) / months);
}

// ── Metas de ahorro: funciones extendidas ─────────────────

// Meses entre hoy y una fecha objetivo "YYYY-MM"
// Devuelve 0 si la fecha ya pasó
export function monthsUntil(targetYYYYMM) {
  const now    = new Date();
  const [y, m] = targetYYYYMM.split("-").map(Number);
  const diff   = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
  return Math.max(0, diff);
}

// Porcentaje de progreso (0–1, puede superar 1)
export function goalProgress(goalAmount, savedAmount) {
  if (!goalAmount) return 0;
  return savedAmount / goalAmount;
}

// Fecha estimada de cumplimiento dado un ahorro mensual → "YYYY-MM" o null
export function estimatedCompletion(goal, current, monthlySaving) {
  if (monthlySaving <= 0) return null;
  const remaining = goal - current;
  if (remaining <= 0) return currentMonth();
  const months = Math.ceil(remaining / monthlySaving);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + months, 1);
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  return `${target.getFullYear()}-${mm}`;
}
