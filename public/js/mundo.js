// Página Mundo de Aster: mapa (em construção), linha do tempo, panteão, países e locais, raças e classes.
(() => {
  const M = window.ASTER_MUNDO;
  const DB = window.AsterDB;
  let P = window.ASTER_PERSONAGENS || [];
  const $ = (id) => document.getElementById(id);
  const esc = window.escapeHTML;
  const md = window.mdHTML;
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

  const { cardEntidade, cabecaModal, cardPersona, abrirPersona, casaBusca } = window.AsterUI;

  // ---------- Linha do tempo ----------
  const linha = $("linha-do-tempo");
  if (linha) linha.innerHTML = (M.linhaDoTempo || []).map((era) => `
    <li class="era">
      <span class="era-nome">${esc(era.era)}</span>
      <ol>${era.eventos.map((ev) => `<li><b>${esc(ev.titulo)}</b><p class="dim">${esc(ev.texto)}</p></li>`).join("")}</ol>
    </li>`).join("");

  // ---------- Panteão de Édin ----------
  let DEUSES = M.panteao.map((d) => ({ nome: d.nome, titulo: d.titulo, resumo: d.texto, conteudo: `${d.texto}\n\n**Símbolo:** ${d.simbolo}` }));
  function renderPanteao() {
    $("panteao-lista").innerHTML = DEUSES.map((d, i) => cardEntidade({
      idx: i, simbolo: window.simboloDeus(d.nome), nome: d.nome, sub: d.titulo, texto: d.resumo,
      rubro: /^Ah-Rim|^Amon/.test(d.nome),
    })).join("");
  }
  $("panteao-lista").addEventListener("click", (e) => {
    const b = e.target.closest("[data-idx]"); if (!b) return;
    const d = DEUSES[+b.dataset.idx];
    window.abrirModal(`${cabecaModal(window.simboloDeus(d.nome), d.nome, d.titulo, /^Ah-Rim|^Amon/.test(d.nome))}<div class="md">${md(d.conteudo)}</div>`, { largo: true });
  });
  renderPanteao();
  DB.panteao().then((lista) => { if (lista.length) { DEUSES = lista; renderPanteao(); } }).catch((e) => console.warn("Panteão do Supabase indisponível.", e));

  // ---------- Países ----------
  const localPorNome = new Map(M.paises.map((p) => [norm(p.nome), p]));
  let PAISES = M.paises.map((p) => ({
    nome: p.nome, tag: p.tag, resumo: p.resumo, locais: [],
    conteudo: `${p.resumo}\n\n**Governo:** ${p.governo}\n\n**Economia:** ${p.economia.join(" · ")}`,
  }));
  function renderPaises() {
    $("paises-lista").innerHTML = PAISES.map((p, i) => cardEntidade({
      idx: i, simbolo: window.monograma(p.nome), nome: p.nome, sub: p.tag, texto: p.resumo,
      extra: p.locais.length ? `<span class="carta-meta">${p.locais.length} ${p.locais.length === 1 ? "local" : "locais"}</span>` : "",
    })).join("");
  }
  $("paises-lista").addEventListener("click", (e) => {
    const b = e.target.closest("[data-idx]"); if (!b) return;
    const p = PAISES[+b.dataset.idx];
    const locais = p.locais.length ? `
      <h3 style="margin-top:28px">Locais</h3>
      <div class="locais">${p.locais.map((l) => `
        <details><summary>${esc(l.nome)}${l.abrangencia ? `<span class="tag">${esc(l.abrangencia)}</span>` : ""}</summary>
          <div class="md">${md(l.conteudo) || '<p class="dim">Sem descrição.</p>'}</div></details>`).join("")}
      </div>` : "";
    window.abrirModal(`${cabecaModal(window.monograma(p.nome), p.nome, p.tag)}<div class="md">${md(p.conteudo)}</div>${locais}`, { largo: true });
  });
  renderPaises();
  // Mapa (provisório): cada país vira um marcador que abre a mesma janela do card.
  const mapa = $("mapa-paises");
  function renderMapa() {
    if (mapa) mapa.innerHTML = PAISES.map((p, i) => `<button class="chip" type="button" data-idx="${i}">${esc(p.nome)}</button>`).join("");
  }
  mapa?.addEventListener("click", (e) => { const b = e.target.closest("[data-idx]"); if (b) $("paises-lista").querySelector(`[data-idx="${b.dataset.idx}"]`)?.click(); });
  renderMapa();
  DB.paises().then((lista) => {
    if (!lista.length) return;
    PAISES = lista.map((p) => ({ ...p, tag: localPorNome.get(norm(p.nome))?.tag || "" }));
    renderPaises(); renderMapa();
  }).catch((e) => console.warn("Países do Supabase indisponíveis.", e));

  // ---------- Povo de Aster: raças e classes ----------
  const ATTRS = ["Corpo", "Mente", "Alma", "Destreza", "Foco", "Conhecimento"];
  let attrFilter = null;
  let RACAS = [], CLASSES = [];
  function render() {
    const qr = $("busca-racas").value.trim();
    const qc = $("busca-classes").value.trim();
    RACAS = P.filter((x) => x.tipo === "raca" && casaBusca(x, qr));
    CLASSES = P.filter((x) => x.tipo === "classe" && casaBusca(x, qc) && (!attrFilter || x.atributos[attrFilter]));
    $("racas-lista").innerHTML = RACAS.map(cardPersona).join("") || `<p class="empty">Nenhuma raça encontrada.</p>`;
    $("classes-lista").innerHTML = CLASSES.map(cardPersona).join("") || `<p class="empty">Nenhuma classe encontrada.</p>`;
  }
  $("racas-lista").addEventListener("click", (e) => { const b = e.target.closest("[data-idx]"); if (b) abrirPersona(RACAS[+b.dataset.idx]); });
  $("classes-lista").addEventListener("click", (e) => { const b = e.target.closest("[data-idx]"); if (b) abrirPersona(CLASSES[+b.dataset.idx]); });

  $("filtro-attr").innerHTML = ATTRS.map((a) => `<button class="chip" aria-pressed="false" data-attr="${a}">${a}</button>`).join("");
  $("filtro-attr").addEventListener("click", (e) => {
    const b = e.target.closest("[data-attr]");
    if (!b) return;
    attrFilter = attrFilter === b.dataset.attr ? null : b.dataset.attr;
    $("filtro-attr").querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.attr === attrFilter)));
    render();
  });
  $("busca-racas").addEventListener("input", render);
  $("busca-classes").addEventListener("input", render);
  render();
  DB.catalogoPersonagens().then((lista) => { P = lista; render(); });

})();
