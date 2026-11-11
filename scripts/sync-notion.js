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
  condicoes: {
    database: "381ba4323d844fe19ffa45c7a91d596c", // Databases › Condições › Lista de Condições
    props: {
      "Nome": "nome",
      "Nível": "nivel",
      "Descrição": "descricao",
      "Remoção": "remocao",
      "Máximo de acúmulos": "maximo_de_acumulos",
      "Subtipo": "subtipo",
    },
  },
};

// Colunas de array no Supabase (para converter select ↔ multi_select sem quebrar).
const COLUNAS_ARRAY = new Set([
  "tipo", "modo_de_uso", "cooldown", "custo_em_energia", "origem", "alcance", "palavra_chave",
  "atributos_iniciais", "origens_relacionadas", "atributos", "locais_relacionados", "organizacoes_relacionadas",
  "carta_relacionada", "habilidade_inata", "habilidade_caracteristica", "cartas", "cenarios_relacionados",
]);
const COLUNAS_NUMERO = new Set(["qtd_por_espaco", "vida", "acoes", "reacoes", "movimento", "maximo_de_acumulos"]);

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
    chamar,
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
// Marcadores de ritmo (cartas do Bardo e de Ritmo): no Notion são letras "o" coloridas.
// A cor vira o nome do marcador entre chaves — ex.: "o" roxo → "{Arrepiante}".
// Os nomes da legenda escritos na própria cor (ex.: "Vivaz" em amarelo) também viram marcador.
const RITMO_POR_COR = { yellow: "Vivaz", red: "Furioso", blue: "Melancólico", green: "Suave", purple: "Arrepiante", gray: "Potente" };
function marcadoresDeRitmo(texto, cor) {
  const nome = RITMO_POR_COR[cor];
  if (!nome) return null;
  const m = texto.match(/^(\s*)([oO]+)(\s*)$/);
  if (m) return m[1] + [...m[2]].map(() => `{${nome}}`).join("") + m[3];
  const n = texto.match(/^(\s*)(\S.*?)(\s*)$/);
  if (n && norm(n[2]) === norm(nome)) return `${n[1]}{${nome}}${n[3]}`;
  return null;
}

