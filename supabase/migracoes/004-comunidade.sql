-- =============================================================================
-- 004 — Criações da comunidade (conteúdo NÃO oficial)
--
-- Esquema separado "comunidade", longe do conteúdo oficial (aster) e das fichas.
--   comunidade.categoria  → tipos de objeto (carta, local, item…) e os campos
--                           específicos de cada um (lidos pelo formulário do site).
--   comunidade.criacao    → qualquer objeto criado por um usuário. Os campos comuns
--                           são colunas; os específicos da categoria ficam em
--                           `atributos` (JSONB), então uma categoria nova não exige
--                           mudar a tabela: basta inserir uma linha em `categoria`.
--
-- Regras (RLS):
--   • qualquer visitante lê as criações publicadas;
--   • só quem está logado cria, e sempre em nome próprio;
--   • cada autor edita/apaga apenas as suas;
--   • moderação: mude `status` para 'oculto' no Table Editor (o autor não consegue
--     alterar o status pelo site).
--
-- DEPOIS DE RODAR: Settings → API (Data API) → "Exposed schemas" → adicione
-- `comunidade` e salve. Sem isso o site recebe "schema must be one of…".
-- =============================================================================
BEGIN;

CREATE SCHEMA IF NOT EXISTS comunidade;
GRANT USAGE ON SCHEMA comunidade TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Categorias
-- campos: [{ "chave", "rotulo", "tipo": texto|numero|lista|escolha|longo, "opcoes": [...] }]
--   texto/numero/longo → valor simples; escolha → um valor (aceita sugestões);
--   lista → vários valores separados por vírgula (vira array no JSON).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comunidade.categoria (
  slug       TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9-]{2,30}$'),
  nome       TEXT NOT NULL,
  plural     TEXT NOT NULL,
  icone      TEXT,
  ordem      INT  NOT NULL DEFAULT 100,
  descricao  TEXT,
  campos     JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(campos) = 'array'),
  ativa      BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO comunidade.categoria (slug, nome, plural, icone, ordem, descricao, campos) VALUES
