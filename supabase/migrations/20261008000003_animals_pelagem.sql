-- ============================================================
-- ADOTA PATOS — Migração: adicionar coluna pelagem à tabela animais
-- ============================================================

ALTER TABLE animais ADD COLUMN pelagem TEXT;

COMMENT ON COLUMN animais.pelagem IS 'Tipo de pelagem do animal (ex: Curta, Média, Longa, Sem pelo, Enrolada).';