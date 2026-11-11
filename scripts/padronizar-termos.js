#!/usr/bin/env node
// Padroniza os termos técnicos nos textos das cartas, raças e classes do Notion:
// "acerto crítico" → "Golpe Crítico", "fila de cooldown" → "Fila de Cooldown"…
// Os termos e as expressões ficam em scripts/glossario.js (TERMOS[].padronizar).
//
//   node scripts/padronizar-termos.js                 → só gera o relatório data/padronizacao.md (não muda nada)
//   node scripts/padronizar-termos.js --aplicar       → aplica as trocas no Notion
//   --sem="Vida,Energia"                              → deixa esses termos de fora (nome da entrada)
//   --only=cartas | racas | classes | condicoes | regras → só uma parte (regras = páginas do Sumário, scripts/glossario.js)
//   --restrito="Ligação=Cultista|Pacto*"              → esse termo só nas cartas com essa Origem (| = ou, * = começa com)
//
// Preserva negrito/itálico/cores/links: só o texto de cada trecho muda. Trechos de código,
// menções e equações não são tocados. Depois de aplicar, rode `npm run sync:notion -- --full`.
"use strict";
const fs = require("fs");
const path = require("path");
const { criarNotion, carregarEnv, BASES, emParalelo, valorPropriedade, norm } = require("./sync-notion.js");
const { TERMOS, nomeProprio, FONTES } = require("./glossario.js");

const ROOT = path.join(__dirname, "..");
const args = process.argv.slice(2);
const opcao = (nome) => { const a = args.find((x) => x.startsWith(`--${nome}=`)); return a ? a.split("=").slice(1).join("=") : null; };
const APLICAR = args.includes("--aplicar");
const SEM = new Set((opcao("sem") || "").split(",").map((s) => s.trim()).filter(Boolean));
const SO = opcao("only");
// Termo → origem exigida (só cartas com essa Origem).
const RESTRITO = new Map((opcao("restrito") || "").split(",").filter(Boolean).map((x) => x.split("=").map((y) => y.trim())));
const TABELAS = ["cartas", "racas", "classes", "condicoes", "regras"].filter((t) => !SO || t === SO);

// \b do JavaScript não entende acentos ("área", "única"): troca por limites Unicode.
const L = "[\\p{L}\\p{N}_]";
const LIMITE = `(?:(?<!${L})(?=${L})|(?<=${L})(?!${L}))`;
const REGRAS = TERMOS.filter((t) => t.padronizar && !SEM.has(t.entrada)).flatMap((t) =>
  t.padronizar.map((re) => ({ termo: t.entrada, renomear: t.renomear || {}, re: new RegExp(re.source.replace(/\\b/g, LIMITE), re.flags.replace("u", "") + "u") })));

// Aplica as regras num texto; devolve o texto novo e a lista de trocas.
function padronizar(texto, regras = REGRAS) {
  const trocas = [];
  let s = texto;
  for (const r of regras) {
    s = s.replace(r.re, (...m) => {
      const grupos = m.slice(1, -2).filter((g) => g !== undefined);
      const alvo = grupos[grupos.length - 1];
      const prefixo = grupos.length > 1 ? grupos.slice(0, -1).join("") : "";
      const novo = nomeProprio(alvo, r.renomear);
      if (novo === alvo) return m[0];
      trocas.push({ termo: r.termo, de: alvo, para: novo });
      return m[0].replace(prefixo + alvo, prefixo + novo);
    });
  }
  return { texto: s, trocas };
}

const COM_TEXTO = ["paragraph", "heading_1", "heading_2", "heading_3", "heading_4", "bulleted_list_item", "numbered_list_item", "to_do", "toggle", "quote", "callout"];

// Rich text do Notion → versão padronizada (formato aceito no PATCH) + trocas.
function padronizarRich(rich, regras) {
  const trocas = [];
  let mudou = false;
  const novo = rich.map((t) => {
    const a = t.annotations;
    if (t.type === "text" && !a?.code) {
      const r = padronizar(t.text.content, regras);
      if (r.trocas.length) { mudou = true; trocas.push(...r.trocas); }
      // Links internos do Notion vêm como "/id"; a API só aceita URL completa na escrita.
      const link = t.text.link?.url?.startsWith("/") ? { url: "https://www.notion.so" + t.text.link.url } : t.text.link;
      return { type: "text", text: { content: r.texto, link }, annotations: a };
    }
    if (t.type === "mention") return { type: "mention", mention: t.mention, annotations: a };
    if (t.type === "equation") return { type: "equation", equation: t.equation, annotations: a };
    return null;
  });
  if (novo.includes(null) || rich.some((t) => t.type === "mention" && t.mention?.type === "link_preview")) return { mudou: false, trocas: [] };
  return { mudou, trocas, novo };
}

