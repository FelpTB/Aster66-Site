// Gerado a partir de racas-classes.csv (Sheet-Maker). Fonte de verdade: Notion.
window.ASTER_PERSONAGENS = [
 {
  "tipo": "raca",
  "nome": "Anão",
  "resumo": "Anões acreditam terem sido forjados por Deus para ajudarem na construção do mundo, isso se reflete em sua cultura, que valoriza muito o trabalho. Essa raça possui um vigor e força física incomparáveis, são capazes de trabalhar por horas sem se cansarem.",
  "atributos": {
   "Conhecimento": 1,
   "Corpo": 2
  },
  "livres": 0,
  "vida": 12,
  "energia": 5,
  "origens": [
   "Anão"
  ],
  "habilidade": {
   "nome": "Vitalidade do Ofício",
   "texto": "O máximo do atributo de corpo sobe para 7. Anões ganham os benefícios do descanso mesmo enquanto usam habilidades de Descanso."
  }
 },
 {
  "tipo": "raca",
  "nome": "Asteriano",
  "resumo": "Asterianos nascem da vontade do próprio planeta, são normalmente grandes e fortes por natureza. Existem diversos tipos de Asteriano, desde os mais próximos a humanos até os que são puramente compostos por rochas e cristais, todos possuem forte ligação com magias de terra e magias que envolvem manipulação de plantas e outros seres vivos.",
  "atributos": {
   "Alma": 1,
   "Conhecimento": 1,
   "Corpo": 1
  },
  "livres": 0,
  "vida": 12,
  "energia": 6,
  "origens": [
   "Asteriano",
   "Druidismo",
   "Magia de Terra"
  ],
  "habilidade": {
   "nome": "Descedente de Aster",
   "texto": "Como descendente do próprio planeta, você tem uma ligação forte com a natureza e com a terra. Aprenda uma habilidade de Magia de Terra ou Druidismo. Pode aprender habilidades das origens Magia de Terra e Druidismo."
  }
 },
 {
  "tipo": "raca",
  "nome": "Doppelganger",
  "resumo": "Doppelgangers são criaturas capazes de roubar a aparência de outras raças. Essa raça permite ao personagem não só mudar de aparência física, mas também roubar atributos e até habilidades de quem ele se transforma.",
  "atributos": {},
  "livres": 3,
  "vida": 8,
  "energia": 8,
  "origens": [
   "Doppleganger"
  ],
  "habilidade": {
   "nome": "Doppleganger",
   "texto": "O doppleganger pode roubar a aparência de uma pessoa, se transformando nela e mantendo essa transformação até o fim da cena ou até decidir se Destransformar. Enquanto estiver transformado a habilidade inata “Doppleganger” se transforma na/nas habilidades inatas da pessoa transformada, além é claro da aparência corporal, que fica idêntica. Ao realizar uma transformação o doppleganger pode realizar um teste para aprender a se transformar naquela pessoa, o teste é um teste de corpo contra o alvo da transformação, o alvo faz uma rolagem e para obter um sucesso o doppleganger deve rolar um resultado igual ao rolado pelo alvo, em caso de falha a habilidade continua normalmente, em caso de sucesso o doppleganger aprende aquela transformação e pode mantê-la por tempo indeterminado além de poder se"
  }
 },
 {
  "tipo": "raca",
  "nome": "Draconato",
  "resumo": "Draconatos são híbridos de dragões e humanos, eles possuem podem mágico e características herdadas do sangue de dragão. Essa raça possui um grande número de habilidades inatas, permitindo ao personagem de tornar praticamente um dragão completo com o tempo.",
  "atributos": {
   "Corpo": 1,
   "Alma": 2
  },
  "livres": 0,
  "vida": 10,
  "energia": 7,
  "origens": [
   "Dracônico"
  ],
  "habilidade": {
   "nome": "Herança Dracônica",
   "texto": "Escolha uma nova origem, essa origem define o tipo de seu sopro e a resistência de suas escamas: Origem Tipo de dano Magia de Fogo Dano de Queimadura Magia de Raio Dano Elétrico Magia de Gelo Dano de Congelamento Magia de Água Dano Perfurante Magia de Terra Dano de Impacto Magia de Vento Dano Cortante Os Draconatos podem aprender de 1 a 3 habilidades inatas dracônicas, dependendo do número aprendido são ganhos outros benefícios para compensar. Número total de habilidades Atributos de Compensação 1 1 ponto livre de atributo 2 +2 de energia máxima 3 nada Habilidades Iniciais: “Sopro de Dragão” “Asas de Dragão” “Escamas de Dragão”"
  }
 },
 {
  "tipo": "raca",
  "nome": "Elfo",
  "resumo": "Elfos são a raça com maior expectativa de vida, eles possuem forte ligação com a magia e acumulam conhecimento com o passar das eras. Essa raça permite ao personagem aprender habilidades e origens extras, além de fornecer diversas outras habilidades inatas.",
  "atributos": {
   "Conhecimento": 1,
   "Destreza": 1,
   "Foco": 1
  },
  "livres": 0,
  "vida": 8,
  "energia": 8,
  "origens": [
   "Élfico"
  ],
  "habilidade": {
   "nome": "Conhecimento de Eras",
   "texto": "Inicie com uma Origem extra e uma habilidade da origem escolhida."
  }
 },
 {
  "tipo": "raca",
  "nome": "Goblin",
  "resumo": "Goblins são extremamente fracos no início, sendo a raça mais frágil e inútil de todas, porém carregam dentro de sim um poder único. Goblins podem evoluir com base no que comem em seu ritual de antropofagia, essa habilidade permite a eles ganhar atributos e habilidades indefinidamente.",
  "atributos": {
   "Alma": 1,
   "Destreza": 1
  },
  "livres": 0,
  "vida": 6,
  "energia": 6,
  "origens": [
   "Goblin"
  ],
  "habilidade": {
   "nome": "Ritual Antropofágico",
   "texto": "O usuário consome uma parte do corpo de um inimigo derrotado e adquire poder com base em um teste, a rolagem é 2d6 + X (X = nível do inimigo/10 arredondado para baixo) e o bonus recebido depende do resultado. Tabela de Bônus: 2 - Aumenta 1d6 de vida máxima. 3 - +3 de energia máxima. 4 - +2 de energia máxima. 5 - +2 de vida máxima. 6 - Sucesso automático no próximo teste. 7 - +1 de vida máxima. 8 - Cura vida e energia completamente. 9 - +1 de energia máxima. 10 - +3 de vida máxima. 11 - +1 de atributo.(Baseado no atributo mais alto do inimigo consumido, em caso de empate o jogador escolhe) 12 - Aprende uma habilidade do inimigo abatido ( O jogador escolhe a habilidade)"
  }
 },
 {
  "tipo": "raca",
  "nome": "Humano",
  "resumo": "Humanos são focados na adaptação, não possuem habilidades muito especiais e únicas, mas podem aumentar os atributos de sua preferência.",
  "atributos": {
   "Alma": 1,
   "Corpo": 1,
   "Mente": 1
  },
  "livres": 0,
  "vida": 8,
  "energia": 6,
  "origens": [
   "Humano"
  ],
  "habilidade": {
   "nome": "Versatilidade Humana",
   "texto": "Ganhe 2 pontos de atributo livres. (Você distribui nos atributos que quiser)"
  }
 },
 {
  "tipo": "raca",
  "nome": "Infernal",
  "resumo": "Os infernais possuem mais de uma versão, podendo aparecer como sua versão incompleta que é fraca fisicamente mas possui grande resistência à magia. Já sua versão completa é poderosa em todos os aspectos, consegue absorver energia de ataques e utilizar em suas habilidades. A Descensão aumenta muito o poder dos infernais, mas é um processo extremamente complexo de se passar.",
  "atributos": {
   "Alma": 1,
   "Destreza": 1
  },
  "livres": 0,
  "vida": 6,
  "energia": 6,
  "origens": [
   "Infernal"
  ],
  "habilidade": {
   "nome": "Descensão Parcial",
   "texto": "Todo Dano não físico recebido é reduzido pela metade."
  }
 },
 {
  "tipo": "raca",
  "nome": "Infernal Completo",
  "resumo": "Os infernais possuem mais de uma versão, podendo aparecer como sua versão incompleta que é fraca fisicamente mas possui grande resistência à magia. Já sua versão completa é poderosa em todos os aspectos, consegue absorver energia de ataques e utilizar em suas habilidades. A Descensão aumenta muito o poder dos infernais, mas é um processo extremamente complexo de se passar.",
  "atributos": {
   "Corpo": 1,
   "Destreza": 1,
   "Alma": 2
  },
  "livres": 0,
  "vida": 10,
  "energia": 10,
  "origens": [
   "Infernal"
  ],
  "habilidade": {
   "nome": "Descensão Completa",
   "texto": "Possui um status novo: “Absorção”, esse atributo é igual a metade de sua energia máxima. Esse status começa com valor = 0. Enquanto o valor desse status for menor que o máximo, todo dano não físico recebido é reduzido pela metade. Caso absorção esteja em seu valor máximo, a redução de dano acaba. Cada ponto de dano mágico recebido aumenta o status de Absorção em +1. Pontos de Absorção podem ser usados como energia para o uso de habilidades."
  }
 },
 {
  "tipo": "raca",
  "nome": "Orc",
  "resumo": "Orcs são brutos e resistentes, os anos de opressão deram a eles uma habilidade de combate única, sua habilidade inata permite que eles resistam a qualquer condição simples, tornando eles imparáveis em combate.",
  "atributos": {
   "Alma": 1,
   "Corpo": 1
  },
  "livres": 0,
  "vida": 12,
  "energia": 5,
  "origens": [
   "Orc"
  ],
  "habilidade": {
   "nome": "Guiado pelo ódio",
   "texto": "Recebe: +1 de corpo +1 de alma -1 de mente Descanso: Resiste a primeira condição sofrida na cena. Combate: Dentro de combate resiste a primeira condição recebida a cada turno."
  }
 },
 {
  "tipo": "raca",
  "nome": "Vampiro",
  "resumo": "Vampiros são fortes fisicamente, possuem boa ligação com a magia, pode se regenerar completamente de feridas e condições e acima de tudo mantém sua juventude para sempre. Esse foi o resultado de tentar criar uma raça perfeita, mas houve uma falha genética que fez os vampiros se tornarem extremamente frágeis à luz do sol, o corpo de um vampiro sofre queimaduras extremas ao mínimo contato com a luz solar.",
  "atributos": {
   "Corpo": 1,
   "Destreza": 1,
   "Mente": 1
  },
  "livres": 0,
  "vida": 10,
  "energia": 6,
  "origens": [
   "Hemomancia",
   "Vampiro"
  ],
  "habilidade": {
   "nome": "Vampirismo",
   "texto": "Você pode absorver o sangue de um alvo que esteja sangrando gastando uma reação. Ao fazer isso causa 1d6 de dano ao alvo e recupere o mesmo valor como vida. Além disso roube 1 ponto do status mais alto do alvo até o fim da cena. Como o ponto de status é roubado ele é diminuído do alvo e acrescentado ao usuário."
  }
 },
 {
  "tipo": "classe",
  "nome": "Alquimista",
  "resumo": "Classe focada na criação de itens consumíveis, poções, remédios, entre outros. É capaz de acelerar a criação desses itens bem como substituir o uso de componentes que faltarem para a receita. Além disso, os alquimistas podem aprender Magias e Rituais, conjurando por meio de símbolos.",
  "atributos": {
   "Foco": 1,
   "Conhecimento": 2
  },
  "livres": 0,
  "vida": 8,
  "energia": 7,
  "origens": [
   "Alquimista"
  ],
  "habilidade": {
   "nome": "Troca Equivalente",
   "texto": "O alquimista pode acelerar a produção de consumíveis gastando energia, cada hora reduzida custa 1 de energia. Além disso o alquimista possui um “Arsenal de Transmutação”, em posse do Arsenal, ao realizar uma transmutação o alquimista pode substituir componentes necessários por acúmulos do Arsenal."
  }
 },
 {
  "tipo": "classe",
  "nome": "Atirador",
  "resumo": "Uma classe focada no combate, pode ser um causador de dano que ataca bem a distância ou até um suporte focado no posicionamento e fortalecimento do grupo por meio de ordens. A combinação de uma boa estratégia e o caminho livre para atirar tornam o Atirador um atacante ímpar.",
  "atributos": {
   "Conhecimento": 1,
   "Destreza": 1,
   "Foco": 1
  },
  "livres": 0,
  "vida": 8,
  "energia": 7,
  "origens": [
   "Atirador"
  ],
  "habilidade": {
   "nome": "Posicionar e Mirar",
   "texto": "Caso não tenha realizado nenhuma ação de movimento na ultima rodada, seu primeiro disparo nessa rodada é considerado um acerto limpo. (não pode ser afetado por reações de defesa)"
  }
 },
 {
  "tipo": "classe",
  "nome": "Aventureiro: Arqueólogo",
  "resumo": "O Arqueólogo é o arquétipo do Aventureiro que busca o conhecimento sobre o passado, essa classe permite o personagem a aprender línguas antigas e encontrar mais facilmente itens e relíquias mágicas. A força no combate vem do número de itens mágicos equipados, é uma classe que pede uma boa gestão do inventário.",
  "atributos": {
   "Conhecimento": 1
  },
  "livres": 2,
  "vida": 8,
  "energia": 7,
  "origens": [
   "Arqueólogo"
  ],
  "habilidade": {
   "nome": "Exploração Arqueológica",
   "texto": "Ao explorar um cenário o arqueólogo encontra qualquer item mágico ou relíquia antiga que esteja disponível na cena. Caso não haja algo assim, o arqueólogo recebe uma “Relíquia Antiga”. Após usar essa habilidade o arqueólogo explora o cenário completamente, mapeando todas as armadilhas, passagens e segredos escondidos ali."
  }
 },
 {
  "tipo": "classe",
  "nome": "Aventureiro: Combatente",
  "resumo": "O Combatente é uma classe de combate genérica que se beneficia de vitórias subsequentes, quanto mais o combatente batalha e quanto mais ele vence, mais forte suas habilidades ficam. Sua habilidade característica permite “Reviver” durante a batalha consumindo os pontos obtidos pela vitória nos combates.",
  "atributos": {
   "Destreza": 1
  },
  "livres": 2,
  "vida": 8,
  "energia": 7,
  "origens": [
   "Combatente"
  ],
  "habilidade": {
   "nome": "Empilhando Vitórias",
   "texto": "Ao fim de um combate, caso o combatente não tenha sido derrotado ele acumula 1 ponto de Vitória. Morrendo: Ao chegar a 0 de vida, o combatente pode pagar quantos pontos de Vitória quiser (min 1) ele marca 1 cicatriz e se levanta curando 1d6 de vida por ponto gasto. (Essa ativação não conta como derrota.)"
  }
 },
 {
  "tipo": "classe",
  "nome": "Aventureiro: Cozinheiro",
  "resumo": "A classe do Cozinheiro é focada em cozinhar banquetes que melhoram o descanso dos companheiros, essa habilidade melhora a cura e energia recuperada pelo descanso e ainda pode fornecer fortalecimentos temporários a quem come. Dentro de batalha, o cozinheiro pode ainda usar seus utensílios para lutar e para preparar lanches rápidos que ajudam durante a batalha.",
  "atributos": {
   "Alma": 1
  },
  "livres": 2,
  "vida": 8,
  "energia": 7,
  "origens": [
   "Cozinheiro"
  ],
  "habilidade": {
   "nome": "Banquete",
   "texto": "Durante um descanso o cozinheiro pode preparar uma refeição para o grupo gastando 3 componentes a sua escolha. Essa refeição eleva o descanso para o próximo nível sem aumentar o número de horas."
  }
 },
 {
  "tipo": "classe",
  "nome": "Aventureiro: Diplomata",
  "resumo": "A classe do Diplomata é focado completamente na interação com outros personagens, essa interações permitem que o diplomata consiga convencer ou até enganar mais facilmente. Além disso, algumas habilidades podem ser úteis para suporte dentro e fora de combate.",
  "atributos": {
   "Mente": 1
  },
  "livres": 2,
  "vida": 6,
  "energia": 8,
  "origens": [
   "Diplomata"
  ],
  "habilidade": {
   "nome": "Diplomacia",
   "texto": "Sempre que o diplomata fizer um teste ao interagir com um personagem (NPC ou Player) ele ganha pontos de Diplomacia (Max 3) esses pontos podem ser usados para um sucesso garantido em um teste envolvendo enganar, convencer, negociar ou fazer amizade com um personagem."
  }
 },
 {
  "tipo": "classe",
  "nome": "Aventureiro: Forjador",
  "resumo": "O Fforjador é a classe focada no reparo e criação de equipamentos e ferramentas. O poder do Fforjador está no período de descanso, durante essa cenas ele pode criar itens que vão impactar fortemente no combate do grupo. Essa classe possui um kit de forjas que permite as criações e reparos, é bom sempre manter esse kit carregado.",
  "atributos": {
   "Corpo": 1
  },
  "livres": 2,
  "vida": 10,
  "energia": 6,
  "origens": [
   "Forjador"
  ],
  "habilidade": {
   "nome": "Trabalho na Forja",
   "texto": "O forjador possui um kit de forja, esse kit compreende um conjunto de ferramenta e materiais que ele pode levar por onde anda para forjar em qualquer lugar. Kit de Forja: Cargas Max: 6, Carga Inicial: 3. Espaço ocupado: 2. O kit pode recuperar uma carga gastando materiais relacionados a forja ( Metais, minérios ou outros tipos de material). Durante o tempo de descanso o forjador pode aprimorar ou reparar equipamentos dos aliados, para fazer isso ele consome cargas do seu Kit de Forja com base nas ações feitas. Reparar: 1 Carga: 2 horas: Repara um equipamento danificado deixando ele em perfeito estado. Aprimorar: Aplica um dos efeitos a seguir gastando 1 carga e 4 horas: Afiar: Aplicável a armas: Aumenta o dano causado pelar arma em +2. Reforçar: aplicável a proteções: Aumenta o bloqueio em"
  }
 },
 {
  "tipo": "classe",
  "nome": "Aventureiro: Médico",
  "resumo": "A classe do Médico é focada na cura e fortalecimento, pode simplesmente curar ou então criar remédios que removem condições e beneficiam o usuário. Essa classe possui um Kit de medicina que é o que permite realizar as curar é bom sempre manter o kit recarregado.",
  "atributos": {
   "Foco": 1
  },
  "livres": 2,
  "vida": 8,
  "energia": 7,
  "origens": [
   "Médico"
  ],
  "habilidade": {
   "nome": "Práticas de Medicina",
   "texto": "Você possui um kit médico que tem cargas e pode ser usado para criar receitas e usar habilidades. Kit Médico: Cargas Max: 8, Carga Inicial: 4. Espaço ocupado: 1. Enquanto estiver com o kit em mãos pode usar uma Ação para curar 1d6 de vida de um aliado."
  }
 },
 {
  "tipo": "classe",
  "nome": "Bardo",
  "resumo": "Focado no uso de Músicas, serve como um suporte versátil que pode ajudar aliados e atrapalhar inimigos ao mesmo tempo, possui ainda habilidades que permitem roubar a cena e assumir os holofotes da batalha. Usam instrumentos musicais que podem conceder fortalecimentos para as habilidades.",
  "atributos": {
   "Alma": 1,
   "Destreza": 1,
   "Mente": 1
  },
  "livres": 0,
  "vida": 8,
  "energia": 7,
  "origens": [
   "Bardo"
  ],
  "habilidade": {
   "nome": "Trilha sonora",
   "texto": "Ao ativar uma música pela primeira vez na cena ignora custo e tempo de ativação. Musicas tocadas pelo bardo custam 1 a menos para serem mantidas."
  }
 },
 {
  "tipo": "classe",
  "nome": "Berserker",
  "resumo": "O Berserker é focado em combater furiosamente, sua habilidade característica permite entrar em “Modo Berserker” aumentando seu dano e durabilidade. Fora isso, a classe possui diversas habilidades que aumentam muito o poder dos ataques, num geral o Berserker quer pegar uma arma grande e partir para o ataque.",
  "atributos": {
   "Destreza": 1,
   "Corpo": 2
  },
  "livres": 0,
  "vida": 12,
  "energia": 5,
  "origens": [
   "Berserker"
  ],
  "habilidade": {
   "nome": "Modo Berserker",
   "texto": "O usuário entra em um tipo de hipnose, assumindo um estado de fúria, enquanto estiver nesse estado o usuário possui um nível de fúria que vai de 0 a 6, o nível começa em 3. Caso chegue a 0 o Modo Berserker acaba, caso chegue em 6 o Berserker entra em estado de descontrole. Estado de Descontrole: Todo turno irá gastar todas as ações para tentar atacar a criatura mais próxima. Modo Berserker: Ao Receber um golpe limpo: +1 de fúria. Ao Passar um turno sem atacar: -1 de fúria. Ao derrotar uma criatura: -1 de fúria. Enquanto estiver no Modo Berserker ganha Corpo igual a metade dos pontos atuais de fúria (Arredondado para baixo e pode superar 5), além disso seu atributo de Corpo é adicionado ao dano de ataques e ao seu valor bloqueio."
  }
 },
 {
  "tipo": "classe",
  "nome": "Apostador",
  "resumo": "Classe focada em sorte e blefe, funciona bem para atacar, enganar e ganhar dinheiro. Utiliza um baralho para testes ao invés de dados, graças a isso possui uma boa curva de evolução, podendo aprimorar permanentemente os resultados de testes gerais. Suas habilidades podem envolver sorte nas cartas e até blefar contra mestre e outros jogadores",
  "atributos": {
   "Destreza": 1,
   "Mente": 2
  },
  "livres": 0,
  "vida": 8,
  "energia": 7,
  "origens": [
   "Cartomante"
  ],
  "habilidade": {
   "nome": "Destino nas Cartas",
   "texto": "No lugar de uma rolagem de 2d6 você pode sempre sacar uma carta do baralho, o valor da carta define o resultado do teste. Durante um descanso você pode voltar as cartas e embaralhar o baralho."
  }
 },
 {
  "tipo": "classe",
  "nome": "Cavaleiro",
  "resumo": "O Cavaleiro é uma linha de frente poderosa, focada em suporte e bloqueio. Quanto mais habilidades de origem “Cavaleiro” o personagem aprende, mais forte fica a habilidade característica, logo é uma classe que pode exigir certa exclusividade para um aproveitamento maior. Ainda assim, as habilidades mais básicas do cavaleiro podem ser uma adição interessante para personagens de linha de frente, logo, um caminho mais versátil combinando as habilidades de cavaleiro com outras classes pode ser uma ótima opção também.",
  "atributos": {
   "Corpo": 1,
   "Destreza": 1,
   "Mente": 1
  },
  "livres": 0,
  "vida": 10,
  "energia": 6,
  "origens": [
   "Cavaleiro"
  ],
  "habilidade": {
   "nome": "Caminho do Cavaleiro",
   "texto": "O cavaleiro ganha bônus com base no número de cartas da origem “Cavaleiro” em seu baralho. Cada numero de cartas significa um cargo para o cavaleiro e a cada cargo mais ele é respeitado dentro dos reinos, principalmente por outros cavaleiros. Escudeiro: 1 - Durante o combate ganhe 1 de Técnica ou Corpo Temporariamente. Soldado: 3 - Ignora Qualquer desvantagem das armadura e escudos equipados. Tenente: 6 - Enquanto estiver usando uma armadura pesada você aplica bloqueio a qualquer ataque sem gastar reações. Capitão: 9 - Nos primeiros 3 turnos de um combate, aliados tem o bloqueio aumentado com base na metade de seu bloqueio. General: 12 - Uma vez por rodada, escolha um aliado para jogar um turno extra."
  }
 },
 {
  "tipo": "classe",
  "nome": "Caçador",
  "resumo": "O Caçador pode ser focado em abater a presa, suas habilidades permitem ganhar grande vantagem enquanto estiver caçando um alvo, ele pode fortalecer seus ataques, aplicar desvantagens, criar armadilhas e até atacar em conjunto com criaturas aliadas. O caçador deve escolher uma arma de caça, essa arma é o foco de grande parte das vantagens fornecidas, já que para ganhar esses benefícios o caçador deve marcar o alvo como uma presa.",
  "atributos": {
   "Conhecimento": 1,
   "Destreza": 2
  },
  "livres": 0,
  "vida": 8,
  "energia": 7,
  "origens": [
   "Caçador"
  ],
  "habilidade": {
   "nome": "Prêmios Da Caçada",
   "texto": "O caçador adquire uma arma de caça. O caçador pode marcar uma criatura como alvo, para ser marcada como alvo a criatura deve cumprir um dos seguintes requisitos: Cair em uma armadilha feita pelo caçador. Ter sido observada e estuda pelo caçador por pelo menos 1 hr. Ter sido descrita para o caçador por alguém. Ataques a alvos marcados usando armas de caça causam 1d6 a mais de dano. Caso o caçador abata a criatura marcada como alvo (Ele deve ter desferido o golpe final) ele pode guardar um troféu da caçada. Esse troféu ocupa 1 espaço no inventário e confere benefícios baseados nas habilidades do caçador. A habilidade pode ser usada para marcar qualquer criatura ou personagem. Só pode haver 1 presa por vez."
  }
 },
 {
  "tipo": "classe",
  "nome": "Cultista",
  "resumo": "O Cultista pode escolher entre diversas entidades para firmar seu “Pacto”, com base na entidade escolhida a classe muda completamente, uma constante na classe é o atributo de Ligação. Esse atributo é o que define quanto do poder de sua entidade o Cultista pode invocar, ou seja, com uma ligação alta o cultista pode ter acesso fácil a habilidades muito poderosas. Os meios de aumentar a ligação mudam de acordo com o pacto firmado e isso é o que define o estilo de gameplay do cultista.",
  "atributos": {
   "Alma": 1,
   "Conhecimento": 1
  },
  "livres": 0,
  "vida": 8,
  "energia": 8,
  "origens": [
   "Cultista"
  ],
  "habilidade": {
   "nome": "Pacto",
   "texto": "Firma um Pacto com uma entidade ganhando habilidades provenientes dessa entidade. Você adiciona a sua ficha o atributo Ligação."
  }
 },
 {
  "tipo": "classe",
  "nome": "Enfeitiçado",
  "resumo": "O Enfeitiçado pode ter acesso a uma origem de magia extra, habilidades dessa origem fornecem pontos que podem ser utilizados para fortalecer magias em momentos específicos. Num geral, essa classe é focada em masterizar um tipo único de magia e utilizar o máximo de habilidades possíveis, a versatilidade vai depender da magia escolhida, mas num geral é uma classe mais focada em ataques poderosos mas ainda trazendo certa utilidade.",
  "atributos": {
   "Mente": 1,
   "Alma": 2
  },
  "livres": 0,
  "vida": 8,
  "energia": 8,
  "origens": [
   "Enfeitiçado"
  ],
  "habilidade": {
   "nome": "Herança Mágica",
   "texto": "O enfeitiçado deve escolher uma origem de magia para dominar, o enfeitiçado poderá aprender qualquer magia que seja da origem escolhida. Sempre que o Enfeitiçado usar uma magia atrelada a sua origem ele recebe 1 Ponto de Prática (PP). Durante a conjuração o Enfeitiçado pode pagar PPs para dar aprimoramentos temporários a uma magia, esses efeitos duram por uma conjuração. Magias conjuradas com alguma modificação não geram PP. Aumentar efeito: paga 5PPs para adicionar 1d6 ao efeiro (Dano/cura/energia). Diminuir Custo: Paga PPs para diminuir o custo.(1 PP a cada 1 de mana) Conjuração Múltipla: Paga PPs pra re-conjurar a magia sem gastar ações ou reações(o custo ainda é pago).(7 PP)"
  }
 },
 {
  "tipo": "classe",
  "nome": "Gladiador",
  "resumo": "Uma classe de Frontline resistente e com um bom dano, boa pra quem quer ir pra porrada sem medo de morrer. O Gladiador possui mecânicas envolvendo cicatrizes podem ser arriscadas, mas também tornam o gladiador mais resistente à morte.",
  "atributos": {
   "Alma": 1,
   "Corpo": 2
  },
  "livres": 0,
  "vida": 12,
  "energia": 5,
  "origens": [
   "Gladiador"
  ],
  "habilidade": {
   "nome": "Gloria das Arenas",
   "texto": "No início do combate o gladiador ganha postos de prestígio = 2 + número de cicatrizes. O gladiador pode consumir pontos de prestígio para aumentar ou diminuir o valor de rolagens nas quais ele esteja envolvido, isso inclui danos, curas, salvaguardas, esquivas e acertos (O aumento é na proporção de 1 : 1 ou seja 1 ponto gasto é +1  ou -1 no teste.). Gladiadores nunca fogem da batalha, caso o gladiador passe 1 turno sem atacar ou ser atacado, seus pontos de prestígio são zerados. Máximo de Cicatriz é 7 ao invés de 5. Pode Receber no máximo uma evolução das habilidade de “Estilo”."
  }
 },
 {
  "tipo": "classe",
  "nome": "Hemomante",
  "resumo": "A classe do Hemomante é muito versátil, suas habilidades permitem causar dano, curar, fortalecer e até invocar criaturas. Porem, as habilidades podem consumir um certo custo em vida, com isso, sua habilidade característica se torna muito útil, permitindo diminuir esse custo, quando utilizada em conjunto com a condição “Sangramento”.",
  "atributos": {
   "Conhecimento": 1,
   "Corpo": 1,
   "Destreza": 1
  },
  "livres": 0,
  "vida": 10,
  "energia": 6,
  "origens": [
   "Hemomante"
  ],
  "habilidade": {
   "nome": "Manipulação do Sangue",
   "texto": "O Hemomante consegue acessar a Blood pool, caso uma habilidade peça um custo em vida o hemomante pode usar pontos da blood pool para cobrir esse custo. Blood Pool: Adicione +1 a Blood Pool para cada dano de Sangramento sofrido por qualquer um em cena."
  }
 },
 {
  "tipo": "classe",
  "nome": "Lutador",
  "resumo": "Um artista marcial, bom pra dar porrada, luta desarmado e consegue atacar de diversas maneiras diferentes. Sua habilidade permite variar a postura de luta, pode só usar sequências de golpes ou então tentar imobilizar ou derrubar os oponentes.",
  "atributos": {
   "Corpo": 1,
   "Destreza": 1,
   "Foco": 1
  },
  "livres": 0,
  "vida": 10,
  "energia": 6,
  "origens": [
   "Lutador"
  ],
  "habilidade": {
   "nome": "Postura de Luta",
   "texto": "O lutador começa com uma postura, ao invés de aprender uma nova técnica o lutador pode optar por aprender uma nova postura, essas posturas contam como evoluções de sua técnica característica. Inicio do combate: O lutador assume uma das posturas, é possível alterar entre posturas gastando 1 reação. As posturas só funcionam se o lutador estiver com ambas as mãos livres. Passiva: Os ataques desarmados de um lutador causam 1d6 de dano de impacto. Posturas: Caminho Suave: Enquanto ativo, o usuário pode gastar uma reação para infringir Derrubado a um alvo Agarrado causando 1d6 de dano. Capoeira: Enquanto ativa, aumenta a esquiva pelo valor de Destreza. Combate no Solo: Pode gastar uma reação para imobilizar inimigos agarrados. Nobre Arte: Aprenda a Habilidade “Jab”, use essa habilidade como ação"
  }
 },
 {
  "tipo": "classe",
  "nome": "Mago",
  "resumo": "A classe do mago é focada no uso de habilidade do tipo “Magia”, sua habilidade característica permite aprender qualquer habilidade desse tipos, podendo inclusive aprender por outros métodos além do aprendizado padrão. A possibilidade de adquirir qualquer magia traz grande complexidade para a classe, aumentando muito o leque de habilidades que essa classe pode possuir. As outras habilidades naturais do mago permitem melhorar, aprender e até criar novas magias. Existem também, habilidades focadas no uso de familiares.",
  "atributos": {
   "Alma": 1,
   "Conhecimento": 2
  },
  "livres": 0,
  "vida": 6,
  "energia": 8,
  "origens": [
   "Mago"
  ],
  "habilidade": {
   "nome": "Magia do Aprendizado",
   "texto": "O mago pode aprender qualquer carta do tipo “Magia”. O mago possui um grimório que armazena magias aprendidas por ele, ao adquirir uma nova carta o mago optar por, ao invés disso, adicionar 1 carta do tipo magia ao seu grimório. Magias presentes no grimório não influenciam no limite máximo de cartas do mago. Magias presentes no grimório podem ser usadas pagando um custo de 3 de mana adicional enquanto portando um canalizador. Para usar magias do grimório o mago deve estar com ele aberto em mãos."
  }
 },
 {
  "tipo": "classe",
  "nome": "Malandro",
  "resumo": "O malandro é uma classe versátil que combina habilidades boas de combate/assassinato com habilidades úteis fora de combate. Consegue  ainda, comprar aprimoramentos para suas habilidades usando dinheiro e isso o faz escalar bem consumindo poucos espaços de habilidade.",
  "atributos": {
   "Corpo": 1,
   "Destreza": 1,
   "Mente": 1
  },
  "livres": 0,
  "vida": 8,
  "energia": 7,
  "origens": [
   "Malandro"
  ],
  "habilidade": {
   "nome": "Aprendizado das Ruas",
   "texto": "Os malandros querem ganhar dinheiro para conseguir ajudar seu grupo, família ou até para realização pessoal, gastando dinheiro com essas causas os malandros aprendem malandragens que são aprimoramentos para sua passiva, esses aprimoramentos não influenciam o limite máximo de técnicas. O malandro já começa com 1 malandragem aprendida e pode chegar ao máximo de 5 com base na tabela de gastos. Malandragens: Disposição: Age primeiro em qualquer cena, incluindo combates. Camaradagem: +1 de Destreza quando junto a aliados. Desenrolo: Possui vantagem em testes para enganar, convencer e perguntar.(vantagem = +1d6) Visão:  Você é imune ao efeito Cegueira. Sagacidade: Você sempre nota mentiras e enganações. Moral: Você é respeitado por outros membros de seu grupo e pessoas da sua área de origem. Ess"
  }
 },
 {
  "tipo": "classe",
  "nome": "Monge",
  "resumo": "O Monge é focado no atributo de “Foco”, podendo entrara no “Estado Focado” que fortalece suas habilidades e atributos enquanto estiver ativo. O Monge possui habilidades para combater e ajudar os aliados, é uma classe que pode agir tanto sozinho quanto em grupo. A classe escala fortemente com o atributo de Foco.",
  "atributos": {
   "Corpo": 1,
   "Destreza": 1,
   "Foco": 1
  },
  "livres": 0,
  "vida": 10,
  "energia": 6,
  "origens": [
   "Monge"
  ],
  "habilidade": {
   "nome": "Estado de Foco",
   "texto": "Se concentra por um tempo para entrar em “Estado Focado” que dura até o fim da cena ou até ser cancelado. Durante um combate o monge gasta 1 ação pra entrar em estado de foco e fora de combate ele deve meditar por um instante. Estado focado: Enquanto estiver no estado focado o monge pode adicionar seu modificador de Foco a qualquer rolagem que ele fizer. Ao receber ataques, efeitos ou falhar em um teste, o monge deve realizar um teste de foco e tirar 10 ou mais para manter seu estado. O estado de foco acaba obrigatoriamente após a conclusão de uma cena."
  }
 },
 {
  "tipo": "classe",
  "nome": "Samurai",
  "resumo": "A habilidade característica do Samurai permite ele transitar entre 2 caminhos. O caminho da Honra é focado no uso e acúmulo de pontos de Reação, transformando o Samurai em um duelista poderoso e independente que pode atacar, se defender e se mover, de moto a combater de maneira honrada qualquer oponente. Já o caminho da Desonra foca em um dano explosivo e em ataques injustos aproveitando as fraquezas e vulnerabilidades do inimigo, indo atrás de ganhar o combate a qualquer custo.",
  "atributos": {
   "Corpo": 1,
   "Destreza": 1,
   "Foco": 1
  },
  "livres": 0,
  "vida": 10,
  "energia": 6,
  "origens": [
   "Samurai"
  ],
  "habilidade": {
   "nome": "Caminho do Samurai",
   "texto": "Os Samurais são divididos entre honrado e desonrados, ambos os caminhos têm suas características no RP e proporcionam habilidades diferentes. Existem habilidades que podem fazer o samurai mudar de caminho, mas num geral o caminho seguido deve ser definido pelo samurai e por como ele enxerga sua honra. Caminho da Honra: A cada 3 reações gastas na mesma rodada, recupere 1 reação. Além disso seu nome e de sua escola são prestigiados e conhecidos por onde quer que você passe, você possui vantagens em testes de diplomacia e para convencer ou negociar. Caminho da Desonra: Acertos limpos causam sempre dano crítico. Além disso você é temido e desprezado por aqueles que sabem de sua fama, possuindo desvantagem em qualquer teste de diplomacia e para convencer ou negociar, mas ganhando vantagem em te"
  }
 },
 {
  "tipo": "classe",
  "nome": "Xamã",
  "resumo": "O Xamã é focado no uso de habilidades do tipo “Ritual”, usar essa habilidades fortalece o atributo de Alma do Xamã, sem limite máximo. O fortalecimento pode ser utilizado em ataques, curas e qualquer outro tipo de habilidade, o que combinado com a alta variedade de rituais faz essa classe ser poderosa de diversas maneiras.",
  "atributos": {
   "Conhecimento": 1,
   "Alma": 2
  },
  "livres": 0,
  "vida": 6,
  "energia": 8,
  "origens": [
   "Xamã"
  ],
  "habilidade": {
   "nome": "Alma Ritualística",
   "texto": "Sempre que utilizar uma habilidade do tipo “Ritual”, o xamã ganha +1 de Alma (acumula infinitamente). Esse valor extra é perdido caso o xamã utilize o valor do atributo em qualquer rolagem ou após um descanso."
  }
 }
];
