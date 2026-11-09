(() => {
  const STORAGE_KEY = "aster66:ficha:v1";
  let P = window.ASTER_PERSONAGENS;
  const DB = window.AsterDB;
  const form = document.getElementById("ficha");
  const $ = (id) => document.getElementById(id);
  const esc = window.escapeHTML;

  // ---------- Montagem dos campos repetidos ----------
  // Posições no hexagrama (viewBox 300x300), na mesma ordem do modelo do Notion.
  const VERTICES = [
    ["corpo", "Corpo", 150, 40, "top"],
    ["destreza", "Destreza", 245.3, 95, "right"],
    ["mente", "Mente", 245.3, 205, "right"],
    ["conhecimento", "Conhecimento", 150, 260, "bottom"],
    ["alma", "Alma", 54.7, 205, "left"],
    ["foco", "Foco", 54.7, 95, "left"],
  ];
  $("hexa").insertAdjacentHTML("beforeend", VERTICES.map(([k, label, x, y, pos]) => `
    <label class="vertex ${pos}" style="left:${(x / 3).toFixed(2)}%;top:${(y / 3).toFixed(2)}%">
      <input name="attr_${k}" inputmode="numeric" aria-label="${label}"><span>${label}</span>
    </label>`).join(""));

  $("cicatrizes").innerHTML = Array.from({ length: 8 }, (_, i) =>
    `<input name="cicatriz_${i + 1}" aria-label="Cicatriz ou condição ${i + 1}" placeholder="${i === 0 ? "Cicatrizes e condições…" : ""}">`).join("");
  $("acoes").innerHTML = Array.from({ length: 6 }, (_, i) => `<input type="checkbox" name="acao_${i + 1}" aria-label="Ação ${i + 1}">`).join("");
  $("reacoes").innerHTML = Array.from({ length: 4 }, (_, i) => `<input type="checkbox" name="reacao_${i + 1}" aria-label="Reação ${i + 1}">`).join("");

  const SLOTS = [["maos", "Em mãos", 2, "2 iniciais"], ["equip", "Equipado", 4, "4 iniciais"], ["rapido", "Acesso rápido", 4, "0 iniciais"], ["guard", "Guardado", 4, "4 iniciais"]];
  $("slots").innerHTML = SLOTS.map(([k, label, n, ini]) => `
    <div class="slot"><b>${label}</b>
      <div class="checks">${Array.from({ length: n }, (_, i) => `<input type="checkbox" name="esp_${k}_${i + 1}" aria-label="${label} ${i + 1}">`).join("")}</div>
      <small>(${ini})</small></div>`).join("");

  $("inventario").innerHTML = Array.from({ length: 10 }, (_, i) => `
    <tr><td><input name="inv_nome_${i + 1}" aria-label="Item ${i + 1}"></td>
        <td><input name="inv_tipo_${i + 1}" list="tipos-espaco" aria-label="Tipo de espaço ${i + 1}"></td>
        <td><input class="num" name="inv_qtd_${i + 1}" aria-label="Quantidade ${i + 1}" style="border:0;font-size:.95rem;font-weight:400"></td></tr>`).join("") +
    `<datalist id="tipos-espaco">${SLOTS.map(([, l]) => `<option value="${l}">`).join("")}</datalist>`;

  $("origens").innerHTML = Array.from({ length: 15 }, (_, i) =>
    `<label><span>${i + 1}.</span><input name="origem_${i + 1}" aria-label="Origem ${i + 1}"></label>`).join("");

  $("cartas").innerHTML = Array.from({ length: 30 }, (_, i) => `
    <tr><td class="idx">${i + 1}</td>
        <td><input name="carta_nome_${i + 1}" aria-label="Carta ${i + 1}: nome"></td>
        <td><input class="num" name="carta_custo_${i + 1}" aria-label="Carta ${i + 1}: custo" style="border:0;font-size:.95rem;font-weight:400"></td>
        <td><textarea name="carta_efeito_${i + 1}" rows="1" aria-label="Carta ${i + 1}: efeito"></textarea></td></tr>`).join("");

  // ---------- Assistente de raça/classe ----------
  let racas = [], classes = [];
  const opts = (list) => `<option value="">— escolha —</option>` + list.map((x) => `<option value="${esc(x.nome)}">${esc(x.nome)}</option>`).join("");
  function montarSelects() {
    const sr = $("sel-raca").value, sc = $("sel-classe").value;
    racas = P.filter((x) => x.tipo === "raca");
    classes = P.filter((x) => x.tipo === "classe");
    $("sel-raca").innerHTML = opts(racas);
    $("sel-classe").innerHTML = opts(classes);
    $("sel-raca").value = sr; $("sel-classe").value = sc;
  }
  montarSelects();
  DB.catalogoPersonagens().then((lista) => { P = lista; montarSelects(); });

  const ATTR_KEYS = { Corpo: "corpo", Mente: "mente", Alma: "alma", Destreza: "destreza", Foco: "foco", Conhecimento: "conhecimento" };
  const el = (name) => form.elements[name];
  const num = (name) => parseInt(el(name).value, 10) || 0;
  const set = (name, v) => { el(name).value = v; };
  const find = (list, nome) => list.find((x) => x.nome === nome);

  function recalc(raca, classe) {
    const vida = (raca?.vida || 0) + (classe?.vida || 0) + num("attr_corpo");
    const energia = (raca?.energia || 0) + (classe?.energia || 0) + num("attr_alma");
    set("vida_total", vida); set("vida_atual", vida);
    set("energia_total", energia); set("energia_atual", energia);
    set("esquiva", 6 + num("attr_destreza"));
    if (!el("bloqueio").value) set("bloqueio", 0);
    if (!el("deslocamento").value) set("deslocamento", 3);
    const reacoes = Math.min(4, 2 + num("attr_destreza"));
    for (let i = 1; i <= 4; i++) el(`reacao_${i}`).closest("input").style.opacity = i <= reacoes ? "1" : ".35";
  }

  function addUnique(prefix, max, value) {
    for (let i = 1; i <= max; i++) if (el(`${prefix}_${i}`).value.trim().toLowerCase() === value.toLowerCase()) return;
    for (let i = 1; i <= max; i++) if (!el(`${prefix}_${i}`).value.trim()) { set(`${prefix}_${i}`, value); return; }
  }
  function addCarta(h, tipo) {
    for (let i = 1; i <= 30; i++) if (el(`carta_nome_${i}`).value.trim() === h.nome) return;
    for (let i = 1; i <= 30; i++) {
      if (!el(`carta_nome_${i}`).value.trim()) {
        set(`carta_nome_${i}`, h.nome);
        set(`carta_efeito_${i}`, `[${tipo}] ${h.texto}`);
        return;
      }
    }
  }

  $("btn-aplicar").addEventListener("click", () => {
    const raca = find(racas, $("sel-raca").value);
    const classe = find(classes, $("sel-classe").value);
    if (!raca || !classe) { status("Escolha uma raça e uma classe.", true); return; }
    const filled = Object.values(ATTR_KEYS).some((k) => el(`attr_${k}`).value);
    if (filled && !confirm("Isso vai substituir atributos, vida, energia e esquiva atuais. Continuar?")) return;
    Object.values(ATTR_KEYS).forEach((k) => set(`attr_${k}`, 0));
    [raca, classe].forEach((x) => Object.entries(x.atributos).forEach(([a, v]) => {
      const k = ATTR_KEYS[a]; if (k) set(`attr_${k}`, num(`attr_${k}`) + v);
    }));
    set("raca", raca.nome);
    set("classe", classe.nome);
    recalc(raca, classe);
    [...raca.origens, ...classe.origens].forEach((o) => addUnique("origem", 15, o));
    addCarta(raca.habilidade, "Habilidade Inata");
    addCarta(classe.habilidade, "Habilidade Característica");
    const livres = raca.livres + classe.livres;
    save();
    status(livres ? `Aplicado! Distribua mais ${livres} ponto(s) livre(s) nos atributos e clique em “Recalcular”.` : "Raça e classe aplicadas.");
  });

  $("btn-recalc").addEventListener("click", () => {
    recalc(find(racas, el("raca").value) || find(racas, $("sel-raca").value),
           find(classes, el("classe").value) || find(classes, $("sel-classe").value));
    save();
    status("Valores recalculados.");
  });

  // ---------- Salvar / carregar ----------
  const fieldNames = () => [...form.elements].filter((e) => e.name).map((e) => e.name);
  function collect() {
    const data = {};
    [...form.elements].forEach((e) => {
      if (!e.name) return;
      if (e.type === "checkbox") { if (e.checked) data[e.name] = true; }
      else if (e.value !== "") data[e.name] = e.value;
    });
    data._raca_sel = $("sel-raca").value;
    data._classe_sel = $("sel-classe").value;
    if (nuvemId) data._nuvem_id = nuvemId;
    return data;
  }
  function apply(data) {
    [...form.elements].forEach((e) => {
      if (!e.name) return;
      if (e.type === "checkbox") e.checked = !!data[e.name];
      else e.value = data[e.name] ?? "";
    });
    $("sel-raca").value = data._raca_sel || "";
    $("sel-classe").value = data._classe_sel || "";
    nuvemId = data._nuvem_id || null;
  }
  let nuvemId = null;
  let saveTimer;
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collect())); $("save-state").textContent = "Salvo neste navegador ✓"; }
    catch { $("save-state").textContent = "Não foi possível salvar automaticamente."; }
  }
  function status(msg, err) {
    $("assist-info").textContent = msg;
    $("assist-info").style.color = err ? "#ff6b78" : "var(--ouro)";
  }
  form.addEventListener("input", () => { marcarPendente(); clearTimeout(saveTimer); $("save-state").textContent = "Salvando…"; saveTimer = setTimeout(save, 400); });
  form.addEventListener("change", save);
  try { const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); if (d) { apply(d); $("save-state").textContent = "Ficha recuperada ✓"; } } catch {}

  const slug = () => (el("nome").value.trim() || "personagem").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w]+/g, "-").toLowerCase();
  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  $("btn-export").addEventListener("click", () =>
    download(new Blob([JSON.stringify({ versao: 1, ficha: collect() }, null, 2)], { type: "application/json" }), `ficha-${slug()}.json`));

  $("inp-import").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const json = JSON.parse(await f.text());
      const data = json.ficha || json;
      const known = new Set(fieldNames());
      if (!Object.keys(data).some((k) => known.has(k))) throw new Error();
      apply(data); save(); status("Ficha importada.");
    } catch { status("Arquivo inválido — use um .json exportado por esta ficha.", true); }
    e.target.value = "";
  });

  $("btn-limpar").addEventListener("click", () => {
    if (!confirm("Apagar todos os campos da ficha? Exporte antes se quiser guardar uma cópia.")) return;
    form.reset(); $("sel-raca").value = ""; $("sel-classe").value = ""; nuvemId = null; atualizarSelNuvem();
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    $("save-state").textContent = "Ficha limpa.";
  });

  $("btn-print").addEventListener("click", () => window.print());

  // ---------- Exportar para o PDF editável ----------
  function loadPdfLib() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "vendor/pdf-lib.min.js";
      s.onload = () => res(window.PDFLib);
      s.onerror = rej;
      document.head.append(s);
    });
  }
  // Fontes padrão do PDF só aceitam o conjunto WinAnsi (latim). Remove o resto (ex.: emojis).
  const winAnsi = (s) => s.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF–—‘’“”•…€]/g, "");

  $("btn-pdf").addEventListener("click", async () => {
    const btn = $("btn-pdf");
    btn.disabled = true; btn.textContent = "Gerando PDF…";
    try {
      const { PDFDocument } = await loadPdfLib();
      const bytes = await fetch("docs/ficha-aster66.pdf").then((r) => { if (!r.ok) throw new Error(); return r.arrayBuffer(); });
      const pdf = await PDFDocument.load(bytes);
      const pform = pdf.getForm();
      const data = collect();
      pform.getFields().forEach((f) => {
        const name = f.getName();
        if (f.constructor.name === "PDFCheckBox" || typeof f.check === "function") { data[name] ? f.check() : f.uncheck(); }
        else if (data[name] != null) f.setText(winAnsi(String(data[name])));
      });
      download(new Blob([await pdf.save()], { type: "application/pdf" }), `ficha-${slug()}.pdf`);
      status("PDF gerado — ele continua editável.");
    } catch (err) {
      console.error(err);
      status("Não foi possível gerar o PDF. O servidor local está rodando?", true);
    } finally {
      btn.disabled = false; btn.textContent = "Baixar PDF preenchido";
    }
  });

  // ---------- Fichas na nuvem (Supabase) ----------
  let usuario = null, listaNuvem = [], pendente = false;
  const cloudState = (t, err) => { $("cloud-state").textContent = t; $("cloud-state").style.color = err ? "#ff6b78" : ""; };
  function marcarPendente() { if (usuario && nuvemId) { pendente = true; cloudState("Alterações não salvas na nuvem"); } }

  function atualizarSelNuvem() {
    if (!usuario) return;
    $("sel-nuvem").innerHTML = `<option value="">${listaNuvem.length ? "— abrir ficha salva —" : "Nenhuma ficha salva ainda"}</option>` +
      listaNuvem.map((f) => `<option value="${f.id}">${esc(f.nome)}${f.raca || f.classe ? " · " + esc([f.raca, f.classe].filter(Boolean).join(" / ")) : ""}</option>`).join("");
    $("sel-nuvem").value = nuvemId && listaNuvem.some((f) => f.id === nuvemId) ? nuvemId : "";
    $("btn-nuvem-excluir").disabled = !nuvemId;
    $("btn-nuvem-salvar").textContent = nuvemId ? "Salvar alterações" : "Salvar na nuvem";
  }
  async function recarregarLista() {
    try { listaNuvem = await DB.fichas.listar(); atualizarSelNuvem(); }
    catch (e) { cloudState(e.message, true); }
  }
  async function aoMudarUsuario(u) {
    usuario = u;
    $("cloud-off").hidden = !!u;
    $("cloud-on").hidden = !u;
    if (u) { cloudState(""); await recarregarLista(); }
    else { listaNuvem = []; cloudState(""); }
  }

  if (DB.ativo) {
    $("cloud").hidden = false;
    $("btn-cloud-login").addEventListener("click", () => window.abrirLogin && window.abrirLogin());
    DB.auth.usuario().then(aoMudarUsuario);
    document.addEventListener("aster:auth", (e) => {
      if ((e.detail?.id || null) !== (usuario?.id || null)) aoMudarUsuario(e.detail);
    });

    $("btn-nuvem-salvar").addEventListener("click", async () => {
      const btn = $("btn-nuvem-salvar"); btn.disabled = true; cloudState("Salvando…");
      try {
        const r = await DB.fichas.salvar({ id: nuvemId, dados: collect() });
        nuvemId = r.id; pendente = false; save();
        await recarregarLista();
        cloudState("Salvo na nuvem ✓ " + new Date(r.atualizado_em).toLocaleTimeString("pt-BR", { timeStyle: "short" }));
      } catch (e) { cloudState(e.message, true); }
      finally { btn.disabled = false; }
    });

    $("sel-nuvem").addEventListener("change", async (e) => {
      const id = e.target.value;
      if (!id) return;
      if (pendente && !confirm("A ficha atual tem alterações não salvas na nuvem. Abrir outra mesmo assim?")) { atualizarSelNuvem(); return; }
      cloudState("Abrindo…");
      try {
        const f = await DB.fichas.obter(id);
        form.reset(); apply(f.dados || {}); nuvemId = f.id; pendente = false; save(); atualizarSelNuvem();
        cloudState("Ficha carregada da nuvem ✓");
      } catch (err) { cloudState(err.message, true); atualizarSelNuvem(); }
    });

    $("btn-nuvem-nova").addEventListener("click", () => {
      if (pendente && !confirm("Há alterações não salvas na nuvem. Começar uma ficha nova mesmo assim?")) return;
      form.reset(); $("sel-raca").value = ""; $("sel-classe").value = "";
      nuvemId = null; pendente = false; save(); atualizarSelNuvem();
      cloudState("Ficha nova — clique em “Salvar na nuvem” quando quiser guardá-la.");
    });

    $("btn-nuvem-excluir").addEventListener("click", async () => {
      if (!nuvemId) return;
      const nome = listaNuvem.find((f) => f.id === nuvemId)?.nome || "esta ficha";
      if (!confirm(`Excluir “${nome}” da nuvem? Isso não pode ser desfeito. A cópia neste navegador continua.`)) return;
      try { await DB.fichas.excluir(nuvemId); nuvemId = null; save(); await recarregarLista(); cloudState("Ficha excluída da nuvem."); }
      catch (e) { cloudState(e.message, true); }
    });

    // Link de redefinição de senha (vem por e-mail)
    if (location.hash.includes("nova-senha") || location.hash.includes("type=recovery")) $("nova-senha").hidden = false;
    $("btn-nova-senha").addEventListener("click", async () => {
      const senha = $("inp-nova-senha").value;
      if (senha.length < 6) return cloudState("A senha precisa ter pelo menos 6 caracteres.", true);
      try { await DB.auth.novaSenha(senha); $("nova-senha").hidden = true; cloudState("Senha alterada ✓"); history.replaceState(null, "", location.pathname); }
      catch (e) { cloudState(e.message, true); }
    });
  }
})();