function* percorrer(blocos) {
  for (const b of blocos) { yield b; if (b.filhos) yield* percorrer(b.filhos); }
}

const textoPuro = (rich) => rich.map((t) => t.plain_text || "").join("");
const trecho = (antes, depois) => {
  // Mostra só a região que mudou, com um pouco de contexto.
  let i = 0; while (i < antes.length && antes[i] === depois[i]) i++;
  let fa = antes.length, fd = depois.length;
  while (fa > i && fd > i && antes[fa - 1] === depois[fd - 1]) { fa--; fd--; }
  const ini = Math.max(0, i - 40);
  const corta = (s, fim) => (ini > 0 ? "…" : "") + s.slice(ini, Math.min(s.length, fim + 40)).replace(/\s+/g, " ") + (fim + 40 < s.length ? "…" : "");
  return [corta(antes, fa), corta(depois, fd)];
};

// Páginas de regras do Sumário: as páginas listadas em glossario.js e as subpáginas delas
// (menos nas fontes do tipo "pagina", como Origens e Raças e Classes, cujas subpáginas são raças, classes e cartas).
async function paginasDeRegras(notion) {
  const vistos = new Set(), saida = [];
  async function visitar(id, profundidade, comFilhas) {
    const chave = id.replace(/-/g, "");
    if (vistos.has(chave)) return;
    vistos.add(chave);
    const pagina = await notion.chamar("GET", `/pages/${id}`);
    saida.push(pagina);
    if (!comFilhas || profundidade >= 2) return;
    for (const b of percorrer(await notion.blocos(id))) {
      if (b.type === "child_page") await visitar(b.id, profundidade + 1, true);
    }
  }
  for (const f of FONTES) await visitar(f.id, 0, !f.entradas.every((e) => e.tipo === "pagina"));
  return saida;
}

