// Sincroniza as bases de dados do Notion (Aster) com o esquema `aster` do Supabase.
//
// Uso:
//   npm run sync:notion                 sincroniza só o que mudou desde a última vez
//   npm run sync:notion -- --full       relê todas as páginas (use depois de mudar colunas)
//   npm run sync:notion -- --dry-run    só lê o Notion e salva JSON em data/notion-export/ (não grava no Supabase)
//   npm run sync:notion -- --only=cartas,racas
//
// Precisa no .env (nunca vão para o site; o build só usa SUPABASE_ANON_KEY):
//   NOTION_TOKEN               token da integração do Notion (com acesso à página "Databases")
//   SUPABASE_SERVICE_ROLE_KEY  chave service_role / secret do Supabase (não necessária no --dry-run)
//
// Antes da primeira vez: rode supabase/schema-aster.sql e exponha o schema `aster` na API.
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const NOTION_VERSION = "2022-06-28";
const SCHEMA = "aster";

// ---------------------------------------------------------------------------
// Mapa Notion → Supabase. Uma entrada por base; cada propriedade do Notion vira uma coluna.
// Os nomes das propriedades são comparados sem acento, sem maiúsculas e sem espaços sobrando.
// Relações só são aceitas se apontarem para a base indicada em `rel` (outras são ignoradas).
// ---------------------------------------------------------------------------
const BASES = {
  cartas: {
    database: "339f5867e96082c4932d01ad0aa7e8d8",
    props: {
      "Name": "nome",
      "Tipo": "tipo",
      "Modo de Uso": "modo_de_uso",
      "Cooldown": "cooldown",
      "Custo em Energia": "custo_em_energia",
      "Custo Extra": "custo_extra",
      "Raridade": "raridade",
      "Origem": "origem",
      "Alcançe": "alcance",
      "Palavra Chave": "palavra_chave",
      "Carta Relacionada": { col: "carta_relacionada", rel: "cartas" },
    },
  },
  racas: {
    database: "100f5867e9608315b2ef01ff8f3cc4c0",
    props: {
      "Name": "nome",
      "Atributos Iniciais": "atributos_iniciais",
      "Vida Inicial": "vida_inicial",
      "Energia Inicial": "energia_inicial",
      "Origens Relacionadas": "origens_relacionadas",
      "Habilidade Inata": { col: "habilidade_inata", rel: "cartas" },
      "Habilidade Inata (Cartas)": { col: "habilidade_inata", rel: "cartas" },
    },
  },
  classes: {
    database: "1b9f5867e9608317b5a8812e1b598217",
    props: {
      "Name": "nome",
      "Atributos Iniciais": "atributos_iniciais",
      "Vida Inicial": "vida_inicial",
      "Energia Inicial": "energia_inicial",
      "Origem Relacionada": "origem_relacionada",
      "Habilidade Característica": { col: "habilidade_caracteristica", rel: "cartas" },
      "Habilidade Característica (Cartas)": { col: "habilidade_caracteristica", rel: "cartas" },
    },
  },
  itens: {
    database: "9e2f5867e9608358976781b82cb9125c",
    props: {
      "Name": "nome",
      "Tipo": "tipo",
      "Raridade": "raridade",
      "Empunhadura": "empunhadura",
      "Modo de Uso": "modo_de_uso",
      "Alcançe": "alcance",
      "Efeito": "efeito",
      "Preço Unitário": "preco_unitario",
      "Qtd. por espaço": "qtd_por_espaco",
    },
  },
  criaturas: {
    database: "d7df5867e96083f28e6f81b61185ed35",
    props: {
      "Name": "nome",
      "Tipo": "tipo",
      "Nível": "nivel",
      "Raridade": "raridade",
      "Vida": "vida",
      "Ações": "acoes",
      "Reações": "reacoes",
      "Movimento": "movimento",
      "Atributos": "atributos",
      "Tipo de Defesa": "tipo_de_defesa",
      "Atributo de Defesa": "atributo_de_defesa",
      "Cartas": { col: "cartas", rel: "cartas" },
      "Cartas (Cartas)": { col: "cartas", rel: "cartas" },
    },
  },
  personagens: {
    database: "23bf5867e9608203916281fd7de62f60",
    props: {
      "Name": "nome",
      "Nível do Personagem": "nivel_do_personagem",
      "Locais Relacionados": "locais_relacionados",
      "Organizações Relacionadas": "organizacoes_relacionadas",
    },
  },
  organizacoes: {
    database: "07cf5867e9608335bc5681e3bfab469e",
    props: {
      "Name": "nome",
      "Nível de Influência": "nivel_de_influencia",
      "Locais Relacionados": "locais_relacionados",
    },
  },
  cenarios: {
    database: "40ef5867e96080a6ae19c1295fc34ed5",
    props: {
      "Nome": "nome",
      "Abrangência": "abrangencia",
      "Cenários Relacionados": { col: "cenarios_relacionados", rel: "cenarios" },
      "Locais Relacionados": { col: "cenarios_relacionados", rel: "cenarios" }, // nome antigo
      "Efeito": "efeito",
      "Inspirações": "inspiracoes",
    },
  },
};

