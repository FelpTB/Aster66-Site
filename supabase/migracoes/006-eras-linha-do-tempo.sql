-- As épocas dos eventos passam a seguir as eras da Linha do Tempo do Notion
-- (Era Primitiva, Era Ediniana, Período Pós-Queda, Era Moderna, Era Contemporânea).
-- Atualiza as opções do campo "Época" no formulário de criações da comunidade.
BEGIN;

UPDATE comunidade.categoria
SET campos = (
  SELECT jsonb_agg(
    CASE WHEN c->>'chave' = 'epoca'
      THEN jsonb_set(c, '{opcoes}', '["Era Primitiva","Era Ediniana","Período Pós-Queda","Era Moderna","Era Contemporânea"]'::jsonb)
      ELSE c END
    ORDER BY ord)
  FROM jsonb_array_elements(campos) WITH ORDINALITY AS t(c, ord)
)
WHERE slug = 'evento';

COMMIT;
