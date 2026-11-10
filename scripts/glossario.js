// Sumário (glossário) do site e termos técnicos do sistema.
//
// FONTES: páginas de regras do Notion (Sumário) e como cada uma vira entradas do sumário.
//   tipo "pagina"      → a página inteira vira uma entrada (nome)
//   tipo "intro"       → só o texto antes do primeiro título vira uma entrada (nome)
//   tipo "subpaginas"  → cada subpágina vira uma entrada; o grupo é o último título acima dela
//   tipo "secoes"      → cada título nos níveis indicados vira uma entrada (até o próximo título do mesmo nível)
//                        `apenas`: só esses títulos · `dentroDe`: só dentro desse título
//   tipo "lista"       → cada linha "Nome: explicação" (parágrafo ou item de lista) vira uma entrada
//
// TERMOS: palavras que, escritas como nome próprio (com maiúscula), viram link no site para a
// entrada do sumário (`entrada`). `formas` são as variações aceitas (plural etc.), já com maiúscula.
// `padronizar` = expressões que o script de padronização troca pela forma com maiúscula no Notion
// (sem mudar o sentido). Se a expressão tem 2 grupos, só o último é trocado (o 1º é contexto).
// `renomear` troca palavras na forma padronizada (ex.: "acerto crítico" → "Golpe Crítico").
// Ordem não importa: o termo mais longo sempre vence ("Corpo a Corpo" > "Corpo").
"use strict";

const FONTES = [
  { id: "6e5f5867e960823abf71010365d3e4a6", categoria: "Conceitos", entradas: [{ tipo: "subpaginas" }] },
  {
    id: "3acf5867e96083afb833812df176ed95", categoria: "Combate", entradas: [
      { tipo: "intro", nome: "Combate" },
      { tipo: "secoes", niveis: [2] },
      { tipo: "secoes", niveis: [1], apenas: ["Fim de Combate"] },
    ],
  },
  {
    id: "d8af5867e9608223a80a8155e5b88155", categoria: "Entreato", entradas: [
      { tipo: "intro", nome: "Cenas de Entreato" },
      { tipo: "secoes", niveis: [1, 3] },
    ],
  },
  { id: "b1ff5867e960823995dc815fdcaa778a", categoria: "Cartas", entradas: [{ tipo: "intro", nome: "Cartas" }] },
  { id: "79bf5867e96082cbb35a0119616317b5", categoria: "Cartas", grupo: "Tipos de Carta", entradas: [{ tipo: "secoes", niveis: [3] }] },
  {
    id: "22ef5867e96082c3bba58189fb065aeb", categoria: "Cartas", grupo: "Modos de Uso", entradas: [
      { tipo: "intro", nome: "Modo de Uso" },
      { tipo: "secoes", niveis: [3] },
    ],
  },
  {
    id: "0dcf5867e960834aaf3b01c5eac758e3", categoria: "Cartas", grupo: "Cooldown", entradas: [
      { tipo: "intro", nome: "Cooldown" },
      { tipo: "secoes", niveis: [2] },
    ],
  },
  {
    id: "3edf5867e96083cc9e82815747ee6048", categoria: "Cartas", grupo: "Níveis de Alcance", entradas: [
      { tipo: "lista" },
      { tipo: "secoes", niveis: [1] },
    ],
  },
  {
    id: "f23f5867e96082eb84948149e5a3be11", categoria: "Cartas", grupo: "Raridades", entradas: [
      { tipo: "intro", nome: "Raridade" },
      { tipo: "lista" },
    ],
  },
  {
    id: "d6ef5867e96083b1b8ce819157ae63cc", categoria: "Personagem", entradas: [
      { tipo: "pagina", nome: "Origens" },
    ],
  },
  { id: "92ef5867e96083fe86fb01fa8c9fe06d", categoria: "Personagem", entradas: [{ tipo: "pagina", nome: "Raças e Classes" }] },
  {
    id: "ac5f5867e96083eca9f8814a8a73f330", categoria: "Personagem", grupo: "Inventário", entradas: [
      { tipo: "secoes", niveis: [3], apenas: ["Inventário e Tipos de espaço"], soIntro: true, nome: "Inventário" },
      { tipo: "secoes", niveis: [3, 4], dentroDe: "Inventário e Tipos de espaço" },
      { tipo: "secoes", niveis: [4], apenas: ["Múltiplas Raças", "Múltiplas Classes"] },
    ],
  },
  {
    id: "c88f5867e96083bf955181d6aedf6e47", categoria: "Itens", entradas: [{ tipo: "intro", nome: "Itens" }],
  },
  { id: "92af5867e96083bba50481c904c99649", categoria: "Itens", grupo: "Tipos de Item", entradas: [{ tipo: "lista" }] },
  { id: "07ef5867e9608395bd7a019a353304c4", categoria: "Itens", grupo: "Modo de Uso dos Itens", entradas: [{ tipo: "lista" }] },
  { id: "da6f5867e9608399bd4f8114786cc571", categoria: "Itens", grupo: "Empunhadura", entradas: [{ tipo: "lista" }] },
  {
    id: "d94f5867e96082798d15010d3c731851", categoria: "Condições", entradas: [
      { tipo: "intro", nome: "Condições" },
      { tipo: "secoes", niveis: [2], apenas: ["Condições Simples", "Condições Complexas"] },
    ],
  },
  { id: "d57f5867e96083a19f8b814f1b00b0b8", categoria: "Criaturas", grupo: "Tipos de Defesa", entradas: [{ tipo: "secoes", niveis: [3] }] },
];

