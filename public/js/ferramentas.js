// Catálogo de cartas (galeria com filtros) — dados do esquema `aster` do Supabase.
(() => {
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

// ---------- Catálogo de condições ----------
// Dados: entradas do sumário com `condicao` (vêm da Lista de Condições do Notion, via sync).
// Cada card tem a âncora #conceito-<slug>, a mesma dos links das cartas ("Atordoado" → Atordoamento).
(() => {
  const esc = window.escapeHTML;
  const norm = window.AsterUI.norm;
  const lista = document.getElementById("condicoes-lista");
  const busca = document.getElementById("busca-condicoes");
  const chips = document.getElementById("nivel-condicoes");
  const CONDICOES = (window.ASTER_CONCEITOS || []).filter((c) => c.condicao)
    .map((c) => ({ ...c, acumula: !!c.condicao.maximo || /acúmulo/i.test(c.conteudo + " " + c.condicao.descricao) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  let nivelSel = null, soAcumula = false;

  const card = (c) => {
    const k = c.condicao;
    return `
      <button class="condicao-card ${k.nivel === "Complexa" ? "complexa" : "normal"}" id="conceito-${c.slug}" data-conceito="${esc(c.slug)}" aria-haspopup="dialog">
        <span class="cc-topo">
          <span class="cc-icone" aria-hidden="true">${esc(k.icone || "•")}</span>
          <b>${esc(c.nome)}</b>
        </span>
        <span class="cc-texto">${esc(k.descricao || window.AsterDB.mdTexto(c.conteudo).slice(0, 160))}</span>
        <span class="cc-rodape">
          ${k.nivel ? `<span class="tag ${k.nivel === "Complexa" ? "tag-red" : "tag-azul"}">${esc(k.nivel)}</span>` : ""}
          ${k.subtipo ? `<span class="tag tag-roxo">${esc(k.subtipo)}</span>` : ""}
          ${k.maximo ? `<span class="cond-max">Máx. ${esc(k.maximo)}</span>` : c.acumula ? `<span class="cond-max">Acumula</span>` : ""}
        </span>
      </button>`;
  };

  function render() {
    if (!CONDICOES.length) { lista.innerHTML = `<p class="empty">As condições ainda não foram sincronizadas do Notion.</p>`; return; }
    const q = norm(busca.value.trim());
    const visiveis = CONDICOES.filter((c) => (!nivelSel || c.condicao.nivel === nivelSel) && (!soAcumula || c.acumula) &&
      (!q || norm([c.nome, c.condicao.descricao, c.condicao.remocao, c.condicao.subtipo, c.conteudo].join(" ")).includes(q)));
    document.getElementById("condicoes-contagem").textContent = `${visiveis.length} de ${CONDICOES.length} condições`;
    const grupos = [["Normal", "Normais"], ["Complexa", "Complexas"]];
    lista.innerHTML = grupos.map(([nivel, titulo]) => {
      const itens = visiveis.filter((c) => c.condicao.nivel === nivel);
      return itens.length ? `<h3 class="conceito-sub">${titulo}</h3><div class="condicoes-grid">${itens.map(card).join("")}</div>` : "";
    }).join("") || `<p class="empty">Nenhuma condição encontrada.</p>`;
  }

  busca.addEventListener("input", render);
  chips.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.nivel) nivelSel = nivelSel === b.dataset.nivel ? null : b.dataset.nivel;
    if (b.dataset.acumula) soAcumula = !soAcumula;
    chips.querySelectorAll("[data-nivel]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.nivel === nivelSel)));
    chips.querySelector("[data-acumula]").setAttribute("aria-pressed", String(soAcumula));
    render();
  });
  document.getElementById("limpar-condicoes").addEventListener("click", () => {
    busca.value = ""; nivelSel = null; soAcumula = false;
    chips.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
    render();
  });
  lista.addEventListener("click", (e) => {
    const b = e.target.closest("[data-conceito]"); if (!b) return;
    history.replaceState(null, "", "#conceito-" + b.dataset.conceito);
    window.abrirConceito(b.dataset.conceito);
  });
  render();
})();

// ---------- Sumário (glossário de regras) ----------
// Dados: js/data-conceitos.js, gerado pelo sync a partir das páginas de regras do Notion.
// Cada entrada tem âncora #conceito-<slug>; os termos citados nas cartas, raças e classes apontam para cá.
(() => {
  const esc = window.escapeHTML;
  const norm = window.AsterUI.norm;
  // As condições individuais ficam no catálogo de condições (acima), não no sumário.
  const CONCEITOS = (window.ASTER_CONCEITOS || []).filter((c) => !c.condicao);
  const lista = document.getElementById("conceitos-lista");
  const busca = document.getElementById("busca-conceitos");
  const gruposEl = document.getElementById("grupos-conceitos");
  const categorias = [...new Set(CONCEITOS.map((c) => c.categoria || "Outros"))];
  let catSel = null;

  gruposEl.insertAdjacentHTML("beforeend", categorias.map((g) => `<button class="chip" type="button" aria-pressed="false" data-grupo="${esc(g)}">${esc(g)}</button>`).join(""));

  const resumo = (c) => window.AsterDB.mdTexto(c.conteudo).replace(/\s+/g, " ").replace(/\{(\p{L}+)\}/gu, "$1").slice(0, 150);
  const botao = (c) => `
    <button class="conceito" id="conceito-${c.slug}" data-conceito="${esc(c.slug)}" aria-haspopup="dialog">
      <b>${esc(c.nome)}</b><span>${esc(resumo(c))}…</span>
    </button>`;
  function render() {
    if (!CONCEITOS.length) { lista.innerHTML = `<p class="empty">O sumário ainda não foi gerado.</p>`; return; }
    const q = norm(busca.value.trim());
    const visiveis = CONCEITOS.filter((c) => (!catSel || (c.categoria || "Outros") === catSel) && (!q || norm(c.nome + " " + c.grupo + " " + c.conteudo).includes(q)));
    lista.innerHTML = categorias.map((cat) => {
      const itens = visiveis.filter((c) => (c.categoria || "Outros") === cat);
      if (!itens.length) return "";
      const grupos = [...new Set(itens.map((c) => c.grupo || ""))];
      return `
        <div class="conceito-grupo">
          <h3>${esc(cat)}</h3>
          ${grupos.map((g) => `
            ${g ? `<h4 class="conceito-sub">${esc(g)}</h4>` : ""}
            <div class="conceitos">${itens.filter((c) => (c.grupo || "") === g).map(botao).join("")}</div>`).join("")}
        </div>`;
    }).join("") || `<p class="empty">Nenhum conceito encontrado.</p>`;
  }
  busca.addEventListener("input", render);
  gruposEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-grupo]"); if (!b) return;
    catSel = catSel === b.dataset.grupo ? null : b.dataset.grupo;
    gruposEl.querySelectorAll("[data-grupo]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.grupo === catSel)));
    render();
  });
  lista.addEventListener("click", (e) => {
    const b = e.target.closest("[data-conceito]"); if (!b) return;
    history.replaceState(null, "", "#conceito-" + b.dataset.conceito);
    window.abrirConceito(b.dataset.conceito);
  });
  render();

  // Link direto (ferramentas.html#conceito-golpe-critico): rola até a entrada e abre a explicação.
  const abrirDoHash = () => {
    const m = /^#conceito-(.+)$/.exec(location.hash);
    if (!m) return;
    const slug = decodeURIComponent(m[1]);
    document.getElementById("conceito-" + slug)?.scrollIntoView({ block: "center" });
    window.abrirConceito(slug);
  };
  window.addEventListener("hashchange", abrirDoHash);
  abrirDoHash();
})();
