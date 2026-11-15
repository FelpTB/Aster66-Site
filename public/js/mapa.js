// Mapa interativo de Maresia (página Mundo de Aster).
// A linha do tempo no topo escolhe a época; o mapa muda (fronteiras, territórios sem governo, É-Dingirra).
// Duas camadas sempre visíveis: LOCAIS (Notion › Cenários com Mapa X/Y) e EVENTOS da época (Notion › Lista de Eventos).
// Dados: Supabase (aster.cenarios / aster.eventos); reserva sem conexão: js/data-mapa.js.
// Desenho: img/mapa-maresia.svg (gerado por scripts/gerar-mapa.py). Clicar num país abre a ficha dele.
(() => {
  const DADOS = window.ASTER_MAPA;
  const tela = document.getElementById("mapa-tela");
  if (!DADOS || !tela) return;
  const esc = window.escapeHTML;
  const NS = "http://www.w3.org/2000/svg";
  const ERAS = DADOS.eras;
  const TIPOS = DADOS.tipos;
  const TIPO_POR_NOME = Object.fromEntries(Object.entries(TIPOS).map(([k, [nome]]) => [nome, k]));
  const range = document.getElementById("mapa-era");
  const marcas = document.getElementById("mapa-eras-marcas");
  const painel = document.getElementById("mapa-painel");
  const legenda = document.getElementById("mapa-legenda");
  let svg, camadaEventos, camadaLocais, rotuloEra, eraAtual = ERAS.length - 1;
  let eventosPorEra = new Map(ERAS.map((e) => [e.nome, []]));
  let locais = [];          // { id, nome, abrangencia, x, y, conteudo }
  let locaisPorId = new Map();

  const el = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
  const corDe = (ev) => (TIPOS[ev.tipo] || ["", "#e5a93c"])[1];

  // ---------- Dados: reserva local (data-mapa.js + capitais do SVG) ----------
  function dadosReserva() {
    eventosPorEra = new Map(ERAS.map((e) => [e.nome, e.eventos.map((ev) => ({ ...ev, locaisIds: [] }))]));
  }
  function locaisDoSvg() {
    return [...svg.querySelectorAll("#capitais [data-nome]")].map((c) => ({
      id: "svg-" + c.dataset.nome, nome: c.dataset.nome, abrangencia: "Cidade (Capital)", pais: c.dataset.pais,
      x: +c.getAttribute("cx"), y: +c.getAttribute("cy"), conteudo: "",
    }));
  }

  // ---------- Dados: Supabase ----------
  async function dadosDoBanco() {
    const DB = window.AsterDB;
    if (!DB?.ativo || !DB.tabela) return false;
    try {
      const [evs, cens] = await Promise.all([
        DB.tabela("eventos", "id,nome,descricao,data_inicio,data_fim,epoca,tipo,ordem,mapa_x,mapa_y,rota_no_mapa,locais_relacionados"),
        DB.tabela("cenarios", "id,nome,abrangencia,mapa_x,mapa_y,conteudo"),
      ]);
      if (!evs.length) return false;
      locaisPorId = new Map(cens.map((c) => [c.id, c]));
      locais = cens.filter((c) => c.mapa_x != null && c.mapa_y != null)
        .map((c) => ({ id: c.id, nome: c.nome, abrangencia: c.abrangencia, x: +c.mapa_x, y: +c.mapa_y, conteudo: c.conteudo }));
      const porEra = new Map(ERAS.map((e) => [e.nome, []]));
      for (const e of evs) {
        if (!porEra.has(e.epoca)) continue;
        const tipoNome = Array.isArray(e.tipo) ? e.tipo[0] : e.tipo;
        const rel = (e.locais_relacionados || []).map((id) => locaisPorId.get(id)).filter(Boolean);
        porEra.get(e.epoca).push({
          titulo: e.nome, texto: e.descricao || "", tipo: TIPO_POR_NOME[tipoNome] || "", ordem: e.ordem ?? 999,
          x: e.mapa_x != null ? +e.mapa_x : null, y: e.mapa_y != null ? +e.mapa_y : null,
          inicio: e.data_inicio || "", fim: e.data_fim || "",
          rota: e.rota_no_mapa ? e.rota_no_mapa.split(";").map((p) => p.split(",").map(Number)).filter((p) => p.length === 2 && p.every(Number.isFinite)) : null,
          locaisIds: rel.map((c) => c.id), local: rel.find((c) => c.abrangencia === "País")?.nome || rel[0]?.nome || "",
        });
      }
      for (const lista of porEra.values()) lista.sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo, "pt-BR"));
      eventosPorEra = porEra;
      return true;
    } catch (err) {
      console.warn("Mapa: usando dados locais —", err.message);
      return false;
    }
  }

  // ---------- Linha do tempo ----------
  range.max = ERAS.length - 1;
  marcas.innerHTML = ERAS.map((e, i) => `
    <li><button type="button" data-era="${i}"><span class="mapa-era-nome">${esc(e.nome)}</span><span class="mapa-era-curto">${esc(e.curto || e.nome)}</span></button></li>`).join("");
  marcas.style.setProperty("--n", ERAS.length);
  marcas.addEventListener("click", (e) => { const b = e.target.closest("[data-era]"); if (b) mudarEra(+b.dataset.era); });
  range.addEventListener("input", () => mudarEra(+range.value));

  legenda.innerHTML = `<span><i class="leg-local"></i>Local</span>` +
    Object.entries(TIPOS).map(([, [nome, cor]]) => `<span><i style="--cor:${cor}"></i>${esc(nome)}</span>`).join("") +
    `<span><i class="leg-sem-estado"></i>Sem governo</span><span><i class="leg-edingirra"></i>É-Dingirra</span>`;

  // ---------- Carregar o SVG e os dados ----------
  dadosReserva();
  Promise.all([fetch("img/mapa-maresia.svg").then((r) => r.text()), dadosDoBanco()]).then(([texto, doBanco]) => {
    tela.innerHTML = texto;
    svg = tela.querySelector("svg");
    svg.classList.add("mapa-svg", "com-locais");
    svg.setAttribute("viewBox", "70 96 1010 810");
    svg.querySelector("title")?.remove();
    if (!doBanco || !locais.length) locais = locaisDoSvg();
    // hachura para territórios sem governo
    const defs = svg.querySelector("defs");
    defs.insertAdjacentHTML("beforeend", `<pattern id="hachura-mapa" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="7" height="7" fill="#16161b"/><line x1="0" y1="0" x2="0" y2="7" stroke="#e5a93c" stroke-opacity=".22" stroke-width="2.4"/></pattern>`);
    // Na era de Édin, o coração do reino ainda está ligado ao continente: uma ponte de terra que some depois da queda.
    const ilhas = svg.querySelector("#edingirra");
    ilhas?.prepend(el("path", { class: "edingirra-ponte", d: "M404 536 C 470 548, 560 556, 612 574 C 660 600, 700 660, 760 690 L 846 704 C 860 740, 840 770, 790 790 L 748 868 C 700 900, 600 900, 540 892 C 460 896, 390 890, 360 860 C 330 820, 290 790, 296 740 C 300 700, 340 640, 380 600 C 396 580, 400 560, 404 536Z" }));
    camadaLocais = el("g", { id: "locais" });
    camadaEventos = el("g", { id: "eventos" });
    rotuloEra = el("text", { class: "rotulo-era", "text-anchor": "middle" });
    svg.append(rotuloEra, camadaLocais, camadaEventos);
    desenharLocais();
    svg.addEventListener("click", cliqueNoMapa);
    svg.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.closest(".evento, .local")) { e.preventDefault(); cliqueNoMapa(e); }
    });
    const pedida = ERAS.findIndex((e) => location.hash === "#mapa-" + e.id);
    mudarEra(pedida >= 0 ? pedida : eraAtual);
  }).catch(() => { tela.innerHTML = `<p class="empty">Não foi possível carregar o mapa.</p>`; });

  // ---------- Camada de locais (todas as épocas) ----------
  function desenharLocais() {
    camadaLocais.innerHTML = "";
    locais.forEach((l, k) => {
      const g = el("g", { class: "local", "data-l": k, tabindex: "0", role: "button", "aria-label": l.nome, transform: `translate(${l.x} ${l.y})` });
      g.append(el("rect", { class: "local-marca", x: -4.5, y: -4.5, width: 9, height: 9, transform: "rotate(45)" }));
      const t = el("text", { class: "local-nome", x: 8, y: 3.5 }); t.textContent = l.nome;
      const tt = el("title"); tt.textContent = l.nome;
      g.append(t, tt);
      camadaLocais.append(g);
    });
  }

  // ---------- Trocar de época ----------
  const eventosDa = (era) => eventosPorEra.get(era.nome) || [];
  function mudarEra(i) {
    eraAtual = i;
    const era = ERAS[i];
    range.value = i;
    range.setAttribute("aria-valuetext", era.nome);
    range.style.setProperty("--pct", `${(i / (ERAS.length - 1)) * 100}%`);
    marcas.querySelectorAll("[data-era]").forEach((b) => b.setAttribute("aria-current", String(+b.dataset.era === i)));
    renderPainel(era);
    if (!svg) return;

    svg.classList.toggle("unificado", !!era.unificado);
    svg.dataset.edingirra = era.edingirra || "corrompida";
    const estados = era.estados || {};
    svg.querySelectorAll("#paises [data-nome]").forEach((p) => p.classList.toggle("sem-estado", (estados[p.dataset.nome] || [])[0] === "sem-estado"));
    svg.querySelectorAll("#rotulos [data-pais]").forEach((t) =>
      t.classList.toggle("sem-estado", (estados[t.dataset.pais] || [])[0] === "sem-estado"));

    rotuloEra.textContent = era.rotulo ? era.rotulo.texto : "";
    if (era.rotulo) { rotuloEra.setAttribute("x", era.rotulo.x); rotuloEra.setAttribute("y", era.rotulo.y); }

    camadaEventos.innerHTML = "";
    eventosDa(era).forEach((ev, k) => {
      if (ev.x == null || ev.y == null) return; // evento sem posição: só na lista
      const cor = corDe(ev);
      if (ev.rota?.length > 1) camadaEventos.append(el("path", { class: "rota", d: "M" + ev.rota.map((p) => p.join(" ")).join(" L"), stroke: cor }));
      const g = el("g", { class: "evento", "data-k": k, tabindex: "0", role: "button", "aria-label": ev.titulo, transform: `translate(${ev.x} ${ev.y})`, style: `--cor:${cor};--atraso:${k * 45}ms` });
      g.append(el("circle", { class: "evento-halo", r: 15 }), el("circle", { class: "evento-ponto", r: 9 }));
      const n = el("text", { class: "evento-num", "text-anchor": "middle", "dominant-baseline": "central" }); n.textContent = k + 1;
      const t = el("title"); t.textContent = ev.titulo;
      g.append(n, t);
      camadaEventos.append(g);
    });
    if (location.hash.startsWith("#mapa")) history.replaceState(null, "", "#mapa-" + era.id);
  }

  function renderPainel(era) {
    const evs = eventosDa(era);
    painel.innerHTML = `
      <span class="eyebrow">Época ${eraAtual + 1} de ${ERAS.length}</span>
      <h3>${esc(era.nome)}</h3>
      <p class="dim">${window.linkarTermos(esc(era.resumo))}</p>
      <ol class="mapa-eventos">${evs.map((ev, k) => `
        <li><button type="button" data-k="${k}" style="--cor:${corDe(ev)}"${ev.x == null ? ` class="sem-posicao" title="Sem posição no mapa"` : ""}>
          <span class="num">${k + 1}</span><span><b>${esc(ev.titulo)}</b><small>${esc([ev.inicio, ev.local].filter(Boolean).join(" · "))}</small></span></button></li>`).join("")}</ol>`;
  }
  painel.addEventListener("click", (e) => { const b = e.target.closest("[data-k]"); if (b) abrirEvento(+b.dataset.k); });
  painel.addEventListener("mouseover", (e) => destacar(e.target.closest("[data-k]")?.dataset.k));
  painel.addEventListener("mouseout", () => destacar(null));
  function destacar(k) { camadaEventos?.querySelectorAll(".evento").forEach((g) => g.classList.toggle("destaque", g.dataset.k === k)); }

  // ---------- Cliques no mapa ----------
  function cliqueNoMapa(e) {
    const ev = e.target.closest(".evento");
    if (ev) return abrirEvento(+ev.dataset.k);
    const local = e.target.closest(".local");
    if (local) return abrirLocal(locais[+local.dataset.l]);
    if (e.target.closest("#edingirra")) return abrirEdingirra();
    const pais = e.target.closest("#paises [data-nome]");
    if (!pais) return;
    const nome = pais.dataset.nome, era = ERAS[eraAtual];
    if (era.unificado) {
      return window.abrirModal(`<span class="eyebrow">${esc(era.nome)}</span><h2 style="margin:0 0 .5em">${esc(nome)}</h2>
        <p class="dim">Nesta época, estas terras ainda fazem parte do Reino de É-Dingirra — o país de ${esc(nome)} só surge depois da queda.</p>
        <p><button class="btn btn-ghost btn-small" type="button" data-ver-pais="${esc(nome)}">Ver ${esc(nome)} hoje</button></p>`);
    }
    const estado = (era.estados || {})[nome];
    if (estado && estado[0] === "sem-estado") {
      return window.abrirModal(`<span class="eyebrow">${esc(era.nome)} · sem governo</span><h2 style="margin:0 0 .5em">${esc(nome)}</h2>
        <p>${window.linkarTermos(esc(estado[1]))}</p>
        <p><button class="btn btn-ghost btn-small" type="button" data-ver-pais="${esc(nome)}">Ver ${esc(nome)} hoje</button></p>`);
    }
    if (!window.abrirPaisMundo(nome)) window.abrirModal(`<h2>${esc(nome)}</h2><p class="dim">Ainda não há texto sobre este país.</p>`);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ver-pais]");
    if (b) return window.abrirPaisMundo(b.dataset.verPais);
    const l = e.target.closest("[data-ver-local]");
    if (l) abrirLocal(locais.find((x) => x.id === l.dataset.verLocal) || locaisPorId.get(l.dataset.verLocal));
    const ev = e.target.closest("[data-ver-evento]");
    if (ev) { const [i, k] = ev.dataset.verEvento.split(":").map(Number); mudarEra(i); abrirEvento(k); }
  });

  function abrirEvento(k) {
    const era = ERAS[eraAtual], ev = eventosDa(era)[k];
    if (!ev) return;
    const [tipo, cor] = TIPOS[ev.tipo] || ["Evento", "#e5a93c"];
    const datas = ev.inicio ? (ev.fim && ev.fim !== ev.inicio ? `${ev.inicio} – ${ev.fim}` : ev.inicio) : "";
    const rel = ev.locaisIds.map((id) => locaisPorId.get(id)).filter(Boolean);
    const ehPais = !rel.length && ev.local && ev.local !== "É-Dingirra";
    window.abrirModal(`
      <span class="eyebrow">${esc(era.nome)} · <span style="color:${cor}">${esc(tipo)}</span>${datas ? ` · ${esc(datas)}` : ""}</span>
      <h2 style="margin:0 0 .5em">${esc(ev.titulo)}</h2>
      <div class="md">${window.mdHTML(ev.texto, { termos: true })}</div>
      ${rel.length ? `<p class="mapa-rel"><span class="rotulo">Locais</span> ${rel.map((c) => `<button class="chip" type="button" ${c.abrangencia === "País" ? `data-ver-pais="${esc(c.nome)}"` : `data-ver-local="${c.id}"`}>${esc(c.nome)}</button>`).join(" ")}</p>` : ""}
      ${ehPais ? `<p style="margin-top:1.2em"><button class="btn btn-ghost btn-small" type="button" data-ver-pais="${esc(ev.local)}">Sobre ${esc(ev.local)} →</button></p>` : ""}`);
  }

  function abrirLocal(l) {
    if (!l) return;
    // Eventos ligados a este local, em todas as épocas.
    const ligados = [];
    ERAS.forEach((era, i) => eventosDa(era).forEach((ev, k) => { if (ev.locaisIds.includes(l.id)) ligados.push([i, k, era, ev]); }));
    const pais = l.pais || "";
    window.abrirModal(`
      <span class="eyebrow">Local${l.abrangencia ? ` · ${esc(l.abrangencia)}` : ""}</span>
      <h2 style="margin:0 0 .5em">${esc(l.nome)}</h2>
      ${l.conteudo ? `<div class="md">${window.mdHTML(l.conteudo, { termos: true })}</div>` : `<p class="dim">Ainda não há texto sobre este local.</p>`}
      ${ligados.length ? `<h3 style="font-size:1.2rem;margin-top:1.2em">Eventos</h3><ul class="mapa-ligados">${ligados.map(([i, k, era, ev]) =>
        `<li><button class="linkish" type="button" data-ver-evento="${i}:${k}">${esc(ev.titulo)}</button> <small class="dim">${esc(era.nome)}</small></li>`).join("")}</ul>` : ""}
      ${pais ? `<p><button class="btn btn-ghost btn-small" type="button" data-ver-pais="${esc(pais)}">Sobre ${esc(pais)} →</button></p>` : ""}`);
  }

  function abrirEdingirra() {
    const era = ERAS[eraAtual];
    const texto = era.edingirra === "terra"
      ? "O coração do Reino de É-Dingirra, a terra dos deuses, ainda ligado ao continente."
      : "O antigo coração do reino, arrancado do continente na queda de Édin e partido em ilhas gigantescas — quase metade do tamanho do resto de Maresia. A corrupção mágica tornou o clima, o relevo e a geologia imprevisíveis, e criaturas mágicas desconhecidas tomam todo o território. Só a comitiva do rei Arthur voltou de lá.";
    window.abrirModal(`<span class="eyebrow">${esc(era.nome)}</span><h2 style="margin:0 0 .5em">${era.edingirra === "terra" ? "É-Dingirra" : "Arquipélago de É-Dingirra"}</h2><div class="md">${window.mdHTML(texto, { termos: true })}</div>`);
  }
})();
