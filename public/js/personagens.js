// Página Personagens: catálogo da base "Personagens" do Notion (esquema `aster`).
(() => {
  const juntar = (v) => (Array.isArray(v) ? v.join(", ") : v || "");
  window.CatalogoSimples.montar(document.getElementById("cat-personagens"), {
    rotulo: ["personagem", "personagens"], termos: false,
    carregar: () => window.AsterDB.tabela("personagens", "id,nome,nivel_do_personagem,locais_relacionados,organizacoes_relacionadas,conteudo,icone"),
    sub: (x) => [x.nivel_do_personagem, juntar(x.organizacoes_relacionadas)].filter(Boolean).join(" · "),
    filtros: [
      { rotulo: "Nível", valores: (x) => x.nivel_do_personagem },
      { rotulo: "Local", valores: (x) => x.locais_relacionados },
      { rotulo: "Organização", valores: (x) => x.organizacoes_relacionadas },
    ],
    ficha: (x) => [["Nível", x.nivel_do_personagem], ["Locais", x.locais_relacionados], ["Organizações", x.organizacoes_relacionadas]],
  });
})();
