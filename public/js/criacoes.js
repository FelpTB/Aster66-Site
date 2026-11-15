// Criações da comunidade (conteúdo não oficial): catálogo com filtro de categorias,
// formulário de criação/edição e janela de detalhes. Dados em Supabase → esquema "comunidade".
(() => {
  const DB = window.AsterDB;
  const esc = window.escapeHTML;
  const $ = (id) => document.getElementById(id);
  const lista = $("criacoes-lista");
  if (!lista) return;
  const contagem = $("criacoes-contagem");
  const chips = $("categorias-criacoes");
  const busca = $("busca-criacoes");
  const ordem = $("ordem-criacoes");
  const btnNova = $("btn-nova-criacao");

  let categorias = [];
  let porSlug = new Map();
  let criacoes = [];
  let usuario = null;
  let filtroCat = "";        // "" = todas · "minhas" = só as minhas · slug da categoria
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const data = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  if (!DB?.ativo) {
    lista.innerHTML = `<p class="empty">As criações da comunidade ficam no Supabase, que não está configurado nesta versão do site.</p>`;
    btnNova.hidden = true;
    return;
  }

  // ---------------- Catálogo ----------------
  function renderChips() {
    const n = (slug) => criacoes.filter((c) => c.categoria === slug && c.status === "publicado").length;
    const btn = (valor, rotulo, qtd) =>
      `<button class="chip" type="button" data-cat="${valor}" aria-pressed="${filtroCat === valor}">${rotulo}${qtd != null ? ` <span class="chip-n">${qtd}</span>` : ""}</button>`;
    chips.innerHTML = `<span class="rotulo">Categoria</span>` +
      btn("", "Todas", criacoes.filter((c) => c.status === "publicado").length) +
      categorias.map((c) => btn(c.slug, `${c.icone ? c.icone + " " : ""}${esc(c.plural)}`, n(c.slug))).join("") +
      (usuario ? btn("minhas", "★ Minhas criações", criacoes.filter((c) => c.autor_id === usuario.id).length) : "");
  }

  function resumoDe(c) {
    if (c.resumo) return c.resumo;
    const t = DB.mdTexto(c.conteudo).replace(/\s+/g, " ").trim();
    return t.length > 160 ? t.slice(0, 157) + "…" : t;
  }

  // Até 3 atributos curtos para o rodapé do card (ex.: "Magia · Ação · 3").
  function destaques(c) {
    const cat = porSlug.get(c.categoria);
    if (!cat) return [];
    return cat.campos.filter((f) => f.tipo !== "longo")
      .map((f) => c.atributos?.[f.chave]).filter((v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length))
      .map((v) => (Array.isArray(v) ? v.join(", ") : String(v))).filter((v) => v.length <= 28).slice(0, 3);
  }

  function render() {
    const q = norm(busca.value.trim());
    let itens = criacoes.filter((c) => {
      if (filtroCat === "minhas") { if (c.autor_id !== usuario?.id) return false; }
      else if (c.status !== "publicado") return false;
      else if (filtroCat && c.categoria !== filtroCat) return false;
      if (!q) return true;
      const alvo = norm([c.nome, c.resumo, c.conteudo, c.autor_nome, (c.tags || []).join(" "),
        Object.values(c.atributos || {}).flat().join(" ")].join(" "));
      return q.split(/\s+/).every((p) => alvo.includes(p));
    });
    if (ordem.value === "nome") itens.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    else if (ordem.value === "antigas") itens.sort((a, b) => a.criado_em.localeCompare(b.criado_em));

    const nomeCat = filtroCat && filtroCat !== "minhas" ? porSlug.get(filtroCat)?.plural.toLowerCase() : "criações";
    contagem.textContent = itens.length === 1 ? "1 criação" : `${itens.length} ${filtroCat === "minhas" ? "criações suas" : nomeCat || "criações"}`;
    if (!itens.length) {
      lista.innerHTML = `<p class="empty">${criacoes.length ? "Nada encontrado com esses filtros." : "Ainda não há criações. Que tal ser a primeira pessoa a publicar uma?"}</p>`;
      return;
    }
    lista.innerHTML = `<div class="criacoes-grid">${itens.map((c) => {
      const cat = porSlug.get(c.categoria) || { nome: c.categoria, icone: "✨" };
      const minha = usuario && c.autor_id === usuario.id;
      return `<button class="criacao-card" type="button" data-id="${c.id}" data-cat="${esc(c.categoria)}">
        <span class="cr-topo"><span class="cr-icone" aria-hidden="true">${esc(cat.icone || "✨")}</span>
          <span class="cr-cat">${esc(cat.nome)}</span>${c.status !== "publicado" ? `<span class="tag tag-red">Oculta</span>` : ""}${minha ? `<span class="cr-minha" title="Criada por você">★</span>` : ""}</span>
        <b class="cr-nome">${esc(c.nome)}</b>
        <span class="cr-texto">${esc(resumoDe(c))}</span>
        ${destaques(c).length ? `<span class="cr-atributos">${destaques(c).map(esc).join(" · ")}</span>` : ""}
        <span class="cr-rodape">por ${esc(c.autor_nome)} · ${data(c.criado_em)}</span>
      </button>`;
    }).join("")}</div>`;
  }

  chips.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    filtroCat = filtroCat === b.dataset.cat ? "" : b.dataset.cat;
    renderChips(); render();
  });
  busca.addEventListener("input", render);
  ordem.addEventListener("change", render);
  lista.addEventListener("click", (e) => {
    const card = e.target.closest(".criacao-card");
    if (card) abrirDetalhe(card.dataset.id);
  });

  // ---------------- Detalhes ----------------
  function valorHTML(v) {
    if (Array.isArray(v)) return v.map((x) => `<span class="tag">${esc(x)}</span>`).join(" ");
    return esc(String(v));
  }

  function abrirDetalhe(id) {
    const c = criacoes.find((x) => x.id === id);
    if (!c) return;
    const cat = porSlug.get(c.categoria) || { nome: c.categoria, campos: [] };
    const minha = usuario && c.autor_id === usuario.id;
    const campos = cat.campos.map((f) => [f, c.atributos?.[f.chave]])
      .filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length));
    const curtos = campos.filter(([f]) => f.tipo !== "longo");
    const longos = campos.filter(([f]) => f.tipo === "longo");
    history.replaceState(null, "", `#criacao-${c.id}`);
    const dlg = window.abrirModal(`
      <div class="modal-cabeca"><span class="cr-icone grande" aria-hidden="true">${esc(cat.icone || "✨")}</span>
        <div><span class="eyebrow">${esc(cat.nome)} · criação da comunidade</span><h2>${esc(c.nome)}</h2></div></div>
      <p class="dim" style="margin-top:-6px">por <strong>${esc(c.autor_nome)}</strong> · ${data(c.criado_em)}${c.atualizado_em.slice(0, 16) !== c.criado_em.slice(0, 16) ? ` · editada em ${data(c.atualizado_em)}` : ""}</p>
      <p class="aviso-naooficial">Conteúdo não oficial, feito pela comunidade. Combine com o mestre antes de usar.</p>
      ${c.status !== "publicado" ? `<p class="form-msg err">Esta criação foi ocultada pela moderação e só você a vê.</p>` : ""}
      ${c.resumo ? `<p class="lead" style="font-size:1.1rem">${esc(c.resumo)}</p>` : ""}
      ${curtos.length ? `<dl>${curtos.map(([f, v]) => `<dt>${esc(f.rotulo.replace(/\s*\(.*\)$/, ""))}</dt><dd>${valorHTML(v)}</dd>`).join("")}</dl>` : ""}
      ${longos.map(([f, v]) => `<h3 class="cr-sub">${esc(f.rotulo)}</h3><div class="md">${window.mdHTML(String(v), { termos: true })}</div>`).join("")}
      ${c.conteudo ? `<div class="md cr-conteudo">${window.mdHTML(c.conteudo, { termos: true })}</div>` : ""}
      ${(c.tags || []).length ? `<p class="cr-tags">${c.tags.map((t) => `<span class="tag tag-roxo">#${esc(t)}</span>`).join(" ")}</p>` : ""}
      <div class="cr-acoes">
        <button class="btn btn-ghost btn-small" type="button" data-acao="link">Copiar link</button>
        ${minha ? `<button class="btn btn-ghost btn-small" type="button" data-acao="editar">Editar</button>
          <button class="btn btn-ghost btn-small danger" type="button" data-acao="excluir">Excluir</button>` : ""}
        <span class="form-msg" data-msg role="status"></span>
      </div>`, { largo: true });
    dlg.querySelector(".cr-acoes").onclick = async (e) => {
      const acao = e.target.closest("[data-acao]")?.dataset.acao;
      const msg = dlg.querySelector("[data-msg]");
      if (acao === "link") {
        try { await navigator.clipboard.writeText(location.href); msg.className = "form-msg ok"; msg.textContent = "Link copiado!"; }
        catch { msg.textContent = location.href; }
      } else if (acao === "editar") abrirFormulario(c);
      else if (acao === "excluir") {
        if (!confirm(`Excluir “${c.nome}”? Isso não pode ser desfeito.`)) return;
        try {
          await DB.criacoes.excluir(c.id);
          criacoes = criacoes.filter((x) => x.id !== c.id);
          dlg.close(); renderChips(); render();
        } catch (err) { msg.className = "form-msg err"; msg.textContent = err.message; }
      }
    };
    dlg.addEventListener("close", () => {
      if (location.hash.startsWith("#criacao-")) history.replaceState(null, "", location.pathname + location.search);
    }, { once: true });
  }

  // ---------------- Formulário ----------------
  const ID_LISTA = (f) => `sug-${f.chave}`;
  function campoHTML(f, valor) {
    const nome = `attr-${f.chave}`;
    const v = valor === undefined || valor === null ? "" : valor;
    if (f.tipo === "longo") return `<label class="cr-largo">${esc(f.rotulo)}<textarea class="input" name="${nome}" maxlength="3000" rows="3">${esc(v)}</textarea></label>`;
    if (f.tipo === "numero") return `<label>${esc(f.rotulo)}<input class="input" type="number" step="any" name="${nome}" value="${esc(v)}"></label>`;
    if (f.tipo === "lista") return `<label>${esc(f.rotulo)}<input class="input" name="${nome}" maxlength="400" placeholder="Separe por vírgulas" value="${esc(Array.isArray(v) ? v.join(", ") : v)}"></label>`;
    const sug = f.tipo === "escolha" && f.opcoes?.length
      ? `<datalist id="${ID_LISTA(f)}">${f.opcoes.map((o) => `<option value="${esc(o)}">`).join("")}</datalist>` : "";
    return `<label>${esc(f.rotulo)}<input class="input" name="${nome}" maxlength="120" value="${esc(v)}"${sug ? ` list="${ID_LISTA(f)}" placeholder="Escolha ou escreva"` : ""}>${sug}</label>`;
  }

  function lerAtributos(form, cat) {
    const out = {};
    for (const f of cat.campos) {
      const bruto = (form.elements[`attr-${f.chave}`]?.value || "").trim();
      if (!bruto) continue;
      if (f.tipo === "numero") { const n = Number(bruto.replace(",", ".")); if (!Number.isNaN(n)) out[f.chave] = n; }
      else if (f.tipo === "lista") { const l = bruto.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20); if (l.length) out[f.chave] = l; }
      else out[f.chave] = bruto;
    }
    return out;
  }

  function abrirFormulario(existente = null, catInicial = "") {
    if (!usuario) {
      window.abrirLogin?.("entrar");
      const m = document.getElementById("auth-msg");
      if (m) { m.className = "form-msg"; m.textContent = "Entre (ou crie uma conta) para publicar suas criações."; }
      return;
    }
    let slug = existente?.categoria || catInicial || (filtroCat && filtroCat !== "minhas" ? filtroCat : categorias[0].slug);
    const dlg = window.abrirModal(`
      <span class="eyebrow">${existente ? "Editar criação" : "Nova criação"}</span>
      <h2 style="margin-bottom:.4em">${existente ? esc(existente.nome) : "Crie algo para Aster"}</h2>
      <form class="form cr-form" novalidate>
        <fieldset class="cr-categorias"><legend class="rotulo">Categoria</legend>
          ${categorias.map((c) => `<label class="chip-radio"><input type="radio" name="categoria" value="${c.slug}"${c.slug === slug ? " checked" : ""}><span>${esc(c.icone || "")} ${esc(c.nome)}</span></label>`).join("")}
        </fieldset>
        <p class="dim cr-cat-desc" style="margin:-4px 0 0;font-size:.9rem"></p>
        <label>Nome<input class="input" name="nome" maxlength="120" required value="${esc(existente?.nome || "")}"></label>
        <label><span>Resumo <span class="dim">(opcional, aparece no catálogo)</span></span><input class="input" name="resumo" maxlength="300" value="${esc(existente?.resumo || "")}"></label>
        <div class="cr-campos"></div>
        <label>Descrição completa
          <textarea class="input" name="conteudo" maxlength="20000" rows="8" placeholder="Efeito, história, como usar na mesa… Aceita **negrito**, *itálico*, listas com - e títulos com #.">${esc(existente?.conteudo || "")}</textarea>
        </label>
        <div class="cr-dupla">
          <label><span>Tags <span class="dim">(separadas por vírgula)</span></span><input class="input" name="tags" maxlength="300" value="${esc((existente?.tags || []).join(", "))}"></label>
          <label>Assinar como<input class="input" name="autor_nome" maxlength="60" required value="${esc(existente?.autor_nome || DB.auth.nome(usuario))}"></label>
        </div>
        <p class="dim" style="font-size:.85rem;margin:0">Ao publicar, sua criação fica visível para todos como conteúdo não oficial. Você pode editar ou excluir quando quiser.</p>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-primary" type="submit">${existente ? "Salvar alterações" : "Publicar criação"}</button>
          <button class="btn btn-ghost" type="button" data-close>Cancelar</button>
          <p class="form-msg" data-msg role="status"></p>
        </div>
      </form>`, { largo: true });

    const form = dlg.querySelector("form");
    const caixa = form.querySelector(".cr-campos");
    const desc = form.querySelector(".cr-cat-desc");
    const msg = form.querySelector("[data-msg]");
    // Mantém o que já foi digitado ao trocar de categoria (campos com a mesma chave).
    let rascunho = { ...(existente?.atributos || {}) };
    const montarCampos = () => {
      const cat = porSlug.get(slug);
      desc.textContent = cat.descricao || "";
      caixa.innerHTML = cat.campos.length ? cat.campos.map((f) => campoHTML(f, rascunho[f.chave])).join("") : "";
      caixa.hidden = !cat.campos.length;
    };
    montarCampos();
    form.addEventListener("change", (e) => {
      if (e.target.name !== "categoria") return;
      rascunho = { ...rascunho, ...lerAtributos(form, porSlug.get(slug)) };
      slug = e.target.value;
      montarCampos();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const erro = (t) => { msg.className = "form-msg err"; msg.textContent = t; };
      const nome = form.nome.value.trim();
      if (nome.length < 2) return erro("Dê um nome à sua criação.");
      if (!form.autor_nome.value.trim()) return erro("Informe como quer assinar.");
      const cat = porSlug.get(slug);
      const atributos = lerAtributos(form, cat);
      if (!form.conteudo.value.trim() && !form.resumo.value.trim() && !Object.keys(atributos).length) return erro("Descreva sua criação.");
      const btn = form.querySelector("[type=submit]");
      btn.disabled = true; msg.className = "form-msg"; msg.textContent = "Salvando…";
      try {
        const salva = await DB.criacoes.salvar({
          id: existente?.id, categoria: slug, nome, resumo: form.resumo.value, conteudo: form.conteudo.value.trim(),
          atributos, tags: form.tags.value.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
          autor_nome: form.autor_nome.value,
        });
        criacoes = [salva, ...criacoes.filter((c) => c.id !== salva.id)];
        renderChips(); render();
        abrirDetalhe(salva.id);
      } catch (err) { erro(err.message); btn.disabled = false; }
    });
    form.nome.focus();
  }

  btnNova.addEventListener("click", () => abrirFormulario());

  // ---------------- Carga ----------------
  async function carregar() {
    try {
      [categorias, criacoes, usuario] = await Promise.all([DB.criacoes.categorias(), DB.criacoes.listar(), DB.auth.usuario()]);
      porSlug = new Map(categorias.map((c) => [c.slug, c]));
      renderChips(); render();
      const m = location.hash.match(/^#criacao-([0-9a-f-]{36})$/);
      if (m) { abrirDetalhe(m[1]); $("criacoes").scrollIntoView(); }
    } catch (err) {
      lista.innerHTML = `<p class="empty">Não foi possível carregar as criações. ${esc(err.message || "")}</p>`;
      btnNova.disabled = true;
    }
  }
  document.addEventListener("aster:auth", async (e) => {
    const antes = usuario?.id;
    usuario = e.detail;
    if (antes === usuario?.id || !categorias.length) return;
    if (!usuario && filtroCat === "minhas") filtroCat = "";
    criacoes = await DB.criacoes.listar().catch(() => criacoes); // inclui/retira as ocultas do próprio autor
    renderChips(); render();
  });
  carregar();
})();
