-- 007: Período dos locais (Notion › Cenários › Período).
-- Eras em que o local aparece no mapa; vazio = todas. Rodar antes do próximo `npm run sync:notion`.
ALTER TABLE aster.cenarios ADD COLUMN IF NOT EXISTS periodo TEXT[] NOT NULL DEFAULT '{}';
