// Criações da comunidade: visível só com conta. O catálogo em si ainda não existe (terreno preparado).
(() => {
  const DB = window.AsterDB;
  const bloqueio = document.getElementById("criacoes-bloqueio");
  const conteudo = document.getElementById("criacoes-conteudo");
  const carregando = document.getElementById("criacoes-carregando");
  const mostrar = (u) => {
    carregando.hidden = true;
    bloqueio.hidden = !!u;
    conteudo.hidden = !u;
  };
  document.getElementById("criacoes-entrar").addEventListener("click", () => window.abrirLogin ? window.abrirLogin() : null);
  if (!DB || !DB.ativo) { carregando.textContent = "As contas não estão disponíveis neste site."; return; }
  DB.auth.usuario().then(mostrar).catch(() => mostrar(null));
  document.addEventListener("aster:auth", (e) => mostrar(e.detail));
})();
