// Catálogo genérico (busca + filtros + janela de detalhes) para tabelas do esquema `aster`.
// Usado em Personagens, Bestiário, Itens e Locais. Depende de common.js, db.js e personas.js.
//
//   CatalogoSimples.montar(elemento, {
//     carregar: async () => linhas,          // de onde vêm os dados
//     sub: (x) => "texto curto",             // subtítulo do card
//     filtros: [{ rotulo, valores: (x) => [] }],
//     ficha: (x) => [["Rótulo", "valor"]],   // dados técnicos na janela
//     termos: true,                          // liga os termos do texto ao Sumário
//     rotulo: "item"/"itens",                // para a contagem
//   })
window.CatalogoSimples = (() => {
  const esc = window.escapeHTML;
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const lista = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]).map(String).filter(Boolean);
  const resumoDe = (x) => window.AsterDB.mdTexto(x.conteudo || "").replace(/^Página original:.*$/gm, "").replace(/\s+/g, " ").trim().slice(0, 160);

  function montar(raiz, opcoes) {
    const { carregar, sub = () => "", filtros = [], ficha = () => [], termos = false, rotulo = ["item", "itens"], simbolo } = opcoes;
    const PASSO = 60;
    let DADOS = [], visiveis = [], limite = PASSO;

    raiz.innerHTML = `
      <div class="filtros" role="search">
        <div class="linha">
          <input class="input" type="search" data-cs="busca" placeholder="Buscar por nome ou texto…" aria-label="Buscar" style="flex:1;min-width:220px">
          <button class="btn btn-ghost btn-small" type="button" data-cs="limpar">Limpar filtros</button>
        </div>
        ${filtros.length ? `<div class="linha">${filtros.map((f, i) => `<select class="select" data-cs-filtro="${i}" aria-label="${esc(f.rotulo)}"><option value="">${esc(f.rotulo)}: todos</option></select>`).join("")}</div>` : ""}
      </div>
      <p class="dim" data-cs="contagem" style="font-size:.9rem"></p>
      <div class="entidades" data-cs="lista"><p class="empty">Carregando…</p></div>
      <div style="text-align:center;margin-top:28px"><button class="btn btn-ghost" type="button" data-cs="mais" hidden>Mostrar mais</button></div>`;
    const $ = (n) => raiz.querySelector(`[data-cs="${n}"]`);
    const selects = [...raiz.querySelectorAll("[data-cs-filtro]")];

    function preencher() {
      selects.forEach((sel, i) => {
        const valores = [...new Set(DADOS.flatMap((x) => lista(filtros[i].valores(x))))].sort((a, b) => a.localeCompare(b, "pt", { numeric: true }));
        sel.insertAdjacentHTML("beforeend", valores.map((v) => `<option>${esc(v)}</option>`).join(""));
      });
    }

    function render() {
      const q = norm($("busca").value.trim());
      visiveis = DADOS.filter((x) =>
        (!q || norm(x.nome + " " + x.conteudo + " " + sub(x)).includes(q)) &&
        selects.every((sel, i) => !sel.value || lista(filtros[i].valores(x)).includes(sel.value)));
      $("contagem").textContent = DADOS.length ? `${visiveis.length} de ${DADOS.length} ${DADOS.length === 1 ? rotulo[0] : rotulo[1]}` : "";
      $("lista").innerHTML = visiveis.slice(0, limite).map((x, i) => window.AsterUI.cardEntidade({
        idx: i, simbolo: simbolo ? simbolo(x) : (x.icone && x.icone.length <= 4 ? esc(x.icone) : window.monograma(x.nome)),
        nome: x.nome, sub: sub(x), texto: resumoDe(x),
      })).join("") || `<p class="empty">${DADOS.length ? "Nada encontrado com esses filtros." : "Ainda não há nada neste catálogo."}</p>`;
      $("mais").hidden = visiveis.length <= limite;
    }

    function abrir(x) {
      const linhas = ficha(x).filter(([, v]) => lista(v).length);
      window.abrirModal(`
        ${window.AsterUI.cabecaModal(x.icone && x.icone.length <= 4 ? esc(x.icone) : window.monograma(x.nome), x.nome, sub(x))}
        ${linhas.length ? `<dl class="ficha-simples">${linhas.map(([r, v]) => `<dt>${esc(r)}</dt><dd>${window.linkarTermos(esc(lista(v).join(", ")))}</dd>`).join("")}</dl>` : ""}
        <div class="md">${window.mdHTML(x.conteudo, { termos }) || '<p class="dim">Sem descrição.</p>'}</div>`, { largo: true });
    }

    $("busca").addEventListener("input", () => { limite = PASSO; render(); });
    selects.forEach((s) => s.addEventListener("change", () => { limite = PASSO; render(); }));
    $("limpar").addEventListener("click", () => { $("busca").value = ""; selects.forEach((s) => (s.value = "")); limite = PASSO; render(); });
    $("mais").addEventListener("click", () => { limite += PASSO; render(); });
    $("lista").addEventListener("click", (e) => { const b = e.target.closest("[data-idx]"); if (b) abrir(visiveis[+b.dataset.idx]); });

    if (!window.AsterDB.ativo) { $("lista").innerHTML = `<p class="empty">O banco de dados não está configurado neste site.</p>`; return; }
    carregar().then((d) => { DADOS = d || []; preencher(); render(); })
      .catch((e) => { $("lista").innerHTML = `<p class="empty">Não foi possível carregar: ${esc(e.message)}</p>`; });
  }

  return { montar };
})();
