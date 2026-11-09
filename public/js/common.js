// Cabeçalho, rodapé e utilidades compartilhadas.
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
  ["ferramentas.html", "Ferramentas"],
  ["documentos.html", "Documentos"],
  ["noticias.html", "Notícias"],
  ["comunidade.html", "Comunidade"],
];

(function mountChrome() {
  const here = location.pathname.split("/").pop() || "index.html";
  const page = here.includes(".") ? here : here + ".html";
  const current = page === "ficha.html" ? "ferramentas.html" : page;

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a class="skip" href="#conteudo">Pular para o conteúdo</a>
    <div class="wrap">
      <div class="navbar">
        <a class="brand" href="index.html" aria-label="Aster66 — início">${LOGO_SVG}<span class="brand-name">Aster<b>66</b></span></a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="nav-principal">Menu</button>
        <nav class="nav" id="nav-principal" aria-label="Principal">
          ${NAV.map(([href, label]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
        </nav>
        <div class="nav-end">
          <div class="nav-auth" id="nav-auth"></div>
          <a class="btn btn-primary btn-small nav-cta" href="ficha.html">Criar personagem</a>
        </div>
      </div>
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
        <span>Aster66 — RPG de cartas no mundo de Aster.</span>
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
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

window.formatDate = (iso) =>
  new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

// Markdown do Notion (coluna `conteudo` do Supabase) → HTML seguro.
// Suporta títulos, parágrafos, listas, citações, tabelas simples, negrito, itálico e código.
window.mdHTML = (md, { semLinkOriginal = true } = {}) => {
  const esc = window.escapeHTML;
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  const linhas = String(md || "").replace(/\r/g, "").split("\n");
  const out = [];
  let lista = null, para = [];
  const fechaPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join("<br>")}</p>`); para = []; } };
  const fechaLista = () => { if (lista) { out.push(`</${lista}>`); lista = null; } };
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    if (semLinkOriginal && /^Página original:/i.test(l.trim())) continue;
    let m;
    if (!l.trim()) { fechaPara(); fechaLista(); continue; }
    if ((m = l.match(/^(#{1,6})\s+(.*)$/))) { fechaPara(); fechaLista(); const n = Math.min(m[1].length + 2, 6); out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
    if (/^---+$/.test(l.trim())) { fechaPara(); fechaLista(); out.push("<hr>"); continue; }
    if ((m = l.match(/^>\s?(.*)$/))) { fechaPara(); fechaLista(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    if ((m = l.match(/^\s*(?:[-*]|\d+\.)\s+(?:\[[ x]\]\s+)?(.*)$/))) {
      fechaPara();
      const tipo = /^\s*\d+\./.test(l) ? "ol" : "ul";
      if (lista !== tipo) { fechaLista(); out.push(`<${tipo}>`); lista = tipo; }
      out.push(`<li>${inline(m[1])}</li>`); continue;
    }
    if (/^\|.*\|$/.test(l.trim())) {
      fechaPara(); fechaLista();
      const rows = [];
      while (i < linhas.length && /^\|.*\|$/.test(linhas[i].trim())) { rows.push(linhas[i].trim()); i++; }
      i--;
      const cells = (r) => r.slice(1, -1).split(/(?<!\\)\|/).map((c) => inline(c.trim().replace(/\\\|/g, "|")));
      const corpo = rows.filter((r) => !/^\|[-\s|]+\|$/.test(r));
      out.push(`<div class="md-table"><table>${corpo.map((r, k) => `<tr>${cells(r).map((c) => k ? `<td>${c}</td>` : `<th>${c}</th>`).join("")}</tr>`).join("")}</table></div>`);
      continue;
    }
    if (/^!\[/.test(l.trim())) continue; // imagens do Notion expiram — não exibimos
    fechaLista();
    para.push(l.trim());
  }
  fechaPara(); fechaLista();
  return out.join("\n");
};

// Janela modal reutilizável: abrirModal(html, { largo: true }).
window.abrirModal = (() => {
  let dlg;
  return (html, { largo = false } = {}) => {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "modal";
      dlg.innerHTML = `<button class="modal-close" aria-label="Fechar" data-close>×</button><div class="modal-body"></div>`;
      dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });
      document.body.append(dlg);
    }
    dlg.classList.toggle("modal-largo", largo);
    dlg.querySelector(".modal-body").innerHTML = html;
    dlg.querySelector(".modal-body").scrollTop = 0;
    if (!dlg.open) dlg.showModal();
    return dlg;
  };
})();

// Monograma (símbolo provisório) para cards sem arte própria.
window.monograma = (nome) => {
  const limpo = String(nome || "?").replace(/^(Aventureiro:\s*)/i, "").trim();
  return window.escapeHTML(limpo[0] || "?");
};
