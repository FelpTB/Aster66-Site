"""Gera public/img/mapa-maresia.svg (mapa esquemático de Maresia, base do mapa interativo).

Como funciona:
- NODES são as junções (onde 3 territórios se encontram, ou costa + 2 territórios).
- EDGES ligam duas junções; cada borda é desenhada uma vez e reaproveitada pelos dois lados,
  então as fronteiras nunca se sobrepõem nem deixam buracos.
- As bordas ganham irregularidade com deslocamento de ponto médio (semente fixa: o resultado é sempre o mesmo).
- Os rótulos ficam no ponto mais "fundo" de cada território (o mais distante das bordas).

Uso: python scripts/gerar-mapa.py
"""
import math, os, random

SAIDA = os.path.join(os.path.dirname(__file__), "..", "public", "img", "mapa-maresia.svg")

N = {
    "N_TT": (268, 248), "S_TT": (215, 305), "KT": (368, 196), "KZ": (440, 196), "K1": (390, 212), "K2": (416, 212),
    "ZH": (566, 240), "HCc": (702, 266), "CSc": (736, 358), "SEc": (752, 452), "ESc": (600, 578), "CVc": (520, 546),
    "EKc": (430, 544), "KAc": (214, 436), "ATc": (205, 352),
    "A": (372, 300), "WW": (378, 278), "WE": (444, 278), "B": (452, 300), "M1": (412, 298),
    "ZHS": (560, 290), "HHS": (586, 308), "HC": (682, 300), "CS": (706, 368), "HS": (642, 392), "SE": (628, 442),
    "SB": (560, 472), "SW": (505, 400), "TF": (250, 350), "FK": (255, 440), "FE": (380, 422), "AR": (398, 482),
    "I1": (432, 420), "I2": (470, 456),
}
COSTA = set()
E = {}
def edge(a, b, pts=(), costa=False):
    E[(a, b)] = list(pts)
    if costa: COSTA.add((a, b))

# Costa (sentido horário)
edge("N_TT", "S_TT", [(200, 256), (150, 252), (112, 262), (98, 282), (124, 298), (170, 302)], True)
edge("N_TT", "KT", [(300, 226), (345, 212)], True)
edge("KT", "KZ", [(374, 172), (386, 146), (400, 126), (414, 142), (428, 170)], True)
edge("KZ", "ZH", [(480, 214), (535, 232)], True)
edge("ZH", "HCc", [(620, 244), (668, 238)], True)
edge("HCc", "CSc", [(722, 302), (744, 330)], True)
edge("CSc", "SEc", [(728, 382), (748, 420)], True)
edge("SEc", "ESc", [(764, 482), (750, 524), (756, 562), (744, 606), (716, 632), (662, 606)], True)
edge("ESc", "CVc", [(548, 550)], True)
edge("CVc", "EKc", [(500, 546), (470, 540)], True)
edge("EKc", "KAc", [(390, 548), (345, 540), (300, 560), (250, 554), (204, 540), (192, 500)], True)
edge("KAc", "ATc", [(204, 400)], True)
edge("ATc", "S_TT", [(204, 330)], True)
# Fronteiras
edge("N_TT", "S_TT_i", [])  # placeholder (removido abaixo)
del E[("N_TT", "S_TT_i")]
E[("S_TT", "N_TT")] = [(250, 280)]            # Tokkara | Tuhan
edge("KT", "K1"); edge("K1", "K2"); edge("K2", "KZ")
edge("K1", "WW", [(382, 248)]); edge("WW", "A")
edge("K2", "WE", [(434, 248)]); edge("WE", "B")
edge("WW", "M1"); edge("M1", "WE"); edge("M1", "I1", [(442, 342)])
edge("A", "TF", [(320, 330)]); edge("TF", "ATc"); edge("TF", "FK", [(258, 396)]); edge("FK", "KAc")
edge("A", "FE", [(362, 360)]); edge("FE", "FK", [(320, 442)]); edge("FE", "AR"); edge("AR", "EKc")
edge("AR", "I1"); edge("I1", "I2"); edge("I2", "CVc", [(510, 492)]); edge("I2", "SW")
edge("B", "SW", [(490, 340)]); edge("SW", "SB", [(500, 455)])
edge("B", "ZHS", [(520, 300)]); edge("ZH", "ZHS", [(576, 270)]); edge("ZHS", "HHS")
edge("HHS", "HC", [(640, 320)]); edge("HC", "HCc"); edge("HC", "CS", [(686, 335)]); edge("CS", "CSc")
edge("HHS", "HS", [(594, 350), (616, 380)]); edge("HS", "CS", [(680, 392)])
edge("HS", "SE"); edge("SE", "SB"); edge("SE", "SEc", [(660, 452), (706, 462)]); edge("SB", "ESc", [(590, 520)])

