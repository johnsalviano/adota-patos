-- ============================================================
-- ADOTA PATOS — Migração 016: Remover constraint CHECK de pelagem
-- ============================================================
-- Permite pelagem como texto livre, removendo a constraint que
-- limitava aos valores predefinidos (Curta, Média, Longa, Sem pelo, Enrolada).

ALTER TABLE animais DROP CONSTRAINT IF EXISTS animais_pelagem_check;

COMMENT ON COLUMN animais.pelagem IS 'Descrição livre da pelagem do animal (ex: Caramelo, Preta com manchas brancas, Pelo curto marrom escuro, etc).';