// Entrada do sumário de cada termo (pelo nome da entrada). As condições ainda não têm página
// própria neste workspace: apontam para "Condições" até a Lista de Condições ser trazida.
const CONDICOES = "Condições";
const TERMOS = [
  // Atributos (só viram link/são padronizados em contexto de regra: "Teste de Corpo", "+1 de Mente"…)
  ...["Corpo", "Mente", "Alma", "Destreza", "Foco", "Conhecimento"].map((a) => ({
    entrada: "Atributos Base", formas: [a], contexto: true,
    padronizar: [
      new RegExp(`(\\btestes? de )(${a.toLowerCase()})\\b`, "g"),
      new RegExp(`(\\batributos? (?:de )?)(${a.toLowerCase()})\\b`, "g"),
      new RegExp(`(\\bmodificador(?:es)? de )(${a.toLowerCase()})\\b`, "g"),
      new RegExp(`([+-]?\\d+ (?:pontos? )?(?:de )?)(${a.toLowerCase()})\\b`, "g"),
    ],
  })),
  { entrada: "Atributos Base", formas: ["Atributos Base", "Atributo Base"] },

  { entrada: "Ação", formas: ["Ação", "Ações"], padronizar: [/\b(ação|ações)\b(?! livres?)/g] },
  { entrada: "Ação Livre", formas: ["Ação Livre", "Ações Livres"], padronizar: [/\b(ação livre|ações livres|Ação livre|Ações livres)\b/g] },
  { entrada: "Reação", formas: ["Reação", "Reações"], padronizar: [/\b(reação|reações)\b/g] },
  { entrada: "Bloqueio", formas: ["Bloqueio", "Bloqueios"], padronizar: [/\b(bloqueio|bloqueios)\b(?! perene)/g] },
  { entrada: "Bloqueio Perene", formas: ["Bloqueio Perene"], padronizar: [/\b(bloqueio perene|Bloqueio perene)\b/g] },
  { entrada: "Esquiva", formas: ["Esquiva", "Esquivas"], padronizar: [/\b(esquiva|esquivas)\b(?! perene)/g] },
  { entrada: "Esquiva Perene", formas: ["Esquiva Perene"], padronizar: [/\b(esquiva perene|Esquiva perene)\b/g] },
  { entrada: "Vida", formas: ["Vida"], padronizar: [/\b(vida)\b/g] },
  { entrada: "Energia", formas: ["Energia"], padronizar: [/\b(energia)\b/g] },
  { entrada: "Deslocamento", formas: ["Deslocamento"], padronizar: [/\b(deslocamento)\b/g] },
  { entrada: "Cicatrizes", formas: ["Cicatriz", "Cicatrizes"], padronizar: [/\b(cicatriz|cicatrizes)\b/g] },
  { entrada: "Tipos de Dano", formas: ["Tipos de Dano", "Tipo de Dano", "Dano Verdadeiro", "Dano Físico", "Danos Físicos", "Dano Elemental", "Danos Elementais"],
    padronizar: [/\b(danos? verdadeiros?|Danos? verdadeiros?)\b/g, /\b(danos? físicos?|Danos? físicos?)\b/g, /\b(dano elemental|danos elementais|Dano elemental)\b/g] },
  { entrada: "Hierarquia de Tempo", formas: ["Hierarquia de Tempo"] },
  { entrada: "Disparo", formas: ["Disparo", "Disparos"], padronizar: [/\b(disparo|disparos)\b/g] },
  { entrada: "Golpe Limpo", formas: ["Golpe Limpo", "Golpes Limpos"], renomear: { Acerto: "Golpe", Acertos: "Golpes" },
    padronizar: [/\b(golpes? limpos?|acertos? limpos?|Acertos? limpos?|Golpes? limpos?|Acerto Limpo|Acertos Limpos)\b/g] },
  { entrada: "Golpe Crítico", formas: ["Golpe Crítico", "Golpes Críticos"], renomear: { Acerto: "Golpe", Acertos: "Golpes", Critico: "Crítico", Criticos: "Críticos" },
    padronizar: [/\b(golpes? cr[ií]ticos?|acertos? cr[ií]ticos?|Acertos? cr[ií]ticos?|Golpes? cr[ií]ticos?|Acerto Cr[ií]tico|Acertos Cr[ií]ticos|Golpe Critico)\b/g] },
  { entrada: "Ligação", formas: ["Ligação"], padronizar: [/\b(ligação)\b/g] },
  { entrada: "Raças Edinianas", formas: ["Raças Edinianas", "Raça Ediniana"], padronizar: [/\b(raças edinianas|raça ediniana)\b/g] },

  { entrada: "Turnos", formas: ["Turno", "Turnos"], padronizar: [/\b(turno|turnos)\b/g] },
  { entrada: "Rodadas", formas: ["Rodada", "Rodadas"], padronizar: [/\b(rodada|rodadas)\b/g] },
  { entrada: "Fila de Cooldown", formas: ["Fila de Cooldown"], padronizar: [/\b(fila de cooldown|fila de Cooldown|Fila de cooldown)\b/g] },
  { entrada: "Cooldown", formas: ["Cooldown"], padronizar: [/\b(cooldown)\b/g] },
  { entrada: "Uso único", formas: ["Uso Único"], padronizar: [/\b(uso único|Uso único)\b/g] },
  { entrada: "Uso livre", formas: ["Uso Livre"], padronizar: [/\b(uso livre|Uso livre)\b/g] },

  { entrada: "Descanso", formas: ["Descanso"], padronizar: [/\b(descanso)\b/g] },
  { entrada: "Pausa", formas: ["Pausa"] },
  { entrada: "Repouso Curto", formas: ["Repouso Curto"], padronizar: [/\b(repouso curto|Repouso curto)\b/g] },
  { entrada: "Repouso Completo", formas: ["Repouso Completo"], padronizar: [/\b(repouso completo|Repouso completo)\b/g] },
  { entrada: "Cenas de Entreato", formas: ["Entreato", "Cena de Entreato", "Cenas de Entreato"], padronizar: [/\b(entreato)\b/g] },

  { entrada: "Corpo a Corpo", formas: ["Corpo a Corpo"], padronizar: [/\b(corpo a corpo|Corpo a corpo)\b/g] },
  { entrada: "Efeitos em Área", formas: ["Efeito em Área", "Efeitos em Área", "Área de Efeito"],
    padronizar: [/\b(efeitos? em área|Efeitos? em área|área de efeito|Área de efeito)\b/g] },

  { entrada: "Origens", formas: ["Origem", "Origens"], padronizar: [/\b(origem|origens)\b/g] },
  { entrada: "Raridade", formas: ["Raridade", "Raridades"] },
  { entrada: "Habilidade Inata", formas: ["Habilidade Inata", "Habilidades Inatas"], padronizar: [/\b(habilidades? inatas?|Habilidades? inatas?)\b/g] },
  { entrada: "Habilidade Característica", formas: ["Habilidade Característica", "Habilidades Características"],
    padronizar: [/\b(habilidades? características?|Habilidades? características?)\b/g] },

  { entrada: "Inventário", formas: ["Inventário"], padronizar: [/\b(inventário)\b/g] },
  { entrada: "Em mãos", formas: ["Em Mãos"], padronizar: [/\b(em mãos|Em mãos)\b/g] },
  { entrada: "Acesso Rápido", formas: ["Acesso Rápido"], padronizar: [/\b(acesso rápido|Acesso rápido)\b/g] },

  // Cartas: tipos, modos de uso, alcance
  { entrada: "Magia", formas: ["Magia", "Magias"] },
  { entrada: "Ritual", formas: ["Ritual", "Rituais"] },
  { entrada: "Ritmos", formas: ["Ritmo", "Ritmos"] },
  { entrada: "Receita", formas: ["Receita", "Receitas"] },
  { entrada: "Treinamento", formas: ["Treinamento", "Treinamentos"] },
  { entrada: "Cartas de Descanso", formas: ["Cartas de Descanso", "Carta de Descanso"] },
  { entrada: "Modo de Uso", formas: ["Modo de Uso", "Modos de Uso"], padronizar: [/(modos? de uso|Modos? de uso)/g] },
  { entrada: "Passivo", formas: ["Passivo", "Passiva", "Passivas", "Passivos"] },
  { entrada: "Evolução", formas: ["Evolução", "Evoluções"] },
  { entrada: "Si Mesmo", formas: ["Si Mesmo"] },
  { entrada: "Em Cena", formas: ["Em Cena"] },
  { entrada: "Efeitos em Área", formas: ["Em Área"] },
  // Itens
  { entrada: "Equipado", formas: ["Equipado", "Equipada", "Equipados", "Equipadas"] },
  { entrada: "Guardado", formas: ["Guardado", "Guardada", "Guardados", "Guardadas"] },
  { entrada: "Duas mãos", formas: ["Duas Mãos"], padronizar: [/(duas mãos|Duas mãos)/g] },
  { entrada: "Uma mão", formas: ["Uma Mão"] },
  { entrada: "Mão e Meia", formas: ["Mão e Meia"], padronizar: [/(mão e meia|Mão e meia)/g] },
  { entrada: "Meia mão", formas: ["Meia Mão"], padronizar: [/(meia mão|Meia mão)/g] },
  { entrada: "Múltiplas Raças", formas: ["Múltiplas Raças"] },
  { entrada: "Múltiplas Classes", formas: ["Múltiplas Classes"] },
  { entrada: "Condições", formas: ["Condição", "Condições"], padronizar: [/\b(condição|condições)\b(?! (?:simples|complexas?))/g] },
  { entrada: "Condições Simples", formas: ["Condição Simples", "Condições Simples"], padronizar: [/\b(condiç(?:ão|ões) simples|Condiç(?:ão|ões) simples)\b/g] },
  { entrada: "Condições Complexas", formas: ["Condição Complexa", "Condições Complexas"], padronizar: [/\b(condiç(?:ão|ões) complexas?|Condiç(?:ão|ões) complexas?)\b/g] },
  // Condições individuais (página própria quando a Lista de Condições estiver neste workspace)
  ...[
    ["Morrendo", /\b(morrendo)\b/g],
    ["Atordoamento", /\b(atordoamento)\b/g], ["Atordoado", /\b(atordoad[oa]s?)\b/g],
    ["Tontura", /\b(tontura)\b/g], ["Tonto", /\b(tont[oa]s?)\b/g],
    ["Sangramento", /\b(sangramento)\b/g], ["Sangrando", /\b(sangrando)\b/g],
    ["Queimadura", /\b(queimaduras?)\b/g],
    ["Cegueira", /\b(cegueira)\b/g],
    ["Derrubado", /\b(derrubad[oa]s?)\b/g], ["Agarrado", /\b(agarrad[oa]s?)\b/g], ["Imobilizado", /\b(imobilizad[oa]s?)\b/g],
    ["Resfriado", /\b(resfriad[oa]s?)\b/g], ["Congelamento", /\b(congelamento)\b/g], ["Congelado", /\b(congelad[oa]s?)\b/g],
    ["Envenenamento", /\b(envenenamento)\b/g], ["Envenenado", /\b(envenenad[oa]s?)\b/g],
    ["Furtividade", /\b(furtividade)\b/g], ["Furtivo", /\b(furtiv[oa]s?)\b/g],
    ["Selamento", /\b(selamento)\b/g],
  ].map(([nome, re]) => ({ entrada: nome, alternativa: CONDICOES, formas: formasCondicao(nome), padronizar: [re] })),
];

function formasCondicao(nome) {
  if (/o$/.test(nome) && !/ento$/.test(nome) && nome !== "Morrendo" && nome !== "Sangrando") {
    const base = nome.slice(0, -1);
    return [nome, base + "a", nome + "s", base + "as"];
  }
  return nome === "Queimadura" ? ["Queimadura", "Queimaduras"] : [nome];
}

// "fila de cooldown" → "Fila de Cooldown" (conectivos ficam minúsculos)
const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "a", "e", "em", "o"]);
function nomeProprio(texto, renomear = {}) {
  return texto.split(" ").map((p, i) => {
    if (i > 0 && MINUSCULAS.has(p.toLowerCase())) return p.toLowerCase();
    const cap = p.charAt(0).toUpperCase() + p.slice(1);
    return renomear[cap] || cap;
  }).join(" ");
}

module.exports = { FONTES, TERMOS, nomeProprio };