# Territórios: ciclos de junções
PAISES = [
    ("tokkara", "Tokkara", ["N_TT", "S_TT"], None),
    ("tuhan", "Tuhan", ["N_TT", "KT", "K1", "WW", "A", "TF", "ATc", "S_TT"], None),
    ("kalasar", "Kalasar", ["KT", "KZ", "K2", "K1"], None),
    ("zew-phater", "Zew Phater", ["KZ", "ZH", "ZHS", "B", "WE", "K2"], None),
    ("hakemenida", "Hakemênida", ["ZH", "HCc", "HC", "HHS", "ZHS"], None),
    ("crimmor", "Crimmor", ["HCc", "CSc", "CS", "HC"], None),
    ("hief", "Hief", ["HHS", "HC", "CS", "HS"], None),
    ("saa-bahc", "Saa-Bahc", ["B", "ZHS", "HHS", "HS", "SE", "SB", "SW"], None),
    ("supra-lux", "Supra Lux", ["CSc", "SEc", "SE", "HS", "CS"], None),
    ("anulatra", "Anulatra", ["KAc", "ATc", "TF", "FK"], None),
    ("farlands", "Farlands", ["A", "FE", "FK", "TF"], None),
    ("kin-me-gir", "Kin-Me-Gir", ["EKc", "KAc", "FK", "FE", "AR"], None),
]
REINOS = [  # Elesidônia: seis reinos unidos
    ("Winterend", ["K1", "K2", "WE", "M1", "WW"]),
    ("Arguilha", ["WW", "A", "FE", "AR", "I1", "M1"]),
    ("Blumena", ["M1", "WE", "B", "SW", "I2", "I1"]),
    ("Santa Virga", ["AR", "EKc", "CVc", "I2", "I1"]),
    ("Cavalon", ["I2", "SW", "SB", "ESc", "CVc"]),
    ("Chunávia", ["SE", "SEc", "ESc", "SB"]),
]

# ---------- irregularidade ----------
def rugoso(pts, fator, prof=4):
    """Deslocamento de ponto médio, determinístico pelo próprio segmento."""
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        seg = [a, b]
        for _ in range(prof):
            novo = [seg[0]]
            for p, q in zip(seg, seg[1:]):
                L = math.dist(p, q)
                rnd = random.Random(f"{p[0]:.1f},{p[1]:.1f},{q[0]:.1f},{q[1]:.1f}")
                d = (rnd.random() - .5) * L * fator
                mx, my = (p[0] + q[0]) / 2, (p[1] + q[1]) / 2
                nx, ny = -(q[1] - p[1]) / (L or 1), (q[0] - p[0]) / (L or 1)
                novo += [(mx + nx * d, my + ny * d), q]
            seg = novo
        out += seg[1:]
    return out

LINHA = {}
for (a, b), meio in E.items():
    LINHA[(a, b)] = rugoso([N[a], *meio, N[b]], .34 if (a, b) in COSTA else .24)

def caminho(a, b):
    if (a, b) in LINHA: return LINHA[(a, b)]
    if (b, a) in LINHA: return LINHA[(b, a)][::-1]
    raise KeyError((a, b))

def poligono(ciclo):
    if len(ciclo) == 2:  # Tokkara: costa + fronteira
        return caminho(ciclo[0], ciclo[1])[:-1] + caminho(ciclo[1], ciclo[0])[:-1]
    pts = []
    for a, b in zip(ciclo, ciclo[1:] + ciclo[:1]):
        pts += caminho(a, b)[:-1]
    return pts

def d_attr(pts):
    return "M" + " ".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"

def ilha(pts, fator=.3):
    return rugoso(pts + [pts[0]], fator, 3)[:-1]

