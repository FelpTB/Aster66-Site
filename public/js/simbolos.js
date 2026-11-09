// Símbolos do Panteão de Édin — SVG desenhado à mão (traço na cor atual).
// Baseado em Notion › Site › Logos e Símbolos › Deuses e no texto de cada divindade.
(() => {
  const S = (corpo) => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;
  const SIMBOLOS = {
    // Maresia, A Viajante — pássaro em voo sobre a rosa dos ventos
    maresia: S(`<circle cx="24" cy="24" r="19" stroke-opacity=".35"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6" stroke-opacity=".5"/>
      <path d="M10 22c5-5 9-5 14 1 5-6 9-6 14-1-4 0-8 2-10 6l-4 5-4-5c-2-4-6-6-10-6z"/><path d="M24 23v10"/>`),
    // Rekh, A Mente do Mundo — o olho
    rekh: S(`<path d="M5 24c5-8 12-12 19-12s14 4 19 12c-5 8-12 12-19 12S10 32 5 24z"/><circle cx="24" cy="24" r="6.5"/><circle cx="24" cy="24" r="2.2" fill="currentColor"/>
      <path d="M24 6v3M24 39v3M11 9l2 2.5M37 9l-2 2.5" stroke-opacity=".5"/>`),
    // Hief, O Trabalhador — martelo e picareta cruzados
    hief: S(`<path d="M13 35 33 15"/><path d="M27 9l12 12-3 3-12-12z"/><path d="M35 35 15 15"/><path d="M8 18c3-6 9-10 15-10-4 2-7 6-8 11"/><path d="M10 38h28" stroke-opacity=".5"/>`),
    // Amon, O Deus do Sangue — gota de sangue com coroa
    amon: S(`<path d="M24 9c-6 9-11 15-11 21a11 11 0 0 0 22 0c0-6-5-12-11-21z"/><path d="M19 30a5 5 0 0 0 5 5" stroke-opacity=".6"/><path d="M17 6l3 3 4-4 4 4 3-3" stroke-opacity=".6"/>`),
    // Ísana, A Grande Mãe Serpente — serpente em círculo trocando de pele
    isana: S(`<path d="M37 18a14 14 0 1 1-6-6"/><path d="M31 12l5-1-1 5"/><path d="M37 18c2-1 4 0 4 2s-2 3-4 2"/><circle cx="24" cy="24" r="6" stroke-dasharray="2 3" stroke-opacity=".6"/>`),
    // Mutwet, A Forma da Morte — foice
    mutwet: S(`<path d="M16 42 30 8"/><path d="M30 8c-8-1-17 3-21 10 6-3 13-3 19-1"/><path d="M13 34h8" stroke-opacity=".6"/>`),
    // Anhangá, O Protetor da Natureza — cabeça de veado com galhos
    anhanga: S(`<path d="M18 22c0 8 3 14 6 17 3-3 6-9 6-17-2-2-4-3-6-3s-4 1-6 3z"/><path d="M18 22c-4-3-6-8-5-14M13 13l-4-2M14 17l-5 1M30 22c4-3 6-8 5-14M35 13l4-2M34 17l5 1"/><circle cx="21" cy="27" r=".8" fill="currentColor"/><circle cx="27" cy="27" r=".8" fill="currentColor"/>`),
    // Bacco, O Virtuoso Viciado — máscara do teatro
    bacco: S(`<path d="M10 10h28v12c0 9-6 16-14 16s-14-7-14-16z"/><path d="M15 19c2-2 5-2 7 0M26 19c2-2 5-2 7 0"/><path d="M17 28c4 4 10 4 14 0"/><path d="M38 14c3 0 5 2 5 5" stroke-opacity=".5"/>`),
    // Marduva, O Emissário da Guerra — espadas cruzadas
    marduva: S(`<path d="M10 10l22 22M38 10 16 32"/><path d="M28 36l8-8M12 28l8 8"/><path d="M33 33l5 5M15 33l-5 5"/><path d="M10 10l1 5 4-1M38 10l-1 5-4-1" stroke-opacity=".6"/>`),
    // Niod, O Paciente — relógio
    niod: S(`<circle cx="24" cy="26" r="15"/><path d="M24 26V16M24 26l7 4"/><path d="M20 7h8M24 7v4"/><path d="M24 13v1M37 26h-1M24 39v-1M11 26h1" stroke-opacity=".6"/>`),
    // Ohirume, A Filha do Sol — sol
    ohirume: S(`<circle cx="24" cy="24" r="8"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11 11l4 4M33 33l4 4M37 11l-4 4M15 33l-4 4"/>`),
    // Ah-Rimã, A Sombra dos Eleitos — eclipse / sombra
    ahrima: S(`<circle cx="24" cy="24" r="14"/><path d="M28 11a14 14 0 0 1 0 26 11 11 0 0 0 0-26z" fill="currentColor" fill-opacity=".85"/><path d="M8 40c6-3 10-3 16 0s10 3 16 0" stroke-opacity=".5"/>`),
    // Mattiya, O Eleito — auréola e radiância
    mattiya: S(`<ellipse cx="24" cy="12" rx="10" ry="3.5"/><path d="M24 20v20M17 27h14" /><path d="M14 22l-4-2M34 22l4-2M12 30H8M36 30h4" stroke-opacity=".6"/>`),
    // Zir-Aster, O Deus da Magia — hexagrama dos astros
    ziraster: S(`<circle cx="24" cy="24" r="17" stroke-opacity=".5"/><path d="M24 9l13 22.5H11z"/><path d="M24 39 11 16.5h26z"/><circle cx="24" cy="24" r="3" fill="currentColor"/>`),
  };
  const chave = (nome) => String(nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .split(",")[0].replace(/[^a-z]/g, "").replace(/^mardurva$/, "marduva");
  window.simboloDeus = (nome) => SIMBOLOS[chave(nome)] || SIMBOLOS.ziraster;
})();
