// Página Catálogos: cartas (galeria com filtros), raças e classes, e os catálogos simples (bestiário, itens, locais).
(() => {
// ---------- Catálogo de cartas ----------
  const $ = (id) => document.getElementById(id);
  const esc = window.escapeHTML;
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const ORDEM_RARIDADE = ["Classe", "Raça", "Comum", "Notável", "Renomado", "Heróico", "Lendário", "Inigualável", "Antigo"];
  const classeRaridade = (r) => (r ? "rar-" + norm(r).replace(/[^a-z]/g, "") : "");

  // Faixas de custo em energia (como os cristais de mana).
  const FAIXAS = [
    ["0", "Sem custo"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8+", "8 ou mais"], ["X", "Variável"],
  ];
  function faixasDaCarta(c) {
    if (!c.custos.length) return ["0"];
    return c.custos.map((v) => {
      const n = String(v).match(/^\d+/);
      if (!n) return "X";
      const x = +n[0];
      return x >= 8 ? "8+" : String(x);
    });
  }

  let CARTAS = [];
  let limite = 30;
  let custoSel = null;

  const filtros = ["filtro-origem", "filtro-tipo", "filtro-raridade", "filtro-modo", "filtro-palavra", "filtro-ritmo"];
  const fill = (id, valores) => $(id).insertAdjacentHTML("beforeend", valores.map((v) => `<option>${esc(v)}</option>`).join(""));

  $("filtro-custo").insertAdjacentHTML("beforeend", FAIXAS.map(([k, label]) =>
    `<button class="custo-chip" type="button" aria-pressed="false" data-custo="${k}" title="${label}">${k === "0" ? "–" : k}</button>`).join(""));

  const cartaHTML = (c, i) => `
    <button class="carta-g ${classeRaridade(c.raridade)}" data-idx="${i}" aria-haspopup="dialog">
      <div class="cg-topo">
        <h3>${esc(c.nome)}</h3>
        ${c.custo ? `<span class="cg-custo" title="Custo em energia">${esc(c.custos.length > 1 ? c.custos[0] + "…" : c.custo).slice(0, 12)}</span>` : ""}
      </div>
      <span class="cg-tipo">${esc(c.tipo)}${c.modo ? " · " + esc(c.modo) : ""}</span>
      <p class="cg-texto">${window.marcarRitmos(esc(c.texto)) || "Sem descrição."}</p>
      <div class="cg-rodape">
        <span class="cg-rar">${esc(c.raridade || "")}</span>
        <span>${esc(c.origens.slice(0, 2).join(", "))}${c.origens.length > 2 ? "…" : ""}</span>
      </div>
    </button>`;

  let LISTA = [];
  function render() {
    const q = norm($("busca-cartas").value.trim());
    const [o, t, r, m, p, ri] = filtros.map((id) => $(id).value);
    LISTA = CARTAS.filter((c) =>
      (!o || c.origens.includes(o)) && (!t || c.tipos.includes(t)) && (!r || c.raridade === r) &&
      (!m || c.modos.includes(m)) && (!p || c.palavras.includes(p)) && (!ri || c.ritmos.includes(ri)) &&
      (!custoSel || faixasDaCarta(c).includes(custoSel)) &&
      (!q || norm(c.nome + " " + c.texto + " " + c.palavras.join(" ")).includes(q)));
    $("cartas-contagem").textContent = `${LISTA.length} carta${LISTA.length === 1 ? "" : "s"}`;
    $("cartas-lista").innerHTML = LISTA.slice(0, limite).map(cartaHTML).join("") || `<p class="empty">Nenhuma carta encontrada.</p>`;
    $("cartas-mais").hidden = LISTA.length <= limite;
  }
  const resetar = () => { limite = 30; render(); };

  $("busca-cartas").addEventListener("input", resetar);
  filtros.forEach((id) => $(id).addEventListener("change", resetar));
  $("filtro-custo").addEventListener("click", (e) => {
    const b = e.target.closest("[data-custo]"); if (!b) return;
    custoSel = custoSel === b.dataset.custo ? null : b.dataset.custo;
    $("filtro-custo").querySelectorAll("[data-custo]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.custo === custoSel)));
    resetar();
  });
  $("limpar-filtros").addEventListener("click", () => {
    $("busca-cartas").value = ""; filtros.forEach((id) => ($(id).value = "")); custoSel = null;
    $("filtro-custo").querySelectorAll("[data-custo]").forEach((x) => x.setAttribute("aria-pressed", "false"));
    resetar();
  });
  $("cartas-mais").addEventListener("click", () => { limite += 60; render(); });

  $("cartas-lista").addEventListener("click", (e) => {
    const b = e.target.closest("[data-idx]"); if (!b) return;
    const c = LISTA[+b.dataset.idx];
    const linha = (rotulo, valor) => (valor ? `<dt>${rotulo}</dt><dd>${window.linkarTermos(esc(valor))}</dd>` : "");
    window.abrirModal(`
      <div class="carta-detalhe ${classeRaridade(c.raridade)}">
        <span class="eyebrow" style="color:var(--rar);margin-bottom:.3rem">${esc(c.raridade || "Carta")}</span>
        <h2 style="margin:0 0 .3em">${esc(c.nome)}</h2>
        <div class="md">${window.mdHTML(c.conteudo || c.texto, { termos: true }) || '<p class="dim">Sem descrição.</p>'}</div>
        <dl>
          ${linha("Tipo", c.tipo)}${linha("Modo de uso", c.modo)}${linha("Custo em energia", c.custo)}
          ${linha("Custo extra", c.custoExtra)}${linha("Cooldown", c.tempo)}${linha("Alcance", c.alcance)}
        </dl>
        <span class="eyebrow" style="margin:.2rem 0 .4rem">Origens</span>
        <div class="attr-list">${c.origens.map((o) => `<button class="origem-link" data-filtra-origem="${esc(o)}">${esc(o)}</button>`).join("") || '<span class="dim">—</span>'}</div>
        ${c.palavras.length ? `<span class="eyebrow" style="margin:.6rem 0 .4rem">Palavras-chave</span>
        <div class="attr-list">${c.palavras.map((p) => `<span class="tag">${esc(p)}</span>`).join("")}</div>` : ""}
      </div>`);
  });
  // Clicar numa origem dentro da janela filtra o catálogo por ela.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-filtra-origem]"); if (!b) return;
    e.preventDefault();
    $("filtro-origem").value = b.dataset.filtraOrigem;
    b.closest("dialog")?.close();
    resetar();
    $("cartas").scrollIntoView({ behavior: "smooth" });
  });

  window.AsterDB.cartas().then((lista) => {
    CARTAS = lista.map((c) => ({ ...c, ritmos: window.ritmosDoTexto(c.conteudo || c.texto) }));
    if (!lista.length) {
      $("cartas-lista").innerHTML = `<p class="empty">O catálogo de cartas vem do Supabase e não está disponível agora.</p>`;
      return;
    }
    const uniq = (f) => [...new Set(lista.flatMap(f))].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt"));
    fill("filtro-origem", uniq((c) => c.origens));
    fill("filtro-tipo", uniq((c) => c.tipos));
    fill("filtro-raridade", uniq((c) => [c.raridade]).sort((a, b) => ORDEM_RARIDADE.indexOf(a) - ORDEM_RARIDADE.indexOf(b)));
    fill("filtro-modo", uniq((c) => c.modos));
    fill("filtro-palavra", uniq((c) => c.palavras));
    fill("filtro-ritmo", Object.keys(window.RITMOS).filter((r) => CARTAS.some((c) => c.ritmos.includes(r))));
    const origemURL = new URLSearchParams(location.search).get("origem");
    if (origemURL) $("filtro-origem").value = origemURL;
    render();
  }).catch((err) => {
    $("cartas-lista").innerHTML = `<p class="empty">Não foi possível carregar as cartas: ${esc(err.message)}</p>`;
  });

  // Destaca a seção atual na sub-navegação
  const links = [...document.querySelectorAll(".subnav a")];
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.hash === "#" + en.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("section.anchor").forEach((s) => obs.observe(s));
})();

