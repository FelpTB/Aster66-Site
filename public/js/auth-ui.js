// Botão de conta no cabeçalho + janela de login/cadastro (Supabase Auth).
(() => {
  const DB = window.AsterDB;
  const slot = document.getElementById("nav-auth");
  if (!DB || !DB.ativo || !slot) return;
  const esc = window.escapeHTML;

  const dlg = document.createElement("dialog");
  dlg.className = "modal auth-modal";
  dlg.innerHTML = `
    <button class="modal-close" aria-label="Fechar" data-close>×</button>
    <div class="modal-body">
      <div class="auth-tabs" role="tablist">
        <button role="tab" data-tab="entrar" aria-selected="true">Entrar</button>
        <button role="tab" data-tab="cadastrar" aria-selected="false">Criar conta</button>
      </div>
      <form class="form" id="auth-form" novalidate>
        <label data-only="cadastrar" hidden>Nome de exibição<input class="input" name="nome" maxlength="60" autocomplete="nickname"></label>
        <label>E-mail<input class="input" type="email" name="email" required autocomplete="email"></label>
        <label data-hide="recuperar">Senha<input class="input" type="password" name="senha" minlength="6" autocomplete="current-password"></label>
        <button class="btn btn-primary" type="submit" id="auth-submit">Entrar</button>
        <button class="linkish" type="button" data-tab="recuperar" data-only="entrar">Esqueci minha senha</button>
        <p class="form-msg" id="auth-msg" role="status"></p>
      </form>
      <p class="dim" style="font-size:.85rem;margin:8px 0 0">Com uma conta você salva suas fichas na nuvem e acessa de qualquer dispositivo.</p>
    </div>`;
  document.body.append(dlg);

  const form = dlg.querySelector("#auth-form");
  const msg = dlg.querySelector("#auth-msg");
  let modo = "entrar";
  const LABEL = { entrar: "Entrar", cadastrar: "Criar conta", recuperar: "Enviar link de redefinição" };

  function setModo(m) {
    modo = m;
    dlg.querySelectorAll(".auth-tabs [data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === m)));
    form.querySelectorAll("[data-only]").forEach((el) => (el.hidden = el.dataset.only !== m));
    form.querySelectorAll("[data-hide]").forEach((el) => (el.hidden = el.dataset.hide === m));
    form.senha.autocomplete = m === "cadastrar" ? "new-password" : "current-password";
    dlg.querySelector("#auth-submit").textContent = LABEL[m];
    msg.textContent = ""; msg.className = "form-msg";
  }
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target.hasAttribute("data-close")) return dlg.close();
    const t = e.target.closest("[data-tab]");
    if (t) setModo(t.dataset.tab);
  });

  window.abrirLogin = (m = "entrar") => { setModo(m); dlg.showModal(); form.email.focus(); };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim(), senha = form.senha.value, nome = form.nome.value.trim();
    const erro = (t) => { msg.className = "form-msg err"; msg.textContent = t; };
    if (!/^\S+@\S+\.\S+$/.test(email)) return erro("Informe um e-mail válido.");
    if (modo !== "recuperar" && senha.length < 6) return erro("A senha precisa ter pelo menos 6 caracteres.");
    const btn = dlg.querySelector("#auth-submit");
    btn.disabled = true;
    try {
      if (modo === "entrar") {
        await DB.auth.entrar(email, senha);
        dlg.close(); form.reset();
      } else if (modo === "cadastrar") {
        const r = await DB.auth.cadastrar(email, senha, nome);
        if (r.precisaConfirmar) { msg.className = "form-msg ok"; msg.textContent = "Conta criada! Enviamos um link de confirmação para o seu e-mail."; }
        else { dlg.close(); form.reset(); }
      } else {
        await DB.auth.recuperar(email);
        msg.className = "form-msg ok"; msg.textContent = "Se o e-mail tiver conta, você vai receber um link para criar uma nova senha.";
      }
    } catch (err) { erro(err.message); }
    finally { btn.disabled = false; }
  });

  function render(u) {
    slot.innerHTML = u
      ? `<a class="account-chip" href="ficha.html" title="${esc(u.email)}">${esc(DB.auth.nome(u))}</a><button class="linkish" id="btn-sair">Sair</button>`
      : `<button class="btn btn-ghost btn-small" id="btn-entrar">Entrar</button>`;
    slot.querySelector("#btn-entrar")?.addEventListener("click", () => window.abrirLogin());
    slot.querySelector("#btn-sair")?.addEventListener("click", () => DB.auth.sair());
  }
  DB.auth.usuario().then(render);
  DB.auth.aoMudar((u) => { render(u); document.dispatchEvent(new CustomEvent("aster:auth", { detail: u })); });
})();
