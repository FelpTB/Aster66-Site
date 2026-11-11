// Cabeçalho, rodapé e utilidades compartilhadas.
window.ASTER_CONFIG = {
  email: "rpgaster66@gmail.com",
};

const LOGO_SVG = `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <circle cx="20" cy="20" r="18.5" fill="none" stroke="#E5A93C" stroke-width="1"/>
  <circle cx="20" cy="20" r="11" fill="#08080A" stroke="#E5A93C" stroke-width="1.2"/>
  <circle cx="24" cy="17" r="7.5" fill="#FFFFFF"/>
  <circle cx="26.6" cy="15.6" r="6.6" fill="#08080A"/>
  <path d="M33 6 l1.2 3.3 3.3 1.2 -3.3 1.2 -1.2 3.3 -1.2 -3.3 -3.3 -1.2 3.3 -1.2z" fill="#C91D2E"/>
</svg>`;

// Documentos publicados (cada um tem a própria página: documento.html?id=…).
window.ASTER_DOCUMENTOS = [
  { id: "ficha", titulo: "Ficha editável", tipo: "PDF", status: "disponivel", arquivo: "docs/ficha-aster66.pdf",
    resumo: "Modelo atual da ficha de personagem, frente e verso, preenchível em qualquer leitor de PDF.",
    descricao: "A ficha reúne tudo o que um personagem precisa na mesa. O montador de fichas do site exporta para este mesmo PDF, então dá para começar no navegador e terminar no papel.",
    conteudo: ["Atributos, Vida, Energia e Cicatrizes", "Defesas, Deslocamento, Ações e Reações", "Dados do personagem", "Inventário por tipo de espaço", "Origens e cartas"],
    links: [["ficha.html", "Abrir o montador de fichas"]] },
  { id: "livro", titulo: "Livro de regras", tipo: "PDF", status: "em-breve",
    resumo: "O livro completo do sistema: conceitos, criação de personagem, combate, entreato, condições e listas.",
    descricao: "Enquanto o livro não sai, todas as regras já publicadas estão no Sumário do site, com busca e links entre os termos.",
    conteudo: ["Conceitos e termos básicos", "Criação de personagem", "Combate e Entreato", "Cartas, Modos de Uso e Cooldown", "Inventário, Itens e Condições"],
    links: [["sumario.html", "Abrir o Sumário"]] },
  { id: "cartas", titulo: "Catálogo de cartas", tipo: "WEB · PDF", status: "parcial",
    resumo: "Todas as cartas do sistema, com custo, efeito, origens e raridade.",
    descricao: "A versão web, com busca e filtros, já está disponível nos Catálogos. A versão em PDF para consulta na mesa está a caminho.",
    conteudo: ["Custo em Energia, Tipo, Modo de Uso, Cooldown e Alcance", "Origens e Raridade", "Palavras-chave e marcadores de ritmo"],
    links: [["catalogos.html#cartas", "Abrir o catálogo de cartas"]] },
  { id: "guia", titulo: "Guia de criação de personagem", tipo: "PDF", status: "em-breve",
    resumo: "Passo a passo para preencher cada seção da ficha, do conceito até as primeiras cartas.",
    descricao: "Um roteiro para quem está começando: escolher raça e classe, distribuir atributos, entender as origens e montar o primeiro baralho.",
    conteudo: ["Conceito do personagem", "Raça, classe e atributos", "Origens e primeiras cartas", "Inventário inicial"],
    links: [["ficha.html", "Experimentar no montador"]] },
];