function textoMd(rich = [], corDoBloco = "") {
  return rich.map((t) => {
    let s = t.plain_text || "";
    if (!s) return "";
    const a = t.annotations || {};
    const cor = a.color && a.color !== "default" ? a.color : corDoBloco;
    const ritmo = marcadoresDeRitmo(s, cor);
    if (ritmo) return ritmo;
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
    const txt = textoMd(d.rich_text, d.color && d.color !== "default" ? d.color : "");
    const filhos = b.filhos ? blocosMd(b.filhos, nivel + 1) : "";
    numero = b.type === "numbered_list_item" ? numero + 1 : 0;
    switch (b.type) {
      case "paragraph": linhas.push(pad + txt, ""); break;
      case "heading_1": linhas.push("# " + txt, ""); break;
      case "heading_2": linhas.push("## " + txt, ""); break;
      case "heading_3": linhas.push("### " + txt, ""); break;
      case "heading_4": linhas.push("#### " + txt, ""); break;
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
  return linhas.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "").replace(/\s+$/, "");
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
    listar: (tabela, select) => chamar("GET", `${tabela}?select=${select}&limit=5000`),
    atualizar: (tabela, id, dados) => chamar("PATCH", `${tabela}?id=eq.${id}`, dados, { Prefer: "return=minimal" }),
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
  const tabelas = (only.length ? only : Object.keys(BASES)).filter((t) => !["conceitos", "lore"].includes(t));
  const comConceitos = !only.length || only.includes("conceitos");
  const comLore = !only.length || ["lore", "racas", "classes"].some((t) => only.includes(t));
  for (const t of tabelas) if (!BASES[t]) throw new Error(`Base desconhecida: ${t}. Opções: ${Object.keys(BASES).join(", ")}, lore, conceitos`);

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

  if (comLore) resumo.lore = await sincronizarLore(notion, supa);
  if (comConceitos) resumo.conceitos = await exportarGlossario(notion);

  if (supa) await supa.registrar(resumo).catch((e) => console.warn("  (não foi possível registrar a sincronização: " + e.message + ")"));
  console.log(dryRun ? "\nTeste concluído — JSON salvo em data/notion-export/. Nada foi gravado no Supabase." : "\nSincronização concluída.");
}

// ---------------------------------------------------------------------------
// Lore de raças e classes (Sumário › Raças e Classes › Raças / Classes).
// Cada raça/classe tem uma página no livro com a seção "Lore" e subpáginas
// (ex.: Ritual de Descensão). Isso vai para a coluna `lore` de racas/classes.
// Ignorados: a lista de cartas embutida, os links "Info" do workspace antigo e
// subpáginas que são cartas (já estão em aster.cartas).
// ---------------------------------------------------------------------------
const PAGINAS_LORE = { racas: "f2ff5867e9608335ad29010acf92f6b8", classes: "094f5867e96082b9bf0c811f547ba67d" };

async function loreDaPagina(notion, pageId, cartas, { semSubpaginasDe = [] } = {}) {
  const blocos = await notion.blocos(pageId);
  const partes = [];
  let secao = "", buffer = [];
  const descarrega = () => { if (buffer.length) { partes.push(blocosMd(buffer)); buffer = []; } };
  const subpaginas = [];
  for (const b of blocos) {
    if (b.type === "heading_1") { descarrega(); secao = norm(textoPuro(b.heading_1.rich_text)); continue; }
    if (b.type === "child_page") {
      const titulo = b.child_page.title.trim();
      if (cartas.has(norm(titulo)) || semSubpaginasDe.some((s) => secao.startsWith(s))) { subpaginas.push({ id: b.id, titulo }); continue; }
      descarrega();
      const corpo = await subpaginaMd(notion, b.id, titulo, 3, cartas);
      if (corpo) partes.push(corpo);
      continue;
    }
    if (secao === "lore") buffer.push(b);
  }
  descarrega();
  return { texto: partes.filter(Boolean).join("\n\n").trim(), subpaginas };
}

// Subpágina → "### Título" + texto, abrindo as subpáginas dela (até ####). Sem texto → "".
async function subpaginaMd(notion, id, titulo, nivel, cartas) {
  const blocos = await notion.blocos(id);
  const filhas = blocos.filter((b) => b.type === "child_page" && !cartas.has(norm(b.child_page.title)) && nivel < 4);
  const proprio = blocosMd(blocos.filter((b) => b.type !== "child_page"))
    .replace(/^\[[^\]]*\]\(notion:[^)]*\)\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
  const sub = [];
  for (const f of filhas) {
    const md = await subpaginaMd(notion, f.id, f.child_page.title.trim(), nivel + 1, cartas);
    if (md) sub.push(md);
  }
  if (!proprio && !sub.length) return "";
  return [`${"#".repeat(nivel)} ${titulo}`, proprio, ...sub].filter(Boolean).join("\n\n");
}

async function sincronizarLore(notion, supa) {
  process.stdout.write("\n▸ lore de raças e classes: lendo o Notion… ");
  const cartas = new Set(supa ? (await supa.listar("cartas", "nome")).map((c) => norm(c.nome)) : []);
  const resultado = {};
  for (const [tabela, lista] of Object.entries(PAGINAS_LORE)) {
    const paginas = (await notion.blocos(lista)).filter((b) => b.type === "child_page").map((b) => ({ id: b.id, nome: b.child_page.title.trim() }));
    const lores = []; // { nome, texto }
    await emParalelo(paginas, 3, async (p) => {
      // Aventureiro: as profissões (subpáginas) viram a lore de cada "Aventureiro: X".
      const { texto, subpaginas } = await loreDaPagina(notion, p.id, cartas, { semSubpaginasDe: ["profissoes"] });
      lores.push({ nome: p.nome, texto });
      for (const sp of subpaginas.filter((s) => !cartas.has(norm(s.titulo)))) {
        const sub = await loreDaPagina(notion, sp.id, cartas);
        lores.push({ nome: `${p.nome}: ${sp.titulo}`, texto: [texto, sub.texto && `### ${sp.titulo}\n\n${sub.texto}`].filter(Boolean).join("\n\n") });
      }
    });
    if (!supa) { resultado[tabela] = { paginas: lores.length }; continue; }
    const linhas = await supa.listar(tabela, "id,nome");
    // Casa pelo nome: igual, "Grupo: Nome" ou variação ("Infernal Completo" → "Infernal").
    const achar = (nome) => {
      const n = norm(nome);
      return lores.find((l) => norm(l.nome) === n)
        || lores.find((l) => n.endsWith(": " + norm(l.nome.split(":").pop())) && l.nome.includes(":"))
        || lores.find((l) => n.startsWith(norm(l.nome) + " "));
    };
    let gravadas = 0;
    const semLore = [];
    for (const l of linhas) {
      const achado = achar(l.nome);
      if (!achado) { semLore.push(l.nome); continue; }
      try { await supa.atualizar(tabela, l.id, { lore: achado.texto }); gravadas++; }
      catch (e) {
        if (/lore/.test(e.message)) throw new Error("A coluna `lore` não existe — rode supabase/migracoes/002-lore-racas-classes.sql no SQL Editor.");
        throw e;
      }
    }
    resultado[tabela] = { paginas: lores.length, gravadas, semLore };
    process.stdout.write(`${tabela}: ${gravadas}/${linhas.length} `);
    if (semLore.length) process.stdout.write(`(sem página: ${semLore.join(", ")}) `);
  }
  console.log("\n  ✔ lore sincronizada");
  return resultado;
}

// ---------------------------------------------------------------------------
// Sumário do site (glossário): Conceitos + explicações de regras do livro
// (combate, entreato, cartas, modos de uso, cooldown, alcance, raridade, origens,
// inventário, itens, condições…). As páginas e o recorte de cada uma estão em
// scripts/glossario.js. Vira public/js/data-conceitos.js, junto com a lista de
// termos que o site transforma em link. (Mudou? faça commit do arquivo para publicar.)
// ---------------------------------------------------------------------------
const ARQUIVO_CONCEITOS = path.join(ROOT, "public", "js", "data-conceitos.js");
const { FONTES: FONTES_GLOSSARIO, TERMOS } = require("./glossario.js");

const nivelTitulo = (b) => { const m = /^heading_(\d)$/.exec(b.type); return m ? +m[1] : 0; };
const tituloDe = (b) => textoPuro(b[b.type]?.rich_text).replace(/\*/g, "").trim();
const slugDe = (nome) => norm(nome).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const limparMd = (md) => md.replace(/^\[[^\]]*\]\(notion:[^)]*\)\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
const RE_LISTA = /^\s*([^:\n]{2,40}):\s*([\s\S]+)$/;

