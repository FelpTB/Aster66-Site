// Prepara a pasta public/ para hospedagem estática (GitHub Pages).
// - copia as bibliotecas (supabase-js, pdf-lib) para public/vendor/
// - gera public/js/config.js a partir do .env (somente a chave PÚBLICA anon/publishable)
// Uso: npm run build
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pub = path.join(root, "public");

// 1. Bibliotecas
fs.mkdirSync(path.join(pub, "vendor"), { recursive: true });
for (const [from, to] of [
  ["node_modules/@supabase/supabase-js/dist/umd/supabase.js", "vendor/supabase.js"],
  ["node_modules/pdf-lib/dist/pdf-lib.min.js", "vendor/pdf-lib.min.js"],
]) {
  fs.copyFileSync(path.join(root, from), path.join(pub, to));
  console.log("copiado:", to);
}

// 2. Configuração do Supabase
const env = {};
try {
  for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const url = process.env.SUPABASE_URL || env.SUPABASE_URL || "";
const key = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";

function ehPublica(k) {
  if (!k || k.startsWith("sb_secret_")) return false;
  const p = k.split(".");
  if (p.length !== 3) return k.startsWith("sb_publishable_");
  try { return JSON.parse(Buffer.from(p[1], "base64url").toString()).role === "anon"; } catch { return false; }
}

if (key && !ehPublica(key)) {
  console.error("✖ SUPABASE_ANON_KEY não é uma chave pública (anon/publishable). Abortando para não publicar um segredo.");
  process.exit(1);
}
const cfg = url && key ? { url, key } : null;
fs.writeFileSync(
  path.join(pub, "js", "config.js"),
  "// Gerado por scripts/build.js — chave PÚBLICA do Supabase (anon), segura para o navegador.\n" +
    `window.ASTER_SUPABASE = ${JSON.stringify(cfg)};\n`
);
console.log(cfg ? "config.js gerado com Supabase: " + url : "config.js gerado SEM Supabase (dados locais).");
