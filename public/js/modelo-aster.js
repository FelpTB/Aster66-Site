// Modelo do sistema de Aster (Sumário › Aster no Notion), interativo.
//
// Regras do modelo:
//  • Dia de 22 h · mês de 28 dias · ano de 13 meses (364 dias).
//  • Hexênio = 6 anos. Ao fim de cada hexênio há a Travessia: 14 dias sem data
//    (Preparação · Provação · Recomeço), em que as luas trocam de órbita.
//  • Hexênios se alternam: de Albedo (de Mattiya) e de Nigredo (de Ah-Rimã) — 12 anos no ciclo completo.
//    No hexênio de uma lua, é ela que ocupa a órbita interna.
//  • As luas se encontram exatamente a cada 78 meses (a lua externa dá 78,5 voltas sinódicas por hexênio,
//    a interna uma a mais). O encontro acontece no ápice da Travessia: Nigredo passa à frente de Albedo e
//    forma o grande anel no céu noturno.
//  • Troca Simples: o encontro acontece em ângulo reto com o Sol. A cada terceira troca (18 anos) é o
//    Grande Alinhamento: Sol, planeta e as duas luas na mesma linha (eclipse duplo, supermarés).
//  • Alinhamento Comum: duas vezes por ano, perto dos solstícios (dias 91 e 273), quando as luas cruzam a
//    linha Sol–planeta, ainda separadas.
(() => {
  const C = window.ASTER_CEU;
  const raiz = document.getElementById("modelo-aster");
  if (!C || !raiz) return;
  const esc = window.escapeHTML;
  const TAU = Math.PI * 2;

  // ---------- Calendário ----------
  const ANO = 364, MES = 28, TRAV = 14, HEX = 6 * ANO + TRAV;   // 2198 dias por hexênio
  const APEX = 6 * ANO + 7;                                      // ápice da Travessia (meio dos 14 dias)
  const P_EXT = MES;                                             // lua externa: 28 dias (sinódico)
  const P_INT = 1 / (1 / MES + 1 / HEX);                         // lua interna: uma volta a mais por hexênio
  const PARTES = [[0, 5], [5, 9], [9, 14]];                      // dias da Travessia em cada parte

  function data(D) {
    D = Math.floor(D);
    const h = Math.floor(D / HEX), r = D - h * HEX;
    const base = { D, h, hexenio: h + 1, deAlbedo: h % 2 === 0 };
    if (r >= 6 * ANO) {
      const t = r - 6 * ANO;
      const parte = PARTES.findIndex(([a, b]) => t >= a && t < b);
      return { ...base, travessia: true, t, parte, ano: h * 6 + 6 };
    }
    const anoHex = Math.floor(r / ANO), doy = r % ANO;
    const mes = Math.floor(doy / MES) + 1;
    return { ...base, travessia: false, ano: h * 6 + anoHex + 1, anoHex: anoHex + 1, doy, mes, dia: (doy % MES) + 1, mesHex: anoHex * 13 + mes };
  }
  const diaAbs = (ano, mes, dia) => {
    const h = Math.floor((ano - 1) / 6), anoHex = (ano - 1) % 6;
    return h * HEX + anoHex * ANO + (mes - 1) * MES + (dia - 1);
  };
  const apex = (h) => h * HEX + APEX;
  const ehGrande = (h) => (h + 1) % 3 === 0;                     // 3ª, 6ª, 9ª… Travessia (anos 18, 36, 54…)
  const angEncontro = (h) => (ehGrande(h) ? Math.PI : Math.PI / 2); // Grande: em linha (oposto ao Sol) · Simples: 90°
  const wrap = (a) => { a = ((a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a === -Math.PI ? Math.PI : a; };

  // ψ = ângulo da lua medido a partir da direção do Sol (0 = entre o Sol e o planeta; π = cheia/oposta).
  function luas(D) {
    const hp = Math.floor((D - APEX) / HEX);                    // último encontro antes de D (pode ser -1)
    const t = D - apex(hp);
    const a = angEncontro(hp), b = angEncontro(hp + 1);
    const ajuste = wrap(b - a - Math.PI) * (t / HEX);           // pequena deriva para cair no próximo encontro
    const ext = a + TAU * t / P_EXT + ajuste;
    const int = a + TAU * t / P_INT + ajuste;
    const hexDaVez = hp + 1;                                     // a troca no encontro define quem fica dentro
    const albedoDentro = hexDaVez % 2 === 0;
    return {
      albedo: albedoDentro ? int : ext, nigredo: albedoDentro ? ext : int,
      albedoDentro, interna: int, externa: ext,
    };
  }
  // Ângulo do planeta em torno de Rubedo (o ano começa no equinócio de primavera, logo após a Travessia).
  function anguloAster(D) {
    const d = data(D), frac = D - Math.floor(D);
    // Na Travessia (dias sem data) o planeta fica no equinócio: anda só o equivalente a 1 dia em 14.
    if (d.travessia) return TAU * (ANO - 1 + (d.t + frac) / TRAV) / ANO;
    return TAU * (d.doy + frac) / ANO;
  }

  // Alinhamentos comuns: o cruzamento da linha Sol–planeta mais próximo dos solstícios (dias 91 e 273).
  function alinhamentoPerto(D0) {
    let melhor = null;
    for (let d = D0 - 9; d <= D0 + 9; d += 0.25) {
      const s = Math.abs(Math.sin(luas(d).externa));
      if (!melhor || s < melhor.s) melhor = { d, s };
    }
    return Math.round(melhor.d);
  }
  function proximosAlinhamentos(D, n = 1) {
    const out = [];
    const ano0 = data(D).ano;
    for (let ano = Math.max(1, ano0 - 1); out.length < n && ano < ano0 + 30; ano++) {
      for (const doy of [90, 272]) {
        const dia = alinhamentoPerto(diaAbs(ano, 1, 1) + doy);
        if (dia >= Math.floor(D) && !data(dia).travessia) out.push(dia);
        if (out.length >= n) break;
      }
    }
    return out;
  }
  function ehAlinhamentoComum(D) {
    const d = Math.floor(D);
    return proximosAlinhamentos(d - 1, 2).includes(d);
  }
  function proximaTravessia(D) {
    const d = data(D);
    const h = d.travessia ? d.h + 1 : d.h;
    const inicio = h * HEX + 6 * ANO;
    return { inicio, grande: ehGrande(h), ano: h * 6 + 6 };
  }

  // ---------- Interface ----------
  raiz.innerHTML = `
    <div class="modelo-controles">
      <div class="modelo-data">
        <label>Dia<input class="input" type="number" id="md-dia" min="1" max="28"></label>
        <label>Mês<select class="select" id="md-mes">${C.meses.map((m, i) => `<option value="${i + 1}">${i + 1} · ${esc(m.nome)}</option>`).join("")}<option value="T">Travessia</option></select></label>
        <label>Ano<input class="input" type="number" id="md-ano" min="1" max="99999"></label>
      </div>
      <div class="modelo-botoes">
        <button class="btn btn-ghost btn-small" type="button" data-passo="-28" title="Voltar 1 mês">−1 mês</button>
        <button class="btn btn-ghost btn-small" type="button" data-passo="-1" title="Voltar 1 dia">−1 dia</button>
        <button class="btn btn-primary btn-small" type="button" id="md-play" aria-pressed="false">▶ Animar</button>
        <button class="btn btn-ghost btn-small" type="button" data-passo="1" title="Avançar 1 dia">+1 dia</button>
        <button class="btn btn-ghost btn-small" type="button" data-passo="28" title="Avançar 1 mês">+1 mês</button>
        <select class="select" id="md-vel" aria-label="Velocidade">
          <option value="2">2 dias/s</option><option value="14" selected>2 semanas/s</option><option value="91">1 estação/s</option><option value="364">1 ano/s</option>
        </select>
      </div>
      <div class="modelo-saltos">
        <span class="rotulo">Ir para</span>
        <button class="chip" type="button" data-ir="alinhamento">Próximo alinhamento comum</button>
        <button class="chip" type="button" data-ir="travessia">Próxima Travessia</button>
        <button class="chip" type="button" data-ir="grande">Próximo Grande Alinhamento</button>
      </div>
      <div class="modelo-linha">
        <input type="range" id="md-ciclo" min="0" max="${3 * HEX - 1}" step="1" aria-label="Posição no ciclo de 18 anos">
        <div class="modelo-linha-marcas" id="md-marcas"></div>
      </div>
    </div>
    <div class="modelo-corpo">
      <figure class="modelo-orbita">
        <svg viewBox="0 0 600 600" id="md-svg" role="img" aria-label="Rubedo no centro, Aster em órbita e as duas luas ao redor de Aster">
          <defs>
            <radialGradient id="md-rub"><stop offset="0" stop-color="#ff8a3d"/><stop offset=".55" stop-color="#C91D2E"/><stop offset="1" stop-color="#C91D2E" stop-opacity="0"/></radialGradient>
          </defs>
          <circle cx="300" cy="300" r="225" fill="none" stroke="#E5A93C" stroke-opacity=".28" stroke-dasharray="2 6"/>
          <circle cx="300" cy="300" r="70" fill="url(#md-rub)" opacity=".5"/>
          <circle cx="300" cy="300" r="30" fill="#C91D2E" stroke="#E5A93C" stroke-width="1.5"/>
          <text x="300" y="350" class="md-rotulo" text-anchor="middle">Rubedo</text>
          <line id="md-linha-sol" stroke="#E5A93C" stroke-opacity=".35" stroke-dasharray="3 4"/>
          <g id="md-aster">
            <circle id="md-orb-int" r="38" fill="none" stroke="#ffffff" stroke-opacity=".18"/>
            <circle id="md-orb-ext" r="58" fill="none" stroke="#ffffff" stroke-opacity=".18"/>
            <circle r="14" fill="#d9a441" stroke="#08080A" stroke-width="1.5"/>
            <path id="md-noite" fill="#08080A" fill-opacity=".55"/>
            <text id="md-rot-aster" class="md-rotulo" text-anchor="middle" y="-70">Aster</text>
            <g id="md-albedo"><circle r="8" fill="#ffffff"/></g>
            <g id="md-nigredo"><circle r="7.5" fill="#08080A" stroke="#E5A93C" stroke-width="1.4"/></g>
          </g>
          <text id="md-aviso" x="300" y="585" text-anchor="middle" class="md-aviso"></text>
        </svg>
        <figcaption class="dim">Visto de cima, fora de escala: as órbitas das luas estão ampliadas.</figcaption>
      </figure>
      <div class="modelo-info">
        <div class="modelo-ceu">
          <svg viewBox="0 0 200 120" id="md-ceu" aria-label="Céu noturno visto de Aster">
            <rect width="200" height="120" rx="8" fill="#0b0b12"/>
            <g id="md-estrelas"></g>
            <g id="md-ceu-luas"></g>
            <path d="M0 108 Q 50 98 100 106 T 200 102 V120 H0Z" fill="#08080A"/>
          </svg>
          <div><span class="eyebrow">Céu noturno</span><p id="md-fase" class="dim"></p></div>
        </div>
        <dl id="md-dados"></dl>
        <div id="md-mes-info" class="modelo-mes"></div>
      </div>
    </div>`;

  const $ = (id) => raiz.querySelector("#" + id);
  const svg = $("md-svg");
  let D = diaAbs(1, 1, 1), tocando = false, ultimo = 0;

  // estrelas fixas do céu noturno
  $("md-estrelas").innerHTML = Array.from({ length: 34 }, (_, i) => {
    const x = (i * 53.7) % 200, y = (i * 29.3) % 96;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 5 ? .5 : .9}" fill="#fff" opacity="${.3 + (i % 4) * .15}"/>`;
  }).join("");

  // marcas do ciclo de 18 anos: as três Travessias
  $("md-marcas").innerHTML = [0, 1, 2].map((k) => {
    const pos = (k * HEX + 6 * ANO + 7) / (3 * HEX) * 100;
    return `<span style="left:${pos}%" class="${k === 2 ? "grande" : ""}" title="${k === 2 ? "Grande Alinhamento" : "Troca Simples"}">${k === 2 ? "Grande" : "Troca"}</span>`;
  }).join("") + [0, 1, 2].map((k) => `<span class="hex ${k % 2 ? "nig" : "alb"}" style="left:${(k * HEX) / (3 * HEX) * 100}%;width:${(6 * ANO) / (3 * HEX) * 100}%"></span>`).join("");

  // Fase de uma lua vista de Aster (ψ: 0 nova, π cheia).
  function fasePath(psi, r) {
    const k = Math.cos(psi);                      // 1 = nova, -1 = cheia
    const crescente = Math.sin(psi) > 0;
    const rx = Math.abs(k) * r;
    // metade iluminada + elipse do terminador
    const lado = crescente ? 1 : 0;
    const sweep = k > 0 ? (crescente ? 0 : 1) : (crescente ? 1 : 0);
    return `M0 ${-r} A ${r} ${r} 0 0 ${lado} 0 ${r} A ${rx} ${r} 0 0 ${sweep} 0 ${-r}Z`;
  }
  const nomeFase = (psi) => {
    const a = ((psi % TAU) + TAU) % TAU, g = a * 180 / Math.PI;
    if (g < 12 || g > 348) return "nova";
    if (g < 80) return "crescente";
    if (g < 100) return "quarto crescente";
    if (g < 168) return "crescente gibosa";
    if (g < 192) return "cheia";
    if (g < 260) return "minguante gibosa";
    if (g < 280) return "quarto minguante";
    return "minguante";
  };

  function desenhar() {
    const d = data(D), L = luas(D);
    const phi = anguloAster(D);
    const ax = 300 + 225 * Math.cos(phi), ay = 300 - 225 * Math.sin(phi);
    const sol = Math.atan2(300 - ay, 300 - ax);                // direção Aster → Rubedo (tela)
    $("md-aster").setAttribute("transform", `translate(${ax.toFixed(2)} ${ay.toFixed(2)})`);
    const ln = $("md-linha-sol");
    ln.setAttribute("x1", 300); ln.setAttribute("y1", 300);
    ln.setAttribute("x2", (300 + (ax - 300) * 1.32).toFixed(1)); ln.setAttribute("y2", (300 + (ay - 300) * 1.32).toFixed(1));
    // lado noturno do planeta (oposto ao Sol)
    const nx = Math.cos(sol + Math.PI / 2) * 14, ny = Math.sin(sol + Math.PI / 2) * 14;
    $("md-noite").setAttribute("d", `M${nx.toFixed(2)} ${ny.toFixed(2)} A14 14 0 0 1 ${(-nx).toFixed(2)} ${(-ny).toFixed(2)}Z`);
    const pos = (psi, r) => [r * Math.cos(sol - psi), r * Math.sin(sol - psi)];
    const [bx, by] = pos(L.albedo, L.albedoDentro ? 38 : 58);
    const [nx2, ny2] = pos(L.nigredo, L.albedoDentro ? 58 : 38);
    $("md-albedo").setAttribute("transform", `translate(${bx.toFixed(2)} ${by.toFixed(2)})`);
    $("md-nigredo").setAttribute("transform", `translate(${nx2.toFixed(2)} ${ny2.toFixed(2)})`);
    $("md-orb-int").setAttribute("stroke", L.albedoDentro ? "#ffffff" : "#E5A93C");
    $("md-orb-ext").setAttribute("stroke", L.albedoDentro ? "#E5A93C" : "#ffffff");

    // Estado especial do dia
    const comum = !d.travessia && ehAlinhamentoComum(D);
    let aviso = "";
    if (d.travessia) aviso = `${C.travessia.partes[d.parte][0]} da Travessia — ${ehGrande(d.h) ? "Grande Alinhamento" : "Troca Simples"}`;
    else if (comum) aviso = "Alinhamento Comum — marés vivas e eclipse simples";
    $("md-aviso").textContent = aviso;
    svg.classList.toggle("alinhado", !!aviso);

    // Céu noturno: Albedo com fase; Nigredo invisível, exceto quando passa à frente de Albedo (anel).
    const sep = Math.abs(wrap(L.albedo - L.nigredo));
    const anel = d.travessia && d.parte === 1 && sep < 0.35;
    const xa = 100 - Math.sin(wrap(L.albedo - Math.PI)) * 60, xn = 100 - Math.sin(wrap(L.nigredo - Math.PI)) * 60;
    const raioA = L.albedoDentro ? 14 : 10;
    const visivel = Math.cos(L.albedo) < 0.55;                 // longe do Sol: aparece no céu noturno
    $("md-ceu-luas").innerHTML = (visivel ? `
      <g transform="translate(${xa.toFixed(1)} 52)">
        <circle r="${raioA}" fill="#1b1b24"/>
        <path d="${fasePath(L.albedo, raioA)}" fill="#f4f1ea"/>
        ${anel ? `<circle r="${raioA + 3.5}" fill="none" stroke="#fff6dd" stroke-width="2.4" opacity=".9"/><circle r="${raioA - .5}" fill="#08080A"/>` : ""}
      </g>` : "") +
      (!anel && sep < 0.5 && visivel ? `<circle cx="${xn.toFixed(1)}" cy="52" r="${L.albedoDentro ? 10 : 14}" fill="#08080A" opacity=".85"/>` : "");
    const pct = Math.round((1 - Math.cos(L.albedo)) / 2 * 100);
    $("md-fase").innerHTML = anel
      ? "<b>O grande anel:</b> Nigredo passa à frente de Albedo e só a borda branca brilha no céu."
      : visivel
        ? `Albedo ${nomeFase(L.albedo)} (${pct}% iluminada)${L.albedoDentro ? ", grande e próxima" : ", mais distante"}. Nigredo segue invisível.`
        : `Albedo está ${nomeFase(L.albedo)}, perto de Rubedo, e não aparece à noite. Nigredo segue invisível.`;

    // Dados
    const prox = proximaTravessia(D), alin = proximosAlinhamentos(D + (comum ? 1 : 0), 1)[0];
    const em = (x) => { const n = x - Math.floor(D); return n <= 0 ? "hoje" : n === 1 ? "amanhã" : `em ${n.toLocaleString("pt-BR")} dias`; };
    const hexNome = `${d.hexenio}º Hexênio de ${d.deAlbedo ? "Mattiya (Albedo)" : "Ah-Rimã (Nigredo)"}`;
    const geral = d.travessia ? `Travessia, dia ${d.t + 1} de 14 · após o Ano ${d.ano}` : `Dia ${d.dia} / Mês ${d.mes} (${C.meses[d.mes - 1].nome}) / Ano ${d.ano}`;
    const elitiano = d.travessia ? `Travessia do ${hexNome}` : `Dia ${d.dia} / Mês ${d.mesHex} de 78 / ${hexNome}`;
    $("md-dados").innerHTML = `
      <dt>Contagem geral</dt><dd>${esc(geral)}</dd>
      <dt>Calendário Elitiano</dt><dd>${esc(elitiano)}</dd>
      <dt>Órbita interna</dt><dd>${L.albedoDentro ? "Albedo" : "Nigredo"} <span class="dim">(externa: ${L.albedoDentro ? "Nigredo" : "Albedo"})</span></dd>
      <dt>${d.travessia ? "Travessia atual" : "Próxima Travessia"}</dt><dd>${d.travessia ? "agora" : `${em(prox.inicio)}, após o Ano ${prox.ano}`} · <b>${(d.travessia ? ehGrande(d.h) : prox.grande) ? "Grande Alinhamento" : "Troca Simples"}</b></dd>
      <dt>Alinhamento comum</dt><dd>${alin != null ? (comum ? "hoje" : em(alin)) : "—"}</dd>`;

    const m = d.travessia ? C.travessia : C.meses[d.mes - 1];
    $("md-mes-info").innerHTML = d.travessia
      ? `<span class="eyebrow">${esc(m.estacao)}</span><h3>${esc(m.nome)} · ${esc(m.partes[d.parte][0])}</h3><p class="dim">${esc(m.partes[d.parte][1])}</p><p class="dim">${esc(m.clima)}</p>`
      : `<span class="eyebrow">${esc(m.estacao)}</span><h3>Mês de ${esc(m.nome)}</h3><p class="dim">${esc(m.clima)}</p><p class="dim"><i>${esc(m.porque)}</i></p>`;

    // controles
    $("md-mes").value = d.travessia ? "T" : String(d.mes);
    $("md-dia").value = d.travessia ? d.t + 1 : d.dia;
    $("md-dia").max = d.travessia ? 14 : 28;
    if (document.activeElement !== $("md-ano")) $("md-ano").value = d.ano;
    $("md-ciclo").value = Math.floor(D) % (3 * HEX);
  }

  function irPara(novo) { D = Math.max(0, novo); desenhar(); }
  function lerData() {
    const ano = Math.max(1, Math.min(99999, parseInt($("md-ano").value, 10) || 1));
    const mes = $("md-mes").value, dia = parseInt($("md-dia").value, 10) || 1;
    if (mes === "T") {
      // Travessia só existe no fim de cada hexênio (anos 6, 12, 18…): usa a do hexênio do ano escolhido.
      const h = Math.floor((ano - 1) / 6);
      irPara(h * HEX + 6 * ANO + Math.min(13, Math.max(0, dia - 1)));
    } else irPara(diaAbs(ano, +mes, Math.min(28, Math.max(1, dia))));
  }
  ["md-dia", "md-mes", "md-ano"].forEach((id) => $(id).addEventListener("change", lerData));
  $("md-ciclo").addEventListener("input", (e) => irPara(Math.floor(D / (3 * HEX)) * 3 * HEX + +e.target.value));
  raiz.addEventListener("click", (e) => {
    const p = e.target.closest("[data-passo]");
    if (p) return irPara(Math.floor(D) + +p.dataset.passo);
    const ir = e.target.closest("[data-ir]")?.dataset.ir;
    if (ir === "alinhamento") return irPara(proximosAlinhamentos(Math.floor(D) + 1, 1)[0]);
    if (ir === "travessia") return irPara(proximaTravessia(Math.floor(D) + (data(D).travessia ? TRAV : 0)).inicio + 7);
    if (ir === "grande") {
      let h = data(D).h + (data(D).travessia || D % HEX > APEX ? 1 : 0);
      while (!ehGrande(h)) h++;
      return irPara(apex(h));
    }
  });
  $("md-play").addEventListener("click", () => {
    tocando = !tocando;
    $("md-play").setAttribute("aria-pressed", String(tocando));
    $("md-play").textContent = tocando ? "❚❚ Pausar" : "▶ Animar";
    ultimo = 0;
    if (tocando) requestAnimationFrame(passo);
  });
  function passo(ts) {
    if (!tocando) return;
    if (ultimo) D += (ts - ultimo) / 1000 * +$("md-vel").value;
    ultimo = ts;
    desenhar();
    requestAnimationFrame(passo);
  }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) $("md-vel").value = "2";

  // Tabelas de referência
  const ref = document.getElementById("modelo-tabelas");
  if (ref) ref.innerHTML = `
    <div class="tabela-rolagem"><table class="tabela">
      <caption>Especificações físicas</caption>
      <thead><tr><th>Parâmetro</th><th>Valor</th><th>Efeito prático no mundo</th></tr></thead>
      <tbody>${C.specs.map((r) => `<tr>${r.map((c, i) => `<${i ? "td" : "th"}>${esc(c)}</${i ? "td" : "th"}>`).join("")}</tr>`).join("")}</tbody>
    </table></div>
    <div class="tabela-rolagem"><table class="tabela">
      <caption>Alinhamentos no calendário</caption>
      <thead><tr><th>Tipo</th><th>Frequência</th><th>Posição dos astros</th><th>Efeito no planeta</th></tr></thead>
      <tbody>${C.alinhamentos.map((r) => `<tr>${r.map((c, i) => `<${i ? "td" : "th"}>${esc(c)}</${i ? "td" : "th"}>`).join("")}</tr>`).join("")}</tbody>
    </table></div>
    <div class="tabela-rolagem"><table class="tabela">
      <caption>Calendário das estações (13 meses de 28 dias)</caption>
      <thead><tr><th>Mês</th><th>Dias no ano</th><th>Estação</th><th>Clima</th></tr></thead>
      <tbody>${C.meses.map((m, i) => `<tr><th>${i + 1} · ${esc(m.nome)}</th><td>${i * 28 + 1}–${i * 28 + 28}</td><td>${esc(m.estacao)}</td><td>${esc(m.clima)}</td></tr>`).join("")}
        <tr><th>Travessia</th><td><i>14 dias sem data</i></td><td>${esc(C.travessia.estacao)}</td><td>${esc(C.travessia.clima)} ${C.travessia.partes.map(([n, t]) => `<b>${esc(n)}:</b> ${esc(t)}`).join(" ")}</td></tr></tbody>
    </table></div>`;

  desenhar();
  window.ASTER_MODELO = { data, luas, diaAbs, proximosAlinhamentos, proximaTravessia, ehGrande, HEX }; // para testes
})();
