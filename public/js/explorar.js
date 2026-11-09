(() => {
  const M = window.ASTER_MUNDO;
  const DB = window.AsterDB;
  let P = window.ASTER_PERSONAGENS || [];
  const $ = (id) => document.getElementById(id);
  const esc = window.escapeHTML;
  const md = window.mdHTML;
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

  // ---------- Céu de Aster ----------
  $("astros").innerHTML = M.astros.map((a) => `
    <article class="card astro">
      ${window.ASTRO_SVG[a.id]}
      <div><h3 style="margin:0">${a.nome}</h3>
      <span class="eyebrow" style="margin:.2rem 0 .6rem">${a.tipo}</span>
      <p class="dim" style="font-size:.95rem">${a.texto}</p></div>
    </article>`).join("");

  const cardEntidade = ({ idx, simbolo, nome, sub, texto, rubro, extra = "" }) => `
    <button class="entidade${rubro ? " rubro" : ""}" data-idx="${idx}" aria-haspopup="dialog">
      <span class="simbolo" aria-hidden="true">${simbolo}</span>
      <h3>${esc(nome)}</h3>
      ${sub ? `<span class="sub">${esc(sub)}</span>` : ""}
      <p>${esc(texto)}</p>
      ${extra}
      <span class="mais">Ler mais →</span>
    </button>`;

  const cabecaModal = (simbolo, nome, sub, rubro) => `
    <div class="modal-cabeca">
      <span class="simbolo-g${rubro ? " rubro" : ""}" aria-hidden="true">${simbolo}</span>
      <div>${sub ? `<span class="eyebrow" style="margin-bottom:.3rem">${esc(sub)}</span>` : ""}<h2>${esc(nome)}</h2></div>
    </div>`;

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
  DB.paises().then((lista) => {
    if (!lista.length) return;
    PAISES = lista.map((p) => ({ ...p, tag: localPorNome.get(norm(p.nome))?.tag || "" }));
    renderPaises();
  }).catch((e) => console.warn("Países do Supabase indisponíveis.", e));

  // ---------- Povo de Aster: raças e classes ----------
  const ATTRS = ["Corpo", "Mente", "Alma", "Destreza", "Foco", "Conhecimento"];
  const nomeExibido = (x) => (x.nome.includes(":") ? x.nome.split(":").map((s) => s.trim())[1] : x.nome);
  const subtitulo = (x) => (x.nome.includes(":") ? x.nome.split(":")[0].trim() + " · " : "") + (x.origens.length ? "Origens: " + x.origens.join(", ") : "");

  const cardPersona = (x, i) => cardEntidade({
    idx: i, simbolo: window.monograma(nomeExibido(x)), nome: nomeExibido(x), sub: subtitulo(x), texto: x.resumo,
    rubro: x.tipo === "classe",
    extra: `<span class="mini-stats"><span class="stat vida">Vida<b>${x.vida}</b></span><span class="stat energia">Energia<b>${x.energia}</b></span></span>`,
  });

  function fichaTecnica(x) {
    const attrs = Object.entries(x.atributos).map(([k, v]) => `<span class="attr">+${v} ${k}</span>`);
    if (x.livres) attrs.push(`<span class="attr">+${x.livres} pontos livres</span>`);
    const rotuloHab = x.tipo === "raca" ? "Habilidade Inata" : "Habilidade Característica";
    return `
      <details class="tecnica">
        <summary>Ficha técnica</summary>
        <div class="tecnica-corpo">
          <div class="stats">
            <span class="stat vida">Vida inicial<b>${x.vida}</b></span>
            <span class="stat energia">Energia inicial<b>${x.energia}</b></span>
          </div>
          <span class="eyebrow" style="margin:.4rem 0 .4rem">Atributos iniciais</span>
          <div class="attr-list">${attrs.join("") || '<span class="dim">—</span>'}</div>
          <span class="eyebrow" style="margin:.4rem 0 .4rem">Origens</span>
          <div class="attr-list">${x.origens.map((o) => `<a class="origem-link" href="ferramentas.html?origem=${encodeURIComponent(o)}#cartas">${esc(o)}</a>`).join("") || '<span class="dim">—</span>'}</div>
          ${x.habilidade.nome ? `
          <div class="skill" style="margin-top:6px">
            <span class="eyebrow" style="margin:.2rem 0 .3rem;font-size:.66rem">${rotuloHab}</span>
            <b>${esc(x.habilidade.nome)}</b>
            <div class="md" style="font-size:.93rem">${md(x.habilidade.conteudo || x.habilidade.texto)}</div>
          </div>` : ""}
        </div>
      </details>`;
  }

  const match = (x, q) => {
    if (!q) return true;
    return norm([x.nome, x.resumo, x.origens.join(" "), x.habilidade.nome, x.habilidade.texto].join(" ")).includes(norm(q));
  };

  let attrFilter = null;
  let RACAS = [], CLASSES = [];
  function render() {
    const qr = $("busca-racas").value.trim();
    const qc = $("busca-classes").value.trim();
    RACAS = P.filter((x) => x.tipo === "raca" && match(x, qr));
    CLASSES = P.filter((x) => x.tipo === "classe" && match(x, qc) && (!attrFilter || x.atributos[attrFilter]));
    $("racas-lista").innerHTML = RACAS.map(cardPersona).join("") || `<p class="empty">Nenhuma raça encontrada.</p>`;
    $("classes-lista").innerHTML = CLASSES.map(cardPersona).join("") || `<p class="empty">Nenhuma classe encontrada.</p>`;
  }
  const abrirPersona = (x) => window.abrirModal(`
    ${cabecaModal(window.monograma(nomeExibido(x)), nomeExibido(x), x.tipo === "raca" ? "Raça" : "Classe", x.tipo === "classe")}
    <div class="md">${md(x.conteudo || x.resumo)}</div>
    ${fichaTecnica(x)}`, { largo: true });
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

  // ---------- Sub-navegação ----------
  const links = [...document.querySelectorAll(".subnav a")];
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.hash === "#" + en.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("section.anchor").forEach((s) => obs.observe(s));
})();
