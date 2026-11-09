(() => {
  const M = window.ASTER_MUNDO;
  let P = window.ASTER_PERSONAGENS;
  const $ = (id) => document.getElementById(id);
  const esc = window.escapeHTML;

  // Astros
  $("astros").innerHTML = M.astros.map((a) => `
    <article class="card astro">
      ${window.ASTRO_SVG[a.id]}
      <div><h3 style="margin:0">${a.nome}</h3>
      <span class="eyebrow" style="margin:.2rem 0 .6rem">${a.tipo}</span>
      <p class="dim" style="font-size:.95rem">${a.texto}</p></div>
    </article>`).join("");

  // Panteão
  $("panteao-lista").innerHTML = M.panteao.map((d) => `
    <article class="deity${d.nome === "Ah-Rimã" ? " rebel" : ""}">
      <h4>${d.nome}</h4>
      <div class="titulo">${d.titulo}</div>
      <p>${d.texto}</p>
      <div class="simbolo">Símbolo: ${d.simbolo}</div>
    </article>`).join("");

  // Países
  $("paises-lista").innerHTML = M.paises.map((p, i) => `
    <button class="card card-link country" data-pais="${i}">
      <span class="tag">${p.tag}</span>
      <h3>${p.nome}</h3>
      <p>${p.resumo}</p>
      <span class="more">Ler mais →</span>
    </button>`).join("");

  const modal = $("modal-pais");
  $("paises-lista").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pais]");
    if (!btn) return;
    const p = M.paises[+btn.dataset.pais];
    $("modal-conteudo").innerHTML = `
      <span class="tag">${p.tag}</span>
      <h2>${p.nome}</h2>
      <p class="dim">${p.resumo}</p>
      <dl>
        <dt>Governo</dt><dd>${p.governo}</dd>
        <dt>Economia</dt><dd>${p.economia.join(" · ")}</dd>
      </dl>`;
    modal.showModal();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.hasAttribute("data-close")) modal.close();
  });

  // Raças e classes
  const ATTRS = ["Corpo", "Mente", "Alma", "Destreza", "Foco", "Conhecimento"];

  function card(x) {
    const attrs = Object.entries(x.atributos).map(([k, v]) => `<span class="attr">+${v} ${k}</span>`);
    if (x.livres) attrs.push(`<span class="attr">+${x.livres} pontos livres</span>`);
    const [titulo, sub] = x.nome.includes(":") ? x.nome.split(":").map((s) => s.trim()) : [x.nome, ""];
    const nomeExibido = sub || titulo;
    return `
      <article class="card persona ${x.tipo}">
        <header>
          <div class="sigil" aria-hidden="true">${esc(nomeExibido[0])}</div>
          <div><h3>${esc(nomeExibido)}</h3>
          <span class="sub">${sub ? esc(titulo) + " · " : ""}Origens: ${x.origens.map(esc).join(", ")}</span></div>
        </header>
        <p class="resumo">${esc(x.resumo)}</p>
        <div class="stats">
          <span class="stat vida">Vida<b>${x.vida}</b></span>
          <span class="stat energia">Energia<b>${x.energia}</b></span>
        </div>
        <div class="attr-list">${attrs.join("")}</div>
        <div class="skill">
          <b>${esc(x.habilidade.nome)}</b>
          <span class="eyebrow" style="margin:.1rem 0 .3rem;font-size:.66rem">${x.tipo === "raca" ? "Habilidade Inata" : "Habilidade Característica"}</span>
          <span>${esc(x.habilidade.texto)}</span>
        </div>
      </article>`;
  }

  const match = (x, q) => {
    if (!q) return true;
    const hay = [x.nome, x.resumo, x.origens.join(" "), x.habilidade.nome, x.habilidade.texto].join(" ").toLowerCase();
    return hay.includes(q.toLowerCase());
  };

  let attrFilter = null;
  function render() {
    const qr = $("busca-racas").value.trim();
    const qc = $("busca-classes").value.trim();
    const racas = P.filter((x) => x.tipo === "raca" && match(x, qr));
    const classes = P.filter((x) => x.tipo === "classe" && match(x, qc) && (!attrFilter || x.atributos[attrFilter]));
    $("racas-lista").innerHTML = racas.map(card).join("") || `<p class="empty">Nenhuma raça encontrada.</p>`;
    $("classes-lista").innerHTML = classes.map(card).join("") || `<p class="empty">Nenhuma classe encontrada.</p>`;
  }

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
  window.AsterDB.catalogoPersonagens().then((lista) => { P = lista; render(); });

  // ---------- Cartas ----------
  let CARTAS = [];
  let limite = 24;
  const fill = (id, valores) => {
    $(id).insertAdjacentHTML("beforeend", valores.map((v) => `<option>${esc(v)}</option>`).join(""));
  };
  const cartaHTML = (c) => `
    <article class="card card-frame carta">
      <header>
        <h3>${esc(c.nome)}</h3>
        ${c.custo !== "" ? `<span class="custo" title="Custo em energia">${esc(c.custo)}</span>` : ""}
      </header>
      <div class="carta-tags">
        <span class="tag">${esc(c.tipo)}</span><span class="tag tag-red">${esc(c.modo)}</span>
        ${c.alcance ? `<span class="carta-meta">${esc(c.alcance)}</span>` : ""}
        ${c.tempo ? `<span class="carta-meta">${esc(c.tempo)}</span>` : ""}
      </div>
      <p class="carta-texto">${esc(c.texto) || '<span class="dim">Sem descrição.</span>'}</p>
      ${c.custoExtra ? `<p class="carta-meta">Custo extra: ${esc(c.custoExtra)}</p>` : ""}
      <footer>${c.origens.map((o) => `<button class="origem-link" data-origem="${esc(o)}">${esc(o)}</button>`).join("") || '<span class="carta-meta">Origem não informada</span>'}</footer>
    </article>`;

  function renderCartas() {
    const q = $("busca-cartas").value.trim().toLowerCase();
    const o = $("filtro-origem").value, t = $("filtro-tipo").value, m = $("filtro-modo").value;
    const lista = CARTAS.filter((c) =>
      (!o || c.origens.includes(o)) && (!t || c.tipo === t) && (!m || c.modo === m) &&
      (!q || (c.nome + " " + c.texto).toLowerCase().includes(q)));
    $("cartas-contagem").textContent = `${lista.length} carta${lista.length === 1 ? "" : "s"}`;
    $("cartas-lista").innerHTML = lista.slice(0, limite).map(cartaHTML).join("") || `<p class="empty">Nenhuma carta encontrada.</p>`;
    $("cartas-mais").hidden = lista.length <= limite;
  }
  const resetar = () => { limite = 24; renderCartas(); };
  ["busca-cartas"].forEach((id) => $(id).addEventListener("input", resetar));
  ["filtro-origem", "filtro-tipo", "filtro-modo"].forEach((id) => $(id).addEventListener("change", resetar));
  $("cartas-mais").addEventListener("click", () => { limite += 48; renderCartas(); });
  $("cartas-lista").addEventListener("click", (e) => {
    const b = e.target.closest("[data-origem]");
    if (!b) return;
    $("filtro-origem").value = b.dataset.origem; resetar();
    $("cartas").scrollIntoView({ behavior: "smooth" });
  });

  window.AsterDB.cartas().then((lista) => {
    CARTAS = lista;
    if (!lista.length) {
      $("cartas-lista").innerHTML = `<p class="empty">O catálogo de cartas vem do Supabase. Configure a conexão no arquivo .env para vê-lo aqui.</p>`;
      return;
    }
    const uniq = (f) => [...new Set(lista.flatMap(f))].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt"));
    fill("filtro-origem", uniq((c) => c.origens).filter((x) => !x.startsWith("Tipo:")));
    fill("filtro-tipo", uniq((c) => [c.tipo]));
    fill("filtro-modo", uniq((c) => [c.modo]));
    renderCartas();
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