// Colunas de array no Supabase (para converter select ↔ multi_select sem quebrar).
const COLUNAS_ARRAY = new Set([
  "tipo", "modo_de_uso", "cooldown", "custo_em_energia", "origem", "alcance", "palavra_chave",
  "atributos_iniciais", "origens_relacionadas", "atributos", "locais_relacionados", "organizacoes_relacionadas",
  "carta_relacionada", "habilidade_inata", "habilidade_caracteristica", "cartas", "cenarios_relacionados",
]);
const COLUNAS_NUMERO = new Set(["qtd_por_espaco", "vida", "acoes", "reacoes", "movimento"]);

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function carregarEnv() {
  try {
    for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const semHifen = (id) => String(id || "").replace(/-/g, "").toLowerCase();
const comHifen = (id) => {
  const h = semHifen(id);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function ehChaveServico(k) {
  if (!k) return false;
  if (k.startsWith("sb_secret_")) return true;
  const p = k.split(".");
  if (p.length !== 3) return false;
  try { return JSON.parse(Buffer.from(p[1], "base64url").toString()).role === "service_role"; } catch { return false; }
}

// Executa `fn` em `itens` com no máximo `n` chamadas simultâneas.
async function emParalelo(itens, n, fn) {
  const out = new Array(itens.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, itens.length) }, async () => {
    while (i < itens.length) { const k = i++; out[k] = await fn(itens[k], k); }
  }));
  return out;
}

