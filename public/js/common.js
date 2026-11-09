// Cabeçalho, rodapé e configurações compartilhadas.
window.ASTER_CONFIG = {
  email: "rpgaster66@gmail.com",
};

const LOGO_SVG = `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <circle cx="20" cy="20" r="18.5" fill="none" stroke="#E5A93C" stroke-width="1"/>
  <circle cx="20" cy="20" r="11" fill="#08080A" stroke="#E5A93C" stroke-width="1.2"/>
  <circle cx="24" cy="17" r="7.5" fill="#FFFFFF"/>
  <circle cx="26.6" cy="15.6" r="6.6" fill="#08080A"/>
  <path d="M33 6 l1.2 3.3 3.3 1.2 -3.3 1.2 -1.2 3.3 -1.2 -3.3 -3.3 -1.2 3.3 -1.2z" fill="#C91D2E"/>
</svg>`;

const NAV = [
  ["index.html", "Início"],
  ["explorar.html", "Explorar"],
  ["documentos.html", "Documentos"],
  ["comunidade.html", "Comunidade"],
];

(function mountChrome() {
  const here = location.pathname.split("/").pop() || "index.html";
  const page = here.includes(".") ? here : here + ".html";
  const current = page === "ficha.html" ? "documentos.html" : page;

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a class="skip" href="#conteudo">Pular para o conteúdo</a>
    <div class="wrap">
      <a class="brand" href="index.html" aria-label="Aster66 — início">${LOGO_SVG}<span class="brand-name">Aster<b>66</b></span></a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="nav-principal">Menu</button>
      <nav class="nav" id="nav-principal" aria-label="Principal">
        ${NAV.map(([href, label]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
      </nav>
      <div class="nav-auth" id="nav-auth"></div>
    </div>`;
  document.body.prepend(header);

  const toggle = header.querySelector(".nav-toggle");
  const nav = header.querySelector(".nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  const footer = document.createElement("footer");
  footer.innerHTML = `
    <div class="palette-strip" aria-hidden="true">
      <span style="background:#08080A"></span><span style="background:#FFFFFF"></span>
      <span style="background:#C91D2E"></span><span style="background:#E5A93C"></span>
    </div>
    <div class="site-footer">
      <div class="wrap">
        <span>Aster66 — RPG de cartas no mundo de Aster. Versão local de avaliação.</span>
        <span><a href="mailto:${window.ASTER_CONFIG.email}">${window.ASTER_CONFIG.email}</a></span>
      </div>
    </div>`;
  document.body.append(footer);

  document.querySelectorAll("[data-email]").forEach((el) => {
    el.textContent = window.ASTER_CONFIG.email;
    if (el.tagName === "A") el.href = `mailto:${window.ASTER_CONFIG.email}`;
  });
})();

window.escapeHTML = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

window.formatDate = (iso) =>
  new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