async function main() {
  carregarEnv();
  if (!process.env.NOTION_TOKEN) throw new Error("Falta NOTION_TOKEN no .env.");
  const notion = criarNotion(process.env.NOTION_TOKEN);
  const relatorio = [];
  const titulos = new Map(); // id da carta → nome (a Origem das cartas é uma relação com outras cartas)
  const contagem = {};
  let blocosAlterados = 0, aplicados = 0;
  const falhas = [];

  for (const tabela of TABELAS) {
    process.stdout.write(`▸ ${tabela}: `);
    const paginas = tabela === "regras" ? await paginasDeRegras(notion) : await notion.paginas(BASES[tabela].database);
    if (tabela === "cartas") paginas.forEach((p) => titulos.set(p.id.replace(/-/g, ""), textoPuro(Object.values(p.properties).find((x) => x.type === "title")?.title || [])));
    process.stdout.write(`${paginas.length} páginas… `);
    let feitas = 0;
    await emParalelo(paginas, 3, async (p) => {
      const titulo = textoPuro(Object.values(p.properties || {}).find((x) => x.type === "title")?.title || []) || "(sem nome)";
      const blocos = await notion.blocos(p.id);
      if (++feitas % 50 === 0) process.stdout.write(`${feitas}… `);
      // Regras desta página: termos restritos só valem nas cartas da origem indicada.
      const origens = tabela !== "cartas" ? [] : Object.entries(p.properties).filter(([n]) => /^origem/i.test(n))
        .flatMap(([, v]) => [].concat(valorPropriedade(v) || [])).map((x) => norm(titulos.get(String(x).replace(/-/g, "")) || x));
      const casa = (padrao) => padrao.split("|").map((x) => norm(x)).some((x) => origens.some((o) => x.endsWith("*") ? o.startsWith(x.slice(0, -1)) : o === x));
      const regras = REGRAS.filter((r) => !RESTRITO.has(r.termo) || casa(RESTRITO.get(r.termo)));
      const mudancas = [];
      for (const b of percorrer(blocos)) {
        // Linhas de tabela: cada célula é um rich_text próprio.
        if (b.type === "table_row") {
          const celulas = b.table_row.cells.map((c) => padronizarRich(c, regras));
          if (!celulas.some((c) => c.mudou)) continue;
          const novo = celulas.map((c, i) => (c.mudou ? c.novo : padronizarRich(b.table_row.cells[i], []).novo || b.table_row.cells[i]));
          const antes = b.table_row.cells.map(textoPuro).join(" | ");
          const depois = novo.map((c) => c.map((t) => t.text?.content ?? t.plain_text ?? "").join("")).join(" | ");
          const trocas = celulas.flatMap((c) => c.trocas);
          mudancas.push({ bloco: b.id, tipo: "table_row", trecho: trecho(antes, depois), trocas, novo: null, celulas: novo });
          trocas.forEach((t) => { const k = `${t.termo}: "${t.de}" → "${t.para}"`; contagem[k] = (contagem[k] || 0) + 1; });
          continue;
        }
        if (!COM_TEXTO.includes(b.type)) continue;
        const rich = b[b.type]?.rich_text || [];
        const r = padronizarRich(rich, regras);
        if (!r.mudou) continue;
        const antes = textoPuro(rich);
        const depois = r.novo.map((t) => t.text?.content ?? t.plain_text ?? "").join("");
        // Texto de menções/equações não muda; reconstruímos o "depois" a partir do original.
        const depoisCompleto = rich.map((t, k) => (t.type === "text" ? r.novo[k].text.content : t.plain_text)).join("");
        mudancas.push({ bloco: b.id, tipo: b.type, trecho: trecho(antes, depoisCompleto || depois), trocas: r.trocas, novo: r.novo });
        r.trocas.forEach((t) => { const k = `${t.termo}: "${t.de}" → "${t.para}"`; contagem[k] = (contagem[k] || 0) + 1; });
      }
      if (!mudancas.length) return;
      relatorio.push({ tabela, titulo, url: p.url, mudancas });
      blocosAlterados += mudancas.length;
      if (APLICAR) {
        for (const m of mudancas) {
          const corpo = m.tipo === "table_row" ? { table_row: { cells: m.celulas } } : { [m.tipo]: { rich_text: m.novo } };
          try { await notion.chamar("PATCH", `/blocks/${m.bloco}`, corpo); aplicados++; }
          catch (e) { falhas.push(`${titulo}: ${e.message}`); }
        }
      }
    });
    console.log("ok");
  }

  // Relatório
  relatorio.sort((a, b) => a.tabela.localeCompare(b.tabela) || a.titulo.localeCompare(b.titulo));
  const linhas = [
    "# Padronização de termos — relatório",
    "",
    `Gerado em ${new Date().toLocaleString("pt-BR")}. ${APLICAR ? `**Aplicado no Notion** (${aplicados} blocos).` : "Nada foi alterado no Notion ainda."}`,
    "",
    `${relatorio.length} páginas, ${blocosAlterados} blocos com mudança.` + (SEM.size ? ` Termos deixados de fora: ${[...SEM].join(", ")}.` : "") +
      [...RESTRITO].map(([t, o]) => ` "${t}" só nas cartas de origem ${o}.`).join(""),
    "",
    "## Resumo por termo",
    "",
    "| Troca | Vezes |",
    "|---|---|",
    ...Object.entries(contagem).sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${k.replace(/\|/g, "\\|")} | ${n} |`),
    "",
    "## Por página",
    "",
  ];
  let tabelaAtual = "";
  for (const r of relatorio) {
    if (r.tabela !== tabelaAtual) { tabelaAtual = r.tabela; linhas.push(`### ${{ cartas: "Cartas", racas: "Raças", classes: "Classes", condicoes: "Condições", regras: "Páginas de regras (Sumário)" }[r.tabela]}`, ""); }
    linhas.push(`**[${r.titulo}](${r.url})**`, "");
    for (const m of r.mudancas) linhas.push(`- antes: ${m.trecho[0]}`, `  depois: ${m.trecho[1]}`);
    linhas.push("");
  }
  const arquivo = path.join(ROOT, "data", "padronizacao.md");
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  fs.writeFileSync(arquivo, linhas.join("\n"));
  console.log(`\n${relatorio.length} páginas, ${blocosAlterados} blocos com mudança. Relatório: data/padronizacao.md`);
  if (APLICAR) console.log(`✔ ${aplicados} blocos atualizados no Notion. Agora rode: npm run sync:notion -- --full`);
  falhas.forEach((f) => console.log("  ⚠ " + f));
}

if (require.main === module) main().catch((e) => { console.error("\n✖ " + e.message); process.exit(1); });

module.exports = { padronizar };