async function entradasDaFonte(notion, fonte) {
  const blocos = await notion.blocos(fonte.id);
  const saida = [];
  const add = (nome, md, grupo) => { const conteudo = limparMd(md); if (nome && conteudo) saida.push({ nome: nome.trim(), conteudo, grupo: grupo || fonte.grupo || "" }); };
  for (const spec of fonte.entradas) {
    if (spec.tipo === "pagina") {
      add(spec.nome, blocosMd(blocos.filter((b) => b.type !== "child_page" && b.type !== "child_database")));
    } else if (spec.tipo === "intro") {
      const i = blocos.findIndex((b) => nivelTitulo(b));
      add(spec.nome, blocosMd(i < 0 ? blocos : blocos.slice(0, i)));
    } else if (spec.tipo === "subpaginas") {
      let grupo = "";
      const subs = [];
      for (const b of blocos) {
        if (nivelTitulo(b)) grupo = tituloDe(b);
        else if (b.type === "child_page") subs.push({ id: b.id, nome: b.child_page.title.trim(), grupo });
      }
      await emParalelo(subs, 3, async (s) => { s.md = blocosMd(await notion.blocos(s.id)); });
      subs.forEach((s) => add(s.nome, s.md, s.grupo));
    } else if (spec.tipo === "secoes") {
      // Recorte: só dentro do título `dentroDe` (até o próximo título de nível igual ou maior).
      let lista = blocos;
      if (spec.dentroDe) {
        const i = blocos.findIndex((b) => nivelTitulo(b) && norm(tituloDe(b)) === norm(spec.dentroDe));
        if (i < 0) { console.log(`\n  ⚠ título "${spec.dentroDe}" não encontrado`); continue; }
        const n = nivelTitulo(blocos[i]);
        const fim = blocos.findIndex((b, k) => k > i && nivelTitulo(b) && nivelTitulo(b) <= n);
        lista = blocos.slice(i + 1, fim < 0 ? undefined : fim);
      }
      for (let i = 0; i < lista.length; i++) {
        const n = nivelTitulo(lista[i]);
        if (!spec.niveis.includes(n)) continue;
        const nome = tituloDe(lista[i]);
        if (spec.apenas && !spec.apenas.some((a) => norm(a) === norm(nome))) continue;
        // soIntro: só o texto até o próximo título de qualquer nível.
        const fim = lista.findIndex((b, k) => k > i && nivelTitulo(b) && (spec.soIntro || nivelTitulo(b) <= n));
        const corpo = lista.slice(i + 1, fim < 0 ? undefined : fim);
        if (spec.soIntro) { add(spec.nome || nome, blocosMd(corpo)); continue; }
        // Subpáginas dentro da seção entram com o próprio texto.
        const partes = [blocosMd(corpo.filter((b) => b.type !== "child_page"))];
        for (const b of corpo.filter((x) => x.type === "child_page")) partes.push(`#### ${b.child_page.title.trim()}\n\n` + blocosMd(await notion.blocos(b.id)));
        add(nome, partes.join("\n\n"));
      }
    } else if (spec.tipo === "lista") {
      for (const b of blocos) {
        if (!["paragraph", "bulleted_list_item", "numbered_list_item"].includes(b.type)) continue;
        const m = RE_LISTA.exec(textoPuro(b[b.type].rich_text));
        if (!m) continue;
        const nome = m[1].replace(/\*/g, "").trim();
        const extra = b.filhos ? "\n\n" + blocosMd(b.filhos) : "";
        add(nome, m[2].trim() + extra);
      }
    }
  }
  return saida;
}