// Menu principal. Grupos com `itens` viram dropdown; `paginas` diz quais páginas acendem o grupo.
const NAV = [
  { rotulo: "Início", href: "index.html" },
  { rotulo: "Mundo de Aster", paginas: ["mundo.html", "ceu.html", "personagens.html", "explorar.html"], itens: [
    ["mundo.html", "Linha do tempo e mapa", "Maresia, panteão, países, raças e classes"],
    ["ceu.html", "Geologia e o Céu de Aster", "A magia, o planeta e os astros"],
    ["personagens.html", "Personagens", "Catálogo das figuras de Aster"],
  ] },
  { rotulo: "Ferramentas", paginas: ["ferramentas.html", "ficha.html", "catalogos.html", "sumario.html"], itens: [
    ["ficha.html", "Montador de fichas", "Monte a ficha e exporte para PDF"],
    ["catalogos.html", "Catálogos", "Raças, classes, cartas, bestiário, itens e locais"],
    ["sumario.html", "Sumário", "Regras, termos e condições"],
  ] },
  { rotulo: "Documentos", paginas: ["documentos.html", "documento.html"], itens: [
    ["documentos.html", "Todos os documentos", "Materiais para jogar"],
    ...window.ASTER_DOCUMENTOS.map((d) => [`documento.html?id=${d.id}`, d.titulo, d.status === "em-breve" ? "Em breve" : d.tipo]),
  ] },
  { rotulo: "Comunidade", paginas: ["comunidade.html", "apoie.html", "criacoes.html"], itens: [
    ["comunidade.html", "Comentários e contato", "Fale com a equipe e com outros jogadores"],
    ["apoie.html", "Apoie o projeto", "Ajude o Aster66 a crescer"],
    ["criacoes.html", "Criações da comunidade", "Fichas, cartas e campanhas dos jogadores"],
  ] },
];