('carta', 'Carta', 'Cartas', '🃏', 10, 'Habilidades, magias, golpes, rituais…', '[
  {"chave":"tipo","rotulo":"Tipo","tipo":"escolha","opcoes":["Habilidade","Magia","Golpe","Ritual","Treinamento","Receita","Ritmo","Disparo","Língua","Compania"]},
  {"chave":"modo_de_uso","rotulo":"Modo de uso","tipo":"escolha","opcoes":["Ação","Reação","Passivo","Livre","Descanso","Evolução","Morrendo","Aprender"]},
  {"chave":"custo_em_energia","rotulo":"Custo em Energia","tipo":"texto"},
  {"chave":"alcance","rotulo":"Alcance","tipo":"escolha","opcoes":["Si Mesmo","Corpo a Corpo","Médio","Longo","Em Cena","Movimento","Universal"]},
  {"chave":"cooldown","rotulo":"Cooldown","tipo":"escolha","opcoes":["Uso Livre","Imediato","1 Rodada","2 Rodadas","3 Rodadas","1 Hora","2 Horas","4 horas","8 horas","Uso único"]},
  {"chave":"raridade","rotulo":"Raridade","tipo":"escolha","opcoes":["Comum","Notável","Renomado","Heróico","Lendário","Inigualável"]},
  {"chave":"origem","rotulo":"Origens","tipo":"lista"},
  {"chave":"custo_extra","rotulo":"Custo extra","tipo":"texto"}
]'),
('item', 'Item', 'Itens', '⚔️', 20, 'Armas, proteções, consumíveis, artefatos…', '[
  {"chave":"tipo","rotulo":"Tipo","tipo":"escolha","opcoes":["Arma","Arma de Caça","Proteção","Veste","Consumível","Componente","Ferramenta","Compartimento","Artefato","Instrumento Musical","Imóvel"]},
  {"chave":"raridade","rotulo":"Raridade","tipo":"escolha","opcoes":["Comum","Notável","Renomado","Heróico","Inigualável"]},
  {"chave":"empunhadura","rotulo":"Empunhadura","tipo":"escolha","opcoes":["uma mão","mão e meia","duas mãos","Vestir"]},
  {"chave":"modo_de_uso","rotulo":"Modo de uso","tipo":"escolha","opcoes":["Ação","Reação","Equipado","Em mãos","Guardado"]},
  {"chave":"alcance","rotulo":"Alcance","tipo":"texto"},
  {"chave":"preco_unitario","rotulo":"Preço unitário","tipo":"texto"},
  {"chave":"qtd_por_espaco","rotulo":"Qtd. por espaço","tipo":"numero"},
  {"chave":"efeito","rotulo":"Efeito","tipo":"longo"}
]'),
('local', 'Local', 'Locais', '🗺️', 30, 'Regiões, cidades, edifícios, ruínas…', '[
  {"chave":"abrangencia","rotulo":"Abrangência","tipo":"escolha","opcoes":["Região","País","Cidade","Cidade (Capital)","Edifício"]},
  {"chave":"locais_relacionados","rotulo":"Locais relacionados","tipo":"lista"},
  {"chave":"efeito","rotulo":"Efeito do local","tipo":"longo"},
  {"chave":"inspiracoes","rotulo":"Inspirações","tipo":"texto"}
]'),
('criatura', 'Criatura', 'Criaturas', '🐺', 40, 'Feras, monstros e ameaças.', '[
  {"chave":"tipo","rotulo":"Tipo","tipo":"escolha","opcoes":["Animal","Monstro","Morto-vivo","Espírito","Constructo"]},
  {"chave":"nivel","rotulo":"Nível","tipo":"numero"},
  {"chave":"vida","rotulo":"Vida","tipo":"numero"},
  {"chave":"acoes","rotulo":"Ações","tipo":"numero"},
  {"chave":"reacoes","rotulo":"Reações","tipo":"numero"},
  {"chave":"movimento","rotulo":"Movimento","tipo":"numero"},
  {"chave":"atributos","rotulo":"Atributos (ex.: 5 Corpo, 2 Mente)","tipo":"lista"},
  {"chave":"tipo_de_defesa","rotulo":"Tipo de defesa","tipo":"texto"}
]'),
('personagem', 'Personagem', 'Personagens', '👤', 50, 'NPCs, heróis e figuras do mundo.', '[
  {"chave":"nivel_do_personagem","rotulo":"Nível","tipo":"escolha","opcoes":["Notável","Renomado","Herói","Lenda","Divindade"]},
  {"chave":"raca","rotulo":"Raça","tipo":"texto"},
  {"chave":"classe","rotulo":"Classe","tipo":"texto"},
  {"chave":"locais_relacionados","rotulo":"Locais relacionados","tipo":"lista"},
  {"chave":"organizacoes_relacionadas","rotulo":"Organizações relacionadas","tipo":"lista"}
]'),
('organizacao', 'Organização', 'Organizações', '🏛️', 60, 'Guildas, ordens, cultos, reinos…', '[
  {"chave":"nivel_de_influencia","rotulo":"Nível de influência","tipo":"escolha","opcoes":["Local","Regional","Nacional","Continental"]},
  {"chave":"locais_relacionados","rotulo":"Locais relacionados","tipo":"lista"}
]'),
('raca', 'Raça', 'Raças', '🧬', 70, 'Povos jogáveis.', '[
  {"chave":"atributos_iniciais","rotulo":"Atributos iniciais (ex.: 1 Corpo, 3 Pontos Livres)","tipo":"lista"},
  {"chave":"vida_inicial","rotulo":"Vida inicial","tipo":"numero"},
  {"chave":"energia_inicial","rotulo":"Energia inicial","tipo":"numero"},
  {"chave":"origens_relacionadas","rotulo":"Origens relacionadas","tipo":"lista"},
  {"chave":"habilidade_inata","rotulo":"Habilidade inata","tipo":"longo"}
]'),
('classe', 'Classe', 'Classes', '🎭', 80, 'Caminhos e estilos de jogo.', '[
  {"chave":"atributos_iniciais","rotulo":"Atributos iniciais","tipo":"lista"},
  {"chave":"vida_inicial","rotulo":"Vida inicial","tipo":"numero"},
  {"chave":"energia_inicial","rotulo":"Energia inicial","tipo":"numero"},
  {"chave":"origem_relacionada","rotulo":"Origem relacionada","tipo":"texto"},
  {"chave":"habilidade_caracteristica","rotulo":"Habilidade característica","tipo":"longo"}
]'),
('condicao', 'Condição', 'Condições', '🩸', 90, 'Efeitos que afetam personagens.', '[
  {"chave":"nivel","rotulo":"Nível","tipo":"escolha","opcoes":["Normal","Complexa"]},
  {"chave":"subtipo","rotulo":"Subtipo","tipo":"texto"},
  {"chave":"maximo_de_acumulos","rotulo":"Máximo de acúmulos","tipo":"numero"},
  {"chave":"remocao","rotulo":"Remoção","tipo":"longo"}
]'),
('aventura', 'Aventura', 'Aventuras', '📜', 100, 'Ganchos, missões e one-shots.', '[
  {"chave":"nivel_recomendado","rotulo":"Nível recomendado","tipo":"texto"},
  {"chave":"jogadores","rotulo":"Nº de jogadores","tipo":"texto"},
  {"chave":"duracao","rotulo":"Duração","tipo":"texto"}
]'),
('outro', 'Outro', 'Outros', '✨', 999, 'Qualquer outra criação.', '[]')
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome, plural = EXCLUDED.plural, icone = EXCLUDED.icone, ordem = EXCLUDED.ordem,
  descricao = EXCLUDED.descricao, campos = EXCLUDED.campos;

