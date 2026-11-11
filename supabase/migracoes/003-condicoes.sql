-- Aster66 — tabela aster.condicoes (Notion: Databases › Condições › Lista de Condições)
-- Preenchida por `npm run sync:notion`. Leitura pública, escrita só pela service_role.
-- Rode uma vez no SQL Editor. Idempotente.
BEGIN;

CREATE TABLE IF NOT EXISTS aster.condicoes (
  id                  UUID PRIMARY KEY,
  nome                TEXT NOT NULL DEFAULT '',
  nivel               TEXT,                         -- Nível (Normal / Complexa)
  descricao           TEXT,                         -- Descrição (resumo do efeito)
  remocao             TEXT,                         -- Remoção
  maximo_de_acumulos  NUMERIC,                      -- Máximo de acúmulos
  subtipo             TEXT,                         -- Subtipo (ex.: Maldição)
  conteudo            TEXT NOT NULL DEFAULT '',
  icone               TEXT,
  capa                TEXT,
  extras              JSONB NOT NULL DEFAULT '{}'::JSONB,
  notion_url          TEXT,
  criado_em           TIMESTAMPTZ,
  editado_em          TIMESTAMPTZ,
  sincronizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT ALL ON aster.condicoes TO service_role;
ALTER TABLE aster.condicoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aster.condicoes FROM anon, authenticated;
GRANT SELECT ON aster.condicoes TO anon, authenticated;
DROP POLICY IF EXISTS leitura_publica ON aster.condicoes;
CREATE POLICY leitura_publica ON aster.condicoes FOR SELECT TO anon, authenticated USING (true);

COMMIT;

NOTIFY pgrst, 'reload schema';