// ---------- Catálogos de raças e classes ----------
(() => {
  const esc = window.escapeHTML;
  const UI = window.AsterUI;
  const ATTRS = ["Corpo", "Mente", "Alma", "Destreza", "Foco", "Conhecimento"];
  let P = window.ASTER_PERSONAGENS || [];

  function montarCatalogo(tipo) {
    const raiz = document.querySelector(`[data-catalogo="${tipo}"]`);
    const secao = raiz.closest("section");
    const f = (nome) => secao.querySelector(`[data-f="${nome}"]`);
    let attrSel = null, visiveis = [];

    f("attrs").insertAdjacentHTML("beforeend", ATTRS.map((a) => `<button class="chip" type="button" aria-pressed="false" data-attr="${a}">${a}</button>`).join(""));

    function preencherOpcoes() {
      const itens = P.filter((x) => x.tipo === tipo);
      const opcoes = (sel, valores, rotulo) => {
        const atual = sel.value;
        sel.innerHTML = `<option value="">${rotulo}</option>` + valores.map((v) => `<option>${esc(v)}</option>`).join("");
        sel.value = atual;
      };
      const num = (a, b) => +a - +b;
      opcoes(f("origem"), [...new Set(itens.flatMap((x) => x.origens))].sort((a, b) => a.localeCompare(b, "pt")), "Todas as origens");
      opcoes(f("vida"), [...new Set(itens.map((x) => String(x.vida)))].sort(num), "Qualquer vida inicial");
      opcoes(f("energia"), [...new Set(itens.map((x) => String(x.energia)))].sort(num), "Qualquer energia inicial");
    }

    function render() {
      const q = f("busca").value.trim(), o = f("origem").value, v = f("vida").value, e = f("energia").value, ord = f("ordem").value;
      visiveis = P.filter((x) => x.tipo === tipo && UI.casaBusca(x, q) &&
        (!o || x.origens.includes(o)) && (!v || String(x.vida) === v) && (!e || String(x.energia) === e) &&
        (!attrSel || x.atributos[attrSel]));
      if (ord === "vida") visiveis.sort((a, b) => b.vida - a.vida || a.nome.localeCompare(b.nome, "pt"));
      else if (ord === "energia") visiveis.sort((a, b) => b.energia - a.energia || a.nome.localeCompare(b.nome, "pt"));
      else visiveis.sort((a, b) => UI.nomeExibido(a).localeCompare(UI.nomeExibido(b), "pt"));
      const total = P.filter((x) => x.tipo === tipo).length;
      f("contagem").textContent = `${visiveis.length} de ${total} ${tipo === "raca" ? "raças" : "classes"}`;
      f("lista").innerHTML = visiveis.map(UI.cardPersona).join("") || `<p class="empty">Nada encontrado com esses filtros.</p>`;
    }

    f("busca").addEventListener("input", render);
    ["origem", "vida", "energia", "ordem"].forEach((n) => f(n).addEventListener("change", render));
    f("attrs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-attr]"); if (!b) return;
      attrSel = attrSel === b.dataset.attr ? null : b.dataset.attr;
      f("attrs").querySelectorAll("[data-attr]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.attr === attrSel)));
      render();
    });
    f("limpar").addEventListener("click", () => {
      f("busca").value = ""; ["origem", "vida", "energia"].forEach((n) => (f(n).value = "")); f("ordem").value = "nome"; attrSel = null;
      f("attrs").querySelectorAll("[data-attr]").forEach((c) => c.setAttribute("aria-pressed", "false"));
      render();
    });
    f("lista").addEventListener("click", (e) => {
      const b = e.target.closest("[data-idx]"); if (b) UI.abrirPersona(visiveis[+b.dataset.idx], { aberta: true });
    });
    return () => { preencherOpcoes(); render(); };
  }

  const atualizadores = ["raca", "classe"].map(montarCatalogo);
  const atualizar = () => atualizadores.forEach((fn) => fn());
  atualizar();
  window.AsterDB.catalogoPersonagens().then((lista) => { P = lista; atualizar(); });
})();

