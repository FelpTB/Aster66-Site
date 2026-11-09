// Componentes compartilhados: cards com símbolo, cabeçalho de janela e raças/classes
// (usados em Explorar e Ferramentas). Depende de common.js.
(() => {
  const esc = window.escapeHTML;
  const md = (s) => window.mdHTML(s);
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

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

  // ---------- Raças e classes ----------
  const nomeExibido = (x) => (x.nome.includes(":") ? x.nome.split(":").map((s) => s.trim())[1] : x.nome);
  const grupo = (x) => (x.nome.includes(":") ? x.nome.split(":")[0].trim() : "");
  const subtitulo = (x) => (grupo(x) ? grupo(x) + " · " : "") + (x.origens.length ? "Origens: " + x.origens.join(", ") : "");

  const cardPersona = (x, i) => cardEntidade({
    idx: i, simbolo: window.monograma(nomeExibido(x)), nome: nomeExibido(x), sub: subtitulo(x), texto: x.resumo,
    rubro: x.tipo === "classe",
    extra: `<span class="mini-stats"><span class="stat vida">Vida<b>${x.vida}</b></span><span class="stat energia">Energia<b>${x.energia}</b></span></span>`,
  });

  function fichaTecnica(x, { aberta = false } = {}) {
    const attrs = Object.entries(x.atributos).map(([k, v]) => `<span class="attr">+${v} ${k}</span>`);
    if (x.livres) attrs.push(`<span class="attr">+${x.livres} pontos livres</span>`);
    const rotuloHab = x.tipo === "raca" ? "Habilidade Inata" : "Habilidade Característica";
    return `
      <details class="tecnica"${aberta ? " open" : ""}>
        <summary>Ficha técnica</summary>
        <div class="tecnica-corpo">
          <div class="stats">
            <span class="stat vida">Vida inicial<b>${x.vida}</b></span>
            <span class="stat energia">Energia inicial<b>${x.energia}</b></span>
          </div>
          <span class="eyebrow" style="margin:.4rem 0 .4rem">Atributos iniciais</span>
          <div class="attr-list">${attrs.join("") || '<span class="dim">—</span>'}</div>
          <span class="eyebrow" style="margin:.4rem 0 .4rem">Origens</span>
          <div class="attr-list">${x.origens.map((o) => `<a class="origem-link" href="ferramentas.html?origem=${encodeURIComponent(o)}#cartas" data-filtra-origem="${esc(o)}">${esc(o)}</a>`).join("") || '<span class="dim">—</span>'}</div>
          ${x.habilidade.nome ? `
          <div class="skill" style="margin-top:6px">
            <span class="eyebrow" style="margin:.2rem 0 .3rem;font-size:.66rem">${rotuloHab}</span>
            <b>${esc(x.habilidade.nome)}</b>
            <div class="md" style="font-size:.93rem">${md(x.habilidade.conteudo || x.habilidade.texto)}</div>
          </div>` : ""}
        </div>
      </details>`;
  }

  const abrirPersona = (x, opcoes) => window.abrirModal(`
    ${cabecaModal(window.monograma(nomeExibido(x)), nomeExibido(x), x.tipo === "raca" ? "Raça" : "Classe", x.tipo === "classe")}
    <div class="md">${md(x.conteudo || x.resumo)}</div>
    ${fichaTecnica(x, opcoes)}
    ${x.lore ? `<div class="lore"><span class="eyebrow">Do livro · Lore</span><div class="md">${md(x.lore)}</div></div>` : ""}`, { largo: true });

  const casaBusca = (x, q) => !q ||
    norm([x.nome, x.resumo, x.origens.join(" "), x.habilidade.nome, x.habilidade.texto, x.lore || ""].join(" ")).includes(norm(q));

  window.AsterUI = { cardEntidade, cabecaModal, cardPersona, fichaTecnica, abrirPersona, casaBusca, nomeExibido, grupo, norm };
})();
