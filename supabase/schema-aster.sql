-- =============================================================================
-- Aster66 — esquema "aster": espelho das bases de dados do Notion
-- Rode no Supabase: Dashboard → SQL Editor → cole tudo → Run.
-- Pode ser executado de novo sem problemas (idempotente).
--
-- Uma tabela por base do Notion (Databases), com os mesmos campos:
--   cartas · racas · classes · itens · criaturas · personagens · organizacoes · cenarios
--
-- Convenções (iguais para todas as tabelas):
--   id            = ID da página no Notion (chave primária)
--   nome          = título da página ("Name" / "Nome")
--   conteudo      = corpo da página em Markdown (descrição / texto da carta)
--   select        → text        (valor exatamente como no Notion)
--   multi_select  → text[]      (valores exatamente como no Notion)
--   number        → numeric
--   relation      → uuid[]      (IDs das páginas relacionadas, de outra tabela deste esquema)
--   extras        = propriedades do Notion que ainda não têm coluna (nada se perde)
--
-- Os dados são gravados SOMENTE pelo script `npm run sync:notion` (chave service_role).
-- O site (chave anon) só lê.
--
-- DEPOIS DE RODAR: Dashboard → Project Settings → API → "Exposed schemas" → adicione `aster`.
-- =============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS aster;

-- Colunas comuns ---------------------------------------------------------------
-- (repetidas em cada tabela; mantidas explícitas para o Table Editor ficar legível)

