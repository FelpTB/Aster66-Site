// Página Geologia e o Céu de Aster: astros (dados em data-mundo.js, desenhos em astros.js).
(() => {
  const M = window.ASTER_MUNDO;
  const el = document.getElementById("astros");
  if (!el) return;
  el.innerHTML = M.astros.map((a) => `
    <article class="card astro">
      ${window.ASTRO_SVG[a.id]}
      <div><h3 style="margin:0">${a.nome}</h3>
      <span class="eyebrow" style="margin:.2rem 0 .6rem">${a.tipo}</span>
      <p class="dim" style="font-size:.95rem">${a.texto}</p></div>
    </article>`).join("");
})();
