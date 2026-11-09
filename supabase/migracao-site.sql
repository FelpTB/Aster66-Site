-- =============================================================================
-- Aster66 — migração do SITE (projeto ocwwzbpsciytclqpkfxv)
-- Rode uma vez no Supabase: Dashboard → SQL Editor → cole tudo → Run.
-- Pode ser executado de novo sem problemas (idempotente).
--
-- O que faz:
--   1. Libera LEITURA PÚBLICA (visitante sem login) do catálogo fichas_jogador
--      (raças, classes, origens, cartas) — o site mostra isso para todo mundo.
--   2. Renomeia a classe/origem "Cartomante" para "Apostador" (nome atual).
--   3. Cria fichas_jogador.ficha_site — fichas do site, uma linha por personagem,
--      com o modelo novo da ficha guardado em JSON. Cada usuário só vê as suas.
--   4. Cria public.comentario — comentários da página Comunidade.
--      Qualquer um lê e publica; ninguém edita/apaga pelo site.
--      Para moderar: marque "oculto = true" no Table Editor.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Catálogo com leitura pública
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA fichas_jogador TO anon, authenticated;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'origem','carta','raca','classe','raca_origem','classe_origem',
    'carta_origem_concedida','carta_origem_requisito_conjunto','carta_origem_requisito_opcao'
  ] LOOP
    EXECUTE format('ALTER TABLE fichas_jogador.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT ON fichas_jogador.%I TO anon, authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS site_leitura_publica ON fichas_jogador.%I', t);
    EXECUTE format('CREATE POLICY site_leitura_publica ON fichas_jogador.%I FOR SELECT TO anon, authenticated USING (true)', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Cartomante → Apostador
-- ---------------------------------------------------------------------------
UPDATE fichas_jogador.classe SET nome_classe = 'Apostador'
 WHERE nome_classe = 'Cartomante'
   AND NOT EXISTS (SELECT 1 FROM fichas_jogador.classe WHERE nome_classe = 'Apostador');
UPDATE fichas_jogador.origem SET nome = 'Apostador'
 WHERE nome = 'Cartomante'
   AND NOT EXISTS (SELECT 1 FROM fichas_jogador.origem WHERE nome = 'Apostador');

-- ---------------------------------------------------------------------------
-- 3. Fichas do site
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fichas_jogador.ficha_site (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario    UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  nome          TEXT NOT NULL DEFAULT 'Sem nome' CHECK (char_length(nome) <= 120),
  raca          TEXT CHECK (char_length(raca) <= 120),
  classe        TEXT CHECK (char_length(classe) <= 120),
  dados         JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (pg_column_size(dados) < 200000),
  versao_modelo SMALLINT NOT NULL DEFAULT 1,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ficha_site_usuario ON fichas_jogador.ficha_site (id_usuario, atualizado_em DESC);

DROP TRIGGER IF EXISTS tr_ficha_site_au ON fichas_jogador.ficha_site;
CREATE TRIGGER tr_ficha_site_au BEFORE UPDATE ON fichas_jogador.ficha_site
  FOR EACH ROW EXECUTE PROCEDURE fichas_jogador.set_atualizado_em();

ALTER TABLE fichas_jogador.ficha_site ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON fichas_jogador.ficha_site FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON fichas_jogador.ficha_site TO authenticated;

DROP POLICY IF EXISTS ficha_site_dono ON fichas_jogador.ficha_site;
CREATE POLICY ficha_site_dono ON fichas_jogador.ficha_site
  FOR ALL TO authenticated
  USING (id_usuario = auth.uid())
  WITH CHECK (id_usuario = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Comentários da comunidade
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comentario (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      TEXT NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 2 AND 60),
  topico    TEXT NOT NULL DEFAULT 'Geral'
            CHECK (topico IN ('Geral','Regras','Ficha','Mundo','Sugestão','Mesa / Campanha')),
  mensagem  TEXT NOT NULL CHECK (char_length(btrim(mensagem)) BETWEEN 3 AND 1500),
  autor_id  UUID DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  oculto    BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentario_criado ON public.comentario (criado_em DESC) WHERE NOT oculto;

ALTER TABLE public.comentario ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.comentario FROM anon, authenticated;
GRANT SELECT ON public.comentario TO anon, authenticated;
GRANT INSERT (nome, topico, mensagem) ON public.comentario TO anon, authenticated;

DROP POLICY IF EXISTS comentario_ler ON public.comentario;
CREATE POLICY comentario_ler ON public.comentario
  FOR SELECT TO anon, authenticated USING (NOT oculto);

DROP POLICY IF EXISTS comentario_publicar ON public.comentario;
CREATE POLICY comentario_publicar ON public.comentario
  FOR INSERT TO anon, authenticated
  WITH CHECK (NOT oculto AND (autor_id IS NULL OR autor_id = auth.uid()));

-- Anti-flood simples: no máximo 20 comentários por minuto no site todo.
CREATE OR REPLACE FUNCTION public.comentario_limite()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.comentario WHERE criado_em > NOW() - INTERVAL '1 minute') >= 20 THEN
    RAISE EXCEPTION 'Muitos comentários agora. Tente de novo em instantes.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_comentario_limite ON public.comentario;
CREATE TRIGGER tr_comentario_limite BEFORE INSERT ON public.comentario
  FOR EACH ROW EXECUTE PROCEDURE public.comentario_limite();

COMMIT;

-- Faz a API reconhecer as tabelas novas imediatamente.
NOTIFY pgrst, 'reload schema';