// ---------- Catálogos simples: Bestiário, Itens e Locais ----------
(() => {
  const DB = window.AsterDB;
  const montar = (id, opcoes) => { const el = document.getElementById(id); if (el) window.CatalogoSimples.montar(el, opcoes); };
  const juntar = (v) => (Array.isArray(v) ? v.join(", ") : v || "");

  montar("cat-bestiario", {
    rotulo: ["criatura", "criaturas"], termos: true,
    carregar: () => DB.tabela("criaturas"),
    sub: (x) => [juntar(x.tipo), x.raridade, x.nivel && `Nível ${x.nivel}`].filter(Boolean).join(" · "),
    filtros: [{ rotulo: "Tipo", valores: (x) => x.tipo }, { rotulo: "Raridade", valores: (x) => x.raridade }],
    ficha: (x) => [["Vida", x.vida], ["Ações", x.acoes], ["Reações", x.reacoes], ["Movimento", x.movimento],
      ["Atributos", x.atributos], ["Defesa", [x.tipo_de_defesa, x.atributo_de_defesa].filter(Boolean).join(" ")]],
  });

  montar("cat-itens", {
    rotulo: ["item", "itens"], termos: true,
    carregar: () => DB.tabela("itens"),
    sub: (x) => [juntar(x.tipo), x.raridade].filter(Boolean).join(" · "),
    filtros: [{ rotulo: "Tipo", valores: (x) => x.tipo }, { rotulo: "Raridade", valores: (x) => x.raridade },
      { rotulo: "Modo de uso", valores: (x) => x.modo_de_uso }, { rotulo: "Empunhadura", valores: (x) => x.empunhadura }],
    ficha: (x) => [["Efeito", x.efeito], ["Modo de uso", x.modo_de_uso], ["Empunhadura", x.empunhadura], ["Alcance", x.alcance],
      ["Preço unitário", x.preco_unitario], ["Quantidade por espaço", x.qtd_por_espaco]],
  });

  // Locais: os Cenários do Notion; o "pertence a" vem das relações entre cenários.
  montar("cat-locais", {
    rotulo: ["local", "locais"],
    carregar: async () => {
      const dados = await DB.tabela("cenarios", "id,nome,abrangencia,cenarios_relacionados,conteudo,icone");
      const porId = new Map(dados.map((c) => [c.id, c]));
      return dados.map((c) => ({ ...c, ligados: (c.cenarios_relacionados || []).map((id) => porId.get(id)?.nome).filter(Boolean) }));
    },
    sub: (x) => [x.abrangencia, x.abrangencia !== "País" && x.ligados.length === 1 ? x.ligados[0] : ""].filter(Boolean).join(" · "),
    filtros: [{ rotulo: "Abrangência", valores: (x) => x.abrangencia }],
    ficha: (x) => [["Abrangência", x.abrangencia], [x.abrangencia === "País" ? "Locais" : "Ligado a", x.ligados]],
  });
})();
