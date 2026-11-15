// Apoie o projeto: por enquanto o formulário monta um e-mail (não há servidor de envio).
(() => {
  const form = document.getElementById("form-apoio");
  const msg = document.getElementById("apoio-msg");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = form.nome.value.trim(), mensagem = form.mensagem.value.trim();
    if (!nome || !mensagem) { msg.className = "form-msg err"; msg.textContent = "Preencha nome e mensagem."; return; }
    const assunto = `Apoio ao Aster66 — ${form.forma.value}`;
    const texto = `${mensagem}\n\n— ${nome}${form.email.value.trim() ? " (" + form.email.value.trim() + ")" : ""}`;
    location.href = `mailto:${window.ASTER_CONFIG.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`;
    msg.className = "form-msg ok"; msg.textContent = "Abrimos o seu e-mail com a mensagem pronta. É só enviar!";
  });
})();
