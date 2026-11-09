(() => {
  const form = document.getElementById("form-comentario");
  const msg = document.getElementById("form-msg");
  const lista = document.getElementById("lista-comentarios");
  const filtro = document.getElementById("filtro-topico");
  const esc = window.escapeHTML;
  let comentarios = [];

  function render() {
    const t = filtro.value;
    const itens = comentarios.filter((c) => !t || c.topico === t);
    lista.innerHTML = itens.length
      ? itens.map((c) => `
        <article class="comment">
          <header>
            <span class="who">${esc(c.nome)}</span>
            <span class="tag">${esc(c.topico)}</span>
            <time datetime="${c.criadoEm}">${new Date(c.criadoEm).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" })}</time>
          </header>
          <p>${esc(c.mensagem)}</p>
        </article>`).join("")
      : `<p class="empty">Nenhum comentário ainda${t ? " neste assunto" : ""}. Seja o primeiro!</p>`;
  }

  async function carregar() {
    try {
      comentarios = await window.AsterDB.comentarios.listar();
      render();
    } catch (err) {
      lista.innerHTML = `<p class="empty">Não foi possível carregar os comentários. ${esc(err.message || "")}</p>`;
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "form-msg";
    const data = Object.fromEntries(new FormData(form));
    if (data.nome.trim().length < 2) { msg.className = "form-msg err"; msg.textContent = "Informe seu nome."; return; }
    if (data.mensagem.trim().length < 3) { msg.className = "form-msg err"; msg.textContent = "Escreva uma mensagem."; return; }
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    try {
      if (data.site) return; // honeypot anti-spam
      const body = await window.AsterDB.comentarios.publicar({
        nome: data.nome.trim(), topico: data.topico, mensagem: data.mensagem.trim(),
      });
      comentarios.unshift(body);
      form.reset();
      filtro.value = "";
      render();
      msg.className = "form-msg ok";
      msg.textContent = "Comentário publicado!";
    } catch (err) {
      msg.className = "form-msg err";
      msg.textContent = err.message || "Erro ao publicar.";
    } finally {
      btn.disabled = false;
    }
  });

  filtro.addEventListener("change", render);
  // Se a pessoa estiver logada, já preenche o nome.
  const preencherNome = (u) => { if (u && !form.nome.value) form.nome.value = window.AsterDB.auth.nome(u); };
  window.AsterDB.auth.usuario().then(preencherNome);
  document.addEventListener("aster:auth", (e) => preencherNome(e.detail));
  carregar();
})();
