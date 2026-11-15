// Documentos: lista (documentos.html) e página de cada um (documento.html?id=…). Dados em common.js (ASTER_DOCUMENTOS).
(() => {
  const esc = window.escapeHTML;
  const DOCS = window.ASTER_DOCUMENTOS || [];
  const STATUS = { "disponivel": ["Disponível", ""], "parcial": ["Web disponível · PDF em breve", ""], "em-breve": ["Em breve", ""] };
  const acoes = (d) => {
    const out = [];
    if (d.arquivo) out.push(`<a class="btn btn-primary" href="${d.arquivo}" download>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16"/></svg>Baixar PDF</a>`);
    else out.push(`<span class="btn btn-ghost is-disabled" aria-disabled="true">PDF em breve</span>`);
    (d.links || []).forEach(([href, rotulo]) => out.push(`<a class="btn btn-ghost" href="${href}">${esc(rotulo)}</a>`));
    return out.join("");
  };

  const lista = document.getElementById("docs-lista");
  if (lista) {
    lista.innerHTML = DOCS.map((d, i) => `
      <article class="card doc${i === 0 ? " featured" : ""}">
        <div class="doc-icon">${esc(d.tipo.split(" ")[0])}</div>
        <div>
          <h3><a class="doc-link" href="documento.html?id=${d.id}">${esc(d.titulo)}</a>${d.status !== "disponivel" ? ` <span class="tag" style="margin-left:6px">${esc(STATUS[d.status][0])}</span>` : ""}</h3>
          <p>${esc(d.resumo)}</p>
        </div>
        <div class="doc-actions"><a class="btn btn-ghost" href="documento.html?id=${d.id}">Ver detalhes</a></div>
      </article>`).join("");
  }

  const corpo = document.getElementById("doc-corpo");
  if (corpo) {
    const id = new URLSearchParams(location.search).get("id");
    const d = DOCS.find((x) => x.id === id);
    if (!d) {
      document.getElementById("doc-titulo").textContent = "Documento não encontrado";
      corpo.innerHTML = `<p class="empty">Esse documento não existe. <a href="documentos.html">Ver todos os documentos</a>.</p>`;
      return;
    }
    document.title = `${d.titulo} — Aster66`;
    document.getElementById("doc-trilha").textContent = d.titulo;
    document.getElementById("doc-titulo").textContent = d.titulo;
    document.getElementById("doc-resumo").textContent = d.resumo;
    corpo.innerHTML = `
      <div>
        <div class="doc-status"><span class="tag">${esc(d.tipo)}</span> <span class="tag${d.status === "disponivel" ? "" : " tag-red"}">${esc(STATUS[d.status][0])}</span></div>
        <p>${esc(d.descricao)}</p>
        <h3>O que tem dentro</h3>
        <ul class="doc-conteudo">${d.conteudo.map((c) => `<li>${window.linkarTermos(esc(c))}</li>`).join("")}</ul>
        <div class="doc-actions" style="margin-top:28px">${acoes(d)}</div>
      </div>
      <aside class="card card-frame">
        <span class="eyebrow">Outros documentos</span>
        <ul class="doc-outros">${DOCS.filter((x) => x.id !== d.id).map((x) => `<li><a href="documento.html?id=${x.id}">${esc(x.titulo)}</a><span class="dim">${esc(STATUS[x.status][0])}</span></li>`).join("")}</ul>
      </aside>`;
  }
})();
