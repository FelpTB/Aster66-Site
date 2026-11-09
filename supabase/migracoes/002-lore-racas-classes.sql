-- Aster66 — coluna `lore` em racas e classes
-- Texto das páginas de cada raça/classe em Notion › Sumário › Raças e Classes
-- (seção Lore + subpáginas), preenchido por `npm run sync:notion`.
-- Rode uma vez no SQL Editor. Idempotente.
ALTER TABLE aster.racas   ADD COLUMN IF NOT EXISTS lore TEXT NOT NULL DEFAULT '';
ALTER TABLE aster.classes ADD COLUMN IF NOT EXISTS lore TEXT NOT NULL DEFAULT '';
NOTIFY pgrst, 'reload schema';