-- ---------------------------------------------------------------------------
-- Cartas  (Notion: Databases › Cartas)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aster.cartas (
  id                 UUID PRIMARY KEY,
  nome               TEXT NOT NULL DEFAULT '',
  tipo               TEXT[] NOT NULL DEFAULT '{}',   -- Tipo
  modo_de_uso        TEXT[] NOT NULL DEFAULT '{}',   -- Modo de Uso
  cooldown           TEXT[] NOT NULL DEFAULT '{}',   -- Cooldown
  custo_em_energia   TEXT[] NOT NULL DEFAULT '{}',   -- Custo em Energia
  custo_extra        TEXT,                           -- Custo Extra
  raridade           TEXT,                           -- Raridade
  origem             TEXT[] NOT NULL DEFAULT '{}',   -- Origem
  alcance            TEXT[] NOT NULL DEFAULT '{}',   -- Alcançe
  palavra_chave      TEXT[] NOT NULL DEFAULT '{}',   -- Palavra Chave
  carta_relacionada  UUID[] NOT NULL DEFAULT '{}',   -- Carta Relacionada → aster.cartas
  conteudo           TEXT NOT NULL DEFAULT '',
  icone              TEXT,
  capa               TEXT,
  extras             JSONB NOT NULL DEFAULT '{}'::JSONB,
  notion_url         TEXT,
  criado_em          TIMESTAMPTZ,
  editado_em         TIMESTAMPTZ,
  sincronizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Raças
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aster.racas (
  id                    UUID PRIMARY KEY,
  nome                  TEXT NOT NULL DEFAULT '',
  atributos_iniciais    TEXT[] NOT NULL DEFAULT '{}', -- Atributos Iniciais ("1 Corpo", "3 Pontos Livres")
  vida_inicial          TEXT,                         -- Vida Inicial (select numérico)
  energia_inicial       TEXT,                         -- Energia Inicial (select numérico)
  origens_relacionadas  TEXT[] NOT NULL DEFAULT '{}', -- Origens Relacionadas
  habilidade_inata      UUID[] NOT NULL DEFAULT '{}', -- Habilidade Inata → aster.cartas
  conteudo              TEXT NOT NULL DEFAULT '',
  icone                 TEXT,
  capa                  TEXT,
  extras                JSONB NOT NULL DEFAULT '{}'::JSONB,
  notion_url            TEXT,
  criado_em             TIMESTAMPTZ,
  editado_em            TIMESTAMPTZ,
  sincronizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Classes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aster.classes (
  id                         UUID PRIMARY KEY,
  nome                       TEXT NOT NULL DEFAULT '',
  atributos_iniciais         TEXT[] NOT NULL DEFAULT '{}', -- Atributos Iniciais
  vida_inicial               TEXT,                         -- Vida Inicial
  energia_inicial            TEXT,                         -- Energia Inicial
  origem_relacionada         TEXT,                         -- Origem Relacionada
  habilidade_caracteristica  UUID[] NOT NULL DEFAULT '{}', -- Habilidade Característica → aster.cartas
  conteudo                   TEXT NOT NULL DEFAULT '',
  icone                      TEXT,
  capa                       TEXT,
  extras                     JSONB NOT NULL DEFAULT '{}'::JSONB,
  notion_url                 TEXT,
  criado_em                  TIMESTAMPTZ,
  editado_em                 TIMESTAMPTZ,
  sincronizado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Itens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aster.itens (
  id               UUID PRIMARY KEY,
  nome             TEXT NOT NULL DEFAULT '',
  tipo             TEXT[] NOT NULL DEFAULT '{}', -- Tipo
  raridade         TEXT,                         -- Raridade
  empunhadura      TEXT,                         -- Empunhadura
  modo_de_uso      TEXT[] NOT NULL DEFAULT '{}', -- Modo de Uso
  alcance          TEXT[] NOT NULL DEFAULT '{}', -- Alcançe
  efeito           TEXT,                         -- Efeito
  preco_unitario   TEXT,                         -- Preço Unitário
  qtd_por_espaco   NUMERIC,                      -- Qtd. por espaço
  conteudo         TEXT NOT NULL DEFAULT '',
  icone            TEXT,
  capa             TEXT,
  extras           JSONB NOT NULL DEFAULT '{}'::JSONB,
  notion_url       TEXT,
  criado_em        TIMESTAMPTZ,
  editado_em       TIMESTAMPTZ,
  sincronizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Criaturas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aster.criaturas (
  id                  UUID PRIMARY KEY,
  nome                TEXT NOT NULL DEFAULT '',
  tipo                TEXT[] NOT NULL DEFAULT '{}', -- Tipo
  nivel               TEXT,                         -- Nível
  raridade            TEXT,                         -- Raridade
  vida                NUMERIC,                      -- Vida
  acoes               NUMERIC,                      -- Ações
  reacoes             NUMERIC,                      -- Reações
  movimento           NUMERIC,                      -- Movimento
  atributos           TEXT[] NOT NULL DEFAULT '{}', -- Atributos ("5 Corpo")
  tipo_de_defesa      TEXT,                         -- Tipo de Defesa
  atributo_de_defesa  TEXT,                         -- Atributo de Defesa
  cartas              UUID[] NOT NULL DEFAULT '{}', -- Cartas → aster.cartas
  conteudo            TEXT NOT NULL DEFAULT '',
  icone               TEXT,
  capa                TEXT,
  extras              JSONB NOT NULL DEFAULT '{}'::JSONB,
  notion_url          TEXT,
  criado_em           TIMESTAMPTZ,
  editado_em          TIMESTAMPTZ,
  sincronizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Personagens (NPCs do cenário)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aster.personagens (
  id                         UUID PRIMARY KEY,
  nome                       TEXT NOT NULL DEFAULT '',
  nivel_do_personagem        TEXT,                         -- Nível do Personagem
  locais_relacionados        TEXT[] NOT NULL DEFAULT '{}', -- Locais Relacionados (texto, como no Notion)
  organizacoes_relacionadas  TEXT[] NOT NULL DEFAULT '{}', -- Organizações Relacionadas (texto)
  conteudo                   TEXT NOT NULL DEFAULT '',
  icone                      TEXT,
  capa                       TEXT,
  extras                     JSONB NOT NULL DEFAULT '{}'::JSONB,
  notion_url                 TEXT,
  criado_em                  TIMESTAMPTZ,
  editado_em                 TIMESTAMPTZ,
  sincronizado_em            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Organizações
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aster.organizacoes (
  id                   UUID PRIMARY KEY,
  nome                 TEXT NOT NULL DEFAULT '',
  nivel_de_influencia  TEXT,                         -- Nível de Influência
  locais_relacionados  TEXT[] NOT NULL DEFAULT '{}', -- Locais Relacionados (texto)
  conteudo             TEXT NOT NULL DEFAULT '',
  icone                TEXT,
  capa                 TEXT,
  extras               JSONB NOT NULL DEFAULT '{}'::JSONB,
  notion_url           TEXT,
  criado_em            TIMESTAMPTZ,
  editado_em           TIMESTAMPTZ,
  sincronizado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Cenários (países, cidades, regiões, edifícios)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aster.cenarios (
  id                     UUID PRIMARY KEY,
  nome                   TEXT NOT NULL DEFAULT '',
  abrangencia            TEXT,                         -- Abrangência
  cenarios_relacionados  UUID[] NOT NULL DEFAULT '{}', -- Cenários Relacionados → aster.cenarios
  efeito                 TEXT,                         -- Efeito
  inspiracoes            TEXT,                         -- Inspirações
  conteudo               TEXT NOT NULL DEFAULT '',
  icone                  TEXT,
  capa                   TEXT,
  extras                 JSONB NOT NULL DEFAULT '{}'::JSONB,
  notion_url             TEXT,
  criado_em              TIMESTAMPTZ,
  editado_em             TIMESTAMPTZ,
  sincronizado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Registro das sincronizações
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aster.sincronizacao (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  concluido_em TIMESTAMPTZ,
  resumo      JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- Índices úteis para o site ------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cartas_nome     ON aster.cartas (nome);
CREATE INDEX IF NOT EXISTS idx_cartas_origem   ON aster.cartas USING GIN (origem);
CREATE INDEX IF NOT EXISTS idx_cartas_tipo     ON aster.cartas USING GIN (tipo);
CREATE INDEX IF NOT EXISTS idx_cenarios_rel    ON aster.cenarios USING GIN (cenarios_relacionados);

-- Permissões: leitura pública, escrita só pela service_role ---------------------
GRANT USAGE ON SCHEMA aster TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA aster TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA aster TO service_role;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['cartas','racas','classes','itens','criaturas','personagens','organizacoes','cenarios'] LOOP
    EXECUTE format('ALTER TABLE aster.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON aster.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON aster.%I TO anon, authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS leitura_publica ON aster.%I', t);
    EXECUTE format('CREATE POLICY leitura_publica ON aster.%I FOR SELECT TO anon, authenticated USING (true)', t);
  END LOOP;
END $$;

-- O registro de sincronização não é público.
ALTER TABLE aster.sincronizacao ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aster.sincronizacao FROM anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
