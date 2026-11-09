// Servidor local do site Aster66 — sem dependências externas.
// Uso: node server.js  (porta padrão 5173, ou PORT=xxxx)
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Carrega variáveis do arquivo .env (sem dependências).
try {
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const PORT = Number(process.env.PORT) || 5173;
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

// Proteção: nunca enviar uma chave service_role/secret para o navegador.
function chavePublicaSegura(k) {
  if (!k) return "";
  if (k.startsWith("sb_secret_")) return "";
  const parts = k.split(".");
  if (parts.length === 3) {
    try {
      const role = JSON.parse(Buffer.from(parts[1], "base64url").toString()).role;
      if (role !== "anon") return "";
    } catch { return ""; }
  }
  return k;
}
const PUBLIC_KEY = chavePublicaSegura(SUPABASE_ANON_KEY);
if (SUPABASE_ANON_KEY && !PUBLIC_KEY) {
  console.warn("⚠ SUPABASE_ANON_KEY não é uma chave pública (anon/publishable). Ela NÃO será enviada ao navegador.");
}
const ROOT = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data", "comments.json");
const VENDOR = {
  "/vendor/pdf-lib.min.js": path.join(__dirname, "node_modules", "pdf-lib", "dist", "pdf-lib.min.js"),
  "/vendor/supabase.js": path.join(__dirname, "node_modules", "@supabase", "supabase-js", "dist", "umd", "supabase.js"),
};

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".ico": "image/x-icon",
};

function readComments() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch { return []; }
}
function writeComments(list) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": TYPES[".json"], "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

// Limite simples: 1 comentário a cada 20s por IP.
const lastPost = new Map();
const TOPICOS = ["Geral", "Regras", "Ficha", "Mundo", "Sugestão", "Mesa / Campanha"];

function handleComments(req, res) {
  if (req.method === "GET") {
    const list = readComments().map(({ ip, ...c }) => c);
    return json(res, 200, list.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)));
  }
  if (req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 10_000) req.destroy();
    });
    req.on("end", () => {
      let body;
      try { body = JSON.parse(raw); } catch { return json(res, 400, { erro: "JSON inválido." }); }
      const nome = String(body.nome || "").trim().slice(0, 60);
      const mensagem = String(body.mensagem || "").trim().slice(0, 1500);
      const topico = TOPICOS.includes(body.topico) ? body.topico : "Geral";
      if (body.site) return json(res, 200, { ok: true }); // honeypot anti-spam
      if (nome.length < 2) return json(res, 400, { erro: "Informe um nome com pelo menos 2 letras." });
      if (mensagem.length < 3) return json(res, 400, { erro: "Escreva uma mensagem." });
      const ip = req.socket.remoteAddress || "local";
      const now = Date.now();
      if (lastPost.has(ip) && now - lastPost.get(ip) < 20_000) {
        return json(res, 429, { erro: "Aguarde alguns segundos antes de comentar de novo." });
      }
      lastPost.set(ip, now);
      const comment = { id: crypto.randomUUID(), nome, topico, mensagem, criadoEm: new Date().toISOString() };
      const list = readComments();
      list.push(comment);
      writeComments(list);
      json(res, 201, comment);
    });
    return;
  }
  json(res, 405, { erro: "Método não permitido." });
}

function serveFile(res, file) {
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      return fs.createReadStream(path.join(ROOT, "404.html")).on("error", () => res.end("404")).pipe(res);
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(buf);
  });
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let p = decodeURIComponent(url.pathname);
    if (p === "/api/comentarios") return handleComments(req, res);
    if (p === "/js/config.js") {
      res.writeHead(200, { "Content-Type": TYPES[".js"], "Cache-Control": "no-store" });
      return res.end(`window.ASTER_SUPABASE = ${JSON.stringify(SUPABASE_URL && PUBLIC_KEY ? { url: SUPABASE_URL, key: PUBLIC_KEY } : null)};\n`);
    }
    if (VENDOR[p]) return serveFile(res, VENDOR[p]);
    if (p.endsWith("/")) p += "index.html";
    if (!path.extname(p)) p += ".html"; // /explorar -> /explorar.html
    const file = path.normalize(path.join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    serveFile(res, file);
  })
  .listen(PORT, () => {
    console.log(`Aster66 rodando em http://localhost:${PORT}`);
    console.log(SUPABASE_URL && PUBLIC_KEY ? `Supabase: ${SUPABASE_URL}` : "Supabase: não configurado (usando dados locais).");
  });