(function mountChrome() {
  const here = location.pathname.split("/").pop() || "index.html";
  const page = here.includes(".") ? here : here + ".html";
  const docAtual = new URLSearchParams(location.search).get("id");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ehAtual = (href) => {
    const arq = href.split(/[?#]/)[0];
    if (arq !== page) return false;
    return page !== "documento.html" || href.endsWith("id=" + docAtual);
  };

  const grupo = (g, i) => {
    if (!g.itens) return `<a class="nav-top" href="${g.href}"${g.href === page ? ' aria-current="page"' : ""}>${g.rotulo}</a>`;
    const ativo = g.paginas.includes(page);
    return `
      <div class="nav-grupo${ativo ? " ativo" : ""}">
        <button class="nav-top" type="button" aria-expanded="false" aria-controls="menu-${i}">
          ${g.rotulo}<svg class="seta" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
        </button>
        <div class="nav-menu" id="menu-${i}">
          ${g.itens.map(([href, rotulo, sub]) => `
            <a href="${href}"${ehAtual(href) ? ' aria-current="page"' : ""}><b>${esc(rotulo)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}</a>`).join("")}
        </div>
      </div>`;
  };

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a class="skip" href="#conteudo">Pular para o conteúdo</a>
    <div class="wrap">
      <div class="navbar">
        <a class="brand" href="index.html" aria-label="Aster66 — início">${LOGO_SVG}<span class="brand-name">Aster<b>66</b></span></a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="nav-principal">Menu</button>
        <nav class="nav" id="nav-principal" aria-label="Principal">
          ${NAV.map(grupo).join("")}
        </nav>
        <div class="nav-end">
          <div class="nav-auth" id="nav-auth"></div>
          <a class="btn btn-primary btn-small nav-cta" href="ficha.html">Criar personagem</a>
        </div>
      </div>
    </div>`;
  document.body.prepend(header);

  // Dropdowns: o clique abre e fecha (no computador também abrem ao passar o mouse, pelo CSS).
  const grupos = [...header.querySelectorAll(".nav-grupo")];
  const fechar = (exceto) => grupos.forEach((g) => {
    if (g === exceto) return;
    g.classList.remove("aberto");
    g.querySelector(".nav-top").setAttribute("aria-expanded", "false");
  });
  grupos.forEach((g) => {
    const btn = g.querySelector(".nav-top");
    btn.addEventListener("click", () => {
      const abrir = !g.classList.contains("aberto");
      fechar(g);
      g.classList.toggle("aberto", abrir);
      btn.setAttribute("aria-expanded", String(abrir));
    });
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".nav-grupo")) fechar(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fechar(); });

  const toggle = header.querySelector(".nav-toggle");
  const nav = header.querySelector(".nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  const footer = document.createElement("footer");
  footer.innerHTML = `
    <div class="palette-strip" aria-hidden="true">
      <span style="background:#08080A"></span><span style="background:#FFFFFF"></span>
      <span style="background:#C91D2E"></span><span style="background:#E5A93C"></span>
    </div>
    <div class="site-footer">
      <div class="wrap">
        <span>Aster66 — RPG de cartas no mundo de Aster.</span>
        <nav class="footer-links" aria-label="Rodapé"><a href="noticias.html">Notícias</a><a href="documentos.html">Documentos</a><a href="comunidade.html">Contato</a><a href="apoie.html">Apoie</a></nav>
        <span><a href="mailto:${window.ASTER_CONFIG.email}">${window.ASTER_CONFIG.email}</a></span>
      </div>
    </div>`;
  document.body.append(footer);

  document.querySelectorAll("[data-email]").forEach((el) => {
    el.textContent = window.ASTER_CONFIG.email;
    if (el.tagName === "A") el.href = `mailto:${window.ASTER_CONFIG.email}`;
  });
})();

window.escapeHTML = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

window.formatDate = (iso) =>
  new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

// Marcadores de ritmo: no banco aparecem como {Vivaz}, {Furioso}… (no Notion eram "o" coloridos).
window.RITMOS = {
  "Vivaz": "#f2c94c", "Furioso": "#e5484d", "Melancólico": "#4f8fe8",
  "Suave": "#4cbf7a", "Arrepiante": "#a970e8", "Potente": "#a3a3b2",
};
const RE_RITMO = new RegExp("\\{(" + Object.keys(window.RITMOS).join("|") + ")\\}", "g");
// Recebe texto JÁ escapado e troca {Marcador} por uma etiqueta colorida.
window.marcarRitmos = (htmlEscapado) => String(htmlEscapado).replace(RE_RITMO, (_, nome) =>
  `<span class="ritmo" style="--ritmo:${window.RITMOS[nome]}" title="Marcador de ritmo: ${nome}">${nome}</span>`);
window.ritmosDoTexto = (texto) => [...new Set([...String(texto || "").matchAll(RE_RITMO)].map((m) => m[1]))];

// Termos técnicos → link para a explicação no sumário (Ferramentas › Sumário).
// A lista vem de js/data-conceitos.js (window.ASTER_TERMOS), gerada pelo sync a partir do Notion.
// Só formas com maiúscula viram link (os termos são nomes próprios: "Golpe Crítico", "Fila de Cooldown").
// Atributos ("Corpo", "Mente"…) só em contexto de regra: "Teste de Corpo", "+1 de Mente".
// (Calculado na 1ª utilização: data-conceitos.js pode carregar depois deste arquivo.)
let RE_TERMOS, SLUG_DO_TERMO;
function prepararTermos() {
  if (RE_TERMOS !== undefined) return RE_TERMOS;
  const termos = window.ASTER_TERMOS || [];
  if (!termos.length) return null; // ainda não carregou: tenta de novo na próxima chamada
  SLUG_DO_TERMO = new Map(termos.map((t) => [t.forma, t.slug]));
  // `evitar`: o que não pode vir logo depois da forma (ex.: "Carga Inicial" do kit médico não é a condição Carga).
  const re = (t) => t.forma.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + (t.evitar ? `(?!${t.evitar})` : "");
  const livres = termos.filter((t) => !t.contexto).map(re);
  const ctx = termos.filter((t) => t.contexto).map(re);
  const L = "[\\p{L}\\p{N}]";
  const contexto = "(?<=(?:[Tt]estes? de |[Aa]tributos? (?:de )?|[Mm]odificador(?:es)? de |\\d (?:pontos? )?(?:de )?|\\d de ))";
  const partes = [`(${livres.join("|")})`];
  if (ctx.length) partes.push(`${contexto}(${ctx.join("|")})`);
  return (RE_TERMOS = new RegExp(`(?<!${L})(?:${partes.join("|")})(?!${L})`, "gu"));
}
// Recebe texto JÁ escapado. `vistos` (Set de slugs) faz só a 1ª menção de cada termo virar link.
window.linkarTermos = (htmlEscapado, { exceto = "", vistos = new Set() } = {}) => {
  const re = prepararTermos();
  if (!re) return htmlEscapado;
  return String(htmlEscapado).replace(re, (m, livre, ctx) => {
    const forma = livre || ctx;
    const slug = SLUG_DO_TERMO.get(forma);
    if (!slug || slug === exceto || vistos.has(slug)) return m;
    vistos.add(slug);
    return `<a class="termo" href="sumario.html#conceito-${slug}" data-termo="${slug}">${m}</a>`;
  });
};

// Markdown do Notion (coluna `conteudo` do Supabase) → HTML seguro.
// Suporta títulos, parágrafos, listas, citações, tabelas simples, negrito, itálico e código.
// `termos: true` liga os termos técnicos ao sumário (`termoAtual` = slug que não vira link).
window.mdHTML = (md, { semLinkOriginal = true, termos = false, termoAtual = "" } = {}) => {
  const esc = window.escapeHTML;
  const vistos = new Set();
  const comTermos = (s) => termos ? window.linkarTermos(s, { exceto: termoAtual, vistos }) : s;
  const inline = (s) => window.marcarRitmos(comTermos(esc(s)))
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  const linhas = String(md || "").replace(/\r/g, "").split("\n");
  const out = [];
  let lista = null, para = [];
  const fechaPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join("<br>")}</p>`); para = []; } };
  const fechaLista = () => { if (lista) { out.push(`</${lista}>`); lista = null; } };
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    if (semLinkOriginal && /^Página original:/i.test(l.trim())) continue;
    let m;
    if (!l.trim()) { fechaPara(); fechaLista(); continue; }
    if ((m = l.match(/^(#{1,6})\s+(.*)$/))) { fechaPara(); fechaLista(); const n = Math.min(m[1].length + 2, 6); out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
    if (/^---+$/.test(l.trim())) { fechaPara(); fechaLista(); out.push("<hr>"); continue; }
    if ((m = l.match(/^>\s?(.*)$/))) { fechaPara(); fechaLista(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    if ((m = l.match(/^\s*(?:[-*]|\d+\.)\s+(?:\[[ x]\]\s+)?(.*)$/))) {
      fechaPara();
      const tipo = /^\s*\d+\./.test(l) ? "ol" : "ul";
      if (lista !== tipo) { fechaLista(); out.push(`<${tipo}>`); lista = tipo; }
      out.push(`<li>${inline(m[1])}</li>`); continue;
    }
    if (/^\|.*\|$/.test(l.trim())) {
      fechaPara(); fechaLista();
      const rows = [];
      while (i < linhas.length && /^\|.*\|$/.test(linhas[i].trim())) { rows.push(linhas[i].trim()); i++; }
      i--;
      const cells = (r) => r.slice(1, -1).split(/(?<!\\)\|/).map((c) => inline(c.trim().replace(/\\\|/g, "|")));
      const corpo = rows.filter((r) => !/^\|[-\s|]+\|$/.test(r));
      out.push(`<div class="md-table"><table>${corpo.map((r, k) => `<tr>${cells(r).map((c) => k ? `<td>${c}</td>` : `<th>${c}</th>`).join("")}</tr>`).join("")}</table></div>`);
      continue;
    }
    if (/^!\[/.test(l.trim())) continue; // imagens do Notion expiram — não exibimos
    fechaLista();
    para.push(l.trim());
  }
  fechaPara(); fechaLista();
  return out.join("\n");
};

// Janela modal reutilizável: abrirModal(html, { largo: true }).
window.abrirModal = (() => {
  let dlg;
  return (html, { largo = false } = {}) => {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "modal";
      dlg.innerHTML = `<button class="modal-close" aria-label="Fechar" data-close>×</button><div class="modal-body"></div>`;
      dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
      document.body.append(dlg);
    }
    dlg.classList.toggle("modal-largo", largo);
    dlg.querySelector(".modal-body").innerHTML = html;
    dlg.querySelector(".modal-body").scrollTop = 0;
    if (!dlg.open) dlg.showModal();
    return dlg;
  };
})();

// Etiquetas de uma condição (Lista de Condições): nível, subtipo e máximo de acúmulos.
window.fichaCondicao = (cond) => {
  const esc = window.escapeHTML;
  const nivel = cond.nivel ? `<span class="tag ${cond.nivel === "Complexa" ? "tag-red" : "tag-azul"}">${esc(cond.nivel)}</span>` : "";
  const sub = cond.subtipo ? `<span class="tag tag-roxo">${esc(cond.subtipo)}</span>` : "";
  const max = cond.maximo ? `<span class="cond-max">Máximo de ${esc(cond.maximo)} acúmulos</span>` : "";
  return nivel || sub || max ? `<div class="cond-tags">${nivel}${sub}${max}</div>` : "";
};

// Explicação de um termo do sumário numa segunda janela, por cima da que estiver aberta
// (ex.: a carta continua aberta embaixo). Links dentro dela trocam o conteúdo, com "voltar".
window.abrirConceito = (() => {
  let dlg, historico = [];
  const porSlug = () => new Map((window.ASTER_CONCEITOS || []).map((c) => [c.slug, c]));
  const mostrar = (slug) => {
    const c = porSlug().get(slug);
    if (!c) return false;
    const esc = window.escapeHTML;
    const local = [c.categoria, c.grupo].filter(Boolean).join(" › ");
    const cond = c.condicao;
    dlg.querySelector(".modal-body").innerHTML = `
      ${historico.length > 1 ? '<button class="btn btn-ghost btn-small termo-voltar" type="button" data-voltar>← Voltar</button>' : ""}
      <span class="eyebrow" style="margin-bottom:.3rem">${cond ? "Condição" : "Sumário · " + esc(local)}</span>
      <h2 style="margin:0 0 .5em">${cond && cond.icone ? `<span class="cond-icone" aria-hidden="true">${esc(cond.icone)}</span> ` : ""}${esc(c.nome)}</h2>
      ${cond ? window.fichaCondicao(cond) : ""}
      <div class="md">${window.mdHTML(c.conteudo, { termos: true, termoAtual: c.slug })}</div>
      <p style="margin-top:1.2em"><a class="link-sumario" href="sumario.html#conceito-${c.slug}">${cond ? "Ver no catálogo de condições →" : "Ver no sumário completo →"}</a></p>`;
    dlg.querySelector(".modal-body").scrollTop = 0;
    return true;
  };
  return (slug) => {
    if (!(window.ASTER_CONCEITOS || []).some((c) => c.slug === slug)) return false;
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "modal modal-termo";
      dlg.innerHTML = `<button class="modal-close" aria-label="Fechar" data-close>×</button><div class="modal-body"></div>`;
      dlg.addEventListener("click", (e) => {
        if (e.target === dlg || e.target.closest("[data-close]")) { dlg.close(); return; }
        if (e.target.closest("[data-voltar]")) { historico.pop(); mostrar(historico[historico.length - 1]); }
      });
      dlg.addEventListener("close", () => { historico = []; });
      document.body.append(dlg);
    }
    historico.push(slug);
    mostrar(slug);
    if (!dlg.open) dlg.showModal();
    return true;
  };
})();
// Clique em qualquer termo linkado: abre a explicação sem sair da página (se o sumário estiver carregado).
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-termo]");
  if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (window.abrirConceito(a.dataset.termo)) e.preventDefault();
});

// Monograma (símbolo provisório) para cards sem arte própria.
window.monograma = (nome) => {
  const limpo = String(nome || "?").replace(/^(Aventureiro:\s*)/i, "").trim();
  return window.escapeHTML(limpo[0] || "?");
};

// Sub-navegação das páginas longas: destaca a seção visível.
(() => {
  const links = [...document.querySelectorAll(".subnav a")];
  if (!links.length || !("IntersectionObserver" in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.hash === "#" + en.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("section.anchor").forEach((s) => obs.observe(s));
})();