// Lista de Condições (base do Notion): cada condição vira uma entrada do sumário, com os dados
// da ficha dela em `condicao` (nível, descrição, remoção, máximo de acúmulos, subtipo, ícone).
// O site usa isso no catálogo de condições e nos links das cartas ("Atordoado" → Atordoamento).
async function entradasDeCondicoes(notion) {
  const paginas = await notion.paginas(BASES.condicoes.database);
  const prop = (p, nome) => {
    const k = Object.keys(p.properties).find((n) => norm(n) === norm(nome));
    const v = k ? valorPropriedade(p.properties[k]) : null;
    return Array.isArray(v) ? v.join(", ") || null : v;
  };
  const out = [];
  await emParalelo(paginas, 3, async (p) => {
    const nome = String(prop(p, "Nome") || "").trim();
    if (!nome) return;
    const nivel = prop(p, "Nível") || "";
    const descricao = prop(p, "Descrição") || "";
    out.push({
      nome,
      conteudo: limparMd(blocosMd(await notion.blocos(p.id))) || descricao,
      grupo: nivel === "Normal" ? "Normais" : nivel === "Complexa" ? "Complexas" : "",
      condicao: {
        nivel, descricao, remocao: prop(p, "Remoção") || "",
        maximo: prop(p, "Máximo de acúmulos"), subtipo: prop(p, "Subtipo") || "",
        icone: p.icon?.emoji || null,
      },
    });
  });
  return out.sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
}