# ---------- rótulos: ponto mais distante das bordas ----------
def dentro(p, pol):
    x, y = p; c = False
    for (x1, y1), (x2, y2) in zip(pol, pol[1:] + pol[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c
def dist_seg(p, a, b):
    ax, ay = a; bx, by = b; px, py = p
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)
def centro(pol, largura_txt=0):
    xs, ys = [p[0] for p in pol], [p[1] for p in pol]
    melhor, md = None, -1
    for i in range(41):
        for j in range(41):
            p = (min(xs) + (max(xs) - min(xs)) * i / 40, min(ys) + (max(ys) - min(ys)) * j / 40)
            if not dentro(p, pol): continue
            d = min(dist_seg(p, a, b) for a, b in zip(pol, pol[1:] + pol[:1]))
            # rótulo é largo: penaliza bordas à esquerda/direita
            if largura_txt:
                for dx in (-largura_txt / 2, largura_txt / 2):
                    q = (p[0] + dx, p[1])
                    d = min(d, min(dist_seg(q, a, b) for a, b in zip(pol, pol[1:] + pol[:1])) if dentro(q, pol) else -1)
            if d > md: md, melhor = d, p
    return melhor

# ---------- SVG ----------
svg = []
add = svg.append
add('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 920" role="img" aria-labelledby="mapa-titulo">
  <title id="mapa-titulo">Maresia — mapa esquemático</title>
  <!--
    Gerado por scripts/gerar-mapa.py — edite o script, não este arquivo.
    Base para o mapa interativo do site. Fontes: mapa político de Maresia + textos dos países (Notion).
    Camadas:
      #mar, #terras-fora (norte gelado, Huang-Xing), #edingirra (arquipélago inabitável)
      #paises      <path class="pais" id="pais-…" data-nome="…">; a Elesidônia é um <g class="pais reino-unido" id="pais-elesidonia">
                   com um <path class="reino" data-reino="…"> por reino (Winterend, Arguilha, Blumena, Santa Virga, Cavalon, Chunávia)
      #relevo      cordilheiras, vulcões, lagos, deserto, rio (só visual)
      #capitais    <circle class="capital" data-nome="…" data-pais="…">
      #rotulos     nomes (pointer-events: none)
  -->
  <defs>
    <style>
      .mar { fill: #0d1418; }
      .fora { fill: #15171c; stroke: #2a2a33; stroke-width: 1.5; }
      .fora-gelo { fill: #1b1f26; }
      .pais { fill: #18181f; stroke: #e5a93c; stroke-opacity: .6; stroke-width: 1.3; stroke-linejoin: round; cursor: pointer; transition: fill .15s; }
      .pais:hover, .pais.ativo { fill: #26232a; stroke-opacity: 1; }
      .reino-unido { fill: #1c1a20; }
      .reino-unido .reino { stroke: #e5a93c; stroke-opacity: .35; stroke-width: .9; stroke-dasharray: 3 3; }
      .reino-unido:hover .reino, .reino-unido.ativo .reino { fill: #29252c; }
      .reino-unido .reino:hover { fill: #332d33; }
      .contorno-uniao { fill: none; stroke: #e5a93c; stroke-width: 2.2; stroke-linejoin: round; pointer-events: none; }
      .edingirra { fill: #1d1018; stroke: #c91d2e; stroke-width: 1.3; stroke-dasharray: 5 4; stroke-linejoin: round; cursor: pointer; }
      .serra { fill: none; stroke: #b4b4bf; stroke-opacity: .55; stroke-width: 1.2; stroke-linejoin: round; }
      .vulcao { fill: #c91d2e; fill-opacity: .7; }
      .lago { fill: #4f8fe8; fill-opacity: .45; }
      .deserto { fill: #e5a93c; fill-opacity: .16; }
      .rio { fill: none; stroke: #4f8fe8; stroke-opacity: .7; stroke-width: 1.8; stroke-linecap: round; }
      .capital { fill: #08080a; stroke: #e5a93c; stroke-width: 1.5; cursor: pointer; }
      .capital.cidade-estado { fill: #e5a93c; }
      .rotulo { font-family: "Cormorant Garamond", Georgia, serif; font-weight: 700; fill: #ffffff; text-anchor: middle; dominant-baseline: middle; letter-spacing: .06em; paint-order: stroke; stroke: #08080a; stroke-width: 3px; pointer-events: none; text-transform: uppercase; }
      .rotulo.uniao { fill: #e5a93c; letter-spacing: .12em; }
      .rotulo.reino { font-family: "Source Sans 3", sans-serif; font-weight: 600; font-size: 8.5px; fill: #b4b4bf; text-transform: none; letter-spacing: .03em; font-style: italic; stroke-width: 2px; }
      .rotulo.fora { font-size: 13px; fill: #7d7d89; stroke-width: 2px; }
      .rotulo.vermelho { fill: #ff6b78; font-size: 15px; }
      .rotulo.nota { font-family: "Source Sans 3", sans-serif; font-weight: 600; font-size: 10px; fill: #b4b4bf; text-transform: none; letter-spacing: 0; }
      .rotulo.relevo { font-family: "Source Sans 3", sans-serif; font-weight: 600; font-size: 9px; fill: #7d7d89; text-transform: none; letter-spacing: .04em; font-style: italic; stroke-width: 2px; }
    </style>
  </defs>
  <rect id="mar" class="mar" width="1280" height="920"/>
''')

add('  <g id="terras-fora">')
add(f'    <path class="fora fora-gelo" data-nome="Terras do norte" d="{d_attr(rugoso([(80,0),(580,0),(572,30),(540,52),(470,60),(420,72),(380,64),(330,70),(260,58),(190,62),(130,46),(92,26),(80,0)], .25, 3))}"/>')
add(f'    <path class="fora" data-nome="Huang-Xing" d="{d_attr(rugoso([(1280,210),(1210,228),(1150,262),(1105,300),(1080,330),(1060,380),(1075,420),(1100,440),(1120,470),(1130,520),(1125,580),(1140,640),(1150,700),(1170,780),(1200,860),(1230,920),(1280,920),(1280,210)], .25, 3))}"/>')
add('  </g>')

ED = [[(300,720),(360,700),(430,706),(470,728),(462,770),(420,792),(350,788),(305,760)],
      [(500,700),(580,684),(660,690),(700,714),(690,760),(640,790),(560,796),(505,772),(488,736)],
      [(730,700),(790,690),(840,708),(852,748),(820,780),(760,784),(726,752)],
      [(380,818),(450,806),(520,812),(560,836),(540,872),(470,886),(400,878),(368,850)],
      [(600,820),(680,812),(740,828),(748,866),(700,892),(620,892),(586,860)],
      [(480,788),(500,778),(515,790),(498,804)], [(720,800),(742,794),(750,810),(728,816)], [(275,790),(292,782),(300,800),(282,806)]]
add('  <g id="edingirra" data-nome="Arquipélago de É-Dingirra">')
add(f'    <path class="edingirra" d="{" ".join(d_attr(ilha(p, .35)) for p in ED)}"/>')
add('  </g>')

POL = {}
add('  <g id="paises">')
ILHAS = {
    "wildcoast": ("Wildcoast", [[(128,340),(150,336),(170,352),(178,390),(176,440),(168,480),(150,502),(120,500),(98,470),(92,420),(100,372)]]),
    "andosea": ("Andosea", [[(848,312),(880,300),(908,310),(918,336),(905,362),(905,390),(888,398),(872,378),(852,360),(842,336)],
                            [(790,324),(806,318),(812,330),(798,336)], [(818,314),(834,310),(838,322),(822,326)],
                            [(940,318),(956,316),(962,330),(946,336)], [(950,356),(966,352),(972,366),(956,370)]]),
    "orixu": ("Orixu", [[(255,585),(282,576),(300,590),(290,610),(262,612)], [(308,580),(336,572),(352,588),(344,612),(316,614),(304,600)],
                        [(240,622),(268,616),(282,632),(270,652),(246,650)], [(286,630),(330,622),(350,640),(340,668),(300,672),(280,656)]]),
}
for slug, (nome, partes) in ILHAS.items():
    pols = [ilha(p) for p in partes]
    POL[nome] = max(pols, key=lambda p: len(p))
    add(f'    <path class="pais" id="pais-{slug}" data-nome="{nome}" d="{" ".join(d_attr(p) for p in pols)}"/>')
for slug, nome, ciclo, _ in PAISES:
    POL[nome] = poligono(ciclo)
    add(f'    <path class="pais" id="pais-{slug}" data-nome="{nome}" d="{d_attr(POL[nome])}"/>')
# Elesidônia
add('    <!-- Elesidônia: reino unido de seis reinos (contorno forte = fronteira da união; tracejado = divisa entre reinos) -->')
add('    <g class="pais reino-unido" id="pais-elesidonia" data-nome="Elesidônia">')
for nome, ciclo in REINOS:
    POL["reino:" + nome] = poligono(ciclo)
    add(f'      <path class="reino" data-reino="{nome}" d="{d_attr(POL["reino:" + nome])}"/>')
# contorno externo = bordas usadas por um só reino
uso = {}
for _, ciclo in REINOS:
    for a, b in zip(ciclo, ciclo[1:] + ciclo[:1]):
        k = frozenset((a, b)); uso[k] = uso.get(k, 0) + 1
externas = [k for k, n in uso.items() if n == 1]
segs = []
for k in externas:
    a, b = tuple(k)
    pts = caminho(a, b)
    segs.append("M" + " ".join(f"{x:.1f} {y:.1f}" for x, y in pts))
add(f'      <path class="contorno-uniao" d="{" ".join(segs)}"/>')
add('    </g>')
add('  </g>')

# Relevo
add('''  <g id="relevo" aria-hidden="true">
    <path class="serra" d="M374 194 l5 -8 5 8 M386 199 l5 -9 5 9 M398 201 l5 -9 5 9 M410 199 l5 -9 5 9 M422 194 l5 -8 5 8"/>
    <path class="serra" d="M398 234 l5 -8 5 8 M412 244 l5 -8 5 8 M392 254 l5 -8 5 8"/>
    <path class="serra" d="M604 342 l6 -10 6 10 M620 356 l6 -10 6 10 M638 340 l6 -10 6 10 M654 356 l6 -9 6 9"/>
    <path class="serra" d="M282 364 l5 -9 5 9 M298 356 l5 -9 5 9 M316 366 l5 -9 5 9 M334 348 l5 -9 5 9"/>
    <path class="serra" d="M640 262 l5 -9 5 9 M654 272 l5 -9 5 9 M610 262 l5 -8 5 8"/>
    <path class="vulcao" d="M126 290 l6 -10 6 10Z M178 292 l6 -10 6 10Z M226 286 l6 -10 6 10Z"/>
    <path class="serra" d="M552 236 l5 -8 5 8 M540 250 l5 -8 5 8"/>
    <ellipse class="lago" cx="462" cy="352" rx="12" ry="6"/><ellipse class="lago" cx="478" cy="378" rx="7" ry="4"/>
    <ellipse class="lago" cx="530" cy="498" rx="14" ry="7"/><circle class="lago" cx="508" cy="474" r="4"/><ellipse class="lago" cx="552" cy="520" rx="6" ry="3.5"/>
    <ellipse class="deserto" cx="558" cy="400" rx="44" ry="30"/>
    <path class="rio" d="M522 312 C 538 340, 548 372, 548 398 S 556 448, 562 470 S 584 520, 596 574"/>
    <path class="rio" d="M660 520 C 680 500, 700 488, 724 476" stroke-opacity=".5"/>
  </g>''')

add('''  <g id="capitais">
    <circle class="capital" r="4" cx="400" cy="166" data-nome="Sradag" data-pais="Kalasar"/>
    <circle class="capital" r="4" cx="306" cy="262" data-nome="Magnustown" data-pais="Tuhan"/>
    <circle class="capital" r="4" cx="508" cy="236" data-nome="Nova Hellade" data-pais="Zew Phater"/>
    <circle class="capital" r="4" cx="608" cy="284" data-nome="Setareh-Shahr" data-pais="Hakemênida"/>
    <circle class="capital" r="4" cx="632" cy="372" data-nome="Steins-Hjart" data-pais="Hief"/>
    <circle class="capital cidade-estado" r="5" cx="726" cy="340" data-nome="Crimmor" data-pais="Crimmor"/>
    <circle class="capital" r="4" cx="708" cy="446" data-nome="Frainberg" data-pais="Supra Lux"/>
    <circle class="capital" r="4" cx="549" cy="402" data-nome="Tefnut" data-pais="Saa-Bahc"/>
    <circle class="capital" r="4" cx="212" cy="420" data-nome="Asbru" data-pais="Anulatra"/>
    <circle class="capital" r="4" cx="136" cy="425" data-nome="Floramar" data-pais="Wildcoast"/>
    <circle class="capital" r="4.5" cx="522" cy="488" data-nome="Cavalon" data-pais="Elesidônia"/>
    <circle class="capital" r="4" cx="880" cy="340" data-nome="Nova Barsea" data-pais="Andosea"/>
    <circle class="capital cidade-estado" r="3.5" cx="350" cy="516" data-nome="Santuário de Maresia" data-pais="Kin-Me-Gir"/>
  </g>''')

# Rótulos
add('  <g id="rotulos">')
add('    <text class="rotulo fora" x="330" y="30">Terras do norte</text>')
add('    <text class="rotulo fora" x="1180" y="430">Huang-Xing</text>')
add('    <text class="rotulo vermelho" data-edingirra="" x="580" y="748">Arquipélago de É-Dingirra</text>')
add('    <text class="rotulo nota" data-edingirra="" x="580" y="766">inabitável · corrupção mágica · reino perdido dos deuses</text>')
def rot(nome, cls="", tam=None, desloc=(0, 0), texto=None, attr=""):
    pol = POL[nome]
    t = texto or nome.replace("reino:", "")
    tam = tam or 13
    p = centro(pol, len(t) * tam * .62)
    if not p: p = centro(pol)
    attr = attr or f' data-pais="{t}"'
    add(f'    <text class="rotulo {cls}"{attr} x="{p[0] + desloc[0]:.0f}" y="{p[1] + desloc[1]:.0f}" style="font-size:{tam}px">{t}</text>')
TAM = {"Tuhan": 16, "Kin-Me-Gir": 15, "Farlands": 13, "Saa-Bahc": 13, "Zew Phater": 12, "Hakemênida": 11, "Kalasar": 10,
       "Tokkara": 10, "Crimmor": 10, "Hief": 10, "Supra Lux": 11, "Anulatra": 9.5, "Wildcoast": 10, "Andosea": 10, "Orixu": 10}
DESL = {"Wildcoast": (0, 70), "Andosea": (0, 58), "Orixu": (0, 0), "Kalasar": (0, -6), "Saa-Bahc": (0, 0)}
FIXO = {"Kalasar": (452, 146), "Saa-Bahc": (552, 338), "Crimmor": (716, 316)}  # posições ajustadas à mão
for nome, tam in TAM.items():
    if nome in ("Wildcoast", "Andosea", "Orixu"):
        continue
    if nome in FIXO:
        add(f'    <text class="rotulo" data-pais="{nome}" x="{FIXO[nome][0]}" y="{FIXO[nome][1]}" style="font-size:{tam}px">{nome}</text>')
        continue
    rot(nome, tam=tam, desloc=DESL.get(nome, (0, 0)))
add('    <text class="rotulo" data-pais="Wildcoast" x="136" y="522" style="font-size:10px">Wildcoast</text>')
add('    <text class="rotulo" data-pais="Andosea" x="880" y="416" style="font-size:10px">Andosea</text>')
add('    <text class="rotulo" data-pais="Orixu" x="296" y="690" style="font-size:10px">Orixu</text>')
for nome, _ in REINOS:
    rot("reino:" + nome, "reino", tam=8.5, texto=nome, attr=f' data-pais="Elesidônia" data-reino="{nome}"')
add('    <text class="rotulo uniao" data-pais="Elesidônia" x="462" y="442" style="font-size:15px">Elesidônia</text>')
add('    <text class="rotulo relevo" x="462" y="166">Cord. de Jotunar</text>')
add('    <text class="rotulo relevo" x="560" y="432">Tah-Nebu</text>')
add('    <text class="rotulo relevo" x="608" y="566">Rio Iteru</text>')
add('  </g>')
add('</svg>\n')

with open(SAIDA, "w", encoding="utf8", newline="\n") as f:
    f.write("\n".join(svg))

# Vizinhanças (conferência)
viz = {}
def reg(nome, ciclo):
    for a, b in zip(ciclo, ciclo[1:] + ciclo[:1]):
        viz.setdefault(frozenset((a, b)), set()).add(nome)
for _, nome, ciclo, _ in PAISES: reg(nome, ciclo if len(ciclo) > 2 else [])
reg("Tokkara", ["S_TT", "N_TT"])
for nome, ciclo in REINOS: reg("Elesidônia/" + nome, ciclo)
lista = {}
for k, ns in viz.items():
    if (tuple(k) in COSTA) or (tuple(k)[::-1] in COSTA): continue
    for n in ns:
        lista.setdefault(n, set()).update(ns - {n})
for n in sorted(lista): print(n, ":", ", ".join(sorted(lista[n])))
