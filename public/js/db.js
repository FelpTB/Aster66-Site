// Camada de dados do site: Supabase quando configurado (.env), dados locais como reserva.
// Depende de: /js/config.js (gerado pelo servidor) → window.ASTER_SUPABASE = { url, key } | null
(() => {
  const cfg = window.ASTER_SUPABASE;
  // Pasta raiz do site (funciona em localhost:5173/ e em usuario.github.io/Aster66-Site/).
  const SITE_BASE = new URL(".", document.currentScript?.src ? new URL("..", document.currentScript.src) : location.href).href;
  const RENOMEAR = { Cartomante: "Apostador" }; // nomes antigos que ainda podem estar no banco
  const ren = (n) => RENOMEAR[n] || n;
  const ATTRS = ["Corpo", "Mente", "Alma", "Destreza", "Foco", "Conhecimento"];

  let client = null;
  const pronto = (async () => {
    if (!cfg) return null;
    if (!window.supabase) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = new URL("vendor/supabase.js", SITE_BASE).href;
        s.onload = res; s.onerror = rej;
        document.head.append(s);
      }).catch(() => null);
    }
    if (!window.supabase) return null;
    client = window.supabase.createClient(cfg.url, cfg.key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return client;
  })();

  const jogador = () => client.schema("fichas_jogador");
  const falha = (error) => { if (error) throw new Error(traduzErro(error)); };

  function traduzErro(e) {
    const m = (e && (e.message || e.error_description || String(e))) || "Erro desconhecido.";
    const mapa = [
      [/Invalid login credentials/i, "E-mail ou senha incorretos."],
      [/Email not confirmed/i, "Confirme seu e-mail antes de entrar (veja sua caixa de entrada)."],
      [/User already registered/i, "Já existe uma conta com esse e-mail."],
      [/Password should be at least (\d+)/i, "A senha precisa ter pelo menos $1 caracteres."],
      [/rate limit|too many/i, "Muitas tentativas. Aguarde um pouco e tente de novo."],
      [/relation .* does not exist|Could not find the table/i, "A tabela ainda não existe no Supabase — rode supabase/migracao-site.sql."],
      [/permission denied|row-level security/i, "Sem permissão. Verifique se a migração do site foi aplicada no Supabase."],
      [/Failed to fetch|NetworkError/i, "Sem conexão com o servidor do Supabase."],
    ];
    for (const [re, msg] of mapa) {
      const hit = m.match(re);
      if (hit) return msg.replace("$1", hit[1] || "");
    }
    return m;
  }

  // "1 Conhecimento, 2 Pontos Livres" ou {"Corpo":1} ou {"csv":"..."}
  function parseAtributos(raw) {
    const out = { atributos: {}, livres: 0 };
    if (!raw) return out;
    let txt = "";
    if (typeof raw === "string") txt = raw;
    else if (typeof raw === "object") {
      if (typeof raw.csv === "string") txt = raw.csv;
      else for (const [k, v] of Object.entries(raw)) if (ATTRS.includes(k) && +v) out.atributos[k] = +v;
    }
    txt.split(",").forEach((part) => {
      const m = part.trim().match(/^(\d+)\s+(.+)$/);
      if (!m) return;
      const n = +m[1], nome = m[2].trim();
      if (/pontos? livres?/i.test(nome)) out.livres += n;
      else if (ATTRS.includes(nome)) out.atributos[nome] = (out.atributos[nome] || 0) + n;
    });
    return out;
  }

  // Markdown do Notion (coluna `conteudo`) → texto simples para o site.
  function mdTexto(md) {
    return String(md || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(/^\s*[-*]\s+(\[[ x]\]\s+)?/gm, "• ")
      .replace(/(\*\*|__|~~|`)/g, "")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
      .replace(/^---$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  const juntar = (a, sep = ", ") => (Array.isArray(a) ? a.filter(Boolean).join(sep) : a || "");

  // Esquema `aster` = espelho das bases do Notion (scripts/sync-notion.js).
  const aster = () => client.schema("aster");

  // ---------------- Catálogo ----------------
  let cachePersonagens = null;
  async function catalogoPersonagens() {
    if (cachePersonagens) return cachePersonagens;
    const local = window.ASTER_PERSONAGENS || [];
    const db = await pronto;
    if (!db) return (cachePersonagens = local);
    try {
      const lista = await personagensAster();
      if (lista.length) {
        cachePersonagens = lista;
        cachePersonagens.fonte = "notion";
        return cachePersonagens;
      }
    } catch (e) {
      console.warn("Esquema aster indisponível, usando fichas_jogador.", e);
    }
    try {
      const [r, c] = await Promise.all([
        jogador().from("raca").select("nome_raca,atributos_iniciais,vida_inicial,energia_inicial,texto_descricao,hab:carta!raca_habilidade_inata_id_fkey(nome_carta,texto_corpo),raca_origem(origem(nome))").order("nome_raca"),
        jogador().from("classe").select("nome_classe,atributos_iniciais,vida_inicial,energia_inicial,texto_descricao,hab:carta!classe_habilidade_caracteristica_id_fkey(nome_carta,texto_corpo),classe_origem(origem(nome))").order("nome_classe"),
      ]);
      falha(r.error); falha(c.error);
      const map = (x, tipo, nome, rel) => {
        const { atributos, livres } = parseAtributos(x.atributos_iniciais);
        return {
          tipo, nome: ren(x[nome]), resumo: x.texto_descricao || "", atributos, livres,
          vida: x.vida_inicial || 0, energia: x.energia_inicial || 0,
          origens: (x[rel] || []).map((o) => ren(o.origem?.nome)).filter(Boolean),
          habilidade: { nome: x.hab?.nome_carta || "", texto: x.hab?.texto_corpo || "" },
        };
      };
      const lista = [
        ...r.data.map((x) => map(x, "raca", "nome_raca", "raca_origem")),
        ...c.data.map((x) => map(x, "classe", "nome_classe", "classe_origem")),
      ];
      cachePersonagens = lista.length ? lista : local;
      cachePersonagens.fonte = lista.length ? "supabase" : "local";
    } catch (e) {
      console.warn("Catálogo do Supabase indisponível, usando dados locais.", e);
      cachePersonagens = local;
    }
    return cachePersonagens;
  }

  async function personagensAster() {
    const [r, c] = await Promise.all([
      aster().from("racas").select("nome,atributos_iniciais,vida_inicial,energia_inicial,origens_relacionadas,habilidade_inata,conteudo").order("nome"),
      aster().from("classes").select("nome,atributos_iniciais,vida_inicial,energia_inicial,origem_relacionada,habilidade_caracteristica,conteudo").order("nome"),
    ]);
    falha(r.error); falha(c.error);
    const ids = [...new Set([...r.data.flatMap((x) => x.habilidade_inata || []), ...c.data.flatMap((x) => x.habilidade_caracteristica || [])])];
    const habs = new Map();
    if (ids.length) {
      const h = await aster().from("cartas").select("id,nome,conteudo").in("id", ids);
      falha(h.error);
      h.data.forEach((x) => habs.set(x.id, x));
    }
    const map = (x, tipo, origens, relIds) => {
      const { atributos, livres } = parseAtributos(juntar(x.atributos_iniciais));
      const hab = (relIds || []).map((id) => habs.get(id)).find(Boolean);
      return {
        tipo, nome: ren(x.nome), resumo: mdTexto(x.conteudo), conteudo: x.conteudo || "", atributos, livres,
        vida: +x.vida_inicial || 0, energia: +x.energia_inicial || 0,
        origens: origens.filter(Boolean).map(ren),
        habilidade: { nome: hab?.nome || "", texto: mdTexto(hab?.conteudo), conteudo: hab?.conteudo || "" },
      };
    };
    return [
      ...r.data.map((x) => map(x, "raca", x.origens_relacionadas || [], x.habilidade_inata)),
      ...c.data.map((x) => map(x, "classe", [x.origem_relacionada], x.habilidade_caracteristica)),
    ];
  }

  async function cartasAster() {
    const { data, error } = await aster().from("cartas")
      .select("id,nome,tipo,modo_de_uso,alcance,cooldown,custo_em_energia,custo_extra,raridade,origem,palavra_chave,conteudo")
      .order("nome").limit(5000);
    falha(error);
    return data.map((c) => ({
      id: c.id, nome: c.nome, tipo: juntar(c.tipo, " / "), modo: juntar(c.modo_de_uso, " / "),
      tipos: c.tipo || [], modos: c.modo_de_uso || [], custos: c.custo_em_energia || [],
      alcance: juntar(c.alcance), tempo: juntar(c.cooldown), custo: juntar(c.custo_em_energia, " / "),
      custoExtra: c.custo_extra || "", raridade: c.raridade || "", palavras: c.palavra_chave || [],
      texto: mdTexto(c.conteudo), conteudo: c.conteudo || "", origens: [...new Set((c.origem || []).map(ren))],
    }));
  }

  // ---------------- Mundo (esquema aster) ----------------
  // Panteão de Édin: personagens de nível "Divindade" ligados ao Panteão Ediniano.
  let cachePanteao = null;
  async function panteao() {
    if (cachePanteao) return cachePanteao;
    const db = await pronto;
    if (!db) return [];
    const { data, error } = await aster().from("personagens")
      .select("id,nome,organizacoes_relacionadas,locais_relacionados,conteudo")
      .eq("nivel_do_personagem", "Divindade").order("nome");
    falha(error);
    return (cachePanteao = data
      .filter((d) => (d.organizacoes_relacionadas || []).includes("Panteão Ediniano"))
      .map((d) => {
        const [nome, ...resto] = d.nome.split(",");
        return { id: d.id, nome: nome.trim(), titulo: resto.join(",").trim(), conteudo: d.conteudo || "",
          resumo: mdTexto(d.conteudo).split("\n")[0], organizacoes: d.organizacoes_relacionadas || [] };
      }));
  }

  // Países de Maresia com seus locais internos (Cenários com Abrangência = País).
  let cachePaises = null;
  async function paises() {
    if (cachePaises) return cachePaises;
    const db = await pronto;
    if (!db) return [];
    const { data, error } = await aster().from("cenarios")
      .select("id,nome,abrangencia,cenarios_relacionados,conteudo,icone").order("nome").limit(2000);
    falha(error);
    const porId = new Map(data.map((c) => [c.id, c]));
    const ehPais = (c) => c?.abrangencia === "País";
    // Um "país" ligado a outro país maior é um reino interno (ex.: os seis reinos da Elesidônia).
    const interno = (c) => ehPais(c) && (c.cenarios_relacionados || []).some((id) => {
      const o = porId.get(id);
      return ehPais(o) && (o.cenarios_relacionados || []).length > (c.cenarios_relacionados || []).length;
    });
    const ORDEM = ["País", "Cidade (Capital)", "Cidade", "Região", "Edifício"];
    return (cachePaises = data.filter((c) => ehPais(c) && !interno(c)).map((p) => ({
      id: p.id, nome: p.nome, icone: p.icone, conteudo: p.conteudo || "",
      resumo: mdTexto(p.conteudo).replace(/^Página original:.*$/m, "").split("\n")[0],
      locais: (p.cenarios_relacionados || []).map((id) => porId.get(id)).filter(Boolean)
        .sort((a, b) => ORDEM.indexOf(a.abrangencia) - ORDEM.indexOf(b.abrangencia) || a.nome.localeCompare(b.nome, "pt"))
        .map((l) => ({ nome: l.nome, abrangencia: l.abrangencia || "", conteudo: l.conteudo || "" })),
    })));
  }

  const TIPOS = { Tecnica_Inigualavel: "Técnica Inigualável", Musica: "Música", Lingua: "Língua" };
  const MODOS = { Reacao: "Reação", Acao: "Ação" };
  let cacheCartas = null;
  async function cartas() {
    if (cacheCartas) return cacheCartas;
    const db = await pronto;
    if (!db) return [];
    try {
      const lista = await cartasAster();
      if (lista.length) return (cacheCartas = lista);
    } catch (e) {
      console.warn("Esquema aster indisponível, usando fichas_jogador.", e);
    }
    const { data, error } = await jogador().from("carta")
      .select("id_carta,nome_carta,tipo,modo_uso,alcance,tempo_de_uso,custo_energia,custo_energia_texto,custo_extra,texto_corpo,propriedades_importacao,req:carta_origem_requisito_conjunto(carta_origem_requisito_opcao(origem(nome)))")
      .order("nome_carta").limit(5000);
    falha(error);
    cacheCartas = data.map((c) => {
      let origens = (c.req || []).flatMap((r) => (r.carta_origem_requisito_opcao || []).map((o) => o.origem?.nome)).filter(Boolean);
      if (!origens.length && c.propriedades_importacao?.Origem) origens = c.propriedades_importacao.Origem.split(",").map((s) => s.trim()).filter(Boolean);
      const custo = c.custo_energia ?? (c.custo_energia_texto || c.propriedades_importacao?.["Custo em Energia"] || "");
      return {
        id: c.id_carta, nome: c.nome_carta, tipo: TIPOS[c.tipo] || c.tipo, modo: MODOS[c.modo_uso] || c.modo_uso,
        tipos: [TIPOS[c.tipo] || c.tipo].filter(Boolean), modos: [MODOS[c.modo_uso] || c.modo_uso].filter(Boolean),
        custos: [String(c.custo_energia ?? c.custo_energia_texto ?? "")].filter(Boolean), raridade: "", palavras: [], conteudo: c.texto_corpo || "",
        alcance: c.alcance || "", tempo: c.tempo_de_uso || "", custo: String(custo ?? ""), custoExtra: c.custo_extra || "",
        texto: c.texto_corpo || "", origens: [...new Set(origens.map(ren))],
      };
    });
    return cacheCartas;
  }

  // ---------------- Autenticação ----------------
  const auth = {
    async usuario() {
      const db = await pronto; if (!db) return null;
      const { data } = await db.auth.getSession();
      return data.session?.user || null;
    },
    async entrar(email, senha) {
      const db = await pronto;
      const { data, error } = await db.auth.signInWithPassword({ email, password: senha }); falha(error);
      return data.user;
    },
    async cadastrar(email, senha, nome) {
      const db = await pronto;
      const { data, error } = await db.auth.signUp({
        email, password: senha,
        options: { data: { full_name: nome }, emailRedirectTo: new URL("ficha.html", SITE_BASE).href },
      });
      falha(error);
      return { usuario: data.user, precisaConfirmar: !data.session };
    },
    async recuperar(email) {
      const db = await pronto;
      const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: new URL("ficha.html#nova-senha", SITE_BASE).href });
      falha(error);
    },
    async novaSenha(senha) {
      const db = await pronto;
      const { error } = await db.auth.updateUser({ password: senha }); falha(error);
    },
    async sair() { const db = await pronto; if (db) await db.auth.signOut(); },
    async aoMudar(cb) {
      const db = await pronto; if (!db) return cb(null, null);
      db.auth.onAuthStateChange((evento, sessao) => cb(sessao?.user || null, evento));
    },
    nome(u) { return u?.user_metadata?.full_name || (u?.email || "").split("@")[0]; },
  };

  // ---------------- Fichas na nuvem ----------------
  const fichas = {
    async listar() {
      const { data, error } = await jogador().from("ficha_site").select("id,nome,raca,classe,atualizado_em").order("atualizado_em", { ascending: false });
      falha(error); return data;
    },
    async obter(id) {
      const { data, error } = await jogador().from("ficha_site").select("*").eq("id", id).single();
      falha(error); return data;
    },
    async salvar({ id, dados }) {
      const linha = {
        nome: (dados.nome || "").trim().slice(0, 120) || "Sem nome",
        raca: (dados.raca || "").slice(0, 120) || null,
        classe: (dados.classe || "").slice(0, 120) || null,
        dados,
      };
      const q = id
        ? jogador().from("ficha_site").update(linha).eq("id", id).select("id,atualizado_em").single()
        : jogador().from("ficha_site").insert(linha).select("id,atualizado_em").single();
      const { data, error } = await q; falha(error); return data;
    },
    async excluir(id) {
      const { error } = await jogador().from("ficha_site").delete().eq("id", id); falha(error);
    },
  };

  // ---------------- Comentários ----------------
  const comentarios = {
    async listar() {
      const db = await pronto;
      if (!db) {
        const r = await fetch("/api/comentarios"); if (!r.ok) throw new Error("Falha ao carregar.");
        return r.json();
      }
      const { data, error } = await db.from("comentario").select("id,nome,topico,mensagem,criado_em").order("criado_em", { ascending: false }).limit(200);
      falha(error);
      return data.map((c) => ({ ...c, criadoEm: c.criado_em }));
    },
    async publicar({ nome, topico, mensagem }) {
      const db = await pronto;
      if (!db) {
        const r = await fetch("/api/comentarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome, topico, mensagem }) });
        const body = await r.json(); if (!r.ok) throw new Error(body.erro || "Erro ao publicar."); return body;
      }
      const { data, error } = await db.from("comentario").insert({ nome, topico, mensagem }).select("id,nome,topico,mensagem,criado_em").single();
      falha(error);
      return { ...data, criadoEm: data.criado_em };
    },
  };

  window.AsterDB = { ativo: !!cfg, pronto, catalogoPersonagens, cartas, panteao, paises, auth, fichas, comentarios, traduzErro, mdTexto };
})();