-- ---------------------------------------------------------------------------
-- Criações
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comunidade.criacao (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria      TEXT NOT NULL REFERENCES comunidade.categoria(slug) ON UPDATE CASCADE,
  nome           TEXT NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 2 AND 120),
  resumo         TEXT CHECK (char_length(resumo) <= 300),
  conteudo       TEXT NOT NULL DEFAULT '' CHECK (char_length(conteudo) <= 20000),
  atributos      JSONB NOT NULL DEFAULT '{}'::JSONB
                 CHECK (jsonb_typeof(atributos) = 'object' AND pg_column_size(atributos) <= 16000),
  tags           TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 12),
  autor_id       UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  autor_nome     TEXT NOT NULL CHECK (char_length(btrim(autor_nome)) BETWEEN 1 AND 60),
  status         TEXT NOT NULL DEFAULT 'publicado' CHECK (status IN ('publicado', 'oculto')),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_criacao_lista ON comunidade.criacao (categoria, criado_em DESC) WHERE status = 'publicado';
CREATE INDEX IF NOT EXISTS idx_criacao_autor ON comunidade.criacao (autor_id);

-- Autor e datas são definidos pelo servidor; limite de 10 criações a cada 10 min por pessoa.
CREATE OR REPLACE FUNCTION comunidade.criacao_antes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = comunidade, public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL THEN NEW.autor_id := auth.uid(); END IF;
    NEW.criado_em := NOW();
    IF (SELECT COUNT(*) FROM comunidade.criacao
        WHERE autor_id = NEW.autor_id AND criado_em > NOW() - INTERVAL '10 minutes') >= 10 THEN
      RAISE EXCEPTION 'Muitas criações em pouco tempo. Tente de novo em alguns minutos.';
    END IF;
  ELSE
    NEW.autor_id := OLD.autor_id;
    NEW.criado_em := OLD.criado_em;
  END IF;
  NEW.atualizado_em := NOW();
  NEW.tags := ARRAY(SELECT DISTINCT left(btrim(t), 30) FROM unnest(NEW.tags) t WHERE btrim(t) <> '');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tr_criacao_antes ON comunidade.criacao;
CREATE TRIGGER tr_criacao_antes BEFORE INSERT OR UPDATE ON comunidade.criacao
  FOR EACH ROW EXECUTE PROCEDURE comunidade.criacao_antes();

-- ---------------------------------------------------------------------------
-- Permissões
-- ---------------------------------------------------------------------------
ALTER TABLE comunidade.categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade.criacao   ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON comunidade.categoria, comunidade.criacao FROM anon, authenticated;
GRANT SELECT ON comunidade.categoria TO anon, authenticated;
GRANT SELECT ON comunidade.criacao   TO anon, authenticated;
-- Sem `status`, `autor_id` nem datas: o autor não modera a si mesmo.
GRANT INSERT (categoria, nome, resumo, conteudo, atributos, tags, autor_nome) ON comunidade.criacao TO authenticated;
GRANT UPDATE (categoria, nome, resumo, conteudo, atributos, tags, autor_nome) ON comunidade.criacao TO authenticated;
GRANT DELETE ON comunidade.criacao TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA comunidade TO service_role;

DROP POLICY IF EXISTS categoria_ler ON comunidade.categoria;
CREATE POLICY categoria_ler ON comunidade.categoria FOR SELECT TO anon, authenticated USING (ativa);

DROP POLICY IF EXISTS criacao_ler ON comunidade.criacao;
CREATE POLICY criacao_ler ON comunidade.criacao FOR SELECT TO anon, authenticated
  USING (status = 'publicado' OR autor_id = auth.uid());

DROP POLICY IF EXISTS criacao_criar ON comunidade.criacao;
CREATE POLICY criacao_criar ON comunidade.criacao FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid() AND status = 'publicado');

DROP POLICY IF EXISTS criacao_editar ON comunidade.criacao;
CREATE POLICY criacao_editar ON comunidade.criacao FOR UPDATE TO authenticated
  USING (autor_id = auth.uid()) WITH CHECK (autor_id = auth.uid());

DROP POLICY IF EXISTS criacao_apagar ON comunidade.criacao;
CREATE POLICY criacao_apagar ON comunidade.criacao FOR DELETE TO authenticated
  USING (autor_id = auth.uid());

COMMIT;

NOTIFY pgrst, 'reload schema';
