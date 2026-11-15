// Céu e calendário de Aster — resumido do Notion (Sumário › Aster).
window.ASTER_CEU = {
  specs: [
    ["Tamanho / Massa do planeta", "1,08× o raio / 1,25× a massa da Terra", "Gravidade quase igual à da Terra (1,07 g)"],
    ["Duração do dia", "22 horas", "Rotação ligeiramente mais rápida"],
    ["Duração do ano", "364 dias locais", "Divide-se perfeitamente em 13 meses"],
    ["Duração do mês", "28 dias locais", "4 semanas exatas de 7 dias"],
    ["Distância entre as luas", "~6.200 km de diferença orbital", "Garante o encontro exato a cada 78 meses"],
    ["Ciclo de troca", "6 anos por Era (12 anos no total)", "Previsibilidade astronômica absoluta"],
  ],
  alinhamentos: [
    ["Alinhamento Comum", "~2 vezes por ano (a cada 180–195 dias)", "Sol, planeta e luas em linha (luas separadas)", "Marés vivas fortes e eclipses simples"],
    ["Troca Simples", "A cada 6 anos (nas 2 semanas sem data)", "Luas juntas, mas em ângulo reto com o Sol", "Marés altas controláveis e dança visual das luas"],
    ["Grande Alinhamento", "A cada 18 anos (o terceiro alinhamento)", "Sol, planeta e as duas luas juntas na mesma linha", "Supermarés históricas, evacuação costeira e eclipses duplos"],
  ],
  meses: [
    { nome: "Mattiya", estacao: "Primavera (início)", clima: "Começa logo após a Troca das Luas. Degelo e chuvas.", porque: "Mattiya traz o início de um novo ano, trazendo a esperança após as catástrofes de um ano de transição." },
    { nome: "Ísana", estacao: "Primavera (auge)", clima: "Florescimento intenso e dias ficando mais longos.", porque: "Ísana marca o auge da primavera, o ápice da fertilidade." },
    { nome: "Hief", estacao: "Primavera (fim)", clima: "Temperaturas amenas e preparação para o calor.", porque: "O último mês antes do calor é o mês do trabalho, a época perfeita para finalizar as obras." },
    { nome: "Maresia", estacao: "Transição (primavera → verão)", clima: "Dias 85–91: fim da primavera. Dias 92–112: início do verão (solstício no dia 91).", porque: "As condições são perfeitas para navegações e viagens: um ótimo mês para iniciar uma jornada." },
    { nome: "Anhangá", estacao: "Verão (pleno)", clima: "Dias muito longos, calor forte e tempestades tropicais.", porque: "Os incêndios florestais constantes são vistos como manifestações de Anhangá para expulsar caçadores." },
    { nome: "Ohirume", estacao: "Verão (auge)", clima: "Pico de temperatura do ano e máxima atividade marítima.", porque: "A presença do sol de Ohirume brilha no céu." },
    { nome: "Rekh", estacao: "Transição (verão → outono)", clima: "Dias 169–182: fim do verão. Dias 183–196: início do outono (equinócio no dia 182).", porque: "Marca a transição para o fim do ano, tempo de trabalhos comerciais e jurídicos, ligados a Rekh." },
    { nome: "Bacco", estacao: "Outono (pleno)", clima: "Queda das folhas, ventos constantes e época de colheitas.", porque: "Os festivais e banquetes das colheitas ocorrem com a bênção de Bacco." },
    { nome: "Mutwet", estacao: "Outono (auge)", clima: "Noites mais frias, neblinas e estocagem de alimentos.", porque: "O auge do outono, quando as plantas acabam de murchar e o frio traz os nevoeiros." },
    { nome: "Marduva", estacao: "Transição (outono → inverno)", clima: "Dias 253–273: fim do outono. Dias 274–280: início do inverno (solstício no dia 273).", porque: "O início do inverno, castigado por ventos ferozes e cortantes como lâminas." },
    { nome: "Niod", estacao: "Inverno (pleno)", clima: "Primeiras nevascas pesadas e noites muito longas.", porque: "O frio traz o isolamento: um tempo de paciência, em que o tempo parece passar devagar." },
    { nome: "Amon", estacao: "Inverno (auge)", clima: "Frio extremo. Na Era Negra, é o período mais escuro do ciclo.", porque: "As noites mais longas e escuras do ano, a época favorita dos vampiros e das criaturas da noite." },
    { nome: "Ah-Rimã", estacao: "Inverno (fim)", clima: "O frio começa a ceder; nos anos de troca, as luas já estão quase coladas no céu.", porque: "Ah-Rimã marca o fim do ano e o início temido de uma possível época de transição." },
  ],
  travessia: {
    nome: "Travessia", estacao: "A Travessia (a cada 6 anos)",
    clima: "Equinócio de primavera: as luas trocam de órbita enquanto o frio acaba e o novo ciclo começa no Dia 1 do Mês 1.",
    partes: [
      ["Preparação", "O povo se prepara para o ápice da Travessia."],
      ["Provação", "O ápice da Travessia: o alinhamento das luas causa desastres climáticos."],
      ["Recomeço", "Após o ápice, o povo começa a se preparar para o novo ano."],
    ],
  },
};
