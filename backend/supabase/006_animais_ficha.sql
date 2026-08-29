-- ============================================================
-- 🐾 ADOTA PATOS — Migration 006: ficha completa do animal
-- ------------------------------------------------------------
-- O que faz:
--   1. Adiciona "especie" e "raca" à tabela animais
--      (o painel de cadastro do Matheus envia esses campos)
--   2. Ajusta o CHECK de status em adocoes para os valores
--      usados pelo painel: Pendente / Em análise / Aprovada / Recusada
--      (substitui o antigo 'Rejeitada')
-- ------------------------------------------------------------
-- Como aplicar: cole no SQL Editor do projeto no Supabase.
-- ============================================================

-- 1. Ficha: espécie (Cão/Gato/Outro) e raça (livre, opcional)

ALTER TABLE public.animais
    ADD COLUMN IF NOT EXISTS especie TEXT NOT NULL DEFAULT 'Cão'
        CHECK (especie IN ('Cão', 'Gato', 'Outro'));

ALTER TABLE public.animais
    ADD COLUMN IF NOT EXISTS raca TEXT;

-- 2. Status das solicitações de adoção

ALTER TABLE public.adocoes
    DROP CONSTRAINT IF EXISTS adocoes_status_check;

ALTER TABLE public.adocoes
    ADD CONSTRAINT adocoes_status_check
        CHECK (status IN ('Pendente', 'Em análise', 'Aprovada', 'Recusada'));

-- ============================================================
-- Conferir:
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'animais';
--   SELECT conname FROM pg_constraint WHERE conrelid = 'adocoes'::regclass;
-- ============================================================