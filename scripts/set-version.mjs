// ============================================================
// scripts/set-version.mjs
// Pone la misma versión (?v=...) en todos los imports de módulos propios
// y en el style.css, para que al publicar los navegadores descarguen los
// archivos nuevos en vez de usar los que tienen en caché.
//
// Uso, antes de cada publicación:
//   node scripts/set-version.mjs            → versión = fecha de hoy (AAAAMMDD)
//   node scripts/set-version.mjs 20261018b  → versión explícita (p. ej. 2.ª del día)
//
// Por qué un script y no una constante en JS: en los `import ... from "..."`
// estáticos la ruta tiene que ser un texto literal; no puede leer variables.
// Todas las rutas de un mismo módulo deben llevar la misma versión: si una
// página importa "auth.js?v=A" y otro módulo "auth.js?v=B", el navegador
// los trata como dos módulos distintos y Firebase se inicializaría dos veces.
// ============================================================

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

const VERSION = process.argv[2] || todayStamp();
if (!/^[\w.-]+$/.test(VERSION)) {
  console.error(`Versión inválida: "${VERSION}" (usa letras, números, punto o guion)`);
  process.exit(1);
}

const list = (dir, ext) => existsSync(join(ROOT, dir))
  ? readdirSync(join(ROOT, dir)).filter(f => f.endsWith(ext)).map(f => join(dir, f))
  : [];
const files = [
  "index.html", "firebase-config.js",
  ...list("pages", ".html"), ...list("assets", ".js"), ...list("modules", ".js"), ...list("config", ".js")
].filter(f => existsSync(join(ROOT, f)));

// from "./x.js" | from "../x/y.js?v=..." | import("../x.js")  (solo rutas relativas = módulos propios)
const IMPORT_RE = /((?:\bfrom|\bimport)\s*\(?\s*)(["'])(\.{1,2}\/[^"'?]+\.js)(?:\?v=[^"']*)?\2/g;
const CSS_RE    = /(href=)(["'])(\.{0,2}\/?(?:\.\.\/)?assets\/style\.css)(?:\?v=[^"']*)?\2/g;

let changedFiles = 0, refs = 0;
for (const f of files) {
  const path = join(ROOT, f);
  const src  = readFileSync(path, "utf8");
  const out  = src
    .replace(IMPORT_RE, (_, pre, q, spec) => { refs++; return `${pre}${q}${spec}?v=${VERSION}${q}`; })
    .replace(CSS_RE,    (_, pre, q, spec) => { refs++; return `${pre}${q}${spec}?v=${VERSION}${q}`; });
  if (out !== src) { writeFileSync(path, out); changedFiles++; }
}
console.log(`Versión ${VERSION}: ${refs} referencias revisadas, ${changedFiles} archivos actualizados.`);