async function exportarGlossario(notion) {
  process.stdout.write("\n▸ sumário: lendo o Notion… ");
  const entradas = [];
  for (const fonte of FONTES_GLOSSARIO) {
    try {
      const lidas = await entradasDaFonte(notion, fonte);
      lidas.forEach((e) => entradas.push({ ...e, categoria: fonte.categoria, fonte: comHifen(fonte.id) }));
      process.stdout.write(`${fonte.categoria}${fonte.grupo ? "/" + fonte.grupo : ""} ${lidas.length} · `);
    } catch (e) {
      console.log(`\n  ⚠ página ${fonte.id} (${fonte.categoria}): ${e.message}`);
    }
  }
  try {
    const condicoes = await entradasDeCondicoes(notion);
    condicoes.forEach((e) => entradas.push({ ...e, categoria: "Condições", fonte: comHifen(BASES.condicoes.database) }));
    process.stdout.write(`Lista de Condições ${condicoes.length} · `);
  } catch (e) {
    console.log(`\n  ⚠ Lista de Condições: ${e.message}`);
  }
  const r = montarConceitos(entradas);
  const antes = fs.existsSync(ARQUIVO_CONCEITOS) ? fs.readFileSync(ARQUIVO_CONCEITOS, "utf8") : "";
  const mudou = antes !== r.js;
  if (mudou) fs.writeFileSync(ARQUIVO_CONCEITOS, r.js);
  console.log(`\n  ✔ ${r.lista.length} entradas, ${r.termos} formas de termo. ${mudou ? "public/js/data-conceitos.js atualizado — faça commit para publicar" : "sem mudanças"}`);
  if (r.semEntrada.length) console.log("  ⚠ termos sem entrada: " + r.semEntrada.join(", "));
  return { entradas: r.lista.length, termos: r.termos, semEntrada: r.semEntrada, arquivoAtualizado: mudou };
}

// Entradas do sumário → conteúdo de public/js/data-conceitos.js (sem acessar o Notion).
function montarConceitos(entradas) {
  // Nomes repetidos (ex.: "Bloqueio Perene" em Conceitos e em Tipos de Defesa) ganham a categoria.
  // As condições têm prioridade: "Morrendo" é a condição; o modo de uso vira "Morrendo (Cartas)".
  const contagem = {};
  entradas.forEach((e) => { contagem[norm(e.nome)] = (contagem[norm(e.nome)] || 0) + 1; });
  const vistos = new Set();
  for (const e of [...entradas].sort((a, b) => (b.condicao ? 1 : 0) - (a.condicao ? 1 : 0))) {
    if (contagem[norm(e.nome)] > 1 && vistos.has(norm(e.nome))) e.nome = `${e.nome} (${e.categoria})`;
    vistos.add(norm(e.nome.replace(/ \([^)]*\)$/, "")));
    e.slug = slugDe(e.nome);
  }
  // Termos → slug da entrada (ou da alternativa, ex.: condição sem página própria → "Condições").
  const porNome = new Map(entradas.map((e) => [norm(e.nome), e]));
  const termos = [];
  const semEntrada = [];
  for (const t of TERMOS) {
    const e = porNome.get(norm(t.entrada)) || (t.alternativa && porNome.get(norm(t.alternativa)));
    if (!e) { semEntrada.push(t.entrada); continue; }
    for (const forma of t.formas) termos.push({ forma, slug: e.slug, ...(t.contexto ? { contexto: true } : {}), ...(t.evitar ? { evitar: t.evitar } : {}) });
  }
  const unicos = [...new Map(termos.map((t) => [t.forma, t])).values()].sort((a, b) => b.forma.length - a.forma.length);
  const lista = entradas.map(({ slug, nome, categoria, grupo, conteudo, fonte, condicao }) =>
    ({ slug, nome, categoria, grupo, conteudo, fonte, ...(condicao ? { condicao } : {}) }));
  const js = "// Gerado por scripts/sync-notion.js a partir das páginas de regras do Notion (ver scripts/glossario.js). Não edite à mão.\n" +
    `window.ASTER_CONCEITOS = ${JSON.stringify(lista, null, 2)};\n` +
    `window.ASTER_TERMOS = ${JSON.stringify(unicos)};\n`;
  return { js, lista, termos: unicos.length, semEntrada: [...new Set(semEntrada)] };
}

function mesmoInstante(a, b) { return !!a && !!b && new Date(a).getTime() === new Date(b).getTime(); }

if (require.main === module) {
  main().catch((e) => { console.error("\n✖ " + e.message); process.exit(1); });
}

module.exports = { emParalelo, exportarGlossario, montarConceitos, entradasDeCondicoes, textoMd, blocosMd, valorPropriedade, ajustarTipo, norm, comHifen, BASES, sincronizarLore, criarNotion, carregarEnv };
