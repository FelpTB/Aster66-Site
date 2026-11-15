-- Aster66 — Eventos, Cenas e posição dos locais no mapa
--   aster.eventos   ← Notion: Databases › Eventos › Lista de Eventos
--   aster.cenas     ← Notion: Databases › Cenas › Lista de Cenas
--   aster.cenarios  + mapa_x / mapa_y (posição no mapa de Maresia)
--   comunidade.categoria + "evento" e "cena" (criações da comunidade)
-- Preenchidas por `npm run sync:notion`. Leitura pública, escrita só pela service_role.
-- Rode uma vez no SQL Editor. Idempotente.
BEGIN;

CREATE TABLE IF NOT EXISTS aster.eventos (
  id                   UUID PRIMARY KEY,
  nome                 TEXT NOT NULL DEFAULT '',
  data_inicio          TEXT,                         -- Data Início (calendário de Aster; vazio se incerto)
  data_fim             TEXT,                         -- Data Fim
  descricao            TEXT,                         -- Descrição
  locais_relacionados  UUID[] NOT NULL DEFAULT '{}', -- Locais relacionados → aster.cenarios
  epoca                TEXT,                         -- Época (linha do tempo do mapa)
  tipo                 TEXT[] NOT NULL DEFAULT '{}', -- Tipo (Divino, Guerra, Fundação, Catástrofe, Política)
  ordem                NUMERIC,                      -- Ordem dentro da época
  mapa_x               NUMERIC,                      -- Posição no mapa (viewBox 0 0 1280 920)
  mapa_y               NUMERIC,
  rota_no_mapa         TEXT,                         -- "x,y; x,y; …" (trajeto opcional)
  conteudo             TEXT NOT NULL DEFAULT '',
  icone                TEXT,
  capa                 TEXT,
  extras               JSONB NOT NULL DEFAULT '{}'::JSONB,
  notion_url           TEXT,
  criado_em            TIMESTAMPTZ,
  editado_em           TIMESTAMPTZ,
  sincronizado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS aster.cenas (
  id                  UUID PRIMARY KEY,
  nome                TEXT NOT NULL DEFAULT '',
  descricao_cenario   TEXT,                         -- Descrição Cenário
  descricao_mecanica  TEXT,                         -- Descrição Mecânica
  tipo_de_cena        TEXT,                         -- Tipo de cena (Combate, Entreato, Problema)
  conteudo            TEXT NOT NULL DEFAULT '',
  icone               TEXT,
  capa                TEXT,
  extras              JSONB NOT NULL DEFAULT '{}'::JSONB,
  notion_url          TEXT,
  criado_em           TIMESTAMPTZ,
  editado_em          TIMESTAMPTZ,
  sincronizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE aster.cenarios ADD COLUMN IF NOT EXISTS mapa_x NUMERIC;
ALTER TABLE aster.cenarios ADD COLUMN IF NOT EXISTS mapa_y NUMERIC;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['eventos', 'cenas'] LOOP
    EXECUTE format('GRANT ALL ON aster.%I TO service_role', t);
    EXECUTE format('ALTER TABLE aster.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON aster.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON aster.%I TO anon, authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS leitura_publica ON aster.%I', t);
    EXECUTE format('CREATE POLICY leitura_publica ON aster.%I FOR SELECT TO anon, authenticated USING (true)', t);
  END LOOP;
END $$;

-- Criações da comunidade: eventos e cenas (mesmos campos das bases oficiais).
INSERT INTO comunidade.categoria (slug, nome, plural, icone, ordem, descricao, campos) VALUES
('evento', 'Evento', 'Eventos', '⏳', 35, 'Acontecimentos da história do mundo.', '[
  {"chave":"data_inicio","rotulo":"Data início","tipo":"texto"},
  {"chave":"data_fim","rotulo":"Data fim","tipo":"texto"},
  {"chave":"epoca","rotulo":"Época","tipo":"escolha","opcoes":["Reino de É-Dingirra","A Queda de Édin","Era dos Reinos","Era Atual"]},
  {"chave":"tipo","rotulo":"Tipo","tipo":"escolha","opcoes":["Divino","Guerra","Fundação","Catástrofe","Política"]},
  {"chave":"locais_relacionados","rotulo":"Locais relacionados","tipo":"lista"}
]'),
('cena', 'Cena', 'Cenas', '🎬', 95, 'Situações prontas para montar uma sessão.', '[
  {"chave":"tipo_de_cena","rotulo":"Tipo de cena","tipo":"escolha","opcoes":["Combate","Entreato","Problema"]},
  {"chave":"descricao_cenario","rotulo":"Descrição do cenário","tipo":"longo"},
  {"chave":"descricao_mecanica","rotulo":"Descrição mecânica","tipo":"longo"}
]')
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome, plural = EXCLUDED.plural, icone = EXCLUDED.icone, ordem = EXCLUDED.ordem,
  descricao = EXCLUDED.descricao, campos = EXCLUDED.campos;

COMMIT;

NOTIFY pgrst, 'reload schema';
