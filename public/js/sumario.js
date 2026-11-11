// Página Sumário: condições e glossário de regras. Âncoras #conceito-<slug> (os termos das cartas apontam para cá).

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

  // Link direto (sumario.html#conceito-golpe-critico): rola até a entrada e abre a explicação.
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