// ---------------------------------------------------------------------------
// Notion
// ---------------------------------------------------------------------------
function criarNotion(token) {
  async function chamar(metodo, rota, corpo) {
    for (let tentativa = 1; ; tentativa++) {
      const r = await fetch("https://api.notion.com/v1" + rota, {
        method: metodo,
        headers: { Authorization: "Bearer " + token, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      if (r.status === 429 || (r.status >= 500 && tentativa < 5)) {
        await esperar((Number(r.headers.get("retry-after")) || tentativa) * 1000);
        continue;
      }
      const dados = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = dados.message || r.statusText;
        if (r.status === 401) throw new Error("NOTION_TOKEN inválido.");
        if (r.status === 404) throw new Error(`Notion: ${msg} — compartilhe a página "Databases" com a integração (••• → Conexões).`);
        throw new Error(`Notion ${r.status}: ${msg}`);
      }
      return dados;
    }
  }
  return {
    base: (id) => chamar("GET", `/databases/${id}`),
    async paginas(id) {
      const out = [];
      let cursor;
      do {
        const r = await chamar("POST", `/databases/${id}/query`, { page_size: 100, start_cursor: cursor });
        out.push(...r.results);
        cursor = r.has_more ? r.next_cursor : undefined;
      } while (cursor);
      return out;
    },
    async blocos(id) {
      const out = [];
      let cursor;
      do {
        const q = `?page_size=100${cursor ? "&start_cursor=" + cursor : ""}`;
        const r = await chamar("GET", `/blocks/${id}/children${q}`);
        out.push(...r.results);
        cursor = r.has_more ? r.next_cursor : undefined;
      } while (cursor);
      for (const b of out) {
        if (b.has_children && !["child_page", "child_database"].includes(b.type)) b.filhos = await this.blocos(b.id);
      }
      return out;
    },
  };
}

// Texto rico do Notion → Markdown
function textoMd(rich = []) {
  return rich.map((t) => {
    let s = t.plain_text || "";
    if (!s) return "";
    const a = t.annotations || {};
    if (a.code) s = "`" + s + "`";
    if (a.bold) s = `**${s}**`;
    if (a.italic) s = `*${s}*`;
    if (a.strikethrough) s = `~~${s}~~`;
    if (t.href && !t.href.startsWith("/")) s = `[${s}](${t.href})`;
    return s;
  }).join("");
}
const textoPuro = (rich = []) => rich.map((t) => t.plain_text || "").join("");

// Blocos do Notion → Markdown
function blocosMd(blocos, nivel = 0) {
  const pad = "  ".repeat(nivel);
  const linhas = [];
  let numero = 0;
  for (const b of blocos) {
    const d = b[b.type] || {};
    const txt = textoMd(d.rich_text);
    const filhos = b.filhos ? blocosMd(b.filhos, nivel + 1) : "";
    numero = b.type === "numbered_list_item" ? numero + 1 : 0;
    switch (b.type) {
      case "paragraph": linhas.push(pad + txt, ""); break;
      case "heading_1": linhas.push("# " + txt, ""); break;
      case "heading_2": linhas.push("## " + txt, ""); break;
      case "heading_3": linhas.push("### " + txt, ""); break;
      case "bulleted_list_item": linhas.push(pad + "- " + txt); break;
      case "numbered_list_item": linhas.push(pad + numero + ". " + txt); break;
      case "to_do": linhas.push(pad + (d.checked ? "- [x] " : "- [ ] ") + txt); break;
      case "quote": linhas.push("> " + txt, ""); break;
      case "callout": linhas.push("> " + (d.icon?.emoji ? d.icon.emoji + " " : "") + txt, ""); break;
      case "toggle": linhas.push(pad + "- " + txt); break;
      case "code": linhas.push("```" + (d.language || ""), textoPuro(d.rich_text), "```", ""); break;
      case "divider": linhas.push("---", ""); break;
      case "equation": linhas.push("$$" + d.expression + "$$", ""); break;
      case "image": {
        const url = d.type === "external" ? d.external?.url : d.file?.url;
        linhas.push(`![${textoPuro(d.caption)}](${url || ""})`, "");
        break;
      }
      case "child_page": linhas.push(`[${d.title}](notion:${semHifen(b.id)})`, ""); break;
      case "child_database": linhas.push(`[${d.title || "Base de dados"}](notion:${semHifen(b.id)})`, ""); break;
      case "link_to_page": linhas.push(`[página](notion:${semHifen(d.page_id || d.database_id)})`, ""); break;
      case "table": {
        const rows = (b.filhos || []).map((r) => (r.table_row?.cells || []).map((c) => textoMd(c).replace(/\|/g, "\\|")));
        if (rows.length) {
          linhas.push("| " + rows[0].join(" | ") + " |", "|" + rows[0].map(() => "---").join("|") + "|");
          rows.slice(1).forEach((r) => linhas.push("| " + r.join(" | ") + " |"));
          linhas.push("");
        }
        continue; // as linhas já foram usadas
      }
      default: if (txt) linhas.push(pad + txt, "");
    }
    if (filhos && b.type !== "table") linhas.push(filhos);
  }
  return linhas.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Valor de uma propriedade do Notion → valor do Supabase
function valorPropriedade(p) {
  switch (p.type) {
    case "title": return textoPuro(p.title).trim();
    case "rich_text": return textoPuro(p.rich_text).trim() || null;
    case "select": return p.select?.name ?? null;
    case "status": return p.status?.name ?? null;
    case "multi_select": return (p.multi_select || []).map((o) => o.name);
    case "number": return p.number;
    case "checkbox": return p.checkbox;
    case "url": return p.url;
    case "email": return p.email;
    case "phone_number": return p.phone_number;
    case "date": return p.date ? (p.date.end ? `${p.date.start}/${p.date.end}` : p.date.start) : null;
    case "relation": return (p.relation || []).map((r) => comHifen(r.id));
    case "people": return (p.people || []).map((u) => u.name || u.id);
    case "files": return (p.files || []).map((f) => f.name);
    case "formula": return p.formula?.[p.formula?.type] ?? null;
    case "rollup": return p.rollup?.[p.rollup?.type] ?? null;
    case "unique_id": return p.unique_id ? `${p.unique_id.prefix ? p.unique_id.prefix + "-" : ""}${p.unique_id.number}` : null;
    case "created_time": return p.created_time;
    case "last_edited_time": return p.last_edited_time;
    default: return null;
  }
}

function ajustarTipo(col, v) {
  if (COLUNAS_ARRAY.has(col)) {
    if (v == null || v === "") return [];
    return Array.isArray(v) ? v : [String(v)];
  }
  if (COLUNAS_NUMERO.has(col)) {
    if (Array.isArray(v)) v = v[0];
    if (v == null || v === "") return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  if (Array.isArray(v)) return v.length ? v.join(", ") : null;
  return v;
}

// ---------------------------------------------------------------------------
// Supabase (REST, com a chave service_role)
// ---------------------------------------------------------------------------
function criarSupabase(url, chave) {
  const base = url.replace(/\/$/, "") + "/rest/v1/";
  const headers = {
    apikey: chave, Authorization: "Bearer " + chave,
    "Accept-Profile": SCHEMA, "Content-Profile": SCHEMA, "Content-Type": "application/json",
  };
  async function chamar(metodo, rota, corpo, extra = {}) {
    const r = await fetch(base + rota, { method: metodo, headers: { ...headers, ...extra }, body: corpo ? JSON.stringify(corpo) : undefined });
    const texto = await r.text();
    if (!r.ok) {
      let msg = texto;
      try { msg = JSON.parse(texto).message || texto; } catch {}
      if (/schema must be one of|Invalid schema/i.test(msg)) msg += ` — exponha o schema "${SCHEMA}" em Project Settings → API → Exposed schemas.`;
      if (/does not exist|Could not find the table/i.test(msg)) msg += " — rode supabase/schema-aster.sql no SQL Editor.";
      throw new Error(`Supabase ${r.status} em ${metodo} ${rota.split("?")[0]}: ${msg}`);
    }
    return texto ? JSON.parse(texto) : null;
  }
  return {
    async existentes(tabela) {
      const out = new Map();
      for (let de = 0; ; de += 1000) {
        const linhas = await chamar("GET", `${tabela}?select=id,editado_em&order=id`, null, { Range: `${de}-${de + 999}` });
        linhas.forEach((l) => out.set(l.id, l.editado_em));
        if (linhas.length < 1000) break;
      }
      return out;
    },
    async gravar(tabela, linhas) {
      for (let i = 0; i < linhas.length; i += 100) {
        await chamar("POST", `${tabela}?on_conflict=id`, linhas.slice(i, i + 100), { Prefer: "resolution=merge-duplicates,return=minimal" });
      }
    },
    async apagar(tabela, ids) {
      for (let i = 0; i < ids.length; i += 100) {
        await chamar("DELETE", `${tabela}?id=in.(${ids.slice(i, i + 100).join(",")})`, null, { Prefer: "return=minimal" });
      }
    },
    registrar: (resumo) => chamar("POST", "sincronizacao", { concluido_em: new Date().toISOString(), resumo }, { Prefer: "return=minimal" }),
  };
}

// ---------------------------------------------------------------------------
// Sincronização
// ---------------------------------------------------------------------------
async function main() {
  carregarEnv();
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const full = args.includes("--full");
  const only = (args.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
  const tabelas = (only.length ? only : Object.keys(BASES)).filter((t) => t !== "conceitos");
  const comConceitos = !only.length || only.includes("conceitos");
  for (const t of tabelas) if (!BASES[t]) throw new Error(`Base desconhecida: ${t}. Opções: ${Object.keys(BASES).join(", ")}, conceitos`);

  const tokenNotion = process.env.NOTION_TOKEN;
  if (!tokenNotion) throw new Error("Falta NOTION_TOKEN no .env (token da integração do Notion).");
  const notion = criarNotion(tokenNotion);

  let supa = null;
  if (!dryRun) {
    const url = process.env.SUPABASE_URL;
    const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error("Falta SUPABASE_URL no .env.");
    if (!chave) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY no .env (chave service_role / secret). Use --dry-run para só testar a leitura do Notion.");
    if (!ehChaveServico(chave)) throw new Error("SUPABASE_SERVICE_ROLE_KEY não é uma chave service_role / secret. A chave anon não pode gravar.");
    supa = criarSupabase(url, chave);
  }

  // Mapa database_id → tabela, para validar relações.
  const tabelaDaBase = Object.fromEntries(Object.entries(BASES).map(([t, b]) => [semHifen(b.database), t]));
  const resumo = {};

  for (const tabela of tabelas) {
    const cfg = BASES[tabela];
    const inicio = Date.now();
    process.stdout.write(`\n▸ ${tabela}: lendo o Notion… `);

    // 1. Esquema da base: casa propriedades do Notion com colunas.
    const base = await notion.base(cfg.database);
    const mapa = new Map(Object.entries(cfg.props).map(([nome, alvo]) => [norm(nome), typeof alvo === "string" ? { col: alvo } : alvo]));
    const usar = {};          // nome da propriedade → { col, rel }
    const avisos = [];
    for (const [nome, def] of Object.entries(base.properties)) {
      const alvo = mapa.get(norm(nome));
      if (!alvo) { avisos.push(`propriedade sem coluna (vai para "extras"): "${nome}"`); continue; }
      if (def.type === "relation") {
        const destino = tabelaDaBase[semHifen(def.relation?.database_id)];
        if (destino !== alvo.rel) { avisos.push(`relação "${nome}" ignorada: aponta para uma base fora do Aster/inesperada`); continue; }
      }
      usar[nome] = alvo;
    }

    // 2. Páginas.
    const paginas = await notion.paginas(cfg.database);
    const existentes = supa ? await supa.existentes(tabela) : new Map();
    const mudaram = paginas.filter((p) => full || dryRun || !mesmoInstante(existentes.get(comHifen(p.id)), p.last_edited_time));
    process.stdout.write(`${paginas.length} páginas, ${mudaram.length} para atualizar. `);

    // 3. Corpo das páginas que mudaram.
    let feitas = 0;
    const linhas = await emParalelo(mudaram, 3, async (p) => {
      const blocos = await notion.blocos(p.id);
      if (++feitas % 25 === 0) process.stdout.write(`${feitas}… `);
      const linha = {
        id: comHifen(p.id), nome: "", conteudo: blocosMd(blocos), extras: {},
        icone: p.icon?.emoji || p.icon?.external?.url || p.icon?.file?.url || null,
        capa: p.cover?.external?.url || p.cover?.file?.url || null,
        notion_url: p.url, criado_em: p.created_time, editado_em: p.last_edited_time,
        sincronizado_em: new Date().toISOString(),
      };
      // Todas as linhas com as mesmas colunas (exigência do upsert em lote).
      for (const alvo of mapa.values()) if (!(alvo.col in linha)) linha[alvo.col] = COLUNAS_ARRAY.has(alvo.col) ? [] : null;
      for (const [nome, prop] of Object.entries(p.properties)) {
        const alvo = usar[nome];
        const v = valorPropriedade(prop);
        if (!alvo) { if (v != null && !(Array.isArray(v) && !v.length) && !mapa.has(norm(nome))) linha.extras[nome] = v; continue; }
        const conv = ajustarTipo(alvo.col, v);
        // Duas propriedades na mesma coluna (ex.: relação antiga + nova): junta sem repetir.
        if (Array.isArray(conv)) linha[alvo.col] = [...new Set([...(linha[alvo.col] || []), ...conv])];
        else if (conv != null) linha[alvo.col] = conv;
      }
      return linha;
    });

    // 4. Grava / apaga.
    const idsNotion = new Set(paginas.map((p) => comHifen(p.id)));
    const removidas = [...existentes.keys()].filter((id) => !idsNotion.has(id));
    if (dryRun) {
      const dir = path.join(ROOT, "data", "notion-export");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${tabela}.json`), JSON.stringify(linhas, null, 2));
    } else {
      await supa.gravar(tabela, linhas);
      if (removidas.length) await supa.apagar(tabela, removidas);
    }
    resumo[tabela] = { notion: paginas.length, atualizadas: linhas.length, removidas: removidas.length, avisos };
    console.log(`\n  ✔ ${linhas.length} gravadas, ${removidas.length} removidas (${((Date.now() - inicio) / 1000).toFixed(1)}s)`);
    avisos.forEach((a) => console.log("  ⚠ " + a));
  }

  if (comConceitos) resumo.conceitos = await exportarConceitos(notion);

  if (supa) await supa.registrar(resumo).catch((e) => console.warn("  (não foi possível registrar a sincronização: " + e.message + ")"));
  console.log(dryRun ? "\nTeste concluído — JSON salvo em data/notion-export/. Nada foi gravado no Supabase." : "\nSincronização concluída.");
}

// ---------------------------------------------------------------------------
// Sumário de conceitos (Sumário › Conceitos): não é uma base de dados, e sim uma
// página com subpáginas agrupadas por títulos. Vira public/js/data-conceitos.js,
// que o site lê na aba Ferramentas. (Mudou? faça commit do arquivo para publicar.)
// ---------------------------------------------------------------------------
const PAGINA_CONCEITOS = "6e5f5867e960823abf71010365d3e4a6";
const ARQUIVO_CONCEITOS = path.join(ROOT, "public", "js", "data-conceitos.js");

async function exportarConceitos(notion) {
  process.stdout.write("\n▸ conceitos: lendo o Notion… ");
  const raiz = await notion.blocos(PAGINA_CONCEITOS);
  const itens = [];
  let grupo = "";
  for (const b of raiz) {
    if (/^heading_[123]$/.test(b.type)) grupo = textoPuro(b[b.type].rich_text).trim();
    else if (b.type === "child_page") itens.push({ id: comHifen(b.id), nome: b.child_page.title.trim(), grupo });
  }
  await emParalelo(itens, 3, async (it) => { it.conteudo = blocosMd(await notion.blocos(it.id)); });
  const js = "// Gerado por scripts/sync-notion.js a partir de Notion › Sumário › Conceitos. Não edite à mão.\n" +
    `window.ASTER_CONCEITOS = ${JSON.stringify(itens, null, 2)};\n`;
  const antes = fs.existsSync(ARQUIVO_CONCEITOS) ? fs.readFileSync(ARQUIVO_CONCEITOS, "utf8") : "";
  const mudou = antes !== js;
  if (mudou) fs.writeFileSync(ARQUIVO_CONCEITOS, js);
  console.log(`${itens.length} conceitos.\n  ✔ ${mudou ? "public/js/data-conceitos.js atualizado — faça commit para publicar" : "sem mudanças"}`);
  return { conceitos: itens.length, arquivoAtualizado: mudou };
}

function mesmoInstante(a, b) { return !!a && !!b && new Date(a).getTime() === new Date(b).getTime(); }

if (require.main === module) {
  main().catch((e) => { console.error("\n✖ " + e.message); process.exit(1); });
}

module.exports = { blocosMd, valorPropriedade, ajustarTipo, norm, comHifen, BASES };